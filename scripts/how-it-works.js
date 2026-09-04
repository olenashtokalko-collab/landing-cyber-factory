/* How it works — a scroll-driven run along the timeline.
   The marker travels the rail, the ruler lights behind it, and each card is
   dealt as the marker passes its tick. All of it is expressed as one value,
   --p, so the CSS keeps ownership of the distances.                        */

(() => {
  const section = document.querySelector('.hiw');
  if (!section) return;

  const rail = section.querySelector('.hiw__rail');
  const steps = [...section.querySelectorAll('.step')];
  const drops = [...section.querySelectorAll('.hiw__drop')];
  if (!rail) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  if (reduced.matches) {
    section.style.setProperty('--p', '1');
    steps.forEach((s) => s.classList.add('is-on'));
    drops.forEach((d) => d.classList.add('is-on'));
    return;
  }

  // Where each step sits along the rail, as a fraction of its length.
  const RAIL_X = 45;
  const RAIL_W = 1350;
  const AT = [288, 720, 1152].map((x) => (x - RAIL_X) / RAIL_W);

  let frame = 0;
  let last = -1;

  const paint = () => {
    frame = 0;

    const vh = window.innerHeight || 1;
    const railTop = rail.getBoundingClientRect().top + window.scrollY;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);

    // The run is expressed in scroll positions rather than in viewport
    // offsets: the rail sits low in a tall section, so on a short page it can
    // never climb high enough to finish. Capping the end at maxScroll
    // guarantees the last card always lands, whatever follows this section.
    const start = railTop - vh * 1.35;
    const end = Math.min(railTop - vh * 0.85, maxScroll);
    const p = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));

    if (p !== last) {
      last = p;
      section.style.setProperty('--p', p.toFixed(4));
      section.classList.toggle('is-running', p > 0.001 && p < 0.999);

      for (let i = 0; i < AT.length; i++) {
        // A card lands a touch before the marker is exactly on its tick, so
        // the two read as one movement.
        const reached = p >= AT[i] - 0.02;
        steps[i] && steps[i].classList.toggle('is-on', reached);
        drops[i] && drops[i].classList.toggle('is-on', reached);
      }
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  paint();
})();
