import { Col, GH, GW, Pix, bayer, clamp, mix, mulCol, rng, shade } from './pixel';
import { drawText, textWidth } from './font';

/** Floor line (court centre) and hoop position in art pixels. */
export const FY = 189;
export const HXP = 369;
export const RIMY = FY - 97;

export type LightKind = 'pool' | 'point' | 'cone';
export interface Light {
  kind: LightKind; x: number; y: number; rx: number; ry: number; k: number;
  flicker?: number; color?: Col;
}
export interface Spot { x: number; y: number; kind: 'stand' | 'sit' | 'kid' | 'elder' | 'cheer'; face: number }
export interface Lamp { x: number; y: number; flicker: boolean; color: Col }

export interface Ambient { tint: [number, number, number]; k: number; lit: [number, number, number]; steps: number }

export class Scene2D {
  sky = new Pix(GW, GH);
  base = new Pix(GW, GH);
  glow = new Pix(GW, GH);
  lights: Light[] = [];
  lamps: Lamp[] = [];
  spots: Spot[] = [];
  r: () => number;
  amb: Ambient = { tint: [0.4, 0.45, 0.7], k: 0.3, lit: [1.12, 1.0, 0.8], steps: 5 };
  constructor(seed: number) { this.r = rng(seed); }
  rnd(a: number, b: number) { return a + this.r() * (b - a); }
  pick<T>(a: T[]) { return a[Math.floor(this.r() * a.length)]; }
}

export function lightValue(c: Scene2D, x: number, y: number, skipFlicker = false): number {
  let v = c.amb.k;
  for (const l of c.lights) {
    if (skipFlicker && l.flicker) continue;
    let w = 0;
    if (l.kind === 'pool' || l.kind === 'point') {
      const d = Math.sqrt(((x - l.x) / l.rx) ** 2 + ((y - l.y) / l.ry) ** 2);
      w = d < 1 ? (1 - d) ** 1.35 : 0;
    } else {
      const dy = y - l.y;
      if (dy > 0 && dy < l.ry) {
        const half = 2 + (dy / l.ry) * l.rx;
        const dx = Math.abs(x - l.x);
        if (dx < half) w = (1 - dx / half) ** 0.8 * (1 - (dy / l.ry) * 0.7);
      }
    }
    v += w * l.k * (l.flicker ? 1 : 1);
  }
  return clamp(v, 0, 1);
}

/** Dim the unlit layer and bring back colour inside lamp pools; bands are dithered like a hand-pixelled light gradient. */
export function applyLighting(c: Scene2D, bakeFlicker = 0.7) {
  const P = c.base, { tint, lit, steps } = c.amb;
  const lights = c.lights.map((l) => (l.flicker ? { ...l, k: l.k * bakeFlicker } : l));
  const tmp = new Scene2D(0); tmp.lights = lights; tmp.amb = c.amb;
  for (let y = 0; y < P.h; y++) {
    for (let x = 0; x < P.w; x++) {
      const col = P.get(x, y);
      if (col < 0) continue;
      const v = lightValue(tmp, x, y);
      const q = clamp(Math.floor(v * steps + bayer(x, y)) / steps, 0, 1);
      const dark = mulCol(col, tint[0], tint[1], tint[2]);
      const bright = mulCol(col, lit[0], lit[1], lit[2]);
      P.set(x, y, q <= 0 ? dark : mix(dark, bright, q));
    }
  }
}

/* ---------------------------------------------------------------- painting */

export function sky(c: Scene2D, ramp: Col[], y0 = 0, y1 = 160) { c.sky.ramp(0, y0, GW, y1 - y0, ramp); }

export function stars(c: Scene2D, n: number, y0: number, y1: number, col = 0xffffff) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(c.rnd(0, GW)), y = Math.floor(c.rnd(y0, y1));
    c.sky.set(x, y, mix(col, 0x8a90c0, c.r() * 0.7));
    if (c.r() < 0.12) { c.sky.set(x + 1, y, 0x6a70a0); c.sky.set(x, y + 1, 0x6a70a0); }
  }
}

