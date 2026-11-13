// dsh-antigravity-skin — browser half.
// Loaded at /plugins/dsh-antigravity-skin/client.js through window.__ModuleLoader__.
// Plain CJS factory: no ESM import/export, React via require("react").

window.__ModuleLoader__.load({
	id: "dsh-antigravity-skin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		const React = require("react");

		const STORAGE_KEY = "dsh-antigravity-skin:boot";
		const THEME_PREFIX = "ag-";
		const CRITICAL_STYLE_ID = "dsh-antigravity-skin-critical";
		const API_PATH = "/antigravity-skin/api";

		const SKINS = [
			{ id: "aluminum", name: "铝灰", wall: "aurora", tokens: { base: "#F5F5F7", base2: "#F7F7F9", sidebar: "#FBFBFD", text: "#1D1D1F", text2: "#6E6E73", line: "#E3E3E8", accent: "#0071E3" } },
			{ id: "porcelain", name: "瓷白", wall: "mono", tokens: { base: "#FAFAFA", base2: "#FCFCFC", sidebar: "#FFFFFF", text: "#171717", text2: "#666666", line: "#EBEBEB", accent: "#171717" } },
			{ id: "fog", name: "雾蓝", wall: "bay", tokens: { base: "#F2F5F9", base2: "#F5F7FB", sidebar: "#FAFBFD", text: "#16202E", text2: "#5B6778", line: "#DEE4EC", accent: "#3157D5" } },
			{ id: "sand", name: "沙岩", wall: "dune", tokens: { base: "#F6F4F0", base2: "#F8F6F3", sidebar: "#FCFBF9", text: "#252321", text2: "#6B665F", line: "#E6E1D9", accent: "#A4492A" } },
			{ id: "sage", name: "苔绿", wall: "aurora", tokens: { base: "#F3F6F4", base2: "#F6F8F6", sidebar: "#FBFCFB", text: "#18231E", text2: "#5A6962", line: "#DBE3DE", accent: "#2B7556" } },
		];

		const GRADIENTS = {
			dawn: "radial-gradient(120% 90% at 0% 0%, #FDE2D6 0%, transparent 55%), radial-gradient(90% 80% at 100% 10%, #E4DDFB 0%, transparent 60%), radial-gradient(100% 90% at 60% 100%, #FBEFE3 0%, transparent 60%), #F7F3F1",
			bay: "radial-gradient(110% 90% at 10% 0%, #D3E6FB 0%, transparent 58%), radial-gradient(90% 90% at 100% 30%, #D2F1EC 0%, transparent 60%), radial-gradient(100% 80% at 40% 100%, #E7EEFA 0%, transparent 60%), #F1F5F9",
			aurora: "radial-gradient(90% 80% at 0% 20%, #D5F3E6 0%, transparent 58%), radial-gradient(90% 90% at 70% 0%, #DCE3FD 0%, transparent 58%), radial-gradient(100% 90% at 100% 100%, #EBDDFA 0%, transparent 60%), #F3F5F8",
			dune: "radial-gradient(120% 90% at 100% 0%, #F6E5CF 0%, transparent 58%), radial-gradient(100% 90% at 0% 100%, #EFE4DA 0%, transparent 60%), #F7F4EF",
			mono: "radial-gradient(120% 100% at 50% 0%, #FFFFFF 0%, transparent 60%), linear-gradient(180deg, #F2F2F4 0%, #E9E9EC 100%)",
		};

		const MATERIALS = [
			{ id: "solid", name: "实色" },
			{ id: "frosted", name: "磨砂" },
			{ id: "clear", name: "通透" },
		];

		const WALLS = [
			{ id: "none", name: "无" },
			{ id: "gradient", name: "渐变" },
			{ id: "image", name: "图片" },
			{ id: "url", name: "链接" },
		];

		const WALL_CHIPS = [
			{ id: "none", name: "无" },
			{ id: "auto", name: "跟随皮肤" },
			{ id: "aurora", name: "极光" },
			{ id: "bay", name: "海湾" },
			{ id: "dawn", name: "晨曦" },
			{ id: "dune", name: "沙丘" },
			{ id: "mono", name: "素灰" },
		];

		const ACCENTS = [
			{ id: "#0071E3", name: "蓝" },
			{ id: "#3157D5", name: "靛" },
			{ id: "#5B4CE6", name: "紫" },
			{ id: "#2B7556", name: "绿" },
			{ id: "#A4492A", name: "陶" },
			{ id: "#171717", name: "墨" },
		];

		const DEFAULT_BOOT = {
			theme: "aluminum",
			studio: {
				accent: "#0071E3",
				material: "solid",
				blur: 24,
				opacity: 72,
				wall: "gradient",
				gradient: "auto",
				url: "",
				strength: 70,
				wallBlur: 0,
				fit: "cover",
				frameX: 0,
				frameY: 0,
				frameZoom: 100,
				history: [],
				motion: "standard",
				motionOverride: true,
				lang: "zh",
			},
		};

		const UI_FONT = "\"PingFang SC\", \"PingFangSC-Regular\", \"PingFangSC\", \"\u82f9\u65b9-\u7b80\", \"\u82f9\u65b9\", \"Hiragino Sans GB\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif";

		function findSkin(id) {
			return SKINS.find((s) => s.id === id) || SKINS[0];
		}

		function isHex(value) {
			return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim());
		}

		function clamp(n, min, max, fallback) {
			const v = Number(n);
			return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
		}

		function parseColor(input) {
			const c = String(input || "").trim();
			if (c.startsWith("#")) {
				const hex = c.slice(1);
				if (hex.length === 3) {
					const [r, g, b] = hex.split("").map((h) => parseInt(h + h, 16));
					return { r, g, b, a: 1 };
				}
				if (hex.length === 6 || hex.length === 8) {
					return {
						r: parseInt(hex.slice(0, 2), 16),
						g: parseInt(hex.slice(2, 4), 16),
						b: parseInt(hex.slice(4, 6), 16),
						a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
					};
				}
			}
			const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
			if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
			return { r: 245, g: 245, b: 247, a: 1 };
		}

		function formatColor(c) {
			const a = c.a == null ? 1 : c.a;
			const r = Math.round(c.r);
			const g = Math.round(c.g);
			const b = Math.round(c.b);
			if (a >= 0.999) return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
			return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1000) / 1000})`;
		}

		function rgba(color, a) {
			const c = parseColor(color);
			return formatColor({ r: c.r, g: c.g, b: c.b, a: Math.max(0, Math.min(1, a)) });
		}

		function mix(a, b, t) {
			const A = parseColor(a);
			const B = parseColor(b);
			const s = Math.max(0, Math.min(1, t));
			return formatColor({
				r: A.r + (B.r - A.r) * s,
				g: A.g + (B.g - A.g) * s,
				b: A.b + (B.b - A.b) * s,
				a: (A.a ?? 1) + ((B.a ?? 1) - (A.a ?? 1)) * s,
			});
		}

		function darken(color, t) {
			return mix(color, "#000000", t);
		}

		function safeUrl(u) {
			if (typeof u !== "string") return "";
			const s = u.trim();
			if (!/^https?:\/\//i.test(s)) return "";
			if (/[\s"'<>\\]/.test(s) || s.length > 2048) return "";
			return s;
		}

		function normalizeBoot(input) {
			const next = {
				theme: DEFAULT_BOOT.theme,
				studio: Object.assign({}, DEFAULT_BOOT.studio),
			};
			if (!input || typeof input !== "object") return next;
			const legacy = !input.studio && (input.skin || input.wallpaper || input.opacity != null);
			const theme = legacy ? input.skin : input.theme;
			if (SKINS.some((s) => s.id === theme) || theme === "stock") next.theme = theme;
			const src = legacy
				? {
					accent: input.accent,
					material: input.material,
					blur: input.blur,
					opacity: input.opacity,
					wall: input.wallpaper === "none" ? "none" : (input.wall || "gradient"),
					gradient: input.wallpaper && input.wallpaper !== "none" && input.wallpaper !== "auto" ? input.wallpaper : (input.gradient || (input.wallpaper === "auto" ? "auto" : undefined)),
					url: input.url,
					strength: input.strength,
					wallBlur: input.wallBlur,
					fit: input.fit,
					motion: input.motion,
					motionOverride: input.motionOverride,
					lang: input.lang,
				}
				: (input.studio && typeof input.studio === "object" ? input.studio : {});
			const st = next.studio;
			st.accent = isHex(src.accent) ? "#" + src.accent.trim().slice(1).toUpperCase() : "";
			if (src.material === "solid" || src.material === "frosted" || src.material === "clear") st.material = src.material;
			st.blur = clamp(src.blur, 0, 60, st.blur);
			st.opacity = clamp(src.opacity, 30, 100, st.opacity);
			if (src.wall === "none" || src.wall === "gradient" || src.wall === "image" || src.wall === "url") st.wall = src.wall;
			if (src.gradient === "auto" || Object.prototype.hasOwnProperty.call(GRADIENTS, src.gradient)) st.gradient = src.gradient;
			st.url = safeUrl(src.url);
			st.strength = clamp(src.strength, 0, 100, st.strength);
			st.wallBlur = clamp(src.wallBlur, 0, 40, st.wallBlur);
			st.fit = src.fit === "contain" ? "contain" : "cover";
			st.frameX = clamp(src.frameX, -100, 100, st.frameX);
			st.frameY = clamp(src.frameY, -100, 100, st.frameY);
			st.frameZoom = clamp(src.frameZoom, 50, 200, st.frameZoom);
			st.history = Array.isArray(src.history)
				? src.history.filter((item) => item && (item.kind === "image" || (item.kind === "url" && safeUrl(item.url)))).slice(0, 6).map((item) => item.kind === "url" ? { kind: "url", url: safeUrl(item.url) } : { kind: "image" })
				: st.history;
			if (src.motion === "rich" || src.motion === "standard" || src.motion === "off") st.motion = src.motion;
			st.motionOverride = src.motionOverride === true;
			st.lang = src.lang === "en" ? "en" : "zh";
			if (typeof input.savedAt === "string") next.savedAt = input.savedAt;
			return next;
		}

		function fillAmount(studio) {
			if (studio.material === "solid") return 1;
			if (studio.material === "clear") return (studio.opacity / 100) * 0.7;
			return studio.opacity / 100;
		}

		function veilOpacity(studio) {
			return ((100 - studio.strength) / 100) * 0.85;
		}

		function popAlpha(fill) {
			return Math.max(0.86, Math.min(1, (Math.round(fill * 100 + 20)) / 100));
		}

		function effectiveAccent(boot) {
			const skin = findSkin(boot.theme);
			return isHex(boot.studio.accent) ? boot.studio.accent : skin.tokens.accent;
		}

		const WALL_SERVE_PATH = "/antigravity-skin/wall";

		function wallBackground(boot) {
			const studio = boot.studio;
			const skin = findSkin(boot.theme);
			if (studio.wall === "none") return "";
			const fit = studio.fit === "contain" ? "center / contain" : "center / cover";
			if (studio.wall === "url") {
				const u = safeUrl(studio.url);
				return u ? `url("${u}") ${fit} no-repeat, ${skin.tokens.base}` : "";
			}
			if (studio.wall === "image") {
				const cache = boot.savedAt ? ("?v=" + encodeURIComponent(boot.savedAt)) : "";
				return `url("${WALL_SERVE_PATH}${cache}") ${fit} no-repeat, ${skin.tokens.base}`;
			}
			const id = studio.gradient === "auto" ? skin.wall : studio.gradient;
			return GRADIENTS[id] || GRADIENTS.aurora;
		}

		function wallPreview(boot, skin) {
			const studio = boot.studio;
			if (studio.wall === "none") return skin.tokens.base;
			if (studio.wall === "url" || studio.wall === "image") return wallBackground(boot) || skin.tokens.base;
			const id = studio.gradient === "auto" ? skin.wall : studio.gradient;
			return GRADIENTS[id] || GRADIENTS.aurora;
		}

		function buildTokens(boot) {
			const t = findSkin(boot.theme).tokens;
			const studio = boot.studio;
			const accent = effectiveAccent(boot);
			const fill = fillAmount(studio);
			const wallOn = !!wallBackground(boot);
			const sidebarA = fill;
			const pop = popAlpha(fill);
			const canvas = wallOn ? "transparent" : rgba(t.base, fill);
			const layer = wallOn ? "transparent" : rgba(t.base2, fill);
			return {
				"--dsw-alias-bg-base": canvas,
				"--dsw-alias-bg-layer-1": layer,
				"--dsw-alias-bg-layer-2": rgba(t.sidebar, pop),
				"--dsw-alias-bg-layer-3": wallOn ? "transparent" : rgba(t.base2, Math.min(1, fill + 0.04)),
				"--dsw-alias-bg-module-platform": canvas,
				"--dsw-alias-bg-overlay": rgba(t.sidebar, pop),
				"--dsw-alias-bg-skeleton": rgba(t.text, 0.04),
				"--dsw-alias-bg-mask-drop": rgba(t.base, 0.55),
				"--dsw-menu-surface-fill": rgba(t.sidebar, pop),
				"--dsw-menu-backdrop-filter": studio.material === "solid" ? "none" : `blur(${studio.blur}px) saturate(1.7)`,
				"--dsw-alias-menu-group-header-fill": rgba(t.sidebar, Math.min(1, pop + 0.04)),
				"--dsw-alias-label-primary": t.text,
				"--dsw-alias-label-secondary": t.text2,
				"--dsw-alias-label-tertiary": mix(t.text2, t.base, 0.28),
				"--dsw-alias-brand-primary": accent,
				"--dsw-alias-brand-primary-soft": rgba(accent, 0.14),
				"--dsw-alias-brand-text": "#FFFFFF",
				"--dsw-alias-button-primary-fill": accent,
				"--dsw-alias-button-primary-hover": darken(accent, 0.12),
				"--dsw-alias-button-primary-dimmed": rgba(accent, 0.16),
				"--dsw-alias-button-elevated-fill": rgba(t.sidebar, fill),
				"--dsw-alias-border-l1": t.line,
				"--dsw-alias-border-l2": mix(t.line, t.text, 0.12),
				"--dsw-alias-border-l3": mix(t.line, t.text, 0.22),
				"--dsw-alias-border-l4": mix(t.line, t.text, 0.32),
				"--dsw-alias-border-l2-darkmode-thin": rgba(t.line, 0.85),
				"--dsw-alias-interactive-bg-hover": rgba(accent, 0.1),
				"--dsw-alias-interactive-bg-active": rgba(accent, 0.17),
				"--dsw-alias-interactive-bg-hover-danger": "rgba(208, 52, 44, 0.13)",
				"--dsw-focus-ring-color": accent,
				"--dsw-alias-button-tool-bar-fill": rgba(t.text, 0.06),
				"--dsw-alias-button-tool-bar-hover": rgba(t.text, 0.12),
				"--dsw-alias-file-diff-added-bg": "rgba(0, 121, 53, 0.115)",
				"--dsw-alias-file-diff-added-gutter": "rgba(0, 121, 53, 0.165)",
				"--dsw-alias-file-diff-added-marker": "#007935",
				"--dsw-alias-file-diff-deleted-bg": "rgba(182, 50, 45, 0.115)",
				"--dsw-alias-file-diff-deleted-gutter": "rgba(182, 50, 45, 0.165)",
				"--dsw-alias-file-diff-deleted-marker": "#B6322D",
				"--dsw-alias-state-business-primary": accent,
				"--dsw-alias-state-business-tertiary": rgba(accent, 0.12),
				"--dsw-alias-state-success-primary": "#1F7F48",
				"--dsw-alias-state-warn-primary": "#B5520B",
				"--dsw-alias-state-warn-secondary": "rgba(181, 82, 11, 0.14)",
				"--dsw-alias-state-error-primary": "#D0342C",
				"--dsw-alias-markdown-code-block": rgba(t.text, 0.05),
				"--dsw-alias-markdown-inline-code": rgba(t.text, 0.07),
				"--dsw-alias-markdown-tag": rgba(accent, 0.14),
				"--dsw-alias-scrollbar-bg-l1": rgba(t.text, 0.12),
				"--dsw-alias-scrollbar-bg-l2": rgba(t.text, 0.16),
				"--dsw-alias-scrollbar-hover-l1": rgba(t.text, 0.28),
				"--dsw-alias-scrollbar-hover-l2": rgba(t.text, 0.28),
				"--dsw-alias-settings-card-fill": rgba(t.sidebar, fill),
				"--dsw-specific-sidebar-fill": rgba(t.sidebar, sidebarA),
				"--dsw-specific-sidebar-nav-item-active": rgba(accent, 0.12),
				"--dsw-specific-sidebar-nav-item-hover": rgba(t.text, 0.05),
				"--dsw-specific-input-major": rgba(t.sidebar, fill),
				"--dsw-specific-tip": rgba(t.sidebar, pop),
				"--dsw-specific-selector": rgba(t.base2, fill),
				"--dsw-specific-menu": rgba(t.sidebar, pop),
				"--dsw-specific-bubble": rgba(t.sidebar, fill),
				"--dsw-specific-bubble-highlight": rgba(accent, 0.14),
				"--dsw-font-family": UI_FONT,
			};
		}

		function wallTransform(studio) {
			const x = Number(studio.frameX) || 0;
			const y = Number(studio.frameY) || 0;
			const z = ((Number(studio.frameZoom) || 100) / 100) * ((studio.wallBlur || 0) > 0 ? 1.06 : 1);
			return "translate(" + x + "%, " + y + "%) scale(" + z + ")";
		}

		function buildCriticalCss(boot) {
			const skin = findSkin(boot.theme);
			const tokens = buildTokens(boot);
			const wall = wallBackground(boot);
			const veil = veilOpacity(boot.studio);
			const fill = fillAmount(boot.studio);
			const glass = boot.studio.material !== "solid";
			const filter = glass ? `blur(${boot.studio.blur}px) saturate(1.7) brightness(1.06)` : "none";
			const fallback = wall ? (wall.split(",").pop() || skin.tokens.base).trim() : skin.tokens.base;
			const vars = Object.keys(tokens).map((k) => k + ":" + tokens[k]).join(";");
			const wallRules = wall ? (
				"html.dsh-ag-skin[data-dsh-ag-wall]{--dsh-ag-wall-bg:" + wall + ";--dsh-ag-wall-blur:" + (boot.studio.wallBlur || 0) + "px;--dsh-ag-wall-veil:" + veil.toFixed(3) + ";--dsh-ag-wall-transform:" + wallTransform(boot.studio) + ";--dsh-ag-wall-veil-color:" + skin.tokens.base + ";--dsh-ag-sidebar:" + skin.tokens.sidebar + ";--dsh-ag-fill:" + fill + ";background-color:" + fallback + ";}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall] body{background:transparent !important;isolation:isolate;position:relative;z-index:0;}"
				+ "#dsh-ag-wall{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;display:none;contain:strict;}"
				+ "html[data-windows-titlebar] #dsh-ag-wall{top:36px;}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall] #dsh-ag-wall{display:block;}"
				+ "#dsh-ag-wall .dsh-ag-wall-img{position:absolute;inset:calc(var(--dsh-ag-wall-blur, 0px) * -2);background:var(--dsh-ag-wall-bg, none);background-repeat:no-repeat;filter:blur(var(--dsh-ag-wall-blur, 0px));transform:var(--dsh-ag-wall-transform, none);}"
				+ "#dsh-ag-wall .dsh-ag-wall-veil{position:absolute;inset:0;background:var(--dsh-ag-wall-veil-color, #F5F5F7);opacity:var(--dsh-ag-wall-veil, 0.255);}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall] #root,html.dsh-ag-skin[data-dsh-ag-wall] #app,html.dsh-ag-skin[data-dsh-ag-wall] div:has(> [data-shell-overlay]){background-color:transparent !important;background-image:none !important;}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall][data-windows-titlebar] div:has(> [data-shell-overlay]){--dsh-windows-content-radius:0px !important;}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall][data-windows-titlebar] div:has(> [data-shell-overlay])::before{background:var(--dsh-ag-sidebar, #FBFBFD) !important;}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall] [class*='_sidebarCol'],html.dsh-ag-skin[data-dsh-ag-wall] div:has(> [data-shell-overlay]) > div:has([class*='_logoRow']){background:color-mix(in srgb, var(--dsh-ag-sidebar, #FBFBFD) calc(38% * var(--dsh-ag-fill, 1)), transparent) !important;}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall] [class*='_sidebarCol'] *,html.dsh-ag-skin[data-dsh-ag-wall] div:has(> [data-shell-overlay]) > div:has([class*='_logoRow']) *{--dsw-specific-sidebar-fill:transparent !important;}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall] [data-dsh-ag-sidebar]{background:color-mix(in srgb, var(--dsh-ag-sidebar, #FBFBFD) calc(38% * var(--dsh-ag-fill, 1)), transparent) !important;}"
				+ "html.dsh-ag-skin[data-dsh-ag-wall] [data-dsh-ag-sidebar] *{--dsw-specific-sidebar-fill:transparent !important;}"
			) : "";
			const glassRules = glass ? (
				"html.dsh-ag-skin[data-dsh-ag-glass] [data-sidebar],html.dsh-ag-skin[data-dsh-ag-glass] [data-sidebar-right-panel],html.dsh-ag-skin[data-dsh-ag-glass] [role=\"menu\"],html.dsh-ag-skin[data-dsh-ag-glass] [role=\"dialog\"],html.dsh-ag-skin[data-dsh-ag-glass] [data-radix-popper-content-wrapper]{backdrop-filter:" + filter + ";-webkit-backdrop-filter:" + filter + ";}"
			) : "";
			const varsImportant = Object.keys(tokens).map((k) => k + ":" + tokens[k] + " !important").join(";");
			const bodyBg = wall ? "transparent" : fallback;
			const typo = "\nhtml.dsh-ag-skin,\nhtml.dsh-ag-skin body {\n  --dsw-font-family: \"PingFang SC\", \"PingFangSC-Regular\", \"PingFangSC\", \"\u82f9\u65b9-\u7b80\", \"\u82f9\u65b9\", \"Hiragino Sans GB\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif;\n  font-family: \"PingFang SC\", \"PingFangSC-Regular\", \"PingFangSC\", \"\u82f9\u65b9-\u7b80\", \"\u82f9\u65b9\", \"Hiragino Sans GB\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", sans-serif!important;\n  -webkit-font-smoothing: auto;\n  text-rendering: auto;\n}\nhtml.dsh-ag-skin button,\nhtml.dsh-ag-skin input,\nhtml.dsh-ag-skin textarea,\nhtml.dsh-ag-skin select,\nhtml.dsh-ag-skin option {\n  font-family: inherit !important;\n}\nhtml.dsh-ag-skin *:not(pre):not(code):not(kbd):not(samp):not(tt):not([class*=\"font-mono\"]):not([class*=\"text-code\"]):not([class*=\"codicon\"]):not([class*=\"iconfont\"]):not([class*=\"remixicon\"]):not([class^=\"icon-\"]) {\n  font-family: inherit !important;\n}\nhtml.dsh-ag-skin pre,\nhtml.dsh-ag-skin code,\nhtml.dsh-ag-skin kbd,\nhtml.dsh-ag-skin samp,\nhtml.dsh-ag-skin tt,\nhtml.dsh-ag-skin [class*=\"font-mono\"],\nhtml.dsh-ag-skin [class*=\"text-code\"] {\n  font-family: ui-monospace, \"SF Mono\", \"Sarasa Mono SC\", \"Cascadia Code\", Consolas, \"Microsoft YaHei UI\", monospace !important;\n}";
			return "html.dsh-ag-skin{" + vars + ";--dsw-font-family:" + UI_FONT + ";--dsh-ag-fill:" + fill.toFixed(3) + ";--dsh-ag-filter:" + filter + ";background-color:" + fallback + ";color-scheme:light;font-family:" + UI_FONT + " !important;}"
				+ "html.dsh-ag-skin body{" + varsImportant + ";--dsw-font-family:" + UI_FONT + " !important;background:" + bodyBg + " !important;color-scheme:light !important;font-family:" + UI_FONT + " !important;}"
				+ wallRules + glassRules + typo;
		}

		function applyDocumentAttrs(boot) {
			const root = document.documentElement;
			root.classList.add("dsh-ag-skin");
			if (wallBackground(boot)) root.setAttribute("data-dsh-ag-wall", "1");
			else root.removeAttribute("data-dsh-ag-wall");
			if (boot.studio.material !== "solid") root.setAttribute("data-dsh-ag-glass", "1");
			else root.removeAttribute("data-dsh-ag-glass");
		}

		function ensureWallLayer(boot) {
			const on = !!wallBackground(boot);
			const body = document.body;
			let wall = document.getElementById("dsh-ag-wall");
			if (!on) {
				if (wall && wall.parentNode) wall.parentNode.removeChild(wall);
				return;
			}
			if (!body) return;
			if (!wall) {
				wall = document.createElement("div");
				wall.id = "dsh-ag-wall";
				wall.setAttribute("aria-hidden", "true");
				wall.innerHTML = '<div class="dsh-ag-wall-img"></div><div class="dsh-ag-wall-veil"></div>';
			}
			if (wall.parentNode !== body || body.firstChild !== wall) {
				body.insertBefore(wall, body.firstChild);
			}
		}


		function sidebarWashColor(boot) {
			const skin = findSkin(boot.theme);
			const fill = fillAmount(boot.studio);
			return rgba(skin.tokens.sidebar, 0.38 * fill);
		}

		function isChromeChild(el) {
			return !!(el && (el.hasAttribute("data-shell-overlay") || el.hasAttribute("data-shell-bottom") || el.hasAttribute("data-shell-leading") || el.hasAttribute("data-sidebar-mask")));
		}

		function isSidebarSized(el) {
			if (!el || el.nodeType !== 1) return false;
			const r = el.getBoundingClientRect();
			const vw = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0;
			const vh = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0;
			return r.width >= 80 && r.width <= Math.max(220, vw * 0.45) && r.height >= Math.max(200, vh * 0.4) && r.left < vw * 0.45;
		}

		function looksLikeSidebar(el) {
			if (!el || isChromeChild(el) || !isSidebarSized(el)) return false;
			const text = (el.textContent || "").replace(/\s+/g, " ");
			if (/新会话|插件市场|工作区|自动化任务/.test(text)) return true;
			const cls = typeof el.className === "string" ? el.className : (el.getAttribute && el.getAttribute("class") || "");
			return cls.indexOf("sidebarCol") !== -1;
		}

		function findSidebarColumn() {
			const marked = document.querySelector("[data-dsh-ag-sidebar]");
			if (marked && marked.isConnected && isSidebarSized(marked)) return marked;
			const frame = document.querySelector("div:has(> [data-shell-overlay])");
			if (frame) {
				for (let i = 0; i < frame.children.length; i++) {
					if (looksLikeSidebar(frame.children[i])) return frame.children[i];
				}
			}
			const byClass = document.querySelector('[class*="sidebarCol"]');
			if (byClass && isSidebarSized(byClass)) return byClass;
			return null;
		}

		function flattenSidebarUnderlays(col) {
			const cr = col.getBoundingClientRect();
			if (cr.width < 8 || cr.height < 8) return;
			const nodes = col.querySelectorAll("*");
			for (let i = 0; i < nodes.length; i++) {
				const el = nodes[i];
				const r = el.getBoundingClientRect();
				if (r.width < cr.width * 0.85 || r.height < cr.height * 0.5) continue;
				const bg = window.getComputedStyle(el).backgroundColor || "";
				const m = bg.match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/);
				if (!m) continue;
				const a = m[4] == null ? 1 : parseFloat(m[4]);
				const r0 = parseFloat(m[1]), g = parseFloat(m[2]), b = parseFloat(m[3]);
				if (a >= 0.55 && r0 >= 220 && g >= 220 && b >= 220) {
					el.style.setProperty("background", "transparent", "important");
					el.style.setProperty("background-color", "transparent", "important");
					el.style.setProperty("background-image", "none", "important");
				}
			}
		}

		let liveSidebarBoot = null;
		let sidebarObserver = null;
		let sidebarWatchTimer = 0;
		let sidebarRetry = 0;

		function clearSidebarMarks() {
			const all = document.querySelectorAll("[data-dsh-ag-sidebar]");
			for (let i = 0; i < all.length; i++) all[i].removeAttribute("data-dsh-ag-sidebar");
		}

		function ensureSidebarWash(boot) {
			liveSidebarBoot = boot;
			const on = !!wallBackground(boot);
			if (!on) {
				clearSidebarMarks();
				return;
			}
			const col = findSidebarColumn();
			if (!col) {
				if (sidebarRetry < 40 && typeof requestAnimationFrame === "function") {
					sidebarRetry += 1;
					requestAnimationFrame(() => {
						try { ensureSidebarWash(liveSidebarBoot || boot); } catch (e) {}
					});
				}
				watchSidebar();
				return;
			}
			sidebarRetry = 0;
			const marked = document.querySelectorAll("[data-dsh-ag-sidebar]");
			for (let i = 0; i < marked.length; i++) {
				if (marked[i] !== col) marked[i].removeAttribute("data-dsh-ag-sidebar");
			}
			col.setAttribute("data-dsh-ag-sidebar", "");
			col.style.setProperty("background", sidebarWashColor(boot), "important");
			col.style.setProperty("background-image", "none", "important");
			flattenSidebarUnderlays(col);
			watchSidebar();
		}

		function watchSidebar() {
			if (sidebarObserver || typeof MutationObserver !== "function" || !document.body) return;
			sidebarObserver = new MutationObserver(() => {
				if (sidebarWatchTimer) return;
				sidebarWatchTimer = setTimeout(() => {
					sidebarWatchTimer = 0;
					try { if (liveSidebarBoot) ensureSidebarWash(liveSidebarBoot); } catch (e) {}
				}, 80);
			});
			sidebarObserver.observe(document.body, { childList: true, subtree: true });
		}

		function applyCriticalCss(boot) {
			applyDocumentAttrs(boot);
			let el = document.getElementById(CRITICAL_STYLE_ID);
			if (!el) {
				el = document.createElement("style");
				el.id = CRITICAL_STYLE_ID;
				(document.head || document.documentElement).appendChild(el);
			}
			el.textContent = buildCriticalCss(boot);
			ensureWallLayer(boot);
			ensureSidebarWash(boot);
		}

		function wallChipId(boot) {
			if (boot.studio.wall === "none") return "none";
			if (boot.studio.wall === "image") return "image";
			if (boot.studio.wall === "url") return "url";
			return boot.studio.gradient === "auto" ? "auto" : boot.studio.gradient;
		}

		function patchWall(boot, chipId) {
			const studio = Object.assign({}, boot.studio);
			if (chipId === "none") {
				studio.wall = "none";
			} else if (chipId === "auto") {
				studio.wall = "gradient";
				studio.gradient = "auto";
			} else {
				studio.wall = "gradient";
				studio.gradient = chipId;
			}
			return Object.assign({}, boot, { studio: studio });
		}

		function patchStudio(boot, patch) {
			return Object.assign({}, boot, { studio: Object.assign({}, boot.studio, patch) });
		}

		function readBootFromDom() {
			if (window.__dshAgSkinBoot && typeof window.__dshAgSkinBoot === "object") {
				return window.__dshAgSkinBoot;
			}
			try {
				const el = document.getElementById("dsh-antigravity-skin-boot");
				if (el && el.textContent) {
					const parsed = JSON.parse(el.textContent);
					if (parsed && typeof parsed === "object") {
						window.__dshAgSkinBoot = parsed;
						return parsed;
					}
				}
			} catch (e) {}
			return null;
		}

		function readLocalBoot() {
			const injected = readBootFromDom();
			if (injected) return normalizeBoot(injected);
			try {
				const raw = window.localStorage.getItem(STORAGE_KEY);
				if (raw) return normalizeBoot(JSON.parse(raw));
			} catch (e) {}
			return normalizeBoot(DEFAULT_BOOT);
		}

		function getService(ctx, name) {
			try {
				if (typeof ctx.get === "function") {
					const value = ctx.get(name);
					if (value !== undefined) return value;
				}
			} catch (e) {}
			try {
				return ctx[name];
			} catch (e) {
				return undefined;
			}
		}

		function reportError(error) {
			console.error("[dsh-antigravity-skin]", error);
			try {
				fetch(API_PATH, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						method: "log",
						message: String(error && (error.message || error)),
						stack: error && error.stack ? String(error.stack) : "",
					}),
				}).catch(function () {});
			} catch (e) {}
		}

		function writeLocalBoot(boot) {
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(boot));
			} catch (e) {}
			window.__dshAgSkinBoot = boot;
		}

		async function hostGet() {
			try {
				const res = await fetch(API_PATH, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ method: "get" }),
				});
				const data = await res.json();
				if (data && data.ok && data.boot) return normalizeBoot(data.boot);
			} catch (e) {}
			return null;
		}

		async function hostSet(boot) {
			try {
				const res = await fetch(API_PATH, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ method: "set", boot: boot }),
				});
				const data = await res.json();
				if (data && data.ok && data.boot) return normalizeBoot(data.boot);
			} catch (e) {}
			return boot;
		}

		const STUDIO_CSS = `#dsh-ag-studio{
  --st-ease:cubic-bezier(.32,.72,0,1);
  --st-spring:cubic-bezier(.34,1.36,.64,1);
  --st-text:var(--dsw-alias-label-primary,#1D1D1F);
  --st-text-2:color-mix(in srgb,var(--st-text,#1D1D1F) 68%,#fff);
  --st-line:color-mix(in srgb,var(--st-text) 9%,transparent);
  --st-fill:color-mix(in srgb,var(--st-text) 5%,transparent);
  --st-fill-2:color-mix(in srgb,var(--st-text) 8%,transparent);
  --st-accent:var(--dsw-alias-brand-primary,#0071E3);
  --st-side:#fff;
  color:var(--st-text);
  font-family:"Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "PingFangSC-Regular", sans-serif !important;
  font-size:14px;
  line-height:1.55;
  letter-spacing:0;
  padding:0 0 10px;
}
#dsh-ag-studio *,#dsh-ag-studio *::before,#dsh-ag-studio *::after{box-sizing:border-box;}
#dsh-ag-studio button,#dsh-ag-studio input{font:inherit !important;color:inherit;}
#dsh-ag-studio button{appearance:none !important;-webkit-appearance:none !important;cursor:default;margin:0;-webkit-tap-highlight-color:transparent;}
#dsh-ag-studio input:not([type="range"]):not([type="file"]):not([type="color"]){appearance:none !important;-webkit-appearance:none !important;}
#dsh-ag-studio :focus-visible{outline:2px solid color-mix(in srgb,var(--st-accent) 55%,transparent);outline-offset:2px;}
#dsh-ag-studio [hidden]{display:none !important;}

#dsh-ag-studio .st-head{display:flex !important;flex-direction:row !important;align-items:center !important;justify-content:space-between !important;gap:12px;margin:0 0 10px;padding:0;}
#dsh-ag-studio .st-title{font-size:17px;font-weight:600;letter-spacing:0;}
#dsh-ag-studio .st-link{border:0 !important;background:none !important;padding:2px 4px !important;margin:0 !important;height:auto !important;width:auto !important;border-radius:5px !important;color:var(--st-accent) !important;font-size:14px !important;font-weight:500 !important;box-shadow:none !important;}
@media (hover:hover){#dsh-ag-studio .st-link:hover{background:var(--st-fill) !important;}}

#dsh-ag-studio .st-preview{position:relative !important;display:block !important;height:208px !important;min-height:208px !important;max-height:208px !important;border-radius:16px !important;overflow:hidden !important;isolation:isolate;background:var(--hero-base,#F5F5F7) !important;box-shadow:0 0 0 1px rgba(29,29,31,.08),0 18px 40px -24px rgba(16,18,28,.4) !important;margin:0 0 4px !important;}
#dsh-ag-studio .st-preview-wall,#dsh-ag-studio .st-preview-veil{position:absolute !important;inset:0 !important;pointer-events:none;}
#dsh-ag-studio .st-preview-wall{background:var(--hero-wall,var(--hero-base,#F5F5F7)) !important;filter:blur(var(--hero-wblur,0px));transform:var(--hero-transform,none);}
#dsh-ag-studio .st-preview-veil{background:var(--hero-base,#F5F5F7);opacity:var(--hero-veil,0);}
#dsh-ag-studio .st-preview-app{position:absolute !important;left:22px !important;right:22px !important;top:28px !important;bottom:0 !important;border-radius:12px 12px 0 0 !important;overflow:hidden !important;display:flex !important;flex-direction:column !important;background:color-mix(in srgb,var(--hero-base,#F5F5F7) calc(var(--hero-fill,1)*100%),transparent) !important;backdrop-filter:var(--hero-filter,none);-webkit-backdrop-filter:var(--hero-filter,none);box-shadow:0 16px 36px rgba(16,18,28,.16),0 0 0 1px var(--hero-line,#E3E3E8) !important;}
#dsh-ag-studio .st-preview-bar{height:32px !important;min-height:32px !important;flex:none !important;display:flex !important;align-items:center !important;gap:8px;padding:0 12px !important;border-bottom:1px solid var(--hero-line,#E3E3E8);color:var(--hero-text-2,#6E6E73);font-size:11px !important;font-weight:550;background:color-mix(in srgb,var(--hero-side,#fff) 80%,transparent);}
#dsh-ag-studio .st-preview-dots{display:flex;gap:5px;flex:none;}
#dsh-ag-studio .st-preview-dots i{width:7px;height:7px;border-radius:50%;background:color-mix(in srgb,var(--hero-text,#1D1D1F) 18%,transparent);display:block;}
#dsh-ag-studio .st-preview-body{flex:1 1 auto !important;display:flex !important;min-height:0 !important;}
#dsh-ag-studio .st-preview-side{width:76px !important;flex:none !important;padding:12px 10px;display:flex;flex-direction:column;gap:8px;background:color-mix(in srgb,var(--hero-side,#fff) calc(var(--hero-side-a,1)*100%),transparent) !important;border-right:1px solid var(--hero-line,#E3E3E8);}
#dsh-ag-studio .st-preview-nav{height:6px !important;min-height:6px !important;border-radius:999px;width:70%;background:color-mix(in srgb,var(--hero-text,#1D1D1F) 12%,transparent);}
#dsh-ag-studio .st-preview-nav.is-on{width:86%;background:color-mix(in srgb,var(--hero-accent,#0071E3) 78%,var(--hero-side,#fff));}
#dsh-ag-studio .st-preview-nav:nth-child(2){width:58%;}
#dsh-ag-studio .st-preview-nav:nth-child(3){width:66%;}
#dsh-ag-studio .st-preview-main{flex:1 !important;padding:12px 14px 10px;display:flex;flex-direction:column;gap:8px;min-width:0;}
#dsh-ag-studio .st-preview-bubble{align-self:flex-start;width:72%;padding:8px 10px;border-radius:10px 10px 10px 4px;background:color-mix(in srgb,var(--hero-side,#fff) 92%,var(--hero-text,#1D1D1F));box-shadow:0 0 0 1px var(--hero-line,#E3E3E8);}
#dsh-ag-studio .st-preview-bubble.is-me{align-self:flex-end;width:54%;border-radius:10px 10px 4px 10px;background:color-mix(in srgb,var(--hero-accent,#0071E3) 18%,#fff) !important;box-shadow:none;}
#dsh-ag-studio .st-preview-line{height:4px !important;border-radius:2px;background:color-mix(in srgb,var(--hero-text,#1D1D1F) 20%,transparent);}
#dsh-ag-studio .st-preview-line.s{width:62%;opacity:.5;margin-top:5px;}
#dsh-ag-studio .st-preview-composer{margin-top:auto;height:24px !important;min-height:24px !important;border-radius:8px;display:flex;align-items:center;justify-content:flex-end;padding:0 5px;background:color-mix(in srgb,var(--hero-side,#fff) 88%,transparent);box-shadow:0 0 0 1px var(--hero-line,#E3E3E8);}
#dsh-ag-studio .st-preview-send{width:14px;height:14px;border-radius:50%;background:var(--hero-accent,#0071E3) !important;}

#dsh-ag-studio .st-zone{padding:16px 0 4px;}
#dsh-ag-studio .st-zone + .st-zone{border-top:.5px solid var(--st-line);}
#dsh-ag-studio .st-zone-title{margin:0 0 12px;font-size:14px;font-weight:600;letter-spacing:0;color:color-mix(in srgb,var(--st-text) 82%,transparent);}
#dsh-ag-studio .st-label{display:flex;align-items:baseline;justify-content:space-between;margin:12px 0 9px;font-size:14px;font-weight:600;letter-spacing:0;color:color-mix(in srgb,var(--st-text) 82%,transparent);}
#dsh-ag-studio .st-zone-title + .st-label,#dsh-ag-studio .st-label:first-child{margin-top:0;}
#dsh-ag-studio .st-label em{font-style:normal;font-weight:500;letter-spacing:0;font-variant-numeric:tabular-nums;color:var(--st-text);}
#dsh-ag-studio .st-hint{margin-top:8px;font-size:13px;color:color-mix(in srgb,var(--st-text) 62%,transparent);}
#dsh-ag-studio .st-note{margin-top:8px;font-size:13px;color:color-mix(in srgb,var(--st-text) 62%,transparent);}
#dsh-ag-studio .st-note.is-warn{color:#B4560B;}

#dsh-ag-studio .st-skins{display:grid !important;grid-template-columns:repeat(5,1fr);gap:12px 8px;}
@media (max-width:560px){#dsh-ag-studio .st-skins{grid-template-columns:repeat(3,1fr);}}
#dsh-ag-studio .st-skin{border:0 !important;background:none !important;padding:0 !important;margin:0 !important;height:auto !important;width:auto !important;text-align:center;box-shadow:none !important;}
#dsh-ag-studio .st-skin-art{position:relative !important;display:block !important;height:78px !important;min-height:78px !important;border-radius:12px !important;overflow:hidden !important;background:var(--a-wall,var(--a-base,#F5F5F7)) !important;box-shadow:0 0 0 .5px color-mix(in srgb,var(--st-text) 14%,transparent),0 6px 16px -10px rgba(16,18,28,.35);}
#dsh-ag-studio .st-skin-ui{position:absolute !important;left:8px !important;right:8px !important;top:26px !important;bottom:0 !important;border-radius:8px 8px 0 0 !important;overflow:hidden !important;display:flex !important;background:var(--a-base,#F5F5F7) !important;box-shadow:0 8px 18px rgba(16,18,28,.14),0 0 0 1px var(--a-line,#E3E3E8);}
#dsh-ag-studio .st-skin-side{width:30% !important;flex:none !important;background:var(--a-side,#fff) !important;border-right:1px solid var(--a-line,#E3E3E8);}
#dsh-ag-studio .st-skin-main{flex:1;padding:8px 7px 0;display:flex;flex-direction:column;gap:5px;background:var(--a-base,#F5F5F7);}
#dsh-ag-studio .st-skin-main i{display:block;height:3px;width:70%;border-radius:2px;background:var(--a-text,#1D1D1F);opacity:.32;}
#dsh-ag-studio .st-skin-main i:nth-child(2){width:46%;opacity:.16;}
#dsh-ag-studio .st-skin-main b{margin-top:auto;align-self:flex-end;width:36%;height:8px;margin-bottom:8px;border-radius:4px;background:var(--a-accent,#0071E3) !important;}
#dsh-ag-studio .st-skin-name{display:block;margin-top:7px;font-size:14px;font-weight:500;color:var(--st-text);}
@media (hover:hover){#dsh-ag-studio .st-skin:hover .st-skin-art{transform:translateY(-2px);transition:transform 240ms var(--st-spring);}}
#dsh-ag-studio .st-skin[aria-pressed="true"] .st-skin-art{box-shadow:0 0 0 2px var(--st-side,#fff),0 0 0 3.5px var(--st-accent,#0071E3) !important;}
#dsh-ag-studio .st-skin[aria-pressed="true"] .st-skin-name{color:var(--st-text);font-weight:600;}

#dsh-ag-studio .st-seg{position:relative;display:grid !important;grid-auto-flow:column;grid-auto-columns:1fr;padding:2px;border-radius:9px;background:var(--st-fill-2);}
#dsh-ag-studio .st-seg-thumb{position:absolute;top:2px;bottom:2px;left:2px;width:calc((100% - 4px)/var(--n));transform:translateX(calc(100% * var(--i)));border-radius:7px;background:#fff;box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 2px 6px -1px rgba(0,0,0,.12);transition:transform 320ms var(--st-spring);}
#dsh-ag-studio .st-seg button{position:relative;z-index:1;height:32px !important;border:0 !important;background:none !important;border-radius:7px !important;font-size:14px !important;font-weight:500;color:color-mix(in srgb,var(--st-text) 70%,transparent) !important;width:auto !important;padding:0 !important;box-shadow:none !important;}
#dsh-ag-studio .st-seg button[aria-pressed="true"]{color:var(--st-text) !important;}

#dsh-ag-studio .st-swatches{display:flex;flex-wrap:wrap;align-items:center;gap:9px;}
#dsh-ag-studio .st-sw{position:relative;width:22px !important;height:22px !important;padding:0 !important;border:0 !important;border-radius:50% !important;background:var(--c) !important;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.16);}
@media (hover:hover){#dsh-ag-studio .st-sw:hover{transform:scale(1.12);}}
#dsh-ag-studio .st-sw[aria-pressed="true"]{box-shadow:inset 0 0 0 .5px rgba(0,0,0,.16),0 0 0 2px var(--st-side,#fff),0 0 0 3.5px var(--c) !important;}
#dsh-ag-studio .st-sw.is-auto{background:linear-gradient(135deg,var(--c) 0 50%,color-mix(in srgb,var(--c) 35%,#fff) 50% 100%) !important;}
#dsh-ag-studio .st-sw.is-custom{background:conic-gradient(from 180deg,#FF453A,#FF9F0A,#FFD60A,#32D74B,#64D2FF,#0A84FF,#BF5AF2,#FF453A) !important;}
#dsh-ag-studio .st-sw.is-custom input{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;padding:0;cursor:pointer;}

#dsh-ag-studio .st-grads{display:grid !important;grid-template-columns:repeat(6,1fr);gap:7px;margin-top:10px;}
#dsh-ag-studio .st-grad{height:36px !important;padding:0 !important;border:0 !important;border-radius:8px !important;background:var(--g) !important;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.12);font-size:14px !important;font-weight:600;color:#1D1D1F !important;text-shadow:0 0 10px rgba(255,255,255,.8);}
@media (hover:hover){#dsh-ag-studio .st-grad:hover{transform:translateY(-1px);}}
#dsh-ag-studio .st-grad[aria-pressed="true"]{box-shadow:inset 0 0 0 .5px rgba(0,0,0,.12),0 0 0 2px var(--st-side,#fff),0 0 0 3.5px var(--st-accent) !important;}

#dsh-ag-studio .st-row{margin-top:12px;}
#dsh-ag-studio input[type="range"]{-webkit-appearance:none;appearance:none;display:block;width:100%;height:22px;margin:0;background:transparent;}
#dsh-ag-studio input[type="range"]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--st-accent) 0 var(--p),var(--st-fill-2) var(--p) 100%);}
#dsh-ag-studio input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;margin-top:-7px;border-radius:50%;background:#fff;box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 2px 5px rgba(0,0,0,.16);}

#dsh-ag-studio .st-field{display:flex !important;gap:6px;margin-top:10px;align-items:center;}
#dsh-ag-studio .st-input{flex:1 !important;min-width:0 !important;height:32px !important;padding:0 9px !important;border:0 !important;border-radius:7px !important;background:var(--st-fill) !important;box-shadow:inset 0 0 0 .5px var(--st-line) !important;font-size:13px !important;color:var(--st-text) !important;}
#dsh-ag-studio .st-input:focus{outline:none;background:#fff !important;box-shadow:0 0 0 1px var(--st-accent),0 0 0 4px color-mix(in srgb,var(--st-accent) 16%,transparent) !important;}
#dsh-ag-studio .st-input.is-mono{font-family:ui-monospace,"SF Mono",Consolas,monospace !important;text-transform:uppercase;max-width:92px;flex:0 0 92px !important;}
#dsh-ag-studio .st-btn{height:32px !important;padding:0 12px !important;border:0 !important;border-radius:7px !important;background:var(--st-fill-2) !important;font-size:14px !important;font-weight:500 !important;color:var(--st-text) !important;white-space:nowrap;width:auto !important;box-shadow:none !important;}
@media (hover:hover){#dsh-ag-studio .st-btn:hover{background:color-mix(in srgb,var(--st-text) 12%,transparent) !important;}}
#dsh-ag-studio .st-btn:active{transform:scale(.97);}
#dsh-ag-studio .st-btn.is-primary{background:var(--st-accent) !important;color:#fff !important;}
#dsh-ag-studio .st-file{display:flex !important;align-items:center;gap:8px;margin-top:10px;}
#dsh-ag-studio .st-file span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:color-mix(in srgb,var(--st-text) 62%,transparent);font-size:13px;}
#dsh-ag-studio .st-history{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
#dsh-ag-studio .st-hist{width:48px !important;height:34px !important;padding:0 !important;border:0 !important;border-radius:7px !important;background:var(--g,#e8e8ec) center / cover no-repeat !important;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.12);}
#dsh-ag-studio .st-hist[aria-pressed="true"]{box-shadow:0 0 0 2px var(--st-side,#fff),0 0 0 3.5px var(--st-accent) !important;}
#dsh-ag-studio .st-actions{display:flex !important;flex-wrap:wrap;gap:8px;margin-top:2px;}
`;

		function ensureStudioCss() {
			let el = document.getElementById("dsh-ag-studio-css");
			if (!el) {
				el = document.createElement("style");
				el.id = "dsh-ag-studio-css";
				(document.head || document.documentElement).appendChild(el);
			}
			if (el.getAttribute("data-rev") !== "0.5.7") {
				el.textContent = STUDIO_CSS;
				el.setAttribute("data-rev", "0.5.7");
			}
		}

		exports.DEFAULT_SKIN = "aluminum";

		exports.apply = function (ctx) {
			try {
				applySkin(ctx);
			} catch (error) {
				reportError(error);
			}
		};

		function applySkin(ctx) {
			ensureStudioCss();
			const themeApi = getService(ctx, "theme");
			const slots = getService(ctx, "slots");
			let boot = readLocalBoot();
			const disposers = [];

			const setBoot = (next) => {
				boot = normalizeBoot(next);
				writeLocalBoot(boot);
				hostSet(boot).then((saved) => {
					if (!saved) return;
					boot = saved;
					writeLocalBoot(boot);
				});
				applyNow();
			};

			const tokensAsOverrides = (tokens) => {
				const out = {};
				Object.keys(tokens).forEach((name) => {
					out[name] = { light: tokens[name], dark: tokens[name] };
				});
				return out;
			};

			const applyNow = () => {
				while (disposers.length) {
					const drop = disposers.pop();
					try { if (typeof drop === "function") drop(); } catch (e) {}
				}
				try { applyCriticalCss(boot); }
				catch (error) { reportError(error); }
				if (themeApi && typeof themeApi.overrideTokens === "function") {
					try {
						disposers.push(themeApi.overrideTokens("dsh-antigravity-skin", tokensAsOverrides(buildTokens(boot))));
					} catch (error) {
						reportError(error);
					}
				} else if (themeApi && typeof themeApi.register === "function") {
					try {
						disposers.push(themeApi.register({
							id: THEME_PREFIX + boot.theme,
							name: findSkin(boot.theme).name,
							colorScheme: "light",
							appearance: "light",
							tokens: buildTokens(boot),
						}));
						if (typeof themeApi.setTheme === "function") themeApi.setTheme(THEME_PREFIX + boot.theme);
					} catch (error) {
						reportError(error);
					}
				}
			};

			applyNow();

			if (ctx && typeof ctx.on === "function") {
				try {
					ctx.on("theme/change", () => {
						try { applyCriticalCss(boot); } catch (e) {}
					});
				} catch (e) {}
			}

			if (slots && typeof slots.inject === "function") {
								const Studio = () => {
					const [sel, setSel] = React.useState(boot);
					const [hexDraft, setHexDraft] = React.useState("");
					const [urlDraft, setUrlDraft] = React.useState(boot.studio.url || "");
					const [wallNote, setWallNote] = React.useState("");
					const [backupNote, setBackupNote] = React.useState("");
					const [wallBusy, setWallBusy] = React.useState(false);
					const [resetArmed, setResetArmed] = React.useState(false);
					const fileRef = React.useRef(null);
					const importRef = React.useRef(null);
					React.useEffect(() => {
						setSel(boot);
						setUrlDraft(boot.studio.url || "");
					}, [boot.theme, boot.savedAt, JSON.stringify(boot.studio)]);
					const update = (next) => {
						const normalized = normalizeBoot(next);
						setSel(normalized);
						setBoot(normalized);
						setResetArmed(false);
					};
					const reset = () => {
						setWallNote("");
						setBackupNote("");
						setResetArmed(false);
						update(normalizeBoot({ theme: DEFAULT_BOOT.theme, studio: Object.assign({}, DEFAULT_BOOT.studio) }));
					};
					const pushHistory = (studio, entry) => {
						const cur = Array.isArray(studio.history) ? studio.history.slice() : [];
						const next = [entry].concat(cur.filter((item) => {
							if (entry.kind === "url") return !(item.kind === "url" && item.url === entry.url);
							if (entry.kind === "image") return item.kind !== "image";
							return true;
						})).slice(0, 6);
						return next;
					};
					const currentSkin = findSkin(sel.theme);
					const accentValue = effectiveAccent(sel);
					const following = !isHex(sel.studio.accent);
					const materialIndex = Math.max(0, MATERIALS.findIndex((item) => item.id === sel.studio.material));
					const wallIndex = Math.max(0, WALLS.findIndex((item) => item.id === sel.studio.wall));
					const fitIndex = sel.studio.fit === "contain" ? 1 : 0;
					const commitHex = (raw) => {
						let v = String(raw || "").trim();
						if (/^[0-9a-fA-F]{6}$/.test(v)) v = "#" + v;
						if (isHex(v)) update(patchStudio(sel, { accent: v }));
						else setHexDraft(accentValue);
					};
					const commitUrl = () => {
						const u = safeUrl(urlDraft);
						if (!u && urlDraft.trim()) {
							setWallNote("只支持 http(s) 图片链接");
							return;
						}
						setWallNote("");
						if (u) update(patchStudio(sel, { wall: "url", url: u, history: pushHistory(sel.studio, { kind: "url", url: u }) }));
					};
					const uploadWall = (file) => {
						if (!file) return;
						if (file.size > 5 * 1024 * 1024) {
							setWallNote("图片不能超过 5MB");
							return;
						}
						setWallBusy(true);
						setWallNote("正在保存图片…");
						const reader = new FileReader();
						reader.onload = () => {
							const result = String(reader.result || "");
							const comma = result.indexOf(",");
							const data = comma >= 0 ? result.slice(comma + 1) : "";
							fetch(WALL_SERVE_PATH, {
								method: "POST",
								headers: { "content-type": "application/json" },
								body: JSON.stringify({ type: file.type || "image/png", data: data, name: file.name }),
							}).then((res) => res.json()).then((payload) => {
								setWallBusy(false);
								if (!payload || !payload.ok || !payload.boot) {
									setWallNote("图片保存失败，请换一张再试");
									return;
								}
								setWallNote(file.name + " · 已保存");
								const next = normalizeBoot(payload.boot);
								next.studio.history = pushHistory(Object.assign({}, sel.studio, next.studio), { kind: "image" });
								update(next);
							}).catch(() => {
								setWallBusy(false);
								setWallNote("图片保存失败，请换一张再试");
							});
						};
						reader.onerror = () => {
							setWallBusy(false);
							setWallNote("无法读取这张图片");
						};
						reader.readAsDataURL(file);
					};
					const exportConfig = () => {
						const payload = { theme: sel.theme, studio: sel.studio };
						const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
						const a = document.createElement("a");
						a.href = URL.createObjectURL(blob);
						a.download = "dsh-skin.json";
						a.click();
						setTimeout(() => URL.revokeObjectURL(a.href), 800);
						setBackupNote("已导出当前配置");
					};
					const importConfig = (file) => {
						if (!file) return;
						const reader = new FileReader();
						reader.onload = () => {
							try {
								const data = JSON.parse(String(reader.result || ""));
								if (!data || typeof data !== "object") throw new Error("bad");
								update(normalizeBoot(data));
								setBackupNote("已导入 " + (file.name || "配置"));
							} catch (e) {
								setBackupNote("配置文件无法读取，请检查是不是本插件导出的 JSON");
							}
						};
						reader.onerror = () => setBackupNote("无法读取这个文件");
						reader.readAsText(file);
					};
					const slider = (key, label, min, max, unit, value) => React.createElement("div", { className: "st-row" },
						React.createElement("div", { className: "st-label" }, label, React.createElement("em", null, value + unit)),
						React.createElement("input", {
							type: "range", min: min, max: max, value: value,
							style: { "--p": (((value - min) / (max - min)) * 100) + "%" },
							onChange: (e) => update(patchStudio(sel, { [key]: Number(e.target.value) })),
						}),
					);
					const segment = (items, index, onPick) => React.createElement("div", {
						className: "st-seg",
						style: { "--n": items.length, "--i": index },
					},
						React.createElement("div", { className: "st-seg-thumb" }),
						items.map((item) => React.createElement("button", {
							type: "button",
							key: item.id,
							"aria-pressed": items[index] && items[index].id === item.id,
							onClick: () => onPick(item.id),
						}, item.name)),
					);
					const tiltMove = (e) => {
						const art = e.currentTarget.querySelector(".st-skin-art");
						if (!art) return;
						const r = art.getBoundingClientRect();
						const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
						const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
						art.style.setProperty("--rx", ((0.5 - py) * 8) + "deg");
						art.style.setProperty("--ry", ((px - 0.5) * 10) + "deg");
						art.classList.add("is-tilt");
					};
					const tiltLeave = (e) => {
						const art = e.currentTarget.querySelector(".st-skin-art");
						if (!art) return;
						art.style.removeProperty("--rx");
						art.style.removeProperty("--ry");
						art.classList.remove("is-tilt");
					};
					const stampPreview = (el) => {
						if (!el) return;
						el.style.setProperty("height", "208px", "important");
						el.style.setProperty("min-height", "208px", "important");
						el.style.setProperty("max-height", "208px", "important");
						el.style.setProperty("position", "relative", "important");
						el.style.setProperty("overflow", "hidden", "important");
						el.style.setProperty("display", "block", "important");
					};
					const knownAccent = ACCENTS.some((a) => a.id.toLowerCase() === accentValue.toLowerCase());
					const customAccent = !following && !knownAccent;
					const fill = fillAmount(sel.studio);
					const wallOn = sel.studio.wall !== "none";
					const previewStyle = {
						"--hero-base": currentSkin.tokens.base,
						"--hero-side": currentSkin.tokens.sidebar,
						"--hero-line": currentSkin.tokens.line,
						"--hero-text": currentSkin.tokens.text,
						"--hero-text-2": currentSkin.tokens.text2,
						"--hero-accent": accentValue,
						"--hero-wall": wallPreview(sel, currentSkin),
						"--hero-fill": String(fill),
						"--hero-veil": wallOn ? String(veilOpacity(sel.studio)) : "0",
						"--hero-filter": sel.studio.material === "solid" ? "none" : ("blur(" + sel.studio.blur + "px)"),
						"--hero-wblur": (sel.studio.wallBlur || 0) + "px",
						"--hero-transform": wallTransform(sel.studio),
						"--hero-side-a": String(sel.studio.material === "solid" ? 1 : Math.max(0.72, fill)),
						position: "relative",
						height: "208px",
						minHeight: "208px",
						overflow: "hidden",
						display: "block",
					};
					const history = Array.isArray(sel.studio.history) ? sel.studio.history : [];
					const showMedia = sel.studio.wall === "image" || sel.studio.wall === "url";
					const zone = (title, ...children) => React.createElement("section", { className: "st-zone" },
						React.createElement("h3", { className: "st-zone-title" }, title),
						...children,
					);
					return React.createElement("div", { id: "dsh-ag-studio" },
						React.createElement("style", null, STUDIO_CSS),
						React.createElement("div", { className: "st-head" },
							React.createElement("span", { className: "st-title" }, "个性化皮肤"),
						),
						React.createElement("div", {
							className: "st-preview",
							ref: stampPreview,
							style: previewStyle,
							"aria-hidden": "true",
						},
							React.createElement("div", { className: "st-preview-wall" }),
							React.createElement("div", { className: "st-preview-veil" }),
							React.createElement("div", { className: "st-preview-app" },
								React.createElement("div", { className: "st-preview-bar" },
									React.createElement("span", { className: "st-preview-dots" },
										React.createElement("i"), React.createElement("i"), React.createElement("i"),
									),
									"DeepSeek Harness",
								),
								React.createElement("div", { className: "st-preview-body" },
									React.createElement("div", { className: "st-preview-side" },
										React.createElement("span", { className: "st-preview-nav is-on" }),
										React.createElement("span", { className: "st-preview-nav" }),
										React.createElement("span", { className: "st-preview-nav" }),
									),
									React.createElement("div", { className: "st-preview-main" },
										React.createElement("div", { className: "st-preview-bubble" },
											React.createElement("div", { className: "st-preview-line" }),
											React.createElement("div", { className: "st-preview-line s" }),
										),
										React.createElement("div", { className: "st-preview-bubble is-me" },
											React.createElement("div", { className: "st-preview-line" }),
										),
										React.createElement("div", { className: "st-preview-composer" },
											React.createElement("span", { className: "st-preview-send" }),
										),
									),
								),
							),
						),
						zone("主题与配色",
							React.createElement("div", { className: "st-skins" },
								SKINS.map((skin) => React.createElement("button", {
									type: "button",
									key: skin.id,
									className: "st-skin",
									"aria-pressed": sel.theme === skin.id,
									onClick: () => update(Object.assign({}, sel, { theme: skin.id })),
									onPointerMove: tiltMove,
									onPointerLeave: tiltLeave,
								},
									React.createElement("span", {
										className: "st-skin-art",
										style: {
											"--a-base": skin.tokens.base,
											"--a-side": skin.tokens.sidebar,
											"--a-line": skin.tokens.line,
											"--a-text": skin.tokens.text,
											"--a-accent": isHex(sel.studio.accent) && sel.theme === skin.id ? sel.studio.accent : skin.tokens.accent,
											"--a-wall": GRADIENTS[skin.wall] || skin.tokens.base,
										},
									},
										React.createElement("span", { className: "st-skin-ui" },
											React.createElement("span", { className: "st-skin-side" }),
											React.createElement("span", { className: "st-skin-main" },
												React.createElement("i"), React.createElement("i"), React.createElement("b"),
											),
										),
									),
									React.createElement("span", { className: "st-skin-name" }, skin.name),
								)),
							),
							React.createElement("div", { className: "st-label" }, "强调色",
								following ? null : React.createElement("button", {
									type: "button",
									className: "st-link",
									onClick: () => update(patchStudio(sel, { accent: "" })),
								}, "恢复主题色"),
							),
							React.createElement("div", { className: "st-swatches" },
								React.createElement("button", {
									type: "button",
									className: "st-sw is-auto",
									title: "跟随皮肤",
									"aria-pressed": following,
									style: { "--c": currentSkin.tokens.accent },
									onClick: () => update(patchStudio(sel, { accent: "" })),
								}),
								ACCENTS.map((item) => React.createElement("button", {
									type: "button",
									key: item.id,
									className: "st-sw",
									title: item.name,
									"aria-pressed": !following && item.id.toLowerCase() === accentValue.toLowerCase(),
									style: { "--c": item.id },
									onClick: () => update(patchStudio(sel, { accent: item.id })),
								})),
								React.createElement("label", {
									className: "st-sw is-custom",
									title: "自定义",
									"aria-pressed": customAccent,
								}, React.createElement("input", {
									type: "color",
									value: accentValue,
									onChange: (e) => update(patchStudio(sel, { accent: e.target.value })),
								})),
								React.createElement("input", {
									className: "st-input is-mono",
									value: hexDraft || accentValue,
									maxLength: 7,
									spellCheck: false,
									"aria-label": "强调色色值",
									onChange: (e) => setHexDraft(e.target.value),
									onBlur: (e) => { commitHex(e.target.value); setHexDraft(""); },
									onKeyDown: (e) => { if (e.key === "Enter") { commitHex(e.target.value); setHexDraft(""); e.currentTarget.blur(); } },
								}),
							),
						),
						zone("材质与玻璃",
							segment(MATERIALS, materialIndex, (id) => update(patchStudio(sel, { material: id }))),
							sel.studio.material !== "solid" ? slider("blur", "模糊", 0, 60, "px", sel.studio.blur) : null,
							sel.studio.material !== "solid" ? slider("opacity", "表面不透明度", 30, 100, "%", sel.studio.opacity) : null,
							sel.studio.material === "solid" ? React.createElement("div", { className: "st-hint" }, "实色下主界面不透明。换成磨砂或通透后，可再调模糊和不透明度。") : null,
						),
						zone("背景与壁纸",
							segment(WALLS, wallIndex, (id) => update(patchStudio(sel, { wall: id }))),
							sel.studio.wall === "gradient" ? React.createElement("div", { className: "st-grads" },
								[{ id: "auto", name: "自动" }].concat(Object.keys(GRADIENTS).map((id) => ({ id: id, name: ({ dawn: "晨曦", bay: "海湾", aurora: "极光", dune: "沙丘", mono: "素灰" })[id] || id }))).map((item) => React.createElement("button", {
									type: "button",
									key: item.id,
									className: "st-grad",
									"aria-pressed": (sel.studio.gradient === "auto" ? "auto" : sel.studio.gradient) === item.id,
									style: { "--g": item.id === "auto" ? (GRADIENTS[currentSkin.wall] || GRADIENTS.aurora) : GRADIENTS[item.id] },
									onClick: () => update(patchStudio(sel, { gradient: item.id })),
								}, item.name)),
							) : null,
							sel.studio.wall === "image" ? React.createElement(React.Fragment, null,
								React.createElement("div", { className: "st-file" },
									React.createElement("button", {
										type: "button",
										className: "st-btn is-primary",
										disabled: wallBusy,
										onClick: () => fileRef.current && fileRef.current.click(),
									}, wallBusy ? "保存中…" : "选择图片…"),
									React.createElement("span", null, wallNote || "支持 webp / jpeg / png / gif，最大 5MB"),
									React.createElement("input", {
										type: "file",
										accept: "image/webp,image/jpeg,image/png,image/gif",
										ref: fileRef,
										hidden: true,
										onChange: (e) => {
											const file = e.target.files && e.target.files[0];
											e.target.value = "";
											uploadWall(file);
										},
									}),
								),
							) : null,
							sel.studio.wall === "url" ? React.createElement(React.Fragment, null,
								React.createElement("div", { className: "st-field" },
									React.createElement("input", {
										className: "st-input",
										placeholder: "https://…",
										value: urlDraft,
										spellCheck: false,
										"aria-label": "图片链接",
										onChange: (e) => setUrlDraft(e.target.value),
										onKeyDown: (e) => { if (e.key === "Enter") commitUrl(); },
									}),
									React.createElement("button", { type: "button", className: "st-btn is-primary", onClick: commitUrl }, "应用"),
								),
								wallNote ? React.createElement("div", { className: "st-note" + (/失败|只支持|不能|无法/.test(wallNote) ? " is-warn" : "") }, wallNote) : null,
							) : null,
							history.length && (sel.studio.wall === "image" || sel.studio.wall === "url") ? React.createElement("div", { className: "st-history" },
								history.map((item, i) => React.createElement("button", {
									type: "button",
									key: item.kind === "url" ? item.url : "image-" + i,
									className: "st-hist",
									title: item.kind === "url" ? item.url : "已保存的图片",
									"aria-pressed": item.kind === "image" ? sel.studio.wall === "image" : (sel.studio.wall === "url" && sel.studio.url === item.url),
									style: { "--g": item.kind === "url" ? ("url(\"" + item.url + "\")") : ("url(\"" + WALL_SERVE_PATH + "?v=" + (sel.savedAt || "1") + "\")") },
									onClick: () => {
										if (item.kind === "url") {
											setUrlDraft(item.url);
											update(patchStudio(sel, { wall: "url", url: item.url }));
										} else {
											update(patchStudio(sel, { wall: "image" }));
										}
									},
								}))
							) : null,
							showMedia ? React.createElement("div", { className: "st-row" },
								React.createElement("div", { className: "st-label" }, "填充"),
								segment(
									[{ id: "cover", name: "填满" }, { id: "contain", name: "完整" }],
									fitIndex,
									(id) => update(patchStudio(sel, { fit: id })),
								),
							) : null,
							showMedia ? slider("frameX", "水平位置", -100, 100, "%", sel.studio.frameX || 0) : null,
							showMedia ? slider("frameY", "垂直位置", -100, 100, "%", sel.studio.frameY || 0) : null,
							showMedia ? slider("frameZoom", "缩放", 50, 200, "%", sel.studio.frameZoom || 100) : null,
							sel.studio.wall === "image" && wallNote && /失败|不能|无法/.test(wallNote)
								? React.createElement("div", { className: "st-note is-warn" }, wallNote)
								: null,
							sel.studio.wall !== "none" ? slider("strength", "壁纸可见度", 0, 100, "%", sel.studio.strength) : null,
							sel.studio.wall !== "none" ? slider("wallBlur", "壁纸模糊", 0, 40, "px", sel.studio.wallBlur) : null,
						),
						zone("备份",
							React.createElement("div", { className: "st-actions" },
								React.createElement("button", { type: "button", className: "st-btn", onClick: exportConfig }, "导出配置"),
								React.createElement("button", {
									type: "button",
									className: "st-btn",
									onClick: () => importRef.current && importRef.current.click(),
								}, "导入配置"),
								React.createElement("button", {
									type: "button",
									className: "st-btn" + (resetArmed ? " is-primary" : ""),
									onClick: () => {
										if (!resetArmed) { setResetArmed(true); return; }
										reset();
									},
								}, resetArmed ? "确认恢复默认？" : "恢复默认"),
								React.createElement("input", {
									type: "file",
									accept: "application/json,.json",
									ref: importRef,
									hidden: true,
									onChange: (e) => {
										const file = e.target.files && e.target.files[0];
										e.target.value = "";
										importConfig(file);
									},
								}),
							),
							backupNote ? React.createElement("div", { className: "st-note" }, backupNote) : null,
							React.createElement("div", { className: "st-hint" }, "配置只保存在本机 DeepSeek Harness，改完即时生效。"),
						),
					);
				};

				try {
					slots.inject("settings.section", () => slots.register(
						{ name: "settings.section", id: "antigravity-skin", order: 180, label: "个性化皮肤" },
						() => React.createElement(Studio),
					));
				} catch (error) {
					reportError(error);
				}
			}

			hostGet().then((remote) => {
				if (!remote) return;
				if (JSON.stringify(remote.theme) === JSON.stringify(boot.theme)
					&& JSON.stringify(remote.studio) === JSON.stringify(boot.studio)) return;
				boot = remote;
				writeLocalBoot(boot);
				applyNow();
			}).catch(() => {});
		}

		return module.exports;
	},
});
