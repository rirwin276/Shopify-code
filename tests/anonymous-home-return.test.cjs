const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const script = fs.readFileSync('assets/ss-anonymous-home-return.js','utf8');
const snippet = fs.readFileSync('snippets/ss-anonymous-home-return.liquid','utf8');
const previewApi = 'https://anonymous-demo-preview-production.up.railway.app';
const liveApi = 'https://studio-uploader-production.up.railway.app';
const session = {token:'mine',handle:'my-store',storeName:'My Store'};
const ready = {phase:'ready',storefront_handle:'my-store',storefront_name:'My Store'};

async function load(state, saved=session, status=200, signedIn=false) {
  const markup = snippet.replace(/\{% if customer %\}true\{% else %\}false\{% endif %\}/, String(signedIn));
  const dom = new JSDOM('<!doctype html>'+markup, {url:'https://stellasageco.com/',runScripts:'outside-only'});
  const w = dom.window, calls=[];
  if (saved !== null) w.localStorage.setItem('ss_anonymous_demo_v1',JSON.stringify(saved));
  w.fetch=async(url,options)=>{calls.push({url,options});return {ok:status===200,status,json:async()=>state};};
  w.eval(script);
  await new Promise(resolve=>setTimeout(resolve,10));
  return {dom,w,calls,root:w.document.querySelector('[data-ss-preview-return]')};
}

test('a fresh browser has no card, logo, store link, or status request',async()=>{
  const {dom,root,calls}=await load(ready,null);
  assert.equal(root.hidden,true);
  assert.equal(calls.length,0);
  assert.equal(root.querySelector('img').hasAttribute('src'),false);
  assert.equal(root.querySelector('[data-preview-return-claim]').hidden,true);
  dom.window.close();
});

test('this browser sees only its active build and returns to the waiting room',async()=>{
  const {dom,root}=await load({...ready,phase:'building'});
  assert.equal(root.hidden,false);
  assert.match(root.querySelector('[data-preview-return-title]').textContent,/My Store is building/);
  assert.equal(root.querySelector('[data-preview-return-link]').pathname,'/pages/request-storefront-form');
  assert.equal(root.querySelector('[data-preview-return-link]').search,'?view=start-team-store');
  assert.equal(root.querySelector('[data-preview-return-claim]').hidden,true);
  dom.window.close();
});

test('ready card offers separate same-store preview and sign-in-to-claim links',async()=>{
  const {dom,root}=await load({...ready,preview_url:'https://other.example/bad',claim_url:'javascript:alert(1)'});
  assert.equal(root.dataset.phase,'ready');
  assert.equal(root.querySelector('[data-preview-return-action]').textContent,'Try your store →');
  assert.equal(root.querySelector('[data-preview-return-link]').href,'https://stellasageco.com/collections/my-store?preview=1');
  const claim=root.querySelector('[data-preview-return-claim]');
  assert.equal(claim.hidden,false);
  assert.equal(claim.textContent,'Sign in & claim');
  assert.equal(claim.href,'https://stellasageco.com/pages/join-store?shop=my-store');
  assert.match(root.querySelector('[data-preview-return-detail]').textContent,/claim it today/);
  for(const a of root.querySelectorAll('a')) assert.ok(!a.href.includes('mine'));
  dom.window.close();
});

test('signed-in visitors use the same claim route with accurate button copy',async()=>{
  const {dom,root}=await load(ready,session,200,true);
  assert.equal(root.querySelector('[data-preview-return-claim]').textContent,'Claim your store');
  dom.window.close();
});

test('status uses the backend saved with the build and keeps the token in its header',async()=>{
  const {dom,calls}=await load(ready,{...session,apiBase:liveApi+'/'});
  assert.equal(calls[0].url,liveApi+'/api/demo/status');
  assert.equal(calls[0].options.headers.Authorization,'Bearer mine');
  dom.window.close();
});

test('untrusted saved backends cannot receive the private token',async()=>{
  const {dom,calls}=await load(ready,{...session,apiBase:'https://other.example'});
  assert.equal(calls[0].url,previewApi+'/api/demo/status');
  dom.window.close();
});

test('saved raster logo appears and a broken image uses the small store icon',async()=>{
  const thumb='data:image/png;base64,iVBORw0KGgo=';
  const {dom,root}=await load(ready,{...session,logoThumb:thumb});
  const img=root.querySelector('img'),fallback=root.querySelector('svg');
  assert.equal(img.getAttribute('src'),thumb);
  img.dispatchEvent(new dom.window.Event('load'));
  assert.equal(img.hidden,false);
  assert.equal(fallback.hidden,true);
  img.dispatchEvent(new dom.window.Event('error'));
  assert.equal(img.hidden,true);
  assert.equal(fallback.hidden,false);
  dom.window.close();
});

test('missing thumbnail uses the returned logo on the saved backend',async()=>{
  const {dom,root}=await load({...ready,logo_url:'/preview/my-session?version=original'},{...session,apiBase:liveApi});
  assert.equal(root.querySelector('img').src,liveApi+'/preview/my-session?version=original');
  dom.window.close();
});

test('untrusted logos and missing or mismatched handles are never displayed',async()=>{
  for(const handle of ['someone-else','', '../bad']) {
    const {dom,root}=await load({...ready,storefront_handle:handle,logo_url:'https://other.example/logo.png'});
    assert.equal(root.hidden,true);
    assert.equal(root.querySelector('img').hasAttribute('src'),false);
    dom.window.close();
  }
  const {dom,root}=await load({...ready,logo_url:'https://other.example/logo.png'});
  assert.equal(root.querySelector('img').hasAttribute('src'),false);
  dom.window.close();
});

test('claimed, expired, and invalid sessions clear the card and saved session',async()=>{
  for(const [phase,status] of [['claimed',200],['expired',200],['ready',401],['ready',404],['ready',410]]) {
    const {dom,w,root}=await load({...ready,phase},session,status);
    assert.equal(root.hidden,true);
    assert.equal(w.localStorage.getItem('ss_anonymous_demo_v1'),null);
    dom.window.close();
  }
});

test('a session already recorded as claimed stays hidden without polling',async()=>{
  const {dom,root,calls}=await load(ready,{...session,claimedAt:123});
  assert.equal(root.hidden,true);
  assert.equal(calls.length,0);
  dom.window.close();
});

test('failed builds get a recovery action and are not advertised as ready',async()=>{
  const {dom,root}=await load({...ready,phase:'failed'});
  assert.equal(root.dataset.phase,'failed');
  assert.equal(root.querySelector('[data-preview-return-action]').textContent,'Check your build →');
  assert.equal(root.querySelector('[data-preview-return-claim]').hidden,true);
  dom.window.close();
});
