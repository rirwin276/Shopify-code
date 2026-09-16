/* Anonymous store build: resumable, real progress, no forced redirect. */
(function () {
  'use strict';
  var root = document.querySelector('[data-ss-demo-start]');
  if (!root || root.getAttribute('data-enabled') !== 'true') return;
  var key = 'ss_anonymous_demo_v1';
  var api = String(root.getAttribute('data-api-base') || '').replace(/\/+$/, '');
  var $ = function (s) { return root.querySelector(s); };
  var choice = $('[data-demo-choice]'), formPanel = $('[data-demo-form-panel]'), waitPanel = $('[data-demo-wait]');
  var form = $('[data-demo-form]'), submit = $('[data-demo-submit]');
  var current = null, timer = null, clockTimer = null, controller = null, generation = 0, checking = false, storageWorks = true;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function visible(node, yes) { if (node) node.hidden = !yes; }
  function text(selector, value) { var node = $(selector); if (node && node.textContent !== value) node.textContent = value; }
  function event(name, details) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({event:name}, details || {}));
  }
  function save(value) {
    current = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { storageWorks = false; }
    try { if (value && value.token) document.cookie = 'ss_anonymous_demo_resume=' + encodeURIComponent(value.token) + '; Max-Age=172800; Path=/; SameSite=Lax; Secure'; } catch (_) {}
    updatePrivateLink();
    text('[data-demo-return-copy]', storageWorks ? 'You can close this page and return here in this browser to continue.' : 'Keep this private link somewhere safe so you can return to this build.');
  }
  function clear() { current = null; try { localStorage.removeItem(key); } catch (_) {} try { document.cookie = 'ss_anonymous_demo_resume=; Max-Age=0; Path=/; SameSite=Lax; Secure'; } catch (_) {} }
  function stop() { generation++; clearTimeout(timer); clearInterval(clockTimer); clockTimer = null; if (controller) controller.abort(); controller = null; checking = false; }
  function returnUrl(token) { return location.origin + '/pages/request-storefront-form?view=start-team-store#resume=' + encodeURIComponent(token || ''); }
  function updatePrivateLink() { var input = $('[data-demo-private-link]'); if (input && current && current.token) input.value = returnUrl(current.token); }
  function formatElapsed(ms) { var seconds = Math.max(0, Math.floor(ms / 1000)), minutes = Math.floor(seconds / 60); return String(minutes).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
  function startClock() {
    clearInterval(clockTimer);
    function tick() { var started = Number(current && current.createdAt) || Date.now(); text('[data-demo-elapsed]', formatElapsed(Date.now() - started)); }
    tick(); clockTimer = setInterval(tick, 1000);
  }
  function panel(node) {
    [choice, formPanel, waitPanel].forEach(function (p) { visible(p, p === node); });
    visible(root.querySelector('.ss-demo-start__header'), node !== waitPanel);
    if (node) node.scrollIntoView({behavior:reducedMotion ? 'auto' : 'smooth', block:'start'});
  }
  function error(message) { text('[data-demo-error]', message); visible($('[data-demo-error]'), !!message); }
  function stage(index) {
    root.querySelectorAll('[data-demo-progress] li').forEach(function (node, i) {
      node.className = i < index ? 'is-done' : i === index ? 'is-active' : '';
      if (i === index) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
    });
  }
  function safeLink(selector, value, fallback) {
    var node = $(selector); if (!node) return;
    try { var u = new URL(value || fallback, location.origin); node.href = u.origin === location.origin ? u.href : fallback; }
    catch (_) { node.href = fallback; }
  }
  function status(state) {
    var phase = String(state.phase || 'building');
    visible($('[data-demo-ready-actions]'), false);
    visible($('[data-demo-recovery]'), false);
    var spinner = $('[data-demo-spinner]');
    if (spinner) { spinner.hidden = false; spinner.classList.toggle('is-done', phase === 'ready' || phase === 'claimed'); }
    var name = state.storefront_name || current.storeName || 'Your team store';
    text('[data-demo-team-name]', name);
    text('[data-demo-team-initials]', name.split(/\s+/).slice(0,2).map(function (part) { return part.charAt(0); }).join('').toUpperCase());
    var logoNode = $('[data-demo-team-logo]');
    if (logoNode && current.logoThumb && /^data:image\/(png|jpeg|webp);base64,/.test(current.logoThumb)) {
      logoNode.src = current.logoThumb; visible(logoNode, true); visible($('[data-demo-team-initials]'), false);
    }
    var labels = {
      saved:['REQUEST SAVED', 'Your team store is on its way.', 'Your logo and team name are saved. We’re getting your store started.', 1],
      store:['CREATING YOUR STORE', 'Making room for ' + name + '.', 'We’re connecting your logo and setting up your team’s store.', 1],
      products:['YOUR LOGO IS IN. WE’LL TAKE IT FROM HERE.', 'Your team store is taking shape.', 'We’re creating your products and previews. Keep exploring below while we finish.', 2],
      finishing:['CHECKING YOUR STORE', 'A few finishing touches.', 'We’re checking your preview before you step inside.', 2]
    };
    if (phase === 'ready' || phase === 'claimed') {
      clearInterval(clockTimer); clockTimer = null;
      stage(4);
      text('[data-demo-phase-label]', phase === 'ready' ? 'READY WHEN YOU ARE' : 'YOUR STORE IS ACTIVATED');
      text('[data-demo-status-title]', name + (phase === 'ready' ? ' is ready to explore.' : ' is yours.'));
      text('[data-demo-status-copy]', phase === 'ready' ? 'Your real store is ready. Explore the products and normal admin tools, then sign in to claim it if you like it.' : 'Your products and saved changes are connected to your account.');
      text('[data-demo-timing]', phase === 'ready' ? 'Purchasing, sharing and inviting members unlock after you claim the store.' : 'Opening your real store now.');
      var waitingRoom = '/pages/request-storefront-form?view=start-team-store';
      safeLink('[data-open-preview]', state.preview_url, waitingRoom);
      safeLink('[data-open-admin]', state.admin_url, waitingRoom);
      safeLink('[data-claim-store]', state.claim_url, waitingRoom);
      visible($('[data-demo-ready-actions]'), true);
      if (phase === 'claimed') {
        text('[data-open-preview]', 'Open my store →');
        visible($('[data-open-admin]'), false); visible($('[data-claim-store]'), false); visible($('[data-demo-expiry]'), false);
        clear(); history.replaceState(null, '', location.pathname + location.search); return;
      }
      var expires = new Date(state.delete_due_at || state.expires_at || '');
      if (!isNaN(expires.getTime())) {
        text('[data-demo-expiry]', 'Activate to keep this store. Unclaimed previews are scheduled for removal ' + expires.toLocaleString('en-US', {month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Los_Angeles',timeZoneName:'short'}) + '.');
        visible($('[data-demo-expiry]'), true);
      }
      if (!current.readyReported) { current.readyReported = true; save(current); event('anonymous_demo_ready', {storefront_handle:state.storefront_handle}); }
      return;
    }
    if (phase === 'expired' || phase === 'failed') {
      if (spinner) spinner.hidden = true;
      text('[data-demo-phase-label]', phase === 'expired' ? 'PREVIEW EXPIRED' : 'YOUR BUILD NEEDS A HAND');
      text('[data-demo-status-title]', phase === 'expired' ? 'Ready for a fresh start?' : 'This is taking longer than expected.');
      text('[data-demo-status-copy]', phase === 'expired' ? 'This unclaimed preview has expired. You can create a new store below.' : 'Your request is saved. Check again or contact us for help with your store.');
      text('[data-demo-timing]', 'No payment was taken.');
      visible($('[data-demo-recovery]'), phase === 'failed');
      if (phase === 'expired') clear();
      return;
    }
    var entry = labels[state.build_stage] || labels.store;
    text('[data-demo-phase-label]', entry[0]); text('[data-demo-status-title]', entry[1]); text('[data-demo-status-copy]', entry[2]); stage(entry[3]);
    if (current.createdAt && Date.now() - current.createdAt > 10 * 60 * 1000) {
      text('[data-demo-timing]', 'Still working on your gear. You can leave this tab and return here in this browser.');
    }
    if (!clockTimer) startClock();
    timer = setTimeout(poll, document.hidden ? 20000 : 5000);
  }
  async function poll() {
    if (!current || !current.token || checking) return;
    clearTimeout(timer); checking = true;
    var mine = generation; var token = current.token;
    controller = new AbortController();
    var timeout = setTimeout(function () { if (mine === generation && controller) controller.abort(); }, 15000);
    try {
      var response = await fetch(api + '/api/demo/status', {cache:'no-store', headers:{Authorization:'Bearer ' + token, Accept:'application/json'}, signal:controller.signal});
      var data = await response.json().catch(function () { return {}; });
      if (mine !== generation) return;
      if (response.status === 401 || response.status === 404 || response.status === 410) { status({phase:'expired'}); return; }
      if (!response.ok) throw new Error('Status unavailable');
      current.handle = data.storefront_handle || current.handle; current.storeName = data.storefront_name || current.storeName; save(current); status(data);
    } catch (_) {
      if (mine !== generation) return;
      text('[data-demo-status-copy]', 'The connection paused. Your build can continue while we reconnect.');
      visible($('[data-demo-recovery]'), true); timer = setTimeout(poll, 8000);
    } finally { clearTimeout(timeout); if (mine === generation) { checking = false; controller = null; } }
  }
  function thumbnail(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
          var scale = Math.min(128 / img.width, 128 / img.height), w = img.width * scale, h = img.height * scale;
          canvas.getContext('2d').drawImage(img, (128-w)/2, (128-h)/2, w, h);
          resolve(canvas.toDataURL('image/png'));
        } catch (_) { resolve(''); }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(''); };
      img.src = url;
    });
  }
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); error(''); if (!form.reportValidity() || submit.disabled) return;
    var logo = form.elements.storefront_logo_file.files[0];
    if (!logo || logo.size > 12 * 1024 * 1024) { error('Please choose a PNG, JPG or WebP smaller than 12 MB.'); return; }
    submit.disabled = true; submit.textContent = 'Saving your logo…';
    try {
      var logoThumb = await thumbnail(logo);
      var response = await fetch(api + '/api/demo/storefront-request', {method:'POST', body:new FormData(form)});
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.resume_token) throw new Error(data.error || 'Unable to save your request. Please try again.');
      stop(); save({token:data.resume_token,handle:data.storefront_handle,storeName:form.elements.storefront_name.value,createdAt:Date.now(),readyReported:false,logoThumb:logoThumb,apiBase:api,startUrl:location.pathname+location.search});
      history.replaceState(null, '', location.pathname + location.search); panel(waitPanel); status({phase:'queued',build_stage:'saved'}); poll();
      event('anonymous_demo_started', {storefront_handle:data.storefront_handle});
    } catch (err) { error(err.message); } finally { submit.disabled = false; submit.textContent = 'Build my free store →'; }
  });
  root.querySelectorAll('[data-open-demo-form]').forEach(function (button) { button.addEventListener('click', function () { panel(formPanel); }); });
  $('[data-back-to-choice]').addEventListener('click', function () { panel(choice); });
  $('[data-demo-retry]').addEventListener('click', function () { stop(); poll(); });
  $('[data-demo-start-over]').addEventListener('click', function () {
    if (current && !window.confirm('Start a different store? Your current unclaimed preview will still expire on schedule.')) return;
    stop(); clear(); window.location.assign(root.getAttribute('data-permanent-url') || '/pages/request-storefront-form');
  });
  $('[data-demo-copy-link]').addEventListener('click', async function () {
    var input = $('[data-demo-private-link]'); if (!input || !input.value) return;
    try { await navigator.clipboard.writeText(input.value); text('[data-demo-copy-result]', 'Private link copied.'); }
    catch (_) { input.focus(); input.select(); text('[data-demo-copy-result]', 'Link selected. Tap Copy in your browser.'); }
  });
  $('[data-demo-logo]').addEventListener('change', function (e) { text('[data-demo-file-copy]', e.target.files[0] ? e.target.files[0].name : 'PNG, JPG, or WebP · maximum 12 MB'); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && current) poll(); });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', function (e) { if (e.persisted && current) poll(); });
  var saved = null; try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
  if (!saved || !saved.token) {
    try {
      var cookie = document.cookie.split('; ').find(function (part) { return part.indexOf('ss_anonymous_demo_resume=') === 0; });
      if (cookie) saved = {token:decodeURIComponent(cookie.split('=').slice(1).join('=')),createdAt:Date.now()};
    } catch (_) {}
  }
  var oldToken = new URLSearchParams(location.hash.slice(1)).get('resume');
  if (oldToken) { saved = {token:oldToken,createdAt:Date.now(),startUrl:location.pathname+location.search}; history.replaceState(null, '', location.pathname + location.search); }
  if (saved && saved.token) { if (!saved.createdAt) saved.createdAt = Date.now(); save(saved); panel(waitPanel); startClock(); poll(); }
  else window.location.replace(root.getAttribute('data-permanent-url') || '/pages/request-storefront-form');
})();
