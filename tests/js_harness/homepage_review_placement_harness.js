/*
Proves where the approved-reviews section actually lands on the rendered
homepage, in a real browser, using the real theme sources.

Why this exists: templates/index.json already orders the reviews section
directly before the product catalog, yet the section rendered at the very
bottom of the live page. The JSON order is not the final order —
ss-home-catalog-controller.js lifts the catalog out of its own section and
drops it inside the landing hub, and the landing hub holds the whole rest of
the page. Anything that reads the JSON and stops there concludes the order is
already correct. Only the rendered DOM shows otherwise, so that is what this
harness checks.

The landing-hub markup here is a stand-in (the real section is ~2700 lines),
but the two scripts that do the moving are read from their real files and the
slot anchors are asserted against the real landing-dual-hub.liquid, so the
placement logic under test cannot drift from what ships.

Exit code 0 and "ALL OK" on stdout means every scenario passed.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

const SECTION_ID = 'test-reviews';
const API = 'https://reviews.example.test';

// Render just enough Liquid to get the real section's HTML and inline script.
function renderReviewSection() {
  let src = read('sections', 'ss-featured-store-reviews.liquid');
  src = src.replace(/\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}/, '');
  src = src.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');
  src = src.replace(/\{%-?\s*assign[\s\S]*?-?%\}/g, '');
  src = src.replace(/\{\{\s*review_api[^}]*\}\}/g, API);
  src = src.replace(/\{\{\s*section\.settings\.\w+[^}]*\}\}/g, 'copy');
  src = src.replace(/\{\{\s*section\.id\s*\}\}/g, SECTION_ID);
  if (/\{[{%]/.test(src)) throw new Error('unrendered Liquid left in review section: ' + src.match(/\{[{%][^\n]*/)[0]);
  return src.trim();
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const results = [];
function run(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { console.log('PASS - ' + name); })
    .catch((e) => { console.error('FAIL - ' + name + ': ' + ((e && e.stack) || e)); results.push(name); });
}

// The homepage as the browser receives it: top-level sections in the exact
// order templates/index.json lists them.
function page({ signedIn }) {
  const hub = signedIn
    ? `<section class="ss-member-hero">member hero</section>
       <div class="ss-home-slot" data-ss-home-slot="reviews"></div>
       <section class="ss-section">create another store</section>`
    : `<section class="ss-hero">hero</section>
       <section class="ss-proof-bar">stats</section>
       <div class="ss-home-slot" data-ss-home-slot="reviews"></div>
       <div class="ss-home-slot" data-ss-home-slot="catalog"></div>
       <section class="ss-section ss-pain-section">pain</section>
       <section class="ss-final-cta">final cta</section>`;

  return `<!doctype html><html><body>
    <div class="shopify-section"></div>
    <div class="shopify-section">
      <div data-ss-home-catalog-control data-signed-in="${signedIn}" hidden></div>
    </div>
    <div class="shopify-section">
      <section class="ss-home" id="ss-home-hub">${hub}</section>
    </div>
    <div class="shopify-section" id="reviews-shell">${renderReviewSection()}</div>
    <div class="shopify-section">
      <section class="ss-public-catalog">
        <div class="ss-public-catalog__wrap">
          <div class="ss-public-catalog__head">catalog</div>
          <div data-ss-grid>
            <div class="ss-public-catalog__card">a</div>
            <div class="ss-public-catalog__card">b</div>
          </div>
        </div>
      </section>
    </div>
  </body></html>`;
}

// Every visible landmark, in the order the browser lays them out.
const ORDER_SCRIPT = `Array.from(document.querySelectorAll(
  '.ss-hero, .ss-member-hero, .ss-proof-bar, .ss-proof, .ss-public-catalog, .ss-pain-section, .ss-final-cta'
)).map((node) => {
  if (node.classList.contains('ss-hero')) return 'hero';
  if (node.classList.contains('ss-member-hero')) return 'member-hero';
  if (node.classList.contains('ss-proof-bar')) return 'stats';
  if (node.classList.contains('ss-proof')) return 'reviews';
  if (node.classList.contains('ss-public-catalog')) return 'catalog';
  if (node.classList.contains('ss-pain-section')) return 'pain';
  return 'final-cta';
})`;

async function load(browser, opts) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await p.route('**/reviews/featured*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ reviews: opts.reviews })
  }));

  await p.setContent(page(opts), { waitUntil: 'domcontentloaded' });
  await p.addScriptTag({ content: read('assets', 'ss-home-catalog-controller.js') });
  await p.waitForTimeout(400);
  return { p, ctx, errors };
}

const REVIEW = {
  rating: 5,
  body: 'Love this platform. Made creating a team store so fast and easy.',
  reviewer_name: 'Sharna Campbell',
  group_name: 'Raptors Baseball'
};

