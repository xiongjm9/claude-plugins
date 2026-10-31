// 通过 Antigravity 自带的远程调试端口（它固定开 remote-debugging-port=0，端口写在 DevToolsActivePort）注入主题，
// 并把页面里的偏好同步到 boot.json、把上传的壁纸存成 wall.webp（页面本身写不了文件）
const fs = require('fs');
const path = require('path');
const http = require('http');

const THEME_DIR = __dirname;
const PORT_FILE = path.join(process.env.APPDATA, 'Antigravity', 'DevToolsActivePort');
const BOOT_FILE = path.join(THEME_DIR, 'boot.json');
const WALL_FILE = path.join(THEME_DIR, 'wall.webp');
const WALL_MAX = 6 * 1024 * 1024;
const WINDOW_ORIGIN = 'https://127.0.0.1:';

function readPort() {
  try {
    const port = parseInt(fs.readFileSync(PORT_FILE, 'utf8').split(/\r?\n/)[0], 10);
    return port > 0 ? port : null;
  } catch (e) {
    return null;
  }
}

function listTargets(port) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/json/list', timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

// 只处理主窗口页面，跳过 devtools、弹窗 data: 页等
const isMainPage = (t) => t.type === 'page' && typeof t.url === 'string' && t.url.startsWith(WINDOW_ORIGIN) && t.webSocketDebuggerUrl;

async function mainTargets() {
  const port = readPort();
  if (!port) return { port: null, targets: [] };
  return { port, targets: (await listTargets(port)).filter(isMainPage) };
}

function evaluate(wsUrl, expressions, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const results = [];
    let id = 0;
    const timer = setTimeout(() => { try { ws.close(); } catch (e) {} reject(new Error('cdp timeout')); }, timeoutMs);
    const next = () => {
      if (id >= expressions.length) { clearTimeout(timer); ws.close(); resolve(results); return; }
      const expression = expressions[id];
      ws.send(JSON.stringify({ id: ++id, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
    };
    ws.onopen = next;
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id !== id) return;
      results.push(msg.result && msg.result.result ? msg.result.result.value : undefined);
      next();
    };
    ws.onerror = () => { clearTimeout(timer); reject(new Error('ws error')); };
  });
}

const isWebp = (buf) => buf.length > 12 && buf.length < WALL_MAX && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP';

function readBoot() {
  try { return JSON.parse(fs.readFileSync(BOOT_FILE, 'utf8')); } catch (e) { return {}; }
}

// 与 asar 钩子注入的内容一致：页面启动前先拿到偏好和壁纸
function bootPrelude() {
  const b = readBoot();
  const boot = {};
  if (typeof b.theme === 'string' && b.theme.length < 64) boot.theme = b.theme;
  if (b.studio && typeof b.studio === 'object') boot.studio = b.studio;
  try {
    const buf = fs.readFileSync(WALL_FILE);
    if (isWebp(buf)) boot.wallImage = 'data:image/webp;base64,' + buf.toString('base64');
  } catch (e) {}
  return `window.__agThemeBoot = ${JSON.stringify(boot)};`;
}

function buildExpressions() {
  const css = fs.readFileSync(path.join(THEME_DIR, 'current.css'), 'utf8');
  const js = fs.readFileSync(path.join(THEME_DIR, 'current.js'), 'utf8');
  const injectCss = `(() => {
    let s = document.getElementById('antigravity-custom-theme-css');
    if (!s) { s = document.createElement('style'); s.id = 'antigravity-custom-theme-css'; (document.head || document.documentElement).appendChild(s); }
    s.textContent = ${JSON.stringify(css)};
  })()`;
  return [injectCss, bootPrelude() + '\n' + js];
}

// 热替换时先拆掉旧引擎（定时器、观察者、注入的节点）
const RESET = `(() => {
  clearInterval(window.__antigravityThemeWatchdog);
  if (window.__antigravityThemeObserver) window.__antigravityThemeObserver.disconnect();
  window.__antigravityThemeEngineLoaded = false;
  window.__antigravityThemeReady = false;
  window.__antigravityThemeWatchdog = null;
  window.__antigravityThemeObserver = null;
  ['antigravity-active-theme', 'antigravity-theme-dropdown', 'antigravity-theme-selector', 'antigravity-studio-css', 'ag-studio', 'sk-wall'].forEach((id) => { const e = document.getElementById(id); if (e) e.remove(); });
})()`;

const STATE = `(() => {
  const s = window.__agThemeState;
  return {
    loaded: !!window.__antigravityThemeEngineLoaded,
    ready: !!window.__antigravityThemeReady,
    readyState: document.readyState,
    theme: s ? s.theme : null,
    studio: s ? s.prefs : null,
    wallUpload: s ? s.wallUploadId : null
  };
})()`;

