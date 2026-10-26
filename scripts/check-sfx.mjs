import {readdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../public/audio/sfx/',import.meta.url);
const files=(await readdir(root)).filter(f=>f.endsWith('.wav'));assert.equal(files.length,9);
for(const file of files){
 const b=await readFile(new URL(file,root));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');
 assert.equal(b.readUInt16LE(20),1);assert.equal(b.readUInt16LE(22),1);assert.equal(b.readUInt32LE(24),22050);assert.equal(b.readUInt16LE(34),16);
 const duration=(b.length-44)/44100;assert(duration>.12 && duration<.6);
 let peak=0;for(let i=44;i+1<b.length;i+=2)peak=Math.max(peak,Math.abs(b.readInt16LE(i)));assert(peak>1000 && peak<32000,'signal present and not clipped');
}
const manifest=JSON.parse(await readFile(new URL('../public/audio/bgm/manifest.json',import.meta.url),'utf8'));
for(const court of ['chiraq','warsaw'])assert(Array.isArray(manifest.lists[court]));
console.log('Nine PCM Foley clips validated; Chiraq and Warsaw playlists are independent');
