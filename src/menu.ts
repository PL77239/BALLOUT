import { music } from './music';
import Phaser from 'phaser';
import { AiLevel } from './tuning';
import { COURTS, CourtId, CourtScene, buildCourt, courtInfo } from './courts';
import { MenuNav } from './input';
import { FITS, ITEMS, Item, Loadout, REGIONS, SKIN_NAMES, SLOTS, SLOT_NAMES, STARTER_EQUIP, Slot, buildLoadout, itemById, itemsFor, rivalFor } from './loadout';
import { Puppet, Rig, restRig } from './puppet';
import { GH, GW, PX, mix } from './pixel';
import { setViewport } from './viewport';
import { label } from './font';
import { buyFit, buyItem, equip, fitCost, owns, persist, save } from './save';
import type { GameCfg } from './game';

type Screen = 'main' | 'play' | 'locker' | 'shop';
const MODES: GameCfg['mode'][] = ['1p', '2p'];
const LEVELS: AiLevel[] = ['rookie', 'hooper', 'legend'];
const TARGETS = [7, 11, 15, 21];
const MAIN_ROWS = ['PLAY', 'LOCKER', 'SHOP'] as const;
const PLAY_ROWS = ['COURT', 'MODE', 'CPU LEVEL', 'FIRST TO', 'RIVAL', 'START'] as const;
const SHOP_TABS = ['FITS', ...SLOTS] as const;
type Tab = (typeof SHOP_TABS)[number];

const ORANGE = 0xff7a1a, GREY = 0x8a8aa0, DIM = 0x5a5a70, WHITE = 0xffffff, GOLD = 0xffd24a, GREEN = 0x7dffb0;

export class MenuScene extends Phaser.Scene {
  private nav = new MenuNav();
  private screen: Screen = 'main';
  private sel = 0;
  private cfg = { mode: '1p' as GameCfg['mode'], court: 'brooklyn' as CourtId, level: 'hooper' as AiLevel, target: 11 };
  private court?: CourtScene;
  private courtId?: CourtId;
  private g!: Phaser.GameObjects.Graphics;
  private ui: Phaser.GameObjects.GameObject[] = [];
  private pups: Puppet[] = [];
  private rival!: Loadout;
  private t = 0;
  private tab = 0;
  private shopSel = 0;
  private msg = '';
  private msgT = 0;
  private lockSel = 0;
  private previewOverlay: Partial<Loadout> | null = null;

  constructor() { super('menu'); }

  create() {
    setViewport(this, GW, GH);
    this.cameras.main.setZoom(1 / PX).setScroll(GW, GH).setBackgroundColor('#000000');
    this.ui = []; this.pups = []; this.t = 0; this.sel = 0; this.screen = 'main'; this.msg = ''; this.previewOverlay = null;
    const s = save();
    this.cfg.court = (COURTS.some((c) => c.id === s.lastCourt) ? s.lastCourt : 'brooklyn') as CourtId;
    this.cfg.level = (LEVELS as string[]).includes(s.level) ? (s.level as AiLevel) : 'hooper';
    this.cfg.target = TARGETS.includes(s.target) ? s.target : 11;
    this.g = this.add.graphics().setDepth(5000);
    music.play('menu');
    this.rollRival();
    this.setCourt(this.cfg.court);
    this.makePups();
    this.build();
  }

  private rollRival() { this.rival = rivalFor(courtInfo(this.cfg.court).region); }

  private setCourt(id: CourtId) {
    if (this.courtId === id && this.court) return;
    this.court?.destroy();
    this.court = buildCourt(this, id);
    this.courtId = id;
    this.pups.forEach((p) => p.root.setDepth(600));
  }

  private myLook(): Loadout { return buildLoadout(save().equip, 'YOU'); }

  private makePups() {
    this.pups.forEach((p) => p.destroy());
    this.pups = [];
    const big = this.screen === 'locker' || this.screen === 'shop';
    const mk = (l: Loadout, x: number, y: number, f: number, sc: number, depth: number) => {
      const p = new Puppet(this, l, { scale: sc, w: sc > 1 ? 180 : 128, h: sc > 1 ? 150 : 104 });
      p.root.setPosition(x * PX, y * PX).setDepth(depth);
      p.setFacing(f); p.snap(this.idle(0));
      this.pups.push(p);
    };
    if (big) mk(this.previewLook(), 322, 206, -1, 1.5, 600);
    else {
      mk(this.myLook(), 266, 188, 1, 1, 600);
      mk(this.rival, 336, 194, -1, 1, 620);
    }
  }

