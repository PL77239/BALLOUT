import { chromium } from 'playwright-core';
const scenario = process.argv[2] || 'shot';
const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + e.stack));
await page.goto('http://127.0.0.1:47731/?mode=1p&auto=' + (process.argv[3] || 'brooklyn'));
await page.waitForFunction(() => window.__g && window.__g.phase === 'live', null, { timeout: 60000 });
const st = () => page.evaluate(() => { const g = window.__g; return { s: g.hoopers.map((h) => h.score), acts: g.hoopers.map((h) => h.act), m: g.hoopers[0].meter, x: g.hoopers.map((h) => Math.round(h.x)), ball: g.ball.mode, owner: g.ball.owner?.id }; });
const hold = async (k, cond) => { await page.keyboard.down(k); await page.waitForFunction(cond, null, { timeout: 30000, polling: 'raf' }); await page.keyboard.up(k); };
if (scenario === 'shot') {
  await hold('Space', () => window.__g.hoopers[0].meter >= 0.78);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/s1.png' });
  await page.waitForTimeout(3000);
  console.log(JSON.stringify(await st()));
  await page.screenshot({ path: 'shots/s2.png' });
}
if (scenario === 'shotmid') {
  await page.keyboard.down('Space');
  await page.waitForFunction(() => window.__g.hoopers[0].meter >= 0.55, null, { polling: 'raf', timeout: 30000 });
  await page.screenshot({ path: 'shots/s1.png' });
  await page.keyboard.up('Space');
  console.log(JSON.stringify(await st()));
}
if (scenario === 'moves') {
  await page.keyboard.down('KeyD'); await page.waitForTimeout(600);
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(250);
  await page.screenshot({ path: 'shots/m1.png' });
  await page.keyboard.press('KeyK'); await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/m2.png' });
  await page.keyboard.press('KeyL'); await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/m3.png' });
  console.log(JSON.stringify(await st()));
}
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
