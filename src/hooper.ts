import Phaser from 'phaser';
import { Puppet, Rig, restRig } from './puppet';
import { Loadout } from './loadout';
import { Intent, emptyIntent } from './input';
import { T } from './tuning';
import type { GameScene } from './game';

export type Act = 'free' | 'shoot' | 'release' | 'juke' | 'dunk' | 'swipe' | 'block' | 'shove' | 'stagger' | 'fall' | 'recover';
export type MoveKind = 'cross' | 'spin' | 'btb';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

const MOVE_DUR: Record<MoveKind, number> = { cross: 0.34, spin: 0.46, btb: 0.38 };

const COMBO_NAMES: Record<string, string> = {
  'cross>cross': 'DOUBLE CROSS', 'cross>spin': 'SHAKE & BAKE', 'spin>cross': 'SPIN CYCLE',
  'spin>btb': 'WHIRLWIND', 'btb>cross': 'BACK BREAKER', 'cross>btb': 'SNEAKY', 'btb>spin': 'TWISTER',
  'btb>btb': 'DOUBLE BTB', 'spin>spin': 'TORNADO',
};

export class Hooper {
  x = 0; z = 0; vx = 0; vz = 0; h = 0; vh = 0;
  facing = 1;
  puppet: Puppet;
  isCpu = false;
  stamina = T.stamina.max;
  heat = 0;
  fireT = 0;
  score = 0;
  act: Act = 'free';
  actT = 0;
  actDur = 0;
  hasBall = false;
  meter = 0;
  fade = false;
  shoved = false;
  comboN = 0;
  comboKind: MoveKind | '' = '';
  comboT = -9;
  moveKind: MoveKind = 'cross';
  dash = { x: 0, z: 0 };
  protectT = 0;
  ankleChecked = false;
  shoveCD = 0;
  pickupLock = 0;
  handSide = 1;
  ballOx = 32;
  bouncePhase = 0;
  trickDunk = false;
  dunkFrom = { x: 0, z: 0 };
  dunkHit = false;
  swipeHit = false;
  shoveHit = false;
  pumpedT = 0;
  lastDirZ = 1;
  ph = 0;
  I: Intent = emptyIntent();
  spinFlat = 1;
  tAlive = 0;
  carried = { x: 0, z: 0, h: 0, depthBias: 0.3 };
  meterInfo = { green: 0, contest: 0 };
  warnCD = 0;
  immuneT = 0;

  constructor(scene: Phaser.Scene, public id: number, public loadout: Loadout) {
    this.puppet = new Puppet(scene, loadout);
    this.puppet.snap(restRig());
  }

  setLoadout(l: Loadout) { this.loadout = l; this.puppet.dress(l); }

  reset(x: number, z: number, hasBall: boolean) {
    this.x = x; this.z = z; this.vx = this.vz = 0; this.h = this.vh = 0;
    this.act = 'free'; this.actT = 0; this.hasBall = hasBall;
    this.meter = 0; this.comboN = 0; this.protectT = 0; this.pickupLock = 0; this.spinFlat = 1;
    this.shoved = false;
  }

  get sy() { return T.court.floorY + this.z; }
  get airborne() { return this.h > 4; }
  get fireOn() { return this.fireT > 0; }

  private setAct(a: Act, dur = 0) { this.act = a; this.actT = 0; this.actDur = dur; }

  gainHeat(v: number) {
    if (this.fireOn) return;
    this.heat = Math.min(T.heat.max, this.heat + v);
    if (this.heat >= T.heat.max) { this.fireT = T.heat.fireTime; this.heat = T.heat.max; this.onIgnite?.(); }
  }
  onIgnite?: () => void;

  contestOf(g: GameScene): number {
    const d = g.opp(this);
    const dx = d.x - this.x, dz = d.z - this.z;
    const dist = Math.hypot(dx * 0.9, dz * 2.2);
    let c = Math.max(0, 1 - dist / T.shot.contestRange);
    if (dx * this.facing < -24) c *= 0.4;
    if ((d.act === 'block' || d.h > 25) && dist < T.shot.contestRange * 1.25) c = Math.min(1, c + 0.35);
    if (d.act === 'fall' || d.act === 'stagger') c *= 0.2;
    return c;
  }

