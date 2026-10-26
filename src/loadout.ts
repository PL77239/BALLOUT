import type { Col } from './pixel';
import type { TopGraphic } from './wardrobe';

export type RegionId = 'bk' | 'chi' | 'chiraq' | 'warsaw' | 'harlem' | 'queens' | 'philly' | 'detroit' | 'atl' | 'la';
export type HairKind = 'bald' | 'fade' | 'hightop' | 'waves' | 'afro' | 'braids' | 'locs' | 'twists';
export type HeadKind = 'none' | 'fullcap' | 'backcap' | 'fitted' | 'beanie' | 'headband' | 'durag' | 'bucket' | 'bandana';
export type FaceKind = 'none' | 'shades' | 'beard' | 'goatee' | 'glasses' | 'stache' | 'grillz';
export type TopKind = 'tank' | 'tee' | 'hoodie' | 'jersey' | 'longsleeve' | 'bigTee' | 'flannel' | 'puffer';
export type BottomKind = 'shorts' | 'longShorts' | 'sweats' | 'joggers' | 'jeans' | 'jorts' | 'khakis' | 'chinoShorts';
export type ShoeKind = 'high' | 'low' | 'runner' | 'boot' | 'cortez' | 'slides';
export type SockKind = 'none' | 'crew' | 'long' | 'stripe';
export type ChainKind = 'none' | 'gold' | 'silver' | 'cuban' | 'rope' | 'cross' | 'rosary' | 'ice';
export type WristKind = 'none' | 'bands' | 'sleeve' | 'watch';
export type Slot = 'hair' | 'head' | 'face' | 'top' | 'bottom' | 'shoes' | 'socks' | 'chain' | 'wrist';

export interface Loadout {
  name: string;
  skin: number;
  hair: HairKind; hairColor: Col;
  head: HeadKind; headColor: Col; headTrim: Col;
  face: FaceKind; faceColor: Col;
  top: TopKind; topColor: Col; topTrim: Col;
  /** Optional item-level details; old saves and rivals remain compatible. */
  topGraphic?: TopGraphic; jerseyNumber?: number;
  bottom: BottomKind; bottomColor: Col; bottomTrim: Col;
  bottomDetail?: 'none' | 'stitched' | 'crosses' | 'ripped' | 'stripe';
  shoes: ShoeKind; shoeColor: Col; shoeSole: Col; shoeTrim: Col;
  socks: SockKind; sockColor: Col; sockTrim: Col;
  chain: ChainKind;
  wrist: WristKind; wristColor: Col;
}

export const SKIN_TONES: Col[] = [0xf2cfa8, 0xd9a273, 0xb87a4b, 0x8a5634, 0x5e3a24, 0x3f2618];
export const SKIN_NAMES = ['LIGHT', 'TAN', 'CARAMEL', 'BROWN', 'DEEP', 'EBONY'];

export const BASE_LOADOUT: Loadout = {
  name: 'HOOPER', skin: 3,
  hair: 'fade', hairColor: 0x15110e,
  head: 'none', headColor: 0x111111, headTrim: 0xffffff,
  face: 'none', faceColor: 0x111111,
  top: 'tee', topColor: 0xf0f0ea, topTrim: 0x222222,
  bottom: 'shorts', bottomColor: 0x1d1d22, bottomTrim: 0xf0f0ea,
  shoes: 'low', shoeColor: 0xf0f0ea, shoeSole: 0x888a94, shoeTrim: 0xc0201e,
  socks: 'crew', sockColor: 0xf0f0ea, sockTrim: 0xc0201e,
  chain: 'none', wrist: 'none', wristColor: 0xf0f0ea,
};

export interface Region {
  id: RegionId; name: string; city: string;
  a: Col; b: Col; c: Col;
  tops: TopKind[]; bottoms: BottomKind[]; heads: HeadKind[]; hairs: HairKind[]; shoes: ShoeKind[];
  nicks: string[];
}

