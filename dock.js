/* dock.js — phone layout helper. Load AFTER dist/app.js. Moves existing nodes only (ids stay), so app.js keeps working. */
(() => {
  const mq = window.matchMedia('(max-width: 600px)');
  const $ = id => document.getElementById(id);
  const panel = document.querySelector('.panel'), top = document.querySelector('.top');
  const ring = $('gRing'), seqrow = document.querySelector('.seqrow'), bottom = document.querySelector('.bottom');
  const home = { ring: ring.nextElementSibling, seqrow: seqrow.parentNode };

  const tabs = [
    { label: 'Arm',       groups: [], pop: true },
    { label: 'Option',    groups: ['gMeas', 'gContact', 'gLabels'] },
    { label: 'Challenge', groups: ['gChal'] }
  ];
  const bar = document.createElement('div'); bar.className = 'tabbar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'More controls');
  const btns = tabs.map((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t.label; b.setAttribute('aria-pressed', 'false'); b.onclick = () => open(open.cur === i ? -1 : i); bar.appendChild(b); return b; });
  panel.appendChild(bar);

  function open(i) {
    open.cur = i;
    document.querySelectorAll('[data-sheet-active]').forEach(e => e.removeAttribute('data-sheet-active'));
    if (i >= 0 && !tabs[i].pop) tabs[i].groups.forEach(id => $(id).setAttribute('data-sheet-active', ''));
    hidePop(); if (i >= 0 && tabs[i].pop) showPop();
    panel.classList.toggle('sheet-open', i >= 0 && !tabs[i].pop);
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
    const r = btns[0].getBoundingClientRect(), vw = document.documentElement.clientWidth, pw = Math.min(304, vw - 16);
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
  const syncs = [mk('\u2460\u2461\u2462', 'm_chir'), mk('Dihedral', 'm_dih'), mk('A\u2013D', 'm_dlabels')];
  const fold = document.createElement('button'); fold.type = 'button'; fold.className = 'fold'; fold.setAttribute('aria-label', 'Collapse controls'); fold.setAttribute('aria-expanded', 'true'); fold.textContent = '\u25BE';
  fold.onclick = () => { open(-1); const c = panel.classList.toggle('collapsed'); fold.setAttribute('aria-expanded', String(!c)); fold.textContent = c ? '\u25B4' : '\u25BE'; };
  $('hideAll').addEventListener('click', () => setTimeout(() => syncs.forEach(s => s()), 0));

  const os = document.createElement('div'); os.className = 'optsheet';
  const orig = layout;
  function layout2() {
    orig();
    const g2 = document.querySelector('#gFlip .grid2'), acts = ['reset', 'undo', 'redo'].map($);
    const OG = ['gContact', 'gMeas', 'gLabels', 'gChal'].map($);
    if (mq.matches) { if (!os.parentNode) panel.insertBefore(os, panel.firstChild); OG.forEach(g => os.appendChild(g)); }
    else { const ch = $('gChal'); OG.forEach(g => { if (g.parentNode === os) panel.appendChild(g); }); os.remove(); }
    if (mq.matches) { panel.insertBefore(row, $('gRot')); acts.forEach(b => row.appendChild(b)); $('gFlip').appendChild(fold); }
    else { row.remove(); acts.forEach(b => g2.appendChild(b)); fold.remove(); }
  }
  mq.addEventListener('change', layout2); layout2();
  if (mq.matches) ['m_chir', 'm_dih'].forEach(id => { const c = $(id); if (!c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } });
  if (mq.matches) { const c = $('m_dlabels'); if (c.checked) { c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); } }
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