  private previewLook(): Loadout {
    const l = this.myLook();
    return this.previewOverlay ? { ...l, ...this.previewOverlay } : l;
  }

  private idle(t: number): Rig {
    const r = restRig();
    r.hipY += Math.sin(t * 2.4) * 1.4; r.lean = 0.05 + Math.sin(t * 1.2) * 0.012;
    r.head = Math.sin(t * 0.7) * 0.05;
    return r;
  }

  private clearUi() { this.ui.forEach((o) => o.destroy()); this.ui = []; this.g.clear(); }

  private R(x: number, y: number, w: number, h: number, c: number, a = 1) {
    this.g.fillStyle(c, a); this.g.fillRect(Math.round(x) * PX, Math.round(y) * PX, Math.round(w) * PX, Math.round(h) * PX);
  }

  private T(x: number, y: number, s: string, c = WHITE, k = 1, ox = 0) {
    const t = label(this, x * PX, y * PX, s, c, { k, ox, depth: 5010 });
    this.ui.push(t);
    return t;
  }

  private panel(x: number, y: number, w: number, h: number) {
    this.R(x - 1, y - 1, w + 2, h + 2, 0x000000, 0.9);
    this.R(x, y, w, h, 0x0a0a14, 0.86);
    this.R(x, y, w, 1, 0x2a2a40);
  }

  private shadowTitle(x: number, y: number, s: string, c: number, k: number) {
    const sh = label(this, (x + 1) * PX, (y + 1) * PX, s, 0x2a0e00, { k, depth: 5009 });
    this.ui.push(sh);
    this.T(x, y, s, c, k);
  }

  private header(sub: string) {
    this.R(0, 0, GW, 24, 0x000000, 0.82); this.R(0, 24, GW, 1, ORANGE);
    this.shadowTitle(8, 6, sub, ORANGE, 2);
    this.T(GW - 8, 5, `$${save().cash}`, GOLD, 2, 1);
  }

  private footer(s: string) {
    this.R(0, GH - 12, GW, 12, 0x000000, 0.82);
    this.T(GW / 2, GH - 10, s, DIM, 1, 0.5);
  }

  /* ------------------------------------------------------------ screens */

  private build() {
    this.clearUi();
    if (this.screen === 'main') this.buildMain();
    else if (this.screen === 'play') this.buildPlay();
    else if (this.screen === 'locker') this.buildLocker();
    else this.buildShop();
  }

  private buildMain() {
    this.R(0, 0, 150, GH, 0x000000, 0.8); this.R(150, 0, 2, GH, ORANGE);
    this.shadowTitle(10, 14, 'BALL', ORANGE, 5); this.shadowTitle(10, 52, 'OUT', GOLD, 5);
    this.T(10, 94, 'STREETBALL // NO REFS', 0xc8c8e0);
    MAIN_ROWS.forEach((r, i) => {
      const y = 116 + i * 22, on = i === this.sel;
      if (on) { this.R(6, y - 4, 138, 17, 0x1a1a2c, 0.9); this.R(6, y - 4, 2, 17, ORANGE); this.T(14, y, '>', ORANGE, 2); }
      this.T(30, y, r, on ? WHITE : GREY, 2);
    });
    const s = save();
    this.T(10, GH - 36, `CASH  $${s.cash}`, GOLD);
    this.T(10, GH - 26, `RECORD  ${s.wins}-${s.games - s.wins}`, GREY);
    this.T(10, GH - 14, 'ARROWS + ENTER', DIM);
    const ci = courtInfo(this.cfg.court);
    this.T(266, 112, 'YOU', GOLD, 1, 0.5);
    this.T(336, 112, this.rival.name, 0x7fd4ff, 1, 0.5);
    this.T(GW - 8, 8, ci.name, WHITE, 2, 1);
    this.T(GW - 8, 26, ci.sub, GOLD, 1, 1);
  }