export function moon(c: Scene2D, x: number, y: number, r: number, col = 0xf0e6c0) {
  c.sky.circle(x, y, r + 3, mix(0x20244a, col, 0.12));
  c.sky.circle(x, y, r + 1.5, mix(0x20244a, col, 0.25));
  c.sky.circle(x, y, r, col);
  c.sky.circle(x - r * 0.3, y - r * 0.2, r * 0.25, shade(col, 0.9));
  c.sky.circle(x + r * 0.35, y + r * 0.3, r * 0.2, shade(col, 0.88));
}

export function halo(P: Pix, x: number, y: number, r: number, col: Col, a = 1, ry = r) {
  for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) {
    for (let i = -Math.ceil(r); i <= Math.ceil(r); i++) {
      const d = Math.sqrt((i / r) ** 2 + (j / ry) ** 2);
      if (d < 1 && (1 - d) * a > bayer(x + i, y + j) * 0.9) P.set(x + i, y + j, col);
    }
  }
}

export function brick(c: Scene2D, x: number, y: number, w: number, h: number, base: number, o: { bw?: number; bh?: number } = {}) {
  const P = c.base, bh = o.bh ?? 3, bw = o.bw ?? 6;
  P.rect(x, y, w, h, shade(base, 0.6));
  for (let row = 0, yy = y; yy < y + h; yy += bh, row++) {
    const off = row % 2 ? -Math.floor(bw / 2) : 0;
    for (let xx = x + off; xx < x + w; xx += bw) {
      const cx = Math.max(xx, x), cw = Math.min(xx + bw, x + w) - cx - 1;
      if (cw <= 0) continue;
      P.rect(cx, yy, cw, Math.min(bh - 1, y + h - yy), shade(base, 0.82 + c.r() * 0.34));
    }
  }
  P.hline(x, x + w - 1, y, shade(base, 1.25));
  P.vline(x, y, y + h - 1, shade(base, 1.12));
}

export function slab(c: Scene2D, x: number, y: number, w: number, h: number, base: number, o: { seam?: number; v?: number } = {}) {
  const P = c.base;
  P.rect(x, y, w, h, base);
  for (let i = 0; i < w * h * (o.v ?? 0.04); i++) P.set(x + Math.floor(c.r() * w), y + Math.floor(c.r() * h), shade(base, c.r() < 0.5 ? 0.88 : 1.12));
  const s = o.seam ?? 0;
  if (s) for (let yy = y + s; yy < y + h; yy += s) P.hline(x, x + w - 1, yy, shade(base, 0.8));
  P.hline(x, x + w - 1, y, shade(base, 1.2));
}

export interface WinOpts { w?: number; h?: number; gx?: number; gy?: number; lit?: number; litC?: Col; dark?: Col; frame?: Col; ac?: number; glass?: Col }
export function windows(c: Scene2D, x: number, y: number, cols: number, rows: number, o: WinOpts = {}) {
  const w = o.w ?? 5, h = o.h ?? 6, gx = o.gx ?? 4, gy = o.gy ?? 5;
  const litC = o.litC ?? 0xf4c46a, frame = o.frame ?? 0x120e10, dark = o.dark ?? 0x2a2230;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const wx = x + i * (w + gx), wy = y + j * (h + gy);
      c.base.rect(wx - 1, wy - 1, w + 2, h + 2, frame);
      c.base.rect(wx, wy, w, h, dark);
      c.base.hline(wx, wx + w - 1, wy + Math.floor(h / 2), shade(dark, 0.7));
      if (c.r() < (o.lit ?? 0.4)) {
        const col = mix(litC, 0xfff0b0, c.r() * 0.5);
        c.glow.rect(wx, wy, w, h, col);
        if (c.r() < 0.5) c.glow.rect(wx, wy, w, 2, shade(col, 0.8));
        else c.glow.vline(wx + Math.floor(w / 2), wy, wy + h - 1, shade(col, 0.75));
        if (c.r() < 0.18) c.glow.rect(wx + 1, wy + h - 3, 2, 3, shade(col, 0.45));
      } else if (c.r() < 0.12 && o.ac !== 0) {
        c.base.rect(wx, wy + 2, w, h - 2, 0x6a707a); c.base.hline(wx, wx + w - 1, wy + 2, 0x9aa0aa);
      } else if (c.r() < 0.2) c.base.stipple(wx, wy, w, h, shade(o.glass ?? 0x6a7a9a, 1), 0.25);
      c.base.hline(wx - 1, wx + w, wy + h + 1, shade(frame, 1.9));
    }
  }
}

