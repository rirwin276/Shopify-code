/*
Admin Powers page — rendered-layout check.

The integrity harness proves the page is structurally intact and that declared
colours clear WCAG. It cannot see LAYOUT: whether two elements physically
overlap, whether something runs off the side of a phone, whether a sticky bar
covers the heading beneath it. Those are exactly the bugs the owner reported
from a screenshot, so they are worth a test rather than another screenshot.

This renders the REAL section markup with the REAL stylesheet, and runs the
REAL ss-admin-powers-core.js against a stubbed products endpoint, so the
product rows under test are the ones apRenderProducts actually builds. Nothing
here restates the page's own markup or CSS.

What it asserts, at six widths:
  1. No two badges in a card overlap, and the LIVE/HIDDEN pill is never
     covered. This is the reported bug: CUSTOM was pinned absolute-left,
     NAME & NUMBER absolute-right, and on a narrow card they crossed each
     other and the status pill underneath.
  2. The hero does not overflow, and no hero button runs past the viewport.
  3. The first panel heading clears the sticky tab bar.
  4. The hero band actually rendered dark with light type on it.

Usage:
    NODE_PATH=/tmp/pwtest/node_modules node tests/js_harness/admin_powers_render_check.js

Chromium 1194 is pre-installed; never run `playwright install`.
Exit 0 and "ALL OK" means the page lays out correctly.
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

const liquid = read('sections/admin-powers-page.liquid');
const css = read('assets/ss-admin-powers.css');
const coreJs = read('assets/ss-admin-powers-core.js');

// The page shell, with Liquid stripped. Tags are removed rather than evaluated:
// this checks geometry, and every dimension comes from the CSS, not from the
// interpolated values.
const OPEN = '<div class="ap-wrap';
const CLOSE = '<!-- /.ap-wrap -->';
const shell = liquid
  .slice(liquid.indexOf(OPEN), liquid.indexOf(CLOSE) + CLOSE.length)
  // The section's own inline <script> blocks are Liquid-templated. Stripping
  // the tags would leave them syntactically broken and they would throw before
  // core.js ever ran, so drop them — this harness supplies its own SSAP.
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/\{%-?[\s\S]*?-?%\}/g, '')
  // A single word: interpolations appear inside attributes, and a value with a
  // space in it turns one attribute into two.
  .replace(/\{\{[\s\S]*?\}\}/g, 'Store');

// Four products covering every badge combination that can appear at once.
// The first is the worst case and the one from the owner's screenshot: a
// custom build that ALSO carries name & number, so all three badges compete.
const PRODUCTS = [
  { id: 'gid://shopify/Product/1', handle: 'hoodie-nn', title: 'Unisex Premium Pullover Hoodie',
    status: 'ACTIVE', hidden: false, featured_image: 'https://example.invalid/a.png',
    tags: ['store', 'custom-build', 'pro-shirt-m2580', 'model--M2580', 'personalized-back'] },
  { id: 'gid://shopify/Product/2', handle: 'hoodie-plain', title: 'Unisex Premium Pullover Hoodie',
    status: 'ACTIVE', hidden: false, featured_image: 'https://example.invalid/b.png',
    tags: ['store', 'custom-build', 'pro-shirt-m2580', 'model--M2580'] },
  { id: 'gid://shopify/Product/3', handle: 'crew-fb', title: 'Crewneck Sweatshirt',
    status: 'ACTIVE', hidden: false, featured_image: 'https://example.invalid/c.png',
    tags: ['store', 'bc3413_front_back'] },
  { id: 'gid://shopify/Product/4', handle: 'tank-hidden', title: 'Unisex Tank Top',
    status: 'DRAFT', hidden: true, featured_image: 'https://example.invalid/d.png',
    tags: ['store'] },
];

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}</style></head><body style="margin:0">
${shell}
<script>
  window.SSAP = {
    shopHandle: 'store', storeName: 'Chubby Unicorns', collectionHandle: 'store',
    isProspectDemo: false, isSuperAdmin: false,
    railwayUrl: 'https://railway.invalid', editorBaseUrl: 'https://editor.invalid',
    editorSecret: 'test-secret', shopLogoSrc: '', joinLink: 'https://x.invalid/j',
    dashboardUrl: '/pages/portal', customerId: '1', customerEmail: 'a@b.c'
  };
  // The catalog script and the QR library are not part of this check, but the
  // stub must carry CorrectLevel: core.js reads QRCode.CorrectLevel.H at top
  // level, and without it the whole IIFE throws before it ever loads products.
  window.QRCode = function () { this.makeCode = function () {}; };
  window.QRCode.CorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };
</script>
<script>${coreJs}</script>
</body></html>`;

const WIDTHS = [390, 414, 480, 700, 1180, 1440];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (/\/relay\/store\/[^/]+\/products/.test(url)) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(PRODUCTS) });
    }
    if (url.startsWith('http://localhost')) {
      return route.fulfill({ contentType: 'text/html', body: PAGE });
    }
    return route.abort();   // no fonts, no mockup photos, no network flake
  });

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost/admin.html');
    await page.waitForFunction(
      () => document.querySelectorAll('.ap-product-row').length >= 4,
      null, { timeout: 8000 }
    ).catch(() => {});

    const r = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.ap-product-row')];
      const overlaps = [];
      let coveredPills = 0;

      const intersects = (a, b) =>
        a.left < b.right - 0.5 && b.left < a.right - 0.5 &&
        a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

      for (const row of rows) {
        const badges = [...row.querySelectorAll('.ap-product-badge, .ap-badge--status')];
        for (let i = 0; i < badges.length; i++) {
          for (let j = i + 1; j < badges.length; j++) {
            const a = badges[i].getBoundingClientRect();
            const b = badges[j].getBoundingClientRect();
            if (intersects(a, b)) {
              overlaps.push(
                (badges[i].textContent || '?').trim() + ' × ' + (badges[j].textContent || '?').trim()
              );
            }
          }
        }
        // The status pill must be the topmost thing painted at its own centre.
        // The badge cluster sets pointer-events:none so it never intercepts a
        // click on the card, which also makes it invisible to elementFromPoint
        // — so lift that just for the probe, then put it back.
        const pill = row.querySelector('.ap-badge--status');
        if (pill) {
          const cluster = pill.closest('.ap-product-badges');
          const prev = cluster ? cluster.style.pointerEvents : null;
          if (cluster) cluster.style.pointerEvents = 'auto';
          const p = pill.getBoundingClientRect();
          if (p.width > 0 && p.height > 0) {
            const hit = document.elementFromPoint(p.left + p.width / 2, p.top + p.height / 2);
            if (hit && hit !== pill && !pill.contains(hit)) coveredPills++;
          }
          if (cluster) cluster.style.pointerEvents = prev;
        }
      }

      const vw = document.documentElement.clientWidth;
      const hero = document.querySelector('.ap-hero');
      const heroOverflow = hero ? hero.scrollWidth - hero.clientWidth : -1;
      const btnOver = Math.max(0, ...[...document.querySelectorAll('.ap-hero .ap-btn')]
        .map((b) => Math.round(b.getBoundingClientRect().right - vw)), 0);

      // Sticky bar must not cover the first heading in the visible panel.
      const bar = document.querySelector('.ap-main-tabs');
      const panel = document.querySelector('.ap-main-panel.active');
      const head = panel && panel.querySelector('.ap-panel-kicker, .ap-panel-title, h2');
      let clearance = null;
      if (bar && head) {
        clearance = Math.round(head.getBoundingClientRect().top - bar.getBoundingClientRect().bottom);
      }

      const lum = (c) => {
        const m = (c.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
        const s = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * s(m[0]) + 0.7152 * s(m[1]) + 0.0722 * s(m[2]);
      };
      const h1 = document.querySelector('.ap-hero h1');
      const heroCs = hero ? getComputedStyle(hero) : null;

      return {
        rows: rows.length, overlaps, coveredPills, heroOverflow, btnOver, clearance,
        h1Lum: h1 ? lum(getComputedStyle(h1).color) : null,
        heroImage: heroCs ? heroCs.backgroundImage.slice(0, 60) : '',
        // Liquid-gated branches all render at once in this fixture; the
        // prospect-demo notice is one of them and never coexists with a real
        // admin page, so it cannot be blamed for an overflow.
        pageOverflow: (() => {
          let worst = 0;
          for (const el of document.querySelectorAll('.ap-wrap, .ap-wrap *')) {
            if (el.closest('.ap-prospect-demo-notice, .ap-demo-bar')) continue;
            const b = el.getBoundingClientRect();
            if (b.width > 0) worst = Math.max(worst, Math.round(b.right - vw));
          }
          return worst;
        })(),
      };
    });

    const w = String(width).padStart(4) + 'px';
    check(`${w} all four product rows rendered`, r.rows === 4, `got ${r.rows}`);
    check(`${w} no badges overlap`, r.overlaps.length === 0,
      r.overlaps.length ? `overlapping pairs: ${[...new Set(r.overlaps)].join(', ')}` : '');
    check(`${w} the Live/Hidden pill is never covered`, r.coveredPills === 0,
      r.coveredPills ? `${r.coveredPills} pill(s) sit under another element` : '');
    check(`${w} the hero does not overflow`, r.heroOverflow <= 0 && r.btnOver <= 0,
      `hero ${r.heroOverflow}px, worst button ${r.btnOver}px past the viewport`);
    check(`${w} the page does not scroll sideways`, r.pageOverflow <= 1,
      `${r.pageOverflow}px past the viewport (1px is sub-pixel rounding, more is a real overflow)`);
    if (r.clearance !== null) {
      check(`${w} the sticky tab bar does not cover the panel heading`, r.clearance >= 0,
        `heading starts ${r.clearance}px above the bar's bottom edge`);
    }
    check(`${w} the hero band renders dark with light type`,
      r.h1Lum !== null && r.h1Lum > 0.5 && /gradient/.test(r.heroImage),
      `h1 luminance ${r.h1Lum === null ? 'n/a' : r.h1Lum.toFixed(2)}, hero background "${r.heroImage}"`);
  }

  await browser.close();
  console.log('');
  if (failures.length) {
    console.error(`${failures.length} FAILED: ${[...new Set(failures)].join(', ')}`);
    process.exit(1);
  }
  console.log('ALL OK');
})();