  greenHalf(g: GameScene): number {
    const dist = g.distToHoop(this.x, this.z);
    const f = dist < 250 ? lerp(1.8, 1, dist / 250) : lerp(1, 0.6, clamp((dist - 250) / (T.arcR - 250), 0, 1));
    const c = this.contestOf(g);
    let w = T.shot.greenHalf * Math.max(0.55, f) * (1 - T.shot.contestPenalty * c);
    if (this.fade) w *= T.shot.fadePenalty;
    if (this.fade) w *= 1 + T.shot.fadeContest * 0.3;
    if (this.stamina < T.stamina.lowAt) w *= 0.85;
    if (this.fireOn) w *= T.shot.fireBonus;
    if (this.shoved) w *= T.shot.shovedPenalty;
    this.meterInfo = { green: w, contest: c };
    return w;
  }

  startMove(kind: MoveKind, g: GameScene) {
    if (!this.hasBall) return;
    const I = this.I;
    const chained = g.gt - this.comboT < T.moves.comboWindow;
    const prev = this.comboKind;
    this.comboN = chained ? Math.min(6, this.comboN + 1) : 1;
    this.comboKind = kind; this.comboT = g.gt;
    const dirZ = Math.abs(I.mz) > 0.25 ? Math.sign(I.mz) : (this.lastDirZ *= -1);
    this.lastDirZ = dirZ;
    const dirX = Math.abs(I.mx) > 0.25 ? Math.sign(I.mx) : 0;
    this.moveKind = kind;
    this.setAct('juke', MOVE_DUR[kind]);
    this.protectT = T.moves.protect + (kind === 'spin' ? 0.1 : 0);
    this.ankleChecked = false;
    this.stamina = Math.max(0, this.stamina - 5);
    const sp = (kind === 'btb' ? 1.15 : kind === 'spin' ? 0.95 : 1) * (this.comboN > 1 && kind === prev ? 0.8 : 1);
    this.dash = kind === 'btb'
      ? { x: (dirX || 1) * 330 * sp, z: dirZ * 90 }
      : kind === 'spin'
        ? { x: (dirX || 1) * 250 * sp, z: dirZ * 250 * sp }
        : { x: dirX * 150 + this.facing * 70, z: dirZ * 330 * sp };
    this.handSide = kind === 'cross' || kind === 'btb' ? -this.handSide : this.handSide;
    let label = kind === 'cross' ? 'CROSSOVER' : kind === 'spin' ? 'SPIN' : 'BEHIND THE BACK';
    if (chained && prev) label = COMBO_NAMES[`${prev}>${kind}`] ?? 'COMBO';
    g.popupAt(this, this.comboN > 1 ? `${label} x${this.comboN}` : label, this.comboN > 2 ? '#ff7a1a' : '#ffe45e', this.comboN > 1 ? 30 : 24);
    if (this.comboN > 1) this.gainHeat(4 * this.comboN);
    g.fx.dust(this.x, this.sy, 5, -Math.sign(this.dash.x));
  }

  startShoot(g: GameScene) {
    if (!this.hasBall) return;
    if (g.needsClear && !g.cleared) {
      if (this.warnCD <= 0) { g.popupAt(this, 'TAKE IT BACK!', '#ff4a4a', 26); this.warnCD = 0.8; }
      return;
    }
    this.fade = this.I.mx * this.facing < -0.35 && this.act === 'free';
    this.shoved = false;
    this.meter = 0;
    this.setAct('shoot');
  }

  endShootPump(g: GameScene) {
    this.setAct('free');
    this.pumpedT = 0.55;
    g.popupAt(this, 'PUMP FAKE', '#9fe8ff', 20);
  }

