(function () {
  'use strict';
  if (window.__ssSessionTracker) return;
  window.__ssSessionTracker = true;
  var key = 'ss-site-session-v2', ownerKey = 'ss-analytics-exclude', idle = 1800000;
  var state, page, pending = false, lastInput = Date.now(), tickAt = Date.now(), dirty = true;
  function read() { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) {} }
  function id() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); }
  function excluded() {
    try {
      if (window.SS_SESSION_OWNER) localStorage.setItem(ownerKey, '1');
      return window.SS_SESSION_OWNER || localStorage.getItem(ownerKey) === '1';
    } catch (_) { return !!window.SS_SESSION_OWNER; }
  }
  function allowed() {
    if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return false;
    var privacy = window.Shopify && Shopify.customerPrivacy;
    return !privacy || typeof privacy.analyticsProcessingAllowed !== 'function' || privacy.analyticsProcessingAllowed();
  }
  function start() {
    state = read();
    if (!state || !state.id || Date.now() - state.last_input > idle) state = { id: id(), pages: [], last_input: Date.now() };
    page = { id: id(), path: location.pathname, active_seconds: 0, events: ['page_view'] };
    var marker = document.querySelector('[data-storefront-activity-tracker]');
    if (marker) page.store_handle = marker.getAttribute('data-storefront-activity-tracker');
    state.pages.push(page);
    state.pages = state.pages.slice(-60);
    state.last_input = Date.now();
    save();
  }
  function sync() {
    var stored = read();
    if (stored && stored.id === state.id) {
      var map = new Map(stored.pages.map(function(p) { return [p.id, p]; }));
      state.pages.forEach(function(p) { if (!map.has(p.id)) map.set(p.id, p); });
      map.set(page.id, page);
      state.pages = Array.from(map.values()).slice(-60);
      state.last_input = Math.max(state.last_input, stored.last_input || 0);
    }
    save();
  }
  function event(name) {
    if (page.events.indexOf(name) === -1) { page.events.push(name); dirty = true; sync(); }
  }
  function accountTime() {
    var now = Date.now();
    if (!document.hidden && now - lastInput < 60000) {
      page.active_seconds += Math.min(5, (now - tickAt) / 1000);
      dirty = true;
    }
    tickAt = now;
  }
  function send(leaving) {
    if (!allowed() || !dirty || (pending && !leaving)) return;
    sync();
    var payload = { session_id: state.id, pages: state.pages, exclude: excluded(), automated: !!navigator.webdriver,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '' };
    // The page is only an exclusion marker on an owner's remembered browser.
    if (payload.exclude) payload.pages = [];
    pending = true;
    dirty = false;
    fetch('/apps/ss/relay/activity/session', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), keepalive: true, credentials: 'same-origin' })
      .then(function(r) { if (!r.ok) dirty = true; })
      .catch(function() { dirty = true; }).finally(function() { pending = false; });
  }
  start();
  window.ssJourneyEvent = event;
  (window.ssJourneyQueue || []).forEach(event);
  window.ssJourneyQueue = [];
  if (document.querySelector('[data-storefront-request-form]')) event('create_opened');
  document.addEventListener('input', function(e) {
    if (e.target.closest('#sf-request-form')) event('create_started');
  }, { passive: true });
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (link && /\/account\/login|\/customer_authentication/.test(link.getAttribute('href'))) event('sign_in_clicked');
  }, { passive: true });
  ['pointerdown', 'keydown', 'scroll'].forEach(function(name) {
    document.addEventListener(name, function() {
      if (Date.now() - lastInput > idle) start();
      lastInput = state.last_input = Date.now();
    }, { passive: true });
  });
  function schedule() {
    if ('requestIdleCallback' in window) requestIdleCallback(function() { send(false); }, { timeout: 1500 });
    else setTimeout(function() { send(false); }, 500);
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  if (!excluded()) {
    setInterval(accountTime, 5000);
    setInterval(function() { if (!document.hidden && Date.now() - lastInput < 60000) send(false); }, 30000);
    window.addEventListener('pagehide', function() { accountTime(); send(true); });
    document.addEventListener('visibilitychange', function() { if (document.hidden) send(true); tickAt = Date.now(); });
    document.addEventListener('visitorConsentCollected', schedule);
  }
})();