  private buildPlay() {
    this.header('PLAY');
    this.panel(6, 32, 178, 96);
    const ci = courtInfo(this.cfg.court), c = this.cfg;
    const vals = [
      ci.name, c.mode === '1p' ? '1 PLAYER' : '2 PLAYERS', c.level.toUpperCase(), `${c.target}`,
      `${this.rival.name}`, 'GO',
    ];
    PLAY_ROWS.forEach((r, i) => {
      const y = 39 + i * 13, on = i === this.sel;
      if (on) { this.R(8, y - 3, 174, 12, 0x1c1c30, 0.95); this.R(8, y - 3, 2, 13, ORANGE); }
      this.T(14, y, r, on ? WHITE : GREY);
      if (r === 'START') this.T(96, y, on ? '> GO <' : 'GO', on ? GREEN : GREY, 1, 0.5);
      else this.T(94, y, on ? `< ${vals[i]} >` : vals[i], on ? WHITE : 0xb8b8d0);
    });
    this.T(14, 116, `${REGIONS[ci.region].name} // ${REGIONS[ci.region].city}`, DIM);
    COURTS.forEach((cc, i) => this.R(14 + i * 10, 134, 8, 3, cc.id === c.court ? ORANGE : 0x3a3a50));
    this.panel(6, 146, 178, 40);
    this.T(14, 152, ci.sub, GOLD);
    this.T(14, 164, c.mode === '1p' ? 'YOU EARN CASH FOR BUCKETS, STYLE AND WINS' : 'LOCAL VERSUS: NO CASH PAYOUT', GREY);
    this.T(14, 174, 'RIVAL GETS A RANDOM LOOK FROM THIS REGION', DIM);
    this.T(GW - 8, 30, ci.name, WHITE, 2, 1);
    this.T(266, 112, 'YOU', GOLD, 1, 0.5);
    this.T(336, 112, this.rival.name, 0x7fd4ff, 1, 0.5);
    this.footer('UP/DOWN SELECT   LEFT/RIGHT CHANGE   ENTER GO   BACKSPACE BACK');
  }

  private ownedIn(slot: Slot) { return itemsFor(slot).filter((i) => owns(i.id)); }

  private buildLocker() {
    this.header('LOCKER');
    this.panel(6, 32, 188, 166);
    const eq = save().equip;
    const rows: { name: string; value: string; extra: string }[] = [
      { name: 'SKIN', value: SKIN_NAMES[eq.skin], extra: `${eq.skin + 1}/${SKIN_NAMES.length}` },
      ...SLOTS.map((s) => {
        const list = this.ownedIn(s), i = Math.max(0, list.findIndex((x) => x.id === eq[s]));
        return { name: SLOT_NAMES[s], value: itemById(eq[s]).name, extra: `${i + 1}/${list.length}` };
      }),
    ];
    rows.forEach((r, i) => {
      const y = 38 + i * 15, on = i === this.sel;
      if (on) { this.R(8, y - 3, 184, 13, 0x1c1c30, 0.95); this.R(8, y - 3, 2, 13, ORANGE); }
      this.T(14, y, r.name, on ? WHITE : GREY);
      this.T(68, y, on ? `< ${r.value.slice(0, 17)} >` : r.value.slice(0, 17), on ? WHITE : 0xb8b8d0);
      this.T(188, y, r.extra, DIM, 1, 1);
    });
    this.T(14, 190, `${ITEMS.filter((i) => !owns(i.id)).length} MORE ITEMS IN THE SHOP`, DIM);
    this.footer('UP/DOWN SLOT   LEFT/RIGHT SWAP   BACKSPACE BACK');
  }

  private tabItems(): { id: string; name: string; price: number; region: string; owned: boolean; isFit: boolean }[] {
    const t = SHOP_TABS[this.tab];
    if (t === 'FITS') return FITS.map((f) => ({ id: f.id, name: f.name, price: fitCost(f.id), region: '', owned: f.items.every(owns), isFit: true }));
    return itemsFor(t as Slot).map((i) => ({ id: i.id, name: i.name, price: i.price, region: i.region === 'any' ? '' : REGIONS[i.region].name, owned: owns(i.id), isFit: false }));
  }

