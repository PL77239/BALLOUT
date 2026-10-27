// Compare the verified reference revision with current cloth using the same real rig and spring pipeline.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),{execFileSync}=require('node:child_process'),{load,noop}=require('./headless-art.cjs');
global.ImageData=class{constructor(w,h){this.data=new Uint8ClampedArray(w*h*4);}};
const {Hooper}=load('hooper'),{Puppet}=load('puppet'),{poseOf}=load('anim'),{buildLoadout,STARTER_EQUIP}=load('loadout');
const reference=execFileSync('git',['show',`${process.env.HEM_REFERENCE??'dd1def6e9d0b9c8872fb75e03eb41a2dae416982'}:src/puppet.ts`],{encoding:'utf8'});
const exp={};new Function('exports','require',ts.transpileModule(reference,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exp,id=>id==='phaser'?{default:{}}:id.endsWith('.json')?{default:JSON.parse(fs.readFileSync(path.join(__dirname,'../src',id),'utf8'))}:load(id.replace('./','')));
const scene={textures:{exists:()=>false,createCanvas:()=>({getContext:()=>({putImageData:noop}),refresh:noop})},add:{image:()=>({setOrigin(){return this;},setScale(){return this;}})}};
const tops=['tee','bigTee','hoodie'],out='/tmp/ballout-hem-drape';fs.mkdirSync(out,{recursive:true});
const hs=[exp.Puppet,Puppet].flatMap((Class,row)=>tops.map((top,i)=>{const l={...buildLoadout({...STARTER_EQUIP}),top,topColor:[0xe2dbbc,0x719687,0x628ac1][i],topTrim:0xeedaae,bottom:'jeans',bottomColor:0x38465b,head:'none',chain:'none',hair:'fade',topGraphic:'none',topTexture:undefined};const h=new Hooper(scene,row*3+i,l);h.puppet=new Class(scene,l);h.puppet.t=0;h.puppet.blinkAt=999;return h;}));
const g={opp:()=>({hasBall:false}),phase:'live',gt:0};
for(let frame=0;frame<60;frame++)for(let sub=0;sub<3;sub++)hs.forEach((h,i)=>{
 const t=(frame*3+sub)/60;h.tAlive=t;g.gt=t;h.hasBall=false;
 if(t<1.3){h.act='free';h.vx=310*Math.cos(t*3);h.h=0;h.vh=0;}
 else if(t<2.1){h.act='free';h.vx=110;const q=(t-1.3)/.8;h.h=Math.sin(q*Math.PI)*75;h.vh=Math.cos(q*Math.PI)*250;}
 else {h.act='fall';h.actDur=.9;h.actT=t-2.1;h.vx=0;h.h=0;h.vh=0;}
 const pose=poseOf(h,g,1/60);h.puppet.simulate(pose.rig,1/60,{f:pose.pinF,b:pose.pinB},{f:h.vx,h:h.vh});
 if(sub===2){h.puppet.paint();fs.writeFileSync(`${out}/${frame}-${i}.rgba`,Buffer.from(h.puppet.pix.px.buffer));}
});
fs.writeFileSync(out+'/manifest.json',JSON.stringify({tops,count:60,w:128,h:144}));console.log('Captured reference and current cloth: run, jump, ankle fall');
