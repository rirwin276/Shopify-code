(function(){
  function makeRow(kind){
    var d=document.createElement('div');
    d.className='ap-price-row';
    if(kind==='cc1717'){
      d.setAttribute('data-ss-cc1717','1');
      d.innerHTML='<div class="ap-price-label">Comfort Colors CC1717 Heavyweight T-Shirt</div><div class="ap-inputs-group"><div class="ap-input-col"><span class="ap-col-label">Front or Back</span><div class="ap-input-wrap"><span class="ap-dollar">$</span><input class="ap-price-input" type="number" min="1" max="999" step="0.01" data-module="CC1717_front" value=""></div></div><div class="ap-input-col"><span class="ap-col-label">Two Images</span><div class="ap-input-wrap"><span class="ap-dollar">$</span><input class="ap-price-input" type="number" min="1" max="999" step="0.01" data-module="CC1717_front_back" value=""></div></div></div>';
      return d;
    }
    d.setAttribute('data-ss-ls14003','1');
    d.innerHTML='<div class="ap-price-label">Lane Seven LS14003 Full Zip Hoodie</div><div class="ap-inputs-group"><div class="ap-input-col"><span class="ap-col-label">Front or Back</span><div class="ap-input-wrap"><span class="ap-dollar">$</span><input class="ap-price-input" type="number" min="1" max="999" step="0.01" data-module="LS14003_front" value=""></div></div><div class="ap-input-col"><span class="ap-col-label">Two Images</span><div class="ap-input-wrap"><span class="ap-dollar">$</span><input class="ap-price-input" type="number" min="1" max="999" step="0.01" data-module="LS14003_front_back" value=""></div></div></div>';
    return d;
  }
  function add(){
    if(location.pathname.indexOf('/pages/price-editor')===-1)return false;
    var t=document.getElementById('peTable');
    if(!t)return false;
    if(!document.querySelector('[data-ss-ls14003="1"]')){
      var m=t.querySelector('input[data-module="M2580_front_back"]');
      var r=m&&m.closest?m.closest('.ap-price-row'):null;
      if(r&&r.parentNode)r.parentNode.insertBefore(makeRow('ls14003'),r.nextSibling);else t.insertBefore(makeRow('ls14003'),t.firstChild);
    }
    if(!document.querySelector('[data-ss-cc1717="1"]')){
      var lm=t.querySelector('input[data-module="LS14003_front_back"]')||t.querySelector('input[data-module="M2580_front_back"]');
      var lr=lm&&lm.closest?lm.closest('.ap-price-row'):null;
      if(lr&&lr.parentNode)lr.parentNode.insertBefore(makeRow('cc1717'),lr.nextSibling);else t.insertBefore(makeRow('cc1717'),t.firstChild);
    }
    return !!document.querySelector('[data-ss-ls14003="1"]')&&!!document.querySelector('[data-ss-cc1717="1"]');
  }
  add();
  var n=0,i=setInterval(function(){n++;if(add()||n>200)clearInterval(i)},20);
  new MutationObserver(add).observe(document.documentElement,{childList:true,subtree:true});
})();