export const REGIONS: Record<RegionId, Region> = {
  bk: {
    id: 'bk', name: 'BROOKLYN', city: 'BED-STUY', a: 0x1b1b20, b: 0xff7a1a, c: 0xf4f4f0,
    tops: ['hoodie', 'tee', 'jersey'], bottoms: ['longShorts', 'sweats'], heads: ['fullcap', 'beanie', 'backcap'], hairs: ['fade', 'waves', 'braids'], shoes: ['high', 'low'],
    nicks: ['SKIP', 'BIG HANDS', 'STRETCH', 'TWO-STEP', 'PROFESSOR', 'MAD MAX', 'LIL DUKE'],
  },
  chi: {
    id: 'chi', name: 'CHICAGO', city: 'SOUTH SIDE', a: 0xd01c24, b: 0x111111, c: 0xffffff,
    tops: ['tank', 'jersey', 'tee'], bottoms: ['shorts', 'longShorts'], heads: ['headband', 'fullcap', 'bandana'], hairs: ['braids', 'fade', 'twists'], shoes: ['high', 'runner'],
    nicks: ['WINDY', 'BEAN', 'L-TRAIN', 'DEEP DISH', 'SIXTY-THREE', 'HANDSOME', 'CLOUDS'],
  },
  chiraq: {
    id: 'chiraq', name: 'CHIRAQ', city: 'SOUTH SIDE', a: 0x111111, b: 0xd01c24, c: 0xf4f4f0,
    tops: ['hoodie', 'jersey', 'bigTee'], bottoms: ['sweats', 'longShorts'], heads: ['durag', 'fullcap', 'beanie'], hairs: ['braids', 'locs', 'fade'], shoes: ['high', 'runner'],
    nicks: ['DRILL', 'L-STOP', 'SIX CORNER', 'O-BLOCK', 'CHI-TOWN', 'COLD', 'SLIDE'],
  },
  warsaw: {
    id: 'warsaw', name: 'WARSAW', city: 'CENTRUM', a: 0xd22b3a, b: 0xffffff, c: 0x0e8a4a,
    tops: ['hoodie', 'longsleeve', 'tee'], bottoms: ['joggers', 'sweats'], heads: ['beanie', 'fitted', 'none'], hairs: ['fade', 'waves', 'hightop'], shoes: ['runner', 'low'],
    nicks: ['CENTRUM', 'TRAM', 'PALACE', 'VISTULA', 'PIĄTEK', 'BLOCK', 'KIELBASA'],
  },
  harlem: {
    id: 'harlem', name: 'HARLEM', city: 'THE PARK', a: 0x5a2d91, b: 0xf2c230, c: 0xffffff,
    tops: ['tee', 'jersey', 'hoodie'], bottoms: ['longShorts', 'shorts'], heads: ['none', 'bucket', 'headband'], hairs: ['afro', 'fade', 'locs'], shoes: ['low', 'high'],
    nicks: ['DOC', 'SMOOTH', 'SUNDAY', 'RUCK', 'GOLDEN', 'PROPHET', 'HALF-TIME'],
  },
  queens: {
    id: 'queens', name: 'QUEENS', city: 'QUEENSBRIDGE', a: 0x1fa5a0, b: 0x1c2f66, c: 0xf4f4f0,
    tops: ['hoodie', 'longsleeve', 'tee'], bottoms: ['sweats', 'joggers'], heads: ['beanie', 'fullcap', 'durag'], hairs: ['fade', 'hightop', 'waves'], shoes: ['low', 'runner'],
    nicks: ['GHOST', 'BRIDGE', 'QUIET STORM', 'CHILL', 'MIDNIGHT', 'TWELVE', 'RADIO'],
  },
  philly: {
    id: 'philly', name: 'PHILLY', city: 'NORTH PHILLY', a: 0x0e8a4a, b: 0xc0c4cc, c: 0x111111,
    tops: ['longsleeve', 'jersey', 'tank'], bottoms: ['shorts', 'joggers'], heads: ['durag', 'headband', 'beanie'], hairs: ['braids', 'waves', 'fade'], shoes: ['runner', 'high'],
    nicks: ['THE ANSWER', 'CHEESE', 'BROAD ST', 'ICE', 'SCRAPPLE', 'RAIN MAN', 'LEFTY'],
  },
  detroit: {
    id: 'detroit', name: 'DETROIT', city: 'THE PLANT', a: 0x1e63c4, b: 0xd22b3a, c: 0xe8ecf2,
    tops: ['hoodie', 'longsleeve', 'jersey'], bottoms: ['sweats', 'shorts'], heads: ['beanie', 'backcap', 'fullcap'], hairs: ['hightop', 'fade', 'twists'], shoes: ['high', 'low'],
    nicks: ['MOTOR', 'ASSEMBLY', 'SNOWMAN', 'BIG THREE', 'STEEL', 'EIGHT MILE', 'PISTON'],
  },
  atl: {
    id: 'atl', name: 'ATLANTA', city: 'UNDER THE PASS', a: 0xff8a5c, b: 0x14141a, c: 0xf6e8c8,
    tops: ['tank', 'tee', 'jersey'], bottoms: ['shorts', 'longShorts'], heads: ['backcap', 'bandana', 'none'], hairs: ['locs', 'twists', 'fade'], shoes: ['low', 'high'],
    nicks: ['PEACH', 'TRAP', 'FLY', 'OVERPASS', 'SOUTHSIDE', 'DIRTY SOUTH', 'LIL FAST'],
  },
  la: {
    id: 'la', name: 'LOS ANGELES', city: 'SOUTH CENTRAL', a: 0xf06aa8, b: 0x34c6d6, c: 0x14141a,
    tops: ['tank', 'tee', 'jersey'], bottoms: ['shorts', 'longShorts'], heads: ['bucket', 'bandana', 'backcap'], hairs: ['braids', 'waves', 'afro'], shoes: ['low', 'runner'],
    nicks: ['SUNSET', 'WESTSIDE', 'LOWKEY', 'HELI', 'PALMS', 'SMOG', 'VENICE'],
  },
};

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];

export interface Item {
  id: string; slot: Slot; name: string; price: number; region: RegionId | 'any';
  patch: Partial<Loadout>;
}
export interface Fit { id: string; name: string; region: RegionId; items: string[]; price: number }

export const SLOTS: Slot[] = ['hair', 'head', 'face', 'top', 'bottom', 'shoes', 'socks', 'chain', 'wrist'];
export const SLOT_NAMES: Record<Slot, string> = { hair: 'HAIR', head: 'HEADWEAR', face: 'FACE', top: 'TOP', bottom: 'BOTTOM', shoes: 'SHOES', socks: 'SOCKS', chain: 'CHAIN', wrist: 'WRIST' };

