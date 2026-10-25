import Phaser from 'phaser';
import { H, W, AiLevel } from './tuning';
import { COURTS, CourtId, CourtScene, buildCourt } from './courts';
import { MenuNav, pads } from './input';
import { PRESETS } from './loadout';
import { Puppet, restRig } from './puppet';
import { FONT } from './fx';
import type { GameCfg } from './game';

const ROWS = ['mode', 'court', 'look1', 'look2', 'level', 'target', 'start'] as const;
const MODES: GameCfg['mode'][] = ['1p', '2p'];
const LEVELS: AiLevel[] = ['rookie', 'hooper', 'legend'];
const TARGETS = [7, 11, 15, 21];

export class MenuScene extends Phaser.Scene {
  private nav = new MenuNav();
  private sel = 0;
  private cfg: GameCfg = { mode: '1p', court: 'brooklyn', look1: 0, look2: 1, level: 'hooper', target: 11 };
  private court?: CourtScene;
  private rows: Phaser.GameObjects.Text[] = [];
  private vals: Phaser.GameObjects.Text[] = [];
  private pups: Puppet[] = [];
  private courtName!: Phaser.GameObjects.Text;
  private courtSub!: Phaser.GameObjects.Text;
  private note!: Phaser.GameObjects.Text;
  private t = 0;
  private marker!: Phaser.GameObjects.Rectangle;

  constructor() { super('menu'); }

  create() {
    this.rows = []; this.vals = []; this.pups = []; this.t = 0;
    const txt = (x: number, y: number, s: string, size: number, color = '#ffffff', stroke = 6) =>
      this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#08080c', strokeThickness: stroke }).setDepth(100);
    this.buildCourt();
    this.add.rectangle(330, H / 2, 660, H, 0x050508, 0.78).setDepth(50);
    this.add.rectangle(660, H / 2, 6, H, 0xff7a1a, 0.9).setDepth(51);
    txt(52, 28, 'BALL OUT', 124, '#ff7a1a', 12).setAngle(-3);
    txt(60, 168, 'STREETBALL  //  NO REFS  //  NO MERCY', 22, '#ffe45e', 5);
    ROWS.forEach((r, i) => {
      const y = 250 + i * 60;
      this.rows.push(txt(70, y, '', 34, '#9a9aa8', 5));
      this.vals.push(txt(330, y, '', 34, '#ffffff', 5));
      void r;
    });
    this.marker = this.add.rectangle(46, 270, 10, 36, 0xff7a1a).setDepth(100);
    this.courtName = txt(W - 40, 40, '', 54, '#ffffff', 8).setOrigin(1, 0);
    this.courtSub = txt(W - 40, 100, '', 20, '#ffe45e', 5).setOrigin(1, 0);
    this.note = txt(70, H - 56, '', 18, '#9fb0c8', 4);
    txt(70, H - 28, 'ARROWS / STICK: SELECT + CHANGE     ENTER / X: GO     KEYBOARD OR DUALSHOCK 4', 16, '#6c6c7c', 3);
    this.makePups();
    this.refresh();
  }

  private buildCourt() {
    this.court?.destroy();
    this.court = buildCourt(this, this.cfg.court);
  }

  private makePups() {
    this.pups.forEach((p) => p.destroy());
    this.pups = [PRESETS[this.cfg.look1], PRESETS[this.cfg.look2]].map((l, i) => {
      const p = new Puppet(this, l);
      p.root.setPosition(i === 0 ? 800 : 1000, 566 + (i ? 10 : -10)).setDepth(600 + i * 20);
      p.setFacing(i === 0 ? 1 : -1);
      p.root.setScale(1.5 * (i === 0 ? 1 : -1), 1.5).setScale(1.5, 1.5);
      return p;
    });
  }

