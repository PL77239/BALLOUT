/**
 * Background music that sounds like it comes from a boombox on the fence behind the players.
 *
 * Every track is levelled to the same loudness with the per-track gain from `manifest.json`
 * (see scripts/audio-manifest.mjs), then pushed through a small-speaker chain: band-limited, boxy, a little
 * saturated and compressed, mono, placed behind the listener with HRTF so it sits in the room rather than in
 * your head, with a short outdoor slap-back. The boombox has a position in the world, so the music pans and
 * dulls as the camera slides away from it. Tracks of one court play in a random order without repeats.
 */

const BASE = import.meta.env.BASE_URL;
const KEY = 'ballout.music';

interface Track { f: string; gain: number }
interface Manifest { lists: Record<string, Track[]> }

/** Overall loudness of the boombox at the default volume, relative to the normalised track level. */
const MASTER = 0.55;

class Music {
  private ctx: AudioContext | null = null;
  private el: HTMLAudioElement | null = null;
  private trackGain!: GainNode;
  private tone!: BiquadFilterNode;
  private air!: BiquadFilterNode;
  private panner!: PannerNode;
  private room!: GainNode;
  private master!: GainNode;
  private fade!: GainNode;
  private an!: AnalyserNode;
  private bins = new Uint8Array(512);
  private mean = 0;
  private manifest: Promise<Manifest> | null = null;

  private key: string | null = null;
  private queue: Track[] = [];
  private lastTrack: Track | null = null;
  private want = 0;
  private fails = 0;
  private ducked = false;
  private boomX: number | null = null;
  private pos = { cam: 0, focus: 0 };
  private vol = 0.7;
  private muted = false;
  private toastEl: HTMLDivElement | null = null;
  private toastT = 0;

  /** Low-frequency energy, 0..1, for the boombox speakers to pulse to. */
  level = 0;
  now = '';

