/* Stella & Sage signed-in homepage improvements.
 * Keeps the member experience action-first, brings Create Store above the fold,
 * and replaces the large second-store section with compact utility cards.
 */
(() => {
  'use strict';

  const onReady = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  onReady(() => {
    const marker = document.querySelector('[data-ss-member-home-control]');
    if (!marker) return;

    const home = document.querySelector('.ss-home');
    const hero = home?.querySelector('.ss-member-hero');
    const shell = hero?.querySelector('.ss-member-shell');
    const actionRow = shell?.querySelector('.ss-action-row');
    if (!home || !hero || !shell || !actionRow || shell.dataset.memberHomeReady === '1') return;

    shell.dataset.memberHomeReady = '1';
    home.classList.add('ss-member-enhanced');

    const requestUrl = marker.dataset.requestUrl || '/pages/storefront';
    const dashboardUrl = marker.dataset.dashboardUrl || '/pages/portal?stay=1';
    const ordersUrl = marker.dataset.ordersUrl || '/account';
    const supportUrl = marker.dataset.supportUrl || '/pages/support';

    const existingOpenStore = actionRow.querySelector('.ss-pill--primary');
    const existingLinks = Array.from(actionRow.querySelectorAll('a'));

    // Dashboard and Orders are moved into clearer utility cards below the main
    // actions. This keeps the top row focused on opening or creating a store.
    existingLinks.forEach((link) => {
      const href = String(link.getAttribute('href') || '');
      const text = String(link.textContent || '').trim().toLowerCase();
      const isDashboard = href.includes('/pages/portal') || text.includes('dashboard');
      const isOrders = href === '/account' || href.startsWith('/account?') || text.includes('orders');
      if (isDashboard || isOrders) link.remove();
    });

    const createButton = document.createElement('a');
    createButton.className = 'ss-pill ss-member-create';
    createButton.href = requestUrl;
    createButton.textContent = existingOpenStore ? 'Create a new store →' : 'Create your first store →';
    actionRow.prepend(createButton);

    if (!existingOpenStore) {
      const subtitle = shell.querySelector('.ss-member-sub');
      if (subtitle) {
        subtitle.textContent = 'You’re signed in. Create your first store, review your orders, or get help.';
      }
    }

    const utilityGrid = document.createElement('nav');
    utilityGrid.className = 'ss-member-utilities';
    utilityGrid.setAttribute('aria-label', 'Account shortcuts');
    utilityGrid.innerHTML = `
      <a class="ss-member-utility" href="${dashboardUrl}">
        <span class="ss-member-utility__icon" aria-hidden="true">⌂</span>
        <span><strong>${existingOpenStore ? 'Manage my store' : 'My dashboard'}</strong><small>${existingOpenStore ? 'Products, members, colors and sharing.' : 'Your stores and account access.'}</small></span>
        <em aria-hidden="true">→</em>
      </a>
      <a class="ss-member-utility" href="${ordersUrl}">
        <span class="ss-member-utility__icon" aria-hidden="true">▤</span>
        <span><strong>My orders</strong><small>Tracking, status and past purchases.</small></span>
        <em aria-hidden="true">→</em>
      </a>
      <a class="ss-member-utility" href="${supportUrl}">
        <span class="ss-member-utility__icon" aria-hidden="true">?</span>
        <span><strong>Need help?</strong><small>Order support, policies and store help.</small></span>
        <em aria-hidden="true">→</em>
      </a>
    `;
    actionRow.insertAdjacentElement('afterend', utilityGrid);

    // The old full-width “Create another store” section is now redundant and
    // pushed the same action below the fold on phones.
    const laterSections = Array.from(home.querySelectorAll('.ss-member-hero ~ .ss-section'));
    const duplicateCreateSection = laterSections.find((section) => {
      const link = section.querySelector(`a[href="${requestUrl}"]`);
      const text = String(section.textContent || '').toLowerCase();
      return Boolean(link && (text.includes('create another store') || text.includes('running another team')));
    });
    if (duplicateCreateSection) duplicateCreateSection.remove();

    marker.closest('.shopify-section')?.classList.add('ss-member-control-section');
  });
})();
