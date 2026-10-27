const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),port=47749,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1281,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>window.__phaser?.scene?.getScene('menu')?.sys.isActive());
  await page.evaluate(async()=>{const {save,persist}=await import('/src/save.ts');const c=save().career;c.attributes.shooting=68;c.points=4;c.xp=600;c.rankPoints=150;c.rank=1;c.totals.greens=12;c.equipped=['sniper'];persist();const m=window.__phaser.scene.getScene('menu');m.screen='career';m.sel=11;m.build();});
  await page.keyboard.press('Enter',{delay:80});await page.waitForTimeout(130);
  assert(await page.evaluate(async()=>{const {save}=await import('/src/save.ts');const c=save().career;return c.attributes.shooting===60&&c.points===12&&c.xp===600&&c.rankPoints===150&&c.equipped[0]==='sniper';}),'menu resets only attributes and refunds all points');
  await page.screenshot({path:path.join(root,'docs/myplayer-reset.png')});
  await page.reload();await page.waitForFunction(()=>window.__phaser?.scene?.getScene('menu')?.sys.isActive());
  assert.equal(await page.evaluate(async()=>(await import('/src/save.ts')).save().career.points),12,'refund persists');
  await page.evaluate(async()=>{const {Crowd}=await import('/src/crowd.ts');const real=Crowd.prototype.update;Crowd.prototype.update=function(...args){window.__crowd=this;return real.apply(this,args);};const m=window.__phaser.scene.getScene('menu');m.cfg.court='pigalle';m.startGame();});await page.waitForFunction(()=>window.__g?.cfg.court==='pigalle'&&window.__crowd);
  assert(await page.evaluate(()=>new Set(window.__crowd.fans.map(f=>f.view)).size>1),'different viewing directions');
  await page.evaluate(()=>{const g=window.__g;g.phase='point';g.pointCountdown=99;g.pointCountShown=99;g.banner.setAlpha(0);g.bannerSub.setAlpha(0);for(let i=0;i<350;i++)g.court.update(i*.1,.1);});
  await page.screenshot({path:path.join(root,'docs/pigalle-ambient.png')});
  // Exercise actual keyboard sequences while in flight at a controlled slow simulation speed.
  const launch=async()=>page.evaluate(async()=>{const {T}=await import('/src/tuning.ts');const g=window.__g,h=g.hoopers[0],d=g.hoopers[1];g.phase='live';g.timeScale=.25;g.brains=[null,null];g.needsClear=false;g.cleared=true;h.reset(T.hoop.x-130,0,true);d.reset(500,60,false);g.ball.owner=h;g.ball.mode='held';g.ball.setHeld(h.x+32,0,60);h.startDunk(g);});
  await launch();await page.keyboard.down('w');await page.waitForFunction(()=>window.__g.hoopers[0].dunkStyle===2);await page.waitForTimeout(220);await page.keyboard.up('w');await page.keyboard.down('s');await page.waitForFunction(()=>window.__g.hoopers[0].dunkStyle===4);await page.keyboard.up('s');
  await launch();await page.keyboard.down('a');await page.waitForFunction(()=>window.__g.hoopers[0].dunkStyle===1);await page.waitForTimeout(220);await page.keyboard.up('a');await page.keyboard.down('w');await page.waitForFunction(()=>window.__g.hoopers[0].dunkStyle===2);await page.waitForTimeout(220);await page.keyboard.up('w');await page.keyboard.down('d');await page.waitForFunction(()=>window.__g.hoopers[0].dunkStyle===5);await page.keyboard.up('d');
  await page.evaluate(()=>{const g=window.__g,h=g.hoopers[0];g.timeScale=1;g.phase='live';g.fx.notices=[];g.fx.pendingNotices=[];h.x=1000;h.z=0;h.h=110;h.dunkStyle=5;g.dunkHit(h,true);});await page.waitForTimeout(90);
  const notices=await page.evaluate(()=>window.__g.fx.notices);assert(notices.length>=2,'dunk creates multiple readable labels');
  for(let i=0;i<notices.length;i++)for(let j=i+1;j<notices.length;j++){const a=notices[i],b=notices[j];assert(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2,'text rise corridors do not overlap');}
  await page.screenshot({path:path.join(root,'docs/dunk-impact.png')});
  await page.waitForTimeout(2500);assert.equal(await page.evaluate(()=>window.__g.fx.pendingNotices.length),0,'burst queue drains');
  await page.goto(`http://127.0.0.1:${port}/?auto=venice&mode=1p&level=rookie`);await page.waitForFunction(()=>window.__g?.cfg.court==='venice');
  assert(await page.evaluate(()=>{const g=window.__g;g.phase='point';g.pointCountdown=99;g.pointCountShown=99;g.banner.setAlpha(0);g.bannerSub.setAlpha(0);for(let i=0;i<800;i++){g.court.update(i*.1,.1);if(g.children.list.some(o=>o.depth===-983&&o.visible&&o.x>500&&o.x<800))return true;}return false;}),'skater crosses visible backdrop');
  await page.screenshot({path:path.join(root,'docs/skate-coast.png')});
  assert.deepEqual(errors,[]);console.log('Polish browser passed: attribute reset and persistence, ambient variation, keyboard clutch/360, slam effects and separate text lanes');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
