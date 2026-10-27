// Capture a real in-engine spin, without editing the gameplay simulation.
const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const port=47743,root=path.resolve(__dirname,'..'),out='/tmp/ballout-bis-motion';fs.mkdirSync(out,{recursive:true});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/?auto=brooklyn&mode=1p`);await page.waitForFunction(()=>window.__g?.hoopers?.length===2);
  await page.evaluate(async()=>{const {T}=await import('/src/tuning.ts');const g=window.__g,h=g.hoopers[0],d=g.hoopers[1];g.phase='live';g.banner.setAlpha(0);g.bannerSub.setAlpha(0);g.needsClear=false;g.cleared=true;h.x=T.hoop.x-440;h.z=0;h.hasBall=true;d.x=h.x+250;d.act='fall';d.actDur=5;d.actT=0;g.ball.mode='held';g.ball.owner=h;h.setLoadout({...h.loadout,top:'bigTee',topColor:0x203550,topTrim:0xe5d6a1,topTexture:'tile:stars',bottom:'jeans',bottomColor:0x354967});});
  await page.waitForTimeout(250);
  await page.evaluate(()=>window.__g.hoopers[0].startMove('spin',window.__g));
  for(let i=0;i<16;i++){await page.screenshot({path:path.join(out,`${String(i).padStart(2,'0')}.png`),clip:{x:250,y:145,width:460,height:320}});await page.waitForTimeout(25);}
  if(errors.length)throw Error(errors.join('\n'));console.log('Captured 16 gameplay frames');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