  private buildShop() {
    this.header('SHOP');
    const items = this.tabItems();
    this.shopSel = Math.min(this.shopSel, Math.max(0, items.length - 1));
    let x = 6;
    SHOP_TABS.forEach((t, i) => {
      const on = i === this.tab, w = (t === 'FITS' ? 4 : SLOT_NAMES[t as Slot].length) * 6 + 6;
      this.R(x, 28, w, 11, on ? ORANGE : 0x1a1a2c, on ? 1 : 0.9);
      this.T(x + 3, 30, t === 'FITS' ? 'FITS' : SLOT_NAMES[t as Slot], on ? WHITE : GREY);
      x += w + 2;
    });
    this.panel(6, 42, 188, 156);
    const rowsMax = 12, start = Math.max(0, Math.min(this.shopSel - 5, items.length - rowsMax));
    items.slice(start, start + rowsMax).forEach((it, k) => {
      const i = start + k, y = 46 + k * 12.5, on = i === this.shopSel;
      if (on) { this.R(8, y - 2, 184, 11, 0x1c1c30, 0.95); this.R(8, y - 2, 2, 11, ORANGE); }
      const eq = !it.isFit && save().equip[SHOP_TABS[this.tab] as Slot] === it.id;
      this.T(14, y, it.name.slice(0, 20), on ? WHITE : it.owned ? 0xb8b8d0 : GREY);
      if (it.region) this.T(104, y, it.region.slice(0, 7), DIM);
      if (eq) this.T(188, y, 'EQUIPPED', GREEN, 1, 1);
      else if (it.owned) this.T(188, y, 'OWNED', 0x5a8a6a, 1, 1);
      else this.T(188, y, `$${it.price}`, save().cash >= it.price ? GOLD : 0x9a5a5a, 1, 1);
    });
    if (items.length > rowsMax) {
      const th = Math.max(8, Math.round((rowsMax / items.length) * 150));
      this.R(190, 44 + Math.round((start / (items.length - rowsMax)) * (150 - th)), 2, th, 0x4a4a68);
    }
    const it = items[this.shopSel];
    if (it) {
      this.T(GW - 8, 46, it.name, WHITE, 1, 1);
      this.T(GW - 8, 56, it.owned ? 'IN YOUR LOCKER' : `$${it.price}`, it.owned ? GREEN : GOLD, 1, 1);
    }
    if (this.msgT > 0) this.T(GW - 8, 70, this.msg, this.msg.startsWith('NOT') ? 0xff6a5a : GREEN, 1, 1);
    this.footer('LEFT/RIGHT CATEGORY   UP/DOWN BROWSE   ENTER BUY / EQUIP   BACKSPACE BACK');
    this.applyShopPreview();
  }

  private applyShopPreview() {
    const items = this.tabItems(), it = items[this.shopSel];
    if (!it) return;
    const patch: Partial<Loadout> = {};
    if (it.isFit) { for (const id of FITS.find((f) => f.id === it.id)!.items) Object.assign(patch, itemById(id).patch); }
    else Object.assign(patch, itemById(it.id).patch);
    this.previewOverlay = patch;
    this.pups[0]?.dress(this.previewLook());
  }

  /* ------------------------------------------------------------ input */

  private go(s: Screen) {
    this.screen = s; this.sel = 0; this.previewOverlay = null;
    this.makePups();
    if (s === 'locker') this.lockSel = 0;
    this.build();
  }

  private cycle<T>(list: T[], cur: T, d: number) { return list[(list.indexOf(cur) + d + list.length) % list.length]; }

