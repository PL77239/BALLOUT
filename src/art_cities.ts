import { GW, Pix, mix, shade } from './pixel';
import { FY, Scene2D, antenna, awning, bench, boombox, brick, chainFence, dumpster, graffiti, halo, hydrant, lamp, powerLine, sign, skyline, sky, slab, stars, tree, trashCan, cart } from './courtkit';
import { BOOM_X, CourtArt, building, finish, spots, truss } from './court_common';

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
  },
};

/* ------------------------------------------------------------------ WARSAW (Centrum: Palace of Culture, Varso and modern skyline) */

export const warsaw: CourtArt = {
  seed: 91,
  crowdLook: 'philly',
  net: 0xf0f0f0,
  amb: { tint: [0.52, 0.5, 0.58], k: 0.38, lit: [1.08, 1.02, 0.96], steps: 5 },
  paint(c) {
    sky(c, [0x6a7080, 0x8a90a0, 0xa8a8b8, 0xc8b8c0, 0xe8d0d8, 0xf0e8f0], 0, 150);
    // Stylized central Warsaw panorama: open sightlines above a low street edge.
    // Distant buildings go first so they cannot cover the landmark silhouettes.
    skyline(c, 140, 0, GW, 12, 36, 0x8992a2, { win: 0xc7cbd0, wmin: 8, wmax: 17 });
    // Varso: narrow glass shaft, stepped crown and a long antenna.
    c.base.rect(66, 39, 24, 101, 0x677c91);
    c.base.rect(70, 30, 16, 10, 0x778b9d); c.base.rect(75, 24, 7, 7, 0x879aaa);
    c.base.vline(79, 7, 25, 0xb4c1c8);
    c.base.rect(67, 41, 4, 96, 0x9bb0ba);
    for(let y=45;y<138;y+=5)c.base.hline(72,89,y,0x92a6b4);
    for(let x=74;x<90;x+=5)c.base.vline(x,40,139,0x536a82);
    // Warsaw Spire: curved silhouette with a pair of slender roof masts.
    c.base.poly([116,139,117,91,120,67,126,50,135,47,141,62,143,91,140,139],0x70889a);
    c.base.poly([120,138,121,89,125,62,131,52,132,138],0x9aafba);
    c.base.vline(127,34,53,0x738393);c.base.vline(136,35,55,0x738393);
    for(let y=70;y<138;y+=5)c.base.hline(123,139,y,0x5d758a);
    // Palace of Culture: broad stepped wings, clock tower, crown and needle.
    const px=222, stone=0xa69b8e, shadow=0x776f70, light=0xc5b7a1;
    c.base.rect(px-48,111,96,30,shadow);
    c.base.rect(px-38,103,76,37,stone);
    c.base.rect(px-29,94,58,47,stone);
    c.base.rect(px-20,80,40,61,stone);
    c.base.rect(px-13,59,26,82,stone);
    c.base.rect(px-10,44,20,17,light);
    c.base.rect(px-12,42,24,3,shadow);
    c.base.rect(px-8,36,16,7,stone);
    c.base.poly([px-7,36,px-4,28,px+4,28,px+7,36],light);
    c.base.rect(px-3,23,6,7,shadow);c.base.vline(px,7,24,0xd5c7ae);
    c.base.rect(px+7,59,6,81,shadow);c.base.rect(px-19,81,4,58,light);
    for(const [x0,x1,y] of [[px-48,px+47,111],[px-38,px+37,103],[px-29,px+28,94],[px-20,px+19,80],[px-13,px+12,59]])c.base.hline(x0,x1,y,light);
    for(let x=px-34;x<=px+34;x+=7)for(let y=116;y<137;y+=7)c.base.rect(x,y,2,4,0x5c626b);
    for(let x=px-9;x<=px+8;x+=5)for(let y=67;y<136;y+=7)c.base.rect(x,y,2,4,0x625e60);
    // Clock face remains a few crisp pixels at native game resolution.
    c.base.circle(px,51,5,0xeee1c7);c.base.circle(px,51,3,0x625f63);
    c.base.vline(px,48,51,0xf4e7c9);c.base.hline(px,px+2,51,0xf4e7c9);
    // Zlota 44: asymmetric sail rather than another rectangular tower.
    c.base.poly([296,140,296,65,304,49,315,36,326,140],0x7d92a4);
    c.base.poly([300,139,300,69,305,55,313,44,311,139],0xb3c1c6);
    for(let y=69;y<138;y+=5)c.base.hline(301,315+Math.floor((y-69)/12),y,0x617b91);
    c.base.rect(345,77,24,64,0x708496);c.base.rect(350,67,14,11,0x8498a5);
    for(let y=83;y<139;y+=6)c.base.hline(348,367,y,0xa5b5be);
    // Low foreground frontage leaves the skyline visible from the court.
    c.base.rect(0,140,GW,19,0x686770);c.base.hline(0,GW,140,0xa2a0a4);
    c.base.rect(0,133,53,26,0x817c7d);c.base.rect(371,135,56,24,0x80797b);
    sign(c,5,140,'CENTRUM',0xf0ddae,{scale:1});
    graffiti(c,277,143,'WAWA',0xf4f0e8,{scale:1,outline:0x2a2030,shadow:0xd22b3a});
    c.base.rect(183,149,20,8,0xd22b3a);c.base.rect(183,149,20,4,0xeeeeeb);
    // Trolley wires are kept low rather than cutting across the clock/spires.
    powerLine(c,0,128,GW,130,2);
    chainFence(c,0,140,GW,159,0x9aa0a8,0.28);
    lamp(c,27,158,43,{dir:1,col:0xffe8c0,k:0.45});
    lamp(c,402,158,43,{dir:-1,col:0xffe8c0,k:0.45});
    spots(c, [[24, 157, 'stand', 1], [78, 157, 'kid'], [132, 157, 'stand'], [248, 157, 'elder', -1], [300, 157, 'stand', -1], [360, 157, 'cheer', -1]]);
  },
  paintFloor(c) {
    finish(c, { base: 0x4a5058, edge: 0x5a6068, key: 0xd22b3a, lines: 0xf0f0f0, seed: 11, crack: 14, sidewalk: 0x6a7078, speckle: 0.9 }, { board: 0xf2f2f6 }, () => {
      bench(c, 124, 160, 24); cart(c, 36, 160); trashCan(c, 286, 160);
      boombox(c, BOOM_X.warsaw, 160);

    });
  },
  live(L) {
    const tram = L.tex(120, 22, (p) => {
      p.rect(0, 6, 118, 14, 0xd22b3a); p.hline(0, 117, 6, 0xffe8e0);
      p.rect(0, 14, 118, 4, 0x2a2a34);
      for (let k = 4; k < 114; k += 14) { p.rect(k, 8, 10, 6, 0x88b0d8); p.hline(k, k + 9, 8, 0xe8ecf4); }
      p.rect(2, 18, 8, 3, 0x20202a); p.rect(108, 18, 8, 3, 0x20202a);
    });
    L.mover(tram, 120, 134, -14, -1020, 520, { flip: true });
  },
};

void Pix; void mix; void antenna; void awning; void dumpster; void halo; void brick; void FY; void Scene2D;
