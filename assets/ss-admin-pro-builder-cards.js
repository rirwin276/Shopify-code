/*
  Stella & Sage — Admin Pro Builder Cards
  ---------------------------------------
  This file is intentionally separate from sections/admin-powers-page.liquid.
  The section file is very large, so this asset safely normalizes the Add Products
  / Pro Builders cards after the Admin Powers page renders.

  Goal:
  - render a stable 4-card builder list
  - restore real product-style thumbnails instead of emoji-only cards
  - add LS14003 as the fourth builder
  - keep hover tooltips card-specific and non-sticky
  - make future builders a one-object registry addition
*/
(function () {
  'use strict';

  var VERSION = 'pro-builder-registry-v1';
  var RAILWAY_BASE = 'https://printfulautomation-production.up.railway.app';

  var IMAGE_URLS = {
    // These are editor/mockup backgrounds already hosted in Shopify Files.
    // They are used only as small admin-card thumbnails.
    ls14003Black: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ls14003_front_editor_background_style28668.png?v=1779070307',
    m2580Fallback: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2580_front_editor_background.png',
  };

  var BUILDERS = [
    {
      id: 'bc3413',
      title: 'Custom Unisex Tri-Blend Tee',
      subtitle: 'Front & back logo · Up to 2 colors · Separate listing',
      route: '/editor/pro-shirt/bc3413',
      price: 'Front + back available',
      imageStrategy: 'existingProduct',
      imageTags: ['bc3413'],
      fallbackIcon: '👕',
      tooltipTitle: 'Add a New Custom Tri-Blend Shirt',
      tooltipBody: 'Creates a brand-new Unisex Tri-Blend Tee listing in your store — separate from the standard shirt. Add a custom front logo, optional back logo, choose up to 2 garment colors, and adjust placement in the editor.'
    },
    {
      id: 'bc3001y',
      title: 'Custom Youth Staple Tee',
      subtitle: 'Front & back logo · Up to 2 colors · Separate listing',
      route: '/editor/pro-shirt/bc3001y',
      price: 'Front $18 · Front & back $24',
      imageStrategy: 'existingProduct',
      imageTags: ['bc3001y', 'youth staple'],
      fallbackIcon: '👕',
      tooltipTitle: 'Add a New Custom Youth Tee',
      tooltipBody: 'Creates a brand-new Youth Staple Tee listing in your store. This is separate from the starter build products and can use a front logo, optional back logo, and up to 2 garment colors.'
    },
    {
      id: 'm2580',
      title: 'Custom Premium Hoodie',
      subtitle: 'Front $34 · Front & back $39 · Up to 2 colors',
      route: '/editor/pro-shirt/m2580',
      price: 'Front $34 · Front & back $39',
      imageStrategy: 'existingProduct',
      imageTags: ['m2580', 'premium hoodie', 'hoodie'],
      fallbackIcon: '🧥',
      fallbackImage: IMAGE_URLS.m2580Fallback,
      tooltipTitle: 'Add a New Custom Hoodie',
      tooltipBody: 'Creates a brand-new Premium Pullover Hoodie listing in your store. Add a front logo, optional back logo, choose up to 2 hoodie colors, and adjust placement in the pro editor.'
    },
    {
      id: 'ls14003',
      title: 'Custom Full Zip Hoodie',
      subtitle: 'Front $37 · Front & back $43 · Up to 2 colors',
      route: '/editor/pro-shirt/ls14003',
      price: 'Front $37 · Front & back $43',
      imageStrategy: 'fixed',
      image: IMAGE_URLS.ls14003Black,
      fallbackIcon: '🧥',
      tooltipTitle: 'Add a New Custom Full Zip Hoodie',
      tooltipBody: 'Creates a brand-new LS14003 full zip hoodie listing. This product is not part of the initial store build, so it uses its own black mockup thumbnail and launches the LS14003 pro builder.'
    }
  ];

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function getSSAP() {
    return window.SSAP || {};
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function productImageFromProducts(builder) {
    if (!Array.isArray(window.__SS_ADMIN_LAST_PRODUCTS__)) return '';

    var needles = (builder.imageTags || []).map(function (x) { return String(x || '').toLowerCase(); });
    var products = window.__SS_ADMIN_LAST_PRODUCTS__;

    for (var i = 0; i < products.length; i++) {
      var p = products[i] || {};
      var tags = Array.isArray(p.tags) ? p.tags.join(' ') : String(p.tags || '');
      var haystack = (String(p.title || '') + ' ' + tags + ' ' + String(p.handle || '')).toLowerCase();
      var matched = needles.some(function (needle) { return needle && haystack.indexOf(needle) !== -1; });
      if (!matched) continue;

      var img = p.featured_image || p.image || (p.images && p.images[0] && (p.images[0].src || p.images[0]));
      if (img) return img;
    }
    return '';
  }

  function resolveImage(builder) {
    if (builder.imageStrategy === 'fixed' && builder.image) return builder.image;
    if (builder.imageStrategy === 'existingProduct') {
      return productImageFromProducts(builder) || builder.fallbackImage || '';
    }
    return builder.fallbackImage || builder.image || '';
  }

  function buildEditorUrl(builder) {
    var ssap = getSSAP();
    var url = RAILWAY_BASE + builder.route
      + '?shop_handle=' + encodeURIComponent(ssap.shopHandle || '')
      + '&secret=' + encodeURIComponent(ssap.editorSecret || 'stellasage-god-mode-2026-xK9mP')
      + '&mode=embedded';

    if (ssap.shopLogoSrc) {
      url += '&logo_url=' + encodeURIComponent(ssap.shopLogoSrc);
    }
    return url;
  }

  function makeThumb(builder) {
    var image = resolveImage(builder);
    var wrap = document.createElement('div');
    wrap.className = 'ss-pro-builder-thumb';

    if (image) {
      var img = document.createElement('img');
      img.src = image;
      img.alt = builder.title;
      img.loading = 'lazy';
      img.onerror = function () {
        img.remove();
        wrap.textContent = builder.fallbackIcon || '🖼️';
        wrap.classList.add('ss-pro-builder-thumb--fallback');
      };
      wrap.appendChild(img);
    } else {
      wrap.textContent = builder.fallbackIcon || '🖼️';
      wrap.classList.add('ss-pro-builder-thumb--fallback');
    }

    return wrap;
  }

  function makeCard(builder) {
    var card = document.createElement('div');
    card.className = 'ap-product-row ap-add-product-row ss-pro-builder-card';
    card.setAttribute('data-ss-builder-id', builder.id);

    var tooltipId = 'ss-pro-builder-tip-' + builder.id;

    var tip = document.createElement('div');
    tip.className = 'ss-pro-builder-tooltip';
    tip.id = tooltipId;
    tip.setAttribute('role', 'tooltip');
    tip.innerHTML = '<strong>' + escapeHtml(builder.tooltipTitle) + '</strong><span>' + escapeHtml(builder.tooltipBody) + '</span>';

    var text = document.createElement('div');
    text.className = 'ss-pro-builder-copy';
    text.innerHTML = '<div class="ss-pro-builder-title">' + escapeHtml(builder.title) + '</div>' +
      '<div class="ss-pro-builder-subtitle">' + escapeHtml(builder.subtitle) + '</div>';

    var actions = document.createElement('div');
    actions.className = 'ap-product-row__actions ss-pro-builder-actions';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'ss-pro-builder-button';
    button.textContent = '✨ Add to Store';
    button.setAttribute('aria-describedby', tooltipId);
    button.addEventListener('click', function () {
      var editorUrl = buildEditorUrl(builder);
      if (typeof window.apOpenEditorModal === 'function') {
        window.apOpenEditorModal(editorUrl);
      } else {
        window.open(editorUrl, '_blank', 'noopener,noreferrer');
      }
    });

    actions.appendChild(button);
    card.appendChild(makeThumb(builder));
    card.appendChild(text);
    card.appendChild(actions);
    card.appendChild(tip);

    return card;
  }

  function injectStyles() {
    if ($('#ss-pro-builder-card-styles')) return;
    var style = document.createElement('style');
    style.id = 'ss-pro-builder-card-styles';
    style.textContent = [
      '.ss-pro-builder-card{position:relative!important;border:2px dashed rgba(183,163,106,.34)!important;background:rgba(183,163,106,.075)!important;overflow:visible!important;}',
      '.ss-pro-builder-card:hover{border-color:rgba(183,163,106,.58)!important;background:rgba(183,163,106,.105)!important;}',
      '.ss-pro-builder-thumb{width:64px;height:64px;border-radius:18px;flex:0 0 auto;display:grid;place-items:center;background:#0b0b0b;color:#fff;font-size:28px;overflow:hidden;border:1px solid rgba(17,16,14,.08);box-shadow:0 10px 26px rgba(17,16,14,.08);}',
      '.ss-pro-builder-thumb img{width:100%;height:100%;object-fit:cover;display:block;}',
      '.ss-pro-builder-thumb--fallback{background:#11100e;}',
      '.ss-pro-builder-copy{flex:1;min-width:0;}',
      '.ss-pro-builder-title{font-size:15px;font-weight:900;color:var(--ap-text,#11100e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.02em;}',
      '.ss-pro-builder-subtitle{font-size:12px;color:var(--ap-gray,rgba(17,16,14,.55));margin-top:4px;line-height:1.35;font-weight:600;}',
      '.ss-pro-builder-actions{width:auto!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:8px!important;flex:0 0 auto!important;margin-top:0!important;}',
      '.ss-pro-builder-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 18px;background:#11100e;color:#fff;border:1px solid rgba(183,163,106,.22);border-radius:999px;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 14px 34px rgba(17,16,14,.14);white-space:nowrap;transition:transform .15s ease,background .15s ease,box-shadow .15s ease;}',
      '.ss-pro-builder-button:hover{background:#28251e;transform:translateY(-1px);box-shadow:0 18px 44px rgba(17,16,14,.20);}',
      '.ss-pro-builder-tooltip{display:none;position:absolute;left:50%;bottom:calc(100% + 12px);transform:translateX(-50%);width:min(330px,calc(100vw - 40px));padding:14px 16px;background:#11100e;color:rgba(255,255,255,.82);border:1px solid rgba(183,163,106,.22);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);font-size:12px;line-height:1.45;text-align:left;z-index:10090;pointer-events:none;}',
      '.ss-pro-builder-tooltip:after{content:"";position:absolute;left:50%;top:100%;width:12px;height:12px;background:#11100e;transform:translate(-50%,-6px) rotate(45deg);border-right:1px solid rgba(183,163,106,.18);border-bottom:1px solid rgba(183,163,106,.18);}',
      '.ss-pro-builder-tooltip strong{display:block;color:#fff;font-size:13px;font-weight:950;margin-bottom:6px;letter-spacing:-.01em;}',
      '.ss-pro-builder-tooltip span{display:block;}',
      '.ss-pro-builder-card:hover>.ss-pro-builder-tooltip,.ss-pro-builder-card:focus-within>.ss-pro-builder-tooltip{display:block;}',
      '@media(max-width:700px){.ss-pro-builder-tooltip{display:none!important}.ss-pro-builder-card{display:grid!important;grid-template-columns:74px minmax(0,1fr)!important;gap:12px!important;align-items:center!important}.ss-pro-builder-thumb{width:74px;height:74px;border-radius:20px}.ss-pro-builder-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.ss-pro-builder-actions{grid-column:1/-1!important;width:100%!important}.ss-pro-builder-button{width:100%;min-height:46px}}'
    ].join('\n');
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
    BUILDERS.forEach(function (builder) {
      container.appendChild(makeCard(builder));
    });

    container.setAttribute('data-ss-pro-builder-version', VERSION);
    if (section) section.style.display = 'block';
    if (empty) empty.style.display = 'none';
    if (count) count.textContent = String(BUILDERS.length);

    return true;
  }

  function installProductFetchRecorder() {
    if (window.__SS_ADMIN_FETCH_PATCHED__) return;
    if (typeof window.fetch !== 'function') return;

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
              setTimeout(function () {
                var container = $('#apCustomBuildersContainer');
                if (container) container.removeAttribute('data-ss-pro-builder-version');
                renderCards();
              }, 50);
            }).catch(function () {});
          }
        } catch (e) {}
        return response;
      });
    };
  }

  function boot() {
    // Guard: only run on the Admin Powers template/page.
    if (!$('#apPanelAddProducts') && !$('#apCustomBuildersContainer')) return;

    installProductFetchRecorder();

    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (renderCards() || attempts > 80) {
        window.clearInterval(timer);
      }
    }, 125);

    var observer = new MutationObserver(function () {
      var container = $('#apCustomBuildersContainer');
      if (!container) return;
      if (container.getAttribute('data-ss-pro-builder-version') !== VERSION) {
        window.setTimeout(renderCards, 30);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  ready(boot);
})();
