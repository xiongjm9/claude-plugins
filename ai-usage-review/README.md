# ai-usage-review

汇总本机 AI 客户端日志，输出某个时间段的会话数、提示数、明确返工会话数，以及 Antigravity 里出现的危险 git 命令。

## 用法

```powershell
# 默认统计本月 1 号到今天
python review.py

# 指定区间，写到文件
python review.py --since 2026-11-01 --until 2026-11-03 --out D:\ai-usage-reviews\2026-11-check.md

# 只打印到终端
python review.py --since 2026-10-01 --until 2026-10-31
```

## 数据源

| 工具 | 路径 | 时间来源 |
| --- | --- | --- |
| Claude Code | `~/.claude/projects/*/*.jsonl` | 记录里的 `timestamp` |
| Antigravity | `D:\AntigravityData\brain\*\...\transcript.jsonl` | `created_at` |
| Grok CLI | `~/.grok/sessions/*/*/chat_history.jsonl` | 文件修改时间（标 `≈`） |

默认按本地时区 UTC+8 划分日期，可用 `--tz` 改。路径可用 `--claude-root`、`--ag-root`、`--grok-root` 覆盖。

## 口径

- 只统计用户本人发的消息，排除斜杠命令、系统提醒、子代理消息和工具结果。
- 返工按后续提示里的明确纠错说法计数：还是不行、不对、改错、漏了、还原等。每个会话的第一条不计；换新会话重做统计不到，所以是下限。
- 关键词出现在这些说法里不算返工：用户纠正自己的口误（我说错了）、描述报错处理（如果报错了）、要求或询问（不要遗漏、有没有遗漏）、用户自己撤销（我已把…撤销）、不对应 / 不对劲，以及以 Markdown 标题开头的任务说明和 `<pasted_content>` 粘贴内容。同一条提示里其它纠错说法照常计数。
- 不算用户提示：Claude Code 的 `isMeta`（注入的技能正文）和 `isCompactSummary`（压缩后的续接摘要）；Grok 带 `synthetic_reason` 的消息（压缩摘要），以及 `<user_query>` 之外附带的技能正文。
- 危险 git 字符串只扫描 Antigravity transcript 的 `tool_calls[].args.CommandLine`，不会把 `git status` 输出里的提示文字误算进去；命中不代表命令一定被执行。
- Grok CLI 日志没有时间戳，只能按会话文件修改时间归日，数字不精确。

## 退出码

- `0`：正常输出。
- 非 `0`：日志目录不存在或参数错误。

## 参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `--since` | 本月 1 号 | 起始日期，含 |
| `--until` | 今天 | 结束日期，含 |
| `--tz` | `8` | 本地时区偏移 |
| `--out` | 无 | 输出 Markdown 文件；不传则打印 |
| `--claude-root` | `~/.claude/projects` | Claude Code 日志根目录 |
| `--ag-root` | `D:/AntigravityData/brain` | Antigravity 日志根目录 |
| `--grok-root` | `~/.grok/sessions` | Grok CLI 会话根目录 |
