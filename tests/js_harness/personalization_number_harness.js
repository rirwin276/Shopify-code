/*
Checks the customer-facing Number field accepts a shared squad number.

Two children on one team share a shirt, so the field has to take "2/9" as well
as an ordinary number up to three digits. Three things have to agree or the
feature half-works: the maxlength, the as-you-type sanitiser in
ss-tote-personalize.js, and the HTML pattern. All three are read from the real
files here rather than restated, so this fails if any one of them drifts.

The pattern is checked in Chromium, not with Node's default RegExp. Browsers
compile the pattern attribute with the `v` flag, and under `v` a "-" inside a
character class is a syntax error — an invalid pattern is then ignored
entirely, so every value silently validates. That is exactly the bug this
caught: [0-9][/\-][0-9] looked correct and enforced nothing.

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

const liquid = read('blocks', 'buy-buttons.liquid');
const js = read('assets', 'ss-tote-personalize.js');

// Accepted: a number up to three digits, or two digits joined by / or -.
const ACCEPT = ['7', '27', '100', '2/9', '2-9'];
const REJECT = ['/', '-', '9/', '/9', '//', '-/'];

(async () => {
  const patternMatch = liquid.match(/pattern="([^"]*)"\s+placeholder="e\.g\. 7 or 2\/9"/);
  check('the number input declares a pattern', !!patternMatch);
  if (!patternMatch) { console.error('\nFAILED'); process.exit(1); }
  const pattern = patternMatch[1];

  check('maxlength allows three characters',
    /maxlength="\{\{ ss_pers\.max_number_len \| default: 3 \}\}"/.test(liquid));

  check('data-max-number falls back to three',
    /data-max-number="\{\{ ss_pers\.max_number_len \| default: 3 \}\}"/.test(liquid));

  // The iOS numeric keypad offers no "/" or "-", which would make a shared
  // number impossible to type on a phone.
  const numberInput = liquid.slice(liquid.indexOf('data-ss-pers-number'), liquid.indexOf('placeholder="e.g. 7 or 2/9"'));
  check('no numeric inputmode on the number field', !/inputmode="numeric"/.test(numberInput));

  check('the sanitiser keeps / and -',
    /replace\(\/\[\^0-9\/-\]\/g, ''\)/.test(js),
    'ss-tote-personalize.js still strips the separators as you type');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<input id="n" type="text" maxlength="3" pattern="${pattern.replace(/"/g, '&quot;')}">`);

  // An invalid pattern is ignored by the browser, which would make every case
  // below pass for the wrong reason. Prove it compiles first.
  const compiles = await page.evaluate((p) => {
    try { new RegExp('^(?:' + p + ')$', 'v'); return true; } catch (e) { return false; }
  }, pattern);
  check('the pattern compiles under the `v` flag the browser uses', compiles,
    'an invalid pattern is silently ignored and enforces nothing');

  for (const value of ACCEPT) {
    const ok = await page.$eval('#n', (el, v) => { el.value = v; return el.checkValidity(); }, value);
    check(`accepts ${JSON.stringify(value)}`, ok);
  }
  for (const value of REJECT) {
    const ok = await page.$eval('#n', (el, v) => { el.value = v; return el.checkValidity(); }, value);
    check(`rejects ${JSON.stringify(value)}`, !ok);
  }

  await browser.close();

  if (failures.length) {
    console.error('\n' + failures.length + ' FAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
