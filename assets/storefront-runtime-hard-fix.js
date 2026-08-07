(function(){
  function important(node, prop, value){
    if (!node || !node.style) return;
    node.style.setProperty(prop, value, 'important');
  }

  function clear(node, props){
    if (!node || !node.style) return;
    props.forEach(function(prop){ node.style.removeProperty(prop); });
  }

  function normalize(doc){
    if (!doc || !doc.querySelector || !doc.documentElement) return;

    var html = doc.documentElement;
    var isCustom = html.classList.contains('ss-store-custom');
    var isProDark = html.classList.contains('ss-style-dark') && html.classList.contains('ss-pattern-grid');

    var nav = doc.querySelector('[data-ss-category-catalog-nav], .ss-category-catalog-nav, [data-ss-category-nav], .ss-category-nav');
    var results = doc.querySelector('results-list');
    var wrapper = results && results.querySelector('.collection-wrapper');
    var originSection = nav && nav.closest ? nav.closest('.shopify-section') : null;
    var resultsSection = results && results.closest ? results.closest('.shopify-section') : null;

    if (nav && results && wrapper && nav.parentNode !== results) {
      results.insertBefore(nav, wrapper);
    }

    if (nav) {
      nav.classList.remove('ss-category-nav');
      nav.classList.add('ss-category-catalog-nav');
      nav.removeAttribute('data-ss-category-nav');
      nav.setAttribute('data-ss-category-catalog-nav','');
      important(nav,'display','block');
      important(nav,'width','min(1320px, calc(100% - 40px))');
      important(nav,'margin','0 auto');
      important(nav,'padding','9px 0 10px');
      important(nav,'background','transparent');
      important(nav,'background-color','transparent');
      important(nav,'background-image','none');
      important(nav,'border','0');
      important(nav,'border-radius','0');
      important(nav,'box-shadow','none');
      important(nav,'backdrop-filter','none');
      important(nav,'-webkit-backdrop-filter','none');
    }

    var tabs = nav ? nav.querySelector('.ss-category-tabs') : doc.querySelector('.ss-category-tabs');
    if (tabs) {
      important(tabs,'display','flex');
      important(tabs,'align-items','center');
      important(tabs,'width','100%');
      important(tabs,'margin','0');
      important(tabs,'padding','0');
      important(tabs,'gap','7px');
      important(tabs,'overflow-x','auto');
      important(tabs,'background','transparent');
      important(tabs,'background-color','transparent');
      important(tabs,'background-image','none');
      important(tabs,'border','0');
      important(tabs,'border-radius','0');
      important(tabs,'box-shadow','none');
      important(tabs,'backdrop-filter','none');
      important(tabs,'-webkit-backdrop-filter','none');
    }

    /* Once the nav is moved, its original Shopify section contains only hidden data. */
    if (originSection && originSection !== resultsSection) {
      important(originSection,'display','none');
      important(originSection,'margin','0');
      important(originSection,'padding','0');
      var originBg = originSection.querySelector('.section-background');
      if (originBg) important(originBg,'display','none');
    }

    if (isCustom && results) {
      important(results,'background','transparent');
      important(results,'background-color','transparent');
      important(results,'background-image','none');
      if (resultsSection) {
        important(resultsSection,'background','transparent');
        important(resultsSection,'background-color','transparent');
        important(resultsSection,'background-image','none');
        var resultBg = resultsSection.querySelector(':scope > .section-background');
        if (resultBg) important(resultBg,'display','none');
      }
    }

    var share = doc.querySelector('#psShareStoreBtn, .ps-action-panel .ps-btn-soft');
    if (share) {
      if (isProDark) {
        important(share,'background','#f1f5f9');
        important(share,'background-color','#f1f5f9');
        important(share,'color','#07101a');
        important(share,'border-color','#d5dee8');
        important(share,'text-shadow','none');
        important(share,'box-shadow','0 8px 24px rgba(0,0,0,.16)');
      } else {
        clear(share,['background','background-color','color','border-color','text-shadow','box-shadow']);
      }
    }

    var mobileShare = doc.querySelector('#psShareStoreBtnMobile');
    if (mobileShare) {
      if (isProDark) {
        important(mobileShare,'background','#f1f5f9');
        important(mobileShare,'background-color','#f1f5f9');
        important(mobileShare,'color','#07101a');
        important(mobileShare,'border-color','#d5dee8');
      } else {
        clear(mobileShare,['background','background-color','color','border-color']);
      }
    }

    try {
      var mobile = !!(doc.defaultView && doc.defaultView.matchMedia && doc.defaultView.matchMedia('(max-width: 768px)').matches);
      if (mobile && nav) {
        important(nav,'width','100%');
        important(nav,'padding','6px 8px 7px');
      }
    } catch(_e) {}
  }

  function normalizeFrame(frame){
    if (!frame || !frame.contentDocument) return;
    try { normalize(frame.contentDocument); } catch(_e) {}
  }

  function run(){
    normalize(document);
    document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(normalizeFrame);
  }

  function watchFrame(frame){
    if (!frame || frame.dataset.ssHardFixWatch === '1') return;
    frame.dataset.ssHardFixWatch = '1';
    frame.addEventListener('load', function(){
      [0,80,250,700,1500].forEach(function(delay){
        window.setTimeout(function(){ normalizeFrame(frame); }, delay);
      });
    });
  }

  function boot(){
    run();
    document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(watchFrame);

    new MutationObserver(function(){
      run();
      document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(watchFrame);
    }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});

    [50,150,400,900,1800,3000].forEach(function(delay){ window.setTimeout(run,delay); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  document.addEventListener('shopify:section:load',run);
})();
