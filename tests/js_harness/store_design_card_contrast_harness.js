/*
Can a shopper read the price in EVERY store design, not just some of them?

The report was that one store showed a black price and size range and every
other store showed white. That is not a per-store setting — it is the store
DESIGN. Three of the six designs repaint every span inside a product tile:

  gradient  #111318   dark
  spray     #f6f8fb   near-white
  pro       #f5f8fb   near-white

Those rules belong to the theme's own card, whose interior really does go dark
under spray and pro. Our card keeps its own opaque white deck, so it took the
near-white text without the dark background behind it.

Reading the CSS was how this was missed the first two times: the card declares
`color: #111 !important` and that is true, and it still loses, because the
design rule carries !important at a far higher specificity. Specificity is
exactly the thing not to reason about in your head, so this renders the real
card under each of the six real designs and measures the contrast the shopper
actually gets.

Run:  node tests/js_harness/store_design_card_contrast_harness.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) { console.log('PASS - ' + name); }
  else { console.error('FAIL - ' + name + (detail ? ': ' + detail : '')); failures.push(name); }
}

const card = read('snippets', 'product-card.liquid');
const cardCss = card.slice(card.indexOf('<style>') + 7, card.lastIndexOf('</style>'));
const baseCss = read('assets', 'base.css');
const layoutCss = read('assets', 'storefront-fixed-layouts.css');
const structureCss = read('assets', 'storefront-template-structure.css');

const gridSnippet = read('snippets', 'product-grid.liquid');
const gridCss = gridSnippet
  .slice(gridSnippet.indexOf('{% stylesheet %}') + 16, gridSnippet.lastIndexOf('{% endstylesheet %}'))
  .replace(/\{\{[^}]*\}\}/g, '')
  .replace(/\{%[^%]*%\}/g, '');

const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Every design the appearance panel can save. private-store-layout-state
// always writes data-layout, and falls back to "classic", so this is the
// complete set a live storefront can be in.
const DESIGNS = ['classic', 'split', 'gradient', 'spray', 'pro', 'heritage'];

// The team colours the layout CSS reads. Deliberately a dark primary with
// white text on it, which is the default an untouched store ships with.
const TEAM_VARS = `
  #MainContent {
    --ss-team-primary: #1f2937;
    --ss-team-secondary: #d4af37;
    --ss-team-primary-text: #ffffff;
    --ss-team-secondary-text: #111111;
  }`;

function pageFor(design) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${baseCss}</style>
<style>${gridCss}</style>
<style>${structureCss}</style>
<style>${layoutCss}</style>
<style>${TEAM_VARS}</style>
<style>${cardCss}</style>
</head>
<body>
<div id="MainContent">
  <div id="ss-private-store-state" hidden
       data-enabled="true"
       data-layout="${design}"
       data-template-suffix="private-store-${design}"></div>
  <div class="section product-grid-container ss-private-catalog">
    <results-list>
      <ul class="product-grid product-grid--organic" product-grid-view="default" style="--mobile-columns: 2;">
        <li class="product-grid__item product-grid__item--0">
          <div class="product-grid__card">
            <div class="product-card ss-card-shell">
              <a href="#" class="ss-link-wrapper">
                <div class="ss-image-stage">
                  <span class="ss-includes-badge">Name &amp; Number</span>
                  <div class="ss-master-box" style="aspect-ratio: 1;">
                    <div class="ss-image-layers">
                      <img src="${PX}" class="ss-shirt-img ss-img-primary" width="600" height="600" alt="">
                    </div>
                  </div>
                </div>
                <div class="ss-info-deck">
                  <h3 class="ss-title">Cotton Heritage M2580 Pullover Hoodie</h3>
                  <div class="ss-meta-row">
                    <span class="ss-price">$45</span>
                    <span class="ss-sizes">XS&ndash;3XL</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </li>
      </ul>
    </results-list>
  </div>
</div>
</body></html>`;
}

// WCAG contrast. 4.5 is the small-text threshold; white on white is 1.0.
const MIN_CONTRAST = 4.5;

async function measure(pg) {
  return pg.evaluate(() => {
    function parse(c) {
      const m = /rgba?\(([^)]+)\)/.exec(c);
      if (!m) return null;
      const p = m[1].split(',').map((s) => parseFloat(s));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    // The colour actually painted behind an element: the nearest ancestor
    // (itself included) with a background that is not fully transparent.
    function backdrop(el) {
      let n = el;
      while (n && n.nodeType === 1) {
        const bg = parse(getComputedStyle(n).backgroundColor);
        if (bg && bg.a > 0.5) return bg;
        n = n.parentElement;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    }
    function lum(c) {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }
    function ratio(a, b) {
      const l1 = lum(a), l2 = lum(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    const out = [];
    ['.ss-title', '.ss-price', '.ss-sizes', '.ss-includes-badge'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (!el) { out.push({ sel, missing: true }); return; }
      const fg = parse(getComputedStyle(el).color);
      const bg = backdrop(el);
      out.push({
        sel,
        color: getComputedStyle(el).color,
        behind: 'rgb(' + [bg.r, bg.g, bg.b].join(', ') + ')',
        contrast: Math.round(ratio(fg, bg) * 100) / 100,
      });
    });
    return out;
  });
}

(async () => {
  let current = 'classic';
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(pageFor(current));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;

  const launchOptions = process.env.PW_CHROMIUM_PATH
    ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launchOptions);

  const rows = [];
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    for (const design of DESIGNS) {
      current = design;
      await pg.goto(origin + '/?d=' + design);
      await pg.waitForTimeout(120);
      const report = await measure(pg);
      report.forEach((r) => {
        const label = design + ' @' + viewport.width + ' ' + r.sel;
        if (r.missing) { check(label + ' exists', false, 'not in the DOM'); return; }
        rows.push(Object.assign({ design, vw: viewport.width }, r));
        check(label + ' is readable',
          r.contrast >= MIN_CONTRAST,
          'contrast ' + r.contrast + ':1 — ' + r.color + ' on ' + r.behind);
      });
    }
    await ctx.close();
  }

  // The user asked for one standard across every store, so also assert the
  // answer does not depend on which design an organiser picked.
  ['.ss-price', '.ss-sizes', '.ss-title', '.ss-includes-badge'].forEach((sel) => {
    const seen = Array.from(new Set(rows.filter((r) => r.sel === sel).map((r) => r.color)));
    check(sel + ' is the same colour in every design', seen.length === 1, seen.join(' / '));
  });

  console.table(rows.filter((r) => r.vw === 390).map((r) => ({
    design: r.design, el: r.sel, color: r.color, behind: r.behind, contrast: r.contrast,
  })));

  await browser.close();
  await new Promise((r) => server.close(r));

  if (failures.length) { console.error('\nFAILED: ' + failures.join(', ')); process.exit(1); }
  console.log('\nALL OK');
})();
