import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/local/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://127.0.0.1:47731/?mode=sim&auto=' + process.argv[2]);
await page.waitForFunction(() => window.__g && window.__g.phase === 'live', null, { timeout: 30000 });
const r = await page.evaluate(() => { const g = window.__g; window.__phaser.loop.sleep(); const t0 = performance.now(); for (let i = 0; i < 300; i++) g.update(0, 16.7); return (performance.now() - t0) / 300; });
console.log(process.argv[2], 'ms/update', r.toFixed(2));
await browser.close();
