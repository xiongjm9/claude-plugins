// 不重启直接把最新 current.css / current.js 注入到正在运行的 Antigravity（改完主题调试用）
// 端口每次启动都会变，从 %APPDATA%\Antigravity\DevToolsActivePort 读取
const cdp = require('./cdp-inject');

(async () => {
  const r = await cdp.injectAll({ force: true });
  if (!r.port) {
    console.error('Antigravity 未运行，或找不到 DevToolsActivePort');
    process.exit(1);
  }
  console.log(`port ${r.port}: injected ${r.injected}/${r.pages} page(s)`);
  for (const s of await cdp.pageStatus()) console.log('STATUS:', s);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
