import Phaser from 'phaser';

interface P {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  size: number; grow: number; color: number; add: boolean; grav: number; kind: 0 | 1 | 2; drag: number;
}

export const FONT = 'Impact, Haettenschweiler, "Arial Black", sans-serif';

export class FX {
  private gn: Phaser.GameObjects.Graphics;
  private ga: Phaser.GameObjects.Graphics;
  private parts: P[] = [];

  constructor(private scene: Phaser.Scene) {
    this.gn = scene.add.graphics().setDepth(2000);
    this.ga = scene.add.graphics().setDepth(2001).setBlendMode(Phaser.BlendModes.ADD);
  }

  private add(p: Partial<P>) {
    if (this.parts.length > 700) return;
    this.parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 4, grow: 0, color: 0xffffff, add: false, grav: 0, kind: 0, drag: 0, ...p } as P);
  }

  dust(x: number, y: number, n = 8, dir = 0, power = 1) {
    for (let i = 0; i < n; i++) {
      const l = 0.35 + Math.random() * 0.45;
      this.add({
        x: x + (Math.random() - 0.5) * 16, y: y - Math.random() * 6,
        vx: (dir * 90 + (Math.random() - 0.5) * 150) * power, vy: -(10 + Math.random() * 50) * power,
        life: l, max: l, size: 5 + Math.random() * 7, grow: 22, color: 0xc9b99a, drag: 3,
      });
    }
  }

  sparks(x: number, y: number, n = 14, color = 0xffd060, speed = 330) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.35 + Math.random() * 0.75);
      const l = 0.25 + Math.random() * 0.3;
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: l, max: l, size: 2 + Math.random() * 2.5, color, add: true, grav: 700, kind: 1 });
    }
  }

  ring(x: number, y: number, color = 0xffffff, size = 12, grow = 260, life = 0.35) {
    this.add({ x, y, life, max: life, size, grow, color, add: true, kind: 2 });
  }

  flame(x: number, y: number, n = 1, spread = 8) {
    for (let i = 0; i < n; i++) {
      const l = 0.28 + Math.random() * 0.3;
      this.add({
        x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 40, vy: -50 - Math.random() * 90,
        life: l, max: l, size: 6 + Math.random() * 6, grow: -10, color: Math.random() < 0.5 ? 0xff7a1a : 0xffc24a, add: true,
      });
    }
  }

  speedLines(x: number, y: number, dir: number) {
    for (let i = 0; i < 3; i++) {
      this.add({ x: x - dir * (20 + Math.random() * 30), y: y - 20 - Math.random() * 90, vx: -dir * 380, life: 0.18, max: 0.18, size: 18 + Math.random() * 20, color: 0xffffff, add: true, kind: 1 });
    }
  }

  popup(x: number, y: number, text: string, color = '#ffe45e', size = 34, rise = 46) {
    const t = this.scene.add.text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#0b0b10', strokeThickness: Math.max(5, size / 5) }).setOrigin(0.5).setDepth(2600);
    t.setScale(0.3).setAngle((Math.random() - 0.5) * 8);
    this.scene.tweens.add({ targets: t, scale: 1.12, duration: 130, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: t, y: y - rise, alpha: 0, delay: 520, duration: 420, onComplete: () => t.destroy() });
  }

  update(dt: number) {
    const gn = this.gn, ga = this.ga;
    gn.clear(); ga.clear();
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.vy += p.grav * dt;
      if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.size = Math.max(0.5, p.size + p.grow * dt);
      const k = p.life / p.max;
      const g = p.add ? ga : gn;
      if (p.kind === 0) { g.fillStyle(p.color, k * (p.add ? 0.9 : 0.5)); g.fillCircle(p.x, p.y, p.size); }
      else if (p.kind === 1) {
        g.lineStyle(2.4, p.color, k);
        const l = p.size * 0.045;
        g.lineBetween(p.x, p.y, p.x - p.vx * l * 0.1, p.y - p.vy * l * 0.1);
      } else { g.lineStyle(4 * k + 1, p.color, k); g.strokeCircle(p.x, p.y, p.size); }
    }
  }
}
