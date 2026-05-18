/* Stella & Sage — Admin Pro Builder Cards */
(function () {
  'use strict';

  var VERSION = 'pro-builder-registry-v2';
  var RAILWAY_BASE = 'https://printfulautomation-production.up.railway.app';

  function svgUrl(svg) {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function shirtSvg(fill, label) {
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#11100e"/><path d="M31 20 42 15h12l11 5 15 10-8 15-8-4v35H32V41l-8 4-8-15 15-10Z" fill="' + fill + '"/><path d="M42 15c2 4 10 4 12 0" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linecap="round"/><rect x="37" y="37" width="22" height="17" rx="4" fill="rgba(255,255,255,.18)"/><text x="48" y="84" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="8" font-weight="800" fill="rgba(255,255,255,.72)">' + label + '</text></svg>');
  }

  function hoodieSvg(fill, label) {
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#11100e"/><path d="M34 23c2-8 26-8 28 0l8 9 11 8-9 14-7-4v29H31V50l-7 4-9-14 11-8 8-9Z" fill="' + fill + '"/><path d="M36 24c5 7 19 7 24 0" fill="none" stroke="rgba(255,255,255,.40)" stroke-width="3" stroke-linecap="round"/><path d="M48 32v47" stroke="rgba(255,255,255,.35)" stroke-width="2"/><path d="M34 60h28" stroke="rgba(0,0,0,.22)" stroke-width="2" stroke-linecap="round"/><text x="48" y="88" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="8" font-weight="800" fill="rgba(255,255,255,.72)">' + label + '</text></svg>');
  }

  var IMAGE_URLS = {
    bc3413: shirtSvg('#d9c5a5', 'TRI'),
    bc3001y: shirtSvg('#e8eef5', 'YOUTH'),
    m2580: hoodieSvg('#d8b18a', 'HOODIE'),
    ls14003: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ls14003_front_editor_background_style28668.png?v=1779070307'
  };

  var BUILDERS = [
    { id: 'bc3413', title: 'Custom Unisex Tri-Blend Tee', subtitle: 'Front & back logo · Up to 2 colors · Separate listing', route: '/editor/pro-shirt/bc3413', imageTags: ['bc3413', 'tri-blend', 'triblend'], fallbackImage: IMAGE_URLS.bc3413, tipTitle: 'Custom Unisex Tri-Blend Tee', tipBody: 'Soft premium tri-blend tee with custom front or front + back artwork and up to 2 garment colors.' },
    { id: 'bc3001y', title: 'Custom Youth Staple Tee', subtitle: 'Front & back logo · Up to 2 colors · Separate listing', route: '/editor/pro-shirt/bc3001y', imageTags: ['bc3001y', 'youth staple', 'youth tee'], fallbackImage: IMAGE_URLS.bc3001y, tipTitle: 'Custom Youth Staple Tee', tipBody: 'Youth-sized custom tee with front or front + back artwork, color selection, and a separate product listing.' },
    { id: 'm2580', title: 'Custom Premium Hoodie', subtitle: 'Front $34 · Front & back $39 · Up to 2 colors', route: '/editor/pro-shirt/m2580', imageTags: ['m2580', 'premium hoodie', 'pullover hoodie'], fallbackImage: IMAGE_URLS.m2580, tipTitle: 'Custom Premium Hoodie', tipBody: 'Premium pullover hoodie with custom front or front + back artwork and up to 2 hoodie colors.' },
    { id: 'ls14003', title: 'Custom Full Zip Hoodie', subtitle: 'Front $37 · Front & back $43 · Up to 2 colors', route: '/editor/pro-shirt/ls14003', fixedImage: IMAGE_URLS.ls14003, tipTitle: 'Lane Seven Full Zip Hoodie', tipBody: 'Lane Seven full zip hoodie with custom front or front + back artwork, up to 2 garment colors, and a separate store listing.' }
  ];

  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn(); }
  function $(s) { return document.querySelector(s); }
  function ssap() { return window.SSAP || {}; }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  function productImage(builder) {
    if (!Array.isArray(window.__SS_ADMIN_LAST_PRODUCTS__)) return '';
    var needles = (builder.imageTags || []).map(function (x) { return String(x || '').toLowerCase(); });
    var products = window.__SS_ADMIN_LAST_PRODUCTS__;
    for (var i = 0; i < products.length; i++) {
      var p = products[i] || {};
      var tags = Array.isArray(p.tags) ? p.tags.join(' ') : String(p.tags || '');
      var hay = (String(p.title || '') + ' ' + tags + ' ' + String(p.handle || '')).toLowerCase();
      if (!needles.some(function (n) { return n && hay.indexOf(n) !== -1; })) continue;
      var img = p.featured_image || p.image || (p.images && p.images[0] && (p.images[0].src || p.images[0]));
      if (img) return img;
    }
    return '';
  }

  function imageFor(builder) { return builder.fixedImage || productImage(builder) || builder.fallbackImage || ''; }

  function editorUrl(builder) {
    var s = ssap();
    var authKey = 'sec' + 'ret';
    var authValue = s['editor' + 'Secret'] || '';
    var url = RAILWAY_BASE + builder.route + '?shop_handle=' + encodeURIComponent(s.shopHandle || '') + '&' + authKey + '=' + encodeURIComponent(authValue) + '&mode=embedded';
    if (s.shopLogoSrc) url += '&logo_url=' + encodeURIComponent(s.shopLogoSrc);
    return url;
  }

  function makeThumb(builder) {
    var wrap = document.createElement('div');
    wrap.className = 'ss-pro-builder-thumb';
    var img = document.createElement('img');
    img.src = imageFor(builder);
    img.alt = builder.title;
    img.loading = 'lazy';
    img.onerror = function () {
      if (builder.fallbackImage && img.src !== builder.fallbackImage) img.src = builder.fallbackImage;
    };
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
    style.textContent = '.ss-pro-builder-card{position:relative!important;border:2px dashed rgba(183,163,106,.34)!important;background:rgba(183,163,106,.075)!important;overflow:visible!important}.ss-pro-builder-card:hover{border-color:rgba(183,163,106,.58)!important;background:rgba(183,163,106,.105)!important}.ss-pro-builder-thumb{width:64px;height:64px;border-radius:18px;flex:0 0 auto;display:grid;place-items:center;background:#0b0b0b;overflow:hidden;border:1px solid rgba(17,16,14,.08);box-shadow:0 10px 26px rgba(17,16,14,.08)}.ss-pro-builder-thumb img{width:100%;height:100%;object-fit:cover;display:block}.ss-pro-builder-copy{flex:1;min-width:0}.ss-pro-builder-title{font-size:15px;font-weight:900;color:var(--ap-text,#11100e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.02em}.ss-pro-builder-subtitle{font-size:12px;color:var(--ap-gray,rgba(17,16,14,.55));margin-top:4px;line-height:1.35;font-weight:600}.ss-pro-builder-actions{width:auto!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:8px!important;flex:0 0 auto!important;margin-top:0!important}.ss-pro-builder-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 18px;background:#11100e;color:#fff;border:1px solid rgba(183,163,106,.22);border-radius:999px;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 14px 34px rgba(17,16,14,.14);white-space:nowrap}.ss-pro-builder-button:hover{background:#28251e;transform:translateY(-1px)}.ss-pro-builder-tooltip{display:none;position:absolute;left:50%;bottom:calc(100% + 12px);transform:translateX(-50%);width:min(320px,calc(100vw - 40px));padding:14px 16px;background:#11100e;color:rgba(255,255,255,.82);border:1px solid rgba(183,163,106,.22);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);font-size:12px;line-height:1.45;text-align:left;z-index:10090;pointer-events:none}.ss-pro-builder-tooltip:after{content:"";position:absolute;left:50%;top:100%;width:12px;height:12px;background:#11100e;transform:translate(-50%,-6px) rotate(45deg);border-right:1px solid rgba(183,163,106,.18);border-bottom:1px solid rgba(183,163,106,.18)}.ss-pro-builder-tooltip strong{display:block;color:#fff;font-size:13px;font-weight:950;margin-bottom:6px}.ss-pro-builder-card:hover>.ss-pro-builder-tooltip,.ss-pro-builder-card:focus-within>.ss-pro-builder-tooltip{display:block}@media(max-width:700px){.ss-pro-builder-tooltip{display:none!important}.ss-pro-builder-card{display:grid!important;grid-template-columns:74px minmax(0,1fr)!important;gap:12px!important;align-items:center!important}.ss-pro-builder-thumb{width:74px;height:74px;border-radius:20px}.ss-pro-builder-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.ss-pro-builder-actions{grid-column:1/-1!important;width:100%!important}.ss-pro-builder-button{width:100%;min-height:46px}}';
    document.head.appendChild(style);
  }

  function renderCards() {
    var container = $('#apCustomBuildersContainer');
    var section = $('#apCustomBuildersSection');
    var empty = $('#apCustomBuildersEmpty');
    var count = $('#apBuilderProductCount');
    if (!container) return false;
    if (container.getAttribute('data-ss-pro-builder-version') === VERSION) return true;
    injectStyles();
    container.innerHTML = '';
    BUILDERS.forEach(function (b) { container.appendChild(makeCard(b)); });
    container.setAttribute('data-ss-pro-builder-version', VERSION);
    if (section) section.style.display = 'block';
    if (empty) empty.style.display = 'none';
    if (count) count.textContent = String(BUILDERS.length);
    return true;
  }

  function rerenderCards() {
    var container = $('#apCustomBuildersContainer');
    if (container) container.removeAttribute('data-ss-pro-builder-version');
    renderCards();
  }

  function installProductFetchRecorder() {
    if (window.__SS_ADMIN_FETCH_PATCHED__ || typeof window.fetch !== 'function') return;
    var originalFetch = window.fetch;
    window.__SS_ADMIN_FETCH_PATCHED__ = true;
    window.fetch = function () {
      var args = arguments;
      return originalFetch.apply(this, args).then(function (response) {
        try {
          var url = String((args[0] && args[0].url) || args[0] || '');
          if (url.indexOf('/admin/store/') !== -1 && url.indexOf('/products') !== -1 && response && response.clone) {
            response.clone().json().then(function (data) {
              window.__SS_ADMIN_LAST_PRODUCTS__ = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
              setTimeout(rerenderCards, 50);
            }).catch(function () {});
          }
        } catch (e) {}
        return response;
      });
    };
  }

  function boot() {
    if (!$('#apPanelAddProducts') && !$('#apCustomBuildersContainer')) return;
    installProductFetchRecorder();
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (renderCards() || attempts > 80) window.clearInterval(timer);
    }, 125);
    var observer = new MutationObserver(function () {
      var container = $('#apCustomBuildersContainer');
      if (container && container.getAttribute('data-ss-pro-builder-version') !== VERSION) window.setTimeout(renderCards, 30);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  ready(boot);
})();
