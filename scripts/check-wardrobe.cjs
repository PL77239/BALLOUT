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
// Regressions: skin must not leak through articulated clothing joints or the pelvis.
const {shade}=load('pixel');
const skin=0x8a5634;
const skinColors=new Set([skin,shade(skin,.88),shade(skin,1.12),shade(skin,1.08),shade(skin,.72),shade(skin,1.3)]);
const noSkinAt=(p,x,y)=>assert(!skinColors.has(p.pix.get(x,y)),`covered joint contains skin at ${x},${y}`);
for(const bottom of ['jeans','khakis','sweats','joggers']){
 const p=new Puppet(scene,{...base,bottom});p.pix.clear();p.brush.reset();
 p.legPiece(p.brush,{hp:[64,50],kn:[72,70],an:[65,95],ank:0,far:false},p.loadout,skin,1,1);
 for(let x=71;x<=73;x++)for(let y=69;y<=71;y++)noSkinAt(p,x,y);
}
for(const top of ['hoodie','flannel','puffer','longsleeve']){
 const p=new Puppet(scene,{...base,top});p.pix.clear();p.brush.reset();
 p.armPiece(p.brush,{sh:[60,40],el:[72,55],wr:[62,70],far:false},p.loadout,skin,1,false);
 for(let x=71;x<=73;x++)for(let y=54;y<=56;y++)noSkinAt(p,x,y);
}
for(const top of tops){
 const p=new Puppet(scene,{...base,top});p.pix.clear();p.brush.reset();
 p.torsoPiece(p.brush,[64,80],[65,58],p.loadout,skin,1,0,1,1);
 for(let x=57;x<=71;x++)for(let y=81;y<=87;y++)noSkinAt(p,x,y);
}
const idSet=new Set();for(const item of ITEMS){assert(!idSet.has(item.id),'unique store item ID');idSet.add(item.id);}
for(const item of ITEMS.filter(i=>i.slot==='top')){
 const outfit=buildLoadout({...STARTER_EQUIP,top:item.id});assert.equal(outfit.top,item.patch.top);
 const puppet=new Puppet(scene,outfit);puppet.paint();assert(puppet.pix.px.some(v=>v>>>24));
}
// Prints are stored on the item, and must not leak when a different top is equipped.
const printed=buildLoadout({...STARTER_EQUIP,top:'top.jersey.23'});assert.equal(printed.jerseyNumber,23);
const patched=buildLoadout({...STARTER_EQUIP,bottom:'bottom.jeans.cross'});assert.equal(patched.bottomDetail,'crosses');
assert.equal(buildLoadout({...STARTER_EQUIP}).bottomDetail,undefined,'bottom detail clears');
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
 const streetFits=[
  ['GOTHIC CROSS','top.tee.gothic','bottom.jeans.cross'],
  ['STACKED TYPE','top.bigtee.stacked','bottom.jeans.flap'],
  ['SILVER HOOD','top.hoodie.gothic','bottom.jeans.distressed'],
  ['STAR PATCH','top.hoodie.stars','bottom.sweats.track'],
  ['WASHED STAR','top.bigtee.washed','bottom.jeans.flap'],
  ['RACING LS','top.longsleeve.racing','bottom.jeans.cross'],
  ['GOLD COURT','top.jersey.8','bottom.longshorts.court'],
  ['SKYLINE 01','top.jersey.1','bottom.jeans.distressed'],
 ];
 for(const [i,[name,top,bottom]] of streetFits.entries()){
  const outfit=buildLoadout({...STARTER_EQUIP,top,bottom,shoes:'shoes.high.cream',head:i%2?'head.fitted.star':'head.none'});
  const p=new Puppet(scene,outfit);p.paint();
  fs.writeFileSync(`/tmp/ballout-redesign/${20+i}.rgba`,Buffer.from(p.pix.px.buffer));manifest.push({name,w:p.pix.w,h:p.pix.h});
 }
 fs.writeFileSync('/tmp/ballout-redesign/manifest.json',JSON.stringify(manifest));
}
console.log(`Wardrobe checks passed: 8 distinct silhouettes, ${rendered} animated poses, store IDs, purchases and print reset`);
