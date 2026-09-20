/* The store-action pills on a tablet held in portrait.

   In landscape an iPad is wider than 990, so the hero card keeps its rail and
   the three actions stack down it, one per row, each label on one line. Turn
   the same iPad to portrait and it is 810 wide, and the pills came out as
   squat thumbnails with "Shop products" broken over three lines.

   The cause spans two files. The section stacks the card below 990 and turns
   the panel two-across to suit a card that is now full width. The card does
   not go full width: assets/storefront-fixed-layouts.css — loaded first, by
   the layout-state section — pins

     .ps-hero-card { grid-template-columns: minmax(0, 1fr) 236px !important }

   with no media query, at a specificity (two ids) the section cannot reach. It
   answers itself for phones inside its own max-width:768 blocks, which is why
   769-990 was the one band left holding a 236px rail with two columns of
   pills inside it.

   So this checks the three bands against the real stylesheets, for every shape
   the panel takes (a member's two actions, a prospect's three, an admin's
   five):

     up to 768   phones      two across, unchanged
     769 - 990   tablet      one column, exactly like landscape
     991 and up  landscape   one column, unchanged

   and it checks the premise the middle band rests on — that the rail rule is
   still unconditional. If someone gives that rule a media query, the section
   is free to stack the card again and this pairing needs rethinking rather
   than silently keeping a rule that no longer does anything.

   Usage: node tests/js_harness/store_action_panel_harness.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) console.log('PASS - ' + name);
  else { console.error('FAIL - ' + name + (detail ? ': ' + detail : '')); failures.push(name); }
}

const SECTION = read('sections', 'private-store-collection.liquid');
const FIXED = read('assets', 'storefront-fixed-layouts.css');
const STRUCTURE = read('assets', 'storefront-template-structure.css');

// ---------------------------------------------------------------- the styles
// Every <style> the section writes, with the id placeholder resolved. Taken
// from the shipped file so a changed breakpoint lands here, not in a copy.
const sectionCss = (SECTION.match(/<style>([\s\S]*?)<\/style>/g) || [])
  .map((b) => b.slice(7, -8))
  .join('\n')
  .replace(/\{\{\s*section\.id\s*\}\}/g, 'x');

if (/\{\{|\{%/.test(sectionCss)) {
  console.error('FAIL - the section stylesheet still holds Liquid this harness cannot resolve');
  process.exit(1);
}

// ---------------------------------------------------------------- the markup
// The panel, straight out of the section, with one scenario's branches taken.
// Resolving the branches rather than deleting the tags matters: a crude strip
// concatenates "Claim this store" with "Join this store" and measures a label
// the page never shows.
function renderPanel(scope) {
  let src = SECTION.slice(SECTION.indexOf('<div class="ps-action-panel">'));
  src = src.slice(0, src.indexOf('</div>\n\n      </div>') + 6);
  src = src.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');

  const truth = (expr) => expr.trim().split(/\s+and\s+/).every((term) => {
    const eq = term.match(/^(\w+)\s*==\s*'([^']*)'$/);
    if (eq) return scope[eq[1]] === eq[2];
    if (!(term in scope)) throw new Error('harness does not know the condition ' + term);
    return Boolean(scope[term]);
  });

  // Innermost {% if %} first, so nesting resolves without a parser.
  const IF = /\{%-?\s*if\s+([^%]+?)\s*-?%\}((?:(?!\{%-?\s*if\s)[\s\S])*?)\{%-?\s*endif\s*-?%\}/;
  for (let guard = 0; IF.test(src); guard++) {
    if (guard > 50) throw new Error('unresolved Liquid conditionals');
    src = src.replace(IF, (_m, expr, body) => {
      const parts = body.split(/\{%-?\s*else\s*-?%\}/);
      return truth(expr) ? parts[0] : (parts[1] || '');
    });
  }
  return src.replace(/\{\{[^}]*\}\}/g, '#');
}

const SCENARIOS = {
  'member (2 actions)':   { scope: { is_preview: false, is_admin: false, prospect_owner: 'owned' }, buttons: 2 },
  'prospect (3 actions)': { scope: { is_preview: true,  is_admin: false, prospect_owner: 'unclaimed' }, buttons: 3 },
  'admin (5 actions)':    { scope: { is_preview: true,  is_admin: true,  prospect_owner: 'unclaimed' }, buttons: 5 },
};

function page(panelHtml) {
  return `<!doctype html><meta charset="utf-8">
<style>body{margin:0}</style>
<div id="MainContent">
  <div id="ss-private-store-state" hidden data-enabled="true" data-layout="classic"></div>
  <style>${FIXED}</style>
  <style>${STRUCTURE}</style>
  <style>${sectionCss}</style>
  <section class="ps-hero" id="ps-storefront-x"><div class="ps-shell"><div class="ps-hero-card">
    <div class="ps-hero-main"><div class="ps-logo"></div><div class="ps-copy">
      <h1 class="ps-title">San Diego Riptide</h1>
      <p class="ps-sub">Approved gear for your group.</p>
    </div></div>
    ${panelHtml}
  </div></div></section>
</div>`;
}

const PHONE = [320, 390, 430, 600, 744, 768];
const TABLET = [769, 810, 820, 834, 900, 989, 990];
const LANDSCAPE = [1024, 1180, 1280, 1366, 1440];

(async () => {
  // The middle band is only needed while the rail rule outranks the section at
  // every width. Check that before trusting anything measured below.
  const bare = FIXED.replace(/\/\*[\s\S]*?\*\//g, '');   // braces hide in comments
  const railRule = bare.indexOf('grid-template-columns: minmax(0, 1fr) 236px !important');
  check('the hero-card rail width is still pinned in storefront-fixed-layouts.css', railRule > 0);
  if (railRule > 0) {
    const before = bare.slice(0, railRule);
    // Depth 1 is the rule's own block; anything deeper means an at-rule wraps it.
    const depth = (before.match(/\{/g) || []).length - (before.match(/\}/g) || []).length;
    check('...and it is still unconditional, so the card keeps a rail below 990',
      depth === 1, `the rail rule now sits ${depth - 1} at-rule(s) deep — revisit the tablet band`);
  }

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'],
  });

  for (const [label, { scope, buttons }] of Object.entries(SCENARIOS)) {
    const panelHtml = renderPanel(scope);
    const count = (panelHtml.match(/class="ps-btn/g) || []).length;
    check(`${label}: the section really renders ${buttons} actions`, count === buttons,
      `rendered ${count}`);

    const tab = await browser.newPage();
    await tab.setContent(page(panelHtml));

    const at = async (w) => {
      await tab.setViewportSize({ width: w, height: 900 });
      return tab.evaluate(() => {
        const panel = document.querySelector('.ps-action-panel');
        const btns = [...panel.querySelectorAll('.ps-btn')];
        const rows = new Set(btns.map((b) => Math.round(b.getBoundingClientRect().y)));
        return {
          columns: getComputedStyle(panel).gridTemplateColumns.split(' ').length,
          rows: rows.size,
          count: btns.length,
          // A pill taller than ~1.6 lines of its own text has wrapped.
          wrapped: btns.filter((b) => {
            const s = getComputedStyle(b);
            return b.getBoundingClientRect().height > parseFloat(s.lineHeight || '18') * 1.9
              + parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
          }).map((b) => b.textContent.trim().replace(/\s+/g, ' ')),
        };
      });
    };

    for (const w of TABLET) {
      const r = await at(w);
      check(`${label} @${w}: one column, ${buttons} rows, like landscape`,
        r.columns === 1 && r.rows === r.count, JSON.stringify(r));
      check(`${label} @${w}: no label wraps`, r.wrapped.length === 0, r.wrapped.join(' | '));
    }
    for (const w of LANDSCAPE) {
      const r = await at(w);
      check(`${label} @${w}: landscape still one column`, r.columns === 1, JSON.stringify(r));
    }
    for (const w of PHONE) {
      const r = await at(w);
      check(`${label} @${w}: phone still two across`, r.columns === 2, JSON.stringify(r));
    }
    await tab.close();
  }

  await browser.close();
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    process.exit(1);
  }
  console.log('\nALL OK');
})().catch((err) => { console.error(err); process.exit(1); });
