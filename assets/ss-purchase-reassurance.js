/* Stella & Sage purchase reassurance
 * Adds made-to-order guidance beside purchase decisions, keeps the public
 * support page aligned with the refund rules, and improves Shopify policy pages.
 */
(() => {
  'use strict';

  const PRODUCT_PATH = /^\/products\//;
  const CART_PATH = /^\/cart\/?$/;
  const SUPPORT_PATH = /^\/pages\/support\/?$/;
  const POLICY_PATH = /^\/policies\//;

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

      html.ss-policy-page,html.ss-policy-page body{background:#fbfaf7}
      html.ss-policy-page main.content-for-layout{
        background:radial-gradient(circle at 12% 0%,rgba(183,163,106,.11),transparent 30%),linear-gradient(180deg,#fff 0%,#fbfaf7 26%,#f7f4ed 100%);
      }
      html.ss-policy-page .shopify-policy__container{
        width:min(100% - 40px,1040px)!important;max-width:1040px!important;margin:0 auto!important;
        padding:clamp(58px,8vw,100px) 0 clamp(82px,10vw,126px)!important;
      }
      html.ss-policy-page .shopify-policy__title{max-width:820px;margin:0 0 30px!important;text-align:left!important}
      html.ss-policy-page .shopify-policy__title:before{
        content:'STELLA & SAGE · CUSTOMER POLICY';display:block;margin-bottom:13px;color:#9b854d;
        font-size:11px;font-weight:900;letter-spacing:.16em;
      }
      html.ss-policy-page .shopify-policy__title h1{
        margin:0!important;color:#11100e;font-size:clamp(44px,7vw,76px)!important;font-weight:950!important;
        line-height:.98!important;letter-spacing:-.06em!important;text-wrap:balance;
      }
      html.ss-policy-page .shopify-policy__body,html.ss-policy-page .shopify-policy__body .rte{
        max-width:none!important;margin:0!important;color:#26231e;
      }
      html.ss-policy-page .ss-policy-summary{
        position:relative;overflow:hidden;margin:0 0 24px;padding:clamp(28px,5vw,48px);border-radius:30px;
        background:radial-gradient(circle at 100% 0%,rgba(183,163,106,.24),transparent 34%),linear-gradient(145deg,#171511,#090908);
        color:#fff;box-shadow:0 30px 90px rgba(17,16,14,.18);
      }
      html.ss-policy-page .ss-policy-summary__eyebrow{margin:0 0 12px;color:#d8c27f;font-size:11px;font-weight:900;letter-spacing:.16em}
      html.ss-policy-page .ss-policy-summary h2{
        max-width:760px;margin:0;color:#fff;font-size:clamp(29px,4.5vw,48px);font-weight:930;line-height:1.03;
        letter-spacing:-.045em;text-wrap:balance;
      }
      html.ss-policy-page .ss-policy-summary>p{max-width:760px;margin:16px 0 0;color:rgba(255,255,255,.68);font-size:16px;line-height:1.65}
      html.ss-policy-page .ss-policy-summary__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:28px}
      html.ss-policy-page .ss-policy-summary__item{
        min-height:126px;padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.07);
      }
      html.ss-policy-page .ss-policy-summary__item strong,html.ss-policy-page .ss-policy-summary__item span{display:block}
      html.ss-policy-page .ss-policy-summary__item strong{margin-bottom:7px;color:#fff;font-size:14px;font-weight:900}
      html.ss-policy-page .ss-policy-summary__item span{color:rgba(255,255,255,.62);font-size:12.5px;line-height:1.5}
      html.ss-policy-page .ss-policy-section{
        margin:16px 0;padding:clamp(24px,4vw,38px);border:1px solid rgba(17,16,14,.09);border-radius:24px;
        background:rgba(255,255,255,.92);box-shadow:0 16px 52px rgba(17,16,14,.05);
      }
      html.ss-policy-page .ss-policy-section:first-child{margin-top:0}
      html.ss-policy-page .ss-policy-section h2,html.ss-policy-page .ss-policy-section h3,html.ss-policy-page .ss-policy-section h4{
        position:relative;margin:0 0 18px!important;padding-left:18px;color:#11100e;font-size:clamp(21px,3vw,30px)!important;
        font-weight:900!important;line-height:1.12!important;letter-spacing:-.035em!important;text-wrap:balance;
      }
      html.ss-policy-page .ss-policy-section h2:before,html.ss-policy-page .ss-policy-section h3:before,html.ss-policy-page .ss-policy-section h4:before{
        content:'';position:absolute;top:.18em;bottom:.14em;left:0;width:4px;border-radius:999px;background:#b7a36a;
      }
      html.ss-policy-page .ss-policy-section p,html.ss-policy-page .ss-policy-section li{color:#5f5a51;font-size:15px!important;line-height:1.72!important}
      html.ss-policy-page .ss-policy-section p{margin:0 0 14px!important}
      html.ss-policy-page .ss-policy-section p:last-child,html.ss-policy-page .ss-policy-section ul:last-child,html.ss-policy-page .ss-policy-section ol:last-child{margin-bottom:0!important}
      html.ss-policy-page .ss-policy-section strong{color:#1d1a16;font-weight:850}
      html.ss-policy-page .ss-policy-section ul,html.ss-policy-page .ss-policy-section ol{margin:16px 0 18px!important;padding-left:1.35rem!important}
      html.ss-policy-page .ss-policy-section li{margin:8px 0;padding-left:4px}
      html.ss-policy-page .ss-policy-section a{color:#11100e;font-weight:800;text-underline-offset:3px;text-decoration-thickness:1px}
      html.ss-policy-page .ss-policy-help{
        display:flex;justify-content:space-between;gap:24px;align-items:center;margin-top:24px;padding:22px 24px;
        border:1px solid rgba(183,163,106,.34);border-radius:20px;background:#f2ecdc;
      }
      html.ss-policy-page .ss-policy-help strong,html.ss-policy-page .ss-policy-help span{display:block}
      html.ss-policy-page .ss-policy-help strong{color:#11100e;font-size:16px;font-weight:900}
      html.ss-policy-page .ss-policy-help span{margin-top:4px;color:#686157;font-size:13px;line-height:1.45}
      html.ss-policy-page .ss-policy-help a{
        flex:0 0 auto;display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:0 18px;border-radius:999px;
        background:#11100e;color:#fff;font-size:13px;font-weight:900;text-decoration:none;
      }
      @media(max-width:760px){
        html.ss-policy-page .shopify-policy__container{width:min(100% - 28px,1040px)!important;padding-top:42px!important}
        html.ss-policy-page .shopify-policy__title h1{font-size:46px!important}
        html.ss-policy-page .ss-policy-summary{border-radius:24px}
        html.ss-policy-page .ss-policy-summary__grid{grid-template-columns:1fr}
        html.ss-policy-page .ss-policy-summary__item{min-height:auto}
        html.ss-policy-page .ss-policy-section{border-radius:20px}
        html.ss-policy-page .ss-policy-help{align-items:stretch;flex-direction:column}
        html.ss-policy-page .ss-policy-help a{width:100%}
      }
      @media print{
        html.ss-policy-page,html.ss-policy-page body,html.ss-policy-page main.content-for-layout{background:#fff!important}
        html.ss-policy-page .shopify-policy__container{width:100%!important;max-width:none!important;padding:0!important}
        html.ss-policy-page .ss-policy-summary,html.ss-policy-page .ss-policy-section,html.ss-policy-page .ss-policy-help{box-shadow:none!important;break-inside:avoid}
      }
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

  function policyPage() {
    if (!POLICY_PATH.test(location.pathname)) return;

    const container = document.querySelector('.shopify-policy__container');
    if (!container || container.dataset.ssPolicyEnhanced === 'true') return;

    const body = container.querySelector('.shopify-policy__body');
    const rte = body?.querySelector('.rte') || body;
    if (!body || !rte) return;

    container.dataset.ssPolicyEnhanced = 'true';
    document.documentElement.classList.add('ss-policy-page');

    const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();

    Array.from(rte.querySelectorAll('p, div')).forEach((element) => {
      const text = normalize(element.textContent);
      const hasMedia = element.querySelector('img,video,iframe,table');
      if (!text && !hasMedia) element.remove();
    });

    const headingPatterns = [
      /^return\s*(?:&|and)\s*refund policy$/i,
      /^refund policy$/i,
      /^all sales are final$/i,
      /^no returns or exchanges$/i,
      /^eligible (?:order )?problems?$/i,
      /^non[- ]refundable situations?$/i,
      /^manufacturing defects?\s*(?:&|and)\s*fulfillment errors?$/i,
      /^claim deadlines?$/i,
      /^required information$/i,
      /^to qualify:?$/i,
      /^resolution of approved claims?$/i,
      /^returns?$/i,
      /^delivery\s*(?:&|and)\s*event dates?$/i,
      /^order cancellations?\s*(?:&|and)\s*changes?$/i,
      /^chargebacks?\s*(?:&|and)\s*fraud protection$/i,
      /^payment disputes?$/i,
      /^agreement to terms$/i,
      /^legal rights?$/i
    ];

    Array.from(rte.children).forEach((element) => {
      if (element.tagName !== 'P') return;
      const text = normalize(element.textContent);
      if (!text || text.length > 96) return;

      const onlyStrong =
        element.children.length === 1 &&
        ['STRONG', 'B'].includes(element.firstElementChild?.tagName || '') &&
        normalize(element.firstElementChild.textContent) === text;

      if (!onlyStrong && !headingPatterns.some((pattern) => pattern.test(text))) return;

      const heading = document.createElement('h2');
      heading.innerHTML = element.innerHTML;
      element.replaceWith(heading);
    });

    const nodes = Array.from(rte.children);
    if (nodes.length) {
      const fragment = document.createDocumentFragment();
      let section = null;

      nodes.forEach((node) => {
        const isHeading = /^H[2-4]$/.test(node.tagName);
        if (isHeading || !section) {
          section = document.createElement('section');
          section.className = 'ss-policy-section';
          fragment.appendChild(section);
        }
        section.appendChild(node);
      });

      rte.replaceChildren(fragment);
    }

    const isRefundPolicy = /\/policies\/refund-policy\/?$/.test(location.pathname);
    if (isRefundPolicy && !container.querySelector('.ss-policy-summary')) {
      const summary = document.createElement('aside');
      summary.className = 'ss-policy-summary';
      summary.setAttribute('aria-label', 'Refund policy summary');
      summary.innerHTML = `
        <p class="ss-policy-summary__eyebrow">CUSTOM MADE TO ORDER</p>
        <h2>Order carefully. We will make it right when production goes wrong.</h2>
        <p>
          Every product is created specifically for the buyer, so correctly produced
          orders are final sale. Verified production, fulfillment, and delivery errors
          can still qualify for a replacement or refund.
        </p>
        <div class="ss-policy-summary__grid">
          <div class="ss-policy-summary__item">
            <strong>Check before checkout</strong>
            <span>Review size, color, spelling, name, number, quantity, and shipping address.</span>
          </div>
          <div class="ss-policy-summary__item">
            <strong>Problems we review</strong>
            <span>Damage, defects, misprints, the wrong item or size shipped, missing items, and confirmed lost packages.</span>
          </div>
          <div class="ss-policy-summary__item">
            <strong>Buyer-choice issues</strong>
            <span>Wrong selections, change of mind, fit preferences, or disliking a correctly produced item are not refundable.</span>
          </div>
        </div>
      `;
      body.insertAdjacentElement('beforebegin', summary);
    }

    if (!container.querySelector('.ss-policy-help')) {
      const help = document.createElement('div');
      help.className = 'ss-policy-help';
      help.innerHTML = `
        <div>
          <strong>Something actually went wrong with an order?</strong>
          <span>Send the order number, checkout email, explanation, and clear photos so the issue can be verified.</span>
        </div>
        <a href="/pages/support?report=1#report-order-problem">Report an order problem</a>
      `;
      body.insertAdjacentElement('afterend', help);
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
      policyPage();
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
