/* dock.js — phone layout helper. Load AFTER dist/app.js. Moves existing nodes only (ids stay), so app.js keeps working. */
(() => {
  const mq = window.matchMedia('(max-width: 600px)');
  const $ = id => document.getElementById(id);
  const panel = document.querySelector('.panel'), top = document.querySelector('.top');
  const ring = $('gRing'), seqrow = document.querySelector('.seqrow'), bottom = document.querySelector('.bottom');
  const home = { ring: ring.nextElementSibling, seqrow: seqrow.parentNode };

  const tabs = [
    { label: 'Measure',   groups: ['gMeas'] },
    { label: 'Model',     groups: ['gArms', 'gContact', 'gLabels'] },
    { label: 'Challenge', groups: ['gChal'] }
  ];
  const bar = document.createElement('div'); bar.className = 'tabbar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'More controls');
  const btns = tabs.map((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t.label; b.setAttribute('aria-pressed', 'false'); b.onclick = () => open(open.cur === i ? -1 : i); bar.appendChild(b); return b; });
  panel.appendChild(bar);

  function open(i) {
    open.cur = i;
    document.querySelectorAll('[data-sheet-active]').forEach(e => e.removeAttribute('data-sheet-active'));
    if (i >= 0) tabs[i].groups.forEach(id => $(id).setAttribute('data-sheet-active', ''));
    panel.classList.toggle('sheet-open', i >= 0);
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  }
  open.cur = -1;

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
  fold.onclick = () => { const c = panel.classList.toggle('collapsed'); fold.setAttribute('aria-expanded', String(!c)); fold.textContent = c ? '\u25B4' : '\u25BE'; };
  row.appendChild(fold);
  $('hideAll').addEventListener('click', () => setTimeout(() => syncs.forEach(s => s()), 0));

  const orig = layout;
  function layout2() {
    orig();
    if (mq.matches) panel.insertBefore(row, $('gRot'));
    else row.remove();
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
