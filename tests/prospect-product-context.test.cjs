const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');

const script = fs.readFileSync('assets/ss-prospect-admin-demo.js', 'utf8');
const origin = 'https://stellasageco.com';
const handle = 'stella-sage-qa-nov-7-demo-5d26ef';
const flush = () => new Promise(resolve => setImmediate(resolve));

async function mount(t, config = {}, initialState = {}) {
  const dom = new JSDOM('<main class="ap-wrap--prospect-demo"><section id="apPanelAddProducts"></section></main>', {
    url: `${origin}/pages/admin-powers?shop=${handle}`
  });
  t.after(() => dom.window.close());
  let state = {
    enabled: true,
    demo_token: 'demo-token',
    product_status: 'available',
    product_limit: 2,
    products_created: 0,
    ...initialState
  };
  const polls = new Map();
  const redirects = [];
  const requests = [];
  const window = {
    SSAP: {
      isProspectDemo: true,
      shopHandle: handle,
      editorBaseUrl: 'https://editor.example',
      ...config
    },
    location: {href: dom.window.location.href},
    addEventListener: dom.window.addEventListener.bind(dom.window),
    setInterval: callback => { polls.set(1, callback); return 1; },
    clearInterval: id => polls.delete(id),
    setTimeout: callback => { redirects.push(callback); return redirects.length; }
  };
  const fetch = async (url, options) => {
    requests.push({url, options});
    return {ok: true, json: async () => url.endsWith('/state') ? state : {}};
  };
  vm.runInNewContext(script, {
    window,
    document: dom.window.document,
    CustomEvent: dom.window.CustomEvent,
    URL,
    fetch
  });
  await flush();
  return {
    window,
    document: dom.window.document,
    requests,
    polls,
    redirects,
    setState: next => { state = {...state, ...next}; },
    saved: () => dom.window.dispatchEvent(new dom.window.MessageEvent('message', {
      origin: 'https://editor.example',
      data: {type: 'bc3413_placement_saved'}
    }))
  };
}

function assertPreviewContext(rawUrl, previewToken = '1') {
  const url = new URL(rawUrl, origin);
  assert.equal(url.origin, origin);
  assert.equal(url.searchParams.get('sh'), handle);
  assert.equal(url.searchParams.get('preview'), previewToken);
  assert.equal(url.searchParams.getAll('sh').length, 1);
  return url;
}

test('completed product link keeps the originating store and encoded preview token', async t => {
  const previewToken = 'private+code&scope=shop';
  const app = await mount(t, {previewToken}, {
    product_status: 'completed',
    products_created: 1,
    product_handle: 'qa-tri-blend'
  });
  const link = app.document.querySelector('.ap-demo-complete__actions a');
  const url = assertPreviewContext(link.href, previewToken);
  assert.equal(url.pathname, '/products/qa-tri-blend');
  assert.equal(url.searchParams.get('demo_product'), '1');
  assert.equal(url.searchParams.has('scope'), false);
});

test('completed build redirect keeps the same store as its View product link', async t => {
  const app = await mount(t);
  app.saved();
  assert.equal(app.polls.size, 1);
  app.setState({product_status: 'completed', products_created: 1, product_handle: 'qa-tri-blend'});
  app.polls.get(1)();
  await flush();
  assert.equal(app.polls.size, 0);
  assert.equal(app.redirects.length, 1);
  app.redirects[0]();
  const url = assertPreviewContext(app.window.location.href);
  assert.equal(url.pathname, '/products/qa-tri-blend');
  assert.equal(url.searchParams.get('demo_product'), '1');
  assert.equal(url.href, app.document.querySelector('.ap-demo-complete__actions a').href);
});

test('a completed build without a product handle returns to its preview collection', async t => {
  const app = await mount(t, {previewToken: 'collection-code'});
  app.saved();
  app.setState({product_status: 'completed', products_created: 1});
  app.polls.get(1)();
  await flush();
  app.redirects[0]();
  const url = assertPreviewContext(app.window.location.href, 'collection-code');
  assert.equal(url.pathname, `/collections/${handle}`);
  assert.equal(url.searchParams.get('demo_product'), '1');
  const link = assertPreviewContext(app.document.querySelector('.ap-demo-complete__actions a').href, 'collection-code');
  assert.equal(link.pathname, `/collections/${handle}`);
});

test('non-prospect admin pages remain outside the guest completion flow', async t => {
  const app = await mount(t, {isProspectDemo: false});
  assert.equal(app.window.SSProspectDemo, undefined);
  assert.equal(app.requests.length, 0);
  assert.equal(app.document.querySelector('#apDemoClaimBar'), null);
});
