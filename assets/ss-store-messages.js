/* Store-scoped messages. All access, authorship and product ownership are verified server-side. */
(function () {
  'use strict';
  if (window.SSStoreMessages) return;
  const base = '/apps/ss/relay/messages';
  let summary = null, refreshPending = null, enabled = true, dialog, returnFocus;
  const views = new Set();
  function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  async function api(path, body) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(base + path, {method: body === undefined ? 'GET' : 'POST', credentials:'same-origin', cache:'no-store',
        headers:body === undefined ? {} : {'Content-Type':'application/json'}, body:body === undefined ? undefined : JSON.stringify(body), signal:controller.signal});
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { const error = new Error(typeof data.detail === 'string' ? data.detail : 'Messages are temporarily unavailable. Please try again.'); error.status = res.status; throw error; }
      return data;
    } catch (err) { if (err.name === 'AbortError') throw new Error('The connection timed out. Your draft is still here; please try again.'); throw err; }
    finally { clearTimeout(timer); }
  }
  function badge(parent, count) {
    let el = parent.querySelector(':scope > .ss-msg-badge');
    if (!el && count) { el=node('span','ss-msg-badge'); parent.appendChild(el); }
    if (el) { const text=count>99?'99+':String(count); if(el.textContent!==text) el.textContent=text; el.hidden=!count; el.setAttribute('aria-label',count+' unread messages'); }
  }
  function badges() {
    if (!summary) return;
    const counts = new Map(summary.threads.map(t=>[t.store,t.unread]));
    document.querySelectorAll('a[href*="/pages/admin-powers"],a[href*="/pages/super-admin"],[data-ss-open-inbox],#apTabBtnMessages').forEach(el=>{
      let count=summary.total;
      if(el.id==='apTabBtnMessages') count=counts.get((window.SSAP||{}).shopHandle)||0;
      else if(el.matches('a[href*="/pages/admin-powers"]')) { try {count=counts.get(new URL(el.href,location.origin).searchParams.get('shop'))||0;} catch(_){count=0;} }
      badge(el,count);
    });
  }
  async function refresh() {
    if(!enabled) return;
    if(refreshPending) return refreshPending;
    refreshPending=api('/summary').then(data=>{summary=data; badges(); views.forEach(v=>v.list()); return data;}).catch(err=>{if(err.status===401||err.status===403) enabled=false;}).finally(()=>{refreshPending=null;});
    return refreshPending;
  }
  function date(value) { return new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }
  class Inbox {
    constructor(root, mode, handle) {
      this.root=root; this.mode=mode; this.handle=''; this.messages=[]; this.drafts=new Map(); this.image=''; this.product=null; this.busy=false; this.epoch=0;
      root.classList.add('ss-messages');
      root.innerHTML='<div class="ss-msg-shell" data-mode="'+mode+'">'+
        '<aside class="ss-msg-sidebar"><div class="ss-msg-sidebar-top"><h3>Store conversations</h3><input type="search" aria-label="Search conversations" placeholder="Find a conversation…"><label>Start a conversation<select aria-label="Choose a store"><option value="">Choose a store…</option></select></label></div><div class="ss-msg-thread-list"></div></aside>'+
        '<section class="ss-msg-conversation" aria-label="Store conversation"><header class="ss-msg-header"><button class="ss-msg-back" type="button" aria-label="Back to conversations">‹</button><span class="ss-msg-avatar" aria-hidden="true">S&S</span><div><h3>Stella & Sage</h3><p>Private messages · shared with your store admins</p></div></header>'+
        '<div class="ss-msg-history" tabindex="0" aria-label="Message history"></div><form class="ss-msg-compose"><div class="ss-msg-context" data-product-context hidden><span></span><button type="button" aria-label="Remove product link">×</button></div><div class="ss-msg-context" data-image-context hidden><span>Screenshot attached</span><button type="button" aria-label="Remove screenshot">×</button></div>'+
        '<label>Message<textarea maxlength="4000" placeholder="How can we help?" aria-label="Message"></textarea></label><input type="file" accept="image/png,image/jpeg,image/webp" hidden><div class="ss-msg-compose-footer"><button type="button" class="ss-msg-secondary" data-attach>＋ Screenshot</button><button type="submit" class="ss-msg-send">Send message</button></div><p class="ss-msg-note">Your message goes to our small team. A real person will reply here as soon as we can.</p><p class="ss-msg-status" role="status" aria-live="polite"></p></form></section></div>';
      this.shell=root.querySelector('.ss-msg-shell'); this.history=root.querySelector('.ss-msg-history'); this.text=root.querySelector('textarea'); this.form=root.querySelector('form'); this.status=root.querySelector('.ss-msg-status'); this.file=root.querySelector('input[type=file]');
      root.querySelector('.ss-msg-sidebar').hidden=mode==='store';
      this.form.hidden=true;
      this.history.appendChild(node('p','ss-msg-empty','Choose a store conversation to get started.'));
      root.querySelector('input[type=search]').addEventListener('input',()=>this.list());
      root.querySelector('select').addEventListener('change',e=>{if(e.target.value)this.open(e.target.value);});
      root.querySelector('.ss-msg-back').addEventListener('click',()=>{this.shell.classList.remove('has-thread');root.querySelector('input[type=search]').focus();});
      root.querySelector('[data-attach]').addEventListener('click',()=>this.file.click());
      this.file.addEventListener('change',()=>this.attach());
      root.querySelector('[data-image-context] button').addEventListener('click',()=>{this.image='';this.file.value='';this.nonce=null;this.context();});
      root.querySelector('[data-product-context] button').addEventListener('click',()=>{this.product=null;this.nonce=null;this.context();});
      this.text.addEventListener('input',()=>{this.nonce=null;});
      this.form.addEventListener('submit',e=>{e.preventDefault();this.send();});
      this.text.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();this.send();}});
      views.add(this); this.list();
      if(mode==='inbox') api('/stores').then(data=>{data.stores.forEach(s=>{const opt=node('option','',s.name);opt.value=s.handle;root.querySelector('select').appendChild(opt);});}).catch(err=>{root.querySelector('label').appendChild(node('p','ss-msg-status',err.message));});
      if(handle)this.open(handle);
    }
    visible() { return this.root.isConnected && this.root.getClientRects().length>0 && (!this.root.closest('dialog') || this.root.closest('dialog').open) && !document.hidden; }
    list() {
      if(this.mode!=='inbox'||!summary)return;
      const list=this.root.querySelector('.ss-msg-thread-list'), term=this.root.querySelector('input[type=search]').value.toLowerCase(); list.replaceChildren();
      const threads=summary.threads.filter(t=>(t.name+' '+t.store).toLowerCase().includes(term));
      if(!threads.length) list.appendChild(node('p','ss-msg-empty',term?'No matching conversations.':'No conversations yet. Choose a store above to say hello.'));
      threads.forEach(t=>{const b=node('button','ss-msg-thread');b.type='button';b.setAttribute('aria-current',String(t.store===this.handle));b.appendChild(node('strong','',t.name));badge(b,t.unread);b.appendChild(node('small','',t.last.text||'Screenshot'));b.appendChild(node('time','',date(t.last.created)));b.addEventListener('click',()=>this.open(t.store));list.appendChild(b);});
    }
    draft() { if(this.handle)this.drafts.set(this.handle,{text:this.text.value,image:this.image,product:this.product,nonce:this.nonce}); }
    context() { const p=this.root.querySelector('[data-product-context]');p.hidden=!this.product;p.querySelector('span').textContent=this.product?'About: '+this.product.title:'';this.root.querySelector('[data-image-context]').hidden=!this.image; }
    async open(handle, product) {
      if(this.busy)return;
      this.draft();this.handle=handle;const seq=++this.epoch;this.messages=[];this.seen='';this.hasOlder=false;
      const draft=this.drafts.get(handle)||{};this.text.value=draft.text||'';this.image=draft.image||'';this.product=product||draft.product||null;this.nonce=draft.nonce||null;this.context();this.status.textContent='';
      this.shell.classList.add('has-thread');this.form.hidden=true;this.history.replaceChildren(node('p','ss-msg-empty','Loading your conversation…'));this.list();
      try { const data=await api('/store/'+encodeURIComponent(handle)); if(seq!==this.epoch)return;this.messages=data.messages;this.hasOlder=data.has_older;this.staff=data.staff;
        this.root.querySelector('.ss-msg-header h3').textContent=data.staff?data.store.name:'Stella & Sage';
        this.root.querySelector('.ss-msg-header p').textContent=data.staff?'Private conversation with this store’s admins':data.store.name+' · Shared with your store admins';
        this.root.querySelector('.ss-msg-note').textContent=data.staff?'All admins of this store can see this conversation.':'Your message goes to our small team. A real person will reply here as soon as we can.';
        this.text.placeholder=data.staff?'Write to this store’s admins…':'Ask a question about your store…';this.form.hidden=false;this.render(true);this.read();
      } catch(err){if(seq!==this.epoch)return;this.history.replaceChildren(node('p','ss-msg-empty',err.message));const retry=node('button','ss-msg-older','Try again');retry.type='button';retry.onclick=()=>this.open(handle);this.history.appendChild(retry);}
    }
    render(bottom) {
      const scroll=this.history.scrollTop, height=this.history.scrollHeight;this.history.replaceChildren();
      if(this.hasOlder){const b=node('button','ss-msg-older','Load earlier messages');b.type='button';b.onclick=()=>this.older(b);this.history.appendChild(b);}
      if(!this.messages.length){const p=node('div','ss-msg-empty');p.appendChild(node('strong','',this.staff?'Start a conversation':'A little help from our small team.'));p.appendChild(node('p','',this.staff?'Send a note about this store or link a product that needs attention.':'Ask about your artwork, products, or store. A real person from Stella & Sage will reply here as soon as we can.'));this.history.appendChild(p);}
      this.messages.forEach(m=>{const item=node('article','ss-msg-item'+(m.mine?' is-mine':''));const meta=node('div','ss-msg-meta');meta.appendChild(node('span','',m.author+(m.staff?' · Stella & Sage':'')));meta.appendChild(node('time','',date(m.created)));item.appendChild(meta);const bubble=node('div','ss-msg-bubble');
        if(m.product){const link=node('a','ss-msg-product','↗ '+m.product.title);link.href='/products/'+encodeURIComponent(m.product.handle)+'?shop='+encodeURIComponent(this.handle);link.target='_blank';link.rel='noopener';bubble.appendChild(link);}
        bubble.appendChild(node('div','',m.text));
        if(m.has_image){const url=base+'/store/'+encodeURIComponent(this.handle)+'/image/'+encodeURIComponent(m.id);const a=node('a','ss-msg-image-link');a.href=url;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label','Open attached screenshot');const img=node('img','ss-msg-image');img.src=url;img.alt='Attached screenshot';img.loading='lazy';a.appendChild(img);a.appendChild(node('span','','Open screenshot ↗'));bubble.appendChild(a);}
        item.appendChild(bubble);this.history.appendChild(item);});
      if(bottom)this.history.scrollTop=this.history.scrollHeight;else this.history.scrollTop=scroll+(this.history.scrollHeight-height);
    }
    async older(button) { if(!this.messages.length)return;button.disabled=true;const handle=this.handle,seq=this.epoch;try{const data=await api('/store/'+encodeURIComponent(handle)+'?before='+encodeURIComponent(this.messages[0].order));if(seq!==this.epoch)return;const ids=new Set(this.messages.map(m=>m.id));this.messages=data.messages.filter(m=>!ids.has(m.id)).concat(this.messages);this.hasOlder=data.has_older;this.render(false);}catch(err){button.disabled=false;this.status.textContent=err.message;} }
    async read() { if(!this.visible()||!this.messages.length)return;const incoming=this.messages.filter(m=>!m.mine);const last=incoming[incoming.length-1];if(!last||this.seen===last.id)return;const handle=this.handle;try{await api('/store/'+encodeURIComponent(handle)+'/read',{through:last.id});if(handle===this.handle)this.seen=last.id;await refresh();}catch(_){/* Keep unread state when acknowledgement fails. */} }
    async poll() { if(!this.visible()||!this.handle||this.form.hidden||this.busy)return;const seq=this.epoch,handle=this.handle;try{const data=await api('/store/'+encodeURIComponent(handle));if(seq!==this.epoch)return;const ids=new Set(this.messages.map(m=>m.id)), added=data.messages.filter(m=>!ids.has(m.id));if(added.length){const near=this.history.scrollHeight-this.history.scrollTop-this.history.clientHeight<120;this.messages.push(...added);this.messages.sort((a,b)=>a.order.localeCompare(b.order));this.render(near);}this.read();}catch(_){/* A transient poll failure must not erase a draft. */} }
    async attach() {
      const file=this.file.files[0];if(!file)return;this.status.textContent='';this.nonce=null;const seq=this.epoch;
      try{if(file.size>12000000||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPG, or WebP screenshot under 12 MB.');
        const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();let data=canvas.toDataURL('image/jpeg',.8);if(data.length>850000)data=canvas.toDataURL('image/jpeg',.55);if(data.length>850000)throw new Error('Please crop this screenshot or choose a smaller image.');if(seq!==this.epoch)return;this.image=data;this.context();
      }catch(err){this.status.textContent=err.message;this.file.value='';}
    }
    async send() {
      if(this.busy||!this.handle)return;if(!this.text.value.trim()&&!this.image){this.status.textContent='Write a message or attach a screenshot.';this.text.focus();return;}
      this.busy=true;const handle=this.handle;const button=this.root.querySelector('.ss-msg-send');button.disabled=true;button.textContent='Sending…';this.text.disabled=true;this.root.querySelector('[data-attach]').disabled=true;this.status.textContent='';
      this.nonce=this.nonce||crypto.randomUUID();const payload={text:this.text.value.trim(),image:this.image,product:this.product?this.product.handle:'',nonce:this.nonce};
      try{const data=await api('/store/'+encodeURIComponent(handle),payload);if(!this.messages.some(m=>m.id===data.message.id))this.messages.push(data.message);this.text.value='';this.image='';this.product=null;this.file.value='';this.nonce=null;this.drafts.delete(handle);this.context();this.render(true);this.status.textContent=this.staff?'Message sent to this store’s admins.':'Message sent. We’ll reply here as soon as we can.';await this.read();await refresh();}
      catch(err){this.status.textContent=err.message;this.draft();}
      finally{this.busy=false;button.disabled=false;button.textContent='Send message';this.text.disabled=false;this.root.querySelector('[data-attach]').disabled=false;this.text.focus();}
    }
  }
  function openInbox(handle) {
    returnFocus=document.activeElement;
    if(!dialog){dialog=node('dialog','ss-msg-inbox-dialog');dialog.setAttribute('aria-label','Stella & Sage messages');const head=node('header','ss-msg-dialog-head');head.appendChild(node('h2','','Messages'));const close=node('button','','×');close.type='button';close.setAttribute('aria-label','Close messages');close.onclick=()=>dialog.close();head.appendChild(close);dialog.appendChild(head);const root=node('div');dialog.appendChild(root);document.body.appendChild(dialog);dialog.inbox=new Inbox(root,'inbox');dialog.addEventListener('close',()=>{if(returnFocus&&returnFocus.isConnected)returnFocus.focus();});}
    dialog.showModal();if(handle)dialog.inbox.open(handle);refresh();
  }
  let storeView=null;
  const root=document.querySelector('[data-ss-message-workspace]');
  if(root) {
    const tab=document.getElementById('apTabBtnMessages');
    const open=()=>{if(!storeView)storeView=new Inbox(root,'store',(window.SSAP||{}).shopHandle);else storeView.poll();};
    if(tab)tab.addEventListener('click',open);
    if(location.hash==='#messages'&&tab)tab.click();
  }
  document.addEventListener('click',e=>{
    const inbox=e.target.closest('[data-ss-open-inbox]');if(inbox){e.preventDefault();openInbox();return;}
    const about=e.target.closest('[data-ss-message-product]');if(about&&root){const row=about.closest('.ap-product-row');const title=row.querySelector('.ap-product-title');const tab=document.getElementById('apTabBtnMessages');if(tab)tab.click();if(storeView){storeView.open((window.SSAP||{}).shopHandle,{handle:row.dataset.productHandle,title:title?title.textContent.trim():'Store product'});root.scrollIntoView({block:'start',behavior:'smooth'});}}
  });
  function productActions(){if(!root)return;document.querySelectorAll('.ap-product-row[data-product-handle]').forEach(row=>{if(row.querySelector('[data-ss-message-product]')||!row.dataset.productHandle)return;const button=node('button','ss-msg-product-action',(window.SSAP||{}).isSuperAdmin?'Message store admins':'Ask about this product');button.type='button';button.dataset.ssMessageProduct='';const area=row.querySelector('.ap-product-actions')||row;area.appendChild(button);});}
  let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;badges();productActions();});});observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){refresh();views.forEach(v=>v.poll());}});
  window.addEventListener('pagehide',()=>observer.disconnect());
  window.addEventListener('pageshow',()=>{observer.observe(document.body,{childList:true,subtree:true});refresh();});
  setInterval(()=>{if(!document.hidden){refresh();views.forEach(v=>v.poll());}},45000);
  window.SSStoreMessages={refresh,openInbox};productActions();refresh();
})();
