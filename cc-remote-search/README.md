# cc-remote-search

Claude Code 不是直连 Anthropic 官方接口时（自定义 `ANTHROPIC_BASE_URL`、各种第三方模型网关、Bedrock / Vertex / Foundry），原生 `WebSearch` / `WebFetch` 能不能用取决于网关：有的网关会执行，有的不执行。这个插件在本机补一套只读搜索和抓取，原生工具不可用时用它。

## 能力

- MCP `remote-search`：`web_search`、`web_fetch`
- 搜索顺序：Bing RSS，失败再试 DuckDuckGo HTML。走当前环境的 `HTTP(S)_PROXY`
- `web_fetch` 按 BOM、`Content-Type`、`<meta charset>` 识别编码；没声明又不是合法 UTF-8 时按 GB18030 解码，老的 GBK 中文站不会乱码
- `web_fetch` 长页面分段读：结尾给出剩余字符数和下一段的 `start_index`。原始页面最多读 2MB
- 不抓本机、内网、`.local` 和云 metadata 地址，包括 `[::ffff:7f00:1]` 这类 IPv6 写法

## 模式

用环境变量 `CC_REMOTE_SEARCH` 切换，可写在 `~/.claude/settings.json` 的 `env` 里：

| 值 | 行为 |
| --- | --- |
| `auto`（默认） | 直连 Anthropic 官方接口时什么都不做。其它情况在会话开始时提示模型：先用原生工具，不存在、报错或返回空结果时改用 `web_search` / `web_fetch`。不拦原生工具 |
| `on` | 拒绝原生 `WebSearch` / `WebFetch`，只用本插件。适合原生工具调用后会卡住或返回错误内容的网关 |
| `off` | 不提示也不拦截，只保留 MCP 工具 |

`auto` 不再按地址直接拒绝原生工具。2026-11-05 在本机正在用的第三方网关上实测，原生 `WebSearch` 和 `WebFetch` 都能返回结果，之前一律拒绝反而把能用的工具挡掉了。

## 安装

在 `D:\claude-plugins` 已作为本地市场 `local-claude-plugins` 时：

```powershell
claude plugin marketplace add D:\claude-plugins
claude plugin install cc-remote-search@local-claude-plugins
claude plugin validate D:\claude-plugins\cc-remote-search
```

更新源码后：

```powershell
claude plugin marketplace update local-claude-plugins
claude plugin update cc-remote-search@local-claude-plugins
```

重启 Claude Code 后生效。`/mcp` 里应能看到 `remote-search`。

## 为什么不用现成上游

[Djarvur/cc-websearch](https://github.com/Djarvur/cc-websearch) 1.2.5 的搜索脚本在本机代理下能返回结果，但随仓库发布的 `webfetch.cjs` 在 Node 22 上会崩：jsdom 找不到样式表，补上之后 `css-tree` 的 `createRequire` 又收到 `undefined`。抓取不可用。

[JcDizzy/CC-Web-MCP](https://github.com/JcDizzy/CC-Web-MCP) 要 `uv`，最后一次提交停在 2026-05，本机没有 `uv`。所以继续用这个插件。搜索先走 Bing RSS，失败再试 DuckDuckGo。

## 测试

```powershell
node --test D:\claude-plugins\cc-remote-search\test\search.test.mjs
```
