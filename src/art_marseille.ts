import { GW, PX } from './pixel';
import { sky, stars } from './courtkit';
import { chainFence, lamp, palm, graffiti, bench, trashCan, boombox, sign } from './courtkit';
import { BOOM_X, building, finish, spots, type CourtArt } from './court_common';

/** A fictional waterfront court: Vieux-Port, Fort Saint-Jean and Bonne Mere skyline. */
export const marseille:CourtArt={
 seed:13013,crowdLook:'marseille',net:0xe8eff0,
 amb:{tint:[.48,.53,.72],k:.33,lit:[1.10,1.03,.83],steps:5},
 paint(c){
  sky(c,[0x10182c,0x252840,0x534057,0x9b6667,0xc28b78,0x7898a1],0,151);stars(c,22,0,46);
  const S=c.sky,P=c.base;
  // Distant limestone ridge and the striped basilica high above the harbour.
  S.poly([180,118,219,99,260,93,290,84,317,79,346,90,385,105,427,111,427,145,180,145],0x394251);
  S.poly([210,118,260,105,305,91,336,99,372,116],0x45505b);
  S.rect(304,68,37,14,0xb5ab99);S.poly([301,68,314,59,333,59,345,68],0x725b52);
  S.rect(311,43,12,29,0xbeb8a7);S.rect(309,41,16,4,0xd4c9ac);
  for(let y=47;y<71;y+=5)S.hline(311,322,y,0x706a69);
  S.rect(315,47,4,7,0x303b4e);S.rect(315,57,4,7,0x303b4e);
  S.rect(313,36,8,6,0xba9b67);S.rect(316,29,2,8,0xe6c87d);S.hline(314,319,32,0xe6c87d);
  S.rect(328,65,8,12,0xd4c8ae);S.poly([327,65,332,59,337,65],0x84685a);
  for(let x=290;x<365;x+=7){S.rect(x,98+(x%3)*PX,6,12,0x57616b);S.set(x+2,102+(x%3)*PX,0xc9ae83);}
  // Harbour water, moored boats and masts: the foreground remains a playable blacktop.
  P.rect(0,113,GW,36,0x294855);
  for(let y=115;y<146;y+=3)for(let x=(y%7);x<GW;x+=19){P.hline(x,x+5+(y%4),y,y%2?0x547581:0x3a5c68);}
  for(const [x,y,w] of [[155,126,26],[210,135,31],[263,122,22],[321,132,29]]){
   P.poly([x,y,x+w,y,x+w-4,y+5,x+5,y+5],0xc7c4b5);P.hline(x+3,x+w-2,y+1,0x40697d);
   P.vline(x+w/2,y-32,y,0x9aafb6);P.line(x+w/2,y-30,x+2,y-1,0x5d7784);
  }
  // Fort Saint-Jean and its squat waterfront tower.
  P.rect(105,109,43,18,0x8d8878);P.rect(108,99,15,28,0xaaa18b);P.rect(106,96,19,5,0xc4b69a);
  for(let y=103;y<126;y+=5)P.hline(109,121,y,0x777769);
  P.rect(113,106,4,7,0x414c50);P.hline(104,149,127,0xc0b294);
  // Worn ochre apartment blocks and blue shutters frame the port.
  for(const [x,w,y,col] of [[-3,40,52,0xa38675],[39,39,65,0xc1a78e],[365,32,72,0xae9584],[400,32,56,0x998b80]]){
   building(c,x,y,w,145-y,col,{cols:3,rows:4,lit:.38,trim:0x4f5b6a});
   for(let sy=y+12;sy<136;sy+=19)for(let sx=x+5;sx<x+w-4;sx+=10){P.rect(sx,sy,3,7,0x396a83);P.vline(sx+1,sy,sy+6,0x5a8799);}
  }
  P.rect(0,146,GW,14,0x7d807a);P.hline(0,GW,146,0xb3b09f);
  for(let x=0;x<GW;x+=18)P.vline(x,148,158,0x575f61);
  graffiti(c,160,149,'MASSILIA',0x69c3e2,{scale:1,outline:0x243747,shadow:0xe6e0c4});
  sign(c,12,134,'LE PANIER',0xe6d9b5,{scale:1,bg:0x304e62});
  chainFence(c,0,118,GW,160,0x78868e,.34);
  palm(c,89,158,64,-.10,0x635c56,0x344c51);palm(c,393,158,71,.13,0x635c56,0x344c51);
  lamp(c,132,158,53,{dir:1,col:0xffd4a0,k:.9});lamp(c,349,158,55,{dir:-1,col:0xffd4a0,k:.9});
  spots(c,[[22,158,'stand'],[65,158,'kid'],[118,158,'cheer'],[245,158,'stand',-1],[310,158,'elder'],[373,158,'stand',-1]]);
 },
 paintFloor(c){finish(c,{base:0x3d4850,edge:0x5b666c,key:0x297b9b,lines:0xe4e5dc,seed:13,crack:18,sidewalk:0x8b8980,speckle:1.1},{board:0xd9e5e7},()=>{bench(c,52,160,24);trashCan(c,363,160);boombox(c,BOOM_X.marseille,160);});},
 live(L){
  const glints=L.gfx(-994);L.tick(t=>{glints.clear();glints.fillStyle(0xb3b7a5,.28);for(let i=0;i<14;i++)glints.fillRect((145+(i*17+Math.floor(t*3))%210)*PX,(117+(i*7)%25)*PX,(2+i%4)*PX,PX);});
 },
};
