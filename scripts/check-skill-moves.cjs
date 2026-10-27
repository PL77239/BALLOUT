const assert=require('node:assert/strict'),{load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Hooper}=load('hooper'),{poseOf}=load('anim'),{buildLoadout,STARTER_EQUIP}=load('loadout'),{T}=load('tuning');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const make=()=>{const h=new Hooper(scene,0,buildLoadout({...STARTER_EQUIP}));h.hasBall=true;h.x=600;h.stamina=100;return h;};
const idle={mx:0,mz:0,sprint:false,shootHeld:false,shootDown:false,shootUp:false,a:false,aHeld:false,b:false,c:false,cHeld:false,shove:false,checkHeld:false};
let ankleChecks=0;const pops=[];
const g={gt:10,phase:'live',needsClear:false,cleared:true,popupAt:(h,t)=>pops.push(t),fx:{dust:noop},ankleCheck:()=>ankleChecks++,opp:()=>({x:100,z:0,hasBall:false,act:'free',stats:{speed:50,defense:50},I:{checkHeld:false}}),distToHoop:()=>500};
const step=(h,I,n=1)=>{for(let i=0;i<n;i++){g.gt+=1/240;h.update(1/240,{...idle,...I},g);}};
for(const facing of [-1,1]){
 const h=make();h.facing=facing;step(h,{a:true,aHeld:true,mx:-facing});assert.equal(h.moveKind,'stepback');assert.equal(h.stamina,83);assert(h.vx*facing<0);
 const f=make();f.facing=facing;step(f,{a:true,aHeld:true,mx:facing});assert.equal(f.moveKind,'cross');assert(f.vx*facing>0);
 for(const z of [-1,1]){const c=make();c.facing=facing;step(c,{a:true,aHeld:true,mz:z});assert.equal(c.moveKind,'cross');assert(c.vz*z>0);}
}
const tap=make();step(tap,{a:true,aHeld:true});assert.equal(tap.act,'free');assert.equal(tap.stamina,100);step(tap,{},10);assert.equal(tap.moveKind,'cross');assert.equal(tap.stamina,83,'neutral quick tap debits once');
const hold=make();step(hold,{a:true,aHeld:true});step(hold,{aHeld:true},40);assert.equal(hold.moveKind,'hesi');assert.equal(hold.stamina,83);const x=hold.x;step(hold,{aHeld:true},35);assert(Math.abs(hold.x-x)<1,'neutral hesitation does not dash by itself');
const stillChecks=ankleChecks;step(hold,{aHeld:true},50);assert.equal(ankleChecks,stillChecks,'stationary hesitation cannot roll an ankle break');assert.equal(hold.comboN,1,'holding does not repeat the move');
const redirect=make();step(redirect,{a:true,aHeld:true});step(redirect,{aHeld:true,mz:-1});assert.equal(redirect.moveKind,'cross');assert(redirect.vz<0,'direction during gather starts responsive cross');
const canceled=make();step(canceled,{a:true,aHeld:true});step(canceled,{aHeld:true,shootDown:true,shootHeld:true});assert.equal(canceled.act,'shoot');assert.equal(canceled.skillGather,0,'shoot cancels pending neutral move');
const combo=make();step(combo,{a:true,aHeld:true,mz:1});step(combo,{},32);step(combo,{a:true,aHeld:true,mz:-1});assert.equal(combo.comboN,2);assert(pops.includes('DOUBLE CROSS x2'));assert(combo.stamina<=60.01,'both combo links pay cost');
const shot=make();step(shot,{a:true,aHeld:true,mx:-1});step(shot,{mx:-1},34);step(shot,{mx:-1,shootDown:true,shootHeld:true});assert.equal(shot.act,'shoot');assert(shot.fade,'stepback shot preserves fade penalty');
const tired=make();tired.stamina=0;step(tired,{a:true,aHeld:true});step(tired,{aHeld:true},480);assert.equal(tired.act,'free');assert.equal(tired.stamina,0);assert.equal(tired.comboN,0,'held hesitation cannot bypass exhaustion');
const triple=make();for(const kind of ['hesi','cross','spin']){triple.startMove(kind,g);g.gt+=.2;}assert(pops.includes('HANG TIME x3'));
const poses=[];for(const kind of ['cross','spin','btb','hesi','stepback']){const h=make();h.startMove(kind,g);h.actT=h.actDur*.5;poses.push(JSON.stringify(poseOf(h,g,1/60).rig));}assert.equal(new Set(poses).size,5,'five move poses differ');
console.log('Skill moves passed: directional cross/stepback, neutral tap/hold, redirect/cancel, paid combos, fatigue and distinct poses');
