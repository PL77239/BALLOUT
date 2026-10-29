import type { CourtId, Live } from './courts';
import { GW, PX, Pix } from './pixel';
import { Puppet, restRig } from './puppet';
import { rivalFor, type RegionId } from './loadout';
import { strokeBike } from './art_bike';

type Cameo = { kind: 'bmx'|'courier'|'skate'|'dance'|'dog'; color: number; accent: number };
// Small neighbourhood cameos, deliberately behind play and without collision or sound.
export const COURT_CAMEOS: Record<CourtId,Cameo[]> = {
  rucker:[{kind:'courier',color:0x343e54,accent:0xd6b96a}],venice:[{kind:'skate',color:0x54babc,accent:0xecc17d}],
  pigalle:[{kind:'courier',color:0xd079ad,accent:0x73b7d4}],dyckman:[{kind:'dance',color:0x34563b,accent:0xe8c249}],
  tenement:[{kind:'dog',color:0xc7564a,accent:0xd9bd80},{kind:'bmx',color:0x3d5a4c,accent:0xe2c27a}],
  mosswood:[{kind:'skate',color:0x3368b4,accent:0xe9c94e}],
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

/** Props only; the person is rendered by the same Puppet as players and fans. */
export function paintCameo(p:Pix,c:Cameo,phase:number) {
 const dark=0x252935,step=phase?2:-2;
 if(c.kind==='bmx'||c.kind==='courier'){
  strokeBike((x,y,col)=>p.set(x,y,col),8,28,c.color,c.accent,phase,c.kind);
 }else if(c.kind==='skate'){p.rect(16,54,33,2,dark);p.rect(19,55,27,2,c.accent);p.rect(15,53,5,2,c.accent);p.rect(46,53,5,2,c.accent);p.rect(22,57,4,3,dark);p.rect(40,57,4,3,dark);p.rect(23,57,2,1,0xaaa99b);p.rect(41,57,2,1,0xaaa99b);}
 else if(c.kind==='dance'){p.rect(5,48,10,8,dark);p.rect(7,50,3,4,c.accent);p.rect(11,50,2,4,0x6a7680);}
 else {p.line(38,40,51,48,0x8f9281);p.rect(49,46,11,5,c.accent);p.rect(57,43,5,6,c.accent);p.rect(49+step,50,3,6,dark);p.rect(57-step,50,3,6,dark);}
}
export function addCourtEvents(L:Live,id:CourtId,random= Math.random) {
 const options=COURT_CAMEOS[id];
 const region:RegionId=['venice','mosswood','la'].includes(id)?'la':['pigalle','tenement','marseille'].includes(id)?'marseille':id==='kalemegdan'?'warsaw':['rucker','dyckman'].includes(id)?'harlem':id==='brooklyn'?'bk':id==='fairmount'?'philly':id==='chicago'?'chi':id as RegionId;
 const makePeople=()=>options.map(c=>{
  const l={...rivalFor(region),top:'tee' as const,topColor:c.color,topTrim:c.accent,topTexture:undefined,bottomTexture:undefined,bottom:'jeans' as const,bottomColor:0x303d50,head:'backcap' as const,headColor:c.color,chain:'none' as const};
  const p=new Puppet(L.scene,l,{scale:.52,w:64,h:64});p.root.setDepth(-983).setVisible(false);L.onDestroy(()=>p.destroy());return p;
 });
 const makeProps=()=>options.map(c=>[0,1].map(phase=>L.img(L.tex(64,64,p=>paintCameo(p,c,phase)),-70,95,-982).setVisible(false)));
 const slots=[{wait:0.4+random()*2,x:-70,active:false,direction:1,variant:0,elapsed:0,people:makePeople(),props:makeProps()},{wait:6+random()*8,x:-70,active:false,direction:1,variant:0,elapsed:0,people:makePeople(),props:makeProps()}];
 L.tick((_t,dt)=>{
  for(const slot of slots){
   if(!slot.active){slot.wait-=dt;if(slot.wait>0)continue;slot.active=true;slot.elapsed=0;slot.direction=random()<.5?1:-1;slot.x=slot.direction===1?-70:GW+2;slot.variant=Math.min(options.length-1,Math.floor(random()*options.length));}
   slot.elapsed+=dt;const kind=options[slot.variant].kind,cycling=kind==='bmx'||kind==='courier';
   slot.x+=slot.direction*(kind==='dance'?12:kind==='dog'?20:32)*dt;
   const skating=kind==='skate';
   const phase=Math.floor(slot.elapsed*(kind==='dance'?5:4))%2,person=slot.people[slot.variant],r=restRig();
   r.hipY=cycling?55:76;r.lean=cycling?.36:.08;r.turn=kind==='dance'?.15:1;
   r.fFx=cycling?24:18+Math.sin(slot.elapsed*7)*12;r.bFx=cycling?-14:-18-Math.sin(slot.elapsed*7)*12;
   r.fFy=cycling?8+phase*12:Math.max(0,Math.cos(slot.elapsed*7))*5;r.bFy=cycling?20-phase*12:Math.max(0,-Math.cos(slot.elapsed*7))*5;
   r.fHx=cycling?43:17;r.bHx=cycling?37:-5;r.fHy=cycling?81:96+Math.sin(slot.elapsed*7)*8;r.bHy=cycling?83:96-Math.sin(slot.elapsed*7)*8;
   if(skating){
    r.hipY=69+Math.sin(slot.elapsed*2)*1.5;r.lean=.17;r.fFx=22;r.bFx=-22;r.fFy=0;r.bFy=0;r.fAnk=0;r.bAnk=0;
    r.fHx=30;r.bHx=-28;r.fHy=94+Math.sin(slot.elapsed*2)*3;r.bHy=102-Math.sin(slot.elapsed*2)*3;
   }
   if(kind==='dance'){r.fHx=30;r.bHx=-24;r.fHy=137+Math.sin(slot.elapsed*5)*13;r.bHy=118-Math.sin(slot.elapsed*5)*13;}
   person.setFacing(slot.direction);person.update(r,dt,{}, {f:slot.direction*60,h:0});person.root.setVisible(true).setPosition((slot.x+32)*PX,(skating?149:151)*PX);
   slot.people.forEach((p,i)=>p.root.setVisible(slot.active&&i===slot.variant));
   slot.props.forEach((pair,vi)=>pair.forEach((im,i)=>{const show=slot.active&&vi===slot.variant&&i===phase;im.setVisible(show);if(show){im.setFlipX(slot.direction<0);im.setPosition(Math.round(slot.x)*PX,95*PX);}}));
   if(slot.x>GW+70||slot.x< -72){slot.props.forEach(pair=>pair.forEach(im=>im.setVisible(false)));slot.people.forEach(p=>p.root.setVisible(false));slot.active=false;slot.wait=8+random()*16;}
  }
 });
}
