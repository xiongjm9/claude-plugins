// 把 src/ 组装成运行时读取的 current.js：  node build.js
// 改皮肤配色改 src/skins.js；改结构样式改 src/base.css；改面板改 src/studio.*；改完重跑本脚本再 node install_permanent.js
const fs = require('fs');
const path = require('path');
const { SKINS, ACCENTS, GRADIENTS } = require('./src/skins');

const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

// ---- 对比度门槛（WCAG 2.1） ----
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const failures = [];
const gate = (label, a, b, min) => { const r = ratio(a, b); if (r < min) failures.push(`${label} ${r.toFixed(2)} < ${min}`); return r.toFixed(2); };
const rows = SKINS.map((s) => {
  const t = s.tokens;
  return {
    skin: `${s.id}(${s.name})`,
    'text/base': gate(`${s.id} text/base`, t.text, t.base, 12),
    'text2/base': gate(`${s.id} text2/base`, t.text2, t.base, 4.5),
    'text2/side': gate(`${s.id} text2/sidebar`, t.text2, t.sidebar, 4.5),
    'white/accent': gate(`${s.id} white/accent`, '#FFFFFF', t.accent, 4.5),
  };
});
ACCENTS.forEach((a) => gate(`accent ${a.name}`, '#FFFFFF', a.hex, 4.5));
console.table(rows);
console.log('accents white contrast:', ACCENTS.map((a) => `${a.name} ${ratio('#FFFFFF', a.hex).toFixed(2)}`).join('  '));
if (failures.length) {
  console.error('[X] 对比度不达标:\n  ' + failures.join('\n  '));
  process.exit(1);
}

// ---- 组装 ----
const tokenCss = (t) => `:root {
  --sk-base: ${t.base};
  --sk-base-2: ${t.base2};
  --sk-sidebar: ${t.sidebar};
  --sk-text: ${t.text};
  --sk-text-2: ${t.text2};
  --sk-line: ${t.line};
  --sk-accent: ${t.accent};
  --sk-surface: #FFFFFF;
  --sk-pop: var(--sk-surface);
  --sk-fill: 1;
  --sk-filter: blur(20px) saturate(1.8);
}
`;
const icon = (t) => `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="15" height="15" rx="4" fill="${t.base}" stroke="${t.line}"/><circle cx="8" cy="8" r="2.5" fill="${t.accent}"/></svg>`;

const skinBase = src('base.css') + '\n' + src('glass.css');
const themes = SKINS.map((s) => ({
  id: s.id,
  name: s.name,
  icon: icon(s.tokens),
  titlebarColor: s.tokens.sidebar,
  symbolColor: s.tokens.text,
  tokens: tokenCss(s.tokens),
}));
const stock = { id: 'stock', name: '官方原版', icon: icon({ base: '#F3F3F3', line: '#D4D4D4', accent: '#007ACC' }), titlebarColor: '#F3F3F3', symbolColor: '#1B2A4A', css: src('stock.css') };

const themesExpr = `(() => {
        const SKIN_BASE_CSS = ${JSON.stringify(skinBase)};
        return ${JSON.stringify(themes)}.map((t) => Object.assign(t, { css: t.tokens + SKIN_BASE_CSS })).concat([${JSON.stringify(stock)}]);
    })()`;
const studioMeta = {
  skins: SKINS.map((s) => ({ id: s.id, wall: s.wall, ...s.tokens })),
  accents: ACCENTS,
  gradients: GRADIENTS,
};

const zh = require('./src/i18n-zh');
// 多词键会额外做忽略大小写匹配；只差大小写却译法不同的键要提示，否则后写的会盖掉前面的
const lowerSeen = new Map();
const clashes = [];
for (const [k, v] of Object.entries(zh.exact)) {
  if (!k.includes(' ')) continue;
  const lk = k.toLowerCase();
  if (lowerSeen.has(lk) && lowerSeen.get(lk) !== v) clashes.push(k);
  lowerSeen.set(lk, v);
}
if (clashes.length) console.warn('[!] 只差大小写但译法不同的词条:', clashes.join(' | '));
zh.patterns.forEach(([re]) => new RegExp(re));
console.log(`i18n: ${Object.keys(zh.exact).length} 条词条，${zh.patterns.length} 条模式`);

let studio = src('studio.js')
  .replace('/*@@STUDIO_META@@*/', () => JSON.stringify(studioMeta))
  .replace('/*@@STUDIO_CSS@@*/', () => JSON.stringify(src('studio.css')))
  .replace('/*@@I18N@@*/', () => src('i18n.js').replace('/*@@I18N_DICT@@*/', () => JSON.stringify({ exact: zh.exact, patterns: zh.patterns, ctx: zh.ctx || [] })));
let out = src('engine.js')
  .replace('/*@@THEMES@@*/', () => themesExpr)
  .replace('/*@@STUDIO@@*/', () => studio);
if (/\/\*@@\w+@@\*\//.test(out)) throw new Error('还有未替换的占位符');

const target = path.join(__dirname, 'current.js');
fs.writeFileSync(target, out);
new (require('vm').Script)(out, { filename: 'current.js' });
console.log(`[OK] current.js ${(out.length / 1024).toFixed(0)} KB，语法检查通过`);
