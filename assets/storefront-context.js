/**
 * STELLA & SAGE - Storefront Context
 * Captures the current private-store handle.
 *
 * Rules:
 * 1. Explicit URL context always wins: ?shop=handle or ?sh=handle.
 * 2. Collection pages save their collection handle when it is not a system collection.
 * 3. Internal/admin pages should not silently reuse a stale store handle when the URL
 *    does not provide one.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ss_store_handle';
  var ignoredCollections = ['all', 'frontpage', 'new-arrivals', 'vendors', 'types'];
  var internalPaths = ['/pages/admin-powers', '/pages/price-editor'];

  function cleanHandle(value) {
    return String(value || '')
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .split('?')[0]
      .split('#')[0];
  }

  function isInternalPath(path) {
    return internalPaths.some(function (prefix) {
      return path.indexOf(prefix) === 0;
    });
  }

  function setHandle(handle) {
    handle = cleanHandle(handle);
    if (!handle) return '';
    try {
      sessionStorage.setItem(STORAGE_KEY, handle);
      window.SS_STORE_HANDLE = handle;
      document.documentElement.setAttribute('data-ss-store-handle', handle);
    } catch (_e) {}
    return handle;
  }

  function clearHandle() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      window.SS_STORE_HANDLE = '';
      document.documentElement.removeAttribute('data-ss-store-handle');
    } catch (_e) {}
  }

  function getCollectionHandle(path) {
    if (path.indexOf('/collections/') === -1) return '';
    var parts = path.split('/');
    var idx = parts.indexOf('collections');
    if (idx === -1 || !parts[idx + 1]) return '';
    var handle = cleanHandle(parts[idx + 1]);
    if (!handle || ignoredCollections.indexOf(handle) !== -1) return '';
    return handle;
  }

  function captureContext() {
    var path = window.location.pathname || '';
    var params = new URLSearchParams(window.location.search || '');

    // URL context always wins. This fixes mobile/internal pages reopening the
    // last session store, such as cast-swim-team, instead of the requested store.
    var urlHandle = cleanHandle(params.get('shop') || params.get('sh') || params.get('store') || '');
    if (urlHandle) {
      return setHandle(urlHandle);
    }

    // Collection context is second priority.
    var collectionHandle = getCollectionHandle(path);
    if (collectionHandle) {
      return setHandle(collectionHandle);
    }

    // Internal pages without explicit URL context should not keep stale store context.
    if (isInternalPath(path)) {
      clearHandle();
      return '';
    }

    // Other pages can keep the last known handle for product-page deep links.
    try {
      var stored = cleanHandle(sessionStorage.getItem(STORAGE_KEY) || '');
      if (stored) {
        window.SS_STORE_HANDLE = stored;
        document.documentElement.setAttribute('data-ss-store-handle', stored);
        return stored;
      }
    } catch (_e) {}

    return '';
  }

  captureContext();
})();
