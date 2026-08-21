(function(){
  function init(builder){
    if (!builder || builder.dataset.sfsReady === '1') return;

    var settingsPanel = document.getElementById('apPanelSettings');
    if (!settingsPanel) {
      setTimeout(function(){ init(builder); }, 120);
      return;
    }

    settingsPanel.insertBefore(builder, settingsPanel.firstChild);
    builder.classList.add('is-mounted');
    builder.dataset.sfsReady = '1';

    var launch = builder.querySelector('[data-sfs-launch]');
    var overlay = builder.querySelector('[data-sfs-overlay]');
    if (!launch || !overlay) return;

    var defaults = {
      version: 2,
      enabled: false,
      layout: 'original',
      style: 'clean',
      pattern: 'none',
      primary_color: '#1f2937',
      secondary_color: '#d4af37',
      welcome_message: '',
      announcement: '',
      show_announcement: false,
      catalog_enabled: true,
      featured_enabled: true
    };

    var designs = {
      classic: {layout:'classic', style:'clean', pattern:'none', label:'Classic Team'},
      split: {layout:'split', style:'clean', pattern:'diagonal', label:'Diagonal Split'},
      gradient: {layout:'gradient', style:'bold', pattern:'none', label:'Gradient Glow'},
      splash: {layout:'spray', style:'bold', pattern:'dots', label:'Spray Burst'},
      pro: {layout:'pro', style:'dark', pattern:'grid', label:'Pro Dark'},
      heritage: {layout:'heritage', style:'clean', pattern:'stripes', label:'Heritage'}
    };

    function normalizeLegacyDesign(settings){
      if (!settings) return settings;
      if (settings.style === 'dark' && settings.pattern === 'dots') {
        settings.style = 'dark';
        settings.pattern = 'grid';
      }
      if (!settings.layout || settings.layout === 'original') {
        var style = settings.style || 'clean';
        var pattern = settings.pattern || 'none';
        if (settings.enabled) {
          if (style === 'clean' && pattern === 'diagonal') settings.layout = 'split';
          else if (style === 'bold' && pattern === 'none') settings.layout = 'gradient';
          else if (style === 'bold' && pattern === 'dots') settings.layout = 'spray';
          else if (style === 'dark' && pattern === 'grid') settings.layout = 'pro';
          else if (style === 'clean' && pattern === 'stripes') settings.layout = 'heritage';
          else settings.layout = 'classic';
        } else {
          settings.layout = 'original';
        }
      }
      return settings;
    }

    function designFromState(settings){
      normalizeLegacyDesign(settings);
      var layout = settings.layout || 'original';
      var found = 'classic';
      Object.keys(designs).some(function(key){
        if (designs[key].layout === layout) {
          found = key;
          return true;
        }
        return false;
      });
      return found;
    }

    var parsed = {};
    try {
      parsed = JSON.parse(builder.querySelector('[data-sfs-current-settings]').textContent || '{}') || {};
    } catch (_error) {}
    normalizeLegacyDesign(parsed);

    var savedState = Object.assign({}, defaults, parsed);
    var state = Object.assign({}, savedState);
    var selectedDesign = designFromState(savedState);
    var dirty = false;
    var endpoint = '/apps/ss/relay/store/' + encodeURIComponent(builder.dataset.shopHandle || '') + '/appearance';
    var isProspectDemo = builder.dataset.prospectDemo === 'true';
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
      var r = parseInt(value.slice(0,2),16);
      var g = parseInt(value.slice(2,4),16);
      var b = parseInt(value.slice(4,6),16);
      return ((.2126 * r + .7152 * g + .0722 * b) / 255) > .58 ? '#111111' : '#ffffff';
    }

    function setStatus(text, type){
      status.textContent = text || '';
      status.className = 'sfs-save-status ' + (type || '');
    }

    function applySelectedDesign(){
      var design = designs[selectedDesign] || designs.classic;
      state.layout = design.layout;
      state.style = design.style;
      state.pattern = design.pattern;
    }

    function pullInputs(){
      applySelectedDesign();
      state.version = 2;
      state.primary_color = primary.value;
      state.secondary_color = secondary.value;
      state.announcement = announcement.value.trim();
      state.show_announcement = showAnnouncement.checked && !!state.announcement;
      state.catalog_enabled = true;
      state.featured_enabled = true;
    }

    function syncInputs(){
      normalizeLegacyDesign(state);
      selectedDesign = designFromState(state);
      primary.value = state.primary_color || defaults.primary_color;
      secondary.value = state.secondary_color || defaults.secondary_color;
      announcement.value = state.announcement || '';
      showAnnouncement.checked = !!state.show_announcement;
      overlay.querySelectorAll('[data-sfs-design]').forEach(function(button){
        button.classList.toggle('active', button.dataset.sfsDesign === selectedDesign);
      });
      render();
    }

    function render(){
      pullInputs();
      var active = !!state.enabled || dirty;
      var primaryText = contrast(state.primary_color);
      var secondaryText = contrast(state.secondary_color);

      overlay.querySelectorAll('[data-sfs-preview]').forEach(function(sample){
        sample.classList.toggle('is-custom', active);
        sample.dataset.layout = active ? state.layout : 'original';
        sample.dataset.style = active ? state.style : 'clean';
        sample.dataset.pattern = active ? state.pattern : 'none';
        sample.style.setProperty('--sfs-primary', state.primary_color);
        sample.style.setProperty('--sfs-secondary', state.secondary_color);
        sample.style.setProperty('--sfs-primary-text', primaryText);
        sample.style.setProperty('--sfs-secondary-text', secondaryText);
      });

      overlay.querySelectorAll('[data-sfs-preview-announcement]').forEach(function(element){
        element.textContent = state.announcement || 'New products are available now.';
        element.hidden = !(active && state.show_announcement && state.announcement);
      });

      overlay.querySelector('[data-sfs-primary-output]').textContent = state.primary_color;
      overlay.querySelector('[data-sfs-secondary-output]').textContent = state.secondary_color;
      overlay.querySelector('[data-sfs-announcement-count]').textContent = announcement.value.length + '/120';
      unsaved.textContent = dirty ? 'Unsaved changes' : (state.enabled ? 'Current design' : 'Original design');
    }

    function markChanged(){
      dirty = true;
      state.enabled = true;
      render();
    }

    function updateSummary(){
      launch.querySelector('[data-sfs-current-primary]').style.background = savedState.primary_color || defaults.primary_color;
      launch.querySelector('[data-sfs-current-secondary]').style.background = savedState.secondary_color || defaults.secondary_color;
      var designKey = designFromState(savedState);
      launch.querySelector('[data-sfs-current-label]').textContent = savedState.enabled
        ? designs[designKey].label
        : 'Original design';
    }

    function open(){
      if (isProspectDemo && window.SSProspectDemo && window.SSProspectDemo.record) {
        window.SSProspectDemo.record('store_customizer_opened');
      }
      lastFocus = document.activeElement;
      state = Object.assign({}, savedState);
      normalizeLegacyDesign(state);
      selectedDesign = designFromState(state);
      dirty = false;
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
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function busy(on){
      saveBtn.disabled = on;
      resetBtn.disabled = on;
      saveBtn.textContent = on ? 'Saving…' : 'Save storefront';
    }

    launch.querySelector('[data-sfs-open]').addEventListener('click', open);
    overlay.querySelectorAll('[data-sfs-close]').forEach(function(button){ button.addEventListener('click', close); });
    overlay.addEventListener('click', function(event){ if (event.target === overlay) close(); });
    document.addEventListener('keydown', function(event){
      if (event.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    overlay.querySelectorAll('[data-sfs-design]').forEach(function(button){
      button.addEventListener('click', function(){
        selectedDesign = button.dataset.sfsDesign || 'classic';
        overlay.querySelectorAll('[data-sfs-design]').forEach(function(item){
          item.classList.toggle('active', item === button);
        });
        markChanged();
      });
    });

    [primary, secondary, announcement].forEach(function(element){
      element.addEventListener('input', markChanged);
    });
    showAnnouncement.addEventListener('change', markChanged);

    saveBtn.addEventListener('click', async function(){
      pullInputs();

      if (!dirty && !savedState.enabled) {
        window.alert('No appearance changes were made. This store is still using the original storefront design.');
        close();
        return;
      }

      state.enabled = true;
      busy(true);
      setStatus('Saving storefront template…','');

      try {
        var savePayload = Object.assign({}, state);
        if (isProspectDemo) {
          var demo = window.SSProspectDemo || {};
          if (!demo.token) throw new Error('The secure demo session is still loading. Try again in a moment.');
          savePayload._prospect_demo_token = demo.token;
        }
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(savePayload),
          cache: 'no-store'
        });
        var data = await response.json().catch(function(){ return {}; });
        if (!response.ok || data.ok === false) throw new Error(data.error || ('HTTP ' + response.status));

        savedState = Object.assign({}, defaults, data.settings || state);
        normalizeLegacyDesign(savedState);
        state = Object.assign({}, savedState);
        selectedDesign = designFromState(savedState);
        dirty = false;
        updateSummary();
        render();
        setStatus('✓ Saved.','ok');
        window.alert('Storefront template saved. The live store now uses the selected Shopify template.');
        close();
      } catch (error) {
        setStatus('Could not save: ' + (error.message || 'Unknown error'),'err');
      } finally {
        busy(false);
      }
    });

    resetBtn.addEventListener('click', async function(){
      if (!window.confirm('Restore the original Stella & Sage storefront design?')) return;

      busy(true);
      setStatus('Restoring original storefront template…','');

      try {
        var resetPayload = {reset:true};
        if (isProspectDemo) {
          var demo = window.SSProspectDemo || {};
          if (!demo.token) throw new Error('The secure demo session is still loading. Try again in a moment.');
          resetPayload._prospect_demo_token = demo.token;
        }
        var response = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(resetPayload),
          cache: 'no-store'
        });
        var data = await response.json().catch(function(){ return {}; });
        if (!response.ok || data.ok === false) throw new Error(data.error || ('HTTP ' + response.status));

        savedState = Object.assign({}, defaults, data.settings || {});
        state = Object.assign({}, savedState);
        selectedDesign = designFromState(savedState);
        dirty = false;
        syncInputs();
        updateSummary();
        setStatus('✓ Original design restored.','ok');
        window.alert('The original storefront template was restored.');
        close();
      } catch (error) {
        setStatus('Could not restore: ' + (error.message || 'Unknown error'),'err');
      } finally {
        busy(false);
      }
    });

    updateSummary();
  }

  function boot(){
    document.querySelectorAll('[data-sfs-root]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
  document.addEventListener('shopify:section:load', boot);
})();
