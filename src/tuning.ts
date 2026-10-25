export const W = 1280;
export const H = 720;

export const T = {
  court: { floorY: 566, laneHalf: 70, leftWall: 80, rightWall: 1228 },
  hoop: { x: 1108, rimH: 292, rimR: 27, boardH0: 274, boardH1: 402, boardX: 1148 },
  arcR: 430,
  zScale: 3,
  ball: { r: 13, g: 1800, bounce: 0.68, dribblePeriod: 0.46 },
  move: { walk: 235, sprint: 372, ballMult: 0.9, zFactor: 0.72, accel: 2700, stopAccel: 3300 },
  stamina: { max: 100, sprintDrain: 20, regen: 17, regenIdleBonus: 10, lowAt: 22 },
  heat: { max: 100, decay: 2.4, fireTime: 14 },
  jump: { g: 2400, vBlock: 790 },
  shot: {
    meterTime: 0.85,
    sweet: 0.8,
    greenHalf: 0.058,
    pumpTap: 0.16,
    contestRange: 165,
    contestPenalty: 0.62,
    fadePenalty: 0.8,
    fadeContest: 0.5,
    shovedPenalty: 0.45,
    fireBonus: 1.6,
    missK: 340,
  },
  moves: { comboWindow: 0.8, ankleCheckAt: 0.15, ankleRange: 128, ankleZ: 56, protect: 0.34 },
  steal: { range: 112, zRange: 34, base: 0.3, sprintBonus: 0.15, lowStaminaBonus: 0.2, whiffRecover: 0.62 },
  shove: { cooldown: 1.15, cost: 13, knock: 560, fumble: 0.4, range: 66 },
  dunk: { range: 310, airtime: 0.74, hitAt: 0.4, height: 150 },
  rules: { target: 11, makeItTakeIt: true, insidePts: 1, arcPts: 2, dunkPts: 2 },
  ai: {
    rookie: { shootJitter: 0.095, react: 0.34, aggr: 0.35, shoot: 0.5 },
    hooper: { shootJitter: 0.06, react: 0.2, aggr: 0.6, shoot: 0.7 },
    legend: { shootJitter: 0.035, react: 0.1, aggr: 0.85, shoot: 0.9 },
  },
};

export type AiLevel = keyof typeof T.ai;
