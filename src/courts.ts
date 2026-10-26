import Phaser from 'phaser';
import { Col, GH, GW, PX, Pix, clamp, mix, mulCol, pixTexture, smooth } from './pixel';
import { FY, HXP, RIMY, Scene2D, Spot, applyLighting, lightValue } from './courtkit';
import type { RegionId } from './loadout';
import { ART } from './court_art';
import { BOOM_X } from './court_common';
import { music } from './music';
import { Crowd } from './crowd';
import { addCourtEvents } from './court_events';

export type CourtId = 'brooklyn' | 'queens' | 'chicago' | 'chiraq' | 'warsaw' | 'harlem' | 'philly' | 'detroit' | 'atl' | 'la' | 'fairmount';

export interface CourtInfo { id: CourtId; name: string; sub: string; region: RegionId; night: boolean }
export const COURTS: CourtInfo[] = [
  { id: 'brooklyn', name: 'THE CAGE', sub: 'BED-STUY, BROOKLYN  //  NIGHT', region: 'bk', night: true },
  { id: 'queens', name: 'THE BRIDGE', sub: 'QUEENSBRIDGE, QUEENS  //  NIGHT', region: 'queens', night: true },
  { id: 'philly', name: 'BROAD & ERIE', sub: 'NORTH PHILLY  //  RAIN, NIGHT', region: 'philly', night: true },
  { id: 'detroit', name: 'THE PLANT', sub: 'DETROIT  //  SNOW, NIGHT', region: 'detroit', night: true },
  { id: 'atl', name: 'UNDER THE PASS', sub: 'ATLANTA  //  NIGHT', region: 'atl', night: true },
  { id: 'la', name: 'SOUTH CENTRAL', sub: 'LOS ANGELES  //  NIGHT', region: 'la', night: true },
  { id: 'fairmount', name: 'THE WOODS', sub: 'FAIRMOUNT PARK, PHILLY  //  NIGHT', region: 'philly', night: true },
  { id: 'chicago', name: 'SOUTH SIDE', sub: 'CHICAGO  //  GOLDEN HOUR', region: 'chi', night: false },
  { id: 'chiraq', name: 'CHIRAQ', sub: 'SOUTH SIDE, CHICAGO  //  NIGHT', region: 'chiraq', night: true },
  { id: 'warsaw', name: 'CENTRUM', sub: 'WARSAW  //  CITY SKYLINE', region: 'warsaw', night: false },
  { id: 'harlem', name: 'THE PARK', sub: 'HARLEM, NEW YORK  //  DUSK', region: 'harlem', night: false },
];
export const courtInfo = (id: CourtId) => COURTS.find((c) => c.id === id)!;

export interface CourtScene {
  update(t: number, dt: number): void;
  destroy(): void;
  tintAt(wx: number, wy: number): number;
  drawNet(kick: number, t: number): void;
  cheer(power: number): void;
  spots: Spot[];
  /** World x of the boombox the music comes from. */
  boomX: number;
}

/** Helpers for animated scenery. Everything is positioned in art px and snapped to the pixel grid. */
export class Live {
  objs: Phaser.GameObjects.GameObject[] = [];
  ticks: ((t: number, dt: number) => void)[] = [];
  private n = 0;
  constructor(public scene: Phaser.Scene, public c: Scene2D, public id: string) {}

  tex(w: number, h: number, paint: (p: Pix) => void): string {
    const key = `${this.id}_${this.n++}`;
    const p = new Pix(w, h); paint(p);
    pixTexture(this.scene, key, p);
    return key;
  }
  img(key: string, x: number, y: number, depth: number, o: { blend?: Phaser.BlendModes; alpha?: number; flip?: boolean } = {}) {
    const im = this.scene.add.image(x * PX, y * PX, key).setOrigin(0, 0).setScale(PX).setDepth(depth);
    if (o.blend !== undefined) im.setBlendMode(o.blend);
    if (o.alpha !== undefined) im.setAlpha(o.alpha);
    if (o.flip) im.setFlipX(true);
    this.objs.push(im);
    return im;
  }
  gfx(depth: number, blend?: Phaser.BlendModes) {
    const g = this.scene.add.graphics().setDepth(depth);
    if (blend !== undefined) g.setBlendMode(blend);
    this.objs.push(g);
    return g;
  }
  tick(fn: (t: number, dt: number) => void) { this.ticks.push(fn); }

