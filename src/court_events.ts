import type { CourtId, Live } from './courts';
import { GW, PX, Pix } from './pixel';

type Cameo = { kind: 'bmx'|'courier'|'skate'|'dance'|'dog'; color: number; accent: number };
// Small neighbourhood cameos, deliberately behind play and without collision or sound.
export const COURT_CAMEOS: Record<CourtId,Cameo[]> = {
  la:[{kind:'bmx',color:0x245bb4,accent:0xe3e6ed}],
  brooklyn:[{kind:'courier',color:0xc38c35,accent:0x34492c}],
  queens:[{kind:'dance',color:0x253e70,accent:0xe4bd42}],
  harlem:[{kind:'dance',color:0xa5323d,accent:0xf5dfb4}],
  philly:[{kind:'bmx',color:0x287954,accent:0xd9dfdd}],
  fairmount:[{kind:'dog',color:0x3b705b,accent:0xa57c50}],
  detroit:[{kind:'courier',color:0x263c65,accent:0xc6c7ce}],
  atl:[{kind:'dance',color:0x793b92,accent:0xebc957}],
  chicago:[{kind:'skate',color:0xb53640,accent:0x211e2b}],
  chiraq:[{kind:'bmx',color:0x252635,accent:0xb13742}],
  warsaw:[{kind:'courier',color:0x252b36,accent:0xe4bb32},{kind:'skate',color:0x596242,accent:0xc7c1aa}],
};
export function paintCameo(p:Pix,c:Cameo,phase:number) {
  const dark=0x181b29, skin=0xa37653, step=phase?2:-2;
  const wheel=(x:number)=>{for(let i=0;i<24;i++){const a=i*Math.PI/12;p.set(Math.round(x+5*Math.cos(a)),Math.round(25+5*Math.sin(a)),dark);}p.line(x-4,25,x+4,25,0x87939c);};
  const cycling=c.kind==='bmx'||c.kind==='courier';
  if(cycling){wheel(7);wheel(29);p.line(7,25,16,16,c.accent);p.line(16,16,23,25,c.accent);p.line(7,25,23,25,c.accent);p.line(23,25,29,15,c.accent);p.line(29,15,29,25,dark);p.line(26,14,31,14,dark);}
  p.rect(13,3,6,6,skin);p.rect(12,2,8,3,c.color);
  p.rect(12,9,8,10,c.color);p.rect(13,10,2,7,c.accent);
  if(cycling){p.line(18,11,27,15,skin);p.line(17,19,20+step,23,dark);p.line(20+step,23,17,27,dark);if(c.kind==='courier'){p.rect(7,9,6,9,dark);p.rect(8,10,4,6,c.accent);}}
  else if(c.kind==='dance'){p.line(12,11,7,7+step,skin);p.line(19,11,25,6-step,skin);p.line(14,19,10+step,28,dark);p.line(18,19,23-step,28,dark);p.rect(5,25,5,4,dark);p.set(6,26,c.accent);}
  else {p.line(14,19,12+step,28,dark);p.line(18,19,22-step,28,dark);p.line(19,11,25,17,skin);if(c.kind==='skate'){p.rect(9,29,18,2,c.accent);p.set(11,31,dark);p.set(25,31,dark);}else{p.line(25,17,31,24,0x918d81);p.rect(27,24,9,4,c.accent);p.rect(33,21,4,4,c.accent);p.line(28,27,28+step,30,dark);p.line(34,27,34-step,30,dark);}}
}
export function addCourtEvents(L:Live,id:CourtId,random= Math.random) {
  const options=COURT_CAMEOS[id];
  const sprites=options.map(c=>[0,1].map(phase=>L.img(L.tex(40,34,p=>paintCameo(p,c,phase)),-50,125,-984).setVisible(false)));
  let wait=18+random()*20, x=-42, active=false, direction=1, variant=0, elapsed=0;
  L.tick((_t,dt)=>{
    if(!active){wait-=dt;if(wait>0)return;active=true;elapsed=0;direction=random()<.5?1:-1;x=direction===1?-42:GW+2;variant=Math.min(options.length-1,Math.floor(random()*options.length));}
    elapsed+=dt;
    const kind=options[variant].kind;
    x+=direction*(kind==='dance'?13:kind==='dog'?19:31)*dt;
    const phase=Math.floor(elapsed*(kind==='dance'?5:4))%2;
    sprites[variant].forEach((im,i)=>{im.setVisible(i===phase);im.setFlipX(direction<0);im.setPosition(Math.round(x)*PX,(125+(kind==='dance'?Math.round(Math.sin(elapsed*6)):0))*PX);});
    if(x>GW+44||x< -46){sprites[variant].forEach(im=>im.setVisible(false));active=false;wait=35+random()*45;}
  });
}
