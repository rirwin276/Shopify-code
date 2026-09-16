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
  var api = String(root.getAttribute('data-api-base') || '').replace(/\/+$/, '');
  var saved = null;
  var refreshTimer = null;

  try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
  if (!saved || !saved.token) return;

  function forget() {
    if (refreshTimer) window.clearInterval(refreshTimer);
    try { localStorage.removeItem(key); } catch (_) {}
    try { document.cookie = 'ss_anonymous_demo_resume=; Max-Age=0; Path=/; SameSite=Lax; Secure'; } catch (_) {}
    root.hidden = true;
  }

  function sameStore(state) {
    var returned = String(state.storefront_handle || '');
    return !saved.handle || !returned || String(saved.handle) === returned;
  }

  function showBuilding() {
    root.dataset.phase = 'building';
    root.hidden = false;
    link.href = waitingRoom;
    title.textContent = saved.storeName ? saved.storeName + ' is building' : 'Your preview store is building';
    detail.textContent = 'Return anytime from this device.';
    action.textContent = 'Return to waiting room →';
  }

  function showReady(state) {
    root.dataset.phase = 'ready';
    root.hidden = false;
    title.textContent = (state.storefront_name || saved.storeName || 'Your preview store') + ' is ready';
    detail.textContent = 'Your products are ready to explore.';
    action.textContent = 'Check out your preview store →';
    try {
      var destination = new URL(state.preview_url || waitingRoom, location.origin);
      link.href = destination.origin === location.origin ? destination.href : waitingRoom;
    } catch (_) { link.href = waitingRoom; }
  }

  async function refresh() {
    try {
      var response = await fetch(api + '/api/demo/status', {cache:'no-store', headers:{Authorization:'Bearer ' + saved.token, Accept:'application/json'}});
      if ([401, 404, 410].indexOf(response.status) !== -1) { forget(); return; }
      if (!response.ok) return;
      var state = await response.json();
      if (!sameStore(state)) { forget(); return; }
      if (state.phase === 'ready') showReady(state);
      else if (state.phase === 'claimed' || state.phase === 'expired') forget();
      else showBuilding();
    } catch (_) {}
  }

  showBuilding();
  refresh();
  refreshTimer = window.setInterval(refresh, 15000);
})();
