// Export actual static map layers for visual QA (dynamic crowd, tram and net excluded).
const fs=require('node:fs');
const {load}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {warsaw}=load('art_cities');
const {Scene2D,applyLighting}=load('courtkit');
const c=new Scene2D(warsaw.seed);Object.assign(c.amb,warsaw.amb);
warsaw.paint(c);warsaw.paintFloor(c);applyLighting(c);
for(const key of ['sky','base','glow'])fs.writeFileSync(`/tmp/warsaw-${key}.rgba`,Buffer.from(c[key].px.buffer));
console.log('Warsaw static layers rendered: 427x240; '+c.spots.length+' spectator positions');
