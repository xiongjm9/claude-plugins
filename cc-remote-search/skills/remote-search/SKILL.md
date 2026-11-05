---
name: remote-search
description: 在 Claude Code 使用第三方模型、自定义 ANTHROPIC_BASE_URL 或网关、Bedrock/Vertex 时，原生 WebSearch 或 WebFetch 不存在、报错或返回空结果，改用本插件的 web_search 和 web_fetch 做只读联网。触发词：网页搜索、搜一下、打开这个链接、WebSearch 不可用、第三方模型不能搜索、网页乱码、页面太长读不完。
---

# 第三方模型的网页搜索

原生 `WebSearch` 和 `WebFetch` 能不能用取决于网关。默认先用原生工具；工具不存在、报错或返回空结果时，改用本插件 MCP `remote-search` 的工具。`CC_REMOTE_SEARCH=on` 时原生工具会被拒绝，直接用下面两个。

- `mcp__plugin_cc-remote-search_remote-search__web_search`：公开网页搜索。参数 `query`，可选 `max_results`（1–8，默认 5）。
- `mcp__plugin_cc-remote-search_remote-search__web_fetch`：抓取一个 http(s) 页面并返回纯文本。参数 `url`，可选 `max_chars`（默认 12000）、`start_index`（默认 0）。

调用时工具名要写全，`mcp__remote-search__web_fetch` 这类简写不存在。下文简称 `web_search` / `web_fetch`。

用法：

1. 先搜索，再抓取需要细读的链接。
2. `web_fetch` 结尾写着 `[未完 … 继续读用 start_index=N]` 时，需要后文就用同一个 `url` 和 `start_index=N` 再调一次。只需要开头时不必读完。
3. 返回头里有识别出的编码。GBK 等中文编码会自动识别；如果仍是乱码，说明页面声明的编码有误，告诉用户而不要猜内容。

不要用 Bash 去 curl 搜索引擎代替这两个工具。本机、内网、链路本地地址和云 metadata 地址会被拒绝。
