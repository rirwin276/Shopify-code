(function(){
  function tagClosest(node,className){
    if (!node) return null;
    var section = node.closest('.shopify-section');
    if (section) section.classList.add(className);
    return section;
  }

  function syncFundraiser(){
    var bar = document.querySelector('.ss-frbar');
    var section = tagClosest(bar,'ss-storefront-fundraiser-section');
    if (!bar || !section) return;
    section.style.display = bar.hidden ? 'none' : '';
    if (bar.dataset.ssStructureWatch === '1') return;
    bar.dataset.ssStructureWatch = '1';
    new MutationObserver(function(){ section.style.display = bar.hidden ? 'none' : ''; }).observe(bar,{attributes:true,attributeFilter:['hidden']});
  }

  function boot(){
    tagClosest(document.querySelector('.ps-hero'),'ss-storefront-hero-section');
    tagClosest(document.querySelector('[data-ss-storefront-enhancements]'),'ss-storefront-tabs-section');
    tagClosest(document.querySelector('results-list'),'ss-storefront-products-section');
    tagClosest(document.querySelector('.ss-smart-jump'),'ss-storefront-partner-jump-section');
    syncFundraiser();

    document.querySelectorAll('.shopify-section').forEach(function(section){
      var id = section.id || '';
      if (id.indexOf('partner_jump') !== -1 && !section.querySelector('.ss-smart-jump')) section.style.display = 'none';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  document.addEventListener('shopify:section:load',boot);
})();
