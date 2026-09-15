/* Command Center: one small directory request; panels load only on demand. */
'use strict';
var ccView = 'stores', ccIndexBusy = false, ccIndexTimer, ccPolls = 0, ccSessionGeneration = 0;
var ccCards = new Map(), ccDetailsPending = new Map(), ccDetailsTimes = {}, ccSessionRows = [];
var ccSessionLimit = 50, ccSessionHandle = '', ccFocusReturn = null;
GM_STATE.details = {};

function ccRequest(path) {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 20000);
  return fetch(RAILWAY_URL + '/admin/command-center/' + path, {
    headers: railwayHeaders(), credentials: 'same-origin', cache: 'no-store', signal: controller.signal
  }).then(function(response) {
    return response.json().then(function(data) {
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not load this view');
      return data;
    });
  }).finally(function() { clearTimeout(timer); });
}

function ccDate(value) { return value ? formatDate(value) : 'No activity recorded'; }
function ccDuration(value) {
  var seconds = Math.max(0, Math.round(Number(value) || 0));
  return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
}

function ensureStoreCard(store) {
  var card = ccCards.get(store.handle);
  if (!card) {
    card = document.createElement('article');
    card.className = 'gm-store-card';
    ccCards.set(store.handle, card);
  }
  var status = ['closed', 'sleeping', 'waking'].includes(store.status) ? store.status : 'active';
  var grid = document.getElementById(status === 'closed' ? 'closedStoreGrid' : 'activeStoreGrid');
  if (card.parentElement !== grid) grid.appendChild(card);
  var sales = store.sales || {}, customers = store.customers || {}, activity = store.activity || {};
  var decision = store.decision || {}, products = store.products || {};
  var attrs = {name: (store.name || store.handle).toLowerCase(), handle: store.handle, collection: store.collection_handle || store.handle,
    'store-name': store.name || store.handle, status: status, products: products.total == null ? 'unknown' : products.total,
    'order-count': sales.order_count == null ? 'unknown' : sales.order_count,
    'member-count': customers.shopper_count == null ? 'unknown' : customers.shopper_count,
    'session-count': activity.non_super_admin_sessions == null ? 'unknown' : activity.non_super_admin_sessions,
    'age-days': decision.age_days == null ? 'unknown' : decision.age_days, 'created-at': store.created_at || '',
    engagement: Date.parse(store.last_engagement_at) || 0, 'gross-sales': sales.gross_sales == null ? 'unknown' : sales.gross_sales,
    'needs-attention': !!decision.needs_attention, 'review-candidate': !!decision.review_candidate, 'tracking-started': !!activity.tracking_started_at};
  Object.keys(attrs).forEach(function(k) { card.setAttribute('data-' + k, String(attrs[k])); });
  var visits = activity.last_authenticated_customer_activity || activity.last_non_super_admin_session;
  var product = products.newest_product, purchase = sales.last_purchase;
  var ready = !!store.observability;
  function dateOrPending(value) { return ready ? ccDate(value) : 'Awaiting activity snapshot'; }
  card.innerHTML = '<div class="gm-store-top"><h3 class="gm-store-name"><button type="button" data-open-manage>' + escapeHtml(store.name || store.handle)
    + '</button></h3><span class="gm-badge ' + status + '">' + escapeHtml(status) + '</span></div>'
    + '<div class="gm-compact-activity"><div><span>' + (activity.last_authenticated_customer_activity ? 'Signed-in visit' : 'Last visitor') + '</span><strong>' + escapeHtml((store.observability || {}).sessions === false ? 'Unavailable / partial' : dateOrPending(visits && visits.at)) + '</strong></div>'
    + '<div><span>Product built</span><strong>' + escapeHtml((store.observability || {}).products === false ? 'Unavailable' : dateOrPending(product && product.created_at)) + '</strong></div>'
    + '<div><span>Purchase</span><strong>' + escapeHtml(sales.observable === false ? 'Unavailable' : dateOrPending(purchase && purchase.created_at)) + '</strong></div></div>'
    + '<div class="gm-card-actions"><button class="gm-btn gm-btn-primary" type="button" data-open-manage>Details</button>'
    + '<a class="gm-btn" href="/pages/admin-powers?shop=' + encodeURIComponent(store.handle) + '">Admin</a>'
    + '<a class="gm-btn" href="/collections/' + encodeURIComponent(store.collection_handle || store.handle) + '">Visit</a></div>';
}

