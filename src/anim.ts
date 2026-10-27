import { Rig, restRig } from './puppet';
import { T } from './tuning';
import { clamp, lerp, smooth } from './pixel';
import type { Hooper } from './hooper';
import type { GameScene } from './game';

export interface Pose { rig: Rig; pinF: boolean; pinB: boolean }

const TAU = Math.PI * 2;
const ease = (t: number) => smooth(t);
const out = (t: number) => 1 - (1 - clamp(t, 0, 1)) ** 3;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);

/** Walk / run cycle: constant stride length, so cadence rises with speed and planted feet do not slide. */
function gait(r: Rig, ph: number, speed: number, wide: number, liftAdd = 0) {
  const A = 30 * smooth(speed / 70);
  const S = clamp(speed / T.move.sprint, 0, 1);
  const L = (6 + 22 * S + liftAdd) * smooth(speed / 40);
  for (let side = 0; side < 2; side++) {
    const u = (((ph / TAU) + side * 0.5) % 1 + 1) % 1;
    let x: number, y = 0, ank = 0;
    if (u < 0.5) {
      x = A * (1 - 4 * u);
      ank = u < 0.1 ? -0.18 : u > 0.38 ? 0.62 * S * seg(u, 0.38, 0.5) : 0;
    } else {
      const s = (u - 0.5) * 2;
      x = -A + 2 * A * smooth(s);
      y = L * Math.sin(Math.PI * Math.pow(s, 0.85));
      ank = lerp(0.35 * S, -0.12, s);
    }
    if (side === 0) { r.fFx = wide + x; r.fFy = y; r.fAnk = ank; } else { r.bFx = -wide + x; r.bFy = y; r.bAnk = ank; }
  }
  return smooth(speed / 40) * (0.5 + 0.5 * Math.cos(4 * ph)) * (2 + 5 * S);
}

