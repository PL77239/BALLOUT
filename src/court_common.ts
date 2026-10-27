import { Col, GW, Pix, mix, shade } from './pixel';
import { FY, FloorStyle, Scene2D, brick, halo, paintFloor, paintHoop, windows } from './courtkit';
import type { Ambient } from './courtkit';
import type { Live } from './courts';
import type { RegionId } from './loadout';

export interface CourtArt {
  seed: number;
  amb: Partial<Ambient>;
  crowdLook?: RegionId;
  net?: Col;
  paint(c: Scene2D): void;
  paintFloor(c: Scene2D): void;
  live?(L: Live, c: Scene2D): void;
}

/** Where each court's boombox stands on the fence line (art px, left edge of the sprite). The music is positioned here. */
export const BOOM_X: Record<string, number> = {
  rucker:80,venice:180,pigalle:30,dyckman:90,tenement:130,mosswood:185,kalemegdan:50,
  brooklyn: 168, queens: 70, harlem: 200, philly: 90, fairmount: 190, detroit: 192, atl: 140, la: 220, chicago: 190, chiraq: 200, warsaw: 180, marseille: 190,
};

export interface HoopStyle { board?: Col; pole?: Col; rim?: Col }

/** Floor + hoop + any props that must sit on top of the floor edge. */
export function finish(c: Scene2D, floor: FloorStyle, hoop: HoopStyle = {}, props?: () => void) {
  paintFloor(c, floor);
  props?.();
  paintHoop(c, hoop);
}

export function crop(src: Pix, x: number, y: number, w: number, h: number): Pix {
  const o = new Pix(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = src.get(x + i, y + j); if (v >= 0) o.set(i, j, v); }
  return o;
}

export interface BuildOpts { cols?: number; rows?: number; lit?: number; litC?: Col; cornice?: boolean; ox?: number; oy?: number; win?: Partial<Parameters<typeof windows>[5]>; trim?: Col }

/** Brick block with a cornice and a regular window grid. */
export function building(c: Scene2D, x: number, y: number, w: number, h: number, base: Col, o: BuildOpts = {}) {
  brick(c, x, y, w, h, base);
  if (o.cornice !== false) {
    c.base.rect(x - 1, y - 2, w + 2, 3, shade(base, 0.66));
    c.base.hline(x - 1, x + w, y - 2, shade(base, 1.2));
    c.base.hline(x - 1, x + w, y + 1, shade(base, 0.45));
  }
  const pitchX = 9, pitchY = 11;
  const cols = o.cols ?? Math.floor((w - 6) / pitchX), rows = o.rows ?? Math.floor((h - 12) / pitchY);
  const ox = o.ox ?? x + Math.floor((w - cols * pitchX + 4) / 2) + 1;
  windows(c, ox, y + (o.oy ?? 8), cols, rows, { lit: o.lit ?? 0.4, litC: o.litC, frame: o.trim ?? shade(base, 0.35), ...(o.win ?? {}) });
}

export function sneakersWire(c: Scene2D, x0: number, x1: number, y: number, sag = 5, n = 1, col: Col = 0xe8e8ee) {
  const P = c.base;
  let px = x0, py = y;
  for (let x = x0 + 1; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0), yy = y + Math.sin(t * Math.PI) * sag;
    P.line(px, py, x, yy, 0x0c0c12); px = x; py = yy;
  }
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / (n + 1), x = Math.round(x0 + (x1 - x0) * t), yy = Math.round(y + Math.sin(t * Math.PI) * sag);
    P.vline(x, yy, yy + 3, 0x0c0c12); P.vline(x + 3, yy, yy + 3, 0x0c0c12);
    for (const dx of [0, 3]) { P.rect(x + dx - 1, yy + 4, 3, 2, i % 2 ? 0xd43a3a : col); P.set(x + dx - 1, yy + 6, 0x20202a); P.set(x + dx, yy + 6, 0x20202a); P.set(x + dx + 1, yy + 6, 0x20202a); }
  }
}

export function laundry(c: Scene2D, x0: number, x1: number, y: number, cols: Col[]) {
  const P = c.base;
  P.line(x0, y, x1, y + 2, 0x0c0c12);
  let x = x0 + 3, i = 0;
  while (x < x1 - 6) {
    const w = 4 + (i % 3), h = 5 + ((i * 7) % 4), yy = y + 1 + Math.round(((x - x0) / (x1 - x0)) * 2);
    P.rect(x, yy, w, h, cols[i % cols.length]); P.hline(x, x + w - 1, yy, shade(cols[i % cols.length], 1.3));
    x += w + 3 + (i % 2); i++;
  }
}

