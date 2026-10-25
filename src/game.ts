import Phaser from 'phaser';
import { H, T, W, AiLevel } from './tuning';
import { buildCourt, COURTS, CourtId, CourtScene } from './courts';
import { Ball, ShotInfo } from './ball';
import { Hooper } from './hooper';
import { Brain } from './ai';
import { FX, FONT } from './fx';
import { Controller, MenuNav, emptyIntent, makeControllers, Intent } from './input';
import { PRESETS } from './loadout';

export interface GameCfg {
  mode: '1p' | '2p' | 'sim';
  court: CourtId;
  look1: number;
  look2: number;
  level: AiLevel;
  target: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

type Phase = 'intro' | 'live' | 'point' | 'over';

export class GameScene extends Phaser.Scene {
  cfg!: GameCfg;
  hoopers: Hooper[] = [];
  ball!: Ball;
  fx!: FX;
  time_ = 0;
  get gt() { return this.time_; }
  needsClear = false;
  cleared = true;
  phase: Phase = 'intro';
  private phaseT = 0;
  private court!: CourtScene;
  private ctrls: (Controller | null)[] = [null, null];
  private brains: (Brain | null)[] = [null, null];
  private hoopBack!: Phaser.GameObjects.Graphics;
  private hoopFront!: Phaser.GameObjects.Graphics;
  private shadows!: Phaser.GameObjects.Graphics;
  private meterG!: Phaser.GameObjects.Graphics;
  private hudG!: Phaser.GameObjects.Graphics;
  private auras: Phaser.GameObjects.Image[] = [];
  private scoreTxt!: Phaser.GameObjects.Text;
  private subTxt!: Phaser.GameObjects.Text;
  private nameTxt: Phaser.GameObjects.Text[] = [];
  private fireTxt: Phaser.GameObjects.Text[] = [];
  private banner!: Phaser.GameObjects.Text;
  private bannerSub!: Phaser.GameObjects.Text;
  private pauseUi: Phaser.GameObjects.GameObject[] = [];
  private paused = false;
  private nav = new MenuNav();
  private timeScale = 1;
  private slowT = 0;
  private hitT = 0;
  private realT = 0;
  private winner: Hooper | null = null;
  private punchTimer?: Phaser.Time.TimerEvent;

  constructor() { super('game'); }

  init(cfg: GameCfg) { this.cfg = cfg; }

  create() {
    const cfg = this.cfg;
    this.hoopers = []; this.auras = []; this.nameTxt = []; this.fireTxt = []; this.pauseUi = [];
    this.time_ = 0; this.realT = 0; this.paused = false; this.winner = null; this.timeScale = 1; this.slowT = 0; this.hitT = 0; this.overT = 0;
    this.cameras.main.setBackgroundColor('#000000');
    this.court = buildCourt(this, cfg.court);
    this.fx = new FX(this);
    this.shadows = this.add.graphics().setDepth(-600);
    this.hoopBack = this.add.graphics().setDepth(T.court.floorY - 4);
    this.hoopFront = this.add.graphics().setDepth(T.court.floorY + 1);
    this.drawHoopBack();
    this.meterG = this.add.graphics().setDepth(3000);
    this.hudG = this.add.graphics().setDepth(6000);

    this.ball = new Ball(this, {
      onScore: (info, clean) => this.onScore(info, clean),
      onRim: (sp) => { if (sp > 120) { this.fx.sparks(this.ball.x, this.ball.sy, 4, 0xffb060, 160); } },
      onBoard: (sp) => { if (sp > 120) this.fx.ring(this.ball.x, this.ball.sy, 0xffffff, 8, 120, 0.2); },
      onFloor: (sp) => { if (sp > 300) this.fx.dust(this.ball.x, T.court.floorY + this.ball.z, 2, 0, 0.5); },
      onWall: () => { this.cameras.main.shake(60, 0.002); },
    });

    const l2 = cfg.look2 === cfg.look1 ? (cfg.look1 + 1) % PRESETS.length : cfg.look2;
    this.hoopers = [new Hooper(this, 0, PRESETS[cfg.look1]), new Hooper(this, 1, PRESETS[l2])];
    this.hoopers.forEach((h) => {
      h.onIgnite = () => this.onIgnite(h);
      const a = this.add.image(0, 0, 'glow').setTint(0xff7a1a).setBlendMode(Phaser.BlendModes.ADD).setDepth(-300).setVisible(false);
      this.auras.push(a);
    });
    const [c1, c2] = makeControllers(cfg.mode === '2p');
    this.ctrls = [cfg.mode === 'sim' ? null : c1, cfg.mode === '2p' ? c2 : null];
    this.brains = [cfg.mode === 'sim' ? new Brain(cfg.level) : null, cfg.mode === '2p' ? null : new Brain(cfg.level)];
    this.hoopers[0].isCpu = cfg.mode === 'sim';
    this.hoopers[1].isCpu = cfg.mode !== '2p';
    this.buildHud();
    this.resetPositions(0);
    this.phase = 'intro'; this.phaseT = 1.9;
    this.showBanner('CHECK BALL', `FIRST TO ${cfg.target}  //  ARC = 2  INSIDE = 1  DUNK = 2  //  NO FOULS`, 1.7);
    (window as unknown as { __g: GameScene }).__g = this;
  }

