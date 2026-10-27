const assert=require('node:assert/strict'),{load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Puppet}=load('puppet'),{buildLoadout,STARTER_EQUIP}=load('loadout'),{shade}=load('pixel');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const color=0x375870,colors=new Set([color,shade(color,.87),shade(color,.78),shade(color,1.08),shade(color,.83)]);
for(const top of ['tee','bigTee','hoodie','flannel','longsleeve','puffer','jersey','tank'])for(const facing of [-1,1]){
 const p=new Puppet(scene,{...buildLoadout({...STARTER_EQUIP}),top,topColor:color,topTrim:color});p.t=0;
 const render=(shift)=>{p.pix.clear();p.brush.reset();p.torsoPiece(p.brush,[64,80],[64,58],p.loadout,0x8a5634,1,0,facing,facing,[[64+shift,99],[64+shift,103]]);return p.pix.px.slice();};
 const a=render(-10),b=render(10);
 for(let y=57;y<65;y++)for(let x=48;x<80;x++)assert.equal(a[y*p.pix.w+x],b[y*p.pix.w+x],`${top}: collar/shoulders remain pinned`);
 const center=arr=>{let sum=0,n=0;for(let y=78;y<92;y++)for(let x=43;x<85;x++){const v=arr[y*p.pix.w+x];if(v>>>24&&colors.has(((v&255)<<16)|(v&0xff00)|((v>>>16)&255))){sum+=x;n++;}}assert(n>0);return sum/n;};
 assert(center(b)-center(a)>.35,`${top}: lower cloth follows actual trouser direction in both facings`);
 assert([...a,...b].every(Number.isFinite));
}
console.log('Hem drape passed: eight cuts, both facings, pinned upper garment and lower cloth follows trouser geometry');
