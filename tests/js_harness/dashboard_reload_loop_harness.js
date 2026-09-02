/*
Proves the dashboard cannot reload itself forever.

A card the server rendered as "building" polls the backend, and when the
backend answers "ready" it reloads the page so Liquid can re-render the card
with its real product count and logo. That is fine exactly once. It stops being
fine when the server keeps rendering the same card as building — the reload
lands on an identical page, the poll fires again ten seconds later, and with
several such cards every reload restarts every poll. The dashboard reloads for
as long as you leave it open, which is what was reported.

The guard is that a store gets one reload per session and is then upgraded in
place. This drives the real functions out of the section: run once (a reload is
allowed), then run them again as a reloaded page would (no second reload).

Exit code 0 and "ALL OK" on stdout means every scenario passed.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) { console.log('PASS - ' + name); }
  else { console.error('FAIL - ' + name + (detail ? ': ' + detail : '')); failures.push(name); }
}

const section = read('sections', 'seller-dashboard.liquid');

// The two real functions, sliced out of the section so this cannot pass
// against a copy that has drifted from what ships.
const START = section.indexOf('var RELOADED_PREFIX');
const END = section.indexOf('// --- Initialise each store card ---');
const poller = START !== -1 && END !== -1 ? section.slice(START, END) : '';

// window.location.reload cannot be replaced in a real browser, so the one call
// is redirected to a counter. Everything else runs verbatim.
const instrumented = poller.replace(/window\.location\.reload\(\);/g, 'window.__reload();');

function page(extraSetup) {
  return `<!doctype html><html><body>
    <div class="ss-store-card" data-ss-handle="team-a-3978" data-ss-building="1"
         data-ss-backend="https://backend.example"><div class="ss-progress-bar"></div></div>
    <div class="ss-store-card" data-ss-handle="team-b-3978" data-ss-building="1"
         data-ss-backend="https://backend.example" style="display:none"></div>
    <script>
      window.__reload = function(){ window.__reloads = (window.__reloads||0) + 1; };
      window.__reloads = 0;
      window.__live = [];
      window.__fetched = [];
      var BACKEND_URL = 'https://backend.example';
      function setLiveUI(card){ window.__live.push(card.getAttribute('data-ss-handle')); }
      window.fetch = function(url){
        window.__fetched.push(url);
        return Promise.resolve({ json: function(){ return Promise.resolve({ ready: true }); } });
      };
      ${extraSetup || ''}
      window.__run = function(){
        ${instrumented}
        document.querySelectorAll('.ss-store-card[data-ss-building="1"]').forEach(startPollingReady);
      };
    <\/script></body></html>`;
}

(async () => {
  check('the reload guard is present in the section', poller.includes('reloadOnceFor'));
  check('the poll routes its reload through the guard',
    /reloadOnceFor\(handle, card\);/.test(poller) && !/setTimeout\(function\(\)\{ window\.location\.reload\(\); \}, 800\);\s*\}\s*\}\)/.test(poller),
    'the poll can still reload directly, bypassing the guard');
  if (!poller) { console.error('\nFAILED'); process.exit(1); }

  const launchOptions = process.env.PW_CHROMIUM_PATH
    ? { executablePath: process.env.PW_CHROMIUM_PATH }
    : {};
  // Served over http rather than set as page content: sessionStorage is
  // unavailable on an opaque origin, which would send every case down the
  // "site data blocked" branch and pass this file for the wrong reason.
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(req.url === '/blocked'
      ? page("Object.defineProperty(window, 'sessionStorage', { get: function(){ throw new Error('blocked'); } });")
      : page());
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;

  const browser = await chromium.launch(launchOptions);
  const p = await browser.newPage();

  await p.goto(origin + '/');
  await p.evaluate(() => window.__run());
  // The reload is deferred 800ms so the progress bar can fill; wait past it or
  // this file measures nothing.
  await p.waitForTimeout(1200);

  check('the poll asks immediately rather than waiting ten seconds',
    (await p.evaluate(() => window.__fetched.length)) > 0,
    'a card wrongly rendered as building sits there for a full period');

  check('a hidden card is not polled',
    (await p.evaluate(() => window.__fetched.every((u) => u.indexOf('team-b') === -1))),
    'every card in the account fires a request every ten seconds');

  check('a finished store reloads the page once',
    (await p.evaluate(() => window.__reloads)) === 1);
  check('and is not upgraded in place on that first pass',
    (await p.evaluate(() => window.__live.length)) === 0);

  // The page "reloads": same session storage, same server output, so the card
  // still says building. This is the loop.
  await p.evaluate(() => { window.__fetched = []; window.__run(); });
  await p.waitForTimeout(1200);

  check('the reloaded page does NOT reload again',
    (await p.evaluate(() => window.__reloads)) === 1,
    'got ' + (await p.evaluate(() => window.__reloads)) + ' reloads — this is the infinite loop');
  check('it upgrades the card in place instead',
    (await p.evaluate(() => window.__live)).indexOf('team-a-3978') !== -1);

  // A third pass, in case the guard only survives one round.
  await p.evaluate(() => window.__run());
  await p.waitForTimeout(1200);
  check('and still does not reload on a third pass',
    (await p.evaluate(() => window.__reloads)) === 1);

  // A store that legitimately finishes later gets its reload back.
  await p.evaluate(() => {
    var card = document.querySelector('[data-ss-handle="team-a-3978"]');
    card.setAttribute('data-ss-ready', '1');
    try { sessionStorage.removeItem('ss-dash-reloaded:team-a-3978'); } catch (e) {}
    window.__run();
  });
  await p.waitForTimeout(1200);
  check('a store rebuilt later in the same session may reload again',
    (await p.evaluate(() => window.__reloads)) === 2,
    'the guard would permanently block a legitimate refresh');

  // No session storage at all: nothing can be remembered, so nothing may reload.
  const blocked = await browser.newPage();
  await blocked.goto(origin + '/blocked');
  await blocked.evaluate(() => window.__run());
  await blocked.waitForTimeout(1200);
  check('with site data blocked it never reloads',
    (await blocked.evaluate(() => window.__reloads)) === 0,
    'a reload that cannot be remembered is an infinite one');
  check('and upgrades in place instead',
    (await blocked.evaluate(() => window.__live.length)) > 0);

  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
