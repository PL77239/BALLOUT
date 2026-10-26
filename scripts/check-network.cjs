const assert=require('node:assert/strict');
const {load}=require('./headless-art.cjs');
const {cleanIntent,RemoteInput}=load('net_protocol');
assert.equal(cleanIntent({mx:NaN,mz:0}),null);
assert.equal(cleanIntent({mx:0,mz:Infinity}),null);
assert.equal(cleanIntent(null),null);
assert.equal(cleanIntent({mx:9,mz:-4,a:1}).mx,1);
assert.equal(cleanIntent({mx:9,mz:-4,a:1}).mz,-1);
assert.equal(cleanIntent({mx:9,mz:-4,a:1}).a,false);
const q=new RemoteInput();
assert(q.receive(0,{mx:1,mz:0,shootHeld:true,shootDown:true},100));
assert(q.receive(1,{mx:1,mz:0,shootHeld:true},110));
assert(q.poll(115).shootDown,'tap survives multiple network messages before simulation');
assert(!q.poll(116).shootDown,'edge consumed once');
assert(q.poll(117).shootHeld,'held input persists');
assert(!q.receive(0,{mx:-1,mz:0},120),'old input rejected');
assert.equal(q.poll(120).mx,1);
assert.equal(q.poll(450).mx,0,'movement clears if guest stalls');
assert(!q.poll(450).shootHeld,'held shot clears on stall');
// Host must consume P2 network input even though P2 has no physical controller.
const {GameScene}=load('game');
const scene=Object.create(GameScene.prototype);
const received=[];
Object.assign(scene,{cfg:{mode:'2p',netRole:'host'},lastLogged:[-1,-1],inputLog:[],ctrls:[null,null],brains:[null,null],latch:[{mx:0,mz:0},{mx:1,mz:0,a:true}],phase:'live',timeScale:1,slowT:0,hitT:0,time_:0,tick:0,
 hoopers:[0,1].map(i=>({hasBall:false,update(dt,I){received[i]=I;},simPose(){}})),updateFacing(){},resolveBodies(){},blocks(){},ball:{mode:'loose',update(){}},pickups(){}});
scene.simStep();assert.equal(received[1].mx,1,'host sim consumes network player movement');assert(received[1].a,'network action reaches physics');
scene.simStep();assert(!received[1].a,'network action consumed once by sim');
// Test the actual network snapshot application with two minimal render-side players.
const guest=Object.create(GameScene.prototype);
const {restRig}=load('puppet');
Object.assign(guest,{netLastSeq:-1,guestTarget:null});
const snapshot={seq:1,time:2,phase:'live',players:[0,1].map(i=>({x:i*100,z:0,h:0,meter:0,score:0,rig:restRig(),carried:{x:0,z:0,h:20,depthBias:0},meterInfo:{green:.1,contest:0}})),ball:{x:0,z:0,h:20}};
guest.receiveNetworkState(snapshot);assert.equal(guest.guestTarget.seq,1);
guest.receiveNetworkState({...snapshot,seq:0});assert.equal(guest.guestTarget.seq,1,'old snapshot ignored');
guest.receiveNetworkState({...snapshot,seq:2,players:[]});assert.equal(guest.guestTarget.seq,1,'malformed snapshot ignored');
guest.receiveNetworkState({...snapshot,seq:2,time:NaN});assert.equal(guest.guestTarget.seq,1,'non-finite snapshot ignored');
console.log('Network checks passed: sanitization, held/edge latching, stale inputs, ordered finite snapshots');
