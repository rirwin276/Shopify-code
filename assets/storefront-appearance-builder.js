(function(){
  function init(builder){
    var launch = builder.querySelector('[data-sfs-launch]');
    var overlay = builder.querySelector('[data-sfs-overlay]');
    if(!launch || !overlay || builder.dataset.sfsReady === '1') return;
    builder.dataset.sfsReady = '1';

    var defaults = {
      version: 1,
      enabled: false,
      style: 'clean',
      pattern: 'none',
      primary_color: '#1f2937',
      secondary_color: '#d4af37',
      welcome_message: '',
      announcement: '',
      show_announcement: false,
      catalog_enabled: false,
      featured_enabled: false
    };
    var parsed = {};
    try { parsed = JSON.parse(builder.querySelector('[data-sfs-current-settings]').textContent || '{}') || {}; } catch(_e){}
    var savedState = Object.assign({}, defaults, parsed);
    if(['none','diagonal','stripes'].indexOf(savedState.pattern) === -1) savedState.pattern = 'none';
    var state = Object.assign({}, savedState);
    var endpoint = '/apps/ss/relay/store/' + encodeURIComponent(builder.dataset.shopHandle || '') + '/appearance';
    var lastFocus = null;

    var primary = overlay.querySelector('[data-sfs-primary]');
    var secondary = overlay.querySelector('[data-sfs-secondary]');
    var announcement = overlay.querySelector('[data-sfs-announcement]');
    var showAnnouncement = overlay.querySelector('[data-sfs-show-announcement]');
    var status = overlay.querySelector('[data-sfs-status]');
    var saveBtn = overlay.querySelector('[data-sfs-save]');
    var resetBtn = overlay.querySelector('[data-sfs-reset]');
    var unsaved = overlay.querySelector('[data-sfs-unsaved]');

    function contrast(hex){
      var value = String(hex || '').replace('#','');
      var r = parseInt(value.slice(0,2),16), g = parseInt(value.slice(2,4),16), b = parseInt(value.slice(4,6),16);
      return ((.2126*r + .7152*g + .0722*b)/255) > .58 ? '#111111' : '#ffffff';
    }
    function setStatus(text, type){
      status.textContent = text || '';
      status.className = 'sfs-save-status ' + (type || '');
    }
    function pullInputs(){
      state.version = 1;
      state.enabled = true;
      state.style = 'clean';
      state.primary_color = primary.value;
      state.secondary_color = secondary.value;
      state.welcome_message = '';
      state.announcement = announcement.value.trim();
      state.show_announcement = showAnnouncement.checked && !!state.announcement;
      state.catalog_enabled = false;
      state.featured_enabled = false;
    }
    function render(){
      pullInputs();
      var primaryText = contrast(state.primary_color);
      overlay.querySelectorAll('[data-sfs-preview]').forEach(function(sample){
        sample.dataset.pattern = state.pattern || 'none';
        sample.style.setProperty('--sfs-primary', state.primary_color);
        sample.style.setProperty('--sfs-secondary', state.secondary_color);
        sample.style.setProperty('--sfs-primary-text', primaryText);
      });
      overlay.querySelectorAll('[data-sfs-preview-announcement]').forEach(function(el){
        el.textContent = state.announcement || 'New products are available now.';
        el.hidden = !(state.show_announcement && state.announcement);
      });
      overlay.querySelectorAll('[data-sfs-pattern]').forEach(function(btn){
        btn.classList.toggle('active', btn.dataset.sfsPattern === state.pattern);
      });
      overlay.querySelector('[data-sfs-primary-output]').textContent = state.primary_color;
      overlay.querySelector('[data-sfs-secondary-output]').textContent = state.secondary_color;
      overlay.querySelector('[data-sfs-announcement-count]').textContent = announcement.value.length + '/120';
      unsaved.textContent = 'Preview only';
    }
    function syncInputs(){
      primary.value = state.primary_color || defaults.primary_color;
      secondary.value = state.secondary_color || defaults.secondary_color;
      announcement.value = state.announcement || '';
      showAnnouncement.checked = !!state.show_announcement;
      if(['none','diagonal','stripes'].indexOf(state.pattern) === -1) state.pattern = 'none';
      render();
    }
    function updateSummary(){
      launch.querySelector('[data-sfs-current-primary]').style.background = savedState.primary_color || defaults.primary_color;
      launch.querySelector('[data-sfs-current-secondary]').style.background = savedState.secondary_color || defaults.secondary_color;
      var labels = {none:'Original background', diagonal:'Diagonal split', stripes:'Team stripe'};
      launch.querySelector('[data-sfs-current-label]').textContent = savedState.enabled ? (labels[savedState.pattern] || labels.none) : 'Default appearance';
    }
    function open(){
      lastFocus = document.activeElement;
      state = Object.assign({}, savedState);
      syncInputs();
      setStatus('', '');
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden','false');
      document.body.classList.add('sfs-modal-open');
      setTimeout(function(){ overlay.querySelector('[data-sfs-close]').focus(); }, 20);
    }
    function close(){
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden','true');
      document.body.classList.remove('sfs-modal-open');
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function busy(on){
      saveBtn.disabled = on;
      resetBtn.disabled = on;
      saveBtn.textContent = on ? 'Saving…' : 'Save storefront';
    }

    launch.querySelector('[data-sfs-open]').addEventListener('click', open);
    overlay.querySelectorAll('[data-sfs-close]').forEach(function(btn){ btn.addEventListener('click', close); });
    overlay.addEventListener('click', function(e){ if(e.target === overlay) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && overlay.classList.contains('open')) close(); });
    overlay.querySelectorAll('[data-sfs-pattern]').forEach(function(btn){
      btn.addEventListener('click', function(){ state.pattern = btn.dataset.sfsPattern; render(); });
    });
    [primary, secondary, announcement].forEach(function(el){ el.addEventListener('input', render); });
    showAnnouncement.addEventListener('change', render);

    saveBtn.addEventListener('click', async function(){
      pullInputs();
      busy(true);
      setStatus('Saving storefront settings…','');
      try {
        var response = await fetch(endpoint, {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(state), cache:'no-store'
        });
        var data = await response.json().catch(function(){ return {}; });
        if(!response.ok || data.ok === false) throw new Error(data.error || ('HTTP ' + response.status));
        savedState = Object.assign({}, defaults, data.settings || state);
        state = Object.assign({}, savedState);
        updateSummary();
        unsaved.textContent = 'Saved';
        setStatus('✓ Saved. The existing storefront now has the selected background and announcement.','ok');
        setTimeout(close, 1050);
      } catch(error) {
        setStatus('Could not save: ' + (error.message || 'Unknown error'),'err');
      } finally { busy(false); }
    });

    resetBtn.addEventListener('click', async function(){
      if(!confirm('Remove all storefront appearance changes and return to the original layout?')) return;
      busy(true);
      setStatus('Restoring the original storefront…','');
      try {
        var response = await fetch(endpoint, {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({reset:true}), cache:'no-store'
        });
        var data = await response.json().catch(function(){ return {}; });
        if(!response.ok || data.ok === false) throw new Error(data.error || ('HTTP ' + response.status));
        savedState = Object.assign({}, defaults, data.settings || {});
        state = Object.assign({}, savedState);
        syncInputs();
        updateSummary();
        setStatus('✓ Original storefront restored.','ok');
      } catch(error) {
        setStatus('Could not reset: ' + (error.message || 'Unknown error'),'err');
      } finally { busy(false); }
    });

    updateSummary();
  }

  function boot(){ document.querySelectorAll('[data-sfs-root]').forEach(init); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
