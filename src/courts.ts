import Phaser from 'phaser';
import { H, T, W } from './tuning';
import { shade } from './puppet';

export type CourtId = 'brooklyn' | 'chicago' | 'harlem';
export const COURTS: { id: CourtId; name: string; sub: string }[] = [
  { id: 'brooklyn', name: 'THE CAGE', sub: 'BED-STUY, BROOKLYN  //  NIGHT' },
  { id: 'chicago', name: 'SOUTH SIDE', sub: 'CHICAGO  //  GOLDEN HOUR' },
  { id: 'harlem', name: 'THE PARK', sub: 'HARLEM, NEW YORK  //  DUSK' },
];

type G = Phaser.GameObjects.Graphics;

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mixc(a: number, b: number, t: number) {
  const f = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (f(16) << 16) | (f(8) << 8) | f(0);
}

function vgrad(g: G, x: number, y: number, w: number, h: number, stops: [number, number][]) {
  const steps = Math.ceil(h / 3);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1 || 1);
    let c = stops[stops.length - 1][1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        c = mixc(stops[s][1], stops[s + 1][1], (t - stops[s][0]) / (stops[s + 1][0] - stops[s][0]));
        break;
      }
    }
    g.fillStyle(c, 1);
    g.fillRect(x, y + (i * h) / steps, w, h / steps + 1);
  }
}

function brick(g: G, x: number, y: number, w: number, h: number, base: number, r: () => number, bw = 22, bh = 9) {
  g.fillStyle(shade(base, 0.55), 1);
  g.fillRect(x, y, w, h);
  let row = 0;
  for (let yy = y; yy < y + h; yy += bh, row++) {
    const off = row % 2 ? -bw / 2 : 0;
    for (let xx = x + off; xx < x + w; xx += bw) {
      const cx = Math.max(xx, x), cw = Math.min(xx + bw, x + w) - cx;
      if (cw <= 1) continue;
      g.fillStyle(shade(base, 0.82 + r() * 0.38), 1);
      g.fillRect(cx + 1, yy + 1, cw - 1.5, Math.min(bh, y + h - yy) - 1.5);
    }
  }
}

function windows(g: G, x: number, y: number, cols: number, rows: number, cw: number, ch: number, gx: number, gy: number, lit: number, litC: number, darkC: number, r: () => number, frame = 0x1a1210) {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const wx = x + i * (cw + gx), wy = y + j * (ch + gy);
      g.fillStyle(frame, 1); g.fillRect(wx - 3, wy - 3, cw + 6, ch + 6);
      const on = r() < lit;
      g.fillStyle(on ? mixc(litC, 0xfff0b0, r() * 0.5) : darkC, 1);
      g.fillRect(wx, wy, cw, ch);
      g.fillStyle(0x000000, 0.25); g.fillRect(wx, wy + ch / 2 - 1, cw, 2);
      if (!on && r() < 0.3) { g.fillStyle(0xffffff, 0.08); g.fillRect(wx + 2, wy + 2, cw / 2, ch / 2); }
    }
  }
}

function fireEscape(g: G, x: number, y: number, w: number, floors: number, fh: number) {
  g.lineStyle(2.5, 0x0b0b0e, 1);
  for (let f = 0; f < floors; f++) {
    const fy = y + f * fh;
    g.strokeRect(x, fy, w, 5);
    g.lineBetween(x, fy + 5, x, fy - 22); g.lineBetween(x + w, fy + 5, x + w, fy - 22); g.lineBetween(x, fy - 22, x + w, fy - 22);
    for (let k = 0; k <= 6; k++) g.lineBetween(x + (k * w) / 6, fy - 22, x + (k * w) / 6, fy + 5);
    if (f < floors - 1) {
      const dir = f % 2 ? -1 : 1;
      const sx = dir > 0 ? x + 4 : x + w - 4;
      g.lineBetween(sx, fy + 5, sx + dir * (w - 10), fy + fh);
      g.lineBetween(sx + dir * 5, fy + 5, sx + dir * (w - 5), fy + fh);
    }
  }
}

