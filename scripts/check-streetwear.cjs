const assert=require('node:assert/strict'),fs=require('node:fs'),{load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Puppet}=load('puppet'),{ITEMS,buildLoadout,STARTER_EQUIP,applyLookPatch}=load('loadout');
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const added=ITEMS.filter(i=>i.id.startsWith('sw.'));assert(added.length>150);assert.equal(new Set(ITEMS.map(i=>i.id)).size,ITEMS.length);
for(const item of added){const p=new Puppet(scene,buildLoadout({...STARTER_EQUIP,[item.slot]:item.id}));p.t=0;p.paint();assert(p.pix.px.some(v=>v>>>24),item.id);}
const clean=applyLookPatch({shoeModel:12,shoeStyle:'aj',watchStyle:'iced',chainSize:2,chainColor:0xffdd99,headBadge:3,bottomFit:'baggy'},{shoes:'low',wrist:'bands',chain:'none',head:'none',bottom:'jeans'});
for(const k of ['shoeModel','shoeStyle','watchStyle','chainSize','chainColor','headBadge','bottomFit'])assert.equal(clean[k],undefined,`${k} clears on item preview`);
const frames=[],shoes=[];const save=(name,p,list)=>list.push({name,w:p.pix.w,h:p.pix.h,bytes:Buffer.from(p.pix.px.buffer)});
for(let n=1;n<=12;n++){
 const l=buildLoadout({...STARTER_EQUIP,shoes:`sw.aj.${n}.0`});const p=new Puppet(scene,l);p.pix.clear();p.brush.reset();p.shoe(p.brush,{kn:[64,45],an:[64,90],ank:0,far:false},l,0x8a5634,1,2,1);save(`AIR JORDAN ${n}`,p,shoes);
}
assert.equal(new Set(shoes.map(f=>f.bytes.toString('base64'))).size,12,'all twelve Jordan models have different panel rendering');
const selections=[
 ['SYRUP HOOD',{top:'sw.hoodie.syrup.black',head:'sw.head.lakers.fullcap',shoes:'sw.aj.1.0',chain:'sw.chain.medallion.gold'}],
 ['SUPREME',{top:'sw.tee.supreme.cream',bottom:'sw.denim.baggy.wash',shoes:'sw.dunk.black',face:'sw.glasses.wraps.chrome'}],
 ['PALM ANGELS',{top:'sw.hoodie.palm.black',bottom:'sw.denim.wide.black',head:'sw.mask.black',shoes:'sw.supra.purple'}],
 ['OAKLEY TECH',{top:'sw.tee.oakley.black',head:'sw.head.oakley',face:'sw.glasses.wraps.black',bottom:'sw.camo.woodland'}],
 ['NBA LAKERS',{top:'sw.team.lakers',head:'sw.head.lakers.backcap',shoes:'sw.aj.8.0',chain:'sw.chain.tennis.silver'}],
 ['NFL RAIDERS',{top:'sw.team.raiders',head:'sw.head.raiders.beanie',bottom:'sw.pants.blackrip',shoes:'sw.af1.white'}],
 ['AMIRI',{top:'sw.tee.amiri.black',bottom:'sw.denim.stacked.stone',face:'sw.face.beardblunt',shoes:'sw.aj.11.1'}],
 ['CHROME',{top:'sw.hoodie.chrome.black',bottom:'sw.pants.chrome',chain:'sw.chain.cross.silver',wrist:'sw.watch.iced.steel'}],
 ['DESERT CARGO',{top:'sw.tee.nfl.cream',bottom:'sw.camo.wide.sand',head:'sw.mask.olive',shoes:'sw.supra.black'}],
 ['BULLS RETRO',{top:'sw.team.bulls',head:'sw.head.bulls.fullcap',shoes:'sw.aj.3.0',face:'sw.face.handlebar.black'}],
 ['ICE & WATCH',{top:'sw.tee.syrup.black',chain:'sw.chain.ice.silver',wrist:'sw.watch.iced.gold',face:'sw.glasses.aviator.chrome'}],
 ['BLUNT / KHAKI',{top:'sw.hoodie.supreme.black',bottom:'sw.cargo.baggy.sand',face:'sw.face.blunt',shoes:'sw.aj.12.0',chain:'sw.chain.dogtag.gold'}],
];
for(const [name,patch] of selections){const l=buildLoadout({...STARTER_EQUIP,...patch}),p=new Puppet(scene,l);p.t=0;p.cur.fHx=22;p.cur.fHy=85;p.cur.bHx=-16;p.cur.bHy=90;p.paint();save(name,p,frames);}
for(const [kind,list] of [['outfits',frames],['shoes',shoes]]){const out=`/tmp/ballout-streetwear-${kind}`;fs.mkdirSync(out,{recursive:true});list.forEach((f,i)=>fs.writeFileSync(`${out}/${i}.rgba`,f.bytes));fs.writeFileSync(out+'/manifest.json',JSON.stringify(list.map(({bytes,...f})=>f)));}
console.log(`Streetwear passed: ${added.length} new items render, twelve shoe panels differ and preview fields reset`);
