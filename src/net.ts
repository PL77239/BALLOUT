import Peer, { type DataConnection } from 'peerjs';
import type { GameCfg } from './game';
import { ITEMS, SKIN_TONES, type Loadout } from './loadout';
import { COURTS } from './courts';
import type { Intent } from './input';
import { EDGES, NET_VERSION, RemoteInput } from './net_protocol';

type Wire={type:string;[key:string]:any};
export class NetSession {
  readonly input=new RemoteInput();
  latest: any=null;remoteReady=false;closed=false;rtt=0;
  onState:((s:any)=>void)|null=null;onEvent:((s:Wire)=>void)|null=null;onClose:((reason:string)=>void)|null=null;
  private last=performance.now();private pingAt=0;private seq=0;private pending:Intent|null=null;
  constructor(readonly peer:Peer,readonly conn:DataConnection,readonly role:'host'|'guest') {
    conn.on('data',raw=>{
      if(!raw||typeof raw!=='object')return;const d=raw as Wire;
      this.last=performance.now();
      if(d.type==='input'&&role==='host')this.input.receive(d.seq,d.value,this.last);
      if(d.type==='state'&&role==='guest'){this.latest=d.value;this.onState?.(d.value);}
      if(d.type==='event'&&role==='guest')this.onEvent?.(d);
      if(d.type==='ready')this.remoteReady=true;
      if(d.type==='ping')this.send({type:'pong',at:d.at});
      if(d.type==='pong'&&typeof d.at==='number')this.rtt=Math.round(performance.now()-d.at);
      if(d.type==='leave')this.fail('Opponent left the match.');
    });
    conn.on('close',()=>this.fail('Connection closed.'));
    conn.on('error',()=>this.fail('Connection failed.'));
  }
  send(d:Wire){if(!this.closed&&this.conn.open&&(this.conn.dataChannel?.bufferedAmount??0)<64000){this.conn.send(d);return true;}return false;}
  sendInput(value:Intent){if(this.pending)for(const k of EDGES)value[k] ||= this.pending[k];this.pending=this.send({type:'input',seq:this.seq++,value})?null:{...value};}
  tick(){const now=performance.now();if(now-this.last>10000)this.fail('Connection timed out.');if(now-this.pingAt>1000){this.pingAt=now;this.send({type:'ping',at:now});}}
  fail(reason:string){if(this.closed)return;const cb=this.onClose;this.close();cb?.(reason);}
  close(){if(this.closed)return;this.send({type:'leave'});this.closed=true;this.onState=null;this.onEvent=null;this.onClose=null;this.conn.close();this.peer.destroy();}
}
export let net:NetSession|null=null;
export function closeNet(){net?.close();net=null;}

