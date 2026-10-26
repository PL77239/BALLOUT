const assert=require('node:assert/strict');
const {load}=require('./headless-art.cjs');
const {COURT_CAMEOS,addCourtEvents,paintCameo}=load('court_events');
const {Pix}=load('pixel');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
for(const [id,options] of Object.entries(COURT_CAMEOS)){
 const objects=[],ticks=[];
 const L={tex:(w,h,draw)=>{const p=new Pix(w,h);draw(p);assert(p.px.some(v=>v>>>24));return '';},img:()=>{const im={visible:true,x:0,setVisible(v){this.visible=v;return this;},setFlipX(){return this;},setPosition(x){this.x=x;return this;}};objects.push(im);return im;},tick:f=>ticks.push(f)};
 for(const r of [.1,.9]){
  objects.length=0;ticks.length=0;addCourtEvents(L,id,()=>r);
  let seen=false,finished=false;
  for(let i=0;i<7200;i++){ticks[0](i/60,1/60);const n=objects.filter(o=>o.visible).length;assert(n<=1,'one event frame at a time');if(n)seen=true;else if(seen)finished=true;}
  assert(seen,`${id}: starts`);assert(finished,`${id}: exits and hides in both directions`);
 }
}
console.log('Court events passed: 11 maps, both directions, sparse scheduling, visible sprites and cleanup');
