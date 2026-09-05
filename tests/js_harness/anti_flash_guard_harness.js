/*
The anti-flash guard: does it hide, does it reveal, and can it ever stick.

Thirty-two of this theme's sections emit their markup before their own <style>
block, so the browser paints raw HTML and then restyles it. That reads as a
broken site rather than a loading one. The guard holds the page at opacity 0
until its styles are in.

The failure that matters is not the flash. It is a page stuck invisible: a
guard that hides and never reveals takes the whole site down, on every route,
silently. So the reveal paths are what this leans on —

  - the normal one, on DOMContentLoaded;
  - the hard timeout, which must fire even when the release script never runs
    at all, because it is registered in the same block that does the hiding;
  - JavaScript off, where nothing should be hidden in the first place.

It also checks the guard covers every page rather than a list of routes. The
list is what let the home page flash: it was never on it.

Run:  node tests/js_harness/anti_flash_guard_harness.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const theme = fs.readFileSync(path.join(ROOT, 'layout', 'theme.liquid'), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) { console.log('PASS - ' + name); }
  else { console.error('FAIL - ' + name + (detail ? ': ' + detail : '')); failures.push(name); }
}

// Pull the guard's real head block out of the theme: the hide script, its
// stylesheet, and the noscript override.
const headStart = theme.indexOf("document.documentElement.className += ' ss-internal-booting");
const headEnd = theme.indexOf('</noscript>', headStart);
check('the guard is present in the theme', headStart !== -1 && headEnd !== -1);
if (headStart === -1 || headEnd === -1) { console.error('\nFAILED'); process.exit(1); }

const hideScript = theme.slice(theme.lastIndexOf('<script>', headStart) + '<script>'.length,
                               theme.indexOf('</script>', headStart));
const guardCss = theme.slice(theme.indexOf('<style>', headStart), headEnd + '</noscript>'.length);

// The release script is the second one, keyed on its DOMContentLoaded wiring.
const relIdx = theme.indexOf("document.addEventListener('DOMContentLoaded', function () { window.setTimeout(ready");
check('the release script is present', relIdx !== -1);
const releaseScript = theme.slice(theme.lastIndexOf('<script>', relIdx) + '<script>'.length,
                                  theme.indexOf('</script>', relIdx));

check('the guard names no list of routes',
  !/isGuardedRoute/.test(theme),
  'a route list is a list somebody has to remember — the home page never made it onto the old one');

check('the reveal timeout lives in the same block as the hide',
  /ss-internal-booting ss-route-booting'[\s\S]*setTimeout[\s\S]*ss-internal-ready/.test(hideScript),
  'a failure between them would hide the page with nothing scheduled to reveal it');

function page({ withRelease = true, jsEnabled = true } = {}) {
  return '<!doctype html><html><head>'
    + (jsEnabled ? '<script>' + hideScript + '<\/script>' : '')
    + guardCss
    + '</head><body><main class="content-for-layout"><h1>Real UI</h1></main>'
    + (withRelease && jsEnabled ? '<script>' + releaseScript + '<\/script>' : '')
    + '</body></html>';
}

(async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    if (req.url === '/no-release') return res.end(page({ withRelease: false }));
    res.end(page());
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;

  const launchOptions = process.env.PW_CHROMIUM_PATH
    ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launchOptions);

  const opacity = (pg) => pg.$eval('main.content-for-layout',
    (el) => getComputedStyle(el).opacity);

  // The reveal animates over 160ms, so every reading waits for it to settle;
  // sampling mid-transition reads back something like 0.3 and looks like a
  // failure that is not there.
  const settle = (pg) => pg.waitForTimeout(400);

  // Normal load: revealed once the release runs. Hiding is asserted on the
  // no-release page below, where it cannot race the reveal.
  const pg = await browser.newPage();
  await pg.goto(origin + '/', { waitUntil: 'commit' });

  await pg.waitForFunction(() =>
    document.documentElement.className.indexOf('ss-internal-ready') !== -1, null, { timeout: 5000 });
  await settle(pg);
  check('a normal load ends up revealed', (await opacity(pg)) === '1');

  // The guard runs on a plain path with no /pages/ prefix — the home page.
  check('the home page is guarded like everything else',
    !/pathname/.test(hideScript),
    'the guard still decides by path, so a page can be missed again');

  // The release script never runs at all. The timeout must still reveal it.
  const orphan = await browser.newPage();
  await orphan.goto(origin + '/no-release', { waitUntil: 'commit' });
  await orphan.waitForFunction(() =>
    document.documentElement.className.indexOf('ss-internal-booting') !== -1);
  check('the page is hidden while booting', (await opacity(orphan)) === '0');
  await orphan.waitForFunction(() =>
    document.documentElement.className.indexOf('ss-internal-ready') !== -1, null, { timeout: 6000 });
  await settle(orphan);
  check('and the hard timeout still reveals it',
    (await opacity(orphan)) === '1',
    'the whole site would be invisible');

  // JavaScript off: nothing hides, so there is nothing to reveal.
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(origin + '/');
  check('with JavaScript off the page is never hidden',
    (await opacity(noJsPage)) === '1',
    'the site would be blank for anyone without JS');

  await browser.close();
  await new Promise((r) => server.close(r));

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
