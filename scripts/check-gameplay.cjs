const assert = require('node:assert/strict');
const {load, noop} = require('./headless-art.cjs');
const {T}=load('tuning'), {Hooper}=load('hooper'), {GameScene}=load('game'), {Brain}=load('ai');
const player = Object.assign(Object.create(Hooper.prototype),{hasBall:true,act:'free',h:0,x:T.hoop.x-160,z:0,vx:0,stamina:100,comboN:0,comboT:0,stats:{speed:50,defense:50},facing:1});
const guard={x:T.hoop.x-240,z:0,act:'free'};
const stub={needsClear:false,cleared:true,gt:10,fx:{dust:noop},opp:()=>guard};
assert.equal(player.canDunk(stub),true,'standing takeoff inside close range, defender beaten');
assert.equal(player.startDunk(stub),true,'valid takeoff starts the meter');
assert.equal(player.stamina,90,'takeoff costs ten stamina');
for (const [dx,z,stamina] of [[250,0,100],[120,60,100],[60,0,5],[-20,0,100]]) {
 Object.assign(player,{x:T.hoop.x-dx,z,stamina,act:'free'});assert.equal(player.startDunk(stub),false,`reject dunk ${[dx,z,stamina]}`);
}
Object.assign(player,{x:T.hoop.x-150,z:0,stamina:100,act:'free'});
guard.x=player.x+45;assert.equal(player.canDunk(stub),false,'active defender in takeoff lane');
guard.x=player.x-10;assert.equal(player.canDunk(stub),false,'must actually get past defender');
guard.x=player.x-25;assert.equal(player.canDunk(stub),true,'clear lead over defender unlocks dunk');
guard.x=player.x+60;guard.z=55;assert.equal(player.canDunk(stub),true,'defender out of path does not block');
guard.z=0;guard.act='block';assert.equal(player.canDunk(stub),false,'jumping blocker stops takeoff');
guard.act='fall';assert.equal(player.canDunk(stub),true,'grounded defender is beaten');
stub.needsClear=true;stub.cleared=false;assert.equal(player.canDunk(stub),false,'clear before dunk');
stub.needsClear=false;player.act='fall';assert.equal(player.canDunk(stub),false,'cannot dunk while falling');
player.act='free';player.h=30;assert.equal(player.canDunk(stub),false,'cannot start dunk in midair');player.h=0;
const g=new GameScene();g.time_=10;let falls=0,rolls=0;
const d={x:120,z:0,sy:500,h:0,act:'free',immuneT:0,vz:0,vx:0,stamina:100,facing:-1,stats:{defense:50},knock(){falls++;}};
Object.assign(player,{x:100,z:0,hasBall:true,comboN:4,dash:{x:1,z:1},moveKind:'cross',gainHeat:noop});
Object.assign(g,{opp:()=>d,rand:()=>{rolls++;return 0.99;},fx:{dust:noop,ring:noop},popupAt:noop,slowmo:noop,shake:noop,punch:noop,hitstop:noop});
g.ankleCheck(player);g.ankleCheck(player);assert.equal(rolls,1,'cooldown blocks repeated rolls');assert.equal(falls,0,'combo never guarantees fall');
g.time_=11;g.rand=()=>0;g.ankleCheck(player,true);assert.equal(falls,1,'running cuts can break ankles');
g.time_=12;g.ankleCheck(player,true);assert.equal(falls,1,'fall immunity prevents repeats');
for (const level of ['rookie','hooper','legend']) {
 const b=new Brain(level);let checks=0,lapses=0,seed=123;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const me={x:200,z:0,act:'free',stamina:100,shoveCD:10};
 const opp={x:130,z:0,vz:0,act:'free',hasBall:true,protectT:1};
 for(let i=0;i<3600;i++){const I={};b.defense(I,me,opp,{rand,ball:{mode:'loose'}},1/60);if(I.checkHeld)checks++;else lapses++;}
 assert(checks>0&&lapses>0,`${level}: containment and openings`);
 console.log(`${level}: containment ${(checks/36).toFixed(1)}%, openings ${(lapses/36).toFixed(1)}%`);
}
console.log('Gameplay checks passed');