  releaseShot(g: GameScene) {
    const S = T.shot.sweet;
    const green = this.greenHalf(g);
    const e = this.meter - S;
    const perfect = Math.abs(e) <= green;
    const err = perfect ? 0 : Math.sign(e) * (9 + (Math.abs(e) - green) * T.shot.missK) + (Math.random() - 0.5) * 8;
    g.launchShot(this, { perfect, err, green, m: this.meter, e });
    this.setAct('release', 0.42);
    this.vh = 0;
  }

  startDunk(g: GameScene): boolean {
    if (!this.hasBall) return false;
    const dx = T.hoop.x - this.x;
    if (dx > T.dunk.range || dx < -30) return false;
    if (g.needsClear && !g.cleared) return false;
    this.setAct('dunk', T.dunk.airtime);
    this.dunkFrom = { x: this.x, z: this.z };
    this.dunkHit = false;
    this.trickDunk = this.comboN >= 2 && g.gt - this.comboT < 1.4;
    this.stamina = Math.max(0, this.stamina - 14);
    g.fx.dust(this.x, this.sy, 6, 0);
    return true;
  }

  startSwipe() {
    this.setAct('swipe', 0.3); this.swipeHit = false;
    this.stamina = Math.max(0, this.stamina - 4);
  }

  startBlock() {
    this.setAct('block');
    this.vh = T.jump.vBlock;
    this.stamina = Math.max(0, this.stamina - 6);
  }

  startShove(g: GameScene) {
    if (this.shoveCD > 0) return;
    this.setAct('shove', 0.3); this.shoveHit = false;
    this.shoveCD = T.shove.cooldown;
    this.stamina = Math.max(0, this.stamina - T.shove.cost);
    void g;
  }

  knock(kind: 'stagger' | 'fall', dirX: number, power: number) {
    if (this.act === 'dunk') return;
    this.vx = dirX * power;
    if (this.act === 'shoot') { this.shoved = true; return; }
    if (this.act === 'release' || this.act === 'block') return;
    this.setAct(kind, kind === 'fall' ? 1.15 : 0.5);
  }

  update(dt: number, I: Intent, g: GameScene) {
    this.I = I;
    this.tAlive += dt;
    this.shoveCD = Math.max(0, this.shoveCD - dt);
    this.pickupLock = Math.max(0, this.pickupLock - dt);
    this.protectT = Math.max(0, this.protectT - dt);
    this.pumpedT = Math.max(0, this.pumpedT - dt);
    this.warnCD = Math.max(0, this.warnCD - dt);
    this.immuneT = Math.max(0, this.immuneT - dt);
    if (this.fireT > 0) { this.fireT -= dt; if (this.fireT <= 0) this.heat = 0; }
    else this.heat = Math.max(0, this.heat - T.heat.decay * dt);
    this.actT += dt;

    const moving = Math.abs(I.mx) + Math.abs(I.mz) > 0.15;
    const sprinting = I.sprint && moving && this.stamina > 3 && (this.act === 'free');
    if (sprinting) this.stamina = Math.max(0, this.stamina - T.stamina.sprintDrain * dt);
    else this.stamina = Math.min(T.stamina.max, this.stamina + (T.stamina.regen + (moving ? 0 : T.stamina.regenIdleBonus)) * dt);

    const canAct = this.act === 'free' || (this.act === 'juke' && this.actT > this.actDur * 0.5);
    if (canAct) {
      if (this.hasBall) {
        if (I.shootDown) this.startShoot(g);
        else if (I.a) this.startMove('cross', g);
        else if (I.b) this.startMove('spin', g);
        else if (I.c) { if (!this.startDunk(g)) this.startMove('btb', g); }
      } else if (this.act === 'free') {
        if (I.shootDown) this.startBlock();
        else if (I.a) this.startSwipe();
      }
    }
    if (this.act === 'free' && I.shove) this.startShove(g);

    switch (this.act) {
      case 'free': this.locomote(dt, I, sprinting, 1, g); break;
      case 'shoot': this.tickShoot(dt, I, g); break;
      case 'release':
        this.airPhysics(dt); this.vx *= Math.exp(-3 * dt);
        this.x += this.vx * dt;
        if (this.h <= 0 && this.actT > this.actDur) this.setAct('recover', 0.12);
        break;
      case 'juke': this.tickJuke(dt, I, g); break;
      case 'dunk': this.tickDunk(dt, g); break;
      case 'swipe':
        this.locomote(dt, I, false, 0.3, g);
        if (!this.swipeHit && this.actT > 0.07 && this.actT < 0.2) { this.swipeHit = g.resolveSwipe(this); }
        if (this.actT >= this.actDur) this.setAct(this.swipeHit ? 'free' : 'recover', this.swipeHit ? 0 : T.steal.whiffRecover);
        break;
      case 'block':
        this.airPhysics(dt);
        this.x += I.mx * 120 * dt * (this.h > 0 ? 1 : 0);
        this.z = clamp(this.z + I.mz * 60 * dt, -T.court.laneHalf, T.court.laneHalf);
        if (this.h <= 0 && this.vh <= 0 && this.actT > 0.1) this.setAct('recover', 0.14);
        break;
      case 'shove':
        this.locomote(dt, I, false, 0.3, g);
        if (!this.shoveHit && this.actT > 0.09) { this.shoveHit = true; g.resolveShove(this); }
        if (this.actT >= this.actDur) this.setAct('free');
        break;
      case 'stagger':
        this.vx *= Math.exp(-4 * dt); this.x += this.vx * dt;
        this.locomote(dt, I, false, 0.25, g);
        if (this.actT >= this.actDur) this.setAct('free');
        break;
      case 'fall':
        this.vx *= Math.exp(-3.5 * dt); this.x += this.vx * dt; this.vz *= Math.exp(-6 * dt); this.z += this.vz * dt;
        if (this.actT >= this.actDur) this.setAct('free');
        break;
      case 'recover':
        this.locomote(dt, I, false, 0.45, g);
        if (this.actT >= this.actDur) this.setAct('free');
        break;
    }
    this.x = clamp(this.x, T.court.leftWall + 24, T.court.rightWall - 22);
    this.z = clamp(this.z, -T.court.laneHalf, T.court.laneHalf);
    if (this.act !== 'dunk') this.spinFlat += (1 - this.spinFlat) * Math.min(1, dt * 20);
  }

