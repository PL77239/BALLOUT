/** Original procedural court Foley: rubber thumps, sneaker chirps and metal/net impacts. */
class CourtSfx {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private last = new Map<string, number>();
  private noise: AudioBuffer | null = null;

  unlock = () => {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
      this.bus = this.ctx.createGain(); this.bus.gain.value = 0.48;
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -12; limiter.ratio.value = 8;
      this.bus.connect(limiter); limiter.connect(this.ctx.destination);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
  };

  private ready(key: string, cooldown: number) {
    if (!this.ctx || this.ctx.state !== 'running') return false;
    const now = this.ctx.currentTime;
    if (now - (this.last.get(key) ?? -10) < cooldown) return false;
    this.last.set(key, now); return true;
  }

  private tone(freq: number, end: number, seconds: number, volume: number, type: OscillatorType = 'sine') {
    const c = this.ctx!, t = c.currentTime, osc = c.createOscillator(), amp = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(end, t + seconds);
    amp.gain.setValueAtTime(volume, t); amp.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    osc.connect(amp); amp.connect(this.bus!); osc.start(t); osc.stop(t + seconds);
    osc.onended = () => { osc.disconnect(); amp.disconnect(); };
  }

  private hiss(freq: number, seconds: number, volume: number, q = 0.8) {
    const c = this.ctx!, t = c.currentTime, src = c.createBufferSource(), filter = c.createBiquadFilter(), amp = c.createGain();
    src.buffer = this.noise; filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = q;
    amp.gain.setValueAtTime(volume, t); amp.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    src.connect(filter); filter.connect(amp); amp.connect(this.bus!); src.start(t, Math.random() * 0.6); src.stop(t + seconds);
    src.onended = () => { src.disconnect(); filter.disconnect(); amp.disconnect(); };
  }

  bounce(power = 1) {
    if (!this.ready('bounce', 0.075)) return;
    const v = Math.min(1, Math.max(0.2, power));
    this.tone(155 + Math.random() * 18, 48, 0.15, 0.65 * v);
    this.hiss(850, 0.055, 0.22 * v); this.tone(370, 210, 0.045, 0.08 * v);
  }
  squeak() {
    if (!this.ready('squeak', 0.23)) return;
    const f = 1250 + Math.random() * 450;
    this.tone(f, f * 0.72, 0.105, 0.09, 'triangle'); this.hiss(2400, 0.08, 0.12, 4);
  }
  rim() {
    if (!this.ready('rim', 0.09)) return;
    this.tone(480, 410, 0.23, 0.20, 'triangle'); this.tone(780, 720, 0.13, 0.08); this.hiss(1600, 0.055, 0.23);
  }
  board() { if (this.ready('board', 0.1)) { this.tone(220, 80, 0.13, 0.4); this.hiss(1100, 0.09, 0.28); } }
  net() { if (this.ready('net', 0.2)) { this.hiss(3400, 0.27, 0.5); this.hiss(850, 0.12, 0.16); } }
  dunk() {
    if (!this.ready('dunk', 0.3)) return;
    this.tone(110, 32, 0.3, 0.85); this.hiss(1400, 0.16, 0.5); this.tone(470, 360, 0.45, 0.19, 'triangle');
    this.net();
  }
  ankle() { if (this.ready('ankle', 0.5)) { this.squeak(); this.tone(140, 45, 0.19, 0.4); this.hiss(600, 0.16, 0.3); } }
}
export const sfx = new CourtSfx();
// Browsers require a gesture before audio can start. These listeners also resume after tab suspension.
window.addEventListener('pointerdown', sfx.unlock);
window.addEventListener('keydown', sfx.unlock);
