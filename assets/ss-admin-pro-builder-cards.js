/* Stella & Sage — Admin Pro Builder Cards */
(function () {
  'use strict';

  var VERSION = 'pro-builder-registry-v6';
  var RAILWAY_BASE = 'https://printfulautomation-production.up.railway.app';

  var IMAGE_URLS = {
    bc3413: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3413-front-clay-triblend.png?v=1777937830',
    bc3001y: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3001y-front-natural_dd41b37c-8fb7-4aec-bb0d-9191145a77ca.png?v=1778476357',
    m2580: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2580-front-latte.png?v=1778444002',
    ls14003: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ls14003_front_editor_background_style28668.png?v=1779070307',
    cc1717: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/cc1717-front-pepper.png?v=1780468020'
  };

  var BUILDERS = [
    { id: 'bc3413', title: 'Bella + Canvas BC3413', subtitle: 'Custom unisex tri-blend tee · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/bc3413', fixedImage: IMAGE_URLS.bc3413, tipTitle: 'Bella + Canvas BC3413', tipBody: 'Premium unisex tri-blend tee with custom front or front + back artwork and up to 2 garment colors.' },
    { id: 'bc3001y', title: 'Bella + Canvas BC3001Y', subtitle: 'Custom youth staple tee · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/bc3001y', fixedImage: IMAGE_URLS.bc3001y, tipTitle: 'Bella + Canvas BC3001Y', tipBody: 'Youth staple tee with custom front or front + back artwork, color selection, and a separate store listing.' },
    { id: 'm2580', title: 'Independent Trading Co. M2580', subtitle: 'Custom premium hoodie · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/m2580', fixedImage: IMAGE_URLS.m2580, tipTitle: 'Independent Trading Co. M2580', tipBody: 'Premium pullover hoodie with custom front or front + back artwork and up to 2 hoodie colors.' },
    { id: 'ls14003', title: 'Lane Seven LS14003', subtitle: 'Custom full zip hoodie · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/ls14003', fixedImage: IMAGE_URLS.ls14003, tipTitle: 'Lane Seven LS14003', tipBody: 'Full zip hoodie with custom front or front + back artwork, up to 2 garment colors, and a separate store listing.' },
    { id: 'cc1717', title: 'Comfort Colors CC1717', subtitle: 'Custom heavyweight garment-dyed tee · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/cc1717', fixedImage: IMAGE_URLS.cc1717, tipTitle: 'Comfort Colors CC1717', tipBody: 'Premium heavyweight garment-dyed tee with custom front or front + back artwork and up to 2 garment colors.' }
  ];

  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn(); }
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
    card.className = 'ap-product-row ap-add-product-row ss-pro-builder-card';
    card.setAttribute('data-ss-builder-id', builder.id);

    var tid = 'ss-pro-builder-tip-' + builder.id;
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
    btn.textContent = '✨ Add to Store';
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

  function injectStyles() {
    if ($('#ss-pro-builder-card-styles')) return;
    var style = document.createElement('style');
    style.id = 'ss-pro-builder-card-styles';
    style.textContent = '.ss-pro-builder-card{position:relative!important;border:2px dashed rgba(183,163,106,.34)!important;background:rgba(183,163,106,.075)!important;overflow:visible!important}.ss-pro-builder-card:hover{border-color:rgba(183,163,106,.58)!important;background:rgba(183,163,106,.105)!important}.ss-pro-builder-thumb{width:64px;height:64px;border-radius:18px;flex:0 0 auto;display:grid;place-items:center;background:#f5f1e8;overflow:hidden;border:1px solid rgba(17,16,14,.10);box-shadow:0 10px 26px rgba(17,16,14,.08)}.ss-pro-builder-thumb img{width:100%;height:100%;object-fit:cover;display:block}.ss-pro-builder-copy{flex:1;min-width:0}.ss-pro-builder-title{font-size:15px;font-weight:900;color:var(--ap-text,#11100e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.02em}.ss-pro-builder-subtitle{font-size:12px;color:var(--ap-gray,rgba(17,16,14,.55));margin-top:4px;line-height:1.35;font-weight:600}.ss-pro-builder-actions{width:auto!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:8px!important;flex:0 0 auto!important;margin-top:0!important}.ss-pro-builder-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 18px;background:#11100e;color:#fff;border:1px solid rgba(183,163,106,.22);border-radius:999px;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 14px 34px rgba(17,16,14,.14);white-space:nowrap}.ss-pro-builder-button:hover{background:#28251e;transform:translateY(-1px)}.ss-pro-builder-tooltip{display:none;position:absolute;left:50%;bottom:calc(100% + 12px);transform:translateX(-50%);width:min(320px,calc(100vw - 40px));padding:14px 16px;background:#11100e;color:rgba(255,255,255,.82);border:1px solid rgba(183,163,106,.22);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);font-size:12px;line-height:1.45;text-align:left;z-index:10090;pointer-events:none}.ss-pro-builder-tooltip:after{content:"";position:absolute;left:50%;top:100%;width:12px;height:12px;background:#11100e;transform:translate(-50%,-6px) rotate(45deg);border-right:1px solid rgba(183,163,106,.18);border-bottom:1px solid rgba(183,163,106,.18)}.ss-pro-builder-tooltip strong{display:block;color:#fff;font-size:13px;font-weight:950;margin-bottom:6px}.ss-pro-builder-card:hover>.ss-pro-builder-tooltip,.ss-pro-builder-card:focus-within>.ss-pro-builder-tooltip{display:block}@media(max-width:700px){.ss-pro-builder-tooltip{display:none!important}.ss-pro-builder-card{display:grid!important;grid-template-columns:74px minmax(0,1fr)!important;gap:12px!important;align-items:center!important}.ss-pro-builder-thumb{width:74px;height:74px;border-radius:20px}.ss-pro-builder-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.ss-pro-builder-actions{grid-column:1/-1!important;width:100%!important}.ss-pro-builder-button{width:100%;min-height:46px}}';
    document.head.appendChild(style);
  }

  function findContainer() { return $('#apCustomBuildersContainer'); }

  function renderCards(force) {
    var container = findContainer();
    var section = $('#apCustomBuildersSection');
    var empty = $('#apCustomBuildersEmpty');
    var count = $('#apBuilderProductCount');

    if (!container) return false;
    if (!force && container.getAttribute('data-ss-pro-builder-version') === VERSION && container.children.length === BUILDERS.length) return true;

    injectStyles();
    container.innerHTML = '';
    BUILDERS.forEach(function (b) { container.appendChild(makeCard(b)); });
    container.setAttribute('data-ss-pro-builder-version', VERSION);

    if (section) section.style.display = 'block';
    if (empty) empty.style.display = 'none';
    if (count) count.textContent = String(BUILDERS.length);
    return true;
  }

  function shouldTryAdminPatch() {
    return window.location.pathname.indexOf('/pages/admin-powers') !== -1 || !!$('#apPanelAddProducts') || !!findContainer();
  }

  function boot() {
    var attempts = 0;
    var maxAttempts = 240; // 30 seconds at 125ms

    var timer = window.setInterval(function () {
      attempts += 1;
      if (shouldTryAdminPatch()) renderCards(false);
      if (attempts >= maxAttempts) window.clearInterval(timer);
    }, 125);

    var observer = new MutationObserver(function () {
      if (!shouldTryAdminPatch()) return;
      var container = findContainer();
      if (!container) return;
      if (container.getAttribute('data-ss-pro-builder-version') !== VERSION || container.children.length !== BUILDERS.length) {
        window.setTimeout(function () { renderCards(true); }, 30);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  ready(boot);
})();
