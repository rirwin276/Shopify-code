/* Stella & Sage — Stable Product Gallery */
(function(){
'use strict';
var path=location.pathname||'';
var main=document.querySelector('main[data-template]');
var t=main?String(main.getAttribute('data-template')||''):'';
if(path.indexOf('/products/')===-1&&t.indexOf('product')===-1)return;
if(document.body)document.body.classList.add('ss-stable-gallery-on');
var media=[],idx=0,productData=null;
function root(){return document.querySelector('media-gallery')||document.querySelector('.product-media-gallery')||document.querySelector('.product__media-wrapper');}
function norm(s){return String(s||'').split('?')[0].replace(/^http:/,'https:');}
function productJsonUrl(){return path.replace(/\/$/,'')+'.js';}
function srcFromImage(x){if(!x)return'';if(typeof x==='string')return x;if(x.src)return x.src;return'';}
function addUnique(out,seen,src,alt){src=String(src||'');if(!src)return;var k=norm(src);if(!k||seen[k])return;seen[k]=1;out.push({src:src,alt:alt||'Product image',key:k});}
function galleryFromProduct(p){var seen={},out=[];(p.images||[]).forEach(function(x){addUnique(out,seen,srcFromImage(x),'Product image');});(p.variants||[]).forEach(function(v){if(v.featured_image&&v.featured_image.src)addUnique(out,seen,v.featured_image.src,v.title||'Product image');});return out;}
function checkedOptions(){var out={};Array.prototype.slice.call(document.querySelectorAll('input[type="radio"]:checked,select')).forEach(function(el){var name=String(el.name||el.id||'').toLowerCase();var val=el.value||el.getAttribute('data-option-value')||'';if(!val)return;if(name.indexOf('color')!==-1)out.color=val;if(name.indexOf('size')!==-1)out.size=val;});return out;}
function selectedVariant(){if(!productData)return null;var idEl=document.querySelector('form[action*="/cart/add"] [name="id"],input[name="id"]');var id=idEl?String(idEl.value||''):'';var vars=productData.variants||[];if(id){for(var a=0;a<vars.length;a++){if(String(vars[a].id)===id)return vars[a];}}
var opts=checkedOptions();for(var i=0;i<vars.length;i++){var v=vars[i];var ok=true;if(opts.color){ok=ok&&(String(v.option1||'')===opts.color||String(v.option2||'')===opts.color||String(v.option3||'')===opts.color);}if(opts.size){ok=ok&&(String(v.option1||'')===opts.size||String(v.option2||'')===opts.size||String(v.option3||'')===opts.size);}if(ok)return v;}return null;}
function variantImage(v){return v&&v.featured_image&&v.featured_image.src?v.featured_image.src:'';}
function findIndexBySrc(list,src){var k=norm(src);if(!k)return-1;for(var i=0;i<list.length;i++){if(norm(list[i].src)===k)return i;}return-1;}
function setActive(g,n){if(!g||!media.length)return;idx=(n+media.length)%media.length;var hero=g.querySelector('.ss-pro-gallery__hero');if(hero){hero.src=media[idx].src;hero.alt=media[idx].alt||'Product image';}Array.prototype.slice.call(g.querySelectorAll('.ss-pro-gallery__thumb')).forEach(function(b,i){b.classList.toggle('is-active',i===idx);});}
function build(list,start){var r=root();if(!r||!list.length)return false;var old=r.querySelector('.ss-pro-gallery');if(old)old.remove();r.classList.add('ss-pro-gallery-mounted');var g=document.createElement('div');g.className='ss-pro-gallery';g.innerHTML='<div class="ss-pro-gallery__stage"><button type="button" class="ss-pro-gallery__arrow ss-pro-gallery__arrow--prev" aria-label="Previous product image">‹</button><img class="ss-pro-gallery__hero" alt=""><button type="button" class="ss-pro-gallery__arrow ss-pro-gallery__arrow--next" aria-label="Next product image">›</button></div><div class="ss-pro-gallery__thumbs" aria-label="Product images"></div>';r.insertBefore(g,r.firstChild);var thumbs=g.querySelector('.ss-pro-gallery__thumbs');list.forEach(function(item,i){var b=document.createElement('button');b.type='button';b.className='ss-pro-gallery__thumb';b.innerHTML='<img alt="" src="'+item.src.replace(/"/g,'&quot;')+'">';b.addEventListener('click',function(){setActive(g,i);});thumbs.appendChild(b);});g.querySelector('.ss-pro-gallery__arrow--prev').addEventListener('click',function(){setActive(g,idx-1);});g.querySelector('.ss-pro-gallery__arrow--next').addEventListener('click',function(){setActive(g,idx+1);});setActive(g,start||0);return true;}
function collectFallback(){var r=root();if(!r)return[];var seen={},out=[];Array.prototype.slice.call(r.querySelectorAll('img')).forEach(function(img){if(img.closest&&img.closest('.ss-pro-gallery'))return;addUnique(out,seen,img.currentSrc||img.src||img.getAttribute('src')||'',img.alt||'Product image');});return out;}
function targetIndex(){var n=findIndexBySrc(media,variantImage(selectedVariant()));return n>=0?n:idx;}
function initWithList(list){if(!list.length)list=collectFallback();if(!list.length)return false;media=list;return build(media,targetIndex());}
function updateGallery(){var n=targetIndex();var g=document.querySelector('.ss-pro-gallery');if(g)setActive(g,n);else build(media,n);setTimeout(function(){var gg=document.querySelector('.ss-pro-gallery');if(gg)setActive(gg,n);else build(media,n);},40);setTimeout(function(){var gg=document.querySelector('.ss-pro-gallery');if(gg)setActive(gg,n);else build(media,n);},180);}
fetch(productJsonUrl()).then(function(r){return r.ok?r.json():null;}).then(function(p){productData=p||null;initWithList(p?galleryFromProduct(p):[]);}).catch(function(){initWithList([]);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){if(document.body)document.body.classList.add('ss-stable-gallery-on');initWithList(media);},{once:true});
document.addEventListener('change',function(){setTimeout(updateGallery,0);setTimeout(updateGallery,80);setTimeout(updateGallery,220);});
document.addEventListener('variant:change',updateGallery);document.addEventListener('product:variant-change',updateGallery);
setInterval(function(){if(media.length&&!document.querySelector('.ss-pro-gallery'))build(media,idx);},500);
})();
