import { GW, shade } from './pixel';
import { sky, tree, palm, chainFence, sign, bench, boombox, paintHoop, paintFloor, brick, lamp, type Scene2D, type FloorStyle } from './courtkit';
import { building, laundry, spots, BOOM_X, type CourtArt } from './court_common';

// Photo studies and dates are recorded in docs/famous-courts.md. These are
// original pixel drawings, with the same playable projection on every court.
type FamousId='rucker'|'venice'|'pigalle'|'dyckman'|'tenement'|'mosswood'|'kalemegdan';
const daylight={tint:[.72,.76,.81] as [number,number,number],k:.85,lit:[1.02,1.01,.96] as [number,number,number],steps:7};
const trees=(c:Scene2D,xs:number[],h=82)=>xs.forEach((x,i)=>{
 const p=c.base,top=151-h-i%3*9;
 p.rect(x-2,top+25,5,151-top-25,0x594d3a);p.line(x,top+48,x-18,top+26,0x594d3a);p.line(x,top+44,x+21,top+21,0x594d3a);
 // Overlapping canopy masses retain a continuous silhouette at game scale.
 p.ellipse(x,top+21,39,27,0x254a3b);p.ellipse(x-27,top+25,27,22,0x325840);p.ellipse(x+27,top+17,31,25,0x3d6746);
 p.ellipse(x-8,top+4,28,19,0x49734b);p.ellipse(x+19,top+5,24,17,0x557b4e);
 for(let n=0;n<45;n++){const dx=Math.floor(c.rnd(-39,39)),dy=Math.floor(c.rnd(-8,39));if(p.get(x+dx,top+dy)>=0)p.hline(x+dx,x+dx+2,top+dy,c.pick([0x3b6142,0x5b8050,0x2d513c]));}
});
const stands=(c:Scene2D,x:number,y:number,w:number)=>{
 for(let i=0;i<4;i++){c.base.rect(x,y+i*5,w,3,0x9b9e99);c.base.hline(x,x+w,y+i*5,0xd2d1c4);}
 for(let dx=5;dx<w;dx+=24)c.base.vline(x+dx,y,y+21,0x494f4d);
};
function finish(c:Scene2D,id:string,st:FloorStyle){
 paintFloor(c,st);bench(c,13,150,26);bench(c,273,150,26);boombox(c,BOOM_X[id],159);paintHoop(c,{board:0xdfebe8,pole:0x38433f});
}
function fans(c:Scene2D){spots(c,[[25,152,'sit'],[61,153,'stand'],[110,153,'kid'],[175,152,'stand'],[232,153,'elder'],[285,152,'sit'],[335,153,'cheer']]);}

export const cage:CourtArt={seed:1101,crowdLook:'bk',amb:daylight,
 paint(c){
  sky(c,[0x84a4ba,0xb0c1c4,0xe4c7a0],0,154);
  building(c,-8,5,93,146,0x957260,{cols:8,rows:10,lit:.1});building(c,300,0,130,152,0xa49b83,{cols:10,rows:11,lit:.12});
  trees(c,[100,165,248,325],105);
  // Tall enclosure, Greenwich Village facades, blue/orange half court.
  c.base.rect(0,146,GW,13,0x8d8a7d);chainFence(c,0,37,GW,156,0x626e68,.48);
  for(const x of [3,86,171,256,341,423]){c.base.rect(x,35,2,122,0x3f4c47);c.base.hline(0,426,36,0x657a6b);}
  sign(c,100,54,'WEST 4TH STREET',0xe8d7b4,{bg:0x304f45});
  sign(c,165,87,'THE CAGE',0xeee5d1,{bg:0x2d443e});
  lamp(c,45,154,65,{col:0xf2dba7,k:.25});fans(c);
 },paintFloor(c){finish(c,'brooklyn',{base:0x337f9c,edge:0x66868b,key:0xd88a50,lines:0xeee8cf,seed:31,crack:5,speckle:.35,patch:.3});}
};

