/* Stella & Sage — Admin Pro Builder Thumbnail Overrides */
(function () {
  'use strict';

  var THUMBNAILS = {
    bc3413: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3413-front-clay-triblend.png?v=1777937830',
    bc3001y: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3001y-front-natural_dd41b37c-8fb7-4aec-bb0d-9191145a77ca.png?v=1778476357',
    m2580: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2580-front-latte.png?v=1778444002',
    ls14003: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ls14003_front_editor_background_style28668.png?v=1779070307'
  };

  function applyThumbs() {
    Object.keys(THUMBNAILS).forEach(function (id) {
      var card = document.querySelector('[data-ss-builder-id="' + id + '"]');
      if (!card) return;
      var img = card.querySelector('.ss-pro-builder-thumb img');
      if (!img) return;
      if (img.src !== THUMBNAILS[id]) img.src = THUMBNAILS[id];
      img.loading = 'eager';
      img.decoding = 'async';
    });
  }

  function boot() {
    if (!document.querySelector('#apPanelAddProducts') && !document.querySelector('#apCustomBuildersContainer')) return;

    applyThumbs();
    window.setTimeout(applyThumbs, 250);
    window.setTimeout(applyThumbs, 1000);

    var observer = new MutationObserver(function () {
      window.setTimeout(applyThumbs, 30);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
