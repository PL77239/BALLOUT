import Phaser from 'phaser';
import { Col, PX, Pix, clamp, lerp, mix, pixTexture, shade } from './pixel';
import { Loadout, SKIN_TONES } from './loadout';

export const THIGH = 44;
export const SHIN = 42;
export const ANKLE = 7;
export const TORSO = 60;
export const SHOULDER = 52;
const UPPER = 36;
const FORE = 33;
const OUT = 0x16111f;
const K = 1 / PX;

export interface Rig {
  hipY: number; lean: number; head: number;
  fFx: number; fFy: number; bFx: number; bFy: number;
  fAnk: number; bAnk: number;
  fHx: number; fHy: number; bHx: number; bHy: number;
  bodyX: number;
  turn: number;
  emo: number;
  mouth: number;
}

export const restRig = (): Rig => ({
  hipY: 86, lean: 0.06, head: 0,
  fFx: 10, fFy: 0, bFx: -10, bFy: 0, fAnk: 0, bAnk: 0,
  fHx: 14, fHy: 86 + 50 - 62, bHx: -6, bHy: 86 + 50 - 62,
  bodyX: 0, turn: 1, emo: 0, mouth: 0,
});

export function ik(l1: number, l2: number, dx: number, dy: number, bend: number): [number, number] {
  let d = Math.hypot(dx, dy);
  d = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 0.5, d));
  const phi = Math.atan2(dx, dy);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const al = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const a1 = phi + bend * al;
  const kx = l1 * Math.sin(a1), ky = l1 * Math.cos(a1);
  const a2 = Math.atan2(Math.sin(phi) * d - kx, Math.cos(phi) * d - ky);
  return [a1, a2];
}

type RigKey = keyof Rig;
const GROUPS: { keys: RigKey[]; w: number; z: number }[] = [
  { keys: ['hipY', 'lean', 'bodyX'], w: 26, z: 0.78 },
  { keys: ['fFx', 'fFy', 'bFx', 'bFy', 'fAnk', 'bAnk'], w: 36, z: 0.92 },
  { keys: ['fHx', 'fHy', 'bHx', 'bHy'], w: 30, z: 0.58 },
  { keys: ['head'], w: 18, z: 0.5 },
];
const DIRECT: RigKey[] = ['turn', 'emo', 'mouth'];

/** Scratch mask used to rasterise one body piece, then composite it with cel shading and inner outlines. */
class Brush {
  m: Uint8Array;
  pm: Uint8Array;
  part = 0;
  x0 = 0; y0 = 0; x1 = -1; y1 = -1;
  constructor(public p: Pix) { this.m = new Uint8Array(p.w * p.h); this.pm = new Uint8Array(p.w * p.h); }
  reset() { this.pm.fill(0); this.part = 0; }

  begin() {
    if (this.x1 >= this.x0) for (let y = this.y0; y <= this.y1; y++) this.m.fill(0, y * this.p.w + this.x0, y * this.p.w + this.x1 + 1);
    this.x0 = this.p.w; this.y0 = this.p.h; this.x1 = -1; this.y1 = -1;
    return this;
  }
  has(x: number, y: number) { return x >= 0 && y >= 0 && x < this.p.w && y < this.p.h && this.m[y * this.p.w + x] === 1; }
  private put(x: number, y: number) {
    this.m[y * this.p.w + x] = 1;
    if (x < this.x0) this.x0 = x; if (x > this.x1) this.x1 = x; if (y < this.y0) this.y0 = y; if (y > this.y1) this.y1 = y;
  }
  private box(ax: number, ay: number, bx: number, by: number) {
    return [Math.max(0, Math.floor(Math.min(ax, bx))), Math.max(0, Math.floor(Math.min(ay, by))), Math.min(this.p.w - 1, Math.ceil(Math.max(ax, bx))), Math.min(this.p.h - 1, Math.ceil(Math.max(ay, by)))];
  }