  opp(h: Hooper) { return this.hoopers[1 - h.id]; }
  distToHoop(x: number, z: number) { return Math.hypot(T.hoop.x - x, z * T.zScale); }
  get holder(): Hooper | null { return this.hoopers.find((h) => h.hasBall) ?? null; }

  private buildHud() {
    const txt = (x: number, y: number, s: string, size: number, color = '#ffffff', stroke = 6) =>
      this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#08080c', strokeThickness: stroke }).setDepth(6100);
    this.scoreTxt = txt(W / 2, 14, '0 : 0', 58).setOrigin(0.5, 0);
    this.subTxt = txt(W / 2, 76, '', 15, '#c8c8d4', 4).setOrigin(0.5, 0);
    const nameSet = (i: number, x: number, ox: number) => {
      this.nameTxt.push(txt(x, 16, '', 24, i === 0 ? '#ffd24a' : '#7fd4ff', 5).setOrigin(ox, 0));
      this.fireTxt.push(txt(x, 66, 'ON FIRE', 18, '#ff8a2a', 4).setOrigin(ox, 0).setVisible(false));
    };
    nameSet(0, 28, 0); nameSet(1, W - 28, 1);
    this.banner = txt(W / 2, 250, '', 80, '#ffffff', 10).setOrigin(0.5).setAlpha(0).setDepth(6200);
    this.bannerSub = txt(W / 2, 312, '', 22, '#ffe45e', 6).setOrigin(0.5).setAlpha(0).setDepth(6200);
  }

  showBanner(main: string, sub = '', dur = 1.2, color = '#ffffff') {
    this.banner.setText(main).setColor(color).setAlpha(1).setScale(0.6);
    this.bannerSub.setText(sub).setAlpha(sub ? 1 : 0);
    this.tweens.killTweensOf([this.banner, this.bannerSub]);
    this.tweens.add({ targets: this.banner, scale: 1, duration: 160, ease: 'Back.Out' });
    this.tweens.add({ targets: [this.banner, this.bannerSub], alpha: 0, delay: dur * 1000, duration: 300 });
  }

  popupAt(h: Hooper, text: string, color = '#ffe45e', size = 28) {
    this.fx.popup(h.x + (Math.random() - 0.5) * 30, h.sy - h.h - 205, text, color, size);
  }

  slowmo(scale: number, dur: number) { this.timeScale = scale; this.slowT = dur; }
  hitstop(d: number) { this.hitT = Math.max(this.hitT, d); }
  shake(ms: number, i: number) { this.cameras.main.shake(ms, i); }

  punch(x: number, y: number) {
    const cam = this.cameras.main;
    cam.zoomTo(1.14, 120); cam.pan(clamp(x, 562, W - 562), clamp(y - 60, 316, H - 316), 120, 'Sine.easeOut', true);
    this.punchTimer?.remove();
    this.punchTimer = this.time.delayedCall(520, () => { cam.zoomTo(1, 320); cam.pan(W / 2, H / 2, 320, 'Sine.easeInOut', true); });
  }

  resetPositions(scorerIdx: number) {
    const off = this.hoopers[scorerIdx], def = this.opp(off);
    const cx = T.hoop.x - T.arcR - 40;
    off.reset(cx, 0, true); def.reset(cx + 90, 0, false);
    off.facing = 1; def.facing = -1;
    off.puppet.snap(off.puppet.cur);
    this.ball.owner = off; this.ball.mode = 'held'; this.ball.info = null; this.ball.fire = false;
    this.needsClear = false; this.cleared = true;
  }

