export const W = 1280;
export const H = 720;

export const T = {
  /** Global sim pace; lower = slower, heavier decisions. */
  pace: 0.82,
  court: { floorY: 566, laneHalf: 70, leftWall: 80, rightWall: 1228 },
  hoop: { x: 1108, rimH: 292, rimR: 27, boardH0: 274, boardH1: 402, boardX: 1148 },
  arcR: 430,
  zScale: 3,
  ball: { r: 15, g: 1800, bounce: 0.68, dribblePeriod: 0.46 },
  sim: { hz: 240, maxSteps: 24 },
  input: { buffer: 0.12 },
  move: {
    walk: 252, sprint: 395, ballMult: 0.9, zFactor: 0.8,
    accel: 5600, stopAccel: 8400, turnMult: 1.7,
    burst: 1.5, burstTime: 0.16,
    sprintFloor: 380,
  },
  stamina: { max: 100, sprintDrain: 22, regen: 17, regenIdleBonus: 10, lowAt: 22 },
  heat: { max: 100, decay: 2.4, fireTime: 14 },
  jump: { g: 2600, vBlock: 830 },
  shot: {
    meterTime: 0.92,
    sweet: 0.8,
    greenHalf: 0.036,
    pumpTap: 0.16,
    contestRange: 165,
    contestPenalty: 0.62,
    fadePenalty: 0.8,
    fadeContest: 0.5,
    shovedPenalty: 0.45,
    fireBonus: 1.6,
    missK: 340,
  },
  moves: { comboWindow: 0.8, ankleCheckAt: 0.12, ankleRange: 140, ankleZ: 56, protect: 0.3, dash: 1.3, dur: { cross: 0.28, spin: 0.38, btb: 0.31 } },
  steal: { range: 112, zRange: 34, base: 0.28, sprintBonus: 0.42, jukeBonus: 0.36, lowStaminaBonus: 0.2, whiffRecover: 0.5, swipe: 0.25 },
  shove: { cooldown: 1.15, cost: 13, knock: 560, fumble: 0.4, range: 66 },
  dunk: { range: 155, airtime: 0.8, hitAt: 0.44, height: 150, greenHalf: 0.075, windowSec: 0.12 },
  rules: { target: 11, makeItTakeIt: true, insidePts: 1, arcPts: 2, dunkPts: 2 },
  ai: {
    rookie: { shootJitter: 0.13, react: 0.53, aggr: 0.17, shoot: 0.27 },
    hooper: { shootJitter: 0.09, react: 0.37, aggr: 0.42, shoot: 0.49 },
    legend: { shootJitter: 0.06, react: 0.22, aggr: 0.62, shoot: 0.66 },
  },
};

export type AiLevel = keyof typeof T.ai;
