/*
Drives the Raptors demo store on the homepage in a real browser.

This is the page's strongest asset — a stranger can walk a real team store
before giving up an email address — so what it shows has to be the whole
product. It was showing a third of it: back photos were already sitting in
ss-raptors-demo.json and the UI only ever read the front, no price appeared
anywhere, and name & number was not mentioned until two sections later.

The catalog, the script and the styles are read out of the shipped files
rather than restated here, so this fails if any of them drifts.

What has to hold:

  - a product with back photos can be turned around, and the back shown is
    the back of the COLOUR being viewed, not of some other colour;
  - a product with no back photo offers no Back button at all — a disabled
    one reads as a missing photo rather than a one-sided print;
  - switching colour while looking at the back keeps you on the back;
  - every product shows a price, and no price contradicts the catalog the
    same page renders further down;
  - personalizable products say so, and can hand you to the live preview.

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

const catalog = JSON.parse(read('assets', 'ss-raptors-demo.json'));
const script = read('assets', 'ss-home-mobile.js');
const css = read('assets', 'ss-home-mobile.css');
const section = read('sections', 'landing-dual-hub.liquid');

// The store markup, taken from the section itself.
const storeMarkup = section.match(/<section class="ad-section ad-store-section"[\s\S]*?<\/section>/);
if (!storeMarkup) {
  console.error('FAIL - the demo store markup is no longer in landing-dual-hub.liquid');
  process.exit(1);
}
const markup = storeMarkup[0]
  .replace(/\{\{\s*section\.id\s*\}\}/g, 'demo')
  .replace(/\{\{\s*'[^']+'\s*\|\s*asset_url\s*\}\}/g, 'CATALOG_URL')
  .replace(/\{\{\s*request_url[^}]*\}\}/g, '/pages/request-storefront-form')
  .replace(/\{%-?[\s\S]*?-?%\}/g, '');

// --- The data itself, before any browser runs ------------------------------
const withBack = catalog.filter(p => p.colors.some(c => c.back));
const noBack = catalog.filter(p => !p.colors.some(c => c.back));

check('the catalog still carries products with a back photo', withBack.length > 0,
  'nothing left to prove the front/back switch against');
check('every product has a price', catalog.every(p => /^\$\d+$/.test(p.price || '')),
  catalog.filter(p => !/^\$\d+$/.test(p.price || '')).map(p => p.title).join(', '));
check('every colour has a front photo', catalog.every(p => p.colors.every(c => c.front)));
// The colour token sits between the side marker and the trailing Shopify
// hash. Pull it out of both filenames and insist they match: a pink front
// beside a grey back is the kind of thing nobody notices until a customer does.
const colourOf = (url) => {
  const file = decodeURIComponent(url.split('?')[0].split('/').pop() || '');
  let m = file.match(/__[A-Za-z0-9]+_(?:front|back)(?:_dtflex)?__([a-z0-9-]+)__(?:front|back)_mockup/);
  if (m) return m[1];
  m = file.match(/_(?:front|back)_([a-z0-9-]+?)(?:-extra-(?:front|back))?_[0-9a-f]{8}-/);
  if (m) return m[1];
  return null;
};
const mismatched = [];
catalog.forEach(p => p.colors.forEach(c => {
  if (!c.back) return;
  const a = colourOf(c.front), b = colourOf(c.back);
  if (a === null || b === null) mismatched.push(`${p.title}: unreadable colour in ${a === null ? 'front' : 'back'} filename`);
  else if (a !== b) mismatched.push(`${p.title}: front is ${a} but back is ${b}`);
}));
check('no back photo is paired with the wrong colour', mismatched.length === 0,
  mismatched.join('; '));

// The demo store, the public catalog and the builder all quote the same
// product on one scroll. Check the demo against the BUILDER — the config that
// actually sets the Shopify price — rather than against the catalog, so the
// three cannot drift together into being wrong in the same way.
const BUILDER_FOR = {
  'Tri-blend team tee': 'bc3413', 'Premium team hoodie': 'm2580',
  'Youth team hoodie': 'cc1467y', 'Youth team tee': 'bc3001y',
  'Cropped hoodie': 'bc7502', 'Comfort Colors tee': 'cc1717',
  'Toddler team tee': 'g3321', 'Team tote': 'ec8000', 'Trucker hat': 'hat39165',
};
const builderPrice = (key) => {
  const cfg = read('..', 'Printful_Automation', 'pro_builders', key, 'config.py');
  const front = cfg.match(/^FRONT_ONLY_PRICE_CENTS\s*=\s*(\d+)/m);
  const back = cfg.match(/^FRONT_BACK_PRICE_CENTS\s*=\s*(\d+)/m);
  const pers = cfg.match(/^SUPPORTS_PERSONALIZATION\s*=\s*(True|False)/m);
  return {
    front: front ? '$' + Math.floor(Number(front[1]) / 100) : null,
    back: back ? '$' + Math.floor(Number(back[1]) / 100) : null,
    pers: pers ? pers[1] === 'True' : null,
  };
};
const priceDrift = [];
const persDrift = [];
catalog.forEach((p) => {
  const key = BUILDER_FOR[p.title];
  if (!key) { priceDrift.push(`${p.title}: no builder mapped`); return; }
  const b = builderPrice(key);
  if (b.front && b.front !== p.price) priceDrift.push(`${p.title}: demo ${p.price} vs builder ${b.front}`);
  if (b.back && b.back !== b.front && b.back !== p.priceBack) {
    priceDrift.push(`${p.title}: demo back ${p.priceBack} vs builder ${b.back}`);
  }
  if (b.pers !== null && b.pers !== !!p.personalizable) {
    persDrift.push(`${p.title}: demo ${p.personalizable} vs builder ${b.pers}`);
  }
});
check('demo prices match the builder that actually charges them',
  priceDrift.length === 0, priceDrift.join('; '));
check('the name & number flag matches the builder',
  persDrift.length === 0, persDrift.join('; '));

function buildPage() {
  return `<!doctype html><meta charset="utf-8">
  <style>:root{--ink:#142238;--muted:#6b7569}${css}</style>
  <body><div class="ss-ad" data-ss-ad>
    ${markup}
    <section class="ad-play-section" style="height:400px">personalization demo</section>
  </div>
  <script>
    window.__catalog = ${JSON.stringify(catalog)};
    window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(window.__catalog) });
    // jsdom-free: real <dialog> works in Chromium, but showModal on a detached
    // dialog throws, so nothing is stubbed here.
  </script>
  <script>${script}</script>
  </body>`;
}

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setContent(buildPage());
  await page.waitForTimeout(400);

  const cardCount = () => page.$$eval('[data-store-product]', n => n.length);
  check('the store renders every product', (await cardCount()) === catalog.length,
    `${await cardCount()} of ${catalog.length}`);
  check('nothing threw while rendering', errors.length === 0, errors[0]);

  // --- Cards carry the price and the flags --------------------------------
  const firstCard = await page.$eval('[data-store-product="0"] small', e => e.textContent);
  check('a card shows its price', firstCard.includes(catalog[0].price), firstCard);

  const backFlags = await page.$$eval('.ad-card-flag',
    n => n.filter(e => /Front \+ back/.test(e.textContent)).length);
  check('products with a back photo are flagged on the card',
    backFlags === withBack.length, `${backFlags} flags for ${withBack.length} products`);

  const persFlags = await page.$$eval('.ad-card-flag-pers', n => n.length);
  check('personalizable products are flagged on the card',
    persFlags === catalog.filter(p => p.personalizable).length);

  // --- A product that has a back -------------------------------------------
  const backIndex = catalog.findIndex(p => p.colors.some(c => c.back));
  const backProduct = catalog[backIndex];
  await page.click(`[data-store-product="${backIndex}"]`);
  await page.waitForTimeout(220);

  const shown = () => page.$eval('[data-detail-image]', e => e.getAttribute('src'));
  const sidesHidden = () => page.$eval('[data-detail-sides]', e => e.hidden);

  check('a product with a back offers the Back button', (await sidesHidden()) === false);
  check('it opens on the front', (await shown()) === backProduct.colors[0].front);

  await page.click('[data-detail-side="back"]');
  await page.waitForTimeout(180);
  check('the Back button shows the back photo',
    (await shown()) === backProduct.colors[0].back,
    'the back image that was already in the file is still not being shown');

  // Colour + side have to compose, or you get one colour's front and another's back.
  const secondWithBack = backProduct.colors.findIndex((c, i) => i > 0 && c.back);
  if (secondWithBack > 0) {
    await page.click(`[data-detail-color="${secondWithBack}"]`);
    await page.waitForTimeout(180);
    check('changing colour keeps you on the back',
      (await shown()) === backProduct.colors[secondWithBack].back,
      'switching colour dropped back to the front, or showed the wrong colour');
    check('and it is that colour’s back, not the first one’s',
      (await shown()) !== backProduct.colors[0].back);
  }

  check('the price is shown in the product view',
    (await page.$eval('.ad-detail-price', e => e.textContent)).includes(backProduct.price));

  await page.click('[data-store-close]');
  await page.waitForTimeout(150);

  // --- A product that has no back ------------------------------------------
  const frontIndex = catalog.findIndex(p => !p.colors.some(c => c.back));
  await page.click(`[data-store-product="${frontIndex}"]`);
  await page.waitForTimeout(220);
  check('a front-only product offers no Back button at all',
    (await sidesHidden()) === true,
    'a disabled Back button reads as a missing photo, not a one-sided print');
  await page.click('[data-store-close]');
  await page.waitForTimeout(150);

  // --- Personalization ------------------------------------------------------
  const persIndex = catalog.findIndex(p => p.personalizable);
  await page.click(`[data-store-product="${persIndex}"]`);
  await page.waitForTimeout(220);
  check('a personalizable product says so in the product view',
    (await page.$('.ad-detail-pers')) !== null);
  check('and it quotes a front + back price too',
    (await page.$eval('.ad-detail-price', e => e.textContent)).includes(catalog[persIndex].priceBack));

  await page.click('[data-pers-jump]');
  await page.waitForTimeout(400);
  check('"Try it" closes the product and heads for the live preview',
    (await page.$eval('[data-store-dialog]', e => e.open)) === false);

  const plainIndex = catalog.findIndex(p => !p.personalizable);
  await page.click(`[data-store-product="${plainIndex}"]`);
  await page.waitForTimeout(220);
  check('a product without name & number does not claim to have it',
    (await page.$('.ad-detail-pers')) === null);

  check('still nothing thrown', errors.length === 0, errors[0]);

  await browser.close();

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
