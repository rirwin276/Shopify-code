(function(){
  function init(builder){
    var root = builder.querySelector('[data-sfs-launch]');
    var overlay = builder.querySelector('[data-sfs-overlay]');
    if (!root || !overlay || builder.dataset.sfsReady === '1') return;
    builder.dataset.sfsReady = '1';

    var defaults = {
      version: 1, enabled: false, style: 'clean', pattern: 'none',
      primary_color: '#1f2937', secondary_color: '#d4af37',
      welcome_message: '', announcement: '', show_announcement: false,
      catalog_enabled: true, featured_enabled: true
    };
    var parsed = {};
    try { parsed = JSON.parse(builder.querySelector('[data-sfs-current-settings]').textContent || '{}') || {}; } catch(_e){}
    var savedState = Object.assign({}, defaults, parsed);
    var state = Object.assign({}, savedState);
    var endpoint = '/apps/ss/relay/store/' + encodeURIComponent(builder.dataset.shopHandle || '') + '/appearance';
    var lastFocus = null;

    var primary = overlay.querySelector('[data-sfs-primary]');
    var secondary = overlay.querySelector('[data-sfs-secondary]');
    var message = overlay.querySelector('[data-sfs-message]');
    var announcement = overlay.querySelector('[data-sfs-announcement]');
    var showAnnouncement = overlay.querySelector('[data-sfs-show-announcement]');
    var catalog = overlay.querySelector('[data-sfs-catalog]');
    var featured = overlay.querySelector('[data-sfs-featured]');
    var status = overlay.querySelector('[data-sfs-status]');
    var saveBtn = overlay.querySelector('[data-sfs-save]');
    var resetBtn = overlay.querySelector('[data-sfs-reset]');
    var unsaved = overlay.querySelector('[data-sfs-unsaved]');

    function contrast(hex){
      var value = String(hex || '').replace('#','');
      var r = parseInt(value.slice(0,2),16), g = parseInt(value.slice(2,4),16), b = parseInt(value.slice(4,6),16);
      return ((.2126*r + .7152*g + .0722*b)/255) > .58 ? '#111111' : '#ffffff';
    }
    function setStatus(text, type){ status.textContent = text || ''; status.className = 'sfs-save-status ' + (type || ''); }
    function syncInputs(){
      state.enabled = true;
      primary.value = state.primary_color || defaults.primary_color;
      secondary.value = state.secondary_color || defaults.secondary_color;
      message.value = state.welcome_message || '';
      announcement.value = state.announcement || '';
      showAnnouncement.checked = !!state.show_announcement;
      catalog.checked = state.catalog_enabled !== false;
      featured.checked = state.featured_enabled !== false;
      overlay.querySelectorAll('[data-sfs-style]').forEach(function(btn){ btn.classList.toggle('active', btn.dataset.sfsStyle === state.style); });
      overlay.querySelectorAll('[data-sfs-pattern]').forEach(function(btn){ btn.classList.toggle('active', btn.dataset.sfsPattern === state.pattern); });
      render();
    }
    function pullInputs(){
      state.primary_color = primary.value;
      state.secondary_color = secondary.value;
      state.welcome_message = message.value.trim();
      state.announcement = announcement.value.trim();
      state.show_announcement = showAnnouncement.checked && !!state.announcement;
      state.catalog_enabled = catalog.checked;
      state.featured_enabled = featured.checked;
      state.enabled = true;
    }
    function render(){
      pullInputs();
      var pText = contrast(state.primary_color), sText = contrast(state.secondary_color);
      overlay.querySelectorAll('[data-sfs-preview]').forEach(function(sample){
        sample.dataset.style = state.style || 'clean';
        sample.dataset.pattern = state.pattern || 'none';
        sample.style.setProperty('--sfs-primary', state.primary_color);
        sample.style.setProperty('--sfs-secondary', state.secondary_color);
        sample.style.setProperty('--sfs-primary-text', pText);
        sample.style.setProperty('--sfs-secondary-text', sText);
      });
      overlay.querySelectorAll('[data-sfs-preview-message]').forEach(function(el){
        el.textContent = state.welcome_message || (el.closest('.sfs-sample--mobile') ? 'Approved gear for your group.' : 'Approved gear for your group. Choose your size and checkout directly.');
      });
      overlay.querySelectorAll('[data-sfs-preview-announcement]').forEach(function(el){
        el.textContent = state.announcement || 'New products are available now.';
        el.hidden = !(state.show_announcement && state.announcement);
      });
      overlay.querySelectorAll('[data-sfs-preview-tabs]').forEach(function(el){ el.style.display = state.catalog_enabled ? 'flex' : 'none'; });
      overlay.querySelectorAll('.sfs-sample-products').forEach(function(el){ el.style.opacity = state.featured_enabled ? '1' : '.42'; });
      overlay.querySelector('[data-sfs-primary-output]').textContent = state.primary_color;
      overlay.querySelector('[data-sfs-secondary-output]').textContent = state.secondary_color;
      overlay.querySelector('[data-sfs-message-count]').textContent = message.value.length + '/180';
      overlay.querySelector('[data-sfs-announcement-count]').textContent = announcement.value.length + '/120';
      unsaved.textContent = 'Preview only';
    }
    function updateSummary(){
      root.querySelector('[data-sfs-current-primary]').style.background = savedState.primary_color || defaults.primary_color;
      root.querySelector('[data-sfs-current-secondary]').style.background = savedState.secondary_color || defaults.secondary_color;
      root.querySelector('[data-sfs-current-label]').textContent = savedState.enabled ? ((savedState.style || 'clean').replace(/^./, function(c){ return c.toUpperCase(); }) + ' · ' + (savedState.pattern || 'none')) : 'Default appearance';
    }
    function open(){
      lastFocus = document.activeElement;
      state = Object.assign({}, savedState);
      if (!state.enabled) state.enabled = true;
      syncInputs(); setStatus('', '');
      overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.classList.add('sfs-modal-open');
      setTimeout(function(){ overlay.querySelector('[data-sfs-close]').focus(); }, 20);
    }
    function close(){
      overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.body.classList.remove('sfs-modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function busy(on){ saveBtn.disabled = on; resetBtn.disabled = on; saveBtn.textContent = on ? 'Saving…' : 'Save storefront'; }

    root.querySelector('[data-sfs-open]').addEventListener('click', open);
    overlay.querySelectorAll('[data-sfs-close]').forEach(function(btn){ btn.addEventListener('click', close); });
    overlay.addEventListener('click', function(e){ if(e.target === overlay) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && overlay.classList.contains('open')) close(); });
    overlay.querySelectorAll('[data-sfs-style]').forEach(function(btn){ btn.addEventListener('click', function(){ state.style = btn.dataset.sfsStyle; syncInputs(); }); });
    overlay.querySelectorAll('[data-sfs-pattern]').forEach(function(btn){ btn.addEventListener('click', function(){ state.pattern = btn.dataset.sfsPattern; syncInputs(); }); });
    [primary,secondary,message,announcement,showAnnouncement,catalog,featured].forEach(function(el){ el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', render); });

    saveBtn.addEventListener('click', async function(){
      pullInputs(); busy(true); setStatus('Saving storefront settings…','');
      try {
        var response = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(state), cache:'no-store' });
        var data = await response.json().catch(function(){ return {}; });
        if(!response.ok || data.ok === false) throw new Error(data.error || ('HTTP ' + response.status));
        savedState = Object.assign({}, defaults, data.settings || state);
        state = Object.assign({}, savedState); updateSummary();
        unsaved.textContent = 'Saved'; setStatus('✓ Saved. Open the storefront to see the live version.','ok');
        setTimeout(close, 950);
      } catch(error) {
        setStatus('Could not save: ' + (error.message || 'Unknown error'),'err');
      } finally { busy(false); }
    });

    resetBtn.addEventListener('click', async function(){
      if(!confirm('Restore the original Stella & Sage storefront appearance?')) return;
      busy(true); setStatus('Restoring default appearance…','');
      try {
        var response = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({reset:true}), cache:'no-store' });
        var data = await response.json().catch(function(){ return {}; });
        if(!response.ok || data.ok === false) throw new Error(data.error || ('HTTP ' + response.status));
        savedState = Object.assign({}, defaults, data.settings || {}); state = Object.assign({}, savedState);
        syncInputs(); updateSummary(); setStatus('✓ Default appearance restored.','ok');
      } catch(error) { setStatus('Could not reset: ' + (error.message || 'Unknown error'),'err'); }
      finally { busy(false); }
    });

    updateSummary();
  }
  function boot(){ document.querySelectorAll('[data-sfs-root]').forEach(init); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
