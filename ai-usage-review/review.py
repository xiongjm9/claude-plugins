#!/usr/bin/env python3
"""ai-usage-review: 汇总本机 AI 客户端日志，统计会话、提示和明确返工。"""
import argparse
import datetime as dt
import glob
import json
import os
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REWORK = [
    "还是不行", "还是不对", "没生效", "又报错", "问题还在",
    "不对", "错了", "改错", "瞎改", "乱改", "乱加", "幻觉", "不是我要的",
    "漏了", "遗漏", "少了", "没改完", "你没有",
    "还原", "回滚", "撤销", "改回", "不要改", "别动",
]
DANGER = [
    "git reset --hard", "git clean -fd", "git clean -f", "git checkout .",
    "git checkout --", "git restore ", "push --force", "push -f",
    "branch -D", "branch -d", "push origin --delete", "update-ref -d",
]
SKIP_CLAUDE_PREFIX = ("<command-name>", "<local-command", "This session is being continued")
SKIP_MARKERS = ("local-command-stdout", "<system-reminder>", "tool_result", "tool_use_id")
CONTINUED = "This session is being continued"

# Phrases that contain a REWORK keyword but are not a correction of the AI.
# They are blanked out before matching, so other keywords in the same prompt still count.
_STOP = r"[^，。,.!?！？；;\n]"
NOT_REWORK = [re.compile(p) for p in (
    r"不对(应|劲|称)",                              # 不对应 / 不对劲
    r"对不对",                                       # a question
    rf"我{_STOP}{{0,6}}(说|弄|写|搞|打)错了",          # the user correcting themselves
    rf"(如果|就|会){_STOP}{{0,8}}报错了",              # describing error handling
    rf"(不要|无|没有|有没有|是否|防|避免){_STOP}{{0,12}}遗漏",  # instructions and questions
    r"还有遗漏[吗嘛么]?",
    r"少了约", r"少了\d", r"如果少了",
    rf"我{_STOP}{{0,12}}(撤销|还原|回滚)",             # the user did it themselves
    r"原封不动地?还原",                              # "restore the legacy text verbatim"
    rf"你没有{_STOP}{{0,10}}的话",                    # conditional, not a complaint
)]
PASTED = re.compile(r"<pasted_content\b[^>]*>.*?</pasted_content>", re.S)


def local_range(since, until, tz_hours):
    tz = dt.timezone(dt.timedelta(hours=tz_hours))
    start_local = dt.datetime.combine(since, dt.time.min, tzinfo=tz)
    end_local = dt.datetime.combine(until + dt.timedelta(days=1), dt.time.min, tzinfo=tz)
    return start_local.astimezone(dt.timezone.utc), end_local.astimezone(dt.timezone.utc), tz


def parse_ts(value):
    if not value:
        return None
    try:
        return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def strip_reminders(text):
    return re.sub(r"<system-reminder>.*?</system-reminder>", "", text, flags=re.S).strip()


def content_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text")
    return ""


def claude_prompts(path, start, end):
    out = []
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                if rec.get("type") != "user":
                    continue
                # isMeta: injected skill bodies; isCompactSummary: the post-compaction summary.
                if rec.get("isMeta") or rec.get("isCompactSummary") or rec.get("isSidechain"):
                    continue
                ts = parse_ts(rec.get("timestamp"))
                if not ts or not (start <= ts < end):
                    continue
                text = strip_reminders(content_text((rec.get("message") or {}).get("content")))
                if not text or text.startswith(SKIP_CLAUDE_PREFIX):
                    continue
                if any(m in text[:200] for m in SKIP_MARKERS):
                    continue
                out.append((ts, text))
    except OSError:
        pass
    return out


def ag_requests(path, start, end):
    out = []
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                if rec.get("type") != "USER_INPUT":
                    continue
                ts = parse_ts(rec.get("created_at"))
                if not ts or not (start <= ts < end):
                    continue
                raw = rec.get("content") or ""
                m = re.search(r"<USER_REQUEST>(.*?)</USER_REQUEST>", raw, re.S)
                text = (m.group(1) if m else raw).strip()
                if text:
                    out.append((ts, text))
    except OSError:
        pass
    return out


