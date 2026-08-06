/* Stella & Sage purchase reassurance
 * Adds made-to-order guidance directly beside the buying decision without
 * changing Shopify's large product and cart templates.
 */
(() => {
  'use strict';

  const PRODUCT_PATH = /^\/products\//;
  const CART_PATH = /^\/cart\/?$/;

  const styleId = 'ss-purchase-reassurance-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .ss-purchase-note{
        margin-top:14px;padding:14px 16px;border:1px solid rgba(17,16,14,.1);
        border-radius:14px;background:#f7f4ed;color:#11100e;font-family:inherit;
      }
      .ss-purchase-note__title{font-size:13px;font-weight:900;margin:0 0 5px}
      .ss-purchase-note__copy{font-size:11.5px;line-height:1.5;color:#615c54;margin:0}
      .ss-purchase-note__links{display:flex;gap:12px;flex-wrap:wrap;margin-top:9px}
      .ss-purchase-note__links a{font-size:11px;font-weight:850;color:#11100e;text-decoration:none;border-bottom:1px solid rgba(17,16,14,.35)}
      .ss-event-note{
        width:100%;margin:0 0 13px;padding:12px 14px;border-radius:12px;
        background:#fff8e8;border:1px solid #ead8aa;color:#514528;font-family:inherit;
        font-size:11.5px;line-height:1.5;
      }
      .ss-event-note strong{display:block;color:#2f291b;font-size:12px;margin-bottom:3px}
    `;
    document.head.appendChild(style);
  }

  function productNote() {
    if (!PRODUCT_PATH.test(location.pathname) || document.querySelector('.ss-purchase-note')) return;

    const anchor =
      document.querySelector('buy-buttons') ||
      document.querySelector('.product-form-buttons') ||
      document.querySelector('[data-block-type="buy-buttons"]') ||
      document.querySelector('form[action*="/cart/add"]');

    if (!anchor) return;

    const note = document.createElement('div');
    note.className = 'ss-purchase-note';
    note.innerHTML = `
      <p class="ss-purchase-note__title">Made especially for your group</p>
      <p class="ss-purchase-note__copy">
        Items are made to order and ship directly to the buyer. Review size, color,
        spelling, number, and preview carefully. Personalized items are normally final
        sale unless damaged or produced incorrectly.
      </p>
      <div class="ss-purchase-note__links">
        <a href="/pages/support">Shipping & returns</a>
        <a href="/pages/support?report=1#report-order-problem">Get order help</a>
      </div>
    `;

    anchor.insertAdjacentElement('afterend', note);
  }

  function cartNote() {
    if (!CART_PATH.test(location.pathname) || document.querySelector('.ss-event-note')) return;

    const checkout =
      document.querySelector('button[name="checkout"]') ||
      document.querySelector('.cart__checkout-button') ||
      document.querySelector('[href*="/checkout"]');

    if (!checkout) return;

    const note = document.createElement('div');
    note.className = 'ss-event-note';
    note.innerHTML = `
      <strong>Ordering for a specific event?</strong>
      Production and delivery estimates are not guaranteed arrival dates. Order early
      and review shipping information, size, color, and personalization before checkout.
    `;

    checkout.parentElement?.insertBefore(note, checkout);
  }

  let queued = false;
  function install() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      productNote();
      cartNote();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }

  const target = document.querySelector('main') || document.body;
  if (target && typeof MutationObserver !== 'undefined') {
    new MutationObserver(install).observe(target, { childList: true, subtree: true });
  }
})();
