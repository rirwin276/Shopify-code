/*
Every pro-built product must offer an Edit button.

Three products — the Bella+Canvas hoodie and the two long sleeves — could be
made and then never changed. They had everything else: the right tags, the
right metafields, and a working /editor/pro-shirt/<key>/edit route registered
for them like every other builder. What they did not have was their key typed
into a hardcoded array in this file, which nobody adding a product would think
to look for. The shop owner was left with a product they could not edit.

So the key is now read out of the product's own tag, and this checks that:
the three that were broken, the ones that already worked, and that a product
with no builder tag still gets no button.

Run:  node tests/js_harness/admin_edit_button_harness.js
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'assets', 'ss-admin-powers-core.js'), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) { console.log('PASS - ' + name); }
  else { console.error('FAIL - ' + name + (detail ? ': ' + detail : '')); failures.push(name); }
}

// The real derivation, lifted out of the file so a rewrite of it is caught.
const block = src.match(/var _proTags = _tagListForProCheck;[\s\S]*?\n        \}\);/);
check('the edit-path derivation is present', !!block);
if (!block) { console.error('\nFAILED'); process.exit(1); }

check('no hardcoded model list remains',
  !/\['cc1717',\s*'m2580'/.test(src),
  'a list of models here is a list somebody has to remember to update');

// Compiled from the file's own source rather than eval'd: under strict mode
// an eval gets its own scope, so the block's assignment never escapes and
// every case reads back null — which looks exactly like the bug being fixed.
const derive = new Function('_tagListForProCheck', block[0] + '\nreturn _proEditPath;');

function editPathFor(tags) {
  return derive(tags.map((t) => String(t || '').toLowerCase().trim()));
}

// The three that shipped uneditable.
[
  ['g3719', 'Bella+Canvas Unisex Pullover Hoodie'],
  ['bc3501', 'Bella+Canvas Unisex Long Sleeve Tee'],
  ['bc3501y', 'Bella+Canvas Youth Long Sleeve Tee'],
].forEach(([key, title]) => {
  check(title + ' can be edited',
    editPathFor(['custom-build', 'pro-shirt-' + key]) === '/editor/pro-shirt/' + key + '/edit',
    'got ' + editPathFor(['custom-build', 'pro-shirt-' + key]));
});

// Everything that already worked must keep working.
['cc1717', 'm2580', 'ls14003', 'm2480', 'bc3413', 'bc3001y', 'bc3001',
 'cc1467y', 'nl6733', 'mc1790', 'ec8000', 'hat39165'].forEach((key) => {
  check(key + ' still resolves its editor',
    editPathFor(['pro-shirt-' + key]) === '/editor/pro-shirt/' + key + '/edit');
});

// The older tag spelling is still in the wild on already-built products.
check('the pro-builder- spelling works too',
  editPathFor(['pro-builder-bc3501']) === '/editor/pro-shirt/bc3501/edit');

check('tag order does not matter',
  editPathFor(['model--bc3501', 'custom-build', 'pro-shirt-bc3501', 'personalized-back'])
    === '/editor/pro-shirt/bc3501/edit');

// A product that names no builder must not get a button pointing nowhere.
check('a product with no builder tag gets no editor',
  editPathFor(['custom-build', 'model--bc3501']) === null);
check('a lookalike tag is not mistaken for a builder',
  editPathFor(['pro-shirt', 'pro-shirt-']) === null,
  'an empty key would build /editor/pro-shirt//edit');
check('a tag with a path separator cannot escape the route',
  editPathFor(['pro-shirt-../../admin']) === null);

if (failures.length) {
  console.error('\nFAILED: ' + failures.join(', '));
  process.exit(1);
}
console.log('\nALL OK');
