/* Stella & Sage — anonymous demo start, wait, and resume page. */
(function () {
  'use strict';
  var root = document.querySelector('[data-ss-demo-start]');
  if (!root || root.getAttribute('data-enabled') !== 'true') return;

  var key = 'ss_anonymous_demo_v1';
  var api = String(root.getAttribute('data-api-base') || '').replace(/\/+$/, '');
  var choice = root.querySelector('[data-demo-choice]');
  var formPanel = root.querySelector('[data-demo-form-panel]');
  var waitPanel = root.querySelector('[data-demo-wait]');
  var form = root.querySelector('[data-demo-form]');
  var error = root.querySelector('[data-demo-error]');
  var submit = root.querySelector('[data-demo-submit]');
  var pollTimer = null;
  var current = null;

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_e) { return null; }
  }
  function save(value) {
    current = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_e) {}
  }
  function clearSaved() {
    current = null;
    try { localStorage.removeItem(key); } catch (_e) {}
  }
  function tokenFromHash() {
    try { return new URLSearchParams(location.hash.slice(1)).get('resume') || ''; } catch (_e) { return ''; }
  }
  function returnUrl() {
    return location.origin + location.pathname + '#resume=' + encodeURIComponent(current.token);
  }
  function show(node) { if (node) node.hidden = false; }
  function hide(node) { if (node) node.hidden = true; }
  function showChoice() { show(choice); hide(formPanel); hide(waitPanel); }
  function showForm() { hide(choice); show(formPanel); hide(waitPanel); formPanel.scrollIntoView({behavior:'smooth', block:'start'}); }
  function showWait() { hide(choice); hide(formPanel); show(waitPanel); waitPanel.scrollIntoView({behavior:'smooth', block:'start'}); }
  function setError(message) { if (!error) return; error.textContent = message || ''; error.hidden = !message; }
  function event(name, detail) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({event:name}, detail || {}));
    window.dispatchEvent(new CustomEvent(name.replace(/_/g, '-') , {detail:detail || {}}));
  }

  function updateStatus(state) {
    var phase = String(state.phase || 'building');
    var title = root.querySelector('[data-demo-status-title]');
    var copy = root.querySelector('[data-demo-status-copy]');
    var label = root.querySelector('[data-demo-phase-label]');
    var spinner = root.querySelector('[data-demo-spinner]');
    var steps = root.querySelectorAll('[data-demo-progress] span');
    var actions = root.querySelector('[data-demo-ready-actions]');
    if (phase === 'ready') {
      if (label) label.textContent = 'YOUR DEMO IS READY';
      if (title) title.textContent = (state.storefront_name || 'Your store') + ' is ready to try.';
      if (copy) copy.textContent = 'Open the real admin preview, adjust the store, and build one product. Sign in only when you want to keep it.';
      if (spinner) spinner.classList.add('is-done');
      steps.forEach(function (step) { step.className = 'is-done'; });
      var admin = root.querySelector('[data-open-admin]');
      var preview = root.querySelector('[data-open-preview]');
      var claim = root.querySelector('[data-claim-store]');
      if (admin) admin.href = state.admin_url || '#';
      if (preview) preview.href = state.preview_url || '#';
      if (claim) claim.href = state.claim_url || '#';
      show(actions);
      if (!current.readyReported) {
        current.readyReported = true; save(current);
        event('anonymous_demo_ready', {storefront_handle:state.storefront_handle || current.handle});
      }
      if (pollTimer) clearTimeout(pollTimer);
      return;
    }
    if (phase === 'failed' || phase === 'expired') {
      if (spinner) spinner.style.display = 'none';
      if (label) label.textContent = phase === 'expired' ? 'DEMO EXPIRED' : 'BUILD NEEDS HELP';
      if (title) title.textContent = phase === 'expired' ? 'This temporary demo has expired.' : 'We could not finish this demo.';
      if (copy) copy.textContent = state.error || (phase === 'expired' ? 'You can start a new demo whenever you are ready.' : 'Nothing was claimed or charged. Please start again.');
      if (pollTimer) clearTimeout(pollTimer);
      clearSaved();
      return;
    }
    if (phase === 'claimed') {
      if (label) label.textContent = 'STORE CLAIMED';
      if (title) title.textContent = 'This store is safely connected to your account.';
      if (copy) copy.textContent = 'Open your dashboard anytime to keep working on it.';
      if (spinner) spinner.classList.add('is-done');
      if (pollTimer) clearTimeout(pollTimer);
      clearSaved();
      return;
    }
    if (steps[0]) steps[0].className = 'is-done';
    if (steps[1]) steps[1].className = 'is-active';
    pollTimer = setTimeout(poll, 5000);
  }

  async function poll() {
    if (!current || !current.token) return;
    try {
      var response = await fetch(api + '/api/demo/status', {
        method:'GET', cache:'no-store', headers:{'Authorization':'Bearer ' + current.token, 'Accept':'application/json'}
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.error || 'Unable to check your demo');
      current.handle = data.storefront_handle || current.handle;
      current.storeName = data.storefront_name || current.storeName;
      current.expiresAt = data.expires_at || current.expiresAt;
      save(current);
      updateStatus(data);
    } catch (err) {
      var copy = root.querySelector('[data-demo-status-copy]');
      if (copy) copy.textContent = 'The connection paused. We will check again automatically.';
      pollTimer = setTimeout(poll, 8000);
    }
  }

  async function submitDemo(eventObject) {
    eventObject.preventDefault();
    setError('');
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = 'Saving your request…';
    try {
      var response = await fetch(api + '/api/demo/storefront-request', {method:'POST', body:new FormData(form)});
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.error || 'Unable to start your demo');
      save({token:data.resume_token, handle:data.storefront_handle, storeName:form.elements.storefront_name.value, createdAt:Date.now(), readyReported:false});
      history.replaceState(null, '', location.pathname + '#resume=' + encodeURIComponent(data.resume_token));
      event('anonymous_demo_started', {storefront_handle:data.storefront_handle});
      showWait();
      poll();
    } catch (err) {
      setError(err.message || 'Unable to start your demo. Please try again.');
      submit.disabled = false;
      submit.textContent = 'Build my demo store →';
      error.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }

  root.querySelectorAll('[data-open-demo-form]').forEach(function (button) { button.addEventListener('click', showForm); });
  var back = root.querySelector('[data-back-to-choice]'); if (back) back.addEventListener('click', showChoice);
  if (form) form.addEventListener('submit', submitDemo);
  var logo = root.querySelector('[data-demo-logo]');
  if (logo) logo.addEventListener('change', function () {
    var copy = root.querySelector('[data-demo-file-copy]');
    if (copy) copy.textContent = logo.files && logo.files[0] ? logo.files[0].name : 'PNG, JPG, or WebP · maximum 12 MB';
  });
  var copier = root.querySelector('[data-copy-return]');
  if (copier) copier.addEventListener('click', async function () {
    var result = root.querySelector('[data-copy-result]');
    try { await navigator.clipboard.writeText(returnUrl()); if (result) result.textContent = 'Private return link copied.'; }
    catch (_e) { if (result) result.textContent = 'Copy the address from your browser bar.'; }
  });
  var startOver = root.querySelector('[data-demo-start-over]');
  if (startOver) startOver.addEventListener('click', function () {
    if (!window.confirm('Remove this demo from this browser? The temporary store will still expire on schedule.')) return;
    if (pollTimer) clearTimeout(pollTimer); clearSaved(); history.replaceState(null, '', location.pathname); form.reset(); showChoice();
  });

  var hashToken = tokenFromHash();
  var saved = readSaved();
  if (hashToken) {
    save(Object.assign({}, saved || {}, {token:hashToken})); showWait(); poll();
  } else if (saved && saved.token) {
    current = saved; history.replaceState(null, '', location.pathname + '#resume=' + encodeURIComponent(saved.token)); showWait(); poll();
  } else {
    showChoice();
  }
})();
