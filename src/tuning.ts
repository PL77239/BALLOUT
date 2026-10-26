export const W = 1280;
export const H = 720;

export const T = {
  court: { floorY: 566, laneHalf: 70, leftWall: 80, rightWall: 1228 },
  hoop: { x: 1108, rimH: 292, rimR: 27, boardH0: 274, boardH1: 402, boardX: 1148 },
  arcR: 430,
  zScale: 3,
  ball: { r: 15, g: 1800, bounce: 0.68, dribblePeriod: 0.46 },
  sim: { hz: 240, maxSteps: 24 },
  input: { buffer: 0.12 },
  move: {
    walk: 278, sprint: 438, ballMult: 0.91, zFactor: 0.8,
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
    greenHalf: 0.048,
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
  steal: { range: 112, zRange: 34, base: 0.3, sprintBonus: 0.15, lowStaminaBonus: 0.2, whiffRecover: 0.5, swipe: 0.25 },
  shove: { cooldown: 1.15, cost: 13, knock: 560, fumble: 0.4, range: 66 },
  dunk: { range: 285, airtime: 0.78, hitAt: 0.42, height: 150, greenHalf: 0.038 },
  rules: { target: 11, makeItTakeIt: true, insidePts: 1, arcPts: 2, dunkPts: 2 },
  ai: {
    rookie: { shootJitter: 0.145, react: 0.58, aggr: 0.12, shoot: 0.22 },
    hooper: { shootJitter: 0.1, react: 0.4, aggr: 0.38, shoot: 0.45 },
    legend: { shootJitter: 0.065, react: 0.24, aggr: 0.58, shoot: 0.62 },
  },
};

export type AiLevel = keyof typeof T.ai;
