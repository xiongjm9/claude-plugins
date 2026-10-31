# Antigravity custom-theme — 审美与高级感

目标：参照 Apple 等一线科技公司官网的质感。中性低饱和底色、一个强调色、厚磨砂、发丝边、弹簧缓动；克制、层次清楚、对比度达标。只做浅色。

- `current.js` 是生成物：改 `src/` 后 `node build.js`，对比度门槛不过会直接失败。
- 皮肤只改 `src/skins.js` 的 token；结构样式在 `src/base.css`，颜色只能用 `--sk-*` 变量。
- 硬约束：`--sidebar` 不透明实色（原生标题栏读它）、顶部 35px 标题带保持实色、嵌套侧栏透明、sticky 遮罩、媒体模态 absolute 胶囊，不可破坏。
- 面板样式限定在 `#ag-studio` 内，不用 `role="menu|option|dialog"`（base.css 对它们有全局规则）。
- 插件自己的动画只看 `html[data-sk-motion]`（studio 已合并系统「减少动态效果」与用户选择），不要再直接写 `prefers-reduced-motion`；只动 transform / opacity，连续拖动不走 View Transition。
