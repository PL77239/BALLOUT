import Phaser from 'phaser';

/** One art pixel = PX world units. The canvas is GW x GH art pixels; the camera zooms by 1/PX. */
export const PX = 3;
export const GW = 427;
export const GH = 240;

export type Col = number;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export function mix(a: Col, b: Col, t: number): Col {
  t = clamp(t, 0, 1);
  const f = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (f(16) << 16) | (f(8) << 8) | f(0);
}

/** Hue-shifted shading: shadows drift toward violet, highlights toward warm yellow (reads as pixel art, not as a multiply). */
export function shade(c: Col, k: number): Col {
  if (k < 1) return mix(c, 0x1a1030, (1 - k) * 0.85);
  return mix(c, 0xfff0b8, Math.min(1, k - 1) * 0.8);
}

export function mulCol(c: Col, r: number, g: number, b: number): Col {
  const f = (s: number, m: number) => clamp(Math.round(((c >> s) & 255) * m), 0, 255);
  return (f(16, r) << 16) | (f(8, g) << 8) | f(0, b);
}

const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Ordered-dither threshold in (0,1) for a pixel coordinate. */
export const bayer = (x: number, y: number) => (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

export function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pack = (c: Col, a = 255) => ((a << 24) | ((c & 255) << 16) | (((c >> 8) & 255) << 8) | ((c >> 16) & 255)) >>> 0;

/** CPU pixel canvas with an alpha channel. All drawing is integer and hard-edged. */
export class Pix {
  readonly px: Uint32Array;
  private img: ImageData;

  constructor(readonly w: number, readonly h: number) {
    this.img = new ImageData(w, h);
    this.px = new Uint32Array(this.img.data.buffer);
  }

  clear() { this.px.fill(0); }
  inb(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }

  /** Opaque RGB at x,y, or -1 when transparent / out of bounds. */
  get(x: number, y: number): number {
    if (!this.inb(x, y)) return -1;
    const v = this.px[y * this.w + x];
    if ((v >>> 24) === 0) return -1;
    return ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255);
  }

  alpha(x: number, y: number) { return this.inb(x, y) ? this.px[y * this.w + x] >>> 24 : 0; }

  set(x: number, y: number, c: Col, a = 255) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (a >= 255) { this.px[i] = pack(c); return; }
    const d = this.px[i], da = d >>> 24;
    if (da === 0) { this.px[i] = pack(c, a); return; }
    const t = a / 255;
    const r = Math.round((d & 255) + (((c >> 16) & 255) - (d & 255)) * t);
    const g = Math.round(((d >> 8) & 255) + (((c >> 8) & 255) - ((d >> 8) & 255)) * t);
    const b = Math.round(((d >> 16) & 255) + ((c & 255) - ((d >> 16) & 255)) * t);
    this.px[i] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }

  rect(x: number, y: number, w: number, h: number, c: Col, a = 255) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.set(i, j, c, a);
  }

  hline(x0: number, x1: number, y: number, c: Col, a = 255) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, c, a); }
  vline(x: number, y0: number, y1: number, c: Col, a = 255) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, c, a); }

  line(x0: number, y0: number, x1: number, y1: number, c: Col, a = 255) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.set(x0, y0, c, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Col, a = 255) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) this.set(x, y, c, a);
      }
    }
  }
  circle(cx: number, cy: number, r: number, c: Col, a = 255) { this.ellipse(cx, cy, r, r, c, a); }

  /** Even-odd polygon fill sampled at pixel centres. pts = [x0,y0,x1,y1,...] */
  poly(pts: number[], c: Col, a = 255) {
    let y0 = 1e9, y1 = -1e9;
    for (let i = 1; i < pts.length; i += 2) { y0 = Math.min(y0, pts[i]); y1 = Math.max(y1, pts[i]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yy = y + 0.5, xs: number[] = [];
      for (let i = 0, n = pts.length / 2; i < n; i++) {
        const ax = pts[i * 2], ay = pts[i * 2 + 1], bx = pts[((i + 1) % n) * 2], by = pts[((i + 1) % n) * 2 + 1];
        if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + ((yy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c, a);
    }
  }

  blit(src: Pix, dx: number, dy: number, flip = false) {
    dx = Math.round(dx); dy = Math.round(dy);
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const v = src.px[y * src.w + x], a = v >>> 24;
        if (!a) continue;
        const c = ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255);
        this.set(dx + (flip ? src.w - 1 - x : x), dy + y, c, a);
      }
    }
  }

  /** 1px outline around all opaque pixels (4-neighbourhood), written into transparent pixels only. */
  outline(c: Col, diag = false) {
    const w = this.w, h = this.h, src = this.px.slice();
    const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && (src[y * w + x] >>> 24) > 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (src[y * w + x] >>> 24) continue;
        if (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1) || (diag && (opaque(x - 1, y - 1) || opaque(x + 1, y - 1) || opaque(x - 1, y + 1) || opaque(x + 1, y + 1)))) this.px[y * w + x] = pack(c);
      }
    }
  }

  /** Vertical gradient quantised to `ramp` with ordered dithering between bands. */
  ramp(x: number, y: number, w: number, h: number, ramp: Col[], t0 = 0, t1 = 1) {
    const n = ramp.length - 1;
    for (let j = 0; j < h; j++) {
      const t = clamp(lerp(t0, t1, h > 1 ? j / (h - 1) : 0), 0, 1) * n;
      for (let i = 0; i < w; i++) {
        const f = Math.floor(t), fr = t - f;
        this.set(x + i, y + j, ramp[Math.min(n, f + (fr > bayer(x + i, y + j) ? 1 : 0))]);
      }
    }
  }

  /** Dithered patch: pixels inside `shape` get colour c with density d(0..1). */
  stipple(x: number, y: number, w: number, h: number, c: Col, d: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d > bayer(x + i, y + j)) this.set(x + i, y + j, c);
  }

  upload(ctx: CanvasRenderingContext2D) { ctx.putImageData(this.img, 0, 0); }
}

/** Create or refresh a Phaser canvas texture from a Pix. */
export function pixTexture(scene: Phaser.Scene, key: string, p: Pix): Phaser.Textures.CanvasTexture {
  let t = scene.textures.exists(key) ? (scene.textures.get(key) as Phaser.Textures.CanvasTexture) : null;
  if (t && (t.width !== p.w || t.height !== p.h)) { scene.textures.remove(key); t = null; }
  if (!t) t = scene.textures.createCanvas(key, p.w, p.h)!;
  p.upload(t.getContext());
  t.refresh();
  return t;
}

/** Snap a world coordinate to the art-pixel grid. */
export const snap = (v: number) => Math.round(v / PX) * PX;
