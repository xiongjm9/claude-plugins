/**
 * Shared palette, boot-state shape, token and critical-CSS builders.
 * Used by the host (tapIndex first paint) and mirrored in the client bundle.
 */

export const SKINS = [
  { id: "aluminum", name: "铝灰", wall: "aurora", tokens: { base: "#F5F5F7", base2: "#F7F7F9", sidebar: "#FBFBFD", text: "#1D1D1F", text2: "#6E6E73", line: "#E3E3E8", accent: "#0071E3" } },
  { id: "porcelain", name: "瓷白", wall: "mono", tokens: { base: "#FAFAFA", base2: "#FCFCFC", sidebar: "#FFFFFF", text: "#171717", text2: "#666666", line: "#EBEBEB", accent: "#171717" } },
  { id: "fog", name: "雾蓝", wall: "bay", tokens: { base: "#F2F5F9", base2: "#F5F7FB", sidebar: "#FAFBFD", text: "#16202E", text2: "#5B6778", line: "#DEE4EC", accent: "#3157D5" } },
  { id: "sand", name: "沙岩", wall: "dune", tokens: { base: "#F6F4F0", base2: "#F8F6F3", sidebar: "#FCFBF9", text: "#252321", text2: "#6B665F", line: "#E6E1D9", accent: "#A4492A" } },
  { id: "sage", name: "苔绿", wall: "aurora", tokens: { base: "#F3F6F4", base2: "#F6F8F6", sidebar: "#FBFCFB", text: "#18231E", text2: "#5A6962", line: "#DBE3DE", accent: "#2B7556" } },
];

export const GRADIENTS = {
  dawn: "radial-gradient(120% 90% at 0% 0%, #FDE2D6 0%, transparent 55%), radial-gradient(90% 80% at 100% 10%, #E4DDFB 0%, transparent 60%), radial-gradient(100% 90% at 60% 100%, #FBEFE3 0%, transparent 60%), #F7F3F1",
  bay: "radial-gradient(110% 90% at 10% 0%, #D3E6FB 0%, transparent 58%), radial-gradient(90% 90% at 100% 30%, #D2F1EC 0%, transparent 60%), radial-gradient(100% 80% at 40% 100%, #E7EEFA 0%, transparent 60%), #F1F5F9",
  aurora: "radial-gradient(90% 80% at 0% 20%, #D5F3E6 0%, transparent 58%), radial-gradient(90% 90% at 70% 0%, #DCE3FD 0%, transparent 58%), radial-gradient(100% 90% at 100% 100%, #EBDDFA 0%, transparent 60%), #F3F5F8",
  dune: "radial-gradient(120% 90% at 100% 0%, #F6E5CF 0%, transparent 58%), radial-gradient(100% 90% at 0% 100%, #EFE4DA 0%, transparent 60%), #F7F4EF",
  mono: "radial-gradient(120% 100% at 50% 0%, #FFFFFF 0%, transparent 60%), linear-gradient(180deg, #F2F2F4 0%, #E9E9EC 100%)",
};

export const MATERIALS = ["solid", "frosted", "clear"];

