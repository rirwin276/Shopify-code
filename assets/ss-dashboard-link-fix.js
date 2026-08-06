/* Ensure the signed-in homepage dashboard card always opens the real portal.
 * A stale storefront-form resume key can otherwise redirect /pages/portal
 * back to the create-store flow for up to 12 hours.
 */
(() => {
  'use strict';

  const clearStaleStorefrontResume = () => {
    try {
      localStorage.removeItem('sf_pending_form_v2');
      localStorage.removeItem('sf_pending_form_v1');
      localStorage.removeItem('sf_pending_signin_v1');
    } catch (error) {
      // Storage can be unavailable in private browsing; navigation still works.
    }
  };

  const portalPath = '/pages/portal';

  const normalizeDashboardLink = () => {
    const link = document.querySelector('.ss-command-primary');
    if (!link) return;

    const label = String(link.textContent || '').toLowerCase();
    if (!label.includes('dashboard')) return;

    link.href = portalPath;
    link.setAttribute('data-ss-do-not-rewrite-auth', 'true');
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('.ss-command-primary');
    if (!link) return;

    const label = String(link.textContent || '').toLowerCase();
    if (!label.includes('dashboard')) return;

    event.preventDefault();
    event.stopPropagation();
    clearStaleStorefrontResume();
    window.location.assign(portalPath);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeDashboardLink, { once: true });
  } else {
    normalizeDashboardLink();
  }
})();
