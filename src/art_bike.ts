function line(put:(x:number,y:number,c:number)=>void,x0:number,y0:number,x1:number,y1:number,c:number){
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;
  let e=dx+dy,x=x0,y=y0;
  for(;;){put(x,y,c);if(x===x1&&y===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x+=sx;}if(e2<=dx){e+=dx;y+=sy;}}
}

/** Side-view street bike: tires, rim, spokes, frame triangle, bars, seat, pedals. */
export function strokeBike(put:(x:number,y:number,c:number)=>void,ox:number,oy:number,color:number,accent:number,phase:number,kind:'bmx'|'courier'='bmx'){
  const tire=0x1c2028,rim=0xb4bbb8,hub=0xe4e7e2,spoke=0x7a827e,metal=0x2a3038;
  const wy=oy+19,r=kind==='bmx'?7:8,wx0=ox+11,wx1=ox+32;
  const wheel=(cx:number)=>{
    for(let a=0;a<56;a++){
      const t=a*Math.PI/28,cs=Math.cos(t),sn=Math.sin(t);
      put(cx+Math.round(cs*r),wy+Math.round(sn*r),tire);
      put(cx+Math.round(cs*(r-1)),wy+Math.round(sn*(r-1)),tire);
      if(a%2===0)put(cx+Math.round(cs*(r-2)),wy+Math.round(sn*(r-2)),rim);
    }
    for(let s=0;s<8;s++){
      const t=s*Math.PI/4+phase*.7;
      for(let k=1;k<r-2;k++)put(cx+Math.round(Math.cos(t)*k),wy+Math.round(Math.sin(t)*k),spoke);
    }
    put(cx,wy,hub);put(cx+1,wy,hub);put(cx,wy+1,hub);put(cx-1,wy,hub);
  };
  wheel(wx0);wheel(wx1);
  const seatX=ox+17,seatY=oy+6,bbX=ox+19,bbY=oy+16,headX=ox+28,headY=oy+7;
  line(put,wx0+2,wy-1,bbX,bbY,color);
  line(put,seatX,seatY,wx0+1,wy-2,color);
  line(put,seatX,seatY,bbX,bbY,color);
  line(put,seatX,seatY,headX,headY,accent);
  line(put,seatX,seatY+1,headX,headY+1,accent);
  line(put,bbX,bbY,headX,headY,accent);
  line(put,headX,headY,wx1-1,wy-2,metal);
  line(put,headX+1,headY,wx1,wy-1,metal);
  if(kind==='bmx'){
    line(put,headX,headY,headX,oy+1,metal);
    line(put,headX-5,oy+1,headX+6,oy+1,metal);
    line(put,headX-5,oy,headX+6,oy,metal);
    put(headX-5,oy,accent);put(headX+6,oy,accent);
    put(wx0-r-1,wy,metal);put(wx0-r-2,wy,metal);put(wx1+r+1,wy,metal);put(wx1+r+2,wy,metal);
  }else{
    line(put,headX,headY,headX+2,oy+3,metal);
    line(put,headX+2,oy+3,headX+7,oy+6,metal);
    line(put,headX+2,oy+3,headX-3,oy+5,metal);
    put(headX+7,oy+6,accent);put(headX-3,oy+5,accent);
  }
  line(put,seatX-3,seatY,seatX+4,seatY,metal);
  line(put,seatX-2,seatY-1,seatX+3,seatY-1,0x3a2c22);
  const pa=phase*Math.PI;
  put(bbX+Math.round(Math.cos(pa)*4),bbY+Math.round(Math.sin(pa)*3),metal);
  put(bbX-Math.round(Math.cos(pa)*4),bbY-Math.round(Math.sin(pa)*3),metal);
  put(bbX,bbY,0x4a5560);
}

/** Compact balcony / rack bike for distant scenery. */
export function strokeParkedBike(put:(x:number,y:number,c:number)=>void,ox:number,oy:number,color:number,accent:number,lean:number){
  const tire=0x222830,rim=0x8e9692,metal=0x2c333c;
  const wy=oy+11,r=4,wx0=ox+4+lean,wx1=ox+16+lean;
  const wheel=(cx:number)=>{
    for(let a=0;a<24;a++){
      const t=a*Math.PI/12;
      put(Math.round(cx+Math.cos(t)*r),Math.round(wy+Math.sin(t)*r),tire);
      if(a%2===0)put(Math.round(cx+Math.cos(t)*(r-1)),Math.round(wy+Math.sin(t)*(r-1)),rim);
    }
    put(Math.round(cx),wy,rim);
  };
  wheel(wx0);wheel(wx1);
  const sx=ox+8+lean,sy=oy+3,hx=ox+14+lean,hy=oy+4;
  line(put,sx,sy,wx0,wy-1,color);
  line(put,sx,sy,hx,hy,accent);
  line(put,sx,sy+1,ox+9+lean,wy-1,color);
  line(put,hx,hy,wx1,wy-1,metal);
  line(put,hx,hy,hx,oy+1,metal);
  line(put,hx-3,oy+1,hx+3,oy+1,metal);
  line(put,sx-2,sy,sx+2,sy,0x3a2c22);
}
