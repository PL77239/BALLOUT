import { chromium } from 'playwright-core';
import fs from 'node:fs';

// usage: node scripts/sheet.mjs [court] [scene,scene,...] [stride] [cols]
// Steps the game deterministically and writes shots/sheet_<scene>.png: a strip of crops around player 1 (3x nearest scaled).
const court = process.argv[2] || 'brooklyn';
const only = process.argv[3] ? process.argv[3].split(',') : null;
const stride = +(process.argv[4] || 3);
const cols = +(process.argv[5] || 8);
const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + '\n' + e.stack));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:47731/?auto=${court}&mode=sim`);
await page.waitForFunction(() => window.__g && window.__g.phase, null, { timeout: 30000 });
await page.evaluate(() => { window.__phaser.loop.sleep(); const g = window.__g; g.brains = [null, null]; g.ctrls = [null, null]; g.phase = 'live'; g.fx.popup = () => {}; });
const scenes = {
  idle: { code: `P.x=520;O.x=700;N=40;`, other: true },
  run: { code: `P.x=420;P.z=0;P.vx=300;O.x=900;I0.mx=1;I0.sprint=true;N=60;` },
  dribble: { code: `P.x=520;P.vx=0;O.x=760;I0.mx=1;N=50;` },
  shoot: { code: `P.x=700;O.x=1000;I0.shootDown=true;N=1;` , hold: 34 },
  cross: { code: `P.x=560;O.x=700;I0.a=true;I0.mz=-1;N=34;` },
  spin: { code: `P.x=560;O.x=700;I0.b=true;I0.mz=1;N=36;` },
  btb: { code: `P.x=560;O.x=700;I0.c=true;I0.mz=1;N=36;` },
  fall: { code: `P.x=560;O.x=640;O.knock('fall',-1,170);N=1;`, swapFocus: true, long: 70 },
  dunk: { code: `P.x=900;O.x=1000;P.hasBall=true;P.startDunk(g);N=60;` },
  windmill: { code: `P.x=900;O.x=1000;P.hasBall=true;P.comboN=2;P.comboT=g.gt;P.startDunk(g);N=60;` },
  defend: { code: `P.x=700;O.x=560;O.hasBall=true;g.ball.owner=O;P.facing=-1;N=40;` },
  swipe: { code: `P.x=600;O.x=700;P.startSwipe();N=34;` },
  shove: { code: `P.x=640;O.x=700;P.startShove(g);N=34;` },
  hype: { code: `P.mood='hype';P.moodT=3;P.celeb=0;N=60;` },
  down: { code: `P.mood='down';P.moodT=3;g.phase='point';N=40;` },
};
const names = only || Object.keys(scenes);
for (const n of names) {
  const sc = scenes[n];
  const url = await page.evaluate(({ code, n, stride, cols, hold, long }) => {
    const g = window.__g, ph = window.__phaser;
    g.resetPositions(0); g.phase = 'live';
    const P = g.hoopers[0], O = g.hoopers[1];
    P.h = 0; O.h = 0; P.vx = P.vz = 0;
    const mk = () => ({ mx: 0, mz: 0, sprint: false, shootHeld: false, shootDown: false, shootUp: false, a: false, b: false, c: false, shove: false, checkHeld: false });
    const I0 = mk(); let N = 6;
    eval(code);
    const proto = Object.getPrototypeOf(P);
    if (!proto.__orig) proto.__orig = proto.update;
    P.update = function (dt, I, gg) { return proto.__orig.call(this, dt, window.__I0, gg); };
    O.update = function (dt, I, gg) { return proto.__orig.call(this, dt, window.__I1, gg); };
    window.__I0 = I0; window.__I1 = mk();
    const cv = document.querySelector('canvas');
    const W = 96, H = 80, S = 3;
    const total = long || N;
    const frames = Math.min(cols * 2, Math.ceil(total / stride));
    const rows = Math.ceil(frames / cols);
    const out = document.createElement('canvas'); out.width = cols * W * S; out.height = rows * H * S;
    const cx = out.getContext('2d'); cx.imageSmoothingEnabled = false; cx.fillStyle = '#222'; cx.fillRect(0, 0, out.width, out.height);
    let k = 0;
    for (let i = 0; i < total && k < frames; i++) {
      ph.step(performance.now(), 16.7);
      I0.shootDown = false; I0.a = false; I0.b = false; I0.c = false;
      if (hold && i === hold) I0.shootUp = true; else I0.shootUp = false;
      if (hold) I0.shootHeld = i < hold;
      if (i % stride === 0) {
        const px = Math.round(P.x / 3 - W / 2 + (n === 'fall' ? 30 : 0)), py = Math.round(P.sy / 3 - H + 14 - Math.max(0, P.h) / 3 * 0.0);
        cx.drawImage(cv, px, py, W, H, (k % cols) * W * S, Math.floor(k / cols) * H * S, W * S, H * S);
        k++;
      }
    }
    return out.toDataURL('image/png');
  }, { code: sc.code, n, stride, cols, hold: sc.hold || 0, long: sc.long || 0 });
  fs.writeFileSync(`shots/sheet_${n}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
console.log(errors.join('\n') || 'no errors');
await browser.close();
