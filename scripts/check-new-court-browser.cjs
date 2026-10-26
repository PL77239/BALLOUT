const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const port=47740,server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await browser.newPage({viewport:{width:1100,height:700}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/?auto=marseille&mode=1p&level=rookie`);await p.waitForFunction(()=>window.__g?.cfg.court==='marseille');
  await p.evaluate(async()=>{const {T}=await import('/src/tuning.ts');const g=window.__g;g.phase='live';g.needsClear=false;g.cleared=true;const h=g.hoopers[0],d=g.hoopers[1];Object.assign(h,{x:T.hoop.x-225,z:0,h:0,stamina:100,hasBall:true,act:'free'});Object.assign(d,{x:h.x-90,z:0,hasBall:false,act:'fall',actT:0,actDur:5});});
  await p.keyboard.down('l');
  await p.evaluate(async()=>{const {T}=await import('/src/tuning.ts');const h=window.__g.hoopers[0];h.x=T.hoop.x-205;h.act='free';});
  await p.waitForFunction(()=>window.__g.hoopers[0].act==='dunk');await p.keyboard.up('l');
  await p.goto(`http://127.0.0.1:${port}/?auto=warsaw&mode=1p`);await p.waitForFunction(()=>window.__g?.cfg.court==='warsaw');await p.click('canvas');
  await p.waitForFunction(async()=>{const {music}=await import('/src/music.ts');return music.el?.src.includes('courts/warsaw/')&&music.el.readyState>=2;});
  const track=await p.evaluate(async()=>{const {music}=await import('/src/music.ts');return {src:music.el.src,ready:music.el.readyState,tracks:(await music.load()).lists.warsaw.length};});
  assert.equal(track.tracks,2);assert.deepEqual(errors,[]);console.log('Browser checks passed: Marseille scene, held dunk, Warsaw MP3 decoded',track.src);
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
