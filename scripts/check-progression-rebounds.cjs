const assert=require('node:assert/strict');
const {load,noop}=require('./headless-art.cjs');
let saved='';global.localStorage={getItem:()=>JSON.stringify({cash:123,wins:2,games:3}),setItem:(k,v)=>{saved=v;}};
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {bossesFor}=load('bosses'),{save,unlockedRival,recordRivalWin}=load('save');
assert.equal(save().cash,123,'old inventory/currency save retained');assert.deepEqual(save().courtWins,{},'old save gains empty progression');
for(const court of ['brooklyn','queens','harlem','chicago','chiraq','philly','detroit','atl','la','warsaw','fairmount','marseille']){
 const rivals=bossesFor(court);assert.equal(rivals.length,6);assert.equal(new Set(rivals.map(r=>r.name)).size,6);
 for(let i=1;i<6;i++)for(const key of ['speed','accuracy','stamina','defense'])assert(rivals[i].stats[key]>rivals[i-1].stats[key],`${court} tier ${i} raises ${key}`);
 assert.equal(unlockedRival(court),0);assert.equal(recordRivalWin(court,4),false,'cannot skip locked rivals');
 assert.equal(recordRivalWin(court,0),true);assert.equal(unlockedRival(court),1);
 recordRivalWin(court,0);assert.equal(unlockedRival(court),1,'replaying a win does not skip a tier');
 for(let i=1;i<6;i++)recordRivalWin(court,i);
 assert.equal(unlockedRival(court),5);assert.equal(save().courtWins[court],6);
}
assert(JSON.parse(saved).courtWins.warsaw===6,'progress persists');save().level='rookie';assert.equal(unlockedRival('warsaw'),5,'global difficulty does not erase progress');
const {Brain}=load('ai');
for(const level of ['rookie','hooper','legend']){
 const easy=new Brain(level,0),hard=new Brain(level,5);assert(hard.lvl.react<easy.lvl.react);assert(hard.lvl.shootJitter<easy.lvl.shootJitter);
}
assert(new Brain('legend').lvl.react<new Brain('rookie',5).lvl.react,'global settings remain distinct');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const {Hooper}=load('hooper'),{GameScene}=load('game'),{buildLoadout,STARTER_EQUIP}=load('loadout');
const make=()=>new Hooper(scene,0,buildLoadout({...STARTER_EQUIP}));
const opp=make();Object.assign(opp,{x:680,z:0,hasBall:true,act:'shoot',meter:.65});
const g=new GameScene();Object.assign(g,{opp:()=>opp,rand:()=>.1,ball:{mode:'held'},fx:{dust:noop},phase:'live',popupAt:noop});
const blank=()=>({mx:0,mz:0,sprint:false,shootHeld:false,shootDown:false,shootUp:false,a:false,b:false,c:false,shove:false,checkHeld:false});
const h=make();h.x=720;h.hasBall=false;
h.update(1/240,{...blank(),shootDown:true},g);assert.equal(h.act,'block','a tap, including an AI tap, must start the jump without held input');
for(const level of ['rookie','hooper','legend']){
 const brain=new Brain(level);let jumped=false;const me=make();me.x=720;
 for(let i=0;i<60;i++){const I=brain.think(me,opp,g,1/60);if(I.shootDown){jumped=true;assert(I.shootHeld);break;}}
 assert(jumped,`${level} contests a committed nearby shot`);
}
Object.assign(h,{act:'block',h:80,vh:0,hasBall:false});h.update(1/240,{...blank(),a:true},g);assert(h.reboundT>0,'steal in the air arms a rebound window');
const other=make();other.x=100;Object.assign(g,{hoopers:[h,other],needsClear:false,cleared:true});
Object.assign(h,{x:900,z:0,h:80,act:'block',reboundT:0,pickupLock:0,hasBall:false});
g.ball={mode:'loose',x:900,z:0,h:260,vh:-80,vx:0,vz:0,info:null,lastOwner:other};
g.pickups();assert.equal(h.hasBall,false,'no automatic midair rebound');
h.reboundT=.22;g.pickups();assert.equal(h.hasBall,true,'jump plus steal catches a reachable missed shot');assert.equal(g.needsClear,true,'defensive rebound must be cleared');
Object.assign(h,{act:'free',h:0,reboundT:0,hasBall:false});g.ball={mode:'loose',x:900,z:0,h:20,vh:0,vx:0,vz:0,info:null,lastOwner:other};g.pickups();assert(h.hasBall,'ground balls still use proximity pickup');
console.log('Progression, global difficulty, AI jump-tap, active rebounds and ground pickups passed');
// Exercise the actual match-result path, including a loss (not just the unlock helper).
save().courtWins.brooklyn=0;
const resultGame=new GameScene();Object.assign(resultGame,{cfg:{mode:'1p',court:'brooklyn',level:'rookie',rivalIdx:0},winner:{id:1},time:{delayedCall:noop}});
resultGame.finishMatch();assert.equal(unlockedRival('brooklyn'),0,'losing a match does not unlock a rival');
resultGame.winner={id:0};resultGame.finishMatch();assert.equal(unlockedRival('brooklyn'),1,'winning the actual selected match unlocks the next rival');
// A direction reversal and release should brake promptly, without changing top speed.
const runner=make();Object.assign(runner,{x:700,hasBall:false});opp.hasBall=false;
for(let i=0;i<20;i++)runner.update(1/240,{...blank(),mx:1},g);
assert(runner.vx>250 && runner.vx<400);
for(let i=0;i<8;i++)runner.update(1/240,{...blank(),mx:-1},g);
assert(runner.vx<0,'direction change reverses within eight sim ticks');
for(let i=0;i<20;i++)runner.update(1/240,{...blank(),mx:1},g);
for(let i=0;i<8;i++)runner.update(1/240,blank(),g);
assert.equal(runner.vx,0,'release brakes to a stop within eight sim ticks');
console.log('Actual win/loss advancement and responsive reversal/braking passed');

// Holding Triangle before entering range must start a dunk without another edge.
const dunker=make(),defender=make();
Object.assign(dunker,{x:load('tuning').T.hoop.x-245,z:0,hasBall:true,stamina:100});
Object.assign(defender,{x:dunker.x-50,z:0,hasBall:false,act:'free'});
const dg={...g,opp:()=>defender,gt:0,needsClear:false,cleared:true,fx:{dust:noop},dunkHit:noop,dunkMiss:noop};
dunker.update(1/240,{...blank(),cHeld:true},dg);assert.equal(dunker.act,'free');
dunker.x=load('tuning').T.hoop.x-225;dunker.update(1/240,{...blank(),cHeld:true},dg);assert.equal(dunker.act,'dunk','held Triangle retries takeoff on entry');
console.log('Held dunk input enters the expanded close range');
// A real press outside range starts the existing dribble, then a held button
// must still trigger the dunk as the player drives into range.
const drive=make(),guard2=make();
Object.assign(drive,{x:load('tuning').T.hoop.x-245,z:0,hasBall:true,stamina:100});
Object.assign(guard2,{x:drive.x-70,z:0,hasBall:false,act:'free'});
const driveGame={...dg,opp:()=>guard2,ankleCheck:noop};
drive.update(1/240,{...blank(),c:true,cHeld:true},driveGame);
assert.equal(drive.act,'juke','an outside-range press retains the dribble');
for(let i=0;i<120&&drive.act!=='dunk';i++)drive.update(1/240,{...blank(),cHeld:true},driveGame);
assert.equal(drive.act,'dunk','holding after the initial press starts a dunk during the drive');
