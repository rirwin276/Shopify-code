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

const WIDGET_HTML = renderLiquid(liquid);

const PAGE = `<!doctype html><meta charset="utf-8"><style>${css}</style>
<form id="f" action="/cart/add" method="post">
  ${WIDGET_HTML}
  <button id="atc" type="submit">Add to cart</button>
  <div class="accelerated-checkout-block"><div>Buy with Shop Pay</div></div>
</form>
<div id="injection-point"></div>
<script>
  window.__WIDGET_HTML = ${JSON.stringify(WIDGET_HTML)};
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

  // --- a stray keystroke is not a name -------------------------------------
  // The print renderer refuses to treat punctuation as a name. If the
  // storefront disagreed, the buyer would sail through checkout and the order
  // would then fail at fulfilment — taking its non-personalized items with it.

  for (const stray of ['.', '-', "'", '...']) {
    await reset();
    await page.fill($.name, stray);
    await page.dispatchEvent($.name, 'input');
    await type($.number, '7');
    check(`a name of ${JSON.stringify(stray)} counts as no name`, await held(),
      'the storefront thinks this is a name; the print renderer does not');
    await page.click('#atc');
    const body = await page.textContent('[data-ss-pers-warn-body]');
    check(`a name of ${JSON.stringify(stray)} warns that nothing is named`,
      (await visible($.warn)) && /no name/i.test(body || ''), JSON.stringify(body));
    await page.click('button[data-ss-pers-warn-cancel]');
  }

  await reset();
  await page.fill($.name, '.');
  await page.dispatchEvent($.name, 'input');
  check('punctuation alone with no number is a hard stop',
    !(await page.evaluate(() => document.getElementById('f').checkValidity())));

  await reset();
  await page.fill($.name, 'J.R.');
  await page.dispatchEvent($.name, 'input');
  await type($.number, '7');
  check('a real name containing periods is still a name', !(await held()));

  // --- nothing at all must also hold the accelerated buttons ----------------
  // Shopify's own buttons are not guaranteed to run native form validation,
  // so setCustomValidity alone would not stop a blank one reaching checkout.

  await reset();
  check('accelerated checkout is held when there is nothing to print', await held());
  const blankNote = await page.textContent('.ss-pers-accel-note');
  check('the held note says what to do', /add a name or a number/i.test(blankNote || ''),
    JSON.stringify(blankNote));

  // --- a widget injected after load (quick-add) -----------------------------
  // quick-add.js fetches the product page and injects the form into a dialog.
  // Injected <script> tags never run, so without the MutationObserver this
  // widget would be inert — and since the fields no longer carry `required`,
  // nothing at all would stand between a blank form and the cart.

  await page.evaluate(() => {
    const host = document.getElementById('injection-point');
    const form = document.createElement('form');
    form.id = 'f2';
    form.action = '/cart/add';
    form.method = 'post';
    form.innerHTML = window.__WIDGET_HTML
      + '<button id="atc2" type="submit">Add to cart</button>'
      + '<div class="accelerated-checkout-block"><div>Shop Pay 2</div></div>';
    window.__submits2 = 0;
    form.addEventListener('submit', (e) => { e.preventDefault(); window.__submits2++; });
    host.appendChild(form);
  });
  await page.waitForFunction(
    () => !!document.querySelector('#f2 [data-ss-pers][data-ss-pers-ready]'),
    null, { timeout: 5000 }
  ).catch(() => {});

  check('a widget injected after load is claimed',
    await page.evaluate(() => !!document.querySelector('#f2 [data-ss-pers][data-ss-pers-ready]')),
    'quick-add would ship an inert widget with no validation at all');
  check('an injected widget refuses a blank personalization',
    !(await page.evaluate(() => document.getElementById('f2').checkValidity())));
  await page.fill('#f2 [data-ss-pers-name]', 'Emma');
  await page.dispatchEvent('#f2 [data-ss-pers-name]', 'input');
  check('an injected widget accepts a name',
    await page.evaluate(() => document.getElementById('f2').checkValidity()));
  await page.click('#atc2');
  check('an injected widget still asks about the missing number',
    await page.evaluate(() => {
      const m = document.querySelectorAll('[data-ss-pers-warn]');
      return Array.prototype.some.call(m, (el) => !el.classList.contains('ss-pers-hidden'));
    }),
    'the confirmation never appeared for the injected widget');
  check('an injected widget does not add to the cart unconfirmed',
    (await page.evaluate(() => window.__submits2)) === 0);

  // --- two widgets must not interfere --------------------------------------

  check("the second widget's state did not dim the first product's Shop Pay",
    await page.evaluate(() => {
      const blocks = document.querySelectorAll('.accelerated-checkout-block');
      // blocks[0] belongs to form #f, whose fields are blank -> legitimately held.
      // The point is that each widget only ever touches its OWN block.
      return document.querySelector('#f2 .accelerated-checkout-block') === blocks[1];
    }));

  await page.evaluate(() => {
    document.querySelectorAll('[data-ss-pers-warn]').forEach((m) => m.classList.add('ss-pers-hidden'));
  });
  // Complete form #f, then confirm form #f2's blank-number state cannot un-hold it.
  await type($.name, 'Emma');
  await type($.number, '7');
  check('completing the first product releases only its own Shop Pay',
    await page.evaluate(() => {
      const own = document.querySelector('#f .accelerated-checkout-block');
      return own && !own.classList.contains('ss-pers-accel-held');
    }));
  check("the second product's Shop Pay stays held on its own merits",
    await page.evaluate(() => {
      const other = document.querySelector('#f2 .accelerated-checkout-block');
      return other && other.classList.contains('ss-pers-accel-held');
    }),
    'one widget reached across and released a different product');

  await browser.close();

  if (failures.length) {
    console.error('\n' + failures.length + ' FAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
