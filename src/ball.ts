import Phaser from 'phaser';
import { T } from './tuning';
import type { Hooper } from './hooper';

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

  constructor(private scene: Phaser.Scene, private ev: BallEvents) {
    if (!scene.textures.exists('ball')) {
      const c = scene.textures.createCanvas('ball', 64, 64)!;
      const x = c.getContext();
      const gr = x.createRadialGradient(24, 22, 4, 32, 32, 32);
      gr.addColorStop(0, '#ff9a3c'); gr.addColorStop(1, '#c4531a');
      x.fillStyle = gr; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#1a0f08'; x.lineWidth = 3.5;
      x.beginPath(); x.moveTo(32, 2); x.lineTo(32, 62); x.moveTo(2, 32); x.lineTo(62, 32);
      x.moveTo(10, 10); x.quadraticCurveTo(32, 32, 10, 54); x.moveTo(54, 10); x.quadraticCurveTo(32, 32, 54, 54);
      x.stroke();
      x.lineWidth = 4; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.stroke();
      c.refresh();
    }
    this.img = scene.add.image(0, 0, 'ball').setDisplaySize(T.ball.r * 2.1, T.ball.r * 2.1);
    this.shadow = scene.add.graphics().setDepth(-500);
    this.trailG = scene.add.graphics().setDepth(1900).setBlendMode(Phaser.BlendModes.ADD);
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
    this.img.rotation += this.spin * dt;
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
    this.img.setPosition(this.x, sy).setDepth(ownerDepth ?? depth);
    const sh = this.shadow;
    sh.clear();
    const k = Math.max(0.35, 1 - this.h / 420);
    sh.fillStyle(0x000000, 0.34 * k);
    sh.fillEllipse(this.x, T.court.floorY + this.z + 2, 26 * k, 8 * k);
    const tg = this.trailG;
    tg.clear();
    const fast = this.mode === 'shot' || Math.hypot(this.vx, this.vh) > 380;
    if (fast || this.fire) this.trail.push({ x: this.x, y: sy });
    else if (this.trail.length) this.trail.shift();
    while (this.trail.length > (this.fire ? 16 : 10)) this.trail.shift();
    for (let i = 1; i < this.trail.length; i++) {
      const a = i / this.trail.length;
      const col = this.fire ? (a > 0.6 ? 0xffc24a : 0xff6a1a) : 0xcfe8ff;
      tg.lineStyle(2 + a * (this.fire ? 14 : 7), col, a * 0.55);
      tg.lineBetween(this.trail[i - 1].x, this.trail[i - 1].y, this.trail[i].x, this.trail[i].y);
    }
  }
}
