/*
Runs the real mergeDynamicCatalog() from assets/ss-admin-pro-builder-cards.js
against a fake BUILDERS/PRICE_KEYS, extracted straight out of the source file
rather than retyped here — so a future edit to the merge logic is checked as
it actually reads, not as a copy that can quietly drift from it.

Only this one function is extracted deliberately: the file's own boot() runs
on load and reaches for `document`/`fetch`/setInterval immediately, none of
which this repo has a reason to fake convincingly. The merge logic itself is
plain data transformation with no DOM in it at all, so it is worth pulling out
and running on its own.

Exit code 0 and "ALL OK" on stdout means every scenario passed.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE_PATH = path.join(__dirname, '..', '..', 'assets', 'ss-admin-pro-builder-cards.js');
const source = fs.readFileSync(SOURCE_PATH, 'utf8');

const match = source.match(/function mergeDynamicCatalog\(products\) \{[\s\S]*?\n  \}\n/);
if (!match) {
  console.error('FAIL - could not find mergeDynamicCatalog() in the source file');
  process.exit(1);
}
const fnSource = match[0];

function run(name, fn) {
  try {
    fn();
    console.log('PASS - ' + name);
  } catch (e) {
    console.error('FAIL - ' + name + ': ' + (e && e.stack || e));
    process.exitCode = 1;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

function makeMerger(builders, priceKeys) {
  const context = { BUILDERS: builders, PRICE_KEYS: priceKeys, console };
  vm.createContext(context);
  vm.runInContext(fnSource + '\nthis.__merge = mergeDynamicCatalog;', context);
  return context.__merge;
}

run('a product lab install with an id nobody has yet gets appended', () => {
  const builders = [{ id: 'bc3413', name: 'BC3413' }];
  const priceKeys = { bc3413: { front: 'BC3413_front', back: 'BC3413_front_back' } };
  const merge = makeMerger(builders, priceKeys);

  const added = merge([{ id: 'g3317', name: 'Gildan 3317', route: '/editor/pro-shirt/g3317',
    from: '$25', pricing: [{ label: 'Front print', price: '$25' }],
    price_keys: { front: 'G3317_front', back: null } }]);

  assert(added === true);
  assert(builders.length === 2);
  assert(builders[1].id === 'g3317');
  assert(priceKeys.g3317.front === 'G3317_front');
});

run('an id that already has a hand-curated card is left untouched', () => {
  const original = { id: 'bc3413', name: 'Bella + Canvas BC3413 (hand-written copy)' };
  const builders = [original];
  const priceKeys = {};
  const merge = makeMerger(builders, priceKeys);

  const added = merge([{ id: 'bc3413', name: 'Overwritten by mistake?', route: '/editor/pro-shirt/bc3413' }]);

  assert(added === false, 'reported a change when nothing should have been added');
  assert(builders.length === 1);
  assert(builders[0] === original, 'the existing card object was replaced instead of left alone');
});

run('a response with nothing new reports no change', () => {
  const builders = [{ id: 'bc3413' }];
  const merge = makeMerger(builders, {});
  assert(merge([]) === false);
  assert(merge(null) === false, 'a null/failed response should not throw');
});

run('a malformed entry with no id is skipped rather than crashing the merge', () => {
  const builders = [{ id: 'bc3413' }];
  const merge = makeMerger(builders, {});
  const added = merge([{ name: 'no id here' }, { id: 'g3317', route: '/editor/pro-shirt/g3317' }]);
  assert(added === true);
  assert(builders.length === 2, 'the malformed entry should be skipped, not abort the whole batch');
});

run('a front-only product gets no back price key', () => {
  const builders = [];
  const priceKeys = {};
  const merge = makeMerger(builders, priceKeys);
  merge([{ id: 'nl6733new', route: '/editor/pro-shirt/nl6733new',
    price_keys: { front: 'NL6733NEW_front', back: null } }]);
  assert(priceKeys.nl6733new.back === null);
});

run('missing optional fields degrade to safe defaults instead of throwing', () => {
  const builders = [];
  const merge = makeMerger(builders, {});
  merge([{ id: 'bare', route: '/editor/pro-shirt/bare' }]);
  const card = builders[0];
  assert(Array.isArray(card.gallery) && card.gallery.length === 0);
  assert(Array.isArray(card.pricing) && card.pricing.length === 0);
  assert(typeof card.badge === 'string' && card.badge.length > 0);
});

if (process.exitCode) {
  console.error('SOME CHECKS FAILED');
} else {
  console.log('ALL OK');
}
