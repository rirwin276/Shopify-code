(function(){
  function contrast(hex){
    var value = String(hex || '').replace('#','');
    var r = parseInt(value.slice(0,2),16) || 0;
    var g = parseInt(value.slice(2,4),16) || 0;
    var b = parseInt(value.slice(4,6),16) || 0;
    return ((.2126*r + .7152*g + .0722*b)/255) > .58 ? '#111111' : '#ffffff';
  }

  function layoutFrom(style, pattern){
    style = style || 'clean';
    pattern = pattern || 'none';
    if (style === 'clean' && pattern === 'diagonal') return 'split';
    if (style === 'bold' && pattern === 'none') return 'gradient';
    if (style === 'bold' && pattern === 'dots') return 'spray';
    if (style === 'dark' && (pattern === 'grid' || pattern === 'dots')) return 'pro';
    if (style === 'clean' && pattern === 'stripes') return 'heritage';
    return 'classic';
  }

  function readBuilderState(){
    var overlay = document.querySelector('[data-sfs-overlay]');
    var source = overlay && overlay.querySelector('[data-sfs-preview]');
    if (!source) return null;

    var primary = source.style.getPropertyValue('--sfs-primary').trim() || '#1f2937';
    var secondary = source.style.getPropertyValue('--sfs-secondary').trim() || '#d4af37';
    var announcement = overlay.querySelector('[data-sfs-preview-announcement]');
    var active = source.classList.contains('is-custom');
    var style = source.dataset.style || 'clean';
    var pattern = source.dataset.pattern || 'none';

    return {
      active: active,
      layout: active ? layoutFrom(style, pattern) : 'original',
      primary: primary,
      secondary: secondary,
      primaryText: contrast(primary),
      secondaryText: contrast(secondary),
      message: announcement ? announcement.textContent.trim() : '',
      showMessage: !!(announcement && !announcement.hidden && announcement.textContent.trim())
    };
  }

  function normalizeCategories(doc){
    var catalog = doc.querySelector('[data-ss-private-catalog]');
    if (!catalog) return;
    var available = {};
    var items = Array.from(catalog.querySelectorAll('.product-grid__item[data-product-id]'));
    items.forEach(function(item){
      (item.dataset.ssCategories || 'other').split(/\s+/).filter(Boolean).forEach(function(category){
        available[category] = true;
      });
    });
    catalog.querySelectorAll('[data-ss-category]').forEach(function(button){
      var category = button.dataset.ssCategory || 'all';
      if (category !== 'all') button.hidden = !available[category];
    });
    var nav = catalog.querySelector('[data-ss-category-nav]');
    if (nav) nav.hidden = !items.length;
  }

  function normalizePartnerJump(doc){
    var jump = doc.querySelector('.ss-smart-jump');
    if (!jump) return;
    var mobile = false;
    try {
      mobile = !!(doc.defaultView && doc.defaultView.matchMedia && doc.defaultView.matchMedia('(max-width: 768px)').matches);
    } catch(_e) {}
    jump.style.setProperty('display', mobile ? 'flex' : 'block', 'important');
  }

  function apply(frame, state){
    if (!frame || !state) return;
    var doc;
    try { doc = frame.contentDocument; } catch(_e) { return; }
    if (!doc) return;

    var root = doc.querySelector('#ss-private-store-state');
    var main = doc.querySelector('#MainContent');
    if (!root || !main) return;

    root.dataset.enabled = state.active ? 'true' : 'false';
    root.dataset.layout = state.layout;
    main.style.setProperty('--ss-team-primary', state.primary);
    main.style.setProperty('--ss-team-secondary', state.secondary);
    main.style.setProperty('--ss-team-primary-text', state.primaryText);
    main.style.setProperty('--ss-team-secondary-text', state.secondaryText);

    normalizeCategories(doc);
    normalizePartnerJump(doc);

    var copy = doc.querySelector('.ps-hero .ps-copy');
    var message = doc.querySelector('.ps-hero .ss-hero-message');
    if (state.showMessage && copy) {
      if (!message) {
        message = doc.createElement('div');
        message.className = 'ss-hero-message';
        copy.appendChild(message);
      }
      message.hidden = false;
      message.textContent = state.message;
    } else if (message) {
      message.hidden = true;
    }
  }

  function sync(){
    var state = readBuilderState();
    if (!state) return;
    document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(function(frame){ apply(frame, state); });
  }

  function watchFrame(frame){
    if (!frame || frame.dataset.ssFixedPreviewWatch === '1') return;
    frame.dataset.ssFixedPreviewWatch = '1';
    frame.addEventListener('load', function(){
      [0,80,250,700].forEach(function(delay){ window.setTimeout(sync,delay); });
    });
  }

  function boot(){
    document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(watchFrame);
    sync();

    var overlay = document.querySelector('[data-sfs-overlay]');
    if (overlay) {
      new MutationObserver(sync).observe(overlay, {
        attributes:true,
        childList:true,
        subtree:true,
        characterData:true,
        attributeFilter:['class','style','data-style','data-pattern','hidden']
      });
    }

    new MutationObserver(function(){
      document.querySelectorAll('iframe[data-sfs-real-frame]').forEach(watchFrame);
      sync();
    }).observe(document.documentElement,{childList:true,subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  document.addEventListener('shopify:section:load',boot);
})();
