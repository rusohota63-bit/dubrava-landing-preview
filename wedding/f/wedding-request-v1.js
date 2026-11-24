(() => {
  'use strict';
  const limits = {
    'Помогите выбрать': [1, 200],
    'Шатёр «Континент»': [1, 200],
    'Шатёр «Олимпия»': [50, 100],
    'Основной зал ресторана': [1, 80],
    'Зал «Азимут»': [1, 60],
    'Летняя веранда': [30, 60],
    'Зал «Усадьба»': [1, 50],
    'Зал «Альянс»': [1, 30]
  };
  const messages = {
    sending: 'Отправляем заявку…',
    sent: 'Заявка отправлена. Менеджер свяжется с вами по указанному телефону.',
    invalid: 'Проверьте имя, телефон и остальные поля заявки.',
    failed: 'Не удалось отправить заявку. Повторите отправку или позвоните: 8 (846) 979-95-95.',
    limited: 'Слишком много заявок. Подождите несколько минут или позвоните: 8 (846) 979-95-95.'
  };
  function dayString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function tomorrow(now = new Date()) {
    return dayString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  }
  function validDate(value, now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T12:00:00');
    return Number.isFinite(date.getTime()) && dayString(date) === value && value >= tomorrow(now);
  }
  function validPhone(phone) {
    return /^\+?[0-9(). \-]+$/.test(phone) && /^[0-9]{10,15}$/.test(phone.replace(/\D/g, ''));
  }
  function recommendedVenues(count) {
    const names = count < 30 ? ['Зал «Альянс»', 'Зал «Усадьба»', 'Зал «Азимут»']
      : count === 30 ? ['Зал «Альянс»', 'Зал «Усадьба»', 'Зал «Азимут»']
      : count < 50 ? ['Зал «Усадьба»', 'Зал «Азимут»', 'Основной зал ресторана', 'Летняя веранда']
      : count <= 60 ? ['Зал «Усадьба»', 'Зал «Азимут»', 'Основной зал ресторана', 'Летняя веранда', 'Шатёр «Олимпия»', 'Шатёр «Континент»']
      : count <= 80 ? ['Основной зал ресторана', 'Шатёр «Олимпия»', 'Шатёр «Континент»']
      : count <= 100 ? ['Шатёр «Олимпия»', 'Шатёр «Континент»']
      : count <= 200 ? ['Шатёр «Континент»'] : [];
    const seasonal = new Set(['Летняя веранда', 'Шатёр «Олимпия»', 'Шатёр «Континент»']);
    return names.filter(name => count >= limits[name][0] && count <= limits[name][1])
      .sort((a, b) => limits[a][1] - limits[b][1] || Number(seasonal.has(a)) - Number(seasonal.has(b)))
      .slice(0, 3).map(name => ({name, label: name + (seasonal.has(name) ? ' (май–октябрь)' : '')}));
  }
  function guestAdvice(hall, count) {
    const range = Object.hasOwn(limits, hall) ? limits[hall] : null;
    if (!range || !Number.isSafeInteger(count) || count < 1) {
      return {valid: false, message: 'Укажите число гостей целым числом, от 1.'};
    }
    if (count >= range[0] && count <= range[1]) return {valid: true, message: ''};
    if (hall === 'Помогите выбрать') {
      return {valid: true, message: 'Если гостей больше 200, позвоните: 8 (846) 979-95-95. Можно отправить заявку с вариантом «Помогите выбрать».'};
    }
    const suitable = recommendedVenues(count).map(venue => venue.label);
    const suggestion = suitable.length
      ? `По числу мест подойдут: ${suitable.join(', ')}. Можно выбрать «Помогите выбрать».`
      : 'Если гостей больше 200, позвоните: 8 (846) 979-95-95. Можно отправить заявку с вариантом «Помогите выбрать».';
    return {valid: hall === 'Помогите выбрать', message: `Для этой площадки от ${range[0]} до ${range[1]} гостей. ${suggestion}`};
  }
  function calculatorComment(values) {
    const c = values.calculation;
    if (!c || !Object.hasOwn(limits, c.hall) || !Number.isSafeInteger(c.guests) || typeof c.summary !== 'string') return '';
    const changed = values.hall !== c.hall || Number(values.guests) !== c.guests;
    return c.summary.slice(0, 500) + (changed ? ' (изменено в заявке)' : '');
  }
  function payload(values, requestId) {
    const calculation = calculatorComment(values);
    return {
      offer: 'wedding', name: values.name.trim(), phone: values.phone.trim(),
      // The existing handler accepts at most three digits. Preserve larger requests in the comment.
      guests: Number(values.guests) <= 999 ? String(Number(values.guests)) : '',
      policy_read: values.consent ? 'yes' : '', company: values.company,
      request_id: requestId,
      comment: (`Раздел сайта: Свадьбы. Запрос расчёта свадьбы\nПлощадка: ${values.hall}\nДата свадьбы: ${values.date}\nЧисло гостей: ${Number(values.guests)}` + (calculation ? '\n' + calculation : '')).slice(0, 1500)
    };
  }
  function formScrollDestination(rectTop, scrollY, viewportHeight, pageHeight) {
    return Math.max(0, Math.min(scrollY + rectTop - 24, pageHeight - viewportHeight));
  }
  function fieldReasons(values, now = new Date()) {
    const errors = {};
    if (!Object.hasOwn(limits, values.hall)) errors.hall = 'Выберите площадку.';
    if (!values.date) errors.date = 'Выберите дату свадьбы.';
    else if (!validDate(values.date, now)) errors.date = 'Выберите дату не раньше завтра.';
    const count = Number(values.guests);
    if (!values.guests || !Number.isSafeInteger(count) || count < 1) errors.guests = 'Укажите число гостей целым числом, от 1.';
    else if (Object.hasOwn(limits, values.hall) && !guestAdvice(values.hall, count).valid) errors.guests = `Для этой площадки от ${limits[values.hall][0]} до ${limits[values.hall][1]} гостей.`;
    const name = values.name.trim();
    if (!name) errors.name = 'Укажите имя.';
    else if (/\p{C}/u.test(name) || [...name].length > 80) errors.name = 'Укажите имя без служебных символов, до 80 знаков.';
    if (!validPhone(values.phone.trim())) errors.phone = 'Укажите телефон с кодом города или страны, например +7 (846) 979-95-95.';
    if (!values.consent) errors.consent = 'Отметьте согласие для ответа по заявке.';
    return errors;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {limits, messages, tomorrow, validDate, validPhone, guestAdvice, recommendedVenues, payload, calculatorComment, formScrollDestination, fieldReasons};
    return;
  }
  const form = document.getElementById('wedding-request');
  if (!form) return;
  const field = name => form.elements.namedItem(name);
  const result = form.querySelector('.request-result');
  const hint = document.getElementById('wedding-guest-hint');
  const submit = form.querySelector('[type="submit"]');
  let previousAttempt, calculation;
  const order = ['hall', 'date', 'guests', 'name', 'phone', 'consent'];
  const touched = new Set();
  let submitted = false;
  function readValues() {
    const values = Object.fromEntries(['hall', 'date', 'guests', 'name', 'phone', 'company'].map(name => [name, field(name).value]));
    values.consent = field('consent').checked;
    if (calculation) values.calculation = calculation;
    return values;
  }
  function syncValidation(force = false) {
    if (force) submitted = true;
    const values = readValues();
    const errors = fieldReasons(values);
    field('date').min = tomorrow();
    for (const name of order) {
      const show = submitted || touched.has(name);
      const reason = errors[name] || '';
      field(name).setCustomValidity(reason);
      field(name).setAttribute?.('aria-invalid', show && reason ? 'true' : 'false');
      const node = document.getElementById('error-' + name);
      if (node) node.textContent = show ? reason : '';
    }
    hint.textContent = values.guests ? guestAdvice(values.hall, Number(values.guests)).message : '';
    return errors;
  }
  let cancelFormScroll = () => {};
  function scrollToForm() {
    cancelFormScroll();
    const date = field('date');
    if (typeof window === 'undefined' || !form.getBoundingClientRect) { date.focus({preventScroll: true}); return; }
    const root = document.documentElement;
    const started = performance.now();
    let stopped = false, focused = false, frame;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = () => formScrollDestination(form.getBoundingClientRect().top, window.scrollY, window.innerHeight, root.scrollHeight);
    const instant = () => {
      const old = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo({top: top(), behavior: 'auto'});
      root.style.scrollBehavior = old;
    };
    const stop = () => {
      stopped = true; cancelAnimationFrame(frame);
      window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop);
      window.removeEventListener('pointerdown', stop); window.removeEventListener('keydown', onKey);
    };
    const onKey = event => { if (['Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stop(); };
    cancelFormScroll = stop;
    window.addEventListener('wheel', stop, {passive: true});
    window.addEventListener('touchstart', stop, {passive: true});
    window.addEventListener('pointerdown', stop, {passive: true});
    window.addEventListener('keydown', onKey);
    window.scrollTo({top: top(), behavior: reduced ? 'auto' : 'smooth'});
    function settle(now) {
      if (stopped) return;
      const elapsed = now - started;
      const offset = top() - window.scrollY;
      if ((reduced || elapsed > 900) && Math.abs(offset) > 3) instant();
      if (!focused && (Math.abs(top() - window.scrollY) < 4 || elapsed > 1000)) {
        date.focus({preventScroll: true}); focused = true;
      }
      if (elapsed >= 4500) { instant(); if (!focused) date.focus({preventScroll: true}); stop(); return; }
      frame = requestAnimationFrame(settle);
    }
    frame = requestAnimationFrame(settle);
  }
  function chooseHall(hall, navigate = false) {
    if (!Object.hasOwn(limits, hall)) return;
    field('hall').value = hall;
    if (typeof CustomEvent === 'function' && document.dispatchEvent) {
      document.dispatchEvent(new CustomEvent('wedding:form-hall', {detail: {hall}}));
    }
    syncValidation();
    result.textContent = '';
    if (navigate) scrollToForm();
  }
  document.addEventListener('wedding:hall-selected', event => chooseHall(event.detail.hall));
  document.addEventListener('wedding:calculation-selected', event => {
    const c = event.detail;
    if (!c || !Object.hasOwn(limits, c.hall) || !Number.isSafeInteger(c.guests) || c.guests < 1 || c.guests > 200 || typeof c.summary !== 'string') return;
    calculation = {hall: c.hall, guests: c.guests, summary: c.summary};
    field('guests').value = String(c.guests);
    if (window.location.hash !== '#request') window.history.pushState(null, '', '#request');
    chooseHall(c.hall, true);
  });
  // Works even if the gallery script could not initialize.
  document.querySelectorAll('a[href="#request"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0)) return;
      event?.preventDefault();
      if (typeof window !== 'undefined' && window.location.hash !== '#request') window.history.pushState(null, '', '#request');
      if (link.dataset.hall) chooseHall(link.dataset.hall, true);
      else scrollToForm();
    });
  });
  for (const name of order) {
    const validate = () => {touched.add(name); syncValidation();};
    field(name).addEventListener(name === 'hall' || name === 'consent' ? 'change' : 'input', validate);
    field(name).addEventListener('blur', validate);
  }
  syncValidation();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const errors = syncValidation(true);
    const firstError = order.find(name => errors[name]);
    if (firstError) { result.textContent = messages.invalid; field(firstError).focus(); return; }
    const values = readValues();
    const content = JSON.stringify(payload(values, ''));
    if (previousAttempt?.content !== content) previousAttempt = {content, id: crypto.randomUUID()};
    const data = new FormData();
    Object.entries(payload(values, previousAttempt.id)).forEach(([key, value]) => data.set(key, value));
    field('request_id').value = previousAttempt.id;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    result.textContent = messages.sending;
    try {
      const response = await fetch(form.action, {method: 'POST', body: data, credentials: 'same-origin', cache: 'no-store'});
      const outcome = await response.json();
      if (response.ok && outcome.result === 'sent') {
        form.reset(); previousAttempt = undefined; calculation = undefined; touched.clear(); submitted = false; syncValidation();
        result.textContent = messages.sent;
      } else if (response.status === 429) result.textContent = messages.limited;
      else if (response.status === 422 || response.status === 409) result.textContent = messages.invalid;
      else result.textContent = messages.failed;
    } catch { result.textContent = messages.failed; }
    finally { submit.disabled = false; form.removeAttribute('aria-busy'); }
  });
})();
