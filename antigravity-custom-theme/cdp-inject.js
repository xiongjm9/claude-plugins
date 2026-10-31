// 通过 Antigravity 自带的远程调试端口（它固定开 remote-debugging-port=0，端口写在 DevToolsActivePort）注入主题
const fs = require('fs');
const path = require('path');
const http = require('http');

const THEME_DIR = __dirname;
const PORT_FILE = path.join(process.env.APPDATA, 'Antigravity', 'DevToolsActivePort');
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

function evaluate(wsUrl, expressions) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const results = [];
    let id = 0;
    const timer = setTimeout(() => { try { ws.close(); } catch (e) {} reject(new Error('cdp timeout')); }, 10000);
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
    ws.onerror = (e) => { clearTimeout(timer); reject(new Error('ws error')); };
  });
}

function buildExpressions() {
  const css = fs.readFileSync(path.join(THEME_DIR, 'current.css'), 'utf8');
  const js = fs.readFileSync(path.join(THEME_DIR, 'current.js'), 'utf8');
  const injectCss = `(() => {
    let s = document.getElementById('antigravity-custom-theme-css');
    if (!s) { s = document.createElement('style'); s.id = 'antigravity-custom-theme-css'; (document.head || document.documentElement).appendChild(s); }
    s.textContent = ${JSON.stringify(css)};
  })()`;
  return [injectCss, js];
}

const CHECK = `({ loaded: !!window.__antigravityThemeEngineLoaded, ready: document.readyState })`;

// 对所有尚未加载主题的主窗口注入一次；返回注入的页面数
async function injectAll({ force = false } = {}) {
  const port = readPort();
  if (!port) return { port: null, injected: 0, pages: 0 };
  const targets = (await listTargets(port)).filter(isMainPage);
  let injected = 0;
  for (const t of targets) {
    try {
      if (!force) {
        const [state] = await evaluate(t.webSocketDebuggerUrl, [CHECK]);
        if (!state || state.loaded || state.ready === 'loading') continue;
      }
      await evaluate(t.webSocketDebuggerUrl, buildExpressions());
      injected++;
    } catch (e) { /* 页面正在刷新或关闭，下一轮再试 */ }
  }
  return { port, injected, pages: targets.length };
}

async function pageStatus() {
  const port = readPort();
  if (!port) return [];
  const targets = (await listTargets(port)).filter(isMainPage);
  const out = [];
  for (const t of targets) {
    const [v] = await evaluate(t.webSocketDebuggerUrl, [`({ engineLoaded: !!window.__antigravityThemeEngineLoaded, themeBtn: !!document.getElementById('antigravity-theme-btn'), themeBtnText: document.getElementById('antigravity-theme-btn')?.textContent })`]);
    out.push({ url: t.url, ...v });
  }
  return out;
}

module.exports = { readPort, injectAll, pageStatus };
