// app.asar 补丁：在主窗口 createWindow 的 loadURL 前插入钩子，dom-ready 时注入 current.css / current.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MARKER = 'custom-theme injection hook';
const ANCHOR = 'void win.loadURL(url);';

// 先读 %APPDATA% 下的主题（更新不会动），安装目录里的副本只作兜底
const HOOK = `// === Antigravity custom-theme injection hook (start) ===
        win.webContents.on('dom-ready', () => {
            try {
                const path_ = require('path');
                const fs_ = require('fs');
                const dirs = [
                    path_.join(process.env.APPDATA || '', 'Antigravity', 'custom-theme'),
                    path_.join(process.resourcesPath, 'custom-theme')
                ];
                const readThemeFile = (name) => {
                    for (const d of dirs) {
                        try {
                            const f = path_.join(d, name);
                            if (fs_.existsSync(f)) return fs_.readFileSync(f, 'utf8');
                        } catch (e) { }
                    }
                    return null;
                };
                const css = readThemeFile('current.css');
                if (css && css.trim()) win.webContents.insertCSS(css).catch(() => { });
                const js = readThemeFile('current.js');
                if (js && js.trim()) win.webContents.executeJavaScript(js, true).catch(() => { });
            } catch (e) { }
        });
        // === Antigravity custom-theme injection hook (end) ===
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

// 'patched' | 'unpatched' | 'no-anchor'
function status(asarPath = defaultAsarPath()) {
  const t = findTarget(readAsar(asarPath));
  if (!t) return 'no-anchor';
  return t.content.includes(MARKER) ? 'patched' : 'unpatched';
}

function patch(asarPath = defaultAsarPath()) {
  const asar = readAsar(asarPath);
  const t = findTarget(asar);
  if (!t) throw new Error(`未找到锚点 ${ANCHOR}，Antigravity 可能改了 createWindow，需要更新 asar-patch.js`);
  if (t.content.includes(MARKER)) return { changed: false, file: t.file };

  const idx = t.content.indexOf(ANCHOR);
  const lineStart = t.content.lastIndexOf('\n', idx) + 1;
  const buf = Buffer.from(t.content.slice(0, lineStart) + HOOK + t.content.slice(lineStart), 'utf8');

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

  // 备份当前未打补丁的原件，再用临时文件 + 改名替换，避免写一半
  fs.copyFileSync(asarPath, `${asarPath}.orig`);
  const tmp = `${asarPath}.tmp`;
  fs.writeFileSync(tmp, out);
  fs.renameSync(tmp, asarPath);

  const v = findTarget(readAsar(asarPath));
  if (!v || !v.content.includes(MARKER) || sha256(Buffer.from(v.content, 'utf8')) !== v.entry.integrity.hash) {
    fs.copyFileSync(`${asarPath}.orig`, asarPath);
    throw new Error('补丁自检失败，已还原原始 app.asar');
  }
  return { changed: true, file: t.file, size: out.length };
}

module.exports = { MARKER, defaultAsarPath, status, patch };
