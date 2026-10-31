    // ===================== 外观面板（Studio） =====================
    // 偏好：强调色 / 材质 / 壁纸。和皮肤分开存，换皮肤不丢。
    // 页面 origin 端口每次启动都变，localStorage 不可靠，主存走 nativeStorage（与 THEME_PREF_KEY 同一套）。
    const STUDIO = /*@@STUDIO_META@@*/;
    const PREFS_KEY = 'custom-theme-studio';
    const WALL_IMG_KEY = 'custom-theme-wall-image';
    const STUDIO_CSS = /*@@STUDIO_CSS@@*/;
    const DEFAULT_PREFS = {
        accent: '',          // 空 = 跟随皮肤
        material: 'frosted', // solid | frosted | clear
        blur: 24,            // px
        opacity: 72,         // 玻璃表面不透明度 %
        wall: 'gradient',    // none | gradient | image | url
        gradient: 'auto',    // auto = 跟随皮肤
        url: '',
        strength: 70,        // 壁纸可见度 %
        wallBlur: 0,
        fit: 'cover'         // cover | contain
    };
    const MATERIALS = [
        { id: 'solid', name: '实色' },
        { id: 'frosted', name: '磨砂' },
        { id: 'clear', name: '通透' }
    ];
    const WALLS = [
        { id: 'none', name: '无' },
        { id: 'gradient', name: '渐变' },
        { id: 'image', name: '图片' },
        { id: 'url', name: '链接' }
    ];

    let prefs = Object.assign({}, DEFAULT_PREFS);
    let wallImage = '';
    let nativeTimer = null;

    const clamp = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
    const oneOf = (v, list, d) => (list.some((x) => (x.id || x) === v) ? v : d);
    const safeUrl = (u) => {
        if (typeof u !== 'string') return '';
        u = u.trim();
        if (/^https?:\/\/[^\s"'()\\]+$/i.test(u)) return u;
        if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(u)) return u;
        return '';
    };

    function normalizePrefs(p) {
        p = p && typeof p === 'object' ? p : {};
        return {
            accent: isHex(p.accent) ? p.accent.toUpperCase() : '',
            material: oneOf(p.material, MATERIALS, DEFAULT_PREFS.material),
            blur: clamp(p.blur, 0, 60, DEFAULT_PREFS.blur),
            opacity: clamp(p.opacity, 30, 100, DEFAULT_PREFS.opacity),
            wall: oneOf(p.wall, WALLS, DEFAULT_PREFS.wall),
            gradient: p.gradient === 'auto' || STUDIO.gradients.some((g) => g.id === p.gradient) ? p.gradient : 'auto',
            url: safeUrl(p.url),
            strength: clamp(p.strength, 0, 100, DEFAULT_PREFS.strength),
            wallBlur: clamp(p.wallBlur, 0, 40, DEFAULT_PREFS.wallBlur),
            fit: p.fit === 'contain' ? 'contain' : 'cover'
        };
    }

    function savePrefs(immediate) {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
        clearTimeout(nativeTimer);
        const push = () => {
            try {
                if (window.nativeStorage && typeof window.nativeStorage.updateItems === 'function') {
                    Promise.resolve(window.nativeStorage.updateItems({ [PREFS_KEY]: JSON.stringify(prefs) })).catch(() => {});
                }
            } catch (e) {}
        };
        if (immediate) push(); else nativeTimer = setTimeout(push, 350);
    }

    function loadLocalPrefs() {
        try { prefs = normalizePrefs(JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) { prefs = normalizePrefs({}); }
    }

    function reconcileStudioPrefs() {
        try {
            if (!(window.nativeStorage && typeof window.nativeStorage.getItems === 'function')) return;
            Promise.resolve(window.nativeStorage.getItems()).then((items) => {
                if (!items) return;
                if (items[PREFS_KEY]) {
                    try { prefs = normalizePrefs(JSON.parse(items[PREFS_KEY])); } catch (e) {}
                    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
                }
                wallImage = safeUrl(items[WALL_IMG_KEY] || '');
                studioApply();
                studioRefresh();
            }).catch(() => {});
        } catch (e) {}
    }

    function skinOf(id) { return STUDIO.skins.find((s) => s.id === id) || null; }
    function effectiveAccent() {
        const s = skinOf(activeThemeId());
        return prefs.accent || (s ? s.accent : '#0071E3');
    }

    // WCAG 相对亮度，用于提示自定义强调色上的白字是否够清楚
    function luminance(hex) {
        const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
            .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    const whiteContrast = (hex) => 1.05 / (luminance(hex) + 0.05);

    function ensureStudioStyle() {
        let el = document.getElementById('antigravity-studio-css');
        if (!el) {
            el = document.createElement('style');
            el.id = 'antigravity-studio-css';
            (document.head || document.documentElement).appendChild(el);
        }
        if (el.textContent !== STUDIO_CSS) el.textContent = STUDIO_CSS;
    }

    function ensureWallLayer() {
        let wall = document.getElementById('sk-wall');
        if (!wall) {
            wall = document.createElement('div');
            wall.id = 'sk-wall';
            wall.setAttribute('aria-hidden', 'true');
            wall.innerHTML = '<div class="sk-wall-img"></div><div class="sk-wall-veil"></div>';
            document.body.insertBefore(wall, document.body.firstChild);
        }
        return wall;
    }

    function wallBackground() {
        const s = skinOf(activeThemeId());
        if (prefs.wall === 'gradient') {
            const id = prefs.gradient === 'auto' ? (s && s.wall) : prefs.gradient;
            const g = STUDIO.gradients.find((x) => x.id === id) || STUDIO.gradients[0];
            return g.css;
        }
        const src = prefs.wall === 'image' ? wallImage : prefs.wall === 'url' ? prefs.url : '';
        return src ? `url("${src}") center / ${prefs.fit} no-repeat, var(--sk-base)` : '';
    }

    const STUDIO_VARS = ['--sk-accent', '--sk-fill', '--sk-filter', '--sk-pop'];
    function studioApply() {
        ensureStudioStyle();
        const root = document.documentElement;
        const on = activeThemeId() !== 'stock';
        if (!on) {
            STUDIO_VARS.forEach((v) => root.style.removeProperty(v));
            root.removeAttribute('data-sk-glass');
            root.removeAttribute('data-sk-wall');
            updateSelectorUI(activeThemeId());
            return;
        }
        root.style.setProperty('--sk-accent', effectiveAccent());
        const glass = prefs.material !== 'solid';
        const fill = prefs.material === 'solid' ? 1 : prefs.material === 'clear' ? prefs.opacity / 100 * 0.7 : prefs.opacity / 100;
        root.style.setProperty('--sk-fill', fill.toFixed(3));
        const tone = prefs.material === 'clear' ? 'saturate(1.9) brightness(1.04)' : 'saturate(1.7) brightness(1.06)';
        root.style.setProperty('--sk-filter', glass ? `blur(${prefs.blur}px) ${tone}` : 'blur(20px) saturate(1.8)');
        // 浮层保留 86% 可读性下限，滑杆拉到底也不会读穿
        root.style.setProperty('--sk-pop', glass
            ? `color-mix(in srgb, var(--sk-surface) ${Math.max(86, Math.round(fill * 100 + 20))}%, transparent)`
            : 'var(--sk-surface)');
        root.toggleAttribute('data-sk-glass', glass);

        const bg = prefs.wall === 'none' ? '' : wallBackground();
        root.toggleAttribute('data-sk-wall', !!bg);
        if (bg) {
            const wall = ensureWallLayer();
            const img = wall.firstChild;
            if (img.dataset.bg !== bg) { img.style.background = bg; img.dataset.bg = bg; }
            wall.style.setProperty('--sk-wall-blur', prefs.wallBlur + 'px');
            wall.style.setProperty('--sk-wall-veil', ((100 - prefs.strength) / 100 * 0.85).toFixed(3));
        }
        updateSelectorUI(activeThemeId());
    }

    // 看门狗用：DOM 被整体重建时补回样式与壁纸层
    function studioEnsure() {
        ensureStudioStyle();
        if (document.documentElement.hasAttribute('data-sk-wall') && !document.getElementById('sk-wall')) studioApply();
        if (activeThemeId() !== 'stock' && !document.documentElement.style.getPropertyValue('--sk-accent')) studioApply();
    }

    // 上传图片：缩到 2560px 内转 WebP，控制在约 1.2MB，存进 nativeStorage
    function readWallFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || !/^image\//.test(file.type)) return reject(new Error('请选择图片文件'));
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                let max = 2560, out = '';
                for (let q = 0.86; q >= 0.5; q -= 0.12, max = Math.round(max * 0.8)) {
                    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
                    const c = document.createElement('canvas');
                    c.width = Math.round(img.naturalWidth * k);
                    c.height = Math.round(img.naturalHeight * k);
                    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                    out = c.toDataURL('image/webp', q);
                    if (out.length < 1.6e6) break;
                }
                resolve(out);
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片无法读取')); };
            img.src = url;
        });
    }

    // ---------- 面板 ----------
    function h(tag, attrs, ...kids) {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (v === undefined || v === null || v === false) continue;
            if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
            else if (k === 'style') el.style.cssText = v;
            else el.setAttribute(k, v === true ? '' : v);
        }
        for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
        return el;
    }

    const ui = {};

    function update(patch, opts) {
        Object.assign(prefs, patch);
        prefs = normalizePrefs(prefs);
        savePrefs(opts && opts.immediate);
        studioApply();
        studioRefresh();
    }

    function segmented(key, options, onPick) {
        const thumb = h('span', { class: 'st-seg-thumb' });
        const seg = h('div', { class: 'st-seg', style: `--n:${options.length}` }, thumb,
            options.map((o) => h('button', { type: 'button', 'data-v': o.id, onclick: () => onPick(o.id) }, o.name)));
        seg._sync = (v) => {
            const i = Math.max(0, options.findIndex((o) => o.id === v));
            seg.style.setProperty('--i', i);
            seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
        };
        ui[key] = seg;
        return seg;
    }

    function slider(key, label, min, max, unit) {
        const val = h('em');
        const input = h('input', { type: 'range', min, max, step: 1, 'aria-label': label });
        const paint = () => {
            input.style.setProperty('--p', ((input.value - min) / (max - min) * 100) + '%');
            val.textContent = input.value + unit;
        };
        input.addEventListener('input', () => { paint(); update({ [key]: Number(input.value) }); });
        input.addEventListener('change', () => savePrefs(true));
        const row = h('div', { class: 'st-row' }, h('div', { class: 'st-label' }, label, val), input);
        row._sync = () => { input.value = prefs[key]; paint(); };
        ui['slider-' + key] = row;
        return row;
    }

    function buildPanel() {
        const panel = h('div', { id: 'ag-studio', role: 'region', 'aria-label': '外观' });
        panel.style.webkitAppRegion = 'no-drag';

        // 皮肤
        const skins = h('div', { class: 'st-skins' }, THEMES.map((t) => {
            const s = skinOf(t.id);
            const art = s
                ? h('span', { class: 'st-skin-art', style: `--a-base:${s.base};--a-side:${s.sidebar};--a-line:${s.line};--a-text:${s.text};--a-accent:${s.accent}` }, h('i'), h('i'), h('b'))
                : h('span', { class: 'st-skin-art', style: '--a-base:#F3F3F3;--a-side:#E8E8E8;--a-line:#D4D4D4;--a-text:#333;--a-accent:#007ACC' }, h('i'), h('i'), h('b'));
            return h('button', { type: 'button', class: 'st-skin', 'data-id': t.id, onclick: () => { applyTheme(t.id); studioApply(); studioRefresh(); } },
                art, h('span', { class: 'st-skin-name' }, t.name));
        }));
        ui.skins = skins;

        // 强调色
        const hex = h('input', { class: 'st-input is-mono', maxlength: 7, spellcheck: 'false', 'aria-label': '强调色色值' });
        const commitHex = () => {
            let v = hex.value.trim();
            if (/^[0-9a-fA-F]{6}$/.test(v)) v = '#' + v;
            if (isHex(v)) update({ accent: v }, { immediate: true }); else hex.value = effectiveAccent();
        };
        hex.addEventListener('keydown', (e) => { if (e.key === 'Enter') { commitHex(); hex.blur(); } });
        hex.addEventListener('blur', commitHex);
        const picker = h('input', { type: 'color', 'aria-label': '自定义颜色' });
        picker.addEventListener('input', () => update({ accent: picker.value }));
        picker.addEventListener('change', () => savePrefs(true));
        const autoSw = h('button', { type: 'button', class: 'st-sw is-auto', title: '跟随皮肤', 'data-v': '', onclick: () => update({ accent: '' }, { immediate: true }) });
        const swatches = h('div', { class: 'st-swatches' }, autoSw,
            STUDIO.accents.map((a) => h('button', { type: 'button', class: 'st-sw', title: a.name, 'data-v': a.hex, style: `--c:${a.hex}`, onclick: () => update({ accent: a.hex }, { immediate: true }) })),
            h('label', { class: 'st-sw is-custom', title: '自定义' }, picker));
        const accentNote = h('div', { class: 'st-note' });
        ui.accent = { swatches, autoSw, hex, picker, note: accentNote };

        // 材质
        const material = segmented('material', MATERIALS, (v) => update({ material: v }, { immediate: true }));
        const blurRow = slider('blur', '模糊', 0, 60, 'px');
        const opRow = slider('opacity', '表面不透明度', 30, 100, '%');

        // 壁纸
        const wall = segmented('wall', WALLS, (v) => update({ wall: v }, { immediate: true }));
        const grads = h('div', { class: 'st-grads', style: 'margin-top:10px' },
            h('button', { type: 'button', class: 'st-grad', 'data-v': 'auto', title: '跟随皮肤', style: '--g:var(--sk-base)', onclick: () => update({ gradient: 'auto' }, { immediate: true }) }, '自动'),
            STUDIO.gradients.map((g) => h('button', { type: 'button', class: 'st-grad', 'data-v': g.id, title: g.name, style: `--g:${g.css}`, onclick: () => update({ gradient: g.id }, { immediate: true }) })));
        const fileInput = h('input', { type: 'file', accept: 'image/*', hidden: true });
        const fileName = h('span');
        fileInput.addEventListener('change', () => {
            const f = fileInput.files && fileInput.files[0];
            if (!f) return;
            fileName.textContent = '处理中…';
            readWallFile(f).then((data) => {
                wallImage = data;
                try {
                    if (window.nativeStorage && typeof window.nativeStorage.updateItems === 'function') {
                        Promise.resolve(window.nativeStorage.updateItems({ [WALL_IMG_KEY]: data })).catch(() => {});
                    }
                } catch (e) {}
                fileName.textContent = f.name;
                update({ wall: 'image' }, { immediate: true });
            }).catch((e) => { fileName.textContent = e.message; });
            fileInput.value = '';
        });
        const fileRow = h('div', { class: 'st-file' }, h('button', { type: 'button', class: 'st-btn', onclick: () => fileInput.click() }, '选择图片…'), fileName, fileInput);
        const urlInput = h('input', { class: 'st-input', placeholder: 'https://…', spellcheck: 'false', 'aria-label': '图片链接' });
        const urlNote = h('div', { class: 'st-note' });
        const commitUrl = () => {
            const u = safeUrl(urlInput.value);
            urlNote.textContent = u || !urlInput.value.trim() ? '' : '只支持 http(s) 图片链接';
            urlNote.classList.toggle('is-warn', !u && !!urlInput.value.trim());
            if (u) update({ url: u }, { immediate: true });
        };
        urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') commitUrl(); });
        const urlRow = h('div', null, h('div', { class: 'st-field' }, urlInput, h('button', { type: 'button', class: 'st-btn is-primary', onclick: commitUrl }, '应用')), urlNote);
        const fitSeg = segmented('fit', [{ id: 'cover', name: '填满' }, { id: 'contain', name: '完整' }], (v) => update({ fit: v }, { immediate: true }));
        const fitRow = h('div', { class: 'st-row' }, fitSeg);
        const strengthRow = slider('strength', '壁纸强度', 0, 100, '%');
        const wallBlurRow = slider('wallBlur', '壁纸模糊', 0, 40, 'px');
        ui.wallParts = { grads, fileRow, fileName, urlRow, urlInput, fitRow, strengthRow, wallBlurRow };

        const stockNote = h('div', { class: 'st-note', style: 'padding-top:10px' }, '官方原版不支持强调色、材质和壁纸。');
        ui.stockNote = stockNote;
        const custom = h('div', null,
            h('div', { class: 'st-sec' }, h('div', { class: 'st-label' }, '强调色'), swatches, h('div', { class: 'st-field' }, hex), accentNote),
            h('div', { class: 'st-sec' }, h('div', { class: 'st-label' }, '材质'), material, blurRow, opRow),
            h('div', { class: 'st-sec' }, h('div', { class: 'st-label' }, '壁纸'), wall, grads, fileRow, urlRow, fitRow, strengthRow, wallBlurRow));
        ui.custom = custom;

        panel.append(
            h('div', { class: 'st-head' },
                h('span', { class: 'st-title' }, '外观'),
                h('button', { type: 'button', class: 'st-link', onclick: () => { prefs = normalizePrefs({}); savePrefs(true); studioApply(); studioRefresh(); } }, '恢复默认')),
            h('div', { class: 'st-sec', style: 'padding-top:4px' }, skins),
            stockNote,
            custom);
        return panel;
    }

    function studioRefresh() {
        const panel = document.getElementById('ag-studio');
        if (!panel || !ui.skins) return;
        const id = activeThemeId();
        ui.skins.querySelectorAll('.st-skin').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
        const stock = id === 'stock';
        ui.stockNote.hidden = !stock;
        ui.custom.classList.toggle('st-off', stock);

        const acc = effectiveAccent();
        const s = skinOf(id);
        ui.accent.autoSw.style.setProperty('--c', s ? s.accent : acc);
        ui.accent.swatches.querySelectorAll('.st-sw[data-v]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.accent)));
        const custom = !!prefs.accent && !STUDIO.accents.some((a) => a.hex === prefs.accent);
        ui.accent.swatches.querySelector('.is-custom').setAttribute('aria-pressed', String(custom));
        if (document.activeElement !== ui.accent.hex) ui.accent.hex.value = acc;
        ui.accent.picker.value = acc.toLowerCase();
        const cr = whiteContrast(acc);
        ui.accent.note.textContent = cr < 4.5 ? `这个颜色上的白字对比度只有 ${cr.toFixed(1)}:1，主按钮文字可能看不清` : '';
        ui.accent.note.classList.toggle('is-warn', cr < 4.5);

        ui.material._sync(prefs.material);
        ui['slider-blur']._sync();
        ui['slider-opacity']._sync();
        ui['slider-blur'].hidden = prefs.material === 'solid';
        ui['slider-opacity'].hidden = prefs.material === 'solid';

        const w = ui.wallParts;
        ui.wall._sync(prefs.wall);
        w.grads.hidden = prefs.wall !== 'gradient';
        w.grads.querySelectorAll('.st-grad').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.gradient)));
        w.fileRow.hidden = prefs.wall !== 'image';
        if (prefs.wall === 'image' && !wallImage && !w.fileName.textContent) w.fileName.textContent = '还没有选择图片';
        if (wallImage && w.fileName.textContent === '还没有选择图片') w.fileName.textContent = '已保存的图片';
        w.urlRow.hidden = prefs.wall !== 'url';
        if (document.activeElement !== w.urlInput) w.urlInput.value = prefs.url;
        ui.fit._sync(prefs.fit);
        w.fitRow.hidden = prefs.wall !== 'image' && prefs.wall !== 'url';
        w.strengthRow.hidden = prefs.wall === 'none';
        w.wallBlurRow.hidden = prefs.wall === 'none';
        ui['slider-strength']._sync();
        ui['slider-wallBlur']._sync();
    }

    function positionStudio(panel, btn) {
        const r = btn.getBoundingClientRect();
        const w = panel.offsetWidth || 340;
        const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w));
        panel.style.top = Math.round(r.bottom + 8) + 'px';
        panel.style.left = Math.round(left) + 'px';
        panel.style.setProperty('--st-origin', `${Math.round(r.left + r.width / 2 - left)}px 0`);
    }

    function studioToggle(force) {
        const btn = document.getElementById('antigravity-theme-btn');
        let panel = document.getElementById('ag-studio');
        if (!panel) { panel = buildPanel(); document.body.appendChild(panel); }
        const open = force === undefined ? !panel.classList.contains('is-open') : force;
        if (open && btn) {
            studioRefresh();
            positionStudio(panel, btn);
            void panel.offsetWidth; // 先落定初始帧，过渡才会播放
            panel.classList.add('is-open');
        } else {
            panel.classList.remove('is-open');
        }
        if (btn) btn.setAttribute('aria-expanded', String(open));
    }

    if (!window.__antigravityStudioListeners) {
        window.__antigravityStudioListeners = true;
        document.addEventListener('pointerdown', (e) => {
            const p = document.getElementById('ag-studio');
            const b = document.getElementById('antigravity-theme-btn');
            if (p && p.classList.contains('is-open') && !p.contains(e.target) && !(b && b.contains(e.target))) studioToggle(false);
        }, true);
        document.addEventListener('keydown', (e) => {
            const p = document.getElementById('ag-studio');
            if (e.key === 'Escape' && p && p.classList.contains('is-open')) { studioToggle(false); const b = document.getElementById('antigravity-theme-btn'); if (b) b.focus(); }
        });
        window.addEventListener('resize', () => studioToggle(false));
    }
    // ===================== 外观面板 end =====================
