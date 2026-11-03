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
                    text = strip_reminders(content_text(rec.get("content")))
                    if text:
                        prompts.append((mtime, text))
        except OSError:
            continue
        if prompts:
            out.append((path, prompts))
    return out


def rework_count(prompts):
    return sum(1 for _, text in prompts[1:] if any(k in text for k in REWORK))


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
            hits = [text for _, text in prompts[1:] if any(k in text for k in REWORK)]
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