  cap(ax: number, ay: number, bx: number, by: number, ra: number, rb: number, t0 = 0, t1 = 1, roundA = true, roundB = true) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6, L = Math.sqrt(L2), rm = Math.max(ra, rb) + 1;
    const [x0, y0, x1, y1] = this.box(Math.min(ax, bx) - rm, Math.min(ay, by) - rm, Math.max(ax, bx) + rm, Math.max(ay, by) + rm);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5 - ax, py = y + 0.5 - ay;
        const t = (px * dx + py * dy) / L2;
        const r = ra + (rb - ra) * clamp(t, 0, 1);
        if (t >= t0 && t <= t1) {
          if (Math.abs(px * dy - py * dx) / L <= r) this.put(x, y);
        } else if (t < t0 && t0 <= 0 && roundA) {
          if (px * px + py * py <= ra * ra) this.put(x, y);
        } else if (t > t1 && t1 >= 1 && roundB) {
          const qx = px - dx, qy = py - dy;
          if (qx * qx + qy * qy <= rb * rb) this.put(x, y);
        }
      }
    }
    return this;
  }

  /** Predicate evaluated in a local frame (x forward, y down, in art px / u). */
  frame(ox: number, oy: number, th: number, sx: number, u: number, ext: number, pred: (lx: number, ly: number) => boolean) {
    const c = Math.cos(th), s = Math.sin(th), e = ext * u + 1;
    const ws = (sx < 0 ? -1 : 1) * Math.max(Math.abs(sx), 0.62);
    const [x0, y0, x1, y1] = this.box(ox - e, oy - e, ox + e, oy + e);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x + 0.5 - ox) / ws, dy = y + 0.5 - oy;
        if (pred((dx * c + dy * s) / u, (-dx * s + dy * c) / u)) this.put(x, y);
      }
    }
    return this;
  }

  disc(cx: number, cy: number, r: number) {
    const [x0, y0, x1, y1] = this.box(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; if (dx * dx + dy * dy <= r * r) this.put(x, y); }
    return this;
  }

  commit(col: Col, o: { line?: Col | null; hi?: Col; sh?: Col; flat?: boolean } = {}) {
    const hi = o.hi ?? shade(col, 1.3), sh = o.sh ?? shade(col, 0.72);
    const line = o.line === undefined ? shade(col, 0.5) : o.line;
    for (let y = this.y0; y <= this.y1; y++) {
      for (let x = this.x0; x <= this.x1; x++) {
        if (!this.has(x, y)) continue;
        const l = this.has(x - 1, y), r = this.has(x + 1, y), u = this.has(x, y - 1), d = this.has(x, y + 1);
        let c = col;
        const i = y * this.p.w + x;
        if ((!l || !r || !u || !d) && line !== null && this.p.alpha(x, y) > 0 && this.pm[i] !== this.part) c = line;
        else if (!o.flat) { if (!r || !d) c = sh; else if (!l || !u) c = hi; }
        this.p.set(x, y, c);
        this.pm[i] = this.part;
      }
    }
  }
}

interface Trail { x: number; y: number; vx: number; vy: number }
const trail = (): Trail => ({ x: 0, y: 0, vx: 0, vy: 0 });

export interface PuppetOpts { scale?: number; w?: number; h?: number; key?: string }
let uid = 0;

export class Puppet {
  root: Phaser.GameObjects.Image;
  cur: Rig = restRig();
  vel: Record<string, number> = {};
  loadout!: Loadout;
  pix: Pix;
  facing = 1;
  readonly u: number;
  readonly CWd: number; readonly CHt: number; readonly ox: number; readonly oy: number;
  private tex: Phaser.Textures.CanvasTexture;
  private brush: Brush;
  private hair = trail();
  private chain = trail();
  private tail = trail();
  private lastV = { f: 0, h: 0 };
  private lastHead = { x: 0, y: 0, px: 0, py: 0 };
  private t = Math.random() * 10;
  private blinkAt = 2 + Math.random() * 3;
  private blink = 0;
  private dirty = true;

  constructor(private scene: Phaser.Scene, loadout: Loadout, o: PuppetOpts = {}) {
    this.u = o.scale ?? 1;
    this.CWd = o.w ?? 128; this.CHt = o.h ?? 104;
    this.ox = this.CWd / 2; this.oy = this.CHt - 8;
    this.pix = new Pix(this.CWd, this.CHt);
    this.brush = new Brush(this.pix);
    const key = o.key ?? `pup${uid++}`;
    this.tex = pixTexture(scene, key, this.pix);
    this.root = scene.add.image(0, 0, key).setOrigin(this.ox / this.CWd, this.oy / this.CHt).setScale(PX);
    for (const g of GROUPS) for (const k of g.keys) this.vel[k] = 0;
    this.dress(loadout);
  }

  dress(l: Loadout) { this.loadout = l; this.dirty = true; }

  shoulder(r: Rig = this.cur) { return { x: Math.sin(r.lean) * SHOULDER, y: r.hipY + Math.cos(r.lean) * SHOULDER }; }

  kick(key: RigKey, v: number) { this.vel[key] = (this.vel[key] ?? 0) + v; }

  /** Spring the current pose toward target, advance secondary motion, repaint. */
  update(target: Rig, dt: number, pins: { f?: boolean; b?: boolean } = {}, motion = { f: 0, h: 0 }) {
    const n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
    const c = this.cur as unknown as Record<string, number>, t = target as unknown as Record<string, number>;
    for (const g of GROUPS) {
      const w2 = g.w * g.w, d2 = 2 * g.z * g.w;
      for (let i = 0; i < n; i++) {
        for (const k of g.keys) {
          this.vel[k] += (w2 * (t[k] - c[k]) - d2 * this.vel[k]) * h;
          c[k] += this.vel[k] * h;
        }
      }
    }
    for (const k of DIRECT) c[k] = t[k];
    if (pins.f) { this.cur.fHx = target.fHx; this.cur.fHy = target.fHy; this.vel.fHx = this.vel.fHy = 0; }
    if (pins.b) { this.cur.bHx = target.bHx; this.cur.bHy = target.bHy; this.vel.bHx = this.vel.bHy = 0; }
    this.physics(dt, motion);
    this.paint();
  }

  snap(target: Rig) {
    Object.assign(this.cur, target);
    for (const k in this.vel) this.vel[k] = 0;
    this.paint();
  }

