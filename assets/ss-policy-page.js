/* Stella & Sage policy-page enhancer
 * Preserves Shopify's policy text and only improves its presentation.
 */
(() => {
  'use strict';

  if (!/^\/policies\//.test(window.location.pathname || '')) return;

  const container = document.querySelector('.shopify-policy__container');
  if (!container || container.dataset.ssPolicyEnhanced === 'true') return;

  container.dataset.ssPolicyEnhanced = 'true';
  document.documentElement.classList.add('ss-policy-page');

  const title = container.querySelector('.shopify-policy__title');
  const body = container.querySelector('.shopify-policy__body');
  const rte = body?.querySelector('.rte') || body;
  if (!body || !rte) return;

  const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  // Shopify policy editors often create blank paragraphs that turn into large
  // vertical gaps. Remove only elements that contain no meaningful content.
  Array.from(rte.querySelectorAll('p, div')).forEach((element) => {
    const text = normalize(element.textContent);
    const hasMedia = element.querySelector('img, video, iframe, table');
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
    /^legal rights?$/i,
  ];

  const shouldPromote = (element) => {
    if (element.tagName !== 'P') return false;
    const text = normalize(element.textContent);
    if (!text || text.length > 96) return false;

    const onlyStrong =
      element.children.length === 1 &&
      ['STRONG', 'B'].includes(element.firstElementChild?.tagName || '') &&
      normalize(element.firstElementChild.textContent) === text;

    return onlyStrong || headingPatterns.some((pattern) => pattern.test(text));
  };

  Array.from(rte.children).forEach((element) => {
    if (!shouldPromote(element)) return;
    const heading = document.createElement('h2');
    heading.innerHTML = element.innerHTML;
    element.replaceWith(heading);
  });

  // Group each policy section into a card without changing the policy wording.
  const originalNodes = Array.from(rte.children);
  if (originalNodes.length) {
    const fragment = document.createDocumentFragment();
    let section = null;

    originalNodes.forEach((node) => {
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

  const isRefundPolicy = /\/policies\/refund-policy\/?$/.test(window.location.pathname);

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
})();
