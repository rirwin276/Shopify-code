/*
Drives the product-building outage notice in a real browser.

The notice exists because a store built while the print partner's renderer is
stalled comes out with no product photos. It is read out of the snippet and the
form rather than restated here, so this fails if either drifts.

Four things have to hold, and none of them is obvious from reading the code:

  - nothing is shown at all while product building is running, on a page a
    customer could land on at any moment;
  - PAUSED shows the notice AND turns the request form's submit off, so nobody
    can order a store that will come out broken;
  - DEGRADED warns and blocks nothing, because a slow renderer still renders;
  - a status lookup that FAILS leaves the page alone. A hiccup reading the
    switch must not look like an outage and stop a customer from ordering.

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

// The snippet itself: markup, style and script, exactly as the theme renders it.
const snippet = read('snippets', 'service-status-banner.liquid')
  .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');

// The form's own enable rule, lifted from the section so a change there is
// caught here instead of in production.
const form = read('sections', 'request-storefront-form.liquid');
const enableRule = form.match(/const enabled = [^;]+;/);

function buildPage(answer) {
  return `<!doctype html><meta charset="utf-8"><body>
    <script>
      // Stand in for the App Proxy. The harness controls what it says.
      window.__answer = ${JSON.stringify(answer)};
      window.fetch = function (url) {
        if (window.__answer === 'boom') return Promise.reject(new Error('network'));
        return Promise.resolve({ json: function () { return Promise.resolve(window.__answer); } });
      };
    </script>
    ${snippet}
    <button id="submit" data-blocked-when-paused>Submit Request</button>
    <a id="cta" href="/pages/request-storefront-form" data-blocked-when-paused>Create a Storefront</a>
    <script>
      window.__ctaFollowed = false;
      document.getElementById('cta').addEventListener('click', function (e) {
        e.preventDefault();
        window.__ctaFollowed = true;
      });
    </script>
  </body>`;
}

const RUNNING = { ok: true, state: 'ok', banner: null, builds_allowed: true };
const PAUSED = {
  ok: true, state: 'paused', builds_allowed: false,
  banner: { state: 'paused', message: 'Product building is paused while we sort out an issue with our print partner.', blocking: true },
};
const DEGRADED = {
  ok: true, state: 'degraded', builds_allowed: true,
  banner: { state: 'degraded', message: 'Product building is running behind today.', blocking: false },
};

(async () => {
  check('the form still gates submit on the pause flag',
    !!enableRule && /ssProductBuildingPaused/.test(enableRule[0]),
    'updateSubmitEnabled would re-enable the button on the next keystroke');

  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  // A fresh page per scenario. The snippet guards itself against being
  // included twice with a window flag, and reusing one page would carry that
  // flag across scenarios — every load after the first would quietly skip the
  // script and pass without running anything.
  let page = await browser.newPage();

  async function load(answer, html) {
    await page.close();
    page = await browser.newPage();
    await page.setContent(html || buildPage(answer));
    await page.waitForTimeout(200);
  }

  const bannerVisible = () => page.$eval('#ssStatusBanner', (e) => !e.hidden);
  const bannerText = () => page.$eval('#ssStatusBannerText', (e) => e.textContent);
  const submitDisabled = () => page.$eval('#submit', (e) => e.disabled);
  const ctaDisabled = () => page.$eval('#cta', (e) => e.getAttribute('aria-disabled') === 'true');

  // --- Running: a customer sees nothing at all ---------------------------
  await load(RUNNING);
  check('nothing is shown while product building is running', (await bannerVisible()) === false);
  check('the submit button is untouched', (await submitDisabled()) === false);
  check('the flag says builds are allowed',
    (await page.evaluate(() => window.ssProductBuildingPaused)) === false);

  // --- Paused: notice plus a closed door --------------------------------
  await load(PAUSED);
  check('the notice appears when paused', (await bannerVisible()) === true);
  check('the notice says what the founder wrote',
    /print partner/.test(await bannerText()),
    'the banner showed something other than the message on the switch');
  check('the notice is styled as a stop, not a warning',
    (await page.$eval('#ssStatusBanner', (e) => e.getAttribute('data-state'))) === 'paused');
  check('the submit button is turned off', (await submitDisabled()) === true);
  check('a store-creation link is marked unavailable', (await ctaDisabled()) === true);

  // force: true because Playwright itself refuses to click an aria-disabled
  // element — which is the browser agreeing with us. Push past it anyway to
  // prove the guard holds for a determined click, not just a polite one.
  await page.click('#cta', { force: true });
  check('clicking that link does not start a store',
    (await page.evaluate(() => window.__ctaFollowed)) === false,
    'the click guard let a paused link through');

  check('the page-wide flag is set for any other script that asks',
    (await page.evaluate(() => window.ssProductBuildingPaused)) === true);

  // --- Degraded: warn, but block nothing --------------------------------
  await load(DEGRADED);
  check('a slow renderer still shows a notice', (await bannerVisible()) === true);
  check('a slow renderer does not block the submit', (await submitDisabled()) === false);
  check('a slow renderer does not block the link', (await ctaDisabled()) === false);

  // --- Recovery, without a reload ---------------------------------------
  await load(PAUSED);
  check('paused before recovery', (await submitDisabled()) === true);
  await page.evaluate(() => { window.__answer = { ok: true, state: 'ok', banner: null, builds_allowed: true }; });
  await page.evaluate(() => window.ssRefreshServiceStatus());
  await page.waitForTimeout(150);
  check('the notice clears itself when the outage ends', (await bannerVisible()) === false);
  check('the submit button comes back on a page left open through the outage',
    (await submitDisabled()) === false);
  check('the link comes back too', (await ctaDisabled()) === false);
  check('the link works again', await (async () => {
    await page.click('#cta');
    return page.evaluate(() => window.__ctaFollowed);
  })());

  // --- A failed lookup is not an outage ---------------------------------
  await load('boom');
  check('a failed status lookup shows no notice', (await bannerVisible()) === false);
  check('a failed status lookup does not block a customer', (await submitDisabled()) === false,
    'a hiccup reading the switch would have cost a sale');

  await load({ ok: false, error: 'forbidden' });
  check('a refused status lookup does not block a customer', (await submitDisabled()) === false);

  // --- A button with an icon keeps its icon ------------------------------
  await load(null, buildPage(PAUSED).replace(
    '<button id="submit" data-blocked-when-paused>Submit Request</button>',
    '<button id="submit" data-blocked-when-paused>Submit <svg id="icon"></svg></button>'));
  await page.evaluate(() => { window.__answer = { ok: true, state: 'ok', banner: null, builds_allowed: true }; });
  await page.evaluate(() => window.ssRefreshServiceStatus());
  await page.waitForTimeout(150);
  check('an icon inside a blocked button survives the outage',
    (await page.$('#icon')) !== null,
    'restoring the label ate the button contents');

  await browser.close();

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
