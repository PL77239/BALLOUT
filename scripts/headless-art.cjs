// Headless logic checks; Phaser rendering is deliberately replaced with a minimal scene.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const cache = {};
const noop = () => {};
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const sfx = new Proxy({}, {get: () => noop});
function load(name) {
  if (cache[name]) return cache[name];
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src',name+'.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exp = {}; cache[name] = exp;
  const req = id => {
    if (id === 'phaser') return {default: {Scene: class {}}};
    if (id === './sfx') return {sfx};
    const n=id.replace('./','');
    if (['tuning','hooper','game','ai','loadout','pixel','puppet','wardrobe','anim','courtkit','court_common','font','art_cities'].includes(n)) return load(n);
    if (n==='input') return {emptyIntent:()=>({mx:0,mz:0,sprint:false}),MenuNav:class{}};
    if (n==='bosses') return {PLAYER_STATS:{speed:50,accuracy:50,stamina:50,defense:50}};
    if (n==='music') return {music:{}};
    return {};
  };
  new Function('exports','require',code)(exp,req); return exp;
}

module.exports = {load, noop};
