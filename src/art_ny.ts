import { GH, GW, mix, shade } from './pixel';
import { FY, Scene2D, antenna, awning, bench, boombox, brick, chainFence, dumpster, fireEscape, graffiti, halo, hydrant, lamp, moon, pole, powerLine, sign, skyline, sky, slab, stars, suspension, tree, trashCan, waterTower, windows, cart, tires, stoop } from './courtkit';
import { BOOM_X, CourtArt, building, finish, laundry, sneakersWire, spots, truss, water } from './court_common';
import { shopWindow } from './court_common';

/* ------------------------------------------------------------------ BROOKLYN */

export const brooklyn: CourtArt = {
  seed: 11,
  crowdLook: 'bk',
  amb: { tint: [0.34, 0.39, 0.66], k: 0.26, lit: [1.18, 1.0, 0.74], steps: 5 },
  paint(c) {
    sky(c, [0x070a1e, 0x151a40, 0x2a2250, 0x5a3256, 0x9a4a56, 0xd8803e], 0, 150);
    stars(c, 70, 0, 70);
    moon(c, 262, 28, 9);
    skyline(c, 126, 0, GW, 28, 74, 0x151a38, { win: 0xf8d070, wmin: 9, wmax: 18, roof: 0.5 });
    for (let i = 0; i < 4; i++) { c.base.rect(150 + i * 16, 60 + i * 5, 4, 70, 0x151a38); }
    suspension(c, 150, 300, 98, 44, 0x1a1e3c, 0xffd890);
    skyline(c, 150, 0, GW, 12, 34, 0x1e1c38, { win: 0xf2b860, wmin: 10, wmax: 22 });

    building(c, -3, 23, 106, 135, 0x8e4c3a, { cols: 10, rows: 11, lit: 0.42 });
    fireEscape(c, 82, 34, 16, 6, 22);
    antenna(c, 20, 21, 12);
    building(c, 327, 13, 110, 145, 0x7e4638, { cols: 10, rows: 12, lit: 0.38 });
    waterTower(c, 392, 11);
    powerLine(c, 0, 52, 140, 66, 7); powerLine(c, 140, 66, 330, 54, 9);
    sneakersWire(c, 112, 226, 62, 8, 2);

    brick(c, 100, 104, 122, 56, 0x6e4a3c);
    c.base.rect(98, 101, 126, 4, 0x2a1c1e); c.base.hline(98, 223, 101, 0x5a4048);
    awning(c, 106, 122, 108, 0xb02a34, 0xeee6d8);
    shopWindow(c, 111, 133, 56, 21, 0xe8b860, { shelves: 2 });
    c.base.rect(176, 132, 18, 25, 0x1c1618); c.glow.rect(178, 134, 14, 18, 0x6a4a28); c.base.hline(176, 193, 132, 0x4a3a40);
    sign(c, 112, 107, 'DELI & GROCERY', 0xff5a7a, { neon: true });
    sign(c, 200, 126, 'OPEN', 0x4aff8a, { neon: true });
    c.base.rect(182, 114, 3, 8, 0x1c1618);

    slab(c, 222, 100, 108, 58, 0x5c5a66, { seam: 0, v: 0.08 });
    graffiti(c, 228, 106, 'BKLYN', 0xf2c030, { scale: 3, outline: 0x1a1020, shadow: 0xd02a6a, drip: true });
    graffiti(c, 232, 134, 'R.I.P. DEE', 0xf4f0e8, { scale: 1, outline: 0x1a1020, shadow: 0x4a6ac8 });
    for (let i = 0; i < 5; i++) { const x = 270 + i * 4; c.base.rect(x, 150, 2, 4, [0xe8e0d0, 0xc84a3a][i % 2]); c.glow.set(x, 149, 0xffd070); c.glow.set(x + 1, 149, 0xff9a40); }
    c.base.rect(300, 114, 22, 22, 0x2a4a8a); c.base.rect(302, 116, 18, 18, 0xe8c8a0); c.base.rect(306, 120, 10, 10, 0x6a4a3a);

    chainFence(c, 0, 76, GW, 159, 0xa8aeb8, 0.3);
    lamp(c, 143, 158, 56, { dir: 1, flicker: true });
    lamp(c, 322, 158, 56, { dir: -1 });
    laundry(c, 4, 60, 78, [0xe8e0d0, 0x3a6ac8, 0xd44a3a, 0xf0c840]);

    spots(c, [[26, 156, 'stand', 1], [48, 157, 'sit'], [197, 157, 'stand'], [236, 156, 'stand', -1], [262, 157, 'kid', -1], [296, 156, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x2c4a3a, edge: 0x4a4a52, key: 0x8e3a30, lines: 0xe8e4d8, seed: 3, crack: 22, speckle: 1.2 }, { board: 0xe6eaf0 }, () => {
      dumpster(c, 26, 160, 0x2c5a3a);
      hydrant(c, 128, 159);
      trashCan(c, 20, 160);
      boombox(c, BOOM_X.brooklyn, 160);
    });
  },
  live(L, c) {
    const key = L.tex(8, 5, (p) => { p.set(1, 2, 0x6a7080); p.set(2, 2, 0x6a7080); p.set(3, 2, 0x555a68); p.set(2, 1, 0x7a8090); p.set(1, 1, 0x7a8090); p.set(4, 3, 0x555a68); p.set(0, 1, 0x555a68); });
    for (let i = 0; i < 3; i++) {
      const im = L.img(key, 24 + i * 11, 74, -985);
      L.tick((t) => { im.setY((74 + Math.round(Math.max(0, Math.sin(t * 0.7 + i * 3)) * -2 * (i === 1 ? 1 : 0))) * 3); });
    }
    L.blink(160, 36, 0xff3a3a, 1.6, -985);
    L.blink(300, 36, 0xff3a3a, 1.6, -985, 0.8);
    void c;
  },
};

/* ------------------------------------------------------------------ QUEENS */

export const queens: CourtArt = {
  seed: 22,
  crowdLook: 'queens',
  amb: { tint: [0.33, 0.38, 0.68], k: 0.26, lit: [1.15, 1.02, 0.8], steps: 5 },
  paint(c) {
    sky(c, [0x060820, 0x141a4a, 0x2e2a6a, 0x6a3a7a, 0xb85a6a, 0xe08a4a], 0, 148);
    stars(c, 55, 0, 60);
    moon(c, 70, 28, 7, 0xe8e2c8);
    skyline(c, 124, 0, GW, 30, 78, 0x181c3c, { win: 0xf6d078, wmin: 8, wmax: 16 });
    water(c, 126, 154, 0x1a2450, [0xf6d078, 0xff8a5a, 0xe8e0c0], 90);
    c.base.rect(0, 150, GW, 8, 0x30323a); c.base.hline(0, GW, 150, 0x5a5e68);
    for (let x = 4; x < GW; x += 9) c.base.vline(x, 150, 157, 0x1a1c22);

    truss(c, -4, GW + 4, 100, 64, 0x2a2e48, 11);
    for (const x of [96, 330]) { c.base.rect(x - 8, 100, 17, 52, 0x3a3a4a); c.base.rect(x - 9, 98, 19, 3, 0x4a4a5e); }
    for (let x = 6; x < GW; x += 14) c.glow.set(x, 99, 0xffe0a0);
    powerLine(c, 0, 60, GW, 60, 0, 0x0c0c12);
    antenna(c, 210, 64, 10);

    building(c, -3, 30, 70, 126, 0x80583f, { cols: 6, rows: 10, lit: 0.5 });
    building(c, 62, 56, 34, 100, 0x74503c, { cols: 3, rows: 8, lit: 0.45 });
    building(c, 346, 24, 86, 132, 0x7a5642, { cols: 8, rows: 10, lit: 0.45 });
    c.base.rect(344, 22, 4, 134, 0x3a2a24);

    tree(c, 236, 156, 56, 0x2a1c14, [0x1c3a2a, 0x24462e, 0x2e5436]);
    tree(c, 128, 156, 44, 0x2a1c14, [0x1a362a, 0x244a30, 0x2c5236]);
    chainFence(c, 0, 90, GW, 159, 0xa0a8b4, 0.38);
    lamp(c, 188, 158, 62, { dir: -1, col: 0xffc060 });
    lamp(c, 312, 158, 62, { dir: 1, col: 0xffc060, flicker: false });
    sign(c, 10, 40, 'QB', 0xff6a3a, { neon: true, scale: 2 });
    spots(c, [[20, 157, 'stand', 1], [38, 158, 'sit'], [214, 157, 'elder', 1], [254, 157, 'stand', -1], [272, 158, 'sit', -1], [298, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x3a3a52, edge: 0x4a4a5a, key: 0xb85a2a, lines: 0xf0ece0, seed: 7, crack: 18 }, { board: 0xe8ecf2 }, () => {
      bench(c, 44, 160, 24); bench(c, 252, 160, 24);
      trashCan(c, 112, 160); hydrant(c, 156, 159, 0xe0c030); boombox(c, BOOM_X.harlem, 160);
      boombox(c, BOOM_X.queens, 160);
    });
  },
  live(L) {
    const plane = L.tex(9, 3, (p) => { p.rect(0, 1, 8, 1, 0x30303a); p.set(3, 0, 0x30303a); });
    L.mover(plane, 9, 18, 9, -1090, 380);
    L.blink(40, 17, 0xff3a3a, 1.2, -985);
  },
};

/* ------------------------------------------------------------------ HARLEM */

export const harlem: CourtArt = {
  seed: 88,
  crowdLook: 'harlem',
  net: 0xf4f0e0,
  amb: { tint: [0.74, 0.66, 0.78], k: 0.55, lit: [1.1, 1.02, 0.86], steps: 5 },
  paint(c) {
    sky(c, [0x2a2a5a, 0x5a3a78, 0xa24a7a, 0xe0705a, 0xf8a050, 0xfcd080], 0, 150);
    stars(c, 14, 0, 30);
    skyline(c, 130, 0, GW, 30, 90, 0x3a2e58, { win: 0xf8d880, wmin: 9, wmax: 18, roof: 0.6 });
    c.base.rect(300, 28, 7, 104, 0x3a2e58); c.base.rect(301, 14, 5, 15, 0x3a2e58); c.base.vline(303, 2, 14, 0x3a2e58); c.base.rect(298, 60, 11, 70, 0x40345e);
    skyline(c, 150, 0, GW, 14, 40, 0x46365e, { win: 0xf0c070, wmin: 10, wmax: 22 });

    building(c, -3, 40, 98, 118, 0x9a5240, { cols: 9, rows: 9, lit: 0.34 });
    fireEscape(c, 74, 52, 16, 5, 22);
    building(c, 332, 34, 100, 124, 0x8a4a3c, { cols: 9, rows: 10, lit: 0.3 });
    c.base.rect(94, 60, 6, 98, 0x5a2a28);
    c.base.poly([212, 20, 207, 66, 217, 66], 0x4a3a4a); c.base.rect(207, 66, 10, 60, 0x56404a);
    c.base.rect(209, 80, 6, 12, 0x20181e); c.glow.rect(210, 82, 4, 8, 0xf8d880);
    c.base.rect(190, 96, 54, 62, 0x6a4a44);
    c.base.rect(190, 94, 54, 3, 0x3a2a30);
    windows(c, 196, 104, 5, 3, { lit: 0.3, frame: 0x2a1a20 });
    c.base.rect(208, 136, 14, 22, 0x2a1a20);

    chainFence(c, 0, 100, GW, 159, 0xb0b4c0, 0.4);
    // bleachers
    for (const [x0, flip] of [[104, 0], [250, 1]] as const) {
      for (let r = 0; r < 4; r++) {
        const y = 140 + r * 4, w = 76 - r * 6, x = flip ? x0 + 0 : x0 + r * 6;
        c.base.rect(x, y, w, 3, r % 2 ? 0x6a7280 : 0x7a8290); c.base.hline(x, x + w - 1, y, 0xa8b0be);
        c.base.rect(x, y + 3, w, 1, 0x20242c);
      }
    }
    lamp(c, 98, 158, 60, { dir: 1, col: 0xffd080, k: 0.7 });
    lamp(c, 332, 158, 60, { dir: -1, col: 0xffd080, k: 0.7 });
    c.base.rect(124, 80, 46, 14, 0x20284a); c.base.hline(124, 169, 80, 0x4a5a9a); sign(c, 130, 84, 'HARLEM', 0xf8e8a0, { scale: 1 });
    spots(c, [[116, 140, 'sit'], [132, 140, 'cheer'], [150, 140, 'sit'], [170, 140, 'stand'], [264, 140, 'sit', -1], [282, 140, 'cheer', -1], [300, 140, 'sit', -1], [320, 140, 'stand', -1], [190, 157, 'stand'], [244, 157, 'elder', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0xc07a38, edge: 0x6a5a4a, key: 0x2c5ca0, lines: 0xf8f4e8, seed: 9, crack: 10, speckle: 0.8 }, { board: 0xf0f2f6 }, () => {
      hydrant(c, 96, 159);
      trashCan(c, 360, 160);
    });
  },
  live(L) {
  },
};

void GH; void cart; void tires; void stoop; void pole; void slab; void halo; void mix; void shade; void Scene2D; void FY;
