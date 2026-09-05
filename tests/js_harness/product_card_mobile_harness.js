/*
Is the price actually visible on a phone?

It was reported invisible on mobile, twice. The first attempt assumed a colour
problem and made the price darker and bolder, which changed nothing — so the
cause is not the colour, and reading more CSS was not going to settle it.

This renders the real card, with the real theme stylesheet, at a real phone
viewport, and measures. Visible here means: painted, inside the card's own
clipped box, and not sitting under something else.

Run:  node tests/js_harness/product_card_mobile_harness.js
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
// The real page (private-store-collection-catalog) wraps cards in the THEME's
// product-grid, not the studio-shop grid, so its stylesheet is the one that
// governs the card's box on a phone. Liquid interpolation in it is stripped:
// only the plain rules matter here.
const gridSnippet = read('snippets', 'product-grid.liquid');
const gridCss = gridSnippet
  .slice(gridSnippet.indexOf('{% stylesheet %}') + 16, gridSnippet.lastIndexOf('{% endstylesheet %}'))
  .replace(/\{\{[^}]*\}\}/g, '')
  .replace(/\{%[^%]*%\}/g, '');

// A 1x1 transparent PNG standing in for the mockup: the real one is a square
// photo and its aspect ratio is what drives the image stage's height.
const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function cardMarkup(title) {
  return `
  <li class="product-grid__item">
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
            <h3 class="ss-title">${title}</h3>
            <div class="ss-meta-row">
              <span class="ss-price">$45</span>
              <span class="ss-sizes">XS–3XL</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  </li>`;
}

const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${baseCss}</style><style>${gridCss}</style><style>${cardCss}</style></head>
<body><div class="page-width">
<ul class="product-grid product-grid--organic" product-grid-view="default"
    style="--mobile-columns: 2;">
${cardMarkup('Cotton Heritage M2580 Unisex Premium Pullover Hoodie')}
${cardMarkup('Bella + Canvas Staple Tee')}
</ul>
</div></body></html>`;

(async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;

  const launchOptions = process.env.PW_CHROMIUM_PATH
    ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launchOptions);

  // A small phone, which is where this was reported.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const pg = await ctx.newPage();
  await pg.goto(origin + '/');
  await pg.waitForTimeout(200);

  async function measure(pg) {
    return pg.evaluate(() => {
    const out = [];
    document.querySelectorAll('.ss-card-shell').forEach((shell, i) => {
      const shellBox = shell.getBoundingClientRect();
      ['.ss-price', '.ss-sizes', '.ss-title', '.ss-includes-badge'].forEach((sel) => {
        const el = shell.querySelector(sel);
        if (!el) { out.push({ i, sel, missing: true }); return; }
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        out.push({
          i, sel,
          text: (el.textContent || '').trim(),
          w: Math.round(b.width), h: Math.round(b.height),
          color: cs.color, opacity: cs.opacity, display: cs.display, visibility: cs.visibility,
          // Clipped if it falls outside the shell's own box, which is overflow:hidden.
          belowShell: Math.round(b.bottom - shellBox.bottom),
          shellH: Math.round(shellBox.height),
        });
      });
    });
      return out;
    });
  }

  const report = await measure(pg);

  report.forEach((r) => {
    const label = 'card ' + (r.i + 1) + ' ' + r.sel;
    if (r.missing) { check(label + ' exists', false, 'not in the DOM'); return; }
    check(label + ' has size', r.w > 0 && r.h > 0,
      JSON.stringify({ w: r.w, h: r.h, display: r.display, visibility: r.visibility }));
    check(label + ' is inside the card box', r.belowShell <= 0,
      r.belowShell + 'px below the shell, which is overflow:hidden — it is clipped');
    check(label + ' is not transparent', r.opacity !== '0' && r.color !== 'rgba(0, 0, 0, 0)',
      JSON.stringify({ color: r.color, opacity: r.opacity }));
  });

  // The grid view is remembered per device in sessionStorage, so a phone that
  // once tapped the compact view keeps it. Check that view too — it is the one
  // thing that differs between a phone and a desktop by design.
  await pg.evaluate(() => {
    document.querySelector('.product-grid').setAttribute('product-grid-view', 'zoom-out');
  });
  await pg.waitForTimeout(150);
  const zoomed = await measure(pg);
  const zoomedPrice = zoomed.find((r) => r.sel === '.ss-price');
  console.log('\nzoom-out view — price: ' + JSON.stringify(zoomedPrice));

  await pg.evaluate(() => {
    document.querySelector('.product-grid').setAttribute('product-grid-view', 'default');
  });
  await pg.waitForTimeout(150);

  await pg.screenshot({ path: '/tmp/card-mobile.png', fullPage: true });
  console.log('\nscreenshot: /tmp/card-mobile.png');
  console.log(JSON.stringify(report.filter((r) => /price|sizes/.test(r.sel)), null, 1));

  await browser.close();
  await new Promise((r) => server.close(r));

  if (failures.length) { console.error('\nFAILED: ' + failures.join(', ')); process.exit(1); }
  console.log('\nALL OK');
})();
