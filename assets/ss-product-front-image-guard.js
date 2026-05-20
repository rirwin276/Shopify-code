/* Stella & Sage — Stable Product Gallery */
(function(){
  'use strict';
  var path=window.location.pathname||'';
  var main=document.querySelector('main[data-template]');
  var templateName=main?String(main.getAttribute('data-template')||''):'';
  if(path.indexOf('/products/')===-1&&templateName.indexOf('product')===-1)return;

  var store=[];
  var current=0;

  function root(){
    return document.querySelector('media-gallery')||document.querySelector('.product-media-gallery')||document.querySelector('.product__media-wrapper');
  }

  function imgSrc(img){
    var set=img.getAttribute('srcset')||'';
    if(set){
      var pieces=set.split(',');
      if(pieces.length){
        var last=pieces[pieces.length-1].trim().split(' ')[0];
        if(last)return last;
      }
    }
    return img.currentSrc||img.getAttribute('src')||'';
  }

  function cleanKey(src){
    return String(src||'').split('?')[0];
  }

  function collect(r){
    var imgs=Array.prototype.slice.call(r.querySelectorAll('img'));
    var seen={};
    var out=[];
    imgs.forEach(function(img){
      if(!img)return;
      if(img.closest&&img.closest('.ss-pro-gallery'))return;
      var src=imgSrc(img);
      if(!src||src.indexOf('data:')===0)return;
      var key=cleanKey(src);
      if(!key||seen[key])return;
      seen[key]=true;
      out.push({src:src,alt:img.getAttribute('alt')||'',key:key});
    });
    return out;
  }

  function colorText(){
    var c=document.querySelector('input[name*="Color"]:checked,input[name*="color"]:checked,input[id*="Color"]:checked,input[id*="color"]:checked');
    return c?(c.value||c.getAttribute('data-option-value')||''):'';
  }

  function matchIndex(list,color){
    if(!list.length)return 0;
    var c=String(color||'').toLowerCase();
    if(!c)return Math.min(current,list.length-1);
    for(var i=0;i<list.length;i++){
      var txt=String(list[i].alt+' '+list[i].src).toLowerCase();
      if(txt.indexOf(c)!==-1)return i;
    }
    return Math.min(current,list.length-1);
  }

  function draw(r,list){
    if(!r||!list.length)return false;
    var old=r.querySelector('.ss-pro-gallery');
    if(old)old.remove();
    r.classList.add('ss-pro-gallery-mounted');

    var g=document.createElement('div');
    g.className='ss-pro-gallery';
    g.innerHTML='<div class="ss-pro-gallery__stage"><button type="button" class="ss-pro-gallery__arrow ss-pro-gallery__arrow--prev" aria-label="Previous product image">‹</button><img class="ss-pro-gallery__hero" alt=""><button type="button" class="ss-pro-gallery__arrow ss-pro-gallery__arrow--next" aria-label="Next product image">›</button></div><div class="ss-pro-gallery__thumbs" aria-label="Product images"></div>';
    r.insertBefore(g,r.firstChild);

    var hero=g.querySelector('.ss-pro-gallery__hero');
    var thumbs=g.querySelector('.ss-pro-gallery__thumbs');

    function show(n){
      current=(n+list.length)%list.length;
      hero.src=list[current].src;
      hero.alt=list[current].alt||'Product image';
      Array.prototype.slice.call(thumbs.querySelectorAll('button')).forEach(function(b,i){
        b.classList.toggle('is-active',i===current);
      });
    }

    list.forEach(function(item,i){
      var b=document.createElement('button');
      b.type='button';
      b.className='ss-pro-gallery__thumb';
      b.innerHTML='<img alt="" src="'+item.src.replace(/"/g,'&quot;')+'">';
      b.addEventListener('click',function(){show(i);});
      thumbs.appendChild(b);
    });

    g.querySelector('.ss-pro-gallery__arrow--prev').addEventListener('click',function(){show(current-1);});
    g.querySelector('.ss-pro-gallery__arrow--next').addEventListener('click',function(){show(current+1);});
    show(matchIndex(list,colorText()));
    return true;
  }

  function mount(recollect){
    var r=root();
    if(!r)return false;
    if(recollect||!store.length){
      var fresh=collect(r);
      if(fresh.length>=store.length)store=fresh;
    }
    if(!store.length)return false;
    if(!r.querySelector('.ss-pro-gallery'))draw(r,store);
    return true;
  }

  function repair(){
    setTimeout(function(){mount(false);},50);
    setTimeout(function(){mount(false);},250);
    setTimeout(function(){mount(false);},700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){mount(true);},{once:true});else mount(true);

  var tries=0;
  var boot=setInterval(function(){tries++; if(mount(true)||tries>12)clearInterval(boot);},250);

  document.addEventListener('change',function(e){
    var t=e.target;if(!t)return;
    var label=String((t.name||'')+' '+(t.id||'')+' '+(t.value||'')).toLowerCase();
    if(label.indexOf('color')!==-1){current=matchIndex(store,colorText());repair();}
  });

  setInterval(function(){mount(false);},900);
})();
