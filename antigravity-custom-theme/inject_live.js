const fs = require('fs');
const path = require('path');
const http = require('http');

const themeDir = 'C:/Users/Administrator/AppData/Roaming/Antigravity/custom-theme';
const cssContent = fs.readFileSync(path.join(themeDir, 'current.css'), 'utf-8');
const jsContent = fs.readFileSync(path.join(themeDir, 'current.js'), 'utf-8');

http.get('http://127.0.0.1:59565/json/list', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const mainPage = list.find(x => x.type === 'page');
    if (!mainPage) {
      console.error('No main page found');
      return;
    }
    const wsUrl = mainPage.webSocketDebuggerUrl;
    console.log('Target WS:', wsUrl);

    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log('WS connected! Injecting CSS...');
      const injectCss = `
        (() => {
          let s = document.getElementById('antigravity-custom-theme-css');
          if (!s) {
            s = document.createElement('style');
            s.id = 'antigravity-custom-theme-css';
            document.head.appendChild(s);
          }
          s.textContent = ${JSON.stringify(cssContent)};
        })();
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: injectCss } }));
    };

    let step = 1;
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      console.log('Step ' + step + ' result:', msg.result ? 'OK' : msg);
      if (step === 1) {
        step = 2;
        console.log('Injecting JS...');
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression: jsContent } }));
      } else if (step === 2) {
        step = 3;
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: {
            expression: `({
              engineLoaded: !!window.__antigravityThemeEngineLoaded,
              themeBtn: !!document.getElementById('antigravity-theme-btn'),
              themeBtnText: document.getElementById('antigravity-theme-btn')?.textContent
            })`,
            returnByValue: true
          }
        }));
      } else if (step === 3) {
        console.log('STATUS:', msg.result?.result?.value);
        ws.close();
      }
    };
  });
});