  private airPhysics(dt: number) {
    if (this.h > 0 || this.vh > 0) {
      this.h += this.vh * dt - 0.5 * T.jump.g * dt * dt;
      this.vh -= T.jump.g * dt;
      if (this.h <= 0) { this.h = 0; this.vh = 0; }
    }
  }

  private locomote(dt: number, I: Intent, sprint: boolean, mul: number, g: GameScene) {
    const m = T.move;
    let spd = sprint ? m.sprint : m.walk;
    if (this.hasBall) spd *= m.ballMult;
    if (this.stamina < T.stamina.lowAt) spd *= 0.86;
    if (this.fireOn) spd *= 1.08;
    const o = g.opp(this);
    if (o.I.checkHeld && !o.hasBall && this.hasBall && Math.abs(o.x - this.x) < 100 && Math.abs(o.z - this.z) < 40) {
      spd *= 0.72; this.stamina = Math.max(0, this.stamina - 6 * dt);
    }
    if (this.hasBall && this.act === 'free' && o.pumpedT > 0) spd *= 1;
    const tx = I.mx * spd * mul, tz = I.mz * spd * m.zFactor * mul;
    const stop = Math.abs(tx) < 1 && Math.abs(tz) < 1;
    const a = (stop ? m.stopAccel : m.accel) * dt;
    this.vx = this.step(this.vx, tx, a); this.vz = this.step(this.vz, tz, a);
    this.x += this.vx * dt; this.z += this.vz * dt;
    if (sprint && Math.abs(this.vx) > 250 && Math.random() < dt * 9) g.fx.dust(this.x - this.facing * 10, this.sy, 1, -Math.sign(this.vx), 0.5);
  }

  private step(v: number, t: number, a: number) {
    if (v < t) return Math.min(t, v + a);
    return Math.max(t, v - a);
  }

