const fs=require('node:fs'),assert=require('node:assert/strict');
const {load}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {marseille}=load('art_marseille'),{Scene2D,applyLighting}=load('courtkit');
const c=new Scene2D(marseille.seed);Object.assign(c.amb,marseille.amb);
marseille.paint(c);marseille.paintFloor(c);applyLighting(c);
assert(c.spots.length>=6,'spectator locations');
for(const key of ['sky','base','glow']){assert(c[key].px.some(v=>v>>>24));fs.writeFileSync(`/tmp/marseille-${key}.rgba`,Buffer.from(c[key].px.buffer));}
console.log('Marseille actual static layers rendered; 6 spectator positions');
