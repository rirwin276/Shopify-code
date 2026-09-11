/*
Drives the Command Center's product-building switch in a real browser.

This is the control the founder reaches for during an outage, usually from a
phone. The script, the markup and the CSS are all read out of
templates/page.super-admin.liquid rather than restated here, so this fails if
any of them drifts.

What has to hold:

  - the current position is visible on arrival, without clicking anything;
  - pausing asks first, and a cancelled confirm changes nothing;
  - coming back OUT of paused asks too, because resuming into a renderer that
    is still sick is how stores get built with no photos;
  - a failed save says so and re-reads the real position, rather than leaving
    the page showing a switch that was never moved;
  - the message box is not overwritten underneath someone who is typing in it.

Exit code 0 and "ALL OK" on stdout means every scenario passed.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) { console.log('PASS - ' + name); }
  else { console.error('FAIL - ' + name + (detail ? ': ' + detail : '')); failures.push(name); }
}

const template = read('templates', 'page.super-admin.liquid');

// The card, taken from the template itself.
const cardMatch = template.match(/<section class="gm-card gm-switch-card"[\s\S]*?<\/section>/);
if (!cardMatch) {
  console.error('FAIL - the switch card is no longer in page.super-admin.liquid');
  process.exit(1);
}

// Its colour rules. A founder reads this card by colour before reading a word.
const cssRules = (template.match(/\.gm-switch-card[^{]*\{[^}]*\}/g) || []).join('\n');

// The script, lifted whole out of the page's single <script> block.
const pageScript = template.split('<script>').slice(1).map((s) => s.split('</script>')[0])
  .find((s) => s.includes('function loadServiceSwitch'));
if (!pageScript) {
  console.error('FAIL - the switch script is no longer in page.super-admin.liquid');
  process.exit(1);
}

// Only the switch functions are wanted; the rest of the page's script depends
// on Liquid-rendered globals this harness has no business faking.
const startAt = pageScript.indexOf('var SWITCH_STATES');
const endAt = pageScript.indexOf('function getSeenStores');
const switchScript = pageScript.slice(startAt, endAt);

function buildPage(initial) {
  return `<!doctype html><meta charset="utf-8">
  <style>
    :root { --card:#fff; --border:#d1d1d6; --text:#1c1c1e; --gray:#6e6e73;
            --accent:#0071e3; --danger:#ff3b30; --warning:#ff9f0a; --success:#34c759;
            --font: sans-serif; }
    ${cssRules}
  </style>
  <body>
    ${cardMatch[0]}
    <div id="gmToast"></div>
    <script>
      const RAILWAY_URL = '/apps/ss/relay';
      function railwayHeaders() { return { 'Content-Type': 'application/json' }; }
      function formatDate(v) { return v ? 'a moment ago' : 'Never'; }

      window.__toasts = [];
      function showToast(msg, isError) { window.__toasts.push({ msg: msg, isError: !!isError }); }

      window.__confirms = [];
      window.__confirmAnswer = true;
      window.confirm = function (text) { window.__confirms.push(text); return window.__confirmAnswer; };

      window.__switch = ${JSON.stringify(initial)};
      window.__posts = [];
      window.__failNextPost = false;
      window.fetch = function (url, opts) {
        const method = (opts && opts.method) || 'GET';
        if (method === 'POST') {
          const body = JSON.parse(opts.body);
          window.__posts.push(body);
          if (window.__failNextPost) {
            window.__failNextPost = false;
            return Promise.resolve({ json: () => Promise.resolve({ ok: false, error: 'Shopify said no' }) });
          }
          window.__switch = Object.assign({}, window.__switch, {
            state: body.state,
            message: body.message || (body.state === 'ok' ? '' : 'We are sorry — product building is paused.'),
            updated_at: '2026-09-11T00:00:00Z',
            builds_allowed: body.state !== 'paused',
          });
        }
        return Promise.resolve({ json: () => Promise.resolve(Object.assign({ ok: true }, window.__switch)) });
      };
      ${switchScript}
      document.getElementById('switchChoices').addEventListener('click', function (event) {
        var btn = event.target.closest('[data-set-state]');
        if (btn) setServiceSwitch(btn.getAttribute('data-set-state'));
      });
      document.getElementById('switchRefreshBtn').addEventListener('click', loadServiceSwitch);
      loadServiceSwitch();
    </script>
  </body>`;
}

const RUNNING = {
  state: 'ok', message: '', updated_at: '2026-09-10T00:00:00Z', builds_allowed: true,
  default_message: 'We are sorry — product building is paused.', mockup_timeout_streak: 0,
};

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let page = await browser.newPage();

  async function load(initial) {
    await page.close();
    page = await browser.newPage();
    await page.setContent(buildPage(initial));
    await page.waitForTimeout(200);
  }

  const cardState = () => page.$eval('#serviceSwitchCard', (e) => e.getAttribute('data-state'));
  const stateText = () => page.$eval('#switchStateText', (e) => e.textContent);
  const pressed = () => page.$$eval('.gm-switch-choice',
    (nodes) => nodes.filter((n) => n.getAttribute('aria-pressed') === 'true')
                    .map((n) => n.getAttribute('data-set-state')));
  const noteText = () => page.$eval('#switchNote', (e) => e.textContent);
  const posts = () => page.evaluate(() => window.__posts);
  const toasts = () => page.evaluate(() => window.__toasts);
  const stripeColour = () => page.$eval('#serviceSwitchCard',
    (e) => getComputedStyle(e).borderLeftColor);

  // --- Arriving on the page ---------------------------------------------
  await load(RUNNING);
  check('the current position is shown without clicking anything',
    (await cardState()) === 'ok');
  check('the running position is spelled out in words', /Running/.test(await stateText()));
  check('the running choice is the one marked chosen',
    JSON.stringify(await pressed()) === JSON.stringify(['ok']));
  check('a running platform is green', (await stripeColour()) === 'rgb(52, 199, 89)');

  // --- Pausing, with a confirm ------------------------------------------
  await page.click('[data-set-state="paused"]');
  await page.waitForTimeout(200);
  check('pausing the whole platform asks first',
    (await page.evaluate(() => window.__confirms.length)) === 1);
  check('the question says what pausing actually does',
    /no new stores or products/i.test(await page.evaluate(() => window.__confirms[0])),
    'the confirm did not say what would stop');
  check('the confirm promises orders keep working',
    /orders and checkout/i.test(await page.evaluate(() => window.__confirms[0])));
  check('the switch moved', (await cardState()) === 'paused');
  check('a paused platform is red', (await stripeColour()) === 'rgb(255, 59, 48)');
  check('the note spells out that nobody can create a product',
    /nobody can create a product/i.test(await noteText()));
  check('the founder is told', (await toasts()).length === 1);

  // --- Resuming also asks -----------------------------------------------
  await page.click('[data-set-state="ok"]');
  await page.waitForTimeout(200);
  check('coming back out of paused asks too',
    (await page.evaluate(() => window.__confirms.length)) === 2,
    'resuming into a sick renderer is how stores get built with no photos');
  check('it is back to running', (await cardState()) === 'ok');

  // --- A cancelled confirm changes nothing ------------------------------
  await load(RUNNING);
  await page.evaluate(() => { window.__confirmAnswer = false; });
  await page.click('[data-set-state="paused"]');
  await page.waitForTimeout(200);
  check('saying no to the confirm sends nothing', (await posts()).length === 0);
  check('saying no to the confirm leaves the switch alone', (await cardState()) === 'ok');

  // --- Degraded warns, and does not pretend to block --------------------
  await load(RUNNING);
  await page.click('[data-set-state="degraded"]');
  await page.waitForTimeout(200);
  check('choosing slow does not ask, because it blocks nothing',
    (await page.evaluate(() => window.__confirms.length)) === 0);
  check('slow is amber', (await stripeColour()) === 'rgb(255, 159, 10)');
  check('the note says builds still run', /still run/i.test(await noteText()));

  // --- The message the founder types is what gets saved -----------------
  await load(RUNNING);
  await page.fill('#switchMessage', 'Back in about an hour.');
  await page.click('[data-set-state="paused"]');
  await page.waitForTimeout(200);
  check('the typed message is what gets saved',
    (await posts())[0].message === 'Back in about an hour.');

  // --- A refresh must not eat what someone is typing --------------------
  await load(RUNNING);
  await page.focus('#switchMessage');
  await page.type('#switchMessage', 'Half a sentence so f');
  await page.evaluate(() => loadServiceSwitch());
  await page.waitForTimeout(200);
  check('a refresh does not overwrite a message being typed',
    (await page.$eval('#switchMessage', (e) => e.value)) === 'Half a sentence so f',
    'the sixty-second refresh would delete the notice mid-sentence');

  // --- A failed save is not reported as a success -----------------------
  // The switch is moved to "degraded" behind the page's back, the way a second
  // admin on another phone would move it. A failed save has to come back with
  // what is actually there, not with what this page last believed.
  await load(RUNNING);
  await page.evaluate(() => {
    window.__failNextPost = true;
    window.__switch = Object.assign({}, window.__switch, { state: 'degraded' });
  });
  await page.click('[data-set-state="paused"]');
  await page.waitForTimeout(250);
  check('a failed save says so', (await toasts()).some((t) => t.isError));
  check('a failed save names the reason',
    (await toasts()).some((t) => /Shopify said no/.test(t.msg)));
  check('a failed save re-reads the REAL position instead of guessing',
    (await cardState()) === 'degraded',
    'the page kept showing a position the service never had');

  // --- An unreadable switch says so rather than guessing ----------------
  await load(RUNNING);
  await page.evaluate(() => {
    window.fetch = () => Promise.reject(new Error('offline'));
    return loadServiceSwitch();
  });
  await page.waitForTimeout(200);
  check('an unreadable switch admits it', (await cardState()) === 'unknown');
  check('an unreadable switch does not claim everything is fine',
    !/Running/.test(await stateText()));
  check('no choice is shown as chosen when the position is unknown',
    (await pressed()).length === 0);

  // --- The automatic pause is surfaced ----------------------------------
  await load(Object.assign({}, RUNNING, { mockup_timeout_streak: 2 }));
  check('a run of timed-out renders is surfaced before it auto-pauses',
    /2 mockup renders timed out/i.test(await noteText()),
    'the founder gets no warning that the automatic pause is one render away');

  await browser.close();

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
