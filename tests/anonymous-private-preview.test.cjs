const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const section = fs.readFileSync('sections/ss-anonymous-preview.liquid','utf8').split('{% schema %}')[0]
  .replace(/data-api="[^"]*"/, 'data-api="https://preview.example"')
  .replace(/data-signed-in="[^"]*"/, 'data-signed-in="false"');
const script = fs.readFileSync('assets/ss-anonymous-preview.js','utf8');
async function mount(handle='team-demo-abc123') {
  const dom = new JSDOM(section,{url:'https://stellasageco.com/pages/request-storefront-form?view=anonymous-preview&shop=team-demo-abc123',runScripts:'outside-only'});
  const w=dom.window,calls=[];
  w.localStorage.setItem('ss_anonymous_demo_v1',JSON.stringify({handle,token:'test-bearer'}));
  w.setTimeout=()=>0;w.clearTimeout=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
  w.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({name:'Test Team',appearance:{},build:{},products:[{
    id:'gid://shopify/Product/1',handle:'qa-tee',title:'<img src=x onerror=alert(1)>',tags:['team-demo-abc123','ss-anonymous-demo','model--BC3001'],description:'Soft tee',
    images:{nodes:[{url:'https://cdn.example/front.png'}]},variants:{nodes:[{id:'1',title:'Navy / M',price:'25.00'},{id:'2',title:'Red / L',price:'27.00',image:{url:'https://cdn.example/red.png'}}]}
  }]})}};
  w.eval(script);await new Promise(resolve=>setImmediate(resolve));return {dom,w,calls};
}
test('a copied preview URL cannot read another session store',async()=>{
  const {dom,w,calls}=await mount('different-demo-abc123');
  assert.equal(calls.length,0);assert.match(w.document.querySelector('[data-error]').textContent,/private preview/);dom.window.close();
});
test('product text is escaped and ordering opens activation instead of a cart',async()=>{
  const {dom,w,calls}=await mount();
  const card=w.document.querySelector('[data-products] article');
  assert.equal(card.querySelectorAll('img').length,1);
  assert.equal(card.querySelector('h3').textContent,'<img src=x onerror=alert(1)>');
  card.querySelector('button').click();
  w.document.querySelector('[data-product] [data-activate]').click();
  assert.equal(w.document.querySelector('[data-panel="activate"]').hidden,false);
  assert.equal(calls.length,1);assert.equal(calls[0].options.headers.Authorization,'Bearer test-bearer');dom.window.close();
});
test('choosing a variant updates the real price and matching image',async()=>{
  const {dom,w}=await mount();w.document.querySelector('[data-products] button').click();
  const selector=w.document.querySelector('[data-variant]');selector.value='1';selector.dispatchEvent(new w.Event('change'));
  assert.equal(w.document.querySelector('[data-product-price]').textContent,'$27.00');
  assert.equal(w.document.querySelector('[data-product-image]').src,'https://cdn.example/red.png');dom.window.close();
});
