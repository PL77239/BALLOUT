import Phaser from 'phaser';
import { T } from './tuning';
import { PX, Pix, pixTexture } from './pixel';
import type { Hooper } from './hooper';

const BALL_PX = 9;

export type BallMode = 'held' | 'shot' | 'loose';

export interface ShotInfo {
  shooter: Hooper;
  perfect: boolean;
  pts: number;
  age: number;
  scored: boolean;
  dunk: boolean;
  green: number;
  touchedRim: boolean;
}

export interface BallEvents {
  onScore(info: ShotInfo, clean: boolean): void;
  onRim(speed: number): void;
  onBoard(speed: number): void;
  onFloor(speed: number): void;
  onWall(): void;
}

export class Ball {
  x = 0; z = 0; h = 20; vx = 0; vz = 0; vh = 0;
  mode: BallMode = 'loose';
  owner: Hooper | null = null;
  lastOwner: Hooper | null = null;
  info: ShotInfo | null = null;
  noRim = 0;
  spin = 0;
  netKick = 0;
  trail: { x: number; y: number }[] = [];
  img: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Graphics;
  trailG: Phaser.GameObjects.Graphics;
  fire = false;
  private prevH = 0;
  private rot = 0;
  private roll = 0;
  private pix = new Pix(BALL_PX, BALL_PX);
  private tex: Phaser.Textures.CanvasTexture;

  constructor(private scene: Phaser.Scene, private ev: BallEvents) {
    this.tex = pixTexture(scene, 'ball', this.pix);
    this.paintBall();
    this.img = scene.add.image(0, 0, 'ball').setScale(PX);
    this.shadow = scene.add.graphics().setDepth(-500);
    this.trailG = scene.add.graphics().setDepth(1900).setBlendMode(Phaser.BlendModes.ADD);
  }

  /** Tiny rotating sphere: cel-shaded leather with seams that follow the spin and roll. */
  private paintBall() {
    const p = this.pix, R = BALL_PX / 2 - 0.5, c = (BALL_PX - 1) / 2;
    p.clear();
    const cr = Math.cos(this.rot), sr = Math.sin(this.rot), cl = Math.cos(this.roll), sl = Math.sin(this.roll);
    const L = [-0.5, -0.6, 0.62];
    const body = this.fire ? [0xffe070, 0xff9a2a, 0xe0541a] : [0xf09a48, 0xd8661e, 0xa8420f];
    for (let y = 0; y < BALL_PX; y++) {
      for (let x = 0; x < BALL_PX; x++) {
        const dx = (x - c) / R, dy = (y - c) / R, d2 = dx * dx + dy * dy;
        if (d2 > 1.12) continue;
        const dz = Math.sqrt(Math.max(0, 1 - d2));
        const px = dx * cr + dy * sr, py = -dx * sr + dy * cr;
        const bx = px * cl + dz * sl, bz = -px * sl + dz * cl;
        const dot = dx * L[0] + dy * L[1] + dz * L[2];
        let col = dot > 0.55 ? body[0] : dot > 0.0 ? body[1] : body[2];
        const seam = Math.abs(bx) < 0.12 || Math.abs(py) < 0.13 || Math.abs(Math.abs(bx) - 0.64 * Math.max(0.4, bz)) < 0.1;
        if (seam && bz > -0.1) col = 0x2a1208;
        const edge = d2 > 0.66;
        p.set(x, y, edge ? 0x1a0e0a : col);
      }
    }
    p.upload(this.tex.getContext()); this.tex.refresh();
  }

  get sx() { return this.x; }
  get sy() { return T.court.floorY + this.z - this.h; }

  setHeld(x: number, z: number, h: number) { this.x = x; this.z = z; this.h = h; this.vx = this.vz = this.vh = 0; }

  release(owner: Hooper | null) {
    if (owner) this.lastOwner = owner;
    this.owner = null;
    this.mode = 'loose';
  }

  launch(vx: number, vz: number, vh: number, info: ShotInfo | null) {
    this.vx = vx; this.vz = vz; this.vh = vh;
    this.mode = info ? 'shot' : 'loose';
    this.info = info;
    this.owner = null;
    this.prevH = this.h;
    this.spin = 9;
  }

  update(dt: number) {
    if (this.noRim > 0) this.noRim -= dt;
    if (this.mode !== 'held') {
      if (this.info) this.info.age += dt;
      const n = Math.max(1, Math.ceil(dt / 0.004));
      const s = dt / n;
      for (let i = 0; i < n; i++) this.step(s);
      this.spin += (this.vx * 0.03 - this.spin) * Math.min(1, dt * 3);
    } else {
      this.spin += (0 - this.spin) * Math.min(1, dt * 6);
    }
    if (this.netKick > 0) this.netKick = Math.max(0, this.netKick - dt * 2.4);
    this.rot += this.spin * dt * 0.7;
    this.roll += (this.mode === 'held' ? this.vx : this.vx) * dt * 0.05 + this.spin * dt * 0.15;
  }

