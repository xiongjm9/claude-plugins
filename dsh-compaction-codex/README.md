# dsh-compaction-codex

> **本目录是该插件的唯一源码副本。** 原先放在业务仓库 `D:\code\ms-client\.dsh-plugins\dsh-compaction-codex`（未被 git 跟踪），2026-11-01 迁到本仓库，业务仓库已清理干净。
>
> **它不是 Claude Code 插件。** 依赖 DeepSeek Harness 的 cordis 运行时与 `@deepseek-ai/dsh-*` 服务（peerDependencies），在 Claude Code 里无法直接运行；此处作为源码归档与算法参考。Claude Code 自带 `/compact`，不需要本插件才能压缩。
>
> DSH 侧的挂载方式（pnpm link，唯一副本，无第二份拷贝）：
>
> ```
> C:\Users\Administrator\.dsh\profiles\desktop\node_modules\dsh-compaction-codex
>   → D:\claude-plugins\dsh-compaction-codex
> ```
>
> 对应 `C:\Users\Administrator\.dsh\profiles\desktop\package.json` 中：
>
> ```json
> "dsh-compaction-codex": "link:D:/claude-plugins/dsh-compaction-codex"
> ```
>
> 并在同文件 `dsh.profile.bundles` 数组里保留 `dsh-compaction-codex`。改完这两个文件后用 **DSH 自带的 pnpm**（`~/.dsh/dsh-runtimes/*/dependencies/pnpm`，v11.x）执行 `pnpm install` 重建链接——全局 pnpm 是 v12，布局判定不同，会误报 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` 并要求清空 node_modules。

A DeepSeek Harness compaction backend that follows OpenAI Codex's local compaction
(`codex-rs/core/src/compact.rs`). It implements the `ctx.compaction` service from
`@deepseek-ai/dsh-compaction` and replaces `@deepseek-ai/dsh-compaction-basic` in the
four shipped Web presets (`standard`, `ptc`, `minimal`, `cordis`).

## What it does

When compaction runs (automatically near the context limit, after a provider
context-overflow error, or on `/compact`):

1. It replays the whole visible history (system prompt, then everything up to the
   last balanced tool boundary) to the conversation model and appends Codex's
   checkpoint prompt as the last user message. The request is a prefix of the
   conversation, so the provider's prompt cache is reused.
2. If that request is too large, it drops the oldest history units (a tool call
   and its result are one unit) and retries, as Codex does.
3. It replaces the history with one checkpoint message:
   - your most recent messages, verbatim, newest first within
     `userMessageMaxTokens` (20,000 by default); the message that crosses the
     budget is cut in the middle and older ones are dropped;
   - the summary, behind Codex's prefix "Another language model started to solve
     this problem and produced a summary…".

Assistant messages, tool calls and tool outputs are not kept. A later compaction
reads the preserved user messages back out of the checkpoint, so your requests and
corrections survive any number of compactions.

Only messages you typed count as user messages. Harness-injected context (runtime
context, skill catalog, time, goal rounds, reminders) is summarized, not kept; its
owners re-publish it once the old copy leaves the history, which plays the role of
Codex re-injecting its environment context.

## Configuration

Set these on the `compaction-codex` row inside a preset's `compaction` group.

| Field | Default | Meaning |
|---|---|---|
| `auto` | `true` | Compact automatically and recover from context-overflow errors. |
| `thresholdRatio` | `0.8` | Auto-compact at this fraction of the context window. |
| `autoCompactTokenLimit` | `0` | Absolute trigger in tokens (Codex `model_auto_compact_token_limit`); `0` uses `thresholdRatio`. |
| `maxTokens` | `32768` | Output cap for the summary request. The trigger is also capped so the summary request fits. |
| `userMessageMaxTokens` | `20000` | Budget for verbatim user messages (Codex `COMPACT_USER_MESSAGE_MAX_TOKENS`). |
| `summarizationProvider` / `summarizationModel` | `''` | Route the summary to another model; empty uses the conversation route (keeps the cache warm). |
| `prompt` | `''` | Replacement summarization prompt (Codex `compact_prompt`); empty uses the Codex prompt. |
| `maxOverflowRetries` | `1` | Recoveries per turn after a context-overflow error. |
| `summaryRetries` | `3` | Retries for a summary request that fails with a transient provider error. |

## Differences from Codex

- DSH replaces a compacted span with exactly one message, so the preserved user
  messages are `<user_message>` blocks inside the checkpoint instead of separate
  history items.
- The summary request keeps the conversation's tool declarations (providers reject
  tool history without them), so the prompt adds one line: reply with text only and
  do not call a tool.
- Codex's server-side compaction for OpenAI models (encrypted compaction items) has
  no equivalent here.
- Token counts are estimates: the DSH token meter for history, and a CJK-aware
  estimate (one token per CJK character, about four characters per token otherwise)
  for the user-message budget.

## Tests

`test/smoke.mjs` runs the engine against a fake Session and a scripted model. Run it
with the Desktop executable as Node, so `@deepseek-ai/*` resolve to DSH's own copies:

```powershell
cd test
$env:ELECTRON_RUN_AS_NODE = '1'
& 'D:\dsn\DeepSeek Harness.exe' --import ./register.mjs smoke.mjs
```

## Maintenance

`cordis.patch.yml` restates the four presets from `@deepseek-ai/dsh-web-app`
0.2.1-rc.5 verbatim except for the compaction row (and, in `cordis`, a skill-directory
expression that also works from outside the DSH install). When DSH ships new preset
contents, copy them again and keep only that change. Removing the bundle restores the
shipped presets. Sessions keep the preset revision they started with, so the new
backend applies to sessions created after installation.

Parts of the region transaction mirror `@deepseek-ai/dsh-compaction-basic` (MIT).
The prompts are from openai/codex (Apache-2.0).
