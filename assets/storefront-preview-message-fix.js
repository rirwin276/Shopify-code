(function(){
  function syncOverlay(overlay){
    if (!overlay) return;
    var input = overlay.querySelector('[data-sfs-announcement]');
    var toggle = overlay.querySelector('[data-sfs-show-announcement]');
    if (!input || !toggle) return;

    var text = String(input.value || '').trim();
    var visible = !!toggle.checked && !!text;

    overlay.querySelectorAll('[data-sfs-real-frame]').forEach(function(frame){
      var doc;
      try { doc = frame.contentDocument; } catch(_e) { return; }
      if (!doc) return;

      var copy = doc.querySelector('.ps-hero .ps-copy');
      var message = doc.querySelector('.ps-hero .ss-hero-message');

      if (!visible) {
        if (message) message.remove();
        return;
      }

      if (!copy) return;
      if (!message) {
        message = doc.createElement('div');
        message.className = 'ss-hero-message';
        copy.appendChild(message);
      }
      message.hidden = false;
      message.textContent = text;
    });
  }

  function schedule(overlay){
    window.requestAnimationFrame(function(){
      window.requestAnimationFrame(function(){ syncOverlay(overlay); });
    });
  }

  function install(root){
    if (!root || root.dataset.sfsPreviewMessageHardFix === '1') return;
    var overlay = document.querySelector('[data-sfs-overlay]');
    if (!overlay) return;
    var input = overlay.querySelector('[data-sfs-announcement]');
    var toggle = overlay.querySelector('[data-sfs-show-announcement]');
    if (!input || !toggle) return;

    root.dataset.sfsPreviewMessageHardFix = '1';

    input.addEventListener('input', function(){ schedule(overlay); });
    input.addEventListener('change', function(){ schedule(overlay); });
    toggle.addEventListener('change', function(){ schedule(overlay); });

    var open = root.querySelector('[data-sfs-open]');
    if (open) open.addEventListener('click', function(){ setTimeout(function(){ syncOverlay(overlay); }, 120); });

    var grid = overlay.querySelector('.sfs-preview-grid');
    if (grid) {
      new MutationObserver(function(mutations){
        var needsSync = mutations.some(function(mutation){
          return Array.from(mutation.addedNodes || []).some(function(node){
            return node.nodeType === 1 && (node.matches && (node.matches('[data-sfs-real-frame]') || node.querySelector('[data-sfs-real-frame]')));
          });
        });
        if (needsSync) setTimeout(function(){ syncOverlay(overlay); }, 80);
      }).observe(grid,{childList:true,subtree:true});
    }

    overlay.addEventListener('click', function(event){
      if (event.target.closest('[data-sfs-design]')) schedule(overlay);
    });

    setTimeout(function(){ syncOverlay(overlay); }, 160);
  }

  function boot(){
    document.querySelectorAll('[data-sfs-root]').forEach(install);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  document.addEventListener('shopify:section:load',boot);
})();
