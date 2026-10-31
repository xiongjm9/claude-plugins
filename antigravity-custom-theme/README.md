# Antigravity Custom Theme

四套舒服浅色：暖米（默认）/ 纸白 / 云灰 / 青瓷，另保留官方原版。无深色。

## 安装

```
node install_permanent.js
```

执行一次即可，应用开着也能装。在仓库目录（如 `D:\claude-plugins\antigravity-custom-theme`）执行时，脚本先把运行文件同步到 `%APPDATA%\Antigravity\custom-theme` 再安装；改了仓库里的主题后重跑一次即可生效。它会：

1. 应用关闭时给 `app.asar` 打钩子（运行中则留给守护进程）。
2. 在「启动」文件夹写入 `antigravity-custom-theme-guardian.vbs`，登录后静默运行 `guardian.js`。

Antigravity 每次更新都会整体替换 `app.asar`，钩子随之丢失。守护进程负责恢复：

- 应用运行中：通过它自带的调试端口（`DevToolsActivePort`）给未加载主题的窗口补注入。
- 应用关闭且 `app.asar` 30 秒内没被改动：钩子丢了就重新打补丁，原件备份为 `app.asar.orig`。

运行时的主题文件在 `%APPDATA%\Antigravity\custom-theme`，更新不会动它。日志见该目录下的 `guardian.log`。

## 其它命令

- `node inject_live.js`：改完 `current.css` / `current.js` 后不重启直接刷入。
- `node install_permanent.js --uninstall`：停守护、删自启、还原 `app.asar`。
