/*
Proves the dashboard cannot reload itself forever.

A card the server rendered as "building" polls the backend, and when the backend
answers "ready" it used to reload the page so Liquid could re-render that card.

Guarding that to one reload per store was still wrong: a dashboard with several
cards rendered as building reloads several times, one per store, as their polls
come back — including the moment "show more" reveals a card and starts its poll.
So nothing reloads any more; a finished store is upgraded in place, which is the
same call a card the server rendered as ready already makes.

That is what this checks, by driving the real poll out of the section: however
many times it runs, and whatever the backend says, the page must never reload
and the card must end up live.

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
const START = section.indexOf('// --- Poll backend every 10 s until ready = true ---');
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
  check('the poll upgrades the card instead of reloading',
    /setLiveUI\(card\);/.test(poller) && !/location\.reload/.test(poller),
    'the poll can still reload, which is one reload per building card');
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

  check('a finished store does not reload the page',
    (await p.evaluate(() => window.__reloads)) === 0,
    'got ' + (await p.evaluate(() => window.__reloads)) + ' — scroll position and every "show more" click are lost');
  check('it is upgraded in place instead',
    (await p.evaluate(() => window.__live)).indexOf('team-a-3978') !== -1);

  // The page "reloads": same session storage, same server output, so the card
  // still says building. This is the loop.
  await p.evaluate(() => { window.__fetched = []; window.__run(); });
  await p.waitForTimeout(1200);

  check('running again still does not reload',
    (await p.evaluate(() => window.__reloads)) === 0,
    'got ' + (await p.evaluate(() => window.__reloads)) + ' reloads — this is the loop');

  // A third pass, in case the guard only survives one round.
  await p.evaluate(() => window.__run());
  await p.waitForTimeout(1200);
  check('and still does not reload on a third pass',
    (await p.evaluate(() => window.__reloads)) === 0);

  // Several cards finishing at once is the case that produced a burst of
  // reloads, one per store: a per-store guard does not help when the problem
  // is how many stores there are.
  await p.evaluate(() => {
    document.querySelectorAll('.ss-store-card').forEach((c) => { c.style.display = ''; });
    window.__live = [];
    window.__run();
  });
  await p.waitForTimeout(1200);
  check('several finished stores at once still reload nothing',
    (await p.evaluate(() => window.__reloads)) === 0,
    'got ' + (await p.evaluate(() => window.__reloads)) + ' — one per building card');
  check('and every one of them is upgraded in place',
    (await p.evaluate(() => window.__live)).length >= 2,
    'revealing a hidden card starts its poll, which is when this fired');

  // Site data blocked must change nothing, since nothing is remembered now.
  const blocked = await browser.newPage();
  await blocked.goto(origin + '/blocked');
  await blocked.evaluate(() => window.__run());
  await blocked.waitForTimeout(1200);
  check('with site data blocked it still never reloads',
    (await blocked.evaluate(() => window.__reloads)) === 0);
  check('and still upgrades in place',
    (await blocked.evaluate(() => window.__live.length)) > 0);

  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
