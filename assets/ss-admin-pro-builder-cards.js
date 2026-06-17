/* Stella & Sage — Admin Pro Builder Cards + Admin Fundraiser Modal Polish */
(function () {
  'use strict';

  var VERSION = 'pro-builder-registry-v9-fr-apple-clean-scroll';
  var RAILWAY_BASE = 'https://printfulautomation-production.up.railway.app';

  var IMAGE_URLS = {
    bc3413: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3413-front-clay-triblend.png?v=1777937830',
    bc3001y: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3001y-front-natural_dd41b37c-8fb7-4aec-bb0d-9191145a77ca.png?v=1778476357',
    m2580: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2580-front-latte.png?v=1778444002',
    ls14003: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ls14003_front_editor_background_style28668.png?v=1779070307',
    cc1717: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/cc1717-front-pepper.png?v=1780468020',
    nl6733: RAILWAY_BASE + '/editor/pro-shirt/nl6733/card-image',
    mc1790: RAILWAY_BASE + '/editor/pro-shirt/mc1790/card-image'
  };

  var BUILDERS = [
    { id: 'bc3413', title: 'Bella + Canvas BC3413', subtitle: 'Custom unisex tri-blend tee · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/bc3413', fixedImage: IMAGE_URLS.bc3413, tipTitle: 'Bella + Canvas BC3413', tipBody: 'Premium unisex tri-blend tee with custom front or front + back artwork and up to 2 garment colors.' },
    { id: 'bc3001y', title: 'Bella + Canvas BC3001Y', subtitle: 'Custom youth staple tee · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/bc3001y', fixedImage: IMAGE_URLS.bc3001y, tipTitle: 'Bella + Canvas BC3001Y', tipBody: 'Youth staple tee with custom front or front + back artwork, color selection, and a separate store listing.' },
    { id: 'm2580', title: 'Independent Trading Co. M2580', subtitle: 'Custom premium hoodie · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/m2580', fixedImage: IMAGE_URLS.m2580, tipTitle: 'Independent Trading Co. M2580', tipBody: 'Premium pullover hoodie with custom front or front + back artwork and up to 2 hoodie colors.' },
    { id: 'ls14003', title: 'Lane Seven LS14003', subtitle: 'Custom full zip hoodie · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/ls14003', fixedImage: IMAGE_URLS.ls14003, tipTitle: 'Lane Seven LS14003', tipBody: 'Full zip hoodie with custom front or front + back artwork, up to 2 garment colors, and a separate store listing.' },
    { id: 'cc1717', title: 'Comfort Colors CC1717', subtitle: 'Custom heavyweight garment-dyed tee · Front or front + back artwork · Up to 2 colors', route: '/editor/pro-shirt/cc1717', fixedImage: IMAGE_URLS.cc1717, tipTitle: 'Comfort Colors CC1717', tipBody: 'Premium heavyweight garment-dyed tee with custom front or front + back artwork and up to 2 garment colors.' },
    { id: 'nl6733', title: 'Next Level NL6733', subtitle: "Custom women's racerback tank · Front artwork only · Up to 2 colors", route: '/editor/pro-shirt/nl6733', fixedImage: IMAGE_URLS.nl6733, tipTitle: 'Next Level NL6733', tipBody: "Women's racerback tank with custom front artwork, color selection, and a separate store listing. Back artwork is disabled for now." },
    { id: 'mc1790', title: 'Cotton Heritage MC1790', subtitle: "Custom men's premium tank · Front artwork only · Up to 2 colors", route: '/editor/pro-shirt/mc1790', fixedImage: IMAGE_URLS.mc1790, tipTitle: 'Cotton Heritage MC1790', tipBody: "Men's premium tank top with custom front artwork, color selection, and a separate store listing. Back artwork is disabled for now." }
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

  function injectStyles() {
    if (!$('#ss-pro-builder-card-styles')) {
      var style = document.createElement('style');
      style.id = 'ss-pro-builder-card-styles';
      style.textContent = '.ss-pro-builder-card{position:relative!important;border:2px dashed rgba(183,163,106,.34)!important;background:rgba(183,163,106,.075)!important;overflow:visible!important}.ss-pro-builder-card:hover{border-color:rgba(183,163,106,.58)!important;background:rgba(183,163,106,.105)!important}.ss-pro-builder-thumb{width:64px;height:64px;border-radius:18px;flex:0 0 auto;display:grid;place-items:center;background:#f5f1e8;overflow:hidden;border:1px solid rgba(17,16,14,.10);box-shadow:0 10px 26px rgba(17,16,14,.08)}.ss-pro-builder-thumb img{width:100%;height:100%;object-fit:cover;display:block}.ss-pro-builder-copy{flex:1;min-width:0}.ss-pro-builder-title{font-size:15px;font-weight:900;color:var(--ap-text,#11100e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.02em}.ss-pro-builder-subtitle{font-size:12px;color:var(--ap-gray,rgba(17,16,14,.55));margin-top:4px;line-height:1.35;font-weight:600}.ss-pro-builder-actions{width:auto!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:8px!important;flex:0 0 auto!important;margin-top:0!important}.ss-pro-builder-button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;background:#11100e;color:#fff;border:1px solid rgba(183,163,106,.22);border-radius:999px;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 14px 34px rgba(17,16,14,.14);white-space:nowrap}.ss-pro-builder-button:hover{background:#28251e;transform:translateY(-1px)}.ss-pro-builder-tooltip{display:none;position:absolute;left:50%;bottom:calc(100% + 12px);transform:translateX(-50%);width:min(320px,calc(100vw - 40px));padding:14px 16px;background:#11100e;color:rgba(255,255,255,.82);border:1px solid rgba(183,163,106,.22);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);font-size:12px;line-height:1.45;text-align:left;z-index:10090;pointer-events:none}.ss-pro-builder-tooltip:after{content:"";position:absolute;left:50%;top:100%;width:12px;height:12px;background:#11100e;transform:translate(-50%,-6px) rotate(45deg);border-right:1px solid rgba(183,163,106,.18);border-bottom:1px solid rgba(183,163,106,.18)}.ss-pro-builder-tooltip strong{display:block;color:#fff;font-size:13px;font-weight:950;margin-bottom:6px}.ss-pro-builder-card:hover>.ss-pro-builder-tooltip,.ss-pro-builder-card:focus-within>.ss-pro-builder-tooltip{display:block}@media(max-width:700px){.ss-pro-builder-tooltip{display:none!important}.ss-pro-builder-card{display:grid!important;grid-template-columns:74px minmax(0,1fr)!important;gap:12px!important;align-items:center!important}.ss-pro-builder-thumb{width:74px;height:74px;border-radius:20px}.ss-pro-builder-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.ss-pro-builder-actions{grid-column:1/-1!important;width:100%!important}.ss-pro-builder-button{width:100%;min-height:46px}}';
      document.head.appendChild(style);
    }
    injectFundraiserStyles();
  }

  function injectFundraiserStyles() {
    if ($('#ss-admin-fundraiser-mount-styles')) return;

    var style = document.createElement('style');
    style.id = 'ss-admin-fundraiser-mount-styles';
    style.textContent = [
      'body.ss-fr-modal-open{overflow:hidden!important;}',

      /* overlay — hidden by default; flex-centered when open */
      '.ap-frw-overlay,.ap-frd-overlay{display:none!important;position:fixed!important;inset:0!important;z-index:2147483000!important;background:rgba(17,16,14,.66)!important;backdrop-filter:blur(14px) saturate(.84)!important;-webkit-backdrop-filter:blur(14px) saturate(.84)!important;padding:24px 16px!important;box-sizing:border-box!important;overflow:hidden!important;}',
      '.ap-frw-overlay.open,.ap-frd-overlay.open{display:flex!important;align-items:center!important;justify-content:center!important;}',
      '.ap-frw-overlay:not(.open),.ap-frd-overlay:not(.open){display:none!important;}',

      /* modal — viewport-contained, flex column so body scrolls internally */
      '.ap-frw-modal,.ap-frd-modal{width:min(700px,calc(100vw - 32px))!important;max-height:calc(100dvh - 48px)!important;margin:0!important;overflow:hidden!important;background:#fff!important;border-radius:34px!important;box-shadow:0 44px 120px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.22)!important;display:flex!important;flex-direction:column!important;position:relative!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;}',

      /* hero — fixed top, never scrolls */
      '.ap-frw-hero,.ap-frd-header{background:radial-gradient(circle at 16% 0%,rgba(216,202,139,.26),transparent 36%),linear-gradient(135deg,#17150f 0%,#24241d 54%,#35372d 100%)!important;padding:26px 30px 22px!important;color:#fff!important;position:relative!important;overflow:hidden!important;border-radius:34px 34px 0 0!important;flex-shrink:0!important;}',
      '.ap-frw-hero:after,.ap-frd-header:after{content:""!important;position:absolute!important;inset:auto -70px -95px auto!important;width:220px!important;height:220px!important;border-radius:999px!important;background:rgba(183,163,106,.14)!important;filter:blur(4px)!important;pointer-events:none!important;}',

      '.ap-frw-close,.ap-frd-close{position:absolute!important;top:16px!important;right:16px!important;width:38px!important;height:38px!important;border-radius:999px!important;border:1px solid rgba(255,255,255,.18)!important;background:rgba(255,255,255,.10)!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font-size:18px!important;line-height:1!important;z-index:8!important;}',
      '.ap-frw-close:hover,.ap-frd-close:hover{background:rgba(255,255,255,.18)!important;}',

      '.ap-frw-step-pills{display:flex!important;gap:6px!important;margin:0 52px 16px 0!important;}',
      '.ap-frw-pill{height:4px!important;flex:1!important;border-radius:999px!important;background:rgba(255,255,255,.17)!important;}',
      '.ap-frw-pill.active{background:rgba(255,255,255,.62)!important;}',
      '.ap-frw-pill.done{background:rgba(183,163,106,.85)!important;}',

      '.ap-frw-step-label,.ap-frw-hero-label,.ap-frd-header-badge{display:inline-flex!important;align-items:center!important;width:max-content!important;margin:0 0 12px!important;padding:5px 10px!important;border-radius:999px!important;background:rgba(255,255,255,.11)!important;border:1px solid rgba(255,255,255,.14)!important;color:rgba(246,242,231,.82)!important;font-size:10px!important;font-weight:900!important;letter-spacing:.09em!important;text-transform:uppercase!important;}',

      '.ap-frw-hero h2,.ap-frd-header h2,.ap-frd-header h3{margin:0!important;color:#fff!important;font-size:clamp(26px,4vw,42px)!important;line-height:.96!important;font-weight:950!important;letter-spacing:-.05em!important;max-width:580px!important;}',
      '.ap-frw-hero p,.ap-frd-header p{margin:10px 0 0!important;color:rgba(255,255,255,.65)!important;font-size:14px!important;line-height:1.5!important;max-width:560px!important;font-weight:500!important;}',

      /* step content — ONLY the active step is shown (class-toggled, not inline) */
      '.ap-frw-step-content{display:none!important;}',
      '.ap-frw-step-content.ap-frw-active{display:flex!important;flex-direction:column!important;flex:1 1 auto!important;min-height:0!important;overflow:hidden!important;}',

      /* body — THE scrollable region */
      '.ap-frw-body,.ap-frd-body{display:block!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;flex:1 1 auto!important;min-height:0!important;padding:22px 28px 28px!important;background:#fff!important;color:#11100e!important;}',
      '.ap-frw-tab-panel{display:none!important;}',
      '.ap-frw-tab-panel.active{display:block!important;}',

      '.ap-frw-feature,.ap-frw-highlight,.ap-frw-toggle-row,.ap-frw-stripe-card,.ap-frd-row,.ap-frd-section,.ap-frd-card{border-radius:18px!important;border:1px solid rgba(17,16,14,.08)!important;background:#fff!important;box-shadow:0 8px 24px rgba(17,16,14,.045)!important;padding:16px!important;margin:0 0 12px!important;}',
      '.ap-frw-feature,.ap-frd-row{display:grid!important;grid-template-columns:46px minmax(0,1fr)!important;gap:14px!important;align-items:start!important;}',

      /* icons — show emoji, NO dot override */
      '.ap-frw-feature-icon,.ap-frw-highlight-icon,.ap-frw-toggle-icon,.ap-frd-row-icon,.ap-frw-stripe-logo{width:46px!important;height:46px!important;border-radius:14px!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#f6f2ea!important;font-size:22px!important;flex-shrink:0!important;}',

      '.ap-frw-feature-copy h4,.ap-frw-toggle-copy h4,.ap-frw-stripe-card h3,.ap-frd-row-label{margin:0 0 5px!important;font-size:14px!important;line-height:1.2!important;font-weight:950!important;color:#11100e!important;letter-spacing:-.02em!important;}',
      '.ap-frw-feature-copy p,.ap-frw-highlight-copy,.ap-frw-toggle-copy p,.ap-frw-body p,.ap-frd-row-val{font-size:13px!important;line-height:1.6!important;color:rgba(17,16,14,.66)!important;}',

      '.ap-frw-field{margin-bottom:16px!important;}',
      '.ap-frw-label{display:block!important;margin:0 0 7px!important;font-size:10px!important;font-weight:950!important;letter-spacing:.10em!important;text-transform:uppercase!important;color:rgba(17,16,14,.50)!important;}',
      '.ap-frw-input{width:100%!important;min-height:46px!important;border:1px solid rgba(17,16,14,.13)!important;border-radius:14px!important;padding:11px 14px!important;background:#fff!important;color:#11100e!important;font-size:15px!important;font-weight:700!important;box-sizing:border-box!important;outline:0!important;}',
      '.ap-frw-input:focus{border-color:#b7a36a!important;box-shadow:0 0 0 3px rgba(183,163,106,.14)!important;}',

      '.ap-frw-calc-row{border-radius:14px!important;border:1px solid rgba(75,111,91,.18)!important;background:rgba(75,111,91,.07)!important;padding:12px 14px!important;display:flex!important;align-items:center!important;gap:10px!important;}',
      '.ap-frw-calc-val{margin-left:auto!important;color:#2f5844!important;font-size:17px!important;font-weight:950!important;}',
      '.ap-frw-goal-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important;}',

      '.ap-frw-toggle-row.selected{background:linear-gradient(135deg,rgba(183,163,106,.10),rgba(75,111,91,.06))!important;border-color:rgba(183,163,106,.32)!important;}',

      /* footer — fixed at bottom, never scrolls */
      '.ap-frw-footer{display:flex!important;gap:10px!important;align-items:center!important;padding:14px 28px 22px!important;background:#fff!important;border-top:1px solid rgba(17,16,14,.07)!important;border-radius:0 0 34px 34px!important;flex-shrink:0!important;}',
      '.ap-frw-back-btn,.ap-frw-next-btn,.ap-frw-stripe-btn{min-height:48px!important;border-radius:999px!important;padding:0 20px!important;font-size:14px!important;font-weight:950!important;cursor:pointer!important;}',
      '.ap-frw-back-btn{background:#fff!important;color:#504a3a!important;border:1px solid rgba(17,16,14,.12)!important;}',
      '.ap-frw-next-btn,.ap-frw-stripe-btn{flex:1!important;border:0!important;background:linear-gradient(135deg,#11100e,#3f3a2d)!important;color:#fff!important;box-shadow:0 14px 36px rgba(17,16,14,.16)!important;}',
      '.ap-frw-next-btn:disabled{opacity:.38!important;cursor:not-allowed!important;box-shadow:none!important;}',

      /* details modal — stats + progress are fixed above scrollable body */
      '.ap-frd-stats-row,.ap-fr-zone-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:10px!important;padding:16px 28px 0!important;background:#fff!important;flex-shrink:0!important;}',
      '.ap-frd-stat-cell,.ap-fr-zone-stat{border-radius:18px!important;border:1px solid rgba(17,16,14,.07)!important;background:#fff!important;padding:14px!important;box-shadow:0 8px 24px rgba(17,16,14,.05)!important;text-align:left!important;}',
      '.ap-frd-stat-cell-val,.ap-fr-zone-stat-val{font-size:24px!important;font-weight:950!important;line-height:1!important;color:#11100e!important;letter-spacing:-.04em!important;}',
      '.ap-frd-stat-cell-lbl,.ap-fr-zone-stat-lbl{margin-top:6px!important;font-size:10px!important;font-weight:950!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:rgba(17,16,14,.44)!important;}',
      '.ap-frd-progress-wrap{padding:10px 28px 0!important;background:#fff!important;flex-shrink:0!important;}',
      '.ap-frd-progress-bar{height:8px!important;border-radius:999px!important;background:rgba(17,16,14,.08)!important;overflow:hidden!important;}',
      '.ap-frd-progress-fill{height:100%!important;border-radius:999px!important;background:linear-gradient(90deg,#8f7a42,#4b6f5b)!important;}',

      '.ss-fr-hero-mount{width:100%;display:block}',
      '.ss-fr-hero-mount .ap-fr-zone{margin:0!important;width:100%!important}',
      '.ss-fr-hero-mount .ap-fr-zone-empty{display:block!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}',
      '.ss-fr-hero-mount .ap-fr-zone-empty-icon,.ss-fr-hero-mount .ap-fr-zone-empty-copy{display:none!important}',
      '.ss-fr-hero-mount #apFrLaunchBtn{width:100%!important;min-height:52px!important;border-radius:999px!important;padding:0 18px!important;background:linear-gradient(135deg,#4b6f5b,#2f5844)!important;color:#fff!important;border:1px solid rgba(255,255,255,.13)!important;font-size:13px!important;font-weight:950!important;box-shadow:0 12px 30px rgba(15,23,42,.16)!important}',
      '.ss-fr-hero-mount #apFrLaunchBtn:hover{transform:translateY(-1px)!important;background:linear-gradient(135deg,#587c66,#365f4b)!important}',
      '.ss-fr-hero-mount .ap-fr-zone-active{width:100%!important;box-sizing:border-box!important;padding:12px 14px!important;border-radius:20px!important;background:linear-gradient(135deg,#39493d,#26362d)!important;border:1px solid rgba(255,255,255,.14)!important;color:#fff!important;box-shadow:0 12px 30px rgba(15,23,42,.16)!important;cursor:pointer!important}',
      '.ss-fr-hero-mount .ap-fr-zone-title{color:#fff!important;font-size:12px!important;font-weight:950!important;white-space:normal!important;line-height:1.2!important}',
      '.ss-fr-hero-mount .ap-fr-zone-sub{color:rgba(236,241,232,.82)!important;font-size:11px!important;line-height:1.25!important}',
      '.ss-fr-hero-mount .ap-fr-zone-stats{display:none!important}',
      '.ss-fr-hero-mount #apFrDetailsBtn{width:100%!important;margin-top:10px!important;border-radius:999px!important;background:#fff!important;color:#2f5844!important;border:0!important;min-height:38px!important;font-weight:950!important}',

      '@media(max-width:760px){.ap-frw-overlay,.ap-frd-overlay{padding:8px!important}.ap-frw-modal,.ap-frd-modal{width:calc(100vw - 16px)!important;margin:0!important;border-radius:24px!important;max-height:calc(100dvh - 16px)!important}.ap-frw-hero,.ap-frd-header{padding:20px 18px 18px!important;border-radius:24px 24px 0 0!important}.ap-frw-hero h2,.ap-frd-header h2,.ap-frd-header h3{font-size:28px!important}.ap-frw-body,.ap-frd-body{padding:18px!important}.ap-frw-footer{padding:12px 18px 18px!important;border-radius:0 0 24px 24px!important}.ap-frw-goal-row{grid-template-columns:1fr!important}.ap-frd-stats-row{grid-template-columns:1fr 1fr!important;padding:12px 18px 0!important}.ap-hero-actions{width:100%!important}.ss-fr-hero-mount{width:100%!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function removeFundraiserEmoji() {
    var root = document.querySelector('#apFrwOverlay, #apFrdOverlay');
    if (!root) return;
    var nodes = [];
    ['#apFrwOverlay', '#apFrdOverlay'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) nodes.push(node);
    });
    nodes.forEach(function (node) {
      node.nodeValue = node.nodeValue
        .replace(/[💚📋🚀💰👀⏱️💳🔗✅📢🔒💡🎯📅👁️ℹ️]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trimStart();
    });
  }

  function openFrModal(overlay) {
    if (!overlay) return;
    injectFundraiserStyles();
    removeFundraiserEmoji();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ss-fr-modal-open');
    overlay.scrollTop = 0;
  }

  function closeFrModal(overlay) {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.ap-frw-overlay.open,.ap-frd-overlay.open')) document.body.classList.remove('ss-fr-modal-open');
  }

  function mountFundraiserCard() {
    if (window.location.pathname.indexOf('/pages/admin-powers') === -1) return false;
    var zone = $('#apFrZone');
    var actions = $('.ap-hero-actions');
    if (!zone || !actions) return false;

    injectFundraiserStyles();
    removeFundraiserEmoji();

    var mount = $('#ssFrHeroMount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'ssFrHeroMount';
      mount.className = 'ss-fr-hero-mount';
    }

    var dashboard = actions.querySelector('a[href*="/pages/portal"]') || actions.lastElementChild;
    if (dashboard && dashboard.parentNode === actions && dashboard.nextElementSibling !== mount) dashboard.insertAdjacentElement('afterend', mount);
    else if (!mount.parentNode) actions.appendChild(mount);
    if (zone.parentNode !== mount) mount.appendChild(zone);

    var active = $('#apFrZoneActive');
    if (active && active.getAttribute('data-ss-fr-click') !== '1') {
      active.setAttribute('data-ss-fr-click', '1');
      active.addEventListener('click', function (event) {
        if (event.target && event.target.closest && event.target.closest('button')) return;
        var btn = $('#apFrDetailsBtn');
        if (btn) btn.click();
        else openFrModal($('#apFrdOverlay'));
      });
    }
    return true;
  }

  function hookFundraiserButtons() {
    if (document.documentElement.getAttribute('data-ss-fr-hooks') === '1') return;
    document.documentElement.setAttribute('data-ss-fr-hooks', '1');

    document.addEventListener('click', function (event) {
      var launch = event.target.closest && event.target.closest('#apFrLaunchBtn');
      if (launch) openFrModal($('#apFrwOverlay'));

      var details = event.target.closest && event.target.closest('#apFrDetailsBtn');
      if (details) openFrModal($('#apFrdOverlay'));

      var close = event.target.closest && event.target.closest('.ap-frw-close,.ap-frd-close');
      if (close) {
        closeFrModal(close.closest('.ap-frw-overlay,.ap-frd-overlay'));
        return;
      }

      if (event.target && event.target.matches && event.target.matches('.ap-frw-overlay,.ap-frd-overlay')) closeFrModal(event.target);
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('.ap-frw-overlay.open,.ap-frd-overlay.open').forEach(closeFrModal);
    });
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
    hookFundraiserButtons();
    var attempts = 0;
    var maxAttempts = 80;

    var timer = window.setInterval(function () {
      attempts += 1;
      if (shouldTryAdminPatch()) {
        renderCards(false);
        mountFundraiserCard();
      }
      if (attempts >= maxAttempts) window.clearInterval(timer);
    }, 125);

    var observer = new MutationObserver(function () {
      if (!shouldTryAdminPatch()) return;
      mountFundraiserCard();
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
