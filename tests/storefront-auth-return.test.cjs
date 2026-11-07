const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Liquid } = require('liquidjs');

const root = process.env.THEME_TEST_ROOT || process.cwd();
const layout = fs.readFileSync(path.join(root, 'layout/theme.liquid'), 'utf8');
const form = fs.readFileSync(path.join(root, 'sections/request-storefront-form.liquid'), 'utf8');
const engine = new Liquid();
engine.registerFilter('json', JSON.stringify);
const scripts = [...layout.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const authBridge = scripts.find(script => script.includes('var loginBase'));
const portalResume = scripts.find(script => script.includes('var portalUrl'));
const formPath = '/pages/request-storefront-form';

function context(signedIn = false) {
  return {
    customer: signedIn ? { id: 123 } : null,
    request: { path: formPath },
    routes: {
      account_login_url: '/customer_authentication/redirect?locale=en&region_country=US',
      storefront_login_url: '/customer_authentication/redirect?locale=en&region_country=US'
    },
    pages: { portal: { url: '/pages/portal' } },
    section: { settings: {} }
  };
}

async function browser(pathname, signedIn, pending) {
  const values = new Map(pending ? [['sf_pending_form_v2', JSON.stringify(pending)]] : []);
  const redirects = [];
  const listeners = new Map();
  const location = { pathname, href: '', replace: url => redirects.push(url) };
  const window = { location };
  const sandbox = {
    window,
    document: { addEventListener: (name, callback) => listeners.set(name, callback) },
    localStorage: {
      getItem: key => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key)
    },
    Date, JSON, Number, encodeURIComponent
  };
  vm.createContext(sandbox);
  if (signedIn) vm.runInContext(await engine.parseAndRender(portalResume, context(true)), sandbox);
  vm.runInContext(await engine.parseAndRender(authBridge, context(signedIn)), sandbox);
  return { location, redirects, listeners, values, window };
}

function submit(target) {
  return {
    target,
    prevented: false,
    stopped: false,
    preventDefault() { this.prevented = true; },
    stopImmediatePropagation() { this.stopped = true; }
  };
}

test('new-account sign-in returns to the request form with one valid return_to parameter', async () => {
  const markup = await engine.parseAndRender(form.slice(0, form.indexOf('<div class="sf-form-wrap')), context());
  const href = markup.match(/<a href="([^"]+)">Sign in or create account<\/a>/)[1].replace(/&amp;/g, '&');
  const url = new URL(href, 'https://stellasageco.com');
  assert.equal(url.pathname, '/customer_authentication/login');
  assert.equal(url.searchParams.get('return_to'), formPath);
  assert.deepEqual([...url.searchParams.keys()], ['return_to']);
});

test('legacy signed-out submit uses the supported login endpoint and relative return path', async () => {
  const page = await browser(formPath, false);
  page.window.validateBeforeSubmit = () => true;
  const event = submit({ id: 'sf-request-form', dataset: {} });
  page.listeners.get('submit')(event);
  const url = new URL(page.location.href, 'https://stellasageco.com');
  assert.equal(url.pathname, '/customer_authentication/login');
  assert.equal(url.searchParams.get('return_to'), formPath);
  assert.equal(event.prevented, true);
  assert.equal(event.stopped, true);
});

test('anonymous demo submit stays in its own build flow', async () => {
  const page = await browser(formPath, false);
  const event = submit({ id: 'sf-request-form', dataset: { signedIn: 'false' } });
  page.listeners.get('submit')(event);
  assert.equal(page.location.href, '');
  assert.equal(event.prevented, false);
  assert.equal(page.values.size, 0);
});

test('invalid legacy request and unrelated forms do not navigate', async () => {
  const page = await browser(formPath, false);
  page.window.validateBeforeSubmit = () => false;
  const invalid = submit({ id: 'sf-request-form', dataset: {} });
  page.listeners.get('submit')(invalid);
  assert.equal(page.location.href, '');
  assert.equal(invalid.prevented, true);
  const unrelated = submit({ id: 'contact-form', dataset: {} });
  page.listeners.get('submit')(unrelated);
  assert.equal(unrelated.prevented, false);
});

