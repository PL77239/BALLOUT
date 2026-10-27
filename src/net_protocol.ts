import { emptyIntent, type Intent } from './input';
export const NET_VERSION='ballout-private-7';
export const EDGES=['shootDown','shootUp','a','b','c','shove'] as const;
export function cleanIntent(value:unknown):Intent|null {
  if(!value || typeof value!=='object')return null;
  const v=value as Record<string,unknown>;
  if(typeof v.mx!=='number'||typeof v.mz!=='number'||!Number.isFinite(v.mx)||!Number.isFinite(v.mz))return null;
  const out=emptyIntent();out.mx=Math.max(-1,Math.min(1,v.mx));out.mz=Math.max(-1,Math.min(1,v.mz));
  for(const key of ['sprint','shootHeld','checkHeld','cHeld','aHeld',...EDGES] as const)out[key]=v[key]===true;
  return out;
}
export class RemoteInput {
  private value=emptyIntent();private seq=-1;private at=-Infinity;
  receive(seq:number,value:unknown,now:number){
    const next=cleanIntent(value);if(!next||!Number.isSafeInteger(seq)||seq<=this.seq)return false;
    for(const k of EDGES)next[k] ||= this.value[k];
    this.value=next;this.seq=seq;this.at=now;return true;
  }
  poll(now:number){if(now-this.at>300){this.value=emptyIntent();return emptyIntent();}const out={...this.value};for(const k of EDGES)this.value[k]=false;return out;}
}
