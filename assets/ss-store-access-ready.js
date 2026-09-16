/* Wait for the same Liquid access gate used by the store, not a fixed delay. */
(function () {
  'use strict';
  window.SSWaitForStoreAccess = function (options) {
    var status = options.status;
    var button = options.button;
    var destination = new URL(options.storeUrl, window.location.origin);
    if (destination.origin !== window.location.origin || !/^\/collections\/[^/]+\/?$/.test(destination.pathname)) return;
    destination.search = '';
    destination.hash = '';
    var handle = decodeURIComponent(destination.pathname.split('/')[2]);
    var started = Date.now();
    var finished = false;
    var pending = false;
    button.disabled = true;
    button.textContent = 'Opening your store…';
    status.style.opacity = '1';
    status.style.color = '';
    status.textContent = options.requireAdmin
      ? 'Store claimed! Syncing your admin access with Shopify…'
      : 'You’re added! Syncing your store access with Shopify…';

    function retry() {
      if (finished) return;
      if (Date.now() - started >= 120000) {
        finished = true;
        status.textContent = 'Your access is saved. Shopify is still syncing it—check again in a moment. You do not need to claim again.';
        button.disabled = false;
        button.textContent = 'Check my store access';
        button.onclick = function () { window.SSWaitForStoreAccess(options); };
        return;
      }
      if (Date.now() - started > 20000) status.textContent = 'Your access is saved. Still waiting for Shopify to finish syncing—we’ll open your store automatically.';
      window.setTimeout(check, 2000);
    }

    function check() {
      if (finished || pending) return;
      pending = true;
      var controller = new AbortController();
      var timeout = window.setTimeout(function () { controller.abort(); }, 8000);
      var probe = new URL(destination.toString());
      probe.searchParams.set('ss_access_check', String(Date.now()));
      fetch(probe.toString(), {credentials: 'same-origin', cache: 'no-store', signal: controller.signal})
        .then(function (response) { return response.ok ? response.text() : ''; })
        .then(function (html) {
          if (!html) return;
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var marker = doc.querySelector('[data-ss-store-access][data-ss-store-handle]');
          if (!marker || marker.getAttribute('data-ss-store-handle') !== handle) return;
          var role = marker.getAttribute('data-ss-store-access');
          if (role !== 'admin' && (options.requireAdmin || role !== 'member')) return;
          finished = true;
          status.textContent = 'Access is ready. Opening your store…';
          // No preview parameter or access bypass: Liquid has confirmed membership.
          if (window.__ssStoreAccessNavigate) window.__ssStoreAccessNavigate(destination.pathname);
          else window.location.replace(destination.pathname);
        })
        .catch(function () {})
        .finally(function () {
          window.clearTimeout(timeout);
          pending = false;
          retry();
        });
    }
    check();
  };
})();
