import Phaser from 'phaser';
import { PX, clamp } from './pixel';
import { Puppet, Rig, restRig } from './puppet';
import { REGIONS, RegionId, rivalFor, type FaceKind, type HeadKind, type TopKind, type BottomKind } from './loadout';
import type { Spot } from './courtkit';

type Activity = 'phone' | 'drink' | 'talk' | 'fold' | 'walk' | 'smoke' | 'music' | 'fight' | 'lean' | 'point';
const ACTIVITIES: Activity[] = ['phone', 'drink', 'talk', 'fold', 'walk', 'smoke', 'music', 'fight', 'lean', 'point'];
const TURNS = [0.05, 0.12, 0.28, 0.45, 0.62, 0.82, 1, -0.35, -0.7];

interface Fan {
  p: Puppet;
  spot: Spot;
  phase: number;
  rate: number;
  acc: number;
  cheer: number;
  look: number;
  nextLook: number;
  view: number;
  activity: Activity;
  nextActivity: number;
  drift: number;
  face: number;
  mate: number;
}

/** Background spectators: small puppets that bob, look around and jump when somebody scores. */
export class Crowd {
  objs: Phaser.GameObjects.GameObject[] = [];
  fans: Fan[] = [];
  tint: ((wx: number, wy: number) => number) | null = null;
  private t = 0;
  private frame = 0;

  constructor(scene: Phaser.Scene, spots: Spot[], look: RegionId, id: string) {
    void REGIONS;
    spots.forEach((s, i) => {
      const l = { ...rivalFor(look), topTexture: undefined, bottomTexture: undefined, chain: 'none' as const };
      const sc = s.kind === 'kid' ? 0.43 : 0.55;
      const p = new Puppet(scene, l, { scale: sc, w: 64, h: 58, key: `fan_${id}_${i}` });
      const spot = { ...s, x: s.x + (s.kind === 'sit' ? 0 : (Math.random() - .5) * 22), y: s.y + (s.kind === 'sit' ? 0 : Math.floor(Math.random() * 7) - 3) };
      p.root.setPosition(spot.x * PX, spot.y * PX).setDepth(spot.y * PX);
      const face = Math.random() < .5 ? 1 : -1;
      p.setFacing(face);
      this.objs.push(p.root);
      const f: Fan = {
        p, spot, activity: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
        nextActivity: 2 + Math.random() * 6, drift: 0,
        view: TURNS[Math.floor(Math.random() * TURNS.length)],
        phase: Math.random() * 6, rate: 0.7 + Math.random() * 0.6, acc: 0,
        cheer: 0, look: 0, nextLook: 1 + Math.random() * 4, face, mate: -1,
      };
      this.fans.push(f);
      this.dressFan(f);
      p.snap(this.poseFor(f, 0));
    });
    this.pairFights();
  }

  private dressFan(f: Fan) {
    const l = f.p.loadout;
    const tops: TopKind[] = ['tee', 'hoodie', 'bigTee', 'jersey', 'tank', 'flannel'];
    const bottoms: BottomKind[] = ['jeans', 'joggers', 'sweats', 'jorts', 'longShorts'];
    l.top = tops[Math.floor(Math.random() * tops.length)];
    l.bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    l.head = (['none', 'backcap', 'beanie', 'fitted', 'durag', 'bucket'] as HeadKind[])[Math.floor(Math.random() * 6)];
    l.face = 'none';
    if (f.activity === 'smoke') l.face = (Math.random() < .5 ? 'blunt' : 'beardblunt') as FaceKind;
    if (f.activity === 'music') l.head = 'headband';
    if (f.spot.kind === 'elder') { l.top = 'flannel'; l.bottom = 'khakis'; }
    if (f.spot.kind === 'kid') { l.top = 'tee'; l.head = 'none'; }
    f.p.dress(l);
  }

  private pairFights() {
    const stand = this.fans.map((f, i) => ({ f, i })).filter(o => o.f.spot.kind === 'stand' || o.f.spot.kind === 'cheer');
    for (let n = 0; n < stand.length - 1; n += 1) {
      const a = stand[n], b = stand[n + 1];
      if (a.f.mate >= 0 || b.f.mate >= 0) continue;
      if (Math.abs(a.f.spot.x - b.f.spot.x) > 55) continue;
      if (Math.random() > 0.45) continue;
      a.f.mate = b.i; b.f.mate = a.i;
      a.f.activity = 'fight'; b.f.activity = 'fight';
      a.f.face = Math.sign(b.f.spot.x - a.f.spot.x) || 1;
      b.f.face = -a.f.face;
      a.f.p.setFacing(a.f.face); b.f.p.setFacing(b.f.face);
      a.f.view = 1; b.f.view = 1;
    }
  }

