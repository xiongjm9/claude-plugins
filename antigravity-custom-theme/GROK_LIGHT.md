# 第四轮：只要舒服浅色（四套 + stock），默认暖米

工作目录本仓库。先用 skill：`better-ui`、`better-colors`、`better-typography`、`better-interface`、`better-layout`。

## 用户反馈
- 银雾背景太差，浅色重做
- 不要深色主题了
- 多弄几个看着舒服的浅色
- 已批准：四套全要，默认「暖米」

## 切换器最终五项（顺序）
1. `warm-rice`「暖米」— **默认**（新用户 / 未知偏好 / 映射旧 graphite-* / claude* 时落到这里）
2. `paper`「纸白」
3. `cloud`「云灰」
4. `celadon`「青瓷」
5. `stock`「官方原版」— CSS 语义不改

退役并删除自定义深色与旧自定义浅色：`graphite-dark`、`graphite-light`、`claude`、`claude-dark`。旧 id 映射到 `warm-rice`。

## 色板（主色不大面积铺，只用于按钮/焦点/选中条）

### warm-rice 暖米（默认）
- 页底 `#F7F3EC`；侧栏/顶栏不透明 `#FFFAF5`（`--sidebar`）
- 正文 `#2C2A26`；次级 `#6B6560`；发丝 `#E5DFD4`
- 主色鼠尾草绿 `#0F766E`（禁止橙色）

### paper 纸白
- 页底 `#FAFAF8`；侧栏/顶栏 `#FFFFFF`
- 正文 `#1A1A1A`；次级 `#6B6B6B`；发丝 `#E8E8E4`
- 主色墨蓝 `#2563EB`

### cloud 云灰
- 页底 `#F4F6F8`；侧栏/顶栏 `#FFFFFF`
- 正文 `#1B1F24`；次级 `#5C6570`；发丝 `#DCE1E6`
- 主色石板蓝 `#3B82F6`

### celadon 青瓷
- 页底 `#F3F7F5`；侧栏/顶栏 `#FFFFFF`
- 正文 `#1C2A24`；次级 `#5A6B63`；发丝 `#D5E3DC`
- 主色 `#0D9488`；允许极淡青绿氛围光，不要彩虹

## 动效
沿用克制方案 + `prefers-reduced-motion` 降级：色 240ms、悬停 120ms、发送 scale 0.97、聚焦主色环、侧栏 2px 选中条、浮层 opacity+translateY(4→0)、mesh 极慢极淡。

## 硬约束
`--sidebar` 不透明；嵌套 `.bg-sidebar` 透明；sticky 视口渐变；媒体胶囊 absolute；不改注入脚本核心；不提问，直接改。

## 文件
改 `current.js`、`current.css`；`CHANGELOG.md` 追加「只要浅色四套」；自检 `node --check current.js`。

## 结束 stdout
打印五项 id/显示名、默认逻辑、关键色、无深色确认、硬约束与 node --check 结果。