  private step(s: number) {
    const r = T.ball.r, g = T.ball.g, hp = T.hoop, c = T.court;
    this.prevH = this.h;
    this.x += this.vx * s; this.z += this.vz * s;
    this.h += this.vh * s - 0.5 * g * s * s;
    this.vh -= g * s;

    if (this.h <= r) {
      this.h = r;
      if (this.vh < 0) {
        const sp = -this.vh;
        this.vh = sp * T.ball.bounce;
        this.vx *= 0.9; this.vz *= 0.9;
        if (sp > 140) this.ev.onFloor(sp);
        if (this.vh < 80) this.vh = 0;
      }
      if (this.vh === 0) { this.vx *= 1 - 1.4 * s; this.vz *= 1 - 1.4 * s; }
    }
    if (this.x < c.leftWall + r) { this.x = c.leftWall + r; if (this.vx < 0) { this.vx = -this.vx * 0.55; this.ev.onWall(); } }
    if (this.x > c.rightWall - r) { this.x = c.rightWall - r; if (this.vx > 0) { this.vx = -this.vx * 0.55; this.ev.onWall(); } }
    const zl = c.laneHalf + 12;
    if (this.z > zl) { this.z = zl; if (this.vz > 0) this.vz = -this.vz * 0.5; }
    if (this.z < -zl) { this.z = -zl; if (this.vz < 0) this.vz = -this.vz * 0.5; }

    if (this.noRim > 0) return;
    if (this.x + r > hp.boardX && this.x - r < hp.boardX + 7 && this.h > hp.boardH0 && this.h < hp.boardH1 && this.vx > 0) {
      this.x = hp.boardX - r;
      const sp = this.vx;
      this.vx = -this.vx * 0.5;
      this.vz *= 0.8;
      this.ev.onBoard(sp);
    }
    for (const px of [hp.x - hp.rimR, hp.x + hp.rimR]) {
      const dx = this.x - px, dh = this.h - hp.rimH;
      const d = Math.hypot(dx, dh);
      if (d < r + 2.5 && d > 0.001) {
        const nx = dx / d, nh = dh / d;
        this.x = px + nx * (r + 2.5); this.h = hp.rimH + nh * (r + 2.5);
        const vn = this.vx * nx + this.vh * nh;
        if (vn < 0) {
          const e = 0.52;
          this.vx -= (1 + e) * vn * nx; this.vh -= (1 + e) * vn * nh;
          this.vx *= 0.94;
          if (this.info) this.info.touchedRim = true;
          this.ev.onRim(-vn);
          this.netKick = Math.max(this.netKick, 0.3);
        }
      }
    }
    if (this.info && !this.info.scored && this.prevH >= hp.rimH && this.h < hp.rimH && this.vh < 0
      && Math.abs(this.x - hp.x) < hp.rimR - 4 && Math.abs(this.z) < 40) {
      this.info.scored = true;
      this.netKick = 1;
      this.vx *= 0.3; this.vz *= 0.3;
      this.ev.onScore(this.info, !this.info.touchedRim);
    }
  }

  draw(depth: number, ownerDepth?: number) {
    const sy = this.sy;
    this.paintBall();
    this.img.setPosition(Math.round(this.x / PX) * PX, Math.round(sy / PX) * PX).setDepth(ownerDepth ?? depth);
    const sh = this.shadow;
    sh.clear();
    const k = Math.max(0.35, 1 - this.h / 420);
    sh.fillStyle(0x000000, 0.4 * k);
    const cx = Math.round(this.x / PX), cy = Math.round((T.court.floorY + this.z + 2) / PX), rx = Math.round(5 * k + 1);
    for (let j = -1; j <= 1; j++) { const w = j === 0 ? rx : Math.max(1, rx - 2); sh.fillRect((cx - w) * PX, (cy + j) * PX, w * 2 * PX, PX); }
    const tg = this.trailG;
    tg.clear();
    const fast = this.mode === 'shot' || Math.hypot(this.vx, this.vh) > 380;
    if (fast || this.fire) this.trail.push({ x: this.x, y: sy });
    else if (this.trail.length) this.trail.shift();
    while (this.trail.length > (this.fire ? 14 : 8)) this.trail.shift();
    for (let i = 0; i < this.trail.length - 1; i++) {
      const a = i / this.trail.length;
      const col = this.fire ? (a > 0.6 ? 0xffc24a : 0xff6a1a) : 0xcfe8ff;
      const s = a > 0.5 ? 2 : 1;
      tg.fillStyle(col, a * 0.7);
      tg.fillRect(Math.round(this.trail[i].x / PX) * PX - (s * PX) / 2, Math.round(this.trail[i].y / PX) * PX - (s * PX) / 2, s * PX, s * PX);
    }
  }
}
