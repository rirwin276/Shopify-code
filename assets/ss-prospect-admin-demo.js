/* Stella & Sage — unclaimed prospect admin preview. */
(function () {
  'use strict';

  var cfg = window.SSAP || {};
  if (!cfg.isProspectDemo) return;

  var handle = String(cfg.shopHandle || cfg.collectionHandle || '').trim().toLowerCase();
  var root = document.querySelector('.ap-wrap--prospect-demo');
  var claimUrl = cfg.joinLink || ('/pages/join-store?shop=' + encodeURIComponent(handle));
  var apiBase = '/apps/ss/relay/prospect/' + encodeURIComponent(handle);
  var buildWatchActive = false;
  var demo = window.SSProspectDemo = {
    ready: false,
    enabled: false,
    handle: handle,
    token: '',
    sessionId: '',
    state: null,
    claimUrl: claimUrl,
    record: record,
    refresh: bootstrap
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function claimLink(label, className) {
    return '<a href="' + escapeHtml(claimUrl) + '" class="' + (className || 'ap-demo-claim') +
      '" data-prospect-claim>' + escapeHtml(label || 'Claim Your Store') + '</a>';
  }

  // No claim button here on purpose. A prospect can meet four of these in one
  // sitting, and a fifth pitch on each one reads as nagging rather than as an
  // offer. The bar at the bottom of the preview makes the offer once.
  function locked(title, copy) {
    return '<div class="ap-demo-lock" role="status">' +
      '<div class="ap-demo-lock__icon" aria-hidden="true">&#128274;</div>' +
      '<h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(copy) + '</p></div>';
  }

  // One offer, always reachable, never repeated. It stays put while the
  // prospect moves between tabs, so no individual panel has to carry it.
  function installClaimBar() {
    if (document.getElementById('apDemoClaimBar')) return;
    var bar = document.createElement('div');
    bar.id = 'apDemoClaimBar';
    bar.className = 'ap-demo-bar';
    bar.innerHTML = '<p>You\'re previewing this store. Nothing here is live to your members yet.</p>' +
      claimLink('Claim this store', 'ap-demo-claim');
    document.body.appendChild(bar);
    document.body.classList.add('ap-demo-has-bar');
    bindClaimEvents();
  }

  function lockPanel(tabId, panelId, title, copy) {
    var tab = document.getElementById(tabId);
    var panel = document.getElementById(panelId);
    if (tab) {
      tab.classList.add('ap-demo-tab--locked');
      tab.setAttribute('data-prospect-locked', '1');
      tab.setAttribute('aria-label', title + ' — available after claim');
      var label = tab.querySelector('.ap-tab-label');
      if (label && label.textContent.indexOf('🔒') === -1) label.textContent += ' 🔒';
    }
    if (panel) panel.innerHTML = locked(title, copy);
  }

  function prepareShell() {
    if (root) root.classList.add('ap-prospect-demo--loading');

    // Each says what is behind it and stops. The reason they are locked is on
    // the bar, once, instead of on all four of these.
    lockPanel('apTabBtnProducts', 'apPanelProducts', 'Existing products',
      'Editing, hiding and deleting products are part of the full admin.');
    lockPanel('apTabBtnMembers', 'apPanelMembers', 'Members',
      'Inviting members and adding administrators are part of the full admin.');
    lockPanel('apTabBtnDanger', 'apPanelDanger', 'Store controls',
      'Sleep, deletion and ownership belong to a verified store administrator.');

    var settings = document.getElementById('apPanelSettings');
    if (settings) {
      Array.prototype.slice.call(settings.children).forEach(function (child) {
        if (!child.matches('[data-sfs-root]')) child.remove();
      });
      var appearance = settings.querySelector('[data-sfs-root]');
      var intro = document.createElement('div');
      intro.className = 'ap-demo-settings-intro';
      intro.innerHTML = '<span>Store Customizer</span><h2>Make this storefront yours</h2>' +
        '<p>These are the real appearance controls. Change anything you like.</p>';
      settings.insertBefore(intro, settings.firstChild);
      if (!appearance) {
        var wait = document.createElement('div');
        wait.className = 'ap-demo-appearance-wait';
        wait.textContent = 'Loading the Store Customizer…';
        settings.appendChild(wait);
      }
      settings.insertAdjacentHTML('beforeend', locked('Store identity and fundraising',
        'Renaming, artwork and fundraising are part of the full admin.'));
    }

    ['apBtnShareStore', 'apFrZone'].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.style.display = 'none';
    });
    document.querySelectorAll('.ap-hero-actions a').forEach(function (link) {
      if ((link.getAttribute('href') || '').indexOf('/collections/') !== 0) link.style.display = 'none';
    });

    activateTab('apTabBtnAddProducts', 'apPanelAddProducts');
    var addPanel = document.getElementById('apPanelAddProducts');
    if (addPanel) addPanel.classList.add('ap-demo-products--waiting');
  }

  function activateTab(tabId, panelId) {
    document.querySelectorAll('.ap-main-tab-btn').forEach(function (tab) {
      var active = tab.id === tabId;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.ap-main-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === panelId);
    });
  }

  function showUnavailable(message) {
    var panel = document.getElementById('apPanelAddProducts');
    if (!panel) return;
    panel.classList.remove('ap-demo-products--waiting');
    panel.innerHTML = locked('The admin preview is unavailable', message || 'Claim this store to continue.');
  }

  function showProductState(state) {
    var panel = document.getElementById('apPanelAddProducts');
    if (!panel) return;
    panel.classList.remove('ap-demo-products--waiting');
    var status = String(state.product_status || 'available');
    var existing = panel.querySelector('[data-demo-product-state]');
    if (status === 'available') {
      if (existing) existing.remove();
      return;
    }

    var productUrl = state.product_handle
      ? '/products/' + encodeURIComponent(state.product_handle) + '?preview=1&demo_product=1'
      : '/collections/' + encodeURIComponent(handle) + '?preview=1';
    var banner = existing || document.createElement('div');
    banner.setAttribute('data-demo-product-state', '');
    banner.className = 'ap-demo-complete';
    // The banner reports what happened. The offer to claim lives on the bar,
    // which is already on screen, so repeating it here was the same pitch
    // twice in one viewport.
    if (status === 'completed') {
      banner.innerHTML = '<span class="ap-demo-complete__check">&#10003;</span>' +
        '<div><h2>Your product is live</h2><p>Keep opening the builders to try artwork, colors and placement.</p></div>' +
        '<div class="ap-demo-complete__actions"><a class="ap-demo-live" href="' + escapeHtml(productUrl) + '">View live product</a></div>';
    } else {
      banner.innerHTML = '<span class="ap-demo-complete__check ap-demo-complete__check--working">&#8230;</span>' +
        '<div><h2>Your product is building</h2><p>This takes a few minutes. You can keep exploring the other builders while it finishes.</p></div>' +
        '<div class="ap-demo-complete__actions"><button type="button" class="ap-demo-live" data-demo-refresh>Refresh status</button></div>';
    }
    if (!existing) panel.insertBefore(banner, panel.firstChild);
    if (status !== 'completed') {
      var refresh = banner.querySelector('[data-demo-refresh]');
      if (refresh) refresh.addEventListener('click', bootstrap);
    }
    bindClaimEvents();
  }

  function bindClaimEvents() {
    document.querySelectorAll('[data-prospect-claim]').forEach(function (link) {
      if (link.dataset.prospectClaimReady === '1') return;
      link.dataset.prospectClaimReady = '1';
      link.addEventListener('click', function () { record('authentication_started'); });
    });
  }

  function record(eventName, details) {
    if (!demo.token || !eventName) return Promise.resolve(false);
    return fetch(apiBase + '/event', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({demo_token: demo.token, event: eventName, details: details || {}}),
      keepalive: eventName === 'authentication_started'
    }).then(function (response) { return response.ok; }).catch(function () { return false; });
  }

  function bootstrap() {
    return fetch(apiBase + '/state', {cache: 'no-store'})
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          if (!response.ok) throw new Error(body.error || ('HTTP ' + response.status));
          return body;
        });
      })
      .then(function (state) {
        demo.ready = true;
        demo.enabled = state.enabled === true;
        demo.state = state;
        demo.token = String(state.demo_token || '');
        demo.sessionId = String(state.session_id || '');
        if (!demo.enabled || !demo.token) {
          showUnavailable('This store has already been claimed or its preview has expired.');
          return;
        }
        if (root) root.classList.remove('ap-prospect-demo--loading');
        showProductState(state);
        bindClaimEvents();
        record('admin_demo_opened');
        record('add_product_opened');
        document.dispatchEvent(new CustomEvent('ss:prospect-demo-ready', {detail: state}));
      })
      .catch(function (error) {
        demo.ready = true;
        showUnavailable(error.message || 'The preview could not be loaded.');
      });
  }

  function watchDemoBuild() {
    if (buildWatchActive) return;
    buildWatchActive = true;
    activateTab('apTabBtnAddProducts', 'apPanelAddProducts');
    showProductState({product_status: 'reserved'});
    var startedAt = Date.now();
    var timer = window.setInterval(function () {
      if (Date.now() - startedAt > 10 * 60 * 1000) {
        window.clearInterval(timer);
        buildWatchActive = false;
        return;
      }
      fetch(apiBase + '/state', {cache: 'no-store'})
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (state) {
          if (!state) return;
          if (state.demo_token) demo.token = String(state.demo_token);
          demo.state = state;
          showProductState(state);
          if (state.product_status === 'completed') {
            window.clearInterval(timer);
            buildWatchActive = false;
            var destination = state.product_handle
              ? '/products/' + encodeURIComponent(state.product_handle) + '?preview=1&demo_product=1'
              : '/collections/' + encodeURIComponent(handle) + '?preview=1&demo_product=1';
            window.setTimeout(function () { window.location.href = destination; }, 900);
          } else if (state.product_status === 'available') {
            window.clearInterval(timer);
            buildWatchActive = false;
            if (state.product_status === 'available') {
              showDemoMessage('The product build did not finish. Your one demo build is available to try again.');
            }
          }
        })
        .catch(function () {});
    }, 5000);
  }

  function showDemoMessage(message) {
    var status = document.getElementById('apStatusAddProducts');
    if (status) {
      status.textContent = message;
      status.className = 'ap-status err';
    }
  }

  window.addEventListener('message', function (event) {
    var data = event && event.data;
    if (!data || typeof data !== 'object') return;
    try {
      var expectedOrigin = new URL(cfg.editorBaseUrl || '').origin;
      if (expectedOrigin && event.origin !== expectedOrigin) return;
    } catch (_error) { return; }
    if (/^[a-z0-9_]+_placement_saved$/.test(String(data.type || ''))) watchDemoBuild();
  });

  function installStyles() {
    var style = document.createElement('style');
    style.id = 'ss-prospect-admin-demo-css';
    style.textContent =
      '.ap-prospect-demo-notice{margin:0 0 18px;padding:14px 18px;border:1px solid rgba(183,163,106,.5);border-radius:14px;background:#fff8dc;color:#292313;font-size:14px;line-height:1.55}' +
      '.ap-demo-tab--locked{opacity:.7}.ap-demo-lock{text-align:center;padding:40px 22px;border:1px solid rgba(17,16,14,.1);border-radius:18px;background:#faf9f6}' +
      '.ap-demo-lock__icon{font-size:26px;opacity:.55}.ap-demo-lock h3{margin:8px 0 5px;font-size:17px}.ap-demo-lock p{max-width:520px;margin:0 auto;color:#68645c;line-height:1.55}' +
      '.ap-demo-bar{position:fixed;left:0;right:0;bottom:0;z-index:900;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;' +
      'padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);backdrop-filter:saturate(160%) blur(12px);' +
      'border-top:1px solid rgba(17,16,14,.12);box-shadow:0 -6px 24px rgba(17,16,14,.07)}' +
      '.ap-demo-bar p{margin:0;color:#68645c;font-size:13px;line-height:1.4;text-align:center}' +
      'body.ap-demo-has-bar{padding-bottom:96px}' +
      '.ap-demo-claim,.ap-demo-live{display:inline-flex;align-items:center;justify-content:center;padding:11px 18px;border-radius:999px;background:#11100e;color:#fff!important;text-decoration:none;font-weight:750;border:0;cursor:pointer}' +
      '.ap-demo-live{background:#d7c17a;color:#17150f!important}.ap-demo-settings-intro{margin-bottom:18px}.ap-demo-settings-intro>span{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a7335}.ap-demo-settings-intro h2{margin:5px 0}.ap-demo-settings-intro p{margin:0;color:#68645c}' +
      '.ap-demo-products--waiting #apCustomBuildersContainer,.ap-demo-products--waiting .ss-cat{pointer-events:none;opacity:.48}.ap-demo-products--waiting:after{content:"Securing your one-product preview…";display:block;text-align:center;padding:14px;color:#68645c;font-weight:700}' +
      '.ap-demo-complete{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;text-align:left;margin:0 0 18px;padding:18px;border:1px solid rgba(183,163,106,.34);border-radius:18px;background:#fffaf0}.ap-demo-complete__check{display:inline-flex;width:46px;height:46px;border-radius:50%;align-items:center;justify-content:center;background:#daf5e5;color:#14753b;font-size:25px;font-weight:900}.ap-demo-complete__check--working{background:#f4e7b8;color:#594917}.ap-demo-complete h2{margin:0 0 5px;font-size:18px}.ap-demo-complete p{max-width:680px;margin:0;color:#68645c;line-height:1.5}.ap-demo-complete__actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}' +
      '@media(max-width:700px){.ap-demo-lock{padding:28px 16px}.ap-demo-complete{grid-template-columns:1fr;text-align:center;padding:22px 14px}.ap-demo-complete__check{margin:0 auto}.ap-demo-complete__actions{justify-content:center}.ap-demo-complete__actions>*{width:100%}' +
      '.ap-demo-bar{gap:9px;padding:10px 14px calc(10px + env(safe-area-inset-bottom))}.ap-demo-bar p{font-size:12px;flex:1 1 100%}.ap-demo-bar .ap-demo-claim{width:100%}body.ap-demo-has-bar{padding-bottom:132px}}';
    document.head.appendChild(style);
  }

  installStyles();
  prepareShell();
  installClaimBar();
  bindClaimEvents();
  bootstrap();
})();