  private onIgnite(h: Hooper) {
    this.showBanner(`${this.nameOf(h)} IS ON FIRE`, 'GREEN WINDOW +60%  //  FASTER  //  UNTIL THEY SCORE', 1.3, '#ff8a2a');
    this.fx.ring(h.x, h.sy - 90, 0xff7a1a, 30, 500, 0.5);
    this.shake(260, 0.01);
  }

  nameOf(h: Hooper) { return h.isCpu && this.cfg.mode !== 'sim' ? 'CPU' : `P${h.id + 1}`; }

  launchShot(h: Hooper, q: { perfect: boolean; err: number; green: number; m: number; e: number }) {
    const b = this.ball, hp = T.hoop;
    const x0 = h.x + h.facing * 8, z0 = h.z, h0 = h.h + h.puppet.cur.fHy + 10;
    b.setHeld(x0, z0, h0);
    const dist = Math.abs(hp.x - x0);
    const tt = 0.55 + dist / 1500;
    const vx = (hp.x + q.err - x0) / tt, vz = (0 - z0) / tt, vh = (hp.rimH - h0) / tt + 0.5 * T.ball.g * tt;
    const pts = this.distToHoop(h.x, h.z) >= T.arcR ? T.rules.arcPts : T.rules.insidePts;
    const info: ShotInfo = { shooter: h, perfect: q.perfect, pts, age: 0, scored: false, dunk: false, green: q.green, touchedRim: false };
    b.fire = h.fireOn;
    b.launch(vx, vz, vh, info);
    h.hasBall = false; b.lastOwner = h;
    h.pickupLock = 0.4;
    if (q.perfect) this.popupAt(h, h.meterInfo.contest > 0.3 ? 'PERFECT  (CONTESTED)' : 'PERFECT', '#4dff88', 22);
    else this.popupAt(h, q.e < 0 ? 'EARLY' : 'LATE', '#ff6a5a', 20);
  }

  private onScore(info: ShotInfo, clean: boolean) {
    if (this.phase !== 'live') return;
    const h = info.shooter, o = this.opp(h);
    h.score += info.pts;
    h.gainHeat(14 + (info.perfect ? 10 : 0));
    if (o.fireOn) { o.fireT = 0; o.heat = 0; this.popupAt(o, 'COOLED OFF', '#9fe8ff', 22); }
    const sx = T.hoop.x, sy = T.court.floorY - T.hoop.rimH;
    this.fx.sparks(sx, sy + 10, 18, info.perfect ? 0x7dffb0 : 0xffd060, 380);
    this.fx.ring(sx, sy + 14, 0xffffff, 14, 300, 0.4);
    const label = info.dunk ? 'SLAM' : clean ? (info.perfect ? 'SWISH' : 'NOTHING BUT NET') : info.touchedRim ? 'RATTLES IN' : 'BUCKET';
    this.fx.popup(sx - 40, sy - 70, `${label}  +${info.pts}`, info.pts > 1 ? '#ffd24a' : '#ffffff', 40, 60);
    this.shake(info.pts > 1 ? 160 : 90, info.pts > 1 ? 0.008 : 0.004);
    this.afterPoint(h);
  }

  private afterPoint(scorer: Hooper) {
    if (scorer.score >= this.cfg.target) {
      this.phase = 'over'; this.winner = scorer; this.overT = 0;
      this.slowmo(0.4, 0.9);
      this.showBanner(`${this.nameOf(scorer)} WINS`, `${this.hoopers[0].score} - ${this.hoopers[1].score}   //   ENTER / X = REMATCH   //   BACKSPACE / O = MENU`, 600, '#ffd24a');
      return;
    }
    this.phase = 'point'; this.phaseT = 1.7;
    this.nextOffense = T.rules.makeItTakeIt ? scorer.id : 1 - scorer.id;
  }
  private nextOffense = 0;
  private overT = 0;

