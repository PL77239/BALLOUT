import Phaser from 'phaser';
import { GH, GW, PX, Pix, pixTexture } from './pixel';
import { setViewport } from './viewport';
import { CourtId, CourtScene, buildCourt } from './courts';
import { Puppet, Rig, restRig } from './puppet';
import { BASE_LOADOUT, FITS, Loadout, buildLoadout, itemById, rivalFor, STARTER_EQUIP, REGION_IDS } from './loadout';

/** Dev-only sprite lab: `/?lab=1` shows a row of puppets in a few poses. */
export class LabScene extends Phaser.Scene {
  pups: Puppet[] = [];
  court?: CourtScene;
  constructor() { super('lab'); }

  create() {
    setViewport(this, GW, GH);
    const q0 = new URLSearchParams(location.search);
    const cid = q0.get('court') as CourtId | null;
    const bg = new Pix(GW, GH);
    bg.rect(0, 0, GW, GH, 0x5a6a80);
    bg.rect(0, 190, GW, 50, 0x3a4250);
    pixTexture(this, 'labbg', bg);
    if (!cid) this.add.image(0, 0, 'labbg').setOrigin(0).setScale(PX);
    else this.court = buildCourt(this, cid);
    const cam = this.cameras.main;
    cam.setZoom(1 / PX); cam.setScroll(GW, GH);
    const q = new URLSearchParams(location.search);
    const looks: Loadout[] = [];
    const fitIdx = +(q.get('fit') ?? 0);
    for (let i = 0; i < 6; i++) {
      const eq = { ...STARTER_EQUIP };
      const f = FITS[(fitIdx + i) % FITS.length];
      for (const id of f.items) { const it = itemById(id); eq[it.slot] = id; }
      const l = buildLoadout(eq, f.name);
      const tops = (q.get('top') ?? '').split(',').filter(Boolean);
      if (tops.length) l.top = tops[i % tops.length] as Loadout['top'];
      looks.push(l);
    }
    void BASE_LOADOUT; void rivalFor; void REGION_IDS;
    const pose = q.get('pose') ?? 'idle';
    looks.forEach((l, i) => {
      if (cid && i > 1) return;
      const p = new Puppet(this, l);
      if (cid) p.root.setPosition((cid && i ? 300 : 200) * PX, (186 + i * 6) * PX).setDepth((186 + i * 6) * PX);
      else p.root.setPosition((40 + i * 68) * PX, 190 * PX).setDepth(10);
      p.setFacing(i % 2 ? -1 : 1);
      p.snap(this.poseFor(pose, i));
      this.pups.push(p);
    });
  }

  update(t: number, dt: number) { this.court?.update(t / 1000, dt / 1000); }

  poseFor(name: string, i: number): Rig {
    const r = restRig();
    const S = (rr: Rig) => ({ x: Math.sin(rr.lean) * 52, y: rr.hipY + Math.cos(rr.lean) * 52 });
    const hands = (fx: number, fy: number, bx: number, by: number) => { const s = S(r); r.fHx = s.x + fx; r.fHy = s.y + fy; r.bHx = s.x + bx; r.bHy = s.y + by; };
    if (name === 'run') { r.lean = 0.3; r.hipY = 82; r.fFx = 24; r.fFy = 0; r.bFx = -22; r.bFy = 16; r.bAnk = 0.4; hands(-10, -34, 22, -26); }
    else if (name === 'shoot') { r.hipY = 92; r.lean = 0.08; hands(16, 62, 24, 46); r.fFy = r.bFy = 12; r.fAnk = r.bAnk = 0.5; }
    else if (name === 'stance') { r.hipY = 74; r.lean = 0.14; r.fFx = 18; r.bFx = -16; hands(36, 6, 24, -4); }
    else hands(8, -58, -2, -58);
    r.emo = i % 3 === 0 ? 1 : 0;
    const tq = new URLSearchParams(location.search).get('turn');
    if (tq !== null) r.turn = +tq;
    return r;
  }
}
