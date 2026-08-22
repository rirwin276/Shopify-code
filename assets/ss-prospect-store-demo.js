/* Enables the Try the Admin CTA only for a live, server-confirmed prospect. */
(function () {
  'use strict';
  var ctas = Array.prototype.slice.call(
    document.querySelectorAll('[data-ss-prospect-demo-cta]')
  );
  if (!ctas.length) return;
  var handle = String(ctas[0].getAttribute('data-shop-handle') || '').trim().toLowerCase();
  if (!handle) return;
  var base = '/apps/ss/relay/prospect/' + encodeURIComponent(handle);

  function event(token, name) {
    if (!token) return;
    fetch(base + '/event', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({demo_token: token, event: name}), keepalive: true
    }).catch(function () {});
  }

  // The button may be wrapped so its hover note can be positioned against it.
  // Revealing the anchor alone would leave that wrapper hidden and the button
  // invisible, so unhide whichever element is actually holding it back.
  function reveal(cta) {
    var wrap = cta.closest('[data-ss-prospect-demo-wrap]');
    if (wrap) wrap.hidden = false;
    cta.hidden = false;
  }

  fetch(base + '/state', {cache: 'no-store'})
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (state) {
      if (!state || state.enabled !== true || !state.demo_token) return;
      var token = state.demo_token;
      event(token, 'prospect_store_opened');
      ctas.forEach(function (cta) {
        reveal(cta);
        if (state.product_status === 'completed') {
          cta.textContent = 'Claim Your Store';
          cta.href = cta.getAttribute('data-claim-url') || cta.href;
          cta.setAttribute('data-prospect-claim', '1');
          cta.addEventListener('click', function () { event(token, 'authentication_started'); });
          var note = cta.parentNode && cta.parentNode.querySelector('.ps-demo-note');
          if (note) {
            note.textContent = 'You have already built a product here. Claim the store to keep it and unlock the full set of tools.';
          }
        }
      });
      document.querySelectorAll('a[href*="/pages/join-store"]').forEach(function (link) {
        link.addEventListener('click', function () { event(token, 'authentication_started'); });
      });
    })
    .catch(function () {});
})();
