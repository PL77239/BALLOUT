import Phaser from 'phaser';
import { Col, GW, mix, shade } from './pixel';
import { FY, Scene2D, bench, boombox, chainFence, halo, moon, sign, sky, stars, trashCan } from './courtkit';
import { BOOM_X, CourtArt, finish, spots } from './court_common';
import { textWidth } from './font';
import type { Live } from './courts';

/* ------------------------------------------------------------------ helpers */

const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Rolling ridge of treeline silhouettes. */
function ridge(c: Scene2D, base: number, amp: number, col: Col, seed: number, spike = 0) {
  const P = c.base;
  for (let x = 0; x < GW; x++) {
    const y = Math.round(base - amp * (0.5 + 0.28 * Math.sin(x / 31 + seed) + 0.17 * Math.sin(x / 11.3 + seed * 2.1) + 0.05 * Math.sin(x / 4.1)));
    P.vline(x, y, 159, col);
    if (spike && hash(x + seed * 7) < 0.22) P.vline(x, y - 1 - Math.floor(hash(x * 3 + seed) * spike), y, col);
  }
}

function pine(c: Scene2D, x: number, base: number, h: number, col: Col) {
  const P = c.base;
  const layers = Math.max(4, Math.round(h / 9));
  P.rect(x - 1, base - 6, 3, 6, shade(col, 0.6));
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const y0 = base - h + i * ((h - 8) / layers) * 0.95;
    const lh = 7 + t * 4, hw = 2 + t * (h * 0.2);
    P.poly([x - hw, y0 + lh, x, y0, x + hw, y0 + lh], shade(col, 0.92 + (i % 2) * 0.12));
    P.poly([x + 1, y0 + 1, x + hw, y0 + lh, x + 1, y0 + lh], shade(col, 0.7));
    for (let k = 0; k < 4; k++) P.set(Math.round(x - hw * (0.2 + c.r() * 0.7)), Math.round(y0 + lh - 1 - c.r() * lh * 0.6), shade(col, 1.45));
  }
}

function oak(c: Scene2D, x: number, base: number, w: number, h: number, bark: Col) {
  const P = c.base;
  P.poly([x - w / 2 - 4, base, x - w / 2 + 1, base - 14, x - w / 2 + 1, base - h, x + w / 2 - 1, base - h, x + w / 2 - 1, base - 14, x + w / 2 + 4, base], bark);
  for (let i = 0; i < w * 2.2; i++) {
    const bx = Math.round(x - w / 2 + 1 + c.r() * (w - 2)), by = Math.round(base - h + c.r() * (h - 4)), len = 3 + Math.floor(c.r() * 10);
    P.vline(bx, by, by + len, c.r() < 0.6 ? shade(bark, 0.62) : shade(bark, 1.3));
  }
  P.vline(Math.round(x - w / 2 + 1), base - h, base - 14, shade(bark, 1.55));
  P.vline(Math.round(x + w / 2 - 2), base - h, base - 14, shade(bark, 0.55));
  for (let i = 0; i < 3; i++) {
    const by = base - h * (0.45 + i * 0.17), dir = i % 2 ? 1 : -1, len = 20 + c.r() * 22;
    const sx = x + dir * w / 2;
    for (const o of [0, 1, 2]) P.line(sx, by + o, sx + dir * len, by - len * 0.7 + o, shade(bark, 0.9));
    P.line(sx + dir * len * 0.5, by - len * 0.35, sx + dir * len * 0.9, by - len * 0.2, shade(bark, 0.8));
  }
}

