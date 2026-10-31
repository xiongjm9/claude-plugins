# 第二轮：用 jakubkrehel 审美 skill 精修主题

工作目录就是本仓库。请先用 skill：`better-ui`、`better-colors`、`better-typography`、`better-interface`。

## 现状
第一轮已完成：
- 浅色 `claude`（暖陶燕麦 · 精致）
- 深色 `claude-dark`（深炭琥珀）
- `stock` 官方原版
文件：`current.js`、`current.css`、`CHANGELOG.md`

## 本轮目标
按 better-ui / better-colors / better-typography 把两套自定义主题再抬一档「高级感」：
1. 阴影：分层更细（ambient + key），避免脏灰大阴影
2. 圆角：同一套 radius scale（例如 6/8/12/16/9999），光学对齐
3. 色：浅色暖橙与深色琥珀各自语义 token 对齐；正文/次级文字对比度够用
4. 毛玻璃：blur/saturate 更克制，边框用发丝高光
5. Composer 聚焦、发送按钮、选中态：更精致但不吵
6. 深色主题：避免纯黑死板，用深炭层次；琥珀点缀只点在 primary/focus/选中
7. 更新 CHANGELOG.md 追加「审美精修」一节

## 禁止
- 不改 install_permanent.js / inject_live.js 注入核心（除非修 bug）
- 不破坏硬约束（sidebar 实色、嵌套透明、sticky、media absolute）
- 不删 stock；不交互提问；直接改文件
- 结束时 stdout 打印：改了哪些视觉参数 + 自检结果
