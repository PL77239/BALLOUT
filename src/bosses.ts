import { courtInfo, type CourtId } from './courts';
import { STARTER_EQUIP, buildLoadout, rivalFor, type Loadout } from './loadout';

/** Arcade skill lines 1–99; 50 is league average. */
export interface BossStats { speed: number; accuracy: number; stamina: number; defense: number }

export interface Boss {
  name: string;
  loadout: Partial<Loadout>;
  stats: BossStats;
}

const B: Record<CourtId, Boss[]> = {
  la: [
    { name: 'EASTSIDE', stats: { speed: 58, accuracy: 62, stamina: 54, defense: 48 }, loadout: { head: 'bandana', headColor: 0x2a4aa0, headTrim: 0xf4f4f0, top: 'bigTee', topColor: 0xf0f0ea, bottom: 'chinoShorts', bottomColor: 0xb9a67e, shoes: 'cortez', shoeColor: 0xf0f0ea, shoeTrim: 0xc0201e, face: 'stache' } },
    { name: 'LOWRIDER', stats: { speed: 52, accuracy: 55, stamina: 60, defense: 56 }, loadout: { head: 'bandana', headColor: 0x18181c, top: 'flannel', topColor: 0x24242a, bottom: 'khakis', bottomColor: 0xb9a67e, shoes: 'cortez', shoeColor: 0x1d1d22, hair: 'waves' } },
  ],
  chiraq: [
    { name: 'DRILL CAP', stats: { speed: 64, accuracy: 58, stamina: 52, defense: 50 }, loadout: { head: 'durag', headColor: 0x16161c, top: 'puffer', topColor: 0x1a1a20, bottom: 'jeans', bottomColor: 0x232f52, bottomTrim: 0xe08a2a, hair: 'locs', hairColor: 0x15110e, shoes: 'high', shoeColor: 0x1d1d22 } },
    { name: 'TRUE RELI', stats: { speed: 55, accuracy: 61, stamina: 58, defense: 54 }, loadout: { top: 'hoodie', topColor: 0x1b1b20, bottom: 'jeans', bottomColor: 0x6d8cb8, hair: 'braids', head: 'fitted', headColor: 0x111111, shoes: 'boot', shoeColor: 0x1e1e24 } },
  ],
  chicago: [
    { name: 'WINDY', stats: { speed: 60, accuracy: 60, stamina: 55, defense: 52 }, loadout: { head: 'headband', headColor: 0xd01c24, top: 'jersey', topColor: 0xd01c24, bottom: 'longShorts', bottomColor: 0x111111, shoes: 'runner', hair: 'braids' } },
  ],
  brooklyn: [
    { name: 'BED-STUY', stats: { speed: 62, accuracy: 54, stamina: 50, defense: 46 }, loadout: { top: 'jersey', topColor: 0xff7a1a, bottom: 'longShorts', head: 'fullcap', headColor: 0x111111, shoes: 'high' } },
    { name: 'TIMBER', stats: { speed: 54, accuracy: 57, stamina: 62, defense: 58 }, loadout: { shoes: 'boot', shoeColor: 0xc79a52, shoeSole: 0x6b4a22, bottom: 'jeans', bottomColor: 0x232f52, top: 'hoodie', topColor: 0x1b1b20, head: 'beanie', headColor: 0x22262c, hair: 'fade' } },
  ],
  harlem: [
    { name: 'UPTOWN', stats: { speed: 56, accuracy: 63, stamina: 57, defense: 55 }, loadout: { head: 'fitted', headColor: 0x4a2480, headTrim: 0xf2c230, top: 'bigTee', bottom: 'jeans', shoes: 'boot', shoeColor: 0x1e1e24, hair: 'afro' } },
  ],
  queens: [
    { name: 'BRIDGE', stats: { speed: 61, accuracy: 59, stamina: 53, defense: 51 }, loadout: { head: 'durag', top: 'hoodie', topColor: 0x1c2f66, bottom: 'joggers', shoes: 'runner', hair: 'hightop' } },
  ],
  philly: [
    { name: 'BROAD ST', stats: { speed: 57, accuracy: 58, stamina: 59, defense: 57 }, loadout: { head: 'durag', top: 'longsleeve', bottom: 'shorts', shoes: 'runner', hair: 'waves' } },
  ],
  detroit: [
    { name: 'MOTOR', stats: { speed: 53, accuracy: 56, stamina: 64, defense: 60 }, loadout: { head: 'beanie', top: 'puffer', topColor: 0x1e4fa4, bottom: 'sweats', shoes: 'boot', shoeColor: 0x1e1e24 } },
  ],
  atl: [
    { name: 'UNDERPASS', stats: { speed: 65, accuracy: 55, stamina: 48, defense: 44 }, loadout: { head: 'backcap', top: 'tank', bottom: 'jorts', shoes: 'slides', face: 'grillz', chain: 'rope' } },
  ],
  warsaw: [
    { name: 'MOKOTÓW', stats: { speed: 55, accuracy: 61, stamina: 58, defense: 56 }, loadout: { head: 'beanie', headColor: 0xd22b3a, top: 'hoodie', topColor: 0xeeeeea, bottom: 'joggers', bottomColor: 0x24242a, shoes: 'runner', hair: 'fade' } },
  ],
  fairmount: [
    { name: 'WOODS RUN', stats: { speed: 50, accuracy: 52, stamina: 66, defense: 62 }, loadout: { top: 'flannel', topColor: 0x2f6a42, bottom: 'khakis', shoes: 'boot', hair: 'locs' } },
  ],
};

const DEFAULT_STATS: BossStats = { speed: 52, accuracy: 52, stamina: 52, defense: 52 };

export function bossesFor(court: CourtId): Boss[] {
  const list = [...(B[court] ?? [])];
  if (!list.length) {
    const r = courtInfo(court).region;
    return [{ name: rivalFor(r).name, stats: DEFAULT_STATS, loadout: {} }];
  }
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

export function bossAt(court: CourtId, index: number): Boss {
  const list = bossesFor(court);
  return list[((index % list.length) + list.length) % list.length];
}

export function bossToLoadout(b: Boss): Loadout {
  const base = buildLoadout({ ...STARTER_EQUIP, skin: 3 }, b.name);
  return { ...base, ...b.loadout, name: b.name };
}

export const PLAYER_STATS: BossStats = { speed: 54, accuracy: 54, stamina: 56, defense: 52 };
