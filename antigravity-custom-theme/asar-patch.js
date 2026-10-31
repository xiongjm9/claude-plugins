// app.asar 补丁：在主窗口 createWindow 的 loadURL 前插入钩子，dom-ready 时注入 current.css / 启动偏好 / current.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MARKER = 'custom-theme injection hook';
const HOOK_VERSION = 2;
const ANCHOR = 'void win.loadURL(url);';
const START_TAG = `// === Antigravity ${MARKER} (start)`;
const END_TAG = `// === Antigravity ${MARKER} (end) ===`;

// 钩子只读静态数据（css / js / boot.json / wall.webp）注入渲染进程，不从 %APPDATA% 加载任何主进程代码。
// boot 让主题第一帧就用保存的偏好，不用等 nativeStorage 异步返回。
const HOOK = `${START_TAG} v${HOOK_VERSION} ===
        win.webContents.on('dom-ready', () => {
            try {
                const path_ = require('path');
                const fs_ = require('fs');
                const dirs = [
                    path_.join(process.env.APPDATA || '', 'Antigravity', 'custom-theme'),
                    path_.join(process.resourcesPath, 'custom-theme')
                ];
                const findThemeFile = (name) => {
                    for (const d of dirs) {
                        try {
                            const f = path_.join(d, name);
                            if (fs_.existsSync(f)) return f;
                        } catch (e) { }
                    }
                    return null;
                };
                const readThemeFile = (name) => {
                    const f = findThemeFile(name);
                    try { return f ? fs_.readFileSync(f, 'utf8') : null; } catch (e) { return null; }
                };
                const boot = {};
                try {
                    const b = JSON.parse(readThemeFile('boot.json') || '{}');
                    if (typeof b.theme === 'string' && b.theme.length < 64) boot.theme = b.theme;
                    if (b.studio && typeof b.studio === 'object') boot.studio = b.studio;
                } catch (e) { }
                try {
                    const wf = findThemeFile('wall.webp');
                    if (wf && fs_.statSync(wf).size < 6 * 1024 * 1024) {
                        const buf = fs_.readFileSync(wf);
                        if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') {
                            boot.wallImage = 'data:image/webp;base64,' + buf.toString('base64');
                        }
                    }
                } catch (e) { }
                const css = readThemeFile('current.css');
                if (css && css.trim()) win.webContents.insertCSS(css).catch(() => { });
                const js = readThemeFile('current.js');
                if (js && js.trim()) {
                    win.webContents.executeJavaScript('window.__agThemeBoot = ' + JSON.stringify(boot) + ';\\n' + js, true).catch(() => { });
                }
            } catch (e) { }
        });
        ${END_TAG}
`;

