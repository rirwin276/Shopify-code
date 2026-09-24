/* A welcome note, not a simulated personal reply or a private demo inbox. */
(function () {
  'use strict';
  var entry = document.querySelector('[data-ss-welcome-open]');
  var tab = document.getElementById('apTabBtnMessages');
  if (!entry || !tab) return;
  var cfg = window.SSAP || {};
  // Keep the same welcome state through demo -> claim on this device.
  var key = 'ss-store-welcome-v1:' + (cfg.shopHandle || cfg.collectionHandle || '');
  try { entry.hidden = localStorage.getItem(key) === 'read'; } catch (_) {}
  function read() {
    entry.hidden = true;
    try { localStorage.setItem(key, 'read'); } catch (_) {}
  }
  tab.addEventListener('click', read);
  entry.addEventListener('click', function () {
    tab.click();
    var panel = document.getElementById('apPanelMessages');
    if (panel) {
      panel.scrollIntoView({block:'start', behavior:'auto'});
      var note = panel.querySelector('.ss-store-welcome');
      if (note) { note.setAttribute('tabindex', '-1'); note.focus({preventScroll:true}); }
    }
  });
  if (tab.getAttribute('aria-selected') === 'true') read();
})();
