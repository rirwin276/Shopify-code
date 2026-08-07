(function(){
  function important(node, property, value){
    if (!node || !node.style) return;
    node.style.setProperty(property, value, 'important');
  }

  function cleanTabs(doc){
    if (!doc || !doc.querySelector) return;

    var root = doc.querySelector('[data-ss-storefront-enhancements]');
    var nav = doc.querySelector('[data-ss-category-nav], .ss-category-nav');
    var tabs = doc.querySelector('.ss-category-tabs');
    var section = root && root.closest ? root.closest('.shopify-section') : null;

    [root, nav, tabs, section].forEach(function(node){
      if (!node) return;
      important(node, 'background', 'transparent');
      important(node, 'background-color', 'transparent');
      important(node, 'background-image', 'none');
      important(node, 'border', '0');
      important(node, 'border-radius', '0');
      important(node, 'box-shadow', 'none');
      important(node, 'backdrop-filter', 'none');
      important(node, '-webkit-backdrop-filter', 'none');
    });

    if (section) {
      important(section, 'margin', '0');
      important(section, 'padding', '0');
      var sectionBackground = section.querySelector('.section-background');
      if (sectionBackground) important(sectionBackground, 'display', 'none');
    }

    if (root) {
      important(root, 'width', '100%');
      important(root, 'margin', '0');
      important(root, 'padding', '0');
    }

    if (nav) {
      important(nav, 'width', window.matchMedia && window.matchMedia('(max-width: 768px)').matches ? '100%' : 'min(1320px, calc(100% - 40px))');
      important(nav, 'margin', '0 auto');
      important(nav, 'padding', window.matchMedia && window.matchMedia('(max-width: 768px)').matches ? '6px 8px 7px' : '9px 0 10px');
    }

    if (tabs) {
      important(tabs, 'width', '100%');
      important(tabs, 'margin', '0');
      important(tabs, 'padding', '0');
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
