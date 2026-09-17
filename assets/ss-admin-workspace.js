/* UI-only enhancements. Product writes remain in the existing admin controller. */
(function () {
  'use strict';
  var root = document.querySelector('.ap-workspace');
  if (!root) return;
  var products = root.querySelector('#apProductsAllContainer');
  var search = root.querySelector('#apProductSearch');
  var result = root.querySelector('#apProductResults');
  var empty = root.querySelector('#apFilterEmpty');
  var selected = 'all';
  var detail, detailRow, detailTrigger;

  function rows() { return products ? Array.from(products.querySelectorAll('.ap-product-row')) : []; }
  function title(row) { var node = row.querySelector('.ap-product-title'); return node ? (node.dataset.ssFullTitle || node.textContent).trim() : 'Store product'; }
  function filter() {
    var list = rows(), visible = 0, term = String(search && search.value || '').trim().toLowerCase();
    list.forEach(function (row) {
      var hidden = row.dataset.hidden === 'true';
      var pinned = !!row.querySelector('.ap-btn--pin-sm.is-pinned');
      var matches = (!term || title(row).toLowerCase().includes(term)) &&
        (selected === 'all' || selected === 'live' && !hidden || selected === 'hidden' && hidden || selected === 'pinned' && pinned);
      row.hidden = !matches;
      if (matches) visible++;
    });
    var summary = list.length ? visible + ' of ' + list.length + ' products' : '';
    if (result && result.textContent !== summary) result.textContent = summary;
    if (empty) empty.hidden = !list.length || visible > 0;
  }

  function closeDetail() { if (detail && detail.open) detail.close(); }
  function openDetail(row, trigger) {
    if (!detail) {
      detail = document.createElement('dialog');
      detail.className = 'ap-detail-dialog';
      detail.setAttribute('aria-labelledby', 'apDetailTitle');
      detail.innerHTML = '<button class="ap-detail-close" type="button" aria-label="Close product preview">×</button>' +
        '<div class="ap-detail-layout"><img class="ap-detail-image" alt=""><div class="ap-detail-copy">' +
        '<span class="ap-detail-eyebrow">Your store · product preview</span><h2 id="apDetailTitle"></h2>' +
        '<p data-ap-detail-state></p><p>Use the editor to adjust artwork, placement, and available colors. Pin and visibility controls stay on the product card.</p>' +
        '<button type="button" class="ap-detail-edit">Edit product</button></div></div>';
      document.body.appendChild(detail);
      detail.querySelector('.ap-detail-close').addEventListener('click', closeDetail);
      detail.addEventListener('click', function (event) { if (event.target === detail) { var bounds = detail.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDetail(); } });
      detail.addEventListener('close', function () { document.body.classList.remove('ap-product-detail-open'); if (detailTrigger && detailTrigger.isConnected) detailTrigger.focus(); });
      detail.querySelector('.ap-detail-edit').addEventListener('click', function () {
        // A silent product refresh may replace the original row while the
        // preview is open. Resolve the current row before invoking its editor.
        var current = rows().find(function (item) { return item.dataset.productHandle && item.dataset.productHandle === detailRow.dataset.productHandle; }) || detailRow;
        var editor = current.querySelector('.ap-edit-placement-btn');
        closeDetail();
        if (editor && editor.isConnected && !editor.disabled) editor.click();
      });
    }
    detailRow = row; detailTrigger = trigger;
    var original = row.querySelector('img.ap-product-thumb');
    var picture = detail.querySelector('.ap-detail-image');
    if (original) { picture.src = original.currentSrc || original.src; picture.alt = title(row); picture.hidden = false; }
    else { picture.removeAttribute('src'); picture.hidden = true; }
    detail.querySelector('h2').textContent = title(row);
    detail.querySelector('[data-ap-detail-state]').textContent = row.dataset.hidden === 'true' ? 'Hidden from your storefront.' : 'Visible in your storefront.';
    var editor = row.querySelector('.ap-edit-placement-btn');
    detail.querySelector('.ap-detail-edit').disabled = !editor || editor.disabled;
    detail.querySelector('.ap-detail-edit').textContent = (window.SSAP || {}).isProspectDemo ? 'Editing unlocks after claim' : editor ? 'Edit product' : 'Editor unavailable';
    if ((window.SSAP || {}).isProspectDemo) detail.querySelector('[data-ap-detail-state]').textContent = 'Preview product · claim the store to manage it.';
    if (typeof detail.showModal === 'function') { detail.showModal(); document.body.classList.add('ap-product-detail-open'); }
  }

  function enhance() {
    rows().forEach(function (row) {
      var image = row.querySelector('.ap-product-thumb');
      if (!image || image.closest('.ap-product-preview-trigger')) return;
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'ap-product-preview-trigger';
      button.setAttribute('aria-label', 'Preview ' + title(row));
      image.parentNode.insertBefore(button, image); button.appendChild(image);
      button.addEventListener('click', function () { openDetail(row, button); });
    });
    filter();
  }
  if (search) search.addEventListener('input', filter);
  root.querySelectorAll('[data-ap-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      selected = button.dataset.apFilter;
      root.querySelectorAll('[data-ap-filter]').forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)); });
      filter();
    });
  });
  root.querySelectorAll('[data-ap-open-tab]').forEach(function (button) {
    button.addEventListener('click', function () { var tab = document.getElementById(button.dataset.apOpenTab); if (tab) { tab.click(); tab.focus(); } });
  });
  var tabs = Array.from(root.querySelectorAll('.ap-main-tab-btn'));
  function syncTabs() { tabs.forEach(function (tab) { tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1; }); }
  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { window.setTimeout(syncTabs, 0); });
    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== null) { event.preventDefault(); tabs[next].click(); tabs[next].focus(); }
    });
  });
  // Observe only state that the product controller owns. The filter's hidden
  // attribute is intentionally excluded, avoiding an observer feedback loop.
  if (products) new MutationObserver(enhance).observe(products, {childList:true, subtree:true, attributes:true, attributeFilter:['data-hidden','data-pinned']});
  enhance(); syncTabs();
})();