export function poseOf(h: Hooper, g: GameScene, dt: number): Pose {
  const r = restRig();
  const f = h.facing;
  const o = g.opp(h);
  const speed = Math.hypot(h.vx, h.vz * 1.3);
  const S = clamp(speed / T.move.sprint, 0, 1);
  const along = h.vx * f;
  const vel = Math.abs(along) > 30 ? along : Math.abs(h.vz) * 0.9;
  h.ph += vel * dt * 0.052;
  const t = h.tAlive;
  const air = h.h > 4;
  const A = h.anim;
  const acc = dt > 0.0005 ? (h.vx * f - A.prevV) / dt : 0;
  A.prevV = h.vx * f;
  A.acc += (clamp(acc, -6000, 6000) - A.acc) * Math.min(1, dt * 14);
  const defending = !h.hasBall && o.hasBall;
  let pinF = false, pinB = false;

  const sh = () => h.puppet.shoulder(r);
  const hands = (fx: number, fy: number, bx: number, by: number) => {
    const s = sh();
    r.fHx = s.x + fx; r.fHy = s.y + fy; r.bHx = s.x + bx; r.bHy = s.y + by;
  };
  const breathe = Math.sin(t * 2.3) * (1 - S);

  /* ---------- baseline: locomotion + idle ---------- */
  const dip = gait(r, h.ph, speed, 13, 0);
  r.hipY = 76 - dip - Math.max(0, -breathe) * 1.4 + breathe * 0.8;
  r.lean = 0.05 + 0.2 * S + clamp(A.acc * 0.00005, -0.14, 0.2);
  if (along < -30) r.lean = -0.04 + clamp(A.acc * 0.00004, -0.06, 0.1);
  r.head = -0.04 - 0.1 * S + Math.sin(t * 0.9) * 0.03 * (1 - S);
  const swing = 12 + 26 * S;
  const pa = h.ph + Math.PI;
  hands(5 + Math.sin(pa) * swing * smooth(speed / 60) + Math.sin(t * 1.6) * 1.5 * (1 - S),
    -56 + 22 * S + 11 * S * Math.max(0, Math.sin(pa + 0.6)) + breathe * 1.2,
    -3 - Math.sin(pa) * swing * smooth(speed / 60) - Math.sin(t * 1.6) * 1.5 * (1 - S),
    -56 + 22 * S + 11 * S * Math.max(0, -Math.sin(pa + 0.6)) + breathe * 1.2);
  if (h.stamina < T.stamina.lowAt && S < 0.2 && h.act === 'free') {
    const heave = Math.sin(t * 7) * 1.6;
    r.hipY = 78 + heave; r.lean = 0.42 + heave * 0.01; r.head = 0.25;
    r.fFx = 12; r.bFx = -10;
    hands(16, -38 + heave, 8, -42 + heave);
    r.mouth = 1; r.emo = -0.6;
  }
  if (S > 0.7) r.mouth = Math.sin(t * 12) > 0.2 ? 1 : 0;

  /* ---------- ball handling ---------- */
  const handling = h.hasBall && (h.act === 'free' || h.act === 'juke' || h.act === 'recover' || h.act === 'stagger');
  if (handling) {
    r.hipY = 72 - dip * 0.6;
    r.lean = (along < -30 ? 0.05 : 0.16) + 0.14 * S + clamp(A.acc * 0.00004, -0.1, 0.12);
    r.head = -0.1 + 0.05 * Math.sin(t * 1.3);
    const ballHand = h.handSide > 0 ? 'f' : 'b';
    const c = h.carried;
    const bx = (c.x - h.x) * f, by = c.h - h.h + T.ball.r + 3;
    const s = sh();
    const guard = Math.sin(t * 3) * 1.5;
    if (ballHand === 'f') {
      r.fHx = bx; r.fHy = by; r.bHx = s.x + 20 + guard; r.bHy = s.y - 18 + (S > 0.3 ? 8 : 0);
      pinF = true;
    } else {
      r.bHx = bx; r.bHy = by; r.fHx = s.x + 24 + guard; r.fHy = s.y - 16 + (S > 0.3 ? 8 : 0);
      pinB = true;
    }
    if (speed < 40 && h.act === 'free') {
      const sway = Math.sin(t * 1.9);
      r.fFx = 18 + sway * 2; r.bFx = -16 - sway * 2;
      r.bodyX = sway * 1.2;
    }
  } else if (defending && h.act === 'free') {
    const lat = Math.abs(h.vz) > Math.abs(along) * 0.6;
    r.hipY = 66 - dip * 0.35;
    r.lean = 0.12 + 0.05 * S;
    const slide = Math.sin(h.ph * (lat ? 1 : 1));
    r.fFx = 17 + slide * 7 * S; r.bFx = -17 - slide * 7 * S;
    r.fFy = Math.max(0, Math.cos(h.ph)) * 5 * S; r.bFy = Math.max(0, -Math.cos(h.ph)) * 5 * S;
    r.fAnk = r.bAnk = 0;
    const sw = Math.sin(t * 6.5) * 4;
    const up = o.act === 'shoot' || o.act === 'release' ? 1 : 0;
    A.guard += (up - A.guard) * Math.min(1, dt * 10);
    hands(34 + A.guard * 8, 4 + sw + A.guard * 62, 22 + A.guard * 4, -6 - sw + A.guard * 54);
    r.head = -0.02 - A.guard * 0.18;
    r.emo = 0;
  }

  /* ---------- pregame / points: reactions ---------- */
  if (h.act === 'free' && !h.hasBall && g.phase !== 'live' && g.phase !== 'intro') {
    celebrate(h, r, t, hands, sh);
  } else if (g.phase === 'intro') {
    r.hipY = 73 + breathe; r.lean = 0.12;
    if (!h.hasBall) hands(30, 4, 20, -4);
  }

  /* ---------- actions ---------- */
  const p = h.actDur > 0 ? clamp(h.actT / h.actDur, 0, 1) : 0;
  switch (h.act) {
    case 'shoot': {
      const S0 = T.shot.sweet, m = h.meter;
      const u = smooth((m - 0.28) / (S0 - 0.28));
      const load = smooth(m / 0.28);
      r.hipY = m < 0.28 ? 86 - 17 * load : 69 + 25 * u;
      r.lean = h.fade ? -0.22 + 0.08 * load : 0.14 - 0.08 * u + 0.1 * (1 - load) * 0;
      const gather = 1 - u;
      hands(lerp(24, 14, u) - 4 * load * gather, lerp(-34, 62, u) - 8 * Math.sin(load * Math.PI) * gather, lerp(30, 24, u), lerp(-28, 46, u));
      r.fFx = air ? 12 : 12 + 4 * load; r.bFx = air ? -9 : -12 - 4 * load; r.fFy = r.bFy = air ? 12 + 8 * u : 0;
      r.fAnk = r.bAnk = air ? 0.62 : 0;
      if(h.layupStyle) {
        // Two distinct close finishes use the same timing and collision rules.
        const gather=smooth(m/.45), reach=smooth((m-.35)/.4);
        r.lean=.17+.15*gather; r.hipY=78+15*reach;
        r.fFx=lerp(10,30,gather);r.bFx=lerp(-10,-24,gather);
        r.fFy=air?10+22*gather:0;r.bFy=air?8:0;
        if(h.layupStyle===2){r.turn=1-.30*Math.sin(m*Math.PI);hands(lerp(16,37,reach),lerp(-30,67,reach),lerp(20,4,reach),lerp(-25,10,reach));}
        else hands(lerp(18,32,reach),lerp(-28,74,reach),lerp(22,8,reach),lerp(-25,18,reach));
      }
      r.head = m > 0.4 ? -0.28 * u : 0;
      r.mouth = u > 0.5 ? 1 : 0; r.emo = 0;
      break;
    }
    case 'release': {
      const tt = clamp(h.actT / 0.34, 0, 1);
      const flick = out(seg(tt, 0, 0.35));
      r.hipY = 93 - (h.h <= 2 ? 14 : 0) * ease(seg(tt, 0.55, 1));
      r.lean = 0.02 + 0.04 * tt;
      hands(lerp(14, 30, flick), lerp(62, 50, flick) - 18 * ease(seg(tt, 0.4, 1)), lerp(24, 36, tt), lerp(46, 6, ease(tt)));
      r.fFx = 14; r.bFx = -8; r.fFy = r.bFy = air ? 12 : 0; r.fAnk = r.bAnk = air ? 0.55 : 0;
      if(h.layupStyle){r.lean=.16;hands(lerp(30,39,flick),lerp(70,47,tt),10,8);r.fFx=30;r.bFx=-18;r.fFy=air?24:0;r.bFy=air?8:0;}
      r.head = -0.2 * (1 - tt);
      break;
    }
    case 'block': {
      const tt = h.actT;
      const crouch = 1 - seg(tt, 0, 0.09);
      r.hipY = 90 - 12 * crouch;
      r.lean = 0.0 + 0.1 * crouch;
      hands(lerp(16, 12, 1 - crouch), lerp(68, 12, crouch), lerp(8, 6, 1 - crouch), lerp(66, 8, crouch));
      r.fFx = 12; r.bFx = -10; r.fFy = r.bFy = air ? 14 : 0; r.fAnk = r.bAnk = air ? 0.5 : 0;
      r.head = -0.25; r.mouth = 1;
      break;
    }
    case 'swipe': {
      const wind = ease(seg(p, 0, 0.3)), strike = out(seg(p, 0.3, 0.62)), back = ease(seg(p, 0.62, 1));
      r.hipY = 76 - 6 * strike;
      r.lean = 0.02 + 0.3 * strike - 0.12 * wind * (1 - strike) - 0.1 * back;
      hands(lerp(30, 8, wind) + 50 * strike - 26 * back, lerp(-48, -10, wind) + 30 * strike - 12 * back, 16, -8);
      r.fFx = 22; r.bFx = -18; r.head = 0.1 * strike;
      break;
    }
    case 'shove': {
      const wind = ease(seg(p, 0, 0.3)), push = out(seg(p, 0.3, 0.6)), back = ease(seg(p, 0.65, 1));
      r.hipY = 78 - 2 * push; r.lean = 0.1 + 0.22 * push - 0.1 * wind * (1 - push);
      hands(lerp(10, 2, wind) + 46 * push - 24 * back, -2 + 6 * wind, lerp(6, 0, wind) + 34 * push - 18 * back, 4);
      r.fFx = lerp(14, 26, push); r.bFx = -14; r.mouth = 1;
      break;
    }
    case 'stagger': {
      const w = Math.sin(h.actT * 30) * 14 * (1 - p);
      r.hipY = 79; r.lean = -0.28 * (1 - p * 0.6);
      hands(20 + w, 10, -10 - w, 24);
      r.fFx = 20 + w * 0.5; r.bFx = -20; r.bFy = 8;
      r.emo = -1; r.mouth = 1; r.head = 0.22;
      break;
    }
    case 'fall': {
      const tt = h.actT;
      const trip=ease(seg(tt,0,.18)),drop=ease(seg(tt,.12,.38)),rise=ease(seg(tt,.82,1.15));
      const down=drop*(1-rise);
      // One seated collapse, with feet below the hips throughout the fall.
      // The old hips dropped below the raised ankles and flipped the leg IK.
      r.hipY=lerp(88,78,trip)*(1-down)+38*down;
      r.lean=lerp(.12,-.72,down);r.head=.18*down;
      r.fFx=lerp(18,44,down);r.bFx=lerp(-14,10,down);
      r.fFy=0;r.bFy=2*down;r.fAnk=.12*down;r.bAnk=-.08*down;
      hands(lerp(24,20,down),lerp(4,-24,down),lerp(-14,-8,down),lerp(14,-30,down));
      r.emo=-1;r.mouth=0;
      break;
    }
    case 'recover': {
      r.hipY = 78 - 6 * (1 - p); r.lean = 0.18;
      if (!h.hasBall) hands(18, -30, 8, -34);
      r.fFx = 16; r.bFx = -14;
      break;
    }
    case 'dunk': {
      const u = clamp(h.actT / T.dunk.airtime, 0, 1);
      r.fFx = 18; r.bFx = -14; r.fFy = r.bFy = air ? 16 : 0; r.fAnk = r.bAnk = air ? 0.5 : 0;
      const sx = h.dunkStyle===2 || h.trickDunk;
      if (u < 0.16) {
        const c = ease(u / 0.16);
        r.hipY = 86 - 18 * c; r.lean = 0.12 + 0.18 * c; hands(lerp(20, 26, c), lerp(-30, -32, c), lerp(18, 22, c), lerp(-28, -30, c));
        r.fFx = lerp(12, 22, c); r.bFx = lerp(-12, -20, c);
      } else if (u < 0.54) {
        const k = ease((u - 0.16) / 0.38);
        r.hipY = 94; r.lean = 0.1 + 0.1 * k;
        if (sx) { const a = -Math.PI / 2 + k * Math.PI * 2.2; hands(Math.cos(a) * 56, Math.sin(a) * 56 + 6, 14, 42); r.lean = 0.1 - 0.06 * Math.sin(k * Math.PI * 2); }
        else if(h.dunkStyle===1){r.turn=lerp(1,-.7,k);r.lean=-.12;hands(lerp(20,32,k),lerp(-30,76,k),lerp(20,8,k),lerp(-24,42,k));}
        else if(h.dunkStyle===3){r.lean=.24;hands(lerp(20,45,k),lerp(-30,80,k),lerp(20,4,k),lerp(-24,16,k));}
        else hands(lerp(20, 38, k), lerp(-30, 76, k), lerp(20, 22, k), lerp(-24, 62, k));
        r.fFy = 10 + 14 * k; r.bFy = 16 + 14 * k; r.head = -0.2;
      } else if (u < 0.74) {
        const k = ease((u - 0.54) / 0.2);
        r.hipY = 92 - 8 * k; r.lean = 0.2 - 0.1 * k;
        hands(lerp(38, 34, k), lerp(70, 62, k), lerp(22, 30, k), lerp(58, 56, k));
        r.fFx = 10; r.bFx = -10; r.fFy = 22 - 8 * k; r.bFy = 12; r.mouth = 1;
      } else {
        r.hipY = 90; hands(32, 60, 26, 54);
      }
      if(h.dunkStyle===1 && u>=.54)r.turn=lerp(-.7,1,smooth((u-.70)/.30));
      r.emo = 1;
      break;
    }
    case 'juke': {
      juke(h, r, p, hands);
      if (h.moveKind === 'btb' && h.carried) { r.bHx = (h.carried.x - h.x) * f; r.bHy = h.carried.h - h.h + T.ball.r; pinB = true; }
      break;
    }
    default: break;
  }

  if (h.moveKind === 'spin' && h.act === 'juke') {
    r.spin = p;
    // Anticipation and a fast pivot, with body dip and head lag.
    const pivot = smooth(clamp((p-.08)/.84,0,1));
    r.turn = Math.cos(pivot * TAU);
    r.hipY -= Math.sin(p*Math.PI)*4;
    r.lean += Math.sin(pivot*TAU)*.13;
    r.head -= Math.sin(pivot*TAU)*.12;
  }
  if (h.mood === 'down' && h.act === 'free' && g.phase !== 'live') r.emo = -0.8;
  A.air = air;
  return { rig: r, pinF, pinB };
}

