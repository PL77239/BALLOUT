const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),port=47745,out='/tmp/ballout-famous';fs.mkdirSync(out,{recursive:true});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<80;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:854,height:480}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const id of ['brooklyn','rucker','venice','pigalle','dyckman','tenement','mosswood','kalemegdan']){
   await page.goto(`http://127.0.0.1:${port}/?auto=${id}&mode=1p&level=rookie`);await page.waitForFunction(id=>window.__g?.cfg.court===id,id);
   const checks=await page.evaluate(async id=>{
    const {bossesFor}=await import('/src/bosses.ts'),{T}=await import('/src/tuning.ts'),{music}=await import('/src/music.ts');
    const g=window.__g;g.phase='point';g.pointCountdown=99;g.pointCountShown=99;g.banner.setAlpha(0);g.bannerSub.setAlpha(0);
    g.hoopers[0].x=T.hoop.x-430;g.hoopers[1].x=T.hoop.x-245;
    const manifest=await music.load();return {rivals:bossesFor(id).length,bgm:Array.isArray(manifest.lists[id])};
   },id);
   assert.equal(checks.rivals,6);assert(checks.bgm,`${id}: BGM directory indexed`);
   await page.waitForTimeout(160);await page.screenshot({path:path.join(out,`${id}.png`)});console.log(`${id}: scene, six rivals, BGM folder OK`);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
