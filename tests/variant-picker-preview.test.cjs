const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

const productPath = '/products/team-tee';
const colors = [
  ['Navy Triblend', '101', ['68125027795194', '68125028385018']],
  ['Athletic Grey Triblend', '102', ['68125028450554', '68125028581626']],
  ['Grey Triblend', '103', ['68125028647162', '68125028778234']],
];
const sizes = [['S', '201'], ['2XL', '205']];
const flush = () => new Promise((resolve) => setImmediate(resolve));

function variantId(color, size) {
  return colors.find(([name]) => name === color)[2][sizes.findIndex(([name]) => name === size)];
}

function productHtml(color = 'Navy Triblend', size = 'S', path = productPath) {
  const options = (values, selected, idForValue) => values.map(([name, optionId]) =>
    '<option value="' + name + '" data-option-value-id="' + optionId +
    '" data-variant-id="' + idForValue(name) + '"' +
    (name === selected ? ' selected' : '') + '>' + name + '</option>'
  ).join('');
  return '<main><section class="shopify-section">' +
    '<media-gallery><img data-color="' + color + '" src="/' + colors.findIndex(([name]) => name === color) + '.jpg"></media-gallery>' +
    '<variant-picker data-product-id="15490375844090" data-product-url="' + path + '" data-template-product-match="true">' +
    '<form><select name="options[Color]">' + options(colors, color, (value) => variantId(value, size)) + '</select>' +
    '<select name="options[Size]">' + options(sizes, size, (value) => variantId(color, value)) + '</select>' +
    '<script type="application/json">' + JSON.stringify({
      id: variantId(color, size),
      available: true,
      options: [color, size],
      featured_media: { id: colors.findIndex(([name]) => name === color) + 1 },
    }) + '</script></form></variant-picker></section></main>';
}

function asset(name) {
  return fs.readFileSync('assets/' + name, 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/^export default /gm, '')
    .replace(/^export /gm, '');
}

