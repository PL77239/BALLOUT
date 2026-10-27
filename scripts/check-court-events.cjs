const assert=require('node:assert/strict');
const {load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {COURT_CAMEOS,addCourtEvents}=load('court_events'),{Pix}=load('pixel'),{Puppet}=load('puppet');
const realUpdate=Puppet.prototype.update;
let renders=0;
// Render the first frame of each person; scheduling can then run without
// rasterising thousands of identical frames in this headless test.
Puppet.prototype.update=function(...args){if(!this.checked){realUpdate.apply(this,args);assert(this.pix.px.some(v=>v>>>24));this.checked=true;renders++;}};
for(const [id,options] of Object.entries(COURT_CAMEOS)){
 for(const r of [.1,.9]){
  const objects=[],people=[],ticks=[],disposers=[];
  const make=()=>({visible:true,setVisible(v){this.visible=v;return this;},setFlipX(){return this;},setPosition(){return this;},setOrigin(){return this;},setScale(){return this;},setDepth(){return this;},destroy(){this.visible=false;}});
  const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>{const im=make();people.push(im);return im;}}};
  const L={scene,onDestroy:f=>disposers.push(f),tex:(w,h,draw)=>{const p=new Pix(w,h);draw(p);assert(p.px.some(v=>v>>>24));return '';},img:()=>{const im=make();objects.push(im);return im;},tick:f=>ticks.push(f)};
  addCourtEvents(L,id,()=>r);let seen=false,finished=false;
  for(let i=0;i<300;i++){ticks[0](i*.5,.5);const n=objects.filter(o=>o.visible).length;assert(n<=1);assert.equal(people.filter(o=>o.visible).length,n,'person and props travel together');if(n)seen=true;else if(seen)finished=true;}
  assert(seen,`${id}: starts`);assert(finished,`${id}: exits in both directions`);disposers.forEach(f=>f());assert(people.every(o=>!o.visible),'people disposed with court');
 }
}
Puppet.prototype.update=realUpdate;
assert(renders>=38,'actual character renderer exercised on all maps');
console.log(`Court events passed: ${Object.keys(COURT_CAMEOS).length} maps, shared character renderer, both directions, scheduling and disposal`);
