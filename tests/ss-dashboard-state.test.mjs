import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const code = await readFile(new URL('../assets/ss-dashboard-state.js', import.meta.url), 'utf8');
const { createDashboardState } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

function fixture() {
  let clock = 0, id = 0;
  const timers = new Map(), calls = [];
  const doc = new EventTarget();
  doc.body = { contains: card => card.attached };
  doc.hidden = false;
  const state = createDashboardState({ url: 'https://example.test/dashboard/state', doc,
    now: () => clock, visible: card => card.visible,
    schedule: (fn, delay) => { timers.set(++id, { fn, at: clock + delay }); return id; },
    cancel: id => timers.delete(id),
    fetcher: (url, options) => new Promise((resolve, reject) => {
      calls.push({ handles: JSON.parse(options.body).handles, resolve, reject });
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }) });
  const card = (handle, visible = true) => ({ attached: true, visible,
    getAttribute: key => key === 'data-ss-handle' ? handle : null });
  async function advance(ms = 0) {
    clock += ms;
    for (let n = 0; n < 20; n++) {
      const due = [...timers].filter(([,t]) => t.at <= clock);
      if (!due.length) break;
      for (const [key, t] of due) { timers.delete(key); t.fn(); }
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    }
  }
  async function answer(call, make = h => ({ handle: h, ready: true, status: 'active', fundraising: { handle: h, enabled: false } })) {
    call.resolve({ ok: true, json: async () => ({ stores: Object.fromEntries(call.handles.map(h => [h, make(h)])) }) });
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    await advance();
  }
  return { state, doc, card, calls, advance, answer };
}

test('60 stores: first ten share one request; hidden cards wait for show more', async () => {
  const f = fixture(); let ready = 0, fr = 0;
  const cards = Array.from({length: 60}, (_,i) => f.card('team-' + i, i < 10));
  cards.forEach(c => { f.state.watch(c, { onReady: () => ready++ }); f.state.watch(c, { onFundraising: () => fr++ }); });
  await f.advance();
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].handles.length, 10);
  await f.answer(f.calls[0]); assert.equal(ready, 10); assert.equal(fr, 10);
  await f.advance(10000); assert.equal(f.calls.length, 1);
  cards.slice(10,20).forEach(c => { c.visible = true; });
  f.doc.dispatchEvent(new Event('ss:dashboard-visible')); await f.advance();
  assert.equal(f.calls.length, 2); assert.equal(f.calls[1].handles[0], 'team-10');
  f.state.stop();
});

test('searching all stores stays within two simultaneous batches', async () => {
  const f = fixture();
  for (let i=0;i<60;i++) f.state.watch(f.card('team-'+i), { onFundraising: () => {} });
  await f.advance(); assert.equal(f.calls.length, 2);
  await f.advance(10000); assert.equal(f.calls.length, 2); // no overlapping polls
  await f.answer(f.calls[0]); assert.equal(f.calls.length, 3);
  f.state.stop();
});

test('background tab pauses new work and resumes on return', async () => {
  const f = fixture(); f.doc.hidden = true;
  f.state.watch(f.card('team'), { onReady: () => {} });
  await f.advance(); assert.equal(f.calls.length, 0);
  f.doc.hidden = false; f.doc.dispatchEvent(new Event('visibilitychange'));
  await f.advance(); assert.equal(f.calls.length, 1); f.state.stop();
});

test('wrong-store, partial and sleeping responses cannot unlock a card', async () => {
  const f = fixture(); let ready=0,fr=0;
  for (const h of ['wrong','missing','sleep']) f.state.watch(f.card(h), {onReady:()=>ready++, onFundraising:()=>fr++});
  await f.advance();
  await f.answer(f.calls[0], h => h==='wrong' ? {handle:'another',ready:true} : h==='missing' ? {error:'unavailable'} : {handle:h,ready:true,status:'sleeping'});
  assert.equal(ready,0); assert.equal(fr,0);
  await f.advance(10000); assert.equal(f.calls.length,2); f.state.stop();
});

test('ready stores stop polling; building stores retry without repeating fundraiser paint', async () => {
  const f=fixture(); let ready=0,fr=0;
  f.state.watch(f.card('team'), {onReady:()=>ready++,onFundraising:()=>fr++});
  await f.advance();
  await f.answer(f.calls[0], h=>({handle:h,ready:false,status:'building',fundraising:{handle:h,enabled:false}}));
  assert.equal(fr,1); assert.equal(ready,0);
  await f.advance(10000); await f.answer(f.calls[1]);
  assert.equal(fr,1); assert.equal(ready,1);
  await f.advance(10000); assert.equal(f.calls.length,2); f.state.stop();
});

test('timed out requests release slots and retry later', async () => {
  const f=fixture(); f.state.watch(f.card('team'),{onReady:()=>assert.fail('must not unlock')});
  await f.advance(); await f.advance(18000);
  assert.equal(f.calls.length,1);
  await f.advance(10000); assert.equal(f.calls.length,2); f.state.stop();
});

test('removed cards and stopped scheduler never paint stale responses', async () => {
  const f=fixture(), c=f.card('team');
  f.state.watch(c,{onReady:()=>assert.fail('removed card')}); await f.advance();
  c.attached=false; await f.answer(f.calls[0]);
  await f.advance(10000); assert.equal(f.calls.length,1); f.state.stop();
});
