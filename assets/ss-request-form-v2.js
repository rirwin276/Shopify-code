(function(){
  var path = window.location.pathname || '';
  var DASHBOARD_URL = '/pages/portal';
  var STOREFRONT_FORM_URL = '/pages/request-storefront-form';

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function normalizeText(value){
    return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isPlainSignInText(text){
    if (!text) return false;
    if (text === 'sign in' || text === 'log in' || text === 'login') return true;
    if ((text.indexOf('sign in') !== -1 || text.indexOf('log in') !== -1) && text.indexOf('store') === -1 && text.indexOf('storefront') === -1) return true;
    return false;
  }

  function isStorefrontCreateText(text){
    if (!text) return false;
    var hasAction = text.indexOf('create') !== -1 || text.indexOf('start') !== -1 || text.indexOf('request') !== -1 || text.indexOf('build') !== -1 || text.indexOf('launch') !== -1 || text.indexOf('open') !== -1;
    var hasStore = text.indexOf('storefront') !== -1 || text.indexOf('store front') !== -1 || text.indexOf('store') !== -1 || text.indexOf('shop') !== -1;
    return hasAction && hasStore;
  }

  function hrefLooksLikeStorefrontIntent(href){
    href = String(href || '');
    return href.indexOf('/pages/request-storefront-form') !== -1 || href.indexOf('/pages/storefront') !== -1;
  }

  function getExactFormLoginHref(){
    if (window.SS && window.SS.auth && window.SS.auth.loginToStorefrontForm) {
      return window.SS.auth.loginToStorefrontForm;
    }
    var best = null;
    qsa('a[href]').some(function(link){
      var href = link.getAttribute('href') || '';
      if (href.indexOf('return_to=') !== -1 && href.indexOf('/pages/portal') !== -1) {
        best = href.replace(encodeURIComponent(DASHBOARD_URL), encodeURIComponent(STOREFRONT_FORM_URL)).replace(DASHBOARD_URL, STOREFRONT_FORM_URL);
        return true;
      }
      return false;
    });
    return best || ('/account/login?return_to=' + encodeURIComponent(STOREFRONT_FORM_URL));
  }

  function markPendingSignin(returnPath){
    try {
      localStorage.setItem('sf_pending_signin_v1', JSON.stringify({
        return_path: returnPath,
        _saved_at: Date.now()
      }));
    } catch(e) {}
  }

  function rewriteAuthAndStorefrontLinks(){
    qsa('a[href]').forEach(function(link){
      var text = normalizeText(link.textContent || link.getAttribute('aria-label') || link.title || '');
      var href = link.getAttribute('href') || '';

      if (isStorefrontCreateText(text) || hrefLooksLikeStorefrontIntent(href)) {
        link.setAttribute('href', STOREFRONT_FORM_URL);
        link.removeAttribute('onclick');
        return;
      }

      if (isPlainSignInText(text) && href.indexOf('/account') !== -1) {
        if (text.indexOf('order') === -1 && text.indexOf('profile') === -1 && text !== 'account') {
          link.setAttribute('href', DASHBOARD_URL);
          link.removeAttribute('onclick');
        }
      }
    });

    qsa('[data-storefront-request-form] .sf-auth-actions a.sf-btn--solid').forEach(function(link){
      link.setAttribute('href', getExactFormLoginHref());
      link.setAttribute('data-ss-auth-form-gate', '1');
      link.setAttribute('onclick', "try{localStorage.setItem('sf_pending_signin_v1',JSON.stringify({return_path:'/pages/request-storefront-form',_saved_at:Date.now()}))}catch(e){}");
      if (link.dataset.ssAuthFormWired === '1') return;
      link.dataset.ssAuthFormWired = '1';
      link.addEventListener('click', function(){ markPendingSignin(STOREFRONT_FORM_URL); }, { capture: true });
    });
  }

  function getUploaderBase(){
    var fallback = 'https://studio-uploader-production.up.railway.app';
    if (window.SF_UPLOADER_BASE) return String(window.SF_UPLOADER_BASE).replace(/\/+$/,'');
    try {
      if (typeof SF_UPLOADER_BASE !== 'undefined' && SF_UPLOADER_BASE) return String(SF_UPLOADER_BASE).replace(/\/+$/,'');
    } catch(e) {}
    return fallback;
  }

  function waitForForm(){
    var form = qs('#sf-request-form');
    if (!form) return setTimeout(waitForForm, 80);
    simplifyForm(form);
  }

  function labelFor(el){
    if (!el) return null;
    if (el.id) {
      var l = qs('label[for="' + el.id + '"]');
      if (l) return l;
    }
    return el.closest('.sf-field') ? qs('.sf-label', el.closest('.sf-field')) : null;
  }

  function hideFieldBySelector(sel){
    var el = qs(sel);
    if (!el) return;
    var field = el.closest('.sf-field');
    if (field) field.classList.add('ss-request-v2-hidden');
    el.required = false;
    el.disabled = true;
  }

  function simplifyForm(form){
    document.documentElement.classList.add('ss-request-v2');

    hideFieldBySelector('[name="user_count"]');
    hideFieldBySelector('[name="duration"]');
    hideFieldBySelector('#BranchInput');
    hideFieldBySelector('#SportInput');
    var military = qs('#MilitaryBranch'); if (military) military.classList.add('ss-request-v2-hidden');
    var sport = qs('#SportType'); if (sport) sport.classList.add('ss-request-v2-hidden');

    var org = qs('#OrgType');
    if (org) {
      org.innerHTML = '<option value="" disabled selected>Select store type...</option><option value="Sports Team">Sports Team</option><option value="Small Business">Small Business</option><option value="Other">Other</option>';
      org.required = true;
      var orgLabel = labelFor(org); if (orgLabel) orgLabel.textContent = 'Store Type *';
      org.onchange = function(){
        var hidden = qs('#SF_TYPE_OF_STORE');
        if (hidden) hidden.value = org.value || '';
        if (typeof window.updateSubmitEnabled === 'function') window.updateSubmitEnabled();
      };
    }

    var color = qs('#PrimaryColor');
    if (color) {
      var colorLabel = labelFor(color); if (colorLabel) colorLabel.textContent = 'Preferred Default Shirt Color *';
      var help = color.closest('.sf-field') ? qs('.sf-help', color.closest('.sf-field')) : null;
      if (help) help.textContent = 'Pick the shirt color you want shown first in your store. You can still offer other colors later.';
    }

    var title = qs('.sf-h1'); if (title) title.textContent = 'Request a Storefront';
    var sub = qs('.sf-sub'); if (sub) sub.textContent = 'Upload your logo, pick a preferred shirt color, and we will build your private merch store.';

    var logoText = qs('#MainLogoText'); if (logoText) logoText.textContent = 'Upload & review logo';
    var drop = qs('#MainLogoDrop');
    if (drop && !drop.dataset.ssRequestV2Wired) {
      drop.dataset.ssRequestV2Wired = '1';
      drop.classList.add('ss-request-upload-card');
      if (!qs('.ss-request-upload-button', drop)) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ss-request-upload-button';
        btn.textContent = 'Choose Image';
        drop.appendChild(btn);
      }
    }

    if (typeof window.openUploaderModal === 'function' && !window.__ssRequestOpenPatched) {
      window.__ssRequestOpenPatched = true;
      window.openUploaderModal = function(){
        var modal = qs('#sf-uploader-modal');
        var iframe = qs('#sf-uploader-iframe');
        if (!modal || !iframe) return false;
        var base = getUploaderBase();
        if (!base) {
          alert('Studio Uploader URL not configured in section settings.');
          return false;
        }
        if (modal.parentNode !== document.body) document.body.appendChild(modal);
        iframe.src = base + '/ui?embed=1&return=postmessage&slot=main&mode=request&autopick=1';
        modal.classList.remove('sf-hidden');
        modal.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
        return false;
      };
    }

    qsa('.sf-legend').forEach(function(el){
      if (/basics/i.test(el.textContent || '')) el.textContent = 'Store Details';
      if (/logo/i.test(el.textContent || '')) el.textContent = 'Logo Upload';
    });
  }

  function setFrwViewportHeight(){
    if (path.indexOf('/pages/admin-powers') !== 0) return;
    var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    if (!h) return;
    document.documentElement.style.setProperty('--ss-frw-vh', (h * 0.01) + 'px');
  }

  function installAdminNoFlashGuards(){
    if (path.indexOf('/pages/admin-powers') !== 0) return;
    if (!document.head || document.getElementById('ss-admin-no-flash-guards')) return;
    var style = document.createElement('style');
    style.id = 'ss-admin-no-flash-guards';
    style.textContent = [
      '.ap-share-overlay:not(.open),.ap-frw-overlay:not(.open),.ap-frd-overlay:not(.open),.ap-nuke-overlay:not(.open),.ap-rebuild-overlay:not(.open),.ap-editor-overlay:not(.open){display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important}',
      '.ap-main-panel:not(.active){display:none!important}',
      '.ap-main-panel.active{display:block!important}',
      '.ap-frw-overlay:not(.open) .ap-frw-step-content{display:none!important}',
      '.ap-frw-overlay.open .ap-frw-step-content:not(.ap-frw-active){display:none!important}',
      '.ap-frw-overlay.open .ap-frw-step-content.ap-frw-active{display:flex!important;flex-direction:column!important}',

      'html.ss-frw-modal-open,body.ss-frw-modal-open{overflow:hidden!important;overscroll-behavior:none!important}',
      '.ap-frw-overlay.open{position:fixed!important;inset:0!important;width:100vw!important;height:calc(var(--ss-frw-vh,1vh)*100)!important;max-height:calc(var(--ss-frw-vh,1vh)*100)!important;overflow:hidden!important;align-items:center!important;justify-content:center!important;touch-action:none!important}',
      '.ap-frw-modal{min-height:0!important;max-height:calc((var(--ss-frw-vh,1vh)*100) - 32px)!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}',
      '.ap-frw-step-content{min-height:0!important;overflow:hidden!important;flex:1 1 auto!important}',
      '.ap-frw-body{min-height:0!important;flex:1 1 auto!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important}',
      '.ap-frw-hero,.ap-frw-footer{flex:0 0 auto!important}',
      '@media(max-width:600px){.ap-frw-overlay.open{align-items:stretch!important;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom))!important}.ap-frw-modal{width:100%!important;height:calc((var(--ss-frw-vh,1vh)*100) - 20px - env(safe-area-inset-top) - env(safe-area-inset-bottom))!important;max-height:none!important;border-radius:24px!important}.ap-frw-body{padding:20px!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function installFundraiserWizardMobileScrollGuard(){
    if (path.indexOf('/pages/admin-powers') !== 0) return;

    var overlay = null;
    var overlayObserver = null;
    var wired = false;

    function syncLockState(){
      overlay = overlay || qs('#apFrwOverlay');
      var isOpen = !!(overlay && overlay.classList.contains('open'));
      document.documentElement.classList.toggle('ss-frw-modal-open', isOpen);
      if (document.body) document.body.classList.toggle('ss-frw-modal-open', isOpen);
      if (isOpen) setFrwViewportHeight();
    }

    function wireOverlay(){
      overlay = qs('#apFrwOverlay');
      if (!overlay) return false;
      if (wired) { syncLockState(); return true; }
      wired = true;
      overlay.dataset.ssFrwScrollGuard = '1';

      overlayObserver = new MutationObserver(syncLockState);
      overlayObserver.observe(overlay, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });

      overlay.addEventListener('touchmove', function(e){
        if (e.target === overlay) e.preventDefault();
      }, { passive: false });

      syncLockState();
      return true;
    }

    setFrwViewportHeight();
    window.addEventListener('resize', setFrwViewportHeight);
    window.addEventListener('orientationchange', function(){ setTimeout(setFrwViewportHeight, 250); });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setFrwViewportHeight);
      window.visualViewport.addEventListener('scroll', setFrwViewportHeight);
    }

    var attempts = 0;
    var timer = window.setInterval(function(){
      attempts += 1;
      if (wireOverlay() || attempts > 100) window.clearInterval(timer);
    }, 100);

    try {
      var docObserver = new MutationObserver(function(){
        if (wireOverlay()) docObserver.disconnect();
      });
      docObserver.observe(document.documentElement, { childList: true, subtree: true });
    } catch(e) {}
  }

  function init(){
    installAdminNoFlashGuards();
    installFundraiserWizardMobileScrollGuard();

    rewriteAuthAndStorefrontLinks();
    setTimeout(rewriteAuthAndStorefrontLinks, 150);
    setTimeout(rewriteAuthAndStorefrontLinks, 600);
    setTimeout(rewriteAuthAndStorefrontLinks, 1500);

    try {
      var observer = new MutationObserver(function(){ rewriteAuthAndStorefrontLinks(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch(e) {}

    if (path.indexOf('/pages/request') === 0 || path.indexOf('/pages/private-storefronts') === 0 || path.indexOf('/pages/storefront') === 0) {
      waitForForm();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();