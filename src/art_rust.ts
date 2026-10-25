import { GW, Pix, mix, shade } from './pixel';
import { FY, Scene2D, antenna, awning, barrel, brick, chainFence, dumpster, fireEscape, graffiti, halo, hydrant, lamp, powerLine, sign, skyline, sky, slab, stars, stoop, tree, trashCan, tires, windows, car, cart, bench, boombox } from './courtkit';
import { CourtArt, building, carSprite, finish, laundry, shopWindow, sneakersWire, spots, truss } from './court_common';

/* ------------------------------------------------------------------ PHILLY */

export const philly: CourtArt = {
  seed: 33,
  crowdLook: 'philly',
  net: 0xe8ecf0,
  amb: { tint: [0.36, 0.44, 0.58], k: 0.28, lit: [1.12, 1.02, 0.82], steps: 5 },
  paint(c) {
    sky(c, [0x0a1020, 0x1a2438, 0x2a3448, 0x4a4a5a, 0x6a5a62, 0x8a6a62], 0, 150);
    skyline(c, 128, 0, GW, 28, 80, 0x1c2438, { win: 0xe8d890, wmin: 8, wmax: 15 });
    // City Hall tower in the haze
    c.base.rect(232, 58, 18, 70, 0x232c44); c.base.rect(235, 40, 12, 20, 0x232c44); c.base.poly([234, 40, 241, 18, 248, 40], 0x232c44); c.base.vline(241, 8, 18, 0x232c44);
    c.glow.rect(239, 46, 4, 4, 0xe8d890);
    skyline(c, 150, 0, GW, 10, 34, 0x222a40, { win: 0xe8c878, wmin: 10, wmax: 20 });

    const row = (x: number, w: number, y: number, base: number) => {
      building(c, x, y, w, 158 - y, base, { cols: 3, rows: Math.floor((158 - y - 40) / 11), lit: 0.4, oy: 7 });
      c.base.rect(x + w / 2 - 6, 133, 12, 25, 0x1c1418); c.base.rect(x + w / 2 - 5, 134, 10, 8, 0x2a2430);
      c.glow.rect(x + w / 2 - 3, 135, 6, 5, 0xf0c070);
      stoop(c, x + w / 2 - 8, 158, 3, 0xd8d4cc);
    };
    row(-6, 52, 50, 0x8a4a3c); row(46, 52, 58, 0x7a4234); row(98, 52, 46, 0x944e3e); row(150, 52, 60, 0x824638);
    for (let x = 0; x < 215; x += 52) { c.base.rect(x + 8, 128, 36, 2, 0x20181a); awning(c, x + 6, 126, 40, 0x2a5a4a, 0xe8e4d8); }
    // corner store
    brick(c, 214, 92, 112, 66, 0x6a3a30);
    c.base.rect(212, 89, 116, 4, 0x20181c);
    shopWindow(c, 222, 120, 52, 33, 0xe8d49a, { shelves: 3 });
    c.base.rect(290, 112, 20, 42, 0x1c1618); c.glow.rect(292, 114, 16, 20, 0x6a5030);
    sign(c, 220, 98, 'HOAGIES', 0xff5a3a, { neon: true, scale: 2 });
    sign(c, 228, 110, 'WATER ICE', 0x4ad8ff, { neon: true });
    graffiti(c, 330, 104, 'PHILLY', 0xf2e8c0, { scale: 2, outline: 0x1a1020, shadow: 0x2a8ac8 });
    building(c, 326, 60, 106, 98, 0x7c4638, { cols: 9, rows: 8, lit: 0.36 });
    graffiti(c, 336, 128, 'N.P.', 0xf2c030, { scale: 3, outline: 0x1a1020, shadow: 0xd02a6a });
    powerLine(c, 0, 42, GW, 50, 8);
    sneakersWire(c, 150, 330, 64, 8, 2);
    chainFence(c, 0, 96, GW, 159, 0xa0a8b4, 0.35);
    lamp(c, 205, 158, 58, { dir: 1, col: 0xffb858, k: 1.05 });
    lamp(c, 340, 158, 58, { dir: -1, col: 0xffb858, flicker: true });
    spots(c, [[18, 157, 'stand', 1], [64, 157, 'kid'], [110, 157, 'stand'], [236, 157, 'stand', -1], [282, 157, 'elder', -1], [304, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x36424a, edge: 0x4a4e56, key: 0x7a2c3a, lines: 0xe0e4e8, seed: 4, crack: 20, wet: true }, { board: 0xdde2e8 }, () => {
      hydrant(c, 160, 159, 0x2a8ad8); trashCan(c, 12, 160); cart(c, 118, 160);
      car(c, 244, 160, 0x4a5a78);
    });
  },
  live(L) {
    L.rain(110, 5000);
    L.mover(carSprite(L, 0x2a3048, { lit: true }), 46, 138, 22, -995, 300);
  },
};

/* ------------------------------------------------------------------ DETROIT */

export const detroit: CourtArt = {
  seed: 44,
  crowdLook: 'detroit',
  net: 0xdde4f0,
  amb: { tint: [0.34, 0.42, 0.62], k: 0.3, lit: [1.1, 1.0, 0.86], steps: 5 },
  paint(c) {
    sky(c, [0x0a0e1c, 0x1a2236, 0x303a50, 0x4e5668, 0x7a7080, 0x9a8a88], 0, 150);
    // Renaissance Center towers on the horizon
    for (const [x, h] of [[382, 56], [394, 74], [406, 56], [370, 48], [418, 48]] as [number, number][]) { c.base.rect(x - 4, 132 - h, 9, h, 0x1c2438); c.base.rect(x - 4, 132 - h, 9, 2, 0x34405a); for (let y = 132 - h + 4; y < 130; y += 3) c.glow.set(x - 1, y, 0xe8d890); }
    skyline(c, 134, 0, 380, 16, 56, 0x1a2234, { win: 0xe0c880, wmin: 8, wmax: 14 });

    slab(c, -4, 40, GW + 8, 6, 0x3a3a46, { v: 0.15 }); c.base.hline(-4, GW + 4, 40, 0xe4eaf4); c.base.rect(-4, 46, GW + 8, 8, 0x20202a);
    for (let x = 6; x < GW; x += 24) c.base.rect(x, 46, 6, 10, 0x2a2a34);
    // the plant
    const fx = 10, fy = 70;
    brick(c, fx, fy, 270, 88, 0x5a3a34);
    c.base.rect(fx - 1, fy - 2, 272, 3, 0x2a1c1c);
    for (let x = fx + 4; x < fx + 268; x += 26) { c.base.poly([x, fy, x + 22, fy - 14, x + 22, fy], 0x3a2a2c); c.base.hline(x, x + 22, fy - 1, 0xe4eaf4); c.base.line(x, fy, x + 22, fy - 14, 0xe4eaf4); }
    for (let x = fx + 8; x < fx + 262; x += 14) for (let y = fy + 8; y < fy + 66; y += 12) {
      const broken = c.r() < 0.45;
      c.base.rect(x - 1, y - 1, 12, 11, 0x1c1214); c.base.rect(x, y, 10, 9, broken ? 0x0a0808 : 0x3a4658);
      c.base.hline(x, x + 9, y + 4, 0x20181a); c.base.vline(x + 5, y, y + 8, 0x20181a);
      if (broken) c.base.set(x + 2 + Math.floor(c.r() * 6), y + Math.floor(c.r() * 8), 0x5a6a7a);
      else if (c.r() < 0.08) c.glow.rect(x, y, 10, 9, 0xe8c070);
    }
    c.base.rect(fx + 118, fy + 62, 36, 26, 0x16100e);
    c.base.rect(fx + 112, fy + 24, 126, 38, 0x4a3030); c.base.stipple(fx + 112, fy + 24, 126, 38, 0x3a2626, 0.3);
    graffiti(c, fx + 120, fy + 30, 'DETROIT', 0xf2c030, { scale: 3, outline: 0x1a1020, shadow: 0x2a8ac8 });
    for (const sx of [300, 322]) { c.base.rect(sx, 24, 14, 134, 0x4a3430); c.base.vline(sx, 24, 157, 0x6a4a44); c.base.rect(sx - 1, 22, 16, 3, 0x2a1c1c); c.base.rect(sx, 70, 14, 1, 0x2a1c1c); c.base.rect(sx, 104, 14, 1, 0x2a1c1c); }
    c.base.rect(342, 96, 84, 62, 0x484c58); for (let x = 346; x < 424; x += 12) c.base.vline(x, 98, 157, 0x30343e);
    slab(c, 342, 92, 86, 5, 0x3a3e4a);
    // freight yard fence and snow on the ground
    chainFence(c, 0, 98, GW, 159, 0xb4bcc8, 0.4);
    lamp(c, 292, 158, 60, { dir: -1, col: 0xffc878, flicker: true });
    lamp(c, 28, 158, 56, { dir: 1, col: 0xffc878, k: 0.9 });
    // fire barrel and its light
    c.lights.push({ kind: 'point', x: 70, y: 152, rx: 44, ry: 28, k: 0.6, flicker: 1, color: 0xff8a30 });
    c.lights.push({ kind: 'pool', x: 70, y: FY + 6, rx: 60, ry: 22, k: 0.55, flicker: 1, color: 0xff8a30 });
    c.lamps.push({ x: 70, y: 150, flicker: true, color: 0xff8a30 });
    halo(c.glow, 70, 150, 14, 0xff9a40, 0.35, 12);
    spots(c, [[56, 157, 'stand', 1], [84, 157, 'stand', -1], [104, 158, 'sit'], [228, 157, 'stand', -1], [262, 157, 'elder', -1], [318, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x3a3e4a, edge: 0x4a4e5a, key: 0x2a5a8a, lines: 0xe8ecf4, seed: 6, crack: 30, snow: 1.5, patch: 1.6, sidewalk: 0x6a6e7c }, { board: 0xe2e6ee }, () => {
      barrel(c, 66, 160); tires(c, 130, 160, 3); dumpster(c, 232, 160, 0x30486a);
      car(c, 150, 160, 0x4a3a3a, { kind: 'sedan' });
    });
  },
  live(L) {
    L.snow(110, 5000);
    L.fire(70, 151, 400);
    L.steam(298, 22, -985, 0xc8ccd8, 1.4);
    L.steam(320, 22, -985, 0xc8ccd8, 1.1);
    const train = L.tex(160, 18, (p) => {
      for (let i = 0; i < 4; i++) {
        const x = i * 40, col = [0x5a3a2a, 0x2a3a4a, 0x4a2a2a, 0x3a4a3a][i];
        p.rect(x, 4, 38, 11, col); p.hline(x, x + 37, 4, shade(col, 1.4)); p.rect(x + 2, 15, 6, 2, 0x111111); p.rect(x + 30, 15, 6, 2, 0x111111);
        for (let k = 3; k < 36; k += 5) p.vline(x + k, 5, 14, shade(col, 0.8));
        p.hline(x, x + 37, 3, 0xe4eaf4, 160);
      }
    });
    L.mover(train, 160, 23, 20, -1040, 600);
  },
};

/* ------------------------------------------------------------------ CHICAGO */

export const chicago: CourtArt = {
  seed: 77,
  crowdLook: 'chi',
  net: 0xf6f0e4,
  amb: { tint: [0.96, 0.78, 0.7], k: 0.8, lit: [1.06, 1.0, 0.94], steps: 4 },
  paint(c) {
    sky(c, [0x3a5a9a, 0x8a6aa0, 0xe08a8a, 0xf8a860, 0xfccc78, 0xfde8a8], 0, 150);
    c.sky.circle(70, 118, 20, 0xfde6a0); c.sky.circle(70, 118, 13, 0xfff4cc);
    for (let i = 0; i < 4; i++) c.sky.hline(0, GW, 100 + i * 8, 0xf6b878, 90);
    skyline(c, 130, 0, GW, 24, 78, 0x6a5878, { win: 0xffe8b0, wmin: 8, wmax: 16, roof: 0.5 });
    // Willis tower
    const tx = 190;
    c.base.rect(tx - 10, 50, 7, 82, 0x4a3e64); c.base.rect(tx - 3, 34, 7, 98, 0x4a3e64); c.base.rect(tx + 4, 62, 7, 70, 0x4a3e64);
    c.base.vline(tx - 6, 20, 50, 0x4a3e64); c.base.vline(tx, 8, 34, 0x4a3e64); c.base.vline(tx + 1, 8, 34, 0x4a3e64);
    for (let y = 36; y < 130; y += 4) { c.glow.set(tx - 8, y, 0xffe0a0); c.glow.set(tx - 1, y, 0xffe0a0); }
    // L tracks
    truss(c, -4, GW + 4, 112, 90, 0x3a3048, 9);
    for (let x = 20; x < GW; x += 70) { c.base.rect(x, 114, 4, 44, 0x2a2438); c.base.rect(x - 3, 112, 10, 3, 0x3a3048); }
    // three-flats with stacked porches
    const flat = (x: number, w: number, y: number, base: number) => {
      building(c, x, y, w, 158 - y, base, { cols: 3, rows: 4, lit: 0.25, oy: 6, trim: 0x3a2a24 });
      for (let f = 0; f < 3; f++) {
        const py = y + 20 + f * 30;
        c.base.rect(x + 4, py, w - 8, 3, 0x6a4a34); c.base.hline(x + 4, x + w - 5, py, 0x9a7a54);
        for (let k = x + 6; k < x + w - 6; k += 4) c.base.vline(k, py - 9, py - 1, 0x4a3424);
        c.base.hline(x + 4, x + w - 5, py - 9, 0x5a4230);
        c.base.rect(x + 4, py - 9, 2, 12, 0x4a3424); c.base.rect(x + w - 6, py - 9, 2, 12, 0x4a3424);
      }
    };
    flat(-4, 56, 40, 0xa05a3c); flat(54, 50, 52, 0xb06a44); flat(106, 54, 44, 0x8a4a38);
    flat(300, 56, 46, 0xa8603e); flat(358, 72, 38, 0x964e3a);
    tree(c, 262, 156, 64, 0x3a2418, [0xc0602a, 0xd8802c, 0xa84a22, 0xe8a030]);
    tree(c, 164, 156, 50, 0x3a2418, [0xb85a28, 0xd07a2a, 0x9a4420]);
    chainFence(c, 0, 100, GW, 159, 0x8a8a98, 0.35);
    lamp(c, 92, 158, 58, { dir: 1, col: 0xffd890, k: 0.4 });
    brick(c, 206, 118, 96, 40, 0x7a4234);
    graffiti(c, 220, 126, 'CHI', 0xf8f4e8, { scale: 3, outline: 0x2a1c20, shadow: 0xc02a3a });
    spots(c, [[22, 157, 'stand', 1], [70, 157, 'kid'], [120, 157, 'stand'], [214, 157, 'elder', -1], [284, 157, 'stand', -1], [320, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x5a5e68, edge: 0x6a6a74, key: 0xa83a2c, lines: 0xf4f0e0, seed: 8, crack: 16, sidewalk: 0x7a7a84, speckle: 1.1 }, { board: 0xf2f2f6 }, () => {
      bench(c, 136, 160, 22); trashCan(c, 14, 160); hydrant(c, 310, 159);
      boombox(c, 190, 160);
    });
  },
  live(L) {
    const train = L.tex(150, 20, (p) => {
      for (let i = 0; i < 5; i++) {
        const x = i * 30;
        p.rect(x, 3, 28, 12, 0xb8bcc8); p.hline(x, x + 27, 3, 0xe8ecf4); p.rect(x, 12, 28, 3, 0x2a5ac8); p.rect(x + 2, 15, 6, 3, 0x20202a); p.rect(x + 20, 15, 6, 3, 0x20202a);
        for (let k = 3; k < 25; k += 6) { p.rect(x + k, 5, 4, 5, 0xffe08a); }
      }
    });
    L.mover(train, 150, 96, 38, -1040, 480);
  },
};

void Pix; void mix; void antenna; void fireEscape; void sky; void stars; void slab; void windows; void Scene2D; void building; void laundry;
