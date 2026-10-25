import { Intent, emptyIntent } from './input';
import { T, AiLevel } from './tuning';
import type { Hooper } from './hooper';
import type { GameScene } from './game';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));


export class Brain {
  private lvl: (typeof T.ai)[AiLevel];
  private releaseAt = T.shot.sweet;
  private jukeCD = 0.6;
  private stealCD = 0.8;
  private reactT = -1;
  private seenShoot = false;
  private tgtZ = 0;
  private tgtX = NaN;
  private planT = 0;
  private wantThree = false;
  private shotRoll = 0;
  private lastJump = 0;

  constructor(level: AiLevel) { this.lvl = T.ai[level]; }

  think(me: Hooper, opp: Hooper, g: GameScene, dt: number): Intent {
    const I = emptyIntent();
    this.jukeCD -= dt; this.stealCD -= dt; this.planT -= dt; this.lastJump -= dt;
    if (me.act === 'fall' || me.act === 'stagger') return I;
    if (me.hasBall) this.offense(I, me, opp, g, dt);
    else if (opp.hasBall) this.defense(I, me, opp, g, dt);
    else this.chase(I, me, g);
    return I;
  }

  private offense(I: Intent, me: Hooper, opp: Hooper, g: GameScene, dt: number) {
    if (me.act === 'shoot') {
      I.shootHeld = true;
      if (me.meter >= this.releaseAt) { I.shootUp = true; I.shootHeld = false; }
      return;
    }
    if (me.act === 'release' || me.act === 'dunk') return;
    const dist = g.distToHoop(me.x, me.z);
    const dx = opp.x - me.x, dz = opp.z - me.z;
    const near = Math.abs(dx) < 135 && Math.abs(dz) < 56;
    const stunned = opp.act === 'fall' || opp.act === 'stagger' || opp.act === 'recover';
    const open = !near || stunned || Math.abs(dx) > 150;

    if (g.needsClear && !g.cleared) {
      I.mx = -1; I.mz = clamp(-me.z / 25, -1, 1);
      if (near && dx < 0) { I.mx = -0.4; }
      I.sprint = false;
      return;
    }
    if (this.planT <= 0) {
      this.planT = 1 + g.rand() * 1.4;
      this.wantThree = g.rand() < 0.12 + this.lvl.shoot * 0.22 + (me.fireOn ? 0.08 : 0);
    }
    I.mx = 1;
    const away = Math.abs(dz) < 34 ? (me.z >= opp.z ? 1 : -1) * (Math.abs(me.z) > 50 ? -1 : 1) : 0;
    I.mz = away !== 0 ? away : clamp(-me.z / 30, -1, 1) * 0.6;
    I.sprint = dist > 260 && me.stamina > 28;
    const inThree = dist < T.arcR + 55 && dist >= T.arcR - 4;
    if (this.wantThree && dist < T.arcR + 55) { I.mx = 0; I.sprint = false; I.mz *= 0.3; }
    this.shotRoll += dt;

    const closeDunk = (T.hoop.x - me.x) < T.dunk.range && (T.hoop.x - me.x) > 20;
    if (!this.wantThree && closeDunk && (!near || stunned) && Math.abs(me.vx) > 60 && g.rand() < dt * (0.5 + this.lvl.aggr * 0.8)) { I.c = true; return; }
    if (near && this.jukeCD <= 0 && me.act === 'free' && g.rand() < 0.25 + this.lvl.aggr * 0.65) {
      this.jukeCD = 0.35 + g.rand() * 0.5;
      const r = g.rand();
      if (r < 0.4) I.a = true; else if (r < 0.7) I.b = true; else I.c = true;
      I.mz = dz > 0 ? -1 : 1;
      return;
    }
    if (me.act === 'juke' && me.comboN >= 1 && open && me.actT > me.actDur * 0.55 && dist < T.arcR + 80 && g.rand() < 0.5) {
      this.beginShot(I, me, g);
      return;
    }
    const shootRate = 0.55 + this.lvl.shoot * 0.45;
    if (this.wantThree) {
      const rate = (open ? 1.35 : 0.35) * shootRate;
      if (inThree && this.shotRoll > 0.55 && g.rand() < dt * rate) this.beginShot(I, me, g);
    } else if (dist > 150 && dist < T.arcR - 30) {
      if (open && this.shotRoll > 0.55 && g.rand() < dt * 0.75 * (0.25 + this.lvl.shoot) * shootRate) this.beginShot(I, me, g);
    } else if (dist <= 170 && me.act === 'free' && g.rand() < dt * (open ? 1.35 : 0.45) * shootRate) this.beginShot(I, me, g);
  }