  private physics(dt: number, m: { f: number; h: number }) {
    if (dt <= 0.0005) return;
    const af = clamp((m.f - this.lastV.f) / dt, -3000, 3000) * K, ah = clamp((m.h - this.lastV.h) / dt, -3000, 3000) * K;
    this.lastV = { f: m.f, h: m.h };
    const step = (tr: Trail, kk: number, cc: number, mass: number, rx: number, ry: number) => {
      const n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
      for (let i = 0; i < n; i++) {
        tr.vx += (-kk * (tr.x - rx) - cc * tr.vx - af * mass) * h;
        tr.vy += (-kk * (tr.y - ry) - cc * tr.vy + ah * mass) * h;
        tr.x += tr.vx * h; tr.y += tr.vy * h;
      }
      tr.x = clamp(tr.x, -7, 7); tr.y = clamp(tr.y, -6, 6);
    };
    step(this.hair, 170, 11, 0.9, 0, 0);
    step(this.tail, 120, 7, 1.2, 0, 0);
    step(this.chain, 230, 9, 0.7, 0, 0);
    this.t += dt;
    this.blinkAt -= dt;
    if (this.blinkAt <= 0) { this.blink = 0.12; this.blinkAt = 2 + Math.random() * 3.5; }
    this.blink = Math.max(0, this.blink - dt);
  }

  setFacing(f: number) { if (f !== this.facing) { this.facing = f; this.dirty = true; } }

  setTint(c: number) { this.root.setTint(c); }

  destroy() { this.root.destroy(); if (this.scene.textures.exists(this.tex.key)) this.scene.textures.remove(this.tex.key); }

  /* ------------------------------------------------------------------ painting */

  private paint() {
    const p = this.pix, b = this.brush, l = this.loadout, r = this.cur, u = this.u;
    p.clear(); b.reset();
    const sx = this.facing * r.turn;
    const mir = this.facing < 0 ? -1 : 1;
    const back = r.turn < -0.05;
    const front = Math.abs(r.turn) < 0.28;
    const S = u * K;
    const X = (wx: number) => this.ox + sx * wx * S;
    const Y = (wy: number) => this.oy - wy * S;
    const skin = SKIN_TONES[l.skin];

    const bx = r.bodyX;
    const hipW = [bx, r.hipY];
    const tu = [Math.sin(r.lean), Math.cos(r.lean)];
    const neckW = [hipW[0] + tu[0] * TORSO, hipW[1] + tu[1] * TORSO];
    const shW = [hipW[0] + tu[0] * SHOULDER, hipW[1] + tu[1] * SHOULDER];
    const hx = X(hipW[0]), hy = Y(hipW[1]);
    const nx = X(neckW[0]), ny = Y(neckW[1]);

    const leg = (far: boolean) => {
      const ox = far ? -4 : 4;
      const fx = far ? r.bFx : r.fFx, fy = far ? r.bFy : r.fFy, ank = far ? r.bAnk : r.fAnk;
      const [a1, a2] = ik(THIGH, SHIN, bx + fx - (hipW[0] + ox), hipW[1] - (fy + ANKLE), 1);
      const hp = [hipW[0] + ox, hipW[1]];
      const kn = [hp[0] + THIGH * Math.sin(a1), hp[1] - THIGH * Math.cos(a1)];
      const an = [kn[0] + SHIN * Math.sin(a2), kn[1] - SHIN * Math.cos(a2)];
      return { hp: [X(hp[0]), Y(hp[1])], kn: [X(kn[0]), Y(kn[1])], an: [X(an[0]), Y(an[1])], ank, far };
    };
    const arm = (far: boolean) => {
      const hxT = (far ? r.bHx : r.fHx) + bx, hyT = far ? r.bHy : r.fHy;
      const sw = [shW[0] + (far ? -1.5 : 1.5), shW[1]];
      const [a1, a2] = ik(UPPER, FORE, hxT - sw[0], sw[1] - hyT, -1);
      const el = [sw[0] + UPPER * Math.sin(a1), sw[1] - UPPER * Math.cos(a1)];
      const wr = [el[0] + FORE * Math.sin(a2), el[1] - FORE * Math.cos(a2)];
      return { sh: [X(sw[0]), Y(sw[1])], el: [X(el[0]), Y(el[1])], wr: [X(wr[0]), Y(wr[1])], far };
    };

    const legB = leg(true), legF = leg(false), armB = arm(true), armF = arm(false);

    const headTh = r.lean * 0.5 + r.head;
    const hcW = [neckW[0] + Math.sin(headTh) * 19, neckW[1] + Math.cos(headTh) * 19];
    const head = { x: X(hcW[0]), y: Y(hcW[1]), th: headTh };

    /* ---- hair / hood behind the head ---- */
    b.part = 8;
    this.hairBack(b, head, mir, u, back, l, sx);
    if (l.top === 'hoodie') {
      b.begin().frame(nx - sx * 1.2 * u, ny + 0.5 * u, r.lean * mir, mir, u, 7, (x, y) => ((x + 3.5) ** 2) / 16 + ((y + 0.5) ** 2) / 11 <= 1).commit(shade(l.topColor, 0.82));
    }

    /* ---- far limbs, torso, near leg ---- */
    b.part = 1; this.legPiece(b, legB, l, skin, u, sx);
    b.part = 2; this.armPiece(b, armB, l, skin, u, true);
    b.part = 3; this.torsoPiece(b, [hx, hy], [nx, ny], l, skin, u, r.lean, sx, mir);
    b.part = 4; this.legPiece(b, legF, l, skin, u, sx);

    /* ---- head ---- */
    b.part = 5; this.headPiece(b, head, r, l, skin, u, sx, mir, back, front);
    this.chainPiece(b, [hx, hy], [nx, ny], l, u, r.lean, sx);

    /* ---- near arm ---- */
    b.part = 7; this.armPiece(b, armF, l, skin, u, false);

    p.outline(OUT);
    p.upload(this.tex.getContext());
    this.tex.refresh();
    this.dirty = false;
  }

