const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('assets/ss-admin-workspace.js','utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function row(name,handle,hidden=false,pinned=false){return `<div class="ap-product-row" data-product-handle="${handle}" data-hidden="${hidden}"><img class="ap-product-thumb" src="https://example.com/product.jpg"><span class="ap-product-title">${name}</span><div class="ap-product-row__actions"><button class="ap-edit-placement-btn">Edit</button><button class="ap-btn--pin-sm ${pinned?'is-pinned':''}" data-pinned="${pinned?'1':'0'}">Pin</button></div></div>`;}
function setup(){
 const dom=new JSDOM(`<div class="ap-workspace"><input id="apProductSearch"><div id="apProductResults"></div><div id="apFilterEmpty" hidden></div>${['all','live','hidden','pinned'].map(f=>`<button data-ap-filter="${f}">${f}</button>`).join('')}<button data-ap-open-tab="apTabBtnAddProducts">Add product</button><button class="ap-main-tab-btn" id="apTabBtnProducts" aria-selected="true">Products</button><button class="ap-main-tab-btn" id="apTabBtnAddProducts" aria-selected="false">Add Products</button><div id="apProductsAllContainer">${row('Team Hoodie','hoodie')}${row('Youth Tee','tee',true)}${row('Team Hat','hat',false,true)}</div></div>`,{url:'https://example.com',runScripts:'outside-only'});
 const w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.SSAP={isProspectDemo:false};
 w.eval(source);
 return dom;
}
test('product search and filters compose without changing product state',async()=>{
 const dom=setup(),w=dom.window,d=w.document;
 try{
  const search=d.getElementById('apProductSearch');search.value='Team';search.dispatchEvent(new w.Event('input'));
  assert.equal(d.getElementById('apProductResults').textContent,'2 of 3 products');
  d.querySelector('[data-ap-filter="pinned"]').click();
  assert.equal(d.getElementById('apProductResults').textContent,'1 of 3 products');
  assert.equal(d.querySelector('[data-product-handle="hat"]').hidden,false);
  search.value='Youth';search.dispatchEvent(new w.Event('input'));
  assert.equal(d.getElementById('apFilterEmpty').hidden,false);
  d.querySelector('[data-ap-filter="hidden"]').click();
  assert.equal(d.getElementById('apProductResults').textContent,'1 of 3 products');
  assert.equal(d.querySelector('[data-product-handle="tee"]').dataset.hidden,'true');
 }finally{w.close();}
});
test('search and preview retain the full product name on mobile',()=>{
 const dom=setup(),w=dom.window,d=w.document;
 try{
  const title=d.querySelector('.ap-product-title');title.dataset.ssFullTitle='Team Premium Embroidered Hoodie';title.textContent='Hoodie';
  const search=d.getElementById('apProductSearch');search.value='Embroidered';search.dispatchEvent(new w.Event('input'));
  assert.equal(d.getElementById('apProductResults').textContent,'1 of 3 products');
  d.querySelector('.ap-product-preview-trigger').click();assert.equal(d.getElementById('apDetailTitle').textContent,'Team Premium Embroidered Hoodie');
 }finally{w.close();}
});
test('filters and preview buttons survive a silent product refresh',async()=>{
 const dom=setup(),w=dom.window,d=w.document;
 try{
  d.querySelector('[data-ap-filter="pinned"]').click();
  d.getElementById('apProductsAllContainer').innerHTML=row('New Hoodie','new',false,true)+row('Other','other');
  await flush();
  assert.equal(d.querySelectorAll('.ap-product-preview-trigger').length,2);
  assert.equal(d.querySelector('[data-product-handle="other"]').hidden,true);
  assert.equal(d.getElementById('apProductResults').textContent,'1 of 2 products');
 }finally{w.close();}
});
test('product popup opens the existing editor, not a new mutation path',()=>{
 const dom=setup(),w=dom.window,d=w.document;
 try{
  let edits=0;
  d.querySelector('.ap-edit-placement-btn').addEventListener('click',()=>edits++);
  d.querySelector('.ap-product-preview-trigger').click();
  assert.equal(d.querySelector('dialog').open,true);
  assert.equal(d.getElementById('apDetailTitle').textContent,'Team Hoodie');
  d.querySelector('.ap-detail-edit').click();
  assert.equal(edits,1);assert.equal(d.querySelector('dialog').open,false);
 }finally{w.close();}
});
test('popup resolves refreshed rows and keeps preview claim restrictions',async()=>{
 const dom=setup(),w=dom.window,d=w.document;
 try{
  w.SSAP.isProspectDemo=true;
  d.querySelector('.ap-product-preview-trigger').click();
  assert.match(d.querySelector('.ap-detail-edit').textContent,/after claim/);
  d.getElementById('apProductsAllContainer').innerHTML=row('Team Hoodie','hoodie');
  await flush();let edits=0;d.querySelector('.ap-edit-placement-btn').addEventListener('click',()=>edits++);
  d.querySelector('.ap-detail-edit').click();assert.equal(edits,1);
 }finally{w.close();}
});
test('quick add delegates to existing tab and keyboard navigation works',()=>{
 const dom=setup(),w=dom.window,d=w.document;
 try{
  let clicked=0;d.getElementById('apTabBtnAddProducts').addEventListener('click',()=>clicked++);
  d.querySelector('[data-ap-open-tab]').click();assert.equal(clicked,1);
  d.getElementById('apTabBtnProducts').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert.equal(clicked,2);assert.equal(d.activeElement.id,'apTabBtnAddProducts');
 }finally{w.close();}
});
test('catalog popup names itself, restores focus and becomes inert after close',async()=>{
 const dom=new JSDOM('<div id="apCustomBuildersSection"><div id="apCustomBuildersContainer"></div></div>',{url:'https://example.com/pages/admin-powers',runScripts:'outside-only'});
 const w=dom.window,d=w.document;
 const observers=[],Observer=w.MutationObserver;
 w.MutationObserver=class extends Observer{constructor(callback){super(callback);observers.push(this);}};
 try{
  w.fetch=async()=>({ok:false});
  w.eval(fs.readFileSync('assets/ss-admin-pro-builder-cards.js','utf8'));
  await new Promise(resolve=>setTimeout(resolve,180));
  const card=d.querySelector('.ss-cat');assert.ok(card);card.click();
  const overlay=d.querySelector('.ss-overlay');
  assert.equal(overlay.getAttribute('aria-hidden'),'false');assert.equal(overlay.inert,false);
  assert.equal(d.querySelector('.ss-modal').getAttribute('aria-labelledby'),'ssBuilderModalTitle');
  assert.equal(d.activeElement,d.querySelector('.ss-modal__x'));
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
  assert.equal(overlay.inert,true);assert.equal(overlay.getAttribute('aria-hidden'),'true');
  assert.equal(d.activeElement,card);assert.equal(d.body.style.overflow,'');
 }finally{observers.forEach(observer=>observer.disconnect());w.close();}
});
