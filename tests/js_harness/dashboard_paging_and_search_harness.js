/*
Drives the dashboard's "show more" pager and store search in a real browser.

A seller with sixty stores was waiting on the browser to lay out sixty cards
before seeing any of them, so the section now renders every card but displays
ten, and reveals ten more per click. That is only safe if three things hold,
and none of them is obvious from reading the code:

  - the pager reveals exactly ten more, and stops offering when none are left;
  - a search reaches stores the pager has NOT revealed yet, otherwise the one
    store you are looking for is precisely the one still hidden;
  - clearing a search puts you back on the page you were on, rather than
    collapsing to the first ten and losing the clicks.

The script and the CSS are read out of sections/seller-dashboard.liquid rather
than restated here, so this fails if either drifts.

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

const section = read('sections', 'seller-dashboard.liquid');

// The pager script, taken from the section itself.
const scripts = section.split('<script>').slice(1).map((s) => s.split('</script>')[0]);
const pagerScript = scripts.find((s) => s.includes('data-ss-show-more'));

// The rules that do the hiding. Restating them here would let the CSS drift
// out from under a passing test.
const cssMatch = section.match(/\.ss-card-paged-out,\s*\n\s*\.ss-card-filtered \{[^}]*\}/);

const STORE_COUNT = 23;

function buildPage(css, js) {
  const cards = [];
  for (let i = 0; i < STORE_COUNT; i++) {
    // The odd one out is named AND handled differently, so a search for "team"
    // matches exactly twenty-two. Searching covers the handle as well as the
    // name, which is easy to forget when counting expected results.
    const name = i === 17 ? 'Deep Bench Lacrosse' : 'Team ' + i;
    const handle = i === 17 ? 'deep-bench-lacrosse-3978' : 'team-' + i + '-3978';
    cards.push(
      '<div class="ss-store-card ss-paged-card' + (i >= 10 ? ' ss-card-paged-out' : '') + '"' +
      ' data-ss-handle="' + handle + '"' +
      ' data-ss-name="' + name + '"' +
      ' data-ss-position="' + i + '">' + name + '</div>'
    );
  }
  return '<!doctype html><html><head><style>' + css +
    '\n.ss-store-card{display:flex;height:20px;}</style></head><body>' +
    '<div class="ss-store-search"><input data-ss-search type="search">' +
    '<span data-ss-search-count hidden></span></div>' +
    '<div class="ss-store-grid">' + cards.join('') +
    '<div class="ss-store-card ss-god-card">Command Center</div>' +
    '</div>' +
    '<div class="ss-pager" data-ss-pager hidden>' +
    '<button type="button" class="ss-pager-btn" data-ss-show-more>Show more stores</button></div>' +
    '<script>' + js + '<\/script></body></html>';
}

(async () => {
  check('the pager script is present in the section', !!pagerScript);
  check('the hiding rules are present in the section', !!cssMatch);
  if (!pagerScript || !cssMatch) { console.error('\nFAILED'); process.exit(1); }

  check('cards past the first page are hidden by the server, not by JS',
    /ss_paging_on and tile_position >= ss_page_size %\} ss-card-paged-out/.test(section),
    'the first paint would show every card');

  check('hidden cards load their logos lazily',
    /ss_paging_on and tile_position >= ss_page_size -%\}\{%- assign tile_loading = 'lazy'/.test(section),
    'every logo is still requested up front');

  // Cards hidden on the server with no button to reveal them is the one way
  // this feature can lose a store outright, so both read the same switch.
  check('the cards and the controls read one switch',
    (section.match(/\{% if ss_paging_on %\}/g) || []).length === 2 &&
    (section.match(/ss_paging_on and tile_position >= ss_page_size/g) || []).length === 2,
    'the hidden cards and the pager could disagree about whether paging is on');

  // The regression that started this: a raw handle comparison discarded every
  // metaobject whose system handle read back blank, so every card rendered as
  // "building" and every card fell through to the collection lookup.
  const identityChecks = section.match(/assign ss_got = [^\n]*system\.handle/g) || [];
  check('every metaobject lookup is identity-checked', identityChecks.length === 5,
    'found ' + identityChecks.length + ', expected 5');
  check('an unreadable handle is treated as "cannot tell", not as "wrong"',
    (section.match(/ss_got != blank and ss_got != ss_want/g) || []).length === 5,
    'a blank system handle would discard every store on the dashboard');
  check('the handles are compared normalised',
    (section.match(/system\.handle \| default: '' \| strip \| downcase/g) || []).length === 5,
    'casing or whitespace alone would throw a store away');

  check('a no-JS browser still gets every card',
    /<noscript>[\s\S]*\.ss-card-paged-out \{ display: flex !important; \}[\s\S]*<\/noscript>/.test(section),
    'cards hidden on the server would be unreachable without JS');

  // PW_CHROMIUM_PATH lets a machine whose Playwright build does not match its
  // installed browser point at the one it has. Unset everywhere else, where
  // Playwright finds its own.
  const launchOptions = process.env.PW_CHROMIUM_PATH
    ? { executablePath: process.env.PW_CHROMIUM_PATH }
    : {};
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();
  await page.setContent(buildPage(cssMatch[0], pagerScript));

  const visible = () => page.$$eval('.ss-paged-card',
    (els) => els.filter((e) => e.offsetParent !== null).map((e) => e.getAttribute('data-ss-name')));
  const pagerHidden = () => page.$eval('[data-ss-pager]', (e) => e.hidden);
  const buttonText = () => page.$eval('[data-ss-show-more]', (e) => e.textContent.trim());
  const countText = () => page.$eval('[data-ss-search-count]',
    (e) => (e.hidden ? null : e.textContent.trim()));

  check('ten stores on first load', (await visible()).length === 10);
  check('the pager offers the next ten', (await buttonText()) === 'Show 10 more stores');
  check('the pager is showing', (await pagerHidden()) === false);

  // A tool card is not a store and must not be swept up by either control.
  const godVisible = await page.$eval('.ss-god-card', (e) => e.offsetParent !== null);
  check('the Command Center card is not paged out', godVisible);

  // A search on the FIRST page, matching more stores than the page shows. If
  // the pager's limit is still applied while searching, this silently returns
  // ten of the twenty-two — the failure is invisible, because ten results look
  // like a perfectly good answer.
  await page.fill('[data-ss-search]', 'team');
  await page.waitForTimeout(200);
  check('a search is not capped by the page size',
    (await visible()).length === 22,
    'got ' + (await visible()).length + ' of 22 — the pager limit is leaking into search');
  await page.fill('[data-ss-search]', '');
  await page.waitForTimeout(200);
  check('clearing that search returns to the first page', (await visible()).length === 10);

  await page.click('[data-ss-show-more]');
  check('one click reveals ten more', (await visible()).length === 20);

  check('the last page offers only what is left', (await buttonText()) === 'Show 3 more stores');

  // Search must reach store 17, which this page has revealed, and store 22,
  // which it has not.
  await page.fill('[data-ss-search]', 'lacrosse');
  await page.waitForTimeout(200);
  let shown = await visible();
  check('search finds a store by name', shown.length === 1 && shown[0] === 'Deep Bench Lacrosse');
  check('search reports how many matched', (await countText()) === '1 of 23');
  check('the pager steps aside while searching', (await pagerHidden()) === true);

  await page.fill('[data-ss-search]', 'team 22');
  await page.waitForTimeout(200);
  shown = await visible();
  check('search reaches a store the pager never revealed',
    shown.length === 1 && shown[0] === 'Team 22',
    'a search that only looks at revealed cards cannot find the store you want');

  // Handles are searchable too. A seller who knows the storefront link but not
  // what they called the store still has a way in — and "-3978" appears in no
  // store's name, so a name-only search would return nothing.
  await page.fill('[data-ss-search]', '-3978');
  await page.waitForTimeout(200);
  check('search also matches the store handle',
    (await visible()).length === STORE_COUNT,
    'got ' + (await visible()).length + ' — handles are not being searched');

  await page.fill('[data-ss-search]', 'nothing matches this');
  await page.waitForTimeout(200);
  check('an empty result says so',
    await page.$eval('.ss-search-empty', (e) => e.offsetParent !== null && /No stores match/.test(e.textContent)));

  // Clearing returns to the page the pager was on — twenty, not ten.
  await page.fill('[data-ss-search]', '');
  await page.waitForTimeout(200);
  check('clearing a search restores the page you were on, not the first ten',
    (await visible()).length === 20,
    'the clicks that revealed those stores were thrown away');
  check('the pager comes back', (await pagerHidden()) === false);

  await page.fill('[data-ss-search]', 'team 1');
  await page.waitForTimeout(200);
  await page.focus('[data-ss-search]');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  check('escape clears the search', (await page.$eval('[data-ss-search]', (e) => e.value)) === '');
  check('escape restores the cards', (await visible()).length === 20);

  await page.click('[data-ss-show-more]');
  check('the final click reveals the rest', (await visible()).length === STORE_COUNT);
  check('the pager retires when nothing is left', (await pagerHidden()) === true);

  await browser.close();

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
