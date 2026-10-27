export type DunkStyle=0|1|2|3|4|5;
export const DUNK_NAMES=['TWO HAND','REVERSE','WINDMILL','ONE HAND','DOUBLE CLUTCH','360 SLAM'] as const;
type Direction='up'|'down'|'back'|'forward';
/** Airborne direction changes only; holding a diagonal cannot complete a sequence. */
export class DunkControls {
 private path:Direction[]=[];
 private last:Direction|null=null;
 private changedAt=-Infinity;
 private combo:DunkStyle|null=null;
 reset(){this.path=[];this.last=null;this.changedAt=-Infinity;this.combo=null;}
 choose(mx:number,mz:number,facing:number,time:number,current:DunkStyle):DunkStyle{
  if(Math.max(Math.abs(mx),Math.abs(mz))<=.55){this.last=null;return this.combo??current;}
  const dir:Direction=Math.abs(mz)>Math.abs(mx)?(mz<0?'up':'down'):(mx*facing<0?'back':'forward');
  if(dir!==this.last && time-this.changedAt>=.045){
   this.path=[...this.path,dir].slice(-3);this.last=dir;this.changedAt=time;
   if(this.path.slice(-2).join('>')==='up>down')this.combo=4;
   if(this.path.join('>')==='back>up>forward')this.combo=5;
  }
  return this.combo??({up:2,down:0,back:1,forward:3} as const)[dir];
 }
}