  dunkHit(h: Hooper) {
    const o = this.opp(h);
    const hp = T.hoop;
    const blocked = (o.act === 'block' && o.h > 35 && Math.abs(o.x - (h.x + h.facing * 20)) < 80 && Math.abs(o.z - h.z) < 42);
    if (blocked) {
      this.ball.release(h); h.hasBall = false;
      this.ball.setHeld(h.x + h.facing * 30, h.z, h.h + 200);
      this.ball.vx = -h.facing * 260; this.ball.vh = 220; this.ball.vz = 0;
      this.ball.mode = 'loose'; this.ball.info = null;
      h.pickupLock = 0.5;
      this.fx.ring(h.x + h.facing * 30, h.sy - h.h - 200, 0xffffff, 12, 380, 0.3);
      this.fx.sparks(h.x + h.facing * 30, h.sy - h.h - 200, 16, 0xffffff, 420);
      this.popupAt(o, 'DENIED AT THE RIM', '#ff5a3a', 34);
      this.shake(220, 0.014); this.hitstop(0.09); this.slowmo(0.45, 0.25);
      o.gainHeat(22);
      return;
    }
    const posterized = Math.abs(o.x - h.x) < 120 && Math.abs(o.z - h.z) < 50 && o.act !== 'fall';
    h.hasBall = false;
    const b = this.ball;
    b.setHeld(hp.x, 0, hp.rimH - 4);
    b.mode = 'loose'; b.owner = null; b.lastOwner = h; b.noRim = 0.5;
    b.vx = 20; b.vh = -520; b.vz = 0;
    const info: ShotInfo = { shooter: h, perfect: true, pts: T.rules.dunkPts, age: 0, scored: true, dunk: true, green: 0, touchedRim: false };
    b.info = info; b.netKick = 1.3;
    h.gainHeat(24 + (h.trickDunk ? 12 : 0));
    this.fx.dust(hp.x - 40, T.court.floorY, 6, 0);
    this.shake(260, 0.014); this.slowmo(0.35, 0.32);
    this.fx.ring(hp.x, T.court.floorY - hp.rimH, 0xffd060, 20, 460, 0.5);
    this.fx.sparks(hp.x, T.court.floorY - hp.rimH, 24, 0xffa030, 460);
    if (posterized) {
      this.popupAt(h, h.trickDunk ? 'WINDMILL POSTER!' : 'POSTERIZED!', '#ff4fa0', 40);
      o.knock('fall', -o.facing, 220); h.gainHeat(10);
    } else if (h.trickDunk) this.popupAt(h, 'WINDMILL!', '#ff4fa0', 36);
    this.punch(hp.x - 60, T.court.floorY - 160);
    this.onScore(info, true);
  }

  resolveSwipe(h: Hooper): boolean {
    const o = this.opp(h);
    if (!o.hasBall || this.ball.mode !== 'held') return false;
    const dx = (o.x - h.x) * h.facing;
    if (dx < 6 || dx > T.steal.range || Math.abs(o.z - h.z) > T.steal.zRange) return false;
    if (o.protectT > 0 || o.act === 'shoot' || o.act === 'dunk') return false;
    let p = T.steal.base;
    if (Math.abs(o.vx) > 260) p += T.steal.sprintBonus;
    if (o.stamina < T.stamina.lowAt) p += T.steal.lowStaminaBonus;
    if (o.act === 'recover' || o.act === 'stagger') p += 0.25;
    if (Math.random() > clamp(p, 0.1, 0.9)) {
      this.popupAt(h, 'MISSED', '#aab', 16);
      return false;
    }
    o.hasBall = false; o.pickupLock = 0.5;
    h.hasBall = true; this.ball.owner = h; this.ball.mode = 'held'; this.ball.info = null;
    this.needsClear = true; this.cleared = false;
    h.gainHeat(18);
    this.popupAt(h, 'STOLEN!', '#7fd4ff', 34);
    this.fx.ring(this.ball.x, this.ball.sy, 0x9fe8ff, 12, 240, 0.3);
    this.fx.sparks(this.ball.x, this.ball.sy, 10, 0x9fe8ff, 300);
    this.hitstop(0.07); this.shake(100, 0.006);
    return true;
  }

  resolveShove(h: Hooper) {
    const o = this.opp(h);
    const dx = (o.x - h.x) * h.facing;
    if (dx < -14 || dx > T.shove.range || Math.abs(o.z - h.z) > 32 || o.h > 40 || o.act === 'dunk') return;
    o.knock('stagger', h.facing, T.shove.knock);
    this.fx.ring(o.x - h.facing * 14, o.sy - 90, 0xffffff, 10, 220, 0.25);
    this.fx.sparks(o.x - h.facing * 14, o.sy - 90, 8, 0xffffff, 260);
    this.fx.dust(o.x, o.sy, 6, h.facing);
    this.popupAt(o, o.act === 'shoot' || o.act === 'release' ? 'DIRTY SHOVE' : 'SHOVED', '#ff8a5a', 22);
    this.shake(110, 0.007); this.hitstop(0.06);
    h.gainHeat(6);
    if (o.hasBall && this.ball.mode === 'held' && Math.random() < T.shove.fumble) {
      o.hasBall = false; o.pickupLock = 0.5;
      const b = this.ball; b.release(o);
      b.vx = h.facing * 160; b.vh = 220; b.vz = (Math.random() - 0.5) * 120;
      this.popupAt(h, 'STRIPPED!', '#7fd4ff', 30);
    }
  }

