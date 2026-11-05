# cc-remote-search

Claude Code 走第三方模型或自定义 `ANTHROPIC_BASE_URL` 时，原生 `WebSearch` / `WebFetch` 是 Anthropic 服务端工具，网关不执行，客户端会关掉。这个插件在本机补上只读搜索和抓取。

官方 `api.anthropic.com` 仍走原生工具，插件不拦截。

## 能力

- MCP `remote-search`：`web_search`、`web_fetch`
- 搜索顺序：Bing RSS，失败再试 DuckDuckGo HTML。走当前环境的 `HTTP(S)_PROXY`
- 会话开始时告诉模型改用这两个工具
- 第三方地址上拒绝原生 `WebSearch` / `WebFetch`，并提示改用 MCP
- 不抓本机、内网、`.local` 和云 metadata 地址

## 安装

在 `D:\claude-plugins` 已作为本地市场 `local-claude-plugins` 时：

```powershell
claude plugin marketplace add D:\claude-plugins
claude plugin install cc-remote-search@local-claude-plugins
claude plugin validate D:\claude-plugins\cc-remote-search
```

重启 Claude Code 后生效。`/mcp` 里应能看到 `remote-search`。

## 为什么不用现成上游

[Djarvur/cc-websearch](https://github.com/Djarvur/cc-websearch) 1.2.5 的搜索脚本在本机代理下能返回结果，但随仓库发布的 `webfetch.cjs` 在 Node 22 上会崩：jsdom 找不到样式表，补上之后 `css-tree` 的 `createRequire` 又收到 `undefined`。抓取不可用。

[JcDizzy/CC-Web-MCP](https://github.com/JcDizzy/CC-Web-MCP) 要 `uv`，最后一次提交停在 2026-05，本机没有 `uv`。所以继续用这个插件。搜索先走 Bing RSS，失败再试 DuckDuckGo。

## 测试

```powershell
node --test D:\claude-plugins\cc-remote-search\test\search.test.mjs
```
