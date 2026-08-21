/* Enables the Try the Admin CTA only for a live, server-confirmed prospect. */
(function () {
  'use strict';
  var cta = document.querySelector('[data-ss-prospect-demo-cta]');
  if (!cta) return;
  var handle = String(cta.getAttribute('data-shop-handle') || '').trim().toLowerCase();
  if (!handle) return;
  var base = '/apps/ss/relay/prospect/' + encodeURIComponent(handle);

  function event(token, name) {
    if (!token) return;
    fetch(base + '/event', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({demo_token: token, event: name}), keepalive: true
    }).catch(function () {});
  }

  fetch(base + '/state', {cache: 'no-store'})
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (state) {
      if (!state || state.enabled !== true || !state.demo_token) return;
      var token = state.demo_token;
      event(token, 'prospect_store_opened');
      cta.hidden = false;
      if (state.product_status === 'completed') {
        cta.textContent = 'Claim Your Store';
        cta.href = cta.getAttribute('data-claim-url') || cta.href;
        cta.setAttribute('data-prospect-claim', '1');
        cta.addEventListener('click', function () { event(token, 'authentication_started'); });
      }
      document.querySelectorAll('a[href*="/pages/join-store"]').forEach(function (link) {
        link.addEventListener('click', function () { event(token, 'authentication_started'); });
      });
    })
    .catch(function () {});
})();
