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
      '.ap-share-overlay:not(.open),.ap-frw-overlay:not(.open),.ap-frd-overlay:not(.open),.ap-nuke-overlay:not(.open),.ap-rebuild-overlay:not(.open),.ap-editor-overlay:not(.open),.ss-fr-edit-overlay:not(.open){display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important}',
      '.ap-main-panel:not(.active){display:none!important}',
      '.ap-main-panel.active{display:block!important}',
      '.ap-frw-overlay:not(.open) .ap-frw-step-content{display:none!important}',
      '.ap-frw-overlay.open .ap-frw-step-content:not(.ap-frw-active){display:none!important}',
      '.ap-frw-overlay.open .ap-frw-step-content.ap-frw-active{display:flex!important;flex-direction:column!important}',
      'html.ss-frw-modal-open,body.ss-frw-modal-open,html.ss-fr-edit-open,body.ss-fr-edit-open{overflow:hidden!important;overscroll-behavior:none!important}',
      '.ap-frw-overlay.open{position:fixed!important;inset:0!important;width:100vw!important;height:calc(var(--ss-frw-vh,1vh)*100)!important;max-height:calc(var(--ss-frw-vh,1vh)*100)!important;overflow:hidden!important;align-items:center!important;justify-content:center!important;touch-action:none!important}',
      '.ap-frw-modal{min-height:0!important;max-height:calc((var(--ss-frw-vh,1vh)*100) - 32px)!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}',
      '.ap-frw-step-content{min-height:0!important;overflow:hidden!important;flex:1 1 auto!important}',
      '.ap-frw-body{min-height:0!important;flex:1 1 auto!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important}',
      '.ap-frw-hero,.ap-frw-footer{flex:0 0 auto!important}',
      '@media(max-width:600px){.ap-frw-overlay.open{align-items:stretch!important;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom))!important}.ap-frw-modal{width:100%!important;height:calc((var(--ss-frw-vh,1vh)*100) - 20px - env(safe-area-inset-top) - env(safe-area-inset-bottom))!important;max-height:none!important;border-radius:24px!important}.ap-frw-body{padding:20px!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function releaseAdminRouteGuard(){
    if (path.indexOf('/pages/admin-powers') !== 0) return;
    requestAnimationFrame(function(){
      document.documentElement.className = document.documentElement.className
        .replace(/\bss-internal-booting\b/g, '')
        .replace(/\bss-route-booting\b/g, '');
      if (document.documentElement.className.indexOf('ss-internal-ready') === -1) {
        document.documentElement.className += ' ss-internal-ready';
      }
    });
  }

  function installFundraiserWizardMobileScrollGuard(){
    if (path.indexOf('/pages/admin-powers') !== 0) return;

    var overlay = null;
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

      var overlayObserver = new MutationObserver(syncLockState);
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

  function formatMoney(value){
    var amount = Number(value || 0);
    return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function parseMoneyText(value){
    var cleaned = String(value || '').replace(/[^0-9.\-]/g, '');
    var parsed = parseFloat(cleaned);
    return isFinite(parsed) ? parsed : 0;
  }

  function setProgressFill(fill, raised, goal){
    if (!fill) return;
    var pct = goal > 0 ? Math.max(0, Math.min(100, (Number(raised || 0) / Number(goal || 0)) * 100)) : 0;
    fill.style.setProperty('width', pct.toFixed(1) + '%', 'important');
    fill.style.setProperty('flex', '0 0 auto', 'important');
    fill.style.setProperty('max-width', pct.toFixed(1) + '%', 'important');
    fill.style.setProperty('min-width', Number(raised || 0) > 0 ? '3px' : '0', 'important');
  }

  function correctAdminFundraiserProgress(){
    if (path.indexOf('/pages/admin-powers') !== 0) return;
    var raisedEl = qs('#apFrZoneRaised');
    var goalEl = qs('#apFrZoneGoal');
    var fill = qs('#apFrZoneBarFill');
    if (!raisedEl || !goalEl || !fill) return;

    var raised = parseMoneyText(raisedEl.textContent);
    var goal = parseMoneyText(goalEl.textContent);
    setProgressFill(fill, raised, goal);

    var modalFill = qs('#apFrdProgressFill');
    if (modalFill) setProgressFill(modalFill, raised, goal);
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
    if (fill) setProgressFill(fill, raised, goal);

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

  function installActiveFundraiserEditor(){
    if (path.indexOf('/pages/admin-powers') !== 0) return;
    if (!window.SSAP || !SSAP.shopHandle) return;

    var endpoint = '/apps/ss/relay/store/' + encodeURIComponent(SSAP.shopHandle || '') + '/fundraising';
    var currentData = null;

    function daysFromEndDate(endDate){
      if (!endDate) return 0;
      var end = new Date(String(endDate).slice(0, 10) + 'T23:59:59');
      if (isNaN(end.getTime())) return 0;
      return Math.max(0, Math.ceil((end - new Date()) / 864e5));
    }

    function endDateFromDays(days){
      var d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + Math.max(1, parseInt(days || '1', 10)));
      return d.toISOString().slice(0, 10);
    }

    function parseVisibleEndDate(){
      var el = qs('#apFrdEndDate');
      if (!el || !el.textContent.trim()) return '';
      var d = new Date(el.textContent.trim());
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    }

    function fallbackData(){
      var endDate = parseVisibleEndDate();
      var daysEl = qs('#apFrdStatDays');
      var goalEl = qs('#apFrdStatGoal');
      var amtEl = qs('#apFrdStatAmt');
      var causeEl = qs('#apFrdCauseName');
      var visEl = qs('#apFrdVisibility');
      return {
        enabled: true,
        amount: parseMoneyText(amtEl && amtEl.textContent ? amtEl.textContent : '4'),
        cause_name: causeEl && causeEl.textContent ? causeEl.textContent.trim() : 'Fundraiser',
        goal: parseMoneyText(goalEl && goalEl.textContent ? goalEl.textContent : '0'),
        end_date: endDate,
        show_bar: !(visEl && /hidden|admin/i.test(visEl.textContent || '')),
        days_left: parseInt(daysEl && daysEl.textContent ? daysEl.textContent : String(daysFromEndDate(endDate)), 10) || daysFromEndDate(endDate)
      };
    }

    function isActiveFundraiser(){
      var zone = qs('#apFrZone');
      var activeVisible = qs('#apFrZoneActive');
      var settings = qs('#apFrSettingsRow');
      return !!(
        (zone && zone.classList.contains('ap-fr-zone--active')) ||
        (activeVisible && activeVisible.offsetParent !== null) ||
        (settings && settings.offsetParent !== null)
      );
    }

    function ensureStyle(){
      if (!document.head || document.getElementById('ss-fr-active-edit-style')) return;
      var style = document.createElement('style');
      style.id = 'ss-fr-active-edit-style';
      style.textContent = [
        '.ss-fr-edit-overlay{position:fixed;inset:0;z-index:10110;background:rgba(15,15,12,.62);backdrop-filter:blur(10px);padding:14px;align-items:center;justify-content:center;overflow:hidden}',
        '.ss-fr-edit-overlay.open{display:flex!important;visibility:visible!important;pointer-events:auto!important;opacity:1!important}',
        '.ss-fr-edit-modal{width:min(560px,100%);max-height:calc((var(--ss-frw-vh,1vh)*100) - 28px);background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,.32);display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
        '.ss-fr-edit-head{position:relative;padding:28px 28px 24px;background:radial-gradient(circle at 78% 12%,rgba(183,163,106,.28),transparent 48%),linear-gradient(135deg,#171912,#343523);color:#fff}',
        '.ss-fr-edit-kicker{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.14);font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.76)}',
        '.ss-fr-edit-title{margin:16px 44px 8px 0;font-size:34px;line-height:1.02;font-weight:950;letter-spacing:-.055em;color:#fff}',
        '.ss-fr-edit-sub{margin:0;max-width:420px;font-size:15px;line-height:1.55;color:rgba(255,255,255,.66);font-weight:650}',
        '.ss-fr-edit-close{position:absolute;right:18px;top:18px;width:48px;height:48px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.10);color:#fff;font-size:22px;font-weight:700;cursor:pointer}',
        '.ss-fr-edit-body{padding:24px 28px;overflow:auto;-webkit-overflow-scrolling:touch;min-height:0;display:grid;gap:18px}',
        '.ss-fr-edit-card{border:1px solid rgba(17,16,14,.10);background:#fafaf8;border-radius:20px;padding:18px;box-shadow:0 10px 24px rgba(15,23,42,.045)}',
        '.ss-fr-edit-label{display:block;margin:0 0 8px;font-size:11px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:rgba(17,16,14,.48)}',
        '.ss-fr-edit-input{width:100%;box-sizing:border-box;border:1.5px solid rgba(17,16,14,.14);border-radius:16px;background:#fff;color:#11100e;padding:14px 15px;font-size:18px;font-weight:850;outline:0}',
        '.ss-fr-edit-input:focus{border-color:#2f5844;box-shadow:0 0 0 4px rgba(47,88,68,.12)}',
        '.ss-fr-edit-help{margin:8px 0 0;font-size:12px;line-height:1.45;color:rgba(17,16,14,.56);font-weight:650}',
        '.ss-fr-edit-toggle{display:flex;align-items:flex-start;gap:14px;padding:16px;border:1.5px solid rgba(47,88,68,.18);border-radius:18px;background:#f0fdf4;cursor:pointer}',
        '.ss-fr-edit-toggle input{width:22px;height:22px;accent-color:#16a34a;margin-top:2px;flex:0 0 auto}',
        '.ss-fr-edit-toggle strong{display:block;font-size:15px;font-weight:950;color:#14532d;margin-bottom:3px}',
        '.ss-fr-edit-toggle span{display:block;font-size:12.5px;line-height:1.5;color:#2f5844;font-weight:650}',
        '.ss-fr-edit-status{min-height:20px;font-size:13px;font-weight:800;line-height:1.45;color:#64748b}',
        '.ss-fr-edit-status.err{color:#b91c1c}.ss-fr-edit-status.ok{color:#166534}',
        '.ss-fr-edit-footer{display:flex;gap:12px;padding:16px 28px 24px;border-top:1px solid rgba(17,16,14,.08);background:#fff;flex:0 0 auto}',
        '.ss-fr-edit-btn{height:54px;border-radius:999px;font-size:15px;font-weight:950;border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 20px}',
        '.ss-fr-edit-btn:disabled{opacity:.55;cursor:not-allowed}',
        '.ss-fr-edit-cancel{background:#fff;border:1.5px solid rgba(17,16,14,.12);color:#514f48;min-width:118px}',
        '.ss-fr-edit-save{background:#16a34a;color:#fff;box-shadow:0 14px 28px rgba(22,163,74,.24);flex:1}',
        '@media(max-width:600px){.ss-fr-edit-overlay{align-items:stretch;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom))}.ss-fr-edit-modal{max-height:none;height:calc((var(--ss-frw-vh,1vh)*100) - 20px - env(safe-area-inset-top) - env(safe-area-inset-bottom));border-radius:24px}.ss-fr-edit-head{padding:24px 22px 22px}.ss-fr-edit-title{font-size:30px}.ss-fr-edit-body{padding:20px 22px}.ss-fr-edit-footer{padding:14px 22px 20px}.ss-fr-edit-cancel{min-width:104px}}'
      ].join('\n');
      document.head.appendChild(style);
    }

    function ensureModal(){
      ensureStyle();
      var overlay = qs('#ssFrActiveEditOverlay');
      if (overlay) return overlay;
      overlay = document.createElement('div');
      overlay.id = 'ssFrActiveEditOverlay';
      overlay.className = 'ss-fr-edit-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = [
        '<div class="ss-fr-edit-modal" role="dialog" aria-modal="true" aria-labelledby="ssFrEditTitle">',
          '<div class="ss-fr-edit-head">',
            '<button type="button" class="ss-fr-edit-close" id="ssFrEditClose" aria-label="Close">×</button>',
            '<span class="ss-fr-edit-kicker">Active fundraiser</span>',
            '<h2 class="ss-fr-edit-title" id="ssFrEditTitle">Edit fundraiser</h2>',
            '<p class="ss-fr-edit-sub">Update the goal, days left, and whether customers see the live progress bar. This will not change the donation amount.</p>',
          '</div>',
          '<div class="ss-fr-edit-body">',
            '<div class="ss-fr-edit-card">',
              '<label class="ss-fr-edit-label" for="ssFrEditGoal">Fundraising goal</label>',
              '<input id="ssFrEditGoal" class="ss-fr-edit-input" type="number" inputmode="numeric" min="0" step="1" placeholder="500">',
              '<p class="ss-fr-edit-help">Set 0 to hide the goal number while keeping the fundraiser active.</p>',
            '</div>',
            '<div class="ss-fr-edit-card">',
              '<label class="ss-fr-edit-label" for="ssFrEditDays">Days left</label>',
              '<input id="ssFrEditDays" class="ss-fr-edit-input" type="number" inputmode="numeric" min="1" max="365" step="1" placeholder="30">',
              '<p class="ss-fr-edit-help">This updates the fundraiser end date from today.</p>',
            '</div>',
            '<label class="ss-fr-edit-toggle" for="ssFrEditShowBar">',
              '<input id="ssFrEditShowBar" type="checkbox">',
              '<span><strong>Show live progress to customers</strong><span>Displays the cause, raised amount, goal, and days left on the storefront.</span></span>',
            '</label>',
            '<div class="ss-fr-edit-status" id="ssFrEditStatus"></div>',
          '</div>',
          '<div class="ss-fr-edit-footer">',
            '<button type="button" class="ss-fr-edit-btn ss-fr-edit-cancel" id="ssFrEditCancel">Cancel</button>',
            '<button type="button" class="ss-fr-edit-btn ss-fr-edit-save" id="ssFrEditSave">Save changes</button>',
          '</div>',
        '</div>'
      ].join('');
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e){ if (e.target === overlay) closeEditor(); });
      qs('#ssFrEditClose', overlay).addEventListener('click', closeEditor);
      qs('#ssFrEditCancel', overlay).addEventListener('click', closeEditor);
      qs('#ssFrEditSave', overlay).addEventListener('click', saveEditor);
      return overlay;
    }

    function setStatus(msg, type){
      var el = qs('#ssFrEditStatus');
      if (!el) return;
      el.textContent = msg || '';
      el.className = 'ss-fr-edit-status' + (type ? ' ' + type : '');
    }

    function closeNativeDetails(){
      var details = qs('#apFrdOverlay');
      if (details) {
        details.classList.remove('open');
        details.setAttribute('aria-hidden', 'true');
      }
    }

    function openEditorWithData(data){
      var overlay = ensureModal();
      var fallback = fallbackData();
      currentData = Object.assign({}, fallback, data || {});
      var goal = Number(currentData.goal || 0);
      var endDate = currentData.end_date || currentData.endDate || fallback.end_date || '';
      var days = Number(currentData.days_left || currentData.daysLeft || 0) || daysFromEndDate(endDate) || fallback.days_left || 30;
      var showBar = currentData.show_bar;
      if (showBar == null) showBar = currentData.showBar;
      if (showBar == null) showBar = fallback.show_bar;

      qs('#ssFrEditGoal', overlay).value = Math.max(0, Math.round(goal || 0));
      qs('#ssFrEditDays', overlay).value = Math.max(1, Math.round(days || 30));
      qs('#ssFrEditShowBar', overlay).checked = !(showBar === false || showBar === 'false' || showBar === 0 || showBar === '0');
      setStatus('', '');
      closeNativeDetails();
      setFrwViewportHeight();
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('ss-fr-edit-open');
      document.body.classList.add('ss-fr-edit-open');
      document.body.style.overflow = 'hidden';
    }

    function closeEditor(){
      var overlay = qs('#ssFrActiveEditOverlay');
      if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
      }
      document.documentElement.classList.remove('ss-fr-edit-open');
      document.body.classList.remove('ss-fr-edit-open');
      document.body.style.overflow = '';
    }

    async function fetchCurrent(){
      var fallback = fallbackData();
      try {
        var res = await fetch(endpoint + '?ts=' + Date.now(), { cache: 'no-store' });
        var data = await res.json().catch(function(){ return {}; });
        if (!res.ok || !data || data.ok === false) return fallback;
        return Object.assign({}, fallback, data);
      } catch(e) {
        return fallback;
      }
    }

    async function openEditor(){
      openEditorWithData(fallbackData());
      setStatus('Loading current fundraiser settings…', '');
      var data = await fetchCurrent();
      openEditorWithData(data);
    }

    async function saveEditor(){
      var overlay = ensureModal();
      var saveBtn = qs('#ssFrEditSave', overlay);
      var goal = Math.max(0, parseInt(qs('#ssFrEditGoal', overlay).value || '0', 10) || 0);
      var days = Math.max(1, Math.min(365, parseInt(qs('#ssFrEditDays', overlay).value || '1', 10) || 1));
      var showBar = !!qs('#ssFrEditShowBar', overlay).checked;
      var data = currentData || fallbackData();
      var amount = parseInt(data.amount || data.fundraising_amount || data.donation_amount || parseMoneyText((qs('#apFrdStatAmt') || {}).textContent || '4'), 10) || 4;
      var cause = (data.cause_name || data.cause || ((qs('#apFrdCauseName') || {}).textContent || '') || 'Fundraiser').trim();
      var payload = {
        enabled: true,
        edit_existing: true,
        edit_only: true,
        update_existing: true,
        amount: amount,
        cause_name: cause,
        show_bar: showBar,
        goal: goal,
        end_date: endDateFromDays(days),
        stripe_account_id: data.stripe_account_id || data.stripeAccountId || '',
        stripe_connected: data.stripe_connected === true || data.stripe_connected === 'true' || data.stripeConnected === true || data.stripeConnected === 'true',
        setup_step: data.setup_step || 5
      };

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      setStatus('Saving fundraiser settings…', '');
      try {
        var res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store'
        });
        var json = await res.json().catch(function(){ return {}; });
        if (!res.ok || !json || json.ok === false) {
          throw new Error((json && (json.error || json.detail || json.message)) || ('Save failed with HTTP ' + res.status));
        }
        setStatus('Saved. Refreshing the admin view…', 'ok');
        currentData = Object.assign({}, data, payload, json || {});
        setTimeout(function(){ window.location.reload(); }, 650);
      } catch(e) {
        setStatus('Could not save yet: ' + (e.message || 'Please try again.'), 'err');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save changes';
      }
    }

    document.addEventListener('click', function(e){
      var target = e.target;
      var trigger = target && target.closest ? target.closest('#apFrdEditBtn,#apFrEditFromSettings') : null;
      if (!trigger || !isActiveFundraiser()) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      openEditor();
    }, true);
  }

  function init(){
    installAdminNoFlashGuards();
    releaseAdminRouteGuard();
    installFundraiserWizardMobileScrollGuard();
    installActiveFundraiserEditor();

    rewriteAuthAndStorefrontLinks();
    setTimeout(rewriteAuthAndStorefrontLinks, 150);
    setTimeout(rewriteAuthAndStorefrontLinks, 600);
    setTimeout(rewriteAuthAndStorefrontLinks, 1500);

    hydrateDashboardFundraisers();
    setTimeout(hydrateDashboardFundraisers, 900);
    correctAdminFundraiserProgress();
    setTimeout(correctAdminFundraiserProgress, 250);
    setTimeout(correctAdminFundraiserProgress, 900);
    setTimeout(correctAdminFundraiserProgress, 1800);

    try {
      var observer = new MutationObserver(function(){
        rewriteAuthAndStorefrontLinks();
        correctAdminFundraiserProgress();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    } catch(e) {}

    if (path.indexOf('/pages/request') === 0 || path.indexOf('/pages/private-storefronts') === 0 || path.indexOf('/pages/storefront') === 0) {
      waitForForm();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();