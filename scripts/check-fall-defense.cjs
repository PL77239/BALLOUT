const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Hooper}=load('hooper'),{poseOf}=load('anim'),{Brain}=load('ai'),{rng}=load('pixel'),{buildLoadout,STARTER_EQUIP}=load('loadout');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const look={...buildLoadout({...STARTER_EQUIP}),chain:'ice',head:'none'};
const frames=[];
for(const facing of [-1,1]){
 const h=new Hooper(scene,0,look);Object.assign(h,{act:'fall',actDur:1.2,facing});h.puppet.setFacing(facing);
 for(let i=0;i<=288;i++){
  h.actT=i/240;const pose=poseOf(h,{opp:()=>({hasBall:false}),phase:'live'},1/240);
  h.puppet.simulate(pose.rig,1/240,{f:false,b:false},{f:0,h:0});
  const r=h.puppet.cur;assert(r.hipY-Math.max(r.fFy,r.bFy)-7>18,'hip stays above ankles throughout spring-driven fall');
  if(facing===1 && [0,48,96,144,216,288].includes(i)){h.puppet.paint();frames.push({name:`FALL ${(i/240).toFixed(1)}s`,w:h.puppet.pix.w,h:h.puppet.pix.h,data:Buffer.from(new Uint8Array(h.puppet.pix.px.buffer))});}
 }
}
for(const facing of [-1,1]){
 const h=new Hooper(scene,0,look);h.puppet.setFacing(facing);h.puppet.paint();
 const p=h.puppet.pix;let count=0,total=0;for(let y=0;y<p.h;y++)for(let x=0;x<p.w;x++)if(p.get(x,y)===0xbfe4f4){count++;total+=x;}
 assert(count>0,'iced pendant remains visible in both profiles');
 assert((total/count-h.puppet.ox)*facing>1,'pendant lies on the forward chest surface');
 frames.push({name:facing===1?'CHAIN RIGHT':'CHAIN LEFT',w:p.w,h:p.h,data:Buffer.from(p.px.buffer)});
}
const rates=[];
for(const level of ['rookie','hooper','legend']){
 const random=rng(2017),g={rand:random,ball:{mode:'held'},phase:'live'};let jumps=0;
 for(let n=0;n<400;n++){
  const ai=new Brain(level),me=new Hooper(scene,1,look),opp=new Hooper(scene,0,look);
  Object.assign(me,{x:720,hasBall:false});Object.assign(opp,{x:650,hasBall:true,act:'shoot'});
  for(let t=0;t<36;t++){opp.meter=t/36;const I=ai.think(me,opp,g,1/60);if(I.shootDown){jumps++;break;}}
 }
 const rate=jumps/400;assert(rate>.3 && rate<.85,'AI leaves a meaningful share of shots uncontested');rates.push(rate);console.log(`${level}: jump on ${(rate*100).toFixed(1)}% of nearby committed shots`);
}
assert(rates[0]<rates[1]&&rates[1]<rates[2],'global difficulty still scales defense');
fs.mkdirSync('/tmp/ballout-fix',{recursive:true});frames.forEach((f,i)=>fs.writeFileSync(`/tmp/ballout-fix/${i}.rgba`,f.data));fs.writeFileSync('/tmp/ballout-fix/manifest.json',JSON.stringify(frames.map(({data,...f})=>f)));
console.log('Fall/chain/defense checks passed');
