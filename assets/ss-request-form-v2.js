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

  function formatMoney(value){
    var amount = Number(value || 0);
    return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function hideDashboardFundraiser(strip){
    if (!strip) return;
    strip.classList.remove('ss-fr-strip--active');
    strip.style.setProperty('display', 'none', 'important');
  }

  function showDashboardFundraiser(strip, data){
    if (!strip) return;
    var raised = Number(data.total_raised || data.raised || 0);
    var goal = Number(data.goal || 0);
    var endDate = data.end_date || data.endDate || '';
    var days = 0;
    if (endDate) {
      var diff = new Date(endDate) - new Date();
      if (diff > 0) days = Math.ceil(diff / 864e5);
    }

    var daysEl = qs('[data-ss-fr-days]', strip);
    var raisedEl = qs('[data-ss-fr-raised]', strip);
    var goalEl = qs('[data-ss-fr-goal]', strip);
    var fill = qs('[data-ss-fr-fill]', strip);
    var progress = qs('[data-ss-fr-progress]', strip);

    if (daysEl) daysEl.textContent = days ? (days + ' days left') : '';
    if (raisedEl) raisedEl.textContent = formatMoney(raised) + ' raised';
    if (goalEl) goalEl.textContent = goal > 0 ? ('of ' + formatMoney(goal) + ' goal') : '';
    if (progress) progress.style.display = goal > 0 ? '' : 'none';
    if (fill) fill.style.width = goal > 0 ? Math.max(0, Math.min(100, (raised / goal) * 100)).toFixed(1) + '%' : '0%';

    strip.classList.add('ss-fr-strip--active');
    strip.style.setProperty('display', 'block', 'important');
  }

  function hydrateDashboardFundraisers(){
    if (path.indexOf('/pages/portal') !== 0) return;
    qsa('.ss-store-card[data-ss-handle]').forEach(function(card){
      var handle = String(card.getAttribute('data-ss-handle') || '').trim();
      var strip = qs('[data-ss-fr-strip]', card);
      hideDashboardFundraiser(strip);
      if (!handle || !strip) return;

      fetch('/apps/ss/relay/store/' + encodeURIComponent(handle) + '/fundraising?ts=' + Date.now(), { cache: 'no-store' })
        .then(function(res){ return res.ok ? res.json() : null; })
        .then(function(data){
          if (data && data.ok !== false && (data.enabled === true || data.enabled === 'true')) {
            showDashboardFundraiser(strip, data);
          } else {
            hideDashboardFundraiser(strip);
          }
        })
        .catch(function(){ hideDashboardFundraiser(strip); });
    });
  }

  function init(){
    rewriteAuthAndStorefrontLinks();
    setTimeout(rewriteAuthAndStorefrontLinks, 150);
    setTimeout(rewriteAuthAndStorefrontLinks, 600);
    setTimeout(rewriteAuthAndStorefrontLinks, 1500);

    hydrateDashboardFundraisers();
    setTimeout(hydrateDashboardFundraisers, 900);

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
