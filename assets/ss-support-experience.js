/* Stella & Sage support-page experience
 * Repairs customer-facing support links, adds phone/text permission fields,
 * and provides a real contact form that emails the support inbox.
 */
(() => {
  'use strict';

  const ENDPOINT = 'https://printfulautomation-production.up.railway.app/support/cases';

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const readError = async (response, fallback) => {
    try {
      const data = await response.json();
      return data.detail || data.message || fallback;
    } catch (_) {
      return fallback;
    }
  };

  ready(() => {
    const root = document.querySelector('.ss-help');
    if (!root || root.dataset.ssExperienceReady === '1') return;
    root.dataset.ssExperienceReady = '1';

    const context = window.SS_SUPPORT_CONTEXT || {};
    const supportEmail = context.supportEmail || 'ryan.irwin@stellaandsagecompany.com';
    const actions = Array.from(root.querySelectorAll('.ss-help__action'));

    const setAction = (action, { href, title, description, icon }) => {
      if (!action) return;
      if (href) action.setAttribute('href', href);
      const strong = action.querySelector('strong');
      const small = action.querySelector('small');
      const iconNode = action.querySelector('.ss-help__icon');
      if (strong) strong.textContent = title;
      if (small) small.textContent = description;
      if (iconNode) iconNode.textContent = icon;
    };

    setAction(actions[0], {
      href: '/account',
      title: 'My orders',
      description: 'Open an order to view fulfillment and tracking updates.',
      icon: '↗'
    });

    setAction(actions[2], {
      href: '/policies/refund-policy',
      title: 'Refund policy',
      description: 'See which production and delivery problems qualify for help.',
      icon: '✓'
    });

    setAction(actions[3], {
      href: '#contact-support',
      title: 'Contact support',
      description: 'Send Ryan a message directly from this page.',
      icon: '✉'
    });

    root.querySelectorAll('a[href="/pages/online-tracking"]').forEach((link) => {
      link.setAttribute('href', '/account');
      if (link.textContent.trim().toLowerCase().includes('track')) {
        link.textContent = 'View my orders';
      }
    });

    const style = document.createElement('style');
    style.textContent = `
      .ss-help .ss-support-checkbox{display:flex!important;flex-direction:row!important;align-items:flex-start;gap:10px!important;padding:12px 14px;border:1px solid rgba(17,16,14,.11);border-radius:12px;background:#fff;font-size:12px!important;font-weight:650!important;line-height:1.45}
      .ss-help .ss-support-checkbox input{width:17px!important;height:17px!important;flex:0 0 auto;margin:1px 0 0;padding:0!important}
      .ss-help .ss-contact-panel{background:#f7f4ed;border:1px solid rgba(17,16,14,.08);border-radius:24px;padding:28px;margin:18px 0 38px}
      .ss-help .ss-contact-panel[hidden]{display:none}
      .ss-help .ss-contact-panel__head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:24px}
      .ss-help .ss-contact-panel__head>div{max-width:720px}
      .ss-help .ss-contact-panel__head p:last-child{font-size:16px;line-height:1.65;color:#68645c}
      .ss-help .ss-contact-panel__close{border:0;background:#fff;width:40px;height:40px;border-radius:50%;font-size:25px;cursor:pointer}
      .ss-help .ss-contact-panel__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
      .ss-help .ss-contact-panel__full{grid-column:1/-1}
      .ss-help .ss-contact-panel__submit{display:flex;align-items:center;gap:18px;margin-top:18px}
      .ss-help .ss-contact-panel__submit button{border:0;border-radius:999px;background:#11100e;color:#fff;padding:14px 22px;font-weight:900;cursor:pointer;white-space:nowrap}
      .ss-help .ss-contact-panel__submit button[disabled]{opacity:.55;cursor:wait}
      .ss-help .ss-contact-panel__note{font-size:12px;line-height:1.45;color:#68645c;margin:0}
      @media(max-width:600px){
        .ss-help .ss-contact-panel{padding:20px 16px}
        .ss-help .ss-contact-panel__grid{grid-template-columns:1fr}
        .ss-help .ss-contact-panel__full{grid-column:auto}
        .ss-help .ss-contact-panel__submit{align-items:stretch;flex-direction:column}
      }
    `;
    document.head.appendChild(style);

    const casePanel = root.querySelector('[data-ss-case-panel]');
    const caseForm = root.querySelector('[data-ss-case-form]');
    const caseStatus = root.querySelector('[data-ss-case-status]');

    if (caseForm) {
      const grid = caseForm.querySelector('.ss-help__form-grid');
      const emailInput = caseForm.querySelector('input[name="email"]');
      if (emailInput && !emailInput.value && context.email) emailInput.value = context.email;

      if (grid && !caseForm.querySelector('input[name="phone"]')) {
        const phoneLabel = document.createElement('label');
        phoneLabel.innerHTML = `
          <span>Cell phone <small>(optional)</small></span>
          <input name="phone" type="tel" autocomplete="tel" placeholder="Best number to reach you">
        `;

        const consentLabel = document.createElement('label');
        consentLabel.className = 'ss-support-checkbox';
        consentLabel.innerHTML = `
          <input name="text_permission" type="checkbox" value="yes">
          <span>It is okay for Stella & Sage to text me about this support request. Message and data rates may apply.</span>
        `;

        const emailLabel = emailInput?.closest('label');
        if (emailLabel) {
          emailLabel.insertAdjacentElement('afterend', consentLabel);
          emailLabel.insertAdjacentElement('afterend', phoneLabel);
        } else {
          grid.append(phoneLabel, consentLabel);
        }

        const phoneInput = phoneLabel.querySelector('input');
        if (phoneInput && context.phone) phoneInput.value = context.phone;
      }

      caseForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!caseForm.reportValidity()) return;
        caseStatus.textContent = '';
        caseStatus.className = 'ss-help__status';

        const submit = caseForm.querySelector('button[type="submit"]');
        submit.disabled = true;
        submit.textContent = 'Submitting…';

        try {
          const data = new FormData(caseForm);
          const phone = String(data.get('phone') || '').trim();
          const textPermission = data.get('text_permission') === 'yes' ? 'Yes' : 'No';
          const originalDescription = String(data.get('description') || '').trim();
          data.set(
            'description',
            `Cell phone: ${phone || '(not provided)'}\nText permission: ${textPermission}\n\n${originalDescription}`
          );

          const response = await fetch(ENDPOINT, {
            method: 'POST',
            body: data,
            headers: { Accept: 'application/json' }
          });

          if (!response.ok) {
            throw new Error(await readError(response, 'We could not submit the request.'));
          }

          const result = await response.json();
          caseStatus.textContent = `${result.message || 'Your request was submitted.'} Case number: ${result.case_id}.`;
          caseStatus.classList.add('is-success');
          caseForm.reset();
          if (emailInput && context.email) emailInput.value = context.email;
          const phoneInput = caseForm.querySelector('input[name="phone"]');
          if (phoneInput && context.phone) phoneInput.value = context.phone;
        } catch (error) {
          caseStatus.textContent = `${error.message || 'We could not submit the request.'} You can also email ${supportEmail}.`;
          caseStatus.classList.add('is-error');
        } finally {
          submit.disabled = false;
          submit.textContent = 'Submit support request';
        }
      }, true);
    }

    const contactPanel = document.createElement('div');
    contactPanel.className = 'ss-contact-panel';
    contactPanel.id = 'contact-support';
    contactPanel.hidden = true;
    contactPanel.innerHTML = `
      <div class="ss-contact-panel__head">
        <div>
          <p class="ss-help__eyebrow">CONTACT SUPPORT</p>
          <h2>Send us a message</h2>
          <p>Your message is emailed directly to Ryan. Include an order number in the message when your question is about an order.</p>
        </div>
        <button type="button" class="ss-contact-panel__close" aria-label="Close contact form">×</button>
      </div>
      <form data-ss-contact-form novalidate>
        <div class="ss-contact-panel__grid">
          <label>
            <span>Your name</span>
            <input name="contact_name" type="text" autocomplete="name" value="${escapeHtml(context.name || '')}" required>
          </label>
          <label>
            <span>Your email</span>
            <input name="contact_email" type="email" autocomplete="email" value="${escapeHtml(context.email || '')}" required>
          </label>
          <label>
            <span>Cell phone <small>(optional)</small></span>
            <input name="contact_phone" type="tel" autocomplete="tel" value="${escapeHtml(context.phone || '')}" placeholder="Best number to reach you">
          </label>
          <label>
            <span>What can we help with?</span>
            <select name="contact_subject" required>
              <option value="">Choose one</option>
              <option value="Order question">Order question</option>
              <option value="Store or admin help">Store or admin help</option>
              <option value="Tax-exempt organization">Tax-exempt organization</option>
              <option value="Product question">Product question</option>
              <option value="Something else">Something else</option>
            </select>
          </label>
          <label class="ss-contact-panel__full">
            <span>Message</span>
            <textarea name="contact_message" rows="6" minlength="12" maxlength="4000" placeholder="Tell us what you need help with." required></textarea>
          </label>
          <label class="ss-support-checkbox ss-contact-panel__full">
            <input name="contact_text_permission" type="checkbox" value="yes">
            <span>It is okay for Stella & Sage to text me about this message. Message and data rates may apply.</span>
          </label>
        </div>
        <div class="ss-contact-panel__submit">
          <button type="submit">Send message</button>
          <p class="ss-contact-panel__note">Most messages receive a response within one business day.</p>
        </div>
        <div class="ss-help__status" data-ss-contact-status role="status" aria-live="polite"></div>
      </form>
    `;

    if (casePanel) casePanel.insertAdjacentElement('afterend', contactPanel);
    else root.querySelector('.ss-help__actions')?.insertAdjacentElement('afterend', contactPanel);

    const openContact = () => {
      if (casePanel) casePanel.hidden = true;
      contactPanel.hidden = false;
      contactPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => contactPanel.querySelector('input[name="contact_name"]')?.focus(), 350);
    };

    actions[3]?.addEventListener('click', (event) => {
      event.preventDefault();
      openContact();
    });

    contactPanel.querySelector('.ss-contact-panel__close')?.addEventListener('click', () => {
      contactPanel.hidden = true;
    });

    if (window.location.hash === '#contact-support') openContact();

    const contactForm = contactPanel.querySelector('[data-ss-contact-form]');
    const contactStatus = contactPanel.querySelector('[data-ss-contact-status]');

    contactForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      contactStatus.textContent = '';
      contactStatus.className = 'ss-help__status';
      const submit = contactForm.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Sending…';

      try {
        const form = new FormData(contactForm);
        const name = String(form.get('contact_name') || '').trim();
        const email = String(form.get('contact_email') || '').trim();
        const phone = String(form.get('contact_phone') || '').trim();
        const subject = String(form.get('contact_subject') || '').trim();
        const message = String(form.get('contact_message') || '').trim();
        const textPermission = form.get('contact_text_permission') === 'yes' ? 'Yes' : 'No';

        const data = new FormData();
        data.set('order_number', 'GENERAL');
        data.set('email', email);
        data.set('issue_type', 'other');
        data.set('item', subject);
        data.set('preferred_resolution', 'help');
        data.set('website', '');
        data.set(
          'description',
          `GENERAL SUPPORT MESSAGE\n\nName: ${name}\nCell phone: ${phone || '(not provided)'}\nText permission: ${textPermission}\nSubject: ${subject}\n\nMessage:\n${message}`
        );

        const response = await fetch(ENDPOINT, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          throw new Error(await readError(response, 'We could not send your message.'));
        }

        const result = await response.json();
        contactStatus.textContent = `Your message was sent. Reference number: ${result.case_id}.`;
        contactStatus.classList.add('is-success');
        contactForm.reset();
        const nameInput = contactForm.querySelector('input[name="contact_name"]');
        const emailField = contactForm.querySelector('input[name="contact_email"]');
        const phoneField = contactForm.querySelector('input[name="contact_phone"]');
        if (nameInput && context.name) nameInput.value = context.name;
        if (emailField && context.email) emailField.value = context.email;
        if (phoneField && context.phone) phoneField.value = context.phone;
      } catch (error) {
        contactStatus.textContent = `${error.message || 'We could not send your message.'} You can also email ${supportEmail}.`;
        contactStatus.classList.add('is-error');
      } finally {
        submit.disabled = false;
        submit.textContent = 'Send message';
      }
    });
  });
})();
