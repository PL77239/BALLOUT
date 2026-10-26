/** Release timing tier for shots and slams. */
export type TimingGrade = 'green' | 'good' | 'slightEarly' | 'slightLate' | 'veryEarly' | 'veryLate' | 'bad';

export const MAKE_ODDS: Record<TimingGrade, number> = {
  green: 0.99,
  good: 0.6,
  slightEarly: 0.2,
  slightLate: 0.2,
  veryEarly: 0.05,
  veryLate: 0.05,
  bad: 0.07,
};

const LABEL: Record<TimingGrade, string> = {
  green: 'GREEN',
  good: 'GOOD',
  slightEarly: 'SLIGHTLY EARLY',
  slightLate: 'SLIGHTLY LATE',
  veryEarly: 'VERY EARLY',
  veryLate: 'VERY LATE',
  bad: 'OFF',
};

export const timingLabel = (g: TimingGrade) => LABEL[g];

/** `e` = meter − sweet; `green` = half-width of the perfect window. */
export function gradeRelease(e: number, green: number): TimingGrade {
  const ae = Math.abs(e);
  const g = Math.max(green, 0.001);
  if (ae <= g) return 'green';
  if (ae <= g * 1.55) return 'good';
  const slight = g * 2.35;
  const very = g * 4.2;
  if (e < 0) {
    if (ae <= slight) return 'slightEarly';
    if (ae <= very) return 'veryEarly';
    return 'bad';
  }
  if (ae <= slight) return 'slightLate';
  if (ae <= very) return 'veryLate';
  return 'bad';
}

export function gradeDunk(deltaSec: number, windowSec: number): TimingGrade {
  const ae = Math.abs(deltaSec);
  const w = Math.max(windowSec, 0.001);
  if (ae <= w) return 'green';
  if (ae <= w * 1.55) return 'good';
  const slight = w * 2.35;
  const very = w * 4.2;
  if (deltaSec < 0) {
    if (ae <= slight) return 'slightEarly';
    if (ae <= very) return 'veryEarly';
    return 'bad';
  }
  if (ae <= slight) return 'slightLate';
  if (ae <= very) return 'veryLate';
  return 'bad';
}
