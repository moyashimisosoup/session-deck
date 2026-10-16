/* Session Deck motion layer, optional and local. No network access. */
(() => {
  'use strict';
  const main = document.getElementById('mainContent');
  if (!main) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cause = 'initial';
  let scheduled = 0;
  const active = new Set();
  const hash = value => {
    let n = 2166136261;
    for (const ch of String(value || '')) n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
    return n >>> 0;
  };
  const cancelAll = () => { for (const a of active) a.cancel(); active.clear(); };
  const animate = (el, frames, options) => {
    if (!el || typeof el.animate !== 'function' || reduced.matches) return;
    const a = el.animate(frames, options);
    active.add(a);
    a.addEventListener('finish', () => active.delete(a), { once: true });
    a.addEventListener('cancel', () => active.delete(a), { once: true });
  };
  const enter = () => {
    if (reduced.matches) return;
    const cards = [...main.querySelectorAll('.work-card, .session-card')].filter(el => el.getClientRects().length).slice(0, 12);
    if (cards.length) {
      const lefts = [...new Set(cards.map(el => Math.round(el.getBoundingClientRect().left)))].sort((a,b)=>b-a);
      const single = lefts.length === 1;
      cards.forEach((el,i) => {
        const col = lefts.indexOf(Math.round(el.getBoundingClientRect().left));
        const delay = single ? Math.min(145, i * 27) : Math.min(180, col * 65 + hash(el.dataset.id || i) % 46);
        animate(el,
          [{transform:single?'translateY(8px)':'translateX(18px)',opacity:0},{transform:'translate(0,0)',opacity:1}],
          {duration:240,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
      });
      return;
    }
    const rows = [...main.querySelectorAll('.work-row, .metric')].filter(el => el.getClientRects().length).slice(0,8);
    rows.forEach((el,i) => animate(el,[{transform:'translateY(7px)',opacity:0},{transform:'translateY(0)',opacity:1}],
      {duration:180,delay:i*27,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
  };
  const onRender = new MutationObserver(mutations => {
    if (!mutations.some(m=>m.type==='childList')) return;
    const shouldEnter = cause === 'initial' || cause === 'navigation';
    cause='update';
    if (!shouldEnter || reduced.matches) return;
    cancelAll();
    if (scheduled) cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(() => { scheduled=0; enter(); });
  });
  onRender.observe(main,{childList:true});
  document.addEventListener('click', event => {
    const target = event.target.closest?.('[data-view],[data-project],[data-action]');
    cause = target?.matches('[data-view],[data-project]') ? 'navigation' : 'update';
  },true);
  document.addEventListener('input', event => {
    if (event.target.id === 'searchInput') { cause='typing'; cancelAll(); }
  },true);
  document.addEventListener('change', () => { cause='filter'; },true);
  reduced.addEventListener?.('change', () => {if (reduced.matches) {if(scheduled) cancelAnimationFrame(scheduled); cancelAll();}});
  // Surface entry is independent of innerHTML rebuilds. Existing app owns visibility and focus.
  for (const id of ['detailDrawer','formModal','toast']) {
    const el=document.getElementById(id);
    if (!el) continue;
    new MutationObserver(() => {
      if (el.hidden || reduced.matches) return;
      const isDrawer=id==='detailDrawer', isToast=id==='toast';
      const start=isDrawer?'translateX(24px)':isToast?'translate(-50%, 6px)':'translate(-50%, calc(-50% + 10px)) scale(.985)';
      const end=isDrawer?'translateX(0)':isToast?'translate(-50%, 0)':'translate(-50%, -50%) scale(1)';
      animate(el,[{transform:start,opacity:0.4},{transform:end,opacity:1}],
        {duration:isDrawer?260:isToast?150:200,easing:'cubic-bezier(.22,1,.36,1)'});
    }).observe(el,{attributes:true,attributeFilter:['hidden']});
  }
  requestAnimationFrame(enter);
})();