function canopy(c: Scene2D) {
  const P = c.base;
  const pal = [0x0a1a14, 0x0f2518, 0x153220, 0x1d4028, 0x275232];
  const edge = (x: number) => {
    let y = 20 + 11 * Math.sin(x / 23) + 7 * Math.sin(x / 8.7 + 1.3) + 3 * Math.sin(x / 3.1);
    const g = Math.max(0, 1 - Math.abs(x - 296) / 34);
    y -= g * 28;
    return Math.max(2, y);
  };
  for (let x = 0; x < GW; x++) P.vline(x, 0, Math.round(edge(x)), pal[0]);
  for (let i = 0; i < 520; i++) {
    const x = c.rnd(-4, GW + 4), y = edge(x) - c.rnd(0, 14);
    P.circle(x, y, 2 + c.r() * 4.5, pal[1 + Math.floor(c.r() * 3)]);
  }
  for (let i = 0; i < 260; i++) {
    const x = c.rnd(0, GW), y = edge(x) - c.rnd(-2, 12);
    P.circle(x, y, 1 + c.r() * 2.4, pal[2 + Math.floor(c.r() * 3)]);
  }
  for (let i = 0; i < 220; i++) { const x = Math.floor(c.rnd(0, GW)); P.set(x, Math.round(edge(x) - c.rnd(0, 10)), shade(pal[4], 1.5)); }
  for (let i = 0; i < 90; i++) { const x = Math.floor(c.rnd(0, GW)), y = Math.round(edge(x)); P.vline(x, y, y + 2 + Math.floor(c.r() * 7), pal[1 + Math.floor(c.r() * 3)]); }
}

function stoneWall(c: Scene2D, y0: number, y1: number) {
  const P = c.base, pal = [0x4a4a46, 0x5a584e, 0x3e403c, 0x686458, 0x504c44, 0x44483f];
  P.rect(0, y0, GW, y1 - y0 + 1, 0x24241f);
  for (let y = y0 + 2; y < y1; y += 4) {
    let x = -((y * 7) % 9);
    while (x < GW) {
      const w = 6 + Math.floor(c.r() * 7), col = pal[Math.floor(c.r() * pal.length)];
      P.rect(x + 1, y, w - 1, 3, col);
      P.hline(x + 1, x + w - 1, y, shade(col, 1.3));
      P.hline(x + 1, x + w - 1, y + 2, shade(col, 0.72));
      if (c.r() < 0.18) P.set(x + 2 + Math.floor(c.r() * (w - 3)), y + 1, 0x4a6a3a);
      x += w;
    }
  }
  P.rect(0, y0 - 1, GW, 2, 0x7a766a); P.hline(0, GW, y0 - 1, 0x9a9686);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(c.rnd(0, GW)), n = 2 + Math.floor(c.r() * 5), col = c.pick([0x1c3a22, 0x2a5430, 0x3a6a38]);
    for (let k = 0; k < n; k++) P.set(x + Math.floor(c.rnd(-2, 3)), y0 - 2 + Math.floor(c.rnd(0, 6)), col);
    if (c.r() < 0.4) P.vline(x, y0, y0 + 2 + Math.floor(c.r() * 6), col);
  }
}

/** Cast-iron park lantern on a fluted post; the light spills as a cone and a dithered pool. */
function parkLamp(c: Scene2D, x: number, base: number, top: number, o: { col?: number; flicker?: boolean; k?: number; reach?: number } = {}) {
  const P = c.base, col = o.col ?? 0xffc878, iron = 0x16221c;
  P.rect(x - 4, base - 4, 9, 4, iron); P.hline(x - 4, x + 4, base - 4, 0x34483e);
  P.rect(x - 3, base - 9, 7, 5, 0x1c2c24); P.rect(x - 2, base - 11, 5, 2, iron);
  P.rect(x - 1, top + 9, 3, base - top - 20, iron); P.vline(x - 1, top + 9, base - 12, 0x34483e);
  for (const ry of [top + 11, base - 28]) P.rect(x - 2, ry, 5, 2, 0x1c2c24);
  P.rect(x - 3, top + 7, 7, 2, iron);
  P.rect(x - 4, top, 9, 7, iron);
  c.glow.rect(x - 3, top + 1, 7, 5, mix(col, 0xffffff, 0.35)); c.glow.rect(x - 2, top + 2, 5, 3, mix(col, 0xffffff, 0.75));
  P.vline(x, top, top + 6, iron);
  P.poly([x - 5, top, x, top - 5, x + 6, top], iron); P.hline(x - 4, x + 4, top - 1, 0x34483e);
  P.set(x, top - 6, 0x34483e);
  halo(c.glow, x, top + 3, 14, mix(col, 0xffffff, 0.3), 0.85);
  halo(c.glow, x, top + 3, 6, mix(col, 0xffffff, 0.8), 1);
  const k = o.k ?? 1, f = o.flicker ? 1 : undefined;
  c.lights.push({ kind: 'cone', x, y: top + 7, rx: 34, ry: base - top + 10, k: 0.6 * k, flicker: f, color: col });
  c.lights.push({ kind: 'point', x, y: top + 4, rx: 30, ry: 28, k: 0.5 * k, flicker: f, color: col });
  c.lights.push({ kind: 'pool', x, y: FY + 4, rx: o.reach ?? 66, ry: 26, k: 0.8 * k, flicker: f, color: col });
  c.lamps.push({ x, y: top + 4, flicker: !!o.flicker, color: col });
}

