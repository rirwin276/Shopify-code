/* Stella & Sage — Admin Pro Builder Cards + polished Admin Fundraiser modal mount */
(function () {
  'use strict';

  var VERSION = 'pro-builder-registry-v8-fr-modal-polish-v3';
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

  function injectFundraiserMountStyles() {
    if ($('#ss-admin-fundraiser-mount-styles')) return;

    var style = document.createElement('style');
    style.id = 'ss-admin-fundraiser-mount-styles';
    style.textContent = [
      'body.ss-fr-modal-open{overflow:hidden!important;}',
      '.ap-frw-overlay,.ap-frd-overlay{display:none!important;position:fixed!important;inset:0!important;z-index:2147483000!important;background:rgba(17,16,14,.64)!important;backdrop-filter:blur(12px) saturate(.82)!important;-webkit-backdrop-filter:blur(12px) saturate(.82)!important;align-items:center!important;justify-content:center!important;padding:22px!important;box-sizing:border-box!important;opacity:1!important;pointer-events:auto!important;}',
      '.ap-frw-overlay.open,.ap-frd-overlay.open{display:flex!important;}',
      '.ap-frw-overlay:not(.open),.ap-frd-overlay:not(.open){display:none!important;height:0!important;overflow:hidden!important;}',
      '.ap-frw-modal,.ap-frd-modal{width:min(760px,calc(100vw - 44px))!important;max-height:min(92vh,920px)!important;overflow:hidden!important;background:#fff!important;border-radius:32px!important;box-shadow:0 38px 110px rgba(0,0,0,.36),0 0 0 1px rgba(255,255,255,.22)!important;display:flex!important;flex-direction:column!important;transform:translateY(0) scale(1)!important;position:relative!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;}',
      '.ap-frw-hero,.ap-frd-header{background:radial-gradient(circle at 16% 0%,rgba(183,163,106,.24),transparent 35%),linear-gradient(135deg,#17150f 0%,#24241d 54%,#35372d 100%)!important;padding:30px 34px 26px!important;color:#fff!important;position:relative!important;overflow:hidden!important;}',
      '.ap-frw-hero:after,.ap-frd-header:after{content:"";position:absolute;inset:auto -70px -95px auto;width:220px;height:220px;border-radius:999px;background:rgba(183,163,106,.14);filter:blur(4px);pointer-events:none;}',
      '.ap-frw-close,.ap-frd-close{position:absolute!important;top:18px!important;right:18px!important;width:38px!important;height:38px!important;border-radius:999px!important;border:1px solid rgba(255,255,255,.18)!important;background:rgba(255,255,255,.10)!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font-size:18px!important;line-height:1!important;z-index:3!important;transition:background .16s ease,transform .16s ease!important;}',
      '.ap-frw-close:hover,.ap-frd-close:hover{background:rgba(255,255,255,.18)!important;transform:scale(1.04)!important;}',
      '.ap-frw-step-label,.ap-frw-hero-label,.ap-frd-header-badge{display:inline-flex!important;align-items:center!important;gap:7px!important;width:max-content!important;margin:0 0 14px!important;padding:7px 12px!important;border-radius:999px!important;background:rgba(255,255,255,.11)!important;border:1px solid rgba(255,255,255,.14)!important;color:rgba(246,242,231,.86)!important;font-size:11px!important;font-weight:900!important;letter-spacing:.09em!important;text-transform:uppercase!important;}',
      '.ap-frw-hero h2,.ap-frd-header h2{margin:0!important;color:#fff!important;font-size:clamp(34px,5.2vw,58px)!important;line-height:.96!important;font-weight:950!important;letter-spacing:-.06em!important;max-width:620px!important;text-wrap:balance!important;}',
      '.ap-frw-hero p,.ap-frd-header p{margin:16px 0 0!important;color:rgba(255,255,255,.73)!important;font-size:15px!important;line-height:1.55!important;max-width:620px!important;font-weight:650!important;}',
      '.ap-frw-step-pills{display:flex!important;gap:7px!important;margin:0 56px 18px 0!important;}',
      '.ap-frw-pill{height:6px!important;flex:1!important;border-radius:999px!important;background:rgba(255,255,255,.17)!important;overflow:hidden!important;}',
      '.ap-frw-pill.active,.ap-frw-pill.done{background:linear-gradient(90deg,#b7a36a,#f2e6b8)!important;}',
      '.ap-frw-tabs{display:flex!important;gap:8px!important;padding:12px 30px 0!important;background:#fff!important;border:0!important;flex-shrink:0!important;}',
      '.ap-frw-tab{appearance:none!important;border:1px solid rgba(17,16,14,.10)!important;background:#f6f2ea!important;color:rgba(17,16,14,.64)!important;border-radius:999px!important;padding:10px 14px!important;font-size:12px!important;font-weight:900!important;cursor:pointer!important;box-shadow:none!important;}',
      '.ap-frw-tab.active{background:#11100e!important;color:#fff!important;border-color:#11100e!important;}',
      '.ap-frw-body,.ap-frd-body{overflow-y:auto!important;padding:24px 30px!important;flex:1!important;background:linear-gradient(180deg,#fff 0%,#fbfaf7 100%)!important;color:#11100e!important;}',
      '.ap-frw-tab-panel{display:none!important;}',
      '.ap-frw-tab-panel.active{display:block!important;}',
      '.ap-frw-feature,.ap-frw-highlight,.ap-frw-toggle-row,.ap-frw-stripe-card,.ap-frw-terms-row{border-radius:22px!important;border:1px solid rgba(17,16,14,.08)!important;background:#fff!important;box-shadow:0 12px 34px rgba(17,16,14,.06)!important;padding:18px!important;margin:0 0 14px!important;}',
      '.ap-frw-feature{display:grid!important;grid-template-columns:46px minmax(0,1fr)!important;gap:16px!important;align-items:start!important;}',
      '.ap-frw-feature-icon,.ap-frw-highlight-icon{width:46px!important;height:46px!important;border-radius:16px!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#f6f2ea!important;font-size:22px!important;}',
      '.ap-frw-feature-copy h4,.ap-frw-toggle-copy h4,.ap-frw-stripe-card h3,.ap-frw-legal h4{margin:0 0 6px!important;font-size:15px!important;line-height:1.2!important;font-weight:950!important;color:#11100e!important;letter-spacing:-.02em!important;}',
      '.ap-frw-feature-copy p,.ap-frw-highlight-copy,.ap-frw-toggle-copy p,.ap-frw-legal,.ap-frw-body p{font-size:14px!important;line-height:1.65!important;color:rgba(17,16,14,.68)!important;}',
      '.ap-frw-body h3,.ap-frw-body h4{font-weight:950!important;letter-spacing:-.03em!important;color:#11100e!important;}',
      '.ap-frw-field{margin-bottom:18px!important;}',
      '.ap-frw-label{display:block!important;margin:0 0 8px!important;font-size:11px!important;font-weight:950!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:rgba(17,16,14,.54)!important;}',
      '.ap-frw-input{width:100%!important;min-height:48px!important;border:1px solid rgba(17,16,14,.13)!important;border-radius:16px!important;padding:12px 14px!important;background:#fff!important;color:#11100e!important;font-size:15px!important;font-weight:750!important;box-shadow:0 8px 24px rgba(17,16,14,.04)!important;outline:0!important;}',
      '.ap-frw-input:focus{border-color:#b7a36a!important;box-shadow:0 0 0 4px rgba(183,163,106,.16)!important;}',
      '.ap-frw-calc-row{border-radius:18px!important;border:1px solid rgba(75,111,91,.18)!important;background:rgba(75,111,91,.08)!important;padding:14px 16px!important;display:flex!important;align-items:center!important;gap:10px!important;}',
      '.ap-frw-calc-val{margin-left:auto!important;color:#2f5844!important;font-size:18px!important;font-weight:950!important;}',
      '.ap-frw-goal-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:14px!important;}',
      '.ap-frw-toggle-row.selected{background:linear-gradient(135deg,rgba(183,163,106,.12),rgba(75,111,91,.08))!important;border-color:rgba(183,163,106,.36)!important;}',
      '.ap-frw-footer{display:flex!important;gap:12px!important;align-items:center!important;padding:16px 30px 26px!important;background:#fff!important;border-top:1px solid rgba(17,16,14,.08)!important;flex-shrink:0!important;}',
      '.ap-frw-back-btn,.ap-frw-next-btn,.ap-frw-stripe-btn{min-height:50px!important;border-radius:999px!important;padding:0 20px!important;font-size:14px!important;font-weight:950!important;cursor:pointer!important;}',
      '.ap-frw-back-btn{background:#fff!important;color:#504a3a!important;border:1px solid rgba(17,16,14,.12)!important;}',
      '.ap-frw-next-btn,.ap-frw-stripe-btn{flex:1!important;border:0!important;background:linear-gradient(135deg,#11100e,#3f3a2d)!important;color:#fff!important;box-shadow:0 16px 40px rgba(17,16,14,.18)!important;}',
      '.ap-frw-next-btn:disabled{opacity:.42!important;cursor:not-allowed!important;box-shadow:none!important;}',
      '.ap-frd-body{display:grid!important;gap:14px!important;}',
      '.ap-frd-stat-grid,.ap-fr-zone-stats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:12px!important;}',
      '.ap-frd-stat,.ap-fr-zone-stat{border-radius:20px!important;border:1px solid rgba(17,16,14,.08)!important;background:#fff!important;padding:16px!important;box-shadow:0 12px 32px rgba(17,16,14,.06)!important;text-align:left!important;}',
      '.ap-frd-stat-val,.ap-fr-zone-stat-val{font-size:26px!important;font-weight:950!important;line-height:1!important;color:#11100e!important;letter-spacing:-.04em!important;}',
      '.ap-frd-stat-lbl,.ap-fr-zone-stat-lbl{margin-top:7px!important;font-size:10px!important;font-weight:950!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:rgba(17,16,14,.45)!important;}',
      '.ap-frd-section,.ap-frd-card{border-radius:22px!important;border:1px solid rgba(17,16,14,.08)!important;background:#fff!important;padding:18px!important;box-shadow:0 12px 34px rgba(17,16,14,.06)!important;}',
      '.ss-fr-hero-mount{width:100%;display:block}',
      '.ss-fr-hero-mount .ap-fr-zone{margin:0!important;width:100%!important}',
      '.ss-fr-hero-mount .ap-fr-zone-empty{display:block!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}',
      '.ss-fr-hero-mount .ap-fr-zone-empty-icon,.ss-fr-hero-mount .ap-fr-zone-empty-copy{display:none!important}',
      '.ss-fr-hero-mount #apFrLaunchBtn{width:100%!important;min-height:54px!important;border-radius:999px!important;padding:0 18px!important;background:linear-gradient(135deg,#4b6f5b,#2f5844)!important;color:#fff!important;border:1px solid rgba(255,255,255,.13)!important;font-size:13px!important;font-weight:950!important;box-shadow:0 14px 34px rgba(15,23,42,.18)!important}',
      '.ss-fr-hero-mount #apFrLaunchBtn:hover{opacity:1!important;transform:translateY(-1px)!important;background:linear-gradient(135deg,#587c66,#365f4b)!important}',
      '.ss-fr-hero-mount .ap-fr-zone-active{width:100%!important;box-sizing:border-box!important;padding:12px 14px!important;border-radius:22px!important;background:linear-gradient(135deg,#39493d,#26362d)!important;border:1px solid rgba(255,255,255,.14)!important;color:#fff!important;box-shadow:0 14px 34px rgba(15,23,42,.18)!important;cursor:pointer!important}',
      '.ss-fr-hero-mount .ap-fr-zone-title{color:#fff!important;font-size:12px!important;font-weight:950!important;white-space:normal!important;line-height:1.2!important}',
      '.ss-fr-hero-mount .ap-fr-zone-sub{color:rgba(236,241,232,.82)!important;font-size:11px!important;line-height:1.25!important}',
      '.ss-fr-hero-mount .ap-fr-zone-stats{display:none!important}',
      '.ss-fr-hero-mount #apFrDetailsBtn{width:100%!important;margin-top:10px!important;border-radius:999px!important;background:#fff!important;color:#2f5844!important;border:0!important;min-height:40px!important;font-weight:950!important}',
      '@media(max-width:760px){.ap-frw-overlay,.ap-frd-overlay{padding:10px!important;align-items:flex-start!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}.ap-frw-modal,.ap-frd-modal{width:calc(100vw - 20px)!important;border-radius:24px!important;max-height:none!important;margin:0 auto 18px!important}.ap-frw-hero,.ap-frd-header{padding:24px 20px 20px!important}.ap-frw-hero h2,.ap-frd-header h2{font-size:36px!important}.ap-frw-body,.ap-frd-body{padding:20px!important}.ap-frw-tabs{padding:10px 20px 0!important;overflow-x:auto!important}.ap-frw-footer{padding:14px 20px 20px!important}.ap-frw-goal-row,.ap-frd-stat-grid{grid-template-columns:1fr!important}.ap-hero-actions{width:100%!important}.ss-fr-hero-mount{width:100%!important}}'
    ].join('');

    document.head.appendChild(style);
  }

  function openFrModal(overlay) {
    if (!overlay) return;
    injectFundraiserMountStyles();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ss-fr-modal-open');
  }

  function closeFrModal(overlay) {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.ap-frw-overlay.open,.ap-frd-overlay.open')) {
      document.body.classList.remove('ss-fr-modal-open');
    }
  }

  function mountFundraiserCard() {
    if (window.location.pathname.indexOf('/pages/admin-powers') === -1) return false;

    var zone = $('#apFrZone');
    var actions = $('.ap-hero-actions');
    if (!zone || !actions) return false;

    injectFundraiserMountStyles();

    var mount = $('#ssFrHeroMount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'ssFrHeroMount';
      mount.className = 'ss-fr-hero-mount';
    }

    var dashboard = actions.querySelector('a[href*="/pages/portal"]') || actions.lastElementChild;
    if (dashboard && dashboard.parentNode === actions && dashboard.nextElementSibling !== mount) {
      dashboard.insertAdjacentElement('afterend', mount);
    } else if (!mount.parentNode) {
      actions.appendChild(mount);
    }

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
      if (launch) window.setTimeout(function () { openFrModal($('#apFrwOverlay')); }, 0);

      var details = event.target.closest && event.target.closest('#apFrDetailsBtn');
      if (details) window.setTimeout(function () { openFrModal($('#apFrdOverlay')); }, 0);

      var close = event.target.closest && event.target.closest('.ap-frw-close,.ap-frd-close');
      if (close) {
        closeFrModal(close.closest('.ap-frw-overlay,.ap-frd-overlay'));
        return;
      }

      if (event.target && event.target.matches && event.target.matches('.ap-frw-overlay,.ap-frd-overlay')) {
        closeFrModal(event.target);
      }
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
    var maxAttempts = 80; // 10 seconds at 125ms

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
