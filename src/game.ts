import { music } from './music';
import { net, closeNet } from './net';
import Phaser from 'phaser';
import { sfx } from './sfx';
import { T, AiLevel } from './tuning';
import { buildCourt, courtInfo, CourtId, CourtScene } from './courts';


import { Ball, ShotInfo } from './ball';
import { Hooper } from './hooper';
import { Brain } from './ai';
import { FX, shadowEllipse } from './fx';
import { Controller, MenuNav, emptyIntent, makeControllers, Intent } from './input';
import { BossStats, PLAYER_STATS, bossAt, bossToLoadout } from './bosses';
import { Loadout } from './loadout';
import { GW, PX, clamp, mix, rng } from './pixel';
import { VH, VIEW_TOP, VW, fixedAt, fixedOrigin, setViewport } from './viewport';
import { Legend, LEGEND_H } from './legend';
import { label, textWidth } from './font';
import { addCash, persist, save, recordRivalWin } from './save';
import { type TimingGrade, timingLabel } from './timing';

export interface GameCfg {
  mode: '1p' | '2p' | 'sim' | 'online';
  netRole?: 'host'|'guest';
  court: CourtId;
  p1: Loadout;
  p2?: Loadout;
  p2Stats?: BossStats;
  rivalIdx?: number;
  level: AiLevel;
  target: number;
  seed?: number;
}

const cfgRival = (cfg: GameCfg) => cfg.mode==='1p' && cfg.rivalIdx!==undefined;

type Phase = 'intro' | 'live' | 'point' | 'over';
type Txt = Phaser.GameObjects.BitmapText;

const SIM_DT = 1 / T.sim.hz;
const GW_WORLD = GW * PX;

const LEVEL_PAY: Record<AiLevel, number> = { rookie: 0.8, hooper: 1, legend: 1.6 };
const STYLE_PAY: [RegExp, number][] = [
  [/ANKLES GONE/, 30], [/ANKLE BREAKER/, 20], [/POSTER/, 25], [/WINDMILL/, 12], [/REJECTED|DENIED/, 14], [/STOLEN/, 8], [/SLAM/, 8], [/SWISH|NOTHING BUT NET/, 5],
];