  private legPiece(b: Brush, L: { hp: number[]; kn: number[]; an: number[]; ank: number; far: boolean }, l: Loadout, skin: Col, u: number, sx: number) {
    const far = L.far, k = far ? 0.74 : 1;
    const sk = shade(skin, k), bc = shade(l.bottomColor, k), bt = shade(l.bottomTrim, k);
    const [hx, hy] = L.hp, [kx, ky] = L.kn, [ax, ay] = L.an;
    b.begin().cap(hx, hy, kx, ky, 3.3 * u, 2.6 * u).commit(sk);
    b.begin().cap(kx, ky, ax, ay, 2.5 * u, 1.8 * u).commit(sk);
    const covered = l.bottom === 'sweats' || l.bottom === 'joggers';
    if (l.socks !== 'none' && !covered) {
      const t0 = l.socks === 'long' ? 0.34 : 0.62;
      const sc = shade(l.sockColor, k);
      b.begin().cap(kx, ky, ax, ay, 2.6 * u, 1.9 * u, t0, 1, false, true).commit(sc);
      b.begin().cap(kx, ky, ax, ay, 2.7 * u, 2 * u, t0, t0 + 0.09, false, false).commit(shade(l.bottomTrim === l.sockColor ? l.shoeSole : l.bottomTrim, k), { flat: true, line: null });
    }
    if (l.bottom === 'shorts') {
      b.begin().cap(hx, hy, kx, ky, 4.2 * u, 4.9 * u, 0, 0.58, true, false).commit(bc);
      b.begin().cap(hx, hy, kx, ky, 4.3 * u, 5 * u, 0.5, 0.6, false, false).commit(bt, { flat: true, line: null });
    } else if (l.bottom === 'longShorts') {
      const ex = kx + (kx - hx) * 0.12, ey = ky + (ky - hy) * 0.12;
      b.begin().cap(hx, hy, ex, ey, 4.3 * u, 5.4 * u, 0, 1, true, false).commit(bc);
      b.begin().cap(hx, hy, ex, ey, 4.4 * u, 5.5 * u, 0.88, 1, false, false).commit(bt, { flat: true, line: null });
    } else if (covered) {
      const w0 = l.bottom === 'joggers' ? 3.9 : 4.2, w1 = l.bottom === 'joggers' ? 3.1 : 3.9, w2 = l.bottom === 'joggers' ? 2.9 : 3.5, w3 = l.bottom === 'joggers' ? 2.4 : 3.1;
      b.begin().cap(hx, hy, kx, ky, w0 * u, w1 * u, 0, 1, true, false).commit(bc);
      b.begin().cap(kx, ky, ax, ay, w2 * u, w3 * u, 0, 0.94, false, false).commit(bc);
      b.begin().cap(kx, ky, ax, ay, (w3 + 0.1) * u, (w3 + 0.2) * u, 0.78, 0.96, false, false).commit(bt, { flat: true, line: l.bottom === 'joggers' ? shade(bt, 0.6) : null });
    }
    this.shoe(b, L, l, k, u, sx);
  }

  private shoe(b: Brush, L: { kn: number[]; an: number[]; ank: number; far: boolean }, l: Loadout, k: number, u: number, sx: number) {
    const [ax, ay] = L.an;
    const sc = shade(l.shoeColor, k), so = shade(l.shoeSole, k);
    const th = L.ank;
    if (l.shoes === 'high') b.begin().cap(L.kn[0], L.kn[1], ax, ay, 2.7 * u, 2.5 * u, 0.74, 1, false, false).commit(sc);
    b.begin().frame(ax, ay + 0.2 * u, th, sx, u, 12, (x, y) => {
      if (y < -1.1 || y > 1.5) return false;
      if (x < -3.4 || x > 7) return false;
      if (x > 4.4 && y < -1.1 + (x - 4.4) * 0.5) return false;
      if (l.shoes === 'runner' && x > 5.4 && y < 0.2) return false;
      return true;
    }).commit(sc);
    b.begin().frame(ax, ay + 0.2 * u, th, sx, u, 12, (x, y) => y >= -1.1 && y <= 0.1 && x >= 0.6 && x <= 3.2).commit(shade(l.shoeColor, k * 1.35), { flat: true, line: null });
    b.begin().frame(ax, ay + 0.2 * u, th, sx, u, 12, (x, y) => y > 1.5 && y <= 2.5 && x >= -3.6 && x <= 7.4).commit(so, { flat: false });
  }

