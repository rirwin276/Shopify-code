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
      // Try the admin stays the way into the admin for the whole visit. It
      // used to become the claim button once the free product existed, which
      // took away the thing the visitor had just been shown working — right at
      // the moment they were most interested in looking around. Claiming is the
      // separate button below it, so both are reachable at once.
      ctas.forEach(function (cta) {
        reveal(cta);
        if (state.product_status !== 'completed') return;
        var note = cta.parentNode && cta.parentNode.querySelector('.ps-demo-note');
        if (note) {
          note.textContent = 'Your product is live. Keep exploring the admin and open any builder you like.';
        }
      });
      document.querySelectorAll('a[href*="/pages/join-store"]').forEach(function (link) {
        link.addEventListener('click', function () { event(token, 'authentication_started'); });
      });
    })
    .catch(function () {});
})();
