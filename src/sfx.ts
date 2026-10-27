/** Recorded CC0 basketball Foley; provenance and edit points: public/audio/sfx/CREDITS.md. */
type Clip = 'bounce-1'|'bounce-2'|'bounce-3'|'rim-1'|'rim-2'|'net-1'|'net-2'|'squeak-1'|'squeak-2';
const CLIPS: Clip[] = ['bounce-1','bounce-2','bounce-3','rim-1','rim-2','net-1','net-2','squeak-1','squeak-2'];
class CourtSfx {
  private ctx: AudioContext|null=null;
  private bus: GainNode|null=null;
  private buffers=new Map<Clip,AudioBuffer>();
  private last=new Map<string,number>();
  private loading: Promise<void>|null=null;
  unlock=()=>{
    if(!this.ctx){
      this.ctx=new AudioContext({latencyHint:'interactive'});
      this.bus=this.ctx.createGain();this.bus.gain.value=.55;
      const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-10;limiter.ratio.value=5;
      this.bus.connect(limiter);limiter.connect(this.ctx.destination);
    }
    const ctx=this.ctx;
    if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
    this.loading??=Promise.all(CLIPS.map(async key=>{
      try{
        const r=await fetch(`${import.meta.env.BASE_URL}audio/sfx/${key}.wav`);
        if(r.ok)this.buffers.set(key,await ctx.decodeAudioData(await r.arrayBuffer()));
      }catch{/* Unavailable audio never interrupts a match. */}
    })).then(()=>{});
  };
  private play(group:string,clips:Clip[],volume:number,cooldown:number,rate=1){
    const ctx=this.ctx;
    if(!ctx || ctx.state!=='running' || ctx.currentTime-(this.last.get(group)??-10)<cooldown)return;
    const clip=this.buffers.get(clips[Math.floor(Math.random()*clips.length)]);if(!clip)return;
    this.last.set(group,ctx.currentTime);
    const source=ctx.createBufferSource(),amp=ctx.createGain();source.buffer=clip;
    source.playbackRate.value=rate*(.98+Math.random()*.04);amp.gain.value=volume;
    source.connect(amp);amp.connect(this.bus!);source.start();source.onended=()=>{source.disconnect();amp.disconnect();};
  }
  bounce(power=1){this.play('bounce',['bounce-1','bounce-2','bounce-3'],.33*Math.min(1,Math.max(.18,power)),.09);}
  squeak(){this.play('squeak',['squeak-1','squeak-2'],.12,.3);}
  rim(){this.play('rim',['rim-1','rim-2'],.38,.1);}
  board(){this.play('board',['rim-1','rim-2'],.27,.12,.84);}
  net(){this.play('net',['net-1','net-2'],.24,.22);}
  dunk(){this.play('dunk',['rim-1','rim-2'],.54,.3,.92);this.net();}
  ankle(){this.squeak();this.play('body',['bounce-2'],.18,.4,.83);}
}
export const sfx=new CourtSfx();
window.addEventListener('pointerdown',sfx.unlock);
window.addEventListener('keydown',sfx.unlock);
