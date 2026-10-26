import type { TopKind } from './loadout';

/** Art-pixel measurements; item colors and prints do not define its silhouette. */
export interface GarmentCut {
  hem: number; waist: number; chest: number; shoulder: number;
  sleeve: number; cuff: number; neck: number;
}
export const GARMENT_CUTS: Record<TopKind, GarmentCut> = {
  tank:       { hem: 1, waist: 5.5, chest: 7.1, shoulder: 5.8, sleeve: 0, cuff: 0, neck: 3.0 },
  jersey:     { hem: -2, waist: 7.2, chest: 8.0, shoulder: 6.4, sleeve: 0, cuff: 0, neck: 3.4 },
  tee:        { hem: 0, waist: 7.0, chest: 8.0, shoulder: 8.2, sleeve: .55, cuff: 3.4, neck: 2.3 },
  bigTee:     { hem: -5, waist: 9.0, chest: 9.4, shoulder: 8.7, sleeve: .86, cuff: 4.5, neck: 2.6 },
  longsleeve: { hem: 0, waist: 6.2, chest: 7.3, shoulder: 7.6, sleeve: 1, cuff: 2.3, neck: 2.1 },
  hoodie:     { hem: -2, waist: 8.4, chest: 9.3, shoulder: 8.4, sleeve: 1, cuff: 3.4, neck: 2.0 },
  flannel:    { hem: -3, waist: 8.0, chest: 8.6, shoulder: 8.7, sleeve: 1, cuff: 2.9, neck: 3.0 },
  puffer:     { hem: 1, waist: 9.5, chest: 11, shoulder: 10, sleeve: 1, cuff: 4.8, neck: 1.6 },
};
export type TopGraphic = 'none' | 'number' | 'box' | 'diagonal' | 'stripe' | 'cross' | 'stars' | 'stacked';
