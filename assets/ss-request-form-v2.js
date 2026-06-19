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

  function init(){
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

/*
  Stella & Sage fundraiser dashboard hardening
  ------------------------------------------------------------
  This asset is already loaded globally by theme.liquid, so keep this
  route-guarded. It fixes the mobile dashboard fundraiser module, tightens the
  admin top-card fundraiser panel, and aggressively hides the start button after
  the server reports an active fundraiser.
*/
(function(){
  var path = window.location.pathname || '';
  var isAdmin = path.indexOf('/pages/admin-powers') === 0;
  var isPortal = path.indexOf('/pages/portal') === 0;
  if (!isAdmin && !isPortal) return;

  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function money(n){
    n = Number(n || 0);
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function getShopHandle(){
    try {
      var params = new URLSearchParams(window.location.search || '');
      var fromUrl = (params.get('shop') || '').trim();
      if (fromUrl) return fromUrl;
    } catch(e) {}
    if (window.SSAP && SSAP.shopHandle) return String(SSAP.shopHandle || '').trim();
    var card = document.querySelector('[data-ss-handle]');
    if (card) return String(card.getAttribute('data-ss-handle') || '').trim();
    return '';
  }
  function injectStyles(){
    if (document.getElementById('ss-fr-dashboard-hotfix-css')) return;
    var css = document.createElement('style');
    css.id = 'ss-fr-dashboard-hotfix-css';
    css.textContent = [
      'html.ss-fr-active #apFrLaunchBtn, html.ss-fr-active .ap-btn--fr-start, .ss-fr-force-hidden{display:none!important;visibility:hidden!important;pointer-events:none!important;}',
      '.ap-fr-zone{margin:14px 0 18px!important;}',
      '.ap-fr-zone.ap-fr-zone--active .ap-fr-zone-empty{display:none!important;}',
      '.ap-fr-zone:not(.ap-fr-zone--active) .ap-fr-zone-active{display:none!important;}',
      '.ap-fr-zone-active{padding:14px 16px!important;border-radius:20px!important;background:linear-gradient(135deg,rgba(20,83,45,.82),rgba(8,35,23,.76))!important;border:1px solid rgba(134,239,172,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important;}',
      '.ap-fr-zone-active-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin-bottom:10px!important;}',
      '.ap-fr-zone-badge{display:inline-flex!important;align-items:center!important;gap:8px!important;padding:8px 12px!important;border-radius:999px!important;background:rgba(34,197,94,.12)!important;color:#86efac!important;font-size:11px!important;font-weight:900!important;letter-spacing:.13em!important;text-transform:uppercase!important;line-height:1!important;white-space:nowrap!important;}',
      '.ap-btn--fr-details{height:38px!important;padding:0 14px!important;border-radius:999px!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.13)!important;color:#fff!important;font-size:13px!important;font-weight:800!important;white-space:nowrap!important;}',
      '.ap-fr-zone-title{display:none!important;}',
      '.ap-fr-zone-sub{margin:0 0 8px!important;color:rgba(255,255,255,.70)!important;font-size:12px!important;line-height:1.3!important;}',
      '.ap-fr-zone-progress{margin-top:8px!important;}',
      '.ap-fr-zone-bar{height:7px!important;border-radius:999px!important;background:rgba(255,255,255,.16)!important;overflow:hidden!important;}',
      '.ap-fr-zone-bar-fill{height:100%!important;border-radius:999px!important;background:linear-gradient(90deg,#22c55e,#86efac)!important;}',
      '.ap-fr-zone-progress-meta{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin-top:9px!important;color:rgba(255,255,255,.72)!important;font-size:13px!important;line-height:1!important;}',
      '#apFrZoneRaised{font-size:18px!important;font-weight:900!important;color:#fff!important;letter-spacing:-.03em!important;}',
      '#apFrZoneGoal{margin-left:auto!important;text-align:right!important;color:rgba(255,255,255,.78)!important;font-size:13px!important;}',
      '.ss-portal .ss-fr-strip{grid-column:1/-1!important;margin-top:14px!important;padding:12px 14px!important;border-radius:18px!important;background:linear-gradient(135deg,rgba(20,83,45,.76),rgba(9,38,26,.68))!important;border:1px solid rgba(134,239,172,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important;}',
      '.ss-portal .ss-fr-strip-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;}',
      '.ss-portal .ss-fr-pill{display:inline-flex!important;align-items:center!important;gap:8px!important;padding:7px 10px!important;border-radius:999px!important;background:rgba(34,197,94,.13)!important;color:#86efac!important;font-size:10px!important;font-weight:900!important;letter-spacing:.13em!important;text-transform:uppercase!important;white-space:nowrap!important;}',
      '.ss-portal .ss-fr-cause{display:none!important;}',
      '.ss-portal .ss-fr-days{margin-left:auto!important;color:rgba(255,255,255,.74)!important;font-size:12px!important;font-weight:800!important;white-space:nowrap!important;}',
      '.ss-portal .ss-fr-progress{display:block!important;margin-top:10px!important;}',
      '.ss-portal .ss-fr-bar{height:7px!important;border-radius:999px!important;background:rgba(255,255,255,.15)!important;overflow:hidden!important;}',
      '.ss-portal .ss-fr-bar-fill{height:100%!important;border-radius:999px!important;background:linear-gradient(90deg,#22c55e,#86efac)!important;}',
      '.ss-portal .ss-fr-meta{display:flex!important;align-items:center!important;justify-content:space-between!important;margin-top:8px!important;color:rgba(255,255,255,.78)!important;font-size:12px!important;line-height:1!important;}',
      '@media (max-width:700px){.ap-hero{padding:22px 18px!important;margin-bottom:12px!important;border-radius:28px!important}.ap-hero-title-row{gap:12px!important}.ap-hero-logo{width:60px!important;height:60px!important;border-radius:18px!important}.ap-hero h1{font-size:clamp(36px,11vw,52px)!important;line-height:.93!important}.ap-hero-actions{gap:8px!important;margin-top:16px!important}.ap-hero-actions .ap-btn{min-height:48px!important;border-radius:24px!important}.ap-share-help{grid-column:1/-1!important}.ap-fr-zone-active{padding:13px 14px!important;border-radius:18px!important}.ap-fr-zone-badge{font-size:10px!important;padding:7px 10px!important}.ap-btn--fr-details{height:34px!important;font-size:12px!important;padding:0 11px!important}.ap-fr-zone-sub{font-size:11px!important}.ap-fr-zone-progress-meta{font-size:12px!important}#apFrZoneRaised{font-size:17px!important}.ss-portal .ss-fr-strip{padding:11px 12px!important;margin-top:12px!important;border-radius:17px!important}.ss-portal .ss-fr-meta{font-size:11px!important}.ss-portal .ss-fr-bar{height:6px!important}}'
    ].join('\n');
    document.head.appendChild(css);
  }
  function hideStartButtons(){
    if (!isAdmin) return;
    var reStart = /start\s+(a\s+)?fundraiser|start\s+fundraiser|fundraiser\s+campaign/i;
    qsa('#apFrLaunchBtn, .ap-btn--fr-start, a, button').forEach(function(el){
      if (!el) return;
      var txt = (el.textContent || el.getAttribute('aria-label') || el.title || '').replace(/\s+/g, ' ').trim();
      var isStart = el.id === 'apFrLaunchBtn' || el.classList.contains('ap-btn--fr-start') || reStart.test(txt);
      var isSafe = /view details|edit|end fundraiser|stop|hub|details/i.test(txt);
      if (isStart && !isSafe) {
        el.classList.add('ss-fr-force-hidden');
        el.setAttribute('aria-hidden', 'true');
        if ('disabled' in el) el.disabled = true;
      }
    });
  }
  function applyAdminActive(data){
    document.documentElement.classList.add('ss-fr-active');
    if (document.body) document.body.classList.add('ss-fr-active');
    var zone = document.getElementById('apFrZone');
    if (zone) zone.classList.add('ap-fr-zone--active');
    var settingsRow = document.getElementById('apFrSettingsRow');
    if (settingsRow) settingsRow.style.display = '';
    hideStartButtons();
    if (!data) return;
    var cause = String(data.cause_name || data.cause || 'Your Fundraiser').trim() || 'Your Fundraiser';
    var raised = Number(data.total_raised || data.raised || 0);
    var goal = Number(data.goal || 0);
    var endDate = data.end_date || data.endDate || '';
    var amount = Number(data.amount || 0);
    var days = 0;
    if (endDate) {
      var diff = new Date(endDate) - new Date();
      if (diff > 0) days = Math.ceil(diff / 864e5);
    }
    var title = document.getElementById('apFrZoneTitle');
    var sub = document.getElementById('apFrZoneSub');
    var raisedEl = document.getElementById('apFrZoneRaised');
    var goalEl = document.getElementById('apFrZoneGoal');
    var prog = document.getElementById('apFrZoneProgressWrap');
    var fill = document.getElementById('apFrZoneBarFill');
    if (title) title.textContent = cause;
    if (sub) sub.textContent = (amount ? money(amount) + ' per item' : 'Fundraiser active') + (days ? ' · ' + days + ' days left' : '');
    if (raisedEl) raisedEl.textContent = money(raised);
    if (goal > 0) {
      if (prog) prog.style.display = '';
      if (goalEl) goalEl.textContent = 'of ' + money(goal) + ' goal';
      if (fill) fill.style.width = Math.max(0, Math.min(100, (raised / goal) * 100)).toFixed(1) + '%';
    }
  }
  function hydratePortalStrip(strip, data){
    if (!strip || !data) return;
    var raised = Number(data.total_raised || data.raised || 0);
    var goal = Number(data.goal || 0);
    var endDate = data.end_date || data.endDate || '';
    var days = 0;
    if (endDate) {
      var diff = new Date(endDate) - new Date();
      if (diff > 0) days = Math.ceil(diff / 864e5);
    }
    var dayEl = strip.querySelector('[data-ss-fr-days]');
    var raisedEl = strip.querySelector('[data-ss-fr-raised]');
    var goalEl = strip.querySelector('[data-ss-fr-goal]');
    var fill = strip.querySelector('[data-ss-fr-fill]');
    var progress = strip.querySelector('[data-ss-fr-progress]');
    if (dayEl && days) dayEl.textContent = days + ' days left';
    if (raisedEl) raisedEl.textContent = money(raised) + ' raised';
    if (goalEl && goal > 0) goalEl.textContent = 'of ' + money(goal) + ' goal';
    if (progress && goal > 0) progress.style.display = '';
    if (fill && goal > 0) fill.style.width = Math.max(0, Math.min(100, (raised / goal) * 100)).toFixed(1) + '%';
  }
  async function loadFundraiserState(){
    var handle = getShopHandle();
    if (!handle) return;
    try {
      var res = await fetch('/apps/ss/relay/store/' + encodeURIComponent(handle) + '/fundraising?ts=' + Date.now(), { cache: 'no-store' });
      var data = await res.json().catch(function(){ return null; });
      if (data && data.ok !== false && (data.enabled === true || data.enabled === 'true')) {
        if (isAdmin) applyAdminActive(data);
        if (isPortal) qsa('[data-ss-fr-strip]').forEach(function(strip){ hydratePortalStrip(strip, data); });
      }
    } catch(e) {
      if (isAdmin && document.getElementById('apFrZone') && document.getElementById('apFrZone').classList.contains('ap-fr-zone--active')) hideStartButtons();
    }
  }
  function initFundraiserHardening(){
    injectStyles();
    if (isAdmin) {
      var zone = document.getElementById('apFrZone');
      if (zone && zone.classList.contains('ap-fr-zone--active')) applyAdminActive(null);
      hideStartButtons();
      setTimeout(hideStartButtons, 250);
      setTimeout(hideStartButtons, 1000);
    }
    loadFundraiserState();
    try {
      var mo = new MutationObserver(function(){
        if (isAdmin && document.documentElement.classList.contains('ss-fr-active')) hideStartButtons();
      });
      mo.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
    } catch(e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFundraiserHardening, { once:true });
  else initFundraiserHardening();
})();
