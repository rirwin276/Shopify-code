(function () {
  'use strict';
  var root = document.querySelector('[data-ss-private-preview]');
  if (!root) return;
  var api = root.dataset.api.replace(/\/+$/, ''), saved, data, timer, busy = false, pendingDelete;
  var params = new URLSearchParams(location.search), tab = params.get('tab') || 'store';
  var $ = function (s) { return root.querySelector(s); };
  try { saved = JSON.parse(localStorage.getItem('ss_anonymous_demo_v1') || 'null'); } catch (_) {}
  function error(message) { $('[data-error]').textContent = message || ''; $('[data-error]').hidden = !message; }
  function el(tag, text, cls) { var node = document.createElement(tag); if (text != null) node.textContent = text; if (cls) node.className = cls; return node; }
  function button(text, action) { var b = el('button', text); b.type = 'button'; b.onclick = action; return b; }
  async function call(path, body) {
    var controller = new AbortController(), timeout = setTimeout(function () { controller.abort(); }, 45000);
    try {
      var response = await fetch(api + path, {method: body ? 'POST' : 'GET', signal:controller.signal,
        headers: Object.assign({'Authorization':'Bearer ' + saved.token}, body ? {'Content-Type':'application/json'} : {}),
        body: body ? JSON.stringify(body) : undefined, cache:'no-store'});
      var result = await response.json();
      if (!response.ok) throw new Error(result.error || result.detail || 'Please try again.');
      return result;
    } finally { clearTimeout(timeout); }
  }
  function showTab(next) {
    tab = ['store','admin','appearance','activate'].includes(next) ? next : 'store';
    root.querySelectorAll('[data-panel]').forEach(function (n) { n.hidden = n.dataset.panel !== tab; });
    root.querySelectorAll('[data-tab]').forEach(function (n) { n.setAttribute('aria-selected', String(n.dataset.tab === tab)); });
    var url = new URL(location.href); url.searchParams.set('tab', tab); history.replaceState(null, '', url);
  }
  function activate() {
    root.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); });
    showTab('activate'); $('[data-panel="activate"]').scrollIntoView({behavior:'smooth', block:'start'});
  }
  function money(value) { return new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(Number(value || 0)); }
  function picture(url, alt) { var img = el('img'); if (/^https:\/\//.test(url || '')) img.src = url; img.alt = alt || ''; img.loading = 'lazy'; return img; }
  function model(product) { var t = product.tags.find(function (tag) { return tag.indexOf('model--') === 0; }); return t ? t.slice(7).toLowerCase() : ''; }
  function card(product, admin) {
    var node = el('article', null, 'ss-preview__card');
    var open = button('', function () { showProduct(product); });
    open.append(picture(((product.images.nodes || [])[0] || {}).url, product.title), el('h3', product.title));
    var variant = (product.variants.nodes || [])[0];
    open.append(el('p', variant ? money(variant.price) : 'Preview design'));
    node.append(open);
    if (admin) {
      var actions = el('div', null, 'ss-preview__card-actions');
      var m = model(product);
      if (m) actions.append(button('Edit design', function () { openBuilder(m, product.handle); }));
      var hidden = product.tags.includes('ss-preview-hidden');
      actions.append(button(hidden ? 'Show in store' : 'Hide', async function () {
        try { await call('/api/demo/product', {id:product.id,action:hidden?'show':'hide'}); await refresh(); } catch(e) { error(e.message); }
      }));
      actions.append(button('Remove', function () { pendingDelete = product.id; $('[data-delete]').showModal(); }));
      node.append(actions);
    }
    return node;
  }
  function render() {
    $('[data-loading]').hidden = true; $('[data-content]').hidden = false;
    $('[data-store-name]').textContent = data.name;
    if (data.logo_url) { $('[data-logo]').src = data.logo_url; $('[data-logo]').hidden = false; }
    var a = data.appearance || {};
    root.style.setProperty('--team', a.primary_color || '#142a3e');
    root.style.setProperty('--accent', a.secondary_color || '#c6ae70');
    root.style.setProperty('--team-text', a.primary_text || '#ffffff');
    $('[data-welcome]').textContent = a.welcome_message || 'Team gear, made just for you.';
    var form = $('[data-appearance]');
    if (!form.contains(document.activeElement)) {
      form.elements.name.value = data.name;
      form.elements.primary_color.value = a.primary_color || '#142a3e';
      form.elements.secondary_color.value = a.secondary_color || '#c6ae70';
      form.elements.welcome_message.value = a.welcome_message || '';
    }
    $('[data-products]').replaceChildren(); $('[data-admin-products]').replaceChildren();
    data.products.forEach(function (p) {
      if (!p.tags.includes('ss-preview-hidden')) $('[data-products]').append(card(p, false));
      $('[data-admin-products]').append(card(p, true));
    });
    if (!$('[data-products]').children.length) $('[data-products]').append(el('p', 'Your next great design starts in Manage & design.'));
    var build = data.build || {};
    var expiry = build.delete_due_at || build.expires_at;
    $('[data-expiry]').textContent = expiry ? 'Keep your store before ' + new Date(expiry).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) + ' to save your designs.' : 'Your preview is saved in this browser.';
    showTab(tab);
  }
  async function refresh() {
    if (busy || !saved) return;
    busy = true;
    try {
      data = await call('/api/demo/store');
      if (data.claimed) {
        clearTimeout(timer);
        $('[data-claim-status]').textContent = 'Your store is active. Opening your store…';
        var destination = new URL(data.store_url);
        if (destination.origin === location.origin) location.assign(destination.href);
        return;
      }
      render(); error('');
    } catch (e) { error(e.message); $('[data-loading]').hidden = true; }
    finally { busy = false; clearTimeout(timer); timer = setTimeout(refresh, document.hidden ? 30000 : 12000); }
  }
  function showProduct(product) {
    $('[data-product-title]').textContent = product.title;
    $('[data-product-description]').textContent = product.description || '';
    var images = product.images.nodes || [], variants = product.variants.nodes || [];
    var hero = $('[data-product-image]'); hero.removeAttribute('src');
    if (images[0]) hero.src = images[0].url;
    $('[data-product-thumbs]').replaceChildren();
    images.forEach(function (im) { var b = button('', function () { hero.src = im.url; }); b.setAttribute('aria-label', im.altText || 'View product image'); b.append(picture(im.url, im.altText)); $('[data-product-thumbs]').append(b); });
    var select = $('[data-variant]'); select.replaceChildren();
    variants.forEach(function (v, i) { var opt = el('option', v.title); opt.value = String(i); select.append(opt); });
    function change() { var v = variants[Number(select.value)]; if (!v) return; $('[data-product-price]').textContent = money(v.price); if (v.image) hero.src = v.image.url; }
    select.onchange = change; change(); $('[data-product]').showModal();
  }
  async function openBuilder(m, productHandle) {
    error('');
    try {
      var result = await call('/api/demo/builder', {model:m, product_handle:productHandle || '', logo_url:data.logo_url});
      var url = new URL(result.url);
      if (url.protocol !== 'https:' || !url.pathname.startsWith('/editor/')) throw new Error('Unable to open the design studio.');
      $('[data-catalog]').close();
      $('[data-editor] iframe').src = url.href;
      $('[data-editor]').showModal();
    } catch(e) { error(e.message); }
  }
  $('[data-add]').onclick = async function () {
    this.disabled = true; error('');
    try {
      var result = await call('/api/demo/catalog'), grid = $('[data-catalog-grid]'); grid.replaceChildren();
      result.products.forEach(function (p) { var node = el('article', null, 'ss-preview__card'); var b = button('', function () { openBuilder(String(p.id).toLowerCase()); }); b.append(picture(p.preview_image, p.name || p.title || p.label || p.id), el('h3', p.name || p.title || p.label || p.id), el('p', 'Make it yours →')); node.append(b); grid.append(node); });
      $('[data-catalog]').showModal();
    } catch(e) { error(e.message); } finally { this.disabled = false; }
  };
  $('[data-editor-close]').onclick = function () { $('[data-editor]').close(); $('[data-editor] iframe').removeAttribute('src'); showTab('admin'); $('[data-build-note]').textContent = 'If you saved a design, its finished mockups will appear here when the build completes.'; refresh(); };
  $('[data-delete-confirm]').onclick = async function () { this.disabled = true; try { await call('/api/demo/product', {id:pendingDelete,action:'delete'}); $('[data-delete]').close(); await refresh(); } catch(e) { error(e.message); } finally { this.disabled = false; } };
  $('[data-appearance]').oninput = function () { root.style.setProperty('--team', this.elements.primary_color.value); root.style.setProperty('--accent', this.elements.secondary_color.value); $('[data-store-name]').textContent = this.elements.name.value; $('[data-welcome]').textContent = this.elements.welcome_message.value; };
  $('[data-appearance]').onsubmit = async function (e) { e.preventDefault(); var b = this.querySelector('[type=submit]'); b.disabled = true; try { await call('/api/demo/appearance', Object.fromEntries(new FormData(this))); $('[data-style-status]').textContent = 'Saved. These changes stay with your store.'; await refresh(); } catch(err) { error(err.message); } finally { b.disabled = false; } };
  $('[data-claim]').onclick = async function () {
    if (root.dataset.signedIn !== 'true') {
      var returnUrl = new URL(location.href); returnUrl.searchParams.set('tab', 'activate');
      var login = new URL(root.dataset.login, location.origin); login.searchParams.set('return_to', returnUrl.pathname + returnUrl.search);
      location.assign(login.href); return;
    }
    this.disabled = true; $('[data-claim-status]').textContent = 'Keeping your store and activating your products…';
    try {
      var response = await fetch('/apps/ss/relay/storefront/' + encodeURIComponent(saved.handle) + '/join', {method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      var result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Please sign in again and retry.');
      if (result.platform_operator) throw new Error('Your platform administrator account can explore this preview. Use a customer account to test becoming its owner.');
      $('[data-claim-status]').textContent = 'Your store is claimed. Your saved products are being activated now…';
      await refresh();
    } catch(e) { $('[data-claim-status]').textContent = e.message; this.disabled = false; }
  };
  root.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { showTab(b.dataset.tab); }; });
  root.querySelectorAll('[data-activate]').forEach(function (b) { b.onclick = activate; });
  root.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { b.closest('dialog').close(); }; });
  window.addEventListener('pagehide', function () { clearTimeout(timer); });
  if (!saved || !saved.token || saved.handle !== params.get('shop')) {
    $('[data-loading]').hidden = true; error('This is a private preview. Return in the browser where you created your store.'); return;
  }
  refresh();
})();
