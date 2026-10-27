const assert=require('node:assert/strict'),{load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Hooper}=load('hooper'),{buildLoadout,STARTER_EQUIP}=load('loadout'),{T}=load('tuning');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const make=()=>new Hooper(scene,0,buildLoadout({...STARTER_EQUIP}));
const g={gt:10,phase:'live',needsClear:false,cleared:true,popupAt:noop,fx:{dust:noop},opp:()=>({x:0,z:0,hasBall:false,act:'fall',I:{checkHeld:false}}),distToHoop:()=>500,ankleCheck:noop};
const idle={mx:0,mz:0,sprint:false,shootHeld:false,shootDown:false,shootUp:false,a:false,b:false,c:false,cHeld:false,shove:false,checkHeld:false};
for(const call of [h=>h.startMove('cross',g),h=>h.startMove('spin',g),h=>h.startMove('btb',g),h=>h.startMove('hesi',g),h=>h.startMove('stepback',g),h=>h.startSwipe(),h=>h.startBlock(),h=>h.startShove(g),h=>h.startDunk(g)]){
 const h=make();h.stamina=0;h.hasBall=true;h.x=T.hoop.x-100;
 for(let i=0;i<20;i++)call(h);
 assert.equal(h.act,'free','zero energy cannot start an action');assert.equal(h.stamina,0);assert.equal(h.comboN,0);assert.equal(h.vh,0);
}
const h=make();h.hasBall=true;h.stamina=100;
for(const [move,left] of [['cross',83],['spin',60],['btb',31]]){h.startMove(move,g);assert.equal(h.stamina,left);g.gt+=.15;}
const history=h.moveHistory.slice(),combo=h.comboN;h.startMove('spin',g);assert.equal(h.stamina,31);assert.equal(h.comboN,combo);assert.deepEqual(h.moveHistory,history,'rejected move cannot build combo');
const spam=make();spam.hasBall=true;spam.stamina=0;
for(let i=0;i<480;i++){g.gt+=1/240;spam.update(1/240,{...idle,a:true,b:true,c:true},g);}
assert.equal(spam.stamina,0,'spam cannot regenerate enough energy to force an action');assert.equal(spam.act,'free');
for(let i=0;i<312;i++){g.gt+=1/240;spam.update(1/240,idle,g);}
assert(spam.stamina>=16 && spam.stamina<spam.staminaMax,'rest regenerates after delay');
for(let i=0;i<240;i++){g.gt+=1/240;spam.update(1/240,idle,g);}
spam.startMove('cross',g);assert.equal(spam.act,'juke','rest restores ability to act');
const defender=make();defender.stamina=3.99;defender.startSwipe();assert.equal(defender.act,'free');defender.stamina=4;defender.startSwipe();assert.equal(defender.act,'swipe');assert.equal(defender.stamina,0);
defender.act='free';defender.stamina=6;defender.startBlock();assert.equal(defender.act,'free','exhaustion requires recovery, not a fractional top-up');
const shooter=make();shooter.hasBall=true;shooter.stamina=0;shooter.startShoot(g);assert.equal(shooter.act,'shoot','ordinary shooting remains possible when tired');
console.log('Stamina passed: full costs, zero/spam rejection, no phantom combos, recovery and basic shots');