type Hands = (fx: number, fy: number, bx: number, by: number) => void;

function juke(h: Hooper, r: Rig, p: number, hands: Hands) {
  const wind = ease(seg(p, 0, 0.22)), burst = out(seg(p, 0.2, 0.62)), rise = ease(seg(p, 0.62, 1));
  const dir = Math.sign(h.dash.x || 1) * h.facing;
  if (h.moveKind === 'cross') {
    r.hipY = 80 - 10 * wind + 12 * rise; r.lean = 0.12 - 0.14 * wind * (1 - burst) + 0.28 * burst * (1 - rise);
    r.fFx = lerp(10, 24, wind) - 6 * burst; r.bFx = lerp(-10, -22, wind) + 8 * burst;
    r.bodyX = -6 * wind * dir * (1 - burst) + 10 * burst * (1 - rise) * dir;
    r.head = 0.12 * wind;
  } else if (h.moveKind === 'spin') {
    r.hipY = 74 - 6 * Math.sin(p * Math.PI) + 8 * rise; r.lean = 0.2 + 0.1 * Math.sin(p * Math.PI);
    r.fFx = 14 - 10 * Math.sin(p * TAU) ** 2 * 0.4; r.bFx = -14;
    hands(16 + Math.sin(p * TAU) * 6, -24, 30, -6);
    r.head = -0.1;
  } else {
    r.hipY = 78 - 8 * wind + 10 * rise; r.lean = 0.16 + 0.18 * burst * (1 - rise) - 0.08 * wind * (1 - burst);
    r.fFx = lerp(12, 22, burst); r.bFx = lerp(-12, -18, burst);
    hands(lerp(14, 6, burst), lerp(-26, -34, burst), -4, -34);
    r.head = -0.08;
  }
  if(h.comboN>=2) {
    const snap=Math.sin(p*Math.PI)*(1-rise);
    r.lean+=.12*snap*dir;r.head-=.10*snap*dir;
    r.fFy+=Math.max(0,10*snap);r.bFy+=Math.max(0,4*snap);
    r.fAnk+=.16*snap;r.bAnk-=.12*snap;
  }
}