const KIND_NAMES: Record<string, string> = {
  bald: 'SHAVED', fade: 'FADE', hightop: 'HI-TOP', waves: 'WAVES', afro: 'AFRO', braids: 'BRAIDS', locs: 'LOCS', twists: 'TWISTS',
  none: 'NONE', fullcap: 'FULL CAP', backcap: 'BACKWARDS CAP', beanie: 'BEANIE', headband: 'HEADBAND', durag: 'DURAG', bucket: 'BUCKET HAT', bandana: 'BANDANA', fitted: 'FITTED CAP',
  shades: 'SHADES', beard: 'BEARD', goatee: 'GOATEE', glasses: 'ROUND SPECS', stache: 'MUSTACHE', grillz: 'GRILLZ',
  tank: 'TANK', tee: 'TEE', hoodie: 'HOODIE', jersey: 'JERSEY', longsleeve: 'LONGSLEEVE', bigTee: 'BIG TEE', flannel: 'FLANNEL', puffer: 'PUFFER',
  shorts: 'SHORTS', longShorts: 'LONG SHORTS', sweats: 'SWEATS', joggers: 'JOGGERS', jeans: 'JEANS', jorts: 'JORTS', khakis: 'KHAKIS', chinoShorts: 'KHAKI LONGS',
  high: 'HI-TOPS', low: 'LOWS', runner: 'RUNNERS', boot: 'BOOTS', cortez: 'CLASSIC TRAINER', slides: 'SLIDES',
  crew: 'CREW SOCKS', long: 'TUBE SOCKS', stripe: 'STRIPE TUBES', gold: 'GOLD CHAIN', silver: 'SILVER CHAIN', cuban: 'CUBAN LINK', rope: 'ROPE CHAIN', cross: 'CROSS PIECE', rosary: 'ROSARY', ice: 'ICED PENDANT', bands: 'WRISTBANDS', sleeve: 'ARM SLEEVE', watch: 'WATCH',
};
export const kindName = (k: string) => KIND_NAMES[k] ?? k.toUpperCase();

const HAIR_COLORS: [string, Col][] = [['BLACK', 0x15110e], ['BROWN', 0x3a2416], ['BLONDE', 0xe8c35a], ['RED', 0xc0301e], ['WHITE', 0xdad6ca]];

