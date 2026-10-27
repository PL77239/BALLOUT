const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Hooper}=load('hooper'),{GameScene}=load('game'),{poseOf}=load('anim'),{T}=load('tuning');
const {buildLoadout,STARTER_EQUIP,applyLookPatch}=load('loadout');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const look={...buildLoadout({...STARTER_EQUIP}),head:'none',topColor:0x253d59,topTrim:0xf4d06a};
const make=()=>new Hooper(scene,0,look),other=make();other.x=T.hoop.x-250;
const g={phase:'live',gt:5,needsClear:false,cleared:true,distToHoop:(x,z)=>Math.hypot(T.hoop.x-x,z),opp:()=>other,fx:{dust:noop},popupAt:noop};
const a=make();a.x=T.hoop.x-120;a.hasBall=true;a.I.mz=0;a.startShoot(g);assert.equal(a.layupStyle,1);
const b=make();b.x=a.x;b.hasBall=true;b.I.mz=-1;b.startShoot(g);assert.equal(b.layupStyle,2);
for(const h of [a,b]){h.meter=.65;h.h=60;}
assert.notDeepEqual(poseOf(a,g,1/60).rig,poseOf(b,g,1/60).rig,'layup poses differ');
for(const [mz,style] of [[0,0],[-1,1],[1,3]]){
 const h=make();h.x=T.hoop.x-140;h.hasBall=true;h.I.mz=mz;assert(h.startDunk(g));assert.equal(h.dunkStyle,style);
}
const combo=make();combo.x=T.hoop.x-140;combo.hasBall=true;combo.comboN=2;combo.comboT=4.8;assert(combo.startDunk(g));assert.equal(combo.dunkStyle,2);
const previous={...look,topTexture:'crest',bottomTexture:'stitch'};
const preview=applyLookPatch(previous,{top:'hoodie',bottom:'sweats'});
assert.equal(preview.topTexture,undefined);assert.equal(preview.bottomTexture,undefined);
const plain=make();plain.puppet.t=0;plain.puppet.paint();const pixels0=Array.from(plain.puppet.pix.px);
const textured=make();textured.puppet.dress({...look,topTexture:'crest',bottomTexture:'stitch'});textured.puppet.t=0;textured.puppet.paint();
assert.notDeepEqual(Array.from(textured.puppet.pix.px),pixels0,'textures produce visible pixels');
const labels=[];const moveG={...g,gt:5,popupAt:(h,text)=>labels.push(text)};
const mover=make();mover.hasBall=true;mover.startMove('cross',moveG);moveG.gt+=.2;mover.startMove('btb',moveG);moveG.gt+=.2;mover.startMove('spin',moveG);
assert(labels.some(x=>x.includes('AROUND THE WORLD')),'three-move combo produces its own label');
// Spectators and the large locker preview use different texture bounds.
const {Puppet}=load('puppet');
// Regression: the shirt must follow the same leaning torso in both profiles.
// Mirroring screen coordinates twice used to rotate the left-facing top away.
for(const lean of [-.7,-.38,.25,.6]){
 const masks=[];
 for(const facing of [1,-1]){
  const p=new Puppet(scene,look);p.pix.clear();p.brush.reset();
  p.torsoPiece(p.brush,[64,80],[64+Math.sin(lean)*22*facing,80-Math.cos(lean)*22],look,0x996644,1,lean,facing,facing);
  masks.push(p.pix);
 }
 let mismatch=0,area=0;
 for(let y=0;y<144;y++)for(let x=0;x<128;x++){
  const a=!!masks[0].alpha(x,y),b=!!masks[1].alpha(127-x,y);if(a||b)area++;if(a!==b)mismatch++;
 }
 assert(mismatch/area<.04,'leaning top stays attached in mirrored profiles');
}
for(const opts of [{scale:.62,w:64,h:58},{scale:.46,w:64,h:58},{scale:1.5,w:180,h:150}]){
 for(const hair of ['fade','afro','hightop','braids','mohawk','bun']){
  const p=new Puppet(scene,{...look,hair},opts);p.paint();
  for(let x=0;x<p.pix.w;x++)assert(!p.pix.alpha(x,0)&&!p.pix.alpha(x,p.pix.h-1),'head/feet stay inside NPC and locker textures');
  for(let y=0;y<p.pix.h;y++)assert(!p.pix.alpha(0,y)&&!p.pix.alpha(p.pix.w-1,y),'silhouette stays inside NPC and locker textures');
 }
}
const game=Object.create(GameScene.prototype),scorer=make(),rival=make(),pops=[],rings=[];
scorer.hasBall=true;scorer.x=T.hoop.x-180;rival.x=scorer.x+70;
Object.assign(game,{cfg:{mode:'2p'},phase:'live',hoopers:[scorer,rival],buckets:[0,0],style:[0,0],rand:()=>0,needsClear:false,cleared:true,
 ball:{setHeld:noop,launch:noop},fx:{ring:(...x)=>rings.push(x),sparks:noop,popup:noop},court:{cheer:noop},popupAt:(h,t)=>pops.push(t),hitstop:noop,slowmo:noop,shake:noop,afterPoint:noop});