function chainFence(g: G, x0: number, y0: number, x1: number, y1: number, color: number, alpha: number, step = 11) {
  g.lineStyle(1.2, color, alpha);
  const h = y1 - y0;
  for (let i = -h; i < x1 - x0; i += step) {
    const ax = x0 + i, bx = x0 + i + h;
    g.lineBetween(Math.max(ax, x0), ax < x0 ? y0 + (x0 - ax) : y0, Math.min(bx, x1), bx > x1 ? y1 - (bx - x1) : y1);
    const cx = x0 + i + h, dx2 = x0 + i;
    g.lineBetween(Math.min(cx, x1), cx > x1 ? y0 + (cx - x1) : y0, Math.max(dx2, x0), dx2 < x0 ? y1 - (x0 - dx2) : y1);
  }
  g.lineStyle(5, 0x23262b, 1);
  g.lineBetween(x0, y0, x1, y0);
  g.lineStyle(3, 0x23262b, 1);
  g.lineBetween(x0, y1 - 4, x1, y1 - 4);
  for (let x = x0 + 40; x < x1; x += 190) {
    g.fillStyle(0x2c3036, 1); g.fillRect(x - 4, y0 - 6, 8, y1 - y0 + 6);
    g.fillStyle(0x4a5058, 1); g.fillRect(x - 4, y0 - 6, 3, y1 - y0 + 6);
  }
  g.lineStyle(1.5, 0x15171a, 1);
  for (let x = x0; x < x1; x += 9) {
    g.strokeEllipse(x + 4, y0 - 6, 9, 9);
  }
}

function lampPost(g: G, x: number, base: number, top: number, headC: number) {
  g.fillStyle(0x15161a, 1); g.fillRect(x - 4, top, 8, base - top);
  g.fillRect(x - 4, top, 38, 6);
  g.fillStyle(0x23262b, 1); g.fillRect(x + 22, top + 4, 26, 9);
  g.fillStyle(headC, 1); g.fillRect(x + 24, top + 11, 22, 4);
}

function skyline(g: G, base: number, x0: number, x1: number, minH: number, maxH: number, color: number, r: () => number, win?: number) {
  let x = x0;
  while (x < x1) {
    const w = 26 + r() * 46, h = minH + r() * (maxH - minH);
    g.fillStyle(color, 1); g.fillRect(x, base - h, w, h + 4);
    if (r() < 0.25) g.fillRect(x + w * 0.3, base - h - 14, w * 0.4, 14);
    if (win !== undefined) {
      for (let wy = base - h + 8; wy < base - 6; wy += 9) {
        for (let wx = x + 4; wx < x + w - 6; wx += 8) {
          if (r() < 0.28) { g.fillStyle(win, 0.55 + r() * 0.4); g.fillRect(wx, wy, 3, 4); }
        }
      }
    }
    x += w + r() * 5;
  }
}

function tree(g: G, x: number, base: number, s: number, trunk: number, leaves: number[], r: () => number) {
  g.fillStyle(trunk, 1);
  g.fillPoints([{ x: x - 10 * s, y: base }, { x: x - 6 * s, y: base - 130 * s }, { x: x + 6 * s, y: base - 130 * s }, { x: x + 12 * s, y: base }] as Phaser.Types.Math.Vector2Like[], true);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = r() * 90 * s;
    g.fillStyle(leaves[Math.floor(r() * leaves.length)], 1);
    g.fillCircle(x + Math.cos(a) * d * 1.3, base - 150 * s + Math.sin(a) * d * 0.8, (28 + r() * 30) * s);
  }
}

function crowd(g: G, x0: number, x1: number, y: number, r: () => number, cols: number[]) {
  for (let x = x0; x < x1; x += 11 + r() * 10) {
    const c = cols[Math.floor(r() * cols.length)];
    const s = 0.85 + r() * 0.3;
    g.fillStyle(c, 1);
    g.fillRoundedRect(x - 7 * s, y - 24 * s, 14 * s, 26 * s, 5);
    g.fillStyle(shade(0xc89870, 0.6 + r() * 0.8), 1);
    g.fillCircle(x, y - 31 * s, 6 * s);
    if (r() < 0.35) { g.fillStyle(shade(c, 0.5), 1); g.fillRect(x - 6.5 * s, y - 38 * s, 13 * s, 5 * s); }
  }
}

