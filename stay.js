(() => {
  document.querySelectorAll('[data-stay-gallery]').forEach(gallery => {
    const sizes = '(max-width:650px) calc(100vw - 44px), (max-width:1300px) calc((100vw - 112px)/2), 605px';
    const photo = gallery.querySelector('figure img');
    const caption = gallery.querySelector('figcaption');
    const buttons = gallery.querySelectorAll('[data-stay-photo]');
    let selection = 0;
    buttons.forEach(button => button.addEventListener('click', () => {
      const current = ++selection;
      const next = new Image();
      gallery.setAttribute('aria-busy', 'true');
      next.onload = () => {
        if (current !== selection) return;
        photo.src = button.dataset.stayPhoto;
        photo.srcset = next.srcset;
        photo.sizes = sizes;
        photo.alt = button.dataset.stayAlt;
        caption.textContent = button.dataset.stayCaption;
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        gallery.removeAttribute('aria-busy');
      };
      next.onerror = () => {
        if (current !== selection) return;
        caption.textContent = 'Фото не загрузилось. Попробуйте выбрать его ещё раз.';
        gallery.removeAttribute('aria-busy');
      };
      next.sizes = sizes;
      next.srcset = button.dataset.stayPhoto.replace('-warm-v1.webp', '-small-warm-v1.webp') + ' 640w, ' + button.dataset.stayPhoto + ' 1280w';
      next.src = button.dataset.stayPhoto;
    }));
  });
})();
