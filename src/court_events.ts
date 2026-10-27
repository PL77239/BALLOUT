import type { CourtId, Live } from './courts';
import { GW, PX, Pix } from './pixel';

type Cameo = { kind: 'bmx'|'courier'|'skate'|'dance'|'dog'; color: number; accent: number };
// Small neighbourhood cameos, deliberately behind play and without collision or sound.
export const COURT_CAMEOS: Record<CourtId,Cameo[]> = {
  rucker:[{kind:'courier',color:0x343e54,accent:0xd6b96a}],venice:[{kind:'skate',color:0x54babc,accent:0xecc17d}],
  pigalle:[{kind:'courier',color:0xd079ad,accent:0x73b7d4}],dyckman:[{kind:'dance',color:0x34563b,accent:0xe8c249}],
  tenement:[{kind:'dog',color:0xc7564a,accent:0xd9bd80}],mosswood:[{kind:'skate',color:0x3368b4,accent:0xe9c94e}],
  kalemegdan:[{kind:'courier',color:0x745044,accent:0xded8b5}],
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
  marseille:[{kind:'skate',color:0x52b9dc,accent:0xf0f0df}],
  warsaw:[{kind:'courier',color:0x252b36,accent:0xe4bb32},{kind:'skate',color:0x596242,accent:0xc7c1aa}],
};
export function paintCameo(p:Pix,c:Cameo,phase:number) {
  // Larger connected shapes and consistent highlights make cameos read as
  // characters at court scale, not as thin stick figures.
  const dark=0x161722,skin=0x9b6a4c,light=0xd59a73,step=phase?2:-2;
  const wheel=(x:number)=>{
    for(let i=0;i<32;i++){const a=i*Math.PI/16;p.set(Math.round(x+5*Math.cos(a)),Math.round(26+5*Math.sin(a)),dark);}
    p.line(x-3,26,x+3,26,0x99a7ae);p.line(x,23,x,29,0x99a7ae);
  };
  const cycling=c.kind==='bmx'||c.kind==='courier';
  if(cycling){wheel(7);wheel(31);p.line(7,26,17,17,dark);p.line(17,17,24,26,c.accent);p.line(7,26,24,26,c.accent);p.line(24,26,31,16,c.accent);p.line(31,16,31,26,dark);p.line(28,15,34,15,dark);}
  p.rect(12,3,8,7,dark);p.rect(13,3,7,6,skin);p.rect(17,5,2,2,light);p.set(18,5,dark);
  p.rect(12,2,8,3,c.color);p.rect(18,3,3,1,c.accent);
  p.rect(11,10,10,9,dark);p.rect(12,10,8,8,c.color);p.rect(13,11,2,6,c.accent);
  if(cycling){
    p.line(19,11,26,14,skin);p.line(26,14,30,15,light);
    p.line(15,18,20+step,23,dark);p.line(20+step,23,17,27,dark);p.rect(15,26,5,2,c.accent);
    p.line(13,18,14-step,22,dark);p.line(14-step,22,21,25,dark);
    if(c.kind==='courier'){p.rect(7,9,6,9,dark);p.rect(8,10,4,6,c.accent);}
  }else if(c.kind==='dance'){
    p.line(12,11,7,8+step,skin);p.line(19,11,25,7-step,skin);
    p.line(14,19,10+step,28,dark);p.line(18,19,23-step,28,dark);
    p.rect(8+step,27,5,2,c.accent);p.rect(21-step,27,5,2,c.accent);
    p.rect(4,24,6,5,dark);p.rect(5,25,2,2,c.accent);
  }else{
    p.line(14,19,12+step,28,dark);p.line(18,19,22-step,28,dark);p.line(19,11,25,17,skin);
    p.rect(10+step,27,5,2,c.accent);p.rect(20-step,27,5,2,c.accent);
    if(c.kind==='skate'){p.rect(8,29,19,2,c.accent);p.set(11,31,dark);p.set(25,31,dark);}
    else{p.line(25,17,31,24,0x918d81);p.rect(27,23,9,5,dark);p.rect(28,23,8,4,c.accent);p.rect(34,21,4,4,c.accent);p.line(28,27,28+step,30,dark);p.line(34,27,34-step,30,dark);}
  }
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
