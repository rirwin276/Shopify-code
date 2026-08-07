(function(){
  function install(root){
    if (!root || root.dataset.sfsMessagePreviewSync === '1') return;
    var overlay = document.querySelector('[data-sfs-overlay]');
    if (!overlay) return;
    var input = overlay.querySelector('[data-sfs-announcement]');
    var toggle = overlay.querySelector('[data-sfs-show-announcement]');
    if (!input || !toggle) return;

    root.dataset.sfsMessagePreviewSync = '1';

    function sync(){
      var text = String(input.value || '').trim();
      var visible = !!toggle.checked && !!text;
      overlay.querySelectorAll('[data-sfs-preview-announcement]').forEach(function(node){
        node.textContent = text;
        node.hidden = !visible;
      });
    }

    function syncAfterBuilder(){
      window.requestAnimationFrame(sync);
    }

    input.addEventListener('input', syncAfterBuilder);
    input.addEventListener('change', syncAfterBuilder);
    toggle.addEventListener('change', syncAfterBuilder);

    var open = root.querySelector('[data-sfs-open]');
    if (open) open.addEventListener('click', function(){ window.setTimeout(sync,40); });

    sync();
  }

  function boot(){
    document.querySelectorAll('[data-sfs-root]').forEach(install);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  document.addEventListener('shopify:section:load',boot);
})();
