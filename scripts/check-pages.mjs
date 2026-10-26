import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const base = process.env.VITE_BASE || './';
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const modules = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
assert(modules.length > 0, 'Built HTML needs a JavaScript entry point');
for (const src of modules) {
  assert(src.startsWith(base), `Module URL must start with ${base}: ${src}`);
  assert(/\.js$/.test(src), `Publish compiled JavaScript, not TypeScript: ${src}`);
  const path = resolve(root, src.slice(base.length));
  assert(path.startsWith(root + '/'), 'Asset must stay within dist');
  await access(path);
}
await access(resolve(root, 'audio/bgm/manifest.json'));
console.log(`Pages build verified: ${modules.join(', ')} and audio manifest`);
