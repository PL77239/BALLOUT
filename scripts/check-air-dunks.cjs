const assert=require('node:assert/strict'),{load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Hooper}=load('hooper'),{T}=load('tuning'),{buildLoadout,STARTER_EQUIP}=load('loadout');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
for(const facing of [-1,1])for(const [mx,mz,expected] of [[0,-1,2],[0,1,0],[-facing,0,1],[facing,0,3]]){
 const h=new Hooper(scene,0,buildLoadout({...STARTER_EQUIP}));Object.assign(h,{facing,act:'dunk',actT:.22,actDur:.8,h:90,dunkFrom:{x:T.hoop.x-130,z:0}});
 const before=h.stamina;h.tickDunk(1/240,{mx,mz},{});assert.equal(h.dunkStyle,expected);assert.equal(h.stamina,before,'style choice does not debit twice');
 h.actT=T.dunk.hitAt;h.dunkHit=true;h.tickDunk(1/240,{mx:-mx,mz:-mz},{});assert.equal(h.dunkStyle,expected,'style locks at the slam');
}
const h=new Hooper(scene,0,buildLoadout({...STARTER_EQUIP}));Object.assign(h,{act:'dunk',actT:.22,h:90,dunkStyle:3,dunkFrom:{x:800,z:0}});h.tickDunk(1/240,{mx:.2,mz:.1},{});assert.equal(h.dunkStyle,3,'stick deadzone retains selected finish');
console.log('Air dunk choice passed: four directions, both facings, deadzone, lock and unchanged stamina');

const {DunkControls}=load('dunk_controls');
for(const facing of [-1,1]){
 const a=new DunkControls();a.choose(0,-1,facing,.15,0);assert.equal(a.choose(0,1,facing,.23,2),4);assert.equal(a.choose(1,0,facing,.30,4),4,'combo stays locked');
 const b=new DunkControls();b.choose(-facing,0,facing,.14,0);b.choose(0,-1,facing,.21,1);assert.equal(b.choose(facing,0,facing,.28,2),5);
 b.reset();assert.equal(b.choose(facing,0,facing,.14,0),3);
 const c=new DunkControls();for(let i=0;i<30;i++)assert.notEqual(c.choose(.9,-.9,facing,i/240,0),5,'holding diagonal is not a rotation');
}
console.log('Dunk sequences passed: up-down clutch and back-up-forward 360 in both facings, lock/reset and diagonal rejection');
