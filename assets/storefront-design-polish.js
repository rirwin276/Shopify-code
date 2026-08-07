(function(){
  function polish(root){
    var paintButton = root.querySelector('[data-sfs-design="splash"]');
    if (paintButton) {
      var title = paintButton.querySelector('strong');
      var copy = paintButton.querySelector('small');
      if (title) title.textContent = 'Paint Spray';
      if (copy) copy.textContent = 'Dark full-store background with organic team-color splatter';
      paintButton.setAttribute('aria-label','Paint Spray storefront design');
    }

    var proButton = root.querySelector('[data-sfs-design="pro"]');
    if (proButton) {
      var proCopy = proButton.querySelector('small');
      if (proCopy) proCopy.textContent = 'Clean professional dark store with a subtle grid';
    }
  }

  function boot(){
    document.querySelectorAll('[data-sfs-root]').forEach(polish);
    document.querySelectorAll('[data-sfs-overlay]').forEach(polish);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