export function fireEscape(c: Scene2D, x: number, y: number, w: number, floors: number, fh: number, col: Col = 0x0e0e14) {
  const P = c.base;
  for (let f = 0; f < floors; f++) {
    const fy = y + f * fh;
    P.rect(x, fy, w, 2, col);
    P.vline(x, fy - 7, fy, col); P.vline(x + w - 1, fy - 7, fy, col); P.hline(x, x + w - 1, fy - 7, col);
    for (let k = 3; k < w - 1; k += 4) P.vline(x + k, fy - 7, fy, shade(col, 1.5));
    if (f < floors - 1) {
      const dir = f % 2 ? -1 : 1;
      const sx = dir > 0 ? x + 2 : x + w - 3;
      P.line(sx, fy + 2, sx + dir * (w - 6), fy + fh, col);
      P.line(sx + dir * 2, fy + 2, sx + dir * (w - 4), fy + fh, shade(col, 1.6));
    }
  }
}

export function chainFence(c: Scene2D, x0: number, y0: number, x1: number, y1: number, col: Col = 0xa8aeb8, a = 0.45) {
  const P = c.base;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { if ((((x + y) & 3) === 0 && ((x - y) & 7) !== 2) || (((x - y) & 3) === 0 && ((x + y) & 7) !== 5)) P.set(x, y, col, Math.round(a * 255)); }
  P.rect(x0, y0, x1 - x0, 2, 0x2a2e36); P.hline(x0, x1 - 1, y0, 0x4e5560);
  P.rect(x0, y1 - 2, x1 - x0, 2, 0x20242a);
  for (let x = x0 + 14; x < x1; x += 63) { P.rect(x, y0 - 2, 3, y1 - y0 + 2, 0x30343c); P.vline(x, y0 - 2, y1 - 1, 0x5a626c); }
}

export function lamp(c: Scene2D, x: number, base: number, top: number, o: { dir?: number; col?: Col; flicker?: boolean; k?: number; reach?: number; pool?: boolean; cone?: boolean } = {}) {
  const dir = o.dir ?? 1, col = o.col ?? 0xffb050, P = c.base;
  P.rect(x - 1, top, 3, base - top, 0x15161c); P.vline(x - 1, top, base - 1, 0x2e323c);
  P.rect(x - 3, base - 3, 7, 3, 0x1c1e24);
  for (let i = 0; i < 7; i++) P.set(x + dir * i, top - Math.floor(i / 5), 0x15161c);
  const hx = x + dir * 8, hy = top - 1;
  P.rect(hx - 3, hy, 7, 2, 0x23262e); P.hline(hx - 3, hx + 3, hy, 0x3c414c);
  c.glow.rect(hx - 2, hy + 2, 5, 1, col); c.glow.rect(hx - 1, hy + 2, 3, 2, mix(col, 0xffffff, 0.7));
  halo(c.glow, hx, hy + 4, 11, mix(col, 0xffffff, 0.35), 0.8);
  halo(c.glow, hx, hy + 4, 5, mix(col, 0xffffff, 0.8), 1);
  const reach = o.reach ?? 62;
  if (o.cone !== false) c.lights.push({ kind: 'cone', x: hx, y: hy + 2, rx: 30, ry: base - hy + 14, k: 0.55 * (o.k ?? 1), flicker: o.flicker ? 1 : undefined, color: col });
  c.lights.push({ kind: 'point', x: hx, y: hy + 4, rx: 26, ry: 24, k: 0.45 * (o.k ?? 1), flicker: o.flicker ? 1 : undefined, color: col });
  if (o.pool !== false) c.lights.push({ kind: 'pool', x: hx, y: FY + 4, rx: reach, ry: 24, k: 0.75 * (o.k ?? 1), flicker: o.flicker ? 1 : undefined, color: col });
  c.lamps.push({ x: hx, y: hy + 3, flicker: !!o.flicker, color: col });
}

