/* Sovereign by design — the stack builds as you scroll.

   The stage pins for the length of the track. Step by step one slab is added
   on top of the last, and the copy beside it swaps from the left column to the
   right and back. Entirely scroll-position driven: no timers, no autoplay, so
   scrubbing back takes the slabs off again and stopping freezes it.

   The script writes only scalars; sovereign.css owns every distance:
     --c1..--c3  which copy block is showing
     --s1..--s3  how far each slab has landed                                */

(() => {
  const track = document.querySelector('.sbd-track');
  const stage = document.querySelector('.sbd-stage');
  const section = document.querySelector('.sbd');
  if (!track || !stage || !section) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  // Smoothstep: eases in and out of every window, so nothing starts or stops
  // abruptly as the scrub crosses a boundary.
  const ease = (t) => t * t * (3 - 2 * t);
  const seg = (p, a, b) => ease(clamp((p - a) / (b - a)));

  /* A slab lands, its copy holds, then the next step takes over. Slabs are
     cumulative — once landed they stay for the rest of the run. */
  const SLAB = [[0.00, 0.26], [0.36, 0.62], [0.70, 0.96]];
  const COPY = [
    { in: [0.00, 0.12], out: [0.26, 0.40] },
    { in: [0.34, 0.48], out: [0.60, 0.74] },
    { in: [0.68, 0.82], out: [1.20, 1.30] }, // the last one stays
  ];

  let frame = 0;
  let last = -1;

  const paint = () => {
    frame = 0;

    if (getComputedStyle(stage).position !== 'sticky') {
      // Unpinned layout: everything is simply present.
      for (let i = 1; i <= 3; i++) {
        section.style.setProperty('--c' + i, '1');
        section.style.setProperty('--s' + i, '1');
      }
      section.style.setProperty('--o1', '0.2');
      section.style.setProperty('--o2', '0.4');
      section.style.setProperty('--o3', '1');
      return;
    }

    const rect = track.getBoundingClientRect();
    const run = rect.height - stage.getBoundingClientRect().height;
    const p = clamp(-rect.top / Math.max(1, run));

    if (p === last) return;
    last = p;

    const s = [0, 1, 2].map((i) => seg(p, SLAB[i][0], SLAB[i][1]));

    for (let i = 0; i < 3; i++) {
      section.style.setProperty('--s' + (i + 1), s[i].toFixed(4));
      const c = COPY[i];
      const v = seg(p, c.in[0], c.in[1]) * (1 - seg(p, c.out[0], c.out[1]));
      section.style.setProperty('--c' + (i + 1), v.toFixed(4));
    }

    // The slab last laid is full strength; each one buried under it dims.
    section.style.setProperty('--o1', (1 - 0.6 * s[1] - 0.2 * s[2]).toFixed(4));
    section.style.setProperty('--o2', (1 - 0.6 * s[2]).toFixed(4));
    section.style.setProperty('--o3', '1');
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { last = -1; schedule(); }, { passive: true });
  paint();
})();
