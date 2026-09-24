const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const markup=fs.readFileSync('snippets/admin-printing-guide.liquid','utf8').replace(/\{\{[^]*?\}\}/g,'').replace(/<script[^]*?<\/script>/g,'');
const source=fs.readFileSync('assets/ss-printing-guide.js','utf8');
const flush=()=>new Promise(r=>setImmediate(r));
function setup(context={},response={ok:true}){
 const dom=new JSDOM(markup,{url:'https://example.com',runScripts:'outside-only'}),w=dom.window;
 w.SSAP={customerId:'42',shopHandle:'team',...context};w.requests=[];
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 w.fetch=async(url,options)=>{w.requests.push({url,...options});return {ok:response.ok,json:async()=>response}};
 w.eval(source);return {w,d:w.document,dom};
}
function tick(d){const c=d.getElementById('apPrintGuideAck');c.checked=true;c.dispatchEvent(new d.defaultView.Event('change'));}
test('first admin must acknowledge; escape is prevented; saves once and reopens optionally',async()=>{
 const {w,d}=setup();try{const dialog=d.querySelector('dialog'),button=d.getElementById('apPrintGuideContinue');assert.ok(dialog.open);assert.ok(button.disabled);const escape=new w.Event('cancel',{cancelable:true});dialog.dispatchEvent(escape);assert.ok(escape.defaultPrevented);button.click();assert.equal(w.requests.length,0);tick(d);button.click();await flush();assert.equal(w.requests.length,1);assert.deepEqual(JSON.parse(w.requests[0].body),{version:'v1',acknowledged:true});assert.equal(dialog.open,false);d.getElementById('apPrintGuideOpen').click();assert.ok(dialog.open);assert.equal(d.getElementById('apPrintGuideAckLabel').hidden,true);assert.equal(d.getElementById('apPrintGuideClose').hidden,false);button.click();assert.equal(dialog.open,false);assert.equal(w.requests.length,1);}finally{w.close();}
});
test('account acknowledgement survives reload without any local storage dependency',()=>{const {w,d}=setup({printGuideRead:true});try{assert.equal(d.querySelector('dialog').open,false);d.getElementById('apPrintGuideOpen').click();assert.equal(d.getElementById('apPrintGuideContinue').textContent,'Done');}finally{w.close();}});
test('save failure stays open and offers retry without falsely acknowledging',async()=>{const {w,d}=setup({}, {ok:false});try{tick(d);d.getElementById('apPrintGuideContinue').click();await flush();assert.equal(d.querySelector('dialog').open,true);assert.match(d.getElementById('apPrintGuideStatus').textContent,/try again/);assert.notEqual(w.SSAP.printGuideRead,true);assert.equal(d.getElementById('apPrintGuideContinue').disabled,false);}finally{w.close();}});
test('anonymous preview does not call an authenticated endpoint',async()=>{const {w,d}=setup({customerId:null,isProspectDemo:true});try{tick(d);d.getElementById('apPrintGuideContinue').click();await flush();assert.equal(w.requests.length,0);assert.equal(w.localStorage.getItem('ss-print-guide:v1:preview:team'),'read');assert.equal(d.querySelector('dialog').open,false);}finally{w.close();}});
test('missing store context does not trap the generic admin page',()=>{const {w,d}=setup({shopHandle:''});try{assert.equal(d.querySelector('dialog').open,false);d.getElementById('apPrintGuideOpen').click();assert.equal(d.getElementById('apPrintGuideClose').hidden,false);}finally{w.close();}});