const rucker:CourtArt={seed:1414,crowdLook:'harlem',amb:daylight,
 paint(c){
  sky(c,[0x9db7c2,0xd8d6c0],0,154);
  for(const [x,y,w] of [[5,12,53],[60,27,46],[311,8,68],[379,23,48]])building(c,x,y,w,150-y,0x9b9484,{cols:4,rows:10,lit:.08});
  // Elevated pedestrian bridge and tall mature trees around the refurbished court.
  c.base.rect(0,76,161,8,0x8b9391);c.base.hline(0,164,74,0xbcc3b4);
  for(let x=8;x<160;x+=9)c.base.vline(x,67,76,0x687975);
  c.base.rect(110,83,6,62,0x858c85);trees(c,[53,146,254,343],88);
  stands(c,15,129,110);stands(c,245,129,105);chainFence(c,0,101,GW,151,0x5c6d63,.28);
  c.base.rect(130,114,109,26,0x202b2d);sign(c,139,120,'GREG MARIUS',0xded6b9);sign(c,147,131,'RUCKER PARK',0xddc38c);
  fans(c);
 },paintFloor(c){finish(c,'rucker',{base:0xc4b48c,edge:0x9d987f,key:0x343c3a,lines:0xf2ead2,seed:14,crack:0,speckle:.16,patch:0,art:p=>{
   for(let x=24;x<240;x+=37){p.ellipse(x,185,22,15,0x3c423f);p.ellipse(x+4,184,15,10,0xc4b48c);p.line(x-18,205,x+24,166,0x3c423f);}
  }});}
};
const venice:CourtArt={seed:1515,crowdLook:'la',amb:{...daylight,k:.74,lit:[1.08,.99,.88]},
 paint(c){
  sky(c,[0x677eaf,0xc2a9bd,0xf1b49f,0xf6d4a5],0,140);
  c.base.rect(0,115,GW,18,0x769ea8);for(let y=119;y<134;y+=4)c.base.hline(0,426,y,0xabc3bf);
  c.base.rect(0,134,GW,18,0xd9bf92);c.base.rect(0,148,GW,11,0xaaa08c);
  for(const [x,h] of [[28,108],[94,88],[155,105],[272,96],[329,112],[410,83]])palm(c,x,150,h,.12,0x76695c,0x3a5652);
  // Public beach buildings and another court beyond the main playing area.
  c.base.rect(5,135,69,15,0xddd6ba);sign(c,10,139,'VENICE BEACH',0x3c6b76);
  c.base.rect(245,120,3,32,0x5d6862);c.base.rect(230,118,24,12,0xbcc8be);c.base.rect(238,122,9,6,0x6e8b8a);
  for(let x=185;x<360;x+=26){c.base.rect(x,148,14,3,0x6b7973);c.base.vline(x+2,150,154,0x5a645f);}
  fans(c);
 },paintFloor(c){finish(c,'venice',{base:0x71878a,edge:0x9eaa9d,key:0x6b9d9a,lines:0xf1e9cf,seed:15,crack:4,speckle:.45,patch:.5,sidewalk:0xc8b58e});}
};
const pigalle:CourtArt={seed:1616,crowdLook:'marseille',amb:daylight,
 paint(c){
  sky(c,[0xb6c7d1,0xe6dcca],0,154);
  // Narrow slot between blind Parisian gable walls, plus the entry steps.
  building(c,-5,-5,105,160,0xc9b99d,{cols:7,rows:10,lit:0});building(c,327,-5,105,160,0xd5c6ae,{cols:8,rows:11,lit:0});
  c.base.poly([96,20,195,49,195,153,96,153],0xb9ac94);c.base.poly([197,48,329,5,329,153,197,153],0xd2c0a6);
  c.base.rect(96,98,233,55,0x4196bd);c.base.rect(96,113,233,17,0x315d83);c.base.rect(112,98,35,55,0xe77da3);
  c.base.rect(267,98,24,55,0xf2cf6b);c.base.poly([197,98,230,98,202,153,171,153],0xc0d0c0);
  for(const x of [162,244,302])sign(c,x,103,'6',0xf2e7d2,{scale:2});
  for(let i=0;i<6;i++){c.base.rect(100,139+i*3,51,3,0xc9c8ad);c.base.hline(100,150,139+i*3,0xe1debd);}
  c.base.vline(151,130,156,0x3b777f);sign(c,173,79,'PIGALLE',0x4e6471,{bg:0xd9d1bc});fans(c);
 },paintFloor(c){finish(c,'pigalle',{base:0x6db3ca,edge:0x4e8198,key:0xe3bd70,lines:0xf4e7cf,seed:16,crack:0,patch:0,speckle:.14,art:p=>{
   p.poly([10,161,117,161,167,219,10,219],0xd382ac);p.poly([117,161,188,161,238,219,167,219],0xe6c578);
   p.poly([188,161,245,161,295,219,238,219],0x6898b7);p.rect(295,170,116,36,0xc5d1bd);
  }});}
};
const dyckman:CourtArt={seed:1717,crowdLook:'harlem',amb:daylight,
 paint(c){
  sky(c,[0x7eafcc,0xc7d4ca],0,154);building(c,343,-8,90,161,0x996c51,{cols:7,rows:12,lit:.08});
  building(c,0,92,95,53,0xd0c9ae,{cols:7,rows:3,lit:.05});trees(c,[28,122,218,295],88);
  stands(c,8,125,155);stands(c,235,125,100);chainFence(c,0,92,GW,153,0x56685b,.3);
  c.base.rect(164,115,94,30,0x242c2c);sign(c,170,120,'DYCKMAN',0xe15e51,{scale:1});sign(c,170,132,'NAGLE AVE',0xe1d5b5);
  c.base.rect(303,94,29,22,0x2b5545);sign(c,305,97,'00 00',0xd4c875);sign(c,306,107,'HOME',0xe1dbc6);
  fans(c);
 },paintFloor(c){finish(c,'dyckman',{base:0x758860,edge:0x546b51,key:0x365448,lines:0xe7e5c8,seed:17,crack:2,speckle:.25,patch:.25,art:p=>{p.ellipse(182,187,31,14,0x303c39);p.line(160,194,196,180,0xe0b8a1);p.line(165,180,195,194,0xe0b8a1);}});}
};
const tenement:CourtArt={seed:1818,crowdLook:'marseille',amb:daylight,
 paint(c){
  sky(c,[0x88afbf,0xd3d7cc],0,154);
  // Seven-storey internal galleries and open dark corridors are the landmark.
  c.base.rect(0,0,GW,153,0xc0bfb4);
  for(let y=5;y<143;y+=20){
   c.base.rect(0,y,GW,10,0x3e4b4c);c.base.hline(0,426,y+10,0xf0ead8);
   for(let x=8;x<GW;x+=29){c.base.rect(x,y,3,13,0xa9aaa0);c.base.rect(x+6,y+1,8,8,0x25363a);c.base.rect(x+18,y+4,6,6,0x717a70);}
   laundry(c,8,85,y+6,[0xc85b54,0xe6dbaf,0x658eaa]);laundry(c,300,415,y+6,[0xc4b57d,0x809b80,0xd7d3b3]);
  }
  c.base.poly([0,0,67,0,67,153,0,153],0xd8d5c7);c.base.poly([360,0,427,0,427,153,360,153],0xd2cec0);
  for(let y=7;y<144;y+=20){c.base.rect(0,y,65,9,0x42504f);c.base.rect(362,y,65,9,0x42504f);c.base.hline(0,65,y+10,0xf1ecdd);c.base.hline(362,426,y+10,0xf1ecdd);}
  trees(c,[240],95);chainFence(c,67,117,360,153,0x7e8b80,.3);sign(c,80,140,'TENEMENT',0xe8d5aa,{bg:0x31545a});fans(c);
 },paintFloor(c){finish(c,'tenement',{base:0x3c7190,edge:0x797d76,key:0xb9584e,lines:0xe6e0bd,seed:18,crack:5,speckle:.35,patch:.2,art:p=>{
   p.poly([15,168,95,161,186,185,248,219,145,217,80,194],0xc14f50);p.poly([78,219,129,162,158,164,110,219],0xe2c478);
   p.ellipse(191,186,28,19,0xd5b57c);p.ellipse(192,184,20,14,0x325574);p.poly([173,190,204,177,212,194,190,204],0xddd6b8);
  }});}
};
const mosswood:CourtArt={seed:1919,crowdLook:'la',amb:daylight,
 paint(c){
  sky(c,[0x82b2cd,0xcbd7c6],0,154);building(c,350,23,77,127,0xae9c7a,{cols:6,rows:8,lit:0});
  trees(c,[17,79,142,220,305,398],114);
  c.base.rect(165,114,103,35,0xa78c68);c.base.poly([156,116,177,101,252,101,278,116],0x655c4a);
  c.base.rect(182,124,17,25,0x42514a);c.base.rect(225,124,22,14,0x5b7570);
  chainFence(c,0,114,GW,153,0x6e7f68,.25);stands(c,12,136,82);sign(c,167,139,'MOSSWOOD PARK',0xe4d29d,{bg:0x3c5e4c});fans(c);
 },paintFloor(c){finish(c,'mosswood',{base:0x2b75b9,edge:0x355c8b,key:0x23558c,lines:0xf1d162,seed:19,crack:0,speckle:.2,patch:0,art:p=>{
   p.poly([20,210,80,169,130,205,180,167,229,210],0x4c8fcb);p.line(20,210,80,169,0xe5c65c);p.line(80,169,130,205,0xe5c65c);
  }});}
};
const kalemegdan:CourtArt={seed:2020,crowdLook:'warsaw',amb:{...daylight,k:.75},
 paint(c){
  sky(c,[0x98afba,0xd6d1b8],0,154);trees(c,[45,144,275,383],102);
  // Sloping fortress masonry, terraces and the low pavilion of the red court.
  brick(c,238,51,189,102,0x8f8271);c.base.poly([226,62,427,24,427,52,238,76],0xa79a80);
  for(let y=60;y<147;y+=9)for(let x=240;x<425;x+=17)c.base.hline(x,x+12,y,0xa99a83);
  c.base.rect(153,111,85,36,0xb5a78b);c.base.poly([145,113,164,99,226,99,244,113],0x716a55);c.base.rect(172,121,25,26,0x4e5b54);
  for(let i=0;i<6;i++){c.base.rect(0,111+i*7,139,5,0x918b7a);c.base.hline(0,139,111+i*7,0xc6bba2);}
  chainFence(c,0,128,GW,153,0x778276,.25);sign(c,247,122,'KALEMEGDAN',0xe7d4ac,{bg:0x55483d});fans(c);
 },paintFloor(c){finish(c,'kalemegdan',{base:0xb7735b,edge:0x9b7f67,key:0xa36350,lines:0xe9dbc2,seed:20,crack:3,speckle:.4,patch:.3,sidewalk:0xa8987e});}
};
export const famous:Record<FamousId,CourtArt>={rucker,venice,pigalle,dyckman,tenement,mosswood,kalemegdan};