  private poseFor(f: Fan, t: number): Rig {
    const r = restRig(), s = f.spot;
    const bob = Math.sin(t * 2.2 * f.rate + f.phase);
    const j = f.cheer > 0 ? Math.abs(Math.sin(t * 9 + f.phase)) : 0;
    const up = f.cheer > 0 ? clamp(f.cheer * 2, 0, 1) : 0;
    const sh = (lean: number, hipY: number) => ({ x: Math.sin(lean) * 52, y: hipY + Math.cos(lean) * 52 });
    if (s.kind === 'sit') {
      r.hipY = 52 + bob * 0.8; r.lean = 0.05 + bob * 0.02;
      r.fFx = 30; r.bFx = -26; r.fFy = 0; r.bFy = 0;
      const a = sh(r.lean, r.hipY);
      r.fHx = a.x + 22; r.fHy = a.y - 30; r.bHx = a.x + 14; r.bHy = a.y - 34;
      if (up > 0) { r.fHx = a.x + 14; r.fHy = a.y + 40 * up; r.bHx = a.x - 2; r.bHy = a.y + 34 * up; r.hipY += j * 8; }
    } else if (s.kind === 'elder') {
      r.hipY = 80 + bob * 0.8; r.lean = 0.14;
      r.fFx = 8; r.bFx = -8;
      const a = sh(r.lean, r.hipY);
      r.fHx = a.x + 2; r.fHy = a.y - 38; r.bHx = a.x - 4; r.bHy = a.y - 40;
    } else {
      r.hipY = 85 + bob * 1.1 + j * 14; r.lean = 0.03 + bob * 0.015;
      r.fFx = 11; r.bFx = -11; r.fFy = j * 10; r.bFy = j * 10;
      const a = sh(r.lean, r.hipY);
      r.fHx = a.x + 4; r.fHy = a.y - 40; r.bHx = a.x + 8; r.bHy = a.y - 38;
      if (up > 0 || s.kind === 'cheer') {
        const k = Math.max(up, s.kind === 'cheer' ? 0.5 : 0);
        r.fHx = a.x + 12; r.fHy = a.y + 46 * k + Math.sin(t * 12 + f.phase) * 5 * k; r.bHx = a.x - 6; r.bHy = a.y + 42 * k - Math.sin(t * 12 + f.phase) * 5 * k;
      }
    }
    r.turn = f.view + Math.sin(t * .35 + f.phase) * .05;
    if (up === 0 && s.kind !== 'elder') this.applyActivity(f, r, t);
    r.head += f.look * 0.12;
    r.emo = f.cheer > 0 ? 1 : f.activity === 'fight' ? -0.4 : f.activity === 'music' ? 0.5 : 0;
    r.mouth = f.cheer > 0 ? 0.7 : f.activity === 'smoke' ? (Math.sin(t * 2 + f.phase) > 0.4 ? 1 : 0) : f.activity === 'talk' ? (Math.sin(t * 8 + f.phase) > 0 ? 1 : 0) : 0;
    return r;
  }

