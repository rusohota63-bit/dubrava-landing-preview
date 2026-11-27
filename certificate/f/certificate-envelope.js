(() => {
  'use strict';
  const section = document.querySelector('#how');
  if (!section) return;
  const scene = section.querySelector('.cert-envelope-scene');
  const steps = [...section.querySelectorAll('li')];
  const source = document.querySelector('[data-live-preview] .cert-paper');
  const paper = scene.querySelector('.cert-paper');
  const mobile = matchMedia('(max-width: 767px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame, observer, played = false;
  function sync() {
    paper.dataset.kind = source.dataset.kind;
    paper.toggleAttribute('data-long-name', source.hasAttribute('data-long-name'));
    for (const attr of ['src', 'srcset']) paper.querySelector('img').setAttribute(attr, source.querySelector('img').getAttribute(attr));
    for (const cls of ['cert-guest', 'cert-amount']) paper.querySelector('.' + cls).textContent = source.querySelector('.' + cls).textContent || 'Ваше имя';
    paper.setAttribute('aria-label', source.getAttribute('aria-label').replace('Без имени', 'Ваше имя'));
  }
  sync();
  document.addEventListener('certificate:preview', sync);
  function paint(p) {
    scene.style.setProperty('--progress', p);
    steps.forEach((step, i) => step.toggleAttribute('data-current', i === Math.min(3, Math.floor(p * 4))));
  }
  function scroll() {
    if (mobile.matches || reduced.matches || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const box = section.querySelector('.cert-numbered').getBoundingClientRect();
      const travel = box.height - section.querySelector('.cert-delivery').offsetHeight;
      paint(Math.max(0, Math.min(1, (32 - box.top) / Math.max(1, travel))));
    });
  }
  function setup() {
    cancelAnimationFrame(frame); frame = 0;
    observer?.disconnect();
    section.toggleAttribute('data-motion', !reduced.matches);
    if (reduced.matches) { paint(1); return; }
    if (!mobile.matches) { scroll(); return; }
    paint(played ? 1 : 0);
    if (played) return;
    observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.intersectionRatio >= .5)) return;
      observer.disconnect(); played = true;
      let start;
      const tick = now => {
        start ??= now;
        const p = Math.min(1, (now - start) / 2000);
        paint(p);
        frame = p < 1 ? requestAnimationFrame(tick) : 0;
      };
      frame = requestAnimationFrame(tick);
    }, {threshold: .5});
    observer.observe(scene);
  }
  addEventListener('scroll', scroll, {passive: true});
  addEventListener('resize', scroll);
  mobile.addEventListener('change', setup);
  reduced.addEventListener('change', setup);
  setup();
})();
