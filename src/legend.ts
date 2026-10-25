import Phaser from 'phaser';
import { PX } from './pixel';
import { label, textWidth } from './font';
import { fixedAt, fixedOrigin } from './viewport';

export type LegendCtx = 'offense' | 'defense';
type Row = [string, string][];

const KEYS: Record<LegendCtx, Row> = {
  offense: [['WASD', 'MOVE'], ['SHIFT', 'SPRINT'], ['SPACE', 'SHOOT'], ['J', 'CROSS'], ['K', 'SPIN'], ['L', 'DUNK'], ['ESC', 'PAUSE']],
  defense: [['WASD', 'MOVE'], ['SHIFT', 'SPRINT'], ['J', 'STEAL'], ['SPACE', 'BLOCK'], ['E', 'SHOVE'], ['R', 'CHECK'], ['ESC', 'PAUSE']],
};
const PAD: Record<LegendCtx, Row> = {
  offense: [['STICK', 'MOVE'], ['R1', 'SPRINT'], ['X', 'SHOOT'], ['SQUARE', 'CROSS'], ['O', 'SPIN'], ['TRI', 'DUNK'], ['OPT', 'PAUSE']],
  defense: [['STICK', 'MOVE'], ['R1', 'SPRINT'], ['SQUARE', 'STEAL'], ['X', 'BLOCK'], ['L1', 'SHOVE'], ['L2', 'CHECK'], ['OPT', 'PAUSE']],
};

const ROW_H = 9, PAD_Y = 2, GAP = 7;
export const LEGEND_H = ROW_H * 2 + PAD_Y * 2 + 1;

/**
 * Always-on controls strip along the bottom edge of the match screen: one row for keyboard, one for the gamepad,
 * switching between offense and defense actions with possession.
 */
export class Legend {
  private bg: Phaser.GameObjects.Graphics;
  private texts: Phaser.GameObjects.BitmapText[][] = [[], []];
  private ctx: (LegendCtx | '')[] = ['', ''];
  private labels: [string, string];
  private chipW: number;

  constructor(private scene: Phaser.Scene, private w: number, private h: number, labels: [string, string] = ['KEYS', 'PAD']) {
    this.labels = labels;
    this.chipW = Math.max(...labels.map((l) => textWidth(l))) + 7;
    const y0 = h - LEGEND_H;
    this.bg = scene.add.graphics().setDepth(6050).setScrollFactor(0).setPosition(fixedOrigin(w), fixedOrigin(h));
    const R = (x: number, y: number, ww: number, hh: number, c: number, a = 1) => { this.bg.fillStyle(c, a); this.bg.fillRect(x * PX, y * PX, ww * PX, hh * PX); };
    R(0, y0, w, LEGEND_H, 0x000000, 0.82);
    R(0, y0, w, 1, 0xff7a1a);
    R(this.chipW, y0 + 2, 1, LEGEND_H - 4, 0x2c2c3c);
    this.labels.forEach((l, i) => this.add(i, l, 3, 0xff7a1a));
  }

  private add(row: number, s: string, x: number, color: number, track = false) {
    const y = this.h - LEGEND_H + PAD_Y + 1 + row * ROW_H;
    const t = label(this.scene, fixedAt(x, this.w), fixedAt(y, this.h), s, color, { depth: 6060 }).setScrollFactor(0);
    if (track) this.texts[row].push(t);
    return t;
  }

  /** Rebuild a row only when its context changes. */
  set(row: 0 | 1, ctx: LegendCtx) {
    if (this.ctx[row] === ctx) return;
    this.ctx[row] = ctx;
    this.texts[row].forEach((t) => t.destroy());
    this.texts[row] = [];
    const entries = (row === 0 ? KEYS : PAD)[ctx];
    const total = (e: Row) => e.reduce((a, [k, v]) => a + textWidth(k) + 3 + textWidth(v) + GAP, -GAP);
    const room = this.w - this.chipW - 10;
    const use = entries.slice();
    while (use.length > 4 && total(use) > room) use.pop();
    let x = this.chipW + 4;
    for (const [k, v] of use) {
      this.add(row, k, x, 0xffd24a, true); x += textWidth(k) + 3;
      this.add(row, v, x, 0xb4b4cc, true); x += textWidth(v) + GAP;
    }
  }

  destroy() {
    this.bg.destroy();
    this.texts.forEach((r) => r.forEach((t) => t.destroy()));
  }
}
