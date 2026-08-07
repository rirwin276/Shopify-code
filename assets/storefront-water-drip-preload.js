(function(){
  function install(){
    document.querySelectorAll('.sfs-design-grid').forEach(function(grid){
      if (grid.querySelector('[data-sfs-design="drip"]')) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.sfsDesign = 'drip';
      button.setAttribute('aria-label','Water Drip storefront design');
      button.innerHTML = '<i class="sfs-design-thumb sfs-design-thumb--drip"></i><strong>Water Drip</strong><small>Dark base with a two-color flowing drip edge</small>';
      grid.appendChild(button);
    });
  }

  install();
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();
