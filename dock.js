/* dock.js — phone layout helper. Load AFTER dist/app.js. Moves existing nodes only (ids stay), so app.js keeps working. */
(() => {
  const mq = window.matchMedia('(max-width: 600px)');
  const $ = id => document.getElementById(id);
  const panel = document.querySelector('.panel'), top = document.querySelector('.top');
  const ring = $('gRing'), seqrow = document.querySelector('.seqrow'), bottom = document.querySelector('.bottom');
  const home = { ring: ring.nextElementSibling, seqrow: seqrow.parentNode };

  const tabs = [
    { label: 'Option',    balloon: 'opt' },
    { label: 'Arm',       pop: true },
    { label: 'Challenge', balloon: 'ch' }
  ];
  const bar = document.createElement('div'); bar.className = 'tabbar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'More controls');
  const btns = tabs.map((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t.label; b.setAttribute('aria-pressed', 'false'); b.onclick = () => open(open.cur === i ? -1 : i); bar.appendChild(b); return b; });
  panel.appendChild(bar);

  function open(i) {
    open.cur = i; hidePop(); hideBal();
    if (i >= 0) { const t = tabs[i]; if (t.pop) showPop(); else showBal(t.balloon, i); }
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  }
  open.cur = -1;

  // ---- Floating "Model" popover: swipe across graduated bead circles to pick a size ----
  const pop = document.createElement('div'); pop.className = 'wheelpop'; pop.hidden = true;
  pop.style.cssText = 'position:fixed;width:304px;max-width:calc(100vw - 16px);z-index:50;display:none;background:var(--surface);color:var(--fg);border:1px solid var(--line);border-radius:14px;padding:10px 12px 12px;box-shadow:0 8px 28px rgba(0,0,0,.35)';
  pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Model settings');
  const sel = $('style'), opts = [...sel.options];
  const parse = t => { const m = /^(.*?)\s*\((.*)\)$/.exec(t.trim()); return m ? [m[1], m[2]] : [t, '']; };
  pop.innerHTML = '<div class="wp-h"><label class="wp-switch"><input type="checkbox" class="wp-hide"><span>Hide arm</span></label><button type="button" class="wp-done">Done</button></div><div class="wp-sub">Bead size \u00B7 swipe or tap</div>' +
    '<div class="beadrow" role="radiogroup" aria-label="Bead size">' + opts.map(o => { const [a] = parse(o.textContent), mm = parseFloat(a) || 13;
      return '<button type="button" class="bead" role="radio" data-v="' + o.value + '"><span class="orb"><i style="width:' + Math.round(mm * 1.7) + 'px;height:' + Math.round(mm * 1.7) + 'px;--bc:' + ({13:'#9acbe4',16:'#f1b5c1',19:'#f29d29',27:'#f1ca14'}[mm] || '#9acbe4') + '"></i></span><b>' + mm + '</b></button>'; }).join('') + '</div>' +
    '<div class="beadname" id="wpName"></div>' +
    '<div class="wp-caret"></div>';
  document.body.appendChild(pop);
  const row2 = pop.querySelector('.beadrow'), beads = [...row2.children];
  const pick = k => { k = Math.max(0, Math.min(beads.length - 1, k)); beads.forEach((b, n) => { b.setAttribute('aria-checked', String(n === k)); b.dataset.on = String(n === k); b.dataset.pass = String(n < k); });
    const [a, b2] = parse(opts[k].textContent); $('wpName').textContent = a + (b2 ? ' \u00B7 ' + b2 : '');
    if (sel.selectedIndex !== k) { sel.selectedIndex = k; sel.dispatchEvent(new Event('change', { bubbles: true })); } };
  const at = x => { let best = 0, d = 1e9; beads.forEach((b, n) => { const r = b.getBoundingClientRect(), dd = Math.abs(x - (r.left + r.width / 2)); if (dd < d) { d = dd; best = n; } }); return best; };
  let drag = false;
  row2.addEventListener('pointerdown', ev => { drag = true; row2.setPointerCapture(ev.pointerId); pick(at(ev.clientX)); });
  row2.addEventListener('pointermove', ev => { if (drag) pick(at(ev.clientX)); });
  const end = () => { drag = false; }; row2.addEventListener('pointerup', end); row2.addEventListener('pointercancel', end);
  row2.addEventListener('keydown', ev => { const d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (d) { ev.preventDefault(); pick(sel.selectedIndex + d); } });
  pop.querySelector('.wp-done').onclick = () => open(-1);
  const syncPop = () => {
    pop.querySelector('.wp-hide').checked = !$('arms').checked;
  };
  pop.querySelector('.wp-hide').onchange = ev => { const c = $('arms'); c.checked = !ev.target.checked; c.dispatchEvent(new Event('change', { bubbles: true })); syncPop(); };
  new MutationObserver(syncPop).observe($('mech'), { childList: true, characterData: true, subtree: true });
  function showPop() {
    const r = btns[tabs.findIndex(t => t.pop)].getBoundingClientRect(), vw = document.documentElement.clientWidth, pw = Math.min(304, vw - 16);
    const cx = r.left + r.width / 2, left = Math.max(8, Math.min(vw - pw - 8, cx - pw / 2));
    pop.style.left = left + 'px'; pop.style.bottom = (innerHeight - r.top + 10) + 'px';
    pop.querySelector('.wp-caret').style.left = (cx - left - 8) + 'px';
    pop.hidden = false; pop.style.display = 'block'; syncPop();
    const k = sel.selectedIndex; beads.forEach((b, n) => { b.setAttribute('aria-checked', String(n === k)); b.dataset.on = String(n === k); b.dataset.pass = String(n < k); });
    const [a, b2] = parse(opts[k].textContent); $('wpName').textContent = a + (b2 ? ' \u00B7 ' + b2 : '');
  }
  function hidePop() { pop.hidden = true; pop.style.display = 'none'; }
  document.addEventListener('pointerdown', ev => { if (!pop.hidden && !pop.contains(ev.target) && !bar.contains(ev.target)) open(-1); });

  function layout() {
    if (mq.matches) {
      top.appendChild(ring);                        // P[5]/P[6] into the header
      const wrap = document.createElement('div'); wrap.className = 'seqwrap';
      panel.insertBefore(wrap, panel.firstChild); wrap.appendChild(seqrow);   // chips on top of the dock
    } else {
      const w = seqrow.parentNode; if (w && w.className === 'seqwrap') w.remove();
      panel.insertBefore(ring, panel.firstChild); bottom.insertBefore(seqrow, bottom.firstChild);
      open(-1);
    }
  }
  // Overlay quick toggles (phone): ①②③ markers + four-point dihedral, on by default
  const row = document.createElement('div'); row.className = 'ovrow';
  const mk = (label, cbId) => { const cb = $(cbId), b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    const sync = () => b.setAttribute('aria-pressed', String(cb.checked));
    b.onclick = () => { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change', { bubbles: true })); sync(); };
    cb.addEventListener('change', sync); sync(); row.appendChild(b); return sync; };
  const seg = document.createElement('div'); seg.className = 'ovseg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Overlay');
  const bM = document.createElement('button'), bD = document.createElement('button'); bM.type = bD.type = 'button'; bM.textContent = 'Markers'; bD.textContent = 'Dihedral'; seg.append(bM, bD); row.appendChild(seg);
  const syncSeg = () => { bM.setAttribute('aria-pressed', String($('m_chir').checked)); bD.setAttribute('aria-pressed', String($('m_dih').checked)); };
  const setOv = dih => { [['m_chir', !dih], ['m_dih', dih], ['m_dlabels', true]].forEach(([id, v]) => { const c = $(id); if (c.checked !== v) { c.checked = v; c.dispatchEvent(new Event('change', { bubbles: true })); } }); syncSeg(); };
  bM.onclick = () => setOv(false); bD.onclick = () => setOv(true);
  ['m_chir', 'm_dih'].forEach(id => $(id).addEventListener('change', syncSeg));
  const syncs = [syncSeg];
  const fold = document.createElement('button'); fold.type = 'button'; fold.className = 'fold'; fold.setAttribute('aria-label', 'Collapse controls'); fold.setAttribute('aria-expanded', 'true'); fold.textContent = '\u25BE';
  fold.onclick = () => { open(-1); const c = panel.classList.toggle('collapsed'); fold.setAttribute('aria-expanded', String(!c)); fold.textContent = c ? '\u25B4' : '\u25BE'; };
  $('hideAll').addEventListener('click', () => setTimeout(() => syncs.forEach(s => s()), 0));

  const os = document.createElement('div'); os.className = 'optsheet';
  // ---- Option / Challenge balloons (phone) ----
  const mkBal = (cls, title) => { const d = document.createElement('div'); d.className = 'balloon ' + cls; d.hidden = true;
    d.style.cssText = 'position:fixed;z-index:50;display:none;flex-direction:column;background:var(--surface);color:var(--fg);border:1px solid var(--line);border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.35)';
    d.innerHTML = '<div class="wp-h bal-h"><b>' + title + '</b><button type="button" class="wp-done">Done</button></div><div class="bal-body"></div><div class="wp-caret"></div>';
    d.querySelector('.wp-done').onclick = () => open(-1); panel.appendChild(d); return d; };
  const bals = { opt: mkBal('bal-opt', 'Option'), ch: mkBal('bal-ch', 'Challenge') };
  function showBal(key, i) {
    const d = bals[key], r = btns[i].getBoundingClientRect(), vw = document.documentElement.clientWidth, cx = r.left + r.width / 2; let left, w;
    d.hidden = false; d.style.display = 'flex';
    if (key === 'opt') { left = 8; w = vw - 16; d.style.top = (top.getBoundingClientRect().bottom + 8) + 'px'; }
    else { w = Math.min(304, vw - 16); left = Math.max(8, Math.min(vw - w - 8, cx - w / 2)); d.style.top = 'auto'; }
    d.style.left = left + 'px'; d.style.width = w + 'px'; d.style.bottom = (innerHeight - r.top + 10) + 'px';
    d.querySelector('.wp-caret').style.left = (cx - left - 8) + 'px';
  }
  function hideBal() { Object.values(bals).forEach(d => { d.hidden = true; d.style.display = 'none'; }); }
  document.addEventListener('pointerdown', ev => { if (Object.values(bals).some(d => !d.hidden && !d.contains(ev.target)) && !bar.contains(ev.target)) open(-1); });

  const orig = layout;
  function layout2() {
    orig();
    const g2 = document.querySelector('#gFlip .grid2'), acts = ['reset', 'undo', 'redo'].map($);
    const OG = ['gContact', 'gMeas', 'gLabels', 'gChal'].map($);
    if (mq.matches) {
      ['gContact', 'gMeas', 'gLabels'].forEach(id => { $(id).setAttribute('data-sheet-active', ''); bals.opt.querySelector('.bal-body').appendChild($(id)); });
      $('gChal').setAttribute('data-sheet-active', ''); bals.ch.querySelector('.bal-body').appendChild($('gChal'));
      panel.insertBefore(row, $('gRot')); acts.forEach(b => row.appendChild(b)); row.appendChild(fold);
    } else {
      hideBal(); OG.forEach(g => { g.removeAttribute('data-sheet-active'); panel.insertBefore(g, bar); });
      row.remove(); acts.forEach(b => g2.appendChild(b)); fold.remove();
    }
  }
  mq.addEventListener('change', layout2); layout2();
  if (mq.matches) setOv(true);
})();

