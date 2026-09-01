/*
Admin Powers page — post-change integrity check.

Purpose: make the correctness pass after a redesign cost one command instead of
a re-read of ~10,700 lines. It is DIFFERENTIAL — it compares the page against a
baseline captured from the pre-redesign code, so it reports what a change BROKE
rather than listing everything that looks unusual. That keeps it silent when
nothing is wrong, which is the only way a check like this stays worth running.

What it catches — every one of these is a real, observed failure mode here:

  1. A DOM hook the JS depends on was renamed or dropped. The admin JS reaches
     for ids and classes by name across five files; the markup and the script
     are coupled by nothing but those strings. Two of them
     (#apCustomBuildersContainer, #apCustomBuildersSection) are referenced as
     BARE UNDECLARED IDENTIFIERS in ss-admin-powers-core.js and resolve only via
     the browser putting named elements on window — renaming those throws
     ReferenceError inside apRenderProducts and the product list dies.
  2. Behaviour that lives in the same file as the dark theme was deleted along
     with it. snippets/admin-shop-identity-guard.liquid mixes the store-identity
     guard, the mobile label logic and a SECOND delegated tab handler in with the
     dark stylesheet. Losing any of those is silent in normal browsing.
  3. The dark theme was only half removed. The page theme and the site header
     nav override are two separate blocks keyed off the same class; removing one
     without the other leaves near-white nav text on a light page.
  4. Text that still fails WCAG contrast. Ratios are computed from the shipped
     CSS rather than eyeballed.

Usage:
    node tests/js_harness/admin_powers_integrity.js            # check
    node tests/js_harness/admin_powers_integrity.js --baseline # re-record

Re-record the baseline ONLY from known-good code, and say so in the commit.
Exit 0 and "ALL OK" means the page is structurally intact.
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const BASELINE = path.join(__dirname, 'admin_powers_integrity_baseline.json');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readIf = (p) => { try { return read(p); } catch (_) { return ''; } };

const failures = [];
const notes = [];
function check(name, ok, detail) {
  if (ok) console.log('PASS - ' + name);
  else { console.error('FAIL - ' + name + (detail ? '\n        ' + detail : '')); failures.push(name); }
}

// Files the admin page is actually built from.
const JS_FILES = [
  'assets/ss-admin-powers-core.js',
  'assets/ss-admin-fundraiser.js',
  'assets/ss-prospect-admin-demo.js',
  'assets/ss-admin-pro-builder-cards.js',
  'assets/ss-admin-pro-builder-thumbnail-overrides.js',
  'assets/storefront-appearance-builder.js',
];
const MARKUP_FILES = [
  'sections/admin-powers-page.liquid',
  'sections/storefront-appearance-settings.liquid',
  'snippets/admin-shop-identity-guard.liquid',
];

const jsSource = JS_FILES.map(readIf).join('\n');
const markupSource = MARKUP_FILES.map(readIf).join('\n');
const guardSource = readIf('snippets/admin-shop-identity-guard.liquid');
const cssSource = readIf('assets/ss-admin-powers.css');

// --- 1. DOM hooks the JS depends on ----------------------------------------

/** Every id / class / data-attribute the admin JS reaches for by name. */
function jsReferences(src) {
  const ids = new Set(), classes = new Set(), dataAttrs = new Set();
  let m;

  const byId = /getElementById\(\s*['"]([A-Za-z0-9_-]+)['"]\s*\)/g;
  while ((m = byId.exec(src))) ids.add(m[1]);

  // Selector strings passed to querySelector/querySelectorAll/closest/matches.
  const sel = /(?:querySelectorAll|querySelector|closest|matches)\(\s*['"]([^'"]+)['"]/g;
  while ((m = sel.exec(src))) {
    const s = m[1];
    let t;
    const idIn = /#([A-Za-z0-9_-]+)/g;
    while ((t = idIn.exec(s))) ids.add(t[1]);
    const clsIn = /\.((?:ap|ss|sfs)-[A-Za-z0-9_-]+)/g;
    while ((t = clsIn.exec(s))) classes.add(t[1]);
    const dataIn = /\[(data-[A-Za-z0-9_-]+)/g;
    while ((t = dataIn.exec(s))) dataAttrs.add(t[1]);
  }

  // classList.add/remove/toggle/contains('x')
  const clsList = /classList\.(?:add|remove|toggle|contains)\(\s*['"]((?:ap|ss|sfs)-[A-Za-z0-9_-]+)['"]/g;
  while ((m = clsList.exec(src))) classes.add(m[1]);

  return { ids, classes, dataAttrs };
}

/** Everything the markup actually defines. */
function markupTokens(src) {
  const ids = new Set(), classes = new Set(), dataAttrs = new Set();
  let m;
  const idAttr = /\bid\s*=\s*"([^"]*)"/g;
  while ((m = idAttr.exec(src))) {
    // Liquid interpolation makes an id dynamic; record the literal prefix.
    const raw = m[1];
    if (raw.includes('{{')) ids.add(raw.split('{{')[0].replace(/-$/, ''));
    else ids.add(raw);
  }
  const clsAttr = /\bclass\s*=\s*"([^"]*)"/g;
  while ((m = clsAttr.exec(src))) {
    m[1].split(/\s+/).forEach((c) => { if (c && !c.includes('{{')) classes.add(c); });
  }
  const dataAttr = /\s(data-[A-Za-z0-9_-]+)/g;
  while ((m = dataAttr.exec(src))) dataAttrs.add(m[1]);
  return { ids, classes, dataAttrs };
}

const refs = jsReferences(jsSource);
const markup = markupTokens(markupSource);

/**
 * Hooks that BOTH the JS asks for AND the markup provides. Anything outside
 * this intersection is created at runtime (product rows, catalog cards) or is
 * dead code — neither is a regression, so neither is tracked.
 */
function resolvedHooks() {
  const out = { ids: [], classes: [], dataAttrs: [] };
  for (const id of refs.ids) if (markup.ids.has(id)) out.ids.push(id);
  for (const c of refs.classes) if (markup.classes.has(c)) out.classes.push(c);
  for (const d of refs.dataAttrs) if (markup.dataAttrs.has(d)) out.dataAttrs.push(d);
  out.ids.sort(); out.classes.sort(); out.dataAttrs.sort();
  return out;
}

// The two that resolve only through window's named-element behaviour. They are
// never declared, so a rename is a ReferenceError, not an undefined.
const BARE_GLOBALS = ['apCustomBuildersContainer', 'apCustomBuildersSection'];

// Behaviour sharing a file with the dark theme, easy to delete by accident.
const MUST_KEEP_IN_GUARD = [
  { needle: 'ss_admin_shop_retry', what: 'the store-identity guard (wrong-store protection)' },
  { needle: 'installTabFallback', what: 'the second delegated tab handler' },
  { needle: 'compactProductName', what: 'the mobile product-title shortener' },
  { needle: 'ssDesktopLabel', what: 'the mobile hero label swapping' },
  { needle: 'MutationObserver', what: 'the re-render watcher' },
];

// --- 2. Contrast ------------------------------------------------------------

function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function luminance([r, g, b]) { return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b); }
function ratio(fg, bg) {
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function parseColor(str) {
  str = String(str).trim();
  let m = /^#([0-9a-f]{6})$/i.exec(str);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].substr(i, 2), 16));
  m = /^#([0-9a-f]{3})$/i.exec(str);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16));
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(str);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  return null;
}
/** Flatten a translucent foreground onto its background — alpha is where most
 *  of this page's contrast failures actually come from. */
function composite(fg, bg) {
  const a = fg.length === 4 ? fg[3] : 1;
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
}

/** Last value declared for a custom property, so var() can be followed.
 *  The theme defines its palette as --ap-* tokens; a check that cannot read
 *  through them would skip exactly the rules it exists to verify. */
function customProperty(css, name) {
  const re = new RegExp('(^|[;{\\s])' + name.replace(/[-]/g, '\\-') + '\\s*:\\s*([^;!}]+)', 'g');
  let m, last = null;
  while ((m = re.exec(css))) last = m[2].trim();
  return last;
}
function resolveVars(css, value, depth) {
  depth = depth || 0;
  const m = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+))?\)$/.exec(String(value).trim());
  if (!m) return value;
  if (depth > 5) return null;                       // cycle guard
  const v = customProperty(css, m[1]);
  return v !== null ? resolveVars(css, v, depth + 1) : (m[2] ? resolveVars(css, m[2], depth + 1) : null);
}

