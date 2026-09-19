/* Device-local return banner for the active anonymous preview. */
(function () {
  'use strict';
  var root = document.querySelector('[data-ss-preview-return]');
  if (!root) return;
  var key = 'ss_anonymous_demo_v1';
  var waitingRoom = '/pages/request-storefront-form?view=start-team-store';
  var link = root.querySelector('[data-preview-return-link]');
  var title = root.querySelector('[data-preview-return-title]');
  var detail = root.querySelector('[data-preview-return-detail]');
  var action = root.querySelector('[data-preview-return-action]');
  var claim = root.querySelector('[data-preview-return-claim]');
  var logo = root.querySelector('[data-preview-return-logo]');
  var fallback = root.querySelector('[data-preview-return-fallback]');
  var allowedApis = ['https://studio-uploader-production.up.railway.app', 'https://anonymous-demo-preview-production.up.railway.app'];
  var configuredApi = String(root.getAttribute('data-api-base') || '').replace(/\/+$/, '');
  var saved = null;
  var refreshTimer = null;

  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
  if (!saved || typeof saved.token !== 'string' || !saved.token || saved.claimedAt) return;
  var savedApi = String(saved.apiBase || '').replace(/\/+$/, '');
  var api = allowedApis.indexOf(savedApi) !== -1 ? savedApi :
    (allowedApis.indexOf(configuredApi) !== -1 ? configuredApi : allowedApis[1]);

  function showLogo(state) {
    var source = '';
    if (/^data:image\/(png|jpeg|webp);base64,/.test(String(saved.logoThumb || ''))) source = saved.logoThumb;
    else if (state && state.logo_url) {
      try {
        var url = new URL(state.logo_url, api + '/');
        if (url.origin === api && url.pathname.indexOf('/preview/') === 0) source = url.href;
      } catch (_) {}
    }
    if (!source || logo.getAttribute('src') === source) return;
    logo.onload = function () { logo.hidden = false; fallback.hidden = true; };
    logo.onerror = function () { logo.hidden = true; fallback.hidden = false; };
    logo.src = source;
  }

  function forget() {
    if (refreshTimer) window.clearInterval(refreshTimer);
    try { localStorage.removeItem(key); } catch (_) {}
    try { document.cookie = 'ss_anonymous_demo_resume=; Max-Age=0; Path=/; SameSite=Lax; Secure'; } catch (_) {}
    root.hidden = true;
  }

  function sameStore(state) {
    var returned = String(state.storefront_handle || '');
    return /^[a-z0-9][a-z0-9-]{0,127}$/.test(returned) && (!saved.handle || String(saved.handle) === returned);
  }

  function showBuilding() {
    root.dataset.phase = 'building';
    root.hidden = false;
    link.href = waitingRoom;
    title.textContent = saved.storeName ? saved.storeName + ' is building' : 'Your preview store is building';
    detail.textContent = 'Return anytime from this device.';
    action.textContent = 'Return to waiting room →';
    claim.hidden = true;
  }

  function showReady(state) {
    root.dataset.phase = 'ready';
    root.hidden = false;
    title.textContent = (state.storefront_name || saved.storeName || 'Your preview store') + ' is ready';
    detail.textContent = 'Try it out, or sign in to claim it today.';
    action.textContent = 'Try your store →';
    // Use the verified handle and existing routes; never put the resume token in a link.
    link.href = '/collections/' + encodeURIComponent(state.storefront_handle) + '?preview=1';
    claim.href = '/pages/join-store?shop=' + encodeURIComponent(state.storefront_handle);
    claim.textContent = root.getAttribute('data-signed-in') === 'true' ? 'Claim your store' : 'Sign in & claim';
    claim.hidden = false;
  }

  async function refresh() {
    try {
      var response = await fetch(api + '/api/demo/status', {cache:'no-store', headers:{Authorization:'Bearer ' + saved.token, Accept:'application/json'}});
      if ([401, 404, 410].indexOf(response.status) !== -1) { forget(); return; }
      if (!response.ok) return;
      var state = await response.json();
      if (!sameStore(state)) { forget(); return; }
      showLogo(state);
      if (state.phase === 'ready') showReady(state);
      else if (state.phase === 'claimed' || state.phase === 'expired') forget();
      else if (state.phase === 'failed') {
        showBuilding();
        root.dataset.phase = 'failed';
        title.textContent = 'Your store needs another try';
        detail.textContent = 'Open your saved build for the next step.';
        action.textContent = 'Check your build →';
      }
      else showBuilding();
    } catch (_) {}
  }

  showBuilding();
  showLogo();
  refresh();
  refreshTimer = window.setInterval(refresh, 15000);
})();