function celebrate(h: Hooper, r: Rig, t: number, hands: Hands, sh: () => { x: number; y: number }) {
  const hype = h.mood === 'hype', down = h.mood === 'down';
  if (hype) {
    const k = h.celeb;
    const bounce = Math.abs(Math.sin(t * 8));
    r.emo = 1; r.mouth = 1;
    if (k === 3) { r.hipY=82+bounce*4;r.lean=-.12;hands(48,44,12,22);r.head=-.16; }
    else if (k === 0) { r.hipY = 84 + bounce * 6; r.lean = -0.04; hands(16, 62 + bounce * 6, -4, 66 + bounce * 6); r.head = -0.2; }
    else if (k === 1) { r.hipY = 82 + bounce * 3; r.lean = 0.12; hands(58, -6, 10, -36); r.head = 0.05; }
    else { r.hipY = 80; r.lean = 0.05; const s = sh(); void s; hands(18, 6 + Math.sin(t * 10) * 3, 4, 14 + Math.sin(t * 10 + 1) * 3); r.head = Math.sin(t * 6) * 0.1; }
  } else if (down) {
    r.hipY = 80; r.lean = 0.26; r.head = 0.36 + Math.sin(t * 5) * 0.05; r.emo = -1;
    hands(10, -42, 2, -44);
  }
}
