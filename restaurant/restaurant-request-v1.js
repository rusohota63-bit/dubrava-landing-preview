"use strict";
const restaurantForm = document.getElementById("restaurant-request");
const fields = restaurantForm.elements;
const dateNow = new Date();
fields.date.min = `${dateNow.getFullYear()}-${String(dateNow.getMonth() + 1).padStart(2,"0")}-${String(dateNow.getDate()).padStart(2,"0")}`;
let previousRestaurantAttempt;
document.querySelectorAll("[data-hall]").forEach(link => {
  link.addEventListener("click", () => {
    fields.hall.value = link.dataset.hall;
    validateGuests();
    document.querySelector(".request-result").textContent = "";
    fields.hall.focus({preventScroll:true});
  });
});

// Галереи сохраняют прямые ссылки на фотографии, если JavaScript недоступен.
const photoViewer = document.querySelector('.photo-viewer');
if (photoViewer) {
  const viewerImage = photoViewer.querySelector('.viewer-image');
  const viewerStage = photoViewer.querySelector('.viewer-stage');
  const viewerPdf = photoViewer.querySelector('.viewer-pdf');
  const isScheme = () => currentPhotos[currentPhoto]?.classList.contains('scheme-preview');
  const viewerCaption = photoViewer.querySelector('.viewer-caption');
  let currentPhotos = [], currentPhoto = 0, returnFocus;
  function showPhoto(index) {
    currentPhoto = (index + currentPhotos.length) % currentPhotos.length;
    const link = currentPhotos[currentPhoto];
    photoViewer.classList.remove('is-zoomed');
    photoViewer.classList.toggle('is-scheme', link.classList.contains('scheme-preview'));
    viewerStage.scrollTo(0, 0);
    const pdf = link.closest('figure')?.querySelector('figcaption a');
    viewerPdf.hidden = !pdf;
    if (pdf) viewerPdf.href = pdf.href; else viewerPdf.removeAttribute('href');
    viewerImage.src = link.href;
    viewerImage.alt = link.querySelector('img').alt;
    viewerCaption.textContent = `${currentPhoto + 1} / ${currentPhotos.length} · ${viewerImage.alt}`;
  }
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const links = [...gallery.querySelectorAll('[data-photo]')];
    const main = gallery.querySelector('.gallery-main');
    function selectPhoto(link) {
      links.forEach(item => item.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'true');
      main.href = link.href;
      main.setAttribute('aria-label', `Увеличить фото: ${link.querySelector('img').alt}`);
      main.querySelector('img').src = link.href;
      main.querySelector('img').alt = link.querySelector('img').alt;
    }
    links.forEach(link => link.addEventListener('click', event => {
      event.preventDefault(); selectPhoto(link);
    }));
    main.addEventListener('click', event => {
      event.preventDefault(); currentPhotos = links; returnFocus = main;
      showPhoto(Math.max(0,links.findIndex(link => link.hasAttribute('aria-current'))));
      photoViewer.showModal();
    });
  });
  document.querySelectorAll('.scheme-grid').forEach(grid => {
    const links = [...grid.querySelectorAll('.scheme-preview')];
    links.forEach((link, index) => link.addEventListener('click', event => {
      event.preventDefault(); currentPhotos = links; returnFocus = link;
      showPhoto(index);
      photoViewer.showModal();
    }));
  });
  viewerImage.addEventListener('click', () => {
    if (isScheme() && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      photoViewer.classList.toggle('is-zoomed');
      viewerStage.scrollTo(0, 0);
    }
  });
  photoViewer.querySelector('.viewer-close').addEventListener('click', () => photoViewer.close());
  photoViewer.querySelector('.viewer-prev').addEventListener('click', () => showPhoto(currentPhoto - 1));
  photoViewer.querySelector('.viewer-next').addEventListener('click', () => showPhoto(currentPhoto + 1));
  photoViewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(currentPhoto - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(currentPhoto + 1); }
  });
  photoViewer.addEventListener('close', () => { viewerImage.removeAttribute('src'); returnFocus?.focus({preventScroll:true}); });
  let touchStart;
  viewerImage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : undefined;
  }, {passive:true});
  viewerImage.addEventListener('touchend', event => {
    if (isScheme() || !touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showPhoto(currentPhoto + (dx < 0 ? 1 : -1));
    touchStart = undefined;
  }, {passive:true});
}
const capacities = {"Основной зал ресторана":100,"Зал «Усадьба»":90,"Зал «Азимут»":150,"Зал «Альянс»":50,"Помогите выбрать":150};
function validateGuests() {
  const limit = capacities[fields.hall.value] || 150;
  fields.guests.max = limit;
  fields.guests.setCustomValidity(Number(fields.guests.value) > limit ? `Для этого зала укажите не больше ${limit} гостей.` : "");
}
fields.hall.addEventListener("change", validateGuests);
fields.guests.addEventListener("input", validateGuests);
fields.phone.addEventListener("input", () => fields.phone.setCustomValidity(""));

function previewNotice(event) {
  event.preventDefault();
  restaurantForm.querySelector('.request-result').textContent = 'Это предпросмотр, заявка не отправлена';
}
restaurantForm.addEventListener('submit', previewNotice);
restaurantForm.querySelector('[data-preview-submit]').addEventListener('click', previewNotice);
