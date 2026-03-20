/**
 * STELLA & SAGE - VISUAL TUNER (Print Calibration Edition)
 * 1. Simulates the Gelato Print Area (Red Box).
 * 2. Calculus exact position relative to that print area.
 */
(function() {
  window.SS = window.SS || {};
  
  SS.tuner = {
    init() {
      // Security Check
      const isAdmin = document.body.innerText.includes('Admin powers') || window.location.href.includes('admin-powers');
      if (!isAdmin) return;

      this.createPanel();
      this.bindEvents();
    },

    createPanel() {
      const div = document.createElement('div');
      div.classList.add('ss-tuner-panel');
      div.innerHTML = `
        <div class="ss-tuner-header">
          <span>🖨️ Production Tuner</span>
          <span style="cursor:pointer" onclick="this.parentElement.parentElement.remove()">✕</span>
        </div>
        
        <div class="ss-tuner-row" style="justify-content:center; margin-bottom:15px;">
           <button class="ss-tuner-btn" id="toggle-print-area" style="width:100%; font-size:12px;">Toggle Print Safe Zone 🟥</button>
        </div>

        <div class="ss-tuner-row">
          <span>Top (%)</span>
          <button class="ss-tuner-btn" data-action="top-minus">-</button>
          <span class="ss-tuner-val" id="val-top">30</span>
          <button class="ss-tuner-btn" data-action="top-plus">+</button>
        </div>

        <div class="ss-tuner-row">
          <span>Width (%)</span>
          <button class="ss-tuner-btn" data-action="width-minus">-</button>
          <span class="ss-tuner-val" id="val-width">30</span>
          <button class="ss-tuner-btn" data-action="width-plus">+</button>
        </div>

        <div class="ss-tuner-save-area">
          <p style="font-size:11px; color:#666; margin-bottom:5px;"><strong>Production Coordinates:</strong></p>
          <input type="text" class="ss-tuner-code" id="ss-config-code" readonly value="top:30%|width:30%">
          <button class="ss-copy-btn" id="ss-copy-btn">Copy Production Code</button>
        </div>
      `;
      document.body.appendChild(div);
      setTimeout(() => div.classList.add('is-active'), 1000);
    },

    bindEvents() {
      let top = 30;
      let width = 30;
      let showZone = false;

      const update = () => {
        const logos = document.querySelectorAll('.ss-logo-overlay');
        logos.forEach(img => {
          img.style.cssText = `top: ${top}% !important; width: ${width}% !important; position: absolute !important; left: 50% !important; transform: translate(-50%, -50%) !important;`;
        });
        
        document.getElementById('val-top').innerText = top + '%';
        document.getElementById('val-width').innerText = width + '%';
        
        // We save the code exactly as needed for the frontend
        const code = `top:${top}%|width:${width}%`;
        document.getElementById('ss-config-code').value = code;
      };

      // Toggle the Red "Print Safe Zone" box
      document.getElementById('toggle-print-area').addEventListener('click', () => {
        showZone = !showZone;
        const mediaContainers = document.querySelectorAll('.product-card .media, .product__media-item .media');
        
        mediaContainers.forEach(container => {
          if (showZone) {
            // Create the Mock Print Area
            // Standard Gelato Print Area is roughly centered and covers ~60% of width and ~70% of height of a standard mockup
            let zone = document.createElement('div');
            zone.classList.add('ss-print-zone');
            zone.style.cssText = `
              position: absolute; 
              top: 15%; left: 20%; width: 60%; height: 70%; 
              border: 2px dashed red; 
              background: rgba(255,0,0,0.1); 
              pointer-events: none; z-index: 5;
            `;
            container.appendChild(zone);
          } else {
            const zone = container.querySelector('.ss-print-zone');
            if(zone) zone.remove();
          }
        });
      });

      document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('ss-tuner-btn')) return;
        const action = e.target.getAttribute('data-action');
        
        if (action === 'top-plus') top++;
        if (action === 'top-minus') top--;
        if (action === 'width-plus') width++;
        if (action === 'width-minus') width--;
        
        update();
      });

      document.getElementById('ss-copy-btn').addEventListener('click', () => {
        const code = document.getElementById('ss-config-code');
        code.select();
        document.execCommand('copy');
        document.getElementById('ss-copy-btn').innerText = "Copied!";
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SS.tuner.init());
  } else {
    SS.tuner.init();
  }
})();