  ankleCheck(h: Hooper) {
    const d = this.opp(h);
    const dx = d.x - h.x, dz = d.z - h.z;
    if (Math.abs(dx) > T.moves.ankleRange || Math.abs(dz) > T.moves.ankleZ) return;
    if (d.act === 'fall' || d.act === 'dunk' || d.h > 30) return;
    const wrongWay = d.vz * h.dash.z < -25 || (h.moveKind !== 'cross' && d.vx * Math.sign(h.dash.x || 1) < -120);
    const committed = d.act === 'swipe' || d.act === 'shove' || d.act === 'recover' || d.act === 'stagger';
    if (wrongWay || committed || h.comboN >= 3 || d.stamina < 12) {
      d.knock('fall', -d.facing, 170);
      d.vz = h.dash.z * 0.3;
      this.popupAt(h, h.comboN >= 3 ? 'ANKLES GONE!' : 'ANKLE BREAKER!', '#ff4fa0', 40);
      this.fx.dust(d.x, d.sy, 12, -d.facing, 1.2);
      this.fx.ring(d.x, d.sy - 40, 0xff4fa0, 14, 340, 0.4);
      h.gainHeat(28 + 8 * h.comboN);
      this.slowmo(0.35, 0.4); this.shake(180, 0.01); this.punch(d.x, d.sy);
      this.hitstop(0.05);
    } else {
      h.gainHeat(3);
    }
  }

  private pickups() {
    const b = this.ball;
    const live = b.mode === 'loose' || (b.mode === 'shot' && b.info && !b.info.scored && b.info.touchedRim && b.info.age > 0.25);
    if (!live || this.phase !== 'live') return;
    let best: Hooper | null = null, bd = 1e9;
    for (const h of this.hoopers) {
      if (h.pickupLock > 0 || ['fall', 'stagger', 'shoot', 'dunk', 'swipe'].includes(h.act)) continue;
      const dx = Math.abs(h.x - b.x), dz = Math.abs(h.z - b.z);
      if (dx > 44 || dz > 36) continue;
      if (b.h > h.h + 232 || b.h < 0) continue;
      if (b.h > h.h + 120 && h.h < 20) continue;
      if (Math.hypot(b.vx, b.vh) > 1000) continue;
      const d = dx + dz;
      if (d < bd) { bd = d; best = h; }
    }
    if (!best) return;
    const lastOff = b.lastOwner;
    best.hasBall = true; b.owner = best; b.mode = 'held'; b.info = null; b.fire = false;
    if (best !== lastOff) { this.needsClear = true; this.cleared = false; this.popupAt(best, 'TAKE IT BACK', '#ffe45e', 18); }
    if (best.h > 20) this.popupAt(best, 'BOARD!', '#ffffff', 26);
  }

  private blocks() {
    const b = this.ball;
    if (b.mode !== 'shot' || !b.info || b.info.scored || b.info.age > 0.55) return;
    const d = this.opp(b.info.shooter);
    if (d.act !== 'block') return;
    const hx = d.x + d.facing * 24, hh = d.h + 228;
    if (Math.hypot(b.x - hx, b.h - hh) < 56 && Math.abs(b.z - d.z) < 42) {
      const s = b.info.shooter;
      b.info = null; b.mode = 'loose';
      b.vx = d.facing * (240 + Math.random() * 140); b.vh = 120 + Math.random() * 120; b.vz = (Math.random() - 0.5) * 200;
      s.pickupLock = 0.35;
      this.popupAt(d, 'REJECTED!', '#ff5a3a', 40);
      this.fx.ring(b.x, b.sy, 0xffffff, 12, 400, 0.3);
      this.fx.sparks(b.x, b.sy, 18, 0xffffff, 440);
      this.shake(200, 0.012); this.hitstop(0.09); this.slowmo(0.45, 0.25);
      d.gainHeat(20);
      this.punch(b.x, b.sy);
    }
  }

