const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),port=47747,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1281,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>window.__phaser?.scene?.getScene('menu')?.sys.isActive());
  await page.keyboard.press('ArrowDown',{delay:100});await page.waitForTimeout(100);await page.keyboard.press('Enter',{delay:100});await page.waitForTimeout(100);await page.waitForFunction(()=>window.__phaser.scene.getScene('menu').screen==='career');
  await page.keyboard.press('ArrowRight',{delay:100});await page.waitForTimeout(100);
  const data=await page.evaluate(async()=>{const {save,persist}=await import('/src/save.ts');const c=save().career;const first={shooting:c.attributes.shooting,points:c.points};c.totals.greens=12;c.totals.games=10;c.attributes.shooting=68;c.xp=900;c.points=7;c.rankPoints=300;c.rank=2;persist();const m=window.__phaser.scene.getScene('menu');m.sel=6;m.build();return first;});
  assert.equal(data.shooting,61);assert.equal(data.points,5);
  await page.keyboard.press('Enter',{delay:100});await page.waitForTimeout(100);assert(await page.evaluate(async()=>{const {save}=await import('/src/save.ts');return save().career.equipped.includes('sniper');}));
  await page.screenshot({path:path.join(root,'docs/myplayer.png')});
  await page.keyboard.press('Backspace',{delay:100});await page.waitForTimeout(100);await page.keyboard.press('Enter',{delay:100});await page.waitForTimeout(100);await page.waitForFunction(()=>window.__phaser.scene.getScene('menu').screen==='play');
  await page.evaluate(()=>window.__phaser.scene.getScene('menu').startGame());await page.waitForFunction(()=>window.__g?.hoopers?.length===2);
  assert(await page.evaluate(()=>window.__g.hoopers[0].stats.accuracy>54&&window.__g.hoopers[0].careerBonus.green>0),'campaign stats and equipped badge reach gameplay');
  await page.evaluate(async()=>{const {T}=await import('/src/tuning.ts');const g=window.__g,h=g.hoopers[0],d=g.hoopers[1];g.phase='live';g.needsClear=false;g.cleared=true;h.x=T.hoop.x-130;h.z=0;h.act='free';h.hasBall=true;d.act='fall';d.actDur=5;d.actT=0;h.startDunk(g);});
  await page.waitForFunction(()=>window.__g.hoopers[0].act==='dunk'&&window.__g.hoopers[0].h>20);
  await page.keyboard.down('ArrowUp');await page.waitForFunction(()=>window.__g.hoopers[0].dunkStyle===2);await page.keyboard.up('ArrowUp');
  await page.evaluate(()=>{const g=window.__g;g.phase='over';g.winner=g.hoopers[0];g.finishMatch();});
  assert(await page.evaluate(()=>window.__g.result.career.xp>0));
  await page.reload();await page.waitForFunction(()=>window.__phaser?.scene?.getScene('menu')?.sys.isActive());
  assert(await page.evaluate(async()=>{const {save}=await import('/src/save.ts');return save().career.xp>0&&save().career.attributes.shooting===68;}),'career persists after reload');
  assert.deepEqual(errors,[]);console.log('Career browser passed: menu controls, upgrade, badge equip, campaign effects, match XP and persistence');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
