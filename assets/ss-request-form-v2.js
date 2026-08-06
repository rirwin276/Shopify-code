(function () {
  'use strict';

  var path = window.location.pathname || '';
  var isRequestPage =
    path.indexOf('/pages/request-storefront-form') === 0 ||
    path.indexOf('/pages/private-storefronts') === 0 ||
    path.indexOf('/pages/storefront') === 0 ||
    path.indexOf('/pages/request') === 0;
  var isAdminPage = path.indexOf('/pages/admin-powers') === 0;

  /* This asset used to run on every page and rewrite links by reading their
   * visible text. Article titles such as “How to Start a School Store” and the
   * “Open my dashboard” card were therefore mistaken for create-store CTAs.
   * The asset is now strictly scoped to the two pages it actually supports.
   */
  if (!isRequestPage && !isAdminPage) return;

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function labelFor(element) {
    if (!element) return null;
    if (element.id) {
      var direct = qs('label[for="' + element.id + '"]');
      if (direct) return direct;
    }
    var field = element.closest ? element.closest('.sf-field') : null;
    return field ? qs('.sf-label', field) : null;
  }

  function hideField(selector) {
    var element = qs(selector);
    if (!element) return;
    var field = element.closest ? element.closest('.sf-field') : null;
    if (field) field.classList.add('ss-request-v2-hidden');
    element.required = false;
    element.disabled = true;
  }

  function getUploaderBase() {
    var fallback = 'https://studio-uploader-production.up.railway.app';
    if (window.SF_UPLOADER_BASE) return String(window.SF_UPLOADER_BASE).replace(/\/+$/, '');
    try {
      if (typeof SF_UPLOADER_BASE !== 'undefined' && SF_UPLOADER_BASE) {
        return String(SF_UPLOADER_BASE).replace(/\/+$/, '');
      }
    } catch (error) {}
    return fallback;
  }

  function wireRequestLogin() {
    var loginHref = '/account/login?return_to=' + encodeURIComponent('/pages/request-storefront-form');
    qsa('[data-storefront-request-form] .sf-auth-actions a.sf-btn--solid').forEach(function (link) {
      link.setAttribute('href', loginHref);
      link.removeAttribute('onclick');
    });
  }

  function simplifyForm(form) {
    if (!form || form.dataset.ssRequestV2Ready === '1') return;
    form.dataset.ssRequestV2Ready = '1';
    document.documentElement.classList.add('ss-request-v2');

    hideField('[name="user_count"]');
    hideField('[name="duration"]');
    hideField('#BranchInput');
    hideField('#SportInput');

    var military = qs('#MilitaryBranch');
    if (military) military.classList.add('ss-request-v2-hidden');
    var sport = qs('#SportType');
    if (sport) sport.classList.add('ss-request-v2-hidden');

    var organization = qs('#OrgType');
    if (organization) {
      organization.innerHTML = '<option value="" disabled selected>Select store type...</option><option value="Sports Team">Sports Team</option><option value="Small Business">Small Business</option><option value="Other">Other</option>';
      organization.required = true;
      var organizationLabel = labelFor(organization);
      if (organizationLabel) organizationLabel.textContent = 'Store Type *';
      organization.addEventListener('change', function () {
        var hidden = qs('#SF_TYPE_OF_STORE');
        if (hidden) hidden.value = organization.value || '';
        if (typeof window.updateSubmitEnabled === 'function') window.updateSubmitEnabled();
      });
    }

    var color = qs('#PrimaryColor');
    if (color) {
      var colorLabel = labelFor(color);
      if (colorLabel) colorLabel.textContent = 'Preferred Default Shirt Color *';
      var colorField = color.closest ? color.closest('.sf-field') : null;
      var help = colorField ? qs('.sf-help', colorField) : null;
      if (help) help.textContent = 'Pick the shirt color you want shown first in your store. You can still offer other colors later.';
    }

    var title = qs('.sf-h1');
    if (title) title.textContent = 'Request a Storefront';
    var subtitle = qs('.sf-sub');
    if (subtitle) subtitle.textContent = 'Upload your logo, pick a preferred shirt color, and we will build your private merch store.';

    var logoText = qs('#MainLogoText');
    if (logoText) logoText.textContent = 'Upload & review logo';

    var drop = qs('#MainLogoDrop');
    if (drop && drop.dataset.ssRequestV2Wired !== '1') {
      drop.dataset.ssRequestV2Wired = '1';
      drop.classList.add('ss-request-upload-card');
      if (!qs('.ss-request-upload-button', drop)) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'ss-request-upload-button';
        button.textContent = 'Choose Image';
        drop.appendChild(button);
      }
    }

    qsa('.sf-legend').forEach(function (legend) {
      if (/basics/i.test(legend.textContent || '')) legend.textContent = 'Store Details';
      if (/logo/i.test(legend.textContent || '')) legend.textContent = 'Logo Upload';
    });

    if (typeof window.openUploaderModal === 'function' && !window.__ssRequestOpenPatched) {
      window.__ssRequestOpenPatched = true;
      window.openUploaderModal = function () {
        var modal = qs('#sf-uploader-modal');
        var iframe = qs('#sf-uploader-iframe');
        if (!modal || !iframe) return false;
        if (modal.parentNode !== document.body) document.body.appendChild(modal);
        iframe.src = getUploaderBase() + '/ui?embed=1&return=postmessage&slot=main&mode=request&autopick=1';
        modal.classList.remove('sf-hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        return false;
      };
    }

    wireRequestLogin();
  }

  function waitForForm() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      var form = qs('#sf-request-form');
      if (form) {
        window.clearInterval(timer);
        simplifyForm(form);
      } else if (attempts >= 100) {
        window.clearInterval(timer);
      }
    }, 80);
  }

  function installAdminGuards() {
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
      '.ap-frw-overlay.open{position:fixed!important;inset:0!important;width:100vw!important;height:calc(var(--ss-frw-vh,1vh)*100)!important;overflow:hidden!important;align-items:center!important;justify-content:center!important}',
      '.ap-frw-modal{min-height:0!important;max-height:calc((var(--ss-frw-vh,1vh)*100) - 32px)!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}',
      '.ap-frw-body{min-height:0!important;flex:1 1 auto!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important}',
      '@media(max-width:600px){.ap-frw-overlay.open{align-items:stretch!important;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom))!important}.ap-frw-modal{width:100%!important;height:calc((var(--ss-frw-vh,1vh)*100) - 20px - env(safe-area-inset-top) - env(safe-area-inset-bottom))!important;max-height:none!important;border-radius:24px!important}.ap-frw-body{padding:20px!important}}'
    ].join('\n');
    document.head.appendChild(style);

    function setViewportHeight() {
      var height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      if (height) document.documentElement.style.setProperty('--ss-frw-vh', (height * 0.01) + 'px');
    }

    function syncOverlay() {
      var overlay = qs('#apFrwOverlay');
      var open = !!(overlay && overlay.classList.contains('open'));
      document.documentElement.classList.toggle('ss-frw-modal-open', open);
      if (document.body) document.body.classList.toggle('ss-frw-modal-open', open);
      if (open) setViewportHeight();
      return overlay;
    }

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', function () { window.setTimeout(setViewportHeight, 250); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', setViewportHeight);

    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      var overlay = syncOverlay();
      if (overlay && overlay.dataset.ssScopedGuard !== '1') {
        overlay.dataset.ssScopedGuard = '1';
        try {
          var observer = new MutationObserver(syncOverlay);
          observer.observe(overlay, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
        } catch (error) {}
        window.clearInterval(timer);
      } else if (attempts >= 100) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  function init() {
    if (isRequestPage) waitForForm();
    if (isAdminPage) installAdminGuards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
