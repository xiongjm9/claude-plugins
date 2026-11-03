# cdp-launch

给 `local-interactive-test` 这类 CDP 测试起一个独立的浏览器实例：固定调试端口、独立用户目录，不碰你日常用的浏览器配置。

## 用法

```powershell
# 默认 Chrome，端口 9222，打开 about:blank
powershell -ExecutionPolicy Bypass -File cdp-launch.ps1

# 指定页面和端口
powershell -ExecutionPolicy Bypass -File cdp-launch.ps1 -Port 9222 -Url "http://localhost:7777"

# 用 Edge / 无头模式（调试脚本用）
powershell -ExecutionPolicy Bypass -File cdp-launch.ps1 -Browser edge -Headless -Port 9333

# 只打印将执行的命令
powershell -ExecutionPolicy Bypass -File cdp-launch.ps1 -DryRun
```

启动后脚本会等待 `http://127.0.0.1:<port>/json/version` 可用，并输出 `webSocketDebuggerUrl`。浏览器不会随脚本退出而关闭。

## 参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `-Port` | `9222` | 远程调试端口 |
| `-Url` | `about:blank` | 启动后打开的页面 |
| `-ProfileDir` | `%LOCALAPPDATA%\cdp-launch\profile-<port>` | 独立用户目录；不同端口互不影响 |
| `-Browser` | `auto` | `auto` / `chrome` / `edge` / `brave` |
| `-Headless` | 关 | 无头模式，适合自动化 |
| `-DryRun` | 关 | 只打印命令行 |

## 说明

- 如果端口上已经有可用的 CDP 实例，脚本直接输出它的 `webSocketDebuggerUrl`，不再启动第二个。
- 查找顺序：`CDP_BROWSER` 环境变量 → 常见安装路径。找不到时报错并列出找过的路径。
- 独立用户目录第一次启动会有欢迎页，脚本加了 `--no-first-run --no-default-browser-check` 跳过。
- 调试端口只监听本机；不要把它暴露到局域网。
