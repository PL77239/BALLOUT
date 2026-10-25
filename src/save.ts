import { Equip, FITS, ITEMS, STARTER_EQUIP, STARTER_OWNED, Slot, SLOTS, itemById } from './loadout';

const KEY = 'ballout.save.v1';

export interface SaveData {
  cash: number;
  owned: string[];
  equip: Equip;
  wins: number;
  games: number;
  lastCourt: string;
  level: string;
  target: number;
}

const fresh = (): SaveData => ({
  cash: 250, owned: [...STARTER_OWNED], equip: { ...STARTER_EQUIP }, wins: 0, games: 0, lastCourt: 'brooklyn', level: 'hooper', target: 11,
});

let data: SaveData | null = null;

export function save(): SaveData {
  if (data) return data;
  data = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SaveData>;
      data = { ...data, ...p, equip: { ...STARTER_EQUIP, ...(p.equip ?? {}) } };
      data.owned = Array.from(new Set([...STARTER_OWNED, ...(data.owned ?? [])])).filter((id) => ITEMS.some((i) => i.id === id));
      for (const s of SLOTS) if (!data.owned.includes(data.equip[s])) data.equip[s] = STARTER_EQUIP[s];
    }
  } catch { /* private mode or corrupt save: play with defaults */ }
  return data;
}

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export const owns = (id: string) => save().owned.includes(id);

export function buyItem(id: string): boolean {
  const s = save(), it = itemById(id);
  if (owns(id)) return true;
  if (s.cash < it.price) return false;
  s.cash -= it.price; s.owned.push(id); persist();
  return true;
}

export function buyFit(id: string): boolean {
  const s = save(), f = FITS.find((x) => x.id === id)!;
  const missing = f.items.filter((i) => !owns(i));
  const cost = missing.length === f.items.length ? f.price : Math.round(f.price * (missing.length / f.items.length));
  if (s.cash < cost) return false;
  s.cash -= cost; s.owned.push(...missing); persist();
  return true;
}

export function fitCost(id: string): number {
  const f = FITS.find((x) => x.id === id)!;
  const missing = f.items.filter((i) => !owns(i));
  return missing.length === f.items.length ? f.price : Math.round(f.price * (missing.length / f.items.length));
}

export function equip(slot: Slot, id: string) { save().equip[slot] = id; persist(); }
export function addCash(n: number) { save().cash += Math.round(n); persist(); }
