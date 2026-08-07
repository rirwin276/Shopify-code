(function(){
  function important(node, property, value){
    if (!node || !node.style) return;
    node.style.setProperty(property, value, 'important');
  }

  function isMobile(doc){
    try {
      var view = doc && doc.defaultView;
      return !!(view && view.matchMedia && view.matchMedia('(max-width: 768px)').matches);
    } catch(_e) {
      return !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    }
  }

  /*
    Structural fix for the category strip.

    The tabs are authored inside the standalone storefront-enhancements Shopify
    section because that section also owns the category data and appearance
    bootstrap. Visually, however, the navigation belongs to the catalog. Move
    the actual <nav> into <results-list>, immediately before the collection
    wrapper. Then rename the outer nav hook so the old section-level :has()
    cleanup rules cannot accidentally style the whole product section.

    The existing category script captures references to the nav/buttons before
    deferred scripts run, so moving the same DOM nodes preserves filtering and
    click handlers. In the appearance-builder snapshot, this file performs the
    same move directly inside the snapshot document.
  */
  function relocateTabs(doc){
    if (!doc || !doc.querySelector) return null;

    var nav = doc.querySelector(
      '[data-ss-category-catalog-nav], .ss-category-catalog-nav, [data-ss-category-nav], .ss-category-nav'
    );
    var results = doc.querySelector('results-list');
    var wrapper = results && results.querySelector('.collection-wrapper');

    if (!nav || !results || !wrapper) return nav;

    if (nav.parentNode !== results || nav.nextElementSibling !== wrapper) {
      results.insertBefore(nav, wrapper);
    }

    nav.classList.remove('ss-category-nav');
    nav.classList.add('ss-category-catalog-nav');
    if (nav.hasAttribute('data-ss-category-nav')) nav.removeAttribute('data-ss-category-nav');
    nav.setAttribute('data-ss-category-catalog-nav', '');

    return nav;
  }

  function cleanTabs(doc){
    if (!doc || !doc.querySelector) return;

    var root = doc.querySelector('[data-ss-storefront-enhancements]');
    var originSection = root && root.closest ? root.closest('.shopify-section') : null;
    var nav = relocateTabs(doc) || doc.querySelector('[data-ss-category-catalog-nav], .ss-category-catalog-nav');
    var tabs = nav ? nav.querySelector('.ss-category-tabs') : doc.querySelector('.ss-category-tabs');

    /* The old enhancements section now contains only hidden data/message source. */
    [root, originSection].forEach(function(node){
      if (!node) return;
      important(node, 'margin', '0');
      important(node, 'padding', '0');
      important(node, 'border', '0');
      important(node, 'border-radius', '0');
      important(node, 'background', 'transparent');
      important(node, 'background-color', 'transparent');
      important(node, 'background-image', 'none');
      important(node, 'box-shadow', 'none');
      important(node, 'min-height', '0');
    });

    if (originSection) {
      var sectionBackground = originSection.querySelector('.section-background');
      if (sectionBackground) important(sectionBackground, 'display', 'none');
    }

    if (root) {
      important(root, 'width', '100%');
    }

    /* Only the individual category buttons should read as pills. */
    if (nav) {
      var mobile = isMobile(doc);
      important(nav, 'display', 'block');
      important(nav, 'width', mobile ? '100%' : 'min(1320px, calc(100% - 40px))');
      important(nav, 'margin', '0 auto');
      important(nav, 'padding', mobile ? '6px 8px 7px' : '9px 0 10px');
      important(nav, 'border', '0');
      important(nav, 'border-radius', '0');
      important(nav, 'background', 'transparent');
      important(nav, 'background-color', 'transparent');
      important(nav, 'background-image', 'none');
      important(nav, 'box-shadow', 'none');
      important(nav, 'backdrop-filter', 'none');
      important(nav, '-webkit-backdrop-filter', 'none');
    }

    if (tabs) {
      important(tabs, 'width', '100%');
      important(tabs, 'margin', '0');
      important(tabs, 'padding', '0');
      important(tabs, 'display', 'flex');
      important(tabs, 'align-items', 'center');
      important(tabs, 'gap', '7px');
      important(tabs, 'overflow-x', 'auto');
      important(tabs, 'border', '0');
      important(tabs, 'border-radius', '0');
      important(tabs, 'background', 'transparent');
      important(tabs, 'background-color', 'transparent');
      important(tabs, 'background-image', 'none');
      important(tabs, 'box-shadow', 'none');
      important(tabs, 'backdrop-filter', 'none');
      important(tabs, '-webkit-backdrop-filter', 'none');
    }
  }

  function cleanFrame(frame){
    if (!frame || !frame.contentDocument) return;
    try { cleanTabs(frame.contentDocument); } catch(_e) {}
  }

  function cleanAll(){
    cleanTabs(document);
    document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(cleanFrame);
  }

  function watchFrame(frame){
    if (!frame || frame.dataset.ssTabRuntimeWatch === '1') return;
    frame.dataset.ssTabRuntimeWatch = '1';
    frame.addEventListener('load', function(){
      window.setTimeout(function(){ cleanFrame(frame); }, 0);
      window.setTimeout(function(){ cleanFrame(frame); }, 120);
      window.setTimeout(function(){ cleanFrame(frame); }, 500);
    });
  }

  function boot(){
    cleanAll();
    document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(watchFrame);

    var observer = new MutationObserver(function(){
      cleanAll();
      document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(watchFrame);
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});

    window.setTimeout(cleanAll, 100);
    window.setTimeout(cleanAll, 350);
    window.setTimeout(cleanAll, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  document.addEventListener('shopify:section:load', cleanAll);
})();