  private startGame() {
    const s = save();
    s.lastCourt = this.cfg.court; s.level = this.cfg.level; s.target = this.cfg.target; persist();
    const cfg: GameCfg = { mode: this.cfg.mode, court: this.cfg.court, p1: this.myLook(), p2: this.rival, level: this.cfg.level, target: this.cfg.target };
    this.court?.destroy();
    this.court = undefined;
    this.courtId = undefined;
    this.scene.start('game', cfg);
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(dtMs / 1000, 0.05);
    this.t += dt;
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0 && this.screen === 'shop') this.build(); }
    this.court?.update(this.t, dt);
    const tint = (x: number, y: number) => this.court?.tintAt(x * PX, y * PX) ?? 0xffffff;
    this.pups.forEach((p, i) => { p.update(this.idle(this.t + i * 1.7), dt); p.setTint(mix(tint(p.root.x / PX, p.root.y / PX), 0xffffff, 0.2)); });
    const n = this.nav.poll(dt);
    if (!n.dx && !n.dy && !n.ok && !n.back) return;
    if (this.screen === 'main') this.inMain(n);
    else if (this.screen === 'play') this.inPlay(n);
    else if (this.screen === 'locker') this.inLocker(n);
    else this.inShop(n);
  }

  private inMain(n: { dx: number; dy: number; ok: boolean }) {
    if (n.dy) { this.sel = (this.sel + n.dy + MAIN_ROWS.length) % MAIN_ROWS.length; this.build(); }
    if (n.ok) this.go(['play', 'locker', 'shop'][this.sel] as Screen);
  }

  private inPlay(n: { dx: number; dy: number; ok: boolean; back: boolean }) {
    const c = this.cfg;
    if (n.back) { this.go('main'); return; }
    if (n.dy) this.sel = (this.sel + n.dy + PLAY_ROWS.length) % PLAY_ROWS.length;
    if (n.dx) {
      const d = n.dx;
      switch (PLAY_ROWS[this.sel]) {
        case 'COURT': c.court = COURTS[(COURTS.findIndex((x) => x.id === c.court) + d + COURTS.length) % COURTS.length].id; this.setCourt(c.court); this.rollRival(); this.makePups(); break;
        case 'MODE': c.mode = this.cycle(MODES, c.mode, d); break;
        case 'CPU LEVEL': c.level = this.cycle(LEVELS, c.level, d); break;
        case 'FIRST TO': c.target = this.cycle(TARGETS, c.target, d); break;
        case 'RIVAL': this.rollRival(); this.pups[1]?.dress(this.rival); break;
        default: break;
      }
    }
    if (n.ok) {
      if (PLAY_ROWS[this.sel] === 'START') this.startGame();
      else if (PLAY_ROWS[this.sel] === 'RIVAL') { this.rollRival(); this.pups[1]?.dress(this.rival); }
      else this.sel = PLAY_ROWS.length - 1;
    }
    this.build();
  }

  private inLocker(n: { dx: number; dy: number; back: boolean }) {
    if (n.back) { this.go('main'); return; }
    const rows = SLOTS.length + 1;
    if (n.dy) this.sel = (this.sel + n.dy + rows) % rows;
    if (n.dx) {
      if (this.sel === 0) { const e = save().equip; e.skin = (e.skin + n.dx + SKIN_NAMES.length) % SKIN_NAMES.length; persist(); }
      else {
        const slot = SLOTS[this.sel - 1], list = this.ownedIn(slot), eq = save().equip;
        const i = Math.max(0, list.findIndex((x) => x.id === eq[slot]));
        equip(slot, list[(i + n.dx + list.length) % list.length].id);
      }
      this.pups[0]?.dress(this.myLook());
    }
    this.build();
  }

  private inShop(n: { dx: number; dy: number; ok: boolean; back: boolean }) {
    if (n.back) { this.go('main'); return; }
    if (n.dx) { this.tab = (this.tab + n.dx + SHOP_TABS.length) % SHOP_TABS.length; this.shopSel = 0; }
    const items = this.tabItems();
    if (n.dy) this.shopSel = (this.shopSel + n.dy + items.length) % items.length;
    if (n.ok) {
      const it = items[this.shopSel];
      const t = SHOP_TABS[this.tab] as Tab;
      if (it.isFit) {
        const f = FITS.find((x) => x.id === it.id)!;
        if (!it.owned && !buyFit(f.id)) this.note('NOT ENOUGH CASH');
        else { for (const id of f.items) { const im = itemById(id); equip(im.slot, id); } save().equip.skin = save().equip.skin; persist(); this.note(it.owned ? 'FIT EQUIPPED' : 'BOUGHT + EQUIPPED'); }
      } else if (!it.owned && !buyItem(it.id)) this.note('NOT ENOUGH CASH');
      else { equip(t as Slot, it.id); this.note(it.owned ? 'EQUIPPED' : 'BOUGHT + EQUIPPED'); }
    }
    this.build();
  }

  private note(s: string) { this.msg = s; this.msgT = 1.6; }
}

void STARTER_EQUIP; void ({} as Item);