export function sign(c: Scene2D, x: number, y: number, text: string, col: Col, o: { scale?: number; bg?: Col; neon?: boolean; frame?: Col; outline?: Col } = {}) {
  const sc = o.scale ?? 1, w = textWidth(text, sc) + 4, h = 7 * sc + 4;
  if (o.bg !== undefined) { c.base.rect(x - 2, y - 2, w + 2, h, o.bg); c.base.rect(x - 2, y - 2, w + 2, 1, o.frame ?? shade(o.bg, 1.3)); }
  const P = o.neon ? c.glow : c.base;
  drawText(P, x, y, text, col, o.outline ?? null, sc);
  if (o.neon) halo(c.glow, x + Math.floor(w / 2), y + 3, w * 0.7 + 4, col, 0.22, 8);
}

export function powerLine(c: Scene2D, x0: number, y0: number, x1: number, y1: number, sag: number, col: Col = 0x0c0c12) {
  let px = x0, py = y0;
  const n = Math.abs(x1 - x0);
  for (let i = 1; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
    c.base.line(px, py, x, y, col); px = x; py = y;
  }
}

export function pole(c: Scene2D, x: number, base: number, top: number, arm = 14) {
  c.base.rect(x - 1, top, 3, base - top, 0x1a1410); c.base.vline(x - 1, top, base, 0x3a2e24);
  c.base.rect(x - arm / 2, top + 3, arm, 2, 0x1a1410); c.base.rect(x - arm / 2 + 2, top + 9, arm - 4, 2, 0x1a1410);
  for (const ax of [x - arm / 2 + 1, x + arm / 2 - 2]) c.base.rect(ax, top + 1, 1, 2, 0x4a5058);
}

export function tree(c: Scene2D, x: number, base: number, h: number, trunk: Col, leaves: Col[]) {
  const P = c.base;
  P.poly([x - 3, base, x - 2, base - h * 0.55, x + 2, base - h * 0.55, x + 4, base], trunk);
  P.vline(x - 2, base - h * 0.5, base, shade(trunk, 1.3));
  const cy = base - h * 0.7, R = h * 0.4;
  for (let i = 0; i < 34; i++) {
    const a = c.r() * Math.PI * 2, d = c.r() * R;
    P.circle(x + Math.cos(a) * d * 1.2, cy + Math.sin(a) * d * 0.8, 3 + c.r() * 4, leaves[Math.floor(c.r() * leaves.length)]);
  }
  for (let i = 0; i < 26; i++) { const a = c.r() * Math.PI * 2, d = c.r() * R; P.set(x + Math.cos(a) * d * 1.2, cy + Math.sin(a) * d * 0.8 - 2, shade(leaves[0], 1.4)); }
}

export function palm(c: Scene2D, x: number, base: number, h: number, lean: number, trunk: Col, leaf: Col) {
  const P = c.base;
  let px = x, py = base;
  const tx = x + lean, ty = base - h;
  for (let i = 1; i <= h; i++) {
    const t = i / h, nx = x + lean * t * t, ny = base - i;
    P.rect(nx - 1, ny, 3 - (t > 0.7 ? 1 : 0), 1, trunk);
    if (i % 4 === 0) P.hline(nx - 1, nx + 1, ny, shade(trunk, 0.7));
    px = nx; py = ny;
  }
  void px; void py;
  const fronds = 9;
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI + (i / (fronds - 1)) * Math.PI + (c.r() - 0.5) * 0.2;
    const len = 15 + c.r() * 6;
    let fx = tx, fy = ty;
    for (let s = 0; s < len; s++) {
      fx += Math.cos(a) * 1.0; fy += Math.sin(a) * 1.0 + (s / len) * (s / len) * 1.6;
      P.set(fx, fy, i % 2 ? leaf : shade(leaf, 1.25));
      if (s % 2 === 0) { P.set(fx, fy + 1, shade(leaf, 0.8)); P.set(fx + (Math.cos(a) > 0 ? -1 : 1), fy + 1, shade(leaf, 0.7)); }
    }
  }
  P.circle(tx, ty + 1, 2, shade(trunk, 0.8));
}

export function dumpster(c: Scene2D, x: number, y: number, col = 0x2c5a3a) {
  const P = c.base;
  P.rect(x, y - 11, 22, 11, col); P.rect(x - 1, y - 13, 24, 3, shade(col, 0.7)); P.hline(x - 1, x + 22, y - 13, shade(col, 1.3));
  P.vline(x + 7, y - 10, y - 1, shade(col, 0.7)); P.vline(x + 14, y - 10, y - 1, shade(col, 0.7));
  P.rect(x + 2, y - 1, 3, 2, 0x111111); P.rect(x + 17, y - 1, 3, 2, 0x111111);
}