  private armPiece(b: Brush, A: { sh: number[]; el: number[]; wr: number[]; far: boolean }, l: Loadout, skin: Col, u: number, far: boolean) {
    const k = far ? 0.74 : 1;
    const sk = shade(skin, k), tc = shade(l.topColor, k), tt = shade(l.topTrim, k);
    const [sx0, sy0] = A.sh, [ex, ey] = A.el, [wx, wy] = A.wr;
    b.begin().cap(sx0, sy0, ex, ey, 1.95 * u, 1.75 * u).commit(sk);
    b.begin().cap(ex, ey, wx, wy, 1.65 * u, 1.4 * u).commit(sk);
    const sleeveUp = (c: Col, a: number, bb: number, rr: number) => b.begin().cap(sx0, sy0, ex, ey, (2.2 + rr) * u, (2 + rr) * u, a, bb, true, false).commit(c);
    const t = l.top;
    if (t === 'tee' || t === 'jersey') {
      if (t === 'tee') { sleeveUp(tc, 0, 0.55, 0.5); b.begin().cap(sx0, sy0, ex, ey, 2.7 * u, 2.5 * u, 0.5, 0.58, false, false).commit(tt, { flat: true, line: null }); }
    } else if (t === 'hoodie' || t === 'longsleeve') {
      sleeveUp(tc, 0, 1, t === 'hoodie' ? 0.8 : 0.3);
      b.begin().cap(ex, ey, wx, wy, (1.9 + (t === 'hoodie' ? 0.8 : 0.3)) * u, (1.7 + (t === 'hoodie' ? 0.7 : 0.3)) * u, 0, 0.9, false, false).commit(tc);
      b.begin().cap(ex, ey, wx, wy, 2.2 * u, 2 * u, 0.8, 0.95, false, false).commit(tt, { flat: true, line: null });
    }
    if (l.wrist === 'bands') b.begin().cap(ex, ey, wx, wy, 1.95 * u, 1.75 * u, 0.62, 0.84, false, false).commit(shade(l.wristColor, k), { flat: true, line: null });
    if (l.wrist === 'sleeve' && !far) {
      b.begin().cap(sx0, sy0, ex, ey, 2.4 * u, 2.1 * u, 0.55, 1, false, true).commit(l.wristColor);
      b.begin().cap(ex, ey, wx, wy, 2.1 * u, 1.9 * u, 0, 0.85, true, false).commit(l.wristColor);
    }
    const dx = wx - ex, dy = wy - ey, d = Math.hypot(dx, dy) || 1;
    b.begin().disc(wx + (dx / d) * 1.2 * u, wy + (dy / d) * 1.2 * u, 2.05 * u).commit(sk);
  }

  private torsoPiece(b: Brush, h: number[], n: number[], l: Loadout, skin: Col, u: number, lean: number, sx: number, mir: number) {
    const [hx, hy] = h, [nx, ny] = n;
    b.begin().cap(hx, hy, nx, ny, 4.7 * u, 6.2 * u).commit(skin);
    const bw = l.bottom === 'sweats' || l.bottom === 'joggers' ? 0.5 : 0.7;
    b.begin().cap(hx, hy, nx, ny, (4.7 + bw) * u, (5.5 + bw) * u, 0, 0.3, true, false).commit(l.bottomColor);
    b.begin().cap(hx, hy, nx, ny, (4.9 + bw) * u, (5.7 + bw) * u, 0.26, 0.33, false, false).commit(l.bottomTrim, { flat: true, line: null });
    const hood = l.top === 'hoodie';
    const extra = hood ? 1.1 : l.top === 'longsleeve' ? 0.6 : 0.5;
    const sleeveless = l.top === 'tank' || l.top === 'jersey';
    b.begin().cap(hx, hy, nx, ny, (4.8 + extra) * u, (6.2 + extra) * u, 0.27, 1, false, true).commit(l.topColor);
    if (hood || l.top === 'tee' || l.top === 'longsleeve') b.begin().cap(hx, hy, nx, ny, (5 + extra) * u, (6.4 + extra * 0.5) * u, 0.27, 0.37, false, false).commit(l.topTrim, { flat: true, line: null });
    if (l.top === 'tank') b.begin().cap(hx, hy, nx, ny, (4.8 + extra) * u, (6.6 + extra) * u, 0.2, 0.26, false, false).commit(l.topTrim, { flat: true, line: null });
    if (l.top === 'jersey') {
      b.begin().cap(hx, hy, nx, ny, 5.3 * u, 6.7 * u, 0.5, 0.58, false, false).commit(l.topTrim, { flat: true, line: null });
    }
    const ang = lean;
    if (sleeveless) {
      b.begin().frame(nx, ny, ang, sx, u, 8, (x, y) => ((x - 1.4) ** 2) / 8 + ((y + 0.4) ** 2) / 12 <= 1 && y >= -0.4).commit(skin, { line: null, flat: true });
      b.begin().frame(nx, ny, ang, sx, u, 8, (x, y) => { const d = ((x - 1.4) ** 2) / 8 + ((y + 0.4) ** 2) / 12; return d <= 1.9 && d > 1 && y >= -0.4; }).commit(l.topTrim, { flat: true, line: null });
    } else if (!hood) {
      b.begin().frame(nx, ny, ang, sx, u, 8, (x, y) => { const d = ((x - 0.6) ** 2) / 14 + ((y + 0.2) ** 2) / 9; return d <= 1 && d > 0.45 && y >= -0.2; }).commit(l.topTrim, { flat: true, line: null });
    }
    if (hood) {
      b.begin().frame((hx + nx) / 2 + 0, (hy + ny) / 2 + 1 * u, ang, sx, u, 9, (x, y) => x >= 1.6 && x <= 7 && y >= -3.2 && y <= 2.4).commit(shade(l.topColor, 0.86));
      b.begin().frame(nx, ny + 1.2 * u, ang, sx, u, 9, (x, y) => (x >= 3.2 && x <= 3.9 && y >= 0.5 && y <= 6) || (x >= 5.2 && x <= 5.9 && y >= 0.5 && y <= 5.5)).commit(l.topTrim, { flat: true, line: null });
    }
    void mir;
  }

