/*
Drives the "See what your store can sell" catalog at phone width.

Collapsed, this section shows four products. At 460px and below the grid
dropped to one column, so those four became four full-height cards a visitor
had to scroll past before reaching anything else on the page — the section
read as a wall on the device most of them are using.

It also has to survive a product with no catalog photo yet: two of the blanks
in the list have no image, and a broken <img> on the page that answers "what
can my store sell?" is worse than the product being missing.

The section's own markup, styles and script are read out of the shipped file
rather than restated here, so this fails if any of them drifts.

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

const section = read('sections', 'ss-public-product-catalog.liquid')
  .replace(/\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}/g, '');
const controller = read('assets', 'ss-home-catalog-controller.js');

const rendered = section
  .replace(/\{\{\s*section\.id\s*\}\}/g, 'demo')
  .replace(/\{\{\s*catalog_endpoint\s*\|\s*json\s*\}\}/g, '"/catalog"')
  .replace(/\{\{\s*section\.settings\.(\w+)[^}]*\}\}/g, (_m, k) => k)
  .replace(/\{\{\s*\w+[^}]*\}\}/g, '')
  .replace(/\{%-?[\s\S]*?-?%\}/g, '');

const product = (i, extra = {}) => Object.assign({
  id: 'p' + i,
  badge: 'Unisex Tee',
  name: 'Product ' + i,
  from: '$24',
  hint: 'Front or front + back printing',
  image: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  description: 'A description.',
  specs: ['One', 'Two'],
  sizes: 'S · M · L',
  personalizable: false,
  pricing: [{ label: 'Front print', price: '$24' }],
  colors: [{ name: 'Navy', hex: '#111111' }],
  sizes_available: ['S', 'M', 'L'],
}, extra);

function buildPage(products) {
  return `<!doctype html><meta charset="utf-8">
  <style>:root{--ink:#11100e;--paper:#f3f1ec;--muted:#6b7569}*{box-sizing:border-box}body{margin:0}</style>
  <body>
    <script>
      window.__products = ${JSON.stringify(products)};
      window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, products: window.__products }) });
    </script>
    ${rendered}
    <div data-ss-home-catalog-control data-signed-in="false" hidden></div>
    <script>${controller}</script>
  </body>`;
}

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let page;
  const errors = [];

  const PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

  async function load(products, width) {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', (e) => errors.push(String(e)));
    // A real server, so a dead photo fails the way a dead photo fails.
    await page.route('**/good.png', (r) => r.fulfill({ contentType: 'image/gif', body: PIXEL }));
    await page.route('**/dead.png', (r) => r.fulfill({ status: 404, body: '' }));
    await page.route('**/alsodead.png', (r) => r.fulfill({ status: 404, body: '' }));
    await page.setContent(buildPage(products));
    await page.waitForTimeout(450);
  }

  // How many cards share the topmost row: that IS the column count as rendered.
  const perRow = () => page.$$eval('.ss-public-catalog__card', (nodes) => {
    const shown = nodes.filter((n) => n.offsetParent !== null);
    if (!shown.length) return 0;
    const top = Math.round(shown[0].getBoundingClientRect().top);
    return shown.filter((n) => Math.abs(Math.round(n.getBoundingClientRect().top) - top) < 4).length;
  });
  const shownCards = () => page.$$eval('.ss-public-catalog__card',
    (n) => n.filter((e) => e.offsetParent !== null).length);

  const twenty = Array.from({ length: 20 }, (_, i) => product(i + 1));

  // --- The phone widths that mattered -------------------------------------
  for (const width of [320, 390, 430, 459]) {
    await load(twenty, width);
    check(`two products across at ${width}px`, (await perRow()) === 2,
      (await perRow()) + ' across');
    check(`still only four before "view all" at ${width}px`, (await shownCards()) === 4,
      (await shownCards()) + ' shown');
  }

  // Four cards over two rows is the whole point: it has to be short.
  await load(twenty, 390);
  const gridHeight = await page.$eval('[data-ss-grid]', (e) => e.getBoundingClientRect().height);
  check('the collapsed grid is about two rows tall, not four',
    gridHeight < 900, Math.round(gridHeight) + 'px');
  check('the page does not scroll sideways on a phone',
    (await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)));

  // --- Expanding still works ----------------------------------------------
  const toggle = await page.$('.ss-home-catalog__toggle');
  check('a "view all" control is offered', toggle !== null);
  if (toggle) {
    check('it names the real total',
      /20/.test(await page.$eval('.ss-home-catalog__toggle', (e) => e.textContent)),
      await page.$eval('.ss-home-catalog__toggle', (e) => e.textContent));
    await toggle.click();
    await page.waitForTimeout(250);
    check('expanding shows every product', (await shownCards()) === 20);
    check('and stays two across', (await perRow()) === 2);
  }

  // --- Wider screens are unchanged ----------------------------------------
  await load(twenty, 1280);
  check('four across on a desktop', (await perRow()) === 4, (await perRow()) + ' across');
  await load(twenty, 900);
  check('three across on a tablet', (await perRow()) === 3, (await perRow()) + ' across');
  await load(twenty, 700);
  check('two across on a small tablet', (await perRow()) === 2, (await perRow()) + ' across');

  // --- Fewer than four ------------------------------------------------------
  await load([product(1), product(2)], 390);
  check('two products render without a "view all"',
    (await shownCards()) === 2 &&
    (await page.$eval('.ss-home-catalog__toggle', (e) => e.hidden)) === true);

  // --- A blank with no catalog photo yet ------------------------------------
  await load([product(1, { image: '', badge: 'Youth Long Sleeve Tee' }), product(2)], 390);
  check('a product with no photo still appears', (await shownCards()) === 2);
  check('and shows a named tile instead of a broken image',
    (await page.$('.ss-public-catalog__nophoto')) !== null &&
    (await page.$$eval('.ss-public-catalog__card img', (n) => n.length)) === 1);
  check('the tile names the product',
    /Youth Long Sleeve Tee/i.test(await page.$eval('.ss-public-catalog__nophoto', (e) => e.textContent)));

  await page.click('.ss-public-catalog__card');
  await page.waitForTimeout(250);
  check('opening it does not put a broken image in the modal',
    (await page.$('.ss-public-catalog__nophoto--modal')) !== null);

  // --- Badges must not sit on the garment at phone width -------------------
  await load([product(1, { personalizable: true }), product(2)], 390);
  check('the category badge is off the photo on a phone',
    (await page.$eval('.ss-public-catalog__badge', (e) => getComputedStyle(e).display)) === 'none',
    'the pill still covers the shoulder of a 170px-wide garment');
  check('the name & number marker is still shown',
    (await page.$eval('.ss-public-catalog__personalized', (e) => e.offsetParent !== null)) === true,
    'that one is real information, not a repeat of the name');
  check('and it sits in the text, not over the photo',
    (await page.$eval('.ss-public-catalog__personalized', (e) => getComputedStyle(e).position)) === 'static');
  const markerOverlaps = await page.$eval('.ss-public-catalog__card', (card) => {
    const marker = card.querySelector('.ss-public-catalog__personalized');
    const photo = card.querySelector('.ss-public-catalog__media');
    const m = marker.getBoundingClientRect(), p = photo.getBoundingClientRect();
    return !(m.top >= p.bottom - 1 || m.bottom <= p.top + 1);
  });
  check('nothing is drawn over the product photo', markerOverlaps === false);

  // --- Wide screens keep the badges where they were ------------------------
  await load([product(1, { personalizable: true })], 1280);
  check('the badge is back on the photo on a desktop',
    (await page.$eval('.ss-public-catalog__badge', (e) => getComputedStyle(e).display)) !== 'none');
  check('and so is the marker',
    (await page.$eval('.ss-public-catalog__personalized', (e) => getComputedStyle(e).position)) === 'absolute');
  const onPhoto = await page.$eval('.ss-public-catalog__card', (card) => {
    const m = card.querySelector('.ss-public-catalog__personalized').getBoundingClientRect();
    const p = card.querySelector('.ss-public-catalog__media').getBoundingClientRect();
    return m.top >= p.top - 1 && m.bottom <= p.bottom + 1;
  });
  check('the marker sits over the photo on a desktop, as before', onPhoto === true);

  // --- A photo that will not load --------------------------------------------
  await load([product(1, { image: 'https://img.test/dead.png', image_fallback: 'https://img.test/good.png', badge: 'Youth Long Sleeve Tee' })], 1280);
  await page.waitForTimeout(400);
  // Read it without assuming the img survived: dropping the fallback hop
  // replaces it with a tile, and that has to report as a failed check rather
  // than crash the run.
  const cardSrc = await page.$eval('.ss-public-catalog__media',
    (m) => (m.querySelector('img') || {}).currentSrc || (m.querySelector('img') || {}).src || 'replaced by tile');
  check('a dead photo falls back to the second source',
    cardSrc === 'https://img.test/good.png',
    'the card gave up instead of trying the fallback (' + cardSrc + ')');
  check('and no tile is shown when the fallback works',
    (await page.$('.ss-public-catalog__nophoto')) === null);

  await load([product(1, { image: 'https://img.test/dead.png', image_fallback: 'https://img.test/alsodead.png', badge: 'Youth Long Sleeve Tee' })], 1280);
  await page.waitForTimeout(500);
  check('both sources dead falls back to the named tile',
    (await page.$('.ss-public-catalog__nophoto')) !== null,
    'a broken-image icon on the page that answers "what can my store sell?"');
  check('the tile still names the product',
    /Youth Long Sleeve Tee/i.test(await page.$eval('.ss-public-catalog__nophoto', (e) => e.textContent)));

  await load([product(1, { image: 'https://img.test/dead.png', image_fallback: '' })], 1280);
  await page.waitForTimeout(500);
  check('a dead photo with no fallback goes straight to the tile',
    (await page.$('.ss-public-catalog__nophoto')) !== null);

  check('nothing threw', errors.length === 0, errors[0]);

  await browser.close();

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
