(function(w) {
  'use strict';
  var options = {
    providers: [['21872']],
    container: 'tl-search-form',
    adults: '2',
    language: 'ru',
    nights: 1,
    onsubmit: function(params, url) {
      var destination = new URL('booking/', w.location.href);
      destination.search = new URL(url, w.location.href).search;
      return destination.href;
    },
    oncomplete: function() {
      var frame = document.querySelector('#tl-search-form iframe');
      if (!frame) return;
      frame.title = 'Выбор дат и гостей: TravelLine, парк-отель Дубрава';
    }
  };
  var q = [['setContext', 'TL-EXPRESS.express-new-aa', 'ru'], ['embed', 'search-form', options]];
  var hosts = ['ru-ibe.tlintegration.ru', 'ibe.tlintegration.ru', 'ibe.tlintegration.com'];
  var t = w.travelline = w.travelline || {};
  var ti = t.integration = t.integration || {};
  ti.__cq = ti.__cq ? ti.__cq.concat(q) : q;
  if (ti.__loader) return;
  ti.__loader = true;
  (function next(list) {
    if (!list.length) return;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://' + list[0] + '/integration/loader.js';
    script.onerror = script.onload = function() {
      if (!w.TL) {
        script.remove();
        next(list.slice(1));
      }
    };
    document.head.appendChild(script);
  })(hosts);
})(window);
