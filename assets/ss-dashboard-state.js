// One scheduler for public card state. Keep server-rendered cards usable on
// failure; only a matching, successful response can change a card.
export function createDashboardState({ url, doc = document, fetcher = fetch,
  now = Date.now, schedule = setTimeout, cancel = clearTimeout,
  visible = card => card.offsetParent !== null, interval = 10000 }) {
  const entries = new Map();
  const controllers = new Set();
  let timer = null;
  let active = 0;
  let stopped = false;

  function wake(delay = 0) {
    if (stopped) return;
    if (timer !== null) cancel(timer);
    timer = schedule(pump, delay);
  }

  function due(entry) {
    return !entry.busy && entry.next <= now() &&
      (entry.onReady || (entry.onFundraising && !entry.fundraisingLoaded)) &&
      doc.body.contains(entry.card) && visible(entry.card);
  }

  async function request(batch) {
    active++;
    batch.forEach(entry => { entry.busy = true; });
    const controller = new AbortController();
    controllers.add(controller);
    const timeout = schedule(() => controller.abort(), 18000);
    try {
      const response = await fetcher(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handles: batch.map(entry => entry.handle) }),
        cache: 'no-store', signal: controller.signal
      });
      if (!response.ok) throw new Error('Status unavailable');
      const payload = await response.json();
      for (const entry of batch) {
        const state = payload.stores && payload.stores[entry.handle];
        if (!state || state.error || state.handle !== entry.handle) continue;
        if (stopped || !doc.body.contains(entry.card)) continue;
        if (entry.onReady && state.ready === true &&
            state.status !== 'sleeping' && state.status !== 'waking') {
          entry.onReady(state);
          entry.onReady = null;
        }
        if (entry.onFundraising && !entry.fundraisingLoaded && state.fundraising &&
            state.fundraising.handle === entry.handle) {
          entry.onFundraising(state.fundraising);
          entry.fundraisingLoaded = true;
        }
      }
    } catch (_) {
      // A failed or timed-out batch retries later without replacing good UI.
    } finally {
      cancel(timeout);
      controllers.delete(controller);
      active--;
      batch.forEach(entry => { entry.busy = false; entry.next = now() + interval; });
      wake();
    }
  }

  function pump() {
    timer = null;
    if (stopped || doc.hidden) return;
    for (const [card] of entries) if (!doc.body.contains(card)) entries.delete(card);
    // Maximum two batches (twenty stores) at once, including search results.
    while (active < 2) {
      const batch = Array.from(entries.values()).filter(due).slice(0, 10);
      if (!batch.length) break;
      request(batch);
    }
    if (Array.from(entries.values()).some(entry => entry.onReady ||
        (entry.onFundraising && !entry.fundraisingLoaded))) wake(1000);
  }

  function watch(card, callbacks) {
    if (!url || stopped) return;
    const handle = card.getAttribute('data-ss-handle');
    if (!handle) return;
    let entry = entries.get(card);
    if (!entry) {
      entry = { card, handle, busy: false, next: 0, fundraisingLoaded: false };
      entries.set(card, entry);
    }
    Object.assign(entry, callbacks);
    wake();
  }

  function visibilityChanged() { if (!doc.hidden) wake(); }
  doc.addEventListener('visibilitychange', visibilityChanged);
  doc.addEventListener('ss:dashboard-visible', visibilityChanged);
  function stop() {
    stopped = true;
    if (timer !== null) cancel(timer);
    controllers.forEach(controller => controller.abort());
    doc.removeEventListener('visibilitychange', visibilityChanged);
    doc.removeEventListener('ss:dashboard-visible', visibilityChanged);
  }
  return { watch, wake, stop };
}
