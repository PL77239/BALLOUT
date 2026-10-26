import Phaser from 'phaser';
import { GW, mix, shade } from './pixel';
import { FY, awning, brick, car, chainFence, graffiti, halo, hydrant, lamp, palm, powerLine, sign, skyline, sky, slab, stars, tree, trashCan, windows, bench, boombox, dumpster, cart } from './courtkit';
import { BOOM_X, CourtArt, carSprite, finish, hangLamp, shopWindow, spots, sneakersWire } from './court_common';

/* ------------------------------------------------------------------ ATLANTA */

export const atl: CourtArt = {
  seed: 55,
  crowdLook: 'atl',
  amb: { tint: [0.4, 0.38, 0.6], k: 0.24, lit: [1.2, 1.0, 0.7], steps: 5 },
  paint(c) {
    sky(c, [0x0a0a20, 0x1c1840, 0x3a2650, 0x6a3250, 0x9a4a48, 0xc87040], 0, 150);
    stars(c, 40, 0, 40);
    skyline(c, 140, 0, GW, 34, 84, 0x1a1a3c, { win: 0xf6d478, wmin: 8, wmax: 16 });
    c.base.rect(250, 38, 12, 102, 0x1a1a3c); c.base.poly([248, 38, 256, 14, 264, 38], 0x1a1a3c); c.glow.rect(254, 44, 4, 3, 0xf8e0a0);
    skyline(c, 154, 0, GW, 8, 24, 0x242044, { win: 0xe8b868, wmin: 10, wmax: 22 });
    // kudzu-covered slope
    for (let x = 0; x < GW; x += 3) { const h = 3 + Math.floor(c.rnd(0, 6)); c.base.rect(x, 150 - h, 3, h + 10, [0x1c3a28, 0x244632, 0x183222][x % 3]); }

    // overpass
    slab(c, -4, 26, GW + 8, 24, 0x6a6a74, { seam: 0, v: 0.1 });
    c.base.rect(-4, 50, GW + 8, 5, 0x3a3a46); c.base.hline(-4, GW + 4, 50, 0x8a8a96);
    c.base.rect(-4, 20, GW + 8, 6, 0x4a4a56); c.base.hline(-4, GW + 4, 20, 0x9a9aa6);
    for (let x = 2; x < GW; x += 6) c.base.vline(x, 21, 25, 0x24242c);
    for (const px of [48, 176, 304, 420]) {
      c.base.rect(px - 9, 55, 18, 100, 0x5a5a66); c.base.vline(px - 9, 55, 154, 0x8a8a98); c.base.vline(px + 8, 55, 154, 0x383842);
      for (let i = 0; i < 90; i++) c.base.set(px - 8 + Math.floor(c.r() * 16), 56 + Math.floor(c.r() * 96), c.r() < 0.5 ? 0x4a4a54 : 0x6a6a76);
      c.base.rect(px - 11, 52, 22, 5, 0x484852);
    }
    slab(c, 0, 100, GW, 58, 0x4a4a56, { v: 0.1 }); c.base.hline(0, GW, 100, 0x7a7a88);
    graffiti(c, 62, 104, 'ATL', 0xf6d030, { scale: 4, outline: 0x1a1020, shadow: 0xd02a6a, drip: true });
    graffiti(c, 192, 112, 'EAST SIDE', 0x4ad8c8, { scale: 2, outline: 0x1a1020, shadow: 0x2a3a8a });
    graffiti(c, 318, 104, '404', 0xf4f0e8, { scale: 3, outline: 0x1a1020, shadow: 0xc02a3a });
    hangLamp(c, 118, 55, 8, 0xffa040, { k: 1.1 });
    hangLamp(c, 246, 55, 8, 0xffa040, { k: 1.1, flicker: true });
    hangLamp(c, 366, 55, 8, 0xffa040, { k: 0.9, reach: 50 });
    chainFence(c, 0, 106, GW, 159, 0xa0a8b4, 0.36);
    sneakersWire(c, 60, 176, 80, 6, 1);
    powerLine(c, 0, 60, 48, 70, 3);
    spots(c, [[26, 157, 'stand', 1], [78, 157, 'sit'], [150, 157, 'stand'], [214, 157, 'elder', -1], [280, 157, 'stand', -1], [330, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x404048, edge: 0x50505a, key: 0x8a2a2a, lines: 0xe8e4d4, seed: 12, crack: 24, speckle: 1.3, patch: 1.3 }, { board: 0xe4e8ee }, () => {
      dumpster(c, 100, 160, 0x4a5a6a); tireStack(c);
      car(c, 238, 160, 0x7a2030, { kind: 'low' });
      trashCan(c, 196, 160); boombox(c, BOOM_X.atl, 160);
    });
  },
  live(L) {
    // Traffic removed to keep the court backdrop calm.
  },
};

function tireStack(c: import('./courtkit').Scene2D) {
  for (let i = 0; i < 3; i++) { c.base.ellipse(66, 157 - i * 4, 6, 2.6, 0x16161a); c.base.ellipse(66, 156 - i * 4, 3.2, 1.2, 0x2a2a30); }
}

/* ------------------------------------------------------------------ LOS ANGELES */

export const la: CourtArt = {
  seed: 66,
  crowdLook: 'la',
  net: 0xf8f4ea,
  amb: { tint: [0.44, 0.4, 0.62], k: 0.3, lit: [1.16, 1.02, 0.78], steps: 5 },
  paint(c) {
    sky(c, [0x0a0a28, 0x241a52, 0x5a2a70, 0xa04068, 0xe0705a, 0xf4a050], 0, 150);
    stars(c, 26, 0, 40);
    // hills with lights
    for (let x = 0; x < GW; x++) { const h = 14 + Math.sin(x * 0.02) * 7 + Math.sin(x * 0.07) * 3; c.base.rect(x, 132 - h, 1, h + 20, 0x1a1a3a); if (x % 6 === 0 && c.r() < 0.6) c.glow.set(x, 132 - h + 4 + Math.floor(c.r() * 10), 0xf8d070); }
    skyline(c, 126, 120, 260, 30, 70, 0x1e1e42, { win: 0xf8d880, wmin: 8, wmax: 14 });
    c.base.rect(180, 36, 14, 90, 0x1e1e42); c.base.rect(178, 34, 18, 3, 0x2e2e5a); c.glow.rect(184, 30, 6, 3, 0xff4a4a);

    // stucco shops
    const shop = (x: number, w: number, y: number, col: number, roof: number) => {
      c.base.rect(x, y, w, 158 - y, col);
      for (let i = 0; i < w * (158 - y) * 0.12; i++) c.base.set(x + Math.floor(c.r() * w), y + Math.floor(c.r() * (158 - y)), c.r() < 0.5 ? shade(col, 0.88) : shade(col, 1.1));
      c.base.rect(x - 1, y - 2, w + 2, 3, shade(col, 0.7)); c.base.hline(x - 1, x + w, y - 2, shade(col, 1.25));
      c.base.vline(x, y, 157, shade(col, 1.15)); c.base.vline(x + w - 1, y, 157, shade(col, 0.7));
      if (roof) c.base.rect(x + 4, y - 6, w - 8, 4, shade(col, 0.8));
    };
    shop(-2, 96, 80, 0xd89a8a, 1); shop(96, 76, 96, 0xe0c890, 0); shop(172, 100, 88, 0x8ac0b4, 1); shop(272, 66, 100, 0xe8b070, 0); shop(338, 94, 72, 0xc08aa8, 1);
    // mural
    c.base.rect(8, 92, 78, 46, 0x2a2a5a);
    c.base.circle(30, 114, 14, 0xf0b030); c.base.circle(30, 114, 9, 0xe05a2a);
    c.base.poly([48, 138, 62, 100, 80, 138], 0x3a8a6a); c.base.poly([56, 138, 70, 108, 86, 138], 0x2a6a8a);
    graffiti(c, 12, 100, 'WEST', 0xf8f0e0, { scale: 1, outline: 0x1a1020 });
    // windows w bars
    windows(c, 342, 82, 8, 2, { lit: 0.5, frame: 0x30203a });
    shopWindow(c, 104, 122, 58, 32, 0xf0c070, { shelves: 3 });
    awning(c, 100, 112, 66, 0xd0302a, 0xf0e8d0);
    sign(c, 106, 100, 'LIQUOR', 0xff3a6a, { neon: true, scale: 2 });
    shopWindow(c, 182, 116, 36, 26, 0xd8f0c0, { shelves: 2 });
    sign(c, 182, 94, 'TACOS', 0x4aff9a, { neon: true, scale: 2 });
    c.base.rect(236, 120, 24, 36, 0x1c1418); c.glow.rect(238, 122, 20, 20, 0x5a4a30);
    sign(c, 276, 110, 'CARNICERIA', 0xffc84a, { neon: true });
    shopWindow(c, 286, 128, 36, 26, 0xf0c070, { shelves: 2 });

    palm(c, 98, 157, 92, -6, 0x4a3a30, 0x1c4a30); palm(c, 270, 157, 108, 8, 0x4a3a30, 0x1c4a30); palm(c, 404, 157, 100, -10, 0x4a3a30, 0x1a4430);
    powerLine(c, 0, 66, GW, 72, 6); powerLine(c, 0, 72, GW, 78, 5);
    chainFence(c, 0, 108, GW, 159, 0xa8aeb8, 0.34);
    lamp(c, 94, 158, 58, { dir: 1, col: 0xffd070, k: 1.0 });
    lamp(c, 262, 158, 58, { dir: -1, col: 0xffd070, flicker: true });
    spots(c, [[30, 157, 'stand', 1], [64, 157, 'stand'], [180, 157, 'kid'], [226, 157, 'stand', -1], [300, 157, 'elder', -1], [330, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x6a6a72, edge: 0x8a8a92, key: 0x2a6ac0, lines: 0xf8f4e8, seed: 14, crack: 12, sidewalk: 0x8a8a92, speckle: 0.9 }, { board: 0xf0f2f6 }, () => {
      car(c, 24, 160, 0x4a8ac0, { kind: 'low' });
      hydrant(c, 150, 159); trashCan(c, 330, 160); cart(c, 300, 160); boombox(c, BOOM_X.la, 160);
      void bench; void dumpster; void brick; void tree; void slab; void mix; void halo;
    });
  },
  live(L) {
    // helicopter searchlight sweep
    const g = L.gfx(-986, Phaser.BlendModes.ADD);
    const heli = L.tex(14, 6, (p) => { p.rect(2, 2, 7, 3, 0x20202a); p.hline(0, 12, 0, 0x30303a); p.hline(9, 13, 3, 0x20202a); p.set(10, 2, 0x20202a); });
    const hi = L.img(heli, 0, 20, -985);
    L.tick((t) => {
      const hx = 220 + Math.sin(t * 0.12) * 170, hy = 24 + Math.sin(t * 0.31) * 4;
      hi.setPosition(Math.round(hx) * 3, Math.round(hy) * 3);
      g.clear();
      const tx = hx + 20 + Math.sin(t * 0.5) * 90 + Math.cos(t * 0.23) * 40;
      g.fillStyle(0xdde8ff, 0.12);
      g.fillTriangle((hx + 6) * 3, (hy + 5) * 3, (tx - 14) * 3, 150 * 3, (tx + 14) * 3, 150 * 3);
      g.fillStyle(0xdde8ff, 0.1);
      g.fillEllipse(tx * 3, 150 * 3, 30 * 3, 6 * 3);
      g.fillStyle(0xff3a3a, Math.sin(t * 6) > 0 ? 1 : 0);
      g.fillRect(Math.round(hx + 10) * 3, Math.round(hy) * 3, 3, 3);
    });
  },
};

void FY; void GW;