function waterTower(g: G, x: number, base: number, s: number) {
  g.lineStyle(3 * s, 0x15110e, 1);
  g.lineBetween(x - 22 * s, base, x - 18 * s, base - 46 * s); g.lineBetween(x + 22 * s, base, x + 18 * s, base - 46 * s);
  g.lineBetween(x - 20 * s, base - 20 * s, x + 20 * s, base - 36 * s); g.lineBetween(x + 20 * s, base - 20 * s, x - 20 * s, base - 36 * s);
  g.fillStyle(0x5a4030, 1); g.fillRect(x - 26 * s, base - 100 * s, 52 * s, 56 * s);
  g.fillStyle(0x6b4e3a, 1); g.fillRect(x - 26 * s, base - 100 * s, 16 * s, 56 * s);
  g.fillStyle(0x3a2a20, 1); g.fillPoints([{ x: x - 30 * s, y: base - 100 * s }, { x, y: base - 124 * s }, { x: x + 30 * s, y: base - 100 * s }] as Phaser.Types.Math.Vector2Like[], true);
  g.lineStyle(2.5 * s, 0x15110e, 1);
  for (const dy of [-90, -72, -54]) g.lineBetween(x - 26 * s, base + dy * s, x + 26 * s, base + dy * s);
}

interface Style { floor: number; floorEdge: number; key: number; lines: number; wear: number; seed: number }
const STYLES: Record<CourtId, Style> = {
  brooklyn: { floor: 0x2f4a3c, floorEdge: 0x233a2e, key: 0x8a3a30, lines: 0xe9e6da, wear: 0x1c2a22, seed: 11 },
  chicago: { floor: 0x676b75, floorEdge: 0x575b64, key: 0xa8282c, lines: 0xe6e2d6, wear: 0x4a4d55, seed: 23 },
  harlem: { floor: 0x2b5da8, floorEdge: 0x244e90, key: 0xe3b32c, lines: 0xf2efe6, wear: 0x1d3f78, seed: 37 },
};

function drawFloor(g: G, id: CourtId) {
  const s = STYLES[id], r = rng(s.seed);
  const fy = T.court.floorY, lh = T.court.laneHalf, hx = T.hoop.x;
  const top = fy - lh - 18, bot = fy + lh + 16;
  g.fillStyle(shade(s.floorEdge, 0.7), 1); g.fillRect(0, 462, W, H - 462);
  vgrad(g, 0, 462, W, 30, [[0, shade(s.floorEdge, 0.5)], [1, shade(s.floorEdge, 0.8)]]);
  vgrad(g, 30, top, W - 60, bot - top, [[0, shade(s.floor, 0.86)], [1, shade(s.floor, 1.05)]]);
  g.fillStyle(s.key, 1); g.fillRect(808, fy - 54, 1244 - 808, 108);
  g.fillStyle(s.key, 1); g.fillEllipse(808, fy, 40, 108);
  for (let i = 0; i < 90; i++) {
    g.fillStyle(r() < 0.6 ? s.wear : shade(s.floor, 1.08), 0.07 + r() * 0.09);
    g.fillRect(40 + r() * (W - 100), top + r() * (bot - top), 12 + r() * 60, 4 + r() * 14);
  }
  g.lineStyle(3, s.lines, 0.92);
  g.lineBetween(30, fy - lh, 1244, fy - lh); g.lineBetween(30, fy + lh, 1244, fy + lh);
  g.lineBetween(1244, fy - lh, 1244, fy + lh);
  g.lineBetween(808, fy - 54, 1244, fy - 54); g.lineBetween(808, fy + 54, 1244, fy + 54); g.lineBetween(808, fy - 54, 808, fy + 54);
  g.strokeEllipse(808, fy, 40, 108);
  g.lineBetween(676, fy - lh, 676, fy + lh);
  const arc: { x: number; y: number }[] = [];
  for (let dz = -lh; dz <= lh; dz += 3) arc.push({ x: hx - Math.sqrt(T.arcR ** 2 - (dz * T.zScale) ** 2), y: fy + dz });
  g.strokePoints(arc as Phaser.Types.Math.Vector2Like[], false);
  g.strokeEllipse(hx - 4, fy, 56, 100);
  for (let i = 0; i < 60; i++) {
    g.fillStyle(s.floor, 0.35 + r() * 0.4);
    g.fillRect(40 + r() * (W - 100), fy - lh + r() * 2 * lh - 2, 6 + r() * 14, 2.5);
  }
  g.lineStyle(1.4, 0x0b0d0c, 0.5);
  for (let i = 0; i < 16; i++) {
    let x = 60 + r() * (W - 140), y = top + r() * (bot - top);
    const pts = [{ x, y }];
    for (let k = 0; k < 6; k++) { x += (r() - 0.35) * 26; y += (r() - 0.5) * 12; pts.push({ x, y }); }
    g.strokePoints(pts as Phaser.Types.Math.Vector2Like[], false);
  }
  vgrad(g, 0, 640, W, H - 640, [[0, 0x000000], [1, 0x000000]]);
  g.fillStyle(0x000000, 0.0);
  const curb = id === 'harlem' ? 0x6c6a6e : 0x56565b;
  g.fillStyle(curb, 1); g.fillRect(0, 650, W, 10);
  g.fillStyle(shade(curb, 0.6), 1); g.fillRect(0, 660, W, H - 660);
  for (let i = 0; i < 40; i++) { g.fillStyle(shade(curb, 0.5 + r() * 0.3), 0.7); g.fillRect(r() * W, 662 + r() * 56, 10 + r() * 30, 2); }
}

