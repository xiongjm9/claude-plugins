# dsh-claude-parity

DeepSeek Harness 桌面 profile 上补的四件 Claude Code 常用能力。源码只在本目录，桌面 profile 用 pnpm link 挂上。

## 做什么

- **密钥路径拒绝读取。** 对齐本机 Claude Code 的 Read 拒绝规则：`.env`、`.env.*`、`secrets/**`、`config/credentials.json`。作用在 `read`、`read_image`、`grep`、`glob`，以及 `bash` / `pwsh` 命令文本。`danger-full-access` 也会拦。不拦 `write` / `edit`。
- **文件回退。** 每次 `write` 或 `edit` 之前把原文件抄到 `~/.dsh/file-rewind/<会话>/`。`/rewind` 或工具 `rewind_files` 按步恢复；当时不存在的文件会被删掉。超过 32MB 的文件只记录、不回退。Shell 直接改的文件不在范围内。
- **跨会话记忆。** 每轮注入 `~/.dsh/memory/MEMORY.md` 和已有的 `~/.claude/memory/MEMORY.md` 索引。`memory_write` 写到 `~/.dsh/memory`。`memory_read` 只能读这两个目录和当前工作区的 `.dsh/memory.md`。
- **挂到本机 Chrome。** `chrome_cdp` 用本机 `agent-browser --cdp 9222` 操作已经开着调试端口的 Chrome。端口没开时只说明原因，不另开一套浏览器配置。`dsh-browser-plus` 的独立窗口还在。

OpenViking 没有在这台机器上配置服务，所以记忆用本地 Markdown，不启用 `@openviking/dsh-memory-plugin`。

## 挂载

`C:\Users\Administrator\.dsh\profiles\desktop\package.json`：

```json
"dsh-claude-parity": "link:D:/claude-plugins/dsh-claude-parity"
```

并放进 `dsh.profile.bundles`。改完后用 DSH 自带的 pnpm（`~/.dsh/dsh-runtimes/*/dependencies/pnpm`，v11）在 profile 目录执行 `pnpm install`。重启 DeepSeek Harness 后生效。

## 测试

```powershell
node --test test/parity.test.mjs
```
