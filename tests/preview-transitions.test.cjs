const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const flush=()=>new Promise(r=>setImmediate(r));

test('admin route guard preserves the preview code after DOM updates',async()=>{
  const guard=fs.readFileSync('snippets/admin-shop-identity-guard.liquid','utf8');
  const dom=new JSDOM('<div class="ap-hero-actions"><a class="ap-btn" href="/collections/my-team?preview=private-code">Shop Store</a><a class="ap-btn" href="/pages/portal">Dashboard</a></div>',{url:'https://stellasageco.com/pages/admin-powers?shop=my-team',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window; w.matchMedia=()=>({matches:true,addEventListener(){}});
  w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
  w.SSAP={shopHandle:'my-team',collectionHandle:'my-team',isProspectDemo:true,liveStoreUrl:'/collections/my-team?preview=private-code'};
  for(const match of guard.matchAll(/<script>([\s\S]*?)<\/script>/g))w.eval(match[1]);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  w.document.body.appendChild(w.document.createElement('div'));await new Promise(r=>setTimeout(r,20));
  assert.equal(w.document.querySelector('.ap-btn').getAttribute('href'),'/collections/my-team?preview=private-code');
  assert.equal(w.document.querySelector('.ap-btn').textContent,'Shop');dom.window.close();
});

test('embedded waiting room is immediate, truthful, and keeps the same page after acceptance',async()=>{
  const markup=fs.readFileSync('snippets/ss-demo-wait-content.liquid','utf8').replace(/{%[\s\S]*?%}/g,'').replace(/{{[\s\S]*?}}/g,'');
  const dom=new JSDOM(`<section data-ss-demo-start data-enabled="true" data-embedded="true" data-api-base="https://preview.example" hidden>${markup}</section>`,{url:'https://stellasageco.com/pages/request-storefront-form',runScripts:'outside-only'});
  const w=dom.window;w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.fetch=async()=>({ok:true,json:async()=>({phase:'ready',preview_url:'/collections/my-team?preview=code'})});
  w.eval(fs.readFileSync('assets/ss-anonymous-demo-start.js','utf8'));
  assert.equal(w.document.querySelector('section').hidden,true);
  w.SSPreviewWaitingRoom.begin({storeName:'My Team',createdAt:Date.now()-65000});
  assert.equal(w.document.querySelector('section').hidden,false);
  assert.match(w.document.querySelector('[data-demo-elapsed]').textContent,/01:05/);
  assert.match(w.document.querySelector('[data-demo-save-label]').textContent,/Saving/);
  assert.equal(w.document.querySelector('.ss-demo-return').hidden,true);
  assert.equal(w.localStorage.getItem('ss_anonymous_demo_v1'),null);
  w.SSPreviewWaitingRoom.accepted({storeName:'My Team',createdAt:Date.now()-65000,token:'private',handle:'my-team'});await flush();
  assert.equal(w.location.search,'?view=start-team-store');
  assert.equal(w.document.querySelector('[data-demo-ready-actions]').hidden,false);
  assert.equal(w.document.querySelector('.ss-demo-return').hidden,false);
  assert.equal(w.document.querySelector('[data-open-preview]').search,'?preview=code');
  assert.ok(w.document.querySelector('.ss-demo-return').compareDocumentPosition(w.document.querySelector('.ss-wait-nav')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
  dom.window.close();
});
