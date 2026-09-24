const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const path=require('path');const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../assets/ss-store-messages.js'),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,35));
const original={id:'a'.repeat(64),store:'team-a',store_name:'Team A',author:'Ryan',staff:true,mine:false,text:'Welcome <img src=x onerror=alert(1)>',created:'2026-09-24T01:00:00Z',order:'2026-09-24T01:00:00Z:a',has_image:false};
function setup({inbox=false,fail=false}={}){
 const dom=new JSDOM('<!doctype html><body><a href="/pages/admin-powers?shop=team-a">Admin A</a><a href="/pages/admin-powers?shop=team-b">Admin B</a><a href="/pages/super-admin">Super admin</a><button data-ss-open-inbox>Open inbox</button>'+(inbox?'':'<button id="apTabBtnMessages">Messages</button><div data-ss-message-workspace></div><div class="ap-product-row" data-product-handle="shirt-a"><span class="ap-product-title">Team Shirt</span><div class="ap-product-actions"></div></div>')+'</body>',{url:'https://stellasageco.com/pages/admin-powers?shop=team-a',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.SSAP={shopHandle:'team-a',isSuperAdmin:inbox};w.Element.prototype.getClientRects=()=>[{}];w.Element.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const calls=[];let messages=[{...original}], unread=1, failing=fail;
 w.fetch=async(url,opts)=>{calls.push({url,opts});let data;
 if(url.endsWith('/summary'))data={staff:inbox,total:unread+2,threads:[{store:'team-a',name:'Team A',unread,last:original},{store:'team-b',name:'Team B',unread:2,last:{...original,store:'team-b'}}]};
 else if(url.endsWith('/stores'))data={stores:[{handle:'team-a',name:'Team A'},{handle:'team-b',name:'Team B'}]};
 else if(url.endsWith('/read')){unread=0;data={ok:true};}
 else if(opts.method==='POST'){
  if(failing){failing=false;return {ok:false,status:503,json:async()=>({detail:'Please try again.'})};}
  const b=JSON.parse(opts.body);const m={...original,id:'b'.repeat(64),mine:true,text:b.text,author:'Alex',staff:false,order:'2026-09-24T02:00:00Z:b',product:b.product?{handle:b.product,title:'Team Shirt'}:null};messages.push(m);data={message:m};
 }else data={store:{handle:'team-a',name:'Team A'},staff:inbox,messages,has_older:false};
 return {ok:true,status:200,json:async()=>data};};w.eval(source);
 return {dom,w,calls};
}

test('badges are store-scoped and follow dynamically added dashboard links',async()=>{
 const {dom,w}=setup();await tick();assert.equal(w.document.querySelector('a').textContent,'Admin A1');assert.equal(w.document.querySelectorAll('a')[1].textContent,'Admin B2');
 const a=w.document.createElement('a');a.href='/pages/admin-powers?shop=team-b';a.textContent='Admin';w.document.body.appendChild(a);await tick();assert.equal(a.textContent,'Admin2');w.dispatchEvent(new w.Event('pagehide'));dom.window.close();
});
test('messages escape text, identify a real sender, and do not promise live replies',async()=>{
 const {dom,w,calls}=setup();w.document.getElementById('apTabBtnMessages').click();await tick();assert.equal(w.document.querySelector('.ss-msg-bubble img'),null);assert.match(w.document.querySelector('.ss-msg-bubble').textContent,/<img/);assert.match(w.document.querySelector('.ss-msg-meta').textContent,/Ryan · Stella & Sage/);assert.match(w.document.querySelector('.ss-msg-note').textContent,/as soon as we can/);assert(calls.some(c=>c.url.endsWith('/read')));w.dispatchEvent(new w.Event('pagehide'));dom.window.close();
});
test('failed send preserves draft and retry nonce, then clears only on success',async()=>{
 const {dom,w,calls}=setup({fail:true});w.document.getElementById('apTabBtnMessages').click();await tick();const input=w.document.querySelector('textarea');input.value='Can you check this?';const form=w.document.querySelector('form');form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal(input.value,'Can you check this?');assert.match(w.document.querySelector('.ss-msg-status').textContent,/try again/);
 form.dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();const posts=calls.filter(c=>c.opts.method==='POST'&&!c.url.endsWith('/read')).map(c=>JSON.parse(c.opts.body));assert.equal(posts[0].nonce,posts[1].nonce);assert.equal(input.value,'');assert.match(w.document.querySelector('.ss-msg-history').textContent,/Can you check this/);w.dispatchEvent(new w.Event('pagehide'));dom.window.close();
});
test('product action links product context without silently sending',async()=>{
 const {dom,w,calls}=setup();await tick();w.document.querySelector('[data-ss-message-product]').click();await tick();assert.match(w.document.querySelector('[data-product-context]').textContent,/Team Shirt/);assert(!calls.some(c=>c.opts.method==='POST'&&!c.url.endsWith('/read')));w.dispatchEvent(new w.Event('pagehide'));dom.window.close();
});
test('inbox switches stores and retains unsent drafts independently',async()=>{
 const {dom,w}=setup({inbox:true});w.document.querySelector('[data-ss-open-inbox]').click();await tick();let choices=w.document.querySelectorAll('.ss-msg-thread');choices[0].click();await tick();w.document.querySelector('textarea').value='Draft A';choices=w.document.querySelectorAll('.ss-msg-thread');choices[1].click();await tick();assert.equal(w.document.querySelector('textarea').value,'');w.document.querySelectorAll('.ss-msg-thread')[0].click();await tick();assert.equal(w.document.querySelector('textarea').value,'Draft A');w.dispatchEvent(new w.Event('pagehide'));dom.window.close();
});

// Evaluate the real responsive rules at phone/tablet/desktop widths. jsdom does
// not lay out pixels; this verifies breakpoint selection, pane visibility and
// touch-control rules rather than claiming screenshot coverage.
for(const width of [320,390,820,1440])test('responsive inbox rules at '+width+'px',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../assets/ss-store-messages.css'),'utf8');
 const parse=new JSDOM('<style>'+css+'</style>');
 function applies(condition){const max=condition.match(/max-width:\s*(\d+)px/),min=condition.match(/min-width:\s*(\d+)px/);if(condition.includes('prefers-reduced-motion'))return false;return (!max||width<=+max[1])&&(!min||width>=+min[1]);}
 function flatten(rules){return [...rules].map(r=>r.type===4?(applies(r.conditionText)?flatten(r.cssRules):''):r.cssText).join('\n');}
 const selected=flatten(parse.window.document.styleSheets[0].cssRules);const dom=new JSDOM('<style>'+selected+'</style><div class="ss-messages"><div class="ss-msg-shell" data-mode="inbox"><aside class="ss-msg-sidebar"></aside><section class="ss-msg-conversation"><button class="ss-msg-back">Back</button><form class="ss-msg-compose"><textarea></textarea><button class="ss-msg-send">Send</button></form></section></div></div>');const w=dom.window,shell=w.document.querySelector('.ss-msg-shell'),get=s=>w.getComputedStyle(w.document.querySelector(s));
 assert.equal(get('.ss-msg-conversation').display,width<=700?'none':'flex');
 assert.equal(get('.ss-msg-back').display,width<=700?'block':'none');shell.classList.add('has-thread');assert.equal(get('.ss-msg-conversation').display,'flex');assert.equal(get('.ss-msg-sidebar').display,width<=700?'none':'flex');assert.equal(get('textarea').fontSize,'16px');assert.equal(get('.ss-msg-send').minHeight,'44px');
 parse.window.close();dom.window.close();
});
