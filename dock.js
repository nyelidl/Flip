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
  mq.addEventListener('change', layout); layout();
})();
