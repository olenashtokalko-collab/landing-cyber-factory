/* Reveals any [data-scroll-in] element once it has been reached.
   One-shot: the element stays put after it has arrived.                     */

(() => {
  const targets = [...document.querySelectorAll('[data-scroll-in]')];
  if (!targets.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  if (reduced.matches || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    // Fire once the element is a little way into the viewport, not at its edge.
    { rootMargin: '0px 0px -18% 0px', threshold: 0.2 }
  );

  targets.forEach((el) => io.observe(el));
})();
