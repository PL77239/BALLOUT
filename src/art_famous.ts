import { GW, PX, shade } from './pixel';
import { sky, tree, palm, chainFence, sign, bench, boombox, paintHoop, paintFloor, brick, lamp, type Scene2D, type FloorStyle } from './courtkit';
import { building, laundry, spots, BOOM_X, type CourtArt } from './court_common';

// Photo studies and dates are recorded in docs/famous-courts.md. These are
// original pixel drawings, with the same playable projection on every court.
type FamousId='rucker'|'venice'|'pigalle'|'dyckman'|'tenement'|'mosswood'|'kalemegdan';
const daylight={tint:[.72,.76,.81] as [number,number,number],k:.85,lit:[1.02,1.01,.96] as [number,number,number],steps:7};
const trees=(c:Scene2D,xs:number[],h=82,kind=0)=>xs.forEach((x,i)=>{
 const p=c.base,top=151-h-i%3*9;
 const palettes=[[0x254a3b,0x325840,0x3d6746,0x49734b,0x557b4e],[0x303e37,0x46594a,0x617150,0x7c8055,0x929161],[0x394934,0x4c613c,0x617c43,0x739252,0x8ba367],[0x324b3f,0x3c5c4a,0x547659,0x6c8d61,0x8a9e6f],[0x3d4439,0x555d43,0x6c7650,0x899064,0xa5a16e],[0x243f3d,0x365b4e,0x46715a,0x5b8669,0x729878]];
 const pal=palettes[kind%palettes.length],width=[1,.72,.88,1.38,.9,.68][kind%6],tall=[1,1.45,1.15,.75,1.18,1.65][kind%6];
 p.rect(x-2,top+25,5,151-top-25,0x594d3a);p.line(x,top+48,x-18,top+26,0x594d3a);p.line(x,top+44,x+21,top+21,0x594d3a);
 // Overlapping canopy masses retain a continuous silhouette at game scale.
 p.ellipse(x,top+21,39*width,27*tall,pal[0]);p.ellipse(x-27,top+25,27*width,22*tall,pal[1]);p.ellipse(x+27,top+17,31*width,25*tall,pal[2]);
 p.ellipse(x-8,top+4,28*width,19*tall,pal[3]);p.ellipse(x+19,top+5,24*width,17*tall,pal[4]);
 for(let n=0;n<45;n++){const dx=Math.floor(c.rnd(-39,39)),dy=Math.floor(c.rnd(-8,39));if(p.get(x+dx,top+dy)>=0)p.hline(x+dx,x+dx+2,top+dy,c.pick(pal));}
});
const stands=(c:Scene2D,x:number,y:number,w:number)=>{
 for(let i=0;i<4;i++){c.base.rect(x,y+i*5,w,3,0x9b9e99);c.base.hline(x,x+w,y+i*5,0xd2d1c4);}
 for(let dx=5;dx<w;dx+=24)c.base.vline(x+dx,y,y+21,0x494f4d);
};
// Additional depth from photo studies: village masonry, Harlem/Inwood
// apartment slabs, and Oakland's lower residential/park edge, behind trees.
function neighbourhood(c:Scene2D,id:string){
 if(id==='cage'){
  building(c,75,12,254,140,0x8d796c,{cols:19,rows:11,lit:.03,trim:0x4c5757});
  c.base.rect(80,113,247,39,0x9e9f8c);c.base.hline(80,326,115,0xc4c0a7);
  for(let x=88;x<325;x+=24)c.base.vline(x,117,150,0x808675);
 }else if(id==='rucker'){
  building(c,119,-12,193,164,0x8b7566,{cols:16,rows:14,lit:.03,trim:0x4d5858});
  for(const x of [135,186,237,288])c.base.rect(x,0,4,144,0x746756);
 }else if(id==='dyckman'){
  building(c,-8,-8,91,160,0x8f7662,{cols:7,rows:13,lit:.03});
  building(c,133,69,123,82,0x9f8067,{cols:10,rows:6,lit:.02});
  c.base.rect(79,126,61,25,0xa9b3a5);c.base.hline(80,140,125,0x627d7a);
 }else{
  c.base.rect(0,115,427,38,0x6e8163);
  for(const [x,y,w,color] of [[8,104,64,0xb4b29b],[93,99,58,0xb6ada2],[246,102,62,0x9aa79b]]){
   building(c,x,y,w,150-y,color,{cols:4,rows:3,lit:0});
   c.base.poly([x-4,y,x+w/2,y-16,x+w+4,y],0x626d65);
  }
  building(c,279,37,43,109,0x9baba8,{cols:3,rows:8,lit:0,trim:0x6c8388});
  for(let x=0;x<427;x+=17)c.base.ellipse(x,141+(x%5),15,12, x%2?0x405e48:0x526f50);
 }
}
function finish(c:Scene2D,id:string,st:FloorStyle){
 paintFloor(c,st);bench(c,13,150,26);bench(c,273,150,26);boombox(c,BOOM_X[id],159);paintHoop(c,{board:0xdfebe8,pole:0x38433f});
}
function fans(c:Scene2D,place='cage'){
 if(place==='cage'){sign(c,12,123,'W 4 ST',0xe1e5c5,{bg:0x2f594a});c.base.rect(12,139,8,14,0x3a4c43);}
 if(place==='rucker'){c.base.rect(299,99,35,22,0x2f3737);sign(c,301,103,'HOME',0xc3c7b3);sign(c,301,113,'00 00',0xe4bc64);}
 if(place==='venice'){c.base.rect(81,140,6,13,0x5c7977);c.base.ellipse(112,142,3,12,0xe3b579);c.base.vline(112,130,154,0x5f8791);}
 if(place==='pigalle'){for(let y=103;y<147;y+=5)c.base.hline(103,123,y,0x427d70);for(let x=106;x<124;x+=5)c.base.vline(x,102,149,0x427d70);c.base.rect(305,144,12,8,0xa97158);c.base.ellipse(311,141,8,6,0x547d5b);}
 if(place==='dyckman'){sign(c,3,115,'204 ST',0xe4dab7,{bg:0x385c4b});c.base.rect(135,145,12,7,0x716e59);}
 if(place==='tenement'){for(let x=91;x<321;x+=44){c.base.rect(x,77,12,6,0x946a50);c.base.ellipse(x+2,75,8,6,0x4f7654);c.base.ellipse(x+14,75,8,6,0x4f7654);c.base.rect(x+4,73,4,2,0x7a6a5a);c.base.rect(x+6,79,2,1,0x7a6a5a);}c.base.vline(316,1,31,0x565e5a);c.base.hline(304,328,9,0x565e5a);}
 if(place==='mosswood'){c.base.rect(113,127,7,23,0x6d6750);sign(c,102,127,'WEBSTER',0xd7c590,{bg:0x3e5b45});c.base.rect(249,144,6,9,0x59705b);}
 if(place==='kalemegdan'){c.base.vline(220,85,119,0x55564b);c.base.rect(353,142,20,9,0xada18a);c.base.hline(353,372,142,0xc3b798);}
 spots(c,[[25,152,'sit'],[61,153,'stand'],[110,153,'kid'],[175,152,'stand'],[232,153,'elder'],[285,152,'sit'],[335,153,'cheer']]);}

