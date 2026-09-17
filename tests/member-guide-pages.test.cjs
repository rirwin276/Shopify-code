const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const member=fs.readFileSync('assets/ss-member-home.js','utf8');
const support=fs.readFileSync('sections/ss-support-center.liquid','utf8');
const experience=fs.readFileSync('assets/ss-support-experience.js','utf8');
function memberPage(hasStore){
  const marker=hasStore===null?'':`<div data-ss-member-home-control data-has-store="${hasStore}" data-orders-url="/account"></div>`;
  const dom=new JSDOM(`${marker}<section class="ss-home"><section class="ss-member-hero"><div class="ss-member-shell"><h1 class="ss-member-title">Welcome back, Steve.</h1></div></section></section>`,{url:'https://stellasageco.com/',runScripts:'outside-only'});
  dom.window.eval(member);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}
test('returning members get their dashboard, orders, and compact guidance exactly once',()=>{
  const dom=memberPage(true),d=dom.window.document;
  assert.equal(d.querySelector('.ss-command-primary').getAttribute('href'),'/pages/portal');
  assert.equal(d.querySelector('h1').textContent,'Welcome back, Steve.');
  assert.equal(d.querySelectorAll('.ss-command-guide article').length,3);
  assert(d.querySelector('.ss-command-quick a[href="/account"]'));
  dom.window.eval(member);
  d.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  assert.equal(d.querySelectorAll('.ss-command-guide').length,1);
  dom.window.close();
});
test('members without a store get setup and joining guidance',()=>{
  const dom=memberPage(false),d=dom.window.document;
  assert.equal(d.querySelector('.ss-command-primary').getAttribute('href'),'/pages/request-storefront-form');
  assert.match(d.querySelector('.ss-command-guide').textContent,/Joining a group/);
  assert(d.querySelector('.ss-command-quick a[href="/pages/support"]'));
  dom.window.close();
});
test('the signed-out home is untouched',()=>{
  const dom=memberPage(null),d=dom.window.document;
  assert.equal(d.querySelector('.ss-command-grid'),null);
  assert.equal(d.querySelector('.ss-member-title').textContent,'Welcome back, Steve.');
  dom.window.close();
});
function supportPage(suffix=''){
  const html=support.slice(support.indexOf('<section'),support.indexOf('<style>')).replace(/{{[^}]*}}/g,'test');
  const dom=new JSDOM(html,{url:'https://stellasageco.com/pages/support'+suffix,runScripts:'outside-only'});
  const w=dom.window;
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.setTimeout=()=>0;
  w.fetch=()=>{throw new Error('Support requests must not be sent by UI tests');};
  const inline=support.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replaceAll('{{ section.id }}','test').replace('{{ form_endpoint | json }}',JSON.stringify('/support/cases'));
  w.eval(inline);
  w.eval(experience);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return dom;
}
test('both contact links open the form and switching to order help shows one form',()=>{
  const dom=supportPage(),d=dom.window.document;
  const contact=d.querySelector('#contact-support'),order=d.querySelector('[data-ss-case-panel]');
  for(const link of d.querySelectorAll('a[href="#contact-support"]')){
    link.click();assert.equal(contact.hidden,false);
    d.querySelector('.ss-contact-panel__close').click();assert.equal(contact.hidden,true);
  }
  d.querySelector('.ss-help__store a[href="#contact-support"]').click();
  d.querySelector('[data-ss-open-case]').click();
  assert.equal(contact.hidden,true);assert.equal(order.hidden,false);
  assert.equal(d.querySelector('[data-ss-open-case]').getAttribute('aria-expanded'),'true');
  d.querySelector('[data-ss-close-case]').click();
  assert.equal(order.hidden,true);
  assert.equal(d.activeElement,d.querySelector('[data-ss-open-case]'));
  assert.equal(d.querySelector('[data-ss-open-case]').getAttribute('aria-expanded'),'false');
  assert(d.querySelector('input[name="photos"]'));
  assert(d.querySelector('input[name="text_permission"]'));
  dom.window.close();
});
test('existing support deep links still open the requested help',()=>{
  for(const suffix of ['#shipping','?report=1#report-order-problem','#contact-support']){
    const dom=supportPage(suffix),d=dom.window.document;
    if(suffix==='#shipping')assert.equal(d.querySelector('#shipping').open,true);
    else assert.equal(d.querySelector(suffix.includes('report')?'[data-ss-case-panel]':'#contact-support').hidden,false);
    dom.window.close();
  }
});
test('How It Works navigation targets exist and the template uses one consolidated guide',()=>{
  const source=fs.readFileSync('sections/ss-explainer-page.liquid','utf8');
  const dom=new JSDOM(source.slice(0,source.indexOf('{% schema %}')));
  const d=dom.window.document;
  for(const link of d.querySelectorAll('a[href^="#"]'))assert(d.querySelector(link.getAttribute('href')));
  assert.equal(d.querySelectorAll('h1').length,1);
  const template=JSON.parse(fs.readFileSync('templates/page.contact.json','utf8'));
  assert(!template.order.includes('personalization_showcase'));
  dom.window.close();
});

