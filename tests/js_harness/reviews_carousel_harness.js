/*
Drives the approved-reviews carousel in a real browser.

This section fills up over time. As a grid capped at five it was a wall of
text nobody read and it threw away everything past the fifth review; as a
carousel it has to stay honest about how many there are and stay usable with a
keyboard, on a phone, and before any of its own JavaScript runs.

The markup, styles and script are read out of the shipped section rather than
restated here, so this fails if any of them drifts.

What has to hold:

  - no reviews, or a service that is down, renders NOTHING — never a
    placeholder testimonial, and never an empty card frame;
  - every review the service returns is in the track, not just the first few;
  - the arrows appear only when the reviews actually overflow;
  - the ends disable their arrow, so nobody clicks into blank space;
  - the position readout matches where the track really is;
  - arrow keys and Home/End move it, because a carousel you cannot tab
    through is a carousel half your visitors cannot use;
  - a partly-filled review (no photo, no group) still renders.

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

const section = read('sections', 'ss-featured-store-reviews.liquid')
  .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '')
  .replace(/\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}/g, '');

// The whole section, with the Liquid the harness has to stand in for resolved.
const rendered = section
  .replace(/\{\{\s*section\.id\s*\}\}/g, 'demo')
  .replace(/\{\{\s*review_api[^}]*\}\}/g, 'https://reviews.test')
  .replace(/\{\{\s*section\.settings\.(\w+)[^}]*\}\}/g, (_m, k) => k)
  .replace(/\{%-?[\s\S]*?-?%\}/g, '');

const review = (i, extra = {}) => Object.assign({
  rating: 5 - (i % 3),
  body: 'Review number ' + i + '. The store went up the same morning and the parents ordered themselves.',
  reviewer_name: 'Parent ' + i,
  group_name: 'Team ' + i,
}, extra);

function buildPage(payload, width) {
  return `<!doctype html><meta charset="utf-8">
  <style>body{margin:0;width:${width}px}</style>
  <body>
    <script>
      window.__payload = ${JSON.stringify(payload)};
      window.fetch = function () {
        if (window.__payload === 'boom') return Promise.reject(new Error('down'));
        if (window.__payload === 'error500') return Promise.resolve({ ok: false });
        return Promise.resolve({ ok: true, json: () => Promise.resolve(window.__payload) });
      };
    </script>
    ${rendered}
  </body>`;
}

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let page;
  const errors = [];

  async function load(payload, width = 900) {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setContent(buildPage(payload, width));
    await page.waitForTimeout(320);
  }

  const hidden = () => page.$eval('#ss-proof-demo', (e) => e.hidden);
  const cards = () => page.$$eval('.ss-proof__card', (n) => n.length);
  const navHidden = () => page.$eval('[data-proof-nav]', (e) => e.hidden);
  const countText = () => page.$eval('[data-proof-count]', (e) => e.textContent);
  const disabled = (sel) => page.$eval(sel, (e) => e.disabled);
  const scrollLeft = () => page.$eval('[data-proof-grid]', (e) => e.scrollLeft);

  // The track scrolls smoothly and the readout is debounced, so every
  // assertion about where it ended up has to wait for it to settle rather
  // than guess a timeout.
  async function settled(ms = 2500) {
    let last = -1;
    for (let waited = 0; waited < ms; waited += 120) {
      await page.waitForTimeout(120);
      const now = await scrollLeft();
      if (now === last) return now;
      last = now;
    }
    return last;
  }

  // --- Nothing to show is shown as nothing --------------------------------
  await load({ reviews: [] });
  check('no reviews renders nothing at all', (await hidden()) === true);
  check('and draws no empty card frames', (await cards()) === 0);

  await load('boom');
  check('a review service that is down renders nothing', (await hidden()) === true);

  await load('error500');
  check('a review service returning an error renders nothing', (await hidden()) === true);

  await load({ reviews: [{ rating: 5, body: '   ', reviewer_name: 'Blank' }] });
  check('a blank review body is not shown as an empty quote', (await hidden()) === true);

  // --- One review: shown, but no carousel furniture -----------------------
  await load({ reviews: [review(1)] });
  check('a single review is shown', (await hidden()) === false && (await cards()) === 1);
  check('a single review shows no arrows', (await navHidden()) === true,
    'arrows over content that does not scroll');

  // --- Many reviews -------------------------------------------------------
  const many = Array.from({ length: 24 }, (_, i) => review(i + 1));
  await load({ reviews: many });
  check('every review is in the track, not just the first few',
    (await cards()) === 24, 'got ' + (await cards()));
  check('the service is asked for more than a handful',
    /limit=(\d\d+)/.test(section) && Number(section.match(/limit=(\d+)/)[1]) >= 20,
    'the fetch still caps at ' + (section.match(/limit=(\d+)/) || [])[1]);

  check('the arrows appear once the reviews overflow', (await navHidden()) === false);
  check('at the start there is nothing to go back to', (await disabled('[data-proof-prev]')) === true);
  check('at the start there is more to come', (await disabled('[data-proof-next]')) === false);
  check('the readout says where you are', /^1(–\d+)? of 24$/.test(await countText()),
    await countText());

  const atStart = await scrollLeft();
  await page.click('[data-proof-next]');
  const moved = await settled();
  check('the next arrow scrolls the track', moved > atStart);
  check('and it moves by whole cards, not a hair',
    moved - atStart > 200, 'moved ' + Math.round(moved - atStart) + 'px');
  check('going forward enables going back', (await disabled('[data-proof-prev]')) === false);
  check('the readout follows the track', !/^1(–|\s)/.test(await countText()), await countText());

  await page.click('[data-proof-prev]');
  await settled();
  check('the previous arrow comes back', Math.abs((await scrollLeft()) - atStart) < 4);

  // --- The far end, reached the way a visitor reaches it ------------------
  for (let i = 0; i < 30 && !(await disabled('[data-proof-next]')); i++) {
    await page.click('[data-proof-next]');
    await settled();
  }
  check('at the end there is nothing more to show',
    (await disabled('[data-proof-next]')) === true,
    'the next arrow would scroll into blank space');
  check('the readout ends on the last review', /24 of 24$/.test(await countText()),
    await countText());

  // --- Keyboard -----------------------------------------------------------
  await load({ reviews: many });
  await page.focus('[data-proof-grid]');
  await page.keyboard.press('ArrowRight');
  await settled();
  check('arrow keys move the carousel', (await scrollLeft()) > 0);
  await page.keyboard.press('Home');
  await settled();
  check('Home returns to the first review', (await scrollLeft()) < 4);
  await page.keyboard.press('End');
  await settled();
  check('End jumps to the last', (await disabled('[data-proof-next]')) === true);

  // --- A phone ------------------------------------------------------------
  await load({ reviews: many }, 390);
  check('the track still scrolls on a phone', (await navHidden()) === false);
  const wide = await page.$eval('[data-proof-grid]',
    (e) => e.scrollWidth > e.clientWidth && e.clientWidth <= 390);
  check('and the cards do not overflow the screen sideways', wide);
  const bodyScrolls = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1);
  check('the page itself does not scroll sideways', bodyScrolls === false,
    'the carousel pushed the page wider than the phone');

  // --- Partly-filled reviews ----------------------------------------------
  await load({ reviews: [
    { rating: 5, body: 'No photo and no group on this one.', reviewer_name: 'Dana R.' },
    { rating: 4, body: 'No name at all.' },
    { rating: 0, body: 'No rating either.', reviewer_name: 'Sam' },
  ] });
  check('reviews missing a photo, a group or a name still render', (await cards()) === 3);
  check('a missing name falls back to something sayable',
    (await page.$$eval('.ss-proof__name', (n) => n.map((e) => e.textContent)))
      .every((t) => t && t.trim().length > 0));

  check('nothing threw along the way', errors.length === 0, errors[0]);

  await browser.close();

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