function brooklyn(scene: Phaser.Scene, g: G, texts: Phaser.GameObjects.Text[]) {
  const r = rng(101);
  vgrad(g, 0, 0, W, 470, [[0, 0x080b1f], [0.55, 0x2a2147], [0.85, 0x7a3b4a], [1, 0xd0743c]]);
  for (let i = 0; i < 60; i++) { g.fillStyle(0xffffff, 0.2 + r() * 0.5); g.fillRect(r() * W, r() * 220, 1.5, 1.5); }
  g.fillStyle(0xe8dcc0, 0.9); g.fillCircle(1010, 90, 20); g.fillStyle(0x080b1f, 0.35); g.fillCircle(1003, 86, 5);
  skyline(g, 420, 0, W, 30, 130, 0x1b1834, r, 0xffd27a);
  g.fillStyle(0x151227, 1);
  for (const [tx, th] of [[185, 220], [715, 150]] as [number, number][]) {
    g.fillRect(tx - 34, 420 - th, 68, th);
    g.fillStyle(0x2a2347, 1);
    g.fillEllipse(tx - 14, 420 - th * 0.55, 20, 70); g.fillEllipse(tx + 14, 420 - th * 0.55, 20, 70);
    g.fillRect(tx - 24, 420 - th * 0.55, 20, th * 0.55); g.fillRect(tx + 4, 420 - th * 0.55, 20, th * 0.55);
    g.fillStyle(0x151227, 1); g.fillRect(tx - 34, 420 - th - 6, 68, 8);
  }
  g.fillStyle(0x151227, 1); g.fillRect(0, 350, W, 5);
  g.lineStyle(2, 0x8d86b0, 0.8);
  const cab = (x0: number, y0: number, x1: number, y1: number, sag: number) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag }); }
    g.strokePoints(pts as Phaser.Types.Math.Vector2Like[], false);
    for (let i = 1; i < 24; i += 1) { const p = pts[i]; g.lineStyle(1, 0x8d86b0, 0.45); g.lineBetween(p.x, p.y, p.x, 352); }
    g.lineStyle(2, 0x8d86b0, 0.8);
  };
  cab(185, 206, 715, 276, 70); cab(715, 276, 1280, 340, 10); cab(-10, 330, 185, 206, 0);
  for (let x = 0; x < W; x += 24) { g.fillStyle(0xffe6a0, 0.8); g.fillRect(x, 347, 3, 3); }
  brick(g, -10, 70, 310, 408, 0x7a3b30, r);
  windows(g, 14, 96, 5, 11, 26, 20, 20, 14, 0.4, 0xf4c46a, 0x241a1c, r);
  fireEscape(g, 268, 110, 44, 10, 36);
  brick(g, 300, 250, 360, 228, 0x6a3a34, r, 20, 8);
  windows(g, 322, 270, 5, 3, 30, 24, 22, 20, 0.5, 0xf2b860, 0x241a1c, r);
  g.fillStyle(0x15161a, 1); g.fillRect(300, 420, 360, 58);
  vgrad(g, 304, 358, 352, 68, [[0, 0x1f6f8f], [0.5, 0xd6407a], [1, 0xf2a22a]]);
  g.fillStyle(0x15161a, 0.35); g.fillRect(304, 358, 352, 68);
  g.fillStyle(0x4a4a50, 1); g.fillRect(660, 330, 320, 148);
  g.fillStyle(0x2e2e34, 1); g.fillRect(660, 330, 320, 8);
  g.fillStyle(0x3c3c42, 1); for (let x = 676; x < 960; x += 24) g.fillRect(x, 400, 18, 78);
  vgrad(g, 664, 342, 312, 54, [[0, 0xf2c230], [1, 0xe8602a]]);
  brick(g, 980, 40, 320, 438, 0x7f4033, r);
  windows(g, 1004, 70, 5, 10, 26, 20, 22, 18, 0.35, 0xf4c46a, 0x241a1c, r);
  fireEscape(g, 1010, 100, 44, 9, 40);
  waterTower(g, 1160, 40, 1.1);
  chainFence(g, 0, 218, W, 478, 0xb8bcc4, 0.2);
  lampPost(g, 430, 478, 150, 0xffb050); lampPost(g, 960, 478, 150, 0xffb050);
  texts.push(
    scene.make.text({ x: 480, y: 392, text: 'BED-STUY', style: { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '50px', color: '#ffe45e', stroke: '#14121c', strokeThickness: 8 } }, false).setOrigin(0.5).setAngle(-2),
    scene.make.text({ x: 820, y: 372, text: 'BK', style: { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '66px', color: '#ff4fa0', stroke: '#14121c', strokeThickness: 9 } }, false).setOrigin(0.5).setAngle(3),
    scene.make.text({ x: 920, y: 440, text: 'RIP SLIM', style: { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '26px', color: '#ffffff', stroke: '#14121c', strokeThickness: 5 } }, false).setOrigin(0.5).setAngle(-3),
  );
}

