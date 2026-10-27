const assert=require('node:assert/strict'),{load}=require('./headless-art.cjs');
const {resetAttributes,freshCareer,readCareer,awardMatch,upgrade,toggleBadge,badgeTier,careerStats,careerBonuses,careerLevel,overall,rankFloor}=load('career');
const c=freshCareer();assert.equal(overall(c),60);assert.equal(c.points,6);assert.equal(careerLevel(c),1);
assert(upgrade(c,'shooting'));assert.equal(c.attributes.shooting,61);assert.equal(c.points,5);
c.attributes.shooting=95;assert(!upgrade(c,'shooting'));c.points=0;assert(!upgrade(c,'speed'));
const earned=freshCareer();for(let i=0;i<4;i++)awardMatch(earned,true,'hooper',2,{greens:2,combos:2,dunks:1});
assert(careerLevel(earned)>1);assert(earned.points>6);assert.equal(earned.totals.games,4);assert.equal(badgeTier(earned,'sniper'),1);
assert(toggleBadge(earned,'sniper'));assert(careerBonuses(earned).green>0);assert(toggleBadge(earned,'finisher'));assert(toggleBadge(earned,'handles'));assert(!toggleBadge(earned,'tireless'),'only three badge slots');
earned.attributes.shooting=84;earned.totals.greens=60;assert.equal(badgeTier(earned,'sniper'),4);assert(careerBonuses(earned).green>.004);
assert(careerStats(earned).accuracy>careerStats(freshCareer()).accuracy);
const rank=freshCareer();rank.rank=3;rank.rankPoints=rankFloor(3)+1;
awardMatch(rank,false,'rookie',0,{});assert.equal(rank.rank,3,'first boundary loss has demotion protection');
awardMatch(rank,false,'rookie',0,{});assert(rank.rank<3,'second consecutive loss can demote');
const low=freshCareer(),high=freshCareer();const l=awardMatch(low,true,'rookie',0,{}),h=awardMatch(high,true,'legend',5,{});assert(h.rankDelta>l.rankDelta,'stronger rivals award more RP');
const old=readCareer(undefined);assert.deepEqual(old,freshCareer());const bad=readCareer({xp:NaN,rank:999,attributes:{speed:999},equipped:['fake','sniper','sniper']});assert.equal(bad.xp,0);assert.equal(bad.attributes.speed,95);assert.deepEqual(bad.equipped,['sniper']);
console.log('Career passed: OVR, attribute caps, XP, badge tiers/slots, rank gains and demotion, old-save defaults');

const respec=freshCareer();respec.xp=600;respec.rankPoints=150;respec.rank=1;respec.totals.greens=12;respec.equipped=['sniper'];upgrade(respec,'shooting');upgrade(respec,'speed');const before=JSON.stringify({xp:respec.xp,rank:respec.rank,rankPoints:respec.rankPoints,totals:respec.totals,equipped:respec.equipped});assert.equal(resetAttributes(respec),2);assert.equal(respec.points,6);assert(Object.values(respec.attributes).every(v=>v===60));assert.equal(resetAttributes(respec),0,'no duplicate refund');assert.equal(respec.points,6);assert.equal(JSON.stringify({xp:respec.xp,rank:respec.rank,rankPoints:respec.rankPoints,totals:respec.totals,equipped:respec.equipped}),before);assert.deepEqual(readCareer(respec),respec,'respec survives save migration');
