import { chromium } from 'playwright-core';

// usage: node scripts/shot.mjs '<query>' out.png waitMs [key:holdMs ...]
// env: EVAL=js to print a value, CLIP=x,y,w,h (screen px at 1280x720) and DSF=n to zoom into a region.
const [,, query = '', out = 'shots/a.png', wait = '2500', ...keys] = process.argv;
const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: +(process.env.DSF || 1) });
const errors = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('404')) errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '')));
await page.goto(`http://127.0.0.1:47731/${query}`);
await page.waitForTimeout(+wait);
for (const k of keys) {
  const [key, ms = '100'] = k.split(':');
  await page.keyboard.down(key);
  await page.waitForTimeout(+ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(60);
}
if (process.env.EVAL) console.log(JSON.stringify(await page.evaluate(process.env.EVAL)));
const opt = { path: out };
if (process.env.CLIP) { const [x, y, width, height] = process.env.CLIP.split(',').map(Number); opt.clip = { x, y, width, height }; }
await page.screenshot(opt);
console.log(errors.length ? errors.slice(0, 8).join('\n') : 'no console errors');
await browser.close();
