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
function pickColor(){var el=document.querySelector('input[name*="Color"]:checked,input[name*="color"]:checked,input[id*="Color"]:checked,input[id*="color"]:checked');return el?(el.value||el.getAttribute('data-option-value')||''):'';}
function norm(s){return String(s||'').split('?')[0].replace(/^http:/,'https:');}
function productJsonUrl(){return path.replace(/\/$/,'')+'.js';}
function unique(arr){var seen={},out=[];arr.forEach(function(src){src=String(src||'');if(!src)return;var k=norm(src);if(seen[k])return;seen[k]=1;out.push({src:src,alt:'Product image',key:k});});return out;}
function galleryFromProduct(p){var imgs=[];(p.images||[]).forEach(function(x){imgs.push(typeof x==='string'?x:x.src);});return unique(imgs);}
function colorIndex(p){var opts=p.options||[];for(var i=0;i<opts.length;i++){var name=String(opts[i].name||opts[i]||'').toLowerCase();if(name.indexOf('color')!==-1)return i+1;}return 1;}
function imageForColor(p,c){if(!p||!c)return '';var ci=colorIndex(p),field='option'+ci;c=String(c).toLowerCase();var vars=p.variants||[];for(var i=0;i<vars.length;i++){var v=vars[i];if(String(v[field]||'').toLowerCase()===c&&v.featured_image&&v.featured_image.src)return v.featured_image.src;}return '';}
function findIndexBySrc(list,src){var k=norm(src);if(!k)return -1;for(var i=0;i<list.length;i++){if(norm(list[i].src)===k)return i;}return -1;}
function setActive(g,n){if(!g||!media.length)return;idx=(n+media.length)%media.length;var hero=g.querySelector('.ss-pro-gallery__hero');if(hero){hero.src=media[idx].src;hero.alt=media[idx].alt||'Product image';}Array.prototype.slice.call(g.querySelectorAll('.ss-pro-gallery__thumb')).forEach(function(b,i){b.classList.toggle('is-active',i===idx);});}
function build(list,start){var r=root();if(!r||!list.length)return false;var old=r.querySelector('.ss-pro-gallery');if(old)old.remove();r.classList.add('ss-pro-gallery-mounted');var g=document.createElement('div');g.className='ss-pro-gallery';g.innerHTML='<div class="ss-pro-gallery__stage"><button type="button" class="ss-pro-gallery__arrow ss-pro-gallery__arrow--prev" aria-label="Previous product image">‹</button><img class="ss-pro-gallery__hero" alt=""><button type="button" class="ss-pro-gallery__arrow ss-pro-gallery__arrow--next" aria-label="Next product image">›</button></div><div class="ss-pro-gallery__thumbs" aria-label="Product images"></div>';r.insertBefore(g,r.firstChild);var thumbs=g.querySelector('.ss-pro-gallery__thumbs');list.forEach(function(item,i){var b=document.createElement('button');b.type='button';b.className='ss-pro-gallery__thumb';b.innerHTML='<img alt="" src="'+item.src.replace(/"/g,'&quot;')+'">';b.addEventListener('click',function(){setActive(g,i);});thumbs.appendChild(b);});g.querySelector('.ss-pro-gallery__arrow--prev').addEventListener('click',function(){setActive(g,idx-1);});g.querySelector('.ss-pro-gallery__arrow--next').addEventListener('click',function(){setActive(g,idx+1);});setActive(g,start||0);return true;}
function collectFallback(){var r=root();if(!r)return[];var imgs=Array.prototype.slice.call(r.querySelectorAll('img'));var srcs=[];imgs.forEach(function(img){if(img.closest&&img.closest('.ss-pro-gallery'))return;var src=img.currentSrc||img.src||img.getAttribute('src')||'';if(src&&src.indexOf('data:')!==0)srcs.push(src);});return unique(srcs);}
function initWithList(list){if(!list.length)list=collectFallback();if(!list.length)return false;media=list;var start=findIndexBySrc(media,imageForColor(productData,pickColor()));if(start<0)start=0;return build(media,start);}
function updateColor(){var wanted=imageForColor(productData,pickColor());var n=findIndexBySrc(media,wanted);if(n<0)n=idx;var g=document.querySelector('.ss-pro-gallery');if(g)setActive(g,n);setTimeout(function(){if(!document.querySelector('.ss-pro-gallery'))build(media,n);},30);setTimeout(function(){if(!document.querySelector('.ss-pro-gallery'))build(media,n);},180);}
fetch(productJsonUrl()).then(function(r){return r.ok?r.json():null;}).then(function(p){productData=p||null;initWithList(p?galleryFromProduct(p):[]);}).catch(function(){initWithList([]);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){if(document.body)document.body.classList.add('ss-stable-gallery-on');initWithList(media);},{once:true});
document.addEventListener('change',function(e){var x=e.target;if(!x)return;var label=String((x.name||'')+' '+(x.id||'')+' '+(x.value||'')).toLowerCase();if(label.indexOf('color')!==-1)updateColor();});
setInterval(function(){if(media.length&&!document.querySelector('.ss-pro-gallery'))build(media,idx);},500);
})();
