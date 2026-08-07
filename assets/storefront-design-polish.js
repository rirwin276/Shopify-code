(function(){
  function normalizeSavedLabel(scope){
    var label = scope.querySelector && scope.querySelector('[data-sfs-current-label]');
    if (!label) return;
    var text = label.textContent.trim();
    if (text === 'Color Splash' || text === 'Paint Spray') label.textContent = 'Spray Burst';
  }

  function polish(root){
    var sprayButton = root.querySelector('[data-sfs-design="splash"]');
    if (sprayButton) {
      var sprayTitle = sprayButton.querySelector('strong');
      var sprayCopy = sprayButton.querySelector('small');
      if (sprayTitle) sprayTitle.textContent = 'Spray Burst';
      if (sprayCopy) sprayCopy.textContent = 'Two-color corner blast with overspray and a few drips';
      sprayButton.setAttribute('aria-label','Spray Burst storefront design');
    }

    var dripButton = root.querySelector('[data-sfs-design="drip"]');
    if (dripButton) {
      var dripTitle = dripButton.querySelector('strong');
      var dripCopy = dripButton.querySelector('small');
      if (dripTitle) dripTitle.textContent = 'Water Drip';
      if (dripCopy) dripCopy.textContent = 'Dark base with a blended two-color drip edge';
      dripButton.setAttribute('aria-label','Water Drip storefront design');
    }

    var proButton = root.querySelector('[data-sfs-design="pro"]');
    if (proButton) {
      var proCopy = proButton.querySelector('small');
      if (proCopy) proCopy.textContent = 'Clean professional dark store with a subtle grid';
    }

    normalizeSavedLabel(root);
    if (root.dataset.sfsDesignObserver !== '1') {
      root.dataset.sfsDesignObserver = '1';
      new MutationObserver(function(){ normalizeSavedLabel(root); }).observe(root, {childList:true, subtree:true,characterData:true});
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