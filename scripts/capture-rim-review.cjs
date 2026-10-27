const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const root=path.resolve(__dirname,'..'),port=47746,out='/tmp/ballout-rim';fs.mkdirSync(out,{recursive:true});
 const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:854,height:480}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [style,tag] of [['money',2],['splash',4]]){
   await page.goto(`http://127.0.0.1:${port}/?auto=venice&mode=1p&level=rookie`);await page.waitForFunction(()=>window.__g?.hoopers?.length===2);
   await page.evaluate(tag=>{const g=window.__g;g.phase='live';g.rand=()=>tag/7+.001;g.onScore({shooter:g.hoopers[0],pts:1,dunk:false,perfect:true,touchedRim:false},true);},tag);
   for(let i=0;i<24;i++){await page.screenshot({path:path.join(out,`${style}-${String(i).padStart(2,'0')}.png`),clip:{x:594,y:30,width:260,height:300}});await page.waitForTimeout(25);}
  }
  if(errors.length)throw Error(errors.join('\n'));console.log('Captured score-triggered money and water effects');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