export function hydrant(c: Scene2D, x: number, y: number, col = 0xc8362c) {
  const P = c.base;
  P.rect(x - 2, y - 9, 5, 9, col); P.rect(x - 3, y - 11, 7, 2, shade(col, 1.15)); P.rect(x - 1, y - 13, 3, 2, shade(col, 0.9));
  P.rect(x - 4, y - 7, 2, 3, shade(col, 0.8)); P.rect(x + 3, y - 7, 2, 3, shade(col, 0.8)); P.vline(x - 2, y - 9, y - 1, shade(col, 1.3));
}

export function bench(c: Scene2D, x: number, y: number, w = 20) {
  const P = c.base;
  P.rect(x, y - 7, w, 2, 0x6a4a2a); P.rect(x, y - 11, w, 2, 0x5a3e24); P.hline(x, x + w - 1, y - 7, 0x8a6a42); P.hline(x, x + w - 1, y - 11, 0x7a5a38);
  P.vline(x + 1, y - 11, y - 1, 0x1a1c22); P.vline(x + w - 2, y - 11, y - 1, 0x1a1c22);
}

export function trashCan(c: Scene2D, x: number, y: number) {
  c.base.rect(x, y - 9, 6, 9, 0x4a5058); c.base.hline(x - 1, x + 6, y - 10, 0x6a7078); c.base.vline(x + 1, y - 9, y - 1, 0x6a7078);
  for (let i = 0; i < 3; i++) c.base.hline(x, x + 5, y - 7 + i * 3, 0x30353c);
}

export function tires(c: Scene2D, x: number, y: number, n = 3) {
  for (let i = 0; i < n; i++) { c.base.ellipse(x + 5, y - 2 - i * 4, 6, 2.6, 0x16161a); c.base.ellipse(x + 5, y - 3 - i * 4, 3.2, 1.2, 0x2a2a30); }
}

export function cart(c: Scene2D, x: number, y: number) {
  const P = c.base;
  P.line(x, y - 11, x + 3, y - 4, 0x9aa0aa); P.hline(x + 3, x + 13, y - 4, 0x9aa0aa); P.line(x + 13, y - 4, x + 15, y - 11, 0x9aa0aa);
  for (let i = 0; i < 4; i++) P.vline(x + 3 + i * 3, y - 10, y - 5, 0x6a707a);
  P.hline(x, x + 15, y - 11, 0xc0c4cc); P.circle(x + 4, y - 1, 1.5, 0x111111); P.circle(x + 12, y - 1, 1.5, 0x111111);
}

export function stoop(c: Scene2D, x: number, y: number, steps: number, col: Col) {
  for (let i = 0; i < steps; i++) { c.base.rect(x + i * 3, y - (steps - i) * 3, 3 + (steps - i) * 0, (steps - i) * 3, shade(col, 0.8 + i * 0.07)); c.base.hline(x + i * 3, x + i * 3 + 2, y - (steps - i) * 3, shade(col, 1.25)); }
}

export function boombox(c: Scene2D, x: number, y: number) {
  c.base.rect(x, y - 6, 10, 6, 0x2a2c34); c.base.rect(x + 1, y - 5, 3, 3, 0x14151a); c.base.rect(x + 6, y - 5, 3, 3, 0x14151a);
  c.base.hline(x, x + 9, y - 6, 0x6a707c); c.base.vline(x + 8, y - 9, y - 6, 0x9aa0aa); c.base.rect(x + 4, y - 4, 2, 1, 0xff4a4a);
}

export function barrel(c: Scene2D, x: number, y: number) {
  c.base.rect(x, y - 11, 9, 11, 0x4a3a30); c.base.hline(x, x + 8, y - 11, 0x8a7a6a);
  c.base.hline(x, x + 8, y - 8, 0x2a1e18); c.base.hline(x, x + 8, y - 4, 0x2a1e18); c.base.vline(x + 1, y - 10, y - 1, 0x6a5848);
}