function chicago(scene: Phaser.Scene, g: G, texts: Phaser.GameObjects.Text[]) {
  const r = rng(202);
  vgrad(g, 0, 0, W, 470, [[0, 0x3c4d88], [0.4, 0xb9707e], [0.72, 0xf09a62], [1, 0xfbd596]]);
  g.fillStyle(0xfff0c8, 0.9); g.fillCircle(900, 335, 38);
  for (let i = 5; i > 0; i--) { g.fillStyle(0xffd890, 0.06); g.fillCircle(900, 335, 38 + i * 26); }
  skyline(g, 410, 0, W, 20, 100, 0x8a7090, r);
  g.fillStyle(0x6f5a80, 1);
  const wt = 560;
  g.fillRect(wt - 24, 120, 48, 290); g.fillRect(wt - 24, 120, 22, 40);
  g.fillRect(wt - 36, 250, 72, 160); g.fillRect(wt + 6, 120, 18, 60); g.fillRect(wt - 14, 100, 10, 20); g.fillRect(wt + 6, 96, 8, 24);
  g.fillRect(wt - 12, 60, 3, 40); g.fillRect(wt + 8, 58, 3, 40);
  g.fillPoints([{ x: 700, y: 410 }, { x: 716, y: 130 }, { x: 744, y: 130 }, { x: 760, y: 410 }] as Phaser.Types.Math.Vector2Like[], true);
  g.fillRect(722, 100, 3, 30); g.fillRect(734, 100, 3, 30);
  g.lineStyle(1.5, 0x8a7090, 0.7);
  for (let y = 410; y > 140; y -= 54) { g.lineBetween(704, y, 752, y - 54); g.lineBetween(752, y, 704, y - 54); }
  g.fillStyle(0x3b3844, 1); g.fillRect(0, 318, W, 12);
  g.fillStyle(0x2a2832, 1); g.fillRect(0, 330, W, 6);
  g.lineStyle(2.5, 0x2a2832, 1);
  for (let x = 0; x < W + 100; x += 90) { g.lineBetween(x, 336, x + 45, 372); g.lineBetween(x + 45, 372, x + 90, 336); g.lineBetween(x, 336, x + 90, 336); }
  for (let x = 40; x < W; x += 250) { g.fillStyle(0x2a2832, 1); g.fillRect(x - 7, 372, 14, 106); g.fillRect(x - 16, 372, 32, 8); }
  g.lineStyle(3, 0x6a6a74, 1); g.lineBetween(0, 316, W, 316);
  brick(g, -10, 210, 330, 268, 0xa4553a, r, 24, 9);
  windows(g, 18, 236, 4, 3, 36, 28, 22, 40, 0.18, 0xf5d28a, 0x38281f, r, 0xf0e6d2);
  g.fillStyle(0x4d4a46, 1); g.fillRect(250, 220, 90, 258);
  g.lineStyle(2.5, 0x1d1b19, 1);
  for (let f = 0; f < 3; f++) {
    const y = 236 + f * 74;
    g.strokeRect(250, y, 90, 6);
    for (let x = 250; x <= 340; x += 12) g.lineBetween(x, y, x, y - 28);
    g.lineBetween(250, y - 28, 340, y - 28);
    g.lineBetween(250, y + 6, 262, y + 74); g.lineBetween(262, y + 6, 274, y + 74);
  }
  brick(g, 960, 230, 340, 248, 0x9b4c38, r, 24, 9);
  windows(g, 990, 252, 4, 3, 34, 28, 24, 38, 0.2, 0xf5d28a, 0x38281f, r, 0xf0e6d2);
  g.fillStyle(0x5a554f, 1); g.fillRect(960, 236, 78, 242);
  g.lineStyle(2.5, 0x1d1b19, 1);
  for (let f = 0; f < 3; f++) {
    const y = 250 + f * 72;
    g.strokeRect(960, y, 78, 6);
    for (let x = 960; x <= 1038; x += 12) g.lineBetween(x, y, x, y - 26);
    g.lineBetween(960, y - 26, 1038, y - 26);
  }
  tree(g, 1130, 478, 1.15, 0x3a2c22, [0x6a7a3a, 0x8a8a3c, 0xb0842f, 0x7b6a2f], r);
  tree(g, 90, 478, 0.8, 0x3a2c22, [0x6a7a3a, 0x8a8a3c, 0xb0842f], r);
  g.fillStyle(0x303036, 1); g.fillRect(350, 372, 520, 106);
  g.fillStyle(0xb81f26, 1); g.fillRect(350, 372, 520, 36);
  g.fillStyle(0x0e0e10, 1); g.fillRect(350, 408, 520, 10);
  g.fillStyle(0xf3f0e6, 0.92); for (let x = 360; x < 860; x += 40) g.fillRect(x, 440, 24, 5);
  chainFence(g, 0, 262, W, 478, 0xd8d0c4, 0.22);
  texts.push(
    scene.make.text({ x: 610, y: 391, text: 'SOUTH SIDE', style: { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '44px', color: '#ffffff', stroke: '#0e0e10', strokeThickness: 7 } }, false).setOrigin(0.5).setAngle(-1.5),
    scene.make.text({ x: 612, y: 452, text: 'CHI-TOWN  //  63RD', style: { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '24px', color: '#f2c230', stroke: '#0e0e10', strokeThickness: 5 } }, false).setOrigin(0.5),
  );
}

