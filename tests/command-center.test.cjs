/* Run with `node --test tests/command-center.test.cjs` after installing jsdom. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '..');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

function fixture() {
  let html = fs.readFileSync(path.join(root,'templates/page.super-admin.liquid'),'utf8');
  html = html.replace(/{% unless is_super %}[\s\S]*?{% endunless %}/g,'');
  html = html.replace(/<script src="{{ 'ss-command-center.js' \| asset_url }}" defer><\/script>/,
    '<script>' + fs.readFileSync(path.join(root,'assets/ss-command-center.js'),'utf8') + '</script>');
  return html.replace(/{%[\s\S]*?%}/g,'').replace(/{{[\s\S]*?}}/g,'0');
}

const store = (handle, time) => ({handle,name:handle,collection_handle:handle,status:'active',created_at:time,last_engagement_at:time,
  observability:{sessions:true,products:true,sales:true,customers:true},decision:{age_days:1,traction:'engaged'},
  sales:{order_count:1,gross_sales:'20.00'},customers:{total:1},products:{total:1},
  activity:{tracking_started_at:time,last_authenticated_customer_activity:{at:time}}});

test('initial load requests only directory; detail/session/performance/outreach are on demand',async()=>{
  const requests=[], errors=[];
  const a=store('older-team','2026-09-09T00:00:00Z'), b=store('recent-team','2026-09-10T00:00:00Z');
  const vc=new VirtualConsole(); vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(fixture(),{url:'https://fixture.example/pages/super-admin',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
    w.fetch=async url=>{
      requests.push(url);
      let data={ok:true};
      if(url.includes('/index')) data={ok:true,stores:[a,b],metrics_ready:true,generated_at:'2026-09-11T00:00:00Z'};
      else if(url.includes('/store/')) { await pause(url.endsWith('older-team')?80:10); data={ok:true,store:url.endsWith('older-team')?a:b}; }
      else if(url.includes('/sessions/')) data={ok:true,session:{pages:[{path:'/pages/private-storefronts',events:['create_started']}],active_seconds:20}};
      else if(url.includes('/sessions')) data={ok:true,sessions:[{id:'a'.repeat(64),page_count:2,events:[],status:'ended',entry_page:'/',exit_page:'/pages/private-storefronts'}],funnel:{},exit_pages:[],sample_size:1};
      else if(url.includes('/report')) data={ok:true,totals:{stores:2},data_quality:{}};
      else if(url.includes('/outreach')) data={ok:true,pending:[]};
      return {ok:true,json:async()=>data};
    };
  }});
  try {
    await pause(30);
    const d=dom.window.document;
    assert.deepEqual(errors,[]);
    assert.equal(requests.length,1);
    assert.match(requests[0],/\/index$/);
    assert.equal(d.querySelectorAll('.gm-store-card').length,2);
    assert.equal(d.querySelector('#activeStoreGrid .gm-store-card').dataset.handle,'recent-team');
    d.querySelector('[data-handle="older-team"] [data-open-manage]').click();
    d.querySelector('[data-handle="recent-team"] [data-open-manage]').click();
    await pause(100);
    assert.equal(d.getElementById('manageTitle').textContent,'recent-team');
    assert.equal(d.getElementById('manageSheet').getAttribute('aria-hidden'),'false');
    assert.equal(d.getElementById('manageLastCustomer').textContent,'Customer · ' + dom.window.formatDate(b.activity.last_authenticated_customer_activity.at));
    d.getElementById('closeManage').click();
    assert.equal(d.getElementById('manageSheet').getAttribute('aria-hidden'),'true');
    assert(!requests.some(u=>u.includes('/sessions')));
    d.querySelector('[data-cc-view="sessions"]').click();
    await pause(20);
    assert.equal(requests.filter(u=>u.includes('/sessions')).length,1);
    assert(!requests.some(u=>/\/sessions\//.test(u)));
    d.querySelector('[data-session-id]').click();
    await pause(20);
    assert(requests.some(u=>/\/sessions\//.test(u)));
    assert.match(d.getElementById('ccSessionDetail').textContent,/private-storefronts/);
    d.getElementById('ccCloseSession').click();
    d.querySelector('[data-cc-view="performance"]').click();
    await pause(20);
    assert.equal(requests.filter(u=>u.endsWith('/report')).length,1);
    d.querySelector('[data-cc-view="outreach"]').click();
    await pause(20);
    assert.equal(requests.filter(u=>u.endsWith('/outreach/queue')).length,1);
    assert.deepEqual(errors,[]);
  } finally { dom.window.close(); }
});

test('directory failure leaves navigation and retry available',async()=>{
  const errors=[]; const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(fixture(),{url:'https://fixture.example',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.fetch=async()=>{throw Error('offline')};}});
  try {
    await pause(20);
    assert.match(dom.window.document.getElementById('ccStatus').textContent,/retry/);
    assert.equal(dom.window.document.getElementById('ccRefresh').disabled,false);
    assert.deepEqual(errors,[]);
  } finally {dom.window.close();}
});
