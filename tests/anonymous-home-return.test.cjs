const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const script = fs.readFileSync('assets/ss-anonymous-home-return.js','utf8');

function markup() {
  return `<!doctype html><div data-ss-preview-return data-api-base="https://preview.example" hidden>
    <a data-preview-return-link href="#"><span data-preview-return-title></span><small data-preview-return-detail></small><span data-preview-return-action></span></a>
  </div>`;
}

async function load(state, saved={token:'mine',handle:'my-store',storeName:'My Store'}) {
  const dom = new JSDOM(markup(), {url:'https://stellasageco.com/',runScripts:'outside-only'});
  const w = dom.window;
  w.localStorage.setItem('ss_anonymous_demo_v1',JSON.stringify(saved));
  w.fetch=async(url,options)=>({ok:true,status:200,json:async()=>state});
  w.eval(script);
  await new Promise(resolve=>setTimeout(resolve,10));
  return {dom,w,root:w.document.querySelector('[data-ss-preview-return]')};
}

test('this browser sees only its active build and returns to the waiting room',async()=>{
  const {dom,w,root}=await load({phase:'building',storefront_handle:'my-store',storefront_name:'My Store'});
  assert.equal(root.hidden,false);
  assert.match(root.querySelector('[data-preview-return-title]').textContent,/My Store is building/);
  assert.equal(root.querySelector('[data-preview-return-link]').pathname,'/pages/request-storefront-form');
  assert.equal(root.querySelector('[data-preview-return-link]').search,'?view=start-team-store');
  dom.window.close();
});

test('ready build changes to the preview-store action',async()=>{
  const {dom,root}=await load({phase:'ready',storefront_handle:'my-store',storefront_name:'My Store',preview_url:'/collections/my-store?preview=1'});
  assert.equal(root.dataset.phase,'ready');
  assert.equal(root.querySelector('[data-preview-return-action]').textContent,'Check out your preview store →');
  assert.equal(root.querySelector('[data-preview-return-link]').pathname,'/collections/my-store');
  dom.window.close();
});

test('a token response for another store is never shown',async()=>{
  const {dom,root}=await load({phase:'ready',storefront_handle:'someone-else',preview_url:'/collections/someone-else?preview=1'});
  assert.equal(root.hidden,true);
  dom.window.close();
});