export function graffiti(c: Scene2D, x: number, y: number, text: string, col: Col, o: { scale?: number; outline?: Col; shadow?: Col; drip?: boolean } = {}) {
  const P = c.base, sc = o.scale ?? 2;
  const tmp = new Pix(textWidth(text, sc) + 6, 7 * sc + 6);
  drawText(tmp, 2, 2, text, col, o.outline ?? 0x14101c, sc);
  if (o.shadow !== undefined) { const t2 = new Pix(tmp.w, tmp.h); t2.blit(tmp, 1, 1); for (let i = 0; i < t2.px.length; i++) if (t2.px[i] >>> 24) { const px = i % t2.w, py = (i / t2.w) | 0; if (!tmp.alpha(px, py)) P.set(x + px, y + py, o.shadow); } }
  P.blit(tmp, x, y);
  if (o.drip) for (let i = 0; i < 3; i++) { const dx = x + 3 + Math.floor(c.r() * (tmp.w - 6)); P.vline(dx, y + tmp.h - 2, y + tmp.h + 1 + Math.floor(c.r() * 4), col); }
}

/** Painted court markings + surface. Everything is in art px; z-lane lines match the gameplay geometry. */
export interface FloorStyle {
  art?: (p: Pix) => void;
  base: Col; edge: Col; key: Col; lines: Col; wear?: Col; crack?: number; speckle?: number;
  wet?: boolean; snow?: number; paint2?: Col; border?: Col; seed?: number; sidewalk?: Col; patch?: number;
}

export function paintFloor(c: Scene2D, st: FloorStyle) {
  const P = c.base, r = rng(st.seed ?? 5);
  const top = 154, bot = 223;
  P.ramp(0, top, GW, bot - top, [shade(st.edge, 0.78), st.base, shade(st.base, 1.06), shade(st.base, 0.96)], 0, 1);
  P.rect(0, top, GW, 3, shade(st.edge, 0.6));
  for (let x = 0; x < GW; x += 6) P.hline(x, x + 3, top + 3, shade(st.edge, 0.85));
  for (let i = 0; i < 900 * (st.speckle ?? 1); i++) P.set(Math.floor(r() * GW), top + 3 + Math.floor(r() * (bot - top - 3)), r() < 0.5 ? shade(st.base, 0.84) : shade(st.base, 1.14));
  const wearC = st.wear ?? shade(st.base, 0.8);
  for (let i = 0; i < 26 * (st.patch ?? 1); i++) { const w = 6 + Math.floor(r() * 24), x = 10 + Math.floor(r() * (GW - 40)), y = 166 + Math.floor(r() * 46); P.stipple(x, y, w, 2 + Math.floor(r() * 4), wearC, 0.45); }
  const lh = 23, hx = HXP, kx = 269;
  const kt = FY - 18, kb = FY + 18;
  P.rect(kx, kt, 415 - kx, kb - kt + 1, st.key);
  P.ellipse(kx, FY, 6.5, 18, st.key);
  if (st.paint2) { P.rect(kx + 2, kt + 2, 415 - kx - 4, kb - kt - 3, st.paint2); P.rect(kx + 4, kt + 4, 415 - kx - 8, kb - kt - 7, st.key); }
  for (let i = 0; i < 160; i++) P.set(kx + Math.floor(r() * (415 - kx)), kt + Math.floor(r() * (kb - kt)), r() < 0.5 ? shade(st.key, 0.85) : shade(st.key, 1.15));
  st.art?.(P);
  const L = st.lines;
  P.hline(10, 414, FY - lh, L); P.hline(10, 414, FY + lh, L); P.vline(414, FY - lh, FY + lh, L);
  P.hline(kx, 414, kt, L); P.hline(kx, 414, kb, L); P.vline(kx, kt, kb, L);
  for (let a = -90; a <= 90; a += 4) { const px = kx - Math.round(Math.cos((a * Math.PI) / 180) * 6.5), py = FY + Math.round(Math.sin((a * Math.PI) / 180) * 18); if (a > 0 || true) P.set(px, py, L); }
  for (let a = 0; a < 360; a += 4) { const px = kx + Math.round(Math.cos((a * Math.PI) / 180) * 6.5), py = FY + Math.round(Math.sin((a * Math.PI) / 180) * 18); if (a % 16 < 8) P.set(px, py, L); }
  P.vline(225, FY - lh, FY + lh, L);
  for (let a = 0; a < 360; a += 3) P.set(225 + Math.round(Math.cos((a * Math.PI) / 180) * 9), FY + Math.round(Math.sin((a * Math.PI) / 180) * 17), L);
  let lx: number | null = null, ly = 0;
  for (let dy = -lh; dy <= lh; dy++) {
    const x = Math.round(hx - Math.sqrt(Math.max(0, 143.3 ** 2 - (3 * dy) ** 2))), y = FY + dy;
    P.set(x, y, L);
    if (lx !== null && Math.abs(x - lx) > 1) P.hline(Math.min(x, lx), Math.max(x, lx), ly, L);
    lx = x; ly = y;
  }
  for (let a = 0; a < 360; a += 5) P.set(hx - 1 + Math.round(Math.cos((a * Math.PI) / 180) * 9), FY + Math.round(Math.sin((a * Math.PI) / 180) * 16), L);
  const crk = st.crack ?? 14;
  for (let i = 0; i < crk; i++) {
    let x = 20 + r() * (GW - 40), y = 160 + r() * 52;
    const n = 6 + Math.floor(r() * 10);
    for (let k = 0; k < n; k++) { P.set(x, y, shade(st.base, 0.55)); x += (r() - 0.35) * 2.6; y += (r() - 0.5) * 1.4; }
  }
  if (st.wet) for (let i = 0; i < 9; i++) { const x = 20 + r() * 340, y = 160 + r() * 50, w = 14 + r() * 36; P.ellipse(x, y, w / 2, 2 + r() * 2, shade(st.base, 0.7)); P.hline(x - w / 4, x + w / 4, y - 1, shade(st.base, 1.5)); }
  if (st.snow) for (let i = 0; i < 70 * st.snow; i++) { const x = 8 + r() * (GW - 16), y = 157 + r() * 62; P.hline(x, x + 1 + r() * 7, y, r() < 0.5 ? 0xe4eaf4 : 0xc4d0e4); }
  const curb = st.sidewalk ?? 0x5a5a62;
  P.rect(0, 223, GW, 3, shade(curb, 1.2)); P.hline(0, GW, 223, shade(curb, 1.5));
  P.rect(0, 226, GW, GH - 226, shade(curb, 0.62));
  for (let i = 0; i < 90; i++) P.set(Math.floor(r() * GW), 227 + Math.floor(r() * 12), r() < 0.5 ? shade(curb, 0.5) : shade(curb, 0.78));
  for (let x = 14; x < GW; x += 55) P.vline(x, 226, GH - 1, shade(curb, 0.5));
}

