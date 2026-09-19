// Run with liquidjs available on NODE_PATH.
const { Liquid } = require('liquidjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

async function run() {
  const engine = new Liquid();
  engine.registerFilter('has', (items, key, value) => items.some(item => item[key] === value));
  const primary = { id: 1, alt: 'Front Black', aspect_ratio: 1, width: 600, height: 600 };
  const life = { id: 2, alt: 'Lifestyle mockup: Black' };
  const back = { id: 3, alt: 'Additional product view: Black' };
  for (const media of [[primary, life], [primary, life, back]]) {
    const product = { media, featured_media: primary, tags: [], options_with_values: [] };
    for (const snippet of ['product-card', 'card-gallery', 'resource-card']) {
      const source = fs.readFileSync(path.join(__dirname, '../snippets', `${snippet}.liquid`), 'utf8');
      const liquid = source.match(/{%-? liquid\s+([\s\S]*?)-?%}/)[1];
      const output = snippet === 'product-card' ? '{{ second_media.id }}' : snippet === 'resource-card'
        ? '{{ secondary_media.id }}' : "{{ all_media | map: 'id' | join: ',' }}";
      const result = (await engine.parseAndRender(`{% liquid\n${liquid}\n%}${output}`, {
        product, resource: product, product_card_product: product, closest: { product }, block: { settings: {} }, section: { settings: {} },
        request: { params: {} }, shop: { metaobjects: {} },
      })).trim();
      assert.equal(result, snippet !== 'card-gallery' ? (media.length === 3 ? '3' : '') : (media.length === 3 ? '1,3' : '1'));
    }
  }
  console.log('PASS: all three card layouts exclude lifestyle images, preserve primary/back views, and handle a single normal image');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
