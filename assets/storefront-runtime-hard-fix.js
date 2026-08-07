(function(){
  var STYLE_VERSION = 'v3-full-page-designs';

  function important(node, prop, value){
    if (!node || !node.style) return;
    node.style.setProperty(prop, value, 'important');
  }

  function clear(node, props){
    if (!node || !node.style) return;
    props.forEach(function(prop){ node.style.removeProperty(prop); });
  }

  function ensureDesignStyle(doc){
    if (!doc || !doc.head) return;
    var existing = doc.getElementById('ss-runtime-design-tune');
    if (existing && existing.dataset.ssVersion === STYLE_VERSION) return;
    if (existing) existing.remove();

    var style = doc.createElement('style');
    style.id = 'ss-runtime-design-tune';
    style.dataset.ssVersion = STYLE_VERSION;
    style.textContent = [
      '/* FINAL RUNTIME DESIGN LAYER — applies to live storefront and snapshots. */',
      '',
      '/* ---------- GRADIENT GLOW: ONE VIBRANT PAGE ---------- */',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent{',
      '  position:relative!important;',
      '  isolation:isolate!important;',
      '  min-height:100vh!important;',
      '  background:',
      '    radial-gradient(ellipse 92% 78% at -12% -14%,',
      '      color-mix(in srgb,var(--ss-team-primary) 98%,#fff) 0%,',
      '      color-mix(in srgb,var(--ss-team-primary) 84%,#fff) 22%,',
      '      color-mix(in srgb,var(--ss-team-primary) 54%,#fff) 44%,',
      '      color-mix(in srgb,var(--ss-team-primary) 20%,#fff) 63%,',
      '      transparent 78%),',
      '    radial-gradient(ellipse 98% 84% at 112% 114%,',
      '      color-mix(in srgb,var(--ss-team-secondary) 98%,#fff) 0%,',
      '      color-mix(in srgb,var(--ss-team-secondary) 84%,#fff) 23%,',
      '      color-mix(in srgb,var(--ss-team-secondary) 54%,#fff) 46%,',
      '      color-mix(in srgb,var(--ss-team-secondary) 20%,#fff) 65%,',
      '      transparent 80%),',
      '    linear-gradient(135deg,',
      '      color-mix(in srgb,var(--ss-team-primary) 24%,#fff) 0%,',
      '      #fff 48%,',
      '      color-mix(in srgb,var(--ss-team-secondary) 26%,#fff) 100%)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent .shopify-section,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent .section-background,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent .ps-hero,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent results-list,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent .ss-storefront-hero-section,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent .ss-storefront-tabs-section,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent .ss-storefront-products-section{',
      '  background:transparent!important;',
      '  background-color:transparent!important;',
      '  background-image:none!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none .ps-hero-card{',
      '  background:linear-gradient(145deg,rgba(255,255,255,.88),rgba(255,255,255,.68))!important;',
      '  border-color:rgba(255,255,255,.78)!important;',
      '  box-shadow:0 30px 92px rgba(37,22,48,.16),inset 0 1px rgba(255,255,255,.80)!important;',
      '  backdrop-filter:blur(18px) saturate(1.16)!important;',
      '  -webkit-backdrop-filter:blur(18px) saturate(1.16)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none .ps-action-panel{',
      '  background:rgba(255,255,255,.70)!important;',
      '  border-color:rgba(17,19,24,.10)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-none results-list .product-grid__item{',
      '  background:rgba(255,255,255,.93)!important;',
      '  border-color:rgba(17,19,24,.10)!important;',
      '  box-shadow:0 14px 36px rgba(45,26,56,.13)!important;',
      '}',
      '',
      '/* ---------- SPRAY BURST: DARK MODE + TEAM COLOR SPRAY ---------- */',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots #MainContent{',
      '  position:relative!important;',
      '  isolation:isolate!important;',
      '  min-height:100vh!important;',
      '  background-color:#070c13!important;',
      '  background-image:',
      '    radial-gradient(circle at 2% 4%,color-mix(in srgb,var(--ss-team-primary) 92%,transparent) 0 3px,transparent 4px),',
      '    radial-gradient(circle at 7% 13%,color-mix(in srgb,var(--ss-team-primary) 78%,transparent) 0 7px,transparent 8px),',
      '    radial-gradient(circle at 15% 6%,color-mix(in srgb,var(--ss-team-primary) 70%,transparent) 0 4px,transparent 5px),',
      '    radial-gradient(circle at 19% 18%,color-mix(in srgb,var(--ss-team-primary) 52%,transparent) 0 2px,transparent 3px),',
      '    radial-gradient(ellipse 62% 48% at -8% -4%,color-mix(in srgb,var(--ss-team-primary) 62%,transparent),transparent 70%),',
      '    radial-gradient(circle at 96% 82%,color-mix(in srgb,var(--ss-team-secondary) 92%,transparent) 0 5px,transparent 6px),',
      '    radial-gradient(circle at 89% 93%,color-mix(in srgb,var(--ss-team-secondary) 78%,transparent) 0 8px,transparent 9px),',
      '    radial-gradient(circle at 82% 86%,color-mix(in srgb,var(--ss-team-secondary) 60%,transparent) 0 3px,transparent 4px),',
      '    radial-gradient(ellipse 66% 52% at 108% 106%,color-mix(in srgb,var(--ss-team-secondary) 54%,transparent),transparent 72%),',
      '    linear-gradient(145deg,#070c13 0%,#0b121d 48%,#080d15 100%)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots #MainContent .shopify-section,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots #MainContent .section-background,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots #MainContent .ps-hero,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots #MainContent results-list,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots #MainContent .ss-storefront-hero-section,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots #MainContent .ss-storefront-tabs-section,',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots #MainContent .ss-storefront-products-section{',
      '  background:transparent!important;',
      '  background-color:transparent!important;',
      '  background-image:none!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots .ps-hero-card{',
      '  background:linear-gradient(145deg,rgba(12,20,31,.92),rgba(7,12,19,.88))!important;',
      '  border:1px solid rgba(255,255,255,.14)!important;',
      '  box-shadow:0 30px 92px rgba(0,0,0,.42),inset 0 1px rgba(255,255,255,.045)!important;',
      '  backdrop-filter:blur(16px)!important;',
      '  -webkit-backdrop-filter:blur(16px)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots :is(.ps-title,.ps-eyebrow,.ps-action-panel-title){color:#f8fbff!important;}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots .ps-sub{color:#b9c4d0!important;opacity:1!important;}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots .ps-action-panel{',
      '  background:rgba(4,9,16,.68)!important;',
      '  border-color:rgba(255,255,255,.15)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots .ps-meta-row span{',
      '  background:rgba(255,255,255,.085)!important;',
      '  border-color:rgba(255,255,255,.14)!important;',
      '  color:#eef3f8!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots .ps-btn-ghost{',
      '  background:#f1f4f7!important;',
      '  border-color:#d8e0e8!important;',
      '  color:#0a111a!important;',
      '  text-shadow:none!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots .ss-category-tab{',
      '  background:#111b28!important;',
      '  border:1px solid rgba(255,255,255,.18)!important;',
      '  color:#f4f7fa!important;',
      '  font-weight:850!important;',
      '  text-shadow:none!important;',
      '  box-shadow:0 5px 16px rgba(0,0,0,.20)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots .ss-category-tab.active{',
      '  background:var(--ss-team-secondary)!important;',
      '  border-color:var(--ss-team-secondary)!important;',
      '  color:var(--ss-team-secondary-text)!important;',
      '  box-shadow:0 0 0 1px color-mix(in srgb,var(--ss-team-secondary) 28%,transparent),0 0 22px color-mix(in srgb,var(--ss-team-secondary) 22%,transparent)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots results-list .product-grid__item{',
      '  overflow:hidden!important;',
      '  background:#101923!important;',
      '  border:1px solid rgba(255,255,255,.15)!important;',
      '  box-shadow:0 16px 38px rgba(0,0,0,.34)!important;',
      '}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots results-list .product-grid__item :is(.card__content,.card__information,.card-information){background:#101923!important;}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots results-list .product-grid__item :is(.card__inner,.card__media,.media){background:#f4f5f6!important;}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots results-list .product-grid__item :is(a,p,span,strong,small,.price,.price-item,.card__heading){color:#f6f8fb!important;}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots results-list .product-grid__item :is(.caption-with-letter-spacing,.vendor,.card-information>span){color:#b3bec9!important;}',
      'html.ss-store-custom.ss-style-bold.ss-pattern-dots .ss-hero-message{',
      '  background:rgba(4,10,17,.64)!important;',
      '  color:#f4f7fa!important;',
      '  border-color:rgba(255,255,255,.16)!important;',
      '  border-left-color:var(--ss-team-secondary)!important;',
      '}',
      '',
      '/* ---------- PRO DARK: ONE CLEAN CONTINUOUS DARK PAGE ---------- */',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent{',
      '  position:relative!important;',
      '  isolation:isolate!important;',
      '  min-height:100vh!important;',
      '  background-color:#050b12!important;',
      '  background-image:',
      '    linear-gradient(rgba(151,177,205,.034) 1px,transparent 1px),',
      '    linear-gradient(90deg,rgba(151,177,205,.034) 1px,transparent 1px),',
      '    radial-gradient(ellipse 70% 52% at -12% -10%,color-mix(in srgb,var(--ss-team-primary) 34%,transparent),transparent 70%),',
      '    radial-gradient(ellipse 66% 52% at 112% 108%,color-mix(in srgb,var(--ss-team-secondary) 26%,transparent),transparent 72%),',
      '    linear-gradient(145deg,#050b12 0%,#09131f 48%,#060d16 100%)!important;',
      '  background-size:32px 32px,32px 32px,auto,auto,auto!important;',
      '}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent .shopify-section,',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent .section-background,',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent .ps-hero,',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent results-list,',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent .ss-storefront-hero-section,',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent .ss-storefront-tabs-section,',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent .ss-storefront-products-section{',
      '  background:transparent!important;',
      '  background-color:transparent!important;',
      '  background-image:none!important;',
      '}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid .ps-hero-card{',
      '  background:linear-gradient(145deg,rgba(16,27,41,.96),rgba(6,13,22,.94))!important;',
      '  border-color:rgba(151,177,205,.20)!important;',
      '  box-shadow:0 30px 100px rgba(0,0,0,.46),inset 0 1px rgba(255,255,255,.05)!important;',
      '}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid :is(.ps-title,.ps-eyebrow,.ps-action-panel-title){color:#f8fbff!important;}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid .ps-sub{color:#afbdcc!important;opacity:1!important;}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid .ps-action-panel{background:rgba(4,11,19,.70)!important;border-color:rgba(151,177,205,.20)!important;}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid .ps-meta-row span{background:rgba(133,157,184,.09)!important;border-color:rgba(151,177,205,.18)!important;color:#dce6f0!important;}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid .ss-category-tab{',
      '  background:#101b29!important;',
      '  border:1px solid rgba(151,177,205,.22)!important;',
      '  color:#f2f6fa!important;',
      '  font-weight:850!important;',
      '  text-shadow:none!important;',
      '}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid .ss-category-tab.active{',
      '  background:var(--ss-team-secondary)!important;',
      '  border-color:var(--ss-team-secondary)!important;',
      '  color:var(--ss-team-secondary-text)!important;',
      '}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid results-list .product-grid__item{',
      '  overflow:hidden!important;',
      '  background:#0e1722!important;',
      '  border:1px solid rgba(151,177,205,.18)!important;',
      '  box-shadow:0 16px 38px rgba(0,0,0,.34)!important;',
      '}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid results-list .product-grid__item :is(.card__content,.card__information,.card-information){background:#0e1722!important;}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid results-list .product-grid__item :is(.card__inner,.card__media,.media){background:#f2f4f6!important;}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid results-list .product-grid__item :is(a,p,span,strong,small,.price,.price-item,.card__heading){color:#f5f8fb!important;}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid results-list .product-grid__item :is(.caption-with-letter-spacing,.vendor,.card-information>span){color:#aeb9c5!important;}',
      'html.ss-store-custom.ss-style-dark.ss-pattern-grid .ss-hero-message{background:rgba(4,11,19,.62)!important;color:#eef4fa!important;border-color:rgba(151,177,205,.18)!important;border-left-color:var(--ss-team-secondary)!important;}',
      '',
      '@media(max-width:768px){',
      '  html.ss-store-custom.ss-style-bold.ss-pattern-none #MainContent{',
      '    background:',
      '      radial-gradient(ellipse 122% 70% at -18% -12%,color-mix(in srgb,var(--ss-team-primary) 96%,#fff) 0%,color-mix(in srgb,var(--ss-team-primary) 60%,#fff) 38%,transparent 73%),',
      '      radial-gradient(ellipse 122% 74% at 118% 112%,color-mix(in srgb,var(--ss-team-secondary) 96%,#fff) 0%,color-mix(in srgb,var(--ss-team-secondary) 60%,#fff) 40%,transparent 75%),',
      '      #fff!important;',
      '  }',
      '  html.ss-store-custom.ss-style-dark.ss-pattern-grid #MainContent{background-size:24px 24px,24px 24px,auto,auto,auto!important;}',
      '}'
    ].join('\n');
    doc.head.appendChild(style);
  }

  function normalize(doc){
    if (!doc || !doc.querySelector || !doc.documentElement) return;

    ensureDesignStyle(doc);

    var html = doc.documentElement;
    var isCustom = html.classList.contains('ss-store-custom');
    var isProDark = html.classList.contains('ss-style-dark') && html.classList.contains('ss-pattern-grid');
    var isSpray = html.classList.contains('ss-style-bold') && html.classList.contains('ss-pattern-dots');
    var isDarkMode = isProDark || isSpray;

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
      if (isDarkMode) {
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
      if (isDarkMode) {
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
