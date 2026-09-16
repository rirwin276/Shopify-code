/* node --test tests/anonymous-waiting-room.test.cjs (requires jsdom) */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const script = fs.readFileSync(path.join(root,'assets/ss-anonymous-demo-start.js'),'utf8');
function fixture(){
 let html = fs.readFileSync(path.join(root,'sections/ss-anonymous-demo-start.liquid'),'utf8');
 html=html.replace(/{% comment %}[\s\S]*?{% endcomment %}/g,'').replace(/{% schema %}[\s\S]*?{% endschema %}/g,'');
 html=html.replace(/{% if section.settings.how_to_video != blank %}[\s\S]*?{% endif %}/g,'');
 html=html.replace(/{{ demo_enabled }}/g,'true').replace(/{%[\s\S]*?%}/g,'').replace(/{{[\s\S]*?}}/g,'');
 return html;
}
const pause=()=>new Promise(r=>setTimeout(r,15));
async function setup(response){
 const dom=new JSDOM(fixture(),{url:'https://stellasageco.com/pages/request-storefront-form?view=start-team-store',runScripts:'outside-only'});
 const w=dom.window; w.HTMLElement.prototype.scrollIntoView=function(){};
 w.matchMedia=()=>({matches:true});w.confirm=()=>true;
 w.localStorage.setItem('ss_anonymous_demo_v1',JSON.stringify({token:'test',storeName:'Test Team',createdAt:Date.now()-65000}));
 let count=0; w.fetch=async()=>{count++; if(response instanceof Error)throw response;return {ok:true,status:200,json:async()=>response};};
 w.eval(script);await pause();return {dom,w,count:()=>count};
}
test('building has real stages and keeps all ready actions hidden',async()=>{
 const {dom,w}=await setup({phase:'building',build_stage:'products'});
 assert.match(w.document.querySelector('[data-demo-status-title]').textContent,/taking shape/);
 assert.equal(w.document.querySelector('[data-demo-ready-actions]').hidden,true);
 assert.equal(w.document.querySelector('[data-step="products"]').getAttribute('aria-current'),'step');dom.window.close();
});
test('ready offers store and tools without forced navigation or losing saved work',async()=>{
 const {dom,w}=await setup({phase:'ready',storefront_name:'Team <script>',preview_url:'/collections/test?preview=1',admin_url:'/pages/admin-powers?shop=test',claim_url:'/pages/join-store?shop=test',delete_due_at:'2026-09-19T10:00:00Z'});
 assert.equal(w.document.querySelector('[data-demo-ready-actions]').hidden,false);
 assert.match(w.document.querySelector('[data-demo-expiry]').textContent,/3:00 AM PDT/);
 assert.equal(w.location.pathname,'/pages/request-storefront-form');
 assert.equal(w.location.search,'?view=start-team-store');
 assert.match(w.document.querySelector('[data-demo-status-title]').textContent,/Team <script>/);
 assert.equal(w.document.querySelector('[data-demo-status-title] script'),null);
 assert.equal(JSON.parse(w.localStorage.getItem('ss_anonymous_demo_v1')).readyReported,true);dom.window.close();
});
test('failed build offers retry and retains recovery session',async()=>{
 const {dom,w}=await setup({phase:'failed'});
 assert.equal(w.document.querySelector('[data-demo-recovery]').hidden,false);
 assert.ok(w.localStorage.getItem('ss_anonymous_demo_v1'));dom.window.close();
});
test('expired clears stale session and keeps the recovery room visible',async()=>{
 const {dom,w}=await setup({phase:'expired'});
 assert.equal(w.localStorage.getItem('ss_anonymous_demo_v1'),null);
 assert.match(w.document.querySelector('[data-demo-status-title]').textContent,/fresh start/i);
 assert.equal(w.document.querySelector('[data-demo-form-panel]').hidden,true);dom.window.close();
});
test('claimed removes expiration and points to the dashboard',async()=>{
 const {dom,w}=await setup({phase:'claimed',preview_url:'/collections/test-team'});
 assert.equal(w.document.querySelector('[data-open-preview]').pathname,'/collections/test-team');
 assert.equal(w.document.querySelector('[data-open-admin]').hidden,true);
  assert.equal(w.document.querySelector('[data-claim-store]').hidden,true);
 assert.equal(w.localStorage.getItem('ss_anonymous_demo_v1'),null);dom.window.close();
});

test('waiting room shows elapsed time and a private resumable return link',async()=>{
 const {dom,w}=await setup({phase:'building',build_stage:'products'});
 assert.match(w.document.querySelector('[data-demo-elapsed]').textContent,/01:0[5-9]/);
 assert.equal(w.document.querySelector('[data-demo-private-link]').value,'https://stellasageco.com/pages/request-storefront-form?view=start-team-store#resume=test');
 assert.match(w.document.querySelector('.ss-demo-return small').textContent,/first person to sign in/i);
 dom.window.close();
});
test('active waiting room has no page-level back link or option screen',async()=>{
 const {dom,w}=await setup({phase:'building',build_stage:'store'});
 assert.equal(w.document.querySelector('.ss-demo-start__back'),null);
 assert.equal(w.document.querySelector('[data-demo-choice]').hidden,true);
 assert.equal(w.document.querySelector('[data-demo-wait]').hidden,false);
 dom.window.close();
});
test('network failure retains request and shows automatic reconnect',async()=>{
 const {dom,w}=await setup(new Error('offline'));
 assert.match(w.document.querySelector('[data-demo-status-copy]').textContent,/reconnect/);
 assert.ok(w.localStorage.getItem('ss_anonymous_demo_v1'));dom.window.close();
});
test('untrusted navigation destinations are not used',async()=>{
 const {dom,w}=await setup({phase:'ready',preview_url:'javascript:alert(1)',admin_url:'https://outside.example',claim_url:'//outside.example'});
 for (const selector of ['[data-open-preview]','[data-open-admin]','[data-claim-store]']) assert.equal(w.document.querySelector(selector).origin,'https://stellasageco.com');
 dom.window.close();
});

test('shared design preview opens on waiting room even with scripts disabled',()=>{
 const html=fs.readFileSync(path.join(root,'docs/anonymous-waiting-room-preview.html'),'utf8');
 const dom=new JSDOM(html);
 const d=dom.window.document;
 assert.equal(d.querySelector('[data-demo-wait]').hidden,false);
 assert.equal(d.querySelector('[data-demo-form]'),null);
 assert.equal(d.querySelector('[data-demo-choice]'),null);
 assert.match(d.querySelector('[data-demo-status-title]').textContent,/taking shape/);
 assert.ok(d.querySelector('.ss-wait-hero img').src.startsWith('data:image/webp;base64,'));
 dom.window.close();
});

test('team name and safe logo thumbnail appear in the waiting room',async()=>{
 const {dom,w}=await setup({phase:'building',build_stage:'products',storefront_name:'Eagles Football'});
 assert.equal(w.document.querySelector('[data-demo-team-name]').textContent,'Eagles Football');
 assert.equal(w.document.querySelector('[data-demo-team-initials]').textContent,'EF');
 dom.window.close();
});
