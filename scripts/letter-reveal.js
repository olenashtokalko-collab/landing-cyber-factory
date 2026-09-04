/* Scroll-scrubbed character reveal, shared by every [data-letter-reveal].
   Characters keep their own colour and simply travel from dim to full as the
   line crosses the viewport, so a heading's design is untouched at rest.   */

(() => {
  const targets = [...document.querySelectorAll('[data-letter-reveal]')];
  if (!targets.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const DIM = 0.3;   // resting opacity of an unread character
  const SOFT = 2;    // characters in the leading edge of the sweep

  const split = (root) => {
    // Idempotent: a stale cached copy of an older script may already have run.
    if (root.querySelector('.rv-char')) return [...root.querySelectorAll('.rv-char')];

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);

    for (const node of texts) {
      const frag = document.createDocumentFragment();
      // Words stay unbreakable so the sweep never re-wraps the line.
      for (const part of node.nodeValue.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          frag.append(part);
          continue;
        }
        const word = document.createElement('span');
        word.className = 'rv-word';
        for (const ch of part) {
          const c = document.createElement('span');
          c.className = 'rv-char';
          c.textContent = ch;
          word.append(c);
        }
        frag.append(word);
      }
      node.parentNode.replaceChild(frag, node);
    }
    return [...root.querySelectorAll('.rv-char')];
  };

  if (reduced.matches) return;

  const runs = targets.map((el) => ({ el, chars: split(el) })).filter((r) => r.chars.length);
  runs.forEach((r) => r.el.classList.add('is-split'));

  let frame = 0;

  const paint = () => {
    frame = 0;
    const vh = window.innerHeight || 1;

    for (const run of runs) {
      const rect = run.el.getBoundingClientRect();
      // Sweep runs while the line crosses the middle of the viewport.
      const p = Math.min(1, Math.max(0, (vh * 0.86 - rect.top) / (vh * 0.58)));
      if (p === run.last) continue;
      run.last = p;

      const total = run.chars.length;
      const head = p * (total + SOFT);
      for (let i = 0; i < total; i++) {
        const t = Math.min(1, Math.max(0, (head - i) / SOFT));
        run.chars[i].style.opacity = (DIM + (1 - DIM) * t).toFixed(3);
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
