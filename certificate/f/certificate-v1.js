// This page uses one mobile boundary, including its menu.
(() => {
  const button = document.querySelector('.site-menu-button');
  const navigation = document.getElementById('site-navigation');
  if (!button || !navigation) return;
  const mobile = window.matchMedia('(max-width: 767px)');
  const close = () => button.setAttribute('aria-expanded','false');
  button.hidden = false;
  button.addEventListener('click', () => button.setAttribute('aria-expanded',String(button.getAttribute('aria-expanded') !== 'true')));
  navigation.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('a')) { button.focus(); close(); }
  });
  document.addEventListener('click', event => { if (!button.contains(event.target) && !navigation.contains(event.target)) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && button.getAttribute('aria-expanded') === 'true') { button.focus(); close(); }
  });
  mobile.addEventListener('change',close);
})();

(() => {
  'use strict';
  const storageKey = 'dubrava-cert-choice';
  const form = document.querySelector('#certificate-constructor');
  if (!form) return;
  const preview = document.querySelector('[data-live-preview]');
  const paper = preview.querySelector('.cert-paper');
  const image = paper.querySelector('img');
  const amountInput = form.elements.customAmount;
  const recipientInput = form.elements.recipient;
  const error = document.querySelector('#cert-amount-error');
  const types = ['stay', 'restaurant', 'package'];
  const formats = ['electronic', 'paper'];
  const amounts = ['3000', '5000', '7000', '10000', 'custom'];
  const formatNumber = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const customValue = () => Number(amountInput.value.replace(/[\s\u00a0\u202f]/g, ''));
  function choice() {
    const type = form.elements.type.value;
    return {
      version: 1,
      type,
      amount: type === 'package' ? null : (form.elements.amount.value === 'custom' ? customValue() : Number(form.elements.amount.value)),
      amountOption: form.elements.amount.value,
      package: type === 'package' ? 'Пакет под ваш повод' : '',
      format: form.elements.format.value,
      recipient: recipientInput.value.trim().slice(0, 28)
    };
  }
  function validAmount() {
    return form.elements.type.value === 'package' || form.elements.amount.value !== 'custom' || (/^\d[\d\s\u00a0\u202f]*$/.test(amountInput.value) && Number.isInteger(customValue()) && customValue() >= 1000 && customValue() <= 100000);
  }
  function render() {
    const data = choice();
    const isPackage = data.type === 'package';
    document.querySelector('#cert-money-step').hidden = isPackage;
    document.querySelector('#cert-package-step').hidden = !isPackage;
    document.querySelector('#cert-custom-field').hidden = isPackage || data.amountOption !== 'custom';
    paper.dataset.kind = data.type;
    image.src = `/assets/certificate-v1/${data.type}-700.webp`;
    image.srcset = `/assets/certificate-v1/${data.type}-700.webp 700w, /assets/certificate-v1/${data.type}-1200.webp 1200w`;
    const name = data.recipient;
    paper.querySelector('.cert-guest').textContent = data.recipient;
    paper.toggleAttribute('data-long-name',data.recipient.length > 17);
    document.querySelector('#cert-without-name').hidden = Boolean(data.recipient);
    paper.querySelector('.cert-amount').textContent = isPackage ? data.package : (validAmount() ? `${formatNumber(data.amount)}\u00a0₽` : 'Ваша сумма');
    document.querySelector('#cert-preview-format').textContent = data.format === 'paper' ? 'Бумажный в конверте' : 'Электронный (файл на почту)';
    error.textContent = validAmount() ? '' : 'Введите сумму от 1\u00a0000\u00a0₽ до 100\u00a0000\u00a0₽';
    amountInput.setAttribute('aria-invalid', String(!validAmount()));
    const typeName = {stay: 'Проживание на сумму',restaurant: 'Ресторан',package: 'Пакет'}[data.type];
    paper.setAttribute('aria-label', `${typeName}. ${paper.querySelector('.cert-amount').textContent}. ${name || 'Без имени'}. Номер сертификата: образец. Действует 6 месяцев с даты оплаты.`);
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved === 'object') {
      if (types.includes(saved.type)) form.elements.type.value = saved.type;
      if (formats.includes(saved.format)) form.elements.format.value = saved.format;
      if (amounts.includes(saved.amountOption)) form.elements.amount.value = saved.amountOption;
      if (Number.isInteger(saved.amount) && saved.amount >= 1000 && saved.amount <= 100000) {
        if (!saved.amountOption) form.elements.amount.value = amounts.includes(String(saved.amount)) ? String(saved.amount) : 'custom';
        amountInput.value = formatNumber(saved.amount);
      }
      if (typeof saved.recipient === 'string') recipientInput.value = saved.recipient.slice(0, 28);
    }
  } catch (_) { /* The constructor also works when storage is unavailable. */ }
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  amountInput.addEventListener('input', () => {
    const before = amountInput.selectionStart;
    const digitCount = amountInput.value.slice(0, before).replace(/\s/g, '').length;
    if (/^[\d\s\u00a0\u202f]*$/.test(amountInput.value)) {
      const digits = amountInput.value.replace(/\s/g, '');
      amountInput.value = formatNumber(digits);
      let pos = 0, count = 0;
      while (pos < amountInput.value.length && count < digitCount) { if (/\d/.test(amountInput.value[pos])) count++; pos++; }
      amountInput.setSelectionRange(pos, pos);
    }
    render();
  });
  document.querySelectorAll('[data-cert-pick]').forEach(link => {
    link.addEventListener('click', () => {
      if (types.includes(link.dataset.certPick)) form.elements.type.value = link.dataset.certPick;
      render();
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validAmount()) { render(); amountInput.focus(); return; }
    try { sessionStorage.setItem(storageKey, JSON.stringify(choice())); } catch (_) { /* No storage is required for navigation. */ }
    document.dispatchEvent(new CustomEvent('certificate:choice', {detail: choice()}));
    window.location.hash = 'request';
  });
  render();
})();