function defaultAsarPath() {
  return path.join(process.env.LOCALAPPDATA, 'Programs', 'Antigravity', 'resources', 'app.asar');
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function readAsar(asarPath) {
  const bytes = fs.readFileSync(asarPath);
  const headerSize = bytes.readUInt32LE(4);
  const jsonLen = bytes.readUInt32LE(12);
  const header = JSON.parse(bytes.toString('utf8', 16, 16 + jsonLen));
  return { bytes, header, dataStart: 8 + headerSize };
}

function* walk(node, prefix) {
  for (const [name, entry] of Object.entries(node.files || {})) {
    const p = prefix ? `${prefix}/${name}` : name;
    if (entry.files) yield* walk(entry, p);
    else yield [p, entry];
  }
}

// 不写死文件名：在所有打包的 .js 里找锚点，优先含 createWindow 的那个
function findTarget(asar) {
  let fallback = null;
  for (const [p, entry] of walk(asar.header, '')) {
    if (!p.endsWith('.js') || entry.unpacked || entry.offset === undefined) continue;
    const start = asar.dataStart + Number(entry.offset);
    const content = asar.bytes.toString('utf8', start, start + entry.size);
    if (!content.includes(ANCHOR) && !content.includes(MARKER)) continue;
    const hit = { file: p, entry, content };
    if (content.includes('function createWindow(')) return hit;
    fallback = fallback || hit;
  }
  return fallback;
}

// 去掉已插入的钩子（任何版本），还原成原始内容
function stripHook(content) {
  const a = content.indexOf(START_TAG);
  if (a < 0) return content;
  const lineStart = content.lastIndexOf('\n', a) + 1;
  const e = content.indexOf(END_TAG, a);
  if (e < 0) throw new Error('钩子缺少结束标记，无法安全替换');
  const lineEnd = content.indexOf('\n', e);
  return content.slice(0, lineStart) + content.slice(lineEnd < 0 ? content.length : lineEnd + 1);
}

const hookVersionOf = (content) => {
  if (!content.includes(MARKER)) return 0;
  const m = content.match(/custom-theme injection hook \(start\) v(\d+) ===/);
  return m ? Number(m[1]) : 1;
};

// 'patched' | 'outdated' | 'unpatched' | 'no-anchor'
function status(asarPath = defaultAsarPath()) {
  const t = findTarget(readAsar(asarPath));
  if (!t) return 'no-anchor';
  const v = hookVersionOf(t.content);
  if (!v) return 'unpatched';
  return v === HOOK_VERSION ? 'patched' : 'outdated';
}

function patch(asarPath = defaultAsarPath()) {
  const asar = readAsar(asarPath);
  const t = findTarget(asar);
  if (!t) throw new Error(`未找到锚点 ${ANCHOR}，Antigravity 可能改了 createWindow，需要更新 asar-patch.js`);
  const version = hookVersionOf(t.content);
  if (version === HOOK_VERSION) return { changed: false, file: t.file };

  const base = stripHook(t.content);
  const idx = base.indexOf(ANCHOR);
  if (idx < 0) throw new Error('去掉旧钩子后找不到锚点');
  const lineStart = base.lastIndexOf('\n', idx) + 1;
  const buf = Buffer.from(base.slice(0, lineStart) + HOOK + base.slice(lineStart), 'utf8');

  const blockSize = (t.entry.integrity && t.entry.integrity.blockSize) || 4 * 1024 * 1024;
  const blocks = [];
  for (let i = 0; i < buf.length; i += blockSize) blocks.push(sha256(buf.subarray(i, i + blockSize)));
  // 新内容追加到数据区末尾，原数据不动
  t.entry.size = buf.length;
  t.entry.offset = String(asar.bytes.length - asar.dataStart);
  t.entry.integrity = { algorithm: 'SHA256', hash: sha256(buf), blockSize, blocks };

  const json = Buffer.from(JSON.stringify(asar.header), 'utf8');
  const pad = (4 - (json.length % 4)) % 4;
  const head = Buffer.alloc(16);
  head.writeUInt32LE(4, 0);
  head.writeUInt32LE(8 + json.length + pad, 4);
  head.writeUInt32LE(4 + json.length + pad, 8);
  head.writeUInt32LE(json.length, 12);
  const out = Buffer.concat([head, json, Buffer.alloc(pad), asar.bytes.subarray(asar.dataStart), buf]);

  // 只在原件未打过补丁时备份，升级旧钩子时保留最初的原件；临时文件 + 改名替换，避免写一半
  const orig = `${asarPath}.orig`;
  if (version === 0 || !fs.existsSync(orig)) fs.copyFileSync(asarPath, orig);
  const backup = `${asarPath}.prev`;
  fs.copyFileSync(asarPath, backup);
  const tmp = `${asarPath}.tmp`;
  fs.writeFileSync(tmp, out);
  fs.renameSync(tmp, asarPath);

  const v = findTarget(readAsar(asarPath));
  if (!v || hookVersionOf(v.content) !== HOOK_VERSION || sha256(Buffer.from(v.content, 'utf8')) !== v.entry.integrity.hash) {
    fs.copyFileSync(backup, asarPath);
    fs.unlinkSync(backup);
    throw new Error('补丁自检失败，已还原到打补丁前的 app.asar');
  }
  fs.unlinkSync(backup);
  return { changed: true, upgraded: version > 0, file: t.file, size: out.length };
}

module.exports = { MARKER, HOOK, HOOK_VERSION, defaultAsarPath, status, patch, stripHook, readAsar, findTarget };
