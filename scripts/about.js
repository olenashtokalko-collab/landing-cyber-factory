/* About us motion — the figures.
   The statement's character reveal lives in scripts/letter-reveal.js, shared
   with the other sections.                                                   */

(() => {
  const section = document.querySelector('.about');
  if (!section) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* --------------------------------------------------------------- figures */

  const figures = [...section.querySelectorAll('.about__figure')];

  if (reduced.matches || !('IntersectionObserver' in window)) {
    figures.forEach((f) => f.classList.add('is-in'));
    return;
  }

  // Both classes are one-way: the dot grid fades up once and the icon plays
  // its scatter/reassemble once, the first time the figure comes into view.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in', 'is-live');
        io.unobserve(entry.target);
      }
    },
    // Fires once the figure is properly inside the viewport, not as its very
    // first pixel crosses the edge.
    { threshold: 0, rootMargin: '0px 0px -12% 0px' }
  );

  figures.forEach((f) => io.observe(f));
})();
