// Reproducible review image of the actual running game. Requires Chromium.
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path');
(async()=>{
 const port=47742,root=path.resolve(__dirname,'..');
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1200,height:675}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/?auto=brooklyn&mode=1p&level=rookie`);
  await page.waitForFunction(()=>window.__g?.hoopers?.length===2);
  await page.evaluate(async()=>{const {T}=await import('/src/tuning.ts');const g=window.__g;g.phase='point';g.pointCountdown=99;g.pointCountShown=99;g.banner.setAlpha(0);g.bannerSub.setAlpha(0);g.hoopers[0].x=T.hoop.x-440;g.hoopers[1].x=T.hoop.x-270;g.hoopers[1].facing=-1;g.ball.setHeld(g.hoopers[0].x+25,0,32);g.phase='live';g.hoopers[0].computeCarried(g);for(let i=0;i<30;i++)g.hoopers.forEach(h=>h.simPose(1/60,g));g.phase='point';g.hoopers[0].setLoadout({...g.hoopers[0].loadout,top:'bigTee',topColor:0x203550,topTrim:0xe5d6a1,topTexture:'tile:stars',bottom:'jeans',bottomColor:0x354967,bottomTexture:'stitch'});});
  await page.waitForTimeout(250);
  await page.screenshot({path:path.join(root,'docs/bis-in-game.png')});
  if(errors.length)throw Error(errors.join('\n'));
  console.log('Captured actual game screen: docs/bis-in-game.png');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