function loadCommandCenterSummary(force) {
  if (ccIndexBusy) return;
  clearTimeout(ccIndexTimer);
  if (force) ccPolls = 0;
  ccIndexBusy = true;
  var refresh = document.getElementById('ccRefresh');
  refresh.disabled = true;
  document.getElementById('ccStatus').textContent = 'Loading stores…';
  ccRequest('index' + (force ? '?refresh=1' : '')).then(function(data) {
    GM_STATE.dataQuality = data.data_quality || {};
    GM_STATE.metricsLoaded = data.metrics_ready;
    var live = new Set(), statuses = {active: 0, closed: 0, sleeping: 0, waking: 0};
    data.stores.forEach(function(store) {
      live.add(store.handle);
      GM_STATE.summaryByHandle[store.handle] = store;
      ensureStoreCard(store);
      statuses[Object.hasOwn(statuses, store.status) ? store.status : 'active']++;
    });
    ccCards.forEach(function(card, handle) { if (!live.has(handle)) { card.remove(); ccCards.delete(handle); delete GM_STATE.summaryByHandle[handle]; } });
    window.GM_ALL_STORES = data.stores;
    document.getElementById('totalStoresHeader').textContent = data.stores.length + ' stores';
    document.getElementById('statusTotal').textContent = data.stores.length;
    Object.keys(statuses).forEach(function(k) { document.getElementById('status' + k[0].toUpperCase() + k.slice(1)).textContent = statuses[k]; });
    GM_STATE.closedCount = statuses.closed;
    document.getElementById('toggleGraveyard').textContent = (document.getElementById('graveyardContent').hidden ? 'Show' : 'Hide') + ' Closed Stores (' + statuses.closed + ')';
    var h = data.highlights || {}, signedIn = null;
    data.stores.forEach(function(store) {
      var visit = (store.activity || {}).last_authenticated_customer_activity;
      if (visit && (!signedIn || visit.at > signedIn.at)) signedIn = Object.assign({store_name:store.name}, visit);
    });
    var displays = {
      highlightNewestStore: h.newest_store && [h.newest_store.name, ccDate(h.newest_store.created_at)].join(' · '),
      highlightNewestProduct: h.newest_product && [h.newest_product.title, h.newest_product.store_name, ccDate(h.newest_product.created_at)].join(' · '),
      highlightLatestSale: h.latest_purchase && [(h.latest_purchase.product_titles || []).join(', ') || h.latest_purchase.order_name, ccDate(h.latest_purchase.created_at)].join(' · '),
      highlightLatestVisit: signedIn && [signedIn.store_name, ccDate(signedIn.at)].join(' · ')
    };
    var qualityMap = {highlightNewestStore:'store_age',highlightNewestProduct:'products',highlightLatestSale:'sales',highlightLatestVisit:'sessions'};
    Object.keys(displays).forEach(function(k) { document.getElementById(k).textContent = displays[k] || ((data.data_quality || {})[qualityMap[k]] ? 'Unavailable / partial' : (data.metrics_ready ? 'No activity recorded' : 'Snapshot loading…')); });
    document.getElementById('latestChangesCard').setAttribute('aria-busy', String(!data.metrics_ready));
    var status = data.generated_at ? 'Snapshot: ' + formatDate(data.generated_at) + '.' : 'Store directory ready. First activity snapshot is building.';
    if (data.refreshing) status += ' Updating activity in the background.';
    else if (data.refresh_failed) status += ' Activity refresh failed; use Refresh to retry.';
    else if (data.stale) status += ' Activity snapshot is stale.';
    if (Object.keys(data.data_quality || {}).length) status += ' Some metrics are incomplete; details show availability.';
    document.getElementById('ccStatus').textContent = status;
    renderNewStoreBanner();
    applyStoreFilters();
    if (data.refreshing && ccPolls++ < 12 && ccView === 'stores') ccIndexTimer = setTimeout(function() { if (!document.hidden) loadCommandCenterSummary(false); }, 5000);
  }).catch(function(err) {
    document.getElementById('ccStatus').textContent = 'Could not refresh stores. ' + err.message + '. Use Refresh to retry.';
  }).finally(function() { ccIndexBusy = false; refresh.disabled = false; });
}

