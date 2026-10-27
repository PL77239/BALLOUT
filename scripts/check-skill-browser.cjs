const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),port=47748,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__pad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});});
  await page.goto(`http://127.0.0.1:${port}/?auto=brooklyn&mode=1p&level=rookie`);await page.waitForFunction(()=>window.__g?.hoopers?.length===2);
  const setup=async()=>{
   for(const key of ['j','k','l','w','a','s','d'])await page.keyboard.up(key);
   await page.evaluate(()=>{window.__pad.axes=[0,0,0,0];window.__pad.buttons.forEach(b=>b.pressed=false);});await page.waitForTimeout(80);
   await page.evaluate(()=>{const g=window.__g,h=g.hoopers[0],d=g.hoopers[1];g.phase='live';g.brains=[null,null];g.needsClear=false;g.cleared=true;g.banner.setAlpha(0);g.bannerSub.setAlpha(0);h.reset(580,0,true);h.stamina=100;d.reset(1050,50,false);d.act='fall';d.actDur=99;d.actT=0;g.ball.owner=h;g.ball.mode='held';g.ball.setHeld(h.x+32,0,50);});
  };
  await setup();await page.keyboard.down('j');await page.waitForFunction(()=>window.__g.hoopers[0].act==='juke'&&window.__g.hoopers[0].moveKind==='hesi');
  await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>window.__g.hoopers[0].comboN),1,'hold does not auto-repeat');
  await setup();await page.keyboard.down('a');await page.keyboard.press('j',{delay:60});await page.waitForFunction(()=>window.__g.hoopers[0].moveKind==='stepback');assert(await page.evaluate(()=>window.__g.hoopers[0].x<580),'backward key creates spacing');
  await setup();await page.keyboard.press('j',{delay:40});await page.waitForFunction(()=>window.__g.hoopers[0].act==='juke'&&window.__g.hoopers[0].moveKind==='cross');
  await setup();await page.keyboard.down('w');await page.keyboard.press('j',{delay:70});await page.keyboard.press('k',{delay:70});await page.waitForFunction(()=>window.__g.hoopers[0].comboN===2);assert.equal(await page.evaluate(()=>window.__g.hoopers[0].moveKind),'spin');
  await setup();await page.evaluate(()=>window.__pad.buttons[2].pressed=true);await page.waitForFunction(()=>window.__g.hoopers[0].act==='juke'&&window.__g.hoopers[0].moveKind==='hesi');
  await page.evaluate(()=>window.__pad.axes[0]=1);await page.waitForFunction(()=>window.__g.hoopers[0].vx>20);
  await setup();await page.evaluate(()=>{window.__pad.axes[0]=-1;window.__pad.buttons[2].pressed=true;});await page.waitForFunction(()=>window.__g.hoopers[0].act==='juke'&&window.__g.hoopers[0].moveKind==='stepback');
  await setup();await page.evaluate(()=>{const h=window.__g.hoopers[0];h.stamina=0;h.staminaDelay=.55;h.exhausted=true;});await page.keyboard.down('j');await page.waitForTimeout(650);assert.equal(await page.evaluate(()=>window.__g.hoopers[0].comboN),0);assert.equal(await page.evaluate(()=>window.__g.hoopers[0].stamina),0);
  await setup();await page.evaluate(()=>window.__g.setPaused(true));await page.screenshot({path:path.join(root,'docs/skill-controls.png')});
  assert.deepEqual(errors,[]);console.log('Skill browser passed: keyboard tap/hold/back/combo, actual pad mapping and held input, no fatigue bypass, pause help');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
