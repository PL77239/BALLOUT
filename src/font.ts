import Phaser from 'phaser';
import { Col, PX, Pix, pixTexture } from './pixel';

const G: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '..', '.#', '.#', '#.'],
  ':': ['.', '.', '#', '.', '.', '#', '.'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '"': ['#.#', '#.#', '...', '...', '...', '...', '...'],
  '(': ['..#', '.#.', '#..', '#..', '#..', '.#.', '..#'],
  ')': ['#..', '.#.', '..#', '..#', '..#', '.#.', '#..'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  $: ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  '<': ['...#', '..#.', '.#..', '#...', '.#..', '..#.', '...#'],
  '>': ['#...', '.#..', '..#.', '...#', '..#.', '.#..', '#...'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  _: ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
  '^': ['..#..', '.###.', '#####', '.....', '.....', '.....', '.....'],
  '|': ['#', '#', '#', '#', '#', '#', '#'],
  '{': ['.....', '....#', '...#.', '#.#..', '.#...', '.....', '.....'],
  '}': ['.###.', '#...#', '#...#', '#####', '##.##', '##.##', '#####'],
  '~': ['.###.', '#.#.#', '##.##', '#.#.#', '.###.', '.....', '.....'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'],
};

const CHARS = Object.keys(G).join('');
const CELL_W = 8, CELL_H = 10, PER_ROW = 16;

const glyph = (ch: string) => G[ch.toUpperCase()] ?? G['?'];
const adv = (ch: string) => glyph(ch)[0].length + 1;

export function textWidth(s: string, scale = 1) {
  let w = 0;
  for (const ch of s) w += adv(ch);
  return Math.max(0, w - 1) * scale;
}

/** Draw text straight into a Pix (for painted signs / graffiti). */
export function drawText(p: Pix, x: number, y: number, s: string, c: Col, outline: Col | null = null, scale = 1) {
  let cx = Math.round(x);
  for (const ch of s) {
    const g = glyph(ch);
    for (let j = 0; j < g.length; j++) {
      for (let i = 0; i < g[j].length; i++) {
        if (g[j][i] !== '#') continue;
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) p.set(cx + i * scale + sx, Math.round(y) + j * scale + sy, c);
      }
    }
    cx += adv(ch) * scale;
  }
  if (outline !== null) p.outline(outline, true);
}

/** Register the pixel bitmap font ('font5': white glyphs with a black 1px outline, tint it for colour). */
export function ensureFont(scene: Phaser.Scene) {
  if (scene.cache.bitmapFont.exists('font5')) return;
  const rows = Math.ceil(CHARS.length / PER_ROW);
  const sheet = new Pix(CELL_W * PER_ROW, CELL_H * rows);
  [...CHARS].forEach((ch, i) => {
    const ox = (i % PER_ROW) * CELL_W, oy = Math.floor(i / PER_ROW) * CELL_H;
    const g = G[ch];
    for (let j = 0; j < g.length; j++) for (let k = 0; k < g[j].length; k++) if (g[j][k] === '#') sheet.set(ox + 1 + k, oy + 1 + j, 0xffffff);
  });
  const fills = sheet.px.slice();
  sheet.outline(0x000000, true);
  for (let i = 0; i < fills.length; i++) if (fills[i] >>> 24) sheet.px[i] = fills[i];
  pixTexture(scene, 'font5', sheet);
  const entry = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: 'font5', width: CELL_W, height: CELL_H, chars: CHARS, charsPerRow: PER_ROW,
    'spacing.x': 0, 'spacing.y': 0, lineSpacing: 0, 'offset.x': 0, 'offset.y': 0,
  } as Phaser.Types.GameObjects.BitmapText.RetroFontConfig) as unknown as { data: { chars: Record<number, unknown> } };
  [...CHARS].forEach((ch) => { (entry.data.chars[ch.charCodeAt(0)] as unknown as { xAdvance: number }).xAdvance = adv(ch); });
  scene.cache.bitmapFont.add('font5', entry);
}

export interface LabelOpts { k?: number; ox?: number; oy?: number; depth?: number; align?: 'left' | 'center' | 'right' }

/** Pixel-font label. Position is in world units; k = integer art-pixel scale. */
export function label(scene: Phaser.Scene, x: number, y: number, s: string, color = 0xffffff, o: LabelOpts = {}) {
  ensureFont(scene);
  const t = scene.add.bitmapText(x, y, 'font5', s.toUpperCase());
  t.setScale(PX * (o.k ?? 1)).setTint(color).setOrigin(o.ox ?? 0, o.oy ?? 0);
  if (o.depth !== undefined) t.setDepth(o.depth);
  if (o.align === 'center') t.setCenterAlign(); else if (o.align === 'right') t.setRightAlign();
  return t;
}
