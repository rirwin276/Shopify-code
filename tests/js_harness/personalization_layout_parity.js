/* Parity harness: the storefront preview's layout allocator must agree with
   the server's print renderer, or the shopper is shown something different
   from what gets made.

   The JS side is READ OUT OF THE SHIPPED FILE rather than restated here, so
   this cannot drift into testing a stale copy of the algorithm. Run the
   companion Python expectations with:
     python tests/js_harness/personalization_layout_parity_expected.py
   which writes the JSON this script compares against.

   Usage: node tests/js_harness/personalization_layout_parity.js [expected.json]
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ASSET = path.join(__dirname, '..', '..', 'assets', 'ss-tote-personalize.js');

/** Pull a top-level `function name(...) {...}` out of a source file by
 *  balancing braces, so the harness always tests the shipped implementation. */
function extractFunction(source, name) {
  const start = source.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('could not find function ' + name + ' in ' + ASSET);
  let i = source.indexOf('{', start);
  let depth = 0;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces reading ' + name);
}

const src = fs.readFileSync(ASSET, 'utf8');

// The shipped defaults, as the widget resolves them when a product's metafield
// predates these keys (`data-*` attribute || fallback literal).
function shippedDefault(attr) {
  const re = new RegExp("getAttribute\\('data-" + attr + "'\\)\\s*\\|\\|\\s*'([0-9.]+)'");
  const m = src.match(re);
  if (!m) throw new Error('no shipped default for data-' + attr);
  return parseFloat(m[1]);
}

const TOP_OFFSET_PCT = shippedDefault('top-offset-pct');
const NAME_ZONE_PCT = shippedDefault('name-zone-pct');
const NAME2_ZONE_PCT = shippedDefault('name2-zone-pct');
const LINE_GAP_PCT = shippedDefault('line-gap-pct');
const GAP_PCT = shippedDefault('gap-pct');
const NUMBER_MIN_SHARE = shippedDefault('number-min-share');

// eslint-disable-next-line no-eval
const nnLayout = eval('(' + extractFunction(src, 'nnLayout') + ')');

const BOXES = [
  [1000, 1000],  // square — the tote
  [800, 1600],   // tall — hoodies and tees
  [3000, 500],   // absurdly wide and short: forces the containment rule
  [2000, 300],
  [500, 5000],   // absurdly tall
  [640, 640],    // the storefront canvas
];
const STATES = [
  [1, true], [2, true], [1, false], [2, false], [0, true], [0, false],
];

const results = {};
for (const [w, h] of BOXES) {
  for (const [lines, hasNumber] of STATES) {
    const lay = nnLayout(w, h, lines, hasNumber);
    results[`${w}x${h}|${lines}|${hasNumber ? 1 : 0}`] = {
      topOffset: +lay.topOffset.toFixed(6),
      bands: lay.bands.map((b) => +b.toFixed(6)),
      lineGap: +lay.lineGap.toFixed(6),
      gap: +lay.gap.toFixed(6),
      namesH: +lay.namesH.toFixed(6),
      numberTop: +lay.numberTop.toFixed(6),
      numberH: +lay.numberH.toFixed(6),
    };
  }
}

// --- self-checks that do not need the Python side --------------------------

let failures = 0;
function check(label, cond) {
  if (!cond) { console.error('FAIL  ' + label); failures++; }
}

for (const [w, h] of BOXES) {
  for (const [lines, hasNumber] of STATES) {
    const lay = nnLayout(w, h, lines, hasNumber);
    const bottom = lay.numberTop + lay.numberH;
    check(`stack fits the box ${w}x${h} lines=${lines} number=${hasNumber}`,
      bottom <= h + 1e-6);
    check(`no negative bands ${w}x${h} lines=${lines}`,
      lay.bands.every((b) => b >= 0) && lay.numberH >= 0);
    check(`band count ${w}x${h} lines=${lines}`, lay.bands.length === lines);
  }
}

// The compatibility guarantee, asserted on the numbers themselves.
const one = nnLayout(1000, 1000, 1, true);
check('one name + number keeps the original top offset', Math.abs(one.topOffset - 1000 * TOP_OFFSET_PCT) < 1e-9);
check('one name + number keeps the original band', Math.abs(one.bands[0] - 1000 * NAME_ZONE_PCT) < 1e-9);
check('one name + number keeps the original gap', Math.abs(one.gap - 1000 * GAP_PCT) < 1e-9);
check('one name + number has no line gap', one.lineGap === 0);

const two = nnLayout(1000, 1000, 2, true);
check('a second line shrinks the name lines', two.bands[0] < one.bands[0]);
check('a second line shrinks the number too', two.numberH < one.numberH);
check('both name lines are equal', two.bands[0] === two.bands[1]);
check('a second line uses the two-line band', Math.abs(two.bands[0] - 1000 * NAME2_ZONE_PCT) < 1e-9);
check('a second line uses the line gap', Math.abs(two.lineGap - 1000 * LINE_GAP_PCT) < 1e-9);

check('dropping the number grows the name', nnLayout(1000, 1000, 1, false).bands[0] > one.bands[0]);
check('dropping the name grows the number', nnLayout(1000, 1000, 0, true).numberH > one.numberH);

const wide = nnLayout(3000, 500, 2, true);
check('a wide short box still leaves the number room', wide.numberH > 0);
check('a wide short box scales the names down', wide.bands[0] < 3000 * NAME2_ZONE_PCT);
check('the number keeps its minimum share', wide.numberH >= (500 - 500 * TOP_OFFSET_PCT) * NUMBER_MIN_SHARE - 1e-6);

// --- parity against the Python renderer ------------------------------------

const expectedPath = process.argv[2];
if (expectedPath && fs.existsSync(expectedPath)) {
  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
  const keys = new Set([...Object.keys(expected), ...Object.keys(results)]);
  for (const k of keys) {
    const a = expected[k];
    const b = results[k];
    if (!a || !b) { console.error(`FAIL  missing case ${k}`); failures++; continue; }
    for (const field of ['topOffset', 'lineGap', 'gap', 'namesH', 'numberTop', 'numberH']) {
      if (Math.abs(a[field] - b[field]) > 1e-6) {
        console.error(`FAIL  ${k} ${field}: python=${a[field]} js=${b[field]}`);
        failures++;
      }
    }
    if (a.bands.length !== b.bands.length
        || a.bands.some((v, i) => Math.abs(v - b.bands[i]) > 1e-6)) {
      console.error(`FAIL  ${k} bands: python=${JSON.stringify(a.bands)} js=${JSON.stringify(b.bands)}`);
      failures++;
    }
  }
  console.log(`parity checked against ${keys.size} Python cases`);
} else {
  console.log('(no expected.json supplied — ran self-checks only)');
}

console.log(failures === 0
  ? `PASS  layout parity harness (${Object.keys(results).length} cases)`
  : `${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