/** Fixture that hangs from a ceiling (overpass, awning) and throws a cone + pool of light. */
export function hangLamp(c: Scene2D, x: number, y: number, len: number, col: Col, o: { flicker?: boolean; k?: number; reach?: number } = {}) {
  const P = c.base;
  P.vline(x, y, y + len, 0x0c0c10);
  P.rect(x - 4, y + len, 9, 2, 0x20232a); P.hline(x - 4, x + 4, y + len, 0x4a505c);
  c.glow.rect(x - 3, y + len + 2, 7, 1, col); c.glow.rect(x - 1, y + len + 2, 3, 1, mix(col, 0xffffff, 0.75));
  halo(c.glow, x, y + len + 3, 12, mix(col, 0xffffff, 0.3), 0.7);
  halo(c.glow, x, y + len + 3, 5, mix(col, 0xffffff, 0.8), 1);
  const k = o.k ?? 1, f = o.flicker ? 1 : undefined;
  c.lights.push({ kind: 'cone', x, y: y + len, rx: 36, ry: FY - y - len + 22, k: 0.5 * k, flicker: f, color: col });
  c.lights.push({ kind: 'point', x, y: y + len + 4, rx: 22, ry: 18, k: 0.4 * k, flicker: f, color: col });
  c.lights.push({ kind: 'pool', x, y: FY + 4, rx: o.reach ?? 64, ry: 25, k: 0.75 * k, flicker: f, color: col });
  c.lamps.push({ x, y: y + len + 3, flicker: !!o.flicker, color: col });
}

/** Truss span used for elevated rail and big bridges. */
export function truss(c: Scene2D, x0: number, x1: number, deck: number, top: number, col: Col, step = 10) {
  const P = c.base;
  P.rect(x0, deck, x1 - x0, 3, col); P.hline(x0, x1, deck, shade(col, 1.5));
  P.rect(x0, top, x1 - x0, 2, col);
  for (let x = x0; x < x1; x += step) {
    P.vline(x, top, deck, col);
    P.line(x, top, x + step, deck, shade(col, 1.25));
    P.line(x + step, top, x, deck, shade(col, 0.85));
  }
  P.vline(x1, top, deck, col);
}

/** Reflection streaks of lights on dark water. */
export function water(c: Scene2D, y0: number, y1: number, base: Col, light: Col[], n = 70) {
  c.base.ramp(0, y0, GW, y1 - y0, [shade(base, 0.8), base, shade(base, 1.2)], 0, 1);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(c.rnd(0, GW)), y = Math.floor(c.rnd(y0 + 1, y1 - 1)), w = 2 + Math.floor(c.rnd(0, 6));
    c.glow.hline(x, x + w, y, light[Math.floor(c.r() * light.length)], 160);
  }
}

export function spots(c: Scene2D, list: [number, number, 'stand' | 'sit' | 'kid' | 'elder' | 'cheer', number?][]) {
  for (const [x, y, kind, face] of list) c.spots.push({ x, y, kind, face: face ?? (x < 213 ? 1 : -1) });
}

export const W_ = GW;

/** Lit shop window: warm gradient behind the glass, shelves and goods in silhouette. */
export function shopWindow(c: Scene2D, x: number, y: number, w: number, h: number, col: Col, o: { goods?: Col[]; shelves?: number } = {}) {
  c.base.rect(x - 1, y - 1, w + 2, h + 2, 0x12100e);
  c.glow.ramp(x, y, w, h, [mix(col, 0xffffff, 0.25), col, shade(col, 0.72)], 0, 1);
  const n = o.shelves ?? 2;
  for (let i = 1; i <= n; i++) {
    const sy = y + Math.floor((h * i) / (n + 1));
    c.glow.hline(x, x + w - 1, sy, shade(col, 0.45));
    const goods = o.goods ?? [0xc83a2a, 0x2a7ac8, 0xd8a820, 0x3aa44a];
    for (let gx = x + 2; gx < x + w - 3; gx += 4 + ((gx + i) & 1)) { const gh = 2 + ((gx * 7 + i) % 3); c.glow.rect(gx, sy - gh, 3, gh, goods[(gx + i) % goods.length]); }
  }
  c.base.vline(x + Math.floor(w / 3), y, y + h - 1, 0x12100e); c.base.vline(x + Math.floor((2 * w) / 3), y, y + h - 1, 0x12100e);
}