function picnicTable(c: Scene2D, x: number, y: number) {
  const P = c.base, wood = 0x6a4a2c;
  P.line(x + 5, y - 8, x + 1, y, 0x3a2a1a); P.line(x + 6, y - 8, x + 2, y, 0x3a2a1a); P.line(x + 5, y - 8, x + 10, y, 0x3a2a1a);
  P.line(x + 22, y - 8, x + 18, y, 0x3a2a1a); P.line(x + 22, y - 8, x + 27, y, 0x3a2a1a); P.line(x + 23, y - 8, x + 28, y, 0x3a2a1a);
  P.rect(x, y - 12, 29, 3, wood); P.hline(x, x + 28, y - 12, shade(wood, 1.4)); P.hline(x, x + 28, y - 10, shade(wood, 0.6));
  P.rect(x - 3, y - 6, 35, 2, shade(wood, 0.85)); P.hline(x - 3, x + 31, y - 6, shade(wood, 1.3));
  for (let i = 4; i < 28; i += 7) P.vline(x + i, y - 12, y - 10, shade(wood, 0.7));
}

function fountain(c: Scene2D, x: number, y: number) {
  const P = c.base, st = 0x6a6a64;
  P.rect(x - 3, y - 15, 7, 15, st); P.vline(x - 3, y - 15, y - 1, shade(st, 1.3)); P.vline(x + 3, y - 15, y - 1, shade(st, 0.7));
  P.rect(x - 5, y - 18, 11, 4, shade(st, 1.1)); P.hline(x - 5, x + 5, y - 18, shade(st, 1.5));
  P.rect(x - 1, y - 14, 3, 2, 0x28303a);
  P.rect(x - 5, y - 2, 11, 2, shade(st, 0.8));
}

function bush(c: Scene2D, x: number, y: number, w: number, h: number) {
  const P = c.base, pal = [0x0f2216, 0x16301e, 0x1f4026, 0x2a5430];
  for (let i = 0; i < w * 1.4; i++) {
    const bx = x + c.rnd(0, w), t = Math.sin(((bx - x) / w) * Math.PI), by = y - t * h * c.rnd(0.3, 1);
    P.circle(bx, by, 2 + c.r() * 3, pal[Math.floor(c.r() * 3)]);
  }
  for (let i = 0; i < w; i++) { const bx = Math.floor(x + c.rnd(0, w)); P.set(bx, Math.round(y - Math.sin(((bx - x) / w) * Math.PI) * h * c.rnd(0.3, 1)), pal[3]); }
  P.rect(x, y - 1, w, 2, pal[0]);
}

function grassTufts(c: Scene2D, y0: number, y1: number, n: number, x0 = 0, x1 = GW) {
  const P = c.base;
  for (let i = 0; i < n; i++) {
    const x = Math.floor(c.rnd(x0, x1)), y = Math.floor(c.rnd(y0, y1)), col = c.pick([0x1c3a22, 0x2a5430, 0x346a3a, 0x4a7a3a]);
    P.vline(x, y - 2, y, col); P.set(x - 1, y - 1, col); P.set(x + 1, y - 2, shade(col, 1.2));
  }
}

/* ------------------------------------------------------------------ FAIRMOUNT PARK */

