/* Stella & Sage — Admin Pro Builder Cards + Admin Fundraiser Hero CTA */
(function () {
  'use strict';

  var VERSION = 'pro-builder-registry-v9-hero-fundraiser';
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
    if (!$('#ss-pro-builder-card-styles')) {
      var style = document.createElement('style');
      style.id = 'ss-pro-builder-card-styles';
      style.textContent = '.ss-pro-builder-card{position:relative!important;border:2px dashed rgba(183,163,106,.34)!important;background:rgba(183,163,106,.075)!important;overflow:visible!important}.ss-pro-builder-card:hover{border-color:rgba(183,163,106,.58)!important;background:rgba(183,163,106,.105)!important}.ss-pro-builder-thumb{width:64px;height:64px;border-radius:18px;flex:0 0 auto;display:grid;place-items:center;background:#f5f1e8;overflow:hidden;border:1px solid rgba(17,16,14,.10);box-shadow:0 10px 26px rgba(17,16,14,.08)}.ss-pro-builder-thumb img{width:100%;height:100%;object-fit:cover;display:block}.ss-pro-builder-copy{flex:1;min-width:0}.ss-pro-builder-title{font-size:15px;font-weight:900;color:var(--ap-text,#11100e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.02em}.ss-pro-builder-subtitle{font-size:12px;color:var(--ap-gray,rgba(17,16,14,.55));margin-top:4px;line-height:1.35;font-weight:600}.ss-pro-builder-actions{width:auto!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:8px!important;flex:0 0 auto!important;margin-top:0!important}.ss-pro-builder-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 18px;background:#11100e;color:#fff;border:1px solid rgba(183,163,106,.22);border-radius:999px;font-size:13px;font-weight:950;cursor:pointer;box-shadow:0 14px 34px rgba(17,16,14,.14);white-space:nowrap}.ss-pro-builder-button:hover{background:#28251e;transform:translateY(-1px)}.ss-pro-builder-tooltip{display:none;position:absolute;left:50%;bottom:calc(100% + 12px);transform:translateX(-50%);width:min(320px,calc(100vw - 40px));padding:14px 16px;background:#11100e;color:rgba(255,255,255,.82);border:1px solid rgba(183,163,106,.22);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);font-size:12px;line-height:1.45;text-align:left;z-index:10090;pointer-events:none}.ss-pro-builder-tooltip:after{content:"";position:absolute;left:50%;top:100%;width:12px;height:12px;background:#11100e;transform:translate(-50%,-6px) rotate(45deg);border-right:1px solid rgba(183,163,106,.18);border-bottom:1px solid rgba(183,163,106,.18)}.ss-pro-builder-tooltip strong{display:block;color:#fff;font-size:13px;font-weight:950;margin-bottom:6px}.ss-pro-builder-card:hover>.ss-pro-builder-tooltip,.ss-pro-builder-card:focus-within>.ss-pro-builder-tooltip{display:block}@media(max-width:700px){.ss-pro-builder-tooltip{display:none!important}.ss-pro-builder-card{display:grid!important;grid-template-columns:74px minmax(0,1fr)!important;gap:12px!important;align-items:center!important}.ss-pro-builder-thumb{width:74px;height:74px;border-radius:20px}.ss-pro-builder-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.ss-pro-builder-actions{grid-column:1/-1!important;width:100%!important}.ss-pro-builder-button{width:100%;min-height:46px}}';
      document.head.appendChild(style);
    }
    injectFundraiserHeroStyles();
  }

  function injectFundraiserHeroStyles() {
    if ($('#ss-fundraiser-hero-styles')) return;

    var style = document.createElement('style');
    style.id = 'ss-fundraiser-hero-styles';
    style.textContent = [
      '.ap-fr-zone{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;margin:0!important;padding:0!important;border:0!important;}',
      '.ap-hero-actions{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:14px!important;min-width:240px!important;}',
      '.ap-hero-actions .ap-btn,.ap-hero-actions .ap-share-help,.ap-hero-actions .ap-btn--share-primary{width:100%!important;box-sizing:border-box!important;}',
      '.ap-hero-actions .ap-btn{min-height:54px!important;border-radius:999px!important;}',
      '.ss-fr-hero-wrap{display:flex!important;flex-direction:column!important;gap:6px!important;width:100%!important;}',
      '.ss-fr-hero-button{width:100%!important;min-height:62px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;padding:12px 18px!important;border-radius:999px!important;border:1px solid rgba(134,239,172,.44)!important;background:linear-gradient(135deg,#16a34a,#0f766e)!important;color:#fff!important;font-family:inherit!important;font-weight:950!important;letter-spacing:-.01em!important;cursor:pointer!important;box-shadow:0 16px 34px rgba(16,185,129,.24)!important;transition:transform .15s ease,box-shadow .15s ease,background .15s ease!important;text-align:center!important;}',
      '.ss-fr-hero-button:hover{transform:translateY(-1px)!important;box-shadow:0 20px 42px rgba(16,185,129,.32)!important;background:linear-gradient(135deg,#22c55e,#0d9488)!important;}',
      '.ss-fr-hero-button span{font-size:14px!important;line-height:1.15!important;}',
      '.ss-fr-hero-button small{display:block!important;font-size:11px!important;line-height:1.25!important;font-weight:800!important;color:rgba(255,255,255,.78)!important;max-width:220px!important;white-space:normal!important;}',
      '.ss-fr-hero-button.is-active{background:linear-gradient(135deg,#0f3d2e,#14532d)!important;border-color:rgba(187,247,208,.45)!important;}',
      '.ss-fr-hero-button.is-active small{color:rgba(187,247,208,.82)!important;}',
      '.ss-fr-hero-status-dot{width:8px;height:8px;border-radius:50%;background:#86efac;display:inline-block;box-shadow:0 0 0 0 rgba(134,239,172,.42);animation:ssFrHeroPulse 2s infinite;margin-right:5px;}',
      '@keyframes ssFrHeroPulse{0%{box-shadow:0 0 0 0 rgba(134,239,172,.42)}70%{box-shadow:0 0 0 8px rgba(134,239,172,0)}100%{box-shadow:0 0 0 0 rgba(134,239,172,0)}}',
      '@media(max-width:760px){.ap-hero-actions{width:100%!important;min-width:0!important}.ss-fr-hero-button{min-height:56px!important}.ap-frw-modal,.ap-frd-modal{width:min(100%,calc(100vw - 20px))!important;border-radius:22px!important}.ap-frw-overlay,.ap-frd-overlay{padding:10px!important;align-items:flex-start!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}.ap-frw-goal-row{flex-direction:column!important;gap:0!important}.ap-fr-zone{display:block!important;}}'
    ].join('');
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
    return window.location.pathname.indexOf('/pages/admin-powers') !== -1 || !!$('#apPanelAddProducts') || !!findContainer() || !!$('#apFrwOverlay');
  }

  function cleanCause(text) {
    return String(text || '')
      .replace(/^💚\s*/,'')
      .replace(/\s*Fundraiser\s*—\s*Active\s*$/i,'')
      .replace(/\s*—\s*Active\s*$/i,'')
      .trim();
  }

  function shortText(v, max) {
    v = String(v || '').replace(/\s+/g, ' ').trim();
    return v.length > max ? v.slice(0, max - 1) + '…' : v;
  }

  function ensureFundraiserHero() {
    if (!shouldTryAdminPatch()) return false;

    injectFundraiserHeroStyles();

    var actions = $('.ap-hero-actions');
    if (!actions) return false;

    var dashboard = actions.querySelector('a[href*="/pages/portal"]') || actions.querySelector('a.ap-btn--glass:last-of-type');
    var wrap = $('#ssFrHeroWrap');

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'ssFrHeroWrap';
      wrap.className = 'ss-fr-hero-wrap';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'ssFrHeroBtn';
      btn.className = 'ss-fr-hero-button';
      wrap.appendChild(btn);

      if (dashboard && dashboard.parentNode === actions) {
        dashboard.insertAdjacentElement('afterend', wrap);
      } else {
        actions.appendChild(wrap);
      }

      btn.addEventListener('click', function () {
        var isActive = btn.classList.contains('is-active');
        var target = isActive ? $('#apFrDetailsBtn') : $('#apFrLaunchBtn');

        if (target) {
          target.click();
          return;
        }

        var overlay = isActive ? $('#apFrdOverlay') : $('#apFrwOverlay');
        if (overlay) {
          overlay.classList.add('open');
          overlay.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        }
      });
    } else if (dashboard && dashboard.parentNode === actions && dashboard.nextElementSibling !== wrap) {
      dashboard.insertAdjacentElement('afterend', wrap);
    }

    var oldZone = $('#apFrZone');
    if (oldZone) oldZone.setAttribute('aria-hidden', 'true');

    updateFundraiserHeroButton();
    return true;
  }

  function updateFundraiserHeroButton() {
    var btn = $('#ssFrHeroBtn');
    if (!btn) return;

    var activeBand = $('#apFrZoneActive');
    var active = !!(activeBand && activeBand.style.display !== 'none');
    var titleEl = $('#apFrZoneTitle');
    var subEl = $('#apFrZoneSub');
    var raisedEl = $('#apFrZoneRaised');

    if (active) {
      var cause = cleanCause(titleEl ? titleEl.textContent : '') || 'Fundraiser';
      var sub = subEl ? subEl.textContent : '';
      var raised = raisedEl ? raisedEl.textContent : '';
      var summary = shortText([cause, sub, raised ? raised + ' raised' : ''].filter(Boolean).join(' · '), 78);

      btn.className = 'ss-fr-hero-button is-active';
      btn.innerHTML = '<span><i class="ss-fr-hero-status-dot"></i>Fundraiser Settings</span><small>' + esc(summary || 'View campaign debrief, settings, and controls') + '</small>';
      btn.setAttribute('aria-label', 'Open fundraiser settings and campaign debrief');
    } else {
      btn.className = 'ss-fr-hero-button';
      btn.innerHTML = '<span>💚 Start a Fundraiser Campaign</span><small>Guided popup setup · easy to launch</small>';
      btn.setAttribute('aria-label', 'Start a fundraiser campaign');
    }
  }

  function watchFundraiserHero() {
    ['#apFrZoneActive', '#apFrZoneTitle', '#apFrZoneSub', '#apFrZoneRaised'].forEach(function (sel) {
      var node = $(sel);
      if (!node || node.getAttribute('data-ss-fr-watch') === '1') return;

      node.setAttribute('data-ss-fr-watch', '1');
      new MutationObserver(function () { updateFundraiserHeroButton(); }).observe(node, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  function boot() {
    var attempts = 0;
    var maxAttempts = 240; // 30 seconds at 125ms

    var timer = window.setInterval(function () {
      attempts += 1;

      if (shouldTryAdminPatch()) {
        renderCards(false);
        ensureFundraiserHero();
        watchFundraiserHero();
      }

      if (attempts >= maxAttempts) window.clearInterval(timer);
    }, 125);

    var observer = new MutationObserver(function () {
      if (!shouldTryAdminPatch()) return;

      ensureFundraiserHero();
      watchFundraiserHero();

      var container = findContainer();
      if (!container) return;

      if (container.getAttribute('data-ss-pro-builder-version') !== VERSION || container.children.length !== BUILDERS.length) {
        window.setTimeout(function () { renderCards(true); }, 30);
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  }

  ready(boot);
})();