export const DEFAULT_BOOT = {
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

export const UI_FONT = '"PingFang SC", "PingFangSC-Regular", "PingFangSC", "苹方-简", "苹方", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif';

export function findSkin(id) {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}

export function isHex(value) {
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

export function rgba(color, a) {
  const c = parseColor(color);
  return formatColor({ r: c.r, g: c.g, b: c.b, a: Math.max(0, Math.min(1, a)) });
}

export function mix(a, b, t) {
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

export function darken(color, t) {
  return mix(color, "#000000", t);
}

export function fillAmount(studio) {
  if (studio.material === "solid") return 1;
  if (studio.material === "clear") return (studio.opacity / 100) * 0.7;
  return studio.opacity / 100;
}

export function veilOpacity(studio) {
  return ((100 - studio.strength) / 100) * 0.85;
}

export function popAlpha(fill) {
  return Math.max(0.86, Math.min(1, (Math.round(fill * 100 + 20)) / 100));
}

export function safeUrl(u) {
  if (typeof u !== "string") return "";
  const s = u.trim();
  if (!/^https?:\/\//i.test(s)) return "";
  if (/[\s"'<>\\]/.test(s) || s.length > 2048) return "";
  return s;
}

export function normalizeBoot(input) {
  const next = {
    theme: DEFAULT_BOOT.theme,
    studio: { ...DEFAULT_BOOT.studio },
    savedAt: undefined,
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
        gradient: input.wallpaper && input.wallpaper !== "none" ? input.wallpaper : input.gradient,
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
  st.accent = isHex(src.accent) ? `#${src.accent.trim().slice(1).toUpperCase()}` : "";
  if (MATERIALS.includes(src.material)) st.material = src.material;
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

export function effectiveAccent(boot) {
  const skin = findSkin(boot.theme);
  return isHex(boot.studio.accent) ? boot.studio.accent : skin.tokens.accent;
}

export const WALL_SERVE_PATH = "/antigravity-skin/wall";

export function wallBackground(boot) {
  const studio = boot.studio;
  const skin = findSkin(boot.theme);
  if (studio.wall === "none") return "";
  const fit = studio.fit === "contain" ? "center / contain" : "center / cover";
  if (studio.wall === "url") {
    const u = safeUrl(studio.url);
    return u ? `url("${u}") ${fit} no-repeat, ${skin.tokens.base}` : "";
  }
  if (studio.wall === "image") {
    const cache = boot.savedAt ? `?v=${encodeURIComponent(boot.savedAt)}` : "";
    return `url("${WALL_SERVE_PATH}${cache}") ${fit} no-repeat, ${skin.tokens.base}`;
  }
  const id = studio.gradient === "auto" ? skin.wall : studio.gradient;
  return GRADIENTS[id] || GRADIENTS.aurora;
}

export function buildTokens(boot) {
  const skin = findSkin(boot.theme);
  const t = skin.tokens;
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

export function wallTransform(studio) {
  const x = Number(studio.frameX) || 0;
  const y = Number(studio.frameY) || 0;
  const z = ((Number(studio.frameZoom) || 100) / 100) * ((studio.wallBlur || 0) > 0 ? 1.06 : 1);
  return `translate(${x}%, ${y}%) scale(${z})`;
}

export function buildCriticalCss(boot) {
  const skin = findSkin(boot.theme);
  const tokens = buildTokens(boot);
  const wall = wallBackground(boot);
  const veil = veilOpacity(boot.studio);
  const fill = fillAmount(boot.studio);
  const glass = boot.studio.material !== "solid";
  const filter = glass ? `blur(${boot.studio.blur}px) saturate(1.7) brightness(1.06)` : "none";
  const fallback = wall ? (wall.split(",").pop() || skin.tokens.base).trim() : skin.tokens.base;
  const vars = Object.entries(tokens).map(([k, v]) => `${k}:${v}`).join(";");
  const wallRules = wall ? `
html.dsh-ag-skin[data-dsh-ag-wall]{
  --dsh-ag-wall-bg:${wall};
  --dsh-ag-wall-blur:${boot.studio.wallBlur || 0}px;
  --dsh-ag-wall-veil:${veil.toFixed(3)};
  --dsh-ag-wall-transform:${wallTransform(boot.studio)};
  --dsh-ag-wall-veil-color:${skin.tokens.base};
  --dsh-ag-sidebar:${skin.tokens.sidebar};
  --dsh-ag-fill:${fill};
  background-color:${fallback};
}
html.dsh-ag-skin[data-dsh-ag-wall] body{
  background:transparent !important;
  isolation:isolate;
  position:relative;
  z-index:0;
}
#dsh-ag-wall{
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  overflow:hidden;
  display:none;
  contain:strict;
}
html[data-windows-titlebar] #dsh-ag-wall{top:36px;}
html.dsh-ag-skin[data-dsh-ag-wall] #dsh-ag-wall{display:block;}
#dsh-ag-wall .dsh-ag-wall-img{
  position:absolute;
  inset:calc(var(--dsh-ag-wall-blur, 0px) * -2);
  background:var(--dsh-ag-wall-bg, none);
  background-repeat:no-repeat;
  filter:blur(var(--dsh-ag-wall-blur, 0px));
  transform:var(--dsh-ag-wall-transform, none);
}
#dsh-ag-wall .dsh-ag-wall-veil{
  position:absolute;
  inset:0;
  background:var(--dsh-ag-wall-veil-color, #F5F5F7);
  opacity:var(--dsh-ag-wall-veil, 0.255);
}
html.dsh-ag-skin[data-dsh-ag-wall] #root,
html.dsh-ag-skin[data-dsh-ag-wall] #app,
html.dsh-ag-skin[data-dsh-ag-wall] div:has(> [data-shell-overlay]){
  background-color:transparent !important;
  background-image:none !important;
}
html.dsh-ag-skin[data-dsh-ag-wall][data-windows-titlebar] div:has(> [data-shell-overlay]){
  --dsh-windows-content-radius:0px !important;
}
html.dsh-ag-skin[data-dsh-ag-wall][data-windows-titlebar] div:has(> [data-shell-overlay])::before{
  background:var(--dsh-ag-sidebar, #FBFBFD) !important;
}
html.dsh-ag-skin[data-dsh-ag-wall] [class*="_sidebarCol"],
html.dsh-ag-skin[data-dsh-ag-wall] div:has(> [data-shell-overlay]) > div:has([class*="_logoRow"]){
  background:color-mix(in srgb, var(--dsh-ag-sidebar, #FBFBFD) calc(38% * var(--dsh-ag-fill, 1)), transparent) !important;
}
html.dsh-ag-skin[data-dsh-ag-wall] [class*="_sidebarCol"] *,
html.dsh-ag-skin[data-dsh-ag-wall] div:has(> [data-shell-overlay]) > div:has([class*="_logoRow"]) *{
  --dsw-specific-sidebar-fill:transparent !important;
}
html.dsh-ag-skin[data-dsh-ag-wall] [data-dsh-ag-sidebar]{
  background:color-mix(in srgb, var(--dsh-ag-sidebar, #FBFBFD) calc(38% * var(--dsh-ag-fill, 1)), transparent) !important;
}
html.dsh-ag-skin[data-dsh-ag-wall] [data-dsh-ag-sidebar] *{
  --dsw-specific-sidebar-fill:transparent !important;
}
` : "";
  const glassRules = glass ? `
html.dsh-ag-skin[data-dsh-ag-glass] [data-sidebar],
html.dsh-ag-skin[data-dsh-ag-glass] [data-sidebar-right-panel],
html.dsh-ag-skin[data-dsh-ag-glass] [role="menu"],
html.dsh-ag-skin[data-dsh-ag-glass] [role="dialog"],
html.dsh-ag-skin[data-dsh-ag-glass] [data-radix-popper-content-wrapper] {
  backdrop-filter:${filter};
  -webkit-backdrop-filter:${filter};
}
` : "";
  const varsImportant = Object.entries(tokens).map(([k, v]) => `${k}:${v} !important`).join(";");
  const bodyBg = wall ? "transparent" : fallback;
  const typo = `
html.dsh-ag-skin,
html.dsh-ag-skin body {
  --dsw-font-family: "PingFang SC", "PingFangSC-Regular", "PingFangSC", "苹方-简", "苹方", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
  font-family: "PingFang SC", "PingFangSC-Regular", "PingFangSC", "苹方-简", "苹方", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif!important;
  -webkit-font-smoothing: auto;
  text-rendering: auto;
}
html.dsh-ag-skin button,
html.dsh-ag-skin input,
html.dsh-ag-skin textarea,
html.dsh-ag-skin select,
html.dsh-ag-skin option {
  font-family: inherit !important;
}
html.dsh-ag-skin *:not(pre):not(code):not(kbd):not(samp):not(tt):not([class*="font-mono"]):not([class*="text-code"]):not([class*="codicon"]):not([class*="iconfont"]):not([class*="remixicon"]):not([class^="icon-"]) {
  font-family: inherit !important;
}
html.dsh-ag-skin pre,
html.dsh-ag-skin code,
html.dsh-ag-skin kbd,
html.dsh-ag-skin samp,
html.dsh-ag-skin tt,
html.dsh-ag-skin [class*="font-mono"],
html.dsh-ag-skin [class*="text-code"] {
  font-family: ui-monospace, "SF Mono", "Sarasa Mono SC", "Cascadia Code", Consolas, "Microsoft YaHei UI", monospace !important;
}`;
  return `html.dsh-ag-skin{${vars};--dsw-font-family:${UI_FONT};--dsh-ag-fill:${fill.toFixed(3)};--dsh-ag-filter:${filter};background-color:${fallback};color-scheme:light;font-family:${UI_FONT} !important;}
html.dsh-ag-skin body{${varsImportant};--dsw-font-family:${UI_FONT} !important;background:${bodyBg} !important;color-scheme:light !important;font-family:${UI_FONT} !important;}
${wallRules}${glassRules}${typo}`;
}

export function bootPayload(boot) {
  return JSON.stringify({
    theme: boot.theme,
    studio: boot.studio,
    savedAt: boot.savedAt || null,
  }).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function decorateHtmlRoot(html, boot) {
  const wallOn = !!wallBackground(boot);
  const glass = boot.studio.material !== "solid";
  if (!/<html\b/i.test(html)) return html;
  return html.replace(/<html(\s[^>]*)?>/i, (_full, attrs = "") => {
    let a = attrs || "";
    if (/\bclass\s*=/i.test(a)) {
      a = a.replace(/\bclass\s*=\s*(["'])([\s\S]*?)\1/i, (_m, q, val) => {
        const classes = val.split(/\s+/).filter(Boolean);
        if (!classes.includes("dsh-ag-skin")) classes.push("dsh-ag-skin");
        return `class=${q}${classes.join(" ")}${q}`;
      });
    } else {
      a += ' class="dsh-ag-skin"';
    }
    if (wallOn) {
      if (/data-dsh-ag-wall\s*=/i.test(a)) a = a.replace(/data-dsh-ag-wall\s*=\s*(["']).*?\1/i, 'data-dsh-ag-wall="1"');
      else a += ' data-dsh-ag-wall="1"';
    } else {
      a = a.replace(/\s*data-dsh-ag-wall\s*=\s*(["']).*?\1/i, "");
    }
    if (glass) {
      if (!/data-dsh-ag-glass\s*=/i.test(a)) a += ' data-dsh-ag-glass="1"';
    } else {
      a = a.replace(/\s*data-dsh-ag-glass\s*=\s*(["']).*?\1/i, "");
    }
    return `<html${a}>`;
  });
}

export const WALL_LAYER_HTML = '<div id="dsh-ag-wall" aria-hidden="true"><div class="dsh-ag-wall-img"></div><div class="dsh-ag-wall-veil"></div></div>';

export function injectWallLayerHtml(html, boot) {
  const on = !!wallBackground(boot);
  let next = String(html || "");
  if (!on) return next;
  if (/id=["']dsh-ag-wall["']/.test(next)) return next;
  if (/<body\b/i.test(next)) return next.replace(/<body(\s[^>]*)?>/i, (m) => m + WALL_LAYER_HTML);
  return next;
}

export function injectCriticalHtml(html, boot) {
  const css = buildCriticalCss(boot);
  const snippet = `<style id="dsh-antigravity-skin-critical">${css}</style><script type="application/json" id="dsh-antigravity-skin-boot">${bootPayload(boot)}</script>`;
  let next = injectWallLayerHtml(decorateHtmlRoot(html, boot), boot);
  const open = /<head[^>]*>/i.exec(next);
  if (open) {
    const at = open.index + open[0].length;
    return next.slice(0, at) + snippet + next.slice(at);
  }
  const close = /<\/head>/i.exec(next);
  if (close) return next.slice(0, close.index) + snippet + next.slice(close.index);
  return snippet + next;
}
