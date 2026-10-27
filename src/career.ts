import type { BossStats } from './bosses';
export const ATTRS=['shooting','finishing','handling','defense','speed','stamina'] as const;
export type Attribute=typeof ATTRS[number];
export const BADGES=[
 {id:'sniper',name:'GREEN MACHINE',attr:'shooting',event:'greens'},
 {id:'finisher',name:'RIM ARTIST',attr:'finishing',event:'dunks'},
 {id:'handles',name:'QUICK CHAIN',attr:'handling',event:'combos'},
 {id:'clamps',name:'PICK POCKET',attr:'defense',event:'steals'},
 {id:'tireless',name:'SECOND WIND',attr:'stamina',event:'games'},
] as const;
export type Badge=typeof BADGES[number]['id'];
export type Performance={greens:number;dunks:number;combos:number;steals:number;games:number};
export interface Career {xp:number;points:number;attributes:Record<Attribute,number>;equipped:Badge[];totals:Performance;rankPoints:number;rank:number;losses:number;}
export const TIERS=['LOCKED','BRONZE','SILVER','GOLD','HALL OF FAME'];
export const RANKS=['ROOKIE I','ROOKIE II','ROOKIE III','HOOPER I','HOOPER II','HOOPER III','BALLER I','BALLER II','BALLER III','ACE I','ACE II','ACE III','MASTER I','MASTER II','MASTER III','LEGEND I','LEGEND II','LEGEND III'];
export const RANK_COLORS=[0xaeb8c5,0x80bd91,0xd8bf70,0xdc8d69,0xb08bcd,0x8bd2dc];
export const rankFloor=(rank:number)=>rank*120+rank*rank*12;
export function rankFor(points:number){let rank=0;while(rank+1<RANKS.length&&rankFloor(rank+1)<=points)rank++;return rank;}
export const freshCareer=():Career=>({xp:0,points:6,attributes:{shooting:60,finishing:60,handling:60,defense:60,speed:60,stamina:60},equipped:[],totals:{greens:0,dunks:0,combos:0,steals:0,games:0},rankPoints:0,rank:0,losses:0});
const int=(v:unknown,fallback:number,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):fallback;
export function readCareer(raw:unknown):Career{
 const c=freshCareer();if(!raw||typeof raw!=='object')return c;
 const p=raw as Partial<Career>;c.xp=int(p.xp,0,11700);c.points=int(p.points,6,123);c.rank=int(p.rank,0,17);c.rankPoints=int(p.rankPoints,0,rankFloor(17)+500);c.losses=int(p.losses,0,2);
 for(const key of ATTRS)c.attributes[key]=Math.max(60,int(p.attributes?.[key],60,95));
 for(const key of Object.keys(c.totals) as (keyof Performance)[])c.totals[key]=int(p.totals?.[key],0,1000000);
 c.rank=Math.min(c.rank,rankFor(c.rankPoints));
 c.equipped=[...new Set(Array.isArray(p.equipped)?p.equipped:[])].filter(id=>BADGES.some(b=>b.id===id)).slice(0,3) as Badge[];return c;
}
export const careerLevel=(c:Career)=>1+Math.floor(c.xp/300);
export const overall=(c:Career)=>Math.round(ATTRS.reduce((n,k)=>n+c.attributes[k],0)/ATTRS.length);
export function badgeTier(c:Career,id:Badge){
 const b=BADGES.find(b=>b.id===id)!;let tier=0;
 for(let i=0;i<4;i++)if(c.attributes[b.attr]>=[60,68,76,84][i]&&c.totals[b.event]>=[3,12,30,60][i])tier=i+1;
 return tier;
}
export function upgrade(c:Career,key:Attribute){if(c.points<1||c.attributes[key]>=95)return false;c.attributes[key]++;c.points--;return true;}
export function toggleBadge(c:Career,id:Badge){
 if(c.equipped.includes(id)){c.equipped=c.equipped.filter(x=>x!==id);return true;}
 if(c.equipped.length>=3||badgeTier(c,id)===0)return false;c.equipped.push(id);return true;
}
export function careerStats(c:Career):BossStats{return {speed:54+(c.attributes.speed-60)*.5,accuracy:54+(c.attributes.shooting-60)*.5,stamina:56+(c.attributes.stamina-60)*.5,defense:52+(c.attributes.defense-60)*.5};}
export function careerBonuses(c:Career){
 const tier=(id:Badge)=>c.equipped.includes(id)?badgeTier(c,id):0;
 return {green:tier('sniper')*.0012,finish:(c.attributes.finishing-60)*.00015+tier('finisher')*.003,
  moveDiscount:(c.attributes.handling-60)/35+tier('handles')*.5,regen:tier('tireless')*.5,steal:tier('clamps')*.0075};
}
export function awardMatch(c:Career,win:boolean,level:'rookie'|'hooper'|'legend',rival:number,p:Partial<Performance>){
 const before=careerLevel(c),oldRank=c.rank;
 for(const key of ['greens','dunks','combos','steals'] as const)c.totals[key]+=int(p[key],0,200);
 c.totals.games++;
 const xp=50+(win?30:0)+Math.min(70,(['greens','dunks','combos','steals'] as const).reduce((n,k)=>n+int(p[k],0,200),0)*5);
 c.xp=Math.min(11700,c.xp+xp);c.points+=(careerLevel(c)-before)*3;
 const difficulty=['rookie','hooper','legend'].indexOf(level),gap=rival+difficulty*2-c.rank;
 const delta=win?Math.max(20,Math.min(140,60+gap*8)):-Math.max(15,Math.min(110,40-gap*6));
 const previous=c.rankPoints;c.losses=win?0:c.losses+1;c.rankPoints=Math.min(rankFloor(17)+500,Math.max(0,c.rankPoints+delta));
 let rank=rankFor(c.rankPoints);
 if(rank<c.rank&&c.losses<2){c.rankPoints=rankFloor(c.rank);rank=c.rank;}
 c.rank=rank;return {xp,rankDelta:c.rankPoints-previous,rank:c.rank,oldRank,level:careerLevel(c),overall:overall(c)};
}