/* Light / dark toggle — follows the OS until the user taps it, then remembers the choice */
(() => {
  const root = document.documentElement, KEY = 'flip-theme', mq = matchMedia('(prefers-color-scheme: dark)');
  try { const s = localStorage.getItem(KEY); if (s === 'light' || s === 'dark') root.dataset.theme = s; } catch (e) {}
  const cur = () => root.dataset.theme || (mq.matches ? 'dark' : 'light');
  const SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  const b = document.createElement('button'); b.type = 'button'; b.className = 'theme-btn';
  const paint = () => { const d = cur() === 'dark'; b.innerHTML = d ? SUN : MOON; b.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode'); b.title = b.getAttribute('aria-label'); };
  b.onclick = () => { const n = cur() === 'dark' ? 'light' : 'dark'; root.dataset.theme = n; try { localStorage.setItem(KEY, n); } catch (e) {} paint(); };
  mq.addEventListener('change', paint);
  document.querySelector('.top').appendChild(b); paint();
})();

/* Readout box + auto-centre on the selected unit */
(() => {
  const $ = id => document.getElementById(id), wrap = document.querySelector('.viewer-wrap');
  const box = document.createElement('div'); box.className = 'readout'; box.setAttribute('aria-live', 'polite');
  box.innerHTML = '<div class="rh"><span id="roUnit">Unit \u2014</span><button type="button" id="roCenter" aria-pressed="true" title="Keep the selected unit centred">\u2316 centre</button></div>' +
    '<div class="rr rot"><span>Rotation</span><b id="roRot">\u2014</b></div>' +
    '<div class="rr dih" id="roDihRow"><span>Dihedral</span><b id="roDih">\u2014</b></div>';
  wrap.appendChild(box);
  const dihCb = $('m_dih');
  const val = el => (el && el.textContent.trim()) || '\u2014';
  function update() {
    const m = /U\d+/.exec(val($('selUnit')));
    $('roUnit').textContent = m ? m[0] : 'Unit \u2014';
    $('roRot').textContent = val($('angleOut'));
    $('roDihRow').hidden = !dihCb.checked;
    $('roDih').textContent = val($('dihVal'));
  }
  const mo = new MutationObserver(update);
  ['selUnit', 'angleOut', 'dihVal'].forEach(id => mo.observe($(id), { childList: true, characterData: true, subtree: true }));
  dihCb.addEventListener('change', update); $('hideAll').addEventListener('click', () => setTimeout(update, 0));
  update();

  let center = true, lastUnit = null;
  $('roCenter').onclick = e => { center = !center; e.currentTarget.setAttribute('aria-pressed', String(center)); if (center) recentre(true); };
  function recentre(force) {
    const m = /U(\d+)/.exec(val($('selUnit'))); if (!m) { lastUnit = null; return; }
    if (!force && lastUnit === null) { lastUnit = m[1]; return; }   // first selection after load: keep the default full-ring view
    if (!force && m[1] === lastUnit) return;
    lastUnit = m[1]; if (center) setTimeout(() => $('focusSel').click(), 60);
  }
  new MutationObserver(() => recentre(false)).observe($('selUnit'), { childList: true, characterData: true, subtree: true });
})();

/* Chirality markers and four-point dihedral are mutually exclusive; the dihedral always shows its A–D labels */
(() => {
  const $ = id => document.getElementById(id), c = $('m_chir'), d = $('m_dih'), l = $('m_dlabels');
  const set = (el, v) => { if (el.checked !== v) { el.checked = v; el.dispatchEvent(new Event('change', { bubbles: true })); } };
  c.addEventListener('change', () => { if (c.checked) set(d, false); });
  d.addEventListener('change', () => { if (d.checked) { set(c, false); set(l, true); } });
  set(l, true);
})();

/* Desktop: On | Off buttons for chirality markers and four-point dihedral */
(() => {
  ['m_chir', 'm_dih'].forEach(id => {
    const cb = document.getElementById(id), row = cb.closest('.row'); if (!row) return;
    const seg = document.createElement('div'); seg.className = 'onoff'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', row.textContent.trim());
    const on = document.createElement('button'), off = document.createElement('button'); on.type = off.type = 'button'; on.textContent = 'On'; off.textContent = 'Off';
    const sync = () => { on.setAttribute('aria-pressed', String(cb.checked)); off.setAttribute('aria-pressed', String(!cb.checked)); };
    const set = v => { if (cb.checked !== v) { cb.checked = v; cb.dispatchEvent(new Event('change', { bubbles: true })); } sync(); };
    on.onclick = e => { e.preventDefault(); set(true); }; off.onclick = e => { e.preventDefault(); set(false); };
    cb.addEventListener('change', sync); document.getElementById('hideAll').addEventListener('click', () => setTimeout(sync, 0));
    ['m_chir', 'm_dih'].forEach(o => document.getElementById(o).addEventListener('change', sync));
    seg.append(on, off); row.appendChild(seg); sync();
  });
})();

/* Camera toolbar: unit | view | centre (toggle) | capture */
(() => {
  const $ = id => document.getElementById(id), cam = document.querySelector('.cam'), viewer = $('viewer');
  const svg = p => '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const ctr = $('roCenter');
  ctr.innerHTML = svg('<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>');
  ctr.className = 'camicon'; ctr.setAttribute('aria-label', 'Keep the selected unit centred'); ctr.title = 'Auto-centre the selected unit'; cam.appendChild(ctr);
  const shot = document.createElement('button'); shot.type = 'button'; shot.className = 'camicon'; shot.setAttribute('aria-label', 'Save a picture of the view'); shot.title = 'Save picture';
  shot.innerHTML = svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'); cam.appendChild(shot);
  shot.onclick = () => requestAnimationFrame(() => {
    const cv = viewer.querySelector('canvas'); if (!cv) return;
    const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height; const g = out.getContext('2d');
    try { g.drawImage(cv, 0, 0); } catch (e) { return; }
    const vr = viewer.getBoundingClientRect(), k = cv.width / vr.width;
    document.querySelectorAll('#labels > span').forEach(el => { if (el.hidden || el.dataset.off === '1') return;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el), x = (r.left - vr.left) * k, y = (r.top - vr.top) * k, w = r.width * k, h = r.height * k;
      if (r.width === 0 || x + w < 0 || y + h < 0 || x > out.width || y > out.height) return;
      const bg = cs.backgroundColor; if (bg && bg !== 'rgba(0, 0, 0, 0)') { g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, Math.min(h / 2, 10 * k)) : g.rect(x, y, w, h); g.fill(); }
      g.fillStyle = cs.color; g.font = cs.fontWeight + ' ' + (parseFloat(cs.fontSize) * k) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(el.textContent, x + w / 2, y + h / 2 + k); });
    const unit = (($('selUnit') || {}).textContent || '').match(/U\d+/), name = 'chirality-' + (unit ? unit[0] : 'view') + '.png';
    out.toBlob(async b => { if (!b) return; const f = new File([b], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
  });
})();

/* Play / Pause: make Pause react on press (the button is re-rendered every frame while playing) */
(() => {
  const p = document.getElementById('play'); let t = 0;
  p.addEventListener('pointerdown', () => { if (p.getAttribute('aria-pressed') === 'true') { t = Date.now(); p.click(); } }, true);
  p.addEventListener('click', e => { if (e.isTrusted && Date.now() - t < 800) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
})();

/* Desktop ≥1100px: two vertical control columns (viewer : column : column = 3 : 1 : 1) */
(() => {
  const mq = window.matchMedia('(min-width: 1100px)'), $ = id => document.getElementById(id), panel = document.querySelector('.panel');
  const A = ['gRing', 'gArms', 'gFlip', 'gRot'], B = ['gContact', 'gMeas', 'gLabels', 'gChal'];
  const ca = document.createElement('div'), cb = document.createElement('div'); ca.className = 'ctlcol colA'; cb.className = 'ctlcol colB';
  function lay() {
    if (mq.matches) { panel.append(ca, cb); A.forEach(id => ca.appendChild($(id))); B.forEach(id => cb.appendChild($(id))); }
    else if (ca.parentNode) { [...A, ...B].forEach(id => { const g = $(id); if (g.parentNode === ca || g.parentNode === cb) panel.insertBefore(g, ca); }); ca.remove(); cb.remove(); }
  }
  mq.addEventListener('change', lay); lay();
})();
