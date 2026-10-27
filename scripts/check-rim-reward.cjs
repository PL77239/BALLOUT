const assert=require('node:assert/strict'),{load}=require('./headless-art.cjs');
const {FX}=load('fx');
for(const [style,kind,count] of [['money',3,30],['splash',4,24]]){
 const fx=Object.create(FX.prototype);fx.parts=[];
 const calls=[];const g={clear(){},fillStyle(){},fillRect(...x){calls.push(x);}};fx.gn=g;fx.ga=g;
 fx.rimReward(1100,220,style);assert.equal(fx.parts.filter(p=>p.kind===kind).length,count);
 assert(fx.parts.every(p=>p.y===220 && Math.abs(p.x-1100)<13),'particles originate at rim');
 fx.update(.1);assert(calls.length>count,'reward renders pixel details');
 for(let i=0;i<150;i++)fx.update(1/60);assert.equal(fx.parts.length,0,'all reward particles expire');
}
console.log('Rim reward passed: money/water render at rim and expire');

const signatures=[];
for(let style=0;style<6;style++){const fx=Object.create(FX.prototype);fx.parts=[];const g={clear(){},fillStyle(){},fillRect(){}};fx.gn=g;fx.ga=g;fx.dunkReward(1100,220,style);signatures.push(JSON.stringify(fx.parts.map(p=>[p.kind,p.color,p.grow])));assert(fx.parts.length>10);for(let i=0;i<150;i++)fx.update(1/60);assert.equal(fx.parts.length,0);}assert.equal(new Set(signatures).size,6,'six distinct rim impacts');
