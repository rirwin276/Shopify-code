/* Stella & Sage signed-in homepage.
 * A compact command-center layout with clear hierarchy for store owners and
 * a separate first-store experience for customers without a store.
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

  const iconSvg = {
    dashboard: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    plus: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    orders: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 3h12a1 1 0 0 1 1 1v16l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M8 8h8M8 12h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
    `,
    help: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
        <path d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2 1-1.2 1.8M12 17h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `
  };

  const cleanGreeting = (value) => String(value || '')
    .replace(/,\s*/g, ', ')
    .replace(/\s+\./g, '.')
    .trim();

  const makeTile = ({ href, icon, title, description }) => {
    const link = document.createElement('a');
    link.className = 'ss-command-tile';
    link.href = href;

    const iconNode = document.createElement('span');
    iconNode.className = 'ss-command-tile__icon';
    iconNode.setAttribute('aria-hidden', 'true');
    iconNode.innerHTML = iconSvg[icon] || '';

    const copy = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = title;
    const small = document.createElement('small');
    small.textContent = description;
    copy.append(strong, small);

    const arrow = document.createElement('b');
    arrow.className = 'ss-command-tile__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    link.append(iconNode, copy, arrow);
    return link;
  };

  onReady(() => {
    const marker = document.querySelector('[data-ss-member-home-control]');
    if (!marker) return;

    const home = document.querySelector('.ss-home');
    const hero = home?.querySelector('.ss-member-hero');
    const shell = hero?.querySelector('.ss-member-shell');
    if (!home || !hero || !shell || shell.dataset.memberHomeReady === '3') return;

    shell.dataset.memberHomeReady = '3';
    home.classList.add('ss-member-enhanced');

    const hasStore = marker.dataset.hasStore === 'true';
    const requestUrl = marker.dataset.requestUrl || '/pages/request-storefront-form';
    const dashboardUrl = marker.dataset.dashboardUrl || '/pages/portal';
    const ordersUrl = marker.dataset.ordersUrl || '/account';
    const supportUrl = marker.dataset.supportUrl || '/pages/support';
    const currentTitle = cleanGreeting(shell.querySelector('.ss-member-title')?.textContent || 'Welcome back.');

    const topbar = document.createElement('div');
    topbar.className = 'ss-command-topbar';
    topbar.innerHTML = `
      <div class="ss-command-brand"><span class="ss-command-brand__dot"></span><span>Stella &amp; Sage</span><em>Member home</em></div>
      <span class="ss-command-status"><i></i>Account ready</span>
    `;

    const grid = document.createElement('div');
    grid.className = 'ss-command-grid';

    const main = document.createElement('div');
    main.className = 'ss-command-main';
    const kicker = document.createElement('p');
    kicker.className = 'ss-command-kicker';
    kicker.textContent = hasStore ? 'YOUR STORES, ONE PLACE' : 'YOUR ACCOUNT IS READY';
    const title = document.createElement('h1');
    title.className = 'ss-command-title';
    title.textContent = currentTitle;
    const subtitle = document.createElement('p');
    subtitle.className = 'ss-command-sub';
    subtitle.textContent = hasStore
      ? 'Your stores are ready when you are. Pick up where you left off, find your group’s gear, or start something new.'
      : 'Create your first store in minutes, then share one link and let everyone order directly.';

    const primary = document.createElement('a');
    primary.className = 'ss-command-primary';
    primary.href = hasStore ? dashboardUrl : requestUrl;
    if (hasStore) primary.setAttribute('data-ss-do-not-rewrite-auth', 'true');
    primary.innerHTML = `
      <span class="ss-command-primary__icon" aria-hidden="true">${hasStore ? iconSvg.dashboard : iconSvg.plus}</span>
      <span>
        <small>${hasStore ? 'YOUR STORES' : 'FREE STORE SETUP'}</small>
        <strong>${hasStore ? 'Open my dashboard' : 'Create my first store'}</strong>
        <em>${hasStore ? 'Shop your stores and access your admin tools.' : 'No minimums, no deadlines, and no setup fee.'}</em>
      </span>
      <b class="ss-command-primary__arrow" aria-hidden="true">→</b>
    `;
    main.append(kicker, title, subtitle, primary);

    const quick = document.createElement('aside');
    quick.className = 'ss-command-quick';
    const quickLabel = document.createElement('p');
    quickLabel.className = 'ss-command-quick__label';
    quickLabel.textContent = 'Quick actions';
    quick.append(quickLabel);

    if (hasStore) {
      quick.append(
        makeTile({
          href: requestUrl,
          icon: 'plus',
          title: 'Create a new store',
          description: 'Launch another team, unit, business, or group.'
        }),
        makeTile({
          href: ordersUrl,
          icon: 'orders',
          title: 'My orders',
          description: 'Check tracking, status, and previous purchases.'
        })
      );
    } else {
      quick.append(
        makeTile({
          href: ordersUrl,
          icon: 'orders',
          title: 'My orders',
          description: 'Check tracking, status, and previous purchases.'
        }),
        makeTile({
          href: supportUrl,
          icon: 'help',
          title: 'Need help?',
          description: 'Get order support or help starting your store.'
        })
      );
    }

    grid.append(main, quick);

    const guide = document.createElement('section');
    guide.className = 'ss-command-guide';
    guide.setAttribute('aria-labelledby', 'ss-member-guide-title');
    guide.innerHTML = `
      <div class="ss-command-guide__head">
        <div><p class="ss-command-kicker">A LITTLE HELP ALONG THE WAY</p><h2 id="ss-member-guide-title">Make the most of your store.</h2></div>
        <a href="/pages/private-storefronts">How it works <span aria-hidden="true">→</span></a>
      </div>
      <div class="ss-command-guide__grid">
        <article><span class="ss-command-guide__number" aria-hidden="true">01</span><h3>${hasStore ? 'Find your group’s gear' : 'Joining a group?'}</h3><p>${hasStore ? 'Open your dashboard to find the stores you belong to. Choose a store to browse and order.' : 'Use the invite or store link from your organizer. Once you have access, your store will appear in your dashboard.'}</p></article>
        <article><span class="ss-command-guide__number" aria-hidden="true">02</span><h3>Make it yours</h3><p>Choose your size and color, then add a name or number where available. Review your details before checkout.</p></article>
        <article><span class="ss-command-guide__number" aria-hidden="true">03</span><h3>Organizing a store?</h3><p>Open Admin Powers from your dashboard to manage products, refine designs, and share your store with your group.</p></article>
      </div>
    `;

    const foot = document.createElement('div');
    foot.className = 'ss-command-foot';
    const note = document.createElement('span');
    note.textContent = hasStore
      ? 'Made to order. Shipped directly to you. Need a hand? We’re here.'
      : 'Store setup is always free. Your store stays open until you choose to remove it.';
    const support = document.createElement('a');
    support.href = supportUrl;
    support.textContent = 'Support & policies →';
    foot.append(note, support);

    shell.replaceChildren(topbar, grid, guide, foot);
    shell.classList.toggle('ss-member-shell--has-store', hasStore);
    shell.classList.toggle('ss-member-shell--no-store', !hasStore);

    const laterSections = Array.from(home.querySelectorAll('.ss-member-hero ~ .ss-section'));
    const duplicateCreateSection = laterSections.find((section) => {
      const text = String(section.textContent || '').toLowerCase();
      return text.includes('create another store') || text.includes('running another team');
    });
    if (duplicateCreateSection) duplicateCreateSection.remove();

    marker.closest('.shopify-section')?.classList.add('ss-member-control-section');
  });
})();
