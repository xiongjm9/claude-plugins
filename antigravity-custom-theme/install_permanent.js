const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const themeDir = 'C:\\Users\\Administrator\\AppData\\Roaming\\Antigravity\\custom-theme';
const resDir = path.join(process.env.LOCALAPPDATA, 'Programs', 'antigravity', 'resources');
const asarPath = path.join(resDir, 'app.asar');
const resThemeDir = path.join(resDir, 'custom-theme');

console.log('[*] Target asar:', asarPath);

if (!fs.existsSync(asarPath)) {
  console.error('[X] Cannot find app.asar at:', asarPath);
  process.exit(1);
}

// 1. 同步 custom-theme 到 resources 目录
if (!fs.existsSync(resThemeDir)) {
  fs.mkdirSync(resThemeDir, { recursive: true });
}
fs.copyFileSync(path.join(themeDir, 'current.css'), path.join(resThemeDir, 'current.css'));
fs.copyFileSync(path.join(themeDir, 'current.js'), path.join(resThemeDir, 'current.js'));
console.log('[OK] Deployed theme files to:', resThemeDir);

// 2. 读取 asar
const bytes = fs.readFileSync(asarPath);
const jsonLen = bytes.readUInt32LE(12);
const payloadSize = bytes.readUInt32LE(8);
const dataStart = 12 + payloadSize;
const json = bytes.toString('utf8', 16, 16 + jsonLen);

const marker = 'custom-theme injection hook';
const anchor = 'void win.loadURL(url);';
const utilPattern = /"utils\.js":\{"size":(\d+),"offset":"(\d+)","integrity":\{"algorithm":"SHA256","hash":"([0-9a-f]{64})","blockSize":(\d+),"blocks":\[[^\]]*\]\}\}/g;

let match;
let targetMatch = null;
let utilsContent = null;

while ((match = utilPattern.exec(json)) !== null) {
  const sz = parseInt(match[1], 10);
  const off = parseInt(match[2], 10);
  const content = bytes.toString('utf8', dataStart + off, dataStart + off + sz);
  if (content.includes(anchor)) {
    targetMatch = match;
    utilsContent = content;
    break;
  }
}

if (!targetMatch) {
  console.error('[X] Cannot find utils.js anchor in app.asar!');
  process.exit(1);
}

if (utilsContent.includes(marker)) {
  console.log('[OK] app.asar already has hook injected. Skipping patch.');
} else {
  console.log('[*] Injecting hook into utils.js...');
  const anchorIdx = utilsContent.indexOf(anchor);
  const lineStart = utilsContent.lastIndexOf('\n', anchorIdx) + 1;

  const hook = `// === Antigravity custom-theme injection hook (start) ===
        win.webContents.on('dom-ready', () => {
            try {
                const path_ = require('path');
                const fs_ = require('fs');
                const dirs = [
                    path_.join(process.resourcesPath, 'custom-theme'),
                    path_.join(process.env.APPDATA || '', 'Antigravity', 'custom-theme')
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

  const newUtils = utilsContent.substring(0, lineStart) + hook + utilsContent.substring(lineStart);
  const newUtilsBuf = Buffer.from(newUtils, 'utf8');

  // 计算 integrity
  const blockSize = parseInt(targetMatch[4], 10);
  const blocks = [];
  for (let i = 0; i < newUtilsBuf.length; i += blockSize) {
    const chunk = newUtilsBuf.subarray(i, Math.min(newUtilsBuf.length, i + blockSize));
    const h = crypto.createHash('sha256').update(chunk).digest('hex');
    blocks.push(`"${h}"`);
  }
  const fullHash = crypto.createHash('sha256').update(newUtilsBuf).digest('hex');

  const newOffset = bytes.length - dataStart;
  const newEntryJson = `"utils.js":{"size":${newUtilsBuf.length},"offset":"${newOffset}","integrity":{"algorithm":"SHA256","hash":"${fullHash}","blockSize":${blockSize},"blocks":[${blocks.join(',')}]}}`;

  const newJson = json.substring(0, targetMatch.index) + newEntryJson + json.substring(targetMatch.index + targetMatch[0].length);
  const newJsonBuf = Buffer.from(newJson, 'utf8');

  const pad = (4 - (newJsonBuf.length % 4)) % 4;
  const H = 8 + newJsonBuf.length + pad;
  const newPayloadSize = 4 + newJsonBuf.length + pad;

  const headerBuf = Buffer.alloc(16);
  headerBuf.writeUInt32LE(4, 0);
  headerBuf.writeUInt32LE(H, 4);
  headerBuf.writeUInt32LE(newPayloadSize, 8);
  headerBuf.writeUInt32LE(newJsonBuf.length, 12);

  const padBuf = Buffer.alloc(pad, 0);
  const rawDataBuf = bytes.subarray(dataStart);

  const outBuf = Buffer.concat([headerBuf, newJsonBuf, padBuf, rawDataBuf, newUtilsBuf]);
  fs.writeFileSync(asarPath, outBuf);
  console.log('[OK] Successfully patched app.asar. New size:', outBuf.length);
}

// 3. 验证
const verifyBytes = fs.readFileSync(asarPath);
const vJsonLen = verifyBytes.readUInt32LE(12);
const vPayloadSize = verifyBytes.readUInt32LE(8);
const vDataStart = 12 + vPayloadSize;
const vJson = verifyBytes.toString('utf8', 16, 16 + vJsonLen);

let verified = false;
const vPattern = /"utils\.js":\{"size":(\d+),"offset":"(\d+)","integrity":\{"algorithm":"SHA256","hash":"([0-9a-f]{64})","blockSize":(\d+),"blocks":\[[^\]]*\]\}\}/g;
let vm;
while ((vm = vPattern.exec(vJson)) !== null) {
  const sz = parseInt(vm[1], 10);
  const off = parseInt(vm[2], 10);
  const content = verifyBytes.toString('utf8', vDataStart + off, vDataStart + off + sz);
  if (content.includes(marker)) {
    const calcHash = crypto.createHash('sha256').update(Buffer.from(content, 'utf8')).digest('hex');
    if (calcHash === vm[3]) {
      verified = true;
      break;
    }
  }
}

if (!verified) {
  console.error('[X] Verification failed!');
  process.exit(1);
}

console.log('[OK] Self-verification passed: Hook verified & SHA256 integrity matched!');
console.log('=== Installation Complete ===');