  private resolveBodies() {
    const [a, b] = this.hoopers;
    if (a.h > 40 || b.h > 40 || a.act === 'dunk' || b.act === 'dunk' || a.act === 'fall' || b.act === 'fall') return;
    const dx = b.x - a.x, dz = b.z - a.z;
    const nx = Math.abs(dx) / 40, nz = Math.abs(dz) / 20;
    if (nx * nx + nz * nz >= 1) return;
    const sx = dx === 0 ? 1 : Math.sign(dx);
    const push = (40 - Math.abs(dx)) * 0.5;
    a.x -= sx * push; b.x += sx * push;
    const sz = dz === 0 ? 1 : Math.sign(dz);
    const pz = (20 - Math.abs(dz)) * 0.25;
    a.z -= sz * pz; b.z += sz * pz;
    if (Math.sign(a.vx) === sx) a.vx *= 0.7;
    if (Math.sign(b.vx) === -sx) b.vx *= 0.7;
  }

  private updateFacing() {
    for (const h of this.hoopers) {
      if (['shoot', 'release', 'dunk', 'block', 'fall'].includes(h.act) || (h.act === 'juke' && h.moveKind === 'spin')) continue;
      const o = this.opp(h);
      if (h.hasBall) h.facing = 1;
      else if (o.hasBall) { const d = o.x - h.x; if (Math.abs(d) > 8) h.facing = Math.sign(d); }
      else { const d = this.ball.x - h.x; if (Math.abs(d) > 12) h.facing = Math.sign(d); }
    }
  }

  update(_t: number, dtMs: number) {
    const real = Math.min(dtMs / 1000, 0.05);
    this.realT += real;
    const startHit = this.ctrls.some((c) => c?.startPressed());
    if (this.paused || startHit) {
      const n = this.nav.poll(real);
      if (startHit && this.phase !== 'over') this.setPaused(!this.paused);
      else if (this.paused && n.back) this.scene.start('menu');
      if (this.paused) return;
    }
    if (this.phase === 'over') {
      const n = this.nav.poll(real);
      this.overT += real;
      if (n.ok && this.overT > 1) { this.scene.restart(this.cfg); return; }
      if (n.back) { this.scene.start('menu'); return; }
    }

    if (this.slowT > 0) { this.slowT -= real; if (this.slowT <= 0) this.slowT = 0; }
    else this.timeScale += (1 - this.timeScale) * Math.min(1, real * 6);
    let dt = real * this.timeScale;
    if (this.hitT > 0) { this.hitT -= real; dt = 0.0001; }
    this.time_ += dt;
    this.court.update(this.realT, real);

    const ints: Intent[] = [emptyIntent(), emptyIntent()];
    for (let i = 0; i < 2; i++) {
      const c = this.ctrls[i];
      let I = c ? c.poll() : emptyIntent();
      const br = this.brains[i];
      if (br && this.phase === 'live') I = br.think(this.hoopers[i], this.hoopers[1 - i], this, dt);
      ints[i] = this.phase === 'live' ? I : emptyIntent();
    }

    if (this.phase === 'intro') { this.phaseT -= real; if (this.phaseT <= 0) this.phase = 'live'; }
    if (this.phase === 'point') {
      this.phaseT -= real;
      if (this.phaseT <= 0) { this.resetPositions(this.nextOffense); this.phase = 'live'; this.showBanner('CHECK', '', 0.6); }
    }

    this.updateFacing();
    for (let i = 0; i < 2; i++) this.hoopers[i].update(dt, ints[i], this);
    this.resolveBodies();
    for (const h of this.hoopers) if (h.hasBall) h.computeCarried(this);
    const hold = this.holder;
    if (hold && this.ball.mode === 'held') {
      const c = hold.carried;
      this.ball.setHeld(c.x, c.z, c.h);
      this.ball.owner = hold;
    }
    this.ball.update(dt);
    this.pickups();
    this.blocks();
    if (this.needsClear && !this.cleared && hold && this.distToHoop(hold.x, hold.z) >= T.arcR + 6) {
      this.cleared = true;
      this.popupAt(hold, 'CLEARED', '#7dffb0', 16);
    }
    this.fx.update(dt);
    this.render(real, dt);
  }

