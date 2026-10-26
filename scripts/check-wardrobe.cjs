const assert = require('node:assert/strict');
const fs = require('node:fs');
const {load,noop} = require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Puppet,restRig}=load('puppet');
const {Hooper}=load('hooper');
const {poseOf}=load('anim');
const {buildLoadout,STARTER_EQUIP,ITEMS}=load('loadout');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const base=buildLoadout({...STARTER_EQUIP},'YOU');
const tops=['tank','jersey','tee','bigTee','hoodie','flannel','longsleeve','puffer'];
const masks=new Set();let rendered=0;
const frames=[];
let edgeTouches=0;
for(const top of tops){
 const l={...base,top,topColor:0x375870,topTrim:0xf1d89a};
 const puppet=new Puppet(scene,l);puppet.paint();
 masks.add(Array.from(puppet.pix.px,v=>v>>>24?1:0).join(''));
 frames.push({name:top,loadout:l});
 for(const facing of [-1,1])for(const act of ['free','shoot','dunk','juke','fall','block'])for(const t of [.1,.55,.9]){
  const h=new Hooper(scene,0,l);Object.assign(h,{act,actT:t*.8,actDur:.8,meter:t,hasBall:true,moveKind:'spin',facing,h:act==='dunk'?90:0,carried:{x:30,h:60},x:0,z:0,tAlive:1});
  const rig=poseOf(h,{opp:()=>({hasBall:false}),phase:'live'},1/60).rig;
  h.puppet.cur=rig;h.puppet.setFacing(facing);h.puppet.paint();
  assert(h.puppet.pix.px.some(v=>v>>>24),'visible sprite');
  const pix=h.puppet.pix;
  for(let x=0;x<pix.w;x++)if(pix.alpha(x,0)||pix.alpha(x,pix.h-1))edgeTouches++;
  for(let y=0;y<pix.h;y++)if(pix.alpha(0,y)||pix.alpha(pix.w-1,y))edgeTouches++;
  assert(Object.values(rig).every(Number.isFinite),'finite animation rig');rendered++;
 }
}
assert.equal(edgeTouches,0,'animation sprites stay inside their texture');
assert.equal(masks.size,8,'all eight tops have different silhouettes with identical colors');
const idSet=new Set();for(const item of ITEMS){assert(!idSet.has(item.id),'unique store item ID');idSet.add(item.id);}
for(const item of ITEMS.filter(i=>i.slot==='top')){
 const outfit=buildLoadout({...STARTER_EQUIP,top:item.id});assert.equal(outfit.top,item.patch.top);
 const puppet=new Puppet(scene,outfit);puppet.paint();assert(puppet.pix.px.some(v=>v>>>24));
}
// Prints are stored on the item, and must not leak when a different top is equipped.
const printed=buildLoadout({...STARTER_EQUIP,top:'top.jersey.23'});assert.equal(printed.jerseyNumber,23);
const plain=buildLoadout({...STARTER_EQUIP,top:'top.tee.white'});assert.equal(plain.topGraphic,undefined);
const showcase=[
 ['VARSITY 23',{...base,top:'jersey',topColor:0x9e2937,topTrim:0xffe6b1,bottom:'longShorts',bottomColor:0x263247,topGraphic:'number',jerseyNumber:23,head:'headband',headColor:0xffe6b1,shoes:'high'}],
 ['COURT LOGO',{...base,top:'tee',topColor:0x222630,topTrim:0xf0c55a,topGraphic:'box',bottom:'jeans',bottomColor:0x405a7c,head:'fullcap',headColor:0x344966,shoes:'low',chain:'gold'}],
 ['OVERSIZE',{...base,top:'bigTee',topColor:0x263c55,topTrim:0x78d7ce,topGraphic:'diagonal',bottom:'jorts',bottomColor:0x627b8c,head:'backcap',headColor:0x78d7ce,shoes:'cortez'}],
 ['HOODIE',{...base,top:'hoodie',topColor:0x75826a,topTrim:0xd6cfae,bottom:'joggers',bottomColor:0x33383d,head:'beanie',headColor:0xc8b27b,shoes:'runner'}],
 ['FLANNEL',{...base,top:'flannel',topColor:0x973e45,topTrim:0x243044,bottom:'khakis',bottomColor:0x9c8966,shoes:'boot',shoeColor:0xa77a43}],
 ['PUFFER',{...base,top:'puffer',topColor:0x4a6e96,topTrim:0xe6be6d,bottom:'sweats',bottomColor:0x33374c,head:'durag',headColor:0x222532,shoes:'high',chain:'ice'}],
];
if(process.env.SPRITE_QA){
 fs.mkdirSync('/tmp/ballout-redesign',{recursive:true});
 const manifest=[];
 for(const [i,{name,loadout}] of [...frames,...showcase.map(([name,loadout])=>({name,loadout}))].entries()){
  const p=new Puppet(scene,loadout);p.paint();
  fs.writeFileSync(`/tmp/ballout-redesign/${i}.rgba`,Buffer.from(p.pix.px.buffer));manifest.push({name,w:p.pix.w,h:p.pix.h});
 }
 for(const [i,act] of ['free','shoot','dunk','juke','fall','block'].entries()){
  const h=new Hooper(scene,0,showcase[0][1]);Object.assign(h,{act,actT:.4,actDur:.8,meter:.7,hasBall:true,moveKind:'spin',h:act==='dunk'?90:0,carried:{x:30,h:60},x:0,z:0,tAlive:1});
  h.puppet.cur=poseOf(h,{opp:()=>({hasBall:false}),phase:'live'},1/60).rig;h.puppet.paint();
  fs.writeFileSync(`/tmp/ballout-redesign/${14+i}.rgba`,Buffer.from(h.puppet.pix.px.buffer));manifest.push({name:act,w:h.puppet.pix.w,h:h.puppet.pix.h});
 }
 fs.writeFileSync('/tmp/ballout-redesign/manifest.json',JSON.stringify(manifest));
}
console.log(`Wardrobe checks passed: 8 distinct silhouettes, ${rendered} animated poses, store IDs, purchases and print reset`);