export const cage:CourtArt={seed:1101,crowdLook:'bk',amb:daylight,
 paint(c){
  sky(c,[0x84a4ba,0xb0c1c4,0xe4c7a0],0,154);neighbourhood(c,'cage');
  building(c,-8,5,93,146,0x957260,{cols:8,rows:10,lit:.1});building(c,300,0,130,152,0xa49b83,{cols:10,rows:11,lit:.12});
  trees(c,[100,165,248,325],105);
  // Tall enclosure, Greenwich Village facades, blue/orange half court.
  c.base.rect(0,146,GW,13,0x8d8a7d);chainFence(c,0,37,GW,156,0x626e68,.48);
  for(const x of [3,86,171,256,341,423]){c.base.rect(x,35,2,122,0x3f4c47);c.base.hline(0,426,36,0x657a6b);}
  sign(c,100,54,'WEST 4TH STREET',0xe8d7b4,{bg:0x304f45});
  sign(c,165,87,'THE CAGE',0xeee5d1,{bg:0x2d443e});
  lamp(c,45,154,65,{col:0xf2dba7,k:.25});fans(c,'cage');
 },paintFloor(c){finish(c,'brooklyn',{base:0x337f9c,edge:0x66868b,key:0xd88a50,lines:0xeee8cf,seed:31,crack:5,speckle:.35,patch:.3});}
};

