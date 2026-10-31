// Antigravity Custom Theme Engine & Companion Script
// 自动注入右上角胶囊主题切换器 + 下拉菜单选择
// 五套浅色皮肤 + 官方原版，外观面板可调强调色、材质（毛玻璃）与壁纸。由 build.js 生成，不要直接改 current.js。
(() => {
    if (window.__antigravityThemeEngineLoaded) return;
    window.__antigravityThemeEngineLoaded = true;
    if (window.__antigravityThemeWatchdog) {
        clearInterval(window.__antigravityThemeWatchdog);
        window.__antigravityThemeWatchdog = null;
    }
    if (window.__antigravityThemeObserver) {
        window.__antigravityThemeObserver.disconnect();
        window.__antigravityThemeObserver = null;
    }

    const THEMES = (() => {
        const SKIN_BASE_CSS = "/* === 全局强制使用 PingFang SC 苹方字体 === */\n*:not(pre):not(code):not(kbd):not(samp):not([class*=\"font-mono\"]):not([class*=\"text-code\"]) {\n  font-family: \"PingFang SC\", \"PingFangSC-Regular\", \"PingFangSC\", \"苹方-简\", \"苹方\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif !important;\n}\nhtml, body {\n  font-family: \"PingFang SC\", \"PingFangSC-Regular\", \"PingFangSC\", \"苹方-简\", \"苹方\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif !important;\n}\n\n@layer px-theme, properties, theme, base, components, utilities;\n\n/* ============================================================================\n   warm-rice — 暖米\n   暖米。页底 var(--sk-base)，侧栏与顶栏不透明 var(--sk-sidebar)，正文 var(--sk-text)，次级 var(--sk-text-2)，发丝 var(--sk-line)。主色鼠尾草绿 var(--sk-accent) 只用于主按钮、焦点环、选中细条。无橙色。\n   硬约束：--sidebar 不透明实色、嵌套 .bg-sidebar 透明、sticky 视口固定渐变、媒体胶囊 absolute。\n   =========================================================================== */\n\n/* === 0. Tailwind v4 变量劫持 ===\n   ⚠️ 重要：--sidebar 必须是不透明实色（不能带 alpha）。\n   渲染进程会用 Zub(\"--sidebar\") 读取它来设置 Electron 原生标题栏覆盖色。\n   一旦写成 rgba(...)，原生接口不认，就回退成纯白，右上角窗口按钮区会和顶栏脱节。 */\n:root,\nbody,\nbody.theme-light,\nbody:not(.theme-light) {\n  --ag-mesh:\n    radial-gradient(1100px 640px at 0% -10%, color-mix(in srgb, var(--sk-accent) 3.2%, transparent), transparent 64%),\n    radial-gradient(900px 520px at 100% -8%, color-mix(in srgb, var(--sk-line) 30%, transparent), transparent 60%),\n    linear-gradient(180deg,\n      var(--sk-sidebar) 0px,\n      var(--sk-sidebar) 32px,\n      var(--sk-base-2) 18%,\n      var(--sk-base) 46%,\n      var(--sk-base) 100%);\n  --sidebar-unified-bg: linear-gradient(180deg, var(--sk-sidebar) 0%, var(--sk-sidebar) 100%);\n  --ag-radius-xs: 6px;\n  --ag-radius-sm: 8px;\n  --ag-radius-md: 12px;\n  --ag-radius-lg: 16px;\n  --ag-radius-pill: 9999px;\n  --ag-accent: var(--sk-accent);\n  --ag-shadow-rest: 0 1px 2px rgba(0, 0, 0, 0.04);\n  --ag-shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 16px -12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.90);\n  --ag-shadow-float: 0 8px 20px -16px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.92);\n  --ag-shadow-focus: 0 0 0 1px var(--sk-accent), 0 0 0 4px color-mix(in srgb, var(--sk-accent) 16%, transparent);\n\n  --background:              transparent !important;\n  --foreground:              var(--sk-text) !important;\n  --content:                 transparent !important;\n  --sidebar:                 var(--sk-sidebar) !important;\n  /* 关键：必须保持 transparent。一旦给值，侧栏每个项目行都会变成白色小积木 */\n  --sidebar-secondary:       transparent !important;\n  --sidebar-muted:           transparent !important;\n  --card:                    transparent !important;\n  --card-border:             transparent !important;\n  --secondary:               transparent !important;\n  --secondary-foreground:    var(--sk-text) !important;\n  --muted:                   transparent !important;\n  --muted-foreground:        var(--sk-text-2) !important;\n  --border:                  var(--sk-line) !important;\n  --primary:                 var(--sk-accent) !important;\n  --primary-foreground:      #FFFFFF !important;\n  --placeholder:             var(--sk-text-2) !important;\n  --media-modal-bg:          var(--sk-base) !important;\n  --media-capsule-bg:        rgba(255, 255, 255, 0.86) !important;\n  --media-capsule-border:    rgba(255, 255, 255, 0.80) !important;\n  --media-capsule-hover:     rgba(0, 0, 0, 0.05) !important;\n  --media-capsule-fg:        var(--sk-text) !important;\n  --media-capsule-shadow:    var(--ag-shadow-card) !important;\n\n  --color-background:           transparent !important;\n  --color-foreground:           var(--sk-text) !important;\n  --color-content:              transparent !important;\n  --color-sidebar:              var(--sk-sidebar) !important;\n  --color-sidebar-secondary:    transparent !important;\n  --color-sidebar-muted:        transparent !important;\n  --color-card:                 transparent !important;\n  --color-card-border:          transparent !important;\n  --color-secondary:            transparent !important;\n  --color-secondary-foreground: var(--sk-text) !important;\n  --color-muted:                transparent !important;\n  --color-muted-foreground:     var(--sk-text-2) !important;\n  --color-border:               var(--sk-line) !important;\n  --color-primary:              var(--sk-accent) !important;\n  --color-primary-foreground:   #FFFFFF !important;\n  --color-placeholder:          var(--sk-text-2) !important;\n}\n\n/* === 1. 浅底渐变底漆 + 掐死文档级滚动条（问题 1） ===\n   html 只负责画渐变和锁滚动；应用自身的 .overlay-scrollbars 接管所有内滚动。 */\nhtml {\n  height: 100% !important;\n  min-height: 0 !important;\n  max-height: 100% !important;\n  overflow: hidden !important;\n  background-color: var(--sk-base) !important;\n  background-image: var(--ag-mesh) !important;\n  background-attachment: fixed !important;\n  background-repeat: no-repeat !important;\n  background-size: 140% 140%, 140% 140%, 100% 100% !important;\n  -webkit-font-smoothing: antialiased !important;\n  -moz-osx-font-smoothing: grayscale !important;\n  /* 双保险：即使将来有元素溢出，也不允许出现原生滚动条 */\n  scrollbar-width: none !important;\n}\n\nhtml::-webkit-scrollbar,\nbody::-webkit-scrollbar {\n  display: none !important;\n  width: 0 !important;\n  height: 0 !important;\n}\n\nbody {\n  height: 100% !important;\n  min-height: 0 !important;\n  overflow: hidden !important;\n  background: transparent !important;\n  color: var(--sk-text) !important;\n}\n\n/* === 2. 掏空所有中间容器（让浅底渐变无损透出） === */\n#root,\n#root > div,\nbody > div,\nmain,\n[class*=\"bg-background\"],\n[class*=\"bg-content\"],\ndiv[class*=\"h-screen\"],\ndiv[class*=\"w-screen\"],\ndiv[class*=\"z-0\"][class*=\"flex-1\"],\ndiv[class*=\"min-h-0\"][class*=\"h-full\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n}\n\n/* 注意：不再把 [class*=\"bg-muted\"] 全量透明，否则会话行 hover 无反馈 */\n\n/* === 3. 侧栏外壳：一体化视口固定浅色渐变（与吸顶标头 100% 像素级同源对齐） === */\n.bg-sidebar {\n  background-color: var(--sk-pop) !important;\n  background-image: var(--sidebar-unified-bg) !important;\n  background-attachment: fixed !important;\n  background-position: 0 0 !important;\n  background-size: 100vw 100vh !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n}\n\n/* 坚决锁定侧栏各容器横向溢出，根除异常横向滚动条 */\n.bg-sidebar div[class*=\"overflow-y-auto\"],\n.bg-sidebar div[class*=\"overscroll-none\"],\ndiv[class*=\"bg-sidebar\"] div[class*=\"overflow-y-auto\"] {\n  overflow-x: hidden !important;\n}\n\n/* 侧栏（非顶栏）才需要右侧发丝线 */\ndiv[class*=\"flex-col\"][class*=\"bg-sidebar\"] {\n  border-right: 1px solid var(--sk-line) !important;\n}\n\n/* 关键：app 给每个项目分组（综合工作台/校园跑测试/STM32…）都套了一层\n   嵌套 .bg-sidebar，如果一并吃玻璃规则，就会变成一块块浅蓝色塑料积木。\n   所以嵌套层必须彻底透明 + 去掉 backdrop-filter。\n   ⚠️ 约束：必须限制在纵向侧栏（div[class*=\"flex-col\"][class*=\"bg-sidebar\"]）内，坚决杜绝误杀顶栏 title-menu-bar 下的下拉菜单！ */\ndiv[class*=\"flex-col\"][class*=\"bg-sidebar\"] .bg-sidebar:not([style*=\"position: sticky\"]):not([style*=\"position:sticky\"]):not([data-index=\"0\"]) {\n  background-color: transparent !important;\n  background-image: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border: none !important;\n  box-shadow: none !important;\n}\n\n/* === 4. 侧栏内部：抹掉多余底色，保留 hover / 选中态 === */\n.bg-sidebar .bg-card,\n.bg-sidebar .bg-sidebar-secondary,\n.bg-sidebar .bg-secondary,\n.bg-sidebar .bg-muted,\n.bg-sidebar [class*=\"bg-card\"],\n.bg-sidebar [class*=\"bg-secondary\"]:not([class*=\"bg-sidebar-secondary\"]),\n.bg-sidebar [class*=\"bg-muted\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n  box-shadow: none !important;\n  border-color: transparent !important;\n}\n\n/* 侧栏里的按钮 / 链接默认零底色，hover 时才浮现白色玻璃 */\n.bg-sidebar button,\n.bg-sidebar a,\n.bg-sidebar [role=\"button\"] {\n  background-color: transparent !important;\n  background-image: none !important;\n  box-shadow: none !important;\n  border-color: transparent !important;\n}\n\n/* 分组标题（Projects、Conversations 等） */\n[class*=\"group/section-header\"],\n[class*=\"group/section-header\"] button,\n[class*=\"group/section-header\"] span {\n  background: transparent !important;\n  box-shadow: none !important;\n  border: none !important;\n}\n\n/* 彻底保证所有项目文件夹与会话分组绝对通透，零底色零边框零积木 */\ndiv[class*=\"flex-col\"][class*=\"bg-sidebar\"] .bg-sidebar:not([style*=\"position: sticky\"]):not([style*=\"position:sticky\"]):not([data-index=\"0\"]),\n.bg-sidebar div[data-sidebar-section-drop-id]:not([style*=\"position: sticky\"]):not([style*=\"position:sticky\"]):not([data-index=\"0\"]),\n.bg-sidebar div:has(> [data-testid=\"section-header\"]):not([style*=\"position: sticky\"]):not([style*=\"position:sticky\"]):not([data-index=\"0\"]) {\n  background: transparent !important;\n  background-color: transparent !important;\n  background-image: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border: none !important;\n  box-shadow: none !important;\n}\n\n/* 吸顶标头：完全对齐官方原版 tanstack-virtual 机制，仅当处于 sticky 状态时赋予视口固定渐变遮字，未吸顶时保持彻底透明 */\n.bg-sidebar div[style*=\"position: sticky\"],\n.bg-sidebar div[style*=\"position:sticky\"],\n.bg-sidebar div[data-index=\"0\"] {\n  width: 100% !important;\n  margin: 0 !important;\n  box-sizing: border-box !important;\n  background-color: var(--sk-pop) !important;\n  background-image: var(--sidebar-unified-bg) !important;\n  background-attachment: fixed !important;\n  background-position: 0 0 !important;\n  background-size: 100vw 100vh !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border: none !important;\n  box-shadow: none !important;\n  z-index: 30 !important;\n}\n\n.bg-sidebar div[style*=\"position: sticky\"]::before,\n.bg-sidebar div[style*=\"position:sticky\"]::before,\n.bg-sidebar div[data-index=\"0\"]::before,\n.bg-sidebar div[data-sidebar-section-drop-id=\"main-section-header\"]::before,\n.bg-sidebar div:has(> [data-testid=\"section-header\"][data-title=\"Projects\"])::before {\n  display: none !important;\n  content: none !important;\n}\n\n/* 分隔线清理 */\n.bg-sidebar [class*=\"bg-border\"],\n.bg-sidebar hr,\ndiv[class*=\"bg-border\"] {\n  background-color: color-mix(in srgb, var(--sk-surface) calc(20% * var(--sk-fill, 1)), transparent) !important;\n}\n\n/* === 5. + New Conversation：唯一允许有微白底的侧栏常驻元素 === */\n.bg-sidebar a[href=\"/\"] {\n  background: var(--sk-base) !important;\n  border: 1px solid var(--sk-line) !important;\n  border-radius: 8px !important;\n  box-shadow: var(--ag-shadow-rest), inset 0 1px 0 rgba(255, 255, 255, 0.80) !important;\n  color: var(--sk-text) !important;\n  font-weight: 600 !important;\n}@media (hover: hover) {\n/* === 6. 侧栏 hover：白色玻璃药丸 === */\n.bg-sidebar button:hover,\n.bg-sidebar a:not([href=\"/\"]):hover,\n.bg-sidebar [role=\"button\"]:hover {\n  background-color: rgba(0, 0, 0, 0.04) !important;\n  border-radius: 8px !important;\n}\n}\n\n\n/* 侧栏文字颜色 */\n.bg-sidebar,\n.bg-sidebar * {\n  color: var(--sk-text) !important;\n}\n\n.bg-sidebar svg {\n  color: var(--sk-text) !important;\n}\n\n/* 时间戳等次级文字 */\n.bg-sidebar [class*=\"text-muted\"],\n.bg-sidebar [class*=\"text-sidebar-muted\"] {\n  color: var(--sk-text-2) !important;\n}\n\n/* === 7. 会话行：悬停/选中玻璃药丸 + 对齐官方原版渐变遮罩 ===\n   结构（实测）：\n     row(flex justify-between)\n       ├ a (absolute inset-0)\n       └ div.grow(flex gap-2 min-w-0)\n           ├ div(标题容器, w-full/min-w-0) → span.truncate\n           └ div(右侧元信息, shrink-0) → [绝对定位的三个按钮] + 时间戳\n   官方原生逻辑：\n     - 常态/选中态：标题容器自适应占满整行宽度，在时间戳前自然省略截断，无突兀空白；\n     - 悬停态：三个操作按钮绝对定位浮现，按钮容器自带 linear-gradient(to right, transparent 0%, var(--row-bg) 25%)；\n       由 --row-bg 负责无缝渐隐末尾文字（fade mask），文字一路延伸并平滑淡出，不使用 padding-right 提前硬砍。 */\n\n/* 行底色：悬停 / 选中（保持玻璃质感，不要做成不透明块） */\n[data-testid^=\"conversation-row-\"]:hover,\n[data-testid^=\"conversation-row-\"]:focus-within {\n  --row-bg: rgba(0, 0, 0, 0.045) !important;\n  background-color: rgba(0, 0, 0, 0.045) !important;\n  border-radius: 8px !important;\n  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06) !important;\n}\n\n[data-testid^=\"conversation-row-\"][data-selected=\"true\"] {\n  --row-bg: rgba(0, 0, 0, 0.05) !important;\n  background-color: rgba(0, 0, 0, 0.05) !important;\n  border-radius: 8px !important;\n  box-shadow: inset 2px 0 0 var(--sk-accent) !important;\n}\n\n/* 仅在\"悬停 / 键盘聚焦\"时，对标题文字施加精准定向 fade mask：\n   - 0% ~ calc(100% - 64px)：文字 100% 不透明清晰显示；\n   - calc(100% - 64px) ~ calc(100% - 34px)：文字在按钮左侧 30px 区域内平滑渐隐淡出（100% 还原官方原版图 4 效果）；\n   - calc(100% - 34px) ~ 100%（操作按钮所在的 34px~76px 区域）：文字透明度严格为 0（完全隐形），彻底杜绝文字穿透按钮图标；\n   - 双击改名编辑时（:not(:has(input))）自动豁免遮罩。 */\n[data-testid^=\"conversation-row-\"]:hover div[class*=\"flex-col\"][class*=\"min-w-0\"]:not(:has(input)),\n[data-testid^=\"conversation-row-\"]:focus-within div[class*=\"flex-col\"][class*=\"min-w-0\"]:not(:has(input)) {\n  -webkit-mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 64px), transparent calc(100% - 34px)) !important;\n  mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 64px), transparent calc(100% - 34px)) !important;\n}@media (hover: hover) {\n/* 行内标题：悬停时加深，保证清晰 */\n[data-testid^=\"conversation-row-\"]:hover span {\n  color: var(--sk-text) !important;\n}\n}\n\n\n/* 遮罩完全承袭官方原生设计：\n   app 内联写了 linear-gradient(to right, transparent 0%, var(--row-bg) 25%)，\n   只要我们正确设置了 --row-bg（上面已给玻璃白），遮罩就会自动生效、无需覆盖。\n   标题文字自然延伸至按钮区并在左侧 25% 渐变区域平滑淡出，无断层感。 */\n\n/* 三个操作按钮：默认透明，指到时浮实心白，确保 icon 一眼可辨 */\n[data-testid^=\"conversation-row-\"] [class*=\"top-0 bottom-0\"] button {\n  background-color: transparent !important;\n  border-radius: 6px !important;\n}@media (hover: hover) {\n[data-testid^=\"conversation-row-\"] [class*=\"top-0 bottom-0\"] button:hover {\n  background-color: var(--sk-pop) !important;\n  box-shadow: var(--ag-shadow-rest) !important;\n}\n}\n\n\n[data-testid^=\"conversation-row-\"] [class*=\"top-0 bottom-0\"] svg {\n  color: var(--sk-text) !important;\n}\n\n/* === 8. 顶栏：保持通透的浅底玻璃，纯文字菜单（问题 5） ===\n   app 无 <header>，真实节点是 [data-testid=\"title-menu-bar\"]（占满窗口宽 35px 高）。\n   顶栏保持透明让浅底渐变透出来，绝不刷白；\n   左上角图标按钮单独给玻璃药丸底，解决\"融进背景分不清按钮\"的问题。 */\n[data-testid=\"title-menu-bar\"] {\n  position: relative !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  background-image: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border: none !important;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;\n  box-shadow: none !important;\n}\n\n/* 顶栏左上角图标组（logo / 侧栏开关 / 后退 / 前进 / 搜索）：\n   ⚠️ 不要给每个 button 单独加圆角方块 —— 那样会变成一排\"分离的塑料块\"。\n   正确做法：外层容器整体做成一条胶囊玻璃，内部按钮保持透明。 */\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] {\n  padding: 0 !important;\n}\n\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] button {\n  background-color: transparent !important;\n  border: none !important;\n  border-radius: 6px !important;\n  box-shadow: none !important;\n  color: var(--sk-text) !important;\n}@media (hover: hover) {\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] button:hover {\n  background-color: color-mix(in srgb, var(--sk-surface) calc(55% * var(--sk-fill, 1)), transparent) !important;\n}\n}\n\n\n/* 顶栏菜单项（File / View / Window）：纯文字，hover 才浮白 */\n[data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-item\"] {\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  color: var(--sk-text) !important;\n  border-radius: 6px !important;\n}@media (hover: hover) {\n[data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-item\"]:hover {\n  background: color-mix(in srgb, var(--sk-surface) calc(55% * var(--sk-fill, 1)), transparent) !important;\n}\n}\n@media (hover: hover) {\n/* 顶栏左下侧栏头部的图标组（logo / 侧栏开关 / 前后退 / 搜索）：hover 浮白，明确可点 */\ndiv[class*=\"absolute\"][class*=\"left-0\"][class*=\"top-0\"] button:hover,\ndiv[class*=\"absolute\"][class*=\"right-0\"][class*=\"top-0\"] button:hover {\n  background-color: color-mix(in srgb, var(--sk-surface) calc(55% * var(--sk-fill, 1)), transparent) !important;\n  border-radius: 6px !important;\n}\n}\n\n\n/* 顶栏工具栏中的主题切换按钮：100% 对齐 Open IDE 原生幽灵透明按钮风格，去除死白底色与阴影 */\n#antigravity-theme-btn {\n  display: inline-flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  height: 24px !important;\n  width: auto !important;\n  min-width: unset !important;\n  max-width: none !important;\n  padding: 0 6px 0 8px !important;\n  white-space: nowrap !important;\n  font-size: 12px !important;\n  font-weight: 500 !important;\n  font-family: inherit !important;\n  color: inherit !important;\n  background: transparent !important;\n  border: 1px solid var(--border, rgba(255, 255, 255, 0.35)) !important;\n  border-radius: 6px !important;\n  box-shadow: none !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  flex: 0 0 auto !important;\n  gap: 5px !important;\n  line-height: 1 !important;\n}\n\n#antigravity-theme-btn span {\n  white-space: nowrap !important;\n  line-height: 1 !important;\n}@media (hover: hover) {\n#antigravity-theme-btn:hover {\n  background-color: color-mix(in srgb, var(--sk-surface) calc(25% * var(--sk-fill, 1)), transparent) !important;\n}\n}\n\n\n\n/* === 9. Composer 输入框：轻薄浅色毛玻璃卡片（对齐参照图实测色） ===\n   参照图实测：卡片内部 ≈ rgb(210,240,253)，仅在周围渐变（≈204,231,252）上\n   微微提亮，靠\"一圈柔白描边 + 柔和外发光\"显出卡片边界 —— 不是刺眼纯白。\n   因此这里用淡浅色白半透明 + 中等模糊，避免死白和灰浊两个极端。 */\ndiv[class*=\"bg-card-border\"]:has([contenteditable=\"true\"]),\ndiv[class*=\"bg-card-border\"]:has(textarea) {\n  background: color-mix(in srgb, var(--sk-surface) calc(78% * var(--sk-fill, 1)), transparent) !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n  border: 1px solid var(--sk-line) !important;\n  border-radius: 16px !important;\n  box-shadow: var(--ag-shadow-card) !important;\n}\n\ndiv[class*=\"bg-card-border\"]:has([contenteditable=\"true\"]) > div[class*=\"bg-card\"]:not([data-mention-menu]):not([role=\"listbox\"]),\ndiv[class*=\"bg-card-border\"]:has(textarea) > div[class*=\"bg-card\"]:not([data-mention-menu]):not([role=\"listbox\"]) {\n  background: transparent !important;\n  box-shadow: none !important;\n}\n\n/* 斜杠命令菜单（/ 命令选择界面）与提及弹窗实底守护 */\ndiv[data-mention-menu],\ndiv[class*=\"bg-card-border\"] div[data-mention-menu],\ndiv[role=\"listbox\"][data-mention-menu],\ndiv[aria-label=\"Mentions\"],\ndiv[aria-label=\"Typeahead menu\"],\ndiv:has(> [id*=\"typeahead-item\"]) {\n  background-color: var(--sk-pop) !important;\n  background: var(--sk-sidebar) !important;\n  color: var(--sk-text) !important;\n  border: 1px solid rgba(0, 0, 0, 0.10) !important;\n  border-radius: 16px !important;\n  box-shadow: var(--ag-shadow-float) !important;\n  opacity: 1 !important;\n  z-index: 99999 !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"] {\n  color: var(--sk-text) !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"][aria-selected=\"true\"],\ndiv[data-mention-menu] [role=\"option\"]:hover,\ndiv[data-mention-menu] [role=\"option\"] > div:hover,\ndiv[data-mention-menu] [role=\"option\"] > div[class*=\"bg-secondary\"] {\n  background-color: rgba(0, 0, 0, 0.04) !important;\n  border-radius: 8px !important;\n}\n\ndiv[data-mention-menu] [role=\"option\"] svg {\n  color: var(--sk-text) !important;\n}\n\ndiv[data-mention-menu] [class*=\"opacity-50\"],\ndiv[data-mention-menu] [class*=\"text-muted\"] {\n  color: var(--sk-text-2) !important;\n}\n\n/* 输入框内的占位提示文字：淡蓝灰，不抢眼但要能看清 */\n[contenteditable=\"true\"] ~ p,\ndiv[class*=\"bg-card-border\"] p[class*=\"absolute\"] {\n  color: var(--sk-text-2) !important;\n  opacity: 1 !important;\n}\n\ntextarea,\n[contenteditable=\"true\"] {\n  color: var(--sk-text) !important;\n}\n\n/* === 10. 我自己发送的消息：白色磨砂气泡（问题 4） ===\n   结构（实测）：user-input-step > div > div.p-px.rounded-xl.bg-card-border\n                                            > div.bg-card */\n\n/* ⚠️ 关键修复：用户消息被 sticky 固定在顶部（div.sticky.top-0.z-10），\n   并且靠 `.md-sticky-message-bleed::after`（高 28px、用 bg-background 填充）\n   做一条向下渐隐的遮罩，用来盖住下面滚动过去的内容。\n   本主题把 --background 设成 transparent 后，这条遮罩就消失了 ——\n   于是消息卡片直接压在下方正文上，看起来就是\"文字重叠\"。\n   解法：给 sticky 容器挂一份\"视口固定\"的页面渐变副本。\n   background-attachment: fixed 让这块背景像窗口一样对准页面渐变，\n   所以无论它停在哪个高度，颜色都与周围浅底渐变完全一致，不会有色带接缝。 */\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(> div[class*=\"md-sticky-message-bleed\"]) {\n  background-color: transparent !important;\n  background-image: var(--ag-mesh) !important;\n  background-attachment: fixed !important;\n  background-size: 100vw 100vh !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border-radius: 0 !important;\n}\n\ndiv[class*=\"md-sticky-message-bleed\"]::after {\n  background: none !important;\n  background-color: transparent !important;\n}\n\n/* 外层边框层：柔和蓝白（不是死白，避免在蓝底上显得突兀），正文才有对比度 */\n[data-testid=\"user-input-step\"] div[class*=\"bg-card-border\"] {\n  background: var(--sk-sidebar) !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  border-radius: 16px !important;\n  box-shadow: var(--ag-shadow-card) !important;\n}\n\n/* 内层：保持同一色，文字才有足够对比度 */\n[data-testid=\"user-input-step\"] div[class*=\"bg-card-border\"] > div[class*=\"bg-card\"] {\n  background: var(--sk-sidebar) !important;\n  box-shadow: none !important;\n}\n\n/* 气泡内正文：正文色，压在白底上清晰可读 */\n[data-testid=\"user-input-step\"],\n[data-testid=\"user-input-step\"] * {\n  color: var(--sk-text) !important;\n}\n\n[data-testid=\"user-input-step\"] {\n  filter: none !important;\n}\n\n/* 用户消息内部右下角操作浮条（时间与重试/复制按钮）：\n   还原官方原版机制 —— 元素本身保持原生 rounded-full + p-1 几何，不做任何改形；\n   原版靠 .user-input-buttons-shadow 的 box-shadow: 0 0 25px 15px var(--card) 产生柔和渐隐。\n   本主题把 --card 置为 transparent 导致阴影消失，故此处直接用气泡底色重新给阴影上色。 */\n[data-testid=\"user-input-step\"] [class*=\"user-input-buttons-container\"] {\n  background: var(--sk-sidebar) !important;\n  background-color: var(--sk-pop) !important;\n  background-image: none !important;\n  border: none !important;\n  box-shadow: 0 0 20px 10px var(--sk-sidebar) !important;\n  padding: 4px !important;\n  border-radius: 9999px !important;\n  z-index: 2 !important;\n}\n\n[data-testid=\"user-input-step\"] [class*=\"user-input-buttons-container\"] button {\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n}\n\n/* === 11. 下拉菜单 / 弹窗 / 工具提示 / 悬浮卡片 / 划词浮条 === */\n\n/* 11.1 全量轻量浮窗实底守护：Base UI 悬浮卡片(HoverCard)、Tooltip、划词选中文本浮条、Popover、Toast 等 */\n[data-base-ui-portal] [data-base-ui-focusable]:not([data-closed]):not([data-ending-style]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [class*=\"bg-card\"]:not([data-closed]):not([data-ending-style]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] div[role=\"presentation\"]:not([data-closed]) > div:not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal]:not(:has([data-closed])) > div > div:not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"animate-slideIn\"][class*=\"bg-card\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"w-72\"][class*=\"bg-card\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"tooltip\"]:not([data-closed]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n.compact-tooltip:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-tooltip-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-hover-card-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popover-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-radix-hover-card-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-radix-popover-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] [data-side]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-floating-ui-portal] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-sonner-toast]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-toast-root]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"bubble-menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"floating-menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"floating-toolbar\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"selection-toolbar\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv.selection-quote-popup > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"selection-popup\"] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv:has(> [data-testid=\"selection-quote-button\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"rounded\"]:has(> button[data-tooltip-id*=\"quote\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[class*=\"rounded\"]:has(> button[data-tooltip-id*=\"explain\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv:has(> [data-testid=\"conversation-preview\"]):not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *)\n{\n  background-color: var(--sk-pop) !important;\n  background-image: none !important;\n  color: var(--sk-text) !important;\n  border: 1px solid rgba(0, 0, 0, 0.12) !important;\n  border-radius: 8px !important;\n  box-shadow: var(--ag-shadow-float) !important;\n  opacity: 1 !important;\n  z-index: 99999 !important;\n}\n\n/* 划词外层挂载容器纯透，坚决杜绝双层边框与外层方框瑕疵 */\ndiv.selection-popup,\ndiv.selection-quote-popup,\ndiv[class*=\"selection-popup\"],\ndiv[class*=\"selection-quote-popup\"] {\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  overflow: visible !important;\n  z-index: 99999 !important;\n}\n\nbutton[data-testid=\"selection-quote-button\"],\ndiv[class*=\"selection-popup\"] button {\n  background-color: transparent !important;\n  color: var(--sk-text) !important;\n  border-radius: 6px !important;\n}\n\nbutton[data-testid=\"selection-quote-button\"] span,\ndiv[class*=\"selection-popup\"] button span {\n  color: var(--sk-text) !important;\n}\n\nbutton[data-testid=\"selection-quote-button\"] span.opacity-50,\nbutton[data-testid=\"selection-quote-button\"] span:last-child:not(:first-child),\ndiv[class*=\"selection-popup\"] button span.opacity-50 {\n  color: var(--sk-text) !important;\n  opacity: 0.85 !important;\n}@media (hover: hover) {\nbutton[data-testid=\"selection-quote-button\"]:hover,\ndiv[class*=\"selection-popup\"] button:hover {\n  background-color: rgba(0, 0, 0, 0.04) !important;\n}\n}\n\n\n[role=\"tooltip\"] *,\n.compact-tooltip * {\n  color: var(--sk-text) !important;\n  background-color: transparent !important;\n}\n\n/* 浮动条内部的分割线保持柔和可见 */\ndiv[class*=\"bubble-menu\"] [class*=\"bg-border\"],\ndiv[class*=\"floating-\"] [class*=\"bg-border\"],\ndiv[class*=\"selection-popup\"] [class*=\"bg-border\"],\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]) [class*=\"bg-border\"],\n[data-base-ui-portal] [class*=\"bg-border\"],\n[data-radix-hover-card-content] [class*=\"bg-border\"] {\n  background-color: rgba(0, 0, 0, 0.10) !important;\n}\n\n[data-base-ui-portal] [data-base-ui-focusable] svg,\n[data-base-ui-portal] [class*=\"bg-card\"] svg,\n[data-radix-hover-card-content] svg,\n[data-radix-popover-content] svg,\ndiv[class*=\"bubble-menu\"] svg,\ndiv[class*=\"floating-\"] svg,\ndiv[class*=\"selection-popup\"] svg,\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]) svg {\n  color: var(--sk-text) !important;\n}@media (hover: hover) {\n/* 划词工具栏与浮动条按钮 hover */\ndiv[class*=\"bubble-menu\"] button:hover,\ndiv[class*=\"floating-\"] button:hover,\ndiv[role=\"toolbar\"]:not([data-testid=\"user-input-step\"] *):not([data-testid=\"media-modal-zoom-controls\"]) button:hover,\ndiv[class*=\"rounded\"]:has(> button[data-tooltip-id*=\"quote\"]) button:hover {\n  background-color: rgba(0, 0, 0, 0.04) !important;\n  border-radius: 6px !important;\n}\n}\n\n\n/* 会话悬停详情卡（Base UI HoverCard）内次级文字（Idle、更新时间、项目名等） */\n[data-base-ui-portal] [data-base-ui-focusable] [class*=\"text-muted\"],\n[data-base-ui-portal] [class*=\"bg-card\"] [class*=\"text-muted\"],\n[data-base-ui-portal] div[role=\"presentation\"] [class*=\"text-muted\"],\n[data-radix-hover-card-content] [class*=\"text-muted\"],\n[data-radix-popper-content-wrapper] [data-side] [class*=\"text-muted\"],\n[data-radix-hover-card-content] span:has(+ span) {\n  color: var(--sk-text-2) !important;\n}\n\n/* 11.2 下拉菜单、二级子菜单与弹窗（坚决保证实底，包括嵌套子菜单） */\n[role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"listbox\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[role=\"dialog\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-testid^=\"overview-panel-host-\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\ndiv[role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-base-ui-portal] [role=\"menu\"] [role=\"menu\"]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[cmdk-root]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[cmdk-list]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-dropdown-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-context-menu-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-select-content]:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *),\n[data-radix-popper-content-wrapper] > div:not([data-testid=\"media-modal\"]):not([data-testid=\"media-modal\"] *)\n{\n  background-color: var(--sk-pop) !important;\n  color: var(--sk-text) !important;\n  border: 1px solid rgba(0, 0, 0, 0.10) !important;\n  border-radius: 12px !important;\n  box-shadow: var(--ag-shadow-float) !important;\n  opacity: 1 !important;\n}\n\n/* 菜单项文字与图标 */\n[role=\"menuitem\"],\n[role=\"option\"] {\n  color: var(--sk-text) !important;\n}\n\n[role=\"menuitem\"]:hover,\n[role=\"option\"]:hover,\n[role=\"option\"][aria-selected=\"true\"],\n[cmdk-item][data-selected=\"true\"],\n[cmdk-item]:hover,\n[data-highlighted] {\n  background-color: rgba(0, 0, 0, 0.04) !important;\n  border-radius: 6px !important;\n}\n\n/* 顶栏 File/View/Window 展开的下拉菜单（保证实底、边框与投影，坚决不透底） */\n[data-testid=\"title-menu-bar\"] [class*=\"border-menu-border\"],\n[data-testid=\"title-menu-bar\"] div[class*=\"bg-sidebar\"],\n[data-testid=\"title-menu-bar\"] [role=\"menu\"] {\n  background-color: var(--sk-pop) !important;\n  background-image: none !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n  border: 1px solid rgba(0, 0, 0, 0.12) !important;\n  border-radius: 12px !important;\n  box-shadow: var(--ag-shadow-float) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"title-menu-bar-option\"] {\n  color: var(--sk-text) !important;\n}@media (hover: hover) {\n[data-testid=\"title-menu-bar-option\"]:hover {\n  background-color: rgba(0, 0, 0, 0.04) !important;\n}\n}\n\n\n/* 11.3 回底按钮（Scroll to Bottom）：纯净实底、柔和边框与阴影，坚决不透正文字 */\nbutton[aria-label=\"Scroll to Bottom\"],\nbutton[aria-label*=\"Scroll to bottom\" i],\nbutton[aria-label*=\"bottom\" i]:has(svg) {\n  background-color: var(--sk-pop) !important;\n  color: var(--sk-text) !important;\n  border: 1px solid rgba(0, 0, 0, 0.10) !important;\n  border-radius: 9999px !important;\n  box-shadow: var(--ag-shadow-card) !important;\n  backdrop-filter: var(--sk-filter) !important;\n  z-index: 30 !important;\n}@media (hover: hover) {\nbutton[aria-label=\"Scroll to Bottom\"]:hover,\nbutton[aria-label*=\"Scroll to bottom\" i]:hover {\n  background-color: var(--sk-pop) !important;\n  box-shadow: var(--ag-shadow-float) !important;\n}\n}\n\n\nbutton[aria-label=\"Scroll to Bottom\"] svg,\nbutton[aria-label*=\"Scroll to bottom\" i] svg {\n  color: var(--sk-text) !important;\n}\n\n/* 11.4 悬浮卡与浮窗关闭态即时收起守护：离开时立即隐去，严禁滞留与重叠 */\n[data-base-ui-portal] [data-closed],\n[data-base-ui-portal] [data-closed] *,\n[data-base-ui-portal] [data-ending-style],\n[data-base-ui-portal] [data-ending-style] *,\n[data-base-ui-portal] [data-state=\"closed\"],\n[data-base-ui-portal] [data-state=\"closed\"] *,\n[data-radix-popper-content-wrapper]:has([data-state=\"closed\"]) {\n  opacity: 0 !important;\n  visibility: hidden !important;\n  pointer-events: none !important;\n  transition: opacity 0.08s ease-out !important;\n}\n\n/* === 12. 保护设置面板不被变形 === */\n[role=\"dialog\"] input,\n[role=\"dialog\"] select {\n  border-radius: 6px !important;\n  box-shadow: none !important;\n}\n\n/* === 13. 底部工具栏按钮 === */\n[data-testid=\"model-selector-trigger\"],\n[data-testid=\"permissions-selector-trigger\"] {\n  background: transparent !important;\n  color: var(--sk-text) !important;\n}\n\n/* 发送按钮默认/未激活态（淡雅半透） */\n[data-testid=\"send-button\"],\nbutton[data-tooltip-id*=\"input-send-button\"]:not([aria-label*=\"Cancel\" i]),\nbutton[aria-label*=\"Send\" i] {\n  border-radius: 9999px !important;\n  transition-property: background-color, box-shadow, color !important;\n  transition-duration: 200ms !important;\n  transition-timing-function: ease !important;\n}\n\n[data-testid=\"send-button\"]:disabled,\nbutton[data-tooltip-id*=\"input-send-button\"]:not([aria-label*=\"Cancel\" i]):disabled,\nbutton[aria-label*=\"Send\" i]:disabled {\n  background: color-mix(in srgb, var(--sk-surface) calc(45% * var(--sk-fill, 1)), transparent) !important;\n  color: var(--sk-text-2) !important;\n  opacity: 0.55 !important;\n  border: 1px solid rgba(255, 255, 255, 0.6) !important;\n}\n\n/* 发送按钮激活态（输入内容后：主色实底，白色箭头） */\n[data-testid=\"send-button\"]:not(:disabled),\nbutton[data-tooltip-id*=\"input-send-button\"]:not([aria-label*=\"Cancel\" i]):not(:disabled),\nbutton[aria-label*=\"Send\" i]:not(:disabled) {\n  background: var(--sk-accent) !important;\n  color: #FFFFFF !important;\n  border: 1px solid rgba(255, 255, 255, 0.35) !important;\n  box-shadow: var(--ag-shadow-rest), inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;\n  opacity: 1 !important;\n}\n\n[data-testid=\"send-button\"]:not(:disabled) svg,\nbutton[data-tooltip-id*=\"input-send-button\"]:not([aria-label*=\"Cancel\" i]):not(:disabled) svg,\nbutton[aria-label*=\"Send\" i]:not(:disabled) svg {\n  color: #FFFFFF !important;\n  fill: #FFFFFF !important;\n}\n\n@media (hover: hover) {\n  [data-testid=\"send-button\"]:not(:disabled):hover,\n  button[data-tooltip-id*=\"input-send-button\"]:not([aria-label*=\"Cancel\" i]):not(:disabled):hover,\n  button[aria-label*=\"Send\" i]:not(:disabled):hover {\n    background: var(--sk-accent) !important;\n    box-shadow: inset 0 0 0 100px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;\n  }\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  [data-testid=\"send-button\"]:not(:disabled),\n  button[data-tooltip-id*=\"input-send-button\"]:not([aria-label*=\"Cancel\" i]):not(:disabled),\n  button[aria-label*=\"Send\" i]:not(:disabled) {\n    transition-property: background-color, box-shadow, color, scale !important;\n    transition-duration: 200ms, 200ms, 200ms, 150ms !important;\n    transition-timing-function: ease, ease, ease, ease-out !important;\n  }\n  [data-testid=\"send-button\"]:not(:disabled):active,\n  button[data-tooltip-id*=\"input-send-button\"]:not([aria-label*=\"Cancel\" i]):not(:disabled):active,\n  button[aria-label*=\"Send\" i]:not(:disabled):active {\n    scale: 0.97 !important;\n  }\n}\n\n/* === 14. 全局滑动条：接管客户端原生 [data-testid=\"overlay-scrollbar-thumb\"] ===\n   Antigravity 2.25.0 通过 React Portal 渲染 [data-testid=\"overlay-scrollbar-thumb\"] 浮层滑块，\n   并将浏览器原生 ::-webkit-scrollbar 全量隐藏。\n   这里严禁开启原生 ::-webkit-scrollbar（否则会出现两条并排），\n   而是直接覆写 overlay-scrollbar-thumb 的灰底与 10px 变粗内联样式，实现唯一 5px 浅色主色胶囊。 */\n\n/* 14.1 彻底隐藏侧栏内任何横向滚动条与窗口化 conversation-view 外层滚动 */\n.bg-sidebar *::-webkit-scrollbar:horizontal {\n  display: none !important;\n  height: 0 !important;\n  width: 0 !important;\n}\n\n[data-testid=\"conversation-view\"] {\n  overflow-y: hidden !important;\n  overflow-x: hidden !important;\n  scrollbar-width: none !important;\n}\n[data-testid=\"conversation-view\"]::-webkit-scrollbar {\n  display: none !important;\n  width: 0 !important;\n  height: 0 !important;\n}\n\n/* 14.2 接管客户端全局浮层滑块（overlay-scrollbar-thumb）：常态 5px 环境光中性胶囊 */\n[data-testid=\"overlay-scrollbar\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"] [data-testid=\"overlay-scrollbar-thumb\"] {\n  width: 5px !important;\n  background-color: color-mix(in srgb, var(--sk-text) 28%, transparent) !important;\n  background-image: none !important;\n  border-radius: 9999px !important;\n  transition: background-color 120ms ease !important;\n}\n\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"] [data-testid=\"overlay-scrollbar-thumb\"] {\n  width: auto !important;\n  height: 5px !important;\n  background-color: color-mix(in srgb, var(--sk-text) 28%, transparent) !important;\n  background-image: none !important;\n  border-radius: 9999px !important;\n  transition: background-color 120ms ease !important;\n}\n\n/* 14.3 悬停 / 展开 / 拖拽态：锁死 6px 纤细宽度（禁止 JS 撑成 10px 粗灰条），加深为碧海蓝 */\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-expanded=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-hovered=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"][data-dragging=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"]:hover [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"vertical\"] [data-testid=\"overlay-scrollbar-thumb\"]:hover {\n  width: 6px !important;\n  background-color: color-mix(in srgb, var(--sk-text) 45%, transparent) !important;\n  border-radius: 9999px !important;\n}\n\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-expanded=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-hovered=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"][data-dragging=\"true\"] [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"]:hover [data-testid=\"overlay-scrollbar-thumb\"],\n[data-testid=\"overlay-scrollbar\"][data-orientation=\"horizontal\"] [data-testid=\"overlay-scrollbar-thumb\"]:hover {\n  height: 6px !important;\n  background-color: color-mix(in srgb, var(--sk-text) 45%, transparent) !important;\n  border-radius: 9999px !important;\n}\n\n/* 14.4 表格横向滚动条（.md-table-scroll 为唯一走原生滚动条的组件）同步适配 */\n.md-table-scroll {\n  scrollbar-width: auto !important;\n  scrollbar-color: auto !important;\n}\n.md-table-scroll::-webkit-scrollbar {\n  height: 5px !important;\n  width: 5px !important;\n}\n.md-table-scroll::-webkit-scrollbar-track {\n  background: transparent !important;\n}\n.md-table-scroll::-webkit-scrollbar-thumb {\n  background: color-mix(in srgb, var(--sk-text) 28%, transparent) !important;\n  border: none !important;\n  border-radius: 9999px !important;\n}\n.md-table-scroll::-webkit-scrollbar-thumb:hover,\n.md-table-scroll::-webkit-scrollbar-thumb:active {\n  background: color-mix(in srgb, var(--sk-text) 45%, transparent) !important;\n}\n\n/* === 15. 标签页（Tabs：Review 等）完全对齐原版质感与关闭交互 === */\n\n/* 15.1 标签栏外壳与常规标签：清空原生容器边框，保持通透 */\ndiv:has(> button[data-tab-id]),\ndiv.border-b:has(button[data-tab-id]) {\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n}\n\n/* 15.2 标签本体：未激活态半透/无底色，激活态浮现轻盈磨砂药丸底色（对齐原版激活标签） */\nbutton[data-tab-id] {\n  border: none !important;\n  box-shadow: none !important;\n  color: var(--sk-text) !important;\n  transition: background-color 120ms ease !important;\n}\n\n/* 未激活标签：常态无底色，悬停时微弱光晕反馈 */\nbutton[data-tab-id]:not([class*=\"bg-secondary\"]) {\n  background-color: transparent !important;\n}@media (hover: hover) {\nbutton[data-tab-id]:not([class*=\"bg-secondary\"]):hover {\n  background-color: color-mix(in srgb, var(--sk-surface) calc(22% * var(--sk-fill, 1)), transparent) !important;\n  border-radius: 6px !important;\n}\n}\n\n\n/* 激活标签（bg-secondary）：高质感磨砂白蓝药丸卡片，一眼可辨当前激活项 */\nbutton[data-tab-id][class*=\"bg-secondary\"] {\n  background-color: color-mix(in srgb, var(--sk-surface) calc(62% * var(--sk-fill, 1)), transparent) !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55) !important;\n  border-radius: 6px !important;\n  color: var(--sk-text) !important;\n}\n\n/* 15.3 标签文字安全避让：激活态常态预留 22px，未激活态悬停时预留 22px，长标题平滑打省略号 */\nbutton[data-tab-id][class*=\"bg-secondary\"] div[class*=\"truncate\"],\nbutton[data-tab-id]:hover div[class*=\"truncate\"],\nbutton[data-tab-id]:focus-within div[class*=\"truncate\"] {\n  padding-right: 22px !important;\n}\n\n/* 15.4 关闭按钮容器（绝不被吞掉）：\n   - 激活标签：常态始终 100% 可见！右侧垫一层与药丸底色浑然一体的柔和渐隐，文字自然淡出，叉叉绝对不被遮盖或吞掉；\n   - 未激活标签：常态隐退，悬停时平滑浮现。 */\nbutton[data-tab-id][class*=\"bg-secondary\"] > div[class*=\"absolute\"][class*=\"right-0\"] {\n  opacity: 1 !important;\n  pointer-events: auto !important;\n  background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.88) 32%, rgba(255, 255, 255, 0.95) 100%) !important;\n  border-top-right-radius: 6px !important;\n  border-bottom-right-radius: 6px !important;\n}\n\nbutton[data-tab-id]:not([class*=\"bg-secondary\"]) > div[class*=\"absolute\"][class*=\"right-0\"] {\n  opacity: 0 !important;\n  pointer-events: none !important;\n  background: transparent !important;\n  transition: opacity 120ms ease !important;\n}\n\nbutton[data-tab-id]:not([class*=\"bg-secondary\"]):hover > div[class*=\"absolute\"][class*=\"right-0\"],\nbutton[data-tab-id]:not([class*=\"bg-secondary\"]):focus-within > div[class*=\"absolute\"][class*=\"right-0\"] {\n  opacity: 1 !important;\n  pointer-events: auto !important;\n  background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.88) 32%, rgba(255, 255, 255, 0.95) 100%) !important;\n  border-top-right-radius: 6px !important;\n  border-bottom-right-radius: 6px !important;\n}\n\n/* 15.5 叉叉图标本体按钮：高清晰度深青色 + 悬停微圆角实体反馈（1:1 对齐原版图 1） */\nbutton[data-tab-id] [role=\"button\"] {\n  background: transparent !important;\n  border-radius: 6px !important;\n  color: var(--sk-text) !important;\n  opacity: 0.85 !important;\n  transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease, opacity 120ms ease !important;\n}@media (hover: hover) {\nbutton[data-tab-id] [role=\"button\"]:hover {\n  background: color-mix(in srgb, var(--sk-surface) calc(65% * var(--sk-fill, 1)), transparent) !important;\n  color: var(--sk-text) !important;\n  opacity: 1 !important;\n  box-shadow: var(--ag-shadow-rest) !important;\n}\n}\n\n\n/* 15.6 新增标签按钮 [+] 微调 */\nbutton[data-testid=\"aux-pane-new-tab-button\"] {\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  color: var(--sk-text) !important;\n}@media (hover: hover) {\nbutton[data-testid=\"aux-pane-new-tab-button\"]:hover {\n  background-color: color-mix(in srgb, var(--sk-surface) calc(22% * var(--sk-fill, 1)), transparent) !important;\n  border-radius: 6px !important;\n}\n}\n\n\n/* === 16. 图片与图表查看模态（Media Modal / Mermaid Lightbox）：顶部居中悬浮胶囊坞 + 底部缩放胶囊 ===\n   要点：胶囊坞用 absolute 定位（包含块 = 全屏 media-modal），绝不使用 fixed，\n   避免祖先 transform / filter 造成包含块漂移、胶囊被裁到视口外而\"消失\"。 */\n[data-testid=\"media-modal\"],\ndiv[class*=\"animate-backdropFadeIn\"]:has(~ div [data-testid=\"mermaid-lightbox-viewport\"]),\ndiv[class*=\"animate-backdropFadeIn\"]:has(~ * [data-testid=\"mermaid-lightbox-viewport\"]) {\n  position: fixed !important;\n  top: 0 !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  inset: 0 !important;\n  background-color: var(--media-modal-bg, var(--sk-sidebar)) !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  opacity: 1 !important;\n  z-index: 5000 !important;\n}\n\ndiv[class*=\"animate-modalFadeIn\"]:has([data-testid=\"mermaid-lightbox-viewport\"]) {\n  position: fixed !important;\n  top: 0 !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  inset: 0 !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  z-index: 5001 !important;\n}\n\n[data-testid=\"mermaid-lightbox-viewport\"] {\n  background-color: var(--sk-pop) !important;\n  box-shadow: var(--ag-shadow-float) !important;\n}\n\n[data-testid=\"media-modal-header\"] {\n  position: absolute !important;\n  top: 18px !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: auto !important;\n  width: auto !important;\n  height: auto !important;\n  padding: 0 !important;\n  margin: 0 !important;\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  transform: none !important;\n  z-index: 100 !important;\n  pointer-events: none !important;\n}\n\n/* 胶囊本体：浅色毛玻璃，图标走主题前景色（不再是死黑药丸） */\n[data-testid=\"media-modal-header\"] > div {\n  pointer-events: auto !important;\n  display: inline-flex !important;\n  align-items: center !important;\n  height: 40px !important;\n  box-sizing: border-box !important;\n  gap: 4px !important;\n  padding: 0 8px !important;\n  background: var(--media-capsule-bg, rgba(255, 255, 255, 0.90)) !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n  border: 1px solid var(--media-capsule-border, rgba(0, 0, 0, 0.08)) !important;\n  border-radius: 9999px !important;\n  box-shadow: var(--media-capsule-shadow) !important;\n}\n\n[data-testid=\"media-modal-header\"] button {\n  background: transparent !important;\n  background-color: transparent !important;\n  color: var(--foreground, var(--sk-text)) !important;\n  width: 30px !important;\n  height: 30px !important;\n  padding: 0 !important;\n  border: none !important;\n  border-radius: 9999px !important;\n  box-shadow: none !important;\n  display: inline-flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  cursor: pointer !important;\n  transition: background-color 120ms ease !important;\n}@media (hover: hover) {\n[data-testid=\"media-modal-header\"] button:hover {\n  background: var(--media-capsule-hover, rgba(0, 0, 0, 0.06)) !important;\n}\n}\n\n\n[data-testid=\"media-modal-header\"] button:active {\n  background: var(--media-capsule-hover, rgba(0, 0, 0, 0.10)) !important;\n}\n\n[data-testid=\"media-modal-header\"] button svg {\n  width: 18px !important;\n  height: 18px !important;\n  color: inherit !important;\n  fill: currentColor !important;\n}\n\n/* 底部缩放胶囊：精确命中 zoom-controls，绝不泛化 :has() 误伤其它浮层 */\n[data-testid=\"media-modal-zoom-controls\"] {\n  height: 40px !important;\n  box-sizing: border-box !important;\n  gap: 2px !important;\n  padding: 0 8px !important;\n  background: var(--media-capsule-bg, rgba(255, 255, 255, 0.90)) !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n  border: 1px solid var(--media-capsule-border, rgba(0, 0, 0, 0.08)) !important;\n  border-radius: 9999px !important;\n  box-shadow: var(--media-capsule-shadow) !important;\n}\n\n[data-testid=\"media-modal-zoom-controls\"] button {\n  background: transparent !important;\n  color: var(--foreground, var(--sk-text)) !important;\n  border: none !important;\n  box-shadow: none !important;\n  border-radius: 9999px !important;\n}@media (hover: hover) {\n[data-testid=\"media-modal-zoom-controls\"] button:hover {\n  background: var(--media-capsule-hover, rgba(0, 0, 0, 0.06)) !important;\n}\n}\n\n\n[data-testid=\"media-modal-zoom-controls\"] button svg {\n  color: inherit !important;\n  fill: currentColor !important;\n}\n\n/* 缩放百分比文字：高对比度、加粗，彻底根除发白不可见 */\n[data-testid=\"media-modal-zoom-reset\"] {\n  color: var(--foreground, var(--sk-text)) !important;\n  font-weight: 600 !important;\n  font-size: 12px !important;\n  font-variant-numeric: tabular-nums !important;\n  opacity: 1 !important;\n}\n\n/* === 17. 页面吸顶标头与搜索区（Conversation History、Customizations 等）：视口固定渐变实底遮罩 ===\n   修复吸顶标头因 --background 为 transparent 导致的滚动文字/卡片穿透重叠 */\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(> h1),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(> div > h1),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(input[data-testid=\"history-search-input\"]),\ndiv[class*=\"sticky\"][class*=\"top-0\"]:has(input[data-testid=\"customizations-search\"]) {\n  background-color: var(--sk-pop) !important;\n  background-image: var(--ag-mesh) !important;\n  background-attachment: fixed !important;\n  background-position: 0 0 !important;\n  background-size: 100vw 100vh !important;\n  background-repeat: no-repeat !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n}\n\n/* 历史记录与插件页面内搜索框：柔白微实底与精致描边，不透底 */\ndiv:has(> input[data-testid=\"history-search-input\"]),\ndiv:has(> input[data-testid=\"customizations-search\"]) {\n  background: color-mix(in srgb, var(--sk-surface) calc(82% * var(--sk-fill, 1)), transparent) !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n  border: 1px solid rgba(255, 255, 255, 0.95) !important;\n  border-radius: 8px !important;\n  box-shadow: var(--ag-shadow-rest) !important;\n}\n\ndiv:has(> input[data-testid=\"history-search-input\"]):focus-within,\ndiv:has(> input[data-testid=\"customizations-search\"]):focus-within {\n  background: color-mix(in srgb, var(--sk-surface) calc(95% * var(--sk-fill, 1)), transparent) !important;\n  border-color: var(--sk-accent) !important;\n  box-shadow: var(--ag-shadow-focus) !important;\n}\n\n/* 历史记录页废弃提示条（This page is going away soon）：柔白实底微卡，不透底 */\n/* 排除用户消息气泡内的操作浮条（同样是 bg-card + svg，但绝不能被当成提示条套白框） */\ndiv[class*=\"sticky\"][class*=\"top-0\"] div[class*=\"bg-card\"]:has(svg):not([class*=\"user-input-buttons-container\"]) {\n  background-color: color-mix(in srgb, var(--sk-surface) calc(88% * var(--sk-fill, 1)), transparent) !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n  border: 1px solid rgba(0, 0, 0, 0.10) !important;\n  border-radius: 12px !important;\n  box-shadow: var(--ag-shadow-rest) !important;\n}\n\n/* === 18. 交互问答卡片（ask_question 仅对选中项高亮）：浅色选中细条 ===\n   修复原因：主题全局将 --secondary 置为 transparent，导致选项选中时无法区分。\n   规范要求：仅当选项被点击选中时显示高亮变化；未选中的选项不添加任何规则，100% 保持原有外观。 */\n\n/* 18.1 仅选中态（Checked / Selected）：整行显现中性底加主色细条胶囊背景与发丝描边 */\nlabel[data-testid=\"ask-question-option\"]:has(input:checked),\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"],\nlabel:has(> textarea[data-testid=\"ask-question-writein\"]):has(input:checked),\nlabel:has(> textarea[data-testid=\"ask-question-writein\"])[class~=\"bg-secondary\"],\nlabel:has(> div > textarea[data-testid=\"ask-question-writein\"]):has(input:checked),\nlabel:has(> div > textarea[data-testid=\"ask-question-writein\"])[class~=\"bg-secondary\"],\nlabel[for*=\"__write_in__\"]:has(input:checked),\nlabel[for*=\"__write_in__\"][class~=\"bg-secondary\"] {\n  background-color: rgba(0, 0, 0, 0.04) !important;\n  border-color: var(--sk-line) !important;\n  box-shadow: inset 2px 0 0 var(--sk-accent) !important;\n}\n\n/* 18.2 仅选中态下的序号徽标：选中序号（未选中的序号不作任何修改） */\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) div[class*=\"bg-border\"],\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"],\nlabel[for*=\"__write_in__\"]:has(input:checked) div[class*=\"bg-border\"],\nlabel[for*=\"__write_in__\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"] {\n  background-color: transparent !important;\n}\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) div[class*=\"bg-border\"] span,\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"] span,\nlabel[for*=\"__write_in__\"]:has(input:checked) div[class*=\"bg-border\"] span,\nlabel[for*=\"__write_in__\"][class~=\"bg-secondary\"] div[class*=\"bg-border\"] span {\n  color: var(--sk-text) !important;\n  font-weight: 700 !important;\n}\n\n/* 18.3 仅选中态下的选项文字：正文色加粗清晰显现 */\nlabel[data-testid=\"ask-question-option\"]:has(input:checked) [data-testid=\"ask-question-option-text\"],\nlabel[data-testid=\"ask-question-option\"][class~=\"bg-secondary\"] [data-testid=\"ask-question-option-text\"] {\n  color: var(--sk-text) !important;\n  font-weight: 600 !important;\n}\n\n\n\n\n\n\n\n\n/* === 19.  经典排版字体栈（Tiempos / Charter / Iowan / JetBrains Mono） === */\n.select-text p,\n.select-text li,\n.select-text blockquote,\n[class*=\"leading-relaxed\"] p,\n[class*=\"leading-relaxed\"] li {\n  font-family: \"PingFang SC\", \"PingFangSC-Regular\", \"PingFangSC\", \"苹方-简\", \"苹方\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif !important;\n  line-height: 1.6 !important;\n  letter-spacing: 0 !important;\n  font-size: 15px !important;\n  text-wrap: pretty !important;\n}\n\n.select-text h1, .select-text h2, .select-text h3, .select-text h4,\n[class*=\"leading-relaxed\"] h1, [class*=\"leading-relaxed\"] h2, [class*=\"leading-relaxed\"] h3 {\n  font-family: \"PingFang SC\", \"PingFangSC-Semibold\", \"PingFangSC-Medium\", \"PingFangSC\", \"苹方-简\", \"苹方\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif !important;\n  font-weight: 600 !important;\n  letter-spacing: 0 !important;\n  line-height: 1.3 !important;\n}\n\npre, code, kbd, samp,\npre code,\n[class*=\"font-mono\"],\n[class*=\"text-code\"] {\n  font-family: \"JetBrains Mono\", \"Fira Code\", \"SF Mono\", Menlo, Monaco, Consolas, monospace !important;\n  font-size: 13px !important;\n}\n\nbutton, input, textarea,\n.bg-sidebar,\n[data-testid=\"pane-titlebar-toolbar\"] {\n  font-family: \"PingFang SC\", \"PingFangSC-Regular\", \"PingFangSC\", \"苹方-简\", \"苹方\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif !important;\n}\n\n\n/* === 20.  极致视觉交互打磨包 === */\n/* 1. 划词高亮：主色半透选区 */\n::selection {\n  background-color: color-mix(in srgb, var(--sk-accent) 18%, transparent) !important;\n  color: inherit !important;\n}\n::-moz-selection {\n  background-color: color-mix(in srgb, var(--sk-accent) 18%, transparent) !important;\n  color: inherit !important;\n}\n\n/* 2. 出版级 Markdown 表格 */\n.select-text table,\n[class*=\"leading-relaxed\"] table {\n  width: 100% !important;\n  border-collapse: separate !important;\n  border-spacing: 0 !important;\n  margin: 14px 0 !important;\n  border: 1px solid var(--sk-line) !important;\n  border-radius: 12px !important;\n  overflow: hidden !important;\n  background: color-mix(in srgb, var(--sk-surface) calc(65% * var(--sk-fill, 1)), transparent) !important;\n  box-shadow: var(--ag-shadow-rest) !important;\n}\n.select-text th,\n[class*=\"leading-relaxed\"] th {\n  background: var(--sk-base) !important;\n  color: var(--sk-text) !important;\n  font-weight: 600 !important;\n  padding: 10px 14px !important;\n  border-bottom: 1.5px solid var(--sk-line) !important;\n  text-align: start !important;\n  font-size: 14px !important;\n}\n.select-text td,\n[class*=\"leading-relaxed\"] td {\n  padding: 8px 14px !important;\n  border-bottom: 1px solid color-mix(in srgb, var(--sk-line) 90%, transparent) !important;\n  color: var(--sk-text) !important;\n  font-size: 14px !important;\n}\n.select-text tr:last-child td,\n[class*=\"leading-relaxed\"] tr:last-child td {\n  border-bottom: none !important;\n}\n.select-text tr:nth-child(even) td,\n[class*=\"leading-relaxed\"] tr:nth-child(even) td {\n  background: rgba(0, 0, 0, 0.03) !important;\n}\n\n/* 3. 典雅引用块与警示框 */\n.select-text blockquote,\n[class*=\"leading-relaxed\"] blockquote {\n  margin: 12px 0 !important;\n  padding: 10px 16px !important;\n  border-left: 2px solid var(--sk-line) !important;\n  border-radius: 0 8px 8px 0 !important;\n  background: rgba(0, 0, 0, 0.03) !important;\n  color: var(--sk-text) !important;\n}\n\n/* 4. Composer 输入框聚焦呼吸光晕 */\ndiv[class*=\"bg-card-border\"]:has([contenteditable=\"true\"]):focus-within,\ndiv[class*=\"bg-card-border\"]:has(textarea):focus-within {\n  border-color: var(--sk-accent) !important;\n  box-shadow: var(--ag-shadow-focus), var(--ag-shadow-card) !important;\n  transition: border-color 240ms ease, box-shadow 240ms ease !important;\n}\n\n/* 5. 行内代码质感 */\n.select-text code:not(pre code),\n[class*=\"leading-relaxed\"] code:not(pre code) {\n  background: rgba(0, 0, 0, 0.04) !important;\n  color: var(--sk-text) !important;\n  padding: 2px 6px !important;\n  border-radius: 6px !important;\n  border: 1px solid var(--sk-line) !important;\n  font-size: 0.88em !important;\n}\n\n/* === 21. 克制动效 ===\n   色：240ms ease。悬停底：120ms。位移 / 缩放 / 环境光只在 no-preference。\n   reduced-motion 下降为瞬时，或只留透明度。 */\n.bg-sidebar [data-testid^=\"conversation-row-\"] {\n  transition-property: background-color, box-shadow, color;\n  transition-duration: 120ms, 200ms, 200ms;\n  transition-timing-function: ease;\n}\n\nhtml,\nbody,\n.bg-sidebar,\n[data-testid=\"title-menu-bar\"],\ndiv[class*=\"bg-card-border\"]:has([contenteditable=\"true\"]),\ndiv[class*=\"bg-card-border\"]:has(textarea) {\n  transition-property: background-color, border-color, color;\n  transition-duration: 240ms;\n  transition-timing-function: ease;\n}\n\n@media (hover: hover) {\n  .bg-sidebar button,\n  .bg-sidebar [role=\"button\"],\n  [data-testid=\"title-menu-bar\"] [data-testid=\"title-menu-bar-item\"],\n  [data-testid=\"title-menu-bar\"] button,\n  button[data-tab-id],\n  [role=\"menuitem\"],\n  [role=\"option\"] {\n    transition-property: background-color, border-color, color, box-shadow;\n    transition-duration: 120ms;\n    transition-timing-function: ease;\n  }\n}\n\n[role=\"menu\"],\n[role=\"dialog\"],\ndiv[data-mention-menu],\n#antigravity-theme-dropdown {\n  overscroll-behavior: contain;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  html {\n    animation: ag-ambient 36s ease-in-out infinite alternate;\n  }\n  #antigravity-theme-dropdown,\n  div[data-mention-menu],\n  [role=\"menu\"],\n  [data-radix-menu-content] {\n    animation: ag-rise 160ms cubic-bezier(0.2, 0, 0, 1) backwards;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  #antigravity-theme-dropdown,\n  div[data-mention-menu],\n  [role=\"menu\"],\n  [data-radix-menu-content] {\n    animation: ag-fade 120ms ease-out backwards;\n  }\n}\n\n@keyframes ag-ambient {\n  from { background-position: 0% 0%, 100% 0%, 0 0; }\n  to { background-position: 6% 2%, 94% -1%, 0 0; }\n}\n@keyframes ag-rise {\n  from { opacity: 0; translate: 0 4px; }\n  to { opacity: 1; translate: 0 0; }\n}\n@keyframes ag-fade {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n/* 主题切换当帧关掉过渡，避免整页颜色拖影 */\nhtml.ag-theme-switching,\nhtml.ag-theme-switching * {\n  transition: none !important;\n  animation: none !important;\n}\n\n/* === 材质与壁纸（studio 写入 html 的 data-sk-* 与内联变量；只随自定义皮肤注入） ===\n   - 顶部 35px 标题带保持实色：它与 Windows 原生按钮区同色（--sidebar 只能是不透明实色）\n   - 壁纸层 #sk-wall 固定在标题带下方，z-index:-1 落在 body 内容之后、html 底漆之上 */\n\n#sk-wall {\n  position: fixed;\n  inset: 35px 0 0 0;\n  z-index: -1;\n  pointer-events: none;\n  overflow: hidden;\n  display: none;\n  contain: strict;\n}\nhtml[data-sk-wall] #sk-wall { display: block; }\n#sk-wall .sk-wall-img {\n  position: absolute;\n  inset: calc(var(--sk-wall-blur, 0px) * -2);\n  background: var(--sk-wall-bg, none);\n  background-position: var(--sk-wall-pos, center);\n  background-size: var(--sk-wall-size, cover);\n  background-repeat: no-repeat;\n  filter: blur(var(--sk-wall-blur, 0px));\n  transform: translateZ(0);\n}\n#sk-wall .sk-wall-veil {\n  position: absolute;\n  inset: 0;\n  background: var(--sk-base);\n  opacity: var(--sk-wall-veil, 0.4);\n}\n\n/* 有壁纸时：纵向侧栏与吸顶标头改成玻璃，让壁纸透出来 */\nhtml[data-sk-wall] div[class*=\"flex-col\"][class*=\"bg-sidebar\"]:not(div[class*=\"flex-col\"][class*=\"bg-sidebar\"] *) {\n  background-color: color-mix(in srgb, var(--sk-sidebar) calc(72% * var(--sk-fill, 1)), transparent) !important;\n  background-image: none !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n  border-right-color: color-mix(in srgb, var(--sk-line) 70%, transparent) !important;\n}\nhtml[data-sk-wall] div[class*=\"sticky\"][class*=\"top-0\"]:has(input[data-testid=\"customizations-search\"]) {\n  background-color: color-mix(in srgb, var(--sk-base) 78%, transparent) !important;\n  background-image: none !important;\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n}\n\n/* 玻璃材质：浮层、菜单、下拉跟着磨砂 */\nhtml[data-sk-glass] :is([role=\"menu\"], [role=\"listbox\"], [data-radix-popper-content-wrapper] > [data-side], [data-base-ui-portal] [data-side], div[data-mention-menu]) {\n  backdrop-filter: var(--sk-filter) !important;\n  -webkit-backdrop-filter: var(--sk-filter) !important;\n}\n\n/* 选区跟随强调色 */\n::selection { background: color-mix(in srgb, var(--sk-accent) 22%, transparent); }\n\n/* 主按钮按下的物理反馈（减少动效时不做） */\n@media (prefers-reduced-motion: no-preference) {\n  html:not([data-sk-motion=\"off\"]) button[class*=\"bg-primary\"]:not(:disabled):active {\n    transform: scale(0.97);\n    transition: transform 120ms var(--sk-ease-out, ease-out);\n  }\n}\n";
        return [{"id":"aluminum","name":"铝灰","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0.5\" y=\"0.5\" width=\"15\" height=\"15\" rx=\"4\" fill=\"#F5F5F7\" stroke=\"#E3E3E8\"/><circle cx=\"8\" cy=\"8\" r=\"2.5\" fill=\"#0071E3\"/></svg>","titlebarColor":"#FBFBFD","symbolColor":"#1D1D1F","tokens":":root {\n  --sk-base: #F5F5F7;\n  --sk-base-2: #F7F7F9;\n  --sk-sidebar: #FBFBFD;\n  --sk-text: #1D1D1F;\n  --sk-text-2: #6E6E73;\n  --sk-line: #E3E3E8;\n  --sk-accent: #0071E3;\n  --sk-surface: #FFFFFF;\n  --sk-pop: var(--sk-surface);\n  --sk-fill: 1;\n  --sk-filter: blur(20px) saturate(1.8);\n}\n"},{"id":"porcelain","name":"瓷白","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0.5\" y=\"0.5\" width=\"15\" height=\"15\" rx=\"4\" fill=\"#FAFAFA\" stroke=\"#EBEBEB\"/><circle cx=\"8\" cy=\"8\" r=\"2.5\" fill=\"#171717\"/></svg>","titlebarColor":"#FFFFFF","symbolColor":"#171717","tokens":":root {\n  --sk-base: #FAFAFA;\n  --sk-base-2: #FCFCFC;\n  --sk-sidebar: #FFFFFF;\n  --sk-text: #171717;\n  --sk-text-2: #666666;\n  --sk-line: #EBEBEB;\n  --sk-accent: #171717;\n  --sk-surface: #FFFFFF;\n  --sk-pop: var(--sk-surface);\n  --sk-fill: 1;\n  --sk-filter: blur(20px) saturate(1.8);\n}\n"},{"id":"fog","name":"雾蓝","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0.5\" y=\"0.5\" width=\"15\" height=\"15\" rx=\"4\" fill=\"#F2F5F9\" stroke=\"#DEE4EC\"/><circle cx=\"8\" cy=\"8\" r=\"2.5\" fill=\"#3157D5\"/></svg>","titlebarColor":"#FAFBFD","symbolColor":"#16202E","tokens":":root {\n  --sk-base: #F2F5F9;\n  --sk-base-2: #F5F7FB;\n  --sk-sidebar: #FAFBFD;\n  --sk-text: #16202E;\n  --sk-text-2: #5B6778;\n  --sk-line: #DEE4EC;\n  --sk-accent: #3157D5;\n  --sk-surface: #FFFFFF;\n  --sk-pop: var(--sk-surface);\n  --sk-fill: 1;\n  --sk-filter: blur(20px) saturate(1.8);\n}\n"},{"id":"sand","name":"沙岩","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0.5\" y=\"0.5\" width=\"15\" height=\"15\" rx=\"4\" fill=\"#F6F4F0\" stroke=\"#E6E1D9\"/><circle cx=\"8\" cy=\"8\" r=\"2.5\" fill=\"#A4492A\"/></svg>","titlebarColor":"#FCFBF9","symbolColor":"#252321","tokens":":root {\n  --sk-base: #F6F4F0;\n  --sk-base-2: #F8F6F3;\n  --sk-sidebar: #FCFBF9;\n  --sk-text: #252321;\n  --sk-text-2: #6B665F;\n  --sk-line: #E6E1D9;\n  --sk-accent: #A4492A;\n  --sk-surface: #FFFFFF;\n  --sk-pop: var(--sk-surface);\n  --sk-fill: 1;\n  --sk-filter: blur(20px) saturate(1.8);\n}\n"},{"id":"sage","name":"苔绿","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0.5\" y=\"0.5\" width=\"15\" height=\"15\" rx=\"4\" fill=\"#F3F6F4\" stroke=\"#DBE3DE\"/><circle cx=\"8\" cy=\"8\" r=\"2.5\" fill=\"#2B7556\"/></svg>","titlebarColor":"#FBFCFB","symbolColor":"#18231E","tokens":":root {\n  --sk-base: #F3F6F4;\n  --sk-base-2: #F6F8F6;\n  --sk-sidebar: #FBFCFB;\n  --sk-text: #18231E;\n  --sk-text-2: #5A6962;\n  --sk-line: #DBE3DE;\n  --sk-accent: #2B7556;\n  --sk-surface: #FFFFFF;\n  --sk-pop: var(--sk-surface);\n  --sk-fill: 1;\n  --sk-filter: blur(20px) saturate(1.8);\n}\n"}].map((t) => Object.assign(t, { css: t.tokens + SKIN_BASE_CSS })).concat([{"id":"stock","name":"官方原版","icon":"<svg width=\"15\" height=\"15\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0.5\" y=\"0.5\" width=\"15\" height=\"15\" rx=\"4\" fill=\"#F3F3F3\" stroke=\"#D4D4D4\"/><circle cx=\"8\" cy=\"8\" r=\"2.5\" fill=\"#007ACC\"/></svg>","titlebarColor":"#F3F3F3","symbolColor":"#1B2A4A","css":"/* === 官方原版：看图与流程图模态实底化（右上角系统按钮区同色贴合的取色来源） === */\nbody.theme-light [data-testid=\"media-modal\"],\nbody:not(.dark):not(.theme-dark):not(.dark-theme) [data-testid=\"media-modal\"],\nbody.theme-light div[class*=\"animate-backdropFadeIn\"]:has(~ div [data-testid=\"mermaid-lightbox-viewport\"]),\nbody.theme-light div[class*=\"animate-backdropFadeIn\"]:has(~ * [data-testid=\"mermaid-lightbox-viewport\"]),\nbody:not(.dark):not(.theme-dark):not(.dark-theme) div[class*=\"animate-backdropFadeIn\"]:has(~ div [data-testid=\"mermaid-lightbox-viewport\"]),\nbody:not(.dark):not(.theme-dark):not(.dark-theme) div[class*=\"animate-backdropFadeIn\"]:has(~ * [data-testid=\"mermaid-lightbox-viewport\"]) {\n  position: fixed !important;\n  top: 0 !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  inset: 0 !important;\n  background-color: #E4E4E7 !important;\n  opacity: 1 !important;\n  z-index: 5000 !important;\n}\nbody.theme-light div[class*=\"animate-modalFadeIn\"]:has([data-testid=\"mermaid-lightbox-viewport\"]),\nbody:not(.dark):not(.theme-dark):not(.dark-theme) div[class*=\"animate-modalFadeIn\"]:has([data-testid=\"mermaid-lightbox-viewport\"]) {\n  position: fixed !important;\n  top: 0 !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  inset: 0 !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  z-index: 5001 !important;\n}\nbody.theme-dark [data-testid=\"media-modal\"],\nbody.dark [data-testid=\"media-modal\"],\nbody.dark-theme [data-testid=\"media-modal\"],\nbody.theme-dark div[class*=\"animate-backdropFadeIn\"]:has(~ div [data-testid=\"mermaid-lightbox-viewport\"]),\nbody.theme-dark div[class*=\"animate-backdropFadeIn\"]:has(~ * [data-testid=\"mermaid-lightbox-viewport\"]),\nbody.dark div[class*=\"animate-backdropFadeIn\"]:has(~ div [data-testid=\"mermaid-lightbox-viewport\"]),\nbody.dark div[class*=\"animate-backdropFadeIn\"]:has(~ * [data-testid=\"mermaid-lightbox-viewport\"]),\nbody.dark-theme div[class*=\"animate-backdropFadeIn\"]:has(~ div [data-testid=\"mermaid-lightbox-viewport\"]),\nbody.dark-theme div[class*=\"animate-backdropFadeIn\"]:has(~ * [data-testid=\"mermaid-lightbox-viewport\"]) {\n  position: fixed !important;\n  top: 0 !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  inset: 0 !important;\n  background-color: #18181B !important;\n  opacity: 1 !important;\n  z-index: 5000 !important;\n}\nbody.theme-dark div[class*=\"animate-modalFadeIn\"]:has([data-testid=\"mermaid-lightbox-viewport\"]),\nbody.dark div[class*=\"animate-modalFadeIn\"]:has([data-testid=\"mermaid-lightbox-viewport\"]),\nbody.dark-theme div[class*=\"animate-modalFadeIn\"]:has([data-testid=\"mermaid-lightbox-viewport\"]) {\n  position: fixed !important;\n  top: 0 !important;\n  left: 0 !important;\n  right: 0 !important;\n  bottom: 0 !important;\n  inset: 0 !important;\n  background: transparent !important;\n  background-color: transparent !important;\n  z-index: 5001 !important;\n}\n"}]);
    })();

const THEME_PREF_KEY = 'custom-theme-id';

    // 启动偏好：asar 钩子 / 守护进程在本脚本前注入 window.__agThemeBoot（来自 boot.json 与 wall.webp）。
    // 页面端口每次启动都变，localStorage 总是空的；先用它填上，第一帧就是保存的皮肤，不用等 nativeStorage。
    const BOOT = (window.__agThemeBoot && typeof window.__agThemeBoot === 'object') ? window.__agThemeBoot : {};
    window.__agThemeBootLoaded = !!(BOOT.theme || BOOT.studio);
    try {
        if (BOOT.theme && !localStorage.getItem('antigravity_selected_theme')) localStorage.setItem('antigravity_selected_theme', BOOT.theme);
        if (BOOT.studio && !localStorage.getItem('custom-theme-studio')) localStorage.setItem('custom-theme-studio', JSON.stringify(BOOT.studio));
    } catch (e) {}

    let lastActiveId = null;
    let lastIsDark = null;
    let lastAppliedOverlay = null;
    let modalChromeActive = false;
    let modalChromeThemeId = null;

    function saveThemePref(themeId, persistNative) {
        try {
            localStorage.setItem('antigravity_selected_theme', themeId);
        } catch (e) {}
        if (persistNative === false) return;
        try {
            if (window.nativeStorage && typeof window.nativeStorage.updateItems === 'function') {
                Promise.resolve(window.nativeStorage.updateItems({ [THEME_PREF_KEY]: themeId })).catch(() => {});
            }
        } catch (e) {}
    }

    // 实际生效主题 ID（首次应用完成前回落到持久化读取）
    function activeThemeId() {
        return lastActiveId || getActiveThemeId();
    }

    // 启动校准：以 nativeStorage 主存为准，仅当为合法主题 ID 且与当前已应用主题不同时切换
    function resolveThemeId(id) {
        if (id && THEMES.some((t) => t.id === id)) return id;
        return 'aluminum';
    }

    function reconcileThemePref() {
        try {
            if (!(window.nativeStorage && typeof window.nativeStorage.getItems === 'function')) return;
            Promise.resolve(window.nativeStorage.getItems()).then((items) => {
                const savedRaw = items ? items[THEME_PREF_KEY] : null;
                if (!savedRaw) return;
                const saved = resolveThemeId(savedRaw);
                if (saved !== savedRaw) saveThemePref(saved, true);
                if (saved !== lastActiveId) applyTheme(saved);
            }).catch(() => {});
        } catch (e) {}
    }
    // React 会在模态挂载后再次改写标题栏颜色，必须周期性重新确认，否则会被覆盖回原色
    let modalChromeTimer = null;

    // 检测是否处于深色模式（Antigravity 客户端在 document.body 上切换 dark / dark-theme / theme-dark）
    function isDarkMode() {
        return document.body.classList.contains('dark') ||
               document.body.classList.contains('theme-dark') ||
               document.body.classList.contains('dark-theme') ||
               document.documentElement.classList.contains('dark') ||
               document.documentElement.classList.contains('theme-dark');
    }

    // 获取当前激活主题 ID（安全持久化）
    function getActiveThemeId() {
        try {
            return resolveThemeId(localStorage.getItem('antigravity_selected_theme'));
        } catch (e) {
            return 'aluminum';
        }
    }

    function getTheme(id) {
        return THEMES.find((t) => t.id === resolveThemeId(id)) || THEMES[0];
    }

    // 把任意 CSS 颜色解析为 [r,g,b,a]
    function parseCssColor(str) {
        if (!str || str === 'none' || str === 'transparent') return null;
        let m = str.match(/^#([0-9a-fA-F]{3,8})$/);
        if (m) {
            let h = m[1];
            if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
            if (h.length === 6) return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 1];
        }
        m = str.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/);
        if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
        m = str.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
        if (m) return [Math.round(+m[1]*255), Math.round(+m[2]*255), Math.round(+m[3]*255), 1];
        return null;
    }

    function toHex(r, g, b) {
        return '#' + [r,g,b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join('');
    }

    // 依据底色亮度挑选对比色（深底配浅符号，浅底配深符号）
    function contrastColor(hex) {
        const c = parseCssColor(hex);
        if (!c) return '#1B2A4A';
        const lum = (0.299*c[0] + 0.587*c[1] + 0.114*c[2]) / 255;
        return lum > 0.55 ? '#1B2A4A' : '#FFFFFF';
    }

    // 动态提取宿主真实未偏色的 CSS 变量十六进制色值（1:1 复刻 Antigravity 官方 main.js 的 Bvb 取色算法）
    function readCssVarHex(varName, fallback) {
        try {
            const el = document.createElement('div');
            el.style.color = `var(${varName})`;
            el.style.display = 'none';
            document.body.appendChild(el);
            const computed = getComputedStyle(el).color;
            el.remove();
            const srgbMatch = computed.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
            if (srgbMatch) {
                const r = Math.round(parseFloat(srgbMatch[1]) * 255);
                const g = Math.round(parseFloat(srgbMatch[2]) * 255);
                const b = Math.round(parseFloat(srgbMatch[3]) * 255);
                return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            }
            const rgbMatch = computed.match(/rgba?\(([\d]+),\s*([\d]+),\s*([\d]+)/);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[1], 10);
                const g = parseInt(rgbMatch[2], 10);
                const b = parseInt(rgbMatch[3], 10);
                return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            }
        } catch (e) {}
        return fallback;
    }

    // 动态应用主题样式（persistNative=false 用于启动首次应用：不回写主存，
    // 避免把 localStorage 缺失时的回退值覆盖到真实偏好上）
    function applyTheme(themeId, persistNative) {
        const theme = getTheme(themeId);
        const prevId = lastActiveId;
        saveThemePref(theme.id, persistNative);

        let styleEl = document.getElementById('antigravity-active-theme');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'antigravity-active-theme';
            (document.head || document.documentElement).appendChild(styleEl);
        }
        document.documentElement.classList.add('ag-theme-switching');
        styleEl.textContent = theme.css;
        const releaseThemeSwitch = () => document.documentElement.classList.remove('ag-theme-switching');
        requestAnimationFrame(() => requestAnimationFrame(releaseThemeSwitch));
        setTimeout(releaseThemeSwitch, 80);

        const retiredThemeClasses = [
            'theme-claude', 'theme-claude-dark',
            'theme-graphite-light', 'theme-graphite-dark',
            'theme-warm-rice', 'theme-paper', 'theme-cloud', 'theme-celadon',
            'theme-skin', ...THEMES.map((t) => 'theme-' + t.id)
        ];
        document.documentElement.classList.remove(...retiredThemeClasses);
        document.body.classList.remove(...retiredThemeClasses);
        if (theme.id !== 'stock') {
            document.body.classList.add('theme-skin', 'theme-' + theme.id);
        }

        lastActiveId = theme.id;
        lastIsDark = isDarkMode();

        // 仅在自定义主题之间切换或从自定义主题切回原版时执行标题栏色彩校准；
        // 若初次加载本就是官方原版，则完全不插手，留给官方原生代码处理
        if (theme.id !== 'stock' || (prevId && prevId !== 'stock')) {
            enforceTitleBarColor(true);
        }

        studioApply();
        // 主题切换时若正在看图，立即重算系统按钮区同色
        syncModalChrome();
    }

    // 强制校准原生标题栏覆盖色（防御 React 挂载后重设为纯白，浅色主题坚决防死黑）
    function enforceTitleBarColor(force = false) {
        const activeId = activeThemeId();
        if (activeId === 'stock') {
            // 官方原版：日常运行与刷新完全由官方原生接管，0 干预；
            // 仅在从自定义主题刚切回原版时（force === true），调用一次官方算法重置
            if (force) {
                const isDark = isDarkMode();
                const color = readCssVarHex('--sidebar', isDark ? '#161616' : '#f2f2f2');
                const symbolColor = readCssVarHex('--foreground', isDark ? '#cccccc' : '#101010');
                if (!lastAppliedOverlay || lastAppliedOverlay.color !== color || lastAppliedOverlay.symbolColor !== symbolColor) {
                    lastAppliedOverlay = { color: color, symbolColor: symbolColor, height: 30 };
                    window.electronNative?.setTitleBarOverlay?.(lastAppliedOverlay);
                }
            }
            return;
        }

        const theme = getTheme(activeId);
        const color = theme.titlebarColor || '#F3F3F3';
        const symbolColor = theme.symbolColor || '#1B2A4A';

        if (!force && lastAppliedOverlay &&
            lastAppliedOverlay.color === color &&
            lastAppliedOverlay.symbolColor === symbolColor &&
            lastAppliedOverlay.height === 30) {
            return;
        }

        lastAppliedOverlay = { color: color, symbolColor: symbolColor, height: 30 };
        window.electronNative?.setTitleBarOverlay?.(lastAppliedOverlay);
    }

    // === 看图模态：把 Windows 原生系统按钮区（− □ ×）染成"与看图遮罩完全同一个颜色" ===
    // 取模态元素的实际渲染背景色（来自主题 --media-modal-bg），系统按钮区与遮罩 0 色差。
    // 官方原版（stock）下同样执行：不读主题变量，直接读遮罩实际渲染底色，
    // 让右上角系统按钮区与遮罩完全同色、彻底融入背景，不再突兀。
    function applyModalChrome(force) {
        const activeId = activeThemeId();

        const mediaModal = document.querySelector('[data-testid="media-modal"]');
        const mermaidViewport = document.querySelector('[data-testid="mermaid-lightbox-viewport"]');
        if (!mediaModal && !mermaidViewport) return;

        // 已贴合且主题未变：不再重复读取样式（避免流式输出时高频 getComputedStyle）
        if (modalChromeActive && modalChromeThemeId === activeId && !force) return;

        let bg = null;
        if (mediaModal) {
            bg = parseCssColor(getComputedStyle(mediaModal).backgroundColor);
        } else if (mermaidViewport) {
            // 流程图弹窗：取其背景遮罩容器的实底色（即 --media-modal-bg），保证顶栏控制器与视口周围遮罩绝对同色
            const backdrop = document.querySelector('div[class*="animate-backdropFadeIn"]:has(~ * [data-testid="mermaid-lightbox-viewport"]), div[class*="animate-backdropFadeIn"]:has(~ div [data-testid="mermaid-lightbox-viewport"])');
            if (backdrop) {
                bg = parseCssColor(getComputedStyle(backdrop).backgroundColor);
            }
        }

        if (!bg || bg[3] < 0.05) {
            // 读取主题变量 --media-modal-bg 兜底
            const varColor = readCssVarHex('--media-modal-bg', isDarkMode() ? '#18181B' : '#E4E4E7');
            bg = parseCssColor(varColor);
        }

        if (!bg || bg[3] < 0.05) {
            let base = parseCssColor(getComputedStyle(document.body).backgroundColor);
            if (!base || base[3] < 0.05) base = parseCssColor(getComputedStyle(document.documentElement).backgroundColor);
            if (!base || base[3] < 0.05) return;
            let r = base[0], g = base[1], b = base[2];
            const layers = [];
            document.querySelectorAll('div').forEach((el) => {
                const cs = getComputedStyle(el);
                if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
                const rect = el.getBoundingClientRect();
                if (rect.width < innerWidth * 0.9 || rect.height < innerHeight * 0.9) return;
                const c = parseCssColor(cs.backgroundColor);
                if (!c || c[3] <= 0.01) return;
                layers.push({ z: parseInt(cs.zIndex, 10) || 0, c });
            });
            layers.sort((m, n) => m.z - n.z);
            for (const { c } of layers) {
                const a = c[3];
                r = c[0] * a + r * (1 - a);
                g = c[1] * a + g * (1 - a);
                b = c[2] * a + b * (1 - a);
            }
            bg = [r, g, b, 1];
        }
        const color = toHex(bg[0], bg[1], bg[2]);

        modalChromeActive = true;
        modalChromeThemeId = activeId;

        const overlay = { color: color, symbolColor: contrastColor(color), height: 30 };
        lastAppliedOverlay = overlay;
        window.electronNative?.setTitleBarOverlay?.(overlay);
    }

    function restoreModalChrome() {
        if (!modalChromeActive) return;
        modalChromeActive = false;
        modalChromeThemeId = null;

        // 退出看图后必须 100% 还原成「正常态标题栏色」，
        // 不能依赖缓存（缓存可能为空，且官方原版分支不会自行重刷，会导致按钮区停留在深色上、必须刷新才恢复）。
        const activeId = activeThemeId();
        let color, symbolColor;
        if (activeId === 'stock') {
            // 官方原版：复刻官方算法，直接读实时 CSS 变量
            color = readCssVarHex('--sidebar', isDarkMode() ? '#161616' : '#f2f2f2');
            symbolColor = readCssVarHex('--foreground', isDarkMode() ? '#cccccc' : '#101010');
        } else {
            const theme = getTheme(activeId);
            color = theme.titlebarColor || '#F3F3F3';
            symbolColor = theme.symbolColor || '#1B2A4A';
        }
        lastAppliedOverlay = { color: color, symbolColor: symbolColor, height: 30 };
        window.electronNative?.setTitleBarOverlay?.(lastAppliedOverlay);
    }

    // 监听看图/流程图模态的挂载与卸载
    function syncModalChrome() {
        const modal = document.querySelector('[data-testid="media-modal"], [data-testid="mermaid-lightbox-viewport"]');
        if (modal) {
            applyModalChrome();
            // React 挂载后会把标题栏改回原色，需在模态存在期间持续重新确认
            if (!modalChromeTimer) {
                modalChromeTimer = setInterval(() => {
                    const still = document.querySelector('[data-testid="media-modal"], [data-testid="mermaid-lightbox-viewport"]');
                    if (still) applyModalChrome(true);
                    else { clearInterval(modalChromeTimer); modalChromeTimer = null; restoreModalChrome(); }
                }, 400);
            }
        } else {
            if (modalChromeTimer) { clearInterval(modalChromeTimer); modalChromeTimer = null; }
            restoreModalChrome();
        }
    }

    // 同步深色状态：深浅色切换时重算标题栏（官方原版走实时取色）与切换器配色；
    // 主题变更本身由 applyTheme 直接驱动（activeThemeId() 恒等于 lastActiveId），无需在此重复比较
    function syncThemeState() {
        const currentDark = isDarkMode();
        if (currentDark === lastIsDark) return;
        lastIsDark = currentDark;
        if (activeThemeId() !== 'stock') {
            enforceTitleBarColor(true);
        }
        updateSelectorUI(activeThemeId());
    }

    function updateSelectorUI(activeId) {
        const theme = getTheme(activeId);
        const dot = document.querySelector('#antigravity-theme-selector .st-dot');
        const label = document.getElementById('antigravity-theme-label');
        if (dot) dot.style.setProperty('--st-dot', activeId === 'stock' ? '#8E8E93' : effectiveAccent());
        if (label) label.textContent = theme.name;
    }

    // 挂载右上角主题选择器。官方改版后找不到工具区时，主界面出来 3 秒后改挂到标题栏下方的备用位置，保证面板始终能打开
    let engineReadyAt = 0;
    function mountThemeSelector() {
        const toolbar = document.querySelector('[data-testid="pane-titlebar-toolbar"]');
        const existing = document.getElementById('antigravity-theme-selector');
        if (toolbar) {
            if (existing) {
                if (toolbar.contains(existing)) return;
                existing.remove();
            }
        } else {
            if (existing) return;
            if (!document.querySelector('[data-testid="title-menu-bar"]') || !engineReadyAt || Date.now() - engineReadyAt < 3000) return;
        }
        const legacy = document.getElementById('antigravity-theme-dropdown');
        if (legacy) legacy.remove();

        const currentId = activeThemeId();
        const container = document.createElement('div');
        container.id = 'antigravity-theme-selector';
        container.style.cssText = 'position: relative; display: inline-flex; align-items: center; margin-right: 6px; flex: 0 0 auto; user-select: none; -webkit-app-region: no-drag; pointer-events: auto;';

        const btn = document.createElement('button');
        btn.id = 'antigravity-theme-btn';
        btn.type = 'button';
        btn.title = '外观';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.style.webkitAppRegion = 'no-drag';
        btn.innerHTML = '<span class="st-dot"></span><span id="antigravity-theme-label"></span>';
        btn.onclick = (e) => { e.stopPropagation(); studioToggle(); };

        container.appendChild(btn);
        if (toolbar) {
            // 插在最左边（⋮ 菜单的前面）
            toolbar.insertBefore(container, toolbar.firstChild);
        } else {
            container.dataset.fallback = '';
            container.style.cssText += 'position: fixed; top: 42px; right: 16px; z-index: 2147482000;';
            document.body.appendChild(container);
        }
        updateSelectorUI(currentId);
        if (currentId !== 'stock') {
            enforceTitleBarColor(true);
        }
    }

    // ===================== 外观面板（Studio） =====================
    // 偏好：强调色 / 材质 / 壁纸。和皮肤分开存，换皮肤不丢。
    // 页面 origin 端口每次启动都变，localStorage 不可靠，主存走 nativeStorage（与 THEME_PREF_KEY 同一套）。
    const STUDIO = {"skins":[{"id":"aluminum","wall":"aurora","base":"#F5F5F7","base2":"#F7F7F9","sidebar":"#FBFBFD","text":"#1D1D1F","text2":"#6E6E73","line":"#E3E3E8","accent":"#0071E3"},{"id":"porcelain","wall":"mono","base":"#FAFAFA","base2":"#FCFCFC","sidebar":"#FFFFFF","text":"#171717","text2":"#666666","line":"#EBEBEB","accent":"#171717"},{"id":"fog","wall":"bay","base":"#F2F5F9","base2":"#F5F7FB","sidebar":"#FAFBFD","text":"#16202E","text2":"#5B6778","line":"#DEE4EC","accent":"#3157D5"},{"id":"sand","wall":"dune","base":"#F6F4F0","base2":"#F8F6F3","sidebar":"#FCFBF9","text":"#252321","text2":"#6B665F","line":"#E6E1D9","accent":"#A4492A"},{"id":"sage","wall":"aurora","base":"#F3F6F4","base2":"#F6F8F6","sidebar":"#FBFCFB","text":"#18231E","text2":"#5A6962","line":"#DBE3DE","accent":"#2B7556"}],"accents":[{"hex":"#0071E3","name":"蓝"},{"hex":"#5856D6","name":"靛"},{"hex":"#8944C8","name":"紫"},{"hex":"#C8336A","name":"莓"},{"hex":"#D0342C","name":"红"},{"hex":"#B5520B","name":"橙"},{"hex":"#8A6100","name":"琥珀"},{"hex":"#1F7F48","name":"绿"},{"hex":"#0B7480","name":"青"},{"hex":"#3A3A3C","name":"石墨"}],"gradients":[{"id":"dawn","name":"晨曦","css":"radial-gradient(120% 90% at 0% 0%, #FDE2D6 0%, transparent 55%), radial-gradient(90% 80% at 100% 10%, #E4DDFB 0%, transparent 60%), radial-gradient(100% 90% at 60% 100%, #FBEFE3 0%, transparent 60%), #F7F3F1"},{"id":"bay","name":"海湾","css":"radial-gradient(110% 90% at 10% 0%, #D3E6FB 0%, transparent 58%), radial-gradient(90% 90% at 100% 30%, #D2F1EC 0%, transparent 60%), radial-gradient(100% 80% at 40% 100%, #E7EEFA 0%, transparent 60%), #F1F5F9"},{"id":"aurora","name":"极光","css":"radial-gradient(90% 80% at 0% 20%, #D5F3E6 0%, transparent 58%), radial-gradient(90% 90% at 70% 0%, #DCE3FD 0%, transparent 58%), radial-gradient(100% 90% at 100% 100%, #EBDDFA 0%, transparent 60%), #F3F5F8"},{"id":"dune","name":"沙丘","css":"radial-gradient(120% 90% at 100% 0%, #F6E5CF 0%, transparent 58%), radial-gradient(100% 90% at 0% 100%, #EFE4DA 0%, transparent 60%), #F7F4EF"},{"id":"mono","name":"素灰","css":"radial-gradient(120% 100% at 50% 0%, #FFFFFF 0%, transparent 60%), linear-gradient(180deg, #F2F2F4 0%, #E9E9EC 100%)"}]};
    const PREFS_KEY = 'custom-theme-studio';
    const STUDIO_CSS = "/* === 外观面板（Studio）与标题栏入口 ===\n   独立注入，官方原版下也在。所有规则限定在 #ag-studio / #antigravity-theme-selector 内。\n   视觉参照 macOS 控制中心：厚磨砂、发丝边、分段控件滑块、弹簧缓动。 */\n\n#ag-studio, #antigravity-theme-selector {\n  --st-ease: cubic-bezier(0.32, 0.72, 0, 1);\n  --st-spring: cubic-bezier(0.34, 1.36, 0.64, 1);\n  --st-text: var(--sk-text, #1D1D1F);\n  --st-text-2: var(--sk-text-2, #6E6E73);\n  --st-line: color-mix(in srgb, var(--st-text) 9%, transparent);\n  --st-fill: color-mix(in srgb, var(--st-text) 5%, transparent);\n  --st-fill-2: color-mix(in srgb, var(--st-text) 8%, transparent);\n  --st-accent: var(--sk-accent, #0071E3);\n}\n\n/* 标题栏入口：幽灵按钮 + 当前皮肤色点 */\n#antigravity-theme-selector #antigravity-theme-btn {\n  height: 24px !important;\n  padding: 0 9px 0 7px !important;\n  gap: 6px !important;\n  border: 0 !important;\n  border-radius: 7px !important;\n  background: transparent !important;\n  box-shadow: none !important;\n  color: var(--st-text) !important;\n  font-size: 12px !important;\n  font-weight: 500 !important;\n  letter-spacing: -0.01em !important;\n  cursor: default !important;\n  transition: background-color 160ms var(--st-ease) !important;\n}\n@media (hover: hover) {\n  #antigravity-theme-selector #antigravity-theme-btn:hover { background: var(--st-fill-2) !important; }\n}\n#antigravity-theme-selector #antigravity-theme-btn[aria-expanded=\"true\"] { background: var(--st-fill-2) !important; }\n#antigravity-theme-selector #antigravity-theme-btn:focus-visible {\n  outline: 2px solid color-mix(in srgb, var(--st-accent) 55%, transparent) !important;\n  outline-offset: 1px !important;\n}\n#antigravity-theme-selector .st-dot {\n  width: 10px; height: 10px; border-radius: 50%;\n  background: var(--st-dot, var(--st-accent));\n  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.18), 0 0 0 2px color-mix(in srgb, var(--st-dot, var(--st-accent)) 16%, transparent);\n  flex: 0 0 auto;\n}\n\n/* 面板 */\n#ag-studio {\n  position: fixed;\n  z-index: 2147483000;\n  width: 340px;\n  max-height: min(680px, calc(100vh - 64px));\n  overflow: hidden auto;\n  overscroll-behavior: contain;\n  scrollbar-width: none;\n  box-sizing: border-box;\n  padding: 6px 14px 14px;\n  border-radius: 16px;\n  color: var(--st-text);\n  font-size: 12.5px;\n  line-height: 1.4;\n  letter-spacing: -0.005em;\n  background: color-mix(in srgb, var(--sk-sidebar, #FBFBFD) 80%, transparent) !important;\n  backdrop-filter: blur(40px) saturate(1.8) !important;\n  -webkit-backdrop-filter: blur(40px) saturate(1.8) !important;\n  box-shadow:\n    0 0 0 0.5px color-mix(in srgb, var(--st-text) 14%, transparent),\n    inset 0 0.5px 0 rgba(255, 255, 255, 0.9),\n    0 2px 6px -2px rgba(0, 0, 0, 0.06),\n    0 24px 56px -16px rgba(0, 0, 0, 0.22);\n  transform-origin: var(--st-origin, top right);\n  opacity: 0;\n  transform: translateY(-6px) scale(0.97);\n  pointer-events: none;\n  visibility: hidden;\n  transition: opacity 180ms var(--st-ease), transform 260ms var(--st-spring), visibility 0s linear 260ms;\n  -webkit-app-region: no-drag;\n}\n#ag-studio::-webkit-scrollbar { display: none; }\n#ag-studio.is-open {\n  opacity: 1;\n  transform: none;\n  pointer-events: auto;\n  visibility: visible;\n  transition: opacity 160ms var(--st-ease), transform 320ms var(--st-spring), visibility 0s;\n}\n@media (prefers-reduced-motion: reduce) {\n  #ag-studio, #ag-studio.is-open { transform: none !important; transition: opacity 120ms linear, visibility 0s linear 120ms; }\n  #ag-studio * { transition: none !important; }\n}\n\n#ag-studio * { box-sizing: border-box; }\n#ag-studio button, #ag-studio input { font: inherit; color: inherit; }\n#ag-studio button { cursor: default; -webkit-tap-highlight-color: transparent; }\n#ag-studio :focus-visible {\n  outline: 2px solid color-mix(in srgb, var(--st-accent) 55%, transparent);\n  outline-offset: 2px;\n}\n#ag-studio [hidden] { display: none !important; }\n\n#ag-studio .st-head {\n  position: sticky; top: -6px; z-index: 2;\n  display: flex; align-items: center; justify-content: space-between;\n  margin: 0 -14px; padding: 12px 14px 10px;\n  background: inherit;\n}\n#ag-studio .st-title { font-size: 13px; font-weight: 600; letter-spacing: -0.015em; }\n#ag-studio .st-link {\n  border: 0; background: none; padding: 2px 4px; border-radius: 5px;\n  color: var(--st-accent); font-size: 12px; font-weight: 500;\n}\n@media (hover: hover) { #ag-studio .st-link:hover { background: var(--st-fill); } }\n\n#ag-studio .st-sec { padding: 12px 0 2px; }\n#ag-studio .st-sec + .st-sec { border-top: 0.5px solid var(--st-line); margin-top: 12px; }\n#ag-studio .st-label {\n  display: flex; align-items: baseline; justify-content: space-between;\n  margin-bottom: 9px;\n  font-size: 11px; font-weight: 600; letter-spacing: 0.02em;\n  color: var(--st-text-2);\n}\n#ag-studio .st-label em { font-style: normal; font-weight: 500; letter-spacing: 0; font-variant-numeric: tabular-nums; }\n#ag-studio .st-note { margin-top: 8px; font-size: 11px; color: var(--st-text-2); }\n#ag-studio .st-note.is-warn { color: #B4560B; }\n#ag-studio .st-off { opacity: 0.4; pointer-events: none; }\n\n/* 皮肤卡片：一张迷你窗口 */\n#ag-studio .st-skins { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 8px; }\n#ag-studio .st-skin { border: 0; background: none; padding: 0; text-align: center; }\n#ag-studio .st-skin-art {\n  position: relative; display: block; height: 52px; border-radius: 10px; overflow: hidden;\n  background: var(--a-base);\n  box-shadow: 0 0 0 0.5px color-mix(in srgb, var(--st-text) 16%, transparent), 0 1px 2px rgba(0, 0, 0, 0.05);\n  transition: box-shadow 200ms var(--st-ease), transform 260ms var(--st-spring);\n}\n#ag-studio .st-skin-art::before {\n  content: \"\"; position: absolute; inset: 0 auto 0 0; width: 32%;\n  background: var(--a-side); box-shadow: 0.5px 0 0 var(--a-line);\n}\n#ag-studio .st-skin-art::after {\n  content: \"\"; position: absolute; left: 42%; right: 12%; bottom: 9px; height: 11px; border-radius: 4px;\n  background: #FFFFFF; box-shadow: 0 0 0 0.5px var(--a-line);\n}\n#ag-studio .st-skin-art i {\n  position: absolute; left: 42%; top: 10px; height: 3px; border-radius: 2px; background: var(--a-text); opacity: 0.55;\n}\n#ag-studio .st-skin-art i:nth-child(1) { width: 34%; }\n#ag-studio .st-skin-art i:nth-child(2) { top: 17px; width: 22%; opacity: 0.25; }\n#ag-studio .st-skin-art b {\n  position: absolute; right: calc(12% + 3px); bottom: 12px; width: 5px; height: 5px; border-radius: 50%; background: var(--a-accent);\n}\n#ag-studio .st-skin-name { display: block; margin-top: 6px; font-size: 11.5px; color: var(--st-text-2); transition: color 160ms; }\n@media (hover: hover) { #ag-studio .st-skin:hover .st-skin-art { transform: translateY(-1px); } }\n#ag-studio .st-skin[aria-pressed=\"true\"] .st-skin-art {\n  box-shadow: 0 0 0 2px var(--sk-sidebar, #FFF), 0 0 0 3.5px var(--st-accent);\n}\n#ag-studio .st-skin[aria-pressed=\"true\"] .st-skin-name { color: var(--st-text); font-weight: 600; }\n\n/* 分段控件：滑动指示块 */\n#ag-studio .st-seg {\n  position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;\n  padding: 2px; border-radius: 9px; background: var(--st-fill-2);\n}\n#ag-studio .st-seg-thumb {\n  position: absolute; top: 2px; bottom: 2px; left: 2px;\n  width: calc((100% - 4px) / var(--n));\n  transform: translateX(calc(100% * var(--i)));\n  border-radius: 7px; background: #FFFFFF;\n  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.12);\n  transition: transform 320ms var(--st-spring);\n}\n#ag-studio .st-seg button {\n  position: relative; z-index: 1; height: 26px; border: 0; background: none; border-radius: 7px;\n  font-size: 12px; font-weight: 500; color: var(--st-text-2); transition: color 160ms;\n}\n#ag-studio .st-seg button[aria-pressed=\"true\"] { color: var(--st-text); }\n\n/* 色板 */\n#ag-studio .st-swatches { display: flex; flex-wrap: wrap; gap: 9px; }\n#ag-studio .st-sw {\n  position: relative; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%;\n  background: var(--c);\n  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.16);\n  transition: transform 240ms var(--st-spring), box-shadow 160ms;\n}\n@media (hover: hover) { #ag-studio .st-sw:hover { transform: scale(1.12); } }\n#ag-studio .st-sw[aria-pressed=\"true\"] {\n  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.16), 0 0 0 2px var(--sk-sidebar, #FFF), 0 0 0 3.5px var(--c);\n}\n#ag-studio .st-sw.is-auto {\n  background: linear-gradient(135deg, var(--c) 0 50%, color-mix(in srgb, var(--c) 35%, #FFF) 50% 100%);\n}\n#ag-studio .st-sw.is-custom {\n  background: conic-gradient(from 180deg, #FF453A, #FF9F0A, #FFD60A, #32D74B, #64D2FF, #0A84FF, #BF5AF2, #FF453A);\n}\n#ag-studio .st-sw.is-custom input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; border: 0; padding: 0; }\n\n/* 渐变壁纸色块 */\n#ag-studio .st-grads { display: grid; grid-template-columns: repeat(6, 1fr); gap: 7px; }\n#ag-studio .st-grad {\n  height: 34px; padding: 0; border: 0; border-radius: 8px; background: var(--g);\n  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.12);\n  transition: transform 240ms var(--st-spring), box-shadow 160ms;\n  font-size: 10px; font-weight: 600; color: var(--st-text-2);\n}\n@media (hover: hover) { #ag-studio .st-grad:hover { transform: translateY(-1px); } }\n#ag-studio .st-grad[aria-pressed=\"true\"] {\n  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 0 0 2px var(--sk-sidebar, #FFF), 0 0 0 3.5px var(--st-accent);\n}\n\n/* 滑杆 */\n#ag-studio .st-row { margin-top: 12px; }\n#ag-studio input[type=\"range\"] {\n  -webkit-appearance: none; appearance: none; display: block; width: 100%; height: 22px; margin: 0;\n  background: transparent; --p: 50%;\n}\n#ag-studio input[type=\"range\"]::-webkit-slider-runnable-track {\n  height: 4px; border-radius: 2px;\n  background: linear-gradient(90deg, var(--st-accent) 0 var(--p), var(--st-fill-2) var(--p) 100%);\n}\n#ag-studio input[type=\"range\"]::-webkit-slider-thumb {\n  -webkit-appearance: none; width: 18px; height: 18px; margin-top: -7px; border-radius: 50%;\n  background: #FFFFFF;\n  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 2px 5px rgba(0, 0, 0, 0.16);\n  transition: transform 200ms var(--st-spring);\n}\n#ag-studio input[type=\"range\"]:active::-webkit-slider-thumb { transform: scale(1.1); }\n\n/* 文本框与按钮 */\n#ag-studio .st-field { display: flex; gap: 6px; margin-top: 10px; }\n#ag-studio .st-input {\n  flex: 1; min-width: 0; height: 28px; padding: 0 9px; border: 0; border-radius: 7px;\n  background: var(--st-fill); box-shadow: inset 0 0 0 0.5px var(--st-line);\n  font-size: 12px; transition: box-shadow 160ms, background-color 160ms;\n}\n#ag-studio .st-input:focus { outline: none; background: #FFFFFF; box-shadow: 0 0 0 1px var(--st-accent), 0 0 0 4px color-mix(in srgb, var(--st-accent) 16%, transparent); }\n#ag-studio .st-input.is-mono { font-family: ui-monospace, \"SF Mono\", \"JetBrains Mono\", Consolas, monospace; text-transform: uppercase; max-width: 92px; }\n#ag-studio .st-btn {\n  height: 28px; padding: 0 12px; border: 0; border-radius: 7px;\n  background: var(--st-fill-2); font-size: 12px; font-weight: 500; white-space: nowrap;\n  transition: background-color 160ms, transform 160ms;\n}\n@media (hover: hover) { #ag-studio .st-btn:hover { background: color-mix(in srgb, var(--st-text) 12%, transparent); } }\n#ag-studio .st-btn:active { transform: scale(0.97); }\n#ag-studio .st-btn.is-primary { background: var(--st-accent); color: #FFFFFF; }\n#ag-studio .st-foot {\n  margin: 14px -14px -14px; padding: 10px 14px 12px;\n  border-top: 0.5px solid var(--st-line);\n  font-size: 11px; color: var(--st-text-2);\n}\n#ag-studio kbd {\n  display: inline-block; min-width: 18px; margin: 0 1px; padding: 1px 5px; border-radius: 4px;\n  background: var(--st-fill-2); box-shadow: inset 0 -0.5px 0 var(--st-line);\n  font: 500 10.5px/1.4 ui-monospace, \"SF Mono\", Consolas, monospace; text-align: center; color: var(--st-text);\n}\n\n#ag-studio .st-file { display: flex; align-items: center; gap: 8px; margin-top: 10px; }\n#ag-studio .st-file span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--st-text-2); font-size: 11.5px; }\n";
    const DEFAULT_PREFS = {
        accent: '',          // 空 = 跟随皮肤
        material: 'frosted', // solid | frosted | clear
        blur: 24,            // px
        opacity: 72,         // 玻璃表面不透明度 %
        wall: 'gradient',    // none | gradient | image | url
        gradient: 'auto',    // auto = 跟随皮肤
        url: '',
        strength: 70,        // 壁纸可见度 %
        wallBlur: 0,
        fit: 'cover'         // cover | contain
    };
    const MATERIALS = [
        { id: 'solid', name: '实色' },
        { id: 'frosted', name: '磨砂' },
        { id: 'clear', name: '通透' }
    ];
    const WALLS = [
        { id: 'none', name: '无' },
        { id: 'gradient', name: '渐变' },
        { id: 'image', name: '图片' },
        { id: 'url', name: '链接' }
    ];

    let prefs = Object.assign({}, DEFAULT_PREFS);
    // 本地壁纸存在 %APPDATA%\Antigravity\custom-theme\wall.webp，启动时随 boot 注入，不进 nativeStorage
    let wallImage = typeof BOOT.wallImage === 'string' && /^data:image\/webp;base64,/.test(BOOT.wallImage) ? BOOT.wallImage : '';
    let wallUpload = null;
    let wallUploadTimer = null;
    let wallStatus = '';
    let nativeTimer = null;

    const clamp = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
    const oneOf = (v, list, d) => (list.some((x) => (x.id || x) === v) ? v : d);
    const safeUrl = (u) => {
        if (typeof u !== 'string') return '';
        u = u.trim();
        if (/^https?:\/\/[^\s"'()\\]+$/i.test(u)) return u;
        if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(u)) return u;
        return '';
    };

    function normalizePrefs(p) {
        p = p && typeof p === 'object' ? p : {};
        return {
            accent: isHex(p.accent) ? p.accent.toUpperCase() : '',
            material: oneOf(p.material, MATERIALS, DEFAULT_PREFS.material),
            blur: clamp(p.blur, 0, 60, DEFAULT_PREFS.blur),
            opacity: clamp(p.opacity, 30, 100, DEFAULT_PREFS.opacity),
            wall: oneOf(p.wall, WALLS, DEFAULT_PREFS.wall),
            gradient: p.gradient === 'auto' || STUDIO.gradients.some((g) => g.id === p.gradient) ? p.gradient : 'auto',
            url: safeUrl(p.url),
            strength: clamp(p.strength, 0, 100, DEFAULT_PREFS.strength),
            wallBlur: clamp(p.wallBlur, 0, 40, DEFAULT_PREFS.wallBlur),
            fit: p.fit === 'contain' ? 'contain' : 'cover'
        };
    }

    function savePrefs(immediate) {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
        clearTimeout(nativeTimer);
        const push = () => {
            try {
                if (window.nativeStorage && typeof window.nativeStorage.updateItems === 'function') {
                    Promise.resolve(window.nativeStorage.updateItems({ [PREFS_KEY]: JSON.stringify(prefs) })).catch(() => {});
                }
            } catch (e) {}
        };
        if (immediate) push(); else nativeTimer = setTimeout(push, 350);
    }

    function loadLocalPrefs() {
        try { prefs = normalizePrefs(JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) { prefs = normalizePrefs({}); }
    }

    function reconcileStudioPrefs() {
        try {
            if (!(window.nativeStorage && typeof window.nativeStorage.getItems === 'function')) return;
            Promise.resolve(window.nativeStorage.getItems()).then((items) => {
                if (!items) return;
                if (items[PREFS_KEY]) {
                    try { prefs = normalizePrefs(JSON.parse(items[PREFS_KEY])); } catch (e) {}
                    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
                }
                studioApply();
                studioRefresh();
            }).catch(() => {});
        } catch (e) {}
    }

    function skinOf(id) { return STUDIO.skins.find((s) => s.id === id) || null; }
    function effectiveAccent() {
        const s = skinOf(activeThemeId());
        return prefs.accent || (s ? s.accent : '#0071E3');
    }

    // WCAG 相对亮度，用于提示自定义强调色上的白字是否够清楚
    function luminance(hex) {
        const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
            .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    const whiteContrast = (hex) => 1.05 / (luminance(hex) + 0.05);

    function ensureStudioStyle() {
        let el = document.getElementById('antigravity-studio-css');
        if (!el) {
            el = document.createElement('style');
            el.id = 'antigravity-studio-css';
            (document.head || document.documentElement).appendChild(el);
        }
        if (el.textContent !== STUDIO_CSS) el.textContent = STUDIO_CSS;
    }

    function ensureWallLayer() {
        let wall = document.getElementById('sk-wall');
        if (!wall) {
            wall = document.createElement('div');
            wall.id = 'sk-wall';
            wall.setAttribute('aria-hidden', 'true');
            wall.innerHTML = '<div class="sk-wall-img"></div><div class="sk-wall-veil"></div>';
            document.body.insertBefore(wall, document.body.firstChild);
        }
        return wall;
    }

    function wallBackground() {
        const s = skinOf(activeThemeId());
        if (prefs.wall === 'gradient') {
            const id = prefs.gradient === 'auto' ? (s && s.wall) : prefs.gradient;
            const g = STUDIO.gradients.find((x) => x.id === id) || STUDIO.gradients[0];
            return g.css;
        }
        const src = prefs.wall === 'image' ? wallImage : prefs.wall === 'url' ? prefs.url : '';
        return src ? `url("${src}") center / ${prefs.fit} no-repeat, var(--sk-base)` : '';
    }

    const STUDIO_VARS = ['--sk-accent', '--sk-fill', '--sk-filter', '--sk-pop'];
    function studioApply() {
        ensureStudioStyle();
        const root = document.documentElement;
        const on = activeThemeId() !== 'stock';
        if (!on) {
            STUDIO_VARS.forEach((v) => root.style.removeProperty(v));
            root.removeAttribute('data-sk-glass');
            root.removeAttribute('data-sk-wall');
            updateSelectorUI(activeThemeId());
            return;
        }
        root.style.setProperty('--sk-accent', effectiveAccent());
        const glass = prefs.material !== 'solid';
        const fill = prefs.material === 'solid' ? 1 : prefs.material === 'clear' ? prefs.opacity / 100 * 0.7 : prefs.opacity / 100;
        root.style.setProperty('--sk-fill', fill.toFixed(3));
        const tone = prefs.material === 'clear' ? 'saturate(1.9) brightness(1.04)' : 'saturate(1.7) brightness(1.06)';
        root.style.setProperty('--sk-filter', glass ? `blur(${prefs.blur}px) ${tone}` : 'blur(20px) saturate(1.8)');
        // 浮层保留 86% 可读性下限，滑杆拉到底也不会读穿
        root.style.setProperty('--sk-pop', glass
            ? `color-mix(in srgb, var(--sk-surface) ${Math.max(86, Math.round(fill * 100 + 20))}%, transparent)`
            : 'var(--sk-surface)');
        root.toggleAttribute('data-sk-glass', glass);

        const bg = prefs.wall === 'none' ? '' : wallBackground();
        root.toggleAttribute('data-sk-wall', !!bg);
        if (bg) {
            const wall = ensureWallLayer();
            const img = wall.firstChild;
            if (img.dataset.bg !== bg) { img.style.background = bg; img.dataset.bg = bg; }
            wall.style.setProperty('--sk-wall-blur', prefs.wallBlur + 'px');
            wall.style.setProperty('--sk-wall-veil', ((100 - prefs.strength) / 100 * 0.85).toFixed(3));
        }
        updateSelectorUI(activeThemeId());
    }

    // 看门狗用：DOM 被整体重建时补回样式与壁纸层
    function studioEnsure() {
        ensureStudioStyle();
        if (document.documentElement.hasAttribute('data-sk-wall') && !document.getElementById('sk-wall')) studioApply();
        if (activeThemeId() !== 'stock' && !document.documentElement.style.getPropertyValue('--sk-accent')) studioApply();
    }

    // 上传图片：缩到 2560px 内转 WebP，控制在约 1.2MB，存进 nativeStorage
    function readWallFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || !/^image\//.test(file.type)) return reject(new Error('请选择图片文件'));
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                let max = 2560, out = '';
                for (let q = 0.86; q >= 0.5; q -= 0.12, max = Math.round(max * 0.8)) {
                    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
                    const c = document.createElement('canvas');
                    c.width = Math.round(img.naturalWidth * k);
                    c.height = Math.round(img.naturalHeight * k);
                    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                    out = c.toDataURL('image/webp', q);
                    if (out.length < 1.6e6) break;
                }
                resolve(out);
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片无法读取')); };
            img.src = url;
        });
    }

    // ---------- 面板 ----------
    function h(tag, attrs, ...kids) {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (v === undefined || v === null || v === false) continue;
            if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
            else if (k === 'style') el.style.cssText = v;
            else el.setAttribute(k, v === true ? '' : v);
        }
        for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
        return el;
    }

    const ui = {};

    function update(patch, opts) {
        Object.assign(prefs, patch);
        prefs = normalizePrefs(prefs);
        savePrefs(opts && opts.immediate);
        studioApply();
        studioRefresh();
    }

    function segmented(key, options, onPick) {
        const thumb = h('span', { class: 'st-seg-thumb' });
        const seg = h('div', { class: 'st-seg', style: `--n:${options.length}` }, thumb,
            options.map((o) => h('button', { type: 'button', 'data-v': o.id, onclick: () => onPick(o.id) }, o.name)));
        seg._sync = (v) => {
            const i = Math.max(0, options.findIndex((o) => o.id === v));
            seg.style.setProperty('--i', i);
            seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
        };
        ui[key] = seg;
        return seg;
    }

    function slider(key, label, min, max, unit) {
        const val = h('em');
        const input = h('input', { type: 'range', min, max, step: 1, 'aria-label': label });
        const paint = () => {
            input.style.setProperty('--p', ((input.value - min) / (max - min) * 100) + '%');
            val.textContent = input.value + unit;
        };
        input.addEventListener('input', () => { paint(); update({ [key]: Number(input.value) }); });
        input.addEventListener('change', () => savePrefs(true));
        const row = h('div', { class: 'st-row' }, h('div', { class: 'st-label' }, label, val), input);
        row._sync = () => { input.value = prefs[key]; paint(); };
        ui['slider-' + key] = row;
        return row;
    }

    function buildPanel() {
        const panel = h('div', { id: 'ag-studio', role: 'region', 'aria-label': '外观' });
        panel.style.webkitAppRegion = 'no-drag';

        // 皮肤
        const skins = h('div', { class: 'st-skins' }, THEMES.map((t) => {
            const s = skinOf(t.id);
            const art = s
                ? h('span', { class: 'st-skin-art', style: `--a-base:${s.base};--a-side:${s.sidebar};--a-line:${s.line};--a-text:${s.text};--a-accent:${s.accent}` }, h('i'), h('i'), h('b'))
                : h('span', { class: 'st-skin-art', style: '--a-base:#F3F3F3;--a-side:#E8E8E8;--a-line:#D4D4D4;--a-text:#333;--a-accent:#007ACC' }, h('i'), h('i'), h('b'));
            return h('button', { type: 'button', class: 'st-skin', 'data-id': t.id, onclick: () => { applyTheme(t.id); studioApply(); studioRefresh(); } },
                art, h('span', { class: 'st-skin-name' }, t.name));
        }));
        ui.skins = skins;

        // 强调色
        const hex = h('input', { class: 'st-input is-mono', maxlength: 7, spellcheck: 'false', 'aria-label': '强调色色值' });
        const commitHex = () => {
            let v = hex.value.trim();
            if (/^[0-9a-fA-F]{6}$/.test(v)) v = '#' + v;
            if (isHex(v)) update({ accent: v }, { immediate: true }); else hex.value = effectiveAccent();
        };
        hex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { commitHex(); hex.blur(); } });
        hex.addEventListener('blur', commitHex);
        const picker = h('input', { type: 'color', 'aria-label': '自定义颜色' });
        picker.addEventListener('input', () => update({ accent: picker.value }));
        picker.addEventListener('change', () => savePrefs(true));
        const autoSw = h('button', { type: 'button', class: 'st-sw is-auto', title: '跟随皮肤', 'data-v': '', onclick: () => update({ accent: '' }, { immediate: true }) });
        const swatches = h('div', { class: 'st-swatches' }, autoSw,
            STUDIO.accents.map((a) => h('button', { type: 'button', class: 'st-sw', title: a.name, 'data-v': a.hex, style: `--c:${a.hex}`, onclick: () => update({ accent: a.hex }, { immediate: true }) })),
            h('label', { class: 'st-sw is-custom', title: '自定义' }, picker));
        const accentNote = h('div', { class: 'st-note' });
        ui.accent = { swatches, autoSw, hex, picker, note: accentNote };

        // 材质
        const material = segmented('material', MATERIALS, (v) => update({ material: v }, { immediate: true }));
        const blurRow = slider('blur', '模糊', 0, 60, 'px');
        const opRow = slider('opacity', '表面不透明度', 30, 100, '%');

        // 壁纸
        const wall = segmented('wall', WALLS, (v) => update({ wall: v }, { immediate: true }));
        const grads = h('div', { class: 'st-grads', style: 'margin-top:10px' },
            h('button', { type: 'button', class: 'st-grad', 'data-v': 'auto', title: '跟随皮肤', style: '--g:var(--sk-base)', onclick: () => update({ gradient: 'auto' }, { immediate: true }) }, '自动'),
            STUDIO.gradients.map((g) => h('button', { type: 'button', class: 'st-grad', 'data-v': g.id, title: g.name, style: `--g:${g.css}`, onclick: () => update({ gradient: g.id }, { immediate: true }) })));
        const fileInput = h('input', { type: 'file', accept: 'image/*', hidden: true });
        const fileName = h('span');
        fileInput.addEventListener('change', () => {
            const f = fileInput.files && fileInput.files[0];
            if (!f) return;
            wallStatus = '处理中…';
            studioRefresh();
            readWallFile(f).then((data) => {
                // 立即显示；文件由守护进程写成 wall.webp（页面自己写不了文件），下次启动随 boot 一起注入
                wallImage = data;
                wallUpload = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), data, name: f.name };
                wallStatus = `${f.name} · 保存中…`;
                clearTimeout(wallUploadTimer);
                wallUploadTimer = setTimeout(() => {
                    if (!wallUpload) return;
                    wallStatus = `${f.name} · 暂未保存，守护进程运行后会自动保存`;
                    studioRefresh();
                }, 15000);
                update({ wall: 'image' }, { immediate: true });
            }).catch((e) => { wallStatus = e.message; studioRefresh(); });
            fileInput.value = '';
        });
        const fileRow = h('div', { class: 'st-file' }, h('button', { type: 'button', class: 'st-btn', onclick: () => fileInput.click() }, '选择图片…'), fileName, fileInput);
        const urlInput = h('input', { class: 'st-input', placeholder: 'https://…', spellcheck: 'false', 'aria-label': '图片链接' });
        const urlNote = h('div', { class: 'st-note' });
        const commitUrl = () => {
            const u = safeUrl(urlInput.value);
            urlNote.textContent = u || !urlInput.value.trim() ? '' : '只支持 http(s) 图片链接';
            urlNote.classList.toggle('is-warn', !u && !!urlInput.value.trim());
            if (u) update({ url: u }, { immediate: true });
        };
        urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') commitUrl(); });
        const urlRow = h('div', null, h('div', { class: 'st-field' }, urlInput, h('button', { type: 'button', class: 'st-btn is-primary', onclick: commitUrl }, '应用')), urlNote);
        const fitSeg = segmented('fit', [{ id: 'cover', name: '填满' }, { id: 'contain', name: '完整' }], (v) => update({ fit: v }, { immediate: true }));
        const fitRow = h('div', { class: 'st-row' }, fitSeg);
        const strengthRow = slider('strength', '壁纸强度', 0, 100, '%');
        const wallBlurRow = slider('wallBlur', '壁纸模糊', 0, 40, 'px');
        ui.wallParts = { grads, fileRow, fileName, urlRow, urlInput, fitRow, strengthRow, wallBlurRow };

        const stockNote = h('div', { class: 'st-note', style: 'padding-top:10px' }, '官方原版不支持强调色、材质和壁纸。');
        ui.stockNote = stockNote;
        const custom = h('div', null,
            h('div', { class: 'st-sec' }, h('div', { class: 'st-label' }, '强调色'), swatches, h('div', { class: 'st-field' }, hex), accentNote),
            h('div', { class: 'st-sec' }, h('div', { class: 'st-label' }, '材质'), material, blurRow, opRow),
            h('div', { class: 'st-sec' }, h('div', { class: 'st-label' }, '壁纸'), wall, grads, fileRow, urlRow, fitRow, strengthRow, wallBlurRow));
        ui.custom = custom;

        panel.append(
            h('div', { class: 'st-head' },
                h('span', { class: 'st-title' }, '外观'),
                h('button', { type: 'button', class: 'st-link', onclick: () => { prefs = normalizePrefs({}); savePrefs(true); studioApply(); studioRefresh(); } }, '恢复默认')),
            h('div', { class: 'st-sec', style: 'padding-top:4px' }, skins),
            stockNote,
            custom,
            h('div', { class: 'st-foot' }, '外观异常时按 ', h('kbd', null, 'Ctrl'), h('kbd', null, 'Alt'), h('kbd', null, 'Shift'), h('kbd', null, 'T'), ' 临时切回官方原版'));
        return panel;
    }

    function studioRefresh() {
        const panel = document.getElementById('ag-studio');
        if (!panel || !ui.skins) return;
        const id = activeThemeId();
        ui.skins.querySelectorAll('.st-skin').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
        const stock = id === 'stock';
        ui.stockNote.hidden = !stock;
        ui.custom.classList.toggle('st-off', stock);

        const acc = effectiveAccent();
        const s = skinOf(id);
        ui.accent.autoSw.style.setProperty('--c', s ? s.accent : acc);
        ui.accent.swatches.querySelectorAll('.st-sw[data-v]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.accent)));
        const custom = !!prefs.accent && !STUDIO.accents.some((a) => a.hex === prefs.accent);
        ui.accent.swatches.querySelector('.is-custom').setAttribute('aria-pressed', String(custom));
        if (document.activeElement !== ui.accent.hex) ui.accent.hex.value = acc;
        ui.accent.picker.value = acc.toLowerCase();
        const cr = whiteContrast(acc);
        ui.accent.note.textContent = cr < 4.5 ? `这个颜色上的白字对比度只有 ${cr.toFixed(1)}:1，主按钮文字可能看不清` : '';
        ui.accent.note.classList.toggle('is-warn', cr < 4.5);

        ui.material._sync(prefs.material);
        ui['slider-blur']._sync();
        ui['slider-opacity']._sync();
        ui['slider-blur'].hidden = prefs.material === 'solid';
        ui['slider-opacity'].hidden = prefs.material === 'solid';

        const w = ui.wallParts;
        ui.wall._sync(prefs.wall);
        w.grads.hidden = prefs.wall !== 'gradient';
        w.grads.querySelectorAll('.st-grad').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.gradient)));
        w.fileRow.hidden = prefs.wall !== 'image';
        w.fileName.textContent = wallStatus || (wallImage ? '已保存的图片' : '还没有选择图片');
        w.urlRow.hidden = prefs.wall !== 'url';
        if (document.activeElement !== w.urlInput) w.urlInput.value = prefs.url;
        ui.fit._sync(prefs.fit);
        w.fitRow.hidden = prefs.wall !== 'image' && prefs.wall !== 'url';
        w.strengthRow.hidden = prefs.wall === 'none';
        w.wallBlurRow.hidden = prefs.wall === 'none';
        ui['slider-strength']._sync();
        ui['slider-wallBlur']._sync();
    }

    function positionStudio(panel, btn) {
        const r = btn.getBoundingClientRect();
        const w = panel.offsetWidth || 340;
        const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w));
        panel.style.top = Math.round(r.bottom + 8) + 'px';
        panel.style.left = Math.round(left) + 'px';
        panel.style.setProperty('--st-origin', `${Math.round(r.left + r.width / 2 - left)}px 0`);
    }

    function studioToggle(force) {
        const btn = document.getElementById('antigravity-theme-btn');
        let panel = document.getElementById('ag-studio');
        if (!panel) { panel = buildPanel(); document.body.appendChild(panel); }
        const open = force === undefined ? !panel.classList.contains('is-open') : force;
        if (open && btn) {
            studioRefresh();
            positionStudio(panel, btn);
            void panel.offsetWidth; // 先落定初始帧，过渡才会播放
            panel.classList.add('is-open');
        } else {
            panel.classList.remove('is-open');
        }
        if (btn) btn.setAttribute('aria-expanded', String(open));
    }

    function toast(msg) {
        const old = document.getElementById('ag-theme-toast');
        if (old) old.remove();
        const t = h('div', { id: 'ag-theme-toast', role: 'status' }, msg);
        t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483600;max-width:min(560px,calc(100vw - 32px));padding:10px 16px;border-radius:12px;background:rgba(29,29,31,.92);color:#fff;font:500 12.5px/1.45 system-ui,sans-serif;box-shadow:0 12px 32px -8px rgba(0,0,0,.35);-webkit-app-region:no-drag';
        t.onclick = () => t.remove();
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }

    // 应急：Ctrl+Alt+Shift+T 在官方原版和上一个皮肤之间切换，面板打不开时也能用
    const LAST_SKIN_KEY = 'custom-theme-last-skin';
    function toggleSafeMode() {
        const cur = activeThemeId();
        if (cur !== 'stock') {
            try { localStorage.setItem(LAST_SKIN_KEY, cur); } catch (e) {}
            applyTheme('stock');
            toast('已临时切回官方原版。再按 Ctrl+Alt+Shift+T 恢复。');
        } else {
            let back = 'aluminum';
            try { back = resolveThemeId(localStorage.getItem(LAST_SKIN_KEY)); } catch (e) {}
            applyTheme(back);
            toast('已恢复「' + getTheme(back).name + '」。');
        }
        studioRefresh();
    }

    // 给守护进程读：当前皮肤、偏好、待保存的壁纸
    window.__agThemeState = {
        get theme() { return activeThemeId(); },
        get prefs() { return prefs; },
        get wallUploadId() { return wallUpload ? wallUpload.id : null; },
        get wallUpload() { return wallUpload; },
        ackWall(id, res) {
            if (!wallUpload || wallUpload.id !== id) return false;
            const name = wallUpload.name;
            wallUpload = null;
            clearTimeout(wallUploadTimer);
            wallStatus = res && res.ok ? `${name} · 已保存` : `${name} · 保存失败：${(res && res.error) || '未知错误'}`;
            studioRefresh();
            return true;
        }
    };

    // 监听只挂一次，转发到当前这份引擎，热替换后不会有两份旧闭包同时响应
    window.__agStudioHandlers = {
        pointerdown(e) {
            const p = document.getElementById('ag-studio');
            const b = document.getElementById('antigravity-theme-btn');
            if (p && p.classList.contains('is-open') && !p.contains(e.target) && !(b && b.contains(e.target))) studioToggle(false);
        },
        keydown(e) {
            if (e.ctrlKey && e.altKey && e.shiftKey && !e.metaKey && (e.key === 'T' || e.key === 't' || e.code === 'KeyT')) {
                e.preventDefault();
                e.stopPropagation();
                toggleSafeMode();
                return;
            }
            const p = document.getElementById('ag-studio');
            if (e.key === 'Escape' && p && p.classList.contains('is-open')) { studioToggle(false); const b = document.getElementById('antigravity-theme-btn'); if (b) b.focus(); }
        },
        resize() { studioToggle(false); }
    };
    if (!window.__agStudioForwarders) {
        window.__agStudioForwarders = true;
        const fwd = (name) => (e) => { const hd = window.__agStudioHandlers; if (hd && hd[name]) hd[name](e); };
        document.addEventListener('pointerdown', fwd('pointerdown'), true);
        document.addEventListener('keydown', fwd('keydown'), true);
        window.addEventListener('resize', fwd('resize'));
    }
    // ===================== 外观面板 end =====================


    // 立即初始化当前主题（首次应用不回写主存，避免把 localStorage 缺失时的回退值覆盖到真实偏好上）
    loadLocalPrefs();
    applyTheme(getActiveThemeId(), false);
    // 启动校准：以 app 原生持久化存储（nativeStorage）记住的主题与外观偏好为准
    reconcileThemePref();
    reconcileStudioPrefs();

    // 立即尝试挂载与标题栏初始化
    mountThemeSelector();
    syncModalChrome();

    // 动态监听 DOM 变化：挂载选择器、主题/深浅模式同步、看图模态挂载/卸载
    window.__antigravityThemeObserver = new MutationObserver(() => {
        mountThemeSelector();
        syncModalChrome();
        syncThemeState();
    });
    window.__antigravityThemeObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    window.__antigravityThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    // documentElement 级 childList 兜底：客户端从托盘重开时 React 会整体重建 DOM，
    // body 节点被替换会让上面的 body 订阅失联，这里保证仍能收到变更并重挂选择器
    window.__antigravityThemeObserver.observe(document.documentElement, { childList: true, subtree: true });

    // 自愈看门狗：托盘重开等场景下客户端会整体重建 DOM（连 head 一起），主题样式元素
    // 与切换器被一并移除，且不触发导航/dom-ready，body 级 MutationObserver 也会失联。
    // 每 1s 校验一次，缺什么补什么（与看图标题栏 400ms 周期重申同一防御思路）。
    window.__antigravityThemeWatchdog = setInterval(() => {
        try {
            const theme = getTheme(activeThemeId());
            let styleEl = document.getElementById('antigravity-active-theme');
            const missing = !styleEl;
            if (missing) {
                styleEl = document.createElement('style');
                styleEl.id = 'antigravity-active-theme';
                (document.head || document.documentElement).appendChild(styleEl);
            }
            if (styleEl.textContent !== theme.css) {
                styleEl.textContent = theme.css;
            }
            studioEnsure();
            if (missing) {
                // 样式被整体移除说明发生过 DOM 重建：标题栏贴合与切换器一并恢复
                if (activeThemeId() !== 'stock') {
                    enforceTitleBarColor(true);
                }
                mountThemeSelector();
                return;
            }
            const sel = document.getElementById('antigravity-theme-selector');
            if (!sel || (sel.hasAttribute('data-fallback') && document.querySelector('[data-testid="pane-titlebar-toolbar"]'))) {
                mountThemeSelector();
            }
        } catch (e) { }
    }, 1000);

    // 走到这里说明初始化没有中途报错；健康检查据此区分「加载了但坏了」
    window.__agThemeFirst = window.__agThemeFirst || activeThemeId();
    engineReadyAt = Date.now();
    window.__antigravityThemeReady = true;
})();