function loadStoreDetails(handle, retry) {
  if (ccDetailsPending.has(handle)) return ccDetailsPending.get(handle);
  if (!retry && GM_STATE.details[handle] && Date.now() - ccDetailsTimes[handle] < 60000) return;
  var current = function() { return GM_STATE.currentStore && GM_STATE.currentStore.handle === handle; };
  var promise = ccRequest('store/' + encodeURIComponent(handle)).then(function(data) {
    if (data.pending) {
      if (current()) document.getElementById('manageCoverage').textContent = 'Activity snapshot is still building. You can already use Admin or Visit.';
      if ((retry || 0) < 12) setTimeout(function() { if (current() && document.getElementById('manageSheet').classList.contains('show')) loadStoreDetails(handle, (retry || 0) + 1); }, 5000);
      return;
    }
    GM_STATE.details[handle] = data.store;
    ccDetailsTimes[handle] = Date.now();
    if (current()) {
      renderManageStats(data.store);
      document.getElementById('manageCoverage').textContent += ' Snapshot: ' + formatDate(data.generated_at) + (data.stale ? ' (updating).' : '.');
    }
  }).catch(function(err) { if (current()) document.getElementById('manageCoverage').textContent = err.message + '. Close and reopen to retry.'; })
    .finally(function() { ccDetailsPending.delete(handle); });
  ccDetailsPending.set(handle, promise);
  return promise;
}

function loadPerformance() {
  var button = document.getElementById('refreshMetricsBtn');
  if (button.disabled) return;
  button.disabled = true;
  document.getElementById('metricsCoverage').textContent = 'Loading performance…';
  ccRequest('report').then(function(data) {
    if (data.pending) { document.getElementById('metricsCoverage').textContent = 'First snapshot is building. Refresh this panel shortly.'; return; }
    var t = data.totals || {};
    var fields = {totalStoreCount:t.stores, totalGrossSales:t.sales_observable === false ? 'Unavailable' : formatMoney(t.gross_sales,t.currency),
      totalPaidOrders:t.sales_observable === false ? 'Unavailable' : t.paid_orders,
      totalTaggedCustomers:t.customers_observable === false ? 'Unavailable' : t.unique_tagged_customers,
      totalShoppers:t.customers_observable === false ? 'Unavailable' : t.unique_shoppers,
      totalTrackedSessions:t.sessions_observable === false ? 'Partial / unavailable' : t.non_super_admin_sessions,
      totalProducts:t.products_observable === false ? 'Unavailable' : t.products, totalNeedsAttention:t.needs_attention};
    Object.keys(fields).forEach(function(k) { document.getElementById(k).textContent = fields[k] == null ? '—' : fields[k]; });
    document.getElementById('metricsCoverage').textContent = coverageLabel(t.sales_coverage) + ' Snapshot: ' + formatDate(data.generated_at) + (data.stale ? ' (updating).' : '.');
    document.getElementById('adminCoverage').textContent = 'Platform admins: ' + t.platform_admins + ' · Store-admin assignments: ' + t.store_admin_memberships;
    var q = document.getElementById('metricsQuality');
    q.style.display = Object.keys(data.data_quality || {}).length ? 'block' : 'none';
    q.textContent = Object.values(data.data_quality || {}).join(' · ');
  }).catch(function(err) { document.getElementById('metricsCoverage').textContent = err.message; })
    .finally(function() { button.disabled = false; });
}