for (const pathname of [formPath, '/blogs/news/example', '/policies/privacy-policy', '/cart']) {
  test('fresh pending form does not redirect signed-in browsing: ' + pathname, async () => {
    const page = await browser(pathname, true, { return_path: formPath, _saved_at: Date.now() });
    assert.deepEqual(page.redirects, []);
    assert.equal(page.location.href, '');
  });
}

test('portal still resumes a fresh pending request exactly once', async () => {
  const page = await browser('/pages/portal', true, { return_path: formPath, _saved_at: Date.now() });
  assert.deepEqual(page.redirects, [formPath]);
});

test('portal discards an expired pending request', async () => {
  const page = await browser('/pages/portal', true, { return_path: formPath, _saved_at: Date.now() - 13 * 60 * 60 * 1000 });
  assert.deepEqual(page.redirects, []);
  assert.equal(page.values.has('sf_pending_form_v2'), false);
});

test('global account actions preserve both dashboard and store-form destinations', async () => {
  const source = fs.readFileSync(path.join(root, 'snippets/account-actions.liquid'), 'utf8');
  const rendered = await engine.parseAndRender(source.split('<script>')[0] + '{{ dashboard_login_url }}|{{ storefront_form_login_url }}', context());
  const urls = rendered.trim().split('|').map(value => new URL(value.trim(), 'https://stellasageco.com'));
  assert.deepEqual(urls.map(url => url.pathname), ['/customer_authentication/login', '/customer_authentication/login']);
  assert.deepEqual(urls.map(url => url.searchParams.get('return_to')), ['/pages/portal', formPath]);
  urls.forEach(url => assert.deepEqual([...url.searchParams.keys()], ['return_to']));
});

test('join-store sign-in preserves the store handle and invitation code', async () => {
  const source = fs.readFileSync(path.join(root, 'templates/page.join-store.json'), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
  const template = JSON.parse(source);
  const liquid = Object.values(template.sections).map(section => section.settings?.custom_liquid || '').find(value => value.includes('capture return_path'));
  const capture = liquid.match(/{%- capture return_path -%}[\s\S]*?{%- endcapture -%}/)[0];
  const link = liquid.match(/<a class="sf-btn sf-btn--shop"[\s\S]*?<\/a>/)[0];
  const rendered = await engine.parseAndRender(capture + link, { ...context(), request: { path: '/pages/join-store' }, shop_handle: 'raptors-demo', code: 'JOIN123' });
  const url = new URL(rendered.match(/href="([^"]+)"/)[1].replace(/&amp;/g, '&'), 'https://stellasageco.com');
  assert.equal(url.pathname, '/customer_authentication/login');
  assert.equal(url.searchParams.get('return_to'), '/pages/join-store?shop=raptors-demo&code=JOIN123');
});

for (const loginPath of ['', '/account/login', '/customer_authentication/login?locale=en']) {
  test('B2B portal builds one valid return parameter for ' + (loginPath || 'default login'), async () => {
    const source = fs.readFileSync(path.join(root, 'sections/b2b-portal-list.liquid'), 'utf8');
    const assignments = source.split('{%- if customer == nil -%}')[0];
    const rendered = await engine.parseAndRender(assignments + '{{ login_redirect }}', { ...context(), section: { settings: { login_path: loginPath } } });
    const url = new URL(rendered.trim(), 'https://stellasageco.com');
    assert.equal(url.pathname, '/customer_authentication/login');
    assert.equal(url.searchParams.get('return_to'), '/pages/portal');
    assert.equal(url.searchParams.getAll('return_to').length, 1);
    if (loginPath.includes('locale=')) assert.equal(url.searchParams.get('locale'), 'en');
  });
}

test('theme sources do not concatenate another query onto a generated login route', () => {
  const violations = [];
  for (const folder of ['layout', 'sections', 'snippets', 'blocks', 'assets', 'config', 'templates']) {
    for (const entry of fs.readdirSync(path.join(root, folder), { recursive: true })) {
      const filename = path.join(root, folder, entry);
      if (!fs.statSync(filename).isFile()) continue;
      const source = fs.readFileSync(filename, 'utf8');
      if (/routes\.(?:storefront_login_url|account_login_url)\s*}}\?return_|routes\.(?:storefront_login_url|account_login_url)\s*\|\s*append:\s*['"]\?return_/.test(source)) violations.push(folder + '/' + entry);
    }
  }
  assert.deepEqual(violations, []);
});

