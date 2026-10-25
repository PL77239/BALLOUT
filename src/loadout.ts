import type { Col } from './pixel';

export type RegionId = 'bk' | 'chi' | 'harlem' | 'queens' | 'philly' | 'detroit' | 'atl' | 'la';
export type HairKind = 'bald' | 'fade' | 'hightop' | 'waves' | 'afro' | 'braids' | 'locs' | 'twists';
export type HeadKind = 'none' | 'fullcap' | 'backcap' | 'beanie' | 'headband' | 'durag' | 'bucket' | 'bandana';
export type FaceKind = 'none' | 'shades' | 'beard' | 'goatee' | 'glasses';
export type TopKind = 'tank' | 'tee' | 'hoodie' | 'jersey' | 'longsleeve';
export type BottomKind = 'shorts' | 'longShorts' | 'sweats' | 'joggers';
export type ShoeKind = 'high' | 'low' | 'runner';
export type SockKind = 'none' | 'crew' | 'long';
export type ChainKind = 'none' | 'gold' | 'silver';
export type WristKind = 'none' | 'bands' | 'sleeve';
export type Slot = 'hair' | 'head' | 'face' | 'top' | 'bottom' | 'shoes' | 'socks' | 'chain' | 'wrist';

export interface Loadout {
  name: string;
  skin: number;
  hair: HairKind; hairColor: Col;
  head: HeadKind; headColor: Col; headTrim: Col;
  face: FaceKind; faceColor: Col;
  top: TopKind; topColor: Col; topTrim: Col;
  bottom: BottomKind; bottomColor: Col; bottomTrim: Col;
  shoes: ShoeKind; shoeColor: Col; shoeSole: Col;
  socks: SockKind; sockColor: Col;
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
  shoes: 'low', shoeColor: 0xf0f0ea, shoeSole: 0x888a94,
  socks: 'crew', sockColor: 0xf0f0ea,
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
  none: 'NONE', fullcap: 'SNAPBACK', backcap: 'BACKWARDS CAP', beanie: 'BEANIE', headband: 'HEADBAND', durag: 'DURAG', bucket: 'BUCKET HAT', bandana: 'BANDANA',
  shades: 'SHADES', beard: 'BEARD', goatee: 'GOATEE', glasses: 'ROUND SPECS',
  tank: 'TANK', tee: 'TEE', hoodie: 'HOODIE', jersey: 'JERSEY', longsleeve: 'LONGSLEEVE',
  shorts: 'SHORTS', longShorts: 'LONG SHORTS', sweats: 'SWEATS', joggers: 'JOGGERS',
  high: 'HI-TOPS', low: 'LOWS', runner: 'RUNNERS',
  crew: 'CREW SOCKS', long: 'TUBE SOCKS', gold: 'GOLD CHAIN', silver: 'SILVER CHAIN', bands: 'WRISTBANDS', sleeve: 'ARM SLEEVE',
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
  add('head', 'head.fullcap.black', 'BLACK SNAPBACK', 0, 'any', { head: 'fullcap', headColor: 0x111111, headTrim: 0xffffff });
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
  if (rand() < 0.28) eq.face = pick(itemsFor('face')).id;
  if (rand() < 0.3) eq.chain = pick(itemsFor('chain')).id;
  if (rand() < 0.5) eq.socks = pick(pool('socks')).id;
  if (rand() < 0.35) eq.wrist = pick(pool('wrist')).id;
  return buildLoadout(eq, pick(r.nicks));
}
