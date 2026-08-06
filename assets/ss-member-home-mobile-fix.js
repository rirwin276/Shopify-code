/* Final runtime polish for the signed-in member home card.
 * Loaded after ss-member-home.js so it can correct the generated DOM and
 * injected runtime styles without depending on theme stylesheet order.
 */
(() => {
  'use strict';

  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    orders: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v16l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 8h8M8 12h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2 1-1.2 1.8M12 17h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };

  const installStyles = () => {
    let style = document.getElementById('ss-member-home-mobile-final-fix');
    if (!style) {
      style = document.createElement('style');
      style.id = 'ss-member-home-mobile-final-fix';
      document.head.appendChild(style);
    }

    style.textContent = `
      .ss-command-primary > .ss-command-primary__icon,
      .ss-command-tile > .ss-command-tile__icon {
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:0!important;
        line-height:0!important;
        text-align:center!important;
        overflow:hidden!important;
      }

      .ss-command-primary > .ss-command-primary__icon svg,
      .ss-command-tile > .ss-command-tile__icon svg {
        display:block!important;
        width:21px!important;
        height:21px!important;
        margin:0!important;
        flex:none!important;
      }

      .ss-command-tile > .ss-command-tile__icon svg {
        width:19px!important;
        height:19px!important;
      }

      @media(max-width:560px) {
        .ss-member-enhanced .ss-member-hero {
          padding:10px 0 16px!important;
        }

        .ss-member-enhanced .ss-member-hero .ss-wrap {
          width:100%!important;
          max-width:none!important;
          padding-left:8px!important;
          padding-right:8px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          box-sizing:border-box!important;
        }

        .ss-member-enhanced .ss-member-shell {
          width:100%!important;
          max-width:none!important;
          margin:0!important;
          border-radius:20px!important;
          box-shadow:0 16px 42px rgba(17,16,14,.10)!important;
        }

        .ss-command-topbar {
          padding:15px 18px!important;
        }

        .ss-command-main {
          padding:24px 18px 21px!important;
        }

        .ss-command-quick {
          padding:16px 18px 19px!important;
        }

        .ss-command-foot {
          display:grid!important;
          grid-template-columns:minmax(0,1fr) auto!important;
          align-items:start!important;
          gap:14px!important;
          padding:14px 18px 16px!important;
        }

        .ss-command-foot a {
          white-space:nowrap!important;
        }
      }
    `;
  };

  const replaceIcons = () => {
    const primary = document.querySelector('.ss-command-primary__icon');
    if (primary) primary.innerHTML = icons.dashboard;

    document.querySelectorAll('.ss-command-tile').forEach((tile) => {
      const icon = tile.querySelector('.ss-command-tile__icon');
      const title = tile.querySelector('strong')?.textContent?.trim().toLowerCase() || '';
      if (!icon) return;

      if (title.includes('create')) icon.innerHTML = icons.plus;
      else if (title.includes('order')) icon.innerHTML = icons.orders;
      else icon.innerHTML = icons.help;
    });
  };

  const apply = () => {
    installStyles();
    replaceIcons();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }

  // ss-member-home.js builds the card after DOMContentLoaded. Watch briefly so
  // this fix still applies even when script execution order changes.
  const observer = new MutationObserver(() => {
    if (document.querySelector('.ss-command-primary__icon')) apply();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 5000);
})();
