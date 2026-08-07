(function(){
  var colors = [
    '#000000','#1f2937','#4b5563','#9ca3af','#ffffff','#7f1d1d','#b91c1c','#ef4444',
    '#c2410c','#f97316','#ca8a04','#eab308','#facc15','#3f6212','#15803d','#22c55e',
    '#065f46','#0f766e','#0891b2','#0284c7','#1d4ed8','#2563eb','#312e81','#6d28d9',
    '#7e22ce','#a21caf','#be185d','#db2777','#6b4423','#a16207','#d6c2a3','#d4af37'
  ];

  function normalizeHex(value){
    var text = String(value || '').trim().replace(/^#/,'');
    if (/^[0-9a-fA-F]{3}$/.test(text)) text = text.split('').map(function(ch){ return ch + ch; }).join('');
    return /^[0-9a-fA-F]{6}$/.test(text) ? ('#' + text.toUpperCase()) : null;
  }

  function syncActive(field, value){
    field.querySelectorAll('[data-sfs-swatch]').forEach(function(button){
      button.classList.toggle('active', button.dataset.sfsSwatch.toUpperCase() === value.toUpperCase());
    });
  }

  function enhanceInput(input, role){
    if (!input || input.dataset.sfsColorEnhanced === '1') return;
    input.dataset.sfsColorEnhanced = '1';

    var label = input.closest('label');
    var oldEntry = input.parentElement;
    if (!label || !oldEntry) return;

    label.classList.add('sfs-color-field');
    label.dataset.sfsColorField = role;
    var heading = label.querySelector(':scope > span');
    if (heading) heading.classList.add('sfs-color-field__label');
    oldEntry.classList.add('sfs-color-entry');

    var hex = document.createElement('input');
    hex.type = 'text';
    hex.inputMode = 'text';
    hex.autocomplete = 'off';
    hex.spellcheck = false;
    hex.maxLength = 7;
    hex.className = 'sfs-hex-input';
    hex.setAttribute('aria-label', role === 'primary' ? 'Primary color HEX value' : 'Accent color HEX value');
    hex.value = String(input.value || '#000000').toUpperCase();
    oldEntry.appendChild(hex);

    var palette = document.createElement('div');
    palette.className = 'sfs-color-palette';
    palette.setAttribute('aria-label', role === 'primary' ? 'Primary color quick choices' : 'Accent color quick choices');
    colors.forEach(function(color){
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'sfs-color-swatch';
      button.dataset.sfsSwatch = color;
      button.style.setProperty('--sfs-swatch', color);
      button.setAttribute('aria-label', 'Use ' + color);
      palette.appendChild(button);
    });
    label.appendChild(palette);

    var help = document.createElement('small');
    help.className = 'sfs-color-help';
    help.textContent = 'Choose a quick team color, use the full picker, or enter an exact HEX code.';
    label.appendChild(help);

    function apply(value, dispatch){
      var normalized = normalizeHex(value);
      if (!normalized) return false;
      input.value = normalized.toLowerCase();
      hex.value = normalized;
      syncActive(label, normalized);
      if (dispatch) input.dispatchEvent(new Event('input', {bubbles:true}));
      return true;
    }

    input.addEventListener('input', function(){
      var normalized = normalizeHex(input.value) || '#000000';
      hex.value = normalized;
      syncActive(label, normalized);
    });

    hex.addEventListener('input', function(){
      var normalized = normalizeHex(hex.value);
      if (normalized) apply(normalized, true);
    });
    hex.addEventListener('blur', function(){
      if (!apply(hex.value, false)) hex.value = String(input.value || '#000000').toUpperCase();
    });
    hex.addEventListener('keydown', function(event){
      if (event.key === 'Enter') {
        event.preventDefault();
        if (apply(hex.value, true)) hex.blur();
      }
    });

    palette.addEventListener('click', function(event){
      var button = event.target.closest('[data-sfs-swatch]');
      if (!button) return;
      apply(button.dataset.sfsSwatch, true);
    });

    apply(input.value, false);
  }

  function updateAnnouncementLanguage(root){
    root.querySelectorAll('.sfs-control-heading').forEach(function(group){
      var strong = group.querySelector('strong');
      var small = group.querySelector('small');
      if (!strong || strong.textContent.trim() !== 'Announcement bar') return;
      strong.textContent = 'Store message';
      if (small) small.textContent = 'Optional message shown inside the top store card, keeping products higher on the page.';
    });
    root.querySelectorAll('.sfs-toggle').forEach(function(toggle){
      var strong = toggle.querySelector('strong');
      var small = toggle.querySelector('small');
      if (strong && strong.textContent.trim() === 'Show announcement') strong.textContent = 'Show store message';
      if (small && small.textContent.indexOf('above the category tabs') !== -1) small.textContent = 'Keeps the message together with the store name, logo, and actions.';
    });
  }

  function movePreviewMessages(root){
    root.querySelectorAll('[data-sfs-preview]').forEach(function(preview){
      var message = preview.querySelector('[data-sfs-preview-announcement]');
      var copy = preview.querySelector('.sfs-sample-hero-copy');
      if (message && copy && message.parentElement !== copy) copy.appendChild(message);
    });
  }

  function boot(){
    document.querySelectorAll('[data-sfs-root]').forEach(function(root){
      enhanceInput(root.querySelector('[data-sfs-primary]'), 'primary');
      enhanceInput(root.querySelector('[data-sfs-secondary]'), 'secondary');
      updateAnnouncementLanguage(root);
      movePreviewMessages(root);

      var open = root.querySelector('[data-sfs-open]');
      if (open && open.dataset.sfsColorSync !== '1') {
        open.dataset.sfsColorSync = '1';
        open.addEventListener('click', function(){
          setTimeout(function(){
            [root.querySelector('[data-sfs-primary]'), root.querySelector('[data-sfs-secondary]')].forEach(function(input){
              if (input) input.dispatchEvent(new Event('input', {bubbles:true}));
            });
            movePreviewMessages(root);
          }, 30);
        });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
