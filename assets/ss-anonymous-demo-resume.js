/* Shows a small same-browser resume card on the public homepage. */
(function () {
  'use strict';
  var cfg = document.querySelector('[data-ss-anonymous-demo-resume]');
  if (!cfg) return;
  var saved;
  try { saved = JSON.parse(localStorage.getItem('ss_anonymous_demo_v1') || 'null'); } catch (_e) { return; }
  if (!saved || !saved.token) return;
  var api = String(cfg.getAttribute('data-api-base') || '').replace(/\/+$/, '');
  fetch(api + '/api/demo/status', {cache:'no-store', headers:{'Authorization':'Bearer ' + saved.token, 'Accept':'application/json'}})
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (state) {
      if (!state || ['failed','expired','claimed'].indexOf(state.phase) !== -1) return;
      var actions = document.querySelector('.ss-hero-actions');
      if (!actions || document.querySelector('[data-ss-demo-resume-card]')) return;
      var card = document.createElement('a');
      card.setAttribute('data-ss-demo-resume-card','');
      card.className = 'ss-demo-resume-card';
      card.href = (cfg.getAttribute('data-resume-path') || '/pages/start-team-store') + '#resume=' + encodeURIComponent(saved.token);
      var title = document.createElement('strong');
      title.textContent = state.phase === 'ready' ? 'Your demo store is ready →' : 'Your demo store is building →';
      var detail = document.createElement('span');
      detail.textContent = state.storefront_name || saved.storeName || 'Continue your store';
      card.appendChild(title); card.appendChild(detail); actions.insertAdjacentElement('afterend', card);
    }).catch(function () {});
})();