const rucker:CourtArt={seed:1414,crowdLook:'harlem',amb:daylight,
 paint(c){
  sky(c,[0x9db7c2,0xd8d6c0],0,154);neighbourhood(c,'rucker');
  for(const [x,y,w] of [[5,12,53],[60,27,46],[311,8,68],[379,23,48]])building(c,x,y,w,150-y,0x9b9484,{cols:4,rows:10,lit:.08});
  // Elevated pedestrian bridge and tall mature trees around the refurbished court.
  c.base.rect(0,76,161,8,0x8b9391);c.base.hline(0,164,74,0xbcc3b4);
  for(let x=8;x<160;x+=9)c.base.vline(x,67,76,0x687975);
  c.base.rect(110,83,6,62,0x858c85);trees(c,[53,146,254,343],88,1);
  stands(c,15,129,110);stands(c,245,129,105);chainFence(c,0,101,GW,151,0x5c6d63,.28);
  c.base.rect(130,114,109,26,0x202b2d);sign(c,139,120,'GREG MARIUS',0xded6b9);sign(c,147,131,'RUCKER PARK',0xddc38c);
  fans(c,'rucker');
 },paintFloor(c){finish(c,'rucker',{base:0xc4b48c,edge:0x9d987f,key:0x343c3a,lines:0xf2ead2,seed:14,crack:0,speckle:.16,patch:0,art:p=>{
   for(let x=24;x<240;x+=37){p.ellipse(x,185,22,15,0x3c423f);p.ellipse(x+4,184,15,10,0xc4b48c);p.line(x-18,205,x+24,166,0x3c423f);}
  }});}
};
const venice:CourtArt={seed:1515,crowdLook:'la',amb:{...daylight,k:.74,lit:[1.08,.99,.88]},
 paint(c){
  sky(c,[0x677eaf,0xc2a9bd,0xf1b49f,0xf6d4a5],0,140);
  c.base.rect(0,115,GW,18,0x769ea8);for(let y=119;y<134;y+=4)c.base.hline(0,426,y,0xabc3bf);
  c.base.rect(0,134,GW,18,0xd9bf92);c.base.rect(0,148,GW,11,0xaaa08c);
  for(const [x,h] of [[28,108],[94,88],[155,105],[272,96],[329,112],[410,83]]){c.base.rect(x-1,150-h,3,h,0x76695c);for(let y=150-h;y<150;y+=4)c.base.hline(x-1,x+1,y,0x5e594e);}
  // Public beach buildings and another court beyond the main playing area.
  c.base.rect(5,135,69,15,0xddd6ba);sign(c,10,139,'VENICE BEACH',0x3c6b76);
  c.base.rect(245,120,3,32,0x5d6862);c.base.rect(230,118,24,12,0xbcc8be);c.base.rect(238,122,9,6,0x6e8b8a);
  for(let x=185;x<360;x+=26){c.base.rect(x,148,14,3,0x6b7973);c.base.vline(x+2,150,154,0x5a645f);}
  fans(c,'venice');
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
  // Parisian wall fixtures and recessed windows remain within the side facades.
  for(const x of [18,51,345,381]){c.base.rect(x,46,13,22,0x48575c);c.base.rect(x+2,48,9,18,0x759598);c.base.vline(x+6,48,65,0xb1b8a6);c.base.hline(x, x+13,68,0x857b69);}
  for(const x of [12,57,346,390]){c.base.rect(x,99,20,3,0x766857);c.base.rect(x+3,95,14,4,0xa67059);c.base.ellipse(x+10,94,8,4,0x567561);}
  c.base.vline(87,29,149,0x787f76);c.base.vline(339,24,150,0x9d9985);
  sign(c,12,120,'RUE DUPERRE',0xdddcc2,{bg:0x3f656d});
  c.base.rect(345,132,22,19,0x526166);c.base.rect(347,134,18,16,0x69777c);c.base.rect(362,140,2,2,0xc9b993);
  c.base.vline(151,130,156,0x3b777f);sign(c,173,79,'PIGALLE',0x4e6471,{bg:0xd9d1bc});fans(c,'pigalle');
 },paintFloor(c){finish(c,'pigalle',{base:0x6db3ca,edge:0x4e8198,key:0xe3bd70,lines:0xf4e7cf,seed:16,crack:0,patch:0,speckle:.14,art:p=>{
   p.poly([10,161,117,161,167,219,10,219],0xd382ac);p.poly([117,161,188,161,238,219,167,219],0xe6c578);
   p.poly([188,161,245,161,295,219,238,219],0x6898b7);p.rect(295,170,116,36,0xc5d1bd);
  }});}
};
const dyckman:CourtArt={seed:1717,crowdLook:'harlem',amb:daylight,
 paint(c){
  sky(c,[0x7eafcc,0xc7d4ca],0,154);neighbourhood(c,'dyckman');building(c,343,-8,90,161,0x996c51,{cols:7,rows:12,lit:.08});
  building(c,0,92,95,53,0xd0c9ae,{cols:7,rows:3,lit:.05});trees(c,[28,122,218,295],88,2);
  stands(c,8,125,155);stands(c,235,125,100);chainFence(c,0,92,GW,153,0x56685b,.3);
  c.base.rect(164,115,94,30,0x242c2c);sign(c,170,120,'DYCKMAN',0xe15e51,{scale:1});sign(c,170,132,'NAGLE AVE',0xe1d5b5);
  c.base.rect(303,94,29,22,0x2b5545);sign(c,305,97,'00 00',0xd4c875);sign(c,306,107,'HOME',0xe1dbc6);
  fans(c,'dyckman');
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
  trees(c,[240],95,5);chainFence(c,67,117,360,153,0x7e8b80,.3);sign(c,80,140,'TENEMENT',0xe8d5aa,{bg:0x31545a});fans(c,'tenement');
 },paintFloor(c){finish(c,'tenement',{base:0x3c7190,edge:0x797d76,key:0xb9584e,lines:0xe6e0bd,seed:18,crack:5,speckle:.35,patch:.2,art:p=>{
   p.poly([15,168,95,161,186,185,248,219,145,217,80,194],0xc14f50);p.poly([78,219,129,162,158,164,110,219],0xe2c478);
   p.ellipse(191,186,28,19,0xd5b57c);p.ellipse(192,184,20,14,0x325574);p.poly([173,190,204,177,212,194,190,204],0xddd6b8);
  }});}
};
const mosswood:CourtArt={seed:1919,crowdLook:'la',amb:daylight,
 paint(c){
  sky(c,[0x82b2cd,0xcbd7c6],0,154);neighbourhood(c,'mosswood');building(c,350,23,77,127,0xae9c7a,{cols:6,rows:8,lit:0});
  trees(c,[17,79,142,220,305,398],114,3);
  c.base.rect(165,114,103,35,0xa78c68);c.base.poly([156,116,177,101,252,101,278,116],0x655c4a);
  c.base.rect(182,124,17,25,0x42514a);c.base.rect(225,124,22,14,0x5b7570);
  chainFence(c,0,114,GW,153,0x6e7f68,.25);stands(c,12,136,82);sign(c,167,139,'MOSSWOOD PARK',0xe4d29d,{bg:0x3c5e4c});fans(c,'mosswood');
 },paintFloor(c){finish(c,'mosswood',{base:0x2b75b9,edge:0x355c8b,key:0x23558c,lines:0xf1d162,seed:19,crack:0,speckle:.2,patch:0,art:p=>{
   p.poly([20,210,80,169,130,205,180,167,229,210],0x4c8fcb);p.line(20,210,80,169,0xe5c65c);p.line(80,169,130,205,0xe5c65c);
  }});}
};
const kalemegdan:CourtArt={seed:2020,crowdLook:'warsaw',amb:{...daylight,k:.75},
 paint(c){
  sky(c,[0x98afba,0xd6d1b8],0,154);trees(c,[45,144,275,383],102,4);
  // Sloping fortress masonry, terraces and the low pavilion of the red court.
  brick(c,238,51,189,102,0x8f8271);c.base.poly([226,62,427,24,427,52,238,76],0xa79a80);
  for(let y=60;y<147;y+=9)for(let x=240;x<425;x+=17)c.base.hline(x,x+12,y,0xa99a83);
  c.base.rect(153,111,85,36,0xb5a78b);c.base.poly([145,113,164,99,226,99,244,113],0x716a55);c.base.rect(172,121,25,26,0x4e5b54);
  for(let i=0;i<6;i++){c.base.rect(0,111+i*7,139,5,0x918b7a);c.base.hline(0,139,111+i*7,0xc6bba2);}
  chainFence(c,0,128,GW,153,0x778276,.25);sign(c,247,122,'KALEMEGDAN',0xe7d4ac,{bg:0x55483d});fans(c,'kalemegdan');
 },paintFloor(c){finish(c,'kalemegdan',{base:0xb7735b,edge:0x9b7f67,key:0xa36350,lines:0xe9dbc2,seed:20,crack:3,speckle:.4,patch:.3,sidewalk:0xa8987e});}
};
// Quiet pixel-snapped scenery. Motion stays behind the court and out of the
// gameplay lane; the rest of the maps retain their existing bespoke live layers.
const places={cage,rucker,venice,pigalle,dyckman,tenement,mosswood,kalemegdan};
for(const [id,art] of Object.entries(places))art.live=(L)=>{
 const g=L.gfx(-994);
 L.tick(t=>{
  g.clear();
  const dot=(x:number,y:number,c:number)=>{g.fillStyle(c,1);g.fillRect(Math.round(x)*PX,Math.round(y)*PX,PX,PX);};
  if(id==='venice'){
   for(const [x,h] of [[28,108],[94,88],[155,105],[272,96],[329,112],[410,83]]){
    const cy=150-h,sway=Math.sin(t*.8+x)*2;
    for(let f=0;f<9;f++){
     const a=f*Math.PI*2/9;
     for(let k=0;k<25;k++){
      const q=k/24,xx=x+Math.cos(a)*q*25+sway*q*q,yy=cy+Math.sin(a)*q*7+q*q*10;
      dot(xx,yy,f%2?0x3a5b50:0x54705b);if(k<18)dot(xx,yy+1,0x3a5b50);
     }
    }
   }
   for(let i=0;i<14;i++)dot((i*37+t*5)%427,121+i%3*3,0xc4d4c8);
  }else if(id==='tenement'||id==='pigalle'){
   const x0=id==='tenement'?76:12,y0=id==='tenement'?58:75;
   const count=id==='tenement'?5:4,spacing=id==='tenement'?17:18;
   for(let i=0;i<count;i++){
    const x=x0+i*spacing,dy=Math.round(Math.sin(t*1.3+i)*1.5);
    g.fillStyle(0x6b776d,1);g.fillRect(x*PX,y0*PX,12*PX,PX);
    g.fillStyle([0xb36665,0xc9bc9e,0x668f9c,0x7b8e69,0xc49d62][i],1);g.fillRect((x+2+dy)*PX,(y0+1)*PX,7*PX,(6+i%3)*PX);
   }
  }else if(id==='kalemegdan'){
   for(let x=0;x<17;x++)for(let y=0;y<10;y++)dot(221+x,85+y+Math.sin(t*3-x*.25),y<3?0xab5550:y<6?0x64778d:0xe3dcc7);
  }else{
   for(let i=0;i<9;i++){
    const x=(i*53+t*(3+i%3))%427,y=75+(i*17+t*7)%65;
    dot(x+Math.sin(t*2+i)*3,y,id==='mosswood'?0x9b9564:id==='rucker'?0xb5a373:0x879867);
   }
   if(id==='rucker'||id==='dyckman')for(let i=0;i<7;i++){
    const x=145+i*13,y=104+Math.sin(t*2+i)*1.5;
    for(let k=0;k<5;k++)for(let j=0;j<6-k;j++)dot(x+j,y+k,i%2?0xbd9b63:0x597966);
   }
  }
 });
};
export const famous:Record<FamousId,CourtArt>={rucker,venice,pigalle,dyckman,tenement,mosswood,kalemegdan};
