const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{load}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {famous,cage}=load('art_famous'),{Scene2D}=load('courtkit');
assert.equal(Object.keys(famous).length,7);
const fingerprints=new Set();
for(const [id,art] of Object.entries({...famous,brooklyn:cage})){
 const c=new Scene2D(art.seed);art.paint(c);art.paintFloor(c);
 assert(c.spots.length>=5,`${id}: populated background`);
 assert(c.base.px.some(v=>v>>>24),`${id}: foreground paints`);
 assert(new Set(c.base.px).size>20,`${id}: detailed drawing`);
 const hash=require('node:crypto').createHash('sha256').update(Buffer.from(c.base.px.buffer)).digest('hex');fingerprints.add(hash);
 assert(fs.existsSync(path.join(__dirname,'../public/audio/bgm/courts',id)),`${id}: soundtrack folder exists`);
}
assert.equal(fingerprints.size,8,'each landmark has its own artwork');
console.log('Famous courts passed: eight distinct scenes, populated backgrounds and BGM directories');
