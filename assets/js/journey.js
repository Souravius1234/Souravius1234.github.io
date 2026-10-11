// Illuminate timeline nodes as the reader progresses through the page.
(() => {
  const track = document.getElementById('journey-track');
  if (!track) return;
  const nodes = [...track.querySelectorAll('[data-timeline-node]')];
  const line = track.querySelector('.journey-spine-progress');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;
  function update() {
    raf = 0;
    if (reduced.matches) {
      nodes.forEach(node => node.classList.add('is-past'));
      line.style.height = '100%';
      return;
    }
    const focusY = innerHeight * 0.58;
    const rect = track.getBoundingClientRect();
    const progressPx = Math.min(rect.height, Math.max(0, focusY - rect.top));
    line.style.height = progressPx + 'px';
    let active = null;
    nodes.forEach(node => {
      const y = node.getBoundingClientRect().top;
      const past = y <= focusY;
      node.classList.toggle('is-past', past);
      node.classList.remove('is-active');
      if (past) active = node;
    });
    if (active) active.classList.add('is-active');
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  reduced.addEventListener?.('change', schedule);
  update();
})();
