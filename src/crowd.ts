import Phaser from 'phaser';
import { PX, clamp } from './pixel';
import { Puppet, Rig, restRig } from './puppet';
import { REGIONS, RegionId, rivalFor } from './loadout';
import type { Spot } from './courtkit';

interface Fan {
  p: Puppet;
  spot: Spot;
  phase: number;
  rate: number;
  acc: number;
  idle: number;
  cheer: number;
  look: number;
  nextLook: number;
  view: number;
  activity:number;
  nextActivity:number;
  drift:number;
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
      const l = {...rivalFor(look),topTexture:undefined,bottomTexture:undefined,chain:'none' as const};
      // At background scale favour quiet, readable cuts over bulky layers.
      if(i%3===0){l.top='tee';l.bottom='jeans';}
      if(i%3===1){l.top='hoodie';l.bottom='joggers';}
      const sc = s.kind === 'kid' ? 0.43 : 0.55;
      const p = new Puppet(scene, l, { scale: sc, w: 64, h: 58, key: `fan_${id}_${i}` });
      const spot={...s,x:s.x+(s.kind==='sit'?0:(Math.random()-.5)*22),y:s.y+(s.kind==='sit'?0:Math.floor(Math.random()*7)-3)};
      p.root.setPosition(spot.x * PX, spot.y * PX).setDepth(spot.y * PX);
      p.setFacing(Math.random()<.5?1:-1);
      this.objs.push(p.root);
      const f: Fan = { p, spot, activity:Math.floor(Math.random()*5),nextActivity:3+Math.random()*8,drift:0, view:s.kind==='sit'?.08:[.05,.12,.2,.55,.9][Math.floor(Math.random()*5)],phase: Math.random() * 6, rate: 0.7 + Math.random() * 0.6, acc: 0, idle: 0, cheer: 0, look: 0, nextLook: 1 + Math.random() * 4 };
      this.fans.push(f);
      p.snap(this.poseFor(f, 0));
    });
  }

  private poseFor(f: Fan, t: number): Rig {
    const r = restRig(), s = f.spot;
    const bob = Math.sin(t * 2.2 * f.rate + f.phase);
    const j = f.cheer > 0 ? Math.abs(Math.sin(t * 9 + f.phase)) : 0;
    const up = f.cheer > 0 ? clamp(f.cheer * 2, 0, 1) : 0;
    const sh = (hx: number, hy: number, lean: number, hipY: number) => ({ x: hx + Math.sin(lean) * 52, y: hipY + Math.cos(lean) * 52 + hy });
    if (s.kind === 'sit') {
      r.hipY = 52 + bob * 0.8; r.lean = 0.05 + bob * 0.02;
      r.fFx = 30; r.bFx = -26; r.fFy = 0; r.bFy = 0;
      const a = sh(0, 0, r.lean, r.hipY);
      r.fHx = a.x + 22; r.fHy = a.y - 30; r.bHx = a.x + 14; r.bHy = a.y - 34;
      if (up > 0) { r.fHx = a.x + 14; r.fHy = a.y + 40 * up; r.bHx = a.x - 2; r.bHy = a.y + 34 * up; r.hipY += j * 8; }
    } else if (s.kind === 'elder') {
      r.hipY = 80 + bob * 0.8; r.lean = 0.14;
      r.fFx = 8; r.bFx = -8;
      const a = sh(0, 0, r.lean, r.hipY);
      r.fHx = a.x + 2; r.fHy = a.y - 38; r.bHx = a.x - 4; r.bHy = a.y - 40;
    } else {
      r.hipY = 85 + bob * 1.1 + j * 14; r.lean = 0.03 + bob * 0.015;
      r.fFx = 11; r.bFx = -11; r.fFy = j * 10; r.bFy = j * 10;
      const a = sh(0, 0, r.lean, r.hipY);
      const cross = s.kind === 'cheer' ? 0 : 1;
      r.fHx = a.x + 4; r.fHy = a.y - 40 + (cross ? 14 : 0); r.bHx = a.x + 8; r.bHy = a.y - 38 + (cross ? 14 : 0);
      if (up > 0 || s.kind === 'cheer') {
        const k = Math.max(up, s.kind === 'cheer' ? 0.5 : 0);
        r.fHx = a.x + 12; r.fHy = a.y + 46 * k + Math.sin(t * 12 + f.phase) * 5 * k; r.bHx = a.x - 6; r.bHy = a.y + 42 * k - Math.sin(t * 12 + f.phase) * 5 * k;
      }
    }
    // City spectators face the court/camera rather than duplicating the players'
    // side profile. Alternate relaxed conversation and hands-in-lap gestures.
    r.turn = f.view + Math.sin(t*.35+f.phase)*.035;
    if(s.kind==='sit' && up===0){r.fHx=20;r.bHx=-18;r.fHy=r.hipY+12;r.bHy=r.hipY+14;}
    if(s.kind==='stand' && up===0 && Math.sin(f.phase)>0){
      r.fHx=24;r.fHy=r.hipY+42+Math.sin(t*1.4+f.phase)*4;
      r.bHx=-16;r.bHy=r.hipY+18;
    }
    if(up===0 && s.kind!=='elder'){
      if(f.activity===0){r.fHx=19;r.fHy=r.hipY+48;r.bHx=-18;r.bHy=r.hipY+23;r.head=.12;} // phone
      if(f.activity===1){r.fHx=25;r.fHy=r.hipY+64+Math.sin(t*1.7+f.phase)*3;r.bHx=-15;r.bHy=r.hipY+17;} // drink
      if(f.activity===2){r.fHx=25+Math.sin(t*2+f.phase)*8;r.fHy=r.hipY+39;r.bHx=-22;r.bHy=r.hipY+23;} // conversation
      if(f.activity===3){r.fHx=14;r.bHx=-14;r.fHy=r.hipY+30;r.bHy=r.hipY+32;} // folded arms
      if(f.activity===4 && s.kind!=='sit'){const stride=Math.sin(t*2.7+f.phase);r.fFx=12+stride*10;r.bFx=-12-stride*10;r.fFy=Math.max(0,stride)*4;r.bFy=Math.max(0,-stride)*4;r.turn=.7;}
    }
    r.head += f.look * 0.12;
    r.emo = f.cheer > 0 ? 1 : 0;
    r.mouth = f.cheer > 0 ? 0.7 : 0;
    return r;
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
      f.nextActivity-=dt;
      if(f.nextActivity<0){f.activity=Math.floor(Math.random()*5);f.nextActivity=4+Math.random()*10;f.view=[.05,.12,.3,.6,.9][Math.floor(Math.random()*5)];}
      const target=f.activity===4&&f.spot.kind!=='sit'?Math.sin(t*.24+f.phase)*7:0;
      f.drift+=(target-f.drift)*Math.min(1,dt*1.5);
      f.p.root.setPosition((f.spot.x+f.drift)*PX,f.spot.y*PX);
      f.nextLook -= dt;
      if (f.nextLook < 0) { f.look = Math.floor(Math.random() * 3) - 1; f.nextLook = 1.5 + Math.random() * 4; }
      f.acc += dt;
      const gap = f.cheer > 0 ? 2 : 5;
      if ((this.frame + i) % gap !== 0) continue;
      f.p.update(this.poseFor(f, t), f.acc, { f: false, b: false }, { f: 0, h: 0 });
      f.acc = 0;
      if (this.tint) f.p.setTint(this.tint(f.spot.x * PX, f.spot.y * PX));
    }
  }

  destroy() { for (const f of this.fans) f.p.destroy(); this.fans = []; }
}