(async () => {
  const browser = await chromium.launch();

  await run('the landing hub declares both placement slots', () => {
    const hub = read('sections', 'landing-dual-hub.liquid');
    assert((hub.match(/data-ss-home-slot="reviews"/g) || []).length === 2,
      'expected a reviews slot in both the logged-in and logged-out branches');
    assert((hub.match(/data-ss-home-slot="catalog"/g) || []).length === 1,
      'expected one catalog slot');
    const reviewsAt = hub.lastIndexOf('data-ss-home-slot="reviews"');
    const catalogAt = hub.indexOf('data-ss-home-slot="catalog"');
    assert(reviewsAt < catalogAt, 'reviews slot must come before the catalog slot');
  });

  await run('signed out: reviews render above the catalog, not at the bottom', async () => {
    const { p, ctx, errors } = await load(browser, { signedIn: false, reviews: [REVIEW] });
    const order = await p.evaluate(ORDER_SCRIPT);
    assert(JSON.stringify(order) === JSON.stringify(
      ['hero', 'stats', 'reviews', 'catalog', 'pain', 'final-cta']),
      'got order: ' + JSON.stringify(order));
    assert(!errors.length, 'console/page errors: ' + errors.join(' | '));
    await ctx.close();
  });

  await run('signed in: reviews sit under the member hero (catalog is removed)', async () => {
    const { p, ctx, errors } = await load(browser, { signedIn: true, reviews: [REVIEW] });
    const order = await p.evaluate(ORDER_SCRIPT);
    assert(JSON.stringify(order) === JSON.stringify(['member-hero', 'reviews']),
      'got order: ' + JSON.stringify(order));
    assert(!errors.length, 'console/page errors: ' + errors.join(' | '));
    await ctx.close();
  });

  await run('one approved review renders with name, group and 5 stars', async () => {
    const { p, ctx } = await load(browser, { signedIn: false, reviews: [REVIEW] });
    const card = p.locator('.ss-proof__card');
    assert(await card.count() === 1, 'expected exactly one card');
    assert((await p.locator('.ss-proof__name').textContent()) === 'Sharna Campbell');
    assert((await p.locator('.ss-proof__meta').textContent()) === 'Raptors Baseball');
    assert((await p.locator('.ss-proof__stars').getAttribute('aria-label')) === '5 out of 5 stars');
    assert((await p.locator('.ss-proof__avatar').textContent()) === 'SC', 'initials avatar when no photo');
    assert(await p.locator('.ss-proof').isVisible(), 'section should be visible');
    await ctx.close();
  });

  await run('a 3-star review shows five stars, three of them filled', async () => {
    const { p, ctx } = await load(browser, {
      signedIn: false,
      reviews: [Object.assign({}, REVIEW, { rating: 3 })]
    });
    const stars = p.locator('.ss-proof__stars');
    assert((await stars.textContent()) === '★★★★★', 'expected five glyphs, got ' + (await stars.textContent()));
    assert((await stars.locator('i').textContent()) === '★★', 'expected two dimmed stars');
    assert((await stars.getAttribute('aria-label')) === '3 out of 5 stars');
    await ctx.close();
  });

  await run('no featured reviews: section stays hidden, catalog still placed', async () => {
    const { p, ctx, errors } = await load(browser, { signedIn: false, reviews: [] });
    assert(!(await p.locator('.ss-proof').isVisible()), 'section must stay hidden with no reviews');
    const order = await p.evaluate(ORDER_SCRIPT);
    assert(order.indexOf('catalog') === order.indexOf('stats') + 2, 'catalog still lands in its slot');
    assert(!errors.length, 'console/page errors: ' + errors.join(' | '));
    await ctx.close();
  });

  await run('a review with no body is dropped rather than shown empty', async () => {
    const { p, ctx } = await load(browser, {
      signedIn: false,
      reviews: [Object.assign({}, REVIEW, { body: '   ' })]
    });
    assert(await p.locator('.ss-proof__card').count() === 0, 'blank review should not render a card');
    assert(!(await p.locator('.ss-proof').isVisible()), 'section stays hidden when nothing renders');
    await ctx.close();
  });

  await run('the review service being down leaves the page clean', async () => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(String(e)));
    await p.route('**/reviews/featured*', (route) => route.abort());
    await p.setContent(page({ signedIn: false }), { waitUntil: 'domcontentloaded' });
    await p.addScriptTag({ content: read('assets', 'ss-home-catalog-controller.js') });
    await p.waitForTimeout(400);
    assert(!(await p.locator('.ss-proof').isVisible()), 'section stays hidden when the service fails');
    assert(!errors.length, 'a failed fetch must not throw: ' + errors.join(' | '));
    const order = await p.evaluate(ORDER_SCRIPT);
    assert(order.includes('catalog'), 'catalog placement is independent of the review service');
    await ctx.close();
  });

  await browser.close();

  if (results.length) {
    console.error('\n' + results.length + ' FAILED: ' + results.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
