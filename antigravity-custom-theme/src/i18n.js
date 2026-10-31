    // ===================== 界面汉化 =====================
    // 只替换界面文案的显示文本，原文记在旁边，切回 English 时还原。词典见 src/i18n-zh.js。
    // 不碰 aria-label（宿主样式靠它选按钮），不进代码块、编辑器、终端、消息正文和输入框。
    const I18N = /*@@I18N_DICT@@*/;
    const I18N_EXACT = new Map(Object.entries(I18N.exact));
    const I18N_LOWER = new Map(Object.entries(I18N.exact).filter(([k]) => k.includes(' ')).map(([k, v]) => [k.toLowerCase(), v]));
    const I18N_PATTERNS = I18N.patterns.map(([re, to]) => [new RegExp(re), to]);
    const I18N_SKIP = 'pre, code, textarea, input, select, script, style, svg, [contenteditable="true"], .monaco-editor, .xterm, .cm-editor, [class*="prose"], [class*="markdown"], [data-testid*="message"], [data-testid="user-input-step"], #ag-studio, #antigravity-theme-selector, #ag-theme-toast';
    const I18N_ATTRS = ['title', 'placeholder'];
    // 原文表挂在 window 上，热替换引擎后还能把旧引擎翻过的文字还原
    const i18nMaps = window.__agI18nMaps || (window.__agI18nMaps = { text: new WeakMap(), attr: new WeakMap() });
    let i18nCount = 0;
    const I18N_GEN = Date.now() + Math.random(); // 每份引擎一个标记：热替换后旧引擎翻过的文字也计入本次
    let i18nActive = false;
    const i18nPending = new Set();
    const i18nPendingAttr = new Set();
    let i18nQueued = false;

    const I18N_CTX = I18N.ctx || [];
    const CJK_EDGE = /[　-ヿ㐀-鿿＀-￯]/;

    // 「1 day, 10 hours」→「1 天 10 小时」
    function zhDuration(s) {
        return s.replace(/(\d+)\s*(days?|hours?|minutes?|seconds?|weeks?)/g, (m, n, u) => n + ' ' + ({ d: '天', h: '小时', m: '分钟', s: '秒', w: '周' })[u[0]])
            .replace(/,\s*/g, ' ').replace(/\s+and\s+/g, ' ');
    }

    // 后一个有文字的兄弟节点，用于按上下文翻译被拆开的短词
    function nextSiblingText(n) {
        for (let s = n.nextSibling; s; s = s.nextSibling) {
            const t = (s.textContent || '').trim();
            if (t) return t;
        }
        return '';
    }

    function zhOf(raw, node) {
        if (!raw || raw.length > 400) return null;
        const t = raw.trim();
        if (!t || !/[A-Za-z]/.test(t)) return null;
        let zh = I18N_EXACT.get(t);
        if (zh === undefined) zh = I18N_LOWER.get(t.toLowerCase());
        if (zh === undefined && node) {
            for (const [word, next, to] of I18N_CTX) if (t === word && nextSiblingText(node) === next) { zh = to; break; }
        }
        if (zh === undefined) {
            for (const [re, to] of I18N_PATTERNS) if (re.test(t)) { zh = zhDuration(t.replace(re, to)); break; }
        }
        if (zh === undefined || zh === t) return null;
        // 原文两侧空格先保留（中英之间留空格）；译文边上是中文标点时去掉。中文与中文相邻的空格由 i18nTidy 收拾
        const m = raw.match(/^(\s*)[\s\S]*?(\s*)$/);
        const lead = CJK_PUNCT.test(zh[0]) ? '' : m[1];
        const tail = CJK_PUNCT.test(zh[zh.length - 1]) ? '' : m[2];
        return lead + zh + tail;
    }

    // ---- 拼句整理：一句话被拆成多个节点时，修掉中文之间的空格和英文标点 ----
    const CJK_PUNCT = /[　-〿＀-￯]/;
    const GLUE_RE = /^(\s*)([.,:;!?]?)(\s*)$/;
    const FULL = { '.': '。', ',': '，', ':': '：', ';': '；', '!': '！', '?': '？' };
    const INLINE = 'span, a, button, code, strong, em, b, i, kbd, small, label, sup, sub';
    const blockOf = (n) => n.parentElement && (n.parentElement.closest(`:not(${INLINE})`) || n.parentElement);
    const endsCjk = (s) => { s = s.trimEnd(); return !!s && CJK_EDGE.test(s[s.length - 1]); };
    const startsCjk = (s) => { s = s.trimStart(); return !!s && CJK_EDGE.test(s[0]); };
    const startsPunct = (s) => { s = s.trimStart(); return !!s && CJK_PUNCT.test(s[0]); };

    function setTidy(n, v) {
        if (n.nodeValue === v) return;
        const rec = i18nMaps.text.get(n);
        if (rec) rec.zh = v; else i18nMaps.text.set(n, { en: n.nodeValue, zh: v, gen: I18N_GEN, glue: true });
        n.nodeValue = v;
    }

    // nodes：同一区域内按文档顺序排列的文本节点
    function i18nTidy(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const blk = blockOf(n);
            const prevN = i > 0 && blockOf(nodes[i - 1]) === blk ? nodes[i - 1] : null;
            const nextN = i + 1 < nodes.length && blockOf(nodes[i + 1]) === blk ? nodes[i + 1] : null;
            const prev = prevN ? prevN.nodeValue : '';
            const next = nextN ? nextN.nodeValue : '';
            const ours = (x) => !!x && i18nMaps.text.has(x) && !i18nMaps.text.get(x).glue;
            const v = n.nodeValue;
            if (ours(n)) {
                let w = v;
                if (/\s$/.test(w) && (startsCjk(next) && endsCjk(w))) w = w.trimEnd();
                if (/^\s/.test(w) && endsCjk(prev) && startsCjk(w)) w = w.trimStart();
                if (/^\s/.test(w) && startsPunct(w)) w = w.trimStart();
                setTidy(n, w);
                continue;
            }
            // 只有空格或一个英文标点的「胶水」节点，且挨着我们翻过的文字
            const g = v.match(GLUE_RE);
            if (!g || !v || !(ours(prevN) || ours(nextN))) continue;
            if (g[2]) {
                if (endsCjk(prev)) setTidy(n, FULL[g[2]] + (startsCjk(next) || !next ? '' : g[3]));
            } else if ((endsCjk(prev) && startsCjk(next)) || startsPunct(next)) {
                setTidy(n, '');
            }
        }
    }

    function textNodesIn(root) {
        const out = [];
        const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => (n.nodeType === 3 ? NodeFilter.FILTER_ACCEPT : n.matches(I18N_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP)
        });
        for (let n; (n = w.nextNode());) out.push(n);
        return out;
    }

    function i18nTextNode(n, checked) {
        const cur = n.nodeValue;
        const rec = i18nMaps.text.get(n);
        if (rec && cur === rec.zh) { if (rec.gen !== I18N_GEN) { rec.gen = I18N_GEN; i18nCount++; } return; }
        if (!checked && (!n.parentElement || n.parentElement.closest(I18N_SKIP))) return;
        const zh = zhOf(cur, n);
        if (!zh) { if (rec) i18nMaps.text.delete(n); return; }
        i18nMaps.text.set(n, { en: cur, zh, gen: I18N_GEN });
        n.nodeValue = zh;
        i18nCount++;
    }

    function i18nElAttrs(el) {
        let rec = i18nMaps.attr.get(el);
        for (const a of I18N_ATTRS) {
            const cur = el.getAttribute(a);
            if (cur === null || (rec && rec[a] && rec[a].zh === cur)) continue;
            const zh = zhOf(cur);
            if (!zh) continue;
            rec = rec || {};
            rec[a] = { en: cur, zh };
            i18nMaps.attr.set(el, rec);
            el.setAttribute(a, zh);
            i18nCount++;
        }
    }

    function i18nWalk(root) {
        if (!root) return;
        if (root.nodeType === 3) {
            i18nTextNode(root, false);
            const blk = blockOf(root);
            if (blk && i18nMaps.text.has(root) && !blk.closest(I18N_SKIP)) i18nTidy(textNodesIn(blk));
            return;
        }
        if (root.nodeType !== 1) return;
        const parent = root.parentElement;
        if (parent && parent.closest(I18N_SKIP)) return;
        if (root.matches(I18N_SKIP)) {
            // 输入框本身的占位符要翻，里面的内容不碰
            if (root.matches('textarea, input')) i18nElAttrs(root);
            return;
        }
        i18nElAttrs(root);
        const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
                if (n.nodeType === 3) return NodeFilter.FILTER_ACCEPT;
                if (n.matches(I18N_SKIP)) {
                    if (n.matches('textarea, input')) i18nElAttrs(n);
                    return NodeFilter.FILTER_REJECT;
                }
                if (n.hasAttribute('title') || n.hasAttribute('placeholder')) i18nElAttrs(n);
                return NodeFilter.FILTER_SKIP;
            }
        });
        const texts = [];
        for (let n; (n = w.nextNode());) { i18nTextNode(n, true); texts.push(n); }
        i18nTidy(texts);
    }

    function i18nFlush() {
        i18nQueued = false;
        const nodes = [...i18nPending];
        const attrs = [...i18nPendingAttr];
        i18nPending.clear();
        i18nPendingAttr.clear();
        if (!i18nActive) return;
        for (const n of nodes) if (n.isConnected) i18nWalk(n);
        for (const el of attrs) if (el.isConnected && !(el.parentElement && el.parentElement.closest(I18N_SKIP))) i18nElAttrs(el);
    }
    function i18nQueue(set, n) {
        set.add(n);
        if (!i18nQueued) { i18nQueued = true; queueMicrotask(i18nFlush); }
    }

    // MutationObserver 在当前微任务结束时回调，早于下一次绘制，新出现的英文不会闪一下
    function i18nStart() {
        if (window.__agI18nObserver) window.__agI18nObserver.disconnect();
        const ob = new MutationObserver((muts) => {
            for (const m of muts) {
                if (m.type === 'characterData') i18nQueue(i18nPending, m.target);
                else if (m.type === 'attributes') i18nQueue(i18nPendingAttr, m.target);
                else for (const n of m.addedNodes) i18nQueue(i18nPending, n);
            }
        });
        ob.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
        window.__agI18nObserver = ob;
    }

    function i18nRestore() {
        if (window.__agI18nObserver) { window.__agI18nObserver.disconnect(); window.__agI18nObserver = null; }
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n; (n = w.nextNode());) {
            const rec = i18nMaps.text.get(n);
            if (!rec) continue;
            if (n.nodeValue === rec.zh) n.nodeValue = rec.en;
            i18nMaps.text.delete(n);
        }
        document.querySelectorAll('[title], [placeholder]').forEach((el) => {
            const rec = i18nMaps.attr.get(el);
            if (!rec) return;
            for (const a of I18N_ATTRS) if (rec[a] && el.getAttribute(a) === rec[a].zh) el.setAttribute(a, rec[a].en);
            i18nMaps.attr.delete(el);
        });
        i18nCount = 0;
    }

    function i18nSync() {
        const on = prefs.lang === 'zh';
        if (on && !i18nActive) {
            i18nActive = true;
            i18nStart();
            if (document.body) i18nWalk(document.body);
        } else if (!on && (i18nActive || window.__agI18nObserver)) {
            i18nActive = false;
            i18nRestore();
        }
    }

    window.__agI18n = {
        get lang() { return prefs.lang; },
        get active() { return i18nActive; },
        get count() { return i18nCount; }
    };
    // ===================== 界面汉化 end =====================
