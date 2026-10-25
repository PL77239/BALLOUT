import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + '\n' + e.stack));
await page.goto('http://127.0.0.1:47731/?auto=1&court=' + (process.argv[2] || 'harlem') + '&to=' + (process.argv[3] || 7));
await page.waitForFunction(() => window.__g, null, { timeout: 30000 });
const res = await page.evaluate(async (maxSec) => {
  const g = window.__g;
  const counts = {};
  const orig = g.popupAt.bind(g);
  g.popupAt = (h, text, c, s) => { const k = text.replace(/ x\d+/, ''); counts[k] = (counts[k] || 0) + 1; orig(h, text, c, s); };
  const origFx = g.fx.popup.bind(g.fx);
  g.fx.popup = (x, y, text, ...r) => { const k = text.replace(/\s+\+\d+/, ''); counts[k] = (counts[k] || 0) + 1; origFx(x, y, text, ...r); };
  const oL = g.launchShot.bind(g); g.launchShot = (h, q) => { counts['_shots'] = (counts['_shots'] || 0) + 1; if (q.perfect) counts['_perfect'] = (counts['_perfect'] || 0) + 1; oL(h, q); };
  let frames = 0, stuckT = 0, lastKey = '';
  let maxStuck = 0;
  while (g.phase !== 'over' && frames < maxSec * 60) {
    g.update(0, 1000 / 60); frames++;
    const key = g.hoopers.map((h) => `${Math.round(h.x / 20)}${h.act}`).join() + g.ball.mode + Math.round(g.ball.x / 20);
    if (key === lastKey) { stuckT += 1 / 60; maxStuck = Math.max(maxStuck, stuckT); } else { stuckT = 0; lastKey = key; }
  }
  return { phase: g.phase, sec: Math.round(frames / 60), score: g.hoopers.map((h) => h.score), counts, maxStuck: +maxStuck.toFixed(1) };
}, 400);
console.log(JSON.stringify(res, null, 1));
console.log(errors.join('\n') || 'no errors');
await browser.close();
