/*
The private-store grid puts pinned products first.

The admin's pin is only worth anything if a shopper actually sees the product
first. That ordering is applied by CSS `order` on the grid, which is easy to
break invisibly: a later rule can change the grid's display mode, or the pin
attribute can stop being stamped, and the page still looks fine — just in the
wrong order.

The section's Liquid is rendered here rather than restated: the pin condition
and the attribute name are read out of the shipped section file, so this fails
if either drifts.

Usage: NODE_PATH=/tmp/pwtest/node_modules node tests/js_harness/private_store_pin_order.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) console.log('PASS - ' + name);
  else { console.error('FAIL - ' + name + (detail ? '\n        ' + detail : '')); failures.push(name); }
}

const section = read('sections/private-store-collection-catalog.liquid');

// The rule MUST live in the section's own {% stylesheet %} block. It was once
// in assets/storefront-final-tune.css, which is loaded by a section no
// template renders — so it never shipped, the pin silently did nothing on the
// storefront, and this harness still passed because it only checked that the
// rule existed in *a* file. Read it out of the block that actually ships.
const styleBlock = (/\{%\s*stylesheet\s*%\}([\s\S]*?)\{%\s*endstylesheet\s*%\}/.exec(section) || [, ''])[1];

// --- the section must still stamp the flag the CSS sorts on -----------------

check('the section builds the pin tag from the store handle',
  /assign ss_pin_tag = 'pinned--' \| append: private_handle/.test(section),
  'the storefront must derive the same tag the admin writes');
check('the section stamps data-ss-pinned on the grid item',
  /data-ss-pinned="true"/.test(section));
// The pin can only sort within a rendered page, so the page has to be big
// enough to hold the whole store. 50 is Shopify's paginate ceiling.
const perPage = /assign products_per_page = (\d+)/.exec(section);
check('the store paginates large enough for the pin to be global',
  !!perPage && Number(perPage[1]) >= 50,
  perPage
    ? `paginating by ${perPage[1]} — a pinned product past that page cannot reach the top`
    : 'products_per_page assignment not found');

check('the ordering rule ships with the section that stamps the flag',
  /\[data-ss-pinned=['"]true['"]\][^}]*order:\s*-1/.test(styleBlock.replace(/\s+/g, ' ')),
  'the rule must be inside the section\'s {% stylesheet %} block, or it is never delivered');

// Belt and braces: a rule sitting in a stylesheet no template loads is the
// exact bug this file exists to prevent recurring.
const orphanedCss = ['assets/storefront-final-tune.css'];
for (const file of orphanedCss) {
  const loadedBy = fs.readdirSync(path.join(ROOT, 'sections'))
    .filter((f) => read('sections/' + f).includes(path.basename(file)));
  const rendered = loadedBy.filter((sectionFile) => {
    const type = sectionFile.replace(/\.liquid$/, '');
    return fs.readdirSync(path.join(ROOT, 'templates'))
      .some((t) => t.endsWith('.json') && read('templates/' + t).includes('"' + type + '"'));
  });
  check(`${file} is not where ordering rules should live`,
    !read(file).includes('data-ss-pinned'),
    rendered.length ? '' : `nothing renders the section that loads ${file}`);
}

// --- and the rule must actually reorder a real grid --------------------------

const GRID_CSS = `
  .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .product-grid__item { padding: 6px; }
`;
const PAGE = `<!doctype html><meta charset="utf-8"><style>${GRID_CSS}${styleBlock}</style>
<div class="ss-private-catalog">
  <ul class="product-grid">
    <li class="product-grid__item" data-product-id="1" data-ss-categories="hoodies">A</li>
    <li class="product-grid__item" data-product-id="2" data-ss-categories="shirts">B</li>
    <li class="product-grid__item ss-pinned" data-product-id="3" data-ss-categories="shirts" data-ss-pinned="true">C</li>
    <li class="product-grid__item" data-product-id="4" data-ss-categories="tanks">D</li>
  </ul>
</div>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 900, height: 700 });
  await page.setContent(PAGE);

  // Visual order, not DOM order — `order` changes one and not the other.
  const visual = await page.evaluate(() =>
    [...document.querySelectorAll('.product-grid__item')]
      .map((el) => ({ t: el.textContent.trim(), y: el.getBoundingClientRect().top, x: el.getBoundingClientRect().left }))
      .sort((a, b) => (a.y - b.y) || (a.x - b.x))
      .map((v) => v.t)
  );
  check('the pinned product is painted first', visual[0] === 'C',
    `visual order was ${visual.join(' ')} — C is the pinned one and is third in the DOM`);
  check('the others keep their original order behind it',
    visual.slice(1).join('') === 'ABD', `got ${visual.slice(1).join('')}`);

  // The filter only toggles `hidden`; hiding a sibling must not disturb the pin.
  const afterFilter = await page.evaluate(() => {
    document.querySelector('[data-product-id="1"]').hidden = true;
    return [...document.querySelectorAll('.product-grid__item')]
      .filter((el) => !el.hidden)
      .map((el) => ({ t: el.textContent.trim(), y: el.getBoundingClientRect().top, x: el.getBoundingClientRect().left }))
      .sort((a, b) => (a.y - b.y) || (a.x - b.x))
      .map((v) => v.t);
  });
  check('the pin survives the category filter', afterFilter[0] === 'C',
    `visual order after hiding A was ${afterFilter.join(' ')}`);

  await browser.close();
  console.log('');
  if (failures.length) {
    console.error(`${failures.length} FAILED: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('ALL OK');
})();