  /** Something that drives across the backdrop and wraps around. */
  mover(key: string, w: number, y: number, speed: number, depth: number, gap = 120, o: { tint?: number; flip?: boolean; x0?: number } = {}) {
    const im = this.img(key, 0, y, depth, { flip: o.flip });
    if (o.tint !== undefined) im.setTint(o.tint);
    const span = GW + w + gap;
    this.tick((t) => {
      const x = (((t * speed + (o.x0 ?? 0)) % span) + span) % span - w;
      im.setX(Math.round(speed < 0 ? GW - (x + w) - w + w : x) * PX);
    });
    return im;
  }

  rain(n: number, depth: number, col = 0xa8c0e0, speed = 260) {
    const g = this.gfx(depth);
    const dr = Array.from({ length: n }, () => ({ x: Math.random() * GW, y: Math.random() * GH, s: 0.8 + Math.random() * 0.5 }));
    this.tick((_t, dt) => {
      g.clear();
      for (const d of dr) {
        d.y += speed * d.s * dt; d.x -= speed * 0.12 * d.s * dt;
        if (d.y > 222 + Math.random() * 6) { d.y = -4; d.x = Math.random() * (GW + 30); }
        g.fillStyle(col, 0.55 * d.s); g.fillRect(Math.floor(d.x) * PX, Math.floor(d.y) * PX, PX, PX * 2);
        if (d.y > 156) { g.fillStyle(col, 0.0); }
      }
    });
    return g;
  }

  snow(n: number, depth: number) {
    const g = this.gfx(depth);
    const fl = Array.from({ length: n }, () => ({ x: Math.random() * GW, y: Math.random() * GH, s: 0.5 + Math.random(), p: Math.random() * 6 }));
    this.tick((t, dt) => {
      g.clear();
      for (const f of fl) {
        f.y += 22 * f.s * dt; f.x += Math.sin(t * 0.8 + f.p) * 8 * dt - 5 * dt;
        if (f.y > 224) { f.y = -3; f.x = Math.random() * (GW + 20); }
        if (f.x < -2) f.x = GW + 1;
        g.fillStyle(0xf4f8ff, f.s > 1 ? 0.95 : 0.6); g.fillRect(Math.floor(f.x) * PX, Math.floor(f.y) * PX, PX, PX);
        if (f.s > 1.2) g.fillRect(Math.floor(f.x) * PX + PX, Math.floor(f.y) * PX, PX, PX);
      }
    });
  }

  blink(x: number, y: number, col: Col, period: number, depth = -980, phase = 0, duty = 0.3) {
    const g = this.gfx(depth);
    this.tick((t) => {
      g.clear();
      if (((t + phase) % period) / period < duty) { g.fillStyle(col, 1); g.fillRect(x * PX, y * PX, PX, PX); g.fillStyle(col, 0.35); g.fillRect((x - 1) * PX, y * PX, PX, PX); g.fillRect((x + 1) * PX, y * PX, PX, PX); }
    });
  }

  flickerNeon(key: string, x: number, y: number, depth = -985, o: { rate?: number } = {}) {
    const im = this.img(key, x, y, depth, { blend: Phaser.BlendModes.ADD, alpha: 0.9 });
    let next = 0, on = 1;
    this.tick((t) => {
      if (t > next) { on = Math.random() < 0.8 ? 1 : 0; next = t + (on ? 0.4 + Math.random() * 2.4 : 0.04 + Math.random() * 0.12) * (o.rate ?? 1); }
      im.setAlpha(on ? 0.85 : 0.1);
    });
  }

