import Phaser from 'phaser';
import { GH, GW, PX, Pix, pixTexture } from './pixel';
import { Puppet, Rig, restRig } from './puppet';
import { BASE_LOADOUT, FITS, Loadout, buildLoadout, itemById, rivalFor, STARTER_EQUIP, REGION_IDS } from './loadout';

/** Dev-only sprite lab: `/?lab=1` shows a row of puppets in a few poses. */
export class LabScene extends Phaser.Scene {
  pups: Puppet[] = [];
  constructor() { super('lab'); }

  create() {
    const bg = new Pix(GW, GH);
    bg.rect(0, 0, GW, GH, 0x5a6a80);
    bg.rect(0, 190, GW, 50, 0x3a4250);
    pixTexture(this, 'labbg', bg);
    this.add.image(0, 0, 'labbg').setOrigin(0).setScale(PX);
    const cam = this.cameras.main;
    cam.setZoom(1 / PX); cam.setScroll(GW, GH);
    const q = new URLSearchParams(location.search);
    const looks: Loadout[] = [];
    const fitIdx = +(q.get('fit') ?? 0);
    for (let i = 0; i < 6; i++) {
      const eq = { ...STARTER_EQUIP };
      const f = FITS[(fitIdx + i) % FITS.length];
      for (const id of f.items) { const it = itemById(id); eq[it.slot] = id; }
      looks.push(buildLoadout(eq, f.name));
    }
    void BASE_LOADOUT; void rivalFor; void REGION_IDS;
    const pose = q.get('pose') ?? 'idle';
    looks.forEach((l, i) => {
      const p = new Puppet(this, l);
      p.root.setPosition((40 + i * 68) * PX, 190 * PX).setDepth(10);
      p.setFacing(i % 2 ? -1 : 1);
      p.snap(this.poseFor(pose, i));
      this.pups.push(p);
    });
  }

  poseFor(name: string, i: number): Rig {
    const r = restRig();
    const S = (rr: Rig) => ({ x: Math.sin(rr.lean) * 52, y: rr.hipY + Math.cos(rr.lean) * 52 });
    const hands = (fx: number, fy: number, bx: number, by: number) => { const s = S(r); r.fHx = s.x + fx; r.fHy = s.y + fy; r.bHx = s.x + bx; r.bHy = s.y + by; };
    if (name === 'run') { r.lean = 0.3; r.hipY = 82; r.fFx = 24; r.fFy = 0; r.bFx = -22; r.bFy = 16; r.bAnk = 0.4; hands(-10, -34, 22, -26); }
    else if (name === 'shoot') { r.hipY = 92; r.lean = 0.08; hands(16, 62, 24, 46); r.fFy = r.bFy = 12; r.fAnk = r.bAnk = 0.5; }
    else if (name === 'stance') { r.hipY = 74; r.lean = 0.14; r.fFx = 18; r.bFx = -16; hands(36, 6, 24, -4); }
    else hands(8, -58, -2, -58);
    r.emo = i % 3 === 0 ? 1 : 0;
    return r;
  }
}
