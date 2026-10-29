# 任务：升级 Antigravity custom-theme UI（浅色精致 + 深色高级）

你在目录：`C:\Users\Administrator\AppData\Roaming\Antigravity\custom-theme`

## 现有文件
- `current.js`：主题引擎 + THEMES 数组（内嵌各主题完整 CSS）。当前有：
  - `claude` / 暖陶燕麦（浅色暖橙）
  - `stock` / 官方原版
- `current.css`：主题无关的通用避让规则（看图胶囊等）
- `install_permanent.js` / `inject_live.js`：注入脚本，**不要改注入逻辑**，除非为了兼容新主题 ID 必须改

工作副本在 `work\`（可参考）；最终必须写回本目录的 `current.js` 与 `current.css`。

## 目标（必须全部完成）
1. **升级浅色主题 `claude`（暖陶燕麦）→ 更精致高级**
   - 保留暖橙主色系（`#CC5A36` 一带），不要换成别的色相
   - 加强：更细腻的 mesh 渐变、更高品质毛玻璃、更克制的阴影层次、更统一的圆角与间距、选中/hover 态更高级
   - 不要破坏现有架构注释里强调的硬约束（尤其 `--sidebar` 必须不透明实色、嵌套 `.bg-sidebar` 透明、sticky 渐变、媒体模态 absolute 胶囊等）
   - 名称可改为「暖陶燕麦 · 精致」或保持「暖陶燕麦」，在 name 字段体现升级即可

2. **新增深色高级主题**（新 id，建议 `claude-dark` 或 `obsidian-amber`）
   - 深炭背景 + 琥珀金点缀（高端 IDE 感）
   - 完整覆盖浅色主题已覆盖的主要区块：侧栏、顶栏、composer、用户气泡、菜单/浮层、滚动条、标签页、媒体模态、表格/引用/代码、ask_question 选中态等
   - `titlebarColor` / `symbolColor` 要适配深色（深色标题栏 + 浅色符号）
   - 加入 THEMES 数组，主题切换器里能选

3. **保留 `stock` 官方原版**

4. **主题切换器**
   - 三个选项都可见：精致浅色、深色高级、官方原版
   - 持久化逻辑（nativeStorage / localStorage）继续可用

5. **同步 `current.css`**
   - 若深色主题需要额外的主题无关/兜底规则，补上；不要删掉现有看图胶囊守护

6. **交付**
   - 直接改好 `current.js`、`current.css`
   - 写一个简短 `CHANGELOG.md`（中文）：改了什么、新主题 id、如何重新注入（跑桌面「一键恢复Claude橙色UI.bat」或 `node install_permanent.js`）
   - 最后在 stdout 打印：改动的文件列表 + 新主题 id + 一行自检要点

## 禁止
- 不要改 app.asar 手工其它文件
- 不要打开 TUI / 不要交互提问；直接改文件
- 不要删除 work\ 备份
- 不要提交 git（外面的人会处理上传）
