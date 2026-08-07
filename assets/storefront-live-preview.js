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

    /* Theme previews may be active through Shopify's theme context even when
       preview_theme_id is not visible in the address bar. Fetch the exact same
       draft theme as the Admin Powers page. */
    try {
      if (!url.searchParams.has('preview_theme_id') && window.Shopify && Shopify.theme && Shopify.theme.id && Shopify.theme.role !== 'main') {
        url.searchParams.set('preview_theme_id', String(Shopify.theme.id));
      }
    } catch(_themeError) {}

    url.searchParams.set('ss_builder_snapshot','1');
    url.searchParams.set('_sfs', String(Date.now()));
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

  function prepareSnapshot(html){
    var parsed = new DOMParser().parseFromString(html, 'text/html');

    /* Shopify deliberately blocks direct framing. A srcdoc snapshot does not
       need runtime scripts, so strip executable/CSP content but keep the real
       Liquid markup, inline styles, and theme stylesheets. */
    parsed.querySelectorAll('script,noscript,iframe,meta[http-equiv="Content-Security-Policy"],meta[http-equiv="content-security-policy"]').forEach(function(node){ node.remove(); });
    parsed.querySelectorAll('*').forEach(function(node){
      Array.from(node.attributes || []).forEach(function(attr){
        if (/^on/i.test(attr.name)) node.removeAttribute(attr.name);
      });
    });

    var base = parsed.createElement('base');
    base.href = window.location.origin + '/';
    parsed.head.insertBefore(base, parsed.head.firstChild);

    var style = parsed.createElement('style');
    style.id = 'sfsSnapshotChrome';
    style.textContent = [
      'html,body{scrollbar-width:none!important;}',
      'body::-webkit-scrollbar,html::-webkit-scrollbar{display:none!important;}',
      '.shopify-section-group-header-group,.shopify-section-group-footer-group{display:none!important;}',
      'header-component,header,footer{display:none!important;}',
      '.ps-preview-banner,[data-private-store-preview-links]{display:none!important;}',
      '#MainContent{padding-top:0!important;margin-top:0!important;min-height:100vh!important;}',
      'body{margin:0!important;overflow:hidden!important;background:transparent!important;}',
      'a,button,input,select,textarea{pointer-events:none!important;}',
      '.ss-smart-jump{display:none!important;}'
    ].join('');
    parsed.head.appendChild(style);

    return '<!doctype html>\n' + parsed.documentElement.outerHTML;
  }

  async function fetchSnapshot(handle){
    var response = await fetch(makeUrl(handle), {
      method:'GET',
      credentials:'same-origin',
      cache:'no-store',
      headers:{'Accept':'text/html'}
    });
    if (!response.ok) throw new Error('Storefront preview returned HTTP ' + response.status);
    var html = await response.text();
    if (!html || html.indexOf('MainContent') === -1) throw new Error('Storefront HTML was incomplete');
    return prepareSnapshot(html);
  }

  function applyState(frame, state){
    var doc;
    try { doc = frame.contentDocument; } catch(_e) { return; }
    if (!doc || !doc.documentElement) return;

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

  async function syncFundraiser(frame, handle){
    var doc;
    try { doc = frame.contentDocument; } catch(_e) { return; }
    if (!doc) return;
    var bar = doc.querySelector('.ss-frbar');
    if (!bar) return;

    try {
      var response = await fetch('/apps/ss/relay/store/' + encodeURIComponent(handle) + '/fundraising/public', {cache:'no-store'});
      var data = await response.json();
      if (!data || !data.enabled || !data.show_bar) {
        bar.hidden = true;
        return;
      }
      var raised = parseFloat(data.total_raised || 0);
      var goal = parseFloat(data.goal || 0);
      var pct = goal > 0 ? Math.min(100,Math.round((raised/goal)*100)) : 100;
      var cause = bar.querySelector('.ss-frbar-cause');
      var fill = bar.querySelector('.ss-frbar-fill');
      var raisedEl = bar.querySelector('[id$="FrBarRaised"]');
      var goalEl = bar.querySelector('[id$="FrBarGoal"]');
      if (cause) cause.textContent = data.cause_name || 'Support our team';
      if (fill) fill.style.width = pct + '%';
      if (raisedEl) raisedEl.textContent = '$' + Math.round(raised).toLocaleString() + ' raised';
      if (goalEl) goalEl.textContent = goal > 0 ? ('of $' + Math.round(goal).toLocaleString() + ' goal') : '';
      bar.hidden = false;
    } catch(_error) {
      bar.hidden = true;
    }
  }

  function makePreview(mode){
    var wrapper = document.createElement('div');
    wrapper.className = 'sfs-real-preview sfs-real-preview--' + mode;

    var label = document.createElement('span');
    label.className = 'sfs-real-preview__label';
    label.textContent = mode === 'desktop' ? 'Desktop — storefront snapshot' : 'Mobile — storefront snapshot';

    var stage = document.createElement('div');
    stage.className = 'sfs-real-preview__stage sfs-real-preview__stage--' + mode;

    var loading = document.createElement('div');
    loading.className = 'sfs-real-preview__loading';
    loading.textContent = 'Loading storefront snapshot…';

    var iframe = document.createElement('iframe');
    iframe.title = mode === 'desktop' ? 'Desktop storefront snapshot' : 'Mobile storefront snapshot';
    iframe.tabIndex = -1;
    iframe.setAttribute('aria-hidden','true');
    iframe.setAttribute('sandbox','allow-same-origin');
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

  function showError(preview, message){
    preview.wrapper.classList.remove('is-loaded');
    var loading = preview.wrapper.querySelector('.sfs-real-preview__loading');
    if (loading) {
      loading.textContent = 'Preview unavailable — ' + message;
      loading.classList.add('is-error');
    }
  }

  async function init(root){
    if (!root || root.dataset.sfsRealPreviewReady === '1') return;
    var overlay = document.querySelector('[data-sfs-overlay]');
    if (!overlay) return;
    var grid = overlay.querySelector('.sfs-preview-grid');
    var source = overlay.querySelector('[data-sfs-preview]');
    if (!grid || !source) return;

    root.dataset.sfsRealPreviewReady = '1';
    grid.classList.add('sfs-preview-grid--real');

    var desktop = makePreview('desktop');
    var mobile = makePreview('mobile');
    grid.appendChild(desktop.wrapper);
    grid.appendChild(mobile.wrapper);

    var previews = [desktop,mobile];
    var handle = root.dataset.shopHandle || '';
    var lastState = readState(source,overlay);

    function sync(){
      lastState = readState(source, overlay);
      previews.forEach(function(preview){ applyState(preview.iframe,lastState); });
    }

    previews.forEach(function(preview){
      preview.iframe.addEventListener('load', function(){
        fit(preview);
        applyState(preview.iframe,lastState);
        syncFundraiser(preview.iframe,handle);
        preview.wrapper.classList.add('is-loaded');
      });
    });

    try {
      var snapshot = await fetchSnapshot(handle);
      previews.forEach(function(preview){ preview.iframe.srcdoc = snapshot; });
    } catch(error) {
      previews.forEach(function(preview){ showError(preview,error.message || 'could not load'); });
    }

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
