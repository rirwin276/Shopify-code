const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const script = fs.readFileSync('assets/ss-anonymous-request-form.js','utf8');

function page() {
  return `<!doctype html><div class="sf-header"></div><div data-storefront-request-form>
  <div id="sf-error-inline" class="sf-hidden"></div><form id="sf-request-form" data-signed-in="false" data-anonymous-api="https://preview.example">
  <select id="OrgType"><option value="Sports Team" selected>Sports Team</option></select><input id="SF_TYPE_OF_STORE"><input id="StoreName" value="Raptors"><span id="HandlePreview"></span><input id="HiddenHandle">
  <label><input type="radio" name="primary_color" value="Navy" checked></label>
  <div id="MainLogoDrop"><span id="MainLogoText"></span></div><input id="MainLogo" type="file"><div id="MainLogoPreviewRow" class="sf-hidden"><img id="MainLogoPreview"><span id="MainLogoBadge"></span><span id="MainLogoQualitySub"></span><div id="MainLogoActions" class="sf-hidden"></div></div>
  <button id="sf-submit-btn"></button></form><div id="sf-provision" class="sf-hidden"><div id="sf-progress-bar"></div></div></div>`;
}

test('the live-looking guest form starts a private build and saves its browser session', async () => {
  const dom = new JSDOM(page(), {url:'https://stellasageco.com/pages/request-storefront-form',runScripts:'outside-only'});
  const w = dom.window; let request;
  w.HTMLElement.prototype.scrollIntoView=()=>{}; w.URL.createObjectURL=()=> 'blob:test'; w.URL.revokeObjectURL=()=>{};
  w.Image = class { set src(_) { this.width=100; this.height=100; setImmediate(()=>this.onload()); } };
  w.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}}); w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,dGVzdA==';
  w.fetch=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({resume_token:'private-token',storefront_handle:'raptors-demo-a1b2c3'})};};
  let destination=''; w.__ssAnonymousNavigate=(url)=>{destination=url};
  w.eval(script);
  const file=new w.File(['logo'],'raptors.png',{type:'image/png'}); Object.defineProperty(w.document.getElementById('MainLogo'),'files',{value:[file]});
  w.document.getElementById('MainLogo').dispatchEvent(new w.Event('change')); await new Promise(r=>setImmediate(r));
  await w.submitAnonymousPreview(new w.Event('submit'));
  const saved=JSON.parse(w.localStorage.getItem('ss_anonymous_demo_v1'));
  assert.equal(request.url,'https://preview.example/api/demo/storefront-request');
  assert.equal(destination,'/pages/request-storefront-form?view=start-team-store');
  assert.equal(saved.startUrl,'/pages/request-storefront-form?view=start-team-store');
  assert.equal(saved.handle,'raptors-demo-a1b2c3'); assert.equal(saved.token,'private-token');
  assert.equal(request.options.body.get('type_of_store'),'Sports Team'); assert.equal(request.options.body.get('primary_color'),'Navy');
  dom.window.close();
});

test('the customer form remains the single shared form in Liquid', () => {
  const liquid=fs.readFileSync('sections/request-storefront-form.liquid','utf8');
  assert.equal((liquid.match(/id="sf-request-form"/g)||[]).length,1);
  assert.match(liquid,/submitToStudioUploader\(event\)/);
  assert.match(liquid,/submitAnonymousPreview\(event\)/);
  assert.match(liquid,/Sign in or create account/);
});

test('an existing guest build resumes in the public waiting room', () => {
  const dom = new JSDOM(page(), {url:'https://stellasageco.com/pages/request-storefront-form',runScripts:'outside-only'});
  const w = dom.window; let destination='';
  w.localStorage.setItem('ss_anonymous_demo_v1', JSON.stringify({token:'saved-private-token',startUrl:'/pages/storefront?view=start-team-store'}));
  w.__ssAnonymousNavigate=(url)=>{destination=url};
  w.eval(script);
  assert.equal(destination,'/pages/request-storefront-form?view=start-team-store');
  dom.window.close();
});
