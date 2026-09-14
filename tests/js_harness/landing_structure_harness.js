/*
Guards the homepage's structure and its theme settings.

Two failures here are silent by nature and both had already happened:

  1. Forty-five of this section's fifty-six customizer fields rendered
     NOTHING. The hero headline, the subheadline, the CTA label and all three
     "how it works" steps were editable in the theme editor and hardcoded in
     the Liquid. You would rewrite your headline, publish, and see no change,
     with nothing anywhere reporting a problem.

  2. One action carried four different names across five buttons, which reads
     as several different offers and makes the page impossible to measure.

Neither shows up in a browser, so neither shows up in review. This asserts
them against the shipped files.

Run with node (no browser needed for most of it):
  node tests/js_harness/landing_structure_harness.js
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) { console.log('PASS - ' + name); }
  else { console.error('FAIL - ' + name + (detail ? ': ' + detail : '')); failures.push(name); }
}

const section = read('sections', 'landing-dual-hub.liquid');
const schema = JSON.parse(section.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/)[1]);
const template = JSON.parse(read('templates', 'index.json').replace(/\/\*[\s\S]*?\*\//g, ''));

// --- Every offered setting must actually do something ----------------------
const offered = schema.settings.filter((e) => e.id).map((e) => e.id);
const rendered = new Set([...section.matchAll(/section\.settings\.(\w+)/g)].map((m) => m[1]));
const dead = offered.filter((id) => !rendered.has(id));

check('every setting the customizer offers renders something', dead.length === 0,
  dead.length + ' dead: ' + dead.join(', '));
check('the hero copy is editable without a deploy',
  ['hero_headline', 'hero_intro', 'cta_label'].every((id) => offered.includes(id) && rendered.has(id)));

// --- And the template stores nothing the section no longer reads -----------
const stored = Object.keys(
  template.sections[Object.keys(template.sections).find((k) => template.sections[k].type === 'landing-dual-hub')].settings
);
const orphaned = stored.filter((id) => !offered.includes(id));
check('index.json stores no value the section cannot use', orphaned.length === 0,
  orphaned.join(', '));

// --- One action, one name --------------------------------------------------
const ctaLabels = [...section.matchAll(/class="ad-start[^"]*"[^>]*>([^<]+)/g)]
  .map((m) => m[1].trim());
check('every call to action carries the same label',
  new Set(ctaLabels).size === 1,
  [...new Set(ctaLabels)].join(' / '));
check('and that label comes from the setting, not the markup',
  ctaLabels.every((l) => l.includes('cta_label')), ctaLabels[0]);

// --- Order of the page -----------------------------------------------------
const signedOut = section.slice(section.indexOf('<div class="ss-ad"'));
const at = (needle) => signedOut.indexOf(needle);
const hero = at('<section class="ad-hero">');
const benefits = at('class="ad-benefits"');
const steps = at('Self-service. Start to finish.');
const demoStore = at('ad-store-section');
const personalize = at('ad-play-section');
const faq = at('ad-faq-wrap');
const final = at('class="ad-final"');

check('every landmark section is still on the page',
  [hero, benefits, steps, demoStore, personalize, faq, final].every((i) => i > -1));
check('how it works comes before the demos, not after them',
  steps < demoStore && steps < personalize,
  'a cold visitor meets two interactive demos before anyone says what happens');
check('the benefit bar still follows the hero', hero < benefits && benefits < steps);
check('the FAQ and the closing CTA stay at the end',
  personalize < faq && faq < final);

// Proof belongs between "here is how it works" and "here, try it": the coach
// who has just read the steps is asking whether it works for people like them.
const reviews = at('data-ss-home-slot="reviews"');
check('the reviews slot is on the page', reviews > -1);
check('reviews come after how it works', steps < reviews);
check('and before the demo store', reviews < demoStore,
  'proof after two interactive demos is proof nobody reached');

// Free US shipping is the answer to the question that decides an order. It has
// to be somewhere a visitor meets before the FAQ, not only inside it.
const shipEarly = at('Free US shipping');
check('free US shipping is stated above the FAQ', shipEarly > -1 && shipEarly < faq,
  'shipping cost only answered three screens down');
check('and again where the prices are quoted',
  signedOut.indexOf('ad-pricenote-ship') > -1);
check('the FAQ answers it too',
  /shipping is always free within the United States/i.test(signedOut));

// --- The claims the page makes ---------------------------------------------
check('a price appears above the demo store',
  at('ad-pricenote') > -1 && at('ad-pricenote') < demoStore,
  '"free" with no number reads as a catch');
check('veteran owned is in the benefit bar, not just the footer',
  at('ad-benefit-vet') > -1 && at('ad-benefit-vet') < steps);

// --- No duplicate demos ----------------------------------------------------
check('the gear-picker tab no longer duplicates the product catalog',
  !signedOut.includes('data-ad-demo-panel="builder"'));

// --- Prices must agree with the catalog the same page renders --------------
const priceLine = (template.sections[Object.keys(template.sections)
  .find((k) => template.sections[k].type === 'landing-dual-hub')].settings.hero_price_line) || '';
const quoted = [...priceLine.matchAll(/\$(\d+)/g)].map((m) => '$' + m[1]);
const api = read('..', 'Printful_Automation', 'support_api.py');
const real = new Set([...api.matchAll(/"from":\s*"(\$\d+)"/g)].map((m) => m[1]));
check('the hero quotes prices that exist in the catalog', quoted.length > 0 && quoted.every((q) => real.has(q)),
  'not in the catalog: ' + quoted.filter((q) => !real.has(q)).join(', '));

const lowestReal = Math.min(...[...real].map((p) => Number(p.slice(1))));
check('the hero does not undercut the real cheapest item',
  Math.min(...quoted.map((q) => Number(q.slice(1)))) >= lowestReal,
  'hero implies a floor the catalog does not offer');

// --- Weight -----------------------------------------------------------------
const ghostPng = fs.existsSync(path.join(ROOT, 'assets', 'ss-triblend-ghost.png'));
const ghostWebp = path.join(ROOT, 'assets', 'ss-triblend-ghost.webp');
check('the personalization backdrop is not a 400KB PNG any more',
  fs.existsSync(ghostWebp) && fs.statSync(ghostWebp).size < 120 * 1024 &&
  section.includes('ss-triblend-ghost.webp'),
  ghostPng ? 'the PNG is still what the section loads' : 'missing WebP');

if (failures.length) {
  console.error('\nFAILED: ' + failures.join(', '));
  process.exit(1);
}
console.log('\nALL OK');
