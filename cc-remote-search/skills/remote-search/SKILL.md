---
name: remote-search
description: 在 Claude Code 使用第三方模型、自定义 ANTHROPIC_BASE_URL 或网关、原生 WebSearch 与 WebFetch 不可用时，改用本插件的 web_search 和 web_fetch 做只读联网。触发词：网页搜索、搜一下、打开这个链接、WebSearch 不可用、第三方模型不能搜索。
---

# 第三方模型的网页搜索

原生 `WebSearch` 和 `WebFetch` 由 Anthropic 在自己的接口上执行。当前会话的 `ANTHROPIC_BASE_URL` 不是 Anthropic 官方地址时，这两项会被关掉或调用后报错。

改用本插件 MCP `remote-search` 的工具：

- `web_search`：公开网页搜索。参数 `query`，可选 `max_results`（1–8，默认 5）。
- `web_fetch`：抓取一个 http(s) 页面并返回纯文本。参数 `url`，可选 `max_chars`（默认 12000）。

先搜索，再抓取需要细读的链接。不要用 Bash 去 curl 搜索引擎代替这两个工具。本机、内网、链路本地地址和云 metadata 地址会被拒绝。

官方 `api.anthropic.com` 会话仍使用原生 `WebSearch` / `WebFetch`。
