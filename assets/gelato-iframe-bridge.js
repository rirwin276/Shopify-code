/* gelato-iframe-bridge.js
   - Ensures Gelato embeddable editor iframe gets storefront context
   - Pulls from window.SS_STORE_HANDLE first, then sessionStorage 'ss_store_handle'
   - Adds as matrix param ;store=<handle> (preserves ;locale=en etc.)
*/

(function () {
  function getStoreHandle() {
    try {
      return (
        (window.SS_STORE_HANDLE && String(window.SS_STORE_HANDLE)) ||
        (sessionStorage.getItem("ss_store_handle") && String(sessionStorage.getItem("ss_store_handle"))) ||
        ""
      ).trim();
    } catch (e) {
      return "";
    }
  }

  function hasMatrixParam(url, key) {
    // matches ;key=... anywhere in URL
    var re = new RegExp(";" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=", "i");
    return re.test(url);
  }

  function addMatrixParam(url, key, value) {
    // Insert before any ?query or #hash, keeping existing ;locale=en
    var qIndex = url.indexOf("?");
    var hIndex = url.indexOf("#");
    var cut = url.length;

    if (qIndex !== -1) cut = Math.min(cut, qIndex);
    if (hIndex !== -1) cut = Math.min(cut, hIndex);

    var base = url.slice(0, cut);
    var tail = url.slice(cut);

    // Avoid duplicates
    if (hasMatrixParam(url, key)) return url;

    return base + ";" + key + "=" + encodeURIComponent(value) + tail;
  }

  function isGelatoEditorIframe(iframe) {
    try {
      var src = iframe && iframe.getAttribute("src");
      if (!src) return false;
      // Only touch Gelato embeddable editor
      return (
        src.indexOf("https://dashboard.gelato.com/") === 0 &&
        src.indexOf("/mf/embeddable-editor/shopify/") !== -1
      );
    } catch (e) {
      return false;
    }
  }

  function patchIframe(iframe) {
    if (!iframe || !isGelatoEditorIframe(iframe)) return;

    var store = getStoreHandle();
    if (!store) return;

    var src = iframe.getAttribute("src") || "";
    // Use matrix param style (matches Gelato's ;locale=en)
    var next = addMatrixParam(src, "store", store);

    if (next !== src) {
      iframe.setAttribute("src", next);
    }
  }

  function scan() {
    var iframe = document.getElementById("editor-iframe");
    if (iframe) patchIframe(iframe);

    // In case Gelato uses a different id sometimes, also scan likely iframes
    var iframes = document.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) patchIframe(iframes[i]);
  }

  // Initial scan
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  // Watch for late-inserted iframes (apps often inject after click)
  var obs = new MutationObserver(function (mutations) {
    for (var m = 0; m < mutations.length; m++) {
      var added = mutations[m].addedNodes;
      for (var n = 0; n < added.length; n++) {
        var node = added[n];
        if (!node || node.nodeType !== 1) continue;

        if (node.tagName === "IFRAME") patchIframe(node);

        var nested = node.querySelectorAll ? node.querySelectorAll("iframe") : [];
        for (var j = 0; j < nested.length; j++) patchIframe(nested[j]);
      }
    }
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
