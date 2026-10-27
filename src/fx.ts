import Phaser from 'phaser';
import { PX } from './pixel';
import { label } from './font';

interface P {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  size: number; grow: number; color: number; add: boolean; grav: number; kind: 0 | 1 | 2 | 3 | 4 | 5; drag: number;
}

const hex = (s: string) => parseInt(s.replace('#', ''), 16);
const snap = (v: number) => Math.round(v / PX) * PX;

/** Pixel-grid particles: every dot is a whole art pixel, no smooth circles or strokes. */
export class FX {
  private gn: Phaser.GameObjects.Graphics;
  private ga: Phaser.GameObjects.Graphics;
  private parts: P[] = [];

  constructor(private scene: Phaser.Scene) {
    this.gn = scene.add.graphics().setDepth(2000);
    this.ga = scene.add.graphics().setDepth(2001).setBlendMode(Phaser.BlendModes.ADD);
  }

  private add(p: Partial<P>) {
    if (this.parts.length > 500) return;
    this.parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0.5, max: 0.5, size: 4, grow: 0, color: 0xffffff, add: false, grav: 0, kind: 0, drag: 0, ...p } as P);
  }

  dust(x: number, y: number, n = 8, dir = 0, power = 1) {
    for (let i = 0; i < n; i++) {
      const l = 0.3 + Math.random() * 0.4;
      this.add({
        x: x + (Math.random() - 0.5) * 16, y: y - Math.random() * 6,
        vx: (dir * 90 + (Math.random() - 0.5) * 150) * power, vy: -(10 + Math.random() * 50) * power,
        life: l, max: l, size: 5 + Math.random() * 6, grow: 16, color: Math.random() < 0.5 ? 0xc9b99a : 0xa89878, drag: 3,
      });
    }
  }

  sparks(x: number, y: number, n = 14, color = 0xffd060, speed = 330) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.35 + Math.random() * 0.75);
      const l = 0.25 + Math.random() * 0.3;
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: l, max: l, size: 2, color, add: true, grav: 700, kind: 1 });
    }
  }

  ring(x: number, y: number, color = 0xffffff, size = 12, grow = 260, life = 0.35) {
    this.add({ x, y, life, max: life, size, grow, color, add: true, kind: 2 });
  }

  rimReward(x:number,y:number,style:'splash'|'money'){
    const money=style==='money';
    this.ring(x,y,money?0x81d874:0x77d9f2,12,95,.28);
    if(!money)this.add({x,y,life:.38,max:.38,size:15,grow:95,color:0x49afd9,kind:5});
    for(let i=0;i<(money?30:24);i++){
      const life=money?.85+Math.random()*.3:.45+Math.random()*.25;
      this.add({x:x+(Math.random()-.5)*24,y,life,max:life,
        vx:(Math.random()-.5)*(money?190:270),vy:-(money?130:170)-Math.random()*140,
        grav:money?380:650,drag:money?.6:0,kind:money?3:4,color:money?0x4d9e59:0x71cfe9});
    }
  }

  flame(x: number, y: number, n = 1, spread = 8) {
    for (let i = 0; i < n; i++) {
      const l = 0.28 + Math.random() * 0.3;
      this.add({
        x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 40, vy: -50 - Math.random() * 90,
        life: l, max: l, size: 6 + Math.random() * 4, grow: -10, color: Math.random() < 0.5 ? 0xff7a1a : 0xffc24a, add: true,
      });
    }
  }

  speedLines(x: number, y: number, dir: number) {
    for (let i = 0; i < 3; i++) {
      this.add({ x: x - dir * (20 + Math.random() * 30), y: y - 20 - Math.random() * 90, vx: -dir * 380, life: 0.18, max: 0.18, size: 18, color: 0xffffff, add: true, kind: 1 });
    }
  }

  /** Floating pixel-font text. `size` picks the 1x or 2x font. */
  popup(x: number, y: number, text: string, color = '#ffe45e', size = 34, rise = 46) {
    const k = size >= 30 ? 2 : 1;
    const t = label(this.scene, snap(x), snap(y), text, hex(color), { k, ox: 0.5, oy: 0.5, depth: 2600 });
    t.y += PX * 4;
    this.scene.tweens.add({ targets: t, y: y - PX * 0, duration: 120, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: t, y: y - rise, alpha: 0, delay: 560, duration: 420, onComplete: () => t.destroy() });
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
      p.size = Math.max(PX, p.size + p.grow * dt);
      const k = p.life / p.max;
      const g = p.add ? ga : gn;
      if(p.kind===3){
        // Whole-pixel bills flutter edge-on and open again as they descend.
        const w=Math.max(2,Math.round(6*Math.abs(Math.cos((p.max-p.life)*13+p.vx)))),h=3;
        const x=snap(p.x),y=snap(p.y);g.fillStyle(0x244c37,k>.2?1:k*5);g.fillRect(x-PX,y-PX,(w+2)*PX,(h+2)*PX);
        g.fillStyle(0x64b779,k>.2?1:k*5);g.fillRect(x,y,w*PX,h*PX);
        g.fillStyle(0xb7df9d,k>.2?1:k*5);g.fillRect(x+Math.floor(w/2)*PX,y,PX,h*PX);
        if(w>3){g.fillRect(x,y+PX,PX,PX);g.fillRect(x+(w-1)*PX,y+PX,PX,PX);}
      }else if(p.kind===5){
        // A blue crown of water opens around the rim before breaking into drops.
        for(let j=0;j<15;j++){
          const a=j/14*Math.PI,xx=p.x+Math.cos(a)*p.size,yy=p.y-Math.sin(a)*p.size*(.65+(j%3)*.25);
          g.fillStyle(p.color,k);g.fillRect(snap(xx),snap(yy),2*PX,2*PX);
          if(j%2===0){g.fillStyle(0xb7f0fb,k);g.fillRect(snap(xx),snap(yy)-PX,PX,PX);}
        }
      }else if(p.kind===4){
        g.fillStyle(p.color,k>.25?1:k*4);g.fillRect(snap(p.x),snap(p.y),2*PX,3*PX);
        g.fillStyle(0xe0fbff,k>.25?1:k*4);g.fillRect(snap(p.x),snap(p.y),PX,PX);
      }else if (p.kind === 0) {
        const s = Math.max(1, Math.round(p.size / PX / 1.6));
        g.fillStyle(p.color, k > 0.5 ? 0.85 : 0.5);
        g.fillRect(snap(p.x), snap(p.y), s * PX, s * PX);
      } else if (p.kind === 1) {
        g.fillStyle(p.color, k > 0.4 ? 1 : 0.6);
        g.fillRect(snap(p.x), snap(p.y), PX, PX);
        if (k > 0.5) { g.fillStyle(p.color, 0.5); g.fillRect(snap(p.x - p.vx * 0.025), snap(p.y - p.vy * 0.025), PX, PX); }
      } else {
        const r = p.size / PX, n = Math.max(8, Math.round(r * 5));
        g.fillStyle(p.color, k > 0.5 ? 1 : 0.55);
        for (let a = 0; a < n; a++) { const an = (a / n) * Math.PI * 2; g.fillRect(snap(p.x + Math.cos(an) * p.size), snap(p.y + Math.sin(an) * p.size * 0.8), PX, PX); }
      }
    }
  }
}

/** Filled ellipse made of whole-pixel rows (for ground shadows). Coordinates are art pixels. */
export function shadowEllipse(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, alpha: number) {
  g.fillStyle(0x000000, alpha);
  const R = Math.max(1, Math.round(ry));
  for (let j = -R; j <= R; j++) {
    const w = Math.round(rx * Math.sqrt(1 - (j / (R + 0.6)) ** 2));
    if (w > 0) g.fillRect(Math.round(cx - w) * PX, Math.round(cy + j) * PX, w * 2 * PX, PX);
  }
}
