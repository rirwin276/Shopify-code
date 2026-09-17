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

test('private return link keeps the original timer and logo',async()=>{
  const markup=fs.readFileSync('snippets/ss-demo-wait-content.liquid','utf8').replace(/{%[\s\S]*?%}/g,'').replace(/{{[\s\S]*?}}/g,'');
  const started=new Date(Date.now()-4*60*1000).toISOString();
  const logo='data:image/png;base64,dGVzdA==';
  const dom=new JSDOM(`<section data-ss-demo-start data-enabled="true" data-api-base="https://preview.example">${markup}</section>`,{
    url:'https://stellasageco.com/pages/request-storefront-form?view=start-team-store#resume=private',
    runScripts:'outside-only'
  });
  const w=dom.window;w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.localStorage.setItem('ss_anonymous_demo_v1',JSON.stringify({token:'private',createdAt:Date.now()-3*60*1000,logoThumb:logo,storeName:'My Team'}));
  w.fetch=async()=>({ok:true,status:200,json:async()=>({phase:'building',build_stage:'products',created_at:started,storefront_name:'My Team'})});
  w.eval(fs.readFileSync('assets/ss-anonymous-demo-start.js','utf8'));
  await flush();await flush();
  const saved=JSON.parse(w.localStorage.getItem('ss_anonymous_demo_v1'));
  assert.equal(saved.createdAt,Date.parse(started));
  assert.equal(saved.logoThumb,logo);
  assert.match(w.document.querySelector('[data-demo-elapsed]').textContent,/04:00/);
  assert.equal(w.document.querySelector('[data-demo-team-logo]').src,logo);
  dom.window.close();
});

test('prospect Products tab previews real controls without mutating products',async()=>{
  const dom=new JSDOM(`<!doctype html><main class="ap-wrap--prospect-demo">
    <button id="apTabBtnProducts" class="ap-main-tab-btn"><span class="ap-tab-label">Products</span></button>
    <button id="apTabBtnAddProducts" class="ap-main-tab-btn"><span class="ap-tab-label">Add Products</span></button>
    <button id="apTabBtnMembers" class="ap-main-tab-btn"><span class="ap-tab-label">Members</span></button>
    <button id="apTabBtnDanger" class="ap-main-tab-btn"><span class="ap-tab-label">Danger</span></button>
    <section id="apPanelProducts" class="ap-main-panel"><div class="ap-panel-head"></div><span id="apAllProductCount"></span><div id="apProductsAllContainer"></div><div id="apProductsEmpty"></div><div id="apStatusProducts"></div></section>
    <section id="apPanelAddProducts" class="ap-main-panel"><div id="apCustomBuildersContainer"></div></section>
    <section id="apPanelMembers" class="ap-main-panel"></section><section id="apPanelDanger" class="ap-main-panel"></section>
  </main>`,{url:'https://stellasageco.com/pages/admin-powers?shop=my-team',runScripts:'outside-only'});
  const w=dom.window;
  w.SSAP={isProspectDemo:true,shopHandle:'my-team',previewToken:'code',previewProducts:[{title:'Team Hoodie',featured_image:'https://cdn.example/hoodie.jpg',hidden:false}]};
  const requests=[];
  w.fetch=async(url,options={})=>{requests.push({url,options});return {ok:true,status:200,json:async()=>({enabled:true,demo_token:'token',session_id:'session',product_status:'available',last_product_status:'available',product_limit:2,products_created:0})};};
  w.eval(fs.readFileSync('assets/ss-prospect-admin-demo.js','utf8'));
  await flush();await flush();
  const tab=w.document.getElementById('apTabBtnProducts');
  assert.equal(tab.hasAttribute('data-prospect-locked'),false);
  assert.equal(w.document.getElementById('apAllProductCount').textContent,'1');
  assert.deepEqual(Array.from(w.document.querySelectorAll('.ap-demo-product-actions button'),node=>node.textContent),['✏️ Edit','☆ Pin','Hide','Delete']);
  w.document.querySelector('.ap-demo-product-actions button:nth-child(3)').click();
  assert.match(w.document.getElementById('apStatusProducts').textContent,/Claim this store to hide “Team Hoodie.”/);
  assert.equal(requests.filter(request=>String(request.url).includes('demo-product')).length,0);
  dom.window.close();
});
