(() => {
  const root = document.getElementById('territory');
  if (!root) return;
  const dialog = root.querySelector('dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const viewport = dialog.querySelector('.territory-map-viewport');
  const canvas = dialog.querySelector('.territory-map-canvas');
  const map = canvas.querySelector('img');
  const minus = dialog.querySelector('[data-map-minus]');
  const plus = dialog.querySelector('[data-map-plus]');
  const level = dialog.querySelector('[data-map-level]');
  let scale = 1;
  let oldOverflow = '';
  let opener;
  function fit() {
    const ratio = (map.naturalWidth || map.width) / (map.naturalHeight || map.height);
    const width = Math.min(viewport.clientWidth, viewport.clientHeight * ratio);
    canvas.style.setProperty('--map-base-width', width + 'px');
  }
  function zoom(value) {
    const x = (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth;
    const y = (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight;
    scale = Math.max(1, Math.min(3, value));
    canvas.style.setProperty('--map-scale', scale);
    level.textContent = Math.round(scale * 100) + '%';
    minus.disabled = scale === 1;
    plus.disabled = scale === 3;
    viewport.scrollLeft = x * viewport.scrollWidth - viewport.clientWidth / 2;
    viewport.scrollTop = y * viewport.scrollHeight - viewport.clientHeight / 2;
  }
  root.querySelectorAll('[data-map-open]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    fit();
    zoom(1);
    viewport.scrollTo(0, 0);
  }));
  plus.addEventListener('click', () => zoom(scale + .5));
  minus.addEventListener('click', () => zoom(scale - .5));
  dialog.querySelector('[data-map-reset]').addEventListener('click', () => { zoom(1); viewport.scrollTo(0, 0); });
  dialog.querySelector('[data-map-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = oldOverflow;
    opener?.focus({preventScroll:true});
  });
  window.addEventListener('resize', () => { if (dialog.open) fit(); });
})();
