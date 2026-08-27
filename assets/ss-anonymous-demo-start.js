/* Stella & Sage — anonymous demo using the normal storefront-form experience. */
(function () {
  'use strict';
  var root = document.querySelector('[data-ss-demo-start]');
  if (!root || root.getAttribute('data-enabled') !== 'true') return;

  var key = 'ss_anonymous_demo_v1';
  var api = String(root.getAttribute('data-api-base') || '').replace(/\/+$/, '');
  var formPanel = root.querySelector('[data-demo-form-panel]');
  var waitPanel = root.querySelector('[data-demo-wait]');
  var form = root.querySelector('[data-demo-form]');
  var error = root.querySelector('[data-demo-error]');
  var submit = root.querySelector('[data-demo-submit]');
  var modal = root.querySelector('#sf-uploader-modal');
  var iframe = root.querySelector('#sf-uploader-iframe');
  var logoInput = root.querySelector('#MainLogo');
  var pollTimer = null;
  var current = null;
  var logoReady = false;
  var logoPending = false;

  function readSaved() { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_e) { return null; } }
  function save(value) { current = value; try { localStorage.setItem(key, JSON.stringify(value)); } catch (_e) {} }
  function clearSaved() { current = null; try { localStorage.removeItem(key); } catch (_e) {} }
  function tokenFromHash() { try { return new URLSearchParams(location.hash.slice(1)).get('resume') || ''; } catch (_e) { return ''; } }
  function returnUrl() { return location.origin + location.pathname + '#resume=' + encodeURIComponent(current.token); }
  function show(node) { if (node) node.hidden = false; }
  function hide(node) { if (node) node.hidden = true; }
  function showForm() { show(formPanel); hide(waitPanel); }
  function showWait() { hide(formPanel); show(waitPanel); window.scrollTo({top: Math.max(0, root.offsetTop - 20), behavior:'smooth'}); }
  function setError(message) { if (!error) return; error.textContent = message || ''; error.hidden = !message; }
  function event(name, detail) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({event:name}, detail || {}));
    window.dispatchEvent(new CustomEvent(name.replace(/_/g, '-'), {detail:detail || {}}));
  }
  function text(id, value) { var node = root.querySelector('#' + id); if (node) node.textContent = value || ''; }
  function hideClass(id, hidden) { var node = root.querySelector('#' + id); if (node) node.classList.toggle('sf-hidden', !!hidden); }
  function badge(tier, value) { var node = root.querySelector('#MainLogoBadge'); if (node) { node.className = 'sf-badge sf-badge--' + tier; node.textContent = value; } }

  function openUploader(eventObject) {
    if (eventObject) { eventObject.preventDefault(); eventObject.stopPropagation(); }
    if (!modal || !iframe || !api) return false;
    if (modal.parentNode !== document.body) document.body.appendChild(modal);
    iframe.src = api + '/ui?embed=1&return=postmessage&slot=main&mode=request&autopick=1';
    modal.classList.remove('sf-hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    return false;
  }
  function closeUploader() {
    if (iframe) iframe.src = 'about:blank';
    if (modal) { modal.classList.add('sf-hidden'); modal.setAttribute('aria-hidden', 'true'); }
    document.body.style.overflow = '';
  }
  async function fileFromSavedImage(imageUrl, filename, mime) {
    var res = await fetch(imageUrl + (imageUrl.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), {cache:'no-store'});
    if (!res.ok) throw new Error('Image fetch failed ' + res.status);
    var blob = await res.blob();
    if (!blob || !blob.size) throw new Error('Image fetch returned empty blob');
    return new File([blob], filename || 'main_logo.png', {type:mime || blob.type || 'image/png'});
  }
  function injectLogo(file, sessionId) {
    var dt = new DataTransfer();
    dt.items.add(file);
    logoInput.files = dt.files;
    var session = root.querySelector('#SF_MAIN_SESSION');
    if (session) session.value = sessionId || '';
  }
  async function previewLogo(file) {
    var img = root.querySelector('#MainLogoPreview');
    if (!img) return;
    if (img.dataset.objectUrl) { try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_e) {} }
    var url = URL.createObjectURL(file);
    img.dataset.objectUrl = url;
    img.src = url;
    hideClass('MainLogoPreviewRow', false);
    text('MainLogoText', '✅ Ready');
    badge('neutral', 'Checking…');
    text('MainLogoQualitySub', '');
    await new Promise(function (resolve) {
      var probe = new Image();
      probe.onload = function () {
        var longest = Math.max(probe.naturalWidth || 0, probe.naturalHeight || 0);
        if (longest >= 3000) { badge('excellent', 'Excellent'); text('MainLogoQualitySub', 'Awesome — should print great.'); logoReady = true; }
        else if (longest >= 2400) { badge('good', 'Good'); text('MainLogoQualitySub', 'Should print fine.'); logoReady = true; }
        else if (longest >= 1200) { badge('risky', 'Good Enough'); text('MainLogoQualitySub', 'Probably okay for simple logos, but not ideal.'); logoReady = true; }
        else { badge('bad', 'Bad'); text('MainLogoQualitySub', 'Too low-quality to print cleanly. Please edit again or choose a better file.'); logoReady = false; }
        resolve();
      };
      probe.onerror = function () { badge('bad', 'Bad'); text('MainLogoQualitySub', 'Preview failed to load. Please try again.'); logoReady = false; resolve(); };
      probe.src = url;
    });
  }
  function clearLogo(eventObject) {
    if (eventObject) { eventObject.preventDefault(); eventObject.stopPropagation(); }
    if (logoInput) logoInput.value = '';
    var img = root.querySelector('#MainLogoPreview');
    if (img && img.dataset.objectUrl) { try { URL.revokeObjectURL(img.dataset.objectUrl); } catch (_e) {} img.removeAttribute('src'); delete img.dataset.objectUrl; }
    logoReady = false; logoPending = false;
    hideClass('MainLogoPreviewRow', true); hideClass('MainLogoPending', true);
    text('MainLogoText', 'Upload & review logo'); badge('neutral', 'Checking…'); text('MainLogoQualitySub', '');
    var session = root.querySelector('#SF_MAIN_SESSION'); if (session) session.value = '';
    return false;
  }

  window.addEventListener('message', async function (eventObject) {
    var msg = eventObject && eventObject.data;
    if (!msg || typeof msg !== 'object' || msg.type !== 'studio-uploader:done') return;
    try { if (eventObject.origin !== new URL(api).origin) return; } catch (_e) { return; }
    if (!msg.finalize_url || !msg.session_id) { setError('Could not save that image. Please try again.'); return; }
    logoPending = true; hideClass('MainLogoPending', false); badge('neutral', 'Saving…');
    try {
      var finalized = await fetch(msg.finalize_url, {method:'POST', headers:{'Accept':'application/json'}, cache:'no-store'});
      if (!finalized.ok) throw new Error('Finalize failed ' + finalized.status);
      var data = await finalized.json();
      var imageUrl = data.final_image_url || msg.final_image_url || '';
      if (!imageUrl) throw new Error('Finalize response missing final image');
      imageUrl = new URL(imageUrl, api).toString();
      var file = await fileFromSavedImage(imageUrl, msg.filename || 'main_logo.png', msg.mime || 'image/png');
      injectLogo(file, msg.session_id);
      await previewLogo(file);
      closeUploader();
      setError('');
    } catch (err) {
      logoReady = false;
      setError('Could not save that image. Please try again.');
    } finally {
      logoPending = false; hideClass('MainLogoPending', true);
    }
  });

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
      if (!current.readyReported) { current.readyReported = true; save(current); event('anonymous_demo_ready', {storefront_handle:state.storefront_handle || current.handle}); }
      if (pollTimer) clearTimeout(pollTimer);
      return;
    }
    if (phase === 'failed' || phase === 'expired') {
      if (spinner) spinner.style.display = 'none';
      if (label) label.textContent = phase === 'expired' ? 'DEMO EXPIRED' : 'BUILD NEEDS HELP';
      if (title) title.textContent = phase === 'expired' ? 'This temporary demo has expired.' : 'We could not finish this demo.';
      if (copy) copy.textContent = state.error || (phase === 'expired' ? 'You can start a new demo whenever you are ready.' : 'Nothing was claimed or charged. Please start again.');
      if (pollTimer) clearTimeout(pollTimer); clearSaved(); return;
    }
    if (phase === 'claimed') {
      if (label) label.textContent = 'STORE CLAIMED';
      if (title) title.textContent = 'This store is safely connected to your account.';
      if (copy) copy.textContent = 'Open your dashboard anytime to keep working on it.';
      if (spinner) spinner.classList.add('is-done');
      if (pollTimer) clearTimeout(pollTimer); clearSaved(); return;
    }
    if (steps[0]) steps[0].className = 'is-done';
    if (steps[1]) steps[1].className = 'is-active';
    pollTimer = setTimeout(poll, 5000);
  }

  async function poll() {
    if (!current || !current.token) return;
    try {
      var response = await fetch(api + '/api/demo/status', {method:'GET', cache:'no-store', headers:{'Authorization':'Bearer ' + current.token, 'Accept':'application/json'}});
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.error || 'Unable to check your demo');
      current.handle = data.storefront_handle || current.handle; current.storeName = data.storefront_name || current.storeName; current.expiresAt = data.expires_at || current.expiresAt; save(current); updateStatus(data);
    } catch (_err) {
      var copy = root.querySelector('[data-demo-status-copy]'); if (copy) copy.textContent = 'The connection paused. We will check again automatically.'; pollTimer = setTimeout(poll, 8000);
    }
  }

  async function submitDemo(eventObject) {
    eventObject.preventDefault(); setError('');
    if (logoPending) { setError('Please wait — your logo is still saving.'); return; }
    if (!logoReady || !logoInput || !logoInput.files || !logoInput.files[0]) { setError('Please upload and review your logo first.'); openUploader(); return; }
    if (!form.reportValidity()) return;
    submit.disabled = true; submit.textContent = 'Saving your request…';
    try {
      var dataToSend = new FormData(form);
      var orgType = String(root.querySelector('#OrgType').value || '').trim();
      dataToSend.set('type_of_store', orgType || 'Other');
      var color = root.querySelector('input[name="primary_color"]:checked');
      dataToSend.set('primary_color', color ? color.value : 'No preference');
      var response = await fetch(api + '/api/demo/storefront-request', {method:'POST', body:dataToSend});
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(data.error || 'Unable to start your demo');
      save({token:data.resume_token, handle:data.storefront_handle, storeName:root.querySelector('#StoreName').value, createdAt:Date.now(), readyReported:false});
      history.replaceState(null, '', location.pathname + '#resume=' + encodeURIComponent(data.resume_token));
      event('anonymous_demo_started', {storefront_handle:data.storefront_handle}); showWait(); poll();
    } catch (err) {
      setError(err.message || 'Unable to start your demo. Please try again.'); submit.disabled = false; submit.textContent = 'Submit Request'; if (error) error.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }

  root.querySelectorAll('[data-demo-open-uploader]').forEach(function (node) { node.addEventListener('click', openUploader); node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') openUploader(e); }); });
  root.querySelectorAll('[data-demo-close-uploader]').forEach(function (node) { node.addEventListener('click', closeUploader); });
  var clear = root.querySelector('[data-demo-clear-logo]'); if (clear) clear.addEventListener('click', clearLogo);
  if (form) form.addEventListener('submit', submitDemo);
  var copier = root.querySelector('[data-copy-return]'); if (copier) copier.addEventListener('click', async function () { var result = root.querySelector('[data-copy-result]'); try { await navigator.clipboard.writeText(returnUrl()); if (result) result.textContent = 'Private return link copied.'; } catch (_e) { if (result) result.textContent = 'Copy the address from your browser bar.'; } });
  var startOver = root.querySelector('[data-demo-start-over]'); if (startOver) startOver.addEventListener('click', function () { if (!window.confirm('Remove this demo from this browser? The temporary store will still expire on schedule.')) return; if (pollTimer) clearTimeout(pollTimer); clearSaved(); history.replaceState(null, '', location.pathname); if (form) form.reset(); clearLogo(); showForm(); });

  var hashToken = tokenFromHash(); var saved = readSaved();
  if (hashToken) { save(Object.assign({}, saved || {}, {token:hashToken})); showWait(); poll(); }
  else if (saved && saved.token) { current = saved; history.replaceState(null, '', location.pathname + '#resume=' + encodeURIComponent(saved.token)); showWait(); poll(); }
  else { showForm(); }
})();
