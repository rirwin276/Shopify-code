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

    try {
      if (!url.searchParams.has('preview_theme_id') && window.Shopify && Shopify.theme && Shopify.theme.id && Shopify.theme.role !== 'main') {
        url.searchParams.set('preview_theme_id', String(Shopify.theme.id));
      }
    } catch(_themeError) {}

    url.searchParams.set('ss_builder_snapshot','1');
    url.searchParams.set('_sfs', String(Date.now()));
    return url;
  }

  function templateView(state){
    if (!state || !state.active || !state.layout || state.layout === 'original') return 'private-store';
    return 'private-store-' + state.layout;
  }

  function makeUrl(handle, view){
    var url = new URL('/collections/' + encodeURIComponent(handle), window.location.origin);
    url.searchParams.set('view', view || 'private-store');
    return copyPreviewParams(url).toString();
  }

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

  function readState(source, overlay){
    var primary = source.style.getPropertyValue('--sfs-primary').trim() || '#1f2937';
    var secondary = source.style.getPropertyValue('--sfs-secondary').trim() || '#d4af37';
    var announcement = overlay.querySelector('[data-sfs-preview-announcement]');
    var active = source.classList.contains('is-custom');
    var layout = source.dataset.layout || layoutFrom(source.dataset.style, source.dataset.pattern);
    return {
      active: active,
      layout: active ? layout : 'original',
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

    /* The preview uses the actual alternate-template HTML. Scripts are stripped
       only because srcdoc cannot safely execute the live storefront runtime. */
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
      'a,button,input,select,textarea{pointer-events:none!important;}'
    ].join('');
    parsed.head.appendChild(style);

    return '<!doctype html>\n' + parsed.documentElement.outerHTML;
  }

  async function fetchSnapshot(handle, view){
    var response = await fetch(makeUrl(handle, view), {
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

  function normalizeCategories(doc){
    var catalog = doc.querySelector('[data-ss-private-catalog]');
    if (!catalog) return;
    var available = {};
    var items = Array.from(catalog.querySelectorAll('.product-grid__item[data-product-id]'));
    items.forEach(function(item){
      (item.dataset.ssCategories || 'other').split(/\s+/).filter(Boolean).forEach(function(category){ available[category] = true; });
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

  function applyState(frame, state){
    var doc;
    try { doc = frame.contentDocument; } catch(_e) { return; }
    if (!doc) return;

    var main = doc.querySelector('#MainContent');
    if (main) {
      main.style.setProperty('--ss-team-primary', state.primary);
      main.style.setProperty('--ss-team-secondary', state.secondary);
      main.style.setProperty('--ss-team-primary-text', state.primaryText);
      main.style.setProperty('--ss-team-secondary-text', state.secondaryText);
    }

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
    label.textContent = mode === 'desktop' ? 'Desktop — actual template' : 'Mobile — actual template';

    var stage = document.createElement('div');
    stage.className = 'sfs-real-preview__stage sfs-real-preview__stage--' + mode;

    var loading = document.createElement('div');
    loading.className = 'sfs-real-preview__loading';
    loading.textContent = 'Loading selected storefront template…';

    var iframe = document.createElement('iframe');
    iframe.title = mode === 'desktop' ? 'Desktop storefront template preview' : 'Mobile storefront template preview';
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
    var lastView = null;
    var requestToken = 0;
    var syncTimer = null;

    previews.forEach(function(preview){
      preview.iframe.addEventListener('load', function(){
        fit(preview);
        applyState(preview.iframe,lastState);
        syncFundraiser(preview.iframe,handle);
        preview.wrapper.classList.add('is-loaded');
      });
    });

    async function sync(){
      lastState = readState(source, overlay);
      var view = templateView(lastState);

      if (view === lastView) {
        previews.forEach(function(preview){ applyState(preview.iframe,lastState); });
        return;
      }

      lastView = view;
      var token = ++requestToken;
      try {
        var snapshot = await fetchSnapshot(handle, view);
        if (token !== requestToken) return;
        previews.forEach(function(preview){
          preview.wrapper.classList.remove('is-loaded');
          preview.iframe.srcdoc = snapshot;
        });
      } catch(error) {
        if (token !== requestToken) return;
        previews.forEach(function(preview){ showError(preview,error.message || 'could not load'); });
      }
    }

    function scheduleSync(){
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(sync, 35);
    }

    new MutationObserver(scheduleSync).observe(source,{attributes:true,attributeFilter:['class','data-layout','data-style','data-pattern','style']});
    overlay.querySelectorAll('[data-sfs-preview-announcement]').forEach(function(node){
      new MutationObserver(scheduleSync).observe(node,{attributes:true,childList:true,characterData:true,subtree:true,attributeFilter:['hidden']});
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
