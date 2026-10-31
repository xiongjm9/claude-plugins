// 后台守护：Antigravity 更新会整体替换 app.asar，钩子随之丢失。
// 1. 应用运行中：通过调试端口给没加载主题的窗口补注入，更新后首次启动也能立刻有主题
// 2. 应用关闭且 app.asar 稳定 30 秒：检测到钩子丢失就重新打补丁
const fs = require('fs');
const net = require('net');
const path = require('path');
const { execFile } = require('child_process');
const asarPatch = require('./asar-patch');
const cdp = require('./cdp-inject');

const PIPE = '\\\\.\\pipe\\antigravity-custom-theme-guardian';
const LOG = path.join(__dirname, 'guardian.log');
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
  if (asarState !== 'unpatched') return;
  if (Date.now() - st.mtimeMs < ASAR_STABLE_MS) return; // 安装器可能还在写
  if (await appRunning()) return; // 运行中文件被占用，靠调试端口注入，退出后再补
  try {
    const r = asarPatch.patch(asarPath);
    log(`patched ${r.file} size=${r.size}`);
  } catch (e) {
    log(`patch failed: ${e.message}`);
  }
  lastAsarSig = '';
}

async function checkPages() {
  try {
    const r = await cdp.injectAll();
    if (r.port !== lastPort) { lastPort = r.port; if (r.port) log(`debug port ${r.port}`); }
    if (r.injected) log(`live-injected ${r.injected}/${r.pages} page(s)`);
  } catch (e) { /* 应用没开或端口失效 */ }
}

async function loop() {
  await checkPages();
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
