# 第三轮：石墨银 · 系统蓝（Apple 官网气质）整套重做

工作目录就是本仓库。请先用 skill：`better-ui`、`better-colors`、`better-typography`、`better-interface`、`better-layout`。

## 用户反馈（必须落实）
- 深色难看 → 整套重做深色
- 没有动态特效、看不出高级感 → 加克制动效
- 不要橙色 → 删掉所有暖橙 / 琥珀 / 桃橙点缀

## 目标主题（替换现有自定义主题）
保留 `stock` / 「官方原版」。退役 `claude` 与 `claude-dark`（可改 id/名称/CSS，或删除后新建；切换器最终只剩下面三项）。

### 1) graphite-light「银雾」
- 页面底 `#F5F5F7`；侧栏 / 顶栏 `#FFFFFF` 或不透明 `#FAFAFA`（`--sidebar` 必须不透明实色）
- 正文 `#1D1D1F`；次级 `#6E6E73`
- 主色（系统蓝）`#0071E3`：只用于主按钮、焦点环、选中细边 / 左侧选中条，不大面积铺色
- 分割线发丝 `#D2D2D7`
- 浮层毛玻璃：`blur(20px) saturate(180%)`，边框发丝高光
- 圆角统一：`6 / 8 / 12 / 16 / 9999`

### 2) graphite-dark「深空石墨」
- 真黑底 `#000000`；卡片 / 菜单 `#1C1C1E`；再抬一层 `#2C2C2E`
- 正文 `#F5F5F7`；次级 `#A1A1A6`
- 主色 `#0A84FF`（Apple 深色系统蓝）
- 禁止橙色、金色、琥珀大面积或点缀主色
- 用炭色层次 + 发丝边分层，不要脏灰大阴影（`0 16px 40px` 一类删掉）

### 3) stock
保持官方原版，不改其 CSS 语义。

## 动效（高级感，不花）
全部尊重 `prefers-reduced-motion: reduce`（降级为瞬时或仅改色）。
1. 主题相关色：`transition` 约 `200–280ms` ease（背景 / 边框 / 文字色）
2. 悬停：背景淡入约 `120ms`
3. 发送按钮：按下 `scale(0.97)`（仅 no-preference）
4. Composer 聚焦：1px 蓝边 + 软光环淡入
5. 侧栏选中：左侧 2px 蓝条（可用 transition）
6. 浮层 / 菜单：`opacity` + 轻微 `translateY(4px → 0)`，短时长
7. mesh / 吸顶：极慢、极淡的环境光漂移即可；没有就强化毛玻璃与层次，不要彩虹渐变

## 硬约束（不可破）
- `--sidebar` 不透明实色
- 嵌套 `.bg-sidebar` 仍透明
- sticky / 吸顶标头仍用视口固定渐变
- 媒体模态胶囊仍是 `absolute`
- 不改 `install_permanent.js` / `inject_live.js` 注入核心（除非修明显 bug）
- 不交互提问；直接改文件

## 文件
- 改：`current.js`（主题数组 + 嵌入 CSS + 切换器文案）、`current.css`（胶囊等兜底，去橙、对齐新 id）
- 更新：`CHANGELOG.md` 追加「2026-10-29 石墨银重做」一节，写明 id、色值、动效、退役旧主题
- 自检：`node --check current.js`；确认切换器三项；确认无橙 / 琥珀残留在自定义主题 CSS 里

## 结束 stdout
打印：新主题 id 与显示名、关键色 token、动效清单、硬约束自检、`node --check` 结果。