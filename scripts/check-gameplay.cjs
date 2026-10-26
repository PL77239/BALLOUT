// Headless logic checks; Phaser rendering is deliberately replaced with a minimal scene.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const cache = {};
const noop = () => {};
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const sfx = new Proxy({}, {get: () => noop});
function load(name) {
  if (cache[name]) return cache[name];
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src',name+'.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exp = {}; cache[name] = exp;
  const req = id => {
    if (id === 'phaser') return {default: {Scene: class {}}};
    if (id === './sfx') return {sfx};
    const n=id.replace('./','');
    if (['tuning','hooper','game','ai','loadout','pixel','puppet'].includes(n)) return load(n);
    if (n==='input') return {emptyIntent:()=>({mx:0,mz:0,sprint:false}),MenuNav:class{}};
    if (n==='bosses') return {PLAYER_STATS:{speed:50,accuracy:50,stamina:50,defense:50}};
    if (n==='music') return {music:{}};
    return {};
  };
  new Function('exports','require',code)(exp,req); return exp;
}
const {T}=load('tuning'), {Hooper}=load('hooper'), {GameScene}=load('game'), {Brain}=load('ai');
const player = Object.assign(Object.create(Hooper.prototype),{hasBall:true,x:T.hoop.x-120,z:0,vx:160,stamina:100,comboN:0,comboT:0,stats:{speed:50,defense:50},facing:1});
const stub={needsClear:false,cleared:true,gt:10,fx:{dust:noop}};
assert.equal(player.startDunk(stub),true,'close running dunk');
for (const [dx,z,vx,stamina] of [[250,0,160,100],[120,60,160,100],[120,0,0,100],[60,0,0,5],[-20,0,0,100]]) {
 Object.assign(player,{x:T.hoop.x-dx,z,vx,stamina}); assert.equal(player.startDunk(stub),false,`reject dunk ${[dx,z,vx,stamina]}`);
}
Object.assign(player,{x:T.hoop.x-60,z:0,vx:0,stamina:100});assert.equal(player.startDunk(stub),true,'standing close dunk');
stub.needsClear=true;stub.cleared=false;assert.equal(player.startDunk(stub),false,'clear before dunk');
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
// Export an actual CPU-rendered character contact sheet when requested.
if(process.env.SPRITE_QA){
 global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
 const {Puppet}=load('puppet'),{buildLoadout,STARTER_EQUIP}=load('loadout');
 const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
 const l=buildLoadout({...STARTER_EQUIP},'YOU');
 let i=0;for(const top of ['tank','jersey','tee','bigTee','hoodie','flannel','longsleeve','puffer']){
  const p=new Puppet(scene,{...l,top});p.paint();fs.writeFileSync(`/tmp/ballout-sprite-${i++}.rgba`,Buffer.from(p.pix.px.buffer));
 }
}
