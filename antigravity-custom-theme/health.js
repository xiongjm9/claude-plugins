// 健康检查：Antigravity 改版后主题是否还挂得上。check.js 手动跑；守护进程在每次更新后自动跑一次
const fs = require('fs');
const net = require('net');
const asarPatch = require('./asar-patch');
const cdp = require('./cdp-inject');

const PIPE = '\\\\.\\pipe\\antigravity-custom-theme-guardian';

// 在页面里跑：每项 { name, level: ok|warn|fail, detail }
const PAGE_CHECKS = `(async () => {
  const r = [];
  const add = (name, ok, detail, soft) => r.push({ name, level: ok ? 'ok' : soft ? 'warn' : 'fail', detail: detail || '' });
  const $ = (s) => document.querySelector(s);
  const v = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
  const loaded = !!window.__antigravityThemeEngineLoaded;
  const ready = !!window.__antigravityThemeReady;
  add('主题引擎', loaded && ready, loaded ? (ready ? '已初始化' : '加载了但初始化中途报错') : '没有加载');
  const st = window.__agThemeState;
  const theme = st ? st.theme : null;
  add('当前皮肤', !!theme, theme || '读不到');
  const skin = theme && theme !== 'stock';
  add('主题样式', !!document.getElementById('antigravity-active-theme'), '#antigravity-active-theme');
  add('外观面板样式', !!document.getElementById('antigravity-studio-css'), '#antigravity-studio-css');
  if (skin) {
    const accent = document.documentElement.style.getPropertyValue('--sk-accent');
    add('强调色变量', !!accent && v('--primary').toUpperCase() === accent.toUpperCase(), '--primary=' + v('--primary') + ' --sk-accent=' + accent);
    const sb = v('--sidebar');
    add('标题栏底色为实色', /^#[0-9a-f]{6}$/i.test(sb), '--sidebar=' + sb + '（原生标题栏只认不透明色）');
    if (document.documentElement.hasAttribute('data-sk-wall')) {
      const w = document.getElementById('sk-wall');
      add('壁纸层', !!w && getComputedStyle(w).display !== 'none', w ? '已挂载' : '缺失');
    }
  }
  const btn = document.getElementById('antigravity-theme-btn');
  const fallback = document.querySelector('#antigravity-theme-selector[data-fallback]');
  add('入口按钮', !!btn && !fallback, btn ? (fallback ? '找不到标题栏工具区，用的是备用位置' : '在标题栏工具区') : '没有挂上', !!fallback);
  // 结构锚点：base.css 依赖它们，消失说明官方改了界面
  const anchors = [
    ['标题栏 title-menu-bar', '[data-testid="title-menu-bar"]'],
    ['工具区 pane-titlebar-toolbar', '[data-testid="pane-titlebar-toolbar"]'],
    ['纵向侧栏 .bg-sidebar.flex-col', 'div[class*="flex-col"][class*="bg-sidebar"]'],
  ];
  for (const [name, sel] of anchors) add('界面锚点：' + name, !!$(sel), sel);
  const i18n = window.__agI18n;
  if (i18n && i18n.lang === 'zh') add('界面汉化', i18n.active && i18n.count > 0, i18n.active ? '已翻译 ' + i18n.count + ' 处' : '没有启动', true);
  const composer = $('div[class*="bg-card-border"]:has(textarea), div[class*="bg-card-border"]:has([contenteditable="true"])');
  add('界面锚点：输入框', !!composer, composer ? '' : '当前页面没有输入框，或官方改了结构（进一个对话再查一次）', true);
  const voice = $('[data-testid="voice-live-pill"]');
  if (voice && voice.querySelector('[data-testid="voice-start-button"]')) {
    const wave = voice.querySelector('rect, path');
    const fill = wave ? getComputedStyle(wave).fill : '';
    const bg = getComputedStyle(voice).backgroundColor;
    const inkGone = !wave || fill === 'rgba(0, 0, 0, 0)' || fill === 'transparent';
    const stillSolid = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
    add('语音按钮', !inkGone && !stillSolid, inkGone ? '波形是透明的' : (stillSolid ? '还是实心圆 ' + bg : '线框'), true);
  }
  // 启动偏好：第一帧用的皮肤与 nativeStorage 里保存的一致，说明 boot.json 起作用
  try {
    const items = await window.nativeStorage.getItems();
    const saved = items && items['custom-theme-id'];
    const first = window.__agThemeFirst;
    if (saved) add('启动时直接用保存的皮肤', first === saved, '第一帧 ' + first + ' / 已保存 ' + saved + (window.__agThemeBootLoaded ? '' : '（这次启动没有拿到 boot 数据）'), true);
  } catch (e) {
    add('nativeStorage', false, e.message);
  }
  return r;
})()`;

function pingGuardian() {
  return new Promise((resolve) => {
    const sock = net.connect(PIPE, () => sock.write('ping'));
    const done = (ok) => { try { sock.destroy(); } catch (e) {} resolve(ok); };
    sock.on('data', () => done(true));
    sock.on('error', () => done(false));
    setTimeout(() => done(false), 1500);
  });
}

async function run({ skipGuardian = false } = {}) {
  const r = [];
  const add = (name, level, detail) => r.push({ name, level, detail: detail || '' });
  try {
    const st = asarPatch.status();
    const map = { patched: ['ok', '钩子是最新版'], outdated: ['warn', '钩子是旧版，关闭 Antigravity 后守护进程会自动升级'], unpatched: ['warn', '钩子丢了（多半刚更新），关闭 Antigravity 后守护进程会自动补上'], 'no-anchor': ['fail', '找不到注入点，官方改了 createWindow，需要更新 asar-patch.js'] };
    add('app.asar 钩子', ...map[st]);
  } catch (e) {
    add('app.asar 钩子', 'fail', e.message);
  }
  if (!skipGuardian) add('守护进程', (await pingGuardian()) ? 'ok' : 'fail', '登录自启的 guardian.js');
  try {
    const b = JSON.parse(fs.readFileSync(cdp.BOOT_FILE, 'utf8'));
    add('启动偏好 boot.json', 'ok', `${b.theme}，${b.savedAt || ''}`);
  } catch (e) {
    add('启动偏好 boot.json', 'warn', '还没有生成（守护进程会在主题加载后写入）');
  }
  const port = cdp.readPort();
  if (!port) {
    add('Antigravity 页面', 'warn', '应用没开，页面相关检查跳过');
    return r;
  }
  try {
    const page = await cdp.evalMain(PAGE_CHECKS, 15000);
    if (!page) add('Antigravity 页面', 'warn', '找不到主窗口');
    else r.push(...page);
  } catch (e) {
    add('Antigravity 页面', 'fail', e.message);
  }
  return r;
}

module.exports = { run };
