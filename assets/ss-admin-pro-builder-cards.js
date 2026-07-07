/* Stella & Sage — Admin Pro Builder Catalog */
(function () {
  'use strict';

  var VERSION = 'catalog-v5-personalize';
  var RAILWAY = 'https://printfulautomation-production.up.railway.app';
  var CDN = 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/';

  var IMG = {
    bc3413:      CDN + 'bc3413-front-clay-triblend.png?v=1777937830',
    bc3001y:     CDN + 'bc3001y-front-natural_dd41b37c-8fb7-4aec-bb0d-9191145a77ca.png?v=1778476357',
    m2580:       CDN + 'm2580-front-latte.png?v=1778444002',
    m2480:       CDN + 'm2480_front_editor_background_style3433.png?v=1782189743',
    ls14003_f:   CDN + 'ls14003_front_editor_background_style28668.png?v=1779070307',
    ls14003_b:   CDN + 'ls14003_back_editor_background_style28669.png?v=1779070374',
    cc1717:      CDN + 'cc1717-front-pepper.png?v=1780468020',
    nl6733:      RAILWAY + '/editor/pro-shirt/nl6733/card-image',
    mc1790:      RAILWAY + '/editor/pro-shirt/mc1790/card-image',
    ec8000_f:    'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ec8000-front-oyster.png?v=1783275244',
    ec8000_b:    'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ec8000-back-oyster.png?v=1783275244'
  };

  var BUILDERS = [
    {
      id: 'bc3413',
      badge: 'Unisex Tee',
      name: 'Bella + Canvas BC3413',
      from: '$24',
      hint: 'Front or front + back printing',
      route: '/editor/pro-shirt/bc3413',
      gallery: [IMG.bc3413],
      desc: 'The BC3413 is a cult-favorite unisex tri-blend tee known for its super-soft hand feel and flattering drape. Made from a premium cotton-poly-rayon blend, it holds vibrant prints beautifully and has the kind of lived-in quality your customers will reach for every day.',
      specs: ['52% Cotton · 25% Polyester · 23% Rayon', 'Ultra-lightweight 3.8 oz/yd²', 'Retail fit · Side-seamed · Tearaway label'],
      sizes: 'S · M · L · XL · 2XL · 3XL',
      colors: 'Choose up to 2 garment colors per listing',
      pricing: [
        { label: 'Front print', note: 'Logo or design on front', price: '$24' },
        { label: 'Front + Back print', note: 'Artwork on both sides', price: '$29' }
      ]
    },
    {
      id: 'bc3001y',
      personalize: true,
      badge: 'Youth Tee',
      name: 'Bella + Canvas BC3001Y',
      from: '$18',
      hint: 'Youth sizes · Front or front + back',
      route: '/editor/pro-shirt/bc3001y',
      gallery: [IMG.bc3001y],
      desc: 'The BC3001Y Youth Staple Tee brings the same premium Bella + Canvas quality to youth sizing. Soft, durable, and available in dozens of colors — perfect for team events, schools, or family campaigns. Creates its own separate listing in your store.',
      specs: ['100% Airlume Combed/Ring-Spun Cotton', 'Lightweight 4.2 oz/yd²', 'Classic fit · Youth XS–XL + Adult S–XL'],
      sizes: 'YXS · YS · YM · YL · YXL',
      colors: 'Choose up to 2 garment colors per listing',
      pricing: [
        { label: 'Front print', note: 'Logo or design on front', price: '$18' },
        { label: 'Front + Back print', note: 'Artwork on both sides', price: '$24' }
      ]
    },
    {
      id: 'm2580',
      personalize: true,
      badge: 'Pullover Hoodie',
      name: 'Independent Trading Co. M2580',
      from: '$34',
      hint: 'Front or front + back printing',
      route: '/editor/pro-shirt/m2580',
      gallery: [IMG.m2580],
      desc: 'The M2580 is the go-to premium pullover hoodie — mid-weight, relaxed fit, and built to last. With a kangaroo pocket, reinforced ribbed cuffs, and a clean front canvas, it\'s ideal for bold logos and statement designs your customers will actually wear out.',
      specs: ['80% Cotton · 20% Polyester fleece', 'Mid-weight 8.5 oz/yd²', 'Relaxed unisex fit · Kangaroo pocket'],
      sizes: 'S · M · L · XL · 2XL · 3XL',
      colors: 'Choose up to 2 garment colors per listing',
      pricing: [
        { label: 'Front print', note: 'Logo or design on front', price: '$34' },
        { label: 'Front + Back print', note: 'Artwork on both sides', price: '$39' }
      ]
    },
    {
      id: 'm2480',
      personalize: true,
      badge: 'Crewneck Sweatshirt',
      name: 'Cotton Heritage M2480',
      from: '$39',
      hint: 'Front or front + back printing',
      route: '/editor/pro-shirt/m2480',
      gallery: [IMG.m2480],
      desc: 'The M2480 is a premium heavyweight crewneck sweatshirt with a luxuriously soft fleece interior and a clean, modern silhouette. It strikes the perfect balance between comfort and structure — and its clean front canvas is made for statement prints.',
      specs: ['60% Cotton · 40% Polyester ring-spun fleece', 'Heavyweight 10 oz/yd²', 'Relaxed unisex fit · Ribbed cuffs & hem'],
      sizes: 'S · M · L · XL · 2XL · 3XL',
      colors: 'Choose up to 2 garment colors per listing',
      pricing: [
        { label: 'Front print', note: 'Logo or design on front', price: '$39' },
        { label: 'Front + Back print', note: 'Artwork on both sides', price: '$44' }
      ]
    },
    {
      id: 'ls14003',
      badge: 'Full-Zip Hoodie',
      name: 'Lane Seven LS14003',
      from: '$37',
      hint: 'Front or front + back printing',
      route: '/editor/pro-shirt/ls14003',
      gallery: [IMG.ls14003_f, IMG.ls14003_b],
      desc: 'The LS14003 is Lane Seven\'s premium full-zip hoodie — a versatile layering piece built from a cozy fleece blend with a flattering athletic silhouette. Front-zip convenience meets clean left-chest and back print areas, creating a product your customers will live in.',
      specs: ['60% Cotton · 40% Polyester fleece', 'Mid-weight 8.5 oz/yd²', 'Unisex athletic fit · Full-zip with kangaroo pocket'],
      sizes: 'S · M · L · XL · 2XL · 3XL',
      colors: 'Choose up to 2 garment colors per listing',
      pricing: [
        { label: 'Front print', note: 'Logo or design on front', price: '$37' },
        { label: 'Front + Back print', note: 'Artwork on both sides', price: '$43' }
      ]
    },
    {
      id: 'cc1717',
      personalize: true,
      badge: 'Garment-Dyed Tee',
      name: 'Comfort Colors CC1717',
      from: '$30',
      hint: 'Front or front + back printing',
      route: '/editor/pro-shirt/cc1717',
      gallery: [IMG.cc1717],
      desc: 'The CC1717 is Comfort Colors\' signature heavyweight garment-dyed tee — pigment-washed for a unique, worn-in look that can\'t be replicated. Every shirt has a slightly one-of-a-kind character. Thick, premium, and wildly popular in lifestyle and vintage-inspired brands.',
      specs: ['100% Ring-Spun Cotton (some colors are blended)', 'Heavyweight 6.1 oz/yd²', 'Relaxed unisex fit · Pigment-dyed · Oversized feel'],
      sizes: 'S · M · L · XL · 2XL · 3XL',
      colors: 'Choose up to 2 garment colors per listing',
      pricing: [
        { label: 'Front print', note: 'Logo or design on front', price: '$30' },
        { label: 'Front + Back print', note: 'Artwork on both sides', price: '$35' }
      ]
    },
    {
      id: 'nl6733',
      badge: "Women's Racerback Tank",
      name: 'Next Level NL6733',
      from: '$22',
      hint: 'Front print only',
      route: '/editor/pro-shirt/nl6733',
      gallery: [IMG.nl6733],
      desc: 'The NL6733 is a women\'s ideal racerback tank built from Next Level\'s signature 60/40 blend — incredibly soft, moisture-wicking, and designed to move. The racerback cut flatters every body type, making it a top pick for yoga studios, gyms, and lifestyle brands.',
      specs: ['60% Cotton · 40% Polyester jersey', 'Lightweight 3.7 oz/yd²', 'Fitted women\'s cut · Racerback · Tearaway label'],
      sizes: 'XS · S · M · L · XL · 2XL',
      colors: 'Choose up to 2 garment colors per listing',
      pricing: [
        { label: 'Front print', note: 'Logo or design on front (back print not available)', price: '$22' }
      ]
    },
    {
      id: 'mc1790',
      badge: "Men's Tank",
      name: 'Cotton Heritage MC1790',
      from: '$22',
      hint: 'Front print only',
      route: '/editor/pro-shirt/mc1790',
      gallery: [IMG.mc1790],
      desc: 'The MC1790 is Cotton Heritage\'s premium men\'s muscle tank — a gym-ready staple with a clean cut and exceptional softness. Ideal for athletic brands, outdoor lifestyle, and anyone who wants a bold front-print product that feels and looks premium.',
      specs: ['100% Combed Cotton jersey', 'Lightweight 4.3 oz/yd²', 'Athletic men\'s cut · Sleeveless · Side-seamed'],
      sizes: 'S · M · L · XL · 2XL · 3XL',
      colors: 'Choose up to 2 garment colors per listing',
      pricing: [
        { label: 'Front print', note: 'Logo or design on front (back print not available)', price: '$22' }
      ]
    }
    ,
    {
      id: 'ec8000',
      personalize: true,
      badge: 'Eco Tote',
      name: 'Econscious EC8000 Eco Tote Bag',
      from: '$22',
      hint: 'One size · Front or front + back',
      route: '/editor/pro-shirt/ec8000',
      gallery: [IMG.ec8000_f],
      desc: 'The EC8000 is a reusable cotton tote with a clean square print area for teams, fundraisers, events, vacation groups, school campaigns, and everyday branded merch. It is simple to order, easy to carry, and does not require size collection.',
      specs: ['100% organic cotton canvas', '9.5 × 9.5 inch print area', 'Two classic colors: Black & Oyster'],
      sizes: 'One size',
      colors: 'Choose up to 2 tote colors: Black or Oyster',
      pricing: [
        { label: 'Front print', note: 'Logo or design on one side', price: '$22' },
        { label: 'Front + Back print', note: 'Artwork on both sides', price: '$27' }
      ]
    }
  ];

  /* ─── Live pricing ──────────────────────────────────────────────────────── */
  // Maps each builder to its global_pricing keys so the catalog reflects the
  // exact prices set in the Price Editor (/pages/price-editor). Falls back to
  // the hardcoded prices in each builder's `pricing` array if the live fetch
  // is unavailable.
  var PRICE_KEYS = {
    bc3413:  { front: 'BC3413_front',  back: 'BC3413_front_back' },
    bc3001y: { front: 'BC3001Y_front', back: 'BC3001Y_front_back' },
    m2580:   { front: 'M2580_front',   back: 'M2580_front_back' },
    m2480:   { front: 'M2480_front',   back: 'M2480_front_back' },
    ls14003: { front: 'LS14003_front', back: 'LS14003_front_back' },
    cc1717:  { front: 'CC1717_front',  back: 'CC1717_front_back' },
    nl6733:  { front: 'NL6733_front',  back: null },
    mc1790:  { front: 'MC1790_front',  back: null },
    ec8000:  { front: 'EC8000_front',  back: 'EC8000_front_back' }
  };

  var livePrices = null;

  function parseDollars(s) {
    var n = parseFloat(String(s == null ? '' : s).replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : null;
  }
  function fmtPrice(n) {
    if (n == null || !isFinite(n)) return '';
    return '$' + (n % 1 === 0 ? String(n) : n.toFixed(2));
  }
  function livePrice(key, fallbackNum) {
    if (key && livePrices && livePrices[key] != null) {
      var n = Number(livePrices[key]);
      if (isFinite(n) && n > 0) return n;
    }
    return fallbackNum;
  }
  // Front price (number) for a builder — live value or hardcoded fallback.
  function frontPrice(b) {
    var keys = PRICE_KEYS[b.id] || {};
    var fb = parseDollars(b.pricing[0] && b.pricing[0].price);
    return livePrice(keys.front, fb);
  }
  // Back / front+back price (number) for a builder, or null if not offered.
  function backPrice(b) {
    var keys = PRICE_KEYS[b.id] || {};
    if (!keys.back || !b.pricing[1]) return null;
    var fb = parseDollars(b.pricing[1].price);
    return livePrice(keys.back, fb);
  }

  /* ─── Utilities ─────────────────────────────────────────────────────────── */
  function $(s) { return document.querySelector(s); }
  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once: true}) : fn(); }
  function ssap() { return window.SSAP || {}; }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Fetch the live global prices once (same endpoint + auth the Price Editor
  // uses). On success, re-render so cards + modal reflect current pricing.
  function fetchLivePrices() {
    var secret = ssap()['editor' + 'Secret'] || '';
    if (!secret) return;
    fetch(RAILWAY + '/api/pricing', {
      method: 'GET',
      headers: { 'X-Editor-Secret': secret },
      cache: 'no-store'
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var p = data.prices || data;
        if (p && typeof p === 'object') {
          livePrices = p;
          var c = $('#apCustomBuildersContainer');
          if (c) { c.removeAttribute('data-ss-v'); renderCards(true); }
        }
      })
      .catch(function () { /* keep hardcoded fallbacks */ });
  }

  function editorUrl(b) {
    var s = ssap();
    var url = RAILWAY + b.route + '?shop_handle=' + encodeURIComponent(s.shopHandle||'') + '&' + 'sec'+'ret' + '=' + encodeURIComponent(s['editor'+'Secret']||'') + '&mode=embedded';
    if (s.shopLogoSrc) url += '&logo_url=' + encodeURIComponent(s.shopLogoSrc);
    return url;
  }

  function launch(b) {
    var url = editorUrl(b);
    if (typeof window.apOpenEditorModal === 'function') window.apOpenEditorModal(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* ─── Styles ────────────────────────────────────────────────────────────── */
  var CSS = [
    /* Grid */
    '#apCustomBuildersContainer{',
      'display:grid!important;',
      'grid-template-columns:repeat(auto-fill,minmax(220px,1fr))!important;',
      'gap:18px!important;',
      'padding:4px 0 24px!important;',
    '}',

    /* Card */
    '.ss-cat{',
      'display:flex;flex-direction:column;',
      'background:#fff;',
      'border-radius:20px;overflow:hidden;',
      'border:1.5px solid rgba(17,16,14,.08);',
      'box-shadow:0 2px 14px rgba(17,16,14,.05);',
      'cursor:pointer;',
      'transition:transform .22s cubic-bezier(.34,1.56,.64,1),',
        'box-shadow .18s ease,border-color .18s ease;',
      'user-select:none;',
      '-webkit-tap-highlight-color:transparent;',
    '}',
    '.ss-cat:hover{',
      'transform:translateY(-5px);',
      'box-shadow:0 18px 44px rgba(17,16,14,.12);',
      'border-color:rgba(183,163,106,.55);',
    '}',
    '.ss-cat:active{transform:translateY(-2px);}',

    '.ss-cat__media{',
      'position:relative;width:100%;',
      'aspect-ratio:1;background:#f5f1e8;overflow:hidden;',
    '}',
    '.ss-cat__media img{',
      'width:100%;height:100%;object-fit:cover;display:block;',
      'transition:transform .3s ease;',
    '}',
    '.ss-cat:hover .ss-cat__media img{transform:scale(1.04);}',

    '.ss-cat__badge{',
      'position:absolute;top:10px;left:10px;',
      'background:rgba(17,16,14,.68);',
      'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
      'color:#fff;font-size:9.5px;font-weight:800;',
      'letter-spacing:.06em;text-transform:uppercase;',
      'padding:4px 9px;border-radius:999px;',
    '}',

    '.ss-cat__pers{',
      'position:absolute;top:10px;right:10px;',
      'background:linear-gradient(135deg,#b7a36a,#d8c48a);',
      'color:#17150f;font-size:9.5px;font-weight:900;',
      'letter-spacing:.05em;text-transform:uppercase;',
      'padding:4px 9px;border-radius:999px;',
      'box-shadow:0 2px 8px rgba(183,163,106,.45);',
    '}',
    '.ss-modal__chip--pers{',
      'background:linear-gradient(135deg,#b7a36a,#d8c48a);color:#17150f;',
      'margin-left:6px;',
    '}',
    '.ss-modal__pers-note{',
      'margin:10px 0 0;padding:10px 12px;border-radius:12px;',
      'background:rgba(183,163,106,.12);border:1px solid rgba(183,163,106,.35);',
      'font-size:12px;line-height:1.5;color:#3d382e;',
    '}',

    '.ss-cat__info{padding:13px 14px 16px;}',
    '.ss-cat__name{',
      'font-size:13.5px;font-weight:900;color:#11100e;',
      'letter-spacing:-.02em;line-height:1.2;',
    '}',
    '.ss-cat__price{',
      'font-size:12.5px;font-weight:800;',
      'color:rgba(183,163,106,1);margin-top:5px;',
    '}',
    '.ss-cat__hint{',
      'font-size:10.5px;color:rgba(17,16,14,.42);',
      'margin-top:3px;font-weight:500;',
    '}',

    /* Overlay */
    '.ss-overlay{',
      'position:fixed;inset:0;',
      'background:rgba(15,14,12,.6);',
      'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
      'z-index:9990;',
      'display:flex;align-items:center;justify-content:center;',
      'padding:20px;box-sizing:border-box;',
      'opacity:0;transition:opacity .22s ease;pointer-events:none;',
    '}',
    '.ss-overlay.open{opacity:1;pointer-events:auto;}',

    /* Modal panel */
    '.ss-modal{',
      'background:#fff;border-radius:26px;',
      'width:100%;max-width:840px;',
      'max-height:90vh;overflow:hidden;',
      'display:grid;grid-template-columns:1fr 1fr;',
      'position:relative;',
      'box-shadow:0 50px 140px rgba(0,0,0,.35);',
      'transform:scale(.94) translateY(16px);',
      'transition:transform .28s cubic-bezier(.34,1.56,.64,1);',
    '}',
    '.ss-overlay.open .ss-modal{transform:scale(1) translateY(0);}',

    /* Close btn */
    '.ss-modal__x{',
      'position:absolute;top:14px;right:14px;',
      'width:36px;height:36px;border-radius:50%;',
      'background:rgba(17,16,14,.08);border:none;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;',
      'font-size:17px;color:#11100e;z-index:3;',
      'transition:background .15s;line-height:1;padding:0;',
    '}',
    '.ss-modal__x:hover{background:rgba(17,16,14,.16);}',

    /* Image side */
    '.ss-modal__img{',
      'background:#f5f1e8;overflow:hidden;position:relative;',
      'display:flex;flex-direction:column;',
    '}',
    '.ss-modal__hero{',
      'flex:1;width:100%;object-fit:contain;display:block;',
      'min-height:0;padding:22px;box-sizing:border-box;',
    '}',
    '.ss-modal__thumbs{',
      'display:flex;gap:8px;',
      'padding:10px 12px;',
      'background:rgba(255,255,255,.6);',
      'backdrop-filter:blur(4px);',
      'overflow-x:auto;',
    '}',
    '.ss-modal__thumb{',
      'width:52px;height:52px;flex-shrink:0;',
      'border-radius:10px;overflow:hidden;',
      'border:2.5px solid rgba(255,255,255,.5);',
      'cursor:pointer;transition:border-color .15s;',
    '}',
    '.ss-modal__thumb.on{border-color:rgba(183,163,106,.9);}',
    '.ss-modal__thumb img{width:100%;height:100%;object-fit:cover;display:block;}',

    /* Detail side — split into a scroll area + a pinned footer so the
       "Add to Store" CTA is ALWAYS visible without scrolling. */
    '.ss-modal__detail{',
      'overflow:hidden;padding:0;min-height:0;',
      'display:flex;flex-direction:column;',
    '}',
    '.ss-modal__scroll{',
      'flex:1 1 auto;min-height:0;overflow-y:auto;',
      'padding:32px 28px 18px;',
      '-webkit-overflow-scrolling:touch;',
    '}',
    '.ss-modal__foot{',
      'flex:0 0 auto;',
      'padding:14px 28px 20px;',
      'background:#fff;',
      'border-top:1px solid rgba(17,16,14,.08);',
    '}',
    '.ss-modal__chip{',
      'display:inline-block;',
      'background:rgba(183,163,106,.14);',
      'color:rgba(140,118,68,1);',
      'font-size:10px;font-weight:800;',
      'letter-spacing:.08em;text-transform:uppercase;',
      'padding:4px 11px;border-radius:999px;',
    '}',
    '.ss-modal__title{',
      'font-size:23px;font-weight:900;color:#11100e;',
      'letter-spacing:-.03em;line-height:1.1;',
      'margin:10px 0 0;',
    '}',
    '.ss-modal__desc{',
      'font-size:13px;color:rgba(17,16,14,.62);',
      'line-height:1.65;font-weight:450;',
      'margin:16px 0 0;',
    '}',

    /* Spec chips */
    '.ss-modal__specs{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px;}',
    '.ss-modal__spec{',
      'font-size:11px;font-weight:700;',
      'color:rgba(17,16,14,.68);',
      'background:rgba(17,16,14,.055);',
      'padding:5px 10px;border-radius:8px;',
    '}',

    /* Divider */
    '.ss-modal__div{',
      'height:1px;background:rgba(17,16,14,.07);',
      'margin:20px 0;',
    '}',

    /* Pricing table */
    '.ss-modal__price-head{',
      'font-size:10.5px;font-weight:800;',
      'letter-spacing:.08em;text-transform:uppercase;',
      'color:rgba(17,16,14,.42);margin-bottom:10px;',
    '}',
    '.ss-modal__price-card{',
      'border:1.5px solid rgba(17,16,14,.08);',
      'border-radius:14px;overflow:hidden;',
    '}',
    '.ss-modal__price-row{',
      'display:flex;justify-content:space-between;align-items:center;',
      'padding:12px 15px;',
    '}',
    '.ss-modal__price-row+.ss-modal__price-row{border-top:1px solid rgba(17,16,14,.07);}',
    '.ss-modal__pl{font-size:13px;font-weight:700;color:#11100e;}',
    '.ss-modal__pn{font-size:10.5px;font-weight:500;color:rgba(17,16,14,.46);margin-top:2px;}',
    '.ss-modal__pv{',
      'font-size:18px;font-weight:900;color:#11100e;',
      'letter-spacing:-.03em;white-space:nowrap;',
    '}',

    /* Sizes + colors */
    '.ss-modal__meta-head{',
      'font-size:10.5px;font-weight:800;letter-spacing:.08em;',
      'text-transform:uppercase;color:rgba(17,16,14,.42);',
      'margin:20px 0 7px;',
    '}',
    '.ss-modal__meta-val{',
      'font-size:13px;font-weight:600;color:rgba(17,16,14,.7);',
      'line-height:1.5;',
    '}',

    /* CTA */
    '.ss-modal__cta{',
      'display:block;width:100%;',
      'padding:15px 20px;',
      'background:#11100e;color:#fff;',
      'border:none;border-radius:14px;',
      'font-size:14px;font-weight:900;',
      'letter-spacing:-.01em;',
      'cursor:pointer;text-align:center;',
      'box-sizing:border-box;',
      'transition:background .15s,transform .12s;',
      'margin-top:0;',
    '}',
    '.ss-modal__cta:hover{background:rgba(183,163,106,1);color:#11100e;}',
    '.ss-modal__cta:active{transform:scale(.98);}',

    /* Mobile modal */
    '@media(max-width:660px){',
      '.ss-modal{',
        'grid-template-columns:1fr!important;',
        'grid-template-rows:min(52vw,260px) 1fr!important;',
        'max-height:92vh;',
      '}',
      '.ss-modal__img{height:min(52vw,260px);}',
      '.ss-modal__scroll{padding:20px 20px 14px;}',
      '.ss-modal__foot{padding:12px 20px 18px;}',
      '.ss-modal__title{font-size:20px;}',
    '}',

    /* Mobile catalog 2-col */
    '@media(max-width:520px){',
      '#apCustomBuildersContainer{',
        'grid-template-columns:1fr 1fr!important;',
        'gap:11px!important;',
      '}',
      '.ss-cat__name{font-size:12.5px;}',
    '}',

    /* Very small */
    '@media(max-width:340px){',
      '#apCustomBuildersContainer{grid-template-columns:1fr!important;}',
    '}'
  ].join('');

  /* ─── Modal DOM (single, reused) ────────────────────────────────────────── */
  var overlay, modal, heroImg, thumbsEl, detailEl, closeBtn;
  var currentGallery = [], currentIdx = 0;

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'ss-overlay';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    modal = document.createElement('div');
    modal.className = 'ss-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.addEventListener('click', function (e) { e.stopPropagation(); });

    closeBtn = document.createElement('button');
    closeBtn.className = 'ss-modal__x';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.addEventListener('click', closeModal);

    var imgSide = document.createElement('div');
    imgSide.className = 'ss-modal__img';

    heroImg = document.createElement('img');
    heroImg.className = 'ss-modal__hero';
    heroImg.alt = '';
    heroImg.loading = 'eager';

    thumbsEl = document.createElement('div');
    thumbsEl.className = 'ss-modal__thumbs';

    imgSide.appendChild(heroImg);
    imgSide.appendChild(thumbsEl);

    detailEl = document.createElement('div');
    detailEl.className = 'ss-modal__detail';

    modal.appendChild(closeBtn);
    modal.appendChild(imgSide);
    modal.appendChild(detailEl);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft' && overlay.classList.contains('open')) setGalleryIdx(currentIdx - 1);
      if (e.key === 'ArrowRight' && overlay.classList.contains('open')) setGalleryIdx(currentIdx + 1);
    });
  }

  function setGalleryIdx(n) {
    if (!currentGallery.length) return;
    currentIdx = (n + currentGallery.length) % currentGallery.length;
    heroImg.src = currentGallery[currentIdx];
    thumbsEl.querySelectorAll('.ss-modal__thumb').forEach(function (th, i) {
      th.classList.toggle('on', i === currentIdx);
    });
  }

  function populateModal(b) {
    currentGallery = b.gallery;
    currentIdx = 0;
    heroImg.src = currentGallery[0];
    heroImg.alt = b.name;
    modal.setAttribute('aria-label', b.name);

    thumbsEl.innerHTML = '';
    if (currentGallery.length > 1) {
      currentGallery.forEach(function (url, i) {
        var th = document.createElement('div');
        th.className = 'ss-modal__thumb' + (i === 0 ? ' on' : '');
        var tImg = document.createElement('img');
        tImg.src = url;
        tImg.alt = i === 0 ? 'Front' : 'Back';
        tImg.loading = 'lazy';
        th.appendChild(tImg);
        th.addEventListener('click', function () { setGalleryIdx(i); });
        thumbsEl.appendChild(th);
      });
      thumbsEl.style.display = 'flex';
    } else {
      thumbsEl.style.display = 'none';
    }

    var rows = [{ label: b.pricing[0].label, note: b.pricing[0].note, price: fmtPrice(frontPrice(b)) }];
    var bp = backPrice(b);
    if (bp != null && b.pricing[1]) {
      rows.push({ label: b.pricing[1].label, note: b.pricing[1].note, price: fmtPrice(bp) });
    }
    var priceRows = rows.map(function (p) {
      return '<div class="ss-modal__price-row">' +
        '<div><div class="ss-modal__pl">' + esc(p.label) + '</div><div class="ss-modal__pn">' + esc(p.note) + '</div></div>' +
        '<div class="ss-modal__pv">' + esc(p.price) + '</div>' +
        '</div>';
    }).join('');

    var specChips = b.specs.map(function (s) {
      return '<span class="ss-modal__spec">' + esc(s) + '</span>';
    }).join('');

    detailEl.innerHTML =
      '<div class="ss-modal__scroll">' +
        '<span class="ss-modal__chip">' + esc(b.badge) + '</span>' +
        (b.personalize ? '<span class="ss-modal__chip ss-modal__chip--pers">\u2726 Name & Number available</span>' : '') +
        '<div class="ss-modal__title">' + esc(b.name) + '</div>' +
        '<p class="ss-modal__desc">' + esc(b.desc) + '</p>' +
        (b.personalize ? '<p class="ss-modal__pers-note">\u2726 <strong>Name &amp; Number:</strong> flip one switch in the builder and every buyer can add their own name and number to the back \u2014 printed just for them, no extra work for you.</p>' : '') +
        '<div class="ss-modal__specs">' + specChips + '</div>' +
        '<div class="ss-modal__div"></div>' +
        '<div class="ss-modal__price-head">Retail pricing</div>' +
        '<div class="ss-modal__price-card">' + priceRows + '</div>' +
        '<div class="ss-modal__meta-head">Available sizes</div>' +
        '<div class="ss-modal__meta-val">' + esc(b.sizes) + '</div>' +
        '<div class="ss-modal__meta-head">Colors</div>' +
        '<div class="ss-modal__meta-val">' + esc(b.colors) + '</div>' +
      '</div>' +
      '<div class="ss-modal__foot">' +
        '<button class="ss-modal__cta" data-builder-id="' + esc(b.id) + '">✨ Add to Store</button>' +
      '</div>';

    detailEl.querySelector('.ss-modal__cta').addEventListener('click', function () {
      closeModal();
      launch(b);
    });
  }

  function openModal(b) {
    if (!overlay) buildModal();
    populateModal(b);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ─── Card factory ──────────────────────────────────────────────────────── */
  function makeCard(b) {
    var card = document.createElement('div');
    card.className = 'ss-cat';
    card.setAttribute('data-ss-builder-id', b.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Preview ' + b.name);

    var media = document.createElement('div');
    media.className = 'ss-cat__media';

    var img = document.createElement('img');
    img.src = b.gallery[0];
    img.alt = b.name;
    img.loading = 'eager';
    img.decoding = 'async';

    var badge = document.createElement('span');
    badge.className = 'ss-cat__badge';
    badge.textContent = b.badge;

    media.appendChild(img);
    media.appendChild(badge);

    if (b.personalize) {
      var pers = document.createElement('span');
      pers.className = 'ss-cat__pers';
      pers.textContent = '\u2726 Name & Number';
      pers.title = 'Buyers can add their own name and number to the back';
      media.appendChild(pers);
    }

    var info = document.createElement('div');
    info.className = 'ss-cat__info';
    info.innerHTML =
      '<div class="ss-cat__name">' + esc(b.name) + '</div>' +
      '<div class="ss-cat__price">From ' + esc(fmtPrice(frontPrice(b))) + '</div>' +
      '<div class="ss-cat__hint">' + esc(b.hint) + '</div>';

    card.appendChild(media);
    card.appendChild(info);

    function activate() { openModal(b); }
    card.addEventListener('click', activate);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });

    return card;
  }

  /* ─── Styles injection ──────────────────────────────────────────────────── */
  function injectStyles() {
    if ($('#ss-catalog-css')) return;
    var s = document.createElement('style');
    s.id = 'ss-catalog-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ─── Render ────────────────────────────────────────────────────────────── */
  function renderCards(force) {
    var container = $('#apCustomBuildersContainer');
    var section = $('#apCustomBuildersSection');
    var empty = $('#apCustomBuildersEmpty');
    var count = $('#apBuilderProductCount');

    if (!container) return false;
    if (!force && container.getAttribute('data-ss-v') === VERSION && container.children.length === BUILDERS.length) return true;

    injectStyles();
    container.innerHTML = '';
    BUILDERS.forEach(function (b) { container.appendChild(makeCard(b)); });
    container.setAttribute('data-ss-v', VERSION);

    if (section) section.style.display = 'block';
    if (empty) empty.style.display = 'none';
    if (count) count.textContent = String(BUILDERS.length);
    return true;
  }

  function shouldRun() {
    return window.location.pathname.indexOf('/pages/admin-powers') !== -1
      || !!$('#apPanelAddProducts')
      || !!$('#apCustomBuildersContainer');
  }

  /* ─── Boot ──────────────────────────────────────────────────────────────── */
  function boot() {
    var tries = 0;
    var pricesRequested = false;
    var timer = setInterval(function () {
      if (shouldRun()) {
        renderCards(false);
        if (!pricesRequested) { pricesRequested = true; fetchLivePrices(); }
      }
      if (++tries >= 240) clearInterval(timer);
    }, 125);

    var obs = new MutationObserver(function () {
      if (!shouldRun()) return;
      var c = $('#apCustomBuildersContainer');
      if (c && (c.getAttribute('data-ss-v') !== VERSION || c.children.length !== BUILDERS.length)) {
        setTimeout(function () { renderCards(true); }, 30);
      }
    });
    obs.observe(document.documentElement, {childList: true, subtree: true});
  }

  ready(boot);
})();
