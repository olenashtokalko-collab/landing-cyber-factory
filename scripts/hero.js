/* Hero motion.
   Three behaviours, all driven through custom properties so the CSS keeps
   ownership of how far anything actually moves:
     --sp  scroll progress out of the hero, 0 → 1
     --mx  pointer offset from the viewport centre, -1 → 1
     --my  ditto, vertical                                                */

(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------- reveal */

  // The topbar sits outside .hero (it has to paint over every section), so the
  // reveal flag is mirrored onto <body> for it.
  const reveal = () => {
    hero.classList.add('is-revealed');
    document.body.classList.add('hero-revealed');
  };

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    reveal(); // not via rAF: that never fires in a background tab
  };

  /* ------------------------------------------------------------- topbar */

  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const syncStuck = () => topbar.classList.toggle('is-stuck', window.scrollY > 8);
    addEventListener('scroll', syncStuck, { passive: true });
    syncStuck();
  }

  const firstImage = hero.querySelector('.monolith');
  Promise.all([
    document.fonts ? document.fonts.ready : null,
    firstImage && firstImage.decode ? firstImage.decode().catch(() => {}) : null,
  ]).then(start);

  // Never hold the reveal hostage to a slow network.
  setTimeout(start, 1400);

  /* ---------------------------------------------------------------- camera */

  if (reduced.matches) return;

  const finePointer = matchMedia('(pointer: fine)');

  const cam = { x: 0, y: 0, tx: 0, ty: 0 };
  let progress = -1;
  let frame = 0;
  let visible = true;

  const scrollProgress = () => {
    const span = hero.offsetHeight || 1;
    return Math.min(1, Math.max(0, window.scrollY / span));
  };

  const tick = () => {
    frame = 0;

    // Long ease towards the pointer — a camera drifting, not tracking.
    cam.x += (cam.tx - cam.x) * 0.055;
    cam.y += (cam.ty - cam.y) * 0.055;

    const sp = scrollProgress();
    const settling =
      Math.abs(cam.tx - cam.x) > 0.0015 || Math.abs(cam.ty - cam.y) > 0.0015;

    hero.style.setProperty('--mx', cam.x.toFixed(4));
    hero.style.setProperty('--my', cam.y.toFixed(4));

    if (sp !== progress) {
      progress = sp;
      hero.style.setProperty('--sp', sp.toFixed(4));
      hero.dataset.passed = sp > 0.92 ? 'true' : 'false';
    }

    if (settling && visible) schedule();
  };

  const schedule = () => {
    if (!frame && visible) frame = requestAnimationFrame(tick);
  };

  const onPointer = (event) => {
    cam.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    cam.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    schedule();
  };

  // Pointer parallax is a desktop affordance; touch has no hover state to read.
  const bindPointer = () => {
    if (finePointer.matches) {
      window.addEventListener('pointermove', onPointer, { passive: true });
    } else {
      window.removeEventListener('pointermove', onPointer);
      cam.tx = cam.ty = 0;
      schedule();
    }
  };

  bindPointer();
  finePointer.addEventListener('change', bindPointer);

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });

  // Idle once the hero is off screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: '10% 0px' }
    ).observe(hero);
  }

  tick(); // settle --sp for a restored scroll position
})();
