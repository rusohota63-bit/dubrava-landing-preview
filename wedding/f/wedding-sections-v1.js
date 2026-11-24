(() => {
  'use strict';
  const cover = document.querySelector('.hero-photo img');
  const coverViewport = matchMedia('(max-width: 710px)');
  function coverAlt() {
    if (cover) cover.alt = coverViewport.matches ? cover.dataset.mobileAlt : cover.dataset.desktopAlt;
  }
  coverAlt();
  coverViewport.addEventListener('change', coverAlt);
  // Lazy images use the exact rendered tile width after layout and on resize.
  if (typeof ResizeObserver !== 'undefined') {
    const images = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = Math.ceil(entry.contentRect.width);
        if (width > 0 && entry.target.sizes !== `${width}px`) entry.target.sizes = `${width}px`;
      }
    });
    document.querySelectorAll('main img[loading="lazy"]').forEach(img => images.observe(img));
  }
  const gallery = document.getElementById('wedding-gallery');
  if (gallery) {
    const photos = [...gallery.querySelectorAll('[data-photo]')];
    const more = gallery.querySelector('[data-gallery-more]');
    let visible = 12;
    function updateGallery() {
      photos.forEach((photo, index) => { photo.hidden = index >= visible; });
      more.hidden = visible >= photos.length;
    }
    more.addEventListener('click', () => {
      const next = photos[visible];
      visible += 12;
      updateGallery();
      next?.focus({preventScroll: true});
    });
    updateGallery();
  }
  const bar = document.querySelector('.wedding-sticky');
  const hero = document.getElementById('wedding');
  const request = document.getElementById('request');
  if (!bar || !hero || !request) return;
  let pending = false;
  function updateSticky() {
    pending = false;
    const box = request.getBoundingClientRect();
    const inForm = box.top < innerHeight && box.bottom > 0;
    const consent = document.getElementById('analytics-consent');
    const cookieOpen = consent && !consent.hidden;
    const dialogOpen = !!document.querySelector('.photo-viewer[open]');
    const show = hero.getBoundingClientRect().bottom <= 0 && !inForm && !cookieOpen && !dialogOpen;
    bar.hidden = !show;
    document.body.classList.toggle('has-wedding-sticky', show);
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(updateSticky); }
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule, {passive: true});
  const observer = new IntersectionObserver(schedule);
  observer.observe(hero); observer.observe(request);
  const consent = document.getElementById('analytics-consent');
  if (consent) new MutationObserver(schedule).observe(consent, {attributes: true, attributeFilter: ['hidden']});
  const viewer = document.querySelector('.photo-viewer');
  if (viewer) new MutationObserver(schedule).observe(viewer, {attributes: true, attributeFilter: ['open']});
  updateSticky();
})();
