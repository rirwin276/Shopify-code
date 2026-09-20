/* Which garment photo the live name preview draws on.

   A print area that carries BOTH the store's artwork and a buyer name gets an
   extra mockup at build time: the garment with the artwork alone on it, no
   sample name. The product page prefers that photo and draws the buyer's name
   over it as they type. Without one it falls back to the blank garment plus a
   flat paste of the print file — rougher, but it still shows the buyer what
   their name sits next to, and every product built before this existed relies
   on it.

   The function is read out of the shipped asset rather than restated here, so
   this cannot drift into testing a stale copy.

   Usage: node tests/js_harness/area_preview_mockup_harness.js
*/
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');

const ASSET = path.join(__dirname, '../../assets/ss-area-personalize.js');
const source = fs.readFileSync(ASSET, 'utf8');

function extract(name) {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, 'could not find function ' + name + ' in ' + ASSET);
  let depth = 0, pos = source.indexOf('{', start);
  for (let i = pos; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw Error('unbalanced ' + name);
}

function pick(cfg, color, maps) {
  const scope = { cfg, color, maps };
  vm.createContext(scope);
  vm.runInContext(extract('garmentUrl') + '\nresult = garmentUrl();', scope);
  return scope.result;
}

const BLANK = { Black: 'blank-black.jpg', 'Khaki Green': 'blank-khaki.jpg' };
const PRINTED = { Black: 'printed-black.jpg', 'Khaki Green': 'printed-khaki.jpg' };

// 1. Artwork on the print: use the photo that already has it printed, and say
//    so, because the caller must then NOT paste the print file on top of it.
let got = pick({ preview_mockups: PRINTED }, 'Black', BLANK);
assert.equal(got.url, 'printed-black.jpg');
assert.equal(got.printed, true);

// 2. The choice follows the colour the shopper picked, not the first entry.
got = pick({ preview_mockups: PRINTED }, 'Khaki Green', BLANK);
assert.equal(got.url, 'printed-khaki.jpg');
assert.equal(got.printed, true);

// 3. No printed photo for this product — every listing built before the extra
//    mockup existed. Blank garment, and the flat overlay stays switched on.
got = pick({}, 'Black', BLANK);
assert.equal(got.url, 'blank-black.jpg');
assert.equal(got.printed, false);

// 4. A printed set that is missing this colour falls back rather than showing
//    another colour's garment.
got = pick({ preview_mockups: { Black: 'printed-black.jpg' } }, 'Khaki Green', BLANK);
assert.equal(got.url, 'blank-khaki.jpg');
assert.equal(got.printed, false);

// 5. Nothing at all is a failure the caller has to report, not a blank draw.
got = pick({}, 'Maroon', BLANK);
assert.equal(got.url, '');
assert.equal(got.printed, false);

console.log('PASS: the name preview prefers the artwork-printed mockup per colour, '
  + 'and falls back to the blank garment + flat print overlay without one');
