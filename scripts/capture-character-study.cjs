// Render the actual rig/spring/cloth pipeline on a controlled animation timeline.
const fs=require('node:fs'),{load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Hooper}=load('hooper'),{poseOf}=load('anim'),{buildLoadout,STARTER_EQUIP}=load('loadout');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const defs=[['RUN / TEE','tee',0xe6e2d4,'jeans'],['TURN / HOODIE','hoodie',0x365575,'sweats'],['DUNK / JERSEY','jersey',0xc4553b,'shorts'],['FALL / OVERSIZED','bigTee',0x67764f,'joggers']];
const hs=defs.map((d,i)=>new Hooper(scene,i,{...buildLoadout({...STARTER_EQUIP}),top:d[1],topColor:d[2],bottom:d[3],bottomColor:0x2a354b,head:'none',chain:'none',hair:'fade'}));
const g={opp:()=>({hasBall:false}),phase:'live',gt:0},out='/tmp/ballout-study';fs.mkdirSync(out,{recursive:true});
for(let frame=0;frame<40;frame++)for(let k=0;k<3;k++)hs.forEach((h,i)=>{
 const t=(frame*3+k)/60;h.tAlive=t;h.vx=i===0?280*Math.sin(t*Math.PI/2):0;h.ph=i===0?h.ph:0;h.h=i===2?80:0;
 h.act=['free','juke','dunk','fall'][i];h.actDur=i===1?2:i===2?.8:1.2;h.actT=i===2?t%.8:i===3?t%1.2:t;
 h.moveKind='spin';h.dunkStyle=0;h.hasBall=false;
 const pose=poseOf(h,g,1/60);h.puppet.simulate(pose.rig,1/60,{f:pose.pinF,b:pose.pinB},{f:h.vx,h:i===2?Math.sin(t*8)*140:0});
 if(k===2){h.puppet.paint();fs.writeFileSync(`${out}/${frame}-${i}.rgba`,Buffer.from(h.puppet.pix.px.buffer));}
});
fs.writeFileSync(out+'/manifest.json',JSON.stringify({labels:defs.map(d=>d[0]),w:128,h:144,count:40}));
console.log('Rendered character animation study');
