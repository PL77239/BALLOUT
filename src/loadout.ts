export type TopKind = 'tank' | 'tee' | 'hoodie';
export type BottomKind = 'shorts' | 'longShorts' | 'sweats';
export type HeadKind = 'none' | 'fullcap' | 'beanie' | 'headband' | 'durag';
export type HairKind = 'fade' | 'afro' | 'braids' | 'bald';
export type ShoeKind = 'high' | 'low';

export interface Loadout {
  name: string;
  skin: number;
  hair: HairKind;
  hairColor: number;
  head: HeadKind;
  headColor: number;
  headTrim: number;
  top: TopKind;
  topColor: number;
  topTrim: number;
  bottom: BottomKind;
  bottomColor: number;
  bottomTrim: number;
  shoes: ShoeKind;
  shoeColor: number;
  shoeSole: number;
  socks: boolean;
  sockColor: number;
  chain: boolean;
  wristbands: boolean;
  wristColor: number;
}

export const SKIN_TONES = [0xf0c6a0, 0xc68a5b, 0x9a6038, 0x5e3a24];

export const PRESETS: Loadout[] = [
  {
    name: 'BED-STUY', skin: 2, hair: 'fade', hairColor: 0x15110e,
    head: 'fullcap', headColor: 0x111111, headTrim: 0xff7a1a,
    top: 'hoodie', topColor: 0x1b1b20, topTrim: 0xff7a1a,
    bottom: 'longShorts', bottomColor: 0x1b1b20, bottomTrim: 0xff7a1a,
    shoes: 'high', shoeColor: 0xf4f4f0, shoeSole: 0xff7a1a,
    socks: true, sockColor: 0xf4f4f0, chain: true, wristbands: false, wristColor: 0xffffff,
  },
  {
    name: 'SOUTH SIDE', skin: 1, hair: 'braids', hairColor: 0x120c0a,
    head: 'headband', headColor: 0xd01c24, headTrim: 0xffffff,
    top: 'tank', topColor: 0xd01c24, topTrim: 0x111111,
    bottom: 'shorts', bottomColor: 0x111111, bottomTrim: 0xd01c24,
    shoes: 'high', shoeColor: 0x111111, shoeSole: 0xd01c24,
    socks: true, sockColor: 0xffffff, chain: false, wristbands: true, wristColor: 0xd01c24,
  },
  {
    name: 'HARLEM', skin: 3, hair: 'afro', hairColor: 0x0d0907,
    head: 'none', headColor: 0, headTrim: 0,
    top: 'tee', topColor: 0x5a2d91, topTrim: 0xf2c230,
    bottom: 'longShorts', bottomColor: 0x5a2d91, bottomTrim: 0xf2c230,
    shoes: 'low', shoeColor: 0xf2c230, shoeSole: 0xffffff,
    socks: true, sockColor: 0xf2c230, chain: true, wristbands: true, wristColor: 0xf2c230,
  },
  {
    name: 'QUEENS GHOST', skin: 0, hair: 'bald', hairColor: 0x2a2018,
    head: 'beanie', headColor: 0x22262c, headTrim: 0x8d949e,
    top: 'hoodie', topColor: 0x8d949e, topTrim: 0x22262c,
    bottom: 'sweats', bottomColor: 0x3a3f47, bottomTrim: 0x8d949e,
    shoes: 'low', shoeColor: 0x22262c, shoeSole: 0xdadde2,
    socks: false, sockColor: 0xffffff, chain: false, wristbands: false, wristColor: 0xffffff,
  },
];
