/* Stella & Sage signed-in homepage.
 * Keeps the member view compact and action-first without duplicating the
 * dashboard or listing every store on the homepage.
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

    const hasStore = marker.dataset.hasStore === 'true';
    const requestUrl = marker.dataset.requestUrl || '/pages/storefront';
    const dashboardUrl = marker.dataset.dashboardUrl || '/pages/portal?stay=1';
    const ordersUrl = marker.dataset.ordersUrl || '/account';
    const supportUrl = marker.dataset.supportUrl || '/pages/support';

    const subtitle = shell.querySelector('.ss-member-sub');
    if (subtitle) {
      subtitle.textContent = hasStore
        ? 'Open your dashboard, check an order, or create another store.'
        : 'Your account is ready. Review orders or create a store for your own team, business, unit, or group.';
    }

    const actions = hasStore
      ? [
          { href: dashboardUrl, label: 'My dashboard', primary: true },
          { href: requestUrl, label: 'Create a new store' },
          { href: ordersUrl, label: 'My orders' }
        ]
      : [
          { href: requestUrl, label: 'Create your first store', primary: true },
          { href: ordersUrl, label: 'My orders' },
          { href: supportUrl, label: 'Need help?' }
        ];

    actionRow.replaceChildren(...actions.map((action) => {
      const link = document.createElement('a');
      link.className = `ss-pill ss-member-action${action.primary ? ' ss-member-action--primary' : ''}`;
      link.href = action.href;
      link.textContent = action.label;
      return link;
    }));

    shell.classList.toggle('ss-member-shell--has-store', hasStore);
    shell.classList.toggle('ss-member-shell--no-store', !hasStore);

    // The original large second-store section repeats the action now shown in
    // the first screen and creates unnecessary scrolling on phones.
    const laterSections = Array.from(home.querySelectorAll('.ss-member-hero ~ .ss-section'));
    const duplicateCreateSection = laterSections.find((section) => {
      const text = String(section.textContent || '').toLowerCase();
      return text.includes('create another store') || text.includes('running another team');
    });
    if (duplicateCreateSection) duplicateCreateSection.remove();

    marker.closest('.shopify-section')?.classList.add('ss-member-control-section');
  });
})();
