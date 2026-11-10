(() => {
  'use strict';
  const dialog = document.getElementById('winter-photo-dialog');
  const links = Array.from(document.querySelectorAll('[data-winter-photo]'));
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return;
  const photo = dialog.querySelector('[data-winter-view-image]');
  const picture = dialog.querySelector('.winter-view-picture');
  const caption = dialog.querySelector('[data-winter-caption]');
  const count = dialog.querySelector('[data-winter-count]');
  const error = dialog.querySelector('[data-winter-error]');
  const retry = dialog.querySelector('[data-winter-retry]');
  const file = dialog.querySelector('[data-winter-file]');
  let current = 0;
  let generation = 0;
  let trigger;
  let previousOverflow = '';
  function show(index) {
    current = (index + links.length) % links.length;
    const link = links[current];
    const request = ++generation;
    photo.hidden = true;
    error.hidden = true;
    retry.hidden = true;
    picture.setAttribute('aria-busy', 'true');
    count.textContent = `${current + 1} / ${links.length}`;
    caption.textContent = link.dataset.caption;
    file.href = link.href;
    const next = new Image();
    next.onload = () => {
      if (request !== generation || !dialog.open) return;
      photo.src = next.src;
      photo.alt = link.querySelector('img').alt;
      photo.hidden = false;
      picture.setAttribute('aria-busy', 'false');
    };
    next.onerror = () => {
      if (request !== generation || !dialog.open) return;
      picture.setAttribute('aria-busy', 'false');
      error.hidden = false;
      retry.hidden = false;
    };
    next.src = link.href;
  }
  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    trigger = link;
    previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    show(index);
    dialog.querySelector('[data-winter-close]').focus({preventScroll:true});
  }));
  dialog.querySelector('[data-winter-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-winter-prev]').addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-winter-next]').addEventListener('click', () => show(current + 1));
  retry.addEventListener('click', () => show(current));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    generation++;
    document.documentElement.style.overflow = previousOverflow;
    if (trigger && trigger.isConnected) trigger.focus({preventScroll:true});
  });
})();