export interface MatchResult { win: boolean; lines: [string, number][]; total: number }

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
  private netSendT = 0;
  private netSeq = 0;
  private netLastSeq = -1;
  private netReadyAt = 0;
  private netStatus: HTMLDivElement|null = null;
  private guestTarget: any = null;
  private court!: CourtScene;
  private ctrls: (Controller | null)[] = [null, null];
  private brains: (Brain | null)[] = [null, null];
  private shadows!: Phaser.GameObjects.Graphics;
  private dunkHints: Txt[] = [];
  private meterG!: Phaser.GameObjects.Graphics;
  private hudG!: Phaser.GameObjects.Graphics;
  private hud: Record<string, Txt> = {};
  private banner!: Txt;
  private bannerSub!: Txt;
  private legend: Legend | null = null;
  private camX = 0;
  private camV = 0;
  private pauseUi: Phaser.GameObjects.GameObject[] = [];
  private overUi: Phaser.GameObjects.GameObject[] = [];
  private paused = false;
  private nav = new MenuNav();
  private timeScale = 1;
  private slowT = 0;
  private hitT = 0;
  private realT = 0;
  private acc = 0;
  tick = 0;
  seed = 0;
  private rng: () => number = Math.random;
  private latch: Intent[] = [emptyIntent(), emptyIntent()];
  private lastLogged = [-1, -1];
  private inputLog: number[] = [];
  private winner: Hooper | null = null;
  private style = [0, 0];
  private buckets = [0, 0];
  private nextOffense = 0;
  private overT = 0;
  private pointCountdown = 0;
  private pointCountShown = -1;
  private introCountShown = -1;
  result: MatchResult | null = null;

  private static PERFECT_TAGS = ['PERFECT', 'GREEN', 'MONEY', 'SWISH', 'SPLASH', 'CASH', 'BUCKET'];

  constructor() { super('game'); }

  init(cfg: GameCfg) { this.cfg = cfg; }

  shutdown() {
    if(this.cfg.netRole)closeNet();
    this.netStatus?.remove();this.netStatus=null;
    this.court?.destroy();
    this.legend?.destroy();
  }

  create() {
    const cfg = this.cfg;
    this.hoopers = []; this.dunkHints = []; this.hud = {}; this.legend = null; this.pauseUi = []; this.overUi = [];
    this.time_ = 0; this.realT = 0; this.paused = false; this.winner = null; this.timeScale = 1; this.slowT = 0; this.hitT = 0; this.overT = 0;
    this.style = [0, 0]; this.buckets = [0, 0]; this.result = null;
    this.pointCountdown = 0; this.pointCountShown = -1;
    this.acc = 0; this.tick = 0; this.latch = [emptyIntent(), emptyIntent()]; this.lastLogged = [-1, -1]; this.inputLog = [];
    this.seed = (cfg.seed ?? (Math.random() * 0xffffffff)) >>> 0;
    this.rng = rng(this.seed);
    setViewport(this, VW, VH);
    const cam = this.cameras.main;
    cam.setBackgroundColor('#000000'); cam.setZoom(1 / PX);
    this.court = buildCourt(this, cfg.court);
    if (cfg.mode !== 'sim') music.play(cfg.court, this.court.boomX);
    this.fx = new FX(this);
    this.shadows = this.add.graphics().setDepth(-600);
    this.meterG = this.add.graphics().setDepth(3000);
    this.hudG = this.add.graphics().setDepth(6000);

    this.ball = new Ball(this, {
      onScore: (info, clean) => this.onScore(info, clean),
      onRim: (sp) => { if (sp > 120) { this.netSound('rim'); sfx.rim(); this.fx.sparks(this.ball.x, this.ball.sy, 4, 0xffb060, 160); } },
      onBoard: (sp) => { if (sp > 120) { this.netSound('board'); sfx.board(); this.fx.ring(this.ball.x, this.ball.sy, 0xffffff, 8, 120, 0.2); } },
      onFloor: (sp) => { if (sp > 80) {this.netSound('bounce');sfx.bounce(sp / 700);} if (sp > 300) this.fx.dust(this.ball.x, T.court.floorY + this.ball.z, 2, 0, 0.5); },
      onWall: () => { this.cameras.main.shake(60, 0.002); },
    });

    const rival = cfg.p2 ?? bossToLoadout(bossAt(cfg.court, 0));
    const rStats = cfg.mode==='2p' ? PLAYER_STATS : cfg.p2Stats ?? bossAt(cfg.court, cfg.rivalIdx ?? 0).stats;
    this.hoopers = [new Hooper(this, 0, cfg.p1, PLAYER_STATS), new Hooper(this, 1, rival, rStats)];
    this.dunkHints = this.hoopers.map(() => label(this,0,0,'DUNK READY',0x8dffb4,{ox:0.5,depth:3001}).setVisible(false));
    this.hoopers.forEach((h) => { h.onIgnite = () => this.onIgnite(h); });
    const [c1, c2] = makeControllers(cfg.mode === '2p' && !cfg.netRole);
    this.ctrls = [cfg.mode === 'sim' ? null : c1, cfg.mode === '2p' && !cfg.netRole ? c2 : null];
    this.brains = [cfg.mode === 'sim' ? new Brain(cfg.level,cfg.rivalIdx ?? 0) : null, cfg.mode === '2p' ? null : new Brain(cfg.level,cfg.rivalIdx ?? 0)];
    this.hoopers[0].isCpu = cfg.mode === 'sim';
    this.hoopers[1].isCpu = cfg.mode !== '2p';
    this.buildHud();
    this.resetPositions(0);
    this.snapCamera();
    this.phase = 'intro'; this.phaseT = 3.15; this.introCountShown = -1;
    this.showBanner('CHECK BALL', `FIRST TO ${cfg.target}  //  TAP SHOOT IN GREEN`, 1.4);
    (window as unknown as { __g: GameScene }).__g = this;
    this.events.once('shutdown',()=>this.shutdown());
    if(cfg.netRole && net) this.bindNetwork();
  }

  rand() { return this.rng(); }

  opp(h: Hooper) { return this.hoopers[1 - h.id]; }
  distToHoop(x: number, z: number) { return Math.hypot(T.hoop.x - x, z * T.zScale); }
  get holder(): Hooper | null { return this.hoopers.find((h) => h.hasBall) ?? null; }

  private txt(x: number, y: number, s: string, color = 0xffffff, k = 1, ox = 0, oy = 0, depth = 6100) {
    return label(this, fixedAt(x, VW), fixedAt(y, VH), s, color, { k, ox, oy, depth }).setScrollFactor(0);
  }

  private buildHud() {
    const h = this.hud, cx = VW / 2;
    this.hudG.setScrollFactor(0).setPosition(fixedOrigin(VW), fixedOrigin(VH));
    h.scoreA = this.txt(cx - 8, 5, '0', 0xffd24a, 2, 1);
    h.colon = this.txt(cx, 5, ':', 0xffffff, 2, 0.5);
    h.scoreB = this.txt(cx + 8, 5, '0', 0x7fd4ff, 2, 0);
    h.sub = this.txt(cx, 21, '', 0xa8a8c0, 1, 0.5);
    h.nameA = this.txt(6, 3, '', 0xffd24a, 1, 0);
    h.nameB = this.txt(VW - 6, 3, '', 0x7fd4ff, 1, 1);
    h.fireA = this.txt(6, 25, 'ON FIRE', 0xff8a2a, 1, 0).setVisible(false);
    h.fireB = this.txt(VW - 6, 25, 'ON FIRE', 0xff8a2a, 1, 1).setVisible(false);
    if (this.cfg.mode !== 'sim') this.legend = new Legend(this, VW, VH, this.cfg.netRole ? ['KEYS','PAD'] : this.cfg.mode === '2p' ? ['P1 KB', 'P2 PAD'] : ['KEYS', 'PAD']);
    this.banner = this.txt(cx, 78, '', 0xffffff, 3, 0.5, 0.5, 6200).setAlpha(0);
    this.bannerSub = this.txt(cx, 98, '', 0xffe45e, 1, 0.5, 0.5, 6200).setAlpha(0);
  }

  showBanner(main: string, sub = '', dur = 1.2, color = '#ffffff') {
    if(this.cfg.netRole==='host')net?.send({type:'event',kind:'banner',main,sub,dur,color});
    const c = parseInt(color.replace('#', ''), 16);
    const w = (textWidth(main, 3) + 6) > VW - 10 ? 2 : 3;
    this.banner.setText(main.toUpperCase()).setTint(c).setAlpha(1).setScale(PX * w);
    this.bannerSub.setText(sub.toUpperCase()).setAlpha(sub ? 1 : 0);
    this.tweens.killTweensOf([this.banner, this.bannerSub]);
    this.tweens.add({ targets: [this.banner, this.bannerSub], alpha: 0, delay: dur * 1000, duration: 300 });
  }

  popupAt(h: Hooper, text: string, color = '#ffe45e', size = 28) {
    if(this.cfg.netRole==='host')net?.send({type:'event',kind:'popup',id:h.id,text,color,size});
    for (const [re, pay] of STYLE_PAY) if (re.test(text)) { this.style[h.id] += pay; break; }
    this.fx.popup(h.x + (Math.random() - 0.5) * 30, h.sy - h.h - 205, text, color, size);
  }

  slowmo(scale: number, dur: number) { this.timeScale = scale; this.slowT = dur; }
  hitstop(d: number) { this.hitT = Math.max(this.hitT, d); }
  shake(ms: number, i: number) { this.cameras.main.shake(ms, i); }
  punch(_x: number, _y: number) { this.cameras.main.shake(140, 0.006); }

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

  launchShot(h: Hooper, q: { perfect: boolean; err: number; green: number; m: number; e: number; grade: TimingGrade; willMake: boolean }) {
    const b = this.ball, hp = T.hoop;
    const x0 = h.x + h.facing * 8, z0 = h.z, h0 = h.h + h.puppet.cur.fHy + 10;
    b.setHeld(x0, z0, h0);
    const dist = Math.abs(hp.x - x0);
    const tt = 0.55 + dist / 1500;
    const vx = (hp.x + q.err - x0) / tt, vz = (0 - z0) / tt, vh = (hp.rimH - h0) / tt + 0.5 * T.ball.g * tt;
    const pts = this.distToHoop(h.x, h.z) >= T.arcR ? T.rules.arcPts : T.rules.insidePts;
    const info: ShotInfo = { shooter: h, perfect: q.perfect, pts, age: 0, scored: false, dunk: false, green: q.green, touchedRim: false, willMake: q.willMake };
    b.fire = h.fireOn;
    b.launch(vx, vz, vh, info);
    h.hasBall = false; b.lastOwner = h;
    h.pickupLock = 0.4;
    if (q.perfect) this.popupAt(h, 'GREEN RELEASE', '#4dff88', 24);
    else if (q.willMake && q.grade === 'good') this.popupAt(h, 'GOOD!', '#9dffc4', 28);
    else if (!q.willMake) this.popupAt(h, timingLabel(q.grade), q.grade.startsWith('very') ? '#ff4a4a' : '#ff8a5a', 22);
  }

  private onScore(info: ShotInfo, clean: boolean) {
    if (this.phase !== 'live') return;
    const h = info.shooter, o = this.opp(h);
    h.score += info.pts;
    if(info.perfect) this.perfectMoment(h,h.meterInfo.contest>0.3);
    this.buckets[h.id] += info.pts;
    h.gainHeat(14 + (info.perfect ? 10 : 0));
    if (o.fireOn) { o.fireT = 0; o.heat = 0; this.popupAt(o, 'COOLED OFF', '#9fe8ff', 22); }
    const sx = T.hoop.x, sy = T.court.floorY - T.hoop.rimH;
    this.fx.sparks(sx, sy + 10, info.perfect ? 14 : 6, info.perfect ? 0x7dffb0 : 0xe8e0ce, info.perfect ? 290 : 150);
    this.fx.ring(sx, sy + 14, info.perfect ? 0x7dffb0 : 0xffffff, 10, info.perfect ? 180 : 100, 0.24);
    sfx.net();
    const lab = info.dunk ? 'SLAM' : clean ? (info.perfect ? 'SWISH' : 'NOTHING BUT NET') : info.touchedRim ? 'RATTLES IN' : 'BUCKET';
    this.fx.popup(sx - 40, sy - 60, `${lab}  +${info.pts}`, info.pts > 1 ? '#ffd24a' : '#ffffff', 40, 60);
    for (const [re, pay] of STYLE_PAY) if (re.test(lab)) { this.style[h.id] += pay; break; }
    this.shake(info.pts > 1 ? 160 : 90, info.pts > 1 ? 0.008 : 0.004);
    h.mood = 'hype'; h.moodT = info.perfect ? 1.2 : 2.4; h.celeb = info.perfect ? 3 : Math.floor(this.rand() * 3);
    o.mood = 'down'; o.moodT = 2.4;
    this.court.cheer(info.pts > 1 || info.perfect ? 1 : 0.6);
    this.afterPoint(h);
  }

  private afterPoint(scorer: Hooper) {
    if (scorer.score >= this.cfg.target) {
      this.phase = 'over'; this.winner = scorer; this.overT = 0;
      this.slowmo(0.4, 0.9);
      this.court.cheer(1);
      this.finishMatch();
      return;
    }
    this.phase = 'point';
    this.pointCountdown = 3;
    this.pointCountShown = -1;
    this.nextOffense = T.rules.makeItTakeIt ? scorer.id : 1 - scorer.id;
  }

  private finishMatch() {
    const w = this.winner!, human = this.cfg.mode === '1p';
    const lines: [string, number][] = [];
    let total = 0;
    if (human) {
      const mult = LEVEL_PAY[this.cfg.level];
      const win = w.id === 0;
      lines.push(['PLAYED', Math.round(30 * mult)]);
      lines.push([`BUCKETS ${this.buckets[0]}`, Math.round(this.buckets[0] * 9 * mult)]);
      if (this.style[0]) lines.push(['STYLE', Math.round(this.style[0] * mult)]);
      if (win) lines.push(['WIN BONUS', Math.round(70 * mult)]);
      total = lines.reduce((a, l) => a + l[1], 0);
      const s = save();
      s.games++; if (win) { s.wins++; if(cfgRival(this.cfg) && recordRivalWin(this.cfg.court,this.cfg.rivalIdx!)) lines.push(['NEXT RIVAL UNLOCKED',0]); }
      addCash(total); persist();
      this.result = { win, lines, total };
    }
    this.time.delayedCall(900, () => this.showResults());
  }

  private showResults() {
    if (this.phase !== 'over') return;
    const w = this.winner!, [a, b] = this.hoopers;
    const ui = this.overUi;
    const rows = this.result?.lines.length ?? 0;
    const ph = 60 + rows * 9 + (this.result ? 26 : 8);
    const pw = 202, px = Math.round((VW - pw) / 2), py = Math.round((VH - LEGEND_H - ph) / 2) - 6;
    const g = this.add.graphics().setDepth(7000).setScrollFactor(0).setPosition(fixedOrigin(VW), fixedOrigin(VH));
    const R = (x: number, y: number, ww: number, hh: number, c: number, al = 1) => { g.fillStyle(c, al); g.fillRect(x * PX, y * PX, ww * PX, hh * PX); };
    R(px - 1, py - 1, pw + 2, ph + 2, 0x000000, 0.9); R(px, py, pw, ph, 0x0c0c16, 0.94); R(px, py, pw, 2, 0xff7a1a); R(px, py + ph - 2, pw, 2, 0x3a3a52);
    ui.push(g);
    const t = (x: number, y: number, s: string, col: number, k = 1, ox = 0.5) => { const o = this.txt(x, y, s, col, k, ox, 0, 7001); ui.push(o); return o; };
    t(px + pw / 2, py + 7, `${this.nameOf(w)} WINS`, w.id === 0 ? 0xffd24a : 0x7fd4ff, 3);
    t(px + pw / 2, py + 32, `${a.loadout.name}  ${a.score} - ${b.score}  ${b.loadout.name}`, 0xffffff, 1);
    let y = py + 47;
    if (this.result) {
      for (const [n, v] of this.result.lines) {
        t(px + 24, y, n, n==='NEXT RIVAL UNLOCKED'?0x7dffb0:0xa8a8c0, 1, 0); if(n!=='NEXT RIVAL UNLOCKED') t(px + pw - 24, y, `+$${v}`, 0x7dffb0, 1, 1); y += 9;
      }
      t(px + 24, y + 2, this.result.win ? 'CASH EARNED' : 'CASH EARNED', 0xffffff, 1, 0); t(px + pw - 24, y + 2, `+$${this.result.total}`, 0xffd24a, 1, 1);
      y += 14;
    }
    t(px + pw / 2, py + ph - 12, this.cfg.netRole ? 'LEAVE ROOM TO PLAY AGAIN' : 'ENTER REMATCH     BACKSPACE MENU', 0x8a8aa0, 1);
  }

  dunkMiss(h: Hooper, grade: TimingGrade = 'bad') {
    const hp = T.hoop;
    h.hasBall = false;
    const b = this.ball;
    b.setHeld(h.x + h.facing * 18, h.z, hp.rimH - 8);
    b.mode = 'loose'; b.owner = null; b.lastOwner = h; b.info = null;
    b.vx = 60 + this.rand() * 80; b.vh = -280 - this.rand() * 120; b.vz = (this.rand() - 0.5) * 80;
    h.pickupLock = 0.45;
    this.popupAt(h, grade === 'bad' ? 'RIM!' : timingLabel(grade), '#ff6a5a', 34);
    this.fx.ring(hp.x, T.court.floorY - hp.rimH, 0xffffff, 10, 280, 0.25);
    this.shake(120, 0.006);
    h.mood = 'down'; h.moodT = 1.2;
  }

  private greenSpark(h:Hooper) {
    this.fx.ring(h.x,h.sy-h.h-130,0x66ffb0,16,280,.32);
    this.fx.sparks(h.x,h.sy-h.h-130,12,0xb1ffdb,200);
  }

  private perfectMoment(h: Hooper, contested = false) {
    const tag = GameScene.PERFECT_TAGS[Math.floor(this.rand() * GameScene.PERFECT_TAGS.length)];
    const text = contested ? `${tag}!  (CONTESTED)` : `${tag}!`;
    this.popupAt(h, text, '#4dff88', 44);
    this.greenSpark(h);
    if(this.cfg.netRole==='host')net?.send({type:'event',kind:'green',id:h.id});
    this.hitstop(0.05);
    this.slowmo(0.55, 0.18);
  }

  dunkHit(h: Hooper, perfect = true, _grade: TimingGrade = 'green') {
    const o = this.opp(h);
    const hp = T.hoop;
    const inFront = (o.x-h.x)*h.facing >= -8;
    const blocked = o.act==='block' && o.h>35 &&
      Math.abs(o.x-(h.x+h.facing*20)) < (o.isCpu?58:80) && Math.abs(o.z-h.z) < (o.isCpu?30:42) && (!o.isCpu || inFront);
    if (blocked) {
      this.ball.release(h); h.hasBall = false;
      this.ball.setHeld(h.x + h.facing * 30, h.z, h.h + 200);
      this.ball.vx = -h.facing * 260; this.ball.vh = 220; this.ball.vz = 0;
      this.ball.mode = 'loose'; this.ball.info = null;
      h.pickupLock = 0.5;
      this.fx.ring(h.x + h.facing * 30, h.sy - h.h - 200, 0xffffff, 12, 380, 0.3);
      this.fx.sparks(h.x + h.facing * 30, h.sy - h.h - 200, 16, 0xffffff, 420);
      sfx.board();
      this.popupAt(o, 'DENIED AT THE RIM', '#ff5a3a', 34);
      this.shake(220, 0.014); this.hitstop(0.09); this.slowmo(0.45, 0.25);
      o.gainHeat(22);
      return;
    }
    sfx.dunk();
    const posterized = Math.abs(o.x - h.x) < 120 && Math.abs(o.z - h.z) < 50 && o.act !== 'fall';
    h.hasBall = false;
    const b = this.ball;
    b.setHeld(hp.x, 0, hp.rimH - 4);
    b.mode = 'loose'; b.owner = null; b.lastOwner = h; b.noRim = 0.5;
    b.vx = 20; b.vh = -520; b.vz = 0;
    const info: ShotInfo = { shooter: h, perfect, pts: T.rules.dunkPts, age: 0, scored: true, dunk: true, green: 0, touchedRim: false, willMake: true };
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
    else if(h.dunkStyle===1) this.popupAt(h,'REVERSE!', '#ffcd6b',32);
    else if(h.dunkStyle===3) this.popupAt(h,'ONE HAND!', '#ffcd6b',32);
    this.punch(hp.x - 60, T.court.floorY - 160);
    this.onScore(info, true);
  }

  resolveSwipe(h: Hooper): boolean {
    const o = this.opp(h);
    if (!o.hasBall || this.ball.mode !== 'held') return false;
    const dx = (o.x - h.x) * h.facing;
    if (dx < 6 || dx > T.steal.range || Math.abs(o.z - h.z) > T.steal.zRange) return false;
    if (o.protectT > 0 || o.act === 'shoot' || o.act === 'dunk') return false;
    let p = T.steal.base + h.stats.defense / 220;
    if (Math.abs(o.vx) > T.move.sprintFloor || o.sprintT > 0.05) p += T.steal.sprintBonus;
    if (o.act === 'juke' && o.actT > 0.05 && o.actT < 0.24) p += T.steal.jukeBonus;
    if (o.stamina < T.stamina.lowAt) p += T.steal.lowStaminaBonus;
    if (o.act === 'recover' || o.act === 'stagger') p += 0.25;
    if (this.rand() > clamp(p, 0.1, 0.9)) {
      this.popupAt(h, 'MISSED', '#aab', 16);
      return false;
    }
    o.hasBall = false; o.pickupLock = 0.5;
    h.hasBall = true; this.ball.owner = h; this.ball.mode = 'held'; this.ball.info = null;
    this.needsClear = true; this.cleared = false;
    h.protectT = 0.7; o.pickupLock = 0.8;
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
    if (o.hasBall && this.ball.mode === 'held' && this.rand() < T.shove.fumble) {
      o.hasBall = false; o.pickupLock = 0.5;
      const b = this.ball; b.release(o);
      b.vx = h.facing * 160; b.vh = 220; b.vz = (this.rand() - 0.5) * 120;
      this.popupAt(h, 'STRIPPED!', '#7fd4ff', 30);
    }
  }

  private ankleAttempts = new WeakMap<Hooper, number>();

  ankleCheck(h: Hooper, runningCut = false) {
    const d = this.opp(h);
    const dx = d.x - h.x, dz = d.z - h.z;
    if (Math.abs(dx) > T.moves.ankleRange || Math.abs(dz) > T.moves.ankleZ) return;
    if (d.act === 'fall' || d.act === 'dunk' || d.h > 30 || d.immuneT > 0) return;
    if (this.gt - (this.ankleAttempts.get(h) ?? -10) < 0.85 || !h.hasBall) return;
    this.ankleAttempts.set(h, this.gt);
    const wrongWay = d.vz * h.dash.z < -40 || (h.moveKind !== 'cross' && d.vx * Math.sign(h.dash.x || 1) < -120);
    const committed = d.act === 'swipe' || d.act === 'shove' || d.act === 'recover' || d.act === 'stagger';
    const skill = (h.stats.speed - d.stats.defense) / 500;
    const chance = clamp(0.10 + skill + (wrongWay ? 0.14 : 0) + (committed ? 0.16 : 0) + (runningCut ? 0.10 : 0) + Math.min(h.comboN, 3) * 0.025 + (d.stamina < 22 ? 0.10 : 0), 0.07, 0.48);
    if (this.rand() < chance) {
      sfx.ankle();
      d.knock('fall', -d.facing, 170); d.immuneT = 2.4;
      d.vz = h.dash.z * 0.3;
      this.popupAt(h, h.comboN >= 4 ? 'ANKLES GONE!' : 'ANKLE BREAKER!', '#ff4fa0', 40);
      this.fx.dust(d.x, d.sy, 12, -d.facing, 1.2);
      this.fx.ring(d.x, d.sy - 40, 0xff4fa0, 14, 340, 0.4);
      h.gainHeat(28 + 8 * h.comboN);
      this.slowmo(0.35, 0.4); this.shake(180, 0.01); this.punch(d.x, d.sy);
      this.hitstop(0.05);
    } else {
      h.gainHeat(3);
    }
  }

  private looseT = 0;

  /** A shot that drops below the rim without scoring is a miss: from then on it is a loose ball anybody can grab. */
  private settleMiss() {
    const b = this.ball, i = b.info;
    if (b.mode !== 'shot' || !i || i.scored) return;
    const below = b.vh < 0 && b.h < T.hoop.rimH - 30 && i.age > 0.2;
    if (below || b.h <= T.ball.r + 1 || i.age > 4) { b.mode = 'loose'; b.info = null; }
  }

  private pickups() {
    this.settleMiss();
    const b = this.ball;
    const live = b.mode === 'loose' || (b.mode === 'shot' && b.info && !b.info.scored && b.info.touchedRim && b.info.age > 0.25);
    if (!live || this.phase !== 'live') { this.looseT = 0; return; }
    let best: Hooper | null = null, bd = 1e9;
    for (const h of this.hoopers) {
      if (h.h>20 && h.reboundT<=0) continue;
      if (h.pickupLock > 0 || ['fall', 'stagger', 'shoot', 'dunk', 'swipe'].includes(h.act)) continue;
      const dx = Math.abs(h.x - b.x), dz = Math.abs(h.z - b.z);
      if (dx > (h.reboundT>0?62:44) || dz > (h.reboundT>0?44:36)) continue;
      if (b.h > h.h + (h.reboundT>0?270:232) || b.h < 0) continue;
      if (b.h > h.h + 120 && h.h < 20) continue;
      if (Math.hypot(b.vx, b.vh) > 1000) continue;
      const d = dx + dz + Math.abs(b.h-(h.h+190))*.06 - (h.reboundT>0?18:0);
      if (d < bd) { bd = d; best = h; }
    }
    if (!best) {
      // Safety net: a ball that has been lying around unclaimed goes to whoever is closest.
      this.looseT = b.mode === 'loose' && b.h <= T.ball.r + 2 && Math.hypot(b.vx, b.vz) < 60 ? this.looseT + SIM_DT : 0;
      if (this.looseT < 1.5) return;
      best = this.hoopers.reduce((m, h) => (Math.abs(h.x - b.x) + Math.abs(h.z - b.z) < Math.abs(m.x - b.x) + Math.abs(m.z - b.z) ? h : m));
    }
    this.looseT = 0;
    const lastOff = b.lastOwner;
    best.hasBall = true; b.owner = best; b.mode = 'held'; b.info = null; b.fire = false;
    if (best !== lastOff) { this.needsClear = true; this.cleared = false; this.popupAt(best, 'TAKE IT BACK', '#ffe45e', 18); }
    if (best.h > 20) { best.reboundT=0; best.gainHeat(6); this.popupAt(best, 'REBOUND!', '#ffffff', 26); }
  }

  private blocks() {
    const b = this.ball;
    if (b.mode !== 'shot' || !b.info || b.info.scored || b.info.age > 0.55) return;
    const d = this.opp(b.info.shooter);
    if (d.act !== 'block') return;
    const hx = d.x + d.facing * 24, hh = d.h + 228;
    if (Math.hypot(b.x - hx, b.h - hh) < (d.isCpu?37:48) && Math.abs(b.z - d.z) < (d.isCpu?34:42)) {
      const s = b.info.shooter;
      b.info = null; b.mode = 'loose';
      b.vx = d.facing * (240 + this.rand() * 140); b.vh = 120 + this.rand() * 120; b.vz = (this.rand() - 0.5) * 200;
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
    music.duck(this.paused);
    music.update(real, this.camX, (this.hoopers[0].x + this.hoopers[1].x) / 2);
    if(this.cfg.netRole) {
      if(!net || net.closed)return;
      net.tick();if(net.closed)return;
      if(this.netStatus)this.netStatus.firstChild!.textContent=`ONLINE / ${this.cfg.netRole==='host'?'YOU: P1':'YOU: P2'} / ${net.rtt} MS  `;
      if(this.cfg.netRole==='guest') {this.updateGuest(real);return;}
      if(!net.remoteReady){if(performance.now()-this.netReadyAt>15000)net.fail('Guest did not finish loading.');return;}
      this.latchIntent(1,net.input.poll(performance.now()));
    }
    const startHit = !this.cfg.netRole && this.ctrls.some((c) => c?.startPressed());
    if (this.paused || startHit) {
      const n = this.nav.poll(real);
      if (startHit && this.phase !== 'over') this.setPaused(!this.paused);
      else if (this.paused && n.back) this.scene.start('menu');
      if (this.paused) return;
    }
    if (this.phase === 'over') {
      const n = this.nav.poll(real);
      this.overT += real;
      if (!this.cfg.netRole && n.ok && this.overT > 1) { this.scene.restart(this.cfg); return; }
      if (!this.cfg.netRole && n.back) { this.scene.start('menu'); return; }
    }

    this.acc += real;
    for (let i = 0; i < 2; i++) {
      const c = this.ctrls[i];
      if (c && !(this.cfg.netRole && i===1)) this.latchIntent(i, c.poll());
    }
    let steps = 0;
    while (this.acc >= SIM_DT && steps < T.sim.maxSteps) { this.acc -= SIM_DT; this.simStep(); steps++; }
    if (steps >= T.sim.maxSteps) this.acc = 0;

    this.updateCamera(real);
    this.court.update(this.realT, real);
    this.fx.update(real * this.timeScale);
    this.render(real);
    if(this.cfg.netRole==='host' && net){this.netSendT+=real;if(this.netSendT>=1/30){this.netSendT=0;net.send({type:'state',value:this.networkState()});}}
  }

  /** Human edges (button presses) are held until a sim step consumes them, so a press is never lost between steps. */
  private latchIntent(i: number, n: Intent) {
    const l = this.latch[i];
    l.mx = n.mx; l.mz = n.mz; l.cHeld=n.cHeld; l.sprint = n.sprint; l.shootHeld = n.shootHeld; l.checkHeld = n.checkHeld;
    l.shootDown ||= n.shootDown; l.shootUp ||= n.shootUp;
    l.a ||= n.a; l.b ||= n.b; l.c ||= n.c; l.shove ||= n.shove;
  }

  private logIntent(i: number, I: Intent) {
    const q = (v: number) => (Math.round(clamp(v, -1, 1) * 127) + 128) & 255;
    const bits = (I.sprint ? 1 : 0) | (I.shootHeld ? 2 : 0) | (I.shootDown ? 4 : 0) | (I.shootUp ? 8 : 0) | (I.a ? 16 : 0) | (I.b ? 32 : 0) | (I.c ? 64 : 0) | (I.shove ? 128 : 0) | (I.checkHeld ? 256 : 0) | (I.cHeld ? 512 : 0);
    const v = q(I.mx) | (q(I.mz) << 8) | (bits << 16);
    if (v !== this.lastLogged[i]) { this.lastLogged[i] = v; this.inputLog.push(this.tick, i, v); }
  }

  /** Everything that affects the outcome of a match advances here, at a fixed rate: same seed + same inputs = same match. */
  simStep() {
    if (this.hitT > 0) { this.hitT -= SIM_DT; return; }
    if (this.slowT > 0) { this.slowT -= SIM_DT; if (this.slowT <= 0) this.slowT = 0; }
    else this.timeScale += (1 - this.timeScale) * Math.min(1, SIM_DT * 6);
    const dt = SIM_DT * this.timeScale * T.pace;
    this.tick++;
    this.time_ += dt;

    const ints: Intent[] = [emptyIntent(), emptyIntent()];
    for (let i = 0; i < 2; i++) {
      const L = this.latch[i];
      let I: Intent = (this.ctrls[i] || this.cfg.netRole==='host'&&i===1) ? { ...L } : emptyIntent();
      L.shootDown = L.shootUp = L.a = L.b = L.c = L.shove = false;
      const br = this.brains[i];
      if (br && this.phase === 'live') I = br.think(this.hoopers[i], this.hoopers[1 - i], this, dt);
      ints[i] = this.phase === 'live' ? I : emptyIntent();
      if ((this.ctrls[i] || this.cfg.netRole==='host'&&i===1) && this.phase === 'live') this.logIntent(i, ints[i]);
    }

    if (this.phase === 'intro') {
      this.phaseT -= SIM_DT;
      const n = Math.ceil(this.phaseT);
      if (n > 0 && n <= 3 && n !== this.introCountShown) {
        this.introCountShown = n;
        this.showBanner(String(n), '', 0.85);
      }
      if (this.phaseT <= 0) { this.phase = 'live'; this.showBanner('CHECK', '', 0.55); }
    }
    if (this.phase === 'point') {
      this.pointCountdown -= SIM_DT;
      const n = Math.ceil(this.pointCountdown);
      if (n > 0 && n !== this.pointCountShown) {
        this.pointCountShown = n;
        this.showBanner(String(n), 'INBOUND', 0.55);
      }
      if (this.pointCountdown > 0) {
        // Physics stays frozen between possessions; scorer gets a short,
        // cosmetic celebration and settles to the floor before the reset.
        for(const h of this.hoopers) if(h.mood==='hype' || (h.mood==='' && (h.act==='release'||h.act==='dunk'))) {
          h.tAlive+=dt;h.moodT=Math.max(0,h.moodT-dt);
          h.h=Math.max(0,h.h-dt*300);
          const act=h.act;h.act='free';h.simPose(dt,this);h.act=act;
          if(h.moodT===0)h.mood='';
        }
        return;
      }
      this.resetPositions(this.nextOffense);
      this.phase = 'live';
      this.pointCountShown = -1;
      this.showBanner('CHECK', '', 0.6);
      return;
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
    for (const h of this.hoopers) h.simPose(dt, this);
  }

  /** Snapshot for replays and, later, server-side verification of ranked results. */
  replay() {
    return { seed: this.seed, hz: T.sim.hz, steps: this.tick, cfg: { mode: this.cfg.mode, court: this.cfg.court, level: this.cfg.level, target: this.cfg.target }, log: this.inputLog };
  }

  private cameraTarget() {
    const [a, b] = this.hoopers, half = (VW * PX) / 2, margin = 110;
    const ball = this.ball;
    const holder = this.holder;
    let focus = (a.x + b.x) / 2;
    if (!holder && ball.mode !== 'held') focus = focus * 0.45 + ball.x * 0.55;
    const lead = holder ? clamp(holder.vx * 0.16, -48, 48) : 0;
    let c = focus + lead;
    const lo = Math.max(a.x, b.x) + margin - half, hi = Math.min(a.x, b.x) - margin + half;
    if (lo <= hi) c = clamp(c, lo, hi);
    return clamp(c, half, GW_WORLD - half);
  }

  /** Critically damped follow: no overshoot, so the frame glides rather than wobbles. */
  private updateCamera(dt: number) {
    const target = this.cameraTarget(), smooth = 0.32, w = 2 / smooth, x = w * dt;
    const e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = this.camX - target, temp = (this.camV + w * change) * dt;
    this.camV = (this.camV - w * temp) * e;
    this.camX = target + (change + temp) * e;
    this.applyCamera();
  }

  private snapCamera() { this.camX = this.cameraTarget(); this.camV = 0; this.applyCamera(); }

  /** Scroll in whole art pixels so the pixel grid never shimmers while the frame glides. */
  private applyCamera() {
    const left = Math.round((this.camX - (VW * PX) / 2) / PX);
    this.cameras.main.setScroll(left * PX + (VW * (PX - 1)) / 2, VIEW_TOP * PX + (VH * (PX - 1)) / 2);
  }

  private setPaused(p: boolean) {
    this.paused = p;
    this.pauseUi.forEach((o) => o.destroy());
    this.pauseUi = [];
    if (!p) return;
    const g = this.add.graphics().setDepth(7000).setScrollFactor(0).setPosition(fixedOrigin(VW), fixedOrigin(VH));
    g.fillStyle(0x000000, 0.74); g.fillRect(0, 0, VW * PX, VH * PX);
    const lines: [string, number, number][] = [
      ['PAUSED', 0xffffff, 3], ['', 0, 1],
      ['ESC / START   RESUME', 0xffe45e, 1], ['BACKSPACE / CIRCLE   QUIT TO MENU', 0xffe45e, 1], ['', 0, 1],
      ['MOVE  WASD / STICK      SPRINT  SHIFT / R1', 0xc8c8d8, 1],
      ['SHOOT  SPACE / X: HOLD, RELEASE IN GREEN, TAP = PUMP FAKE', 0xc8c8d8, 1],
      ['CROSSOVER  J / SQUARE      SPIN  K / CIRCLE', 0xc8c8d8, 1],
      ['DUNK  L / TRIANGLE + UP / DOWN FOR STYLE', 0xc8c8d8, 1],
      ['TAP SHOOT IN GREEN AT RIM  //  CLOSE SHOT = LAYUP', 0xc8c8d8, 1],
      ['DEFENSE  STEAL J   BLOCK SPACE   HAND-CHECK R / L2', 0xc8c8d8, 1],
      ['REBOUND  JUMP THEN STEAL IN AIR: SPACE + J / X + SQUARE', 0xc8c8d8, 1],
      ['DIRTY SHOVE  E / L1', 0xc8c8d8, 1],
    ];
    let y = 30;
    const objs: Phaser.GameObjects.GameObject[] = [g];
    for (const [s, c, k] of lines) { if (s) objs.push(this.txt(VW / 2, y, s, c, k, 0.5, 0, 7001)); y += k === 3 ? 26 : 11; }
    this.pauseUi = objs;
  }

  private netSound(sound:string){if(this.cfg.netRole==='host')net?.send({type:'event',kind:'sound',sound});}

  private bindNetwork() {
    const session=net!;this.netSendT=0;this.netSeq=0;this.netLastSeq=-1;this.guestTarget=null;this.netReadyAt=performance.now();
    const panel=document.createElement('div');panel.style.cssText='position:fixed;bottom:4px;right:8px;z-index:9000;background:#10121de8;color:#d9dfeb;padding:5px;font:12px monospace';
    panel.append(document.createTextNode('CONNECTING… '));
    const leave=document.createElement('button');leave.textContent='LEAVE ROOM';leave.style.cssText='background:#292b3c;color:white;border:1px solid #777;font:inherit';panel.append(leave);document.body.append(panel);this.netStatus=panel;
    leave.onclick=()=>{closeNet();this.scene.start('menu');};
    session.onClose=reason=>{
      this.showBanner('DISCONNECTED',reason,30,'#ff8a5a');
      if(panel.firstChild)panel.firstChild.textContent=reason+' ';
    };
    if(this.cfg.netRole==='guest') {
      session.onState=s=>this.receiveNetworkState(s);
      session.onEvent=e=>{if(e.kind==='green'&&(e.id===0||e.id===1))this.greenSpark(this.hoopers[e.id]);if(e.kind==='sound'&&['rim','board','bounce'].includes(e.sound))(sfx as any)[e.sound]();if(e.kind==='banner')this.showBanner(String(e.main).slice(0,100),String(e.sub).slice(0,150),1.2);if(e.kind==='popup'&&(e.id===0||e.id===1))this.fx.popup(this.hoopers[e.id].x,this.hoopers[e.id].sy-205,String(e.text).slice(0,80),'#ffe45e',24);};
      if(session.latest)this.receiveNetworkState(session.latest);
      session.send({type:'ready'});
      this.showBanner('YOU ARE P2','WAITING FOR HOST',1);
    }
  }

  private networkState() {
    const keys=['x','z','vx','vz','h','vh','facing','stamina','heat','fireT','score','act','actT','actDur','hasBall','meter','fade','shoved','comboN','moveKind','protectT','pickupLock','handSide','dunkHit','trickDunk','dunkStyle','layupStyle','ph','mood','moodT','celeb','tAlive','reboundT'] as const;
    return {seq:this.netSeq++,time:this.time_,phase:this.phase,needsClear:this.needsClear,cleared:this.cleared,
      players:this.hoopers.map(h=>({...Object.fromEntries(keys.map(k=>[k,h[k]])),rig:{...h.puppet.cur},carried:{...h.carried},meterInfo:{...h.meterInfo}})),
      ball:{x:this.ball.x,z:this.ball.z,h:this.ball.h,mode:this.ball.mode,fire:this.ball.fire,spin:this.ball.spin,netKick:this.ball.netKick,owner:this.ball.owner?.id??-1},
    };
  }

  private receiveNetworkState(s:any) {
    if(!s||!Number.isSafeInteger(s.seq)||s.seq<=this.netLastSeq||!Array.isArray(s.players)||s.players.length!==2||!s.ball||!['intro','live','point','over'].includes(s.phase))return;
    for(const p of s.players){if(!p.rig||!p.carried||!p.meterInfo||![p.x,p.z,p.h,p.meter,p.score,...Object.values(p.rig)].every(n=>typeof n==='number'&&Number.isFinite(n)))return;}
    if(![s.ball.x,s.ball.z,s.ball.h,s.time].every(Number.isFinite))return;
    this.netLastSeq=s.seq;this.guestTarget=s;
  }

  private updateGuest(real:number) {
    net?.sendInput(this.ctrls[0]?.poll()??emptyIntent());
    const s=this.guestTarget;
    if(s){
      const first=this.tick===0;const k=first?1:1-Math.exp(-real*35);
      this.time_=s.time;this.phase=s.phase;this.needsClear=s.needsClear;this.cleared=s.cleared;this.tick++;
      this.hoopers.forEach((h,i)=>{
        const p=s.players[i];const oldScore=h.score;
        for(const key of ['x','z','h'] as const)h[key]+=(p[key]-h[key])*k;
        for(const key of ['vx','vz','vh','facing','stamina','heat','fireT','score','act','actT','actDur','hasBall','meter','fade','shoved','comboN','moveKind','protectT','pickupLock','handSide','dunkHit','trickDunk','dunkStyle','layupStyle','ph','mood','moodT','celeb','tAlive','reboundT'])if(p[key]!==undefined)(h as any)[key]=p[key];
        for(const key of Object.keys(h.puppet.cur))if(typeof p.rig[key]==='number')(h.puppet.cur as any)[key]=p.rig[key];Object.assign(h.carried,p.carried);Object.assign(h.meterInfo,p.meterInfo);
        if(h.score>oldScore){sfx.net();this.court.cheer(.8);}
      });
      const b=this.ball;
      for(const key of ['x','z','h'] as const)b[key]+=(s.ball[key]-b[key])*k;
      b.mode=s.ball.mode;b.fire=s.ball.fire;b.spin=s.ball.spin;b.netKick=s.ball.netKick;b.owner=this.hoopers[s.ball.owner]??null;
      if(this.phase==='over'&&!this.overUi.length){this.winner=this.hoopers[0].score>=this.cfg.target?this.hoopers[0]:this.hoopers[1];this.showResults();}
    }
    this.updateCamera(real);this.court.update(this.realT,real);this.fx.update(real);this.render(real);
  }

  private render(real: number) {
    for (const h of this.hoopers) h.render();
    const b = this.ball;
    const hold = this.holder;
    b.fire = b.fire || (!!hold && hold.fireOn);
    if (!hold && b.mode !== 'shot') b.fire = false;
    if (b.fire) this.fx.flame(b.x, b.sy, 1, 6);
    b.draw(T.court.floorY + b.z + 0.1, hold && b.mode === 'held' ? hold.sy + hold.carried.depthBias : undefined);
    this.court.drawNet(b.netKick, this.realT);

    const s = this.shadows;
    s.clear();
    for (const h of this.hoopers) {
      const k = Math.max(0.4, 1 - h.h / 260);
      shadowEllipse(s, h.x / PX, (h.sy + 3) / PX, 9 * k + 2, 2 * k + 0.6, 0.42 * k);
      let tint = this.court.tintAt(h.x, h.sy);
      if (h.fireOn) { tint = mix(tint, 0xffa850, 0.35 + 0.15 * Math.sin(this.realT * 18)); if (Math.random() < 0.8) this.fx.flame(h.x + (Math.random() - 0.5) * 40, h.sy - h.h - Math.random() * 150, 1, 8); }
      h.puppet.setTint(tint);
    }
    this.drawMeters();
    this.drawHud();
    void real;
  }

  private drawMeters() {
    const g = this.meterG;
    g.clear();
    const R = (x: number, y: number, w: number, h: number, c: number, a = 1) => { g.fillStyle(c, a); g.fillRect(Math.round(x) * PX, Math.round(y) * PX, Math.round(w) * PX, Math.round(h) * PX); };
    for (const h of this.hoopers) {
      const ready = this.phase==='live' && this.cfg.mode!=='sim' && (h.id===0 || this.cfg.mode==='2p') && h.canDunk(this);
      this.dunkHints[h.id]?.setVisible(ready).setPosition(h.x,h.sy-h.h-212);

      if (h.act === 'shoot') {
        const w = 44, bx = Math.round(h.x / PX - w / 2);
        let by = Math.round((h.sy - h.h) / PX - 14);
        by = clamp(by, VIEW_TOP + 52, VH - 14);
        const range = 1.1, S = T.shot.sweet;
        const { green, contest } = h.meterInfo;
        R(bx - 2, by - 2, w + 4, 8, 0x08080c, 0.9);
        R(bx, by, w, 4, 0x24363a);
        const gx0 = bx + ((S - green) / range) * w, gw = Math.max(2, ((green * 2) / range) * w);
        const mx = bx + clamp(h.meter / range, 0, 1) * w;
        R(bx, by, mx - bx, 4, 0x4a9ad0);
        const inZone = Math.abs(h.meter - S) <= green;
        R(gx0, by, gw, 4, inZone ? 0x9dffc4 : 0x2fd060);
        R(gx0 - 1, by - 1, gw + 2, 1, 0x08080c); R(gx0 - 1, by + 4, gw + 2, 1, 0x08080c);
        R(bx + (S / range) * w, by, 1, 4, 0xffffff);
        R(mx - 1, by - 2, 2, 8, 0xffffff);
        if (contest > 0.25) R(bx, by + 6, w * contest, 1, 0xff3a3a);
      } else if (h.act === 'dunk' && !h.dunkHit) {
        const d = T.dunk, w = 40, bx = Math.round(h.x / PX - w / 2);
        let by = Math.round((h.sy - h.h) / PX - 20);
        by = clamp(by, VIEW_TOP + 48, VH - 14);
        const sweet = d.hitAt / d.airtime, green = (h.dunkWindowSec(this) / d.airtime) * 0.55;
        const m = clamp(h.actT / d.airtime, 0, 1);
        R(bx - 2, by - 2, w + 4, 8, 0x08080c, 0.9);
        R(bx, by, w, 4, 0x24363a);
        const gx0 = bx + ((sweet - green) / 1) * w, gw = Math.max(2, (green * 2 / 1) * w);
        R(bx, by, (m * w), 4, 0x4a9ad0);
        const inZone = Math.abs(m - sweet) <= green;
        R(gx0, by, gw, 4, inZone ? 0x9dffc4 : 0x2fd060);
        R(bx + sweet * w, by, 1, 4, 0xffffff);
        R(bx + m * w - 1, by - 2, 2, 8, 0xffffff);
      }
    }
    if (this.needsClear && !this.cleared && this.holder && this.phase === 'live') {
      const x = Math.round((T.hoop.x - T.arcR - 4) / PX);
      const al = 0.5 + 0.3 * Math.sin(this.realT * 10);
      for (let y = Math.round((T.court.floorY - T.court.laneHalf) / PX); y < (T.court.floorY + T.court.laneHalf) / PX; y += 4) R(x, y, 1, 2, 0xffe45e, al);
    }
  }

  private drawHud() {
    const g = this.hudG;
    g.clear();
    const R = (x: number, y: number, w: number, h: number, c: number, a = 1) => { g.fillStyle(c, a); g.fillRect(Math.round(x) * PX, Math.round(y) * PX, Math.round(w) * PX, Math.round(h) * PX); };
    const [a, b] = this.hoopers, H = this.hud;
    const bx = Math.round(VW / 2 - 45);
    R(bx, 1, 90, 30, 0x000000, 0.8); R(bx + 1, 2, 88, 28, 0x0c0c16, 0.7); R(bx + 1, 28, 88, 2, 0xff7a1a);
    H.scoreA.setText(`${a.score}`); H.scoreB.setText(`${b.score}`);
    H.sub.setText(`${courtInfo(this.cfg.court).name}  //  TO ${this.cfg.target}`);
    H.nameA.setText(`${this.nameOf(a)}  ${a.loadout.name}`);
    H.nameB.setText(`${b.loadout.name}  ${this.nameOf(b)}`);
    const bars = (h: Hooper, right: boolean) => {
      const w = 84, x0 = right ? VW - 6 - w : 6;
      R(x0 - 2, 12, w + 4, 12, 0x000000, 0.7);
      R(x0, 13, w, 5, 0x2a2a34); R(x0, 19, w, 4, 0x2a2a34);
      const hf = h.fireOn ? h.fireT / T.heat.fireTime : h.heat / T.heat.max;
      const hw = Math.round(w * hf);
      R(right ? x0 + w - hw : x0, 13, hw, 5, h.fireOn ? 0xffc24a : 0xff6a1a);
      R(right ? x0 + w - hw : x0, 13, hw, 1, 0xffffff, 0.35);
      const sf = h.stamina / h.staminaMax, sw = Math.round(w * sf);
      R(right ? x0 + w - sw : x0, 19, sw, 4, sf < 0.25 ? 0xff4a4a : 0x4dd0ff);
      R(right ? x0 + w - sw : x0, 19, sw, 1, 0xffffff, 0.35);
    };
    bars(a, false); bars(b, true);
    const fl = [H.fireA, H.fireB];
    fl.forEach((t, i) => { const on = this.hoopers[i].fireOn; t.setVisible(on); if (on) t.setAlpha(0.6 + 0.4 * Math.sin(this.realT * 16)); });
    const lg = this.legend;
    if (lg) {
      const ctxOf = (h: Hooper) => (h.hasBall ? 'offense' : this.ball.mode!=='held' ? 'rebound' : 'defense') as 'offense' | 'defense' | 'rebound';
      lg.set(0, ctxOf(this.hoopers[this.cfg.netRole==='guest'?1:0]));
      lg.set(1, ctxOf(this.hoopers[this.cfg.netRole ? this.cfg.netRole==='guest'?1:0 : this.cfg.mode === '2p' ? 1 : 0]));
    }
  }
}
