import { chromium } from 'playwright-core';

const [,, query = '', out = 'shots/a.png', wait = '2500', ...keys] = process.argv;
const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`); });
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
await page.screenshot({ path: out });
console.log(errors.length ? errors.slice(0, 8).join('\n') : 'no console errors');
await browser.close();