/** Backboard, pole and rim (the back half; the net and front rim are animated separately). */
export function paintHoop(c: Scene2D, o: { board?: Col; pole?: Col; rim?: Col } = {}) {
  const P = c.base, bx = 383, py = FY;
  const pole = o.pole ?? 0x20232a;
  P.rect(400, py - 133, 4, 133, pole); P.vline(400, py - 133, py, shade(pole, 1.8)); P.rect(397, py - 3, 10, 3, shade(pole, 0.7));
  P.rect(bx + 1, py - 128, 17, 2, pole); P.hline(bx + 1, bx + 16, py - 128, shade(pole, 1.8));
  P.line(bx + 3, py - 126, 399, py - 108, shade(pole, 1.2));
  const bc = o.board ?? 0xe9edf2;
  P.rect(bx, py - 134, 3, 44, bc); P.vline(bx, py - 134, py - 91, 0xffffff); P.vline(bx + 2, py - 134, py - 91, shade(bc, 0.7));
  P.rect(bx, py - 134, 3, 1, 0x20232a); P.rect(bx, py - 91, 3, 1, 0x20232a);
  P.rect(bx - 1, py - 110, 1, 13, 0xd42a2a);
  const rim = o.rim ?? 0xe8541a;
  P.hline(HXP + 9, bx - 1, RIMY, rim);
  for (let dx = -9; dx <= 9; dx++) P.set(HXP + dx, RIMY - Math.round(Math.sqrt(Math.max(0, 1 - (dx / 9) ** 2)) * 2), shade(rim, 0.7));
}