  private beginShot(I: Intent, me: Hooper, g: GameScene) {
    I.shootDown = true; I.shootHeld = true;
    I.mx = 0;
    this.shotRoll = 0;
    this.releaseAt = T.shot.sweet + (g.rand() + g.rand() + g.rand() - 1.5) * this.lvl.shootJitter * 2.1;
    void me;
  }

  private defense(I: Intent, me: Hooper, opp: Hooper, g: GameScene, dt: number) {
    if (!Number.isFinite(this.tgtX)) { this.tgtX = me.x; this.tgtZ = me.z; }
    const juking = opp.act === 'juke';
    const lateral = Math.abs(opp.vz) > 95;
    const zSmooth = this.lvl.react * (juking ? 2.2 : 1.35) + (juking ? 0.14 : 0.06);
    const aimZ = juking ? opp.z - opp.vz * 0.06 : opp.z;
    this.tgtZ += (aimZ - this.tgtZ) * Math.min(1, dt / zSmooth);

    const gap = 78 + 48 * (1 - this.lvl.aggr);
    const tx = Math.min(opp.x + gap, T.hoop.x - 30);
    const xSmooth = this.lvl.react * (juking || lateral ? 1.8 : 0.95) + 0.05;
    this.tgtX += (tx - this.tgtX) * Math.min(1, dt / xSmooth);

    const mxDiv = juking ? 38 : lateral ? 32 : 26;
    const mzDiv = juking ? 24 : 16;
    let mx = clamp((this.tgtX - me.x) / mxDiv, -1, 1);
    let mz = clamp((this.tgtZ - me.z) / mzDiv, -1, 1);
    if (juking) { mx *= 0.45; mz *= 0.3; }
    else if (lateral) { mx *= 0.72; mz *= 0.55; }
    I.mx = mx;
    I.mz = mz;
    I.sprint = !juking && Math.abs(this.tgtX - me.x) > 110 && me.stamina > 20;
    const adx = Math.abs(opp.x - me.x), adz = Math.abs(opp.z - me.z);
    if (adx < 100 && adz < 50) I.checkHeld = true;

    if (opp.act === 'shoot') {
      if (!this.seenShoot) {
        this.seenShoot = true;
        this.reactT = g.rand() < (0.72 - this.lvl.aggr * 0.35) ? 0.1 + g.rand() * 0.08 : this.lvl.react * (0.95 + g.rand() * 1.05);
      }
      this.reactT -= dt;
      if (this.reactT <= 0 && opp.meter > 0.08 && adx < 165 && adz < 52 && me.act === 'free' && this.lastJump <= 0 && g.rand() < 0.35 + this.lvl.aggr * 0.45) {
        I.shootDown = true; this.lastJump = 1.2;
      }
      I.mx = clamp((opp.x + 40 - me.x) / 30, -1, 1);
    } else this.seenShoot = false;

    if (me.act === 'free' && opp.act === 'free' || opp.act === 'juke') {
      if (this.stealCD <= 0 && adx > 28 && adx < T.steal.range - 14 && adz < 28 && opp.protectT <= 0 && g.rand() < dt * (0.06 + this.lvl.aggr * 0.48)) {
        I.a = true; this.stealCD = 1.1 + g.rand() * 1;
      }
      if (me.shoveCD <= 0 && adx < T.shove.range - 6 && adz < 28 && g.rand() < dt * this.lvl.aggr * 0.28) I.shove = true;
    }
    if (g.ball.mode === 'held' && opp.act === 'dunk') {
      const t = opp.actT;
      if (t < 0.18 && adx < 220 && me.act === 'free' && this.lastJump <= 0 && g.rand() < 0.5 + this.lvl.aggr * 0.5) { I.shootDown = true; this.lastJump = 1.2; }
    }
  }

  private chase(I: Intent, me: Hooper, g: GameScene) {
    const b = g.ball;
    const bx = b.x + b.vx * 0.15, bz = b.z + b.vz * 0.15;
    I.mx = clamp((bx - me.x) / 20, -1, 1);
    I.mz = clamp((bz - me.z) / 10, -1, 1);
    I.sprint = true;
    if (b.h > 120 && Math.abs(b.x - me.x) < 80 && Math.abs(b.z - me.z) < 45 && b.vh < 200 && me.act === 'free' && this.lastJump <= 0) {
      I.shootDown = true; this.lastJump = 1;
    }
  }
}
