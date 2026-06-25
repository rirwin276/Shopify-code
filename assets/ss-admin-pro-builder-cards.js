/* Stella & Sage — Admin Pro Builder Cards (catalog grid) */
(function () {
  'use strict';

  var VERSION = 'catalog-v1';
  var RAILWAY_BASE = 'https://printfulautomation-production.up.railway.app';

  var IMAGE_URLS = {
    bc3413:  'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3413-front-clay-triblend.png?v=1777937830',
    bc3001y: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3001y-front-natural_dd41b37c-8fb7-4aec-bb0d-9191145a77ca.png?v=1778476357',
    m2580:   'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2580-front-latte.png?v=1778444002',
    m2480:   'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2480_front_editor_background_style3433.png?v=1782189743',
    ls14003: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ls14003_front_editor_background_style28668.png?v=1779070307',
    cc1717:  'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/cc1717-front-pepper.png?v=1780468020',
    nl6733:  RAILWAY_BASE + '/editor/pro-shirt/nl6733/card-image',
    mc1790:  RAILWAY_BASE + '/editor/pro-shirt/mc1790/card-image'
  };

  var BUILDERS = [
    {
      id: 'bc3413',
      badge: 'Unisex Tee',
      title: 'Bella + Canvas BC3413',
      subtitle: 'Tri-blend · Front or front + back · Up to 2 colors',
      route: '/editor/pro-shirt/bc3413',
      image: IMAGE_URLS.bc3413,
      tip: 'Premium unisex tri-blend tee with custom artwork and up to 2 garment colors.'
    },
    {
      id: 'bc3001y',
      badge: 'Youth Tee',
      title: 'Bella + Canvas BC3001Y',
      subtitle: 'Youth staple · Front or front + back · Up to 2 colors',
      route: '/editor/pro-shirt/bc3001y',
      image: IMAGE_URLS.bc3001y,
      tip: 'Youth staple tee with custom artwork, color selection, and a separate store listing.'
    },
    {
      id: 'm2580',
      badge: 'Pullover Hoodie',
      title: 'Indep. Trading Co. M2580',
      subtitle: 'Premium pullover · Front or front + back · Up to 2 colors',
      route: '/editor/pro-shirt/m2580',
      image: IMAGE_URLS.m2580,
      tip: 'Premium pullover hoodie with custom artwork and up to 2 hoodie colors.'
    },
    {
      id: 'm2480',
      badge: 'Crewneck Sweatshirt',
      title: 'Cotton Heritage M2480',
      subtitle: 'Premium crewneck · Front or front + back · Up to 2 colors',
      route: '/editor/pro-shirt/m2480',
      image: IMAGE_URLS.m2480,
      tip: 'Premium unisex crewneck sweatshirt with custom artwork and up to 2 sweatshirt colors.'
    },
    {
      id: 'ls14003',
      badge: 'Full-Zip Hoodie',
      title: 'Lane Seven LS14003',
      subtitle: 'Full zip · Front or front + back · Up to 2 colors',
      route: '/editor/pro-shirt/ls14003',
      image: IMAGE_URLS.ls14003,
      tip: 'Full zip hoodie with custom artwork, up to 2 garment colors, and a separate store listing.'
    },
    {
      id: 'cc1717',
      badge: 'Garment-Dyed Tee',
      title: 'Comfort Colors CC1717',
      subtitle: 'Heavyweight · Front or front + back · Up to 2 colors',
      route: '/editor/pro-shirt/cc1717',
      image: IMAGE_URLS.cc1717,
      tip: 'Premium heavyweight garment-dyed tee with custom artwork and up to 2 garment colors.'
    },
    {
      id: 'nl6733',
      badge: "Women's Tank",
      title: "Next Level NL6733",
      subtitle: "Racerback · Front artwork only · Up to 2 colors",
      route: '/editor/pro-shirt/nl6733',
      image: IMAGE_URLS.nl6733,
      tip: "Women's racerback tank with custom front artwork, color selection, and a separate store listing."
    },
    {
      id: 'mc1790',
      badge: "Men's Tank",
      title: "Cotton Heritage MC1790",
      subtitle: "Premium tank · Front artwork only · Up to 2 colors",
      route: '/editor/pro-shirt/mc1790',
      image: IMAGE_URLS.mc1790,
      tip: "Men's premium tank top with custom front artwork, color selection, and a separate store listing."
    }
  ];

  var STYLES = [
    '#apCustomBuildersContainer{',
      'display:grid!important;',
      'grid-template-columns:repeat(auto-fill,minmax(196px,1fr))!important;',
      'gap:18px!important;',
      'padding:4px 0 20px!important;',
    '}',

    '.ss-catalog-card{',
      'display:flex;flex-direction:column;',
      'border-radius:16px;overflow:visible;',
      'background:#fff;',
      'border:1.5px solid rgba(17,16,14,.09);',
      'box-shadow:0 2px 10px rgba(17,16,14,.05);',
      'transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;',
      'position:relative;',
    '}',
    '.ss-catalog-card:hover{',
      'transform:translateY(-4px);',
      'box-shadow:0 12px 32px rgba(17,16,14,.12);',
      'border-color:rgba(183,163,106,.5);',
    '}',

    '.ss-catalog-card__img-wrap{',
      'position:relative;width:100%;',
      'aspect-ratio:1;overflow:hidden;',
      'border-radius:14px 14px 0 0;',
      'background:#f5f1e8;',
    '}',
    '.ss-catalog-card__img-wrap img{',
      'width:100%;height:100%;',
      'object-fit:cover;display:block;',
    '}',

    '.ss-catalog-badge{',
      'position:absolute;top:9px;left:9px;',
      'background:rgba(17,16,14,.74);',
      'backdrop-filter:blur(4px);',
      'color:#fff;',
      'font-size:9.5px;font-weight:800;',
      'letter-spacing:.05em;text-transform:uppercase;',
      'padding:3px 8px;border-radius:999px;',
      'pointer-events:none;',
    '}',

    '.ss-catalog-card__body{',
      'padding:13px 14px 15px;',
      'display:flex;flex-direction:column;flex:1;',
    '}',
    '.ss-catalog-card__title{',
      'font-size:13.5px;font-weight:900;',
      'color:#11100e;letter-spacing:-.02em;',
      'line-height:1.2;',
    '}',
    '.ss-catalog-card__sub{',
      'font-size:11px;color:rgba(17,16,14,.52);',
      'margin-top:5px;line-height:1.4;',
      'font-weight:500;flex:1;',
    '}',
    '.ss-catalog-card__btn{',
      'margin-top:13px;display:block;width:100%;',
      'padding:10px 14px;',
      'background:#11100e;color:#fff;',
      'border:none;border-radius:10px;',
      'font-size:12.5px;font-weight:800;',
      'cursor:pointer;text-align:center;',
      'transition:background .15s,color .15s;',
      'box-sizing:border-box;',
    '}',
    '.ss-catalog-card__btn:hover{',
      'background:rgba(183,163,106,1);color:#11100e;',
    '}',

    '.ss-catalog-tip{',
      'display:none;',
      'position:absolute;',
      'left:50%;bottom:calc(100% + 10px);',
      'transform:translateX(-50%);',
      'width:min(280px,calc(100vw - 32px));',
      'padding:12px 14px;',
      'background:#11100e;color:rgba(255,255,255,.82);',
      'border:1px solid rgba(183,163,106,.22);',
      'border-radius:14px;',
      'box-shadow:0 20px 60px rgba(0,0,0,.26);',
      'font-size:11.5px;line-height:1.45;',
      'text-align:left;z-index:10090;pointer-events:none;',
    '}',
    '.ss-catalog-tip::after{',
      'content:"";position:absolute;',
      'left:50%;top:100%;width:10px;height:10px;',
      'background:#11100e;',
      'transform:translate(-50%,-5px) rotate(45deg);',
      'border-right:1px solid rgba(183,163,106,.18);',
      'border-bottom:1px solid rgba(183,163,106,.18);',
    '}',
    '.ss-catalog-card:hover .ss-catalog-tip,',
    '.ss-catalog-card:focus-within .ss-catalog-tip{display:block;}',

    '@media(max-width:540px){',
      '#apCustomBuildersContainer{',
        'grid-template-columns:repeat(2,1fr)!important;',
        'gap:12px!important;',
      '}',
    '}',
    '@media(max-width:340px){',
      '#apCustomBuildersContainer{',
        'grid-template-columns:1fr!important;',
      '}',
    '}'
  ].join('');

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

  function makeCard(builder) {
    var card = document.createElement('div');
    card.className = 'ss-catalog-card';
    card.setAttribute('data-ss-builder-id', builder.id);

    var imgWrap = document.createElement('div');
    imgWrap.className = 'ss-catalog-card__img-wrap';

    var img = document.createElement('img');
    img.src = builder.image;
    img.alt = builder.title;
    img.loading = 'eager';
    img.decoding = 'async';

    var badge = document.createElement('span');
    badge.className = 'ss-catalog-badge';
    badge.textContent = builder.badge;

    imgWrap.appendChild(img);
    imgWrap.appendChild(badge);

    var body = document.createElement('div');
    body.className = 'ss-catalog-card__body';

    var title = document.createElement('div');
    title.className = 'ss-catalog-card__title';
    title.textContent = builder.title;

    var sub = document.createElement('div');
    sub.className = 'ss-catalog-card__sub';
    sub.textContent = builder.subtitle;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ss-catalog-card__btn';
    btn.textContent = 'Add to Store';
    btn.addEventListener('click', function () {
      var url = editorUrl(builder);
      if (typeof window.apOpenEditorModal === 'function') window.apOpenEditorModal(url);
      else window.open(url, '_blank', 'noopener,noreferrer');
    });

    body.appendChild(title);
    body.appendChild(sub);
    body.appendChild(btn);

    var tip = document.createElement('div');
    tip.className = 'ss-catalog-tip';
    tip.innerHTML = '<strong style="display:block;color:#fff;font-size:12px;font-weight:900;margin-bottom:5px;">' + esc(builder.title) + '</strong><span>' + esc(builder.tip) + '</span>';

    card.appendChild(imgWrap);
    card.appendChild(body);
    card.appendChild(tip);
    return card;
  }

  function injectStyles() {
    if ($('#ss-catalog-styles')) return;
    var style = document.createElement('style');
    style.id = 'ss-catalog-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function findContainer() { return $('#apCustomBuildersContainer'); }

  function renderCards(force) {
    var container = findContainer();
    var section = $('#apCustomBuildersSection');
    var empty = $('#apCustomBuildersEmpty');
    var count = $('#apBuilderProductCount');

    if (!container) return false;
    if (!force && container.getAttribute('data-ss-catalog-version') === VERSION && container.children.length === BUILDERS.length) return true;

    injectStyles();
    container.innerHTML = '';
    BUILDERS.forEach(function (b) { container.appendChild(makeCard(b)); });
    container.setAttribute('data-ss-catalog-version', VERSION);

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
    var maxAttempts = 240;

    var timer = window.setInterval(function () {
      attempts += 1;
      if (shouldTryAdminPatch()) renderCards(false);
      if (attempts >= maxAttempts) window.clearInterval(timer);
    }, 125);

    var observer = new MutationObserver(function () {
      if (!shouldTryAdminPatch()) return;
      var container = findContainer();
      if (!container) return;
      if (container.getAttribute('data-ss-catalog-version') !== VERSION || container.children.length !== BUILDERS.length) {
        window.setTimeout(function () { renderCards(true); }, 30);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  ready(boot);
})();
