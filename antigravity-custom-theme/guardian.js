// 后台守护：Antigravity 更新会整体替换 app.asar，钩子随之丢失。
// 1. 应用运行中：通过调试端口给没加载主题的窗口补注入，更新后首次启动也能立刻有主题
// 2. 应用关闭且 app.asar 稳定 30 秒：钩子丢失或是旧版就重新打补丁
// 3. 把页面里的皮肤与外观偏好写进 boot.json，上传的壁纸存成 wall.webp，下次启动第一帧就用上
// 4. app.asar 每变一次（更新或重新打补丁），等主题加载后跑一次健康检查，有失败项就在页面里提示
const fs = require('fs');
const net = require('net');
const path = require('path');
const { execFile } = require('child_process');
const asarPatch = require('./asar-patch');
const cdp = require('./cdp-inject');
const health = require('./health');

const PIPE = '\\\\.\\pipe\\antigravity-custom-theme-guardian';
const LOG = path.join(__dirname, 'guardian.log');
const STATE_FILE = path.join(__dirname, 'guardian-state.json');
const HEALTH_DELAY_MS = 10000;
const TICK_MS = 4000;
const ASAR_CHECK_MS = 15000;
const ASAR_STABLE_MS = 30000;

function log(msg) {
  try {
    if (fs.existsSync(LOG) && fs.statSync(LOG).size > 256 * 1024) fs.renameSync(LOG, `${LOG}.1`);
    fs.appendFileSync(LOG, `${new Date().toISOString()} ${msg}\n`);
  } catch (e) {}
}

function appRunning() {
  return new Promise((resolve) => {
    execFile('tasklist', ['/FI', 'IMAGENAME eq Antigravity.exe', '/FO', 'CSV', '/NH'], { windowsHide: true }, (err, out) => {
      resolve(!err && /"Antigravity\.exe"/i.test(out));
    });
  });
}

let lastAsarCheck = 0;
let lastAsarSig = '';
let asarState = '';
let lastPort = null;

async function checkAsar() {
  if (Date.now() - lastAsarCheck < ASAR_CHECK_MS) return;
  lastAsarCheck = Date.now();
  const asarPath = asarPatch.defaultAsarPath();
  let st;
  try { st = fs.statSync(asarPath); } catch (e) { return; }
  const sig = `${st.size}:${st.mtimeMs}`;
  if (sig !== lastAsarSig) {
    lastAsarSig = sig;
    try { asarState = asarPatch.status(asarPath); } catch (e) { asarState = 'error'; }
    log(`app.asar ${sig} -> ${asarState}`);
  }
  if (asarState !== 'unpatched' && asarState !== 'outdated') return;
  if (Date.now() - st.mtimeMs < ASAR_STABLE_MS) return; // 安装器可能还在写
  if (await appRunning()) return; // 运行中文件被占用，靠调试端口注入，退出后再补
  try {
    const r = asarPatch.patch(asarPath);
    log(`patched ${r.file} size=${r.size}${r.upgraded ? ' (hook upgraded)' : ''}`);
  } catch (e) {
    log(`patch failed: ${e.message}`);
  }
  lastAsarSig = '';
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) { return {}; }
}
function writeState(s) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); } catch (e) {}
}

let loadedSince = 0;

async function checkPages() {
  try {
    const r = await cdp.syncAll({ log });
    if (r.port !== lastPort) { lastPort = r.port; loadedSince = 0; if (r.port) log(`debug port ${r.port}`); }
    if (r.injected) log(`live-injected ${r.injected}/${r.pages} page(s)`);
    const loaded = r.states.some((s) => s.loaded);
    if (!loaded) { loadedSince = 0; return; }
    if (!loadedSince) loadedSince = Date.now();
  } catch (e) { loadedSince = 0; /* 应用没开或端口失效 */ }
}

// 每个 app.asar 版本只检查一次；按引擎「已加载」计时而不是「已初始化」，初始化中途报错也能查出来
async function checkHealth() {
  if (!loadedSince || Date.now() - loadedSince < HEALTH_DELAY_MS) return;
  let sig;
  try { const st = fs.statSync(asarPatch.defaultAsarPath()); sig = `${st.size}:${st.mtimeMs}`; } catch (e) { return; }
  const state = readState();
  if (state.healthSig === sig) return;
  writeState({ ...state, healthSig: sig, healthAt: new Date().toISOString() });
  try {
    const rows = await health.run({ skipGuardian: true });
    const fails = rows.filter((x) => x.level === 'fail');
    log(`health ${rows.length - fails.length}/${rows.length} ok${fails.length ? ': ' + fails.map((f) => `${f.name}(${f.detail})`).join('; ') : ''}`);
    if (fails.length) {
      await cdp.evalMain(cdp.toastExpr(`外观插件有 ${fails.length} 项检查未通过（${fails.map((f) => f.name).join('、')}）。可按 Ctrl+Alt+Shift+T 临时切回官方原版，或运行 node check.js 查看详情。`));
    }
  } catch (e) {
    log(`health error: ${e.message}`);
  }
}

async function loop() {
  await checkPages();
  await checkHealth();
  await checkAsar();
  setTimeout(loop, TICK_MS);
}

// 单实例：命名管道被占用说明已有守护在跑；收到 quit 退出（重装/卸载用）
const server = net.createServer((sock) => {
  sock.on('data', (d) => {
    if (String(d).trim() === 'quit') { log('quit by request'); sock.end('bye'); process.exit(0); }
    sock.end('ok');
  });
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') process.exit(0);
  log(`pipe error: ${e.message}`);
});
server.listen(PIPE, () => {
  log(`guardian started pid=${process.pid}`);
  loop();
});
