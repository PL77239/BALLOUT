// Capture spring-driven ankle-break frames in the actual game scene.
const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const port=47744,root=path.resolve(__dirname,'..'),out='/tmp/ballout-bis-fall';fs.mkdirSync(out,{recursive:true});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/?auto=brooklyn&mode=1p`);await page.waitForFunction(()=>window.__g?.hoopers?.length===2);
  await page.evaluate(async()=>{const {T}=await import('/src/tuning.ts');const g=window.__g,h=g.hoopers[0],d=g.hoopers[1];g.phase='point';g.pointCountdown=99;g.pointCountShown=99;g.banner.setAlpha(0);g.bannerSub.setAlpha(0);h.x=T.hoop.x-440;d.x=h.x+250;d.act='fall';d.actDur=1.15;d.actT=0;d.facing=-1;d.puppet.setFacing(-1);g.ball.setHeld(h.x+25,0,32);});
  for(let i=0;i<24;i++){
   await page.evaluate(async i=>{const {poseOf}=await import('/src/anim.ts');const g=window.__g,d=g.hoopers[1];for(let n=0;n<3;n++){d.actT=(i*3+n)/60;const pose=poseOf(d,g,1/60);d.puppet.simulate(pose.rig,1/60,{f:pose.pinF,b:pose.pinB},{f:0,h:0});}d.puppet.paint();},i);
   await page.screenshot({path:path.join(out,`${String(i).padStart(2,'0')}.png`),clip:{x:300,y:145,width:540,height:320}});
  }
  if(errors.length)throw Error(errors.join('\n'));console.log('Captured 24 ankle-break frames');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
