# Antigravity Custom Theme

Antigravity 的外观插件：五套浅色皮肤，加一个可以自己调强调色、材质（毛玻璃）和壁纸的外观面板。另保留官方原版。

点标题栏右上角的皮肤名打开「外观」面板：

- **皮肤**：铝灰（默认）/ 瓷白 / 雾蓝 / 沙岩 / 苔绿 / 官方原版
- **强调色**：跟随皮肤、10 个预设，也可以用取色器或输入色值。白字对比度不到 4.5:1 时会提示
- **材质**：实色 / 磨砂 / 通透，可调模糊和表面不透明度
- **壁纸**：无 / 渐变（自动跟随皮肤或 5 款预设）/ 本地图片 / 图片链接，可调强度、模糊和填充方式

偏好存在 Antigravity 自己的 nativeStorage 里，换皮肤不会丢。守护进程同时把它写进运行目录的 `boot.json`，启动时随主题一起注入，第一帧就是你选的样子，不会先闪一下默认皮肤。本地图片缩到 2560px 以内转成 WebP，由守护进程存成运行目录里的 `wall.webp`，不塞进 Antigravity 自己的 `app_storage.json`。

外观出问题时按 `Ctrl+Alt+Shift+T` 临时切回官方原版，再按一次恢复。找不到标题栏工具区时，入口按钮会改挂在标题栏下方右侧。

## 安装

```
node build.js
node install_permanent.js
```

执行一次即可，应用开着也能装。在仓库目录（如 `D:\claude-plugins\antigravity-custom-theme`）执行时，脚本先把运行文件同步到 `%APPDATA%\Antigravity\custom-theme` 再安装；改了主题后重跑这两条即可生效。安装脚本会：

1. 应用关闭时给 `app.asar` 打钩子（运行中则留给守护进程）。
2. 在「启动」文件夹写入 `antigravity-custom-theme-guardian.vbs`，登录后静默运行 `guardian.js`。

Antigravity 每次更新都会整体替换 `app.asar`，钩子随之丢失。守护进程负责恢复：

- 应用运行中：通过它自带的调试端口（`DevToolsActivePort`）给未加载主题的窗口补注入。
- 应用关闭且 `app.asar` 30 秒内没被改动：钩子丢了就重新打补丁，原件备份为 `app.asar.orig`。

运行时的主题文件在 `%APPDATA%\Antigravity\custom-theme`，更新不会动它。日志见该目录下的 `guardian.log`。

## 源码

`current.js` 由 `build.js` 生成，不要直接改。

| 文件 | 内容 |
| --- | --- |
| `src/skins.js` | 皮肤配色、强调色、渐变壁纸。`build.js` 会检查对比度，不达标就停 |
| `src/base.css` | 各皮肤共用的结构样式，颜色全部是 `--sk-*` 变量 |
| `src/glass.css` | 毛玻璃材质与壁纸层 |
| `src/studio.js` / `src/studio.css` | 外观面板 |
| `src/engine.js` | 主题引擎：应用皮肤、标题栏同色、看图模态、DOM 重建自愈 |
| `src/stock.css` | 官方原版下的看图模态修正 |

## 其它命令

- `node check.js`：健康检查。Antigravity 更新后看主题是否还完整（钩子、守护进程、界面锚点、强调色、标题栏底色等），有失败项退出码为 1。守护进程在每次 `app.asar` 变化后会自动跑一次，有失败项会在窗口底部提示。
- `node inject_live.js`：改完后不重启直接刷入正在运行的 Antigravity。
- `node install_permanent.js --uninstall`：停守护、删自启、还原 `app.asar`。

## 致谢

材质分档、壁纸强度与弹层可读性下限的思路参考了 [dsh-dream-skin](https://github.com/RevolutionLA/dsh-dream-skin)（MIT）。本插件没有复制它的代码，皮肤配色与面板为独立实现。