  private chainPiece(b: Brush, h: number[], n: number[], l: Loadout, u: number, lean: number, sx: number) {
    if (l.chain === 'none') return;
    const col = l.chain === 'gold' ? 0xf0c040 : 0xdfe6ee, dk = l.chain === 'gold' ? 0xb88820 : 0x8d99a8;
    const ang = lean;
    const fwd = [Math.cos(ang) * sx, Math.sin(ang)];
    const at = (t: number, off: number) => [h[0] + (n[0] - h[0]) * t + fwd[0] * off, h[1] + (n[1] - h[1]) * t + fwd[1] * off];
    const pts = [at(0.98, 4.6 * u), at(0.9, 6.9 * u), at(0.78, 7.2 * u), at(0.7, 6.6 * u)];
    for (let i = 1; i < pts.length; i++) this.pix.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], col);
    const pd = at(0.66, 6.6 * u);
    const px = pd[0] + this.chain.x * sx, py = pd[1] + this.chain.y;
    this.pix.line(pts[3][0], pts[3][1], px, py, dk);
    this.pix.rect(Math.round(px) - 1, Math.round(py), 3, 3, col);
    this.pix.set(Math.round(px), Math.round(py) + 1, dk);
    this.pix.set(Math.round(px) - 1, Math.round(py), 0xffffff);
    void b;
  }

  private hairBack(b: Brush, hd: { x: number; y: number; th: number }, mir: number, u: number, back: boolean, l: Loadout, sx: number) {
    const hc = l.hairColor;
    const F = (th: number, ext: number, pred: (x: number, y: number) => boolean) => b.begin().frame(hd.x, hd.y, th, sx, u, ext, pred);
    if (l.hair === 'afro') {
      F(hd.th, 14, (x, y) => ((x + 1.6) ** 2) / 85 + ((y + 2.6) ** 2) / 78 <= 1).commit(hc, { hi: shade(hc, 1.5) });
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4, rr = 5.5 + (i % 3) * 1.2;
        const [px, py] = this.loc(hd, sx, u, -1.6 + Math.cos(a) * rr, -2.6 + Math.sin(a) * rr * 0.95);
        this.pix.set(px, py, shade(hc, 1.7));
      }
    }
    if (l.hair === 'braids' || l.hair === 'locs') {
      const n = l.hair === 'braids' ? 5 : 4, thick = l.hair === 'braids' ? 0.95 : 1.35, len = l.hair === 'braids' ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const [rx, ry] = this.loc(hd, sx, u, -5.2 + i * 0.7, -3.4 + i * 1.5);
        let px = rx, py = ry;
        const seg = l.hair === 'braids' ? 2.9 : 2.2;
        for (let s = 0; s < len + (i % 2); s++) {
          const w = (s + 1) / (len + 1);
          const nx = px + (-sx * (0.9 + s * 0.3) + this.hair.x * w * sx * 0.6) * u;
          const ny = py + seg * u - this.hair.y * w * 0.4;
          b.begin().cap(px, py, nx, ny, thick * u, thick * u * 0.9).commit(shade(hc, 1 + (s % 2) * 0.25), { line: null });
          px = nx; py = ny;
        }
        const bead = l.hair === 'braids' ? 0xe8c070 : shade(hc, 1.4);
        this.pix.set(px, py, bead);
      }
    }
    void mir; void back;
  }

  /** Local head frame point (x forward, y down) to canvas px. */
  private loc(hd: { x: number; y: number; th: number }, sx: number, u: number, lx: number, ly: number): [number, number] {
    const c = Math.cos(hd.th), s = Math.sin(hd.th);
    return [Math.floor(hd.x + sx * (lx * c - ly * s) * u), Math.floor(hd.y + (lx * s + ly * c) * u)];
  }

  private headPiece(b: Brush, hd: { x: number; y: number; th: number }, r: Rig, l: Loadout, skin: Col, u: number, sx: number, mir: number, back: boolean, front: boolean) {
    const th = hd.th;
    const F = (ext: number, pred: (x: number, y: number) => boolean) => b.begin().frame(hd.x, hd.y, th, sx, u, ext, pred);
    F(9, (x, y) => (x >= -3.4 && x <= 1.8 && y >= 3 && y <= 9.5)).commit(shade(skin, 0.85), { line: null });
    const skull = (x: number, y: number) => ((x) ** 2) / 31 + ((y + 0.3) ** 2) / 33 <= 1;
    const jaw = (x: number, y: number) => ((x - 0.9) ** 2) / 17.5 + ((y - 3.1) ** 2) / 9.5 <= 1;
    F(10, (x, y) => skull(x, y) || jaw(x, y) || (x >= 4.8 && x <= 6.5 && y >= -0.2 && y <= 1.9 && !front)).commit(skin);
    const sdw = shade(skin, 0.8);
    if (!back && !front) {
      F(8, (x, y) => x >= 4.9 && x <= 6.5 && y >= 0.1 && y <= 1.8).commit(shade(skin, 1.03), { line: null });
    }
    const hc = l.hairColor;
    const hairOn = (x: number, y: number) => skull(x, y) && (y < -2.4 || (x < -2.6 && y < 1.2) || (x < -4.2 && y < 2.4));
    if (l.hair === 'fade' || l.hair === 'braids' || l.hair === 'locs' || l.hair === 'twists' || l.hair === 'waves') {
      F(10, (x, y) => hairOn(x, y) || (x >= -1.6 && x <= -0.2 && y >= -2.6 && y <= 1.4 && skull(x, y))).commit(hc, { line: null });
      F(10, (x, y) => skull(x, y) && !hairOn(x, y) && x < -3 && y < 3.4 && y >= 1.2).commit(shade(skin, 0.7), { flat: true, line: null });
      if (l.hair === 'waves') for (let y = -5; y <= -2; y += 1) for (let x = -4; x <= 3; x++) { if (((x + y * 2) & 3) === 0) { const [qx, qy] = this.loc(hd, sx, u, x, y); if (this.pix.alpha(qx, qy)) this.pix.set(qx, qy, shade(hc, 1.7)); } }
      if (l.hair === 'twists') for (let i = 0; i < 5; i++) { const [qx, qy] = this.loc(hd, sx, u, -4 + i * 1.7, -5.6 - (i % 2)); this.pix.set(qx, qy, hc); this.pix.set(qx, qy - 1, shade(hc, 1.4)); }
    } else if (l.hair === 'hightop') {
      F(12, (x, y) => (x >= -5 && x <= 3.6 && y >= -10 && y <= -2.4) || hairOn(x, y)).commit(hc, { hi: shade(hc, 1.6) });
    } else if (l.hair === 'afro') {
      F(11, (x, y) => skull(x, y) && y < -3.6).commit(hc, { line: null, hi: shade(hc, 1.4) });
    } else if (l.hair === 'bald') {
      const [qx, qy] = this.loc(hd, sx, u, -1.5, -4.2); this.pix.set(qx, qy, shade(skin, 1.35));
    }

    const hd0 = l.headColor, ht = l.headTrim;
    const crown = (x: number, y: number, ry: number) => ((x + 0.2) ** 2) / 38 + ((y + 0.9) ** 2) / (ry * ry) <= 1;
    switch (l.head) {
      case 'fullcap':
      case 'backcap': {
        const dir = l.head === 'fullcap' ? 1 : -1;
        F(14, (x, y) => crown(x, y, 6.6) && y <= -1.5).commit(hd0);
        F(14, (x, y) => (dir > 0 ? x >= 2.2 && x <= 10.5 && y >= -2.3 + (x - 2.2) * 0.14 - 0.3 && y <= -0.9 + (x - 2.2) * 0.14 : x <= -3.4 && x >= -10 && y >= -2.2 && y <= -0.8)).commit(shade(hd0, 0.85), { hi: shade(hd0, 1.2) });
        F(10, (x, y) => crown(x, y, 6.6) && y <= -1.5 && y >= -2.6 && x < 3).commit(ht, { flat: true, line: null });
        { const [qx, qy] = this.loc(hd, sx, u, dir > 0 ? 3.4 : -3.4, -4.8); this.pix.set(qx, qy, ht); this.pix.set(qx + sx, qy, ht); }
        break;
      }
      case 'beanie':
        F(12, (x, y) => ((x + 0.4) ** 2) / 40 + ((y + 1.6) ** 2) / 42 <= 1 && y <= -0.4).commit(hd0);
        F(12, (x, y) => ((x + 0.4) ** 2) / 43 + ((y + 1.6) ** 2) / 46 <= 1 && y <= 0.4 && y >= -2.1).commit(ht);
        F(12, (x, y) => x > -0.3 && x < 0.9 && y < -2.2 && ((x + 0.4) ** 2) / 40 + ((y + 1.6) ** 2) / 42 <= 1).commit(shade(hd0, 0.82), { flat: true, line: null });
        break;
      case 'headband':
        F(10, (x, y) => ((x) ** 2) / 36 + ((y + 0.3) ** 2) / 38 <= 1 && y >= -3.2 && y <= -1.4).commit(hd0);
        F(10, (x, y) => ((x) ** 2) / 36 + ((y + 0.3) ** 2) / 38 <= 1 && y >= -2.6 && y <= -2.0 && x > 1).commit(ht, { flat: true, line: null });
        this.tails(b, hd, sx, u, [[-5.4, -2.2, 3.8, 0.4], [-5.2, -2, 2.6, 2.2]], hd0);
        break;
      case 'bandana':
        F(10, (x, y) => ((x) ** 2) / 37 + ((y + 0.3) ** 2) / 38.5 <= 1 && y >= -3.8 && y <= -1.0).commit(hd0);
        for (let i = -4; i <= 4; i += 2) { const [qx, qy] = this.loc(hd, sx, u, i, -2.4 + (i % 4 === 0 ? 0 : 0.5)); if (this.pix.alpha(qx, qy)) this.pix.set(qx, qy, ht); }
        this.tails(b, hd, sx, u, [[-5.4, -2.4, 4.5, 0.8], [-5.2, -1.8, 3.6, 2.6]], hd0);
        break;
      case 'durag':
        F(12, (x, y) => skull(x, y) && (y <= -0.8 || x < -2)).commit(hd0, { hi: shade(hd0, 1.6) });
        F(12, (x, y) => skull(x, y) && x > -2.3 && x < -1.4 && y < -1).commit(shade(hd0, 0.7), { flat: true, line: null });
        this.tails(b, hd, sx, u, [[-5, -0.4, 6.4, 1.4], [-5, 0.8, 5.2, 3.4]], hd0);
        break;
      case 'bucket':
        F(14, (x, y) => ((x + 0.2) ** 2) / 36 + ((y + 1.4) ** 2) / 36 <= 1 && y <= -1.8).commit(hd0);
        F(16, (x, y) => ((x - 0.4) ** 2) / 110 + ((y + 1.4) ** 2) / 2.6 <= 1).commit(shade(hd0, 0.9), { hi: shade(hd0, 1.2) });
        F(10, (x, y) => ((x + 0.2) ** 2) / 36 + ((y + 1.4) ** 2) / 36 <= 1 && y >= -3.8 && y <= -2.6).commit(ht, { flat: true, line: null });
        break;
      default: break;
    }

    if (l.face === 'beard') F(10, (x, y) => jaw(x, y) && y >= 1.4 && x > -2.4 && !(x > 3 && y < 3.6)).commit(l.faceColor, { line: null });
    if (l.face === 'goatee') F(8, (x, y) => x >= 2.0 && x <= 5.2 && y >= 3.0 && y <= 6).commit(l.faceColor, { line: null });
    if (l.face === 'shades' && !back) {
      F(10, (x, y) => (x >= 0.6 && x <= 6.4 && y >= -2.0 && y <= 0.5) || (x >= -3.6 && x <= 0.8 && y >= -1.4 && y <= -0.6)).commit(l.faceColor, { line: null, flat: true });
      const [qx, qy] = this.loc(hd, sx, u, 4.4, -1.4); this.pix.set(qx, qy, 0x8fb8d8);
    }
    if (l.face === 'glasses' && !back) {
      for (const [cx, cy] of [[2.6, -0.6], [5.2, -0.6]]) {
        for (let a = 0; a < 8; a++) { const [qx, qy] = this.loc(hd, sx, u, cx + Math.cos(a * 0.785) * 1.7, cy + Math.sin(a * 0.785) * 1.7); this.pix.set(qx, qy, l.faceColor); }
      }
    }

    if (back) return;
    const px = (lx: number, ly: number, c: Col) => { const [qx, qy] = this.loc(hd, sx, u, lx, ly); this.pix.set(qx, qy, c); };
    const blinking = this.blink > 0 || r.emo < -0.5;
    const shadesOn = l.face === 'shades';
    if (front) {
      for (const ex of [-2, 2]) { if (!shadesOn) { px(ex, -0.5, 0xffffff); px(ex + 1, -0.5, OUT); } px(ex, -1.9, shade(l.hairColor, 0.8)); }
      px(0, 1.5, shade(skin, 0.75));
      for (const mx of [-1, 0, 1]) px(mx, 4, r.mouth > 0.4 ? 0x5a1a22 : shade(skin, 0.6));
      return;
    }
    if (!shadesOn && l.face !== 'glasses') {
      if (blinking) { px(2.6, -0.2, OUT); px(3.6, -0.2, OUT); } else { px(2.6, -0.6, 0xffffff); px(3.6, -0.6, OUT); px(3.6, 0.4, OUT); }
      const bro = r.emo < -0.3 ? 0.8 : r.emo > 0.4 ? -0.4 : 0;
      px(2.2, -2.3 - bro * 0.4, shade(hc, 0.9)); px(3.3, -2.3 + bro, shade(hc, 0.9)); px(4.4, -2.3 + bro * 1.4, shade(hc, 0.9));
    } else if (l.face === 'glasses') { px(2.6, -0.6, 0xffffff); px(3.6, -0.6, OUT); }
    px(-1.2, 0.8, shade(skin, 0.72)); px(-1.2, 1.8, shade(skin, 0.72));
    const mc = l.face === 'beard' || l.face === 'goatee' ? shade(skin, 0.6) : shade(skin, 0.55);
    if (r.mouth > 0.4) { px(3.4, 3.4, 0x5a1a22); px(4.4, 3.4, 0x5a1a22); px(3.4, 4.4, 0x7a2a32); px(4.4, 4.4, 0x5a1a22); }
    else if (r.emo > 0.4) { px(3.0, 3.6, mc); px(4.0, 3.9, mc); px(5.0, 3.6, mc); px(5.6, 3.1, mc); }
    else if (r.emo < -0.4) { px(3.4, 4.1, mc); px(4.4, 3.6, mc); px(5.2, 4.1, mc); }
    else { px(3.6, 3.6, mc); px(4.6, 3.6, mc); }
    void mir;
  }

  /** Flapping cloth tails from the back of the head, driven by the inertia trail. */
  private tails(b: Brush, hd: { x: number; y: number; th: number }, sx: number, u: number, defs: number[][], col: Col) {
    for (const [lx, ly, len, drop] of defs) {
      const [x0, y0] = this.loc(hd, sx, u, lx, ly);
      const ex = x0 - sx * len * u * 0.85 + this.tail.x * sx * 0.8;
      const ey = y0 + drop * u * 0.9 - this.tail.y * 0.6 + 0.5;
      b.begin().cap(x0, y0, ex, ey, 1.3 * u, 0.9 * u).commit(shade(col, 0.9), { line: shade(col, 0.5) });
    }
  }
}