  fire(x: number, y: number, depth: number) {
    const g = this.gfx(depth, Phaser.BlendModes.ADD);
    const cols = [0xff3a10, 0xff7a1a, 0xffb030, 0xffe070];
    this.tick((t) => {
      g.clear();
      for (let i = 0; i < 9; i++) {
        const ph = (t * 3.4 + i * 0.37) % 1, fx = x + Math.sin(t * 9 + i * 2.1) * 1.6 * ph + (i % 3) - 1, fy = y - ph * 8;
        g.fillStyle(cols[Math.min(3, Math.floor((1 - ph) * 4))], 1 - ph * 0.8);
        g.fillRect(Math.floor(fx) * PX, Math.floor(fy) * PX, PX, PX);
        if (ph < 0.5) g.fillRect(Math.floor(fx) * PX, Math.floor(fy) * PX + PX, PX, PX);
      }
    });
  }

  steam(x: number, y: number, depth: number, col = 0xc8ccd8, rate = 1) {
    const g = this.gfx(depth);
    const ps: { x: number; y: number; l: number }[] = [];
    let acc = 0;
    this.tick((t, dt) => {
      acc += dt * 5 * rate;
      while (acc > 1) { acc -= 1; ps.push({ x: x + Math.random() * 2 - 1, y, l: 0 }); }
      g.clear();
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.l += dt; p.y -= 9 * dt; p.x += Math.sin(t * 2 + p.y) * 3 * dt + 2 * dt;
        if (p.l > 1.6) { ps.splice(i, 1); continue; }
        const k = 1 - p.l / 1.6, s = p.l < 0.7 ? 1 : 2;
        g.fillStyle(col, 0.5 * k); g.fillRect(Math.floor(p.x) * PX, Math.floor(p.y) * PX, PX * s, PX * s);
      }
    });
  }
}