export const fairmount: CourtArt = {
  seed: 52,
  crowdLook: 'philly',
  net: 0xe8ecf0,
  amb: { tint: [0.3, 0.42, 0.46], k: 0.24, lit: [1.14, 1.04, 0.78], steps: 5 },
  paint(c) {
    sky(c, [0x050a16, 0x0a1828, 0x12303a, 0x214448, 0x3a5e56, 0x587a68], 0, 156);
    stars(c, 140, 0, 78, 0xe8f0ff);
    moon(c, 300, 22, 8, 0xe6ecd8);
    halo(c.sky, 300, 22, 30, 0x6a90a0, 0.2, 24);

    ridge(c, 118, 26, 0x16303a, 1.7);
    ridge(c, 130, 22, 0x0f2630, 4.2, 3);
    for (let x = 6; x < GW; x += 13 + Math.floor(c.r() * 12)) pine(c, x, 154, 40 + Math.floor(c.r() * 26), c.pick([0x0a1c18, 0x0c2018, 0x0e241c]));
    for (let x = 14; x < GW; x += 9 + Math.floor(c.r() * 14)) pine(c, x, 158, 22 + Math.floor(c.r() * 18), c.pick([0x081410, 0x0a1a14]));

    for (const [x, w, h, b] of [[22, 12, 150, 0x3a3226], [104, 15, 156, 0x322c22], [210, 13, 154, 0x3c3428], [262, 11, 150, 0x302a20], [338, 14, 154, 0x362e24]] as [number, number, number, number][]) oak(c, x, 158, w, h, b);
    canopy(c);
    c.base.rect(100, 64, 8, 9, 0x070806); c.base.hline(101, 106, 63, 0x070806); c.base.hline(101, 106, 73, 0x070806);

    stoneWall(c, 146, 158);
    chainFence(c, 0, 112, GW, 159, 0x8a9aa4, 0.32);
    bush(c, 120, 150, 36, 12); bush(c, 292, 150, 44, 14); bush(c, 0, 150, 30, 12); bush(c, 196, 150, 26, 9);

    parkLamp(c, 46, 158, 62);
    parkLamp(c, 150, 158, 60, { k: 1.05 });
    parkLamp(c, 250, 158, 62, { flicker: true });
    parkLamp(c, 336, 158, 60);

    const sg = 'FAIRMOUNT PARK', sw = textWidth(sg, 1) + 6;
    const sx = 168, sy = 114;
    c.base.rect(sx, sy + 8, 2, 38, 0x3a2a1a); c.base.rect(sx + sw - 2, sy + 8, 2, 38, 0x3a2a1a);
    sign(c, sx + 3, sy + 1, sg, 0xf0e0b0, { bg: 0x3a2818, frame: 0x6a4a2a, outline: 0x1a1008 });
    c.base.rect(sx - 1, sy - 2, sw + 4, 1, 0x6a4a2a);

    spots(c, [[34, 157, 'stand', 1], [72, 157, 'kid'], [120, 158, 'sit'], [236, 157, 'stand', -1], [286, 157, 'elder', -1], [312, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x3b433f, edge: 0x2a322c, key: 0x28583f, lines: 0xdce4d8, seed: 12, crack: 38, speckle: 1.3, patch: 2.2, sidewalk: 0x3a3a2e, wear: 0x4a5448 }, { board: 0xdce2e6 }, () => {
      const P = c.base;
      for (let i = 0; i < 160; i++) {
        const x = Math.floor(c.rnd(10, GW - 12)), y = Math.floor(c.rnd(158, 222)), col = c.pick([0x7a4a22, 0x9a6a24, 0x6a3a1e, 0x8a7a30, 0x5a4a22]);
        P.set(x, y, col); if (c.r() < 0.4) P.set(x + 1, y, shade(col, 0.8));
      }
      for (let i = 0; i < 20; i++) P.stipple(Math.floor(c.rnd(12, 380)), Math.floor(c.rnd(158, 214)), 6 + Math.floor(c.r() * 16), 2 + Math.floor(c.r() * 2), 0x2c4a2e, 0.4);
      grassTufts(c, 154, 160, 90);
      grassTufts(c, 222, 226, 120);
      picnicTable(c, 62, 161);
      fountain(c, 300, 160);
      trashCan(c, 14, 160);
      bench(c, 112, 160, 22); boombox(c, BOOM_X.fairmount, 160);
      bush(c, -4, 232, 38, 16); bush(c, 392, 234, 40, 16);
    });
  },
  live(L: Live) {
    const g = L.gfx(-700, Phaser.BlendModes.ADD);
    const flies = Array.from({ length: 26 }, (_, i) => ({ x: hash(i) * GW, y: 70 + hash(i + 40) * 130, p: hash(i + 90) * 9, s: 4 + hash(i + 7) * 6 }));
    const lampPos: [number, number][] = [[150, 63], [46, 65], [250, 65], [336, 63]];
    const moths = Array.from({ length: 9 }, (_, i) => ({ l: lampPos[i % 4], p: hash(i + 200) * 6.28, r: 5 + hash(i + 3) * 8, s: 2 + hash(i + 11) * 2.4 }));
    L.tick((t) => {
      g.clear();
      for (const f of flies) {
        const x = f.x + Math.sin(t * 0.35 + f.p) * 14 + Math.sin(t * 0.9 + f.p * 2) * 4;
        const y = f.y + Math.sin(t * 0.5 + f.p * 1.7) * 9;
        const on = Math.max(0, Math.sin(t * 1.1 * f.s * 0.3 + f.p));
        if (on < 0.35) continue;
        g.fillStyle(0xcaf050, on * 0.28); g.fillRect(Math.floor(x - 1) * 3, Math.floor(y) * 3, 9, 3); g.fillRect(Math.floor(x) * 3, Math.floor(y - 1) * 3, 3, 9);
        g.fillStyle(0xf2ffb0, on); g.fillRect(Math.floor(x) * 3, Math.floor(y) * 3, 3, 3);
      }
      for (const m of moths) {
        const a = t * m.s + m.p, x = m.l[0] + Math.cos(a) * m.r, y = m.l[1] + Math.sin(a * 1.3) * m.r * 0.55;
        g.fillStyle(0xfff0c0, 0.85); g.fillRect(Math.floor(x) * 3, Math.floor(y) * 3, 3, 3);
        if (Math.sin(a * 9) > 0) g.fillRect(Math.floor(x) * 3, Math.floor(y) * 3 - 3, 3, 3);
      }
    });

    const lg = L.gfx(-600);
    const leaves = Array.from({ length: 34 }, (_, i) => ({ x: hash(i + 300) * GW, y: hash(i + 340) * 230, s: 0.6 + hash(i + 380) * 0.9, p: hash(i + 420) * 6.28, c: [0x9a6a24, 0xb87a2a, 0x7a4a1e, 0x8a8a30][i % 4] }));
    L.tick((t, dt) => {
      lg.clear();
      for (const f of leaves) {
        f.y += 9 * f.s * dt; f.x += Math.sin(t * 1.1 + f.p) * 12 * dt - 3 * dt;
        if (f.y > 226) { f.y = -4; f.x = Math.random() * (GW + 20); }
        if (f.x < -3) f.x = GW + 2;
        const fl = Math.sin(t * 3 + f.p) > 0;
        lg.fillStyle(f.c, 0.9); lg.fillRect(Math.floor(f.x) * 3, Math.floor(f.y) * 3, fl ? 6 : 3, 3);
      }
    });

    const fog = L.tex(300, 34, (p) => {
      for (let i = 0; i < 26; i++) {
        const cx = hash(i + 500) * 300, cy = 8 + hash(i + 530) * 18, rx = 22 + hash(i + 560) * 46, ry = 2 + hash(i + 590) * 4;
        for (const o of [-300, 0, 300]) {
          for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
            for (let x = Math.floor(cx + o - rx); x <= Math.ceil(cx + o + rx); x++) {
              const nx = (x + 0.5 - cx - o) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
              if (d > 1) continue;
              if (d < 0.3 || (d < 0.65 && ((x + y) & 1) === 0) || ((x & 1) === 0 && (y & 1) === 0)) p.set(x, y, 0xa8c4c8);
            }
          }
        }
      }
    });
    const f1 = L.mover(fog, 300, 112, 2.2, -995, -250, { x0: 40 }); f1.setAlpha(0.22);
    const f2 = L.mover(fog, 300, 134, -1.6, -994, -250, { x0: 190 }); f2.setAlpha(0.3);
    const f3 = L.mover(fog, 300, 152, 1.2, -993, -250, { x0: 90 }); f3.setAlpha(0.14);
    L.blink(102, 69, 0xf0d040, 6.4, -980, 0, 0.82);
    L.blink(106, 69, 0xf0d040, 6.4, -980, 0, 0.82);
  },
};