/** Read the declared colour for a selector out of the shipped CSS. A selector
 *  may appear in a comma list; the LAST matching rule wins, as in the cascade. */
function declaredColor(css, selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match the selector as a whole token in a selector list, followed by its block.
  const re = new RegExp('(?:^|[,\\s{}])' + esc + '(?=\\s*[,{])[^{]*\\{([^}]*)\\}', 'g');
  let m, last = null;
  while ((m = re.exec(css))) {
    const c = /(?:^|[;\s])color\s*:\s*([^;!}]+)/.exec(m[1]);
    if (c) last = c[1].trim();
  }
  return last === null ? null : resolveVars(css, last);
}

const CREAM = [251, 248, 241];   // --ap-bg #fbf8f1
const CARD = [255, 255, 255];    // --ap-card over cream, effectively white

// Selectors the redesign is required to fix, with the surface each sits on.
const CONTRAST_TARGETS = [
  ['.ap-panel-kicker', CARD, 4.5],
  ['.ap-label', CARD, 4.5],
  ['.ap-helper', CARD, 4.5],
  ['.ap-frw-helper', CARD, 4.5],
  ['.ap-frw-legal-intro', CARD, 4.5],
  ['.ap-frw-stripe-test-note', CARD, 4.5],
  ['.ap-frd-row-label', CARD, 4.5],
  ['.ap-product-box-sub', CARD, 4.5],
  ['.ap-custom-builders-sub', CARD, 4.5],
  ['.ap-main-tab-btn', CREAM, 4.5],
];

// --- run --------------------------------------------------------------------

const recording = process.argv.includes('--baseline');
const current = resolvedHooks();

if (recording) {
  fs.writeFileSync(BASELINE, JSON.stringify({
    recordedFrom: 'known-good admin page',
    ids: current.ids, classes: current.classes, dataAttrs: current.dataAttrs,
  }, null, 2) + '\n');
  console.log(`Baseline recorded: ${current.ids.length} ids, ${current.classes.length} classes, ${current.dataAttrs.length} data-attributes.`);
  console.log('Commit this file, and say in the commit message that it was re-recorded.');
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error('No baseline. Run with --baseline against known-good code first.');
  process.exit(1);
}
const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));

// 1. Every hook that used to resolve must still resolve.
for (const kind of ['ids', 'classes', 'dataAttrs']) {
  const now = new Set(current[kind]);
  const missing = base[kind].filter((x) => !now.has(x));
  const label = { ids: 'id', classes: 'class', dataAttrs: 'data-attribute' }[kind];
  check(
    `every ${label} the JS depends on is still in the markup`,
    missing.length === 0,
    missing.length
      ? `${missing.length} no longer resolve: ${missing.join(', ')}\n        The JS reaches for these by name; the element is gone or renamed.`
      : ''
  );
}

// 2. The two that fail loudly rather than quietly.
for (const name of BARE_GLOBALS) {
  const inMarkup = new RegExp('id\\s*=\\s*"' + name + '"').test(markupSource);
  check(
    `#${name} still exists (undeclared identifier in core.js — a rename is a ReferenceError)`,
    inMarkup
  );
}

// 3. Behaviour that shares a file with the dark theme.
for (const { needle, what } of MUST_KEEP_IN_GUARD) {
  check(`${what} survived`, guardSource.includes(needle),
    `"${needle}" is gone from snippets/admin-shop-identity-guard.liquid`);
}

// 4. The dark theme is either fully present or fully gone — never half.
const darkClassAdded = /classList\.add\(\s*['"]ss-admin-command-center['"]\s*\)/.test(guardSource);
const darkThemeBlock = guardSource.includes('ss-admin-command-center-theme');
const headerOverride = readIf('snippets/stylesheets.liquid').includes('ss-admin-command-center');
const darkParts = [darkClassAdded, darkThemeBlock, headerOverride];
const darkOn = darkParts.every(Boolean), darkOff = darkParts.every((p) => !p);
check(
  'the dark theme is fully applied or fully removed, not half',
  darkOn || darkOff,
  darkOn || darkOff ? '' :
    `class added: ${darkClassAdded}, page theme: ${darkThemeBlock}, header nav override: ${headerOverride}\n` +
    '        The header nav is forced near-white BECAUSE the page is dark. Leaving that\n' +
    '        override behind on a light page makes the nav invisible.'
);
if (darkOff) notes.push('Dark theme fully removed — the light theme in ss-admin-powers.css is now what renders.');
if (darkOn) notes.push('Dark theme still applied — this is the pre-redesign state.');

// 5. The light hero must not have been deleted by mistake.
check(
  'the light hero block is still present in ss-admin-powers.css',
  cssSource.includes('LIGHT HERO'),
  'Its own comment says "DELETE THIS BLOCK to restore the dark hero" — the opposite of what is wanted.'
);

// 6. Contrast, but only once the page is actually light.
if (darkOff) {
  for (const [selector, bg, min] of CONTRAST_TARGETS) {
    // A contrast target that cannot be evaluated is a FAILURE, not a note. The
    // one thing this check must never do is go green by not looking.
    const decl = declaredColor(cssSource, selector);
    if (!decl) { check(`${selector} has a resolvable colour`, false, 'no color declaration found'); continue; }
    const parsed = parseColor(decl);
    if (!parsed) { check(`${selector} has a resolvable colour`, false, `could not evaluate "${decl}"`); continue; }
    const r = ratio(composite(parsed, bg), bg);
    check(`${selector} reaches ${min}:1`, r >= min,
      `${decl} on rgb(${bg.join(',')}) is ${r.toFixed(2)}:1`);
  }
  const hasPlaceholder = /::placeholder/.test(cssSource);
  check('a ::placeholder colour is defined', hasPlaceholder,
    'Without one the UA default renders, which is a light-mode grey.');
} else {
  notes.push('Contrast checks skipped — they only apply once the page is light.');
}

// --- report -----------------------------------------------------------------

console.log('');
if (notes.length) { notes.forEach((n) => console.log('note: ' + n)); console.log(''); }
console.log(`Tracking ${base.ids.length} ids, ${base.classes.length} classes, ${base.dataAttrs.length} data-attributes.`);
if (failures.length) {
  console.error(`\n${failures.length} FAILED: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nALL OK');
