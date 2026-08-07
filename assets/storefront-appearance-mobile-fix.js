(function () {
  function rehomeOverlays() {
    document.querySelectorAll('[data-sfs-root]').forEach(function (root) {
      var overlay = root.querySelector('[data-sfs-overlay]');
      if (!overlay || overlay.dataset.sfsRehomed === '1') return;
      overlay.dataset.sfsRehomed = '1';
      document.body.appendChild(overlay);
    });
  }

  function queueRehome() {
    window.setTimeout(rehomeOverlays, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', queueRehome, { once: true });
  } else {
    queueRehome();
  }

  document.addEventListener('shopify:section:load', queueRehome);
})();