function buildCatalog() {
  const items: Item[] = [];
  const fits: Fit[] = [];
  const add = (slot: Slot, id: string, name: string, price: number, region: RegionId | 'any', patch: Partial<Loadout>) => {
    if (!items.some((i) => i.id === id)) items.push({ id, slot, name, price, region, patch });
    return id;
  };

  add('hair', 'hair.fade.black', 'FADE', 0, 'any', { hair: 'fade', hairColor: 0x15110e });
  add('hair', 'hair.bald', 'SHAVED', 0, 'any', { hair: 'bald' });
  const hairBase: [string, number][] = [['fade', 40], ['hightop', 90], ['waves', 80], ['afro', 120], ['braids', 140], ['locs', 160], ['twists', 150]];
  for (const [k, p] of hairBase) {
    HAIR_COLORS.forEach(([cn, cc], i) => {
      if (k === 'fade' && i === 0) return;
      if (i > 0 && (k === 'fade' || k === 'waves') && i > 2) return;
      add('hair', `hair.${k}.${cn.toLowerCase()}`, `${kindName(k)} ${i ? cn : ''}`.trim(), Math.round(p * (i ? 1.35 : 1)), 'any', { hair: k as HairKind, hairColor: cc });
    });
  }

  add('head', 'head.none', 'BARE', 0, 'any', { head: 'none' });
  add('head', 'head.fullcap.black', 'BLACK FULL CAP', 0, 'any', { head: 'fullcap', headColor: 0x111111, headTrim: 0xffffff });
  add('head', 'head.beanie.black', 'BLACK BEANIE', 45, 'any', { head: 'beanie', headColor: 0x22262c, headTrim: 0x3c424c });
  add('head', 'head.beanie.grey', 'GREY BEANIE', 45, 'any', { head: 'beanie', headColor: 0x8d949e, headTrim: 0x6a707a });
  add('head', 'head.headband.white', 'WHITE HEADBAND', 30, 'any', { head: 'headband', headColor: 0xf0f0ea, headTrim: 0x222222 });
  add('head', 'head.durag.black', 'BLACK DURAG', 60, 'any', { head: 'durag', headColor: 0x16161c, headTrim: 0x16161c });
  add('head', 'head.durag.white', 'WHITE DURAG', 70, 'any', { head: 'durag', headColor: 0xeeeeea, headTrim: 0xeeeeea });
  add('head', 'head.bucket.tan', 'TAN BUCKET', 90, 'any', { head: 'bucket', headColor: 0xc9a46a, headTrim: 0x7a5a30 });
  add('head', 'head.bandana.red', 'RED BANDANA', 55, 'any', { head: 'bandana', headColor: 0xc0201e, headTrim: 0xf4f4f0 });
  add('head', 'head.backcap.white', 'WHITE BACKCAP', 75, 'any', { head: 'backcap', headColor: 0xeeeeea, headTrim: 0x222222 });

  add('face', 'face.none', 'NONE', 0, 'any', { face: 'none' });
  add('face', 'face.shades', 'DARK SHADES', 110, 'any', { face: 'shades', faceColor: 0x15151a });
  add('face', 'face.glasses', 'ROUND SPECS', 95, 'any', { face: 'glasses', faceColor: 0xc9a030 });
  add('face', 'face.beard', 'FULL BEARD', 85, 'any', { face: 'beard', faceColor: 0x1a120e });
  add('face', 'face.goatee', 'GOATEE', 65, 'any', { face: 'goatee', faceColor: 0x1a120e });

  add('top', 'top.tee.white', 'WHITE TEE', 0, 'any', { top: 'tee', topColor: 0xf0f0ea, topTrim: 0x222222 });
  add('top', 'top.tank.black', 'BLACK TANK', 0, 'any', { top: 'tank', topColor: 0x1d1d22, topTrim: 0xf0f0ea });
  // Original streetwear pieces: gothic hardware, embroidered denim and bold rap-era graphics.
  add('top','top.tee.gothic','GOTHIC CROSS TEE',145,'any',{top:'tee',topColor:0x17191f,topTrim:0xd5d9e0,topGraphic:'cross'});
  add('top','top.bigtee.stacked','STACKED TYPE BIG TEE',155,'any',{top:'bigTee',topColor:0xf1e4cb,topTrim:0xa52643,topGraphic:'stacked'});
  add('top','top.hoodie.gothic','SILVER CROSS HOODIE',220,'any',{top:'hoodie',topColor:0x20212b,topTrim:0xd4dae5,topGraphic:'cross'});
  add('top','top.hoodie.stars','STAR PATCH HOODIE',195,'any',{top:'hoodie',topColor:0x5a355f,topTrim:0xf3c875,topGraphic:'stars'});
  add('top','top.bigtee.washed','WASHED STAR BIG TEE',165,'any',{top:'bigTee',topColor:0x626862,topTrim:0xe0cf9e,topGraphic:'stars'});
  add('top','top.longsleeve.racing','RACING STRIPE LS',155,'any',{top:'longsleeve',topColor:0x344c61,topTrim:0xf0dfba,topGraphic:'stripe'});
  add('top','top.jersey.8','GOLD COURT 08',175,'any',{top:'jersey',topColor:0xdda52f,topTrim:0x613e91,topGraphic:'number',jerseyNumber:8});
  add('top','top.jersey.1','SKYLINE 01',175,'any',{top:'jersey',topColor:0x78b5d5,topTrim:0xf4efdf,topGraphic:'number',jerseyNumber:1});
  add('top','top.puffer.cream','CREAM PANEL PUFFER',230,'any',{top:'puffer',topColor:0xd8c9a6,topTrim:0x343744,topGraphic:'box'});
  add('bottom','bottom.jeans.flap','FLAP STITCH DENIM',205,'any',{bottom:'jeans',bottomColor:0x354a6b,bottomTrim:0xe4ca8f,bottomDetail:'stitched'});
  add('bottom','bottom.jeans.cross','SILVER PATCH DENIM',235,'any',{bottom:'jeans',bottomColor:0x242832,bottomTrim:0xcbd0db,bottomDetail:'crosses'});
  add('bottom','bottom.jeans.distressed','DISTRESSED WASH DENIM',210,'any',{bottom:'jeans',bottomColor:0x6486a0,bottomTrim:0xd8d4c8,bottomDetail:'ripped'});
  add('bottom','bottom.sweats.track','SIDE STRIPE SWEATS',160,'any',{bottom:'sweats',bottomColor:0x263a37,bottomTrim:0xe3d6ad,bottomDetail:'stripe'});
  add('bottom','bottom.longshorts.court','VARSITY LONG SHORTS',150,'any',{bottom:'longShorts',bottomColor:0x613e91,bottomTrim:0xdda52f,bottomDetail:'stripe'});
  add('head','head.fitted.star','STAR FITTED',130,'any',{head:'fitted',headColor:0x613e91,headTrim:0xdda52f});
  add('shoes','shoes.high.cream','CREAM COURT HIGHS',180,'any',{shoes:'high',shoeColor:0xe2d6b8,shoeTrim:0x8b2637,shoeSole:0xa99b7f});
  add('top', 'top.tee.court', 'COURT LOGO TEE', 95, 'any', { top: 'tee', topColor: 0x222630, topTrim: 0xf0c55a, topGraphic: 'box' });
  add('top', 'top.jersey.23', 'VARSITY 23', 150, 'any', { top: 'jersey', topColor: 0x9e2937, topTrim: 0xffe6b1, topGraphic: 'number', jerseyNumber: 23 });
  add('top', 'top.bigtee.diagonal', 'DIAGONAL OVERSIZE', 135, 'any', { top: 'bigTee', topColor: 0x263c55, topTrim: 0x78d7ce, topGraphic: 'diagonal' });
  add('top', 'top.tee.black', 'BLACK TEE', 40, 'any', { top: 'tee', topColor: 0x1d1d22, topTrim: 0x4a4a54 });
  add('top', 'top.tank.white', 'WHITE TANK', 40, 'any', { top: 'tank', topColor: 0xf0f0ea, topTrim: 0x222222 });
  add('top', 'top.hoodie.grey', 'GREY HOODIE', 85, 'any', { top: 'hoodie', topColor: 0x8d949e, topTrim: 0x22262c });
  add('top', 'top.hoodie.black', 'BLACK HOODIE', 90, 'any', { top: 'hoodie', topColor: 0x1b1b20, topTrim: 0x4a4a54 });
  add('top', 'top.longsleeve.navy', 'NAVY LONGSLEEVE', 70, 'any', { top: 'longsleeve', topColor: 0x1c2f66, topTrim: 0xf0f0ea });

  add('bottom', 'bottom.shorts.black', 'BLACK SHORTS', 0, 'any', { bottom: 'shorts', bottomColor: 0x1d1d22, bottomTrim: 0xf0f0ea });
  add('bottom', 'bottom.sweats.grey', 'GREY SWEATS', 0, 'any', { bottom: 'sweats', bottomColor: 0x4a4f58, bottomTrim: 0x8d949e });
  add('bottom', 'bottom.long.black', 'BLACK LONGS', 50, 'any', { bottom: 'longShorts', bottomColor: 0x1d1d22, bottomTrim: 0x4a4a54 });
  add('bottom', 'bottom.shorts.white', 'WHITE SHORTS', 45, 'any', { bottom: 'shorts', bottomColor: 0xf0f0ea, bottomTrim: 0x222222 });
  add('bottom', 'bottom.joggers.black', 'BLACK JOGGERS', 80, 'any', { bottom: 'joggers', bottomColor: 0x1d1d22, bottomTrim: 0x4a4a54 });

  add('shoes', 'shoes.low.white', 'WHITE LOWS', 0, 'any', { shoes: 'low', shoeColor: 0xf0f0ea, shoeSole: 0x888a94 });
  add('shoes', 'shoes.high.black', 'BLACK HI-TOPS', 0, 'any', { shoes: 'high', shoeColor: 0x1d1d22, shoeSole: 0xf0f0ea });
  add('shoes', 'shoes.high.white', 'WHITE HI-TOPS', 60, 'any', { shoes: 'high', shoeColor: 0xf0f0ea, shoeSole: 0x888a94 });
  add('shoes', 'shoes.runner.grey', 'GREY RUNNERS', 70, 'any', { shoes: 'runner', shoeColor: 0x9aa0aa, shoeSole: 0xf0f0ea });

  add('socks', 'socks.none', 'NO SOCKS', 0, 'any', { socks: 'none' });
  add('socks', 'socks.crew.white', 'WHITE CREW', 0, 'any', { socks: 'crew', sockColor: 0xf0f0ea });
  add('socks', 'socks.long.white', 'WHITE TUBES', 30, 'any', { socks: 'long', sockColor: 0xf0f0ea });
  add('socks', 'socks.long.black', 'BLACK TUBES', 30, 'any', { socks: 'long', sockColor: 0x1d1d22 });

  add('chain', 'chain.none', 'NONE', 0, 'any', { chain: 'none' });
  add('chain', 'chain.silver', 'SILVER CHAIN', 220, 'any', { chain: 'silver' });
  add('chain', 'chain.gold', 'GOLD CHAIN', 380, 'any', { chain: 'gold' });

  add('wrist', 'wrist.none', 'NONE', 0, 'any', { wrist: 'none' });
  add('wrist', 'wrist.bands.white', 'WHITE BANDS', 25, 'any', { wrist: 'bands', wristColor: 0xf0f0ea });
  add('wrist', 'wrist.sleeve.black', 'BLACK SLEEVE', 55, 'any', { wrist: 'sleeve', wristColor: 0x1d1d22 });

  for (const r of Object.values(REGIONS)) {
    const mk = (n: 1 | 2) => {
      const p = n === 1 ? [r.a, r.b, r.c] : [r.b, r.a, r.c];
      const t = r.tops[n - 1], bt = r.bottoms[(n - 1) % r.bottoms.length], hd = r.heads[n - 1], sh = r.shoes[(n - 1) % r.shoes.length];
      const key = `${r.id}${n}`;
      const lightBase = (p[0] === 0xf4f4f0 || p[0] === 0xc0c4cc || p[0] === 0xf6e8c8);
      const ids = [
        add('top', `top.${key}`, `${r.id.toUpperCase()} ${kindName(t)}`, 110 + n * 20, r.id, { top: t, topColor: p[0], topTrim: p[1] }),
        add('bottom', `bottom.${key}`, `${r.id.toUpperCase()} ${kindName(bt)}`, 90 + n * 15, r.id, { bottom: bt, bottomColor: lightBase ? p[1] : p[0], bottomTrim: p[1] === p[0] ? p[2] : p[1] }),
        add('shoes', `shoes.${key}`, `${r.id.toUpperCase()} ${kindName(sh)}`, 130 + n * 20, r.id, { shoes: sh, shoeColor: n === 1 ? 0xf4f4f0 : p[0], shoeSole: p[1] }),
        add('head', `head.${key}`, `${r.id.toUpperCase()} ${hd === 'none' ? 'BARE HEAD' : kindName(hd)}`, hd === 'none' ? 0 : 70 + n * 15, r.id, { head: hd, headColor: p[0], headTrim: p[1] }),
        add('socks', `socks.${key}`, `${r.id.toUpperCase()} TUBES`, 40, r.id, { socks: 'long', sockColor: p[2] }),
        add('wrist', `wrist.${key}`, `${r.id.toUpperCase()} BANDS`, 35, r.id, { wrist: 'bands', wristColor: p[1] }),
      ];
      const price = Math.round(ids.reduce((s, id) => s + items.find((i) => i.id === id)!.price, 0) * 0.75);
      fits.push({ id: `fit.${key}`, name: `${r.name} FIT ${n}`, region: r.id, items: ids, price });
    };
    mk(1); mk(2);
  }

  const KHAKI = 0xb9a67e, KHAKI_D = 0x8a7a58, WHITE = 0xf0f0ea, BLACK = 0x1d1d22, RED = 0xc0201e;
  add('head', 'head.fitted.black', 'BLACK FITTED', 70, 'any', { head: 'fitted', headColor: 0x16161a, headTrim: 0xe8e8e0 });
  add('head', 'head.fitted.white', 'WHITE FITTED', 80, 'any', { head: 'fitted', headColor: 0xeeeeea, headTrim: 0x2a2a30 });
  add('head', 'head.fitted.red', 'RED FITTED', 80, 'any', { head: 'fitted', headColor: 0xb42228, headTrim: 0xf4f4f0 });
  add('head', 'head.fullcap.navy', 'NAVY FULL CAP', 60, 'any', { head: 'fullcap', headColor: 0x1c2748, headTrim: 0xe8e8e0 });
  add('head', 'head.bandana.black', 'BLACK BANDANA', 55, 'la', { head: 'bandana', headColor: 0x18181c, headTrim: 0xe8e8e0 });
  add('head', 'head.bandana.blue', 'BLUE BANDANA', 55, 'la', { head: 'bandana', headColor: 0x2a4aa0, headTrim: 0xf4f4f0 });
  add('head', 'head.fullcap.detroit', 'D-TOWN FULL CAP', 95, 'detroit', { head: 'fullcap', headColor: 0x1e63c4, headTrim: 0xe8ecf2 });
  add('head', 'head.fitted.detroit', 'MOTOR FITTED', 105, 'detroit', { head: 'fitted', headColor: 0x14161c, headTrim: 0xd22b3a });
  add('head', 'head.fitted.ny', 'BIG APPLE FITTED', 105, 'bk', { head: 'fitted', headColor: 0x14161c, headTrim: 0xf4f4f0 });
  add('head', 'head.fitted.harlem', 'UPTOWN FITTED', 105, 'harlem', { head: 'fitted', headColor: 0x4a2480, headTrim: 0xf2c230 });
  add('head', 'head.fitted.queens', 'QUEENS FITTED', 105, 'queens', { head: 'fitted', headColor: 0x1c2f66, headTrim: 0xf4f4f0 });

  add('face', 'face.stache', 'MUSTACHE', 70, 'la', { face: 'stache', faceColor: 0x15110e });
  add('face', 'face.grillz', 'GOLD GRILLZ', 260, 'atl', { face: 'grillz', faceColor: 0xf0c040 });

  add('top', 'top.bigtee.white', 'WHITE BIG TEE', 60, 'any', { top: 'bigTee', topColor: WHITE, topTrim: 0x2a2a30 });
  add('top', 'top.bigtee.black', 'BLACK BIG TEE', 65, 'any', { top: 'bigTee', topColor: BLACK, topTrim: 0x4a4a54 });
  add('top', 'top.bigtee.grey', 'GREY BIG TEE', 65, 'any', { top: 'bigTee', topColor: 0x9aa0aa, topTrim: 0x5c616b });
  add('top', 'top.bigtee.la', 'EASTSIDE BIG TEE', 75, 'la', { top: 'bigTee', topColor: WHITE, topTrim: 0x14141a });
  add('top', 'top.bigtee.atl', 'ATL BIG TEE', 75, 'atl', { top: 'bigTee', topColor: 0xf6e8c8, topTrim: 0x14141a });
  add('top', 'top.flannel.red', 'RED PLAID FLANNEL', 110, 'any', { top: 'flannel', topColor: 0xa82226, topTrim: 0x16161a });
  add('top', 'top.flannel.black', 'BLACK PLAID FLANNEL', 110, 'la', { top: 'flannel', topColor: 0x24242a, topTrim: 0xb02a2a });
  add('top', 'top.flannel.blue', 'BLUE PLAID FLANNEL', 110, 'any', { top: 'flannel', topColor: 0x2a4a8a, topTrim: 0xe8e0c8 });
  add('top', 'top.flannel.green', 'FOREST PLAID FLANNEL', 110, 'any', { top: 'flannel', topColor: 0x2f6a42, topTrim: 0x16161a });
  add('top', 'top.puffer.black', 'BLACK PUFFER', 160, 'any', { top: 'puffer', topColor: 0x1a1a20, topTrim: 0x4a4a54 });
  add('top', 'top.puffer.detroit', 'D-TOWN PUFFER', 175, 'detroit', { top: 'puffer', topColor: 0x1e4fa4, topTrim: 0xd22b3a });
  add('top', 'top.puffer.tan', 'WHEAT PUFFER', 165, 'any', { top: 'puffer', topColor: 0xb89458, topTrim: 0x6b4a22 });
  add('top', 'top.puffer.philly', 'BROAD ST PUFFER', 175, 'philly', { top: 'puffer', topColor: 0x0e8a4a, topTrim: 0xc0c4cc });

  add('bottom', 'bottom.jeans.dark', 'DARK STITCH JEANS', 130, 'any', { bottom: 'jeans', bottomColor: 0x232f52, bottomTrim: 0xe08a2a });
  add('bottom', 'bottom.jeans.wash', 'WASHED STITCH JEANS', 130, 'any', { bottom: 'jeans', bottomColor: 0x6d8cb8, bottomTrim: 0xf0f0ea });
  add('bottom', 'bottom.jeans.black', 'BLACK STITCH JEANS', 140, 'any', { bottom: 'jeans', bottomColor: 0x1a1a1f, bottomTrim: 0xd8b040 });
  add('bottom', 'bottom.khakis.tan', 'CREASED KHAKIS', 120, 'any', { bottom: 'khakis', bottomColor: KHAKI, bottomTrim: KHAKI_D });
  add('bottom', 'bottom.khakis.black', 'BLACK WORK PANTS', 120, 'any', { bottom: 'khakis', bottomColor: 0x24242a, bottomTrim: 0x4a4a54 });
  add('bottom', 'bottom.khakis.navy', 'NAVY WORK PANTS', 120, 'any', { bottom: 'khakis', bottomColor: 0x25304f, bottomTrim: 0x4a5778 });
  add('bottom', 'bottom.chino.khaki', 'KHAKI LONGS', 95, 'la', { bottom: 'chinoShorts', bottomColor: KHAKI, bottomTrim: KHAKI_D });
  add('bottom', 'bottom.chino.black', 'BLACK KHAKI LONGS', 95, 'la', { bottom: 'chinoShorts', bottomColor: 0x24242a, bottomTrim: 0x4a4a54 });
  add('bottom', 'bottom.chino.grey', 'GREY KHAKI LONGS', 95, 'any', { bottom: 'chinoShorts', bottomColor: 0x7a7e86, bottomTrim: 0x565a62 });
  add('bottom', 'bottom.jorts.wash', 'WASHED JORTS', 85, 'atl', { bottom: 'jorts', bottomColor: 0x7e9cc6, bottomTrim: 0xe8eef6 });
  add('bottom', 'bottom.jorts.dark', 'DARK JORTS', 85, 'atl', { bottom: 'jorts', bottomColor: 0x2c3a62, bottomTrim: 0xe08a2a });
  add('bottom', 'bottom.jorts.black', 'BLACK JORTS', 85, 'any', { bottom: 'jorts', bottomColor: 0x1c1c22, bottomTrim: 0x6a6a74 });

  add('shoes', 'shoes.boot.wheat', 'WHEAT WORK BOOTS', 180, 'any', { shoes: 'boot', shoeColor: 0xc79a52, shoeSole: 0x6b4a22, shoeTrim: 0x3a2a14 });
  add('shoes', 'shoes.boot.black', 'BLACK WORK BOOTS', 180, 'any', { shoes: 'boot', shoeColor: 0x1e1e24, shoeSole: 0x8a8a92, shoeTrim: 0x4a4a54 });
  add('shoes', 'shoes.classic.white', 'WHITE CLASSICS', 110, 'la', { shoes: 'cortez', shoeColor: WHITE, shoeSole: 0xe8dcc0, shoeTrim: RED });
  add('shoes', 'shoes.classic.blue', 'BLUE-STRIPE CLASSICS', 110, 'la', { shoes: 'cortez', shoeColor: WHITE, shoeSole: 0xe8dcc0, shoeTrim: 0x2a4aa0 });
  add('shoes', 'shoes.classic.black', 'BLACK CLASSICS', 110, 'any', { shoes: 'cortez', shoeColor: BLACK, shoeSole: 0xe8dcc0, shoeTrim: WHITE });
  add('shoes', 'shoes.slides.black', 'BLACK SLIDES', 50, 'any', { shoes: 'slides', shoeColor: BLACK, shoeSole: 0x34343c, shoeTrim: WHITE });
  add('shoes', 'shoes.slides.white', 'WHITE SLIDES', 50, 'any', { shoes: 'slides', shoeColor: WHITE, shoeSole: 0x9aa0aa, shoeTrim: BLACK });

  add('socks', 'socks.stripe.red', 'RED-STRIPE TUBES', 40, 'any', { socks: 'stripe', sockColor: WHITE, sockTrim: RED });
  add('socks', 'socks.stripe.blue', 'BLUE-STRIPE TUBES', 40, 'any', { socks: 'stripe', sockColor: WHITE, sockTrim: 0x2a4aa0 });
  add('socks', 'socks.stripe.black', 'BLACK-STRIPE TUBES', 40, 'any', { socks: 'stripe', sockColor: WHITE, sockTrim: BLACK });
  add('socks', 'socks.stripe.gold', 'GOLD-STRIPE TUBES', 40, 'atl', { socks: 'stripe', sockColor: WHITE, sockTrim: 0xe0a820 });

  add('chain', 'chain.cuban', 'CUBAN LINK', 520, 'any', { chain: 'cuban' });
  add('chain', 'chain.rope', 'ROPE CHAIN', 460, 'any', { chain: 'rope' });
  add('chain', 'chain.cross', 'CROSS PIECE', 340, 'any', { chain: 'cross' });
  add('chain', 'chain.rosary', 'ROSARY', 240, 'la', { chain: 'rosary' });
  add('chain', 'chain.ice', 'ICED PENDANT', 900, 'any', { chain: 'ice' });

  add('wrist', 'wrist.watch.gold', 'GOLD WATCH', 300, 'any', { wrist: 'watch', wristColor: 0xf0c040 });
  add('wrist', 'wrist.watch.silver', 'STEEL WATCH', 260, 'any', { wrist: 'watch', wristColor: 0xdfe6ee });
  add('wrist', 'wrist.watch.black', 'BLACK WATCH', 200, 'any', { wrist: 'watch', wristColor: 0x24242a });

  const curated: [RegionId, string, string[]][] = [
    ['la', 'EASTSIDE SUNDAY', ['top.bigtee.la', 'bottom.chino.khaki', 'socks.stripe.red', 'shoes.classic.white', 'chain.rosary', 'face.stache', 'head.bandana.black', 'wrist.none']],
    ['la', 'LOWRIDER FLANNEL', ['top.flannel.black', 'bottom.khakis.tan', 'shoes.classic.black', 'head.bandana.blue', 'chain.cross', 'face.stache']],
    ['la', 'PARK DAY LONGS', ['top.bigtee.white', 'bottom.chino.black', 'socks.stripe.blue', 'shoes.classic.blue', 'head.fitted.black', 'chain.rosary']],
    ['detroit', 'EAST SIDE FULL CAP', ['head.fullcap.detroit', 'top.bigtee.white', 'bottom.jeans.dark', 'shoes.boot.wheat', 'chain.cuban']],
    ['detroit', 'D-TOWN WINTER', ['head.fitted.detroit', 'top.puffer.detroit', 'bottom.khakis.black', 'shoes.boot.black', 'chain.rope']],
    ['detroit', 'MOTOR FLANNEL', ['head.beanie.black', 'top.flannel.red', 'bottom.khakis.tan', 'shoes.boot.wheat', 'wrist.watch.silver']],
    ['bk', 'BEDFORD STITCH', ['head.fitted.ny', 'top.bigtee.white', 'bottom.jeans.dark', 'shoes.boot.wheat', 'chain.cuban', 'wrist.watch.gold']],
    ['bk', 'BROOKLYN PUFFER', ['head.beanie.black', 'top.puffer.black', 'bottom.jeans.black', 'shoes.boot.wheat', 'chain.rope']],
    ['harlem', 'UPTOWN SUNDAY', ['head.fitted.harlem', 'top.bigtee.grey', 'bottom.jeans.wash', 'shoes.boot.black', 'chain.cuban', 'wrist.watch.gold']],
    ['queens', 'QUEENS WORKWEAR', ['head.fitted.queens', 'top.puffer.tan', 'bottom.khakis.navy', 'shoes.boot.wheat', 'chain.cross']],
    ['philly', 'BROAD STREET', ['head.fitted.red', 'top.puffer.philly', 'bottom.jeans.dark', 'shoes.boot.black', 'chain.ice']],
    ['chi', 'SOUTH SIDE CREASE', ['head.fullcap.navy', 'top.bigtee.black', 'bottom.khakis.tan', 'shoes.classic.black', 'chain.cross']],
    ['atl', 'UNDER THE PASS', ['head.backcap.white', 'top.bigtee.atl', 'bottom.jorts.wash', 'socks.stripe.gold', 'shoes.slides.white', 'chain.rope', 'face.grillz']],
    ['atl', 'TRAP SUMMER', ['head.bandana.red', 'top.bigtee.black', 'bottom.jorts.dark', 'socks.stripe.black', 'shoes.classic.black', 'chain.ice', 'face.grillz']],
  ];
  const wardrobe = new Map<RegionId, number>();
  for (const [reg, name, ids] of curated) {
    const n = (wardrobe.get(reg) ?? 2) + 1;
    wardrobe.set(reg, n);
    const price = Math.round(ids.reduce((sum, id) => sum + (items.find((i) => i.id === id)?.price ?? 0), 0) * 0.8);
    fits.push({ id: `fit.${reg}${n}`, name, region: reg, items: ids, price });
  }
  return { items, fits };
}

