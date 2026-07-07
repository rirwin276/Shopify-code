/* Stella & Sage — Admin Pro Builder Card/Layout Overrides */
/* UI-only patch for the Admin Powers add-products catalog.
   Does not change any editor URLs, editor secrets, order flow, or Printful logic. */
(function () {
  'use strict';

  var THUMBNAILS = {
    bc3413: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3413-front-clay-triblend.png?v=1777937830',
    bc3001y: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/bc3001y-front-natural_dd41b37c-8fb7-4aec-bb0d-9191145a77ca.png?v=1778476357',
    m2580: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2580-front-latte.png?v=1778444002',
    m2480: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/m2480_front_editor_background_style3433.png?v=1782189743',
    ls14003: 'https://cdn.shopify.com/s/files/1/0798/2055/4490/files/ls14003_front_editor_background_style28668.png?v=1779070307'
  };

  function injectLayoutFixes() {
    if (document.getElementById('ss-admin-pro-builder-layout-fixes')) return;

    var style = document.createElement('style');
    style.id = 'ss-admin-pro-builder-layout-fixes';
    style.textContent = [
      '/* Admin Pro Builder cards: cleaner badges and non-cropped product art */',
      '#apCustomBuildersContainer{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))!important;align-items:stretch!important;}',
      '.ss-cat{min-width:0!important;}',
      '.ss-cat__media{background:#f7f3ea!important;overflow:hidden!important;}',
      '.ss-cat__media img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center center!important;padding:16px 18px 14px!important;box-sizing:border-box!important;background:#f7f3ea!important;transform:none!important;}',
      '.ss-cat:hover .ss-cat__media img{transform:none!important;}',
      '.ss-cat__badge{top:9px!important;left:9px!important;right:auto!important;max-width:calc(100% - 18px)!important;box-sizing:border-box!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:8.8px!important;line-height:1!important;padding:5px 8px!important;z-index:3!important;}',
      '.ss-cat__pers{top:auto!important;right:9px!important;bottom:9px!important;left:auto!important;max-width:calc(100% - 18px)!important;box-sizing:border-box!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:0!important;line-height:1!important;padding:5px 8px!important;z-index:3!important;}',
      '.ss-cat__pers::after{content:"Name + #";font-size:8.8px!important;line-height:1!important;font-weight:950!important;letter-spacing:.06em;text-transform:uppercase;}',
      '.ss-cat__info{padding:12px 13px 14px!important;}',
      '.ss-cat__name{font-size:13px!important;line-height:1.18!important;min-height:2.36em!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}',
      '.ss-cat__price{margin-top:6px!important;}',
      '.ss-cat__hint{font-size:10.25px!important;line-height:1.25!important;}',

      '/* Admin Pro Builder modal: always fits viewport with pinned Add button */',
      '.ss-overlay{padding:clamp(8px,1.2vw,16px)!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;}',
      '.ss-modal{width:min(820px,calc(100vw - 18px))!important;height:min(740px,calc(100dvh - 18px))!important;max-height:calc(100dvh - 18px)!important;display:grid!important;grid-template-columns:minmax(260px,.88fr) minmax(320px,1.12fr)!important;overflow:hidden!important;}',
      '@supports not (height:100dvh){.ss-modal{height:min(740px,calc(100vh - 18px))!important;max-height:calc(100vh - 18px)!important;}}',
      '.ss-modal__img{min-height:0!important;overflow:hidden!important;}',
      '.ss-modal__hero{min-height:0!important;max-height:100%!important;object-fit:contain!important;padding:16px!important;}',
      '.ss-modal__thumbs{padding:8px 10px!important;}',
      '.ss-modal__detail{min-height:0!important;overflow:hidden!important;}',
      '.ss-modal__scroll{min-height:0!important;overflow-y:auto!important;padding:24px 26px 12px!important;}',
      '.ss-modal__foot{padding:12px 26px 16px!important;background:#fff!important;box-shadow:0 -10px 26px rgba(17,16,14,.05)!important;}',
      '.ss-modal__chip{font-size:9.5px!important;padding:4px 10px!important;margin-bottom:0!important;}',
      '.ss-modal__chip--pers{margin-left:6px!important;}',
      '.ss-modal__title{font-size:clamp(20px,2vw,25px)!important;line-height:1.06!important;margin-top:8px!important;}',
      '.ss-modal__desc{font-size:12.5px!important;line-height:1.50!important;margin-top:12px!important;}',
      '.ss-modal__pers-note{margin-top:8px!important;padding:9px 11px!important;font-size:11.5px!important;line-height:1.35!important;}',
      '.ss-modal__specs{margin-top:12px!important;gap:5px!important;}',
      '.ss-modal__spec{font-size:10.5px!important;line-height:1.2!important;padding:4px 8px!important;border-radius:7px!important;}',
      '.ss-modal__div{margin:14px 0!important;}',
      '.ss-modal__price-head{font-size:10px!important;margin-bottom:8px!important;}',
      '.ss-modal__price-row{padding:10px 13px!important;}',
      '.ss-modal__pl{font-size:12.5px!important;}',
      '.ss-modal__pn{font-size:10px!important;}',
      '.ss-modal__pv{font-size:17px!important;}',
      '.ss-modal__meta-head{margin:14px 0 6px!important;font-size:10px!important;}',
      '.ss-modal__meta-val{font-size:12.5px!important;line-height:1.35!important;}',
      '.ss-modal__cta{min-height:46px!important;padding:12px 18px!important;border-radius:13px!important;}',

      '@media(max-height:760px) and (min-width:661px){',
        '.ss-modal{width:min(780px,calc(100vw - 16px))!important;height:calc(100dvh - 16px)!important;max-height:calc(100dvh - 16px)!important;grid-template-columns:minmax(240px,.82fr) minmax(320px,1.18fr)!important;}',
        '@supports not (height:100dvh){.ss-modal{height:calc(100vh - 16px)!important;max-height:calc(100vh - 16px)!important;}}',
        '.ss-modal__hero{padding:12px!important;}',
        '.ss-modal__scroll{padding:20px 24px 10px!important;}',
        '.ss-modal__foot{padding:10px 24px 12px!important;}',
        '.ss-modal__desc{line-height:1.42!important;margin-top:10px!important;}',
        '.ss-modal__specs{margin-top:10px!important;}',
        '.ss-modal__div{margin:12px 0!important;}',
      '}',

      '@media(max-width:660px){',
        '.ss-overlay{padding:8px!important;align-items:center!important;}',
        '.ss-modal{width:calc(100vw - 16px)!important;height:calc(100dvh - 16px)!important;max-height:calc(100dvh - 16px)!important;grid-template-columns:1fr!important;grid-template-rows:minmax(145px,32dvh) minmax(0,1fr)!important;border-radius:22px!important;}',
        '@supports not (height:100dvh){.ss-modal{height:calc(100vh - 16px)!important;max-height:calc(100vh - 16px)!important;}}',
        '.ss-modal__x{top:10px!important;right:10px!important;width:34px!important;height:34px!important;z-index:5!important;}',
        '.ss-modal__img{height:auto!important;min-height:0!important;}',
        '.ss-modal__hero{padding:10px 14px!important;}',
        '.ss-modal__thumbs{padding:6px 10px!important;}',
        '.ss-modal__scroll{padding:16px 18px 10px!important;}',
        '.ss-modal__foot{padding:10px 18px calc(12px + env(safe-area-inset-bottom))!important;}',
        '.ss-modal__title{font-size:20px!important;}',
        '.ss-modal__desc{font-size:12px!important;line-height:1.42!important;}',
        '.ss-modal__pers-note{font-size:11px!important;}',
        '.ss-modal__cta{min-height:48px!important;}',
      '}',

      '@media(max-width:520px){',
        '#apCustomBuildersContainer{grid-template-columns:1fr 1fr!important;gap:11px!important;}',
        '.ss-cat__media img{padding:12px 12px 10px!important;}',
        '.ss-cat__badge{font-size:7.8px!important;padding:4px 6px!important;max-width:calc(100% - 14px)!important;top:7px!important;left:7px!important;}',
        '.ss-cat__pers{right:7px!important;bottom:7px!important;padding:4px 6px!important;max-width:calc(100% - 14px)!important;}',
        '.ss-cat__pers::after{content:"Name + #";font-size:7.8px!important;}',
        '.ss-cat__info{padding:10px 10px 12px!important;}',
        '.ss-cat__name{font-size:12px!important;}',
      '}',

      '@media(max-width:340px){#apCustomBuildersContainer{grid-template-columns:1fr!important;}}'
    ].join('\n');

    document.head.appendChild(style);
  }

  function applyThumbs() {
    Object.keys(THUMBNAILS).forEach(function (id) {
      document.querySelectorAll('[data-ss-builder-id="' + id + '"]').forEach(function (card) {
        // Legacy selector — catalog cards use .ss-cat__media img now.
        var img = card.querySelector('.ss-pro-builder-thumb img') || card.querySelector('.ss-catalog-card__img-wrap img') || card.querySelector('.ss-cat__media img');
        if (!img) return;
        if (img.src !== THUMBNAILS[id]) img.src = THUMBNAILS[id];
        img.loading = 'eager';
        img.decoding = 'async';
      });
    });

    document.querySelectorAll('.ss-cat__pers').forEach(function (badge) {
      badge.textContent = '✦ Name + #';
      badge.title = 'Buyers can add their own name and number to the back';
    });
  }

  function boot() {
    if (!document.querySelector('#apPanelAddProducts') && !document.querySelector('#apCustomBuildersContainer')) return;
    injectLayoutFixes();
    applyThumbs();
    window.setTimeout(function () { injectLayoutFixes(); applyThumbs(); }, 500);
    window.setTimeout(function () { injectLayoutFixes(); applyThumbs(); }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
