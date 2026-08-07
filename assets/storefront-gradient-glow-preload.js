(function(){
  function install(){
    document.querySelectorAll('.sfs-design-grid').forEach(function(grid){
      if (grid.querySelector('[data-sfs-design="gradient"]')) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.sfsDesign = 'gradient';
      button.setAttribute('aria-label','Gradient Glow storefront design');
      button.innerHTML = '<i class="sfs-design-thumb sfs-design-thumb--gradient"></i><strong>Gradient Glow</strong><small>Soft two-color fade behind the store and products</small>';
      var spray = grid.querySelector('[data-sfs-design="splash"]');
      grid.insertBefore(button, spray || null);
    });
  }

  install();
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();