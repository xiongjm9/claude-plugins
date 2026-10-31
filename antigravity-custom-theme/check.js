// Antigravity 更新后跑一下，看主题是否还完整：  node check.js
// 有「失败」项时退出码为 1
const health = require('./health');

const ICON = { ok: '通过', warn: '注意', fail: '失败' };

health.run().then((rows) => {
  const w = Math.max(...rows.map((r) => r.name.length));
  for (const r of rows) console.log(`${ICON[r.level]}  ${r.name.padEnd(w)}  ${r.detail}`);
  const fail = rows.filter((r) => r.level === 'fail').length;
  const warn = rows.filter((r) => r.level === 'warn').length;
  console.log(`\n${rows.length} 项：${fail} 项失败，${warn} 项注意`);
  if (fail) {
    console.log('外观异常时可按 Ctrl+Alt+Shift+T 临时切回官方原版；要彻底撤掉运行 node install_permanent.js --uninstall');
    process.exit(1);
  }
}).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
