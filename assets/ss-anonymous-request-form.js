/* Use the live request-form UI for a private, claimable anonymous preview. */
(function () {
  'use strict';
  var form = document.getElementById('sf-request-form');
  if (!form || form.dataset.signedIn !== 'false') return;
  var waitingRoom = '/pages/request-storefront-form?view=start-team-store';
  try {
    var existing = JSON.parse(localStorage.getItem('ss_anonymous_demo_v1') || 'null');
    if (existing && existing.token) {
      if (typeof window.__ssAnonymousNavigate === 'function') window.__ssAnonymousNavigate(waitingRoom);
      else window.location.replace(waitingRoom);
      return;
    }
  } catch (_) {}
  var api = String(form.dataset.anonymousApi || '').replace(/\/+$/, '');
  var submit = document.getElementById('sf-submit-btn');
  var input = document.getElementById('MainLogo');
  var drop = document.getElementById('MainLogoDrop');
  var previewRow = document.getElementById('MainLogoPreviewRow');
  var preview = document.getElementById('MainLogoPreview');
  var actions = document.getElementById('MainLogoActions');
  var badge = document.getElementById('MainLogoBadge');
  var quality = document.getElementById('MainLogoQualitySub');
  var error = document.getElementById('sf-error-inline');
  var objectUrl = '';

  function showError(message) {
    if (!error) return;
    error.textContent = message || 'Please check the form and try again.';
    error.classList.remove('sf-hidden');
    error.scrollIntoView({behavior:'smooth', block:'center'});
  }
  function clearError() { if (error) { error.textContent = ''; error.classList.add('sf-hidden'); } }
  function selectedColor() { var picked = form.querySelector('input[name="primary_color"]:checked'); return picked ? picked.value : ''; }
  function typeOfStore() {
    var type = document.getElementById('OrgType');
    return type ? String(type.value || '').trim() : '';
  }
  function valid() {
    return !!(typeOfStore() && selectedColor() && document.getElementById('StoreName').value.trim() && input && input.files && input.files[0]);
  }
  function update() { if (submit && !submit.dataset.busy) submit.disabled = !valid(); }
  function imageThumb(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), image = new Image();
      image.onload = function () {
        try {
          var canvas = document.createElement('canvas'), size = 128;
          canvas.width = size; canvas.height = size;
          var scale = Math.min(size / image.width, size / image.height);
          var width = image.width * scale, height = image.height * scale;
          canvas.getContext('2d').drawImage(image, (size-width)/2, (size-height)/2, width, height);
          resolve(canvas.toDataURL('image/png'));
        } catch (_) { resolve(''); }
        URL.revokeObjectURL(url);
      };
      image.onerror = function () { URL.revokeObjectURL(url); resolve(''); };
      image.src = url;
    });
  }
  function previewFile() {
    var file = input && input.files && input.files[0];
    if (!file) { update(); return; }
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 12 * 1024 * 1024) {
      showError('Choose a PNG, JPG or WebP image smaller than 12 MB.'); clearAnonymousLogo(); return;
    }
    clearError();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file); preview.src = objectUrl;
    previewRow.classList.remove('sf-hidden'); actions.classList.remove('sf-hidden');
    badge.textContent = 'Ready'; badge.className = 'sf-badge sf-badge--good';
    quality.textContent = file.name; document.getElementById('MainLogoText').textContent = 'Logo selected';
    drop.classList.remove('sf-field-error'); update();
  }
  window.openAnonymousLogoPicker = function () { if (input) input.click(); return false; };
  window.clearAnonymousLogo = function () {
    if (input) input.value = ''; if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = '';
    if (preview) preview.removeAttribute('src'); if (previewRow) previewRow.classList.add('sf-hidden');
    if (actions) actions.classList.add('sf-hidden');
    var label = document.getElementById('MainLogoText'); if (label) label.textContent = 'Upload & review logo';
    update(); return false;
  };
  window.toggleConditionals = function () {
    var hidden = document.getElementById('SF_TYPE_OF_STORE'); if (hidden) hidden.value = typeOfStore(); update();
  };
  window.generateHandle = function () {
    var name = document.getElementById('StoreName').value || '';
    var handle = name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,72);
    var display = document.getElementById('HandlePreview'); if (display) display.textContent = handle || '...';
    var hidden = document.getElementById('HiddenHandle'); if (hidden) hidden.value = handle; update();
  };
  window.sfToastHide = function () {};
  window.submitAnonymousPreview = async function (event) {
    event.preventDefault(); clearError(); generateHandle();
    if (!valid()) { showError('Choose a store type and shirt color, enter the storefront name, and add your logo.'); return; }
    var file = input.files[0];
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 12 * 1024 * 1024) { showError('Choose a PNG, JPG or WebP image smaller than 12 MB.'); return; }
    if (!api.startsWith('https://')) { showError('The private preview service is unavailable right now.'); return; }
    var startedAt = Date.now();
    submit.dataset.busy = '1'; submit.disabled = true; submit.textContent = 'Opening your waiting room…';
    form.setAttribute('aria-busy', 'true');
    try {
      var logoThumb = await imageThumb(file), body = new FormData();
      body.set('storefront_name', document.getElementById('StoreName').value.trim());
      body.set('type_of_store', typeOfStore()); body.set('primary_color', selectedColor());
      body.set('storefront_logo_file', file); body.set('website', '');
      var response = await fetch(api + '/api/demo/storefront-request', {method:'POST', body:body});
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.resume_token) throw new Error(data.error || 'We could not start your preview. Please try again.');
      localStorage.setItem('ss_anonymous_demo_v1', JSON.stringify({token:data.resume_token, handle:data.storefront_handle, storeName:document.getElementById('StoreName').value.trim(), createdAt:startedAt, readyReported:false, logoThumb:logoThumb, apiBase:api, startUrl:waitingRoom}));
      if (typeof window.__ssAnonymousNavigate === 'function') window.__ssAnonymousNavigate(waitingRoom);
      else window.location.replace(waitingRoom);
    } catch (problem) {
      form.removeAttribute('aria-busy');
      delete submit.dataset.busy; submit.textContent = 'Build my free preview'; update(); showError(problem.message);
    }
  };
  if (input) input.addEventListener('change', previewFile);
  form.addEventListener('input', update); form.addEventListener('change', update);
  generateHandle(); toggleConditionals(); update();
})();
