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

    const THEMES = /*@@THEMES@@*/;

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

/*@@STUDIO@@*/

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