let lastBootJson = null;
function writeBoot(theme, studio) {
  if (typeof theme !== 'string' || !studio || typeof studio !== 'object') return false;
  const json = JSON.stringify({ theme, studio });
  if (lastBootJson === null) {
    const cur = readBoot();
    lastBootJson = JSON.stringify({ theme: cur.theme, studio: cur.studio });
  }
  if (json === lastBootJson) return false;
  const tmp = BOOT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ theme, studio, savedAt: new Date().toISOString() }, null, 2));
  fs.renameSync(tmp, BOOT_FILE);
  lastBootJson = json;
  return true;
}

function saveWall(dataUrl) {
  const m = typeof dataUrl === 'string' && dataUrl.match(/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error('不是 WebP 图片');
  const buf = Buffer.from(m[1], 'base64');
  if (!isWebp(buf)) throw new Error('图片格式或大小不对');
  const tmp = WALL_FILE + '.tmp';
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, WALL_FILE);
  return buf.length;
}

// 守护进程每轮调用：没加载主题的窗口补注入；已加载的同步偏好与壁纸
async function syncAll({ force = false, log = () => {} } = {}) {
  const { port, targets } = await mainTargets();
  const out = { port, pages: targets.length, injected: 0, states: [] };
  let bootDone = false;
  for (const t of targets) {
    try {
      const [st] = await evaluate(t.webSocketDebuggerUrl, [STATE]);
      if (!st) continue;
      if (force || (!st.loaded && st.readyState !== 'loading')) {
        await evaluate(t.webSocketDebuggerUrl, force && st.loaded ? [RESET, ...buildExpressions()] : buildExpressions());
        out.injected++;
        continue;
      }
      out.states.push(st);
      if (!bootDone && st.ready && writeBoot(st.theme, st.studio)) log(`boot.json <- ${st.theme}`);
      bootDone = bootDone || st.ready;
      if (st.wallUpload) {
        const [data] = await evaluate(t.webSocketDebuggerUrl, ['window.__agThemeState.wallUpload ? window.__agThemeState.wallUpload.data : null'], 20000);
        let ack;
        try {
          const size = saveWall(data);
          ack = { ok: true };
          log(`wall.webp saved ${size} bytes`);
        } catch (e) {
          ack = { ok: false, error: e.message };
          log(`wall save failed: ${e.message}`);
        }
        await evaluate(t.webSocketDebuggerUrl, [`window.__agThemeState && window.__agThemeState.ackWall(${JSON.stringify(st.wallUpload)}, ${JSON.stringify(ack)})`]);
      }
    } catch (e) { /* 页面正在刷新或关闭，下一轮再试 */ }
  }
  return out;
}

// inject_live.js 用：强制把最新文件刷进所有主窗口
const injectAll = (opts) => syncAll(opts);

// 在第一个主窗口执行表达式（健康检查、提示条用）
async function evalMain(expression, timeoutMs) {
  const { targets } = await mainTargets();
  if (!targets.length) return undefined;
  const [v] = await evaluate(targets[0].webSocketDebuggerUrl, [expression], timeoutMs);
  return v;
}

const toastExpr = (msg) => `(() => {
  const old = document.getElementById('ag-theme-toast'); if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'ag-theme-toast';
  t.textContent = ${JSON.stringify(msg)};
  t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483600;max-width:min(560px,calc(100vw - 32px));padding:10px 16px;border-radius:12px;background:rgba(29,29,31,.92);color:#fff;font:500 12.5px/1.45 system-ui,sans-serif;box-shadow:0 12px 32px -8px rgba(0,0,0,.35);cursor:default;-webkit-app-region:no-drag';
  t.onclick = () => t.remove();
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 15000);
})()`;

async function pageStatus() {
  const { targets } = await mainTargets();
  const out = [];
  for (const t of targets) {
    const [v] = await evaluate(t.webSocketDebuggerUrl, [`({ engineLoaded: !!window.__antigravityThemeEngineLoaded, ready: !!window.__antigravityThemeReady, theme: window.__agThemeState && window.__agThemeState.theme, themeBtn: (document.getElementById('antigravity-theme-btn') || {}).textContent || null })`]);
    out.push({ url: t.url, ...v });
  }
  return out;
}

module.exports = { readPort, mainTargets, evaluate, syncAll, injectAll, evalMain, toastExpr, pageStatus, bootPrelude, RESET, STATE, BOOT_FILE, WALL_FILE };
