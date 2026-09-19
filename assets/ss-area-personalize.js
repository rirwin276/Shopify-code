/* Buyer-owned names per print area; the store's saved logo, style and placement are fixed. */
(function(){
  'use strict';
  var api='https://printfulautomation-production.up.railway.app',sharedPromise;
  var enteredNames=new Map();
  function shared(){
    if(window.SSNameCanvas)return Promise.resolve(window.SSNameCanvas);
    if(!sharedPromise)sharedPromise=new Promise(function(resolve,reject){
      var script=document.createElement('script');script.src=api+'/pro-builder-assets/common/name_canvas.js';
      script.onload=function(){window.SSNameCanvas?resolve(window.SSNameCanvas):reject(new Error('Preview unavailable'));};
      script.onerror=function(){reject(new Error('Preview unavailable'));};document.head.appendChild(script);
    });
    return sharedPromise;
  }
  function image(url){return new Promise(function(resolve,reject){
    if(!url){resolve(null);return;}var img=new Image();img.crossOrigin='anonymous';img.onload=function(){resolve(img);};img.onerror=function(){reject(new Error('Preview image unavailable'));};img.src=url;
  });}
  function init(root){
    if(root.dataset.ssAreaReady)return;root.dataset.ssAreaReady='1';
    var input=root.querySelector('[data-ss-area-name]'),canvas=root.querySelector('canvas'),status=root.querySelector('[data-ss-name-status]'),form=root.closest('form');
    if(!input||!canvas||!form)return;
    var cfg;try{cfg=JSON.parse(root.dataset.config);}catch(e){input.setCustomValidity('This name design could not load. Please reload the page.');return;}
    var entryKey=root.dataset.productId+':'+cfg.area;
    if(!input.value&&enteredNames.has(entryKey))input.value=enteredNames.get(entryKey);
    var color=root.dataset.initialColor,background=null,base=null,family='',maps={},ready=false,revision=0,drawHelper;
    function valid(){
      var text=input.value.trim();
      var optionalBlank=cfg.required===false&&!text;
      input.setCustomValidity(optionalBlank?'':!ready?'Please wait for the name preview to load.':
        (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(text)?'Enter the name you want printed on this area.':''));
    }
    function draw(){
      var ctx=canvas.getContext('2d'),size=canvas.width;ctx.clearRect(0,0,size,size);
      if(!background||!drawHelper||!family)return;
      // A print-area detail view makes a short name readable on mobile. The
      // full garment remains in the product gallery, with exactly this design.
      var b=cfg.bbox_pct,crop=Math.min(1,Math.max(b.width,b.height)/100+.16);
      var x=Math.max(0,Math.min(1-crop,(b.left+b.width/2)/100-crop/2));
      var y=Math.max(0,Math.min(1-crop,(b.top+b.height/2)/100-crop/2));
      ctx.drawImage(background,x*background.width,y*background.height,crop*background.width,crop*background.height,0,0,size,size);
      var area={left:(b.left/100-x)/crop*size,top:(b.top/100-y)/crop*size,width:b.width/100/crop*size,height:b.height/100/crop*size};
      if(base)ctx.drawImage(base,area.left,area.top,area.width,area.height);
      var p=cfg.placement,text=input.value.trim();
      status.textContent=cfg.label+' detail preview · '+(text?'your artwork and name':cfg.required?'enter your name below':'artwork only — no name');
      if(text)drawHelper.draw(ctx,text,{left:area.left+p.left*area.width,top:area.top+p.top*area.height,width:p.width*area.width,height:p.height*area.height},family,cfg.color_hex,cfg.outline_color_hex);
    }
    function fail(){ready=false;valid();status.textContent='The name preview could not load. Reload this page to review your name before ordering.';}
    function loadColor(){
      var request=++revision;ready=false;valid();status.textContent='Loading name preview…';
      var url=maps[color];
      if(!url){fail();return Promise.resolve();}
      return image(url).then(function(img){if(request!==revision)return;background=img;ready=!!family;valid();draw();}).catch(fail);
    }
    input.addEventListener('input',function(){input.value=input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ '.-]/g,'').slice(0,cfg.max_name_len||20);enteredNames.set(entryKey,input.value);valid();draw();});
    function ensureValid(e){
      if(e.type==='click'&&(!e.target.closest||!e.target.closest('[type="submit"]')))return;
      valid();if(!input.checkValidity()){e.preventDefault();e.stopImmediatePropagation();var details=root.closest('details');if(details)details.open=true;input.reportValidity();}
    }
    form.addEventListener('click',ensureValid,true);form.addEventListener('submit',ensureValid,true);
    // Accelerated checkouts can bypass custom properties/validation. Keep the
    // normal Add to cart path for a listing that requires a name.
    function holdAccelerated(){var el=form.querySelector('.accelerated-checkout-block');if(el)el.classList.add('ss-name-accel-held');}
    holdAccelerated();new MutationObserver(holdAccelerated).observe(form,{childList:true,subtree:true});
    document.addEventListener('variant:update',function(e){
      var resource=e.detail&&e.detail.resource;
      if(!resource)return;
      if(resource.product_id&&String(resource.product_id)!==root.dataset.productId)return;
      if(e.target!==document&&!e.target.contains(root)&&!form.contains(e.target))return;
      var next=resource.option1||(resource.options&&resource.options[0]);
      if(next&&next!==color){color=next;if(family)loadColor();}
    });
    valid();
    Promise.all([
      shared().then(function(helper){drawHelper=helper;return helper.loadFont(cfg.font,api+cfg.font_url);}),
      image(cfg.base_print_url),
      fetch(api+'/editor/pro-shirt/'+encodeURIComponent(cfg.model)+'/mockups-public').then(function(r){if(!r.ok)throw new Error('Mockups unavailable');return r.json();})
    ]).then(function(results){family=results[0];base=results[1];maps=results[2][cfg.area]||{};return loadColor();}).catch(fail);
  }
  function boot(){document.querySelectorAll('[data-ss-area-pers]').forEach(init);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(function(records){records.forEach(function(record){record.addedNodes.forEach(function(node){if(node.nodeType!==1)return;if(node.matches('[data-ss-area-pers]'))init(node);node.querySelectorAll('[data-ss-area-pers]').forEach(init);});});}).observe(document.documentElement,{childList:true,subtree:true});
})();