  private refresh() {
    const c = this.cfg;
    const look = (i: number) => `< ${PRESETS[i].name} >`;
    const v = [
      c.mode === '1p' ? '< 1 PLAYER vs CPU >' : '< 2 PLAYERS >',
      `< ${COURTS.find((x) => x.id === c.court)!.name} >`,
      look(c.look1), look(c.look2),
      `< ${c.level.toUpperCase()} >`,
      `< ${c.target} >`,
      'START GAME',
    ];
    const names = ['MODE', 'COURT', c.mode === '1p' ? 'YOUR LOOK' : 'P1 LOOK', c.mode === '1p' ? 'RIVAL LOOK' : 'P2 LOOK', 'CPU LEVEL', 'FIRST TO', ''];
    ROWS.forEach((_, i) => {
      const on = i === this.sel;
      this.rows[i].setText(names[i]).setColor(on ? '#ffffff' : '#9a9aa8');
      this.vals[i].setText(v[i]).setColor(on ? '#ffe45e' : '#c8c8d4');
      if (i === 6) { this.vals[i].setX(70).setColor(on ? '#7dffb0' : '#4aa070'); }
    });
    if (c.mode === '1p') this.vals[4].setAlpha(1); else this.vals[4].setAlpha(0.35);
    const info = COURTS.find((x) => x.id === c.court)!;
    this.courtName.setText(info.name); this.courtSub.setText(info.sub);
    const n = pads().length;
    this.note.setText(c.mode === '2p'
      ? (n >= 2 ? 'P1: PAD 1 + KEYBOARD   P2: PAD 2' : n === 1 ? 'P1: KEYBOARD   P2: GAMEPAD' : 'P2 NEEDS A GAMEPAD  (CONNECT ONE AND PRESS A BUTTON)')
      : n >= 1 ? `GAMEPAD DETECTED: ${pads()[0].id.slice(0, 48)}` : 'NO GAMEPAD DETECTED  -  PRESS A BUTTON ON YOUR DS4 TO WAKE IT');
    this.marker.setY(this.rows[this.sel].y + 20);
  }

  private change(dx: number) {
    const c = this.cfg, r = ROWS[this.sel];
    const cyc = <T,>(arr: T[], cur: T) => arr[(arr.indexOf(cur) + dx + arr.length) % arr.length];
    if (r === 'mode') c.mode = cyc(MODES, c.mode);
    else if (r === 'court') { c.court = cyc(COURTS.map((x) => x.id) as CourtId[], c.court); this.buildCourt(); }
    else if (r === 'look1') { c.look1 = (c.look1 + dx + PRESETS.length) % PRESETS.length; this.makePups(); }
    else if (r === 'look2') { c.look2 = (c.look2 + dx + PRESETS.length) % PRESETS.length; this.makePups(); }
    else if (r === 'level') c.level = cyc(LEVELS, c.level);
    else if (r === 'target') c.target = cyc(TARGETS, c.target);
    this.refresh();
  }

  update(_t: number, dtMs: number) {
    const dt = dtMs / 1000;
    this.t += dt;
    const n = this.nav.poll(dt);
    if (n.dy) { this.sel = (this.sel + n.dy + ROWS.length) % ROWS.length; this.refresh(); }
    if (n.dx) this.change(n.dx);
    if (n.ok) {
      if (ROWS[this.sel] === 'start') this.scene.start('game', { ...this.cfg });
      else this.change(1);
    }
    this.court?.update(this.t, dt);
    this.pups.forEach((p, i) => {
      const r = restRig();
      const b = Math.sin(this.t * 2.4 + i) * 1.5;
      r.hipY = 84 + b; r.lean = 0.08;
      const sh = p.shoulder(r);
      r.fHx = sh.x + 30; r.fHy = sh.y - 24; r.bHx = sh.x + 14; r.bHy = sh.y - 40;
      if (i === 1) { r.fHx = sh.x + 34; r.fHy = sh.y + 4; r.bHx = sh.x + 24; r.bHy = sh.y - 6; r.hipY = 78 + b; r.fFx = 16; r.bFx = -16; }
      p.ease(r, dt, 14);
    });
  }
}
void W;
