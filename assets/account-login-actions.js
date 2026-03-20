/**
 * A custom element that manages the account login actions.
 * MODIFIED: Forces redirect to Studio Dashboard (/pages/portal)
 *
 * @extends {HTMLElement}
 */
class AccountLoginActions extends HTMLElement {
  /**
   * @type {Element | null}
   */
  shopLoginButton = null;

  connectedCallback() {
    this.shopLoginButton = this.querySelector('shop-login-button');

    if (this.shopLoginButton) {
      // 1. DEFINE THE TARGET
      const dashboardUrl = '/pages/portal';
      const fullReturnUrl = window.location.origin + dashboardUrl;

      // We don't have control over the shop-login-button markup, so we need to set additional attributes here
      this.shopLoginButton.setAttribute('full-width', 'true');
      this.shopLoginButton.setAttribute('persist-after-sign-in', 'true');
      
      this.shopLoginButton.setAttribute('analytics-context', 'loginWithShopSelfServe');
      this.shopLoginButton.setAttribute('flow-version', 'account-actions-popover');
      
      // 2. THE FIX: OVERRIDE THE DESTINATION
      // Instead of 'window.location.href' (Current Page), we force the Dashboard URL.
      this.shopLoginButton.setAttribute('return-uri', fullReturnUrl);

      // 3. THE FIX: HARD REDIRECT ON COMPLETION
      // Instead of reloading the current page, we send them to the dashboard.
      this.shopLoginButton.addEventListener('completed', () => {
        window.location.href = dashboardUrl;
      });
    }
  }
}

if (!customElements.get('account-login-actions')) {
  customElements.define('account-login-actions', AccountLoginActions);
}