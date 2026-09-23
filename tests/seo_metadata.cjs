const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const theme = read('layout/theme.liquid');
const meta = read('snippets/meta-tags.liquid');
// Shopify objects remain available inside render; locally assigned SEO variables
// do not. Keep that distinction in the test rather than weakening image checks.
const globalNames = ['request', 'template', 'shop', 'page', 'product', 'blog', 'cart', 'settings', 'page_title', 'page_description', 'page_image', 'canonical_url', 'current_page', 'current_tags'];
async function render(source, context) {
  const globals = Object.fromEntries(globalNames.map(name => [name, context[name]]));
  const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid', globals });
  engine.registerFilter('json', value => JSON.stringify(value));
  engine.registerFilter('image_url', value => typeof value === 'string' ? value : value.url);
  engine.registerFilter('money_without_currency', value => (Number(value) / 100).toFixed(2));
  return engine.parseAndRender(source, context);
}
const privacyStart = theme.indexOf('{%- liquid\n      assign is_private_store_collection');
const privacyEnd = theme.indexOf('    {%- comment -%}\n      STELLA & SAGE ANTI-FLASH GUARD');
const copyStart = theme.indexOf('{%- liquid\n      assign ss_seo_title');
const copyEnd = theme.indexOf("    {%- render 'stylesheets'");
assert(privacyStart >= 0 && privacyEnd > privacyStart && copyStart >= 0 && copyEnd > copyStart);
const source = theme.slice(privacyStart, privacyEnd) + theme.slice(copyStart, copyEnd);
const base = {
  request: { page_type: 'index', origin: 'https://stellasageco.com' },
  template: { name: 'index', suffix: '' },
  shop: { name: 'Stella &amp; Sage', description: 'Fallback description', url: 'https://stellasageco.com', email: 'test@example.com' },
  page_title: 'Fixture page', page_description: 'Fixture description',
  canonical_url: 'https://stellasageco.com/', current_page: 1, current_tags: null,
  settings: {}, cart: { currency: { iso_code: 'USD' } }, page: { handle: '' },
  product: { collections: [], price: 2300 }, blog: { handle: '' },
};
const matches = (s, re) => [...s.matchAll(re)];
let count = 0;
async function check(label, overrides, expected = {}) {
  const context = { ...base, ...overrides };
  const html = await render(source, context);
  const titles = matches(html, /<title>([\s\S]*?)<\/title>/gi);
  assert.equal(titles.length, 1, `${label}: one title`);
  assert.equal(matches(html, /<meta\s+name="description"[^>]*>/gi).length, 1, `${label}: one description`);
  assert.equal(matches(html, /<link\s+rel="canonical"[^>]*>/gi).length, 1, `${label}: one canonical`);
  assert.equal(matches(html, /<meta\s+property="og:title"[^>]*>/gi).length, 1, `${label}: one social title`);
  assert.equal(matches(html, /<meta\s+property="og:description"[^>]*>/gi).length, 1);
  assert.equal(matches(html, /<meta\s+name="robots"[^>]*>/gi).length, expected.noindex ? 1 : 0, `${label}: intentional indexing`);
  if (expected.noindex) assert.match(html, /name="robots" content="noindex,follow"/);
  if (expected.title) assert(titles[0][1].includes(expected.title), `${label}: expected title`);
  if (expected.branded) assert.equal((titles[0][1].match(/Stella/g) || []).length, 1, `${label}: brand once`);
  if (expected.canonical) assert(html.includes(`rel="canonical" href="${expected.canonical}"`));
  if (expected.socialImage) {
    assert.equal(matches(html, /<meta\s+property="og:image"[^>]*>/gi).length, 1);
    assert(html.includes(`property="og:image" content="${expected.socialImage}"`));
  }
  assert(!html.includes('Liquid error'));
  console.log(`PASS ${label}`); count++;
  return html;
}
(async () => {
  const home = await check('home', {}, { title: 'Free Team Stores &amp; Custom Spirit Wear', branded: true });
  assert(home.includes('Parents order online; we ship directly to their homes.'));
  assert(home.includes('property="og:title"\n  content="Free Team Stores &amp; Custom Spirit Wear | Stella &amp; Sage"'));
  for (const handle of ['private-storefronts', 'request-storefront-form', 'resources', 'support']) {
    await check(`public page ${handle}`, { request: { page_type: 'page' }, page: { handle } }, { branded: true });
  }
  await check('blog', { request: { page_type: 'blog' }, blog: { handle: 'news' } }, { title: 'Team Store &amp; Spirit Wear Guides', branded: true });
  await check('article keeps its own metadata', { request: { page_type: 'article' }, page_title: 'Useful guide' }, { title: 'Useful guide' });
  for (const handle of ['portal', 'admin-powers', 'join-store', 'super-admin']) {
    await check(`utility ${handle}`, { request: { page_type: 'page' }, page: { handle } }, { noindex: true });
  }
  await check('waiting room', { request: { page_type: 'page' }, page: { handle: 'request-storefront-form' }, template: { name: 'page', suffix: 'start-team-store' } }, { noindex: true });
  for (const page_type of ['search', 'cart', '404', 'list-collections']) {
    await check(page_type, { request: { page_type } }, { noindex: true });
  }
  await check('private collection', { request: { page_type: 'collection' }, template: { name: 'collection', suffix: 'private-store' } }, { noindex: true });
  await check('private product', { request: { page_type: 'product' }, product: { collections: [{ template_suffix: 'private-store' }], price: 2300 } }, { noindex: true });
  await check('public product remains indexable', { request: { page_type: 'product' } });
  await check('public collection remains indexable', { request: { page_type: 'collection' }, template: { name: 'collection', suffix: '' } });
  await check('obsolete catalog', { request: { page_type: 'page' }, page: { handle: 'stella-sage-shop' }, canonical_url: 'https://stellasageco.com/pages/stella-sage-shop' }, { noindex: true, canonical: 'https://stellasageco.com/' });
  await check('shared private store image', { request: { page_type: 'collection' }, template: { name: 'collection', suffix: 'private-store' }, ss_preview_img: { url: '//cdn.shopify.com/test.png' }, ss_store_entry: { name: 'Fixture Team' } }, { noindex: true, socialImage: 'https://cdn.shopify.com/test.png' });
  await check('absolute HTTPS image is not double prefixed', { page_image: { url: 'https://cdn.shopify.com/test.png' } }, { socialImage: 'https://cdn.shopify.com/test.png' });
  const password = await render(meta, { ...base, request: { page_type: 'password', origin: 'https://stellasageco.com' } });
  assert.equal(matches(password, /<title>/g).length, 1);
  assert.equal(matches(password, /rel="canonical"/g).length, 1);
  assert.equal(matches(password, /name="description"/g).length, 1);
  assert(password.includes('<meta charset="utf-8">'));
  console.log('PASS password-layout fallback'); count++;
  const orgBlock = matches(theme, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g).find(m => m[1].includes('Organization'));
  assert(orgBlock);
  const org = JSON.parse(await render(orgBlock[1], base));
  assert(!org.description.includes('fundraising'));
  assert(org.description.includes('Free private team stores'));
  console.log('PASS valid, accurate Organization JSON-LD'); count++;
  const baseline = process.env.SEO_BASE_SHA || 'e89b6eb561918a2dc30e5cb1161551de22e6bc10';
  const oldTheme = execFileSync('git', ['show', `${baseline}:layout/theme.liquid`], { cwd: root, encoding: 'utf8' });
  const oldMeta = execFileSync('git', ['show', `${baseline}:snippets/meta-tags.liquid`], { cwd: root, encoding: 'utf8' });
  assert.equal(theme.slice(theme.indexOf('  <body ')), oldTheme.slice(oldTheme.indexOf('  <body ')));
  const scripts = text => matches(text, /<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g).map(m => m[0]);
  assert.deepEqual(scripts(theme), scripts(oldTheme));
  assert.deepEqual(scripts(meta), scripts(oldMeta));
  console.log('PASS existing body and executable scripts unchanged'); count++;
  for (const name of ['main_deploy/assets.json', 'preview_deploy/assets.json']) {
    if (!fs.existsSync(path.join(root, name))) continue;
    const before = JSON.parse(execFileSync('git', ['show', `${baseline}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
    const after = JSON.parse(read(name));
    assert.equal(after.length, before.length);
    for (let i = 0; i < before.length; i++) {
      assert.equal(after[i].key, before[i].key);
      if (after[i].key === 'layout/theme.liquid') assert.equal(after[i].value, theme);
      else if (after[i].key === 'snippets/meta-tags.liquid') assert.equal(after[i].value, meta);
      else assert.deepEqual(after[i], before[i]);
    }
  }
  console.log('PASS deployment payloads change only the two SEO assets'); count++;
  console.log(`SEO regression checks passed: ${count}`);
})().catch(error => { console.error(error); process.exit(1); });