/** User-invoked lobby only: no broker traffic until ONLINE is selected. */
export function openLobby(cfg:GameCfg,onStart:(cfg:GameCfg)=>void,onCancel:()=>void){
  closeNet();
  const cover=document.createElement('div');cover.id='online-lobby';
  cover.style.cssText='position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#090b12ed;color:#eee8d4;font:16px monospace';
  cover.innerHTML=`<div style="width:min(440px,90vw);padding:24px;border:2px solid #ff7a1a;background:#151622"><h2 style="color:#ffd24a">PRIVATE 1V1 / TEST</h2><p>Host chooses the court and score target. Both players use their own keyboard or controller.</p><p><button id="net-host">CREATE ROOM</button></p><p><input id="net-code" aria-label="Room code" maxlength="12" placeholder="ROOM CODE" autocomplete="off" spellcheck="false"><button id="net-join">JOIN</button></p><p id="net-status" role="status" style="min-height:65px;overflow-wrap:anywhere">Direct WebRTC connection. Some networks require a TURN relay.</p><button id="net-copy" hidden>COPY CODE</button> <button id="net-cancel">BACK</button></div>`;
  document.body.append(cover);
  cover.querySelectorAll('button,input').forEach(el=>(el as HTMLElement).style.cssText='font:inherit;padding:9px;margin:3px;background:#242636;color:#eee8d4;border:1px solid #777');
  const status=cover.querySelector('#net-status')!;
  const host=cover.querySelector<HTMLButtonElement>('#net-host')!,join=cover.querySelector<HTMLButtonElement>('#net-join')!,copy=cover.querySelector<HTMLButtonElement>('#net-copy')!,code=cover.querySelector<HTMLInputElement>('#net-code')!;
  let peer:Peer|null=null,conn:DataConnection|null=null,done=false,room='',timer=0;
  const set=(s:string)=>{status.textContent=s;};
  const busy=()=>{host.disabled=join.disabled=true;code.disabled=true;};
  const cleanup=(keep=false)=>{clearTimeout(timer);cover.remove();if(!keep){conn?.close();peer?.destroy();}};
  const cancel=()=>{if(done)return;done=true;cleanup();onCancel();};
  const fail=(s:string)=>{if(done)return;clearTimeout(timer);const oldConn=conn,oldPeer=peer;conn=null;peer=null;oldConn?.removeAllListeners();oldConn?.close();oldPeer?.destroy();host.disabled=join.disabled=code.disabled=false;set(s+' Retry, or use a different network.');};
  const start=(role:'host'|'guest',config:GameCfg)=>{
    if(done||!peer||!conn)return;done=true;net=new NetSession(peer,conn,role);cleanup(true);onStart({...config,mode:'2p',netRole:role});
  };
  const validLook=(l:unknown):l is Loadout=>{
    if(!l||typeof l!=='object')return false;
    const look=l as Record<string,unknown>;
    for(const [key,fallback] of Object.entries(cfg.p1)){
      const v=look[key];if(v===undefined && ['topGraphic','jerseyNumber','bottomDetail'].includes(key))continue;
      if(key==='name'){if(typeof v!=='string'||v.length>40)return false;continue;}
      if(typeof fallback==='number'){if(typeof v!=='number'||!Number.isInteger(v)||v<0||v>0xffffff||key==='skin'&&v>=SKIN_TONES.length)return false;}
      else if(typeof v!=='string'||!(v===fallback||key==='face'&&v==='grillz'||ITEMS.some(i=>(i.patch as any)[key]===v)))return false;
    }
    return true;
  };
  const bind=(c:DataConnection,role:'host'|'guest')=>{
    conn=c;timer=window.setTimeout(()=>fail('No connection after 25 seconds. The room may be offline or a TURN relay may be needed.'),25000);
    c.on('open',()=>{set('Connected. Preparing match…');if(role==='guest')c.send({type:'hello',version:NET_VERSION,look:cfg.p1});});
    c.on('data',raw=>{
      if(done||!raw||typeof raw!=='object')return;const d=raw as Wire;
      if(d.type==='reject'){fail(String(d.reason));return;}
      if(role==='host'&&d.type==='hello'){
        if(d.version!==NET_VERSION||!validLook(d.look)){c.send({type:'reject',reason:'Game versions differ. Reload both browsers.'});return;}
        const config={...cfg,mode:'2p' as const,p2:{...d.look,name:'GUEST'},p1:{...cfg.p1,name:'HOST'},seed:crypto.getRandomValues(new Uint32Array(1))[0]};
        c.send({type:'start',version:NET_VERSION,cfg:config});start('host',config);
      }else if(role==='guest'&&d.type==='start'&&d.version===NET_VERSION&&d.cfg&&validLook(d.cfg.p1)&&validLook(d.cfg.p2)&&COURTS.some(c=>c.id===d.cfg.court)&&Number.isInteger(d.cfg.target)&&d.cfg.target>=1&&d.cfg.target<=99){start('guest',d.cfg);}
    });
    c.on('error',()=>{if(!done)fail('Connection failed.');});
    c.on('close',()=>{if(!done)fail('Room closed.');});
  };
  const newPeer=(id?:string)=>{
    const env=import.meta.env;
    const options={debug:0 as const,...(env.VITE_TURN_URL?{config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:env.VITE_TURN_URL,username:env.VITE_TURN_USER||'',credential:env.VITE_TURN_CREDENTIAL||''}]}}:{}),...(env.VITE_PEER_HOST?{host:env.VITE_PEER_HOST,port:Number(env.VITE_PEER_PORT||443),path:env.VITE_PEER_PATH||'/',secure:env.VITE_PEER_SECURE!=='false'}:{})};
    peer=id?new Peer(id,options):new Peer(options);
    timer=window.setTimeout(()=>fail('Signalling server did not respond.'),20000);
    peer.on('error',e=>{if(!done)fail(`Unable to connect (${e.type}).`);});
    return peer;
  };
  host.onclick=()=>{
    busy();set('Creating room…');room=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%32]).join('');
    const p=newPeer('ballout-'+room);let accepted=false;
    p.on('open',()=>{clearTimeout(timer);set(`ROOM: ${room} — send this code to your friend. Keep this tab open.`);copy.hidden=false;});
    p.on('connection',c=>{if(accepted){c.on('open',()=>{c.send({type:'reject',reason:'Room is full.'});setTimeout(()=>c.close(),300);});return;}accepted=true;bind(c,'host');});
  };
  join.onclick=()=>{const value=code.value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(value)){set('Enter the six-character room code.');return;}busy();set('Connecting…');const p=newPeer();p.on('open',()=>{clearTimeout(timer);bind(p.connect('ballout-'+value,{reliable:true,serialization:'json'}),'guest');});};
  copy.onclick=()=>{navigator.clipboard?.writeText(room).then(()=>set(`Copied: ${room}`)).catch(()=>set(`Copy this code: ${room}`));};
  cover.querySelector<HTMLButtonElement>('#net-cancel')!.onclick=cancel;
  code.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')join.click();});
  code.focus();
  return cancel;
}
