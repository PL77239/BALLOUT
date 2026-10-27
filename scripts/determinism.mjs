import { chromium } from 'playwright-core';

// usage: node scripts/determinism.mjs [court] [seed]
// Plays the same seeded CPU-vs-CPU match at several render frame rates and checks that the outcome is identical.
const court = process.argv[2] || 'harlem', seed = process.argv[3] || '1234';
const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const runs = [];
for (const fps of [30, 60, 144, 'jitter']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:47731/?mode=sim&auto=${court}&target=5&level=hooper&seed=${seed}`);
  await page.waitForFunction(() => window.__g, null, { timeout: 30000 });
  const res = await page.evaluate(async (fps) => {
    const g = window.__g;
    let n = 0, t = 0;
    const snap = {};
    const step = g.simStep.bind(g);
    g.simStep = () => {
      step();
      if (g.tick === 1500 || g.tick === 3000) snap[g.tick] = { score: g.hoopers.map((h) => h.score), ball: [g.ball.x, g.ball.h], pos: g.hoopers.map((h) => [h.x, h.z, h.puppet.cur.fHx]), stam: g.hoopers.map((h) => h.stamina) };
    };
    while (g.tick < 3100 && t < 600) {
      const dt = fps === 'jitter' ? 4 + ((n * 7919) % 29) : 1000 / fps;
      g.update(0, dt); t += dt / 1000; n++;
    }
    return { snap, seed: g.replay().seed, inputs: g.replay().log.length };
  }, fps);
  runs.push({ fps, ...res });
  console.log(String(fps).padEnd(7), JSON.stringify(res.snap[3000].score), 'ball', res.snap[3000].ball.map((v) => v.toFixed(2)).join(','));
  await page.close();
}
const diff = (k) => runs.map((r) => JSON.stringify(r.snap[k]));
if (process.env.DBG) console.log(diff(1500).join('\n'));
const same = runs.every((r) => JSON.stringify(r.snap) === JSON.stringify(runs[0].snap));
console.log(same ? 'DETERMINISTIC: all runs match' : 'MISMATCH between runs');
await browser.close();
process.exit(same ? 0 : 1);