export function skyline(c: Scene2D, base: number, x0: number, x1: number, hmin: number, hmax: number, col: Col, o: { win?: Col; wmin?: number; wmax?: number; roof?: number } = {}) {
  let x = x0;
  while (x < x1) {
    const w = Math.floor(c.rnd(o.wmin ?? 8, o.wmax ?? 17)), h = Math.floor(c.rnd(hmin, hmax));
    c.base.rect(x, base - h, w, h + 2, col);
    c.base.vline(x, base - h, base, shade(col, 1.25));
    if (c.r() < (o.roof ?? 0.3)) { c.base.rect(x + Math.floor(w * 0.3), base - h - 3, Math.floor(w * 0.4), 3, col); if (c.r() < 0.5) c.base.vline(x + Math.floor(w / 2), base - h - 8, base - h - 3, col); }
    if (o.win !== undefined) for (let wy = base - h + 3; wy < base - 3; wy += 3) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (c.r() < 0.3) c.glow.set(wx, wy, c.r() < 0.5 ? o.win : shade(o.win, 0.75));
    x += w + (c.r() < 0.3 ? 1 : 0);
  }
}

export function waterTower(c: Scene2D, x: number, base: number, col = 0x5a4030) {
  const P = c.base;
  P.vline(x - 6, base - 15, base, 0x15110e); P.vline(x + 6, base - 15, base, 0x15110e); P.line(x - 6, base - 8, x + 6, base - 13, 0x15110e); P.line(x + 6, base - 8, x - 6, base - 13, 0x15110e);
  P.rect(x - 8, base - 32, 17, 17, col); P.vline(x - 8, base - 32, base - 16, shade(col, 1.3));
  for (const dy of [-29, -24, -19]) P.hline(x - 8, x + 8, base + dy, 0x15110e);
  P.poly([x - 9, base - 32, x, base - 39, x + 9, base - 32], shade(col, 0.6));
}

export function antenna(c: Scene2D, x: number, y: number, h: number, col: Col = 0x15110e) {
  c.base.vline(x, y - h, y, col); c.base.hline(x - 3, x + 3, y - h + 3, col); c.base.hline(x - 2, x + 2, y - h + 6, col);
  c.glow.set(x, y - h - 1, 0xff3a3a);
}

export function awning(c: Scene2D, x: number, y: number, w: number, a: Col, b: Col) {
  for (let i = 0; i < w; i += 3) { c.base.rect(x + i, y, 3, 5, (i / 3) % 2 ? b : a); c.base.rect(x + i, y + 5, 3, 1, shade((i / 3) % 2 ? b : a, 0.7)); }
  c.base.hline(x, x + w - 1, y, shade(a, 1.3));
}

export function suspension(c: Scene2D, xL: number, xR: number, deck: number, towerTop: number, col: Col, lightC: Col) {
  const P = c.base;
  for (const tx of [xL, xR]) {
    P.rect(tx - 5, towerTop, 3, deck - towerTop + 2, col); P.rect(tx + 3, towerTop, 3, deck - towerTop + 2, col);
    P.rect(tx - 5, towerTop + 8, 11, 2, col); P.rect(tx - 5, towerTop + 20, 11, 2, col);
    for (let i = 0; i < 3; i++) P.set(tx - 3 + i * 3, towerTop + 12, 0);
    c.glow.set(tx, towerTop - 1, 0xff4040);
  }
  P.rect(0, deck, GW, 3, col); P.hline(0, GW, deck, shade(col, 1.4));
  const cab = (xa: number, ya: number, xb: number, yb: number, sag: number) => {
    let px = xa, py = ya;
    for (let i = 1; i <= Math.abs(xb - xa); i++) { const t = i / Math.abs(xb - xa), x = xa + (xb - xa) * t, y = ya + (yb - ya) * t + Math.sin(t * Math.PI) * sag; P.line(px, py, x, y, shade(col, 1.6)); if (i % 4 === 0) P.vline(Math.round(x), Math.round(y), deck, shade(col, 1.25)); px = x; py = y; }
  };
  cab(xL, towerTop + 2, xR, towerTop + 2, 26);
  cab(-4, deck - 12, xL, towerTop + 2, 0); cab(xR, towerTop + 2, GW + 4, deck - 14, 0);
  for (let x = 2; x < GW; x += 8) c.glow.set(x, deck - 1, lightC);
}
