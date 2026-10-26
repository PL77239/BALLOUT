import Phaser from 'phaser';
import { Puppet, restRig } from './puppet';
import { poseOf } from './anim';
import { Loadout } from './loadout';
import { Intent, emptyIntent } from './input';
import { T } from './tuning';
import { clamp, lerp, smooth } from './pixel';
import type { BossStats } from './bosses';
import { PLAYER_STATS } from './bosses';
import type { GameScene } from './game';

export type Act = 'free' | 'shoot' | 'release' | 'juke' | 'dunk' | 'swipe' | 'block' | 'shove' | 'stagger' | 'fall' | 'recover';
export type MoveKind = 'cross' | 'spin' | 'btb';

const MOVE_DUR = T.moves.dur;
type Buffered = 'shootDown' | 'a' | 'b' | 'c' | 'shove';
const BUFFERED: Buffered[] = ['shootDown', 'a', 'b', 'c', 'shove'];

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
  dunkSlam = false;
  dunkSlamAt = 0;
  swipeHit = false;
  shoveHit = false;
  pumpedT = 0;
  lastDirZ = 1;
  ph = 0;
  I: Intent = emptyIntent();
  anim = { prevV: 0, acc: 0, guard: 0, air: false };
  mood: '' | 'hype' | 'down' = '';
  moodT = 0;
  celeb = 0;
  wasAir = false;
  tAlive = 0;
  carried = { x: 0, z: 0, h: 0, depthBias: 0.3 };
  meterInfo = { green: 0, contest: 0 };
  warnCD = 0;
  immuneT = 0;
  sprintT = 0;
  stats: BossStats = PLAYER_STATS;
  staminaMax = T.stamina.max;
  private buf: Record<Buffered, number> = { shootDown: 0, a: 0, b: 0, c: 0, shove: 0 };

  constructor(scene: Phaser.Scene, public id: number, public loadout: Loadout, stats: BossStats = PLAYER_STATS) {
    this.stats = stats;
    this.staminaMax = T.stamina.max * (0.78 + stats.stamina / 130);
    this.stamina = this.staminaMax;
    this.puppet = new Puppet(scene, loadout);
    this.puppet.snap(restRig());
  }

  /** Wider green when fresh and skilled; tight when gassed. */
  private timingScale(_g: GameScene): number {
    const st = this.stamina / this.staminaMax;
    const acc = this.stats.accuracy / 99;
    return (0.62 + 0.55 * st) * (0.78 + 0.44 * acc);
  }

  dunkWindowSec(g: GameScene): number {
    return (T.dunk.windowSec + this.stats.accuracy * 0.00035) * this.timingScale(g);
  }

  setLoadout(l: Loadout) { this.loadout = l; this.puppet.dress(l); }

  reset(x: number, z: number, hasBall: boolean) {
    this.x = x; this.z = z; this.vx = this.vz = 0; this.h = this.vh = 0;
    this.act = 'free'; this.actT = 0; this.hasBall = hasBall;
    this.meter = 0; this.comboN = 0; this.protectT = 0; this.pickupLock = 0; this.mood = ''; this.moodT = 0;
    this.shoved = false; this.sprintT = 0; this.stamina = this.staminaMax;
    for (const k of BUFFERED) this.buf[k] = 0;
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
    let w = T.shot.greenHalf * Math.max(0.55, f) * (1 - T.shot.contestPenalty * c) * this.timingScale(g);
    if (this.fade) w *= T.shot.fadePenalty;
    if (this.fade) w *= 1 + T.shot.fadeContest * 0.3;
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
    const sp = (kind === 'btb' ? 1.15 : kind === 'spin' ? 0.95 : 1) * (this.comboN > 1 && kind === prev ? 0.8 : 1) * T.moves.dash;
    this.dash = kind === 'btb'
      ? { x: (dirX || 1) * 330 * sp, z: dirZ * 90 }
      : kind === 'spin'
        ? { x: (dirX || 1) * 250 * sp, z: dirZ * 250 * sp }
        : { x: dirX * 150 * T.moves.dash + this.facing * 70, z: dirZ * 330 * sp };
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
    const err = perfect ? 0 : Math.sign(e) * (9 + (Math.abs(e) - green) * T.shot.missK) + (g.rand() - 0.5) * 8;
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
    this.dunkSlam = false;
    this.dunkSlamAt = 0;
    this.trickDunk = this.comboN >= 2 && g.gt - this.comboT < 1.4;
    this.stamina = Math.max(0, this.stamina - 14);
    g.fx.dust(this.x, this.sy, 6, 0);
    return true;
  }

  startSwipe() {
    this.setAct('swipe', T.steal.swipe); this.swipeHit = false;
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
    if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0) this.mood = ''; }
    if (this.fireT > 0) { this.fireT -= dt; if (this.fireT <= 0) this.heat = 0; }
    else this.heat = Math.max(0, this.heat - T.heat.decay * dt);
    this.actT += dt;

    const moving = Math.abs(I.mx) + Math.abs(I.mz) > 0.15;
    const sprinting = I.sprint && moving && this.stamina > 3 && (this.act === 'free');
    this.sprintT = sprinting ? this.sprintT + dt : 0;
    if (sprinting) this.stamina = Math.max(0, this.stamina - T.stamina.sprintDrain * dt);
    else this.stamina = Math.min(this.staminaMax, this.stamina + (T.stamina.regen + (moving ? 0 : T.stamina.regenIdleBonus)) * dt);

    for (const k of BUFFERED) this.buf[k] = I[k] ? T.input.buffer : Math.max(0, this.buf[k] - dt);
    if (!I.shootHeld) this.buf.shootDown = 0;
    const canAct = this.act === 'free' || (this.act === 'juke' && this.actT > this.actDur * 0.4);
    if (canAct) {
      if (this.hasBall) {
        if (this.buf.shootDown > 0) { this.buf.shootDown = 0; this.startShoot(g); }
        else if (this.buf.a > 0) { this.buf.a = 0; this.startMove('cross', g); }
        else if (this.buf.b > 0) { this.buf.b = 0; this.startMove('spin', g); }
        else if (this.buf.c > 0) { this.buf.c = 0; if (!this.startDunk(g)) this.startMove('btb', g); }
      } else if (this.act === 'free') {
        if (this.buf.shootDown > 0) { this.buf.shootDown = 0; this.startBlock(); }
        else if (this.buf.a > 0) { this.buf.a = 0; this.startSwipe(); }
      }
    }
    if (this.act === 'free' && this.buf.shove > 0 && this.shoveCD <= 0) { this.buf.shove = 0; this.startShove(g); }

    switch (this.act) {
      case 'free': this.locomote(dt, I, sprinting, 1, g); break;
      case 'shoot': this.tickShoot(dt, I, g); break;
      case 'release':
        this.airPhysics(dt); this.vx *= Math.exp(-3 * dt);
        this.x += this.vx * dt;
        if (this.h <= 0 && this.actT > this.actDur) this.setAct('recover', 0.12);
        break;
      case 'juke': this.tickJuke(dt, I, g); break;
      case 'dunk': this.tickDunk(dt, I, g); break;
      case 'swipe':
        this.locomote(dt, I, false, 0.3, g);
        if (!this.swipeHit && this.actT > 0.06 && this.actT < 0.17) { this.swipeHit = g.resolveSwipe(this); }
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
    let spd = (sprint ? m.sprint : m.walk) * (0.78 + this.stats.speed / 115);
    if (this.hasBall) spd *= m.ballMult;
    if (this.stamina < T.stamina.lowAt) spd *= 0.86;
    if (this.fireOn) spd *= 1.06;
    const o = g.opp(this);
    if (!this.hasBall && o.hasBall) {
      const stick = 0.55 + this.stats.defense / 130;
      const their = 0.55 + o.stats.speed / 130;
      spd *= clamp(stick / their, 0.72, 1.08);
    }
    if (o.I.checkHeld && !o.hasBall && this.hasBall && Math.abs(o.x - this.x) < 100 && Math.abs(o.z - this.z) < 40) {
      spd *= 0.72; this.stamina = Math.max(0, this.stamina - 6 * dt);
    }
    if (this.hasBall && this.act === 'free' && o.pumpedT > 0) spd *= 1;
    const tx = I.mx * spd * mul, tz = I.mz * spd * m.zFactor * mul;
    const burst = sprint && this.sprintT < m.burstTime ? 1 + (m.burst - 1) * (1 - this.sprintT / m.burstTime) : 1;
    this.vx = this.step(this.vx, tx, this.rate(this.vx, tx, burst) * dt);
    this.vz = this.step(this.vz, tz, this.rate(this.vz, tz, burst) * dt);
    this.x += this.vx * dt; this.z += this.vz * dt;
    if (sprint && Math.abs(this.vx) > m.sprintFloor && Math.random() < dt * 9) g.fx.dust(this.x - this.facing * 10, this.sy, 1, -Math.sign(this.vx), 0.5);
  }

  /** Acceleration for one axis: hard brake when released, boosted turn-around when reversing, burst when a sprint starts. */
  private rate(v: number, t: number, burst: number) {
    const m = T.move;
    if (Math.abs(t) < 1) return m.stopAccel;
    if (v * t < 0) return m.accel * m.turnMult * burst;
    return m.accel * burst;
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
    if (I.shootUp || !I.shootHeld) {
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
    if (!this.ankleChecked && this.actT >= T.moves.ankleCheckAt) { this.ankleChecked = true; g.ankleCheck(this); }
    if (this.actT >= this.actDur) this.setAct('free');
  }

  private tickDunk(dt: number, I: Intent, g: GameScene) {
    const d = T.dunk, p = clamp(this.actT / d.hitAt, 0, 1);
    const e = 1 - Math.pow(1 - p, 2);
    const tx = T.hoop.x - 40;
    this.x = lerp(this.dunkFrom.x, tx, e);
    this.z = lerp(this.dunkFrom.z, 0, e);
    const u = clamp(this.actT / d.airtime, 0, 1);
    this.h = d.height * 4 * u * (1 - u);
    this.vh = 0;
    if (!this.dunkSlam && (I.shootDown || I.shootUp)) { this.dunkSlam = true; this.dunkSlamAt = this.actT; }
    if (!this.dunkHit && this.actT >= d.hitAt) {
      this.dunkHit = true;
      const sweet = d.hitAt, window = this.dunkWindowSec(g);
      const t = this.dunkSlam ? this.dunkSlamAt : sweet;
      const perfect = this.dunkSlam && Math.abs(t - sweet) <= window;
      if (!this.dunkSlam || Math.abs(t - sweet) <= window * 1.08) g.dunkHit(this, perfect);
      else g.dunkMiss(this);
    }
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

  simPose(dt: number, g: GameScene) {
    const { rig, pinF, pinB } = poseOf(this, g, dt);
    const p = this.puppet;
    const air = this.h > 4;
    if (air && !this.wasAir) p.kick('hipY', 260);
    if (!air && this.wasAir) p.kick('hipY', -460);
    this.wasAir = air;
    p.setFacing(this.facing);
    p.simulate(rig, dt, { f: pinF, b: pinB }, { f: this.vx * this.facing, h: this.vh });
  }

  render() {
    const p = this.puppet;
    p.setFacing(this.facing);
    p.paint();
    p.root.setPosition(this.x, this.sy - this.h).setDepth(this.sy);
  }

  destroy() { this.puppet.destroy(); }
}
