(function() {
  'use strict';
  var dialog = document.getElementById('request-dialog');
  if (!dialog) return;
  var form = document.getElementById('request-form');
  var offer = document.getElementById('request-offer');
  var summary = document.getElementById('request-summary');
  var lastTrigger;
  var descriptions = {
    general: 'Поможем выбрать зал или заезд с проживанием.',
    usadba: '31 декабря 2026. Банкет без проживания: 13\u00a0000\u00a0₽ за взрослого.',
    'main-hall': '31 декабря 2026. Банкет без проживания: 18\u00a0000\u00a0₽ за взрослого.',
    'hotel-stay': '31 декабря 2026 - 2 января 2027. 35\u00a0000\u00a0₽ за взрослого за весь заезд.'
  };
  function updateSummary() {
    summary.textContent = descriptions[offer.value] || descriptions.general;
  }
  document.querySelectorAll('[data-request-offer]').forEach(function(trigger) {
    trigger.addEventListener('click', function() {
      lastTrigger = trigger;
      offer.value = descriptions[trigger.dataset.requestOffer] ? trigger.dataset.requestOffer : 'general';
      updateSummary();
      if (!dialog.open) dialog.showModal();
      document.documentElement.classList.add('request-open');
      document.getElementById('request-title').focus({preventScroll:true});
    });
  });
  offer.addEventListener('change', updateSummary);
  function validatePhone() {
    var field = form.elements.phone;
    var value = field.value.trim();
    var digits = value.replace(/\D/g, '');
    var valid = !value || (/^\+?[\d()\s.\-]+$/.test(value) && digits.length >= 10 && digits.length <= 15);
    field.setCustomValidity(valid ? '' : 'Укажите телефон с кодом города или страны.');
    return valid;
  }
  form.elements.phone.addEventListener('blur', validatePhone);
  form.elements.phone.addEventListener('input', function() { this.setCustomValidity(''); });
  dialog.querySelector('.request-close').addEventListener('click', function() { dialog.close(); });
  dialog.addEventListener('click', function(event) {
    var rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function() {
    document.documentElement.classList.remove('request-open');
    if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus({preventScroll:true});
  });
  // Preview only. No data is stored, sent or reported as delivered.
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    validatePhone();
    document.getElementById('request-preview').textContent = 'Это макет формы. Заявки пока не отправляются.';
  });
  updateSummary();
})();