const CAT = buildCatalog();
export const ITEMS = CAT.items;
export const FITS = CAT.fits;
export const itemById = (id: string) => ITEMS.find((i) => i.id === id)!;
export const itemsFor = (slot: Slot) => ITEMS.filter((i) => i.slot === slot);

export type Equip = Record<Slot, string> & { skin: number };

export const STARTER_EQUIP: Equip = {
  skin: 3, hair: 'hair.fade.black', head: 'head.none', face: 'face.none', top: 'top.tee.white', bottom: 'bottom.shorts.black',
  shoes: 'shoes.low.white', socks: 'socks.crew.white', chain: 'chain.none', wrist: 'wrist.none',
};
export const STARTER_OWNED = ITEMS.filter((i) => i.price === 0).map((i) => i.id);

export function buildLoadout(eq: Equip, name = 'YOU'): Loadout {
  const l: Loadout = { ...BASE_LOADOUT, name, skin: eq.skin };
  for (const s of SLOTS) {
    const it = ITEMS.find((i) => i.id === eq[s]);
    if (it) Object.assign(l, it.patch);
  }
  return l;
}

/** Random opponent whose look is drawn from the court's home region. */
export function rivalFor(region: RegionId, rand: () => number = Math.random): Loadout {
  const r = REGIONS[region];
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
  const eq: Equip = { ...STARTER_EQUIP, skin: Math.floor(rand() * SKIN_TONES.length) };
  const pool = (slot: Slot, pred?: (i: Item) => boolean) => {
    const own = itemsFor(slot).filter((i) => (i.region === region) && (!pred || pred(i)));
    const any = itemsFor(slot).filter((i) => i.region === 'any' && (!pred || pred(i)));
    const all = [...own, ...own, ...own, ...any];
    return all.length ? all : any;
  };
  const fit = FITS.filter((f) => f.region === region);
  if (rand() < 0.65) {
    const f = pick(fit);
    for (const id of f.items) { const it = itemById(id); eq[it.slot] = id; }
  } else {
    for (const s of ['top', 'bottom', 'shoes', 'head'] as Slot[]) eq[s] = pick(pool(s)).id;
  }
  eq.hair = pick(pool('hair', (i) => (r.hairs as string[]).includes(i.patch.hair!) || rand() < 0.2)).id;
  if (rand() < 0.3) eq.face = pick(pool('face')).id;
  if (rand() < 0.4) eq.chain = pick(pool('chain')).id;
  if (rand() < 0.5) eq.socks = pick(pool('socks')).id;
  if (rand() < 0.35) eq.wrist = pick(pool('wrist')).id;
  return buildLoadout(eq, pick(r.nicks));
}
