const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../assets/ss-session-tracker.js'),'utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));

async function run(options={}) {
  const sent=[];
  const dom=new JSDOM('<div data-storefront-request-form><form id="sf-request-form"><input id="field"></form></div><span hidden data-storefront-activity-tracker="team-one"></span><script>'+code+'</script>',{
    url:'https://fixture.example/pages/private-storefronts?email=private@example.com',runScripts:'dangerously',pretendToBeVisual:true,
    beforeParse(w){
      w.SS_SESSION_OWNER=!!options.owner;
      if(options.storage) Object.entries(options.storage).forEach(([k,v])=>w.localStorage.setItem(k,v));
      w.requestIdleCallback=cb=>w.setTimeout(cb,0);
      if(options.noConsent) w.Shopify={customerPrivacy:{analyticsProcessingAllowed:()=>false}};
      w.fetch=async(url,init)=>{sent.push(JSON.parse(init.body));return {ok:true};};
    }
  });
  await pause(20);
  return {dom,sent,storage:Object.fromEntries(Object.keys(dom.window.localStorage).map(k=>[k,dom.window.localStorage.getItem(k)]))};
}

test('tracks creation page without query strings or typed field contents',async()=>{
  const {dom,sent}=await run();
  try {
    assert.equal(sent.length,1);
    assert.equal(sent[0].pages[0].path,'/pages/private-storefronts');
    assert(sent[0].pages[0].events.includes('create_opened'));
    assert.equal(sent[0].pages[0].store_handle,'team-one');
    const input=dom.window.document.getElementById('field');input.value='private text';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
    dom.window.dispatchEvent(new dom.window.Event('pagehide'));
    await pause(10);
    assert(sent.at(-1).pages[0].events.includes('create_started'));
    assert(!JSON.stringify(sent).includes('private text'));
    assert(!JSON.stringify(sent).includes('private@example.com'));
  } finally {dom.window.close();}
});

test('owner exclusion persists after sign-out on the same browser',async()=>{
  const first=await run({owner:true});
  try {assert.equal(first.sent[0].exclude,true);assert.deepEqual(first.sent[0].pages,[]);}finally{first.dom.window.close();}
  const second=await run({storage:first.storage});
  try {assert.equal(second.sent[0].exclude,true);assert.equal(second.sent[0].session_id,first.sent[0].session_id);}finally{second.dom.window.close();}
});

test('does not send when analytics consent is denied',async()=>{
  const {dom,sent}=await run({noConsent:true});
  try{assert.deepEqual(sent,[]);}finally{dom.window.close();}
});
