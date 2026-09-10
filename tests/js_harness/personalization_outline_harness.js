'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '../../assets/ss-tote-personalize.js'), 'utf8');
function extract(name) {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  let depth=0, pos=source.indexOf('{',start);
  for(let i=pos;i<source.length;i++) {
    if(source[i]==='{')depth++;
    if(source[i]==='}' && --depth===0) return source.slice(start,i+1);
  }
  throw Error(name);
}
const calls=[];
const ctx={font:'',measureText(text){const size=parseFloat(this.font.split(' ')[1]);return {width:text.length*size*.6,actualBoundingBoxLeft:size*.1,actualBoundingBoxRight:text.length*size*.6+size*.1,actualBoundingBoxAscent:size*.75,actualBoundingBoxDescent:size*.1};},strokeText(...args){calls.push({kind:'stroke',args,width:this.lineWidth,color:this.strokeStyle});},fillText(...args){calls.push({kind:'fill',args});}};
const scope={ctx,fontWeight:400,fontFamily:'Test',outlineHex:'#1e2a4a',outlineRatio:.035};
vm.createContext(scope);
vm.runInContext(['setFont','outlineRadius','fitSize','paintOutlined'].map(extract).join('\n'),scope);
const size=scope.fitSize('MONTGOMERY',100,35,4);
scope.setFont(size);
const metrics=ctx.measureText('MONTGOMERY'),r=scope.outlineRadius(size);
assert(metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight+2*r<=100);
assert(metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent+2*r<=35);
scope.paintOutlined('00',size,10,100,20);
assert.deepEqual(calls.map(c=>c.kind),['stroke','fill']);
assert.equal(calls[0].args[0],'00');assert.equal(calls[0].width,2*r);assert.equal(calls[0].color,'#1e2a4a');
scope.outlineHex='';assert.equal(scope.outlineRadius(100),0);
console.log('PASS: actual preview fitting includes stroke and overhang; outline precedes fill; 00 preserved; legacy has no stroke');