export function buildCourt(scene: Phaser.Scene, id: CourtId): CourtScene {
  const art = ART[id];
  const c = new Scene2D(art.seed);
  c.amb = { ...c.amb, ...art.amb };
  art.paint(c);
  art.paintFloor(c);
  applyLighting(c);

  const tag = `court_${id}`;
  for (const k of [`${tag}_sky`, `${tag}_base`, `${tag}_glow`]) if (scene.textures.exists(k)) scene.textures.remove(k);
  pixTexture(scene, `${tag}_sky`, c.sky); pixTexture(scene, `${tag}_base`, c.base); pixTexture(scene, `${tag}_glow`, c.glow);
  const objs: Phaser.GameObjects.GameObject[] = [];
  const mk = (k: string, d: number) => { const im = scene.add.image(0, 0, k).setOrigin(0).setScale(PX).setDepth(d); objs.push(im); return im; };
  mk(`${tag}_sky`, -1100); mk(`${tag}_base`, -1000); mk(`${tag}_glow`, -990);

  const live = new Live(scene, c, tag);
  const L = live;
  c.lamps.filter((l) => l.flicker).forEach((l, i) => {
    const key = L.tex(41, 41, (p) => {
      for (let y = 0; y < 41; y++) for (let x = 0; x < 41; x++) { const d = Math.hypot(x - 20, y - 20) / 20; if (d < 1 && (1 - d) * 0.9 > ((((x & 3) << 2) | (y & 3)) + 0.5) / 16 * 0.9) p.set(x, y, mulCol(l.color, 0.5, 0.42, 0.28)); }
    });
    const im = L.img(key, l.x - 20, l.y - 20, -985, { blend: Phaser.BlendModes.ADD, alpha: 0.5 });
    let next = 0, v = 1;
    L.tick((t) => { if (t > next) { v = Math.random() < 0.7 ? 1 : Math.random() * 0.5; next = t + (v < 1 ? 0.05 + Math.random() * 0.1 : 0.3 + Math.random() * 1.5); } im.setAlpha(0.15 + 0.5 * v); });
    void i;
  });
  art.live?.(L, c);
  addCourtEvents(L,id);

  const bx = BOOM_X[id] ?? 190;
  const bg = L.gfx(FY * PX - 2, Phaser.BlendModes.ADD);
  L.tick(() => {
    bg.clear();
    const v = music.level;
    if (v < 0.04) return;
    bg.fillStyle(0xffd890, Math.min(0.9, v * 0.9));
    for (const sx of [bx + 1, bx + 6]) bg.fillRect(sx * PX, 155 * PX, 3 * PX, 3 * PX);
    bg.fillStyle(0xff6a3a, Math.min(0.8, v));
    bg.fillRect((bx + 4) * PX, 156 * PX, 2 * PX, PX);
    bg.fillStyle(0xffd890, v * 0.12);
    bg.fillRect((bx - 3) * PX, 148 * PX, 16 * PX, 12 * PX);
  });

  const hoopKey = 'hoopfront_' + id;
  if (scene.textures.exists(hoopKey)) scene.textures.remove(hoopKey);
  const hoopPix = new Pix(36, 40);
  const hoopTex = pixTexture(scene, hoopKey, hoopPix);
  const hoopImg = scene.add.image((HXP - 16) * PX, (RIMY - 4) * PX, hoopKey).setOrigin(0).setScale(PX).setDepth(FY * PX + 1);
  objs.push(hoopImg);
  const netCol = art.net ?? 0xf0f0f0;
  const drawNet = (kick: number, t: number) => {
    const p = hoopPix; p.clear();
    const ox = 16, oy = 4;
    const sway = Math.sin(t * 22) * kick * 2.2, stretch = Math.round(kick * 3);
    const len = 16 + stretch;
    const rim = 0xff6a1a;
    for (let dx = -9; dx <= 9; dx++) { const dy = Math.round(Math.sqrt(Math.max(0, 1 - (dx / 9) ** 2)) * 2); p.set(ox + dx, oy + dy, rim); p.set(ox + dx, oy + dy + 1, shadeRim(rim)); }
    const strands = 8;
    for (let i = 0; i <= strands; i++) {
      const u = (i / strands) * 2 - 1;
      let px = ox + u * 9, py = oy + 2;
      for (let r = 1; r <= len; r++) {
        const k = r / len, x = ox + u * 9 * (1 - 0.5 * k) + sway * k * k, y = oy + 2 + r;
        p.set(Math.round(x), y, (r + i) % 2 ? netCol : mix(netCol, 0x6a7080, 0.45));
        px = x; py = y;
      }
      void px; void py;
    }
    for (const rr of [5, 10, len - 1]) {
      const k = rr / len;
      for (let i = 0; i <= strands * 2; i++) { const u = (i / (strands * 2)) * 2 - 1; p.set(Math.round(ox + u * 9 * (1 - 0.5 * k) + sway * k * k), oy + 2 + rr + (i % 2), mix(netCol, 0x8a90a0, 0.3)); }
    }
    p.upload(hoopTex.getContext()); hoopTex.refresh();
  };
  const shadeRim = (cc: Col) => mulCol(cc, 0.62, 0.55, 0.5);
  drawNet(0, 0);

  const crowd = new Crowd(scene, c.spots, art.crowdLook ?? 'bk', id);

  const lightFor = (px: number, py: number) => lightValue(c, px, py);
  const nightTint = mulCol(0xffffff, Math.min(1, c.amb.tint[0] * 1.9), Math.min(1, c.amb.tint[1] * 1.9), Math.min(1, c.amb.tint[2] * 1.7));
  const tintAt = (wx: number, wy: number) => {
    const v = clamp(lightFor(wx / PX, wy / PX), 0, 1);
    return mix(nightTint, 0xffffff, smooth(v * 1.15));
  };
  crowd.tint = tintAt;
  return {
    spots: c.spots,
    boomX: (bx + 5) * PX,
    update: (t, dt) => { live.ticks.forEach((f) => f(t, dt)); crowd.update(t, dt); },
    destroy: () => { live.objs.forEach((o) => o.destroy()); objs.forEach((o) => o.destroy()); crowd.destroy(); },
    tintAt,
    drawNet,
    cheer: (p) => crowd.cheer(p),
  };
}
