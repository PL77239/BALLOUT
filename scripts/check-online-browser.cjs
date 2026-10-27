// Browser integration check using an in-process test transport. This does not
// certify public PeerJS/STUN/TURN reachability or connectivity between real ISPs.
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const path=require('node:path');
const peerStub=`
class Emitter {listeners={};on(k,f){(this.listeners[k]??=[]).push(f);return this;}emit(k,v){for(const f of this.listeners[k]??[])f(v);}removeAllListeners(){this.listeners={};}}
class Conn extends Emitter {open=false;dataChannel={bufferedAmount:0};constructor(owner,id){super();this.owner=owner;this.id=id;}send(data){this.owner.channel.postMessage({to:this.id,from:this.owner.id,type:'data',data});}close(){if(!this.open)return;this.open=false;this.owner.channel.postMessage({to:this.id,from:this.owner.id,type:'close'});this.emit('close');}}
export default class Peer extends Emitter {
 constructor(id){super();this.id=typeof id==='string'?id:crypto.randomUUID();this.conns={};this.channel=new BroadcastChannel('ballout-browser-test');this.channel.onmessage=({data:m})=>{if(m.to!==this.id)return;if(m.type==='join'){const c=new Conn(this,m.from);this.conns[m.from]=c;this.emit('connection',c);c.open=true;this.channel.postMessage({to:m.from,from:this.id,type:'accept'});c.emit('open');}else{const c=this.conns[m.from];if(!c)return;if(m.type==='accept'){c.open=true;c.emit('open');}if(m.type==='data')c.emit('data',m.data);if(m.type==='close'){c.open=false;c.emit('close');}}};setTimeout(()=>this.emit('open',this.id),20);}
 connect(id){const c=new Conn(this,id);this.conns[id]=c;this.channel.postMessage({to:id,from:this.id,type:'join'});return c;}
 destroy(){for(const c of Object.values(this.conns))c.close();this.channel.close();}
}`;
(async()=>{
 const port=47739;
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
 let browser;
 try {
  for(let i=0;i<50;i++){try{const r=await fetch(`http://127.0.0.1:${port}`);if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
  const context=await browser.newContext({viewport:{width:1000,height:700}});
  await context.route('**/node_modules/.vite/deps/peerjs.js*',route=>route.fulfill({contentType:'application/javascript',body:peerStub}));
  await context.addInitScript(()=>{Object.defineProperty(document,'hidden',{get:()=>false});Object.defineProperty(document,'visibilityState',{get:()=> 'visible'});});
  const a=await context.newPage(),b=await context.newPage(),errors=[];
  for(const p of [a,b]){
   p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${port}/`);
   await p.waitForFunction(()=>window.__phaser?.scene?.getScene('menu')?.sys.isActive());
   await p.evaluate(async host=>{const m=window.__phaser.scene.getScene('menu');if(host){const {save}=await import('/src/save.ts');save().career.attributes.shooting=95;save().career.equipped=['sniper'];save().career.totals.greens=100;const {buildLoadout,STARTER_EQUIP}=await import('/src/loadout.ts');m.myLook=()=>buildLoadout({...STARTER_EQUIP,top:'sw.hoodie.syrup.black',bottom:'sw.camo.wide.urban',head:'sw.head.lakers.fullcap',shoes:'sw.aj.12.0',chain:'sw.chain.dogtag.gold',wrist:'sw.watch.iced.steel',face:'sw.face.beardblunt'});}m.cfg.mode='online';m.startGame();},p===a);
  }
  await a.click('#net-host');await a.waitForFunction(()=>document.querySelector('#net-status').textContent.startsWith('ROOM:'));
  const room=(await a.locator('#net-status').textContent()).match(/ROOM: ([A-Z2-9]{6})/)[1];
  await b.fill('#net-code',room);await b.click('#net-join');
  for(const p of [a,b])await p.waitForFunction(()=>window.__g?.cfg.netRole);
  await a.waitForFunction(()=>window.__g.phase==='live');
  assert(await a.evaluate(()=>window.__g.hoopers[0].stats.accuracy===54&&window.__g.hoopers[0].careerBonus.green===0),'PvP ignores campaign grind');
  assert.equal(await b.evaluate(()=>window.__g.hoopers[0].loadout.shoeModel),12,'guest receives new item details');
  assert.equal(await b.evaluate(()=>window.__g.hoopers[0].loadout.watchStyle),'iced');
  const before=await a.evaluate(()=>window.__g.hoopers[1].z);
  await b.keyboard.down('w');await b.waitForTimeout(600);await b.keyboard.up('w');await a.waitForTimeout(250);
  const zA=await a.evaluate(()=>window.__g.hoopers[1].z),zB=await b.evaluate(()=>window.__g.hoopers[1].z);
  assert(Math.abs(zA-before)>10,'guest movement reaches host physics');assert(Math.abs(zA-zB)<20,'guest converges to host');
  assert.deepEqual(await a.evaluate(()=>window.__g.hoopers.map(h=>h.isCpu)),[false,false]);
  // Held skill input must survive the real guest->host input pipeline.
  await a.evaluate(()=>{const g=window.__g,h=g.hoopers[1],d=g.hoopers[0];g.phase='live';g.needsClear=false;g.cleared=true;h.reset(550,0,true);h.stamina=100;d.reset(1050,50,false);d.act='fall';d.actDur=99;g.ball.mode='held';g.ball.owner=h;g.ball.setHeld(h.x+32,0,50);});
  await b.keyboard.down('j');await a.waitForFunction(()=>window.__g.hoopers[1].act==='juke'&&window.__g.hoopers[1].moveKind==='hesi');
  await b.waitForFunction(()=>window.__g.hoopers[1].moveKind==='hesi');await b.keyboard.up('j');
  assert.equal(await a.evaluate(()=>window.__g.hoopers[1].comboN),1,'remote hold triggers one paid hesitation');
  await b.evaluate(()=>{const fx=window.__g.fx,real=fx.dunkReward.bind(fx);window.__dunkStyle=null;fx.dunkReward=(...args)=>{window.__dunkStyle=args[2];return real(...args);};});
  await a.evaluate(()=>{const g=window.__g,h=g.hoopers[1];h.dunkStyle=5;h.x=1060;h.h=100;g.hoopers[0].x=500;g.dunkHit(h,false);});
  await b.waitForFunction(()=>window.__dunkStyle===5);
  // A green score must also deliver its short visual reward to the guest.
  await b.evaluate(()=>{const fx=window.__g.fx,ring=fx.ring.bind(fx);window.__greenPulse=false;window.__rimReward=null;const reward=fx.rimReward.bind(fx);fx.rimReward=(...args)=>{window.__rimReward=args[2];return reward(...args);};fx.ring=(...args)=>{if(args[2]===0x66ffb0)window.__greenPulse=true;return ring(...args);};});
  // Force a real winning bucket through the host score handler; guest must see it.
  await a.evaluate(()=>{const g=window.__g;g.phase='live';g.hoopers[0].score=g.cfg.target-1;g.onScore({shooter:g.hoopers[0],pts:1,perfect:true,dunk:false,touchedRim:false},true);});
  await b.waitForFunction(()=>window.__g.phase==='over'&&window.__g.hoopers[0].score>=window.__g.cfg.target);
  await b.waitForFunction(()=>window.__greenPulse && ['money','splash'].includes(window.__rimReward));
  assert.equal(await a.evaluate(()=>window.__g.result),null,'online match pays no campaign cash');
  assert.equal(await a.evaluate(async()=>{const {save}=await import('/src/save.ts');return save().career.xp;}),0,'casual PvP awards no career XP');
  await b.click('button:has-text("LEAVE ROOM")');
  await a.waitForFunction(()=>document.body.textContent.includes('Opponent left')||document.body.textContent.includes('Connection closed'));
  assert.deepEqual(errors,[]);
  console.log('Online browser integration passed (test transport): lobby, P2 input, snapshots, score, shared green reward, no rewards, disconnect');
 } finally {await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
