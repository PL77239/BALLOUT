export interface Intent {
  mx: number;
  mz: number;
  sprint: boolean;
  shootHeld: boolean;
  shootDown: boolean;
  shootUp: boolean;
  a: boolean;
  b: boolean;
  c: boolean;
  shove: boolean;
  checkHeld: boolean;
}

export const emptyIntent = (): Intent => ({
  mx: 0, mz: 0, sprint: false, shootHeld: false, shootDown: false, shootUp: false,
  a: false, b: false, c: false, shove: false, checkHeld: false,
});

const keys = new Set<string>();
let keysBound = false;
function bindKeys() {
  if (keysBound) return;
  keysBound = true;
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
}

export function pads(): Gamepad[] {
  const list = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
  return list.filter((p): p is Gamepad => !!p && p.connected);
}

interface Raw {
  mx: number; mz: number; sprint: boolean; shoot: boolean;
  a: boolean; b: boolean; c: boolean; shove: boolean; check: boolean;
  start: boolean; back: boolean;
}

function readKeyboard(): Raw {
  const k = (...c: string[]) => c.some((x) => keys.has(x));
  return {
    mx: (k('KeyD', 'ArrowRight') ? 1 : 0) - (k('KeyA', 'ArrowLeft') ? 1 : 0),
    mz: (k('KeyS', 'ArrowDown') ? 1 : 0) - (k('KeyW', 'ArrowUp') ? 1 : 0),
    sprint: k('ShiftLeft', 'ShiftRight'),
    shoot: k('Space', 'KeyZ'),
    a: k('KeyJ', 'KeyX'),
    b: k('KeyK', 'KeyC'),
    c: k('KeyL', 'KeyV'),
    shove: k('KeyE', 'KeyQ'),
    check: k('KeyR'),
    start: k('Escape', 'KeyP'),
    back: k('Backspace'),
  };
}

function readPad(p: Gamepad): Raw {
  const b = (i: number) => !!p.buttons[i]?.pressed;
  const dz = (v: number) => (Math.abs(v) < 0.22 ? 0 : v);
  let mx = dz(p.axes[0] ?? 0);
  let mz = dz(p.axes[1] ?? 0);
  if (b(14)) mx = -1;
  if (b(15)) mx = 1;
  if (b(12)) mz = -1;
  if (b(13)) mz = 1;
  return {
    mx, mz,
    sprint: b(5) || b(7),
    shoot: b(0),
    a: b(2),
    b: b(1),
    c: b(3),
    shove: b(4),
    check: b(6),
    start: b(9),
    back: b(1),
  };
}

export class Controller {
  private prev = { shoot: false, a: false, b: false, c: false, shove: false };
  private prevStart = false;
  constructor(private getRaw: () => Raw) { bindKeys(); }

  poll(): Intent {
    const r = this.getRaw();
    const p = this.prev;
    const out: Intent = {
      mx: r.mx, mz: r.mz, sprint: r.sprint,
      shootHeld: r.shoot, shootDown: r.shoot && !p.shoot, shootUp: !r.shoot && p.shoot,
      a: r.a && !p.a, b: r.b && !p.b, c: r.c && !p.c, shove: r.shove && !p.shove,
      checkHeld: r.check,
    };
    this.prev = { shoot: r.shoot, a: r.a, b: r.b, c: r.c, shove: r.shove };
    return out;
  }

  startPressed(): boolean {
    const s = this.getRaw().start;
    const hit = s && !this.prevStart;
    this.prevStart = s;
    return hit;
  }
}

const merge = (rs: Raw[]): Raw => {
  const o: Raw = { mx: 0, mz: 0, sprint: false, shoot: false, a: false, b: false, c: false, shove: false, check: false, start: false, back: false };
  for (const r of rs) {
    if (Math.abs(r.mx) > Math.abs(o.mx)) o.mx = r.mx;
    if (Math.abs(r.mz) > Math.abs(o.mz)) o.mz = r.mz;
    o.sprint ||= r.sprint; o.shoot ||= r.shoot; o.a ||= r.a; o.b ||= r.b; o.c ||= r.c;
    o.shove ||= r.shove; o.check ||= r.check; o.start ||= r.start; o.back ||= r.back;
  }
  return o;
};

export function makeControllers(twoPlayer: boolean): [Controller, Controller | null] {
  bindKeys();
  if (!twoPlayer) {
    return [new Controller(() => merge([readKeyboard(), ...pads().map(readPad)])), null];
  }
  const hasTwo = () => pads().length >= 2;
  const p1 = new Controller(() => {
    const ps = pads();
    return merge([readKeyboard(), ...(hasTwo() ? [readPad(ps[0])] : [])]);
  });
  const p2 = new Controller(() => {
    const ps = pads();
    const pad = hasTwo() ? ps[1] : ps[0];
    return pad ? readPad(pad) : merge([]);
  });
  return [p1, p2];
}

export interface NavEdges { dx: number; dy: number; ok: boolean; back: boolean }

export class MenuNav {
  private held = { l: false, r: false, u: false, d: false, ok: false, back: false };
  private rep = 0;
  constructor() { bindKeys(); }

  poll(dt: number): NavEdges {
    const raw = merge([readKeyboard(), ...pads().map(readPad)]);
    const kbOk = keys.has('Enter') || keys.has('Space');
    const ok = kbOk || pads().some((p) => p.buttons[0]?.pressed);
    const back = keys.has('Escape') || keys.has('Backspace') || pads().some((p) => p.buttons[1]?.pressed);
    const l = raw.mx < -0.5, r = raw.mx > 0.5, u = raw.mz < -0.5, d = raw.mz > 0.5;
    const h = this.held;
    let dx = 0, dy = 0;
    this.rep -= dt;
    const any = l || r || u || d;
    if (any && (this.rep <= 0 || (l && !h.l) || (r && !h.r) || (u && !h.u) || (d && !h.d))) {
      const fresh = (l && !h.l) || (r && !h.r) || (u && !h.u) || (d && !h.d);
      dx = (r ? 1 : 0) - (l ? 1 : 0);
      dy = (d ? 1 : 0) - (u ? 1 : 0);
      this.rep = fresh ? 0.35 : 0.11;
    }
    if (!any) this.rep = 0;
    const out = { dx, dy, ok: ok && !h.ok, back: back && !h.back };
    this.held = { l, r, u, d, ok, back };
    return out;
  }
}