function ccRenderSessions() {
  document.getElementById('ccSessionList').innerHTML = ccSessionRows.slice(0, ccSessionLimit).map(function(row) {
    var account = row.signed_in ? ('Signed in · ' + ((row.store_handles || []).length ? 'Store account' : 'No store membership')) : 'Anonymous · account unknown';
    return '<button type="button" class="gm-session-row" data-session-id="' + escapeHtml(row.id) + '"><strong>' + escapeHtml(formatDate(row.started_at)) + ' · ' + escapeHtml(account) + '</strong>'
      + '<span>' + escapeHtml(row.entry_page) + ' → ' + escapeHtml(row.exit_page) + '</span><span>' + row.page_count + ' pages · ' + (row.duration_seconds ? ccDuration(row.duration_seconds) + ' observed' : 'Duration unknown') + ' · ' + ccDuration(row.active_seconds) + ' active · ' + escapeHtml(row.status)
      + '</span><span>' + escapeHtml((row.events || []).filter(function(e) { return e.startsWith('create_'); }).join(' · ').replaceAll('_',' ')) + '</span></button>';
  }).join('') || '<p class="gm-muted">No matching sessions recorded yet. New journeys appear after tracking is deployed and permitted by the visitor’s browser.</p>';
  document.getElementById('ccMoreSessions').hidden = ccSessionLimit >= ccSessionRows.length;
}

function loadSessions() {
  var generation = ++ccSessionGeneration;
  document.getElementById('ccSessionStatus').textContent = 'Loading sessions…';
  ccRequest('sessions?days=' + document.getElementById('ccDays').value + '&handle=' + encodeURIComponent(ccSessionHandle)).then(function(data) {
    if (generation !== ccSessionGeneration) return;
    ccSessionRows = data.sessions;
    ccSessionLimit = 50;
    document.getElementById('ccSessionStatus').textContent = data.sample_size + ' matching sessions. ' + data.coverage + (data.truncated ? ' Scan limit reached: this is a partial sample.' : '');
    var labels = {create_opened:'Opened creation page',create_started:'Interacted with form',create_submitted:'Submitted request',create_accepted:'Request accepted',create_failed:'Submission failed'};
    document.getElementById('ccFunnel').innerHTML = Object.keys(labels).map(function(k) { return '<div class="gm-kpi"><span class="gm-kpi-label">' + labels[k] + '</span><strong class="gm-kpi-value">' + data.funnel[k] + '</strong></div>'; }).join('');
    document.getElementById('ccExits').innerHTML = '<h3 class="gm-section-title">Last pages before an unfinished request</h3>' + (data.exit_pages.map(function(p) {
      return '<p class="gm-muted">' + escapeHtml(p[0]) + ' · ' + p[1] + ' ended sessions</p>';
    }).join('') || '<p class="gm-muted">No ended creation journeys in this sample.</p>');
    ccRenderSessions();
  }).catch(function(err) { if (generation === ccSessionGeneration) document.getElementById('ccSessionStatus').textContent = err.message + '. Use Refresh to retry.'; });
}

