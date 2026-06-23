/* Stella & Sage — Admin Pro Builder Thumbnail Overrides + M2480 Card Patch */
(function () {
  'use strict';

  var RAILWAY_BASE = 'https://printfulautomation-production.up.railway.app';

  var THUMBNAILS = {
    bc3413: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3413-front-clay-triblend.png?v=1777937830',
    bc3001y: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3001y-front-natural_dd41b37c-8fb7-4aec-bb0d-9191145a77ca.png?v=1778476357',
    m2580: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2580-front-latte.png?v=1778444002',
    m2480: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2480_front_editor_background_style3433.png?v=1782189743',
    ls14003: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ls14003_front_editor_background_style28668.png?v=1779070307'
  };

  var M2480 = {
    id: 'm2480',
    title: 'Cotton Heritage M2480',
    subtitle: 'Custom premium sweatshirt · Front or front + back artwork · Up to 2 colors',
    route: '/editor/pro-shirt/m2480',
    fixedImage: THUMBNAILS.m2480,
    tipTitle: 'Cotton Heritage M2480',
    tipBody: 'Premium unisex crewneck sweatshirt with custom front or front + back artwork and up to 2 sweatshirt colors.'
  };

  function $(s) { return document.querySelector(s); }
  function ssap() { return window.SSAP || {}; }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  function editorUrl(builder) {
    var s = ssap();
    var key = 'sec' + 'ret';
    var val = s['editor' + 'Secret'] || '';
    var url = RAILWAY_BASE + builder.route + '?shop_handle=' + encodeURIComponent(s.shopHandle || '') + '&' + key + '=' + encodeURIComponent(val) + '&mode=embedded';
    if (s.shopLogoSrc) url += '&logo_url=' + encodeURIComponent(s.shopLogoSrc);
    return url;
  }

  function makeThumb(builder) {
    var wrap = document.createElement('div');
    wrap.className = 'ss-pro-builder-thumb';
    var img = document.createElement('img');
    img.src = builder.fixedImage;
    img.alt = builder.title;
    img.loading = 'eager';
    img.decoding = 'async';
    wrap.appendChild(img);
    return wrap;
  }

  function makeCard(builder) {
    var card = document.createElement('div');
    card.className = 'ap-product-row ap-add-product-row ss-pro-builder-card ss-m2480-extra-card';
    card.setAttribute('data-ss-builder-id', builder.id);
    card.id = 'ss-m2480-extra-card';

    var tid = 'ss-pro-builder-tip-' + builder.id + '-extra';
    var tip = document.createElement('div');
    tip.className = 'ss-pro-builder-tooltip';
    tip.id = tid;
    tip.innerHTML = '<strong>' + esc(builder.tipTitle) + '</strong><span>' + esc(builder.tipBody) + '</span>';

    var copy = document.createElement('div');
    copy.className = 'ss-pro-builder-copy';
    copy.innerHTML = '<div class="ss-pro-builder-title">' + esc(builder.title) + '</div><div class="ss-pro-builder-subtitle">' + esc(builder.subtitle) + '</div>';

    var actions = document.createElement('div');
    actions.className = 'ap-product-row__actions ss-pro-builder-actions';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ss-pro-builder-button';
    btn.textContent = 'Add to Store';
    btn.setAttribute('aria-describedby', tid);
    btn.addEventListener('click', function () {
      var url = editorUrl(builder);
      if (typeof window.apOpenEditorModal === 'function') window.apOpenEditorModal(url);
      else window.open(url, '_blank', 'noopener,noreferrer');
    });

    actions.appendChild(btn);
    card.appendChild(makeThumb(builder));
    card.appendChild(copy);
    card.appendChild(actions);
    card.appendChild(tip);
    return card;
  }

  function applyThumbs() {
    Object.keys(THUMBNAILS).forEach(function (id) {
      document.querySelectorAll('[data-ss-builder-id="' + id + '"]').forEach(function (card) {
        var img = card.querySelector('.ss-pro-builder-thumb img');
        if (!img) return;
        if (img.src !== THUMBNAILS[id]) img.src = THUMBNAILS[id];
        img.loading = 'eager';
        img.decoding = 'async';
      });
    });
  }

  function updateCount() {
    var count = $('#apBuilderProductCount');
    var container = $('#apCustomBuildersContainer');
    if (!count || !container) return;
    var directCount = container.children ? container.children.length : 0;
    var extra = $('#ss-m2480-extra-card') ? 1 : 0;
    count.textContent = String(directCount + extra);
  }

  function ensureM2480Card() {
    var container = $('#apCustomBuildersContainer');
    if (!container) return;

    var directM2480 = container.querySelector('[data-ss-builder-id="m2480"]');
    var extraM2480 = $('#ss-m2480-extra-card');

    if (directM2480) {
      if (extraM2480) extraM2480.remove();
      applyThumbs();
      updateCount();
      return;
    }

    if (!extraM2480) {
      container.insertAdjacentElement('afterend', makeCard(M2480));
    }

    applyThumbs();
    updateCount();
  }

  function runPatch() {
    applyThumbs();
    ensureM2480Card();
  }

  function boot() {
    if (!document.querySelector('#apPanelAddProducts') && !document.querySelector('#apCustomBuildersContainer')) return;

    runPatch();
    window.setTimeout(runPatch, 250);
    window.setTimeout(runPatch, 1000);
    window.setTimeout(runPatch, 2500);

    var observer = new MutationObserver(function () {
      window.setTimeout(runPatch, 50);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