  constructor() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? '{}');
      if (typeof s.vol === 'number') this.vol = Math.min(1, Math.max(0, s.vol));
      this.muted = !!s.muted;
    } catch { /* ignore */ }
    const wake = () => { this.ctx?.resume(); if (this.el && this.el.paused && this.key && this.el.src) this.el.play().catch(() => undefined); };
    for (const ev of ['keydown', 'pointerdown', 'touchstart']) window.addEventListener(ev, wake, { passive: true });
    window.addEventListener('gamepadconnected', wake);
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'KeyM') this.setMuted(!this.muted);
      else if (e.code === 'BracketLeft' || e.code === 'Minus') this.setVol(this.vol - 0.1);
      else if (e.code === 'BracketRight' || e.code === 'Equal') this.setVol(this.vol + 0.1);
    });
  }

  private save() { try { localStorage.setItem(KEY, JSON.stringify({ vol: this.vol, muted: this.muted })); } catch { /* ignore */ } }

  setMuted(m: boolean) { this.muted = m; this.save(); this.apply(); this.toast(m ? 'MUSIC OFF' : `MUSIC ON  ${Math.round(this.vol * 10)}/10`); }
  setVol(v: number) {
    this.vol = Math.min(1, Math.max(0, Math.round(v * 10) / 10));
    if (this.vol > 0) this.muted = false;
    this.save(); this.apply();
    this.toast(this.vol === 0 ? 'MUSIC OFF' : `MUSIC  ${'|'.repeat(Math.round(this.vol * 10))}${'.'.repeat(10 - Math.round(this.vol * 10))}`);
  }

  private toast(msg: string) {
    if (!this.toastEl) {
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;left:50%;bottom:9%;transform:translateX(-50%);padding:6px 14px;background:rgba(10,10,20,.82);color:#ffe45e;font:bold 14px monospace;letter-spacing:2px;border:2px solid #ff8a1a;pointer-events:none;opacity:0;transition:opacity .15s;z-index:9';
      document.body.appendChild(d);
      this.toastEl = d;
    }
    this.toastEl.textContent = msg;
    this.toastEl.style.opacity = '1';
    clearTimeout(this.toastT);
    this.toastT = window.setTimeout(() => { if (this.toastEl) this.toastEl.style.opacity = '0'; }, 1300);
  }

  private apply() {
    if (!this.ctx) return;
    const g = this.muted ? 0 : this.vol * MASTER;
    this.master.gain.setTargetAtTime(g, this.ctx.currentTime, 0.08);
  }

  private load(): Promise<Manifest> {
    this.manifest ??= fetch(`${BASE}audio/bgm/manifest.json`).then((r) => (r.ok ? r.json() : { lists: {} })).catch(() => ({ lists: {} }));
    return this.manifest;
  }

  private build() {
    if (this.ctx) return;
    const ctx = new AudioContext({ latencyHint: 'playback' });
    this.ctx = ctx;
    const el = new Audio();
    el.preload = 'auto';
    el.addEventListener('ended', () => this.next());
    el.addEventListener('error', () => { this.fails++; if (this.fails < 6) window.setTimeout(() => this.next(), 300); });
    this.el = el;
    const src = ctx.createMediaElementSource(el);

    this.trackGain = ctx.createGain();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 150; hp.Q.value = 0.8;
    const box = ctx.createBiquadFilter(); box.type = 'peaking'; box.frequency.value = 1100; box.gain.value = 4.5; box.Q.value = 1.1;
    const thump = ctx.createBiquadFilter(); thump.type = 'peaking'; thump.frequency.value = 190; thump.gain.value = 3; thump.Q.value = 1.4;
    this.tone = ctx.createBiquadFilter(); this.tone.type = 'lowpass'; this.tone.frequency.value = 5200; this.tone.Q.value = 0.7;

    const sat = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) { const x = (i / (curve.length - 1)) * 2 - 1; curve[i] = Math.tanh(x * 1.9) / Math.tanh(1.9); }
    sat.curve = curve; sat.oversample = '2x';

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.008; comp.release.value = 0.2;

    this.air = ctx.createBiquadFilter(); this.air.type = 'lowpass'; this.air.frequency.value = 6000; this.air.Q.value = 0.5;

    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'linear';
    this.panner.rolloffFactor = 0;
    this.panner.setPosition(0, 0, 2.5);

    this.room = ctx.createGain(); this.room.gain.value = 0.22;
    const slap = ctx.createConvolver(); slap.buffer = this.impulse(ctx);
    const roomLp = ctx.createBiquadFilter(); roomLp.type = 'lowpass'; roomLp.frequency.value = 2800;

    this.fade = ctx.createGain(); this.fade.gain.value = 0;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    this.an = ctx.createAnalyser(); this.an.fftSize = 1024; this.an.smoothingTimeConstant = 0.4;

    src.connect(this.trackGain); this.trackGain.connect(hp); hp.connect(thump); thump.connect(box); box.connect(this.tone);
    this.tone.connect(sat); sat.connect(comp); comp.connect(this.air);
    this.trackGain.connect(this.an);
    this.air.connect(this.panner);
    this.panner.connect(this.fade);
    this.panner.connect(roomLp); roomLp.connect(slap); slap.connect(this.room); this.room.connect(this.fade);
    this.fade.connect(this.master); this.master.connect(ctx.destination);
    this.apply();
  }

  /** Short, dark outdoor reflection: a couple of discrete slaps off the fence and wall plus a quickly dying tail. */
  private impulse(ctx: AudioContext) {
    const len = Math.floor(ctx.sampleRate * 0.7), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4) * 0.5;
      for (const [t, a] of [[0.028, 0.7], [0.061, 0.5], [0.113, 0.35]] as [number, number][]) d[Math.floor((t + c * 0.006) * ctx.sampleRate)] += a;
    }
    return buf;
  }

  /** Start the playlist for a court (or the menu). Does nothing if it is already the one playing. */
  async play(key: string, boomX: number | null = null) {
    this.boomX = boomX;
    if (this.key === key) return;
    this.key = key;
    const token = ++this.want;
    const m = await this.load();
    if (token !== this.want) return;
    const list = m.lists[key] ?? [];
    if (!list.length) { this.stop(); this.key = key; return; }
    this.build();
    this.fails = 0;
    this.queue = []; this.lastTrack = null;
    this.next();
  }

  /** Random order without repeats until the whole playlist has been heard. */
  private async next() {
    if (!this.key || !this.el || !this.ctx) return;
    const m = await this.load();
    const list = m.lists[this.key] ?? [];
    if (!list.length) return;
    if (!this.queue.length) {
      const bag = [...list];
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag.length > 1 && bag[bag.length - 1] === this.lastTrack) { const j = Math.floor(Math.random() * (bag.length - 1)); [bag[bag.length - 1], bag[j]] = [bag[j], bag[bag.length - 1]]; }
      this.queue = bag;
    }
    const t = this.queue.pop()!;
    this.lastTrack = t;
    const el = this.el, ctx = this.ctx;
    this.trackGain.gain.setValueAtTime(Math.pow(10, t.gain / 20), ctx.currentTime);
    el.src = BASE + 'audio/bgm/' + t.f.split('/').map(encodeURIComponent).join('/');
    this.now = t.f.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
    this.fade.gain.cancelScheduledValues(ctx.currentTime);
    this.fade.gain.setValueAtTime(0, ctx.currentTime);
    this.fade.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
    el.play().catch(() => undefined);
  }

  stop(fade = 0.6) {
    this.want++;
    this.key = null;
    this.now = '';
    const ctx = this.ctx, el = this.el;
    if (!ctx || !el) return;
    this.fade.gain.cancelScheduledValues(ctx.currentTime);
    this.fade.gain.setTargetAtTime(0, ctx.currentTime, fade / 4);
    const stopping = el.src;
    window.setTimeout(() => { if (!this.key && el.src === stopping) { el.pause(); } }, fade * 1000 + 100);
  }

  duck(on: boolean) { this.ducked = on; }

  /** Short satisfying ping on perfect timing. */
  chime() {
    this.build();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * (this.muted ? 0 : this.vol), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.24);
  }

  /** Call every frame with the camera centre and the middle of the action, in world units. */
  update(dt: number, camX: number, focusX: number) {
    this.pos.cam = camX; this.pos.focus = focusX;
    const ctx = this.ctx;
    if (!ctx || !this.el || this.el.paused) { this.level += (0 - this.level) * Math.min(1, dt * 6); return; }
    const t = ctx.currentTime;
    if (this.boomX === null) {
      this.panner.setPosition(0, 0, 2.5);
      this.air.frequency.setTargetAtTime(this.ducked ? 900 : 6000, t, 0.1);
    } else {
      const side = Math.max(-1.7, Math.min(1.7, (this.boomX - camX) / 560));
      this.panner.setPosition(side * 2.4, 0, 2.5);
      const dist = Math.min(1, Math.abs(this.boomX - focusX) / 1000);
      this.air.frequency.setTargetAtTime(this.ducked ? 900 : 6200 - dist * 3400, t, 0.15);
    }
    const dist = this.boomX === null ? 0 : Math.min(1, Math.abs(this.boomX - focusX) / 1000);
    const g = (this.muted ? 0 : this.vol * MASTER) * (1 - dist * 0.42) * (this.ducked ? 0.4 : 1);
    this.master.gain.setTargetAtTime(g, t, 0.12);

    this.an.getByteFrequencyData(this.bins);
    let s = 0;
    for (let i = 1; i < 5; i++) s += this.bins[i];
    const cur = s / 4;
    this.mean += (cur - this.mean) * Math.min(1, dt * 2.5);
    const lv = Math.min(1, Math.max(0, (cur - this.mean) / 28 + 0.12));
    this.level += (lv - this.level) * Math.min(1, dt * (lv > this.level ? 30 : 10));
  }
}

export const music = new Music();
(window as unknown as { __music: Music }).__music = music;
