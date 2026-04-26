/**
 * STELLA & SAGE - Gelato Bridge (Auto-Open & Badges)
 * Handles the interaction between private store context and the Gelato Editor.
 */
(function () {
  window.SS = window.SS || {};

  SS.bridge = {
    /**
     * Priority C: Auto-Open the Editor
     * If a store handle exists, find the "Personalize" button and click it.
     */
    autoOpenEditor() {
      const storeHandle = sessionStorage.getItem('ss_store_handle');
      
      // Safety: Do not run on public store pages (where handle is null)
      if (!storeHandle) {
        return;
      }

      const tryClick = () => {
        // Find ALL buttons to ensure we don't miss it due to a class change
        // We also target .product-form__buttons to catch standard Shopify themes
        const allButtons = document.querySelectorAll('button, .gelato-button, .product-form__buttons button');
        let found = false;

        allButtons.forEach(btn => {
          // Check if the button text contains "Personalize" (case insensitive)
          if (btn.textContent && btn.textContent.toLowerCase().includes('personalize')) {
            btn.click();
            
            // Mark this variant as started (for the badges)
            const params = new URLSearchParams(window.location.search);
            const variantId = params.get('variant');
            if (variantId) {
               sessionStorage.setItem(`personalized_${variantId}`, 'true');
            }
            
            found = true;
          }
        });
        return found;
      };

      // 1. Try immediately
      if (tryClick()) return;

      // 2. Observe DOM for late injection (Gelato loads via iframe)
      const observer = new MutationObserver((mutations, obs) => {
        if (tryClick()) {
          obs.disconnect(); // Stop watching once success
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // 3. Failsafe: Stop looking after 12 seconds
      setTimeout(() => observer.disconnect(), 12000);
    },

    /**
     * Priority B: Update Collection Grid Badges
     * Checks if a variant has been personalized and shows the badge.
     */
    hydrateGrid() {
      const badges = document.querySelectorAll('.ss-badge-container');
      badges.forEach(container => {
        const vId = container.dataset.variantId;
        if (vId && sessionStorage.getItem(`personalized_${vId}`) === 'true') {
          const span = container.querySelector('.ss-badge-content');
          if (span) span.classList.add('ss-badge-active');
        }
      });
    }
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
      SS.bridge.autoOpenEditor();
      SS.bridge.hydrateGrid();
    });
  } else {
    SS.bridge.autoOpenEditor();
    SS.bridge.hydrateGrid();
  }
})();