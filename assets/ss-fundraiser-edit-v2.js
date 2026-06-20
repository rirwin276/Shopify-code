/* Stella & Sage — active fundraiser edit modal v2
   Fixes mobile keyboard jump, pulls current fundraiser values more robustly,
   and mirrors the original public/admin progress visibility choice. */
(function(){
  'use strict';

  var path = window.location.pathname || '';
  if (path.indexOf('/pages/admin-powers') !== 0) return;

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function moneyTextToNumber(value){
    var cleaned = String(value || '').replace(/[^0-9.\-]/g, '');
    var parsed = parseFloat(cleaned);
    return isFinite(parsed) ? parsed : 0;
  }
  function boolish(value, fallback){
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;
    var s = String(value == null ? '' : value).trim().toLowerCase();
    if (!s) return fallback;
    if (['true','1','yes','y','public','show','shown','visible','everyone'].indexOf(s) !== -1) return true;
    if (['false','0','no','n','hidden','hide','admin','admin_only','admin-only','private'].indexOf(s) !== -1) return false;
    return fallback;
  }
  function numFrom(value, fallback){
    if (value == null || value === '') return fallback;
    if (typeof value === 'number' && isFinite(value)) return value;
    var n = moneyTextToNumber(value);
    return isFinite(n) ? n : fallback;
  }
  function firstValue(obj, keys){
    if (!obj) return undefined;
    for (var i = 0; i < keys.length; i++) {
      if (Object.prototype.hasOwnProperty.call(obj, keys[i]) && obj[keys[i]] != null && obj[keys[i]] !== '') return obj[keys[i]];
    }
    return undefined;
  }
  function parseMaybeJson(value){
    if (typeof value !== 'string') return value;
    var s = value.trim();
    if (!s || (s[0] !== '{' && s[0] !== '[' && s !== 'true' && s !== 'false')) return value;
    try { return JSON.parse(s); } catch(e) { return value; }
  }
  function flattenFundraiserPayload(data){
    var out = {};
    function merge(src){
      if (!src || typeof src !== 'object') return;
      if (Array.isArray(src.fields)) {
        src.fields.forEach(function(f){
          if (!f || !f.key) return;
          out[f.key] = parseMaybeJson(f.value);
        });
      }
      Object.keys(src).forEach(function(k){
        if (k === 'fields') return;
        var v = parseMaybeJson(src[k]);
        if (v && typeof v === 'object' && !Array.isArray(v) && (k === 'fundraiser' || k === 'fundraising' || k === 'data' || k === 'metaobject')) merge(v);
        else out[k] = v;
      });
    }
    merge(data);
    return out;
  }
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
      amount: moneyTextToNumber(amtEl && amtEl.textContent ? amtEl.textContent : '4') || 4,
      cause_name: causeEl && causeEl.textContent ? causeEl.textContent.trim() : 'Fundraiser',
      goal: moneyTextToNumber(goalEl && goalEl.textContent ? goalEl.textContent : '0'),
      end_date: endDate,
      days_left: parseInt(daysEl && daysEl.textContent ? daysEl.textContent : String(daysFromEndDate(endDate)), 10) || daysFromEndDate(endDate) || 30,
      show_bar: !(visEl && /hidden|admin|private/i.test(visEl.textContent || ''))
    };
  }
  function normalizeFundraiserData(data){
    var f = fallbackData();
    var flat = flattenFundraiserPayload(data || {});
    var endDate = firstValue(flat, ['end_date','endDate','fundraising_end_date','fundraiser_end_date','ends_at','end_at','deadline','expires_at']) || f.end_date;
    var rawGoal = firstValue(flat, ['goal','fundraising_goal','fundraiser_goal','goal_amount','target','target_amount','public_goal','goal_dollars']);
    var rawDays = firstValue(flat, ['days_left','daysLeft','duration_days','duration','campaign_days']);
    var rawShow = firstValue(flat, ['show_bar','showBar','show_progress_bar','showProgressBar','show_progress','showProgress','display_progress','displayProgress','progress_public','public_progress','visibility']);
    var amount = firstValue(flat, ['amount','per_item_amount','fundraising_amount','fundraiser_amount','donation_amount','upcharge']);
    var cause = firstValue(flat, ['cause_name','cause','fundraiser_name','fundraising_name','name','title']);

    var days = numFrom(rawDays, 0) || daysFromEndDate(endDate) || f.days_left || 30;
    var goal = numFrom(rawGoal, f.goal || 0);
    if (goal > 999999) goal = Math.round(goal / 100); // tolerate cents if backend sends cents

    return Object.assign({}, f, flat, {
      amount: numFrom(amount, f.amount || 4) || 4,
      cause_name: String(cause || f.cause_name || 'Fundraiser').trim(),
      goal: Math.max(0, Math.round(goal || 0)),
      end_date: endDate || endDateFromDays(days),
      days_left: Math.max(1, Math.round(days || 30)),
      show_bar: boolish(rawShow, f.show_bar !== false)
    });
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

  var endpoint = '';
  var currentData = null;
  var lockedScrollY = 0;

  function endpointUrl(){
    if (endpoint) return endpoint;
    if (!window.SSAP || !SSAP.shopHandle) return '';
    endpoint = '/apps/ss/relay/store/' + encodeURIComponent(SSAP.shopHandle || '') + '/fundraising';
    return endpoint;
  }

  function ensureStyles(){
    if (document.getElementById('ss-fr-edit2-style')) return;
    var style = document.createElement('style');
    style.id = 'ss-fr-edit2-style';
    style.textContent = [
      '.ss-fr-edit2-overlay{position:fixed;inset:0;z-index:2147483600;background:rgba(15,15,12,.64);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);height:var(--ss-fr-edit-layout-h,100vh);display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;overflow:hidden}',
      '.ss-fr-edit2-overlay.open{display:flex}',
      '.ss-fr-edit2-modal{width:min(560px,100%);max-height:calc(var(--ss-fr-edit-layout-h,100vh) - 28px);background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,.32);display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
      '.ss-fr-edit2-head{position:relative;padding:28px 28px 24px;background:radial-gradient(circle at 78% 12%,rgba(183,163,106,.28),transparent 48%),linear-gradient(135deg,#171912,#343523);color:#fff;flex:0 0 auto}',
      '.ss-fr-edit2-kicker{display:inline-flex;align-items:center;padding:8px 13px;border-radius:999px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.14);font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.76)}',
      '.ss-fr-edit2-title{margin:16px 44px 8px 0;font-size:34px;line-height:1.02;font-weight:950;letter-spacing:-.055em;color:#fff}',
      '.ss-fr-edit2-sub{margin:0;max-width:430px;font-size:15px;line-height:1.55;color:rgba(255,255,255,.66);font-weight:650}',
      '.ss-fr-edit2-close{position:absolute;right:18px;top:18px;width:48px;height:48px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.10);color:#fff;font-size:22px;font-weight:700;cursor:pointer}',
      '.ss-fr-edit2-body{padding:24px 28px;overflow:auto;-webkit-overflow-scrolling:touch;min-height:0;display:grid;gap:18px;flex:1 1 auto}',
      '.ss-fr-edit2-card{border:1px solid rgba(17,16,14,.10);background:#fafaf8;border-radius:20px;padding:18px;box-shadow:0 10px 24px rgba(15,23,42,.045)}',
      '.ss-fr-edit2-label{display:block;margin:0 0 8px;font-size:11px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:rgba(17,16,14,.48)}',
      '.ss-fr-edit2-input{width:100%;box-sizing:border-box;border:1.5px solid rgba(17,16,14,.14);border-radius:16px;background:#fff;color:#11100e;padding:14px 15px;font-size:18px;font-weight:850;outline:0}',
      '.ss-fr-edit2-input:focus{border-color:#2f5844;box-shadow:0 0 0 4px rgba(47,88,68,.12)}',
      '.ss-fr-edit2-help{margin:8px 0 0;font-size:12px;line-height:1.45;color:rgba(17,16,14,.56);font-weight:650}',
      '.ss-fr-edit2-choice{position:relative;display:grid;grid-template-columns:54px 1fr 28px;gap:14px;align-items:center;padding:16px;border:1.5px solid rgba(17,16,14,.10);border-radius:20px;background:#fff;cursor:pointer}',
      '.ss-fr-edit2-choice+.ss-fr-edit2-choice{margin-top:12px}',
      '.ss-fr-edit2-choice.is-selected{border-color:rgba(183,163,106,.55);background:linear-gradient(145deg,#fffdf6,#f7f4e8)}',
      '.ss-fr-edit2-icon{width:54px;height:54px;border-radius:18px;background:#f7f4eb;display:grid;place-items:center;font-size:26px}',
      '.ss-fr-edit2-choice strong{display:block;font-size:16px;font-weight:950;color:#11100e;line-height:1.12;margin-bottom:5px}',
      '.ss-fr-edit2-choice span{display:block;font-size:12.5px;line-height:1.45;color:rgba(17,16,14,.58);font-weight:650}',
      '.ss-fr-edit2-radio{width:22px;height:22px;border-radius:999px;border:2px solid rgba(17,16,14,.22);position:relative}',
      '.ss-fr-edit2-choice.is-selected .ss-fr-edit2-radio{border-color:#16a34a}.ss-fr-edit2-choice.is-selected .ss-fr-edit2-radio:after{content:"";position:absolute;inset:4px;border-radius:999px;background:#16a34a}',
      '.ss-fr-edit2-status{min-height:20px;font-size:13px;font-weight:800;line-height:1.45;color:#64748b}',
      '.ss-fr-edit2-status.err{color:#b91c1c}.ss-fr-edit2-status.ok{color:#166534}',
      '.ss-fr-edit2-footer{display:flex;gap:12px;padding:16px 28px 24px;border-top:1px solid rgba(17,16,14,.08);background:#fff;flex:0 0 auto}',
      '.ss-fr-edit2-btn{height:54px;border-radius:999px;font-size:15px;font-weight:950;border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 20px}',
      '.ss-fr-edit2-btn:disabled{opacity:.55;cursor:not-allowed}',
      '.ss-fr-edit2-cancel{background:#fff;border:1.5px solid rgba(17,16,14,.12);color:#514f48;min-width:118px}',
      '.ss-fr-edit2-save{background:#16a34a;color:#fff;box-shadow:0 14px 28px rgba(22,163,74,.24);flex:1}',
      '.ss-fr-edit2-keyboard .ss-fr-edit2-footer{display:none}.ss-fr-edit2-keyboard .ss-fr-edit2-body{padding-bottom:96px}',
      'html.ss-fr-edit2-open,body.ss-fr-edit2-open{overflow:hidden!important;overscroll-behavior:none!important}',
      '@media(max-width:600px){.ss-fr-edit2-overlay{align-items:flex-start;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom))}.ss-fr-edit2-modal{max-height:none;height:calc(var(--ss-fr-edit-layout-h,100vh) - 20px - env(safe-area-inset-top) - env(safe-area-inset-bottom));border-radius:24px}.ss-fr-edit2-head{padding:24px 22px 22px}.ss-fr-edit2-title{font-size:30px}.ss-fr-edit2-body{padding:20px 22px}.ss-fr-edit2-footer{padding:14px 22px 20px}.ss-fr-edit2-cancel{min-width:104px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function lockPage(){
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.style.setProperty('--ss-fr-edit-layout-h', (window.innerHeight || document.documentElement.clientHeight || 700) + 'px');
    document.documentElement.classList.add('ss-fr-edit2-open');
    document.body.classList.add('ss-fr-edit2-open');
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + lockedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockPage(){
    document.documentElement.classList.remove('ss-fr-edit2-open');
    document.body.classList.remove('ss-fr-edit2-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY || 0);
  }
  function setStatus(msg, type){
    var el = qs('#ssFrEdit2Status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'ss-fr-edit2-status' + (type ? ' ' + type : '');
  }
  function setShowPublic(showPublic){
    var overlay = ensureModal();
    overlay.dataset.showPublic = showPublic ? 'true' : 'false';
    qsa('.ss-fr-edit2-choice', overlay).forEach(function(card){
      var active = card.getAttribute('data-show-public') === String(!!showPublic);
      card.classList.toggle('is-selected', active);
      card.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }
  function getShowPublic(){
    var overlay = qs('#ssFrEdit2Overlay');
    return !overlay || overlay.dataset.showPublic !== 'false';
  }
  function closeNativeModals(){
    ['#apFrdOverlay','#apFrwOverlay'].forEach(function(sel){
      var el = qs(sel);
      if (!el) return;
      el.classList.remove('open');
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function ensureModal(){
    ensureStyles();
    var overlay = qs('#ssFrEdit2Overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'ssFrEdit2Overlay';
    overlay.className = 'ss-fr-edit2-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = [
      '<div class="ss-fr-edit2-modal" role="dialog" aria-modal="true" aria-labelledby="ssFrEdit2Title">',
        '<div class="ss-fr-edit2-head">',
          '<button type="button" class="ss-fr-edit2-close" id="ssFrEdit2Close" aria-label="Close">×</button>',
          '<span class="ss-fr-edit2-kicker">Active fundraiser</span>',
          '<h2 class="ss-fr-edit2-title" id="ssFrEdit2Title">Edit fundraiser</h2>',
          '<p class="ss-fr-edit2-sub">Update the goal, days left, and whether customers see the live progress bar. This will not change the donation amount.</p>',
        '</div>',
        '<div class="ss-fr-edit2-body" id="ssFrEdit2Body">',
          '<div class="ss-fr-edit2-card">',
            '<label class="ss-fr-edit2-label" for="ssFrEdit2Goal">Fundraising goal</label>',
            '<input id="ssFrEdit2Goal" class="ss-fr-edit2-input" type="number" inputmode="numeric" min="0" step="1" placeholder="500" enterkeyhint="done">',
            '<p class="ss-fr-edit2-help">Pulled from the saved fundraiser settings. Set 0 if you do not want a public goal.</p>',
          '</div>',
          '<div class="ss-fr-edit2-card">',
            '<label class="ss-fr-edit2-label" for="ssFrEdit2Days">Days left</label>',
            '<input id="ssFrEdit2Days" class="ss-fr-edit2-input" type="number" inputmode="numeric" min="1" max="365" step="1" placeholder="30" enterkeyhint="done">',
            '<p class="ss-fr-edit2-help">This updates the fundraiser end date from today.</p>',
          '</div>',
          '<div class="ss-fr-edit2-card">',
            '<div class="ss-fr-edit2-label">Customer visibility</div>',
            '<div class="ss-fr-edit2-choice" role="radio" tabindex="0" data-show-public="true">',
              '<div class="ss-fr-edit2-icon">🌐</div><div><strong>Show live progress to everyone</strong><span>Customers see the cause, amount raised, goal, and days left.</span></div><div class="ss-fr-edit2-radio"></div>',
            '</div>',
            '<div class="ss-fr-edit2-choice" role="radio" tabindex="0" data-show-public="false">',
              '<div class="ss-fr-edit2-icon">🛡️</div><div><strong>Admin-only — I’ll announce it myself</strong><span>Fundraising stays active, but public progress is hidden from customers.</span></div><div class="ss-fr-edit2-radio"></div>',
            '</div>',
          '</div>',
          '<div class="ss-fr-edit2-status" id="ssFrEdit2Status"></div>',
        '</div>',
        '<div class="ss-fr-edit2-footer">',
          '<button type="button" class="ss-fr-edit2-btn ss-fr-edit2-cancel" id="ssFrEdit2Cancel">Cancel</button>',
          '<button type="button" class="ss-fr-edit2-btn ss-fr-edit2-save" id="ssFrEdit2Save">Save changes</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    function close(){ closeEditor(); }
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
    qs('#ssFrEdit2Close', overlay).addEventListener('click', close);
    qs('#ssFrEdit2Cancel', overlay).addEventListener('click', close);
    qs('#ssFrEdit2Save', overlay).addEventListener('click', saveEditor);
    qsa('.ss-fr-edit2-choice', overlay).forEach(function(card){
      card.addEventListener('click', function(){ setShowPublic(card.getAttribute('data-show-public') === 'true'); });
      card.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPublic(card.getAttribute('data-show-public') === 'true'); } });
    });
    qsa('.ss-fr-edit2-input', overlay).forEach(function(input){
      input.addEventListener('focus', function(){
        overlay.classList.add('ss-fr-edit2-keyboard');
        setTimeout(function(){
          try { input.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch(e) { input.scrollIntoView(false); }
        }, 120);
      });
      input.addEventListener('blur', function(){
        setTimeout(function(){
          if (!overlay.contains(document.activeElement) || !document.activeElement.classList.contains('ss-fr-edit2-input')) {
            overlay.classList.remove('ss-fr-edit2-keyboard');
          }
        }, 180);
      });
      input.addEventListener('keydown', function(e){ if (e.key === 'Enter') input.blur(); });
    });
    return overlay;
  }

  function openEditorWithData(data){
    var overlay = ensureModal();
    currentData = normalizeFundraiserData(data);
    qs('#ssFrEdit2Goal', overlay).value = String(currentData.goal || 0);
    qs('#ssFrEdit2Days', overlay).value = String(currentData.days_left || 30);
    setShowPublic(currentData.show_bar !== false);
    setStatus('', '');
    closeNativeModals();
    lockPage();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeEditor(){
    var overlay = qs('#ssFrEdit2Overlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.classList.remove('ss-fr-edit2-keyboard');
      overlay.setAttribute('aria-hidden', 'true');
    }
    unlockPage();
  }
  async function fetchCurrent(){
    var url = endpointUrl();
    if (!url) return fallbackData();
    try {
      var res = await fetch(url + '?ts=' + Date.now(), { cache: 'no-store' });
      var data = await res.json().catch(function(){ return {}; });
      if (!res.ok || !data || data.ok === false) return fallbackData();
      return data;
    } catch(e) {
      return fallbackData();
    }
  }
  async function openEditor(){
    openEditorWithData(fallbackData());
    setStatus('Loading saved fundraiser settings…', '');
    var data = await fetchCurrent();
    openEditorWithData(data);
  }
  async function saveEditor(){
    var overlay = ensureModal();
    var saveBtn = qs('#ssFrEdit2Save', overlay);
    var goal = Math.max(0, parseInt(qs('#ssFrEdit2Goal', overlay).value || '0', 10) || 0);
    var days = Math.max(1, Math.min(365, parseInt(qs('#ssFrEdit2Days', overlay).value || '1', 10) || 1));
    var showPublic = getShowPublic();
    var data = normalizeFundraiserData(currentData || fallbackData());
    var payload = {
      enabled: true,
      edit_existing: true,
      edit_only: true,
      update_existing: true,
      amount: data.amount || 4,
      cause_name: data.cause_name || 'Fundraiser',
      goal: goal,
      end_date: endDateFromDays(days),
      show_bar: showPublic,
      show_progress_bar: showPublic,
      display_progress: showPublic,
      public_progress: showPublic,
      visibility: showPublic ? 'public' : 'admin',
      stripe_account_id: data.stripe_account_id || data.stripeAccountId || '',
      stripe_connected: boolish(data.stripe_connected, boolish(data.stripeConnected, false)),
      setup_step: data.setup_step || 5
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    setStatus('Saving fundraiser settings…', '');
    try {
      var res = await fetch(endpointUrl(), {
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
      setTimeout(function(){ window.location.reload(); }, 650);
    } catch(e) {
      setStatus('Could not save yet: ' + (e.message || 'Please try again.'), 'err');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save changes';
    }
  }

  window.addEventListener('click', function(e){
    var target = e.target;
    var trigger = target && target.closest ? target.closest('#apFrdEditBtn,#apFrEditFromSettings') : null;
    if (!trigger || !isActiveFundraiser()) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    openEditor();
  }, true);
})();