function setup(t, url = 'https://stellasageco.com' + productPath + '?preview=private-code&sh=qa-team') {
  const dom = new JSDOM(productHtml(), { url, runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const w = dom.window;
  const requests = [];
  const updates = [];
  const errors = [];
  w.console.warn = () => {};
  w.console.error = (error) => errors.push(error);
  // Deliberately ignore abort here: a completed response/body can still settle
  // after the next selection. The component must reject stale work itself.
  w.fetch = (requestUrl, options) => new Promise((resolve) => {
    requests.push({
      url: new URL(requestUrl, w.location.href),
      options,
      respond(body, ok = true) {
        resolve({ ok, text: async () => body });
      },
      holdBody() {
        let finish;
        const body = new Promise((resolveBody) => { finish = resolveBody; });
        resolve({ ok: true, text: () => body });
        return finish;
      },
    });
  });
  w.document.addEventListener('variant:update', (event) => updates.push(event.detail.resource));
  // Exercise the real picker, morph, event, and media-gallery implementations.
  // Only the generic component ref plumbing and idle scheduling are stubbed.
  w.eval([
    'class Component extends HTMLElement {',
    '  get refs() { return { fieldsets: Array.from(this.querySelectorAll("fieldset")) }; }',
    '  connectedCallback() {}',
    '  disconnectedCallback() {}',
    '  updatedCallback() {}',
    '}',
    'const requestYieldCallback = (callback) => callback();',
    'const getViewParameterValue = () => new URL(window.location.href).searchParams.get("view");',
    asset('events.js'),
    asset('morph.js'),
    asset('variant-picker.js'),
    asset('media-gallery.js'),
  ].join('\n'));
  return {
    w, requests, updates, errors,
    picker: () => w.document.querySelector('variant-picker'),
    change(name, value) {
      const select = w.document.querySelector('select[name="options[' + name + ']"]');
      select.value = value;
      select.dispatchEvent(new w.Event('change', { bubbles: true }));
    },
    value(name) {
      return w.document.querySelector('select[name="options[' + name + ']"]').value;
    },
  };
}

test('guest variant refresh retains existing preview and store context and updates the gallery', async (t) => {
  const h = setup(t, 'https://stellasageco.com' + productPath +
    '?preview=private%2Bcode%26part&sh=qa-team&shop=qa-team&view=alternate&utm_source=ad');
  h.change('Color', 'Grey Triblend');
  const request = h.requests[0];
  assert.equal(request.url.searchParams.get('preview'), 'private+code&part');
  assert.equal(request.url.searchParams.get('sh'), 'qa-team');
  assert.equal(request.url.searchParams.get('shop'), 'qa-team');
  assert.equal(request.url.searchParams.get('view'), 'alternate');
  assert.equal(request.url.searchParams.get('option_values'), '103,201');
  assert.equal(request.url.searchParams.has('utm_source'), false);
  request.respond(productHtml('Grey Triblend'));
  await flush();
  assert.equal(h.value('Color'), 'Grey Triblend');
  assert.equal(h.w.document.querySelector('media-gallery img').dataset.color, 'Grey Triblend');
  assert.equal(h.updates.at(-1).id, variantId('Grey Triblend', 'S'));
  assert.equal(new URL(h.w.location.href).searchParams.get('variant'), variantId('Grey Triblend', 'S'));
  assert.equal(new URL(h.w.location.href).searchParams.get('preview'), 'private+code&part');
});

test('preview context is never added to another origin or a non-product request', (t) => {
  const h = setup(t);
  const option = h.picker().querySelector('option');
  for (const target of ['https://other.example/products/team-tee', '/pages/support']) {
    option.dataset.connectedProductUrl = target;
    const url = new URL(h.picker().buildRequestUrl(option), h.w.location.href);
    for (const name of ['preview', 'sh', 'shop']) assert.equal(url.searchParams.has(name), false);
  }
});

test('a normal product request does not acquire preview access from storage', (t) => {
  const h = setup(t, 'https://stellasageco.com' + productPath);
  h.w.sessionStorage.setItem('ss_preview_token__qa-team', 'stored-code');
  h.change('Size', '2XL');
  assert.equal(h.requests[0].url.searchParams.has('preview'), false);
});

test('rapid color and size changes use the resolved combination, not a stale option variant ID', async (t) => {
  const h = setup(t);
  h.change('Color', 'Athletic Grey Triblend');
  h.change('Size', '2XL');
  assert.equal(h.requests[0].options.signal.aborted, true);
  assert.equal(h.requests[1].url.searchParams.get('option_values'), '102,205');
  h.requests[1].respond(productHtml('Athletic Grey Triblend', '2XL'));
  await flush();
  assert.equal(new URL(h.w.location.href).searchParams.get('variant'), '68125028581626');
  assert.equal(h.value('Color'), 'Athletic Grey Triblend');
  assert.equal(h.value('Size'), '2XL');
  assert.equal(h.w.document.querySelector('media-gallery img').dataset.color, 'Athletic Grey Triblend');
});

test('a superseded response body cannot replace the latest selection, URL, or gallery', async (t) => {
  const h = setup(t);
  h.change('Color', 'Athletic Grey Triblend');
  const finishOldBody = h.requests[0].holdBody();
  await flush();
  h.change('Color', 'Grey Triblend');
  h.change('Size', '2XL');
  h.requests[2].respond(productHtml('Grey Triblend', '2XL'));
  await flush();
  finishOldBody(productHtml('Athletic Grey Triblend', 'S'));
  h.requests[1].respond(productHtml('Grey Triblend', 'S'));
  await flush();
  assert.equal(h.value('Color'), 'Grey Triblend');
  assert.equal(h.value('Size'), '2XL');
  assert.equal(new URL(h.w.location.href).searchParams.get('variant'), '68125028778234');
  assert.equal(h.w.document.querySelector('media-gallery img').dataset.color, 'Grey Triblend');
  assert.deepEqual(h.updates.map((variant) => variant.id), ['68125028778234']);
});

test('an access-gate or failed response does not publish an unconfirmed variant URL', async (t) => {
  for (const [body, ok] of [
    ['<main><h1>Sign in to access your private store</h1></main>', true],
    [productHtml('Grey Triblend'), false],
  ]) {
    const h = setup(t);
    const originalUrl = h.w.location.href;
    h.change('Color', 'Grey Triblend');
    h.requests[0].respond(body, ok);
    await flush();
    assert.equal(h.w.location.href, originalUrl);
    assert.equal(h.updates.length, 0);
    assert.equal(h.w.document.querySelector('media-gallery img').dataset.color, 'Navy Triblend');
  }
});

test('product cards keep the collection URL while their own variant changes', async (t) => {
  const h = setup(t, 'https://stellasageco.com/collections/qa-team?preview=private-code');
  h.picker().dataset.templateProductMatch = 'false';
  const originalUrl = h.w.location.href;
  h.change('Color', 'Grey Triblend');
  h.requests[0].respond(productHtml('Grey Triblend'));
  await flush();
  assert.equal(h.w.location.href, originalUrl);
  assert.equal(h.updates.at(-1).id, variantId('Grey Triblend', 'S'));
});

test('combined listings change the product path only after a successful response', async (t) => {
  const h = setup(t);
  const originalUrl = h.w.location.href;
  const target = h.picker().querySelector('option[value="Grey Triblend"]');
  target.dataset.connectedProductUrl = '/products/team-tee-child';
  h.change('Color', 'Grey Triblend');
  assert.equal(h.w.location.href, originalUrl);
  assert.equal(h.requests[0].url.pathname, '/products/team-tee-child');
  assert.equal(h.requests[0].url.searchParams.get('preview'), 'private-code');
  h.requests[0].respond(productHtml('Grey Triblend', 'S', '/products/team-tee-child'));
  await flush();
  assert.equal(h.w.location.pathname, '/products/team-tee-child');
  assert.equal(new URL(h.w.location.href).searchParams.get('variant'), variantId('Grey Triblend', 'S'));
  assert.equal(new URL(h.w.location.href).searchParams.get('preview'), 'private-code');
});
