import type { Item, Loadout } from './loadout';

/** Item data is separate from the rig. Small original pixel motifs stand in
 * for detailed embroidery/lettering at the game's fixed camera resolution. */
export function streetwearItems():Item[]{
 const items:Item[]=[];
 const add=(slot:Item['slot'],id:string,name:string,patch:Partial<Loadout>,price=180)=>items.push({slot,id:`sw.${id}`,name,patch,price,region:'any'});
 const brands=[['syrup','AWFUL LOT OF COUGH SYRUP','syrup',0xe5d8b5],['supreme','SUPREME','boxmark',0xd43c46],['nba','NBA','league',0xe7bf58],['nfl','NFL','shield',0x9fc3d5],['palm','PALM ANGELS','palm',0xe7dec4],['oakley','OAKLEY','oval',0x9bbdc2],['amiri','AMIRI','amiri',0xe2d5b8],['chrome','CHROME HEARTS','crosspair',0xb8c2ca]] as const;
 for(const [id,name,texture,trim] of brands)for(const cut of ['hoodie','tee'] as const)for(const light of [false,true])
  add('top',`${cut}.${id}.${light?'cream':'black'}`,`${name} ${cut==='hoodie'?'HOOD':'TEE'} ${light?'CREAM':'BLK'}`,{top:cut,topColor:light?0xdcd5c1:0x20232c,topTrim:trim,topTexture:texture,topGraphic:'none'},cut==='hoodie'?290:165);
 const teams=[['lakers','LAKERS',0x62388d,0xe4bd43,24],['bulls','BULLS',0xc03c42,0xe5e2d5,23],['knicks','KNICKS',0x2c6099,0xe38e43,33],['nets','NETS',0x242830,0xd5d9d5,7],['celtics','CELTICS',0x347453,0xe2dcca,0],['warriors','WARRIORS',0x316caa,0xe8cb57,30],['raiders','RAIDERS',0x292d34,0xb8c2c7,4],['steelers','STEELERS',0x262b30,0xe2bd45,7],['cowboys','COWBOYS',0x344961,0xbac5ce,21],['eagles','EAGLES',0x305b59,0xdddccd,1]] as const;
 teams.forEach(([id,name,body,trim,num],i)=>{
  for(const head of ['fullcap','backcap','beanie'] as const)add('head',`head.${id}.${head}`,`${name} ${head==='backcap'?'BACKCAP':head.toUpperCase()}`,{head,headColor:body,headTrim:trim,headBadge:i+1},125);
  add('top',`team.${id}`,`${name} ${i<6?'NBA':'NFL'} HOOD`,{top:'hoodie',topColor:body,topTrim:trim,topGraphic:'number',jerseyNumber:num},275);
 });
 add('head','head.supreme.nba','SUPREME X NBA CAP',{head:'fullcap',headColor:0xb6323d,headTrim:0xe6dfcf,headBadge:11},185);
 add('head','head.oakley','OAKLEY TECH BEANIE',{head:'beanie',headColor:0x434b43,headTrim:0x929e8b,headBadge:12},145);
 for(const [id,c] of [['black',0x171b23],['olive',0x4b5743],['bone',0xc9c3ac]] as const)add('head',`mask.${id}`,`${id.toUpperCase()} SKIMASK`,{head:'skimask',headColor:c,headTrim:0x7c8987},160);
 const jordanColors=[[0xd4d4c8,0xb13c43,0x202633],[0x202834,0x708a9c,0xd7d7c8]];
 for(let model=1;model<=12;model++)jordanColors.forEach(([body,trim,sole],i)=>add('shoes',`aj.${model}.${i}`,`AIR JORDAN ${model} ${i?'NIGHT':'RETRO'}`,{shoes:'high',shoeStyle:'aj',shoeModel:model,shoeColor:body,shoeTrim:trim,shoeSole:sole},250+model*12));
 for(const [style,name] of [['dunk','DUNK'],['af1','AIR FORCE 1'],['supra','SUPRA SKYTOP']] as const)for(const [id,body,trim] of [['white',0xdfdfd4,0x8f9d9f],['black',0x242a33,0xdddccf],['purple',0x5d4580,0xb8b4c9]] as const)
  add('shoes',`${style}.${id}`,`${name} ${id.toUpperCase()}`,{shoes:style==='supra'?'high':'low',shoeStyle:style,shoeColor:body,shoeTrim:trim,shoeSole:0xb9b8a8},245);
 for(const [id,name,body,trim,detail] of [
  ['tr','TRUE RELIGION',0x45617d,0xd1be97,'stitched'],['amiri','AMIRI DISTRESSED',0x3b4457,0xb8ad97,'ripped'],['amiri-ice','AMIRI ICE RIP',0x7995a8,0xdad3bd,'ripped'],['chrome','CHROME HEARTS',0x30343e,0xc4cbd0,'crosses'],['supreme','SUPREME WORK',0xa78c65,0x5e655b,'stripe'],['palm','PALM ANGELS',0x363b42,0xe1d3b5,'stripe'],['khaki','BAGGY KHAKI',0xb0a080,0x7c725d,'stitched'],['olive','MILITARY CARGO',0x536348,0x9a9b71,'stitched'],['blackrip','BLACK DESTROYED',0x262c36,0x9a9b90,'ripped'],['stone','STONE WASH RIP',0x9ca9ab,0xdbd7bc,'ripped']
 ] as const)add('bottom',`pants.${id}`,name,{bottom:id==='khaki'||id==='olive'?'khakis':'jeans',bottomColor:body,bottomTrim:trim,bottomDetail:detail},245);
 for(const [id,body,trim] of [['woodland',0x526048,0xa3a178],['desert',0xb2a280,0x777a60],['urban',0x525e66,0xb8bdaf]] as const)add('bottom',`camo.${id}`,`${id.toUpperCase()} CAMO CARGO`,{bottom:'khakis',bottomColor:body,bottomTrim:trim,bottomTexture:'tile:camo'},260);
 for(const [kind,name] of [['gold','FRANCO'],['silver','FIGARO'],['cuban','HEAVY CUBAN'],['rope','DOUBLE ROPE'],['cross','ICED CROSS'],['ice','BAGUETTE ICE'],['medallion','MEDALLION'],['dogtag','DOG TAG'],['star','STAR PIECE'],['tennis','TENNIS CHAIN']] as const)
  for(const silver of [false,true])add('chain',`chain.${kind}.${silver?'silver':'gold'}`,`${name} ${silver?'SILVER':'GOLD'}`,{chain:kind,chainColor:silver?0xd1e1e7:0xe8bd59,chainSize:kind==='cuban'?2:1},290);
 for(const [style,name] of [['square','SQUARE DRESS'],['chrono','CHRONOGRAPH'],['iced','ICED WATCH'],['digital','DIGITAL SPORT']] as const)for(const gold of [false,true])
  add('wrist',`watch.${style}.${gold?'gold':'steel'}`,`${name} ${gold?'GOLD':'STEEL'}`,{wrist:'watch',wristColor:gold?0xd4ad59:0xb0bdc6,watchStyle:style},240);
 for(const [face,name] of [['fullbeard','FULL BEARD'],['chinstrap','CHIN STRAP'],['handlebar','HANDLEBAR'],['goatee','GOATEE'],['stache','THICK MUSTACHE']] as const)for(const brown of [false,true])add('face',`face.${face}.${brown?'brown':'black'}`,`${name} ${brown?'BROWN':'BLACK'}`,{face,faceColor:brown?0x64472e:0x272a2c},75);
 for(const [face,name] of [['wraps','OAKLEY SPORT WRAP'],['aviator','GOLD AVIATOR'],['rectglasses','RECTANGLE SPECS'],['shades','BLACKOUT SHADES']] as const)for(const light of [false,true])add('face',`glasses.${face}.${light?'chrome':'black'}`,`${name} ${light?'CHROME':'BLK'}`,{face,faceColor:light?0xaabcc5:0x222b34},140);
 add('face','face.blunt','LIT BLUNT',{face:'blunt',faceColor:0x71503a},95);
 add('face','face.beardblunt','BEARD + LIT BLUNT',{face:'beardblunt',faceColor:0x25282c},135);
 return items;
}
