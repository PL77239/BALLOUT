import Phaser from 'phaser';
import { GARMENT_CUTS } from './wardrobe';
import textureData from './garment-textures.json';
const textures:Record<string,string[]> = textureData;
const sampleTexture=(id:string|undefined,x:number,y:number)=>{
  const tiled=id?.startsWith('tile:') ?? false;
  const rows=id?textures[tiled?id.slice(5):id]:undefined;if(!rows?.length)return '.';
  let ix=Math.floor(x),iy=Math.floor(y);
  if(tiled){iy=((iy%rows.length)+rows.length)%rows.length;const w=rows[iy].length;ix=((ix%w)+w)%w;}
  return rows[iy]?.[ix] ?? '.';
};
import { Col, PX, Pix, clamp, lerp, mix, pixTexture, shade, smooth } from './pixel';
import { Loadout, SKIN_TONES, hairUnderHeadwear } from './loadout';

export const THIGH = 44;
export const SHIN = 42;
export const ANKLE = 7;
export const TORSO = 66;
export const SHOULDER = 57;
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
  spin: number;
  emo: number;
  mouth: number;
}

export const restRig = (): Rig => ({
  hipY: 88, lean: 0.04, head: 0,
  fFx: 17, fFy: 0, bFx: -17, bFy: 0, fAnk: 0, bAnk: 0,
  fHx: 14, fHy: 86 + 50 - 62, bHx: -6, bHy: 86 + 50 - 62,
  bodyX: 0, turn: 1, spin: 0, emo: 0, mouth: 0,
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
  { keys: ['hipY', 'lean', 'bodyX'], w: 32, z: 0.88 },
  { keys: ['fFx', 'fFy', 'bFx', 'bFy', 'fAnk', 'bAnk'], w: 42, z: 0.95 },
  { keys: ['fHx', 'fHy', 'bHx', 'bHy'], w: 38, z: 0.82 },
  { keys: ['head'], w: 18, z: 0.5 },
];
const DIRECT: RigKey[] = ['turn', 'spin', 'emo', 'mouth'];

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
    const ws = (sx < 0 ? -1 : 1) * Math.max(Math.abs(sx), 0.9);
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

  /** Recolour pixels of the current mask without touching outlines or part ids. */
  ink(f: (x: number, y: number) => Col | -1) {
    for (let y = this.y0; y <= this.y1; y++) {
      for (let x = this.x0; x <= this.x1; x++) {
        if (!this.has(x, y)) continue;
        const c = f(x, y);
        if (c !== -1 && this.p.alpha(x, y) > 0) this.p.set(x, y, c);
      }
    }
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

/** How much wider than bare skin the torso silhouette gets for each top. */
export const topExtra = (t: Loadout['top']) =>
  t === 'puffer' ? 1.65 : t === 'bigTee' ? 1.45 : t === 'hoodie' ? 1.05 : t === 'flannel' ? 0.95 : t === 'longsleeve' ? 0.55 : 0.48;

const COVERED = new Set(['sweats', 'joggers', 'jeans', 'khakis']);

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
  private cloth = trail();
  private hemF = trail();
  private hemB = trail();
  private lastV = { f: 0, h: 0 };
  private lastHead = { x: 0, y: 0, px: 0, py: 0 };
  private t = Math.random() * 10;
  private blinkAt = 2 + Math.random() * 3;
  private blink = 0;
  private dirty = true;

  constructor(private scene: Phaser.Scene, loadout: Loadout, o: PuppetOpts = {}) {
    this.u = o.scale ?? 1;
    this.CWd = o.w ?? 128; this.CHt = o.h ?? 144;
    this.ox = this.CWd / 2; this.oy = this.CHt - (o.h ? 8 : 32);
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
    this.simulate(target, dt, pins, motion);
    this.paint();
  }

  /** Advance the springs and secondary motion only; `paint` rasterises the result. */
  simulate(target: Rig, dt: number, pins: { f?: boolean; b?: boolean } = {}, motion = { f: 0, h: 0 }) {
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
    // Soft cloth trails the gait. Hem corners follow each thigh with extra lag so
    // oversized tops sway instead of sliding as a stiff billboard.
    const running=clamp(Math.abs(m.f)/350,0,1);
    const airborne = m.h > 4;
    const airLift = airborne ? -2.1 : 0;
    const airFlap = airborne ? Math.sin(this.t*18)*1.7 : 0;
    const stride=clamp((this.cur.fFx-this.cur.bFx)/55,-1,1);
    step(this.cloth, 72, 8.5, 1.45,
      clamp(-this.vel.lean*.85,-2.4,2.4)-running*1.7+Math.sin(this.t*11)*running*1.55+airFlap,
      clamp(-this.vel.hipY*.02,-2,2)+Math.sin(this.t*21)*running*.9+airLift+Math.abs(stride)*running*.45);
    step(this.hemF, 48, 7.2, 1.7,
      clamp(this.cur.fFx*.05,-3.6,3.6)-running*1.05+Math.sin(this.t*9)*running*.4,
      clamp(this.cur.fFy*.08,-3,2.4)+Math.sin(this.t*14)*running*.55);
    step(this.hemB, 48, 7.2, 1.7,
      clamp(this.cur.bFx*.05,-3.6,3.6)-running*1.05+Math.sin(this.t*9+Math.PI)*running*.4,
      clamp(this.cur.bFy*.08,-3,2.4)+Math.sin(this.t*14+Math.PI)*running*.55);
    this.t += dt;
    this.blinkAt -= dt;
    if (this.blinkAt <= 0) { this.blink = 0.12; this.blinkAt = 2 + Math.random() * 3.5; }
    this.blink = Math.max(0, this.blink - dt);
  }

  setFacing(f: number) { if (f !== this.facing) { this.facing = f; this.dirty = true; } }

  setTint(c: number) { this.root.setTint(c); }

  destroy() { this.root.destroy(); if (this.scene.textures.exists(this.tex.key)) this.scene.textures.remove(this.tex.key); }

  /* ------------------------------------------------------------------ painting */

  paint() {
    const equipped = this.loadout;
    const hair = hairUnderHeadwear(equipped.hair,equipped.head);
    const l = hair === equipped.hair ? equipped : {...equipped,hair};
    const p = this.pix, b = this.brush, r = this.cur, u = this.u;
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
      // Seat joins under the shirt; volume opens out down the thighs.
      const ox = far ? -5 : 5;
      const fx = far ? r.bFx : r.fFx, fy = far ? r.bFy : r.fFy, ank = far ? r.bAnk : r.fAnk;
      const [a1, a2] = ik(THIGH, SHIN, bx + fx - (hipW[0] + ox), hipW[1] - (fy + ANKLE), 1);
      const hp = [hipW[0] + ox, hipW[1]];
      const kn = [hp[0] + THIGH * Math.sin(a1), hp[1] - THIGH * Math.cos(a1)];
      const an = [kn[0] + SHIN * Math.sin(a2), kn[1] - SHIN * Math.cos(a2)];
      return { hp: [X(hp[0]), Y(hp[1])], kn: [X(kn[0]), Y(kn[1])], an: [X(an[0]), Y(an[1])], ank, far };
    };
    const arm = (far: boolean) => {
      const hxT = (far ? r.bHx : r.fHx) + bx, hyT = far ? r.bHy : r.fHy;
      const sw = [shW[0] + (far ? -6 : 6), shW[1]];
      const [a1, a2] = ik(UPPER, FORE, hxT - sw[0], sw[1] - hyT, -1);
      const el = [sw[0] + UPPER * Math.sin(a1), sw[1] - UPPER * Math.cos(a1)];
      const wr = [el[0] + FORE * Math.sin(a2), el[1] - FORE * Math.cos(a2)];
      return { sh: [X(sw[0]), Y(sw[1])], el: [X(el[0]), Y(el[1])], wr: [X(wr[0]), Y(wr[1])], far };
    };

    const legB = leg(true), legF = leg(false), armB = arm(true), armF = arm(false);
    // Facing the camera separates left/right limbs in depth instead of collapsing
    // every joint onto the same vertical line as a horizontally scaled sprite.
    const open = (1-Math.abs(r.turn))*u*this.facing;
    for(const [L,side] of [[legB,-1],[legF,1]] as const) for(const point of [L.hp,L.kn,L.an]) point[0]+=side*3.5*open;
    for(const [A,side] of [[armB,-1],[armF,1]] as const) for(const point of [A.sh,A.el,A.wr]) point[0]+=side*5*open;
    if(r.spin>0 && r.spin<1) {
      // Broken, low-contrast pixel arcs follow the pivot rather than hiding play.
      for(const row of [0,1]) for(let i=0;i<16;i++) {
        const a=i*.21+r.spin*Math.PI*2+row*Math.PI;
        const x=hx+Math.cos(a)*(14+row*3)*u, y=hy-8*u+Math.sin(a)*4*u;
        if(i%5!==0) p.set(Math.round(x),Math.round(y),row?0x566875:0x839495);
      }
    }

    const headTh = r.lean * 0.5 + r.head;
    // Athletic proportions, closer to a digitised arcade player than a mascot.
    const hu=u*1.12;
    const hcW = [neckW[0] + Math.sin(headTh) * 19, neckW[1] + Math.cos(headTh) * 19];
    const head = { x: X(hcW[0]), y: Y(hcW[1]), th: headTh };

    /* ---- hair bulk behind the body ---- */
    b.part = 8;
    this.hairBack(b, head, mir, hu, back, l, sx);

    /* ---- far limbs, torso, near leg ---- */
    b.part = 1; this.legPiece(b, legB, l, skin, u, sx);
    b.part = 2; this.armPiece(b, armB, l, skin, u, true);
    // The seat belongs to the trousers, not either individual leg. Bridge the
    // moving thigh roots before drawing the near leg and shirt over it.
    b.part = 4;
    b.begin().cap(legB.hp[0],legB.hp[1],legF.hp[0],legF.hp[1],5.1*u,5.1*u,0,1,true,true)
      .commit(l.bottomColor,{line:null});
    b.part = 4; this.legPiece(b, legF, l, skin, u, sx);
    b.part = 3; this.torsoPiece(b, [hx, hy], [nx, ny], l, skin, u, r.lean, sx, mir, [legF.kn,legB.kn]);

    if (l.top === 'hoodie') {
      b.part = 9;
      // Hood sits on the back of the head in profile, not as a front-facing halo.
      const hoodBack = 2.4 + 2.2 * clamp(Math.abs(r.turn), 0, 1);
      b.begin().frame(nx - sx * 1.6 * u, ny + 0.4 * u, r.lean * mir, mir, u, 8, (x, y) => ((x + hoodBack) ** 2) / 15 + ((y + 0.2) ** 2) / 12 <= 1).commit(shade(l.topColor, 0.82));
    }

    /* ---- head (face + hair on skull; hats drawn later) ---- */
    b.part = 5; this.headPiece(b, head, r, l, skin, hu, sx, mir, back, front);
    this.chainPiece(b, [hx, hy], [nx, ny], l, u, r.lean, sx);

    /* ---- near arm, then headwear on top ---- */
    b.part = 7; this.armPiece(b, armF, l, skin, u, false);
    b.part = 10; this.headWear(b, head, r, l, hu, sx, mir, back, front);

    p.outline(OUT);
    p.upload(this.tex.getContext());
    this.tex.refresh();
    this.dirty = false;
  }

  /** Quantised directional light follows the limb as it bends. */
  private skinVolume(b: Brush, a: number[], z: number[], radius: number, color: Col, u: number) {
    const dx=z[0]-a[0], dy=z[1]-a[1], length=Math.hypot(dx,dy)||1;
    b.ink((x,y)=>{
      if(!b.has(x-1,y)||!b.has(x+1,y)||!b.has(x,y-1)||!b.has(x,y+1)) return -1;
      const side=((x+.5-a[0])*dy-(y+.5-a[1])*dx)/length/(radius*u);
      const along=((x+.5-a[0])*dx+(y+.5-a[1])*dy)/length;
      const band=side<-.45?.74:side<-.05?.91:side<.48?1.12:1.02;
      return shade(color,band*(along<length*.18?.94:1));
    });
  }

  private legPiece(b: Brush, L: { hp: number[]; kn: number[]; an: number[]; ank: number; far: boolean }, l: Loadout, skin: Col, u: number, sx: number) {
    const far = L.far, k = far ? 0.74 : 1;
    const sk = shade(skin, k), bc = shade(l.bottomColor, k), bt = shade(l.bottomTrim, k);
    const [hx, hy] = L.hp, [kx, ky] = L.kn, [ax, ay] = L.an;
    b.begin().cap(hx, hy, kx, ky, 4.8 * u, 3.3 * u,0,1,false,true).commit(sk);
    this.skinVolume(b,[hx,hy],[kx,ky],4.8,sk,u);
    b.begin().disc(kx, ky, 2.05 * u).commit(shade(sk, 0.88), { line: null, flat: true });
    b.begin().cap(kx, ky, ax, ay, 3.2 * u, 2.1 * u).commit(sk);
    this.skinVolume(b,[kx,ky],[ax,ay],3.2,sk,u);
    b.begin().disc(Math.round(kx + (ax - kx) * 0.08), Math.round(ky + (ay - ky) * 0.08), 1.35 * u).commit(shade(sk, 1.12), { line: null, flat: true });
    const covered = COVERED.has(l.bottom);
    if (l.socks !== 'none' && !covered && l.shoes !== 'boot') {
      const t0 = l.socks === 'stripe' ? 0.12 : l.socks === 'long' ? 0.34 : 0.62;
      const sc = shade(l.sockColor, k);
      b.begin().cap(kx, ky, ax, ay, 2.6 * u, 1.9 * u, t0, 1, false, true).commit(sc);
      if (l.socks === 'stripe') {
        const st = shade(l.sockTrim, k);
        for (const o of [0.04, 0.15]) b.begin().cap(kx, ky, ax, ay, 2.7 * u, 2.5 * u, t0 + o, t0 + o + 0.07, false, false).commit(st, { flat: true, line: null });
      } else {
        b.begin().cap(kx, ky, ax, ay, 2.7 * u, 2 * u, t0, t0 + 0.09, false, false).commit(shade(l.bottomTrim === l.sockColor ? l.shoeSole : l.bottomTrim, k), { flat: true, line: null });
      }
    }
    const crease = (x0: number, y0: number, x1: number, y1: number, t1: number) =>
      b.begin().cap(x0, y0, x1, y1, 0.42 * u, 0.42 * u, 0.04, t1, false, false).commit(shade(bc, 1.22), { flat: true, line: null });
    const stitch = (x0: number, y0: number, x1: number, y1: number, off: number, c: Col) => {
      const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
      let px = dy / d, py = -dx / d;
      if (px * -sx < 0) { px = -px; py = -py; }
      for (let i = 1; i < d - 1; i += 2) {
        const qx = Math.floor(x0 + (dx / d) * i + px * off), qy = Math.floor(y0 + (dy / d) * i + py * off);
        if (this.pix.alpha(qx, qy) > 0) this.pix.set(qx, qy, c);
      }
    };
    const bot = l.bottom;
    if (bot==='jorts' || bot==='chinoShorts') b.begin().disc(kx,ky,5.6*u).commit(bc,{line:null});
    if (bot === 'shorts') {
      b.begin().cap(hx, hy, kx, ky, 5.0 * u, 5.8 * u, 0, 0.62, false, false).commit(bc);
      b.begin().cap(hx, hy, kx, ky, 5.1 * u, 5.9 * u, 0.54, 0.64, false, false).commit(bt, { flat: true, line: null });
      if (l.bottomTrim !== l.bottomColor) {
        for (const o of [0.18, 0.28, 0.38]) {
          b.begin().cap(hx, hy, kx, ky, 4.35 * u, 5.05 * u, o, o + 0.055, false, false).commit(bt, { flat: true, line: null });
        }
      }
    } else if (bot === 'longShorts') {
      const ex = kx + (kx - hx) * 0.12, ey = ky + (ky - hy) * 0.12;
      b.begin().cap(hx, hy, ex, ey, 5.6 * u, 6.6 * u, 0, 1, false, false).commit(bc);
      b.begin().cap(hx, hy, ex, ey, 5.7 * u, 6.7 * u, 0.88, 1, false, false).commit(bt, { flat: true, line: null });
    } else if (bot === 'jorts') {
      const ex = kx + (ax - kx) * 0.16, ey = ky + (ay - ky) * 0.16;
      b.begin().cap(hx, hy, kx, ky, 4.4 * u, 5.5 * u, 0, 1, false, false).commit(bc);
      b.begin().cap(kx, ky, ex, ey, 5.5 * u, 5.7 * u, 0, 1, false, false).commit(bc);
      b.begin().cap(kx, ky, ex, ey, 5.6 * u, 5.8 * u, 0.74, 1, false, false).commit(bt, { flat: true, line: null });
      stitch(hx, hy, kx, ky, 4.4 * u, bt);
    } else if (bot === 'chinoShorts') {
      const w = [4.3, 5.2, 5.4, 5.0];
      b.begin().cap(hx, hy, kx, ky, w[0] * u, w[1] * u, 0, 1, false, false).commit(bc);
      b.begin().cap(kx, ky, ax, ay, w[2] * u, w[3] * u, 0, 0.34, false, false).commit(bc);
      b.begin().cap(kx, ky, ax, ay, (w[3] + 0.2) * u, (w[3] + 0.2) * u, 0.27, 0.34, false, false).commit(bt, { flat: true, line: null });
      crease(hx, hy, kx, ky, 0.96);
      crease(kx, ky, ax, ay, 0.26);
    } else if (covered) {
      const W: Record<string, number[]> = { joggers: [5.3, 4.3, 3.8, 2.3], sweats: [6.2, 5.3, 4.8, 4.0], jeans: [5.4, 4.8, 4.6, 4.2], khakis: [5.8, 5.2, 4.8, 4.1] };
      const fit=l.bottomFit;
      const [w0,w1,w2,w3]=W[bot].map((w,i)=>w+(fit==='wide'?[.6,1.1,1.5,1.8]:fit==='baggy'?[.5,.8,1.1,1.3]:fit==='stacked'?[0,.2,.5,.8]:[0,0,0,0])[i]);
      b.begin().cap(hx,hy,kx,ky,w0*u,w1*u,0,1,false,true)
        .disc(kx,ky,Math.max(w1,w2)*u)
        .cap(kx,ky,ax,ay,w2*u,w3*u,0,.94,true,false).commit(bc);
      if(l.bottomTexture==='tile:camo')b.ink((x,y)=>{
        const project=(a:number[],z:number[],offset:number)=>{const dx=z[0]-a[0],dy=z[1]-a[1],len=Math.hypot(dx,dy)||1,t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(len*len),0,1);return {d:Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t),side:((x-a[0])*dy-(y-a[1])*dx)/len,along:offset+t*len};};
        const thigh=project([hx,hy],[kx,ky],0),shin=project([kx,ky],[ax,ay],Math.hypot(kx-hx,ky-hy)),q=thigh.d<shin.d?thigh:shin;
        const ink=sampleTexture('tile:camo',q.side/u,q.along/u);return ink==='1'?shade(bc,.66):ink==='2'?bt:-1;
      });
      if (bot === 'jeans') {
        b.begin().cap(kx, ky, ax, ay, (w3 + 0.1) * u, (w3 + 0.2) * u, 0.86, 0.95, false, false).commit(shade(l.bottomColor, k * 1.25), { flat: true, line: null });
        stitch(hx, hy, kx, ky, (w0 - 1.2) * u, bt);
        stitch(kx, ky, ax, ay, (w2 - 1.0) * u, bt);
      } else if (bot === 'khakis') {
        b.begin().cap(kx, ky, ax, ay, (w3 + 0.1) * u, (w3 + 0.2) * u, 0.84, 0.94, false, false).commit(bt, { flat: true, line: null });
        crease(hx, hy, kx, ky, 0.96);
        crease(kx, ky, ax, ay, 0.8);
      } else {
        b.begin().cap(kx, ky, ax, ay, (w3 + 0.1) * u, (w3 + 0.2) * u, 0.78, 0.96, false, false).commit(bt, { flat: true, line: bot === 'joggers' ? shade(bt, 0.6) : null });
      }
    }
    if(l.bottomTexture && l.bottomTexture!=='tile:camo') {
      const dx=kx-hx,dy=ky-hy,angle=Math.atan2(-dx,dy),end=Math.hypot(dx,dy)/u;
      for(const [ink,color] of [['1',bt],['2',shade(bt,1.3)]] as const)
        b.begin().frame(hx,hy,angle,1,u,30,(x,y)=>sampleTexture(l.bottomTexture,x+3.5,y-2)===ink && Math.abs(x)<3.7 && y>=2 && y<end-.5).commit(color,{flat:true,line:null});
    }
    if (bot === 'khakis' || bot === 'chinoShorts') {
      const px = hx + (kx-hx)*.6, py = hy + (ky-hy)*.6;
      b.begin().cap(px,py,kx,ky,3.8*u,3.6*u,0,.4,false,false).commit(shade(bc,.72),{line:null});
      b.begin().cap(px,py,kx,ky,3.9*u,3.7*u,0,.08,false,false).commit(bt,{flat:true,line:null});
    }
    if(l.bottomDetail && l.bottomDetail!=='none') {
      const dx=kx-hx,dy=ky-hy,len=Math.hypot(dx,dy)||1;
      const at=(t:number,off:number)=>[hx+dx*t+dy/len*off*u,hy+dy*t-dx/len*off*u];
      if(l.bottomDetail==='stitched') {
        for(const t of [.22,.26,.30,.34]) {const [x,y]=at(t,-1.8); b.begin().disc(x,y,.65*u).commit(bt,{flat:true,line:null});}
        const [x,y]=at(.32,0);b.begin().cap(x-2*u,y,x+2*u,y, .55*u,.55*u).commit(bt,{flat:true,line:null});
      }
      if(l.bottomDetail==='crosses') for(const t of [.3,.7]) {
        const [x,y]=at(t,0);b.begin().cap(x,y-2.5*u,x,y+2.5*u,.8*u,.8*u).commit(bt,{flat:true,line:null});
        b.begin().cap(x-2*u,y-.5*u,x+2*u,y-.5*u,.8*u,.8*u).commit(bt,{flat:true,line:null});
      }
      if(l.bottomDetail==='ripped') for(const t of [.52,.68,.78]) {
        const [x,y]=at(t,0);b.begin().cap(x-2*u,y,x+2*u,y,.6*u,.6*u).commit(shade(bc,.45),{flat:true,line:null});
        b.begin().cap(x-2*u,y+u,x+2*u,y+u,.45*u,.45*u).commit(bt,{flat:true,line:null});
      }
      if(l.bottomDetail==='stripe') stitch(hx,hy,kx,ky,3.6*u,bt);
    }
    if(covered){
      // Draw fabric over the ankle collar, leaving the toe and sole visible.
      // The fold follows the actual shin and foot angle rather than the screen.
      const width=(l.bottomFit==='wide'?5.6:l.bottomFit==='baggy'?5.0:4.3)*u;
      b.begin().cap(kx,ky,ax,ay,width*.9,width,.74,.97,false,false).commit(bc,{line:null});
      const dx=ax-kx,dy=ay-ky,len=Math.hypot(dx,dy)||1;
      for(const t of [.80,.89,.95]){
        const x=kx+dx*t,y=ky+dy*t;
        b.begin().cap(x-dy/len*width*.65,y+dx/len*width*.65,x+dy/len*width*.65,y-dx/len*width*.65,.4*u,.4*u)
          .commit(shade(bc,t===.89?.68:1.13),{line:null,flat:true});
      }
    }
    this.shoe(b, L, l, skin, k, u, sx);
  }

  private shoe(b: Brush, L: { kn: number[]; an: number[]; ank: number; far: boolean }, l: Loadout, skin: Col, k: number, u: number, sx: number) {
    const [ax, ay] = L.an;
    const sc = shade(l.shoeColor, k), so = shade(l.shoeSole, k), kind = l.shoes;
    const th = L.ank;
    const fr = (ext: number, pred: (x: number, y: number) => boolean) => b.begin().frame(ax, ay + 0.2 * u, th, sx, u, ext, pred);
    if (kind === 'slides') {
      const foot = shade(l.socks !== 'none' ? l.sockColor : skin, k);
      fr(12, (x, y) => y >= -1.1 && y <= 1.5 && x >= -3 && x <= 6.2 && !(x > 4.4 && y < -1.1 + (x - 4.4) * 0.5)).commit(foot);
      fr(12, (x, y) => y >= -1.5 && y <= 0.4 && x >= 1.2 && x <= 4.6).commit(sc);
      fr(12, (x, y) => y >= -0.9 && y <= -0.5 && x >= 1.8 && x <= 3.8).commit(shade(l.shoeTrim, k), { flat: true, line: null });
      fr(12, (x, y) => y > 1.5 && y <= 2.6 && x >= -3.6 && x <= 6.8).commit(so, { flat: false });
      return;
    }
    if (kind === 'high') b.begin().cap(L.kn[0], L.kn[1], ax, ay, (l.shoeStyle==='supra'?3.1:2.7) * u, 2.5 * u, l.shoeStyle==='supra'?.60:.74, 1, false, false).commit(sc);
    if (kind === 'boot') {
      b.begin().cap(L.kn[0], L.kn[1], ax, ay, 3.0 * u, 2.9 * u, 0.62, 1, false, false).commit(sc);
      b.begin().cap(L.kn[0], L.kn[1], ax, ay, 3.2 * u, 3.1 * u, 0.62, 0.7, false, false).commit(shade(l.shoeTrim, k), { flat: true, line: null });
    }
    fr(12, (x, y) => {
      if (kind === 'boot') { if (y < -1.4 || y > 1.5 || x < -3.4 || x > 7.4) return false; return !(x > 5.2 && y < -1.4 + (x - 5.2) * 0.55); }
      if (kind === 'cortez') { if (y < -1.0 || y > 1.5 || x < -3.3 || x > 7.4) return false; return !(x > 4.2 && y < -1.0 + (x - 4.2) * 0.62); }
      if (y < -1.1 || y > 1.5) return false;
      if (x < -3.4 || x > 7) return false;
      if (x > 4.4 && y < -1.1 + (x - 4.4) * 0.5) return false;
      if (kind === 'runner' && x > 5.4 && y < 0.2) return false;
      return true;
    }).commit(sc);
    if (kind === 'cortez') {
      fr(12, (x, y) => x >= 0 && x <= 4.6 && y >= -0.5 + (x - 0.2) * 0.06 && y <= 0.4 + (x - 0.2) * 0.04 && !(x < 0.8 && y < -0.2)).commit(shade(l.shoeTrim, k), { flat: true, line: null });
      fr(12, (x, y) => x >= -3.3 && x <= -1.8 && y >= -0.4 && y <= 1.5).commit(shade(l.shoeTrim, k), { flat: true, line: null });
    } else {
      fr(12, (x, y) => y >= -1.1 && y <= 0.1 && x >= 0.6 && x <= 3.2).commit(shade(l.shoeColor, k * 1.35), { flat: true, line: null });
    }
    // Toe caps, side panels and laces read as different shoes at game scale.
    fr(12,(x,y)=>x>4.1 && x<6.4 && y>-.4 && y<1.5).commit(shade(sc,.78),{flat:true,line:null});
    if(kind !== 'cortez') fr(12,(x,y)=>x>-2 && x<3.8 && y>-.7 && y<.5 && Math.abs(y-x*.20)<.6).commit(shade(l.shoeTrim,k),{flat:true,line:null});
    fr(12,(x,y)=>x>.2 && x<3 && y>-.9 && y<.6 && Math.floor(x*1.5)%2===0).commit(shade(so,1.25),{flat:true,line:null});
    if(l.shoeStyle==='aj'){
      const m=l.shoeModel??1,trim=shade(l.shoeTrim,k);
      fr(12,(x,y)=>x>-3&&x<6.8&&y>-.8&&y<1.6&&(
        m===1?(x<-.5||x>4.5):m===2?(x<1&&Math.floor(x+y*2)%2===0):
        m===3?((x<-.5||x>4)&&Math.floor(x*2+y*3)%3===0):m===4?(x>-.5&&x<3.5&&Math.floor(x+y*2)%2===0):
        m===5?(y>.4&&Math.abs((x+8)%2-1)<.5):m===6?(x<-.8||x>4.8):
        m===7?(Math.abs(y-x*.6)<.7):m===8?(Math.abs(y+x*.5)<.6||Math.abs(y-x*.5)<.6):
        m===9?(Math.floor(x*2+y*3)%4===0):m===10?(y>.4&&Math.floor(x)%2===0):
        m===11?(y>.25):(Math.floor(x*1.5)%2===0)
      )).commit(trim,{flat:true,line:null});
      // AJ model-specific details: larger blocks visible at game scale
      if(m===1)fr(12,(x,y)=>x>4&&x<7&&y>0&&y<1).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ1: wing logo block
      if(m===2)fr(12,(x,y)=>x>4&&x<7&&y>-.2&&y<.2).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ2: strap
      if(m===3)fr(12,(x,y)=>x>3&&x<7&&y>.4&&y<.8&&Math.floor(x*2+y)%2===0).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ3: elephant print
      if(m===4)fr(12,(x,y)=>x>3&&x<6&&y>0&&y<.5).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ4: mesh panel
      if(m===5)fr(12,(x,y)=>x>4&&x<7&&y>.6&&y<1).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ5: shark teeth
      if(m===6)fr(12,(x,y)=>x>5&&x<7&&y>-1&&y<.4).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ6: finger loop
      if(m===7)fr(12,(x,y)=>x>1&&x<5&&y>.4&&y<.8&&Math.floor(x+y)%2===0).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ7: Huarache
      if(m===8)fr(12,(x,y)=>x>4&&x<7&&y>-.4&&y<0).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ8: cross strap
      if(m===9)fr(12,(x,y)=>x>4&&x<7&&y>-1&&y<-.5).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ9: pull tab
      if(m===10)fr(12,(x,y)=>x>4&&x<7&&y>-.5&&y<0).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ10: toe cap
      if(m===11)fr(12,(x,y)=>x>-2&&x<7&&y>1&&y<1.4).commit(shade(l.shoeTrim,k*0.6),{flat:true,line:null}); // AJ11: patent mudguard
      if(m===12)fr(12,(x,y)=>x>0&&x<4&&y>-1&&y<.3).commit(shade(l.shoeTrim,k),{flat:true,line:null}); // AJ12: two-tone
      if(m===6||m===8)fr(12,(x,y)=>x> -3&&x< -1&&y> -2&&y<0).commit(trim,{flat:true,line:null});
    }else if(l.shoeStyle==='dunk')fr(12,(x,y)=>x>4&&x<7&&y>-.9&&y<.4).commit(shade(l.shoeTrim,k),{line:null});
    else if(l.shoeStyle==='supra')b.begin().cap(L.kn[0],L.kn[1],ax,ay,3.2*u,3*u,.7,.78,false,false).commit(shade(l.shoeTrim,k),{line:null});
    fr(12, (x, y) => y > 1.5 && y <= (kind === 'boot' ? 3.3 : kind === 'runner' ? 3 : kind === 'cortez' ? 2 : 2.5) && x >= -3.6 && x <= 7.4).commit(so, { flat: false });
    if(l.shoeStyle==='af1')fr(12,(x,y)=>y>1.5&&y<3.4&&x>-3.6&&x<7.4).commit(so,{line:null});
    if(kind==='boot') fr(12,(x,y)=>y>2.5 && y<3.6 && x>-3 && x<7 && Math.floor(x)%3!==0).commit(shade(sc,.45),{flat:true,line:null});
  }

  private armPiece(b: Brush, A: { sh: number[]; el: number[]; wr: number[]; far: boolean }, l: Loadout, skin: Col, u: number, far: boolean) {
    const k = far ? 0.74 : 1;
    const sk = shade(skin, k), tc = shade(l.topColor, k), tt = shade(l.topTrim, k);
    const [sx0, sy0] = A.sh, [ex, ey] = A.el, [wx, wy] = A.wr;
    b.begin().cap(sx0, sy0, ex, ey, 3.8 * u, 2.6 * u,0,1,false,true).commit(sk);
    this.skinVolume(b,[sx0,sy0],[ex,ey],3.8,sk,u);
    b.begin().disc(ex, ey, 1.85 * u).commit(shade(sk, 0.88), { line: null, flat: true });
    b.begin().cap(ex, ey, wx, wy, 2.6 * u, 1.8 * u).commit(sk);
    this.skinVolume(b,[ex,ey],[wx,wy],2.6,sk,u);
    b.begin().disc(Math.round(ex + (wx - ex) * 0.12), Math.round(ey + (wy - ey) * 0.12), 1.15 * u).commit(shade(sk, 1.08), { line: null, flat: true });
    const sleeveUp = (c: Col, a: number, bb: number, rr: number) => b.begin().cap(sx0, sy0, ex, ey, (2.2 + rr) * u, cut.cuff * u, a, bb, true, false).commit(c);
    const t = l.top;
    const cut = GARMENT_CUTS[t];
    // Cover the rounded skin shoulder beneath every garment with sleeves.
    if (t !== 'tank' && t !== 'jersey') b.begin().disc(sx0,sy0,(t==='puffer'?4.7:t==='bigTee'?4.5:3.6)*u).commit(tc,{line:null});
    const wv = (kind: 'plaid' | 'baffle', a: number[], z: number[]) => this.weave(b, a, z, u, kind, tc, tt);
    if (t === 'tee' || t === 'jersey' || t === 'bigTee') {
      if (t === 'tee') { sleeveUp(tc, 0, cut.sleeve, 1.3); b.begin().cap(sx0, sy0, ex, ey, 2.85 * u, 2.65 * u, 0.48, 0.6, false, false).commit(tt, { flat: true, line: null }); }
      if (t === 'jersey') { /* Sleeveless: leave the upper arm visible. */ }
      if (t === 'bigTee') { sleeveUp(tc, 0, cut.sleeve, 2.2); b.begin().cap(sx0, sy0, ex, ey, 4.6 * u, 4.5 * u, 0.80, 0.88, false, false).commit(shade(tc, 0.88), { flat: true, line: null }); }
    } else if (t === 'hoodie' || t === 'longsleeve' || t === 'flannel' || t === 'puffer') {
      const elbowWidth = t==='puffer'?4.5:t==='hoodie'?3.4:t==='flannel'?3.0:2.6;
      const rr = t === 'hoodie' ? 1.5 : t === 'puffer' ? 2.5 : t === 'flannel' ? 1.0 : 0.5;
      // One continuous sleeve mask eliminates separate capsule outlines/gaps.
      b.begin().cap(sx0,sy0,ex,ey,(2.2+rr)*u,elbowWidth*u,0,1,true,true)
        .disc(ex,ey,elbowWidth*u)
        .cap(ex,ey,wx,wy,elbowWidth*u,(1.7+rr*.9)*u,0,.9,true,false).commit(tc);
      this.skinVolume(b,[sx0,sy0],[wx,wy],3.5,tc,u);
      if (t === 'flannel') wv('plaid', [sx0, sy0], [ex, ey]); else if (t === 'puffer') wv('baffle', [sx0, sy0], [ex, ey]);
      if (t === 'flannel') wv('plaid', [ex, ey], [wx, wy]); else if (t === 'puffer') wv('baffle', [ex, ey], [wx, wy]);
      b.begin().cap(ex, ey, wx, wy, (2.2 + (t === 'puffer' ? 0.3 : 0)) * u, (2 + (t === 'puffer' ? 0.3 : 0)) * u, 0.8, 0.95, false, false).commit(tt, { flat: true, line: null });
    }
    if (l.wrist === 'bands') b.begin().cap(ex, ey, wx, wy, 1.95 * u, 1.75 * u, 0.62, 0.84, false, false).commit(shade(l.wristColor, k), { flat: true, line: null });
    if (l.wrist === 'watch') {
      const wc = shade(l.wristColor, k);
      b.begin().cap(ex, ey, wx, wy, 2.0 * u, 1.8 * u, 0.7, 0.8, false, false).commit(wc, { flat: true, line: shade(wc, 0.55) });
      const x=Math.floor(ex+(wx-ex)*.75),y=Math.floor(ey+(wy-ey)*.75),style=l.watchStyle;
      if(style){this.pix.rect(x-2,y-2,5,5,shade(wc,.5));this.pix.rect(x-1,y-1,3,3,style==='digital'?0x8ca995:style==='iced'?0xcce5e9:0x263741);
        if(style==='chrono'){this.pix.set(x-1,y,0xc4c8b6);this.pix.set(x+1,y,0xc4c8b6);}else if(style==='digital')this.pix.hline(x-1,x+1,y,0x263d35);else this.pix.vline(x,y-1,y+1,0xf0dfb3);
        if(style==='iced')for(const [dx,dy] of [[-2,-2],[2,-2],[-2,2],[2,2]])this.pix.set(x+dx,y+dy,0xffffff);
      }else this.pix.set(x,y,0xfff3c8);
    }
    if (l.wrist === 'sleeve' && !far) {
      b.begin().cap(sx0, sy0, ex, ey, 2.4 * u, 2.1 * u, 0.55, 1, false, true).commit(l.wristColor);
      b.begin().cap(ex, ey, wx, wy, 2.1 * u, 1.9 * u, 0, 0.85, true, false).commit(l.wristColor);
    }
    const dx = wx - ex, dy = wy - ey, d = Math.hypot(dx, dy) || 1;
    b.begin().disc(wx + (dx / d) * 1.2 * u, wy + (dy / d) * 1.2 * u, 2.05 * u).commit(sk);
  }

  /** Woven cloth pattern over the current brush mask, laid out along the a-to-z axis so it rides with the limb. */
  private weave(b: Brush, a: number[], z: number[], u: number, kind: 'plaid' | 'baffle', base: Col, trim: Col) {
    const dx = z[0] - a[0], dy = z[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const dk = shade(base, 0.68), dd = shade(base, 0.5), lt = shade(base, 1.14);
    const cell = (kind === 'plaid' ? 3.4 : 3.3) * u;
    b.ink((x, y) => {
      if (!(b.has(x - 1, y) && b.has(x + 1, y) && b.has(x, y - 1) && b.has(x, y + 1))) return -1;
      const px = x + 0.5 - a[0], py = y + 0.5 - a[1];
      const al = px * ux + py * uy + 400 * u, sd = -px * uy + py * ux + 400 * u;
      const i = Math.floor(al / cell), fi = al - i * cell;
      if (kind === 'baffle') return fi < 0.95 ? dk : fi < 1.9 ? lt : -1;
      const j = Math.floor(sd / cell), fj = sd - j * cell;
      const hb = i % 3 === 0, vb = j % 3 === 0;
      if (hb && vb) return dd;
      if (hb || vb) return dk;
      if ((i % 3 === 1 && fi < 1) || (j % 3 === 1 && fj < 1)) return trim;
      return -1;
    });
  }

  private bigTeeHem(b: Brush, h: number[], n: number[], l: Loadout, u: number) {
    const [hx, hy] = h, [nx, ny] = n, e = topExtra('bigTee');
    b.begin().cap(hx, hy, nx, ny, (4.55 + e) * u, (5.95 + e) * u, -0.3, 0.1, false, false).commit(l.topColor);
    b.begin().cap(hx, hy, nx, ny, (4.45 + e) * u, (5.85 + e) * u, -0.3, -0.22, false, false).commit(shade(l.topColor, 0.84), { flat: true, line: null });
  }

  private torsoPiece(b: Brush, h: number[], n: number[], l: Loadout, skin: Col, u: number, lean: number, sx: number, mir: number, knees?: number[][]) {
    const [hx, hy] = h, [nx, ny] = n;
    // The shoulder line ends below the neck; a capsule extending past the
    // neck made every shirt look like a padded tube around the face.

    b.begin().cap(hx, hy, nx, ny, 2.1 * u, 2.1 * u, 0.82, 1.08, false, false).commit(skin);
    const tp = l.top;
    // A shared pelvis closes the gap between the two articulated trouser legs.
    // Keep the waistband at the hips, below the shirt rather than on the chest.

    const cut = GARMENT_CUTS[tp];
    const height = Math.hypot(nx - hx, ny - hy) / u;
    // frame() mirrors before rotating: undo the screen-space reflection here.
    // Otherwise a left-facing lean rotates the shirt away from its shoulders.
    const angle = Math.atan2(nx - hx, hy - ny) * mir;
    const shoulderY = -height;
    const flex=tp==='puffer'?.42:tp==='bigTee'?1.35:tp==='hoodie'?1.25:tp==='tee'?1.12:.92;
    const lift=clamp(((this.cur.fHy+this.cur.bHy)*.5-this.cur.hipY-SHOULDER)/65,0,1);
    const stride=clamp((this.cur.fFx-this.cur.bFx-30)/55,-1,1);
    const crouch=clamp((83-this.cur.hipY)/48,0,1);
    const hemY = -cut.hem + 1.5 + this.cloth.y*.55*flex-lift*2.6-crouch*1.4*flex;
    const profile=clamp(Math.abs(this.cur.turn),0,1);
    const toLocal=(px:number,py:number):[number,number]=>{
      const dx=(px-hx)*mir/u, dy=(py-hy)/u;
      return [dx*Math.cos(angle)+dy*Math.sin(angle), -dx*Math.sin(angle)+dy*Math.cos(angle)];
    };
    // Each hem corner tracks its own thigh so a stride pulls the front down and
    // the back up, instead of dragging a square panel around the hips.
    let frontKnee:[number,number]=[cut.waist*.4,18], backKnee:[number,number]=[-cut.waist*.4,18];
    if(knees){
      frontKnee=toLocal(knees[0][0],knees[0][1]);
      backKnee=toLocal(knees[1][0],knees[1][1]);
    }
    const pantFollow=clamp(frontKnee[0]*0.38+backKnee[0]*0.18,-3.4,3.4);
    const bend=clamp(pantFollow*flex*.55+this.cloth.x*.45*flex,-2.2,2.2);
    const kneeLift=clamp((this.cur.fFy-this.cur.bFy)/36,-1,1);
    const hemTilt=clamp(kneeLift*1.15+stride*.85,-1.7,1.7)*flex;
    const hemFront=hemY+this.hemF.y*.7*flex+clamp((frontKnee[1]-20)*.1,-2.6,1.6)*flex;
    const hemBack=hemY+this.hemB.y*.7*flex+clamp((backKnee[1]-20)*.1,-2.6,1.6)*flex;
    // Profile: shoulders go edge-on; the hanging hem stays wide along the stride.
    const shoulderScale=lerp(1,0.58,profile);
    const chestScale=lerp(1,0.74,profile);
    const hemScale=lerp(1.02,0.94,profile);
    const breadth = 0.8 + 0.16 * (1 - profile);
    const widthAt = (y: number) => {
      const t = clamp((hemY - y) / Math.max(1, hemY - shoulderY), 0, 1);
      let w = t < 0.52
        ? lerp(cut.waist * hemScale, cut.chest * chestScale, smooth(t / 0.52))
        : lerp(cut.chest * chestScale, cut.shoulder * shoulderScale, smooth((t - 0.52) / 0.48));
      const minWaist = cut.waist * (tp === 'bigTee' ? 1.1 : tp === 'hoodie' ? 1.05 : tp === 'puffer' ? 1.05 : 1.0) * hemScale;
      w = Math.max(w, minWaist);
      w += Math.sin(t * Math.PI) * Math.abs(this.cloth.x) * flex * 0.28;
      // Round the last pixels of the hem so corners are not a stiff square.
      w -= smooth(clamp((y - (hemY - 2.4)) / 2.4, 0, 1)) * (1.35 + 0.35 * flex);
      return w * breadth;
    };
    const hemAt=(x:number)=>{
      const span=Math.max(1,cut.waist);
      const along=smooth(clamp((x+span)/(span*2),0,1));
      const side=lerp(hemBack,hemFront,along);
      const sag=(0.45+0.7*flex)*(tp==='bigTee'?1.25:tp==='hoodie'?1.05:1)*Math.sin(along*Math.PI);
      const wave=Math.sin(x*.62+this.t*7.5)*.28*flex;
      const curved=side+sag+wave-.06*flex*x*x/span;
      // Always cover the waistband, but allow a raised knee to lift its corner.
      return Math.max(curved, 1.7 + (1-along)*0.6);
    };
    const backBulk=(tp==='hoodie'||tp==='puffer'?1.35:0.35)*profile;
    const frontTrim=lerp(1,0.82,profile);
    const cloth = (x: number, y: number) => {
      const v=clamp((y-shoulderY)/Math.max(1,hemY-shoulderY),0,1);
      const lower=smooth(clamp((v-.4)/.6,0,1));
      const left=widthAt(y)+backBulk*lower-Math.max(0,2-(y-shoulderY))*.7;
      const right=widthAt(y)*frontTrim-Math.max(0,2-(y-shoulderY))*.7;
      return y >= shoulderY && y <= hemAt(x) && x >= -left && x <= right
        && !(y < shoulderY + 1.2 && Math.abs(x) < cut.neck);
    };
    // Collar/shoulders stay pinned. From mid-chest down the cloth shears toward
    // each thigh, so a run cycle ripples the hem instead of the whole panel.
    const unDrape=(x:number,y:number):[number,number]=>{
      const v=clamp((y-shoulderY)/Math.max(1,hemY-shoulderY),0,1);
      const lower=smooth(clamp((v-.28)/.72,0,1));
      const along=smooth(clamp((x+cut.waist)/(cut.waist*2),0,1));
      const follow=lerp(this.hemB.x,this.hemF.x,along)*flex*.7
        +bend*lower*(.2+.8*along)
        +this.cloth.x*flex*.4;
      x-=follow*lower;
      const tilt=(hemFront-hemBack)*(along-.5)*.55*lower
        +hemTilt*x/Math.max(1,cut.waist)*lower*.9
        +Math.sin(v*Math.PI)*clamp(this.cur.lean,-.8,.8)*.95;
      y-=tilt;
      y+=crouch*flex*Math.sin(Math.max(0,x)*.24)*.55*lower;
      return [x,y];
    };
    const frame = (pred: (x: number, y: number) => boolean) => b.begin().frame(hx, hy, angle, mir, u, 38, (x, y) => {
      [x,y]=unDrape(x,y);return cloth(x,y) && pred(x,y);
    });
    b.begin().cap(hx,hy,nx,ny,cut.waist*breadth*u,cut.waist*breadth*u,-.10,.02,false,false).commit(l.bottomColor,{line:null});
    // Neck cutout for every top: skin shows through under the collar so shirts
    // never overlap the jaw / neck no matter the cut.
    b.begin().frame(hx,hy,angle,mir,u,38,(x,y)=>y>=shoulderY && y<shoulderY+1.5 && Math.abs(x)<cut.neck).commit(skin,{line:null});
    frame(()=>true).commit(l.topColor);
    // Cloth shadows follow the garment, rather than the screen or animation frame.
    b.ink((x,y) => {
      const dx = (x + .5 - hx) / u, dy = (y + .5 - hy) / u;
      const [lx,along]=unDrape(dx * mir * Math.cos(angle) + dy * Math.sin(angle),-dx*Math.sin(angle)*mir+dy*Math.cos(angle));
      const fold=Math.abs(along-(hemY-3)-lx*.32)<.5 && Math.abs(lx)<widthAt(along)-1;
      return shade(l.topColor,fold?.87:lx < -widthAt(-height*.5)*.55 ? .78 : lx > 3 ? 1.08 : 1);
    });
    frame((x,y) => y > hemAt(x) - .8).commit(tp === 'hoodie' ? l.topTrim : shade(l.topColor,.83), {flat:true,line:null});
    if (tp === 'jersey' || tp === 'tank') {
      frame((x,y) => Math.abs(x) > widthAt(y)-1.3 || y < shoulderY + 1.1).commit(l.topTrim,{flat:true,line:null});
    }
    if (tp === 'flannel') {
      frame((x,y) => Math.floor((x+12)/3)%2===0 || Math.floor((y+30)/4)%2===0).commit(shade(l.topTrim,.8),{flat:true,line:null});
      frame((x,y) => Math.abs(x)<2).commit(0xe4dfcd,{flat:true,line:null});
      frame((x,y) => x>2.5 && x<3.4).commit(l.topTrim,{flat:true,line:null});
      frame((x,y) => x>3 && x<6.5 && y>shoulderY+5 && y<shoulderY+8).commit(l.topColor,{flat:true,line:null});
    }
    if (tp === 'puffer') {
      frame((x,y) => Math.floor((y-shoulderY)/3.4)%2===0).commit(shade(l.topColor,.72),{flat:true,line:null});
      frame((x,y) => Math.abs(x)<.7).commit(l.topTrim,{flat:true,line:null});
      frame((x,y) => Math.abs(x)>5 && y>hemY-7 && y<hemY-3 && Math.abs(x)<6.2).commit(l.topTrim,{flat:true,line:null});
      b.begin().frame(hx,hy,angle,mir,u,38,(x,y)=>Math.abs(x)<5 && y>shoulderY-2 && y<shoulderY+1).commit(l.topColor);
    }
    if (tp === 'hoodie') {
      const pocket = 2.4 * profile;
      frame((x,y) => y>hemY-7 && y<hemY-2 && Math.abs(x-pocket)<(profile?3.2:5.4) && Math.abs(x-pocket)<7-(hemY-y)*.35).commit(shade(l.topColor,.70),{line:null});
      frame((x,y) => (Math.abs(x-(pocket+1.1))<.45 || Math.abs(x-(pocket-1.1))<.45) && y<shoulderY+8 && y>shoulderY+1).commit(l.topTrim,{flat:true,line:null});
    }
    if (tp === 'longsleeve') frame((x,y) => y>shoulderY+4 && y<shoulderY+6).commit(l.topTrim,{flat:true,line:null});
    // Each printable texture is anchored in garment coordinates: 1 = trim,
    // 2 = highlight, . = transparent. It follows the torso during animation.
    if(l.topTexture) {
      const tx=(x:number,y:number)=>sampleTexture(l.topTexture,x+5,y-(shoulderY+9));
      frame((x,y)=>tx(x,y)==='1').commit(l.topTrim,{flat:true,line:null});
      frame((x,y)=>tx(x,y)==='2').commit(shade(l.topTrim,1.28),{flat:true,line:null});
    }
    const graphic = l.topGraphic ?? (tp === 'jersey' ? 'number' : 'none');
    const gy = shoulderY + 6;
    if (graphic === 'cross') frame((x,y) => (Math.abs(x+2)<1 && y>gy-1 && y<gy+7) || (Math.abs(y-gy-2)<1 && x>-5 && x<1)).commit(l.topTrim,{flat:true,line:null});
    if (graphic === 'stars') frame((x,y) => {const ax=Math.abs(x+2),ay=Math.abs(y-gy-2);return ax+ay<3.5 && (ax<1 || ay<1);}).commit(l.topTrim,{flat:true,line:null});
    if (graphic === 'stacked') frame((x,y) => x>-6 && x<1 && y>gy && y<gy+6 && Math.floor(y-gy)%2===0).commit(l.topTrim,{flat:true,line:null});
    if (graphic === 'box') frame((x,y) => Math.abs(x)<4.2 && y>gy && y<gy+3).commit(l.topTrim,{flat:true,line:null});
    if (graphic === 'stripe') frame((x,y) => y>gy && y<gy+1.6).commit(l.topTrim,{flat:true,line:null});
    if (graphic === 'diagonal') frame((x,y) => Math.abs(y-gy-x*.65)<1.2).commit(l.topTrim,{flat:true,line:null});
    if (graphic === 'number') {
      const digits = ['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
      const num = String(Math.floor(clamp(l.jerseyNumber ?? 23,0,99))).padStart(2,'0');
      frame((x,y) => {
        const px = Math.floor(x+5.5), py = Math.floor(y-gy);
        if(px<0 || px>6 || py<0 || py>4 || px===3)return false;
        return digits[+num[px<3?0:1]][py*3+(px<3?px:px-4)]==='1';
      }).commit(l.topTrim,{flat:true,line:null});
    }
    void mir;
  }

  private chainPiece(b: Brush, h: number[], n: number[], l: Loadout, u: number, lean: number, sx: number) {
    const kind = l.chain;
    if (kind === 'none' || this.cur.turn < -.28) return;
    const gold = kind === 'gold' || kind === 'cuban' || kind === 'rope' || kind === 'cross';
    const col = l.chainColor ?? (gold ? 0xf0c040 : kind === 'rosary' ? 0x8a1c24 : 0xdfe6ee), dk = shade(col,.65);
    // Project onto the front plane of the actual, leaning torso. The spine
    // centre is not the chest surface in profile; mirrored lean needs the same frame.
    const length=Math.hypot(n[0]-h[0],n[1]-h[1])||1;
    const direction=sx<0?-1:1;
    const normal=[(h[1]-n[1])/length*direction,(n[0]-h[0])/length*direction];
    const profile=Math.abs(this.cur.turn);
    const surface=(GARMENT_CUTS[l.top].chest*.67+this.cloth.x*.1)*profile,loop=2.2-1.4*profile;
    const at=(t:number,off:number)=>[h[0]+(n[0]-h[0])*t+normal[0]*off*u,h[1]+(n[1]-h[1])*t+normal[1]*off*u];
    const low = kind==='rosary'?.43:kind==='rope'?.57:.65;
    const path=[at(.96,surface*.35-loop),at(.83,surface-loop),at(low,surface+.4),at(.83,surface+loop),at(.96,surface*.35+loop)];
    const p = this.pix;
    const end = path[2];
    // Dark backing keeps silver readable against white shirts and piping.
    for(let i=1;i<path.length;i++) for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) p.line(path[i-1][0]+dx,path[i-1][1]+dy,path[i][0]+dx,path[i][1]+dy,OUT);
    for (let i = 1; i < path.length; i++) {
      const [x0, y0] = path[i - 1], [x1, y1] = path[i];
      if (kind === 'rosary') {
        const d = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.round(d / 2.2));
        for (let s = 0; s <= steps; s++) {
          const bx = Math.round(x0 + ((x1 - x0) * s) / steps), by = Math.round(y0 + ((y1 - y0) * s) / steps);
          p.rect(bx, by, 2, 2, (s + i) % 4 === 0 ? 0xe9c24a : col);
          p.set(bx, by, (s + i) % 4 === 0 ? 0xfff2b0 : 0xe05a5a);
        }
      } else if (kind === 'cuban') {
        p.line(x0, y0, x1, y1, col); p.line(x0, y0 + 1, x1, y1 + 1, dk);
        p.line(x0 + 1, y0, x1 + 1, y1, col);
      } else if (kind === 'rope') {
        p.line(x0, y0, x1, y1, col);
        const d = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.round(d));
        for (let s = 0; s <= steps; s += 2) p.set(Math.round(x0 + ((x1 - x0) * s) / steps), Math.round(y0 + ((y1 - y0) * s) / steps), dk);
      } else {p.line(x0,y0,x1,y1,col);if(kind==='tennis')for(let t=0;t<=1;t+=.25)p.set(x0+(x1-x0)*t,y0+(y1-y0)*t,0xf2ffff);}
      if((l.chainSize??1)>1)p.line(x0,y0+1,x1,y1+1,col);
    }
    const sw = this.chain;
    const ex = end[0] + clamp(sw.x * sx,-1.2*u,1.2*u), ey = end[1] + clamp(sw.y,-u,u);
    if (kind === 'rope' || kind === 'cuban' || kind==='tennis') return;
    const px = Math.round(ex), py = Math.round(ey);
    p.line(end[0], end[1], ex, ey, dk);
    if (kind === 'cross' || kind === 'rosary') {
      const cc = l.chainColor ?? (kind === 'rosary' ? 0xdfe6ee : 0xf0c040), cd = kind === 'rosary' ? 0x8d99a8 : 0xb88820;
      const tall = kind === 'rosary' ? 6 : 5;
      for (let i = 0; i < tall; i++) p.set(px, py + i, i === 0 ? 0xffffff : cc);
      p.set(px - 1, py + 1, cc); p.set(px + 1, py + 1, cc); p.set(px - 1, py + 2, cd); p.set(px + 1, py + 2, cd);
      p.set(px, py + tall, cd);
    } else if(kind==='medallion'){p.circle(px,py+2,3,OUT);p.circle(px,py+2,2,col);p.set(px,py+1,0xfff0c3);
    } else if(kind==='dogtag'){p.rect(px-2,py,5,7,OUT);p.rect(px-1,py+1,3,5,col);p.vline(px,py+2,py+4,dk);
    } else if(kind==='star'){for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(Math.abs(x)+Math.abs(y)<4 || x===0 || y===0)p.set(px+x,py+y+2,Math.abs(x)+Math.abs(y)>2?dk:col);
    } else if (kind === 'ice') {
      p.rect(px - 3, py-1, 7, 7, OUT);
      p.rect(px - 2, py, 5, 5, 0xbfe4f4);
      p.rect(px - 1, py + 1, 3, 3, 0xe9f8ff);
      p.set(px - 2, py + 4, 0x7fb8d8); p.set(px + 2, py + 4, 0x7fb8d8); p.set(px + 2, py, 0x9fcfe8);
      const f = Math.floor(this.t * 6) % 3;
      p.set(px - 1 + f, py + f, 0xffffff);
      p.set(px + 1 - f, py + 3 - f, 0xffffff);
    } else {
      p.rect(px - 1, py, 3, 3, col);
      p.set(px, py + 1, dk);
      p.set(px - 1, py, 0xffffff);
    }
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
    const width=(sx<0?-1:1)*Math.max(Math.abs(sx),.9);
    return [Math.floor(hd.x + width * (lx * c - ly * s) * u), Math.floor(hd.y + (lx * s + ly * c) * u)];
  }

  private headPiece(b: Brush, hd: { x: number; y: number; th: number }, r: Rig, l: Loadout, skin: Col, u: number, sx: number, mir: number, back: boolean, front: boolean) {
    const th = hd.th;
    const F = (ext: number, pred: (x: number, y: number) => boolean) => b.begin().frame(hd.x, hd.y, th, sx, u, ext, pred);
    F(9, (x, y) => (x >= -2.5 && x <= 1.7 && y >= 3 && y <= 6.8)).commit(shade(skin, 0.85), { line: null });
    const skull = (x: number, y: number) => Math.abs(x)<5.8 && y>-6 && y<4.5 && !(y<-4 && Math.abs(x)>4.3);
    const jaw = (x: number, y: number) => y>=1 && y<6 && x>-3.8+(y-1)*.4 && x<5.4-(y-1)*.25;
    F(10, (x, y) => skull(x, y) || jaw(x, y) || (x >= 4.8 && x <= 5.9 && y >= -0.2 && y <= 1.9 && !front)).commit(skin);
    // Chunky shadow planes suggest the photographed sprites of 1990s arcade games.
    F(10, (x,y) => (skull(x,y)||jaw(x,y)) && x < -2.2 && y > -3).commit(shade(skin,.78),{flat:true,line:null});
    F(10, (x,y) => (skull(x,y)||jaw(x,y)) && x > .5 && x < 3.5 && y > -3 && y < 2).commit(shade(skin,1.12),{flat:true,line:null});
    const sdw = shade(skin, 0.8);
    if (!back && !front) {
      F(8, (x, y) => x >= 4.9 && x <= 6.5 && y >= 0.1 && y <= 1.8).commit(shade(skin, 1.03), { line: null });
    }
    const hc = l.hairColor;
    const hairOn = (x: number, y: number) => skull(x, y) && (y < -2.4 || (x < -2.6 && y < 1.2) || (x < -4.2 && y < 2.4));
    if (l.hair === 'fade' || l.hair === 'braids' || l.hair === 'locs' || l.hair === 'twists' || l.hair === 'waves' || ['crop','cornrows','shortlocs','flattop','mohawk','bun'].includes(l.hair)) {
      F(10, (x, y) => hairOn(x, y) || (x >= -1.6 && x <= -0.2 && y >= -2.6 && y <= 1.4 && skull(x, y))).commit(hc, { line: null });
      F(10, (x, y) => skull(x, y) && !hairOn(x, y) && x < -3 && y < 3.4 && y >= 1.2).commit(shade(skin, 0.7), { flat: true, line: null });
      if (l.hair === 'waves') for (let y = -5; y <= -2; y += 1) for (let x = -4; x <= 3; x++) { if (((x + y * 2) & 3) === 0) { const [qx, qy] = this.loc(hd, sx, u, x, y); if (this.pix.alpha(qx, qy)) this.pix.set(qx, qy, shade(hc, 1.7)); } }
      if (l.hair === 'twists') for (let i = 0; i < 5; i++) { const [qx, qy] = this.loc(hd, sx, u, -4 + i * 1.7, -5.6 - (i % 2)); this.pix.set(qx, qy, hc); this.pix.set(qx, qy - 1, shade(hc, 1.4)); }
    } else if (l.hair === 'bald') {
      const [qx, qy] = this.loc(hd, sx, u, -1.5, -4.2); this.pix.set(qx, qy, shade(skin, 1.35));
    }

    if (['beard','fullbeard','beardblunt'].includes(l.face)) F(10, (x, y) => jaw(x, y) && y >= 1.4 && x > -2.4 && !(x > 3 && y < 3.6)).commit(l.faceColor, { line: null });
    if (l.face === 'stache' || l.face==='handlebar') F(8, (x, y) => x >= -2.4 && x <= 5.8 && y >= 2.2 && y <= 3.1 && (front || x >= 1.6)).commit(l.faceColor, { line: null });
    if (l.face === 'goatee') F(8, (x, y) => x >= 2.0 && x <= 5.2 && y >= 3.0 && y <= 6).commit(l.faceColor, { line: null });
    if (['shades','wraps','aviator'].includes(l.face) && !back) {
      F(10, (x, y) => (x >= 0.6 && x <= 6.4 && y >= -2.0 && y <= 0.5) || (x >= -3.6 && x <= 0.8 && y >= -1.4 && y <= -0.6)).commit(l.faceColor, { line: null, flat: true });
      const [qx, qy] = this.loc(hd, sx, u, 4.4, -1.4); this.pix.set(qx, qy, 0x8fb8d8);
    }
    if ((l.face === 'glasses'||l.face==='rectglasses') && !back) {
      for (const [cx, cy] of [[2.6, -0.6], [5.2, -0.6]]) {
        for (let a = 0; a < 8; a++) { const [qx, qy] = this.loc(hd, sx, u, cx + Math.cos(a * 0.785) * 1.7, cy + Math.sin(a * 0.785) * 1.7); this.pix.set(qx, qy, l.faceColor); }
      }
    }

    if(l.face==='fullbeard')F(11,(x,y)=>y>3&&y<8.3&&x> -3+(y-3)*.3&&x<4.8-(y-3)*.35).commit(l.faceColor,{line:null});
    if(l.face==='chinstrap')F(10,(x,y)=>jaw(x,y)&&y>1.5&&(y>4||x< -1.6)).commit(l.faceColor,{line:null});
    if(l.face==='handlebar')F(10,(x,y)=>y>2.5&&y<4.5&&(x< -1||x>4)&&x> -3&&x<6).commit(l.faceColor,{line:null});
    if(!back && l.face==='wraps')F(10,(x,y)=>x>0&&x<6&&y> -1.6&&y<.1).commit(0x7399ad,{flat:true,line:null});
    if(!back && l.face==='aviator')F(10,(x,y)=>x>1&&x<5.5&&y> -1.5&&y<.7&&(x<2||x>4.4||y>0)).commit(0xc5aa6c,{flat:true,line:null});
    if(!back && l.face==='rectglasses')F(10,(x,y)=>x>1&&x<6&&y> -1.7&&y<.5&&(y< -1||y>0||x<1.8||x>5.3)).commit(l.faceColor,{flat:true,line:null});
    if(!back && (l.face==='blunt'||l.face==='beardblunt')){
      F(13,(x,y)=>x>3.5&&x<10.5&&y>2.6&&y<3.8).commit(0x74533a,{flat:true,line:null});
      F(13,(x,y)=>x>9&&x<10.8&&y>2.6&&y<3.8).commit(Math.sin(this.t*5)>.3?0xf4a051:0xc55b36,{flat:true,line:null});
      for(let i=0;i<4;i++){const a=(this.t*.65+i*.24)%1;const [x,y]=this.loc(hd,sx,u,10+Math.sin(a*5+i)*1.5,2.3-a*8);this.pix.set(x,y,a>.7?0x76858d:0xaab3af);}
    }
    if (back) return;
    const px = (lx: number, ly: number, c: Col) => { const [qx, qy] = this.loc(hd, sx, u, lx, ly); this.pix.set(qx, qy, c); };
    const blinking = this.blink > 0 || r.emo < -0.5;
    const shadesOn = ['shades','wraps','aviator'].includes(l.face);
    if (front) {
      for (const ex of [-2, 2]) { if (!shadesOn) { px(ex, -0.5, 0xffffff); px(ex + 1, -0.5, OUT); } px(ex, -1.9, shade(l.hairColor, 0.8)); }
      px(0, 1.5, shade(skin, 0.75));
      return;
    }
    if (!shadesOn && l.face !== 'glasses' && l.face!=='rectglasses') {
      if (blinking) { px(2.6, -0.2, OUT); px(3.6, -0.2, OUT); } else { px(2.6, -0.6, 0xffffff); px(3.6, -0.6, OUT); px(3.6, 0.4, OUT); }
      const bro = r.emo < -0.3 ? 0.8 : r.emo > 0.4 ? -0.4 : 0;
      px(2.2, -2.3 - bro * 0.4, shade(hc, 0.9)); px(3.3, -2.3 + bro, shade(hc, 0.9)); px(4.4, -2.3 + bro * 1.4, shade(hc, 0.9));
    } else if (l.face === 'glasses') { px(2.6, -0.6, 0xffffff); px(3.6, -0.6, OUT); }
    px(-1.2, 0.8, shade(skin, 0.72)); px(-1.2, 1.8, shade(skin, 0.72));
    void mir;
  }

  /** Hats, tall hair, and other layers that must sit in front of the torso and arms. */
  private headWear(b: Brush, hd: { x: number; y: number; th: number }, r: Rig, l: Loadout, u: number, sx: number, mir: number, back: boolean, front: boolean) {
    const F = (ext: number, pred: (x: number, y: number) => boolean) => b.begin().frame(hd.x, hd.y, hd.th, sx, u, ext, pred);
    const hc = l.hairColor;
    const skull = (x: number, y: number) => Math.abs(x)<5.8 && y>-6 && y<4.5 && !(y<-4 && Math.abs(x)>4.3);
    const hairOn = (x: number, y: number) => skull(x, y) && (y < -2.4 || (x < -2.6 && y < 1.2) || (x < -4.2 && y < 2.4));
    if (l.hair === 'hightop') {
      F(12, (x, y) => (x >= -5 && x <= 3.6 && y >= -10 && y <= -2.4) || hairOn(x, y)).commit(hc, { hi: shade(hc, 1.6) });
    } else if (l.hair === 'afro') {
      F(11, (x, y) => skull(x, y) && y < -3.6).commit(hc, { line: null, hi: shade(hc, 1.4) });
    }
    if(l.hair==='crop') F(12,(x,y)=>x>-5 && x<4.5 && y>-7-(Math.floor(x+5)%3===0?1:0) && y< -2.5).commit(hc,{hi:shade(hc,1.5)});
    if(l.hair==='flattop') F(14,(x,y)=>x>-5.5 && x<4.5 && y> -11 && y< -3).commit(hc,{hi:shade(hc,1.5)});
    if(l.hair==='mohawk') F(14,(x,y)=>x>-3.5 && x<2.2 && y> -11+Math.abs(x)*.5 && y< -2).commit(hc,{hi:shade(hc,1.6)});
    if(l.hair==='cornrows') {
      F(10,(x,y)=>skull(x,y)&&y< -2).commit(shade(SKIN_TONES[l.skin],.75),{line:null});
      F(10,(x,y)=>skull(x,y)&&y< -2 && Math.floor((x+y*.5+20)/1.6)%2===0).commit(hc,{line:null});
    }
    if(l.hair==='shortlocs') for(let i=0;i<6;i++) F(14,(x,y)=>Math.abs(x-(-5+i*1.7))<1 && y> -8-(i%2)*2 && y< -1+(i%3)).commit(hc,{hi:shade(hc,1.5)});
    if(l.hair==='bun') {
      F(12,(x,y)=>hairOn(x,y)).commit(hc,{line:null});
      F(15,(x,y)=>((x+4)**2)/16+((y+8)**2)/14<1).commit(hc,{hi:shade(hc,1.6)});
      F(15,(x,y)=>x>-5 && x< -2 && y> -6 && y< -5).commit(shade(hc,2),{line:null});
    }
    const hd0 = l.headColor, ht = l.headTrim;
    const crown = (x: number, y: number, ry: number) => ((x + 0.2) ** 2) / 38 + ((y + 0.9) ** 2) / (ry * ry) <= 1;
    switch (l.head) {
      case 'skimask':
        F(12,(x,y)=>(skull(x,y)||(y>1&&y<7&&x> -3.8&&x<4.3)) && !(y> -1.7&&y<.5&&(front?Math.abs(x)<4:x>1.4))).commit(hd0);
        F(12,(x,y)=>y>4.8&&y<6&&x> -3.5&&x<3.8).commit(shade(hd0,.78),{line:null});
        break;
      case 'fullcap':
      case 'backcap': {
        const dir = l.head === 'fullcap' ? 1 : -1;
        F(14, (x, y) => crown(x, y, 6.6) && y <= -1.5).commit(hd0);
        F(14, (x, y) => (dir > 0 ? x >= 2.2 && x <= 10.5 && y >= -2.3 + (x - 2.2) * 0.14 - 0.3 && y <= -0.9 + (x - 2.2) * 0.14 : x <= -3.4 && x >= -10 && y >= -2.2 && y <= -0.8)).commit(shade(hd0, 0.85), { hi: shade(hd0, 1.2) });
        F(10, (x, y) => crown(x, y, 6.6) && y <= -1.5 && y >= -2.6 && x < 3).commit(ht, { flat: true, line: null });
        { const [qx, qy] = this.loc(hd, sx, u, dir > 0 ? 3.4 : -3.4, -4.8); this.pix.set(qx, qy, ht); this.pix.set(qx + sx, qy, ht); }
        break;
      }
      case 'fitted': {
        F(14, (x, y) => crown(x, y, 6.4) && y <= -1.4).commit(hd0);
        F(14, (x, y) => x >= 2.4 && x <= 11.6 && y >= -1.8 && y <= -0.6).commit(shade(hd0, 0.82), { hi: shade(hd0, 1.2) });
        F(10, (x, y) => crown(x, y, 6.4) && y <= -1.4 && y >= -2.4 && x < 3.2).commit(shade(hd0, 0.88), { flat: true, line: null });
        F(10, (x, y) => crown(x, y, 6.4) && x >= 0.8 && x <= 4 && y >= -5.4 && y <= -2.9).commit(ht, { flat: true, line: null });
        { const [qx, qy] = this.loc(hd, sx, u, 2.4, -4.1); this.pix.set(qx, qy, shade(hd0, 0.7)); }
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
    if(l.headBadge && ['fullcap','backcap','fitted','beanie'].includes(l.head)){
      const bx=l.head==='backcap'?-2:2;
      F(12,(x,y)=>x>bx-2&&x<bx+2&&y> -5.7&&y< -2.5&&((Math.floor(x-bx+2)*3+Math.floor(y+6)+l.headBadge!)%4!==0)).commit(ht,{flat:true,line:null});
    }
    void r; void mir; void back; void front;
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
