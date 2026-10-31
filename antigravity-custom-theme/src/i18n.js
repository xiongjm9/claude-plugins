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

    function zhOf(raw) {
        if (!raw || raw.length > 160) return null;
        const t = raw.trim();
        if (!t || !/[A-Za-z]/.test(t)) return null;
        let zh = I18N_EXACT.get(t);
        if (zh === undefined) zh = I18N_LOWER.get(t.toLowerCase());
        if (zh === undefined) {
            for (const [re, to] of I18N_PATTERNS) if (re.test(t)) { zh = t.replace(re, to); break; }
        }
        if (zh === undefined || zh === t) return null;
        return raw.replace(t, () => zh);
    }

    function i18nTextNode(n, checked) {
        const cur = n.nodeValue;
        const rec = i18nMaps.text.get(n);
        if (rec && cur === rec.zh) { if (rec.gen !== I18N_GEN) { rec.gen = I18N_GEN; i18nCount++; } return; }
        if (!checked && (!n.parentElement || n.parentElement.closest(I18N_SKIP))) return;
        const zh = zhOf(cur);
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
        if (root.nodeType === 3) { i18nTextNode(root, false); return; }
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
        for (let n; (n = w.nextNode());) i18nTextNode(n, true);
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