function harlem(scene: Phaser.Scene, g: G, texts: Phaser.GameObjects.Text[]) {
  const r = rng(303);
  vgrad(g, 0, 0, W, 470, [[0, 0x231a4a], [0.38, 0x7a3a78], [0.7, 0xe87858], [1, 0xffc27a]]);
  for (let i = 0; i < 30; i++) { g.fillStyle(0xffffff, 0.15 + r() * 0.35); g.fillRect(r() * W, r() * 130, 1.5, 1.5); }
  skyline(g, 420, 0, W, 40, 150, 0x3a2650, r, 0xffd27a);
  g.fillStyle(0x2c1d40, 1);
  g.fillRect(676, 120, 54, 300); g.fillRect(684, 90, 38, 34); g.fillRect(692, 70, 22, 22); g.fillRect(699, 30, 8, 42); g.fillRect(702, 6, 2, 28);
  g.fillStyle(0xffd27a, 0.7); g.fillRect(692, 74, 22, 3);
  brick(g, -10, 90, 280, 388, 0x80402e, r);
  windows(g, 14, 116, 5, 10, 24, 22, 18, 16, 0.32, 0xf4c46a, 0x241a1c, r);
  fireEscape(g, 218, 130, 40, 9, 38);
  waterTower(g, 120, 90, 1.2);
  brick(g, 270, 230, 330, 248, 0x6a3a34, r, 20, 8);
  windows(g, 292, 250, 5, 3, 28, 24, 20, 22, 0.45, 0xf2b860, 0x241a1c, r);
  fireEscape(g, 560, 262, 40, 5, 38);
  g.fillStyle(0x23202c, 1); g.fillRect(600, 330, 320, 148);
  vgrad(g, 604, 336, 312, 90, [[0, 0x2a2060], [1, 0x6a2a7a]]);
  brick(g, 920, 60, 380, 418, 0x7a3c30, r);
  windows(g, 944, 86, 6, 9, 26, 20, 22, 20, 0.38, 0xf4c46a, 0x241a1c, r);
  fireEscape(g, 1235, 110, 40, 8, 44);
  g.fillStyle(0xe8a820, 1); g.fillRoundedRect(430, 436, 90, 26, 6); g.fillRect(450, 420, 50, 18);
  g.fillStyle(0x222222, 1); g.fillRect(455, 424, 18, 10); g.fillRect(477, 424, 18, 10); g.fillCircle(450, 462, 8); g.fillCircle(498, 462, 8);
  for (let row = 0; row < 3; row++) {
    g.fillStyle(0x2a2b33 + row * 0x050505, 1);
    g.fillRect(150 + row * 30, 392 + row * 22, 960 - row * 60, 24);
    crowd(g, 170 + row * 30, 1090 - row * 30, 392 + row * 22 + 6, r, [0xd0383a, 0x2d6cdf, 0xf2c230, 0x1d1d22, 0xf4f4f0, 0x5a2d91, 0x2aa05a]);
  }
  chainFence(g, 0, 300, W, 478, 0xcdd2da, 0.2);
  lampPost(g, 640, 478, 170, 0xffc070);
  texts.push(
    scene.make.text({ x: 760, y: 380, text: 'HARLEM', style: { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '70px', color: '#f2c230', stroke: '#2a0e44', strokeThickness: 10 } }, false).setOrigin(0.5).setAngle(-1),
    scene.make.text({ x: 760, y: 440, text: 'NO LOOSE ENDS', style: { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '22px', color: '#ffffff', stroke: '#2a0e44', strokeThickness: 5 } }, false).setOrigin(0.5),
  );
}

