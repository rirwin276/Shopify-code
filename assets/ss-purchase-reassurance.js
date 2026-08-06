/* Stella & Sage purchase reassurance
 * Adds made-to-order guidance directly beside the buying decision and keeps
 * the public support page aligned with the store's refund rules.
 */
(() => {
  'use strict';

  const PRODUCT_PATH = /^\/products\//;
  const CART_PATH = /^\/cart\/?$/;
  const SUPPORT_PATH = /^\/pages\/support\/?$/;

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
      <p class="ss-purchase-note__title">Custom made to order — all sales are final</p>
      <p class="ss-purchase-note__copy">
        Review the size chart, garment color, design, spelling, name, number, shipping
        address, and preview before ordering. Refunds or replacements are considered
        only for verified damage, defects, misprints, incorrect items or sizes shipped,
        missing items, or packages confirmed lost in transit.
      </p>
      <div class="ss-purchase-note__links">
        <a href="/policies/refund-policy">Refund policy</a>
        <a href="/pages/support?report=1#report-order-problem">Report an order problem</a>
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
      <strong>Final review before checkout</strong>
      Every item is custom made to order and all sales are final except verified
      production or delivery errors. Check size, color, spelling, name, number,
      shipping address, and event timing carefully. Delivery estimates are not
      guaranteed arrival dates.
    `;

    checkout.parentElement?.insertBefore(note, checkout);
  }

  function supportPolicyCopy() {
    if (!SUPPORT_PATH.test(location.pathname)) return;

    const policyCopy = document.querySelector('.ss-help__policy-copy');
    if (policyCopy && policyCopy.dataset.ssFinalSaleCopy !== 'true') {
      policyCopy.dataset.ssFinalSaleCopy = 'true';
      policyCopy.innerHTML = `
        <p><strong>All products are custom made to order:</strong> Every item is produced specifically for the buyer. All sales are final except for verified production, fulfillment, or delivery errors.</p>
        <p><strong>Eligible problems:</strong> Contact us if an item arrives damaged or defective, is misprinted, differs from the approved order, contains a production-caused personalization error, is the wrong item, color, or size, is missing from the shipment, or the package is confirmed lost in transit. Approved cases may receive a replacement or refund.</p>
        <p><strong>Not eligible:</strong> We do not refund or exchange orders because the buyer selected the wrong size or color, entered the wrong spelling or number, changed their mind, dislikes the fit, feel, color, or design, supplied an incorrect address, or no longer needs the item. Review all details and size charts before checkout.</p>
        <p><strong>Claim timing:</strong> Report damaged, defective, misprinted, missing, or incorrect items within 30 days of delivery. Lost-package claims must be submitted within 30 days after the estimated delivery date. Include clear photos whenever an item was received.</p>
        <p><strong>Event dates:</strong> Production and delivery estimates are not guaranteed arrival dates. Missing a tournament, trip, ceremony, or other event date does not by itself make an otherwise correctly produced order refundable.</p>
        <div class="ss-help__policy-links">
          <a href="/policies/refund-policy">Full refund policy</a>
          <a href="/policies/shipping-policy">Shipping policy</a>
          <a href="/pages/online-tracking">Track an order</a>
        </div>
      `;
    }

    const actions = document.querySelectorAll('.ss-help__action');
    actions.forEach((action) => {
      const title = action.querySelector('strong');
      const copy = action.querySelector('small');
      if (title?.textContent.trim() === 'Request a return') {
        title.textContent = 'Review refund eligibility';
        if (copy) copy.textContent = 'Custom orders are final sale except verified production or delivery errors.';
      }
    });

    const issueSelect = document.querySelector('select[name="issue_type"]');
    if (issueSelect && issueSelect.dataset.ssFinalSaleOptions !== 'true') {
      issueSelect.dataset.ssFinalSaleOptions = 'true';
      const labels = {
        'size-or-color': 'Wrong size or color was shipped',
        personalization: 'Name or number was produced incorrectly',
        return: 'I ordered incorrectly or changed my mind'
      };
      Array.from(issueSelect.options).forEach((option) => {
        if (labels[option.value]) option.textContent = labels[option.value];
      });
    }
  }

  let queued = false;
  function install() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      productNote();
      cartNote();
      supportPolicyCopy();
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
