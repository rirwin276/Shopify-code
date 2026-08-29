/*
Checks the second name line, the optional name/number, and the confirmation
that stands between a half-filled form and the cart.

The widget's real markup and real script are pulled out of blocks/buy-buttons.liquid
and assets/ss-tote-personalize.js and driven in Chromium, so this fails if the
shipped files drift rather than passing against a restated copy.

What it protects:
  - a buyer can add and remove a second name line
  - either the name or the number may be left out
  - leaving one out ASKS before adding to cart, and can be waved through
  - leaving BOTH out is a hard stop (native validation), not a question
  - the accelerated checkout buttons are held back while an answer is owed,
    because a click inside Shopify's own button cannot be intercepted
  - periods survive, so J.R. and St. Mary print correctly

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

// --- static checks on the shipped files ------------------------------------

check('the name field no longer forces a value',
  !/data-ss-pers-name\s+required/.test(liquid),
  'the name is meant to be optional now');
check('the number field no longer forces a value',
  !/data-ss-pers-number\s+required/.test(liquid),
  'the number is meant to be optional now');
check('a second name line is declared',
  /name="properties\[Name Line 2\]"/.test(liquid));
check('the second line shares the name length limit',
  (liquid.match(/maxlength="\{\{ ss_pers\.max_name_len \| default: 14 \}\}"/g) || []).length === 2);
check('the sanitiser keeps the period',
  /replace\(\/\[\^A-Za-z '\.-\]\/g, ''\)/.test(js),
  'ss-tote-personalize.js still strips periods as you type');
check('an entirely blank personalization is a hard stop',
  /setCustomValidity\(/.test(js));

// Turn the block's Liquid into plain HTML: strip comments, resolve the
// `| default:` fallbacks (what a product built before these keys renders).
function renderLiquid(src) {
  const open = src.indexOf('<div\n            class="ss-pers"');
  const close = src.indexOf('<script src=', open);
  let html = src.slice(open, close);
  return html
    .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '')
    .replace(/\{\{\s*ss_pers\.[a-z_.]+\s*\|\s*default:\s*'([^']*)'[^}]*\}\}/g, '$1')
    .replace(/\{\{\s*ss_pers\.[a-z_.]+\s*\|\s*default:\s*([0-9.]+)\s*\}\}/g, '$1')
    .replace(/\{\{\s*ss_pers\.[a-z_.]+\s*\|\s*escape\s*\}\}/g, '')
    .replace(/\{\{\s*ss_pers_model\s*\}\}/g, 'ec8000')
    .replace(/\{\{\s*product\.id\s*\}\}/g, '1')
    .replace(/\{\{[^}]*\}\}/g, '');
}

const styleMatch = liquid.match(/<style>([\s\S]*?)<\/style>/);
const css = styleMatch ? styleMatch[1] : '';

const PAGE = `<!doctype html><meta charset="utf-8"><style>${css}</style>
<form id="f" action="/cart/add" method="post">
  ${renderLiquid(liquid)}
  <button id="atc" type="submit">Add to cart</button>
  <div class="accelerated-checkout-block"><div>Buy with Shop Pay</div></div>
</form>
<script>
  window.__submits = 0;
  document.getElementById('f').addEventListener('submit', function (e) {
    e.preventDefault();      // never actually navigate in the harness
    window.__submits++;
  });
</script>
<script src="/ss-tote-personalize.js"></script>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Serve the real script; block every outbound request so the run is
  // deterministic (fonts and mockup photos are irrelevant to this behaviour).
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.endsWith('/ss-tote-personalize.js')) {
      return route.fulfill({ contentType: 'application/javascript', body: js });
    }
    if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
      return route.fulfill({ contentType: 'text/html', body: PAGE });
    }
    return route.abort();
  });
  await page.goto('http://localhost/index.html');
  await page.waitForFunction(() => !!document.querySelector('[data-ss-pers-addline]'));

  const $ = {
    name: '[data-ss-pers-name]',
    name2: '[data-ss-pers-name2]',
    number: '[data-ss-pers-number]',
    addLine: '[data-ss-pers-addline]',
    removeLine: '[data-ss-pers-removeline]',
    line2: '[data-ss-pers-line2-wrap]',
    warn: '[data-ss-pers-warn]',
    accel: '.accelerated-checkout-block',
  };
  const visible = (sel) => page.evaluate((s) => {
    const el = document.querySelector(s);
    return !!el && !el.classList.contains('ss-pers-hidden');
  }, sel);
  const held = () => page.evaluate((s) => {
    const el = document.querySelector(s);
    return !!el && el.classList.contains('ss-pers-accel-held');
  }, $.accel);
  const submits = () => page.evaluate(() => window.__submits);
  const reset = async () => {
    await page.evaluate(() => { window.__submits = 0; });
    for (const sel of [$.name, $.name2, $.number]) {
      await page.evaluate((s) => {
        const el = document.querySelector(s);
        if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
      }, sel);
    }
  };
  const type = async (sel, value) => {
    await page.fill(sel, value);
    await page.dispatchEvent(sel, 'input');
  };

  // --- the second line ------------------------------------------------------

  check('the second line starts hidden', !(await visible($.line2)));
  check('the add-a-line button starts visible', await visible($.addLine));

  await page.click($.addLine);
  check('clicking add reveals the second line', await visible($.line2));
  check('the add button hides once the line is open', !(await visible($.addLine)));

  await type($.name2, 'Johnson');
  await page.click($.removeLine);
  check('removing hides the second line again', !(await visible($.line2)));
  check('removing clears what was typed there',
    (await page.inputValue($.name2)) === '',
    'a hidden line must not be submitted to the cart');
  check('the add button comes back', await visible($.addLine));

  // --- both fields filled: nothing should get in the way --------------------

  await reset();
  await type($.name, 'Emma');
  await type($.number, '7');
  check('nothing is held back when both fields are filled', !(await held()));
  await page.click('#atc');
  check('the warning stays away when both fields are filled', !(await visible($.warn)));
  check('add to cart goes straight through', (await submits()) === 1);

  // --- name only: ask, do not block ----------------------------------------

  await reset();
  await type($.name, 'Emma');
  check('accelerated checkout is held back with no number', await held());
  await page.click('#atc');
  check('a missing number raises the confirmation', await visible($.warn));
  check('the cart add is paused while the question stands', (await submits()) === 0);
  const bodyText = await page.textContent('[data-ss-pers-warn-body]');
  check('the confirmation says what will be printed',
    /no number/i.test(bodyText || ''), JSON.stringify(bodyText));
  check('the confirmation is moved to <body> so it is not clipped',
    await page.evaluate((s) => document.querySelector(s).parentElement === document.body, $.warn));

  await page.click('button[data-ss-pers-warn-cancel]');
  check('backing out closes the confirmation', !(await visible($.warn)));
  check('backing out does not add to the cart', (await submits()) === 0);

  await page.click('#atc');
  await page.click('[data-ss-pers-warn-confirm]');
  check('confirming adds to the cart', (await submits()) === 1);
  check('confirming releases accelerated checkout', !(await held()));

  // --- number only ----------------------------------------------------------

  await reset();
  await type($.number, '7');
  await page.click('#atc');
  check('a missing name raises the confirmation', await visible($.warn));
  const bodyText2 = await page.textContent('[data-ss-pers-warn-body]');
  check('the confirmation names the missing side',
    /no name/i.test(bodyText2 || ''), JSON.stringify(bodyText2));
  await page.click('[data-ss-pers-warn-confirm]');
  check('a number on its own can be ordered', (await submits()) === 1);

  // --- a second line alone still counts as a name ---------------------------

  await reset();
  await page.click($.addLine);
  await type($.name2, 'Johnson');
  await type($.number, '7');
  check('a second line counts as a name', !(await held()));
  await page.click('#atc');
  check('a second line alone needs no confirmation', !(await visible($.warn)));
  check('a second line alone adds to the cart', (await submits()) === 1);
  await page.click($.removeLine);

  // --- nothing at all is a hard stop ---------------------------------------

  await reset();
  check('an empty form is invalid',
    !(await page.evaluate(() => document.getElementById('f').checkValidity())));
  await page.click('#atc');
  check('an empty form shows no confirmation — it is refused outright',
    !(await visible($.warn)));
  check('an empty form never reaches the cart', (await submits()) === 0);

  // Filling either field alone must clear the hard stop.
  await type($.name, 'Emma');
  check('a name alone makes the form valid again',
    await page.evaluate(() => document.getElementById('f').checkValidity()));
  await reset();
  await type($.number, '7');
  check('a number alone makes the form valid again',
    await page.evaluate(() => document.getElementById('f').checkValidity()));

  // --- periods --------------------------------------------------------------

  await reset();
  await page.fill($.name, 'J.R.');
  await page.dispatchEvent($.name, 'input');
  check('a period survives the as-you-type sanitiser',
    (await page.inputValue($.name)) === 'J.R.');

  const namePattern = liquid.match(/pattern="([^"]*)"\s+placeholder="e\.g\. Emma"/);
  check('the name input declares a pattern', !!namePattern);
  if (namePattern) {
    const compiles = await page.evaluate((p) => {
      try { new RegExp('^(?:' + p + ')$', 'v'); return true; } catch (e) { return false; }
    }, namePattern[1]);
    check('the name pattern compiles under the `v` flag the browser uses', compiles,
      'an invalid pattern is silently ignored and enforces nothing');
    for (const value of ['J.R.', 'St. Mary', "O'Brien", 'Smith-Jones', 'Emma']) {
      const ok = await page.evaluate(([p, v]) => {
        const el = document.createElement('input');
        el.type = 'text'; el.pattern = p; el.value = v;
        return el.checkValidity();
      }, [namePattern[1], value]);
      check(`the name pattern accepts ${JSON.stringify(value)}`, ok);
    }
    for (const value of ['7', 'Emma7', '@emma']) {
      const ok = await page.evaluate(([p, v]) => {
        const el = document.createElement('input');
        el.type = 'text'; el.pattern = p; el.value = v;
        return el.checkValidity();
      }, [namePattern[1], value]);
      check(`the name pattern rejects ${JSON.stringify(value)}`, !ok);
    }
  }

  await browser.close();

  if (failures.length) {
    console.error('\n' + failures.length + ' FAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