  private tickShoot(dt: number, I: Intent, g: GameScene) {
    this.meter += dt / T.shot.meterTime;
    const S = T.shot.sweet;
    const u = smooth((this.meter - 0.28) / (S - 0.28));
    this.h = 78 * u * (this.fade ? 1.05 : 1);
    if (this.fade) { this.x += -this.facing * 160 * dt * (1 - u * 0.4); } else { this.vx *= Math.exp(-5 * dt); this.x += this.vx * dt + I.mx * 40 * dt; }
    this.z = clamp(this.z + I.mz * 24 * dt, -T.court.laneHalf, T.court.laneHalf);
    this.greenHalf(g);
    if (I.shootUp) {
      if (this.meter < T.shot.pumpTap) this.endShootPump(g);
      else this.releaseShot(g);
    } else if (this.meter >= 1.08) this.releaseShot(g);
  }

  private tickJuke(dt: number, I: Intent, g: GameScene) {
    const p = clamp(this.actT / this.actDur, 0, 1);
    const k = Math.pow(1 - p, 0.7);
    const tx = I.mx * T.move.walk * 0.5, tz = I.mz * T.move.walk * 0.4;
    this.vx = this.dash.x * k + tx * (1 - k); this.vz = this.dash.z * k + tz * (1 - k);
    this.x += this.vx * dt; this.z += this.vz * dt;
    if (this.moveKind === 'spin') this.spinFlat = Math.max(0.12, Math.abs(Math.cos(p * Math.PI * 2)));
    if (!this.ankleChecked && this.actT >= T.moves.ankleCheckAt) { this.ankleChecked = true; g.ankleCheck(this); }
    if (this.actT >= this.actDur) this.setAct('free');
  }

  private tickDunk(dt: number, g: GameScene) {
    const d = T.dunk, p = clamp(this.actT / d.hitAt, 0, 1);
    const e = 1 - Math.pow(1 - p, 2);
    const tx = T.hoop.x - 40;
    this.x = lerp(this.dunkFrom.x, tx, e);
    this.z = lerp(this.dunkFrom.z, 0, e);
    const u = clamp(this.actT / d.airtime, 0, 1);
    this.h = d.height * 4 * u * (1 - u);
    this.vh = 0;
    if (!this.dunkHit && this.actT >= d.hitAt) { this.dunkHit = true; g.dunkHit(this); }
    if (this.actT >= d.airtime) { this.h = 0; this.setAct('recover', 0.2); g.fx.dust(this.x, this.sy, 8, 0); }
    void dt;
  }

  computeCarried(g: GameScene) {
    const r = this.puppet.cur;
    const f = this.facing;
    if (this.act === 'shoot' || this.act === 'dunk' || (this.act === 'release' && this.actT < 0.05)) {
      this.carried = { x: this.x + f * (r.fHx + 4), z: this.z, h: this.h + r.fHy + 10, depthBias: 0.6 };
      return;
    }
    const bounce = Math.abs(Math.cos(Math.PI * ((g.gt / T.ball.dribblePeriod) % 1)));
    const targetOx = this.handSide > 0 ? 32 : 2;
    this.ballOx += (targetOx - this.ballOx) * Math.min(1, 16 * (1 / 60));
    const low = clamp(Math.abs(this.ballOx - targetOx) / 18, 0, 1);
    const topH = 58 + (this.act === 'free' && Math.abs(this.vx) > 200 ? 8 : 0);
    let h = T.ball.r + (topH - T.ball.r) * bounce;
    h = lerp(h, 26, low);
    let ox = this.ballOx + clamp(this.vx * this.facing * 0.045, -6, 12);
    if (this.act === 'fall') h = 12;
    if (this.moveKind === 'btb' && this.act === 'juke') {
      const p = clamp(this.actT / this.actDur, 0, 1);
      ox = lerp(32, -14, Math.sin(p * Math.PI)) ; h = lerp(h, 54, Math.sin(p * Math.PI));
    }
    this.carried = { x: this.x + f * ox, z: this.z, h: this.h + h, depthBias: this.ballOx < 14 || (this.moveKind === 'btb' && this.act === 'juke') ? -0.4 : 0.4 };
  }