function ccOpenSession(id) {
  var box = document.getElementById('ccSessionDetail');
  box.dataset.session = id;
  box.textContent = 'Loading journey…';
  openSheet('sessionSheet');
  ccRequest('sessions/' + encodeURIComponent(id)).then(function(data) {
    if (box.dataset.session !== id) return;
    var row = data.session;
    box.innerHTML = '<p><strong>' + escapeHtml(formatDate(row.started_at)) + '</strong></p><p class="gm-muted">' + ccDuration(row.duration_seconds) + ' observed · ' + ccDuration(row.active_seconds)
      + ' active. A one-page visit without a heartbeat has an unknown duration.</p><p class="gm-muted">Visit location: unavailable · Browser timezone: ' + escapeHtml(row.timezone || 'unknown')
      + '</p><p class="gm-muted">' + (row.signed_in ? 'Signed in · Store memberships: ' + escapeHtml((row.store_handles || []).join(', ') || 'none') : 'Anonymous · Account and store membership unknown')
      + '</p><ol class="gm-journey">' + (row.pages || []).map(function(page) {
        return '<li><strong>' + escapeHtml(page.path) + '</strong><small>' + escapeHtml(formatDate(page.at)) + ' · ' + ccDuration(page.active_seconds) + ' active</small><small>'
          + escapeHtml((page.events || []).filter(function(e) { return e !== 'page_view'; }).join(' · ').replaceAll('_',' ')) + '</small></li>';
      }).join('') + '</ol>' + (row.pages_truncated ? '<p class="gm-muted">Only the latest 60 pages are retained for this session.</p>' : '');
  }).catch(function(err) { if (box.dataset.session === id) box.textContent = err.message; });
}

function ccSelectView(view) {
  ccView = view;
  clearTimeout(ccIndexTimer);
  document.querySelectorAll('[data-cc-panel]').forEach(function(el) { el.hidden = el.dataset.ccPanel !== view; });
  document.querySelectorAll('[data-cc-view]').forEach(function(el) { el.classList.toggle('is-active-filter', el.dataset.ccView === view); el.setAttribute('aria-pressed', String(el.dataset.ccView === view)); });
  if (view === 'sessions') loadSessions();
  if (view === 'performance') loadPerformance();
  if (view === 'outreach') loadOutreachQueue();
  if (view === 'stores' && !GM_STATE.metricsLoaded) loadCommandCenterSummary(false);
}

