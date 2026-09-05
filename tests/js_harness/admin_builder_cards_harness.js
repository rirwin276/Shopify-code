/*
Every builder card on the Add tab must say whether it offers Name & Number.

The chip and the modal note are drawn from a `personalize` flag written by
hand on each card. It used to appear only on cards where it was true, so a
blank that gained Name & Number and was never revisited here looked exactly
like one that never offered it. That is what happened to the tri-blend tee and
the Bella + Canvas hoodie: both could do it, neither said so on the card, and
nothing anywhere pointed it out.

The truth lives in the builders' config.py in the other repository and there
is no endpoint that reports it, so this file cannot check WHICH cards should
be true. What it can do is refuse to let the flag be left out, which turns a
silent omission into a decision someone has to make.

Run:  node tests/js_harness/admin_builder_cards_harness.js
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'assets', 'ss-admin-pro-builder-cards.js'), 'utf8');

const failures = [];
function check(name, ok, detail) {
  if (ok) { console.log('PASS - ' + name); }
  else { console.error('FAIL - ' + name + (detail ? ': ' + detail : '')); failures.push(name); }
}

// Each card opens with its id; the flag, if present, follows immediately.
const cards = [];
const re = /\{\s*\n\s*id:\s*'([a-z0-9]+)',\s*\n(?:\s*\/\/[^\n]*\n)*(\s*personalize:\s*(true|false),)?/g;
let m;
while ((m = re.exec(src)) !== null) {
  cards.push({ id: m[1], flag: m[3] || null });
}

check('the cards were found', cards.length >= 13, 'found ' + cards.length);

const missing = cards.filter((c) => c.flag === null).map((c) => c.id);
check('every card states whether it offers Name & Number',
  missing.length === 0,
  missing.join(', ') + ' leave it out, which reads as "no" without anyone deciding that');

// The two this was raised about.
['bc3413', 'g3719'].forEach((id) => {
  const card = cards.find((c) => c.id === id);
  check(id + ' offers Name & Number on the Add tab',
    !!card && card.flag === 'true',
    card ? 'flag is ' + card.flag : 'no card at all');
});

// And the ones that already did must not have been disturbed.
['bc3001', 'bc3001y', 'cc1467y', 'cc1717', 'm2480', 'm2580', 'ec8000'].forEach((id) => {
  const card = cards.find((c) => c.id === id);
  check(id + ' still offers it', !!card && card.flag === 'true');
});

// A blank with no back print must not claim it.
['hat39165'].forEach((id) => {
  const card = cards.find((c) => c.id === id);
  check(id + ' does not claim Name & Number', !!card && card.flag === 'false');
});

check('the chip is still drawn from the flag',
  /b\.personalize \? '<span class="ss-modal__chip ss-modal__chip--pers">/.test(src),
  'the flag no longer draws anything');

if (failures.length) { console.error('\nFAILED: ' + failures.join(', ')); process.exit(1); }
console.log('\nALL OK');
