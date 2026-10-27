const assert=require('node:assert/strict');
const fs=require('node:fs');
const {load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Puppet,restRig}=load('puppet');const {buildLoadout,STARTER_EQUIP,hairUnderHeadwear}=load('loadout');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const base={...buildLoadout({...STARTER_EQUIP}),head:'none',chain:'ice'};
const frames=[];
function frame(name,l,rig){const p=new Puppet(scene,l);Object.assign(p.cur,rig);p.paint();frames.push({name,w:p.pix.w,h:p.pix.h,data:Buffer.from(p.pix.px.buffer)});return p;}
const hairMasks=new Set();
for(const hair of ['crop','cornrows','shortlocs','flattop','mohawk','bun']){
 const p=frame(hair,{...base,hair},restRig());hairMasks.add(Array.from(p.pix.px).join(','));
 for(const head of ['fullcap','backcap','beanie','bucket']){
  const a=new Puppet(scene,{...base,hair,head});a.t=0;a.paint();const b=new Puppet(scene,{...base,hair:hairUnderHeadwear(hair,head),head});b.t=0;b.paint();assert.deepEqual(a.pix.px,b.pix.px,'new hair respects hats');
 }
}
assert.equal(hairMasks.size,6);
for(const turn of [1,.5,0,-.5,-1]){
 const p=frame(`turn ${turn}`,{...base,hair:'cornrows'},{...restRig(),turn,spin:.3});
 // The skull retains its volume during the camera-facing phase.
 let n=0;for(let y=0;y<p.pix.h;y++)for(let x=0;x<p.pix.w;x++)if(p.pix.alpha(x,y))n++;assert(n>300);
 for(const face of ['none','grillz']){const a=new Puppet(scene,{...base,face});a.t=0;a.cur.turn=turn;a.cur.mouth=0;a.paint();const b=new Puppet(scene,{...base,face});b.t=0;b.cur.turn=turn;b.cur.mouth=1;b.paint();assert.deepEqual(a.pix.px,b.pix.px,'mouth animation has no visible pixels');}
}
fs.mkdirSync('/tmp/ballout-turn',{recursive:true});frames.forEach((f,i)=>fs.writeFileSync(`/tmp/ballout-turn/${i}.rgba`,f.data));fs.writeFileSync('/tmp/ballout-turn/manifest.json',JSON.stringify(frames.map(({data,...f})=>f)));
console.log('Character checks passed: 6 distinct hairstyles, hat coverage, 5 turn phases, no mouth pixels');
