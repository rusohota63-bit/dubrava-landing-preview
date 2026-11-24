(() => {
  'use strict';
  // Прямые ссылки остаются рабочими без JavaScript.
  const viewer = document.querySelector('.photo-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const image = viewer.querySelector('.viewer-image');
  const caption = viewer.querySelector('.viewer-caption');
  const strip = document.createElement('div');
  strip.className = 'viewer-filmstrip';
  strip.setAttribute('role', 'group');
  strip.setAttribute('aria-label', 'Все фотографии площадки');
  image.after(strip);
  let photos = [], current = 0, returnFocus;
  const plain = event => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  function show(index) {
    current = (index + photos.length) % photos.length;
    const link = photos[current];
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    caption.textContent = `${current + 1} / ${photos.length} · ${image.alt}`;
    strip.querySelectorAll('button').forEach((button, index) => {
      if (index === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    strip.children[current]?.scrollIntoView({block: 'nearest', inline: 'nearest'});
  }
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const links = [...gallery.querySelectorAll('[data-photo]')];
    links.forEach((link, index) => link.addEventListener('click', event => {
      if (!plain(event)) return;
      event.preventDefault();
      photos = links;
      returnFocus = link;
      strip.replaceChildren();
      links.forEach((photo, photoIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `Фото ${photoIndex + 1}: ${photo.querySelector('img').alt}`);
        const thumb = document.createElement('img');
        thumb.src = photo.dataset.srcset.split(',')[0].trim().split(/\s+/)[0];
        thumb.alt = '';
        thumb.width = 76;
        thumb.height = 64;
        button.append(thumb);
        button.addEventListener('click', () => show(photoIndex));
        strip.append(button);
      });
      viewer.showModal();
      show(index);
    }));
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('.viewer-prev').addEventListener('click', () => show(current - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => show(current + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
  });
  viewer.addEventListener('close', () => {
    image.removeAttribute('src');
    strip.replaceChildren();
    returnFocus?.focus({preventScroll: true});
  });
  let touch;
  image.addEventListener('touchstart', event => {
    touch = event.touches.length === 1 ? {x: event.touches[0].clientX, y: event.touches[0].clientY} : null;
  }, {passive: true});
  image.addEventListener('touchend', event => {
    if (!touch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    touch = null;
  }, {passive: true});
})();
