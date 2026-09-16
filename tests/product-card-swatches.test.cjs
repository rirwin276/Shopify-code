const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Liquid}=require('liquidjs');
const engine=new Liquid({root:'snippets',extname:'.liquid'});
function render(colors,saved){return engine.renderFile('ss-product-card-swatches',{product:{options_with_values:[{name:'Size',values:['S','M']},{name:'Color',values:colors}],metafields:{custom:{color_swatches:{value:saved}}}}});}
test('starter products show color variants without any swatch metafield',async()=>{
 const html=await render(['Black','Sport Grey','White']);
 assert.equal((html.match(/class="ss-swatch"/g)||[]).length,3);
 assert.match(html,/#202020/);assert.match(html,/#a5a5a5/);assert.match(html,/#ffffff/);
});
test('Printful swatch hex remains authoritative and single colors are visible',async()=>{
 const html=await render(['Black'],[{name:'Black',hex:'#121314'}]);
 assert.match(html,/#121314/);assert.equal((html.match(/ss-swatch-row/g)||[]).length,1);
});
test('Shopify native swatches take precedence over approximate fallback',async()=>{
 const html=await render([{name:'Black',swatch:{color:'#010203'}}]);assert.match(html,/#010203/);
});
test('unknown colors stay named, escaped and never acquire invented hex',async()=>{
 const html=await render(['Special <Blue>']);assert.match(html,/Special &lt;Blue&gt;/);assert.doesNotMatch(html,/background:/);
});
test('row caps at six with a remaining count',async()=>{
 const html=await render(['Black','White','Navy','Red','Green','Pink','Purple']);
 assert.equal((html.match(/class="ss-swatch"/g)||[]).length,6);assert.match(html,/>\+1</);
});