  render(dt: number, g: GameScene) {
    const r = this.targetRig(dt, g);
    this.puppet.ease(r, dt, this.act === 'fall' ? 18 : 26);
    const p = this.puppet;
    p.setFacing(this.facing * this.spinFlat);
    p.root.setPosition(this.x, this.sy - this.h);
    p.root.setDepth(this.sy);
  }

  private targetRig(dt: number, g: GameScene): Rig {
    const r = restRig();
    const f = this.facing;
    const speed = Math.hypot(this.vx, this.vz);
    const S = clamp(speed / 360, 0, 1);
    const along = this.vx * f;
    const vel = Math.abs(along) > 30 ? along : Math.abs(this.vz) * 0.9;
    this.ph += vel * dt * 0.052;
    const A = S > 0.04 ? 12 + 22 * S : 0;
    const ph = this.ph;
    const o = g.opp(this);
    const defending = !this.hasBall && o.hasBall;
    const air = this.h > 4;
    let ballHand: 'f' | 'b' | null = null;
    const hands = (fx: number, fy: number, bx: number, by: number) => {
      const sh = this.puppet.shoulder(r);
      r.fHx = sh.x + fx; r.fHy = sh.y + fy; r.bHx = sh.x + bx; r.bHy = sh.y + by;
    };

    r.hipY = 86 - Math.abs(Math.sin(ph)) * 4 * S;
    r.lean = along < -30 ? -0.05 : 0.05 + 0.22 * S;
    r.fFx = 8 + Math.sin(ph) * A; r.fFy = Math.max(0, Math.cos(ph)) * A * 0.7;
    r.bFx = -8 - Math.sin(ph) * A; r.bFy = Math.max(0, -Math.cos(ph)) * A * 0.7;
    r.fAnk = r.fFy * 0.02; r.bAnk = r.bFy * 0.02;
    hands(6 - Math.sin(ph) * 22 * S, -60 + Math.abs(Math.cos(ph)) * 8 * S, -4 + Math.sin(ph) * 22 * S, -60);

    if (this.hasBall && (this.act === 'free' || this.act === 'juke' || this.act === 'recover' || this.act === 'stagger')) {
      r.hipY = 81 - Math.abs(Math.sin(ph)) * 3 * S;
      r.lean = (along < -30 ? 0.04 : 0.14) + 0.14 * S;
      ballHand = this.handSide > 0 ? 'f' : 'b';
      const c = this.carried;
      const bx = (c.x - this.x) * f, by = c.h - this.h + 2;
      if (ballHand === 'f') { r.fHx = bx; r.fHy = by; hands(0, 0, 18, -22); r.fHx = bx; r.fHy = by; }
      else { r.bHx = bx; r.bHy = by; const sx = r.bHx, sy = r.bHy; hands(26, -18, 0, 0); r.bHx = sx; r.bHy = sy; }
      if (this.act === 'juke') {
        const p = clamp(this.actT / this.actDur, 0, 1);
        r.lean = 0.28; r.hipY = 72 + 8 * Math.sin(p * Math.PI * 0.5);
        r.fFx = 20; r.bFx = -18;
      }
    } else if (defending && this.act === 'free') {
      r.hipY = 77 - Math.abs(Math.sin(ph)) * 3 * S; r.lean = 0.1;
      r.fFx = 16 + Math.sin(ph) * A * 0.6; r.bFx = -16 - Math.sin(ph) * A * 0.6;
      const sw = Math.sin(this.tAlive * 7) * 4;
      hands(38, 6 + sw, 26, -4 - sw);
    }

    switch (this.act) {
      case 'shoot': {
        const S0 = T.shot.sweet, m = this.meter;
        const u = smooth((m - 0.28) / (S0 - 0.28));
        r.hipY = m < 0.28 ? 86 - 14 * smooth(m / 0.28) : 72 + 21 * u;
        r.lean = this.fade ? -0.22 : 0.1 + 0.08 * (1 - u);
        const fx = lerp(24, 12, u), fy = lerp(-34, 66, u);
        hands(fx, fy, lerp(30, 24, u), lerp(-28, 50, u));
        r.fFx = air ? 14 : 12; r.bFx = air ? -8 : -12; r.fFy = r.bFy = air ? 12 : 0;
        r.fAnk = r.bAnk = air ? 0.55 : 0;
        break;
      }
      case 'release': {
        const t = clamp(this.actT / 0.3, 0, 1);
        r.hipY = 90; r.lean = 0.04;
        hands(lerp(12, 28, t), lerp(66, 42, t), lerp(24, 30, t), lerp(50, 24, t));
        r.fFx = 14; r.bFx = -8; r.fFy = r.bFy = air ? 12 : 0; r.fAnk = r.bAnk = air ? 0.55 : 0;
        break;
      }
      case 'block': {
        r.hipY = 90; r.lean = 0.02;
        hands(16, 68, 8, 66);
        r.fFx = 12; r.bFx = -10; r.fFy = r.bFy = air ? 14 : 0; r.fAnk = r.bAnk = air ? 0.5 : 0;
        break;
      }
      case 'swipe': {
        const u = Math.sin(clamp(this.actT / this.actDur, 0, 1) * Math.PI);
        r.hipY = 76 - 6 * u; r.lean = 0.1 + 0.25 * u;
        hands(30 + 44 * u, -48 + 26 * u, 18, -10);
        r.fFx = 22; r.bFx = -18;
        break;
      }
      case 'shove': {
        const u = Math.sin(clamp(this.actT / this.actDur, 0, 1) * Math.PI);
        r.hipY = 78; r.lean = 0.12 + 0.2 * u;
        hands(10 + 44 * u, -2, 6 + 30 * u, 4);
        r.fFx = 22; r.bFx = -16;
        break;
      }
      case 'stagger': {
        const w = Math.sin(this.actT * 38) * 18;
        r.hipY = 80; r.lean = -0.3;
        hands(20 + w, 10, -10 - w, 24);
        r.fFx = 20 + w * 0.5; r.bFx = -20; r.bFy = 8;
        break;
      }
      case 'fall': {
        const f1 = clamp(this.actT / 0.22, 0, 1), f2 = clamp((this.actT - 0.8) / 0.35, 0, 1);
        r.fall = smooth(f1) * (1 - smooth(f2));
        r.hipY = 80; r.lean = -0.1;
        hands(24, 4, -14, 14);
        r.fFx = 24; r.bFx = -4; r.fFy = 10;
        break;
      }
      case 'dunk': {
        const u = clamp(this.actT / T.dunk.airtime, 0, 1);
        r.fFx = 20; r.bFx = -16; r.fFy = r.bFy = air ? 16 : 0; r.fAnk = r.bAnk = 0.5;
        if (u < 0.16) { r.hipY = 70; r.lean = 0.25; hands(24, -34, 22, -30); }
        else if (u < 0.55) {
          const k = smooth((u - 0.16) / 0.39);
          r.hipY = 92; r.lean = 0.12;
          if (this.trickDunk) {
            const a = -Math.PI / 2 + k * Math.PI * 2.2;
            hands(Math.cos(a) * 56, Math.sin(a) * 56, 14, 40);
          } else hands(lerp(24, 36, k), lerp(-34, 70, k), lerp(22, 20, k), lerp(-30, 58, k));
        } else {
          const k = smooth((u - 0.55) / 0.15);
          r.hipY = 92; r.lean = 0.2;
          hands(lerp(36, 38, k), lerp(70, 8, k), 22, lerp(58, 40, k));
        }
        break;
      }
      case 'recover': r.hipY = 78; r.lean = 0.18; break;
      default: break;
    }
    if (this.act === 'juke') {
      const p = clamp(this.actT / this.actDur, 0, 1);
      if (this.moveKind === 'spin') r.lean = 0.3;
      if (this.moveKind === 'btb') { r.lean = 0.2; hands(8, -26, 4, -34); r.bHx = (this.carried.x - this.x) * f; r.bHy = this.carried.h - this.h; }
      void p;
    }
    return r;
  }

  destroy() { this.puppet.destroy(); }
}
