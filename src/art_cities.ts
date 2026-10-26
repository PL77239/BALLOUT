import { GW, Pix, mix, shade } from './pixel';
import { FY, Scene2D, antenna, awning, bench, boombox, brick, chainFence, dumpster, graffiti, halo, hydrant, lamp, powerLine, sign, skyline, sky, slab, stars, tree, trashCan, car, cart } from './courtkit';
import { BOOM_X, CourtArt, building, carSprite, finish, spots, truss } from './court_common';

/* ------------------------------------------------------------------ CHIRAQ (South Side night — grittier cousin to golden-hour Chicago) */

export const chiraq: CourtArt = {
  seed: 88,
  crowdLook: 'chi',
  net: 0xe8e4d8,
  amb: { tint: [0.32, 0.38, 0.62], k: 0.22, lit: [1.14, 0.98, 0.72], steps: 5 },
  paint(c) {
    sky(c, [0x060810, 0x101828, 0x1a2438, 0x2a3048, 0x4a3a48, 0x6a4a40], 0, 150);
    stars(c, 48, 0, 48);
    skyline(c, 128, 0, GW, 22, 72, 0x141a30, { win: 0xf0c870, wmin: 7, wmax: 14, roof: 0.45 });
    // Elevated L structure
    truss(c, -4, GW + 4, 108, 88, 0x2a2438, 8);
    for (let x = 16; x < GW; x += 68) { c.base.rect(x, 110, 5, 48, 0x222030); c.base.rect(x - 4, 108, 13, 3, 0x3a3448); }
    // Three-flats, tighter and darker
    const flat = (x: number, w: number, y: number, base: number) => {
      building(c, x, y, w, 158 - y, base, { cols: 3, rows: 4, lit: 0.32, oy: 6, trim: 0x2a2018 });
      for (let f = 0; f < 3; f++) {
        const py = y + 22 + f * 28;
        c.base.rect(x + 4, py, w - 8, 2, 0x4a3424); c.base.hline(x + 4, x + w - 5, py, 0x6a5038);
        for (let k = x + 6; k < x + w - 6; k += 4) c.base.vline(k, py - 8, py - 1, 0x3a2818);
      }
    };
    flat(-2, 54, 48, 0x6a3a30); flat(54, 48, 54, 0x5a3228); flat(104, 52, 50, 0x724038);
    flat(298, 54, 52, 0x6a382e); flat(354, 68, 44, 0x583028);
    brick(c, 208, 116, 88, 42, 0x4a3028);
    graffiti(c, 218, 124, 'CHIRAQ', 0xf4f0e8, { scale: 3, outline: 0x1a1020, shadow: 0xd01c24 });
    graffiti(c, 226, 142, 'DRILL', 0x8a8aa0, { scale: 2, outline: 0x1a1020, shadow: 0x2a8ac8 });
    sign(c, 212, 108, 'LIQUOR', 0xff5a3a, { neon: true, scale: 2 });
    chainFence(c, 0, 98, GW, 159, 0x7a7a88, 0.38);
    lamp(c, 88, 158, 60, { dir: 1, col: 0xffa850, flicker: true, k: 1.1 });
    lamp(c, 318, 158, 58, { dir: -1, col: 0xffa850, flicker: true });
    dumpster(c, 268, 160, 0x2a3a4a);
    spots(c, [[20, 157, 'stand', 1], [62, 157, 'kid'], [118, 157, 'stand'], [220, 157, 'elder', -1], [290, 157, 'stand', -1], [340, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x3a3e48, edge: 0x4a4a54, key: 0x8a1c24, lines: 0xe8e4d8, seed: 9, crack: 24, sidewalk: 0x5a5a64, speckle: 1.15 }, { board: 0xe6eaf0 }, () => {
      bench(c, 142, 160, 20); trashCan(c, 18, 160); hydrant(c, 300, 159);
      boombox(c, BOOM_X.chiraq, 160);
      car(c, 248, 160, 0x2a3040);
    });
  },
  live(L) {
    const train = L.tex(150, 20, (p) => {
      for (let i = 0; i < 5; i++) {
        const x = i * 30;
        p.rect(x, 3, 28, 12, 0x8890a0); p.hline(x, x + 27, 3, 0xc8ccd8); p.rect(x, 12, 28, 3, 0x1a3a8a);
        for (let k = 3; k < 25; k += 6) p.rect(x + k, 5, 4, 5, 0xffd080);
      }
    });
    L.mover(train, 150, 94, 32, -1040, 420);
    L.mover(carSprite(L, 0x1a2030, { lit: true }), 46, 132, 26, -995, 280);
  },
};

/* ------------------------------------------------------------------ WARSAW (Mokotów blocks, tram wires, Palace silhouette) */

export const warsaw: CourtArt = {
  seed: 91,
  crowdLook: 'philly',
  net: 0xf0f0f0,
  amb: { tint: [0.52, 0.5, 0.58], k: 0.38, lit: [1.08, 1.02, 0.96], steps: 5 },
  paint(c) {
    sky(c, [0x6a7080, 0x8a90a0, 0xa8a8b8, 0xc8b8c0, 0xe8d0d8, 0xf0e8f0], 0, 150);
    // Palace of Culture spire
    const px = 378;
    c.base.rect(px - 6, 36, 14, 96, 0x6a6878); c.base.rect(px - 3, 24, 8, 14, 0x6a6878);
    c.base.poly([px - 4, 24, px, 8, px + 4, 24], 0x7a7888);
    for (let y = 40; y < 128; y += 6) c.base.hline(px - 5, px + 6, y, 0x5a5868);
    skyline(c, 120, 0, 360, 18, 64, 0x5a5a68, { win: 0xffe8c0, wmin: 6, wmax: 12 });
    // Panel blocks (wielka płyta)
    const block = (x: number, w: number, y: number, col: number, rows: number) => {
      c.base.rect(x, y, w, 158 - y, col);
      c.base.rect(x - 1, y - 1, w + 2, 2, shade(col, 0.7));
      const pitchX = 10, pitchY = 12;
      const cols = Math.floor((w - 4) / pitchX), rws = Math.min(rows, Math.floor((158 - y - 8) / pitchY));
      for (let row = 0; row < rws; row++) {
        for (let col_i = 0; col_i < cols; col_i++) {
          const wx = x + 2 + col_i * pitchX, wy = y + 6 + row * pitchY;
          c.base.rect(wx, wy, 8, 9, 0x88a0c8);
          c.base.hline(wx, wx + 7, wy + 4, 0x4a5060);
          c.base.vline(wx + 4, wy, wy + 8, 0x4a5060);
          if (c.r() < 0.35) c.glow.rect(wx, wy, 8, 9, 0xffe0a0);
        }
      }
      c.base.rect(x + 2, 158 - y - 8, w - 4, 6, 0x4a4a54);
    };
    block(-4, 58, 52, 0x9a9aa4, 8); block(56, 52, 48, 0x8a8a94, 9); block(110, 56, 50, 0xa0a0aa, 8);
    block(164, 44, 54, 0x888890, 10); block(220, 58, 48, 0x94949e, 7);
    block(272, 50, 56, 0x8e8e98, 9); block(332, 62, 52, 0x9696a0, 7);
    // Tram wires
    powerLine(c, 0, 46, GW, 58, 6);
    powerLine(c, 0, 52, GW, 62, 5);
    c.base.rect(180, 148, 24, 10, 0xd22b3a); c.base.rect(180, 148, 8, 10, 0xffffff);
    graffiti(c, 238, 118, 'WAWA', 0xf4f0e8, { scale: 3, outline: 0x2a2030, shadow: 0xd22b3a });
    graffiti(c, 246, 136, 'MOKOTÓW', 0xe8e8f0, { scale: 1, outline: 0x2a2030, shadow: 0x0e8a4a });
    chainFence(c, 0, 100, GW, 159, 0x9aa0a8, 0.32);
    lamp(c, 148, 158, 56, { dir: 1, col: 0xffe8c0, k: 0.55 });
    lamp(c, 328, 158, 56, { dir: -1, col: 0xffe8c0, k: 0.5 });
    tree(c, 200, 156, 42, 0x3a3028, [0x5a8a48, 0x6a9a50, 0x4a7a40]);
    spots(c, [[24, 157, 'stand', 1], [78, 157, 'kid'], [132, 157, 'stand'], [248, 157, 'elder', -1], [300, 157, 'stand', -1], [360, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x4a5058, edge: 0x5a6068, key: 0xd22b3a, lines: 0xf0f0f0, seed: 11, crack: 14, sidewalk: 0x6a7078, speckle: 0.9 }, { board: 0xf2f2f6 }, () => {
      bench(c, 124, 160, 24); cart(c, 36, 160); trashCan(c, 286, 160);
      boombox(c, BOOM_X.warsaw, 160);
      car(c, 168, 160, 0x4a5a68);
    });
  },
  live(L) {
    const tram = L.tex(120, 22, (p) => {
      p.rect(0, 6, 118, 14, 0xd22b3a); p.hline(0, 117, 6, 0xffe8e0);
      p.rect(0, 14, 118, 4, 0x2a2a34);
      for (let k = 4; k < 114; k += 14) { p.rect(k, 8, 10, 6, 0x88b0d8); p.hline(k, k + 9, 8, 0xe8ecf4); }
      p.rect(2, 18, 8, 3, 0x20202a); p.rect(108, 18, 8, 3, 0x20202a);
    });
    L.mover(tram, 120, 128, -18, -1020, 400, { flip: true });
    L.mover(carSprite(L, 0x3a4858, { lit: false }), 46, 134, 14, -990, 320);
  },
};

void Pix; void mix; void antenna; void awning; void dumpster; void halo; void brick; void FY; void Scene2D;
