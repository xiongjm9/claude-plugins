// 安装 / 修复：打 app.asar 补丁 + 登录自启守护进程。  node install_permanent.js
// 卸载：停守护、删自启、还原 app.asar。                  node install_permanent.js --uninstall
const fs = require('fs');
const net = require('net');
const path = require('path');
const { execFileSync, spawn, spawnSync } = require('child_process');

// 运行目录固定在 %APPDATA%（钩子和自启都指向这里，更新不会动）；从仓库（如 D:\claude-plugins）执行时先同步过去再装
const RUNTIME_DIR = path.join(process.env.APPDATA, 'Antigravity', 'custom-theme');
const RUNTIME_FILES = ['current.css', 'current.js', 'asar-patch.js', 'cdp-inject.js', 'guardian.js', 'inject_live.js', 'install_permanent.js'];
if (path.resolve(__dirname).toLowerCase() !== path.resolve(RUNTIME_DIR).toLowerCase()) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  for (const f of RUNTIME_FILES) fs.copyFileSync(path.join(__dirname, f), path.join(RUNTIME_DIR, f));
  console.log('[OK] 已同步运行文件到', RUNTIME_DIR);
  const r = spawnSync(process.execPath, [path.join(RUNTIME_DIR, 'install_permanent.js'), ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status === null ? 1 : r.status);
}

const asarPatch = require('./asar-patch');

const PIPE = '\\\\.\\pipe\\antigravity-custom-theme-guardian';
const STARTUP_VBS = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'antigravity-custom-theme-guardian.vbs');
const asarPath = asarPatch.defaultAsarPath();

function appRunning() {
  try {
    const out = execFileSync('tasklist', ['/FI', 'IMAGENAME eq Antigravity.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
    return /"Antigravity\.exe"/i.test(out);
  } catch (e) {
    return false;
  }
}

function stopGuardian() {
  return new Promise((resolve) => {
    const sock = net.connect(PIPE, () => sock.write('quit'));
    sock.on('data', () => {});
    sock.on('close', () => setTimeout(() => resolve(true), 300));
    sock.on('error', () => resolve(false));
  });
}

function startGuardian() {
  spawn('wscript.exe', [STARTUP_VBS], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
}

function writeStartup() {
  const q = (s) => s.replace(/"/g, '""');
  const vbs = `' Antigravity custom-theme guardian（由 install_permanent.js 生成）\r\n` +
    `CreateObject("WScript.Shell").Run """${q(process.execPath)}"" ""${q(path.join(__dirname, 'guardian.js'))}""", 0, False\r\n`;
  // wscript 按 UTF-16 LE 读带 BOM 的脚本，路径里有中文也不会乱码
  fs.writeFileSync(STARTUP_VBS, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(vbs, 'utf16le')]));
}

async function install() {
  if (!fs.existsSync(asarPath)) throw new Error(`找不到 ${asarPath}`);
  if (asarPatch.status(asarPath) === 'patched') {
    console.log('[OK] app.asar 已有钩子');
  } else if (appRunning()) {
    console.log('[*] Antigravity 正在运行，app.asar 暂不改动：守护进程会先实时注入，关闭应用后自动打补丁');
  } else {
    const r = asarPatch.patch(asarPath);
    console.log(r.changed ? `[OK] 已给 ${r.file} 打补丁并通过自检` : '[OK] app.asar 已有钩子');
  }
  writeStartup();
  console.log('[OK] 已写入登录自启:', STARTUP_VBS);
  if (await stopGuardian()) console.log('[*] 已停止旧守护进程');
  startGuardian();
  console.log('[OK] 守护进程已启动，日志:', path.join(__dirname, 'guardian.log'));
}

async function uninstall() {
  if (await stopGuardian()) console.log('[OK] 已停止守护进程');
  if (fs.existsSync(STARTUP_VBS)) { fs.unlinkSync(STARTUP_VBS); console.log('[OK] 已删除登录自启'); }
  const orig = `${asarPath}.orig`;
  if (asarPatch.status(asarPath) !== 'patched') {
    console.log('[OK] app.asar 没有钩子，无需还原');
  } else if (appRunning()) {
    console.log('[!] Antigravity 正在运行，关闭后再执行一次 --uninstall 以还原 app.asar');
  } else if (fs.existsSync(orig)) {
    fs.copyFileSync(orig, asarPath);
    fs.unlinkSync(orig);
    console.log('[OK] 已还原原始 app.asar');
  } else {
    console.log('[!] 没有找到 app.asar.orig，保留当前文件；重新安装 Antigravity 即可恢复原版');
  }
}

(process.argv.includes('--uninstall') ? uninstall() : install()).catch((e) => {
  console.error('[X]', e.message);
  process.exit(1);
});