  private setPaused(p: boolean) {
    this.paused = p;
    this.pauseUi.forEach((o) => o.destroy());
    this.pauseUi = [];
    if (!p) return;
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(7000);
    const t = this.add.text(W / 2, H / 2, 'PAUSED\n\nESC / START  -  RESUME\nBACKSPACE / CIRCLE  -  QUIT TO MENU\n\nMOVE  WASD / STICK      SPRINT  SHIFT / R1\nSHOOT  SPACE / X  (HOLD, RELEASE IN GREEN)  TAP = PUMP FAKE\nCROSSOVER J / SQUARE    SPIN K / CIRCLE    DUNK or BEHIND-BACK  L / TRIANGLE\nDEFENSE: STEAL J / SQ   BLOCK-JUMP SPACE / X   HAND-CHECK R / L2\nSHOVE (DIRTY)  E / L1', {
      fontFamily: FONT, fontSize: '26px', color: '#ffffff', align: 'center', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(7001);
    this.pauseUi = [bg, t];
  }

  private drawHoopBack() {
    const g = this.hoopBack, hp = T.hoop, fy = T.court.floorY;
    g.clear();
    const hy = (h: number) => fy - h;
    g.fillStyle(0x1b1d22, 1); g.fillRect(hp.x + 92, hy(400), 12, 400);
    g.fillStyle(0x3a3e46, 1); g.fillRect(hp.x + 92, hy(400), 4, 400);
    g.fillStyle(0x1b1d22, 1); g.fillRect(hp.boardX, hy(382), hp.x + 98 - hp.boardX, 9);
    g.fillStyle(0xe9edf2, 0.92); g.fillRect(hp.boardX, hy(hp.boardH1), 8, hp.boardH1 - hp.boardH0);
    g.lineStyle(2.5, 0x15161a, 1); g.strokeRect(hp.boardX, hy(hp.boardH1), 8, hp.boardH1 - hp.boardH0);
    g.fillStyle(0xd42a2a, 1); g.fillRect(hp.boardX - 1, hy(hp.rimH + 40), 3, 56);
    g.lineStyle(5, 0xe8541a, 1);
    g.lineBetween(hp.x + hp.rimR, hy(hp.rimH), hp.boardX, hy(hp.rimH));
    const back: { x: number; y: number }[] = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI; back.push({ x: hp.x + Math.cos(a) * hp.rimR, y: hy(hp.rimH) + Math.sin(a) * 6 }); }
    g.strokePoints(back as Phaser.Types.Math.Vector2Like[], false);
  }

  private drawHoopFront(t: number) {
    const g = this.hoopFront, hp = T.hoop, fy = T.court.floorY;
    g.clear();
    const hy = fy - hp.rimH;
    const kick = this.ball.netKick;
    const sway = Math.sin(t * 22) * kick * 7;
    const len = 52 + kick * 12;
    g.lineStyle(1.8, 0xffffff, 0.85);
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * 2 - 1;
      const x0 = hp.x + u * hp.rimR, x1 = hp.x + u * hp.rimR * 0.5 + sway;
      g.lineBetween(x0, hy + 3, x1, hy + len);
    }
    for (let r = 1; r <= 3; r++) {
      const k = r / 3.4, y = hy + 3 + (len - 3) * k, w = hp.rimR * (1 - 0.5 * k);
      const off = sway * k;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= n; i++) { const u = (i / n) * 2 - 1; pts.push({ x: hp.x + u * w + off, y: y + (i % 2 ? 5 : 0) }); }
      g.strokePoints(pts as Phaser.Types.Math.Vector2Like[], false);
    }
    g.lineStyle(5, 0xff6a1a, 1);
    const front: { x: number; y: number }[] = [];
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI; front.push({ x: hp.x + Math.cos(a) * hp.rimR, y: hy + Math.sin(a) * 6 }); }
    g.strokePoints(front as Phaser.Types.Math.Vector2Like[], false);
  }

  private render(real: number, dt: number) {
    for (const h of this.hoopers) h.render(dt || 0.0001, this);
    const b = this.ball;
    const hold = this.holder;
    b.fire = b.fire || (!!hold && hold.fireOn);
    if (!hold && b.mode !== 'shot') b.fire = false;
    if (b.fire) this.fx.flame(b.x, b.sy, 1, 6);
    b.draw(T.court.floorY + b.z + 0.1, hold && b.mode === 'held' ? hold.sy + hold.carried.depthBias : undefined);
    this.drawHoopFront(this.realT);

    const s = this.shadows;
    s.clear();
    for (const h of this.hoopers) {
      const k = Math.max(0.4, 1 - h.h / 260);
      s.fillStyle(0x000000, 0.4 * k);
      s.fillEllipse(h.x, h.sy + 3, 62 * k, 13 * k);
      const a = this.auras[h.id];
      if (h.fireOn) {
        a.setVisible(true).setPosition(h.x, h.sy - h.h - 85).setScale(2.2, 3.2).setAlpha(0.55 + Math.sin(this.realT * 20) * 0.12);
        if (Math.random() < 0.8) this.fx.flame(h.x + (Math.random() - 0.5) * 40, h.sy - h.h - Math.random() * 150, 1, 8);
      } else a.setVisible(false);
    }
    this.drawMeters();
    this.drawHud();
    void real;
  }

  private drawMeters() {
    const g = this.meterG;
    g.clear();
    for (const h of this.hoopers) {
      if (h.act !== 'shoot') continue;
      const w = 140, hh = 13, bx = h.x - w / 2, by = h.sy + 24;
      const range = 1.1, S = T.shot.sweet;
      const { green, contest } = h.meterInfo;
      g.fillStyle(0x08080c, 0.85); g.fillRoundedRect(bx - 4, by - 4, w + 8, hh + 8, 6);
      const gx0 = bx + ((S - green) / range) * w, gw = Math.max(3, (green * 2 / range) * w);
      const inZone = Math.abs(h.meter - S) <= green;
      g.fillStyle(0x24363a, 1); g.fillRect(bx, by, w, hh);
      g.fillStyle(inZone ? 0x7dffb0 : 0x35c86a, 1); g.fillRect(gx0, by, gw, hh);
      g.fillStyle(0xffffff, 0.7); g.fillRect(bx + (S / range) * w - 1, by, 2, hh);
      const mx = bx + clamp(h.meter / range, 0, 1) * w;
      g.fillStyle(0x6ac8ff, 0.55); g.fillRect(bx, by, mx - bx, hh);
      g.fillStyle(0xffffff, 1); g.fillRect(mx - 2, by - 4, 4, hh + 8);
      if (contest > 0.25) { g.fillStyle(0xff3a3a, 0.9); g.fillRect(bx, by + hh + 5, w * contest, 3); }
    }
  }

  private drawHud() {
    const g = this.hudG;
    g.clear();
    const [a, b] = this.hoopers;
    this.scoreTxt.setText(`${a.score}  :  ${b.score}`);
    this.subTxt.setText(`${COURTS.find((c) => c.id === this.cfg.court)!.name}  //  TO ${this.cfg.target}`);
    g.fillStyle(0x000000, 0.5); g.fillRoundedRect(W / 2 - 150, 6, 300, 98, 12);
    this.nameTxt[0].setText(`${this.nameOf(a)}  ${a.loadout.name}`);
    this.nameTxt[1].setText(`${b.loadout.name}  ${this.nameOf(b)}`);
    const bars = (h: Hooper, x: number, right: boolean) => {
      const w = 240;
      const x0 = right ? x - w : x;
      g.fillStyle(0x000000, 0.55); g.fillRoundedRect(x0 - 4, 44, w + 8, 44, 6);
      g.fillStyle(0x2a2a30, 1); g.fillRect(x0, 50, w, 12); g.fillRect(x0, 70, w, 10);
      const hf = h.fireOn ? h.fireT / T.heat.fireTime : h.heat / T.heat.max;
      g.fillStyle(h.fireOn ? 0xffc24a : 0xff6a1a, 1);
      g.fillRect(right ? x0 + w - w * hf : x0, 50, w * hf, 12);
      const sf = h.stamina / T.stamina.max;
      g.fillStyle(sf < 0.25 ? 0xff4a4a : 0x4dd0ff, 1);
      g.fillRect(right ? x0 + w - w * sf : x0, 70, w * sf, 10);
    };
    bars(a, 28, false); bars(b, W - 28, true);
    this.fireTxt.forEach((t, i) => { const on = this.hoopers[i].fireOn; t.setVisible(on).setY(92); if (on) t.setAlpha(0.6 + 0.4 * Math.sin(this.realT * 16)); });
    if (this.needsClear && !this.cleared && this.holder && this.phase === 'live') {
      const x = T.hoop.x - T.arcR - 4;
      g.lineStyle(3, 0xffe45e, 0.5 + 0.3 * Math.sin(this.realT * 10));
      for (let y = T.court.floorY - T.court.laneHalf; y < T.court.floorY + T.court.laneHalf; y += 14) g.lineBetween(x, y, x, y + 7);
    }
  }
}
void lerp; void smooth;
