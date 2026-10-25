import { chromium } from 'playwright-core';
const court = process.argv[2] || 'brooklyn';
const look = process.argv[3] || '0';
const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + '\n' + e.stack));
await page.goto(`http://127.0.0.1:47731/?auto=1&court=${court}&l1=${look}&l2=${(+look + 1) % 4}`);
await page.waitForFunction(() => window.__g && window.__g.phase, null, { timeout: 30000 });
await page.evaluate(() => { window.__phaser.loop.sleep(); const g = window.__g; g.brains = [null, null]; g.ctrls = [null, null]; g.phase = 'live'; g.fx.popup = () => {}; });
const scenes = {
  run: `P.x=520;P.z=0;P.vx=300;P.vz=0;O.x=760;O.z=0;I0.mx=1;I0.sprint=true;N=14;`,
  idle: `P.x=520;O.x=640;N=10;`,
  shoot55: `P.x=640;O.x=740;I0.shootDown=true;N=1;`,
  shoot80: `P.x=640;O.x=900;I0.shootDown=true;N=1;`,
  cross: `P.x=560;O.x=700;I0.a=true;I0.mz=-1;N=7;`,
  spin: `P.x=560;O.x=700;I0.b=true;I0.mz=1;N=9;`,
  btb: `P.x=560;O.x=700;I0.c=true;I0.mz=1;N=9;`,
  fall: `P.x=560;O.x=640;O.knock('fall',-1,170);N=12;`,
  dunk: `P.x=900;O.x=1000;P.hasBall=true;P.startDunk(g);N=25;`,
  fire: `P.x=560;O.x=700;P.fireT=10;P.heat=100;I0.mx=1;I0.sprint=true;P.vx=300;N=20;`,
  dunk2: `P.x=900;O.x=1000;P.hasBall=true;P.comboN=2;P.comboT=g.gt;P.startDunk(g);N=18;`,
  block: `P.x=600;O.x=700;O.I.shootDown=true;N=1;`,
  swipe: `P.x=600;O.x=700;O.startSwipe();N=9;`,
  shove: `P.x=640;O.x=700;O.startShove(g);N=10;`,
};
const names = process.argv[4] ? process.argv[4].split(',') : Object.keys(scenes);
for (const n of names) {
  await page.evaluate(({ code, n }) => {
    const g = window.__g, ph = window.__phaser;
    g.resetPositions(0); g.phase = 'live';
    const P = g.hoopers[0], O = g.hoopers[1];
    const mk = () => ({ mx: 0, mz: 0, sprint: false, shootHeld: false, shootDown: false, shootUp: false, a: false, b: false, c: false, shove: false, checkHeld: false });
    const I0 = mk(); let N = 6;
    P.h = 0; O.h = 0;
    eval(code);
    window.__N = N;
    const step = (I) => { ph.step(performance.now(), 16.7); };
    P.I = I0;
    // drive P with I0 for first frame (edges), then clear edges
    g.hoopers[0].update = ((orig) => function (dt, I, gg) { return orig.call(this, dt, window.__I0, gg); })(g.hoopers[0].update.__orig || Object.getPrototypeOf(g.hoopers[0]).update);
    window.__I0 = I0;
    for (let i = 0; i < N; i++) {
      step();
      I0.shootDown = false; I0.a = false; I0.b = false; I0.c = false;
      if (n === 'shoot55' && P.meter >= 0.5) break;
    }
    if (n === 'shoot80') { while (P.meter < 0.8) { step(); I0.shootDown = false; } }
    if (n === 'shoot55') { while (P.meter < 0.5) { step(); I0.shootDown = false; } }
    if (n === 'block') { for (let i = 0; i < 9; i++) step(); }
  }, { code: scenes[n], n });
  const cx = n.startsWith('dunk') ? 660 : 380;
  await page.screenshot({ path: `shots/pose_${n}.png`, clip: { x: cx, y: 150, width: 620, height: 530 } });
}
console.log(errors.join('\n') || 'no errors');
await browser.close();
