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
  const syncs = [mk('\u2460\u2461\u2462 markers', 'm_chir'), mk('Dihedral', 'm_dih')];
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
})();
