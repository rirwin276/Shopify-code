/* Stella & Sage signed-out homepage catalog placement and expansion. */
(() => {
  'use strict';

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  ready(() => {
    const marker = document.querySelector('[data-ss-home-catalog-control]');
    if (!marker) return;

    const signedIn = marker.dataset.signedIn === 'true';
    let attempts = 0;

    const findCatalog = () => {
      const catalog = document.querySelector('.ss-public-catalog');
      if (!catalog) {
        attempts += 1;
        if (attempts < 80) window.setTimeout(findCatalog, 100);
        return;
      }

      const originalShell = catalog.closest('.shopify-section');

      if (signedIn) {
        if (originalShell) originalShell.remove();
        else catalog.remove();
        marker.closest('.shopify-section')?.remove();
        return;
      }

      catalog.classList.add('ss-home-catalog');

      const proofBar = document.querySelector('.ss-home .ss-proof-bar');
      if (proofBar) {
        proofBar.insertAdjacentElement('afterend', catalog);
        if (originalShell && !originalShell.children.length) originalShell.remove();
      }

      const style = document.createElement('style');
      style.textContent = `
        .ss-home-catalog{
          border-top:1px solid rgba(17,16,14,.07);
          border-bottom:1px solid rgba(17,16,14,.07);
          background:linear-gradient(180deg,#fff 0%,#fbfaf7 100%)!important;
        }
        .ss-home-catalog .ss-public-catalog__wrap{padding:64px 22px 70px!important}
        .ss-home-catalog:not(.is-expanded) .ss-public-catalog__card:nth-child(n+5){display:none!important}
        .ss-home-catalog__toggle-row{display:flex;justify-content:center;margin-top:26px}
        .ss-home-catalog__toggle{
          min-height:48px;padding:0 22px;border:1px solid #11100e;border-radius:999px;
          background:#11100e;color:#fff;font:inherit;font-size:13px;font-weight:900;
          cursor:pointer;box-shadow:0 10px 28px rgba(17,16,14,.14);transition:.2s ease;
        }
        .ss-home-catalog__toggle:hover{transform:translateY(-2px);box-shadow:0 16px 36px rgba(17,16,14,.2)}
        .ss-home-catalog__toggle[hidden]{display:none!important}
        @media(max-width:760px){
          .ss-home-catalog .ss-public-catalog__wrap{padding:52px 16px 58px!important}
          .ss-home-catalog:not(.is-expanded) .ss-public-catalog__card:nth-child(n+5){display:none!important}
        }
      `;
      document.head.appendChild(style);

      const grid = catalog.querySelector('[data-ss-grid]');
      if (!grid) return;

      const toggleRow = document.createElement('div');
      toggleRow.className = 'ss-home-catalog__toggle-row';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'ss-home-catalog__toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggleRow.appendChild(toggle);
      grid.insertAdjacentElement('afterend', toggleRow);

      const syncToggle = () => {
        const count = grid.querySelectorAll('.ss-public-catalog__card').length;
        const expanded = catalog.classList.contains('is-expanded');
        toggle.hidden = count <= 4;
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        toggle.textContent = expanded ? 'Show fewer products' : `View all ${count} products`;
      };

      toggle.addEventListener('click', () => {
        const expanding = !catalog.classList.contains('is-expanded');
        catalog.classList.toggle('is-expanded', expanding);
        syncToggle();
        if (!expanding) {
          catalog.querySelector('.ss-public-catalog__head')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });

      new MutationObserver(syncToggle).observe(grid, { childList: true });
      catalog.querySelectorAll('[data-ss-filter]').forEach((button) => {
        button.addEventListener('click', () => window.setTimeout(syncToggle, 0));
      });
      syncToggle();

      marker.closest('.shopify-section')?.remove();
    };

    findCatalog();
  });
})();