def ag_danger(path, start, end):
    hits = []
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                ts = parse_ts(rec.get("created_at"))
                if not ts or not (start <= ts < end):
                    continue
                for tc in rec.get("tool_calls") or []:
                    args = tc.get("args") or {}
                    cmd = args.get("CommandLine") or args.get("command") or ""
                    low = cmd.lower()
                    for d in DANGER:
                        if d in low:
                            hits.append((ts, d, cmd.replace("\n", " ")))
                            break
    except OSError:
        pass
    return hits


def session_label(path, tool):
    p = Path(path)
    if tool == "Antigravity":
        parts = p.parts
        if "brain" in parts:
            i = parts.index("brain")
            if i + 1 < len(parts):
                return parts[i + 1][:8]
    if tool == "Claude Code":
        return p.stem[:8]
    return p.parent.name[:8]


def grok_prompts(root, start_local, end_local, tz):
    out = []
    for path in glob.glob(str(Path(root) / "*" / "*" / "chat_history.jsonl")):
        try:
            mtime = dt.datetime.fromtimestamp(os.path.getmtime(path), tz)
        except OSError:
            continue
        if not (start_local <= mtime < end_local):
            continue
        prompts = []
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                for line in f:
                    try:
                        rec = json.loads(line)
                    except Exception:
                        continue
                    if rec.get("type") != "user":
                        continue
                    # synthetic_reason marks messages Grok wrote itself, e.g. compaction summaries.
                    if rec.get("synthetic_reason"):
                        continue
                    text = strip_reminders(content_text(rec.get("content")))
                    # Only the <user_query> part is the user's; skill bodies and context follow it.
                    m = re.search(r"<user_query>(.*?)</user_query>", text, re.S)
                    if m:
                        text = m.group(1).strip()
                    if text and not text.startswith(CONTINUED):
                        prompts.append((mtime, text))
        except OSError:
            continue
        if prompts:
            out.append((path, prompts))
    return out


def is_rework(text):
    # A message that opens with a Markdown heading is a pasted task brief; its "不要改X" lines are constraints.
    if re.match(r"\s*#{1,6}\s", text):
        return False
    text = PASTED.sub(" ", text)  # pasted documents are not the user's own words
    for pattern in NOT_REWORK:
        text = pattern.sub(" ", text)
    return any(k in text for k in REWORK)


def rework_count(prompts):
    return sum(1 for _, text in prompts[1:] if is_rework(text))


def main():
    today = dt.date.today()
    ap = argparse.ArgumentParser(description="本机 AI 使用日志检查")
    ap.add_argument("--since", default=today.replace(day=1).isoformat())
    ap.add_argument("--until", default=today.isoformat())
    ap.add_argument("--tz", type=int, default=8, help="本地时区偏移，默认 +8")
    ap.add_argument("--out", help="输出 Markdown 文件；不传则打印到终端")
    ap.add_argument("--claude-root", default=str(Path.home() / ".claude" / "projects"))
    ap.add_argument("--ag-root", default="D:/AntigravityData/brain")
    ap.add_argument("--grok-root", default=str(Path.home() / ".grok" / "sessions"))
    args = ap.parse_args()

    since = dt.date.fromisoformat(args.since)
    until = dt.date.fromisoformat(args.until)
    start, end, tz = local_range(since, until, args.tz)
    start_local = start.astimezone(tz)
    end_local = end.astimezone(tz)
    cutoff = start - dt.timedelta(days=1)
    horizon = end + dt.timedelta(days=1)

    tools = []

    cc_sessions = []
    for path in glob.glob(str(Path(args.claude_root) / "*" / "*.jsonl")):
        try:
            if dt.datetime.fromtimestamp(os.path.getmtime(path), dt.timezone.utc) < cutoff:
                continue
        except OSError:
            continue
        prompts = claude_prompts(path, start, end)
        if prompts:
            cc_sessions.append((path, prompts))
    tools.append(("Claude Code", cc_sessions, False))

    ag_sessions = []
    danger = []
    for path in glob.glob(str(Path(args.ag_root) / "*" / ".system_generated" / "logs" / "transcript.jsonl")):
        try:
            if dt.datetime.fromtimestamp(os.path.getmtime(path), dt.timezone.utc) < cutoff:
                continue
        except OSError:
            continue
        prompts = ag_requests(path, start, end)
        if prompts:
            ag_sessions.append((path, prompts))
        danger.extend(ag_danger(path, start, end))
    tools.append(("Antigravity", ag_sessions, False))

    grok_sessions = grok_prompts(args.grok_root, start_local, end_local, tz)
    tools.append(("Grok CLI", grok_sessions, True))

    lines = []
    lines.append(f"# AI 使用检查 {since} ~ {until}")
    lines.append("")
    lines.append(f"生成时间：{dt.datetime.now(tz):%Y-%m-%d %H:%M}（UTC{args.tz:+d}）")
    lines.append("")
    lines.append("| 工具 | 会话 | 提示 | 有明确返工的会话 |")
    lines.append("| --- | ---: | ---: | ---: |")
    total_s = total_p = total_r = 0
    for name, sessions, approximate in tools:
        prompts = sum(len(p) for _, p in sessions)
        rework = sum(1 for _, p in sessions if rework_count(p))
        total_s += len(sessions)
        total_p += prompts
        total_r += rework
        mark = "≈" if approximate else ""
        lines.append(f"| {name} | {mark}{len(sessions)} | {mark}{prompts} | {mark}{rework} |")
    lines.append(f"| **合计** | **{total_s}** | **{total_p}** | **{total_r}** |")
    lines.append("")

    lines.append("## 返工样本")
    lines.append("")
    any_sample = False
    for name, sessions, _ in tools:
        samples = []
        for path, prompts in sessions:
            hits = [text for _, text in prompts[1:] if is_rework(text)]
            if hits:
                samples.append((session_label(path, name), hits[0].replace("\n", " ")[:160]))
        if samples:
            any_sample = True
            lines.append(f"### {name}")
            lines.append("")
            for sid, text in samples[:8]:
                lines.append(f"- `{sid}` {text}")
            lines.append("")
    if not any_sample:
        lines.append("统计区间内没有匹配到返工关键词。")
        lines.append("")

    lines.append("## Antigravity 危险 git 字符串")
    lines.append("")
    if danger:
        lines.append(f"共 {len(danger)} 条，以下按时间列前 20 条：")
        lines.append("")
        for ts, d, ctx in sorted(danger)[:20]:
            lines.append(f"- {ts.astimezone(tz):%Y-%m-%d %H:%M} `{d}` — `{ctx.strip()[:150]}`")
    else:
        lines.append("统计区间内没有匹配到危险 git 字符串。")
    lines.append("")

    lines.append("## 口径")
    lines.append("")
    lines.append("- 只统计用户本人发出的消息；排除斜杠命令、系统提醒、子代理和工具结果。")
    lines.append("- 返工按后续提示里的明确纠错说法计数，每个会话的第一条不计。换新会话重做统计不到，所以是下限。")
    lines.append("- 不算返工：用户自己纠正口误（我说错了）、描述报错处理（如果报错了）、要求或询问（不要遗漏、有没有遗漏）、用户自己撤销、以 Markdown 标题开头的任务说明，以及粘贴的文档。")
    lines.append("- Claude Code 和 Antigravity 用日志内时间戳；Grok CLI 的 `chat_history.jsonl` 没有时间戳，按文件修改时间归入当天，标 `≈`。")
    lines.append("- 危险 git 字符串只扫描 Antigravity transcript 的 tool_calls，不代表每一条都被执行。")
    lines.append("")

    text = "\n".join(lines)
    if args.out:
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"written: {out}")
    else:
        print(text)


if __name__ == "__main__":
    main()
