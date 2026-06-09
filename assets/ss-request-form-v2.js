(function(){
  var path = window.location.pathname || '';
  var DASHBOARD_URL = '/pages/portal';
  var STOREFRONT_FORM_URL = '/pages/private-storefronts';
  var LOGIN_BASE = '/account/login';

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function loginReturnUrl(returnPath){ return LOGIN_BASE + '?return_url=' + encodeURIComponent(returnPath); }

  function fixHomepageAndFormAuthLinks(){
    var loginToDashboard = loginReturnUrl(DASHBOARD_URL);
    var loginToStorefrontForm = loginReturnUrl(STOREFRONT_FORM_URL);

    // Homepage logged-out hero: Create Store -> login -> storefront request form.
    qsa('.ss-hero-actions a, a').forEach(function(link){
      var text = (link.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      var href = link.getAttribute('href') || '';

      var isCreateStoreText =
        text.indexOf('create') !== -1 &&
        (text.indexOf('store') !== -1 || text.indexOf('storefront') !== -1 || text.indexOf('shop') !== -1);

      var isRequestStoreHref =
        href === STOREFRONT_FORM_URL ||
        href.indexOf('/pages/private-storefronts') === 0 ||
        href.indexOf('/pages/storefront') === 0;

      if (isCreateStoreText && isRequestStoreHref) {
        link.setAttribute('href', loginToStorefrontForm);
      }

      // Homepage Sign In -> login -> dashboard.
      var isSignInText = text === 'sign in' || text.indexOf('sign in') !== -1 || text.indexOf('log in') !== -1;
      if (isSignInText && href.indexOf('/account/login') !== -1) {
        link.setAttribute('href', loginToDashboard);
      }
    });

    // Request form logged-out gate: always sign in to the storefront form, never Orders.
    qsa('.sf-auth-actions a.sf-btn--solid').forEach(function(link){
      link.setAttribute('href', loginToStorefrontForm);
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
    fixHomepageAndFormAuthLinks();
    setTimeout(fixHomepageAndFormAuthLinks, 250);
    setTimeout(fixHomepageAndFormAuthLinks, 1000);

    if (path.indexOf('/pages/request') === 0 || path.indexOf('/pages/private-storefronts') === 0 || path.indexOf('/pages/storefront') === 0) {
      waitForForm();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
