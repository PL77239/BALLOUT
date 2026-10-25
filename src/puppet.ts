import Phaser from 'phaser';
import { Loadout, SKIN_TONES } from './loadout';

export const THIGH = 44;
export const SHIN = 42;
export const ANKLE = 7;
export const TORSO = 60;
export const SHOULDER = 52;
const UPPER = 36;
const FORE = 33;
const OUT = 0x120e0c;

export function shade(c: number, k: number): number {
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  if (k <= 1) { r *= k; g *= k; b *= k; } else {
    const t = Math.min(1, k - 1);
    r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t;
  }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

function poly(g: Phaser.GameObjects.Graphics, fill: number, pts: number[], outline = true, lw = 2.5) {
  const p: { x: number; y: number }[] = [];
  for (let i = 0; i < pts.length; i += 2) p.push({ x: pts[i], y: pts[i + 1] });
  g.fillStyle(fill, 1);
  g.fillPoints(p as Phaser.Types.Math.Vector2Like[], true);
  if (outline) {
    g.lineStyle(lw, OUT, 1);
    g.strokePoints(p as Phaser.Types.Math.Vector2Like[], true);
  }
}

function limbPts(len: number, w0: number, w1: number, y0 = 0, y1 = len): number[] {
  const wa = w0 + (w1 - w0) * (y0 / len);
  const wb = w0 + (w1 - w0) * (y1 / len);
  return [-wa / 2, y0, wa / 2, y0, wb / 2, y1, -wb / 2, y1];
}

export interface Rig {
  hipY: number;
  lean: number;
  head: number;
  fFx: number; fFy: number; bFx: number; bFy: number;
  fAnk: number; bAnk: number;
  fHx: number; fHy: number; bHx: number; bHy: number;
  fall: number;
  spin: number;
  bodyX: number;
}

export const restRig = (): Rig => ({
  hipY: 86, lean: 0.06, head: 0,
  fFx: 10, fFy: 0, bFx: -10, bFy: 0, fAnk: 0, bAnk: 0,
  fHx: 14, fHy: 86 + 50 - 62, bHx: -6, bHy: 86 + 50 - 62,
  fall: 0, spin: 0, bodyX: 0,
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

interface LegParts { thigh: Phaser.GameObjects.Container; shin: Phaser.GameObjects.Container; foot: Phaser.GameObjects.Container; gT: Phaser.GameObjects.Graphics; gS: Phaser.GameObjects.Graphics; gF: Phaser.GameObjects.Graphics }
interface ArmParts { up: Phaser.GameObjects.Container; fore: Phaser.GameObjects.Container; gU: Phaser.GameObjects.Graphics; gF: Phaser.GameObjects.Graphics }

export class Puppet {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  private hipC: Phaser.GameObjects.Container;
  private torsoC: Phaser.GameObjects.Container;
  private headC: Phaser.GameObjects.Container;
  private legB!: LegParts;
  private legF!: LegParts;
  private armB!: ArmParts;
  private armF!: ArmParts;
  private torsoG: Phaser.GameObjects.Graphics;
  private hoodG: Phaser.GameObjects.Graphics;
  private headG: Phaser.GameObjects.Graphics;
  private hairBackG: Phaser.GameObjects.Graphics;
  private chainG: Phaser.GameObjects.Graphics;
  cur: Rig = restRig();
  loadout!: Loadout;

  constructor(private scene: Phaser.Scene, loadout: Loadout) {
    const g = () => scene.add.graphics();
    this.root = scene.add.container(0, 0);
    this.body = scene.add.container(0, 0);
    this.hipC = scene.add.container(0, -86);
    this.torsoC = scene.add.container(0, 0);
    this.headC = scene.add.container(0, -(TORSO + 3));
    this.torsoG = g(); this.hoodG = g(); this.headG = g(); this.hairBackG = g(); this.chainG = g();
    this.legB = this.makeLeg(-4);
    this.armB = this.makeArm(-3);
    this.armF = this.makeArm(3);
    this.legF = this.makeLeg(4);
    this.headC.add([this.hairBackG, this.headG]);
    this.torsoC.add([this.armB.up, this.torsoG, this.hoodG, this.chainG, this.headC, this.armF.up]);
    this.hipC.add([this.legB.thigh, this.torsoC, this.legF.thigh]);
    this.body.add(this.hipC);
    this.root.add(this.body);
    this.dress(loadout);
  }

  private makeLeg(ox: number): LegParts {
    const gT = this.scene.add.graphics(), gS = this.scene.add.graphics(), gF = this.scene.add.graphics();
    const foot = this.scene.add.container(0, SHIN); foot.add(gF);
    const shin = this.scene.add.container(0, THIGH); shin.add([gS, foot]);
    const thigh = this.scene.add.container(ox, 0); thigh.add([gT, shin]);
    return { thigh, shin, foot, gT, gS, gF };
  }

  private makeArm(ox: number): ArmParts {
    const gU = this.scene.add.graphics(), gF = this.scene.add.graphics();
    const fore = this.scene.add.container(0, UPPER); fore.add(gF);
    const up = this.scene.add.container(ox, -SHOULDER); up.add([gU, fore]);
    return { up, fore, gU, gF };
  }

  dress(l: Loadout) {
    this.loadout = l;
    const skin = SKIN_TONES[l.skin];
    this.drawLeg(this.legB, l, skin, 0.74);
    this.drawLeg(this.legF, l, skin, 1);
    this.drawArm(this.armB, l, skin, 0.74);
    this.drawArm(this.armF, l, skin, 1);
    this.drawTorso(l, skin);
    this.drawHead(l, skin);
  }

  private drawLeg(p: LegParts, l: Loadout, skin: number, k: number) {
    const { gT, gS, gF } = p;
    gT.clear(); gS.clear(); gF.clear();
    const sk = shade(skin, k);
    const bc = shade(l.bottomColor, k), bt = shade(l.bottomTrim, k);
    poly(gT, sk, limbPts(THIGH, 20, 15));
    poly(gS, sk, limbPts(SHIN, 14, 10));
    if (l.bottom === 'shorts') {
      poly(gT, bc, limbPts(THIGH, 28, 26, 0, THIGH * 0.62));
      poly(gT, bt, limbPts(THIGH, 28, 26, THIGH * 0.62 - 4, THIGH * 0.62), false);
    } else if (l.bottom === 'longShorts') {
      poly(gT, bc, limbPts(THIGH, 29, 28, 0, THIGH + 4));
      poly(gT, bt, limbPts(THIGH, 29, 28, THIGH - 1, THIGH + 4), false);
      gT.lineStyle(2.5, OUT, 1); gT.strokeRect(-14, THIGH - 1, 28, 5);
    } else {
      poly(gT, bc, limbPts(THIGH, 22, 17));
      poly(gS, bc, limbPts(SHIN, 17, 14));
      poly(gS, bt, limbPts(SHIN, 17, 14, SHIN - 8, SHIN - 1));
    }
    if (l.socks && l.bottom !== 'sweats') {
      poly(gS, shade(l.sockColor, k), limbPts(SHIN, 14, 10, SHIN * 0.5, SHIN - 1));
      poly(gS, shade(l.shoeSole, k), limbPts(SHIN, 14, 10, SHIN * 0.5, SHIN * 0.5 + 4), false);
    }
    const sc = shade(l.shoeColor, k), ss = shade(l.shoeSole, k);
    if (l.shoes === 'high') {
      poly(gF, sc, [-10, -20, 8, -20, 9, -6, -10, -6]);
      gF.lineStyle(2, shade(0xffffff, k), 1);
      gF.lineBetween(-6, -16, 5, -16); gF.lineBetween(-6, -11, 6, -11);
    }
    poly(gF, sc, [-10, -6, -3, -7, 5, -3, 15, -1, 25, 3, -10, 3]);
    poly(gF, shade(sc, 1.25), [14, -1.5, 25, 3, 12, 3], false);
    poly(gF, ss, [-10, 3, 25, 3, 26, 7, -11, 7]);
  }

  private drawArm(p: ArmParts, l: Loadout, skin: number, k: number) {
    const { gU, gF } = p;
    gU.clear(); gF.clear();
    const sk = shade(skin, k);
    const tc = shade(l.topColor, k), tt = shade(l.topTrim, k);
    poly(gU, sk, limbPts(UPPER, 13, 11));
    poly(gF, sk, limbPts(FORE, 11, 9));
    if (l.top === 'tee') {
      poly(gU, tc, limbPts(UPPER, 17, 16, 0, 22));
      poly(gU, tt, limbPts(UPPER, 17, 16, 18, 22), false);
    } else if (l.top === 'hoodie') {
      poly(gU, tc, limbPts(UPPER, 16, 14, 0, UPPER));
      poly(gF, tc, limbPts(FORE, 14, 12, 0, FORE - 4));
      poly(gF, tt, limbPts(FORE, 12, 11, FORE - 8, FORE - 2));
    }
    if (l.wristbands) poly(gF, shade(l.wristColor, k), limbPts(FORE, 11, 9, FORE - 13, FORE - 6));
    gF.fillStyle(sk, 1); gF.fillCircle(0, FORE + 3, 6.5);
    gF.lineStyle(2.5, OUT, 1); gF.strokeCircle(0, FORE + 3, 6.5);
  }

  private drawTorso(l: Loadout, skin: number) {
    const g = this.torsoG;
    g.clear(); this.hoodG.clear(); this.chainG.clear();
    const body = [-14, 6, -13, -22, -17, -46, -12, -58, 12, -58, 18, -44, 14, -22, 13, 6];
    poly(g, skin, body);
    poly(g, l.bottomColor, [-14, -6, 14, -6, 15, 12, -15, 12]);
    g.fillStyle(l.bottomTrim, 1); g.fillRect(-14, -6, 28, 3);
    const hem = l.top === 'hoodie' ? 1 : -2;
    poly(g, l.topColor, [-14, hem, -13, -22, -17, -46, -12, -58, -3, -58, 5, -52, 13, -57, 18, -44, 14, -22, 14, hem]);
    g.fillStyle(l.topTrim, 1);
    if (l.top === 'hoodie') {
      g.fillRect(-14, hem - 5, 28, 6);
      g.lineStyle(2, shade(l.topColor, 0.6), 1);
      g.strokePoints([{ x: -9, y: -14 }, { x: 11, y: -14 }, { x: 13, y: 0 }, { x: -11, y: 0 }] as Phaser.Types.Math.Vector2Like[], false);
      g.lineStyle(2, l.topTrim, 1); g.lineBetween(8, -52, 9, -36); g.lineBetween(3, -52, 3, -38);
      poly(this.hoodG, shade(l.topColor, 0.82), [-16, -50, -21, -60, -14, -68, -3, -66, 3, -58, 0, -50]);
      this.hoodG.lineStyle(2, l.topTrim, 1); this.hoodG.lineBetween(-15, -60, -5, -63);
    } else {
      g.fillRect(-1, -46, 4, 46 + hem);
      g.fillRect(-14, hem - 2, 28, 3);
      poly(g, skin, [3, -58, 9, -58, 11, -54, 7, -49, 3, -52], false);
    }
    if (l.chain) {
      const c = this.chainG;
      c.lineStyle(2.5, 0xf0c040, 1);
      c.strokePoints([{ x: 4, y: -58 }, { x: 13, y: -48 }, { x: 15, y: -38 }] as Phaser.Types.Math.Vector2Like[], false);
      c.fillStyle(0xf0c040, 1); c.fillCircle(15, -35, 4.5);
      c.lineStyle(1.5, OUT, 1); c.strokeCircle(15, -35, 4.5);
    }
  }

  private drawHead(l: Loadout, skin: number) {
    const g = this.headG, hb = this.hairBackG;
    g.clear(); hb.clear();
    const hc = l.hairColor;
    poly(g, shade(skin, 0.86), [-4, 5, 7, 5, 7, -6, -4, -6], false);
    if (l.hair === 'afro') {
      hb.fillStyle(hc, 1); hb.fillCircle(-3, -26, 23);
      hb.lineStyle(2.5, OUT, 1); hb.strokeCircle(-3, -26, 23);
    }
    if (l.hair === 'braids') {
      for (let i = 0; i < 5; i++) {
        const x = -14 + i * 2.2;
        poly(hb, hc, [x - 1.8, -26, x + 1.8, -26, x + 1.4, -2 + i * 1.5, x - 1.4, -2 + i * 1.5], true, 1.5);
        hb.fillStyle(0xe8c070, 1); hb.fillCircle(x, -2 + i * 1.5, 2);
      }
    }
    poly(g, skin, [-12, -14, -12, -26, -6, -33, 4, -34, 11, -30, 14, -23, 16, -18, 13, -16, 14, -9, 9, -2, 0, -1, -7, -5]);
    poly(g, shade(skin, 0.82), [-6, -20, 0, -20, 0, -12, -6, -12], false);
    g.fillStyle(0xffffff, 1); g.fillRect(8, -23, 4, 4);
    g.fillStyle(OUT, 1); g.fillRect(10, -22.5, 2.5, 3.5);
    g.lineStyle(2.5, OUT, 1); g.lineBetween(6, -27, 13.5, -24); g.lineBetween(10, -9, 13.5, -9.5);
    if (l.hair === 'fade' || l.hair === 'braids') {
      poly(g, hc, [-13, -17, -13, -27, -6, -34, 4, -35, 11, -31, 13, -27, 8, -28, 0, -29, -6, -25, -9, -17], false);
    }
    if (l.hair === 'afro') poly(g, hc, [-13, -20, -12, -29, -4, -35, 6, -35, 12, -30, 13, -27, 6, -29, -2, -28, -8, -22], false);
    const hdc = l.headColor, ht = l.headTrim;
    if (l.head === 'fullcap') {
      poly(g, hdc, [-14.5, -21, -14.5, -28, -7, -36, 4, -38, 12, -34, 14.5, -27, 14.5, -22]);
      poly(g, shade(hdc, 1.2), [9, -27, 28, -25, 28, -21, 9, -22]);
      g.fillStyle(ht, 1); g.fillCircle(8, -31, 3);
      g.fillRect(-14, -24, 28, 2);
    } else if (l.head === 'beanie') {
      poly(g, hdc, [-14, -21, -14, -29, -7, -38, 4, -40, 11, -36, 14, -29, 14, -21]);
      poly(g, ht, [-15, -26, 15, -26, 15, -19, -15, -19]);
      g.lineStyle(1.5, OUT, 0.7);
      for (let x = -10; x < 14; x += 6) g.lineBetween(x, -26, x, -19);
    } else if (l.head === 'headband') {
      poly(g, hdc, [-14, -28, 14, -27, 15, -22, -14, -23]);
      g.fillStyle(ht, 1); g.fillRect(-14, -26, 28, 1.5);
    } else if (l.head === 'durag') {
      poly(g, hdc, [-14, -20, -14, -28, -6, -35, 4, -36, 12, -32, 14, -25, 12, -23]);
      poly(g, hdc, [-14, -24, -26, -14, -22, -11, -12, -20]);
      poly(g, shade(hdc, 0.8), [-14, -22, -27, -8, -22, -7, -12, -17], true, 2);
    }
  }

  apply(r: Rig) {
    const hipY = r.hipY;
    this.hipC.y = -hipY;
    this.body.x = r.bodyX;
    this.body.rotation = -r.fall * 1.5 + r.spin;
    this.torsoC.rotation = -r.lean;
    this.headC.rotation = -r.head;
    this.legIk(this.legB, r.bFx, r.bFy, r.bAnk, hipY);
    this.legIk(this.legF, r.fFx, r.fFy, r.fAnk, hipY);
    const sx = Math.sin(r.lean) * SHOULDER, sy = hipY + Math.cos(r.lean) * SHOULDER;
    this.armIk(this.armB, r.bHx - sx, -(r.bHy - sy), r.lean);
    this.armIk(this.armF, r.fHx - sx, -(r.fHy - sy), r.lean);
  }

  private legIk(p: LegParts, fx: number, fy: number, ank: number, hipY: number) {
    const [a1, a2] = ik(THIGH, SHIN, fx - p.thigh.x, -(fy + ANKLE) + hipY, 1);
    p.thigh.rotation = -a1;
    p.shin.rotation = -(a2 - a1);
    p.foot.rotation = ank + a2;
  }

  private armIk(p: ArmParts, dx: number, dy: number, lean: number) {
    const [a1, a2] = ik(UPPER, FORE, dx, dy, -1);
    p.up.rotation = -(a1 - lean);
    p.fore.rotation = -(a2 - a1);
  }

  shoulder(r: Rig = this.cur) {
    return { x: Math.sin(r.lean) * SHOULDER, y: r.hipY + Math.cos(r.lean) * SHOULDER };
  }

  ease(target: Rig, dt: number, rate = 24) {
    const k = 1 - Math.exp(-rate * dt);
    const c = this.cur as unknown as Record<string, number>;
    const t = target as unknown as Record<string, number>;
    for (const key in c) c[key] += (t[key] - c[key]) * k;
    this.apply(this.cur);
  }

  snap(target: Rig) {
    Object.assign(this.cur, target);
    this.apply(this.cur);
  }

  setFacing(f: number) { this.root.scaleX = f; }
  destroy() { this.root.destroy(); }
}