(() => {
  'use strict';
  const nbsp = text => text.replace(/(?<![\p{L}\p{N}_])(в|с|к|о|у|и|а|на|по|от|до|за|из|не) +(?=\S|$)/giu, '$1\u00a0').replace(/ +(?=₽)/g, '\u00a0');
  // The shared consent notice is inserted by the next deferred script.
  // Bind its words too, without changing the common script or any form values.
  document.addEventListener('DOMContentLoaded', () => {
    const walker = document.createTreeWalker(document.body, 4);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('script,style,noscript,textarea')) continue;
      const bound = nbsp(node.textContent);
      if (bound !== node.textContent) node.textContent = bound;
    }
  });
  // analytics-consent.js sets this flag on every choice, also without localStorage.
  // There is no queue: actions before consent are discarded.
  function goal(name) {
    if (!['www.dubrava-samara.ru', 'dubrava-samara.ru'].includes(location.hostname)) return;
    if (window.disableYaCounter99314887 !== false || typeof window.ym !== 'function') return;
    try { window.ym(99314887, 'reachGoal', name); } catch (_) { /* Analytics must not change the form result. */ }
  }
  document.querySelectorAll('a[href^="tel:"]').forEach(link => link.addEventListener('click', () => goal('certificate_phone')));
  const form = document.getElementById('certificate-request');
  if (form) {
    const field = name => form.elements.namedItem(name);
    const result = form.querySelector('.cert-request-result');
    const submit = form.querySelector('[type="submit"]');
    let previousAttempt;
    const moneyDigits = value => value.trim().replace(/\s/g,'').replace(/₽$/,'');
    const moneyLabel = value => `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')}\u00a0₽`;
    function revealResult() {
      result.scrollIntoView({block:'center', behavior:'instant'});
      result.focus({preventScroll:true});
    }
    form.noValidate = true;
    field('response_mode').value = 'json';
    function syncMode() {
      const electronic = field('cert_format').value === 'electronic';
      field('email').required = electronic;
      field('cert_quantity').closest('label').hidden = field('buyer_kind').value !== 'business';
      if (field('buyer_kind').value !== 'business') field('cert_quantity').value = '1';
      field('cert_value').inputMode = field('cert_type').value === 'package' ? 'text' : 'numeric';
      document.getElementById('request-cert_value-hint').textContent = field('cert_type').value === 'package'
        ? 'Состав и\u00a0стоимость пакета согласуем с\u00a0вами'
        : 'Укажите сумму сертификата';
    }
    function transfer(choice) {
      if (!choice || typeof choice !== 'object') return;
      if (['stay','restaurant','package'].includes(choice.type)) {
        field('cert_type').value = choice.type;
        if (choice.type === 'package') field('cert_value').value = typeof choice.package === 'string' ? choice.package.slice(0,500) : 'Пакет под ваш повод';
        else if (Number.isInteger(choice.amount) && choice.amount >= 1000 && choice.amount <= 100000) field('cert_value').value = moneyLabel(choice.amount);
      }
      if (['electronic','paper'].includes(choice.format)) field('cert_format').value = choice.format;
      if (typeof choice.recipient === 'string') field('cert_recipient').value = [...choice.recipient].slice(0,28).join('');
      syncMode();
    }
    try { transfer(JSON.parse(sessionStorage.getItem('dubrava-cert-choice') || 'null')); } catch (_) { /* Plain fields remain usable. */ }
    document.addEventListener('certificate:choice', event => {
      transfer(event.detail);
      goal('certificate_constructed');
    });
    document.querySelectorAll('[data-cert-business]').forEach(link => link.addEventListener('click', () => {
      field('buyer_kind').value = 'business';
      syncMode();
    }));
    form.addEventListener('change', event => {
      if (event.target.name === 'cert_type') field('cert_value').value = field('cert_type').value === 'package' ? 'Пакет под ваш повод' : moneyLabel(10000);
      syncMode();
    });
    for (const name of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','gclid']) {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = name;
      input.value = (new URLSearchParams(location.search).get(name) || '').slice(0,200);
      form.append(input);
    }
    function validate() {
      syncMode();
      const reasons = {};
      if (!['stay','restaurant','package'].includes(field('cert_type').value)) reasons.cert_type = 'Выберите вид сертификата';
      const value = field('cert_value').value.trim();
      const money = moneyDigits(value);
      if (!value || (field('cert_type').value !== 'package' && (!/^\d+$/.test(money) || Number(money) < 1000 || Number(money) > 100000))) reasons.cert_value = 'Укажите сумму или пожелания к пакету';
      if (!['electronic','paper'].includes(field('cert_format').value)) reasons.cert_format = 'Выберите формат сертификата';
      if (!/^[1-9]\d{0,3}$/.test(field('cert_quantity').value)) reasons.cert_quantity = 'Укажите количество целым числом от 1';
      const phone = field('phone').value.trim();
      if (phone.length > 25 || !/^\+?[0-9(). \-]+$/.test(phone) || !/^\d{10,15}$/.test(phone.replace(/\D/g,''))) reasons.phone = 'Укажите телефон, по которому с вами можно связаться';
      if (field('email').required && !field('email').value.trim()) reasons.email = 'Для электронного сертификата нужна почта';
      else if (field('email').validity.typeMismatch) reasons.email = 'Проверьте адрес электронной почты';
      if (!field('policy_read').checked) reasons.policy_read = 'Чтобы отправить заявку, нужно согласие на обработку персональных данных';
      for (const name of ['cert_type','cert_value','cert_format','cert_quantity','phone','email','policy_read']) {
        field(name).setCustomValidity(nbsp(reasons[name] || ''));
        field(name).setAttribute('aria-invalid', String(Boolean(reasons[name])));
      }
      return reasons;
    }
    form.addEventListener('input', event => {
      if (event.target.setCustomValidity) event.target.setCustomValidity('');
      event.target.removeAttribute('aria-invalid');
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled) return;
      const reasons = validate();
      if (!form.reportValidity()) {
        result.textContent = nbsp(Object.values(reasons)[0] || 'Проверьте адрес электронной почты');
        result.dataset.error = '';
        revealResult();
        return;
      }
      const data = new FormData(form);
      if (field('cert_type').value !== 'package') data.set('cert_value',moneyDigits(field('cert_value').value));
      data.delete('request_id');
      const content = JSON.stringify([...data]);
      if (previousAttempt?.content !== content) previousAttempt = {content, id: crypto.randomUUID()};
      data.set('request_id',previousAttempt.id);
      field('request_id').value = previousAttempt.id;
      submit.disabled = true; form.setAttribute('aria-busy','true');
      result.textContent = 'Отправляем заявку…'; result.removeAttribute('data-error');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(),25000);
      try {
        const response = await fetch(form.action, {method:'POST',body:data,credentials:'same-origin',cache:'no-store',signal:controller.signal});
        const outcome = await response.json();
        if (response.ok && outcome.result === 'sent') {
          result.textContent = nbsp('Заявка ушла. Менеджер перезвонит в ближайшее рабочее время по указанному телефону и подскажет способ оплаты');
          if (!previousAttempt.sent) goal('certificate_request');
          previousAttempt.sent = true;
        } else throw new Error('not-sent');
      } catch (_) {
        result.replaceChildren(document.createTextNode(nbsp('Заявка не ушла. Позвоните нам: ')));
        for (const [i,phone] of ['8 (846) 979-95-95','8 (927) 017-60-72'].entries()) {
          if (i) result.append(document.createTextNode(' или '));
          const a = document.createElement('a');
          a.href = i ? 'tel:+79270176072' : 'tel:+78469799595'; a.textContent = phone.replace('8 ','8\u00a0');
          a.addEventListener('click', () => goal('certificate_phone')); result.append(a);
        }
        result.dataset.error = '';
      } finally { clearTimeout(timeout); submit.disabled = false; form.removeAttribute('aria-busy'); revealResult(); }
    });
    syncMode();
  }
  const dialog = document.querySelector('.cert-photo-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const photo = dialog.querySelector('[data-photo-image]');
  const caption = dialog.querySelector('[data-photo-caption]');
  let photos = [], index = 0, opener, oldOverflow = '';
  function show(offset) {
    index = (offset + photos.length) % photos.length;
    photo.src = photos[index].href;
    photo.alt = photos[index].querySelector('img').alt;
    caption.textContent = nbsp(`${index+1} / ${photos.length} · ${photo.alt}`);
  }
  document.querySelectorAll('[data-cert-gallery]').forEach(group => {
    group.querySelectorAll('[data-cert-photo]').forEach(link => link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault(); photos = [...group.querySelectorAll('[data-cert-photo]')]; opener = link;
      show(photos.indexOf(link)); oldOverflow = document.documentElement.style.overflow;
      dialog.showModal(); document.documentElement.style.overflow = 'hidden';
    }));
  });
  dialog.querySelector('[data-photo-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-photo-prev]').addEventListener('click', () => show(index-1));
  dialog.querySelector('[data-photo-next]').addEventListener('click', () => show(index+1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); show(index + (event.key === 'ArrowLeft' ? -1 : 1)); }
  });
  dialog.addEventListener('close', () => { photo.removeAttribute('src'); document.documentElement.style.overflow = oldOverflow; opener?.focus({preventScroll:true}); });
  let touch;
  photo.addEventListener('touchstart', event => { touch = event.touches.length === 1 ? event.touches[0].clientX : null; },{passive:true});
  photo.addEventListener('touchend', event => {
    if (touch !== null && Math.abs(event.changedTouches[0].clientX-touch)>45) show(index + (event.changedTouches[0].clientX<touch ? 1 : -1));
    touch = null;
  },{passive:true});
})();