export interface CourtScene {
  update(t: number, dt: number): void;
  destroy(): void;
}

export function glowTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('glow')) return;
  const c = scene.textures.createCanvas('glow', 256, 256)!;
  const ctx = c.getContext();
  const gr = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 256, 256);
  c.refresh();
  const v = scene.textures.createCanvas('vignette', 256, 144)!;
  const vc = v.getContext();
  const vg = vc.createRadialGradient(128, 72, 40, 128, 72, 150);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  vc.fillStyle = vg; vc.fillRect(0, 0, 256, 144);
  v.refresh();
}

export function buildCourt(scene: Phaser.Scene, id: CourtId): CourtScene {
  glowTexture(scene);
  const g = scene.make.graphics({ x: 0, y: 0 }, false) as G;
  const texts: Phaser.GameObjects.Text[] = [];
  if (id === 'brooklyn') brooklyn(scene, g, texts);
  else if (id === 'chicago') chicago(scene, g, texts);
  else harlem(scene, g, texts);
  drawFloor(g, id);
  const rt = scene.add.renderTexture(0, 0, W, H).setOrigin(0, 0).setDepth(-1000);
  rt.draw(g);
  for (const t of texts) rt.draw(t, t.x, t.y);
  g.destroy(); texts.forEach((t) => t.destroy());

  const extras: Phaser.GameObjects.GameObject[] = [rt];
  const add = (o: Phaser.GameObjects.GameObject) => { extras.push(o); return o; };
  const tickers: ((t: number, dt: number) => void)[] = [];
  const fy = T.court.floorY;

  const glow = (x: number, y: number, sx: number, sy: number, tint: number, a: number, flicker = 0) => {
    const im = scene.add.image(x, y, 'glow').setScale(sx, sy).setTint(tint).setAlpha(a).setBlendMode(Phaser.BlendModes.ADD).setDepth(-900);
    add(im);
    if (flicker) tickers.push((t) => im.setAlpha(a * (1 - flicker * (0.5 + 0.5 * Math.sin(t * 9 + x)) * (Math.sin(t * 2.3 + x) > 0.8 ? 1 : 0.15))));
    return im;
  };

  if (id === 'brooklyn') {
    glow(470, 168, 1.3, 1.3, 0xffa040, 0.9, 0.5); glow(1000, 168, 1.3, 1.3, 0xffa040, 0.9);
    glow(520, fy + 10, 5.5, 1.8, 0xffa850, 0.34, 0.12); glow(1010, fy + 10, 5.5, 1.8, 0xffa850, 0.38);
    const puddles = scene.add.graphics().setDepth(-880);
    for (const [px, py, pw] of [[300, 610, 120], [760, 624, 150], [1010, 604, 90]]) {
      puddles.fillStyle(0x7aa0c8, 0.2); puddles.fillEllipse(px, py, pw, 14);
      puddles.fillStyle(0xffc070, 0.22); puddles.fillEllipse(px + 10, py, pw * 0.4, 6);
    }
    add(puddles);
  } else if (id === 'chicago') {
    glow(900, 335, 6, 3.4, 0xffc070, 0.55); glow(760, fy + 20, 9, 2.4, 0xffc888, 0.28);
    const train = scene.add.graphics().setDepth(-995);
    train.fillStyle(0xb9bdc6, 1); train.fillRect(0, -50, 560, 36);
    train.fillStyle(0xc4202a, 1); train.fillRect(0, -30, 560, 6);
    train.fillStyle(0x1a1c22, 1);
    for (let i = 0; i < 12; i++) train.fillRect(14 + i * 46, -44, 30, 12);
    train.fillStyle(0x2b2d33, 1); train.fillRect(0, -16, 560, 4);
    for (const x of [0, 186, 372]) { train.fillStyle(0x1a1c22, 1); train.fillRect(x + 176, -50, 10, 36); }
    train.y = 314;
    add(train);
    tickers.push((t) => { train.x = ((t * 130) % 2400) - 700; });
  } else {
    glow(660, 180, 1.2, 1.2, 0xffc070, 0.8); glow(640, fy + 10, 8, 2.2, 0xffd49a, 0.3);
    glow(760, 330, 5, 2, 0xe87858, 0.35);
  }
  const vig = scene.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W, H).setDepth(5000);
  add(vig);

  return {
    update: (t, dt) => tickers.forEach((f) => f(t, dt)),
    destroy: () => extras.forEach((o) => o.destroy()),
  };
}

export const courtLabel = (id: CourtId) => COURTS.find((c) => c.id === id)!;
