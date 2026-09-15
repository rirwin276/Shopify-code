/*
Drives the homepage name & number demo in a real browser.

The demo used to offer three fonts and three ink colours out of a registry
that has six lettering faces and seventeen inks. It is the page's main proof
that a parent can make the shirt theirs, so what it shows has to be what the
Pro Builder actually offers — a shortened sample reads as a shortened product.

The markup, the CSS and the engine are all read out of the shipped files
rather than restated here, so this fails if any of them drifts.

What has to hold:

  - every signature font and every ink in the real registry is offered;
  - picking a font actually changes what the canvas draws, italics included;
  - picking a camo ink paints a TEXTURE, not the flat fallback colour — the
    whole point of camo is that it is not a solid;
  - a camo tile that fails to load falls back to its colour family instead of
    drawing nothing;
  - "no outline" is reachable, because plenty of team looks are one flat ink.

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

const section = read('sections', 'landing-dual-hub.liquid');
const engine = read('assets', 'ss-tote-personalize.js');
const css = read('assets', 'ss-home-mobile.css');

// The picker markup and the widget it drives, taken from the section itself.
const controls = section.match(/<div class="ad-style-controls">[\s\S]*?\n {16}<\/div>/);
const widget = section.match(/<div data-ad-demo-panel="personalize"[\s\S]*?data-mockup-image-url="[^"]*">/);
if (!controls || !widget) {
  console.error('FAIL - the demo picker markup is no longer in landing-dual-hub.liquid');
  process.exit(1);
}

// Liquid the harness has to stand in for.
const liquid = (s) => s
  .replace(/\{\{\s*'([^']+)'\s*\|\s*asset_url\s*\}\}/g, 'ASSET/$1')
  .replace(/\{\{\s*section\.id\s*\}\}/g, 'demo');

// The registries these must mirror, as the Python declares them.
const PY = read('..', 'Printful_Automation', 'pro_builders', 'common', 'personalization.py');
const sigBlock = PY.slice(PY.indexOf('SIGNATURE_FONTS = {'), PY.indexOf('FONTS.update(SIGNATURE_FONTS)'));
const REAL_FONTS = [...sigBlock.matchAll(/^\s{4}"([a-z_]+)":/gm)].map((m) => m[1]);
const colorBlock = PY.slice(PY.indexOf('COLORS: Dict[str, Dict[str, object]] = {'));
const REAL_COLORS = [...colorBlock.slice(0, colorBlock.indexOf('\n}')).matchAll(/"hex":\s*"(#[0-9a-f]{6})"/g)]
  .map((m) => m[1]);

function buildPage() {
  return `<!doctype html><meta charset="utf-8">
  <style>:root{--ink:#142238}
  ${css}
  .ad-print-stage{width:340px}
  canvas{width:340px;height:340px;display:block}
  </style>
  <body class="ss-ad"><div class="ss-ad">
    <div class="ad-demo-layout">
      ${liquid(widget[0])}
        <div class="ad-print-stage">
          <canvas data-ss-pers-canvas width="640" height="640"></canvas>
        </div>
        <div class="ad-demo-controls">
          ${liquid(controls[0])}
          <div class="ad-personal-fields">
            <label>Name<input type="text" data-ss-pers-name value="ADILYN" maxlength="14"></label>
            <label>Number<input type="text" data-ss-pers-number value="7" maxlength="3"></label>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    // Stand in for the theme's asset pipeline and for the two images the
    // widget pulls: the garment photo and any camo tile. Both are drawn, so
    // they have to be real bitmaps, not stubs.
    (function () {
      const RealImage = window.Image;
      const px = (hex) => {
        const c = document.createElement('canvas');
        c.width = c.height = 8;
        const x = c.getContext('2d');
        x.fillStyle = hex; x.fillRect(0, 0, 8, 8);
        // A diagonal stripe makes a "pattern" distinguishable from a flat fill.
        x.fillStyle = '#000'; x.fillRect(0, 0, 4, 4);
        return c.toDataURL();
      };
      window.__tileRequests = [];
      window.__failTiles = false;
      window.Image = function () {
        const img = new RealImage();
        const setSrc = Object.getOwnPropertyDescriptor(RealImage.prototype, 'src').set;
        Object.defineProperty(img, 'src', {
          set(value) {
            window.__tileRequests.push(String(value));
            if (window.__failTiles && /camo/.test(String(value))) {
              setTimeout(() => img.dispatchEvent(new Event('error')), 0);
              return;
            }
            setSrc.call(img, /camo/.test(String(value)) ? px('#5d6b3c') : px('#dddddd'));
          },
          get() { return ''; }
        });
        return img;
      };
      window.Image.prototype = RealImage.prototype;
    })();
  </script>
  <script>${engine}</script>
  </body>`;
}

(async () => {
  // --- The two registries must agree, before any browser runs -------------
  const offeredFonts = [...controls[0].matchAll(/data-ss-pers-demo-font="([a-z_]+)"/g)].map((m) => m[1]);
  check('every signature font in the real registry is offered',
    REAL_FONTS.every((f) => offeredFonts.includes(f)),
    'missing: ' + REAL_FONTS.filter((f) => !offeredFonts.includes(f)).join(', '));
  check('the demo invents no font the builder cannot print',
    offeredFonts.every((f) => REAL_FONTS.includes(f)),
    'extra: ' + offeredFonts.filter((f) => !REAL_FONTS.includes(f)).join(', '));

  const offeredInks = [...controls[0].matchAll(/data-ss-pers-demo-fill data-hex="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
  check('every ink colour in the real registry is offered',
    REAL_COLORS.every((c) => offeredInks.includes(c)),
    'missing: ' + REAL_COLORS.filter((c) => !offeredInks.includes(c)).join(', '));
  check('all four camo inks are offered', (controls[0].match(/data-tile=/g) || []).length === 4);

  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  // No network in here, so a Google Fonts request would hang until Chromium
  // gave up and the picker would look broken for reasons that have nothing to
  // do with the picker. Fail it immediately instead: the engine's error path
  // is the same one a real visitor behind a font-blocking network takes, so
  // this exercises the worst case rather than dodging it.
  await page.route('**://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**://fonts.gstatic.com/**', (route) => route.abort());

  await page.setContent(buildPage());
  await page.waitForTimeout(400);

  check('the widget runs without throwing', errors.length === 0, errors[0]);

  // A fingerprint of what the canvas actually drew.
  const paint = () => page.evaluate(() => {
    const c = document.querySelector('[data-ss-pers-canvas]');
    return c.toDataURL().slice(-260);
  });

  // Webfonts cannot be fetched in this sandbox, so every face would fall back
  // to the same one and comparing pixels would prove nothing about the fonts.
  // Record the font spec the engine hands the canvas instead: that is the
  // actual contract between the picker and the renderer.
  await page.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'font');
    window.__fontSpecs = [];
    Object.defineProperty(proto, 'font', {
      configurable: true,
      get() { return desc.get.call(this); },
      set(v) { window.__fontSpecs.push(String(v)); desc.set.call(this, v); }
    });
  });

  const before = await paint();
  check('something is drawn to begin with', before.length > 0);

  // --- Fonts change the drawing ------------------------------------------
  const seen = new Map();
  for (const key of REAL_FONTS) {
    await page.evaluate(() => { window.__fontSpecs = []; });
    await page.click(`[data-ss-pers-demo-font="${key}"]`);
    await page.waitForTimeout(260);
    const specs = await page.evaluate(() => window.__fontSpecs);
    seen.set(key, specs.find((f) => !/^\s*$/.test(f)) || '');
  }
  const distinct = new Set([...seen.values()].map((v) => v.replace(/\d+px/, 'Npx')));
  check('each lettering choice hands the canvas a different font',
    distinct.size === REAL_FONTS.length,
    `${REAL_FONTS.length} fonts produced ${distinct.size} distinct specs: ` +
    [...seen.entries()].map(([k, v]) => k + '=' + v).join(' | '));

  check('the italic faces are drawn italic',
    /italic/.test(seen.get('afterburner') || '') && /italic/.test(seen.get('rally') || ''),
    'Afterburner and Rally are italic in the registry: ' +
    seen.get('afterburner') + ' / ' + seen.get('rally'));

  check('the heavy face keeps its weight',
    /\b900\b/.test(seen.get('afterburner') || ''),
    'Afterburner is weight 900: ' + seen.get('afterburner'));

  check('each face asks for its real family',
    ['Graduate', 'Teko', 'Barlow Condensed', 'Saira Stencil One', 'Russo One', 'Changa One']
      .every((fam) => [...seen.values()].some((v) => v.includes(fam))),
    [...seen.values()].join(' | '));

  check('the chosen font is the one marked chosen',
    (await page.$$eval('[data-ss-pers-demo-font]',
      (n) => n.filter((b) => b.getAttribute('aria-pressed') === 'true')
              .map((b) => b.getAttribute('data-ss-pers-demo-font')))).join() === 'rally');

  // --- Camo paints a texture, not a flat colour --------------------------
  await page.click('[data-ss-pers-demo-font="varsity_prime"]');
  await page.waitForTimeout(260);
  // Compare camo against camo-with-no-tile, NOT against a different colour:
  // the camo swatch carries its own representative hex, so comparing it to
  // forest green would differ on colour alone and pass even if the texture
  // never painted.
  await page.evaluate(() => { window.__failTiles = true; });
  await page.click('[data-ss-pers-demo-fill][data-hex="#ffffff"]');
  await page.click('[data-ss-pers-demo-fill][data-tile]');
  await page.waitForTimeout(300);
  const camoFlat = await paint();

  await page.evaluate(() => { window.__failTiles = false; });
  await page.click('[data-ss-pers-demo-fill][data-hex="#ffffff"]');
  await page.click('[data-ss-pers-demo-fill][data-tile]');
  await page.waitForTimeout(320);
  const camo = await paint();
  check('a camo ink paints a texture, not its fallback colour', camo !== camoFlat,
    'camo drew as a solid — the one thing camo must not do');
  check('the camo tile was actually fetched',
    (await page.evaluate(() => window.__tileRequests)).some((u) => /camo/.test(u)));
  check('the tile comes from the theme, not a cross-origin server',
    (await page.evaluate(() => window.__tileRequests)).filter((u) => /camo/.test(u))
      .every((u) => !/^https?:\/\//.test(u) || u.startsWith('ASSET/')),
    'a cross-origin tile needs CORS and fails silently without it');

  // Back to flat: the texture has to clear, or every later choice stays camo.
  await page.click('[data-ss-pers-demo-fill][data-hex="#c8102e"]');
  await page.waitForTimeout(220);
  const afterCamo = await paint();
  check('choosing a flat ink after camo clears the texture', afterCamo !== camo);

  // The same red, reached without ever touching camo, must look identical —
  // otherwise some of the texture survived the switch.
  await page.click('[data-ss-pers-demo-fill][data-hex="#ffffff"]');
  await page.waitForTimeout(180);
  await page.click('[data-ss-pers-demo-fill][data-hex="#c8102e"]');
  await page.waitForTimeout(180);
  check('a flat ink looks the same whether or not camo was picked first',
    (await paint()) === afterCamo);

  check('a camo tile that fails to load still draws the ink',
    camoFlat.length > 0 && errors.length === 0,
    'a failed tile blanked the preview');

  // --- Outline, including none -------------------------------------------
  await page.evaluate(() => { window.__failTiles = false; });
  await page.click('[data-ss-pers-demo-fill][data-hex="#ffffff"]');
  await page.click('[data-ss-pers-demo-outline][data-hex="#1e2a4a"]');
  await page.waitForTimeout(220);
  const outlined = await paint();
  await page.click('.ad-ink-none');
  await page.waitForTimeout(220);
  check('turning the outline off changes the shirt', (await paint()) !== outlined);
  check('no outline is a reachable choice',
    (await page.$eval('.ad-ink-none', (e) => e.getAttribute('aria-pressed'))) === 'true');

  await browser.close();

  if (failures.length) {
    console.error('\nFAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nALL OK');
})();