(function initializeCommandCenter() {
  var page = document.querySelector('.gm-page');
  var highlights = document.getElementById('latestChangesCard');
  page.prepend(highlights);
  document.getElementById('activeStoreGrid').closest('section').after(document.getElementById('newStoreBanner'));
  var toolbar = document.createElement('div');
  toolbar.innerHTML = '<nav class="gm-nav" aria-label="Command Center views"><button class="gm-pill is-active-filter" data-cc-view="stores" aria-pressed="true">Stores</button><button class="gm-pill" data-cc-view="sessions" aria-pressed="false">Sessions</button><button class="gm-pill" data-cc-view="performance" aria-pressed="false">Performance</button><button class="gm-pill" data-cc-view="outreach" aria-pressed="false">Outreach</button><button class="gm-btn" id="ccRefresh">Refresh stores</button></nav><p class="gm-muted gm-main-status" id="ccStatus" role="status">Loading stores…</p>';
  highlights.after(toolbar);
  [document.getElementById('statsPills').closest('section'),document.getElementById('storeSearch').closest('section'),document.getElementById('activeStoreGrid').closest('section'),document.getElementById('toggleGraveyard').closest('section'),document.getElementById('newStoreBanner')].forEach(function(el) { el.dataset.ccPanel = 'stores'; });
  document.getElementById('performanceCard').dataset.ccPanel = 'performance';
  document.getElementById('outreachReviewCard').dataset.ccPanel = 'outreach';
  var sessions = document.createElement('section');
  sessions.className = 'gm-card'; sessions.hidden = true; sessions.dataset.ccPanel = 'sessions';
  sessions.innerHTML = '<div class="gm-section-head"><div><h2 class="gm-section-title">Visitor sessions</h2><p class="gm-muted">Excludes your remembered browsers and suspected bots. Request acceptance is not proof that a store finished building.</p></div><button class="gm-btn" id="ccSessionsRefresh">Refresh</button></div><div class="gm-toolbar"><label class="gm-sort-label">Period<select class="gm-select" id="ccDays"><option value="1">Last 24 hours</option><option value="7" selected>Last 7 days</option><option value="30">Last 30 days</option></select></label><button class="gm-btn" id="ccAllSessions">All stores</button></div><p class="gm-muted" id="ccSessionFilter"></p><p class="gm-muted" id="ccSessionStatus" role="status"></p><div class="gm-kpi-grid" id="ccFunnel" style="margin:14px 0"></div><div id="ccExits"></div><div id="ccSessionList"></div><button class="gm-btn" id="ccMoreSessions" hidden>Show more sessions</button>';
  toolbar.after(sessions);
  var sheet = document.createElement('section');
  sheet.className = 'gm-sheet'; sheet.id = 'sessionSheet'; sheet.setAttribute('aria-hidden','true');
  sheet.innerHTML = '<div class="gm-sheet-head"><h2 class="gm-sheet-title">Session journey</h2><button class="gm-close" id="ccCloseSession" aria-label="Close journey">×</button></div><div id="ccSessionDetail"></div>';
  document.body.appendChild(sheet);
  var sessionLink = document.createElement('button'); sessionLink.className = 'gm-btn'; sessionLink.textContent = 'View this store’s sessions';
  document.getElementById('manageCoverage').after(sessionLink);
  sessionLink.addEventListener('click',function() { ccSessionHandle = GM_STATE.currentStore.handle; closeSheets(); document.getElementById('ccSessionFilter').textContent = 'Store: ' + GM_STATE.currentStore.name; ccSelectView('sessions'); });
  document.querySelectorAll('[data-cc-view]').forEach(function(el) { el.addEventListener('click', function() { ccSelectView(el.dataset.ccView); }); });
  document.getElementById('ccRefresh').addEventListener('click', function() { loadCommandCenterSummary(true); });
  document.getElementById('ccSessionsRefresh').addEventListener('click', loadSessions);
  document.getElementById('ccDays').addEventListener('change', loadSessions);
  document.getElementById('ccAllSessions').addEventListener('click', function() { ccSessionHandle = ''; document.getElementById('ccSessionFilter').textContent = ''; loadSessions(); });
  document.getElementById('ccMoreSessions').addEventListener('click', function() { ccSessionLimit += 50; ccRenderSessions(); });
  document.getElementById('ccSessionList').addEventListener('click', function(e) { var target = e.target.closest('[data-session-id]'); if (target) ccOpenSession(target.dataset.sessionId); });
  document.getElementById('ccCloseSession').addEventListener('click', closeSheets);
  var originalOpen = openSheet, originalClose = closeSheets;
  openSheet = function(id) {
    ccFocusReturn = document.activeElement;
    originalOpen(id);
    document.querySelectorAll('.gm-sheet').forEach(function(el) { el.setAttribute('aria-hidden', String(el.id !== id)); });
    var el = document.getElementById(id); el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
    el.setAttribute('aria-label', (el.querySelector('.gm-sheet-title') || {}).textContent || 'Details');
    document.body.style.overflow = 'hidden';
    var close = el.querySelector('.gm-close'); if (close) close.focus();
  };
  closeSheets = function() { originalClose(); document.querySelectorAll('.gm-sheet').forEach(function(el) { el.setAttribute('aria-hidden','true'); }); document.body.style.overflow = ''; if (ccFocusReturn && ccFocusReturn.isConnected) ccFocusReturn.focus(); };
  // Existing listeners captured the original close function; keep their ARIA in sync too.
  ['sheetOverlay','closeManage','closeTools','ccCloseSession'].forEach(function(id) { document.getElementById(id).addEventListener('click',function() { closeSheets(); }); });
  document.addEventListener('keydown',function(e) {
    var dialog = document.querySelector('.gm-sheet.show'); if (!dialog) return;
    if (e.key === 'Escape') closeSheets();
    if (e.key === 'Tab') {
      var els = Array.from(dialog.querySelectorAll('button,a[href],input,select')).filter(function(el) { return !el.disabled && el.getClientRects().length; });
      var first = els[0], last = els[els.length-1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  loadCommandCenterSummary(false);
})();
