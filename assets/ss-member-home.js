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

  const runtimeCss = `
    .ss-member-control-section{display:none!important}
    .ss-member-enhanced .ss-member-hero{min-height:0!important;padding:clamp(24px,3.5vw,46px) 0 clamp(20px,3vw,36px)!important}
    .ss-member-enhanced .ss-member-hero .ss-wrap{max-width:1180px!important;padding-inline:clamp(14px,3vw,28px)!important}
    .ss-member-enhanced .ss-member-shell{position:relative;min-height:0!important;height:auto!important;max-width:1100px!important;margin:0 auto!important;padding:0!important;overflow:hidden;border:1px solid rgba(17,16,14,.08)!important;border-radius:34px!important;background:#fff!important;box-shadow:0 28px 90px rgba(17,16,14,.11)!important}
    .ss-member-enhanced .ss-member-shell:before{content:"";position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,#11100e 0%,#b89d57 45%,#e6d8aa 72%,transparent 100%);z-index:4}
    .ss-command-topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 28px;border-bottom:1px solid rgba(17,16,14,.075);background:linear-gradient(90deg,#fff 0%,#fbfaf6 100%)}
    .ss-command-brand{display:flex;align-items:center;gap:9px;color:#403d37;font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
    .ss-command-brand__dot{width:9px;height:9px;border-radius:50%;background:#bea45d;box-shadow:0 0 0 6px rgba(190,164,93,.12)}
    .ss-command-brand em{font-style:normal;color:#9a948a;font-weight:750}
    .ss-command-status{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid rgba(17,16,14,.08);border-radius:999px;background:#fff;color:#69645b;font-size:10px;font-weight:800}
    .ss-command-status i{width:7px;height:7px;border-radius:50%;background:#65a46e;box-shadow:0 0 0 4px rgba(101,164,110,.11)}
    .ss-command-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(310px,.75fr);min-height:360px}
    .ss-command-main{position:relative;display:flex;flex-direction:column;justify-content:center;padding:clamp(34px,5vw,58px);overflow:hidden;background:radial-gradient(circle at 8% 12%,rgba(201,180,118,.14),transparent 36%),linear-gradient(145deg,#fff 0%,#fdfcf9 100%)}
    .ss-command-main:after{content:"";position:absolute;right:-150px;bottom:-190px;width:420px;height:420px;border-radius:50%;border:1px solid rgba(184,157,87,.13);box-shadow:0 0 0 48px rgba(184,157,87,.035),0 0 0 96px rgba(184,157,87,.02);pointer-events:none}
    .ss-command-main>*{position:relative;z-index:1}
    .ss-command-kicker{margin:0 0 11px;color:#9a8250;font-size:10px;font-weight:900;letter-spacing:.19em;text-transform:uppercase}
    .ss-command-title{max-width:760px;margin:0!important;color:#11100e;font-size:clamp(46px,5.3vw,72px)!important;font-weight:900!important;line-height:.96!important;letter-spacing:-.06em!important}
    .ss-command-sub{max-width:620px;margin:16px 0 0;color:#706b62;font-size:clamp(15px,1.45vw,18px);line-height:1.55}
    .ss-command-primary{width:min(100%,620px);display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;margin-top:28px;padding:18px 19px;border:1px solid #11100e;border-radius:20px;background:linear-gradient(135deg,#11100e 0%,#24211d 100%);color:#fff;text-decoration:none;box-shadow:0 18px 38px rgba(17,16,14,.2);transition:transform .2s ease,box-shadow .2s ease}
    .ss-command-primary:hover{transform:translateY(-3px);box-shadow:0 24px 48px rgba(17,16,14,.27)}
    .ss-command-primary__icon{width:46px;height:46px;display:flex!important;align-items:center!important;justify-content:center!important;flex:none;padding:0!important;border:1px solid rgba(227,204,140,.26);border-radius:14px;background:rgba(227,204,140,.1);color:#dfc47c;line-height:0}
    .ss-command-primary__icon svg{display:block;width:22px;height:22px;flex:none}
    .ss-command-primary > span:not(.ss-command-primary__icon){min-width:0;display:block}
    .ss-command-primary small,.ss-command-primary strong,.ss-command-primary em{display:block}
    .ss-command-primary small{margin-bottom:3px;color:#cdbb89;font-size:8.5px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}
    .ss-command-primary strong{font-size:16px;line-height:1.25}
    .ss-command-primary em{margin-top:3px;color:#aaa59c;font-size:10.5px;font-style:normal;line-height:1.35}
    .ss-command-primary__arrow{color:#dfc47c;font-size:23px;font-weight:500;transition:transform .2s ease}
    .ss-command-primary:hover .ss-command-primary__arrow{transform:translateX(3px)}
    .ss-command-quick{display:flex;flex-direction:column;justify-content:center;gap:12px;padding:clamp(28px,4vw,46px);border-left:1px solid rgba(17,16,14,.07);background:linear-gradient(155deg,#f7f3e9 0%,#fbfaf7 62%,#f4efe3 100%)}
    .ss-command-quick__label{margin:0 0 3px;color:#777168;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
    .ss-command-tile{display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:13px;padding:16px;border:1px solid rgba(17,16,14,.09);border-radius:18px;background:rgba(255,255,255,.86);color:#11100e;text-decoration:none;box-shadow:0 5px 18px rgba(17,16,14,.045);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease,background .2s ease}
    .ss-command-tile:hover{transform:translateY(-3px);border-color:rgba(184,157,87,.58);background:#fff;box-shadow:0 16px 30px rgba(17,16,14,.09)}
    .ss-command-tile__icon{width:44px;height:44px;display:flex!important;align-items:center!important;justify-content:center!important;flex:none;padding:0!important;border-radius:14px;background:#11100e;color:#d9c27f;line-height:0}
    .ss-command-tile__icon svg{display:block;width:20px;height:20px;flex:none}
    .ss-command-tile > span:not(.ss-command-tile__icon){min-width:0;display:block}
    .ss-command-tile strong,.ss-command-tile small{display:block}
    .ss-command-tile strong{font-size:13px;line-height:1.25}
    .ss-command-tile small{margin-top:4px;color:#777168;font-size:10px;line-height:1.4}
    .ss-command-tile__arrow{color:#9a8250;font-size:18px;transition:transform .2s ease}
    .ss-command-tile:hover .ss-command-tile__arrow{transform:translateX(3px)}
    .ss-command-foot{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 28px;border-top:1px solid rgba(17,16,14,.075);background:#fff;color:#7a756c;font-size:10.5px;line-height:1.45}
    .ss-command-foot a{color:#65552e;text-decoration:none;font-weight:900}.ss-command-foot a:hover{text-decoration:underline}
    @media(max-width:860px){
      .ss-member-enhanced .ss-member-hero{padding:14px 0 18px!important}
      .ss-member-enhanced .ss-member-hero .ss-wrap{padding-inline:12px!important}
      .ss-member-enhanced .ss-member-shell{border-radius:25px!important;box-shadow:0 18px 50px rgba(17,16,14,.1)!important}
      .ss-command-grid{grid-template-columns:1fr;min-height:0}
      .ss-command-main{padding:30px 24px 26px}
      .ss-command-title{font-size:clamp(38px,9vw,54px)!important}
      .ss-command-primary{margin-top:21px}
      .ss-command-quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:18px 24px 24px;border-top:1px solid rgba(17,16,14,.07);border-left:0}
      .ss-command-quick__label{grid-column:1/-1}
      .ss-command-tile{grid-template-columns:38px minmax(0,1fr) auto;padding:13px}
      .ss-command-tile__icon{width:38px;height:38px;border-radius:12px}
      .ss-command-tile__icon svg{width:18px;height:18px}
    }
    @media(max-width:560px){
      .ss-command-topbar{padding:16px 17px}
      .ss-command-brand em{display:none}
      .ss-command-status{font-size:9px}
      .ss-command-main{padding:25px 18px 21px}
      .ss-command-kicker{margin-bottom:8px;font-size:9px}
      .ss-command-title{font-size:clamp(35px,11.5vw,46px)!important;line-height:.98!important}
      .ss-command-sub{margin-top:12px;font-size:13px;line-height:1.48}
      .ss-command-primary{grid-template-columns:40px minmax(0,1fr) auto;gap:12px;margin-top:18px;padding:14px;border-radius:17px}
      .ss-command-primary__icon{width:40px;height:40px;border-radius:12px}
      .ss-command-primary__icon svg{width:20px;height:20px}
      .ss-command-primary strong{font-size:14px}
      .ss-command-primary em{font-size:9.5px}
      .ss-command-quick{grid-template-columns:1fr;padding:16px 18px 19px}
      .ss-command-quick__label{grid-column:auto}
      .ss-command-tile{min-height:66px}
      .ss-command-foot{align-items:flex-start;padding:13px 18px;font-size:9.5px}
    }
  `;

  const installRuntimeStyles = () => {
    let style = document.getElementById('ss-member-home-runtime-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'ss-member-home-runtime-styles';
      document.head.appendChild(style);
    }
    style.textContent = runtimeCss;
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

    installRuntimeStyles();

    const home = document.querySelector('.ss-home');
    const hero = home?.querySelector('.ss-member-hero');
    const shell = hero?.querySelector('.ss-member-shell');
    if (!home || !hero || !shell || shell.dataset.memberHomeReady === '2') return;

    shell.dataset.memberHomeReady = '2';
    home.classList.add('ss-member-enhanced');

    const hasStore = marker.dataset.hasStore === 'true';
    const requestUrl = marker.dataset.requestUrl || '/pages/storefront';
    const dashboardUrl = marker.dataset.dashboardUrl || '/pages/portal?stay=1';
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
      ? 'Manage every store, product, member, and order from one dashboard.'
      : 'Create your first store in minutes, then share one link and let everyone order directly.';

    const primary = document.createElement('a');
    primary.className = 'ss-command-primary';
    primary.href = hasStore ? dashboardUrl : requestUrl;
    primary.innerHTML = `
      <span class="ss-command-primary__icon" aria-hidden="true">${hasStore ? iconSvg.dashboard : iconSvg.plus}</span>
      <span>
        <small>${hasStore ? 'YOUR COMMAND CENTER' : 'FREE STORE SETUP'}</small>
        <strong>${hasStore ? 'Open my dashboard' : 'Create my first store'}</strong>
        <em>${hasStore ? 'Stores, products, members, and admin tools.' : 'No minimums, no deadlines, and no setup fee.'}</em>
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

    const foot = document.createElement('div');
    foot.className = 'ss-command-foot';
    const note = document.createElement('span');
    note.textContent = hasStore
      ? 'Everything stays organized in your dashboard—without turning this page into another dashboard.'
      : 'Store setup is always free. Your store stays open until you choose to remove it.';
    const support = document.createElement('a');
    support.href = supportUrl;
    support.textContent = 'Support & policies →';
    foot.append(note, support);

    shell.replaceChildren(topbar, grid, foot);
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
