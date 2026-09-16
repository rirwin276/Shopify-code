/* Records the durable claim as the primary anonymous-demo conversion. */
(function () {
  'use strict';
  var key = 'ss_anonymous_demo_v1';
  var saved;
  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_e) { return; }
  if (!saved || !saved.token) return;
  var api = 'https://studio-uploader-production.up.railway.app';
  fetch(api + '/api/demo/status', {cache:'no-store', headers:{'Authorization':'Bearer ' + saved.token, 'Accept':'application/json'}})
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (state) {
      if (!state) return;
      if (state.phase === 'claimed') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event:'anonymous_demo_claimed',
          storefront_handle:state.storefront_handle || saved.handle || ''
        });
        try {
          localStorage.setItem('ss_anonymous_demo_claimed_v1', JSON.stringify({
            handle:state.storefront_handle || saved.handle || '',
            claimedAt:Date.now()
          }));
          localStorage.removeItem(key);
        } catch (_e) {}
      } else if (state.phase === 'expired' || state.phase === 'failed') {
        try { localStorage.removeItem(key); } catch (_e) {}
      }
    }).catch(function () {});
})();
