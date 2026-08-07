(function(){
  function normalizeSavedLabel(scope){
    var label = scope.querySelector && scope.querySelector('[data-sfs-current-label]');
    if (!label) return;
    var text = label.textContent.trim();
    if (text === 'Color Splash' || text === 'Paint Spray') label.textContent = 'Spray Burst';
    if (text === 'Water Drip') label.textContent = 'Pro Dark';
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

    root.querySelectorAll('[data-sfs-design="drip"]').forEach(function(button){ button.remove(); });

    var gradientButton = root.querySelector('[data-sfs-design="gradient"]');
    if (gradientButton) {
      var gradientCopy = gradientButton.querySelector('small');
      if (gradientCopy) gradientCopy.textContent = 'Soft two-color fade behind the store and products';
    }

    var proButton = root.querySelector('[data-sfs-design="pro"]');
    if (proButton) {
      var proCopy = proButton.querySelector('small');
      if (proCopy) proCopy.textContent = 'Clean professional dark store with a subtle grid';
    }

    root.querySelectorAll('.sfs-control-heading').forEach(function(heading){
      var strong = heading.querySelector('strong');
      var small = heading.querySelector('small');
      if (strong && strong.textContent.trim() === 'Store design' && small) {
        small.textContent = 'Six product-first looks inspired by modern team and fan stores.';
      }
    });

    var launchCopy = root.querySelector('.sfs-admin-launch__copy p');
    if (launchCopy && launchCopy.textContent.indexOf('five team-store designs') !== -1) {
      launchCopy.textContent = 'Pick one of six team-store designs, then apply the team colors and an optional store message.';
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