const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const source = fs.readFileSync('assets/ss-admin-powers-core.js', 'utf8');
const modal = source.slice(source.indexOf('  var apEditorOverlay ='), source.indexOf('  // postMessage listener'));

function setup() {
  const dom = new JSDOM('<div id="apEditorOverlay"><div class="ap-editor-dialog"><button id="apEditorClose">×</button><iframe id="apEditorIframe"></iframe></div></div>', {url:'https://stellasageco.com/pages/admin-powers',runScripts:'outside-only'});
  const w=dom.window, timers=new Map();let seq=0;
  w.setTimeout=(fn)=>{timers.set(++seq,fn);return seq;};w.clearTimeout=id=>timers.delete(id);
  w.eval(modal);
  const frame=w.document.getElementById('apEditorIframe'),overlay=w.document.getElementById('apEditorOverlay');
  const id=()=>new URL(frame.src).searchParams.get('pb_open_id');
  function message(over={}) {w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,origin:'https://editor.example',data:{type:'pb:editor-state',state:'ready',openId:id()},...over}));}
  return {w,frame,overlay,id,message,timers,close:()=>dom.window.close()};
}

test('cover starts immediately, survives iframe load, and ends only on verified readiness',()=>{
  const s=setup();try {
    s.w.apOpenEditorModal('https://editor.example/editor/pro-shirt/m2580?secret=test');
    assert(s.overlay.classList.contains('ap-editor-loading'));assert(s.frame.hasAttribute('inert'));
    s.frame.dispatchEvent(new s.w.Event('load'));
    assert(s.overlay.classList.contains('ap-editor-loading'));
    s.message({origin:'https://untrusted.example'});s.message({source:s.w});
    s.message({data:{type:'pb:editor-state',state:'ready',openId:'stale'}});
    assert(s.overlay.classList.contains('ap-editor-loading'));
    s.message();assert(!s.overlay.classList.contains('ap-editor-loading'));assert(!s.frame.hasAttribute('inert'));
    assert.equal(s.timers.size,0);
  } finally {s.close();}
});

test('close and reopen ignore the previous product; a slow request offers retry',()=>{
  const s=setup();try {
    const url='https://editor.example/editor/pro-shirt/ec8000/edit?secret=test';
    s.w.apOpenEditorModal(url);const old=s.id();s.w.apCloseEditorModal();
    assert.equal(s.timers.size,0);s.w.apOpenEditorModal(url);assert.notEqual(s.id(),old);
    s.message({data:{type:'pb:editor-state',state:'ready',openId:old}});
    assert(s.overlay.classList.contains('ap-editor-loading'));
    for(const fn of s.timers.values()) fn();
    assert.equal(s.w.document.querySelector('.ap-editor-loading-copy button').hidden,false);
    s.message({data:{type:'pb:editor-state',state:'problem',openId:s.id()}});
    assert(!s.overlay.classList.contains('ap-editor-loading'));
  } finally {s.close();}
});

test('logo uploader retains its load-based reveal without a pro-editor handshake',()=>{
  const s=setup();try {
    s.w.apOpenEditorModal('https://editor.example/ui?slot=settings-logo');
    assert.equal(s.id(),null);s.frame.dispatchEvent(new s.w.Event('load'));
    assert(!s.overlay.classList.contains('ap-editor-loading'));
  } finally {s.close();}
});
