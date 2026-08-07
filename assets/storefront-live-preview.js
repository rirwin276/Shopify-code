(function(){
  var DESKTOP_WIDTH = 1440;
  var DESKTOP_HEIGHT = 690;
  var MOBILE_WIDTH = 390;
  var MOBILE_HEIGHT = 760;

  function copyPreviewParams(url){
    var current = new URL(window.location.href);
    ['preview_theme_id','pb','_fd'].forEach(function(key){
      if (current.searchParams.has(key)) url.searchParams.set(key,current.searchParams.get(key));
    });

    /* Theme previews can be active through Shopify's theme context even when
       preview_theme_id is not visible in the address bar. Keep the iframe on
       the exact same theme as the Admin Powers page. */
    try {
      if (!url.searchParams.has('preview_theme_id') && window.Shopify && Shopify.theme && Shopify.theme.id && Shopify.theme.role !== 'main') {
        url.searchParams.set('preview_theme_id', String(Shopify.theme.id));
      }
    } catch(_themeError) {}

    url.searchParams.set('ss_builder_preview','1');
    return url;
  }

  function makeUrl(handle){
    return copyPreviewParams(new URL('/collections/' + encodeURIComponent(handle), window.location.origin)).toString();
  }

  function contrast(hex){
    var value = String(hex || '').replace('#','');
    var r = parseInt(value.slice(0,2),16) || 0;
    var g = parseInt(value.slice(2,4),16) || 0;
    var b = parseInt(value.slice(4,6),16) || 0;
    return ((.2126*r + .7152*g + .0722*b)/255) > .58 ? '#111111' : '#ffffff';
  }

  function readState(source, overlay){
    var primary = source.style.getPropertyValue('--sfs-primary').trim() || '#1f2937';
    var secondary = source.style.getPropertyValue('--sfs-secondary').trim() || '#d4af37';
    var announcement = overlay.querySelector('[data-sfs-preview-announcement]');
    return {
      active: source.classList.contains('is-custom'),
      style: source.dataset.style || 'clean',
      pattern: source.dataset.pattern || 'none',
      primary: primary,
      secondary: secondary,
      primaryText: source.style.getPropertyValue('--sfs-primary-text').trim() || contrast(primary),
      secondaryText: source.style.getPropertyValue('--sfs-secondary-text').trim() || contrast(secondary),
      message: announcement ? announcement.textContent.trim() : '',
      showMessage: !!(announcement && !announcement.hidden && announcement.textContent.trim())
    };
  }

  function hideChrome(doc){
    if (!doc || doc.getElementById('sfsRealPreviewReset')) return;
    var style = doc.createElement('style');
    style.id = 'sfsRealPreviewReset';
    style.textContent = [
      'html,body{scrollbar-width:none!important;}',
      'body::-webkit-scrollbar,html::-webkit-scrollbar{display:none!important;}',
      '.shopify-section-group-header-group,.shopify-section-group-footer-group{display:none!important;}',
      'header-component,header,footer{display:none!important;}',
      '.ps-preview-banner,[data-private-store-preview-links]{display:none!important;}',
      '#MainContent{padding-top:0!important;margin-top:0!important;}',
      'body{margin:0!important;overflow:hidden!important;}',
      'a,button,input,select,textarea{pointer-events:none!important;}'
    ].join('');
    (doc.head || doc.documentElement).appendChild(style);
  }

  function applyState(frame, state){
    var doc;
    try { doc = frame.contentDocument; } catch(_e) { return; }
    if (!doc || !doc.documentElement) return;

    hideChrome(doc);
    var html = doc.documentElement;
    ['ss-store-custom','ss-style-clean','ss-style-bold','ss-style-dark','ss-pattern-none','ss-pattern-diagonal','ss-pattern-stripes','ss-pattern-dots','ss-pattern-grid'].forEach(function(name){ html.classList.remove(name); });

    html.style.setProperty('--ss-team-primary', state.primary);
    html.style.setProperty('--ss-team-secondary', state.secondary);
    html.style.setProperty('--ss-team-primary-text', state.primaryText);
    html.style.setProperty('--ss-team-secondary-text', state.secondaryText);

    if (state.active) {
      html.classList.add('ss-store-custom');
      html.classList.add('ss-style-' + state.style);
      html.classList.add('ss-pattern-' + state.pattern);
    }

    var enhancement = doc.querySelector('[data-ss-storefront-enhancements]');
    if (enhancement) {
      enhancement.dataset.enabled = state.active ? 'true' : 'false';
      enhancement.dataset.style = state.style;
      enhancement.dataset.pattern = state.pattern;
    }

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

  function makePreview(mode, handle){
    var wrapper = document.createElement('div');
    wrapper.className = 'sfs-real-preview sfs-real-preview--' + mode;

    var label = document.createElement('span');
    label.className = 'sfs-real-preview__label';
    label.textContent = mode === 'desktop' ? 'Desktop — actual storefront' : 'Mobile — actual storefront';

    var stage = document.createElement('div');
    stage.className = 'sfs-real-preview__stage sfs-real-preview__stage--' + mode;

    var loading = document.createElement('div');
    loading.className = 'sfs-real-preview__loading';
    loading.textContent = 'Loading actual storefront…';

    var iframe = document.createElement('iframe');
    iframe.title = mode === 'desktop' ? 'Actual desktop storefront preview' : 'Actual mobile storefront preview';
    iframe.tabIndex = -1;
    iframe.setAttribute('aria-hidden','true');
    iframe.src = makeUrl(handle);
    iframe.dataset.sfsRealFrame = mode;
    iframe.style.width = (mode === 'desktop' ? DESKTOP_WIDTH : MOBILE_WIDTH) + 'px';
    iframe.style.height = (mode === 'desktop' ? DESKTOP_HEIGHT : MOBILE_HEIGHT) + 'px';

    stage.appendChild(loading);
    stage.appendChild(iframe);
    wrapper.appendChild(label);
    wrapper.appendChild(stage);
    return {wrapper:wrapper,stage:stage,iframe:iframe,mode:mode};
  }

  function fit(preview){
    var naturalWidth = preview.mode === 'desktop' ? DESKTOP_WIDTH : MOBILE_WIDTH;
    var naturalHeight = preview.mode === 'desktop' ? DESKTOP_HEIGHT : MOBILE_HEIGHT;
    var available = preview.stage.clientWidth || naturalWidth;
    var scale = Math.min(1, available / naturalWidth);
    preview.iframe.style.transform = 'scale(' + scale + ')';
    preview.stage.style.height = Math.round(naturalHeight * scale) + 'px';
  }

  function init(root){
    if (!root || root.dataset.sfsRealPreviewReady === '1') return;
    var overlay = document.querySelector('[data-sfs-overlay]');
    if (!overlay) return;
    var grid = overlay.querySelector('.sfs-preview-grid');
    var source = overlay.querySelector('[data-sfs-preview]');
    if (!grid || !source) return;

    root.dataset.sfsRealPreviewReady = '1';
    grid.classList.add('sfs-preview-grid--real');

    var desktop = makePreview('desktop', root.dataset.shopHandle || '');
    var mobile = makePreview('mobile', root.dataset.shopHandle || '');
    grid.appendChild(desktop.wrapper);
    grid.appendChild(mobile.wrapper);

    var previews = [desktop,mobile];
    var lastState = null;

    function sync(){
      lastState = readState(source, overlay);
      previews.forEach(function(preview){ applyState(preview.iframe,lastState); });
    }

    previews.forEach(function(preview){
      preview.iframe.addEventListener('load', function(){
        fit(preview);
        applyState(preview.iframe,lastState || readState(source,overlay));
        preview.wrapper.classList.add('is-loaded');
      });
    });

    new MutationObserver(sync).observe(source,{attributes:true,attributeFilter:['class','data-style','data-pattern','style']});
    overlay.querySelectorAll('[data-sfs-preview-announcement]').forEach(function(node){
      new MutationObserver(sync).observe(node,{attributes:true,childList:true,characterData:true,subtree:true,attributeFilter:['hidden']});
    });

    if (window.ResizeObserver) {
      var resize = new ResizeObserver(function(){ previews.forEach(fit); });
      previews.forEach(function(preview){ resize.observe(preview.stage); });
    } else {
      window.addEventListener('resize',function(){ previews.forEach(fit); });
    }

    sync();
    previews.forEach(fit);
  }

  function boot(){
    document.querySelectorAll('[data-sfs-root]').forEach(function(root){
      window.setTimeout(function(){ init(root); },40);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  document.addEventListener('shopify:section:load',boot);
})();
