import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// usage: node scripts/audio-manifest.mjs [--force]
// Scans public/audio/bgm/{menu,stingers,courts/<id>}/*.mp3, measures integrated loudness with ffmpeg (EBU R128)
// and writes public/audio/bgm/manifest.json. The files themselves are never modified: the game applies the
// per-track gain at playback so every track lands at the same loudness. Re-run after adding or replacing tracks.

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL('../public/audio/bgm/', import.meta.url));
const OUT = join(ROOT, 'manifest.json');
const TARGET = -16;
const MIN_GAIN = -14, MAX_GAIN = 9;
const scanOnly=process.argv.includes('--scan-only');
const force = process.argv.includes('--force');

const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { lists: {} };
const known = new Map();
for (const list of Object.values(old.lists ?? {})) for (const t of list) known.set(t.f, t);

const lists = {};
const jobs = [];
const dirs = [['menu', 'menu'], ['stingers', 'stingers']];
const courtsDir = join(ROOT, 'courts');
if (existsSync(courtsDir)) for (const d of readdirSync(courtsDir).sort()) if (statSync(join(courtsDir, d)).isDirectory()) dirs.push([d, `courts/${d}`]);

for (const [key, dir] of dirs) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;
  lists[key] = [];
  for (const file of readdirSync(abs).sort()) {
    if (!/\.(mp3|ogg|m4a|wav)$/i.test(file)) continue;
    const full = join(abs, file), f = relative(ROOT, full).split('\\').join('/');
    const size = statSync(full).size;
    const prev = known.get(f);
    const entry = prev && prev.size === size && !force && (scanOnly || typeof prev.lufs==='number') ? prev : null;
    const slot = { f, size, gain: 0 };
    lists[key].push(slot);
    if (entry) Object.assign(slot, entry);
    else jobs.push({ slot, full });
  }
}

async function measure(job) {
  if(scanOnly)return;
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', job.full, '-af', `loudnorm=I=${TARGET}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { maxBuffer: 1 << 26 });
  const j = JSON.parse(stderr.slice(stderr.lastIndexOf('{')));
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', job.full]);
  const lufs = +j.input_i, tp = +j.input_tp;
  const gain = Math.max(MIN_GAIN, Math.min(MAX_GAIN, TARGET - lufs));
  Object.assign(job.slot, { lufs: +lufs.toFixed(1), tp: +tp.toFixed(1), gain: +gain.toFixed(1), dur: Math.round(+stdout.trim()) });
  console.log(`${job.slot.f}  ${lufs.toFixed(1)} LUFS  -> ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB`);
}

const queue = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => { for (let j = queue.shift(); j; j = queue.shift()) await measure(j); }));

writeFileSync(OUT, JSON.stringify({ target: TARGET, lists }, null, 1) + '\n');
const n = Object.values(lists).reduce((s, l) => s + l.length, 0);
console.log(`manifest: ${n} tracks (${jobs.length} ${scanOnly ? 'new entries indexed' : 'measured'}) -> ${relative(process.cwd(), OUT)}`);