  private applyActivity(f: Fan, r: Rig, t: number) {
    const s = f.spot;
    const hip = r.hipY;
    switch (f.activity) {
      case 'phone':
        r.fHx = 19; r.fHy = hip + 48; r.bHx = -18; r.bHy = hip + 23; r.head = .16;
        break;
      case 'drink':
        r.fHx = 25; r.fHy = hip + 64 + Math.sin(t * 1.7 + f.phase) * 3; r.bHx = -15; r.bHy = hip + 17;
        break;
      case 'talk':
        r.fHx = 25 + Math.sin(t * 2.4 + f.phase) * 10; r.fHy = hip + 39; r.bHx = -22; r.bHy = hip + 23;
        r.head = Math.sin(t * 1.6 + f.phase) * .1;
        break;
      case 'fold':
        r.fHx = 14; r.bHx = -14; r.fHy = hip + 30; r.bHy = hip + 32; r.lean = .08;
        break;
      case 'walk':
        if (s.kind !== 'sit') {
          const stride = Math.sin(t * 2.9 + f.phase);
          r.fFx = 12 + stride * 12; r.bFx = -12 - stride * 12;
          r.fFy = Math.max(0, stride) * 5; r.bFy = Math.max(0, -stride) * 5;
          r.turn = 0.85 + Math.sin(t * .4) * .08;
          r.fHx = 8 + stride * 6; r.bHx = -6 - stride * 6;
          r.fHy = hip + 18; r.bHy = hip + 16;
        }
        break;
      case 'smoke':
        r.fHx = 16; r.fHy = hip + 58 + Math.sin(t * 1.2 + f.phase) * 2; r.bHx = -12; r.bHy = hip + 20;
        r.head = -.08; r.lean = .1;
        break;
      case 'music': {
        const beat = Math.sin(t * 5.5 * f.rate + f.phase);
        r.hipY += beat * 2.2; r.head = beat * .14;
        r.fHx = 18; r.fHy = hip + 56; r.bHx = -20; r.bHy = hip + 24;
        r.fFx = 10 + beat * 3; r.bFx = -10 - beat * 3;
        break;
      }
      case 'fight':
        if (s.kind !== 'sit') {
          const punch = Math.max(0, Math.sin(t * 7 + f.phase));
          const guard = 1 - punch;
          r.lean = .18 + punch * .2; r.head = -.06;
          r.fHx = 8 + punch * 34; r.fHy = hip + 20 + punch * 28;
          r.bHx = -10 - guard * 6; r.bHy = hip + 36;
          r.fFx = 16 + punch * 8; r.bFx = -18; r.turn = 0.92;
          r.mouth = punch > .6 ? 1 : 0;
        }
        break;
      case 'lean':
        r.lean = .22; r.hipY = 78 + Math.sin(t * .8 + f.phase);
        r.fFx = 20; r.bFx = -6; r.fHx = 8; r.fHy = hip + 14; r.bHx = -22; r.bHy = hip + 40;
        r.turn = 0.7;
        break;
      case 'point':
        r.fHx = 32; r.fHy = hip + 62 + Math.sin(t * 1.1) * 3; r.bHx = -14; r.bHy = hip + 18;
        r.head = -.12; r.turn = 0.55 + Math.sin(t * .5 + f.phase) * .1;
        break;
    }
  }

  cheer(power: number) {
    for (const f of this.fans) f.cheer = Math.max(f.cheer, (0.8 + Math.random() * 0.8) * (0.5 + power * 0.5));
  }

  update(t: number, dt: number) {
    this.t = t;
    this.frame++;
    for (let i = 0; i < this.fans.length; i++) {
      const f = this.fans[i];
      f.cheer = Math.max(0, f.cheer - dt);
      f.nextActivity -= dt;
      if (f.nextActivity < 0 && f.activity !== 'fight') {
        f.activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        if (f.activity === 'fight' && f.mate < 0) f.activity = 'talk';
        f.nextActivity = 3.5 + Math.random() * 8;
        f.view = TURNS[Math.floor(Math.random() * TURNS.length)];
        if (Math.random() < .35) {
          f.face *= -1;
          f.p.setFacing(f.face);
        }
        this.dressFan(f);
      }
      const walking = f.activity === 'walk' && f.spot.kind !== 'sit';
      const target = walking ? Math.sin(t * .28 + f.phase) * 9 : 0;
      f.drift += (target - f.drift) * Math.min(1, dt * 1.5);
      f.p.root.setPosition((f.spot.x + f.drift) * PX, f.spot.y * PX);
      f.nextLook -= dt;
      if (f.nextLook < 0) { f.look = Math.floor(Math.random() * 3) - 1; f.nextLook = 1.2 + Math.random() * 3.5; }
      f.acc += dt;
      const gap = f.cheer > 0 || f.activity === 'fight' || f.activity === 'music' ? 2 : 4;
      if ((this.frame + i) % gap !== 0) continue;
      const motion = walking ? 70 : f.activity === 'fight' ? 40 : 0;
      f.p.update(this.poseFor(f, t), f.acc, { f: false, b: false }, { f: motion, h: 0 });
      f.acc = 0;
      if (this.tint) f.p.setTint(this.tint(f.spot.x * PX, f.spot.y * PX));
    }
  }

  destroy() { for (const f of this.fans) f.p.destroy(); this.fans = []; }
}