game.launchShot(scorer,{perfect:true,err:0,green:.04,m:.8,e:0,grade:'green',willMake:true});
assert(!pops.some(x=>x==='PERFECT!'),'no score celebration at release');
game.onScore({shooter:scorer,perfect:true,pts:1,dunk:false,touchedRim:false},true);
assert(pops.includes('PERFECT!'),'green celebration follows the scored shot');assert(rings.length>=2,'score includes the green burst');
assert.equal(scorer.celeb,3);
// A made shot enters the point pause. The pose must still animate there;
// previously the simulation returned before any celebration could advance.
Object.assign(game,{phase:'point',pointCountdown:2,pointCountShown:-1,slowT:0,hitT:0,timeScale:1,time_:0,tick:0,ctrls:[null,null],brains:[null,null],latch:[{},{}],showBanner:noop});
scorer.act='release';scorer.h=25;const before=scorer.puppet.cur.fHy,remaining=scorer.moodT;
for(let i=0;i<80;i++)game.simStep();
assert(scorer.moodT<remaining && scorer.puppet.cur.fHy!==before,'celebration advances during point pause');
assert.equal(scorer.h,0,'scorer lands during the pause');
for(let i=0;i<260;i++)game.simStep();
assert.equal(scorer.mood,'','celebration returns to idle before the next possession');
// Save the actual rigged frames for a reviewable pixel-art contact sheet.
const frames=[];
function frame(name,h){h.puppet.t=0;h.puppet.paint();const p=h.puppet.pix;frames.push({name,w:p.w,h:p.h,data:Buffer.from(new Uint8Array(p.px.buffer))});}
for(const [name,texture] of [['CREST','crest'],['COURT','court'],['STARS','stars'],['STARFIELD','tile:stars']]){const h=make();h.puppet.dress({...look,topTexture:texture,bottom:'jeans',bottomTexture:'stitch'});frame(name,h);}
const dunkRigs=[];
for(const [name,style] of [['TWO HAND',0],['REVERSE',1],['WINDMILL',2],['ONE HAND',3]]){const h=make();Object.assign(h,{act:'dunk',actT:.35,actDur:.8,dunkStyle:style,trickDunk:style===2,h:100,hasBall:true});h.puppet.cur=poseOf(h,g,1/60).rig;dunkRigs.push(JSON.stringify(h.puppet.cur));frame(name,h);}
assert.equal(new Set(dunkRigs).size,4,'four dunk poses differ');
for(const h of [a,b]){h.puppet.cur=poseOf(h,g,1/60).rig;frame(h.layupStyle===1?'LAYUP':'REVERSE LAYUP',h);}
fs.mkdirSync('/tmp/ballout-bis',{recursive:true});frames.forEach((f,i)=>fs.writeFileSync(`/tmp/ballout-bis/${i}.rgba`,f.data));fs.writeFileSync('/tmp/ballout-bis/manifest.json',JSON.stringify(frames.map(({data,...rest})=>rest)));
console.log('Bis checks passed: texture projection, style poses, held variants and green-on-score');
