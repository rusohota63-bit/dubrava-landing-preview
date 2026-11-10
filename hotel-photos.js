(() => {
  'use strict';
  const section = document.getElementById('hotel-photos');
  if (!section) return;
  const links = Array.from(section.querySelectorAll('[data-hotel-photo]'));
  const open = section.querySelector('[data-hotel-open]');
  const stage = section.querySelector('#hotel-album-image');
  const stageError = section.querySelector('.hotel-album-error');
  const stageFile = section.querySelector('[data-hotel-stage-file]');
  const stageCaption = section.querySelector('[data-hotel-stage-caption]');
  const stageCount = section.querySelector('[data-hotel-stage-count]');
  let selected = 0;
  let stageGeneration = 0;
  const plainClick = event => !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0;
  function select(index) {
    selected = (index + links.length) % links.length;
    const link = links[selected];
    const request = ++stageGeneration;
    links.forEach((item, i) => i === selected ? item.setAttribute('aria-current', 'true') : item.removeAttribute('aria-current'));
    open.href = link.href;
    stageFile.href = link.href;
    open.setAttribute('aria-label', 'Увеличить фото: ' + link.dataset.caption.toLowerCase());
    stageCaption.textContent = link.dataset.caption;
    stageCount.textContent = `${selected + 1} / ${links.length}`;
    stageError.hidden = true;
    open.hidden = false;
    open.setAttribute('aria-busy', 'true');
    stage.hidden = true;
    const next = new Image();
    const srcset = `${link.dataset.small} ${link.dataset.smallWidth || 640}w, ${link.dataset.preview} ${link.dataset.previewWidth || 1280}w`;
    next.sizes = stage.sizes;
    next.onload = () => {
      if (request !== stageGeneration) return;
      stage.srcset = srcset;
      stage.src = link.dataset.preview;
      stage.alt = link.dataset.alt;
      stage.hidden = false;
      open.setAttribute('aria-busy', 'false');
    };
    next.onerror = () => {
      if (request !== stageGeneration) return;
      open.setAttribute('aria-busy', 'false');
      open.hidden = true;
      stageError.hidden = false;
    };
    next.srcset = srcset;
    next.src = link.dataset.preview;
  }
  links.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (!plainClick(event)) return;
      event.preventDefault();
      select(index);
    });
    link.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
      select(target);
      links[target].focus({preventScroll:true});
    });
  });
  section.querySelector('[data-hotel-stage-retry]').addEventListener('click', () => select(selected));

  const dialog = section.querySelector('#hotel-photo-dialog');
  if (typeof dialog.showModal !== 'function') return;
  const photo = dialog.querySelector('[data-hotel-view-image]');
  const picture = dialog.querySelector('.hotel-view-picture');
  const caption = dialog.querySelector('[data-hotel-caption]');
  const count = dialog.querySelector('[data-hotel-count]');
  const error = dialog.querySelector('[data-hotel-error]');
  const retry = dialog.querySelector('[data-hotel-retry]');
  const file = dialog.querySelector('[data-hotel-file]');
  let current = 0;
  let generation = 0;
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
      photo.alt = link.dataset.alt;
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
  open.addEventListener('click', event => {
    if (!plainClick(event)) return;
    event.preventDefault();
    previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    show(selected);
    dialog.querySelector('[data-hotel-close]').focus({preventScroll:true});
  });
  dialog.querySelector('[data-hotel-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-hotel-prev]').addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-hotel-next]').addEventListener('click', () => show(current + 1));
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
    open.focus({preventScroll:true});
  });
})();
