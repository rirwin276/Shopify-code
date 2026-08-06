/* Stella & Sage signed-in homepage.
 * Compact, polished, and action-first for both store owners and customers who
 * have not created a store yet.
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

  const installFallbackStyles = () => {
    if (document.getElementById('ss-member-home-runtime-styles')) return;
    const style = document.createElement('style');
    style.id = 'ss-member-home-runtime-styles';
    style.textContent = `
      .ss-member-control-section{display:none!important}
      .ss-member-enhanced .ss-member-hero{min-height:0!important;padding:clamp(28px,4vw,54px) 0 clamp(24px,3vw,42px)!important}
      .ss-member-enhanced .ss-member-hero .ss-wrap{max-width:1120px!important;padding-inline:clamp(16px,3vw,28px)!important}
      .ss-member-enhanced .ss-member-shell{position:relative;min-height:0!important;height:auto!important;max-width:1040px!important;margin:0 auto!important;padding:clamp(30px,4vw,48px)!important;overflow:hidden;border:1px solid rgba(17,16,14,.07)!important;border-radius:32px!important;background:rgba(255,255,255,.9)!important;box-shadow:0 22px 70px rgba(17,16,14,.09)!important;backdrop-filter:blur(14px)}
      .ss-member-enhanced .ss-member-shell:after{content:"";position:absolute;z-index:0;top:-130px;right:-110px;width:330px;height:330px;border-radius:50%;background:radial-gradient(circle,rgba(194,170,99,.16),rgba(194,170,99,0) 70%);pointer-events:none}
      .ss-member-enhanced .ss-member-shell>*{position:relative;z-index:1}
      .ss-member-enhanced .ss-eyebrow{margin:0!important;font-size:11px!important;letter-spacing:.17em!important}
      .ss-member-enhanced .ss-member-title{max-width:900px;margin:14px 0 12px!important;font-size:clamp(48px,5vw,68px)!important;line-height:.98!important;letter-spacing:-.055em!important}
      .ss-member-enhanced .ss-member-sub{max-width:720px;margin:0!important;color:#6d6961!important;font-size:clamp(15px,1.5vw,19px)!important;line-height:1.55!important}
      .ss-member-enhanced .ss-action-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:11px!important;width:100%!important;max-width:760px!important;margin:24px 0 0!important}
      .ss-member-enhanced .ss-action-row .ss-pill{min-height:52px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;margin:0!important;padding:13px 18px!important;border:1px solid rgba(17,16,14,.13)!important;border-radius:15px!important;background:rgba(255,255,255,.88)!important;color:#11100e!important;box-shadow:0 4px 16px rgba(17,16,14,.035)!important;text-align:left!important;text-decoration:none!important;font-size:13px!important;font-weight:850!important;line-height:1.2!important;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease}
      .ss-member-enhanced .ss-action-row .ss-pill:hover{transform:translateY(-2px);border-color:rgba(184,158,83,.65)!important;background:#fff!important;box-shadow:0 12px 26px rgba(17,16,14,.08)!important}
      .ss-member-enhanced .ss-member-action__arrow{flex:0 0 auto;color:#9a8250;font-size:16px;font-weight:900;transition:transform .18s ease}
      .ss-member-enhanced .ss-pill:hover .ss-member-action__arrow{transform:translateX(2px)}
      .ss-member-enhanced .ss-action-row .ss-member-action--primary{border-color:#11100e!important;background:#11100e!important;color:#fff!important;box-shadow:0 12px 28px rgba(17,16,14,.16)!important}
      .ss-member-enhanced .ss-action-row .ss-member-action--primary:hover{border-color:#11100e!important;background:#272521!important;box-shadow:0 16px 34px rgba(17,16,14,.22)!important}
      .ss-member-enhanced .ss-member-action--primary .ss-member-action__arrow{color:#d4bd7d}
      .ss-member-enhanced .ss-member-foot{max-width:760px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:19px;padding-top:17px;border-top:1px solid rgba(17,16,14,.08);color:#7c776e;font-size:11.5px;line-height:1.45}
      .ss-member-enhanced .ss-member-foot a{flex:0 0 auto;color:#5e512f;text-decoration:none;font-weight:850}.ss-member-enhanced .ss-member-foot a:hover{text-decoration:underline}
      @media(max-width:760px){.ss-member-enhanced .ss-member-hero{padding:14px 0 16px!important}.ss-member-enhanced .ss-member-hero .ss-wrap{padding-inline:12px!important}.ss-member-enhanced .ss-member-shell{padding:23px 18px!important;border-radius:23px!important;box-shadow:0 14px 40px rgba(17,16,14,.08)!important}.ss-member-enhanced .ss-member-shell:after{top:-150px;right:-160px}.ss-member-enhanced .ss-eyebrow{font-size:9.5px!important}.ss-member-enhanced .ss-member-title{margin:10px 0 9px!important;font-size:clamp(35px,10.8vw,46px)!important;line-height:1!important}.ss-member-enhanced .ss-member-sub{font-size:13.5px!important;line-height:1.48!important}.ss-member-enhanced .ss-action-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-top:17px!important}.ss-member-enhanced .ss-member-action--primary{grid-column:1/-1}.ss-member-enhanced .ss-action-row .ss-pill{min-height:45px!important;padding:10px 12px!important;border-radius:13px!important;font-size:11.5px!important}.ss-member-enhanced .ss-member-foot{align-items:flex-start;margin-top:14px;padding-top:13px;font-size:10.5px}}
      @media(max-width:390px){.ss-member-enhanced .ss-member-shell{padding:20px 14px!important}.ss-member-enhanced .ss-member-title{font-size:34px!important}.ss-member-enhanced .ss-action-row{grid-template-columns:1fr!important}.ss-member-enhanced .ss-member-action--primary{grid-column:auto}.ss-member-enhanced .ss-member-foot{flex-direction:column;gap:7px}}
    `;
    document.head.appendChild(style);
  };

  onReady(() => {
    const marker = document.querySelector('[data-ss-member-home-control]');
    if (!marker) return;

    installFallbackStyles();

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

    const title = shell.querySelector('.ss-member-title');
    if (title) {
      title.textContent = String(title.textContent || '')
        .replace(/,\s*/g, ', ')
        .replace(/\s+\./g, '.')
        .trim();
    }

    const subtitle = shell.querySelector('.ss-member-sub');
    if (subtitle) {
      subtitle.textContent = hasStore
        ? 'Open your dashboard, check an order, or create another store.'
        : 'Your account is ready. Create your first store, review your orders, or get help.';
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

      const label = document.createElement('span');
      label.textContent = action.label;
      const arrow = document.createElement('span');
      arrow.className = 'ss-member-action__arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      link.append(label, arrow);
      return link;
    }));

    const existingFoot = shell.querySelector('.ss-member-foot');
    if (existingFoot) existingFoot.remove();

    const foot = document.createElement('div');
    foot.className = 'ss-member-foot';
    const note = document.createElement('span');
    note.textContent = hasStore
      ? 'All of your stores, products, members, and admin tools stay together in your dashboard.'
      : 'Store setup is free, with no minimum orders and no closing dates.';
    const help = document.createElement('a');
    help.href = supportUrl;
    help.textContent = 'Need help?';
    foot.append(note, help);
    actionRow.insertAdjacentElement('afterend', foot);

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
