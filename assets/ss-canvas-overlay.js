/**
 * STELLA & SAGE - VISUAL OVERLAY & DATA INJECTOR
 * 1. Visual: Stamps the logo on cards/product pages using "Lock Codes" if available.
 * 2. Data: Injects BOTH the Logo URL and the Print Coordinates into the Cart Form.
 */
(function() {
  window.SS = window.SS || {};
  
  SS.overlay = {
    init() {
      const config = window.SS.config || {};
      if (!config.logoUrl) return;
      this.logoUrl = config.logoUrl;
      
      // Run immediately
      this.run();

      // Run again if user swaps variants (e.g. Blue -> Red shirt)
      document.addEventListener('change', (e) => {
        if(e.target.closest('variant-selects') || e.target.closest('variant-radios')) {
          setTimeout(() => this.run(), 500); 
        }
      });
    },

    run() {
      // A. COLLECTION PAGE
      const cards = document.querySelectorAll('.product-card');
      cards.forEach(card => {
        // Only touch Gelato items
        const tags = card.getAttribute('data-tags') || '';
        // Note: Our "Nuclear" liquid fix might catch capitalize issues, 
        // but JS checking includes('base-gelato') is case-sensitive. 
        // Let's make it robust:
        if (!tags.toLowerCase().includes('base-gelato')) return; 

        // Get the coordinates you saved
        const lockCode = card.getAttribute('data-logo-lock') || '';
        
        // Find the image container
        let imgWrapper = card.querySelector('.media') || card.querySelector('.product-card__link');
        
        if (imgWrapper && !card.querySelector('.ss-logo-overlay')) {
          this.stampLogo(imgWrapper, lockCode);
        }
      });

      // B. PRODUCT PAGE (The Big Image)
      // We look for the main product card or gallery wrapper
      const mainProduct = document.querySelector('.product-section') || document.body;
      const lockCode = mainProduct.querySelector('[data-logo-lock]')?.getAttribute('data-logo-lock') || '';
      
      // Inject Data into Add-to-Cart Form
      this.injectCartData(lockCode);

      // Stamp the Main Image(s)
      const galleryItems = document.querySelectorAll('.product__media-item .media, .product-single__media');
      galleryItems.forEach(wrapper => {
         if(!wrapper.querySelector('.ss-logo-overlay')) {
             this.stampLogo(wrapper, lockCode, true);
         }
      });
    },

    injectCartData(lockCode) {
      // Find all "Add to Cart" forms
      const forms = document.querySelectorAll('form[action*="/cart/add"]');
      forms.forEach(form => {
        
        // 1. Inject Logo URL (if missing)
        if (!form.querySelector('input[name="properties[_Custom Logo]"]')) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'properties[_Custom Logo]'; // Underscore hides it from customer at checkout (optional)
          input.value = this.logoUrl;
          form.appendChild(input);
        }

        // 2. Inject Coordinates (The Lock Code)
        // This tells the printer exactly where to print!
        if (lockCode && !form.querySelector('input[name="properties[_Print Spec]"]')) {
           const input = document.createElement('input');
           input.type = 'hidden';
           input.name = 'properties[_Print Spec]'; 
           input.value = lockCode;
           form.appendChild(input);
        }
      });
    },

    stampLogo(container, lockCode, isBig = false) {
      container.style.position = 'relative';
      container.style.overflow = 'hidden';

      const logoImg = document.createElement('img');
      logoImg.src = this.logoUrl;
      logoImg.classList.add('ss-logo-overlay');
      if(isBig) logoImg.classList.add('ss-pdp-overlay');
      
      // APPLY COORDINATES
      if (lockCode) {
        // "top:20%|width:15%" -> "top:20%; width:15%;"
        const styles = lockCode.split('|').join(';'); 
        // Force the styles
        logoImg.style.cssText = `${styles}; position: absolute !important; left: 50% !important; transform: translate(-50%, -50%) !important; z-index: 10; pointer-events: none;`;
      } else {
        // Fallback for uncalibrated items (just in case)
        logoImg.style.cssText = `top: 30%; width: 25%; position: absolute; left: 50%; transform: translateX(-50%); z-index: 10; pointer-events: none;`;
      }
      
      container.appendChild(logoImg);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SS.overlay.init());
  } else {
    SS.overlay.init();
  }
})();