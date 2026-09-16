const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync('assets/ss-store-access-ready.js','utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

async function run(responses, requireAdmin=true) {
  const dom=new JSDOM('<button id="b"></button><p id="s"></p>',{url:'https://stellasageco.com/pages/join-store?shop=cccc',runScripts:'outside-only'});
  const w=dom.window; let destination=''; const requests=[]; const queued=[];
  w.setTimeout=(fn,ms)=>{if(ms===2000)queued.push(fn);return 1;};w.clearTimeout=()=>{};
  w.fetch=async(url,opts)=>{requests.push({url,opts});return {ok:true,text:async()=>responses.shift()||''};};
  w.__ssStoreAccessNavigate=url=>{destination=url;};w.eval(script);
  w.SSWaitForStoreAccess({storeUrl:'/collections/cccc',requireAdmin,button:w.document.getElementById('b'),status:w.document.getElementById('s')});
  await flush();
  return {w,dom,requests,queued,destination:()=>destination};
}
function marker(role,handle='cccc'){return `<span data-ss-store-access="${role}" data-ss-store-handle="${handle}"></span>`;}

test('claim waits for rendered admin access, then opens exact store',async()=>{
  const p=await run([marker(''),marker('admin')]);
  assert.equal(p.destination(),'');assert.equal(p.w.document.getElementById('b').disabled,true);
  p.queued.shift()();await flush();assert.equal(p.destination(),'/collections/cccc');
  assert.equal(p.requests[0].opts.cache,'no-store');assert.ok(!p.requests[0].url.includes('preview='));p.dom.window.close();
});
test('preview, member-only and another store never satisfy an admin claim',async()=>{
  const p=await run([marker('preview'),marker('member'),marker('admin','different')]);
  for(let i=0;i<2;i++){p.queued.shift()();await flush();}
  assert.equal(p.destination(),'');p.dom.window.close();
});
test('ordinary member can open their joined store',async()=>{
  const p=await run([marker('member')],false);assert.equal(p.destination(),'/collections/cccc');p.dom.window.close();
});
test('slow propagation stops safely with a check-only retry',async()=>{
  const p=await run([marker('')]);p.w.Date.now=()=>Date.now()+130000;
  p.queued.shift()();await flush();assert.equal(p.destination(),'');
  assert.match(p.w.document.getElementById('b').textContent,/Check my store access/);
  assert.equal(p.w.document.getElementById('b').disabled,false);p.dom.window.close();
});
test('join page uses access polling instead of fixed redirect and preserves preview codes',()=>{
  const json=fs.readFileSync('templates/page.join-store.json','utf8');
  assert.match(json,/SSWaitForStoreAccess/);assert.doesNotMatch(json,/11500/);
  const liquid=fs.readFileSync('sections/admin-powers-page.liquid','utf8');
  assert.match(liquid,/append: '\?preview=' \| append: ap_preview_token/);
  assert.match(liquid,/SSAP.previewToken =/);
  const demo=fs.readFileSync('assets/ss-prospect-admin-demo.js','utf8');assert.doesNotMatch(demo,/\?preview=1/);
});
