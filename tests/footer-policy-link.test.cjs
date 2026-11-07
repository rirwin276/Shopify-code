const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Liquid } = require('liquidjs');
const raw = fs.readFileSync('sections/footer-group.json', 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
const group = JSON.parse(raw);
const liquid = Object.values(group.sections).map(section => section.settings?.custom_liquid || '').find(value => value.includes('ss-studio-footer__links'));
const nav = liquid.match(/<nav class="ss-studio-footer__links"[\s\S]*?<\/nav>/)[0];
const engine = new Liquid();

for (const policy of [undefined, {}, { body: '', url: '/policies/terms-of-service' }, { body: '<p>Approved terms</p>', url: '' }]) {
  test('footer omits an unavailable or incomplete Terms policy: ' + JSON.stringify(policy), async () => {
    const rendered = await engine.parseAndRender(nav, { shop: { terms_of_service: policy } });
    assert.doesNotMatch(rendered, />Terms<\/a>/);
    assert.match(rendered, /\/policies\/privacy-policy/);
    assert.match(rendered, /\/policies\/refund-policy/);
  });
}

test('footer links to the actual published Terms policy URL when available', async () => {
  const rendered = await engine.parseAndRender(nav, { shop: { terms_of_service: { body: '<p>Approved terms</p>', url: '/fr/policies/terms-of-service' } } });
  assert.match(rendered, /href="\/fr\/policies\/terms-of-service">Terms<\/a>/);
  assert.equal((rendered.match(/>Terms<\/a>/g) || []).length, 1);
});

