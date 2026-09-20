// Millimetres throughout. Shared by the WebGL renderer and geometry tests.
export const RELIEF_DEFAULTS = Object.freeze({markerHeight:.45,bevel:.07,subDepth:.5,handLift:.75,crystalDome:.6,crystal:true,lightAz:135,roughness:.22});
export function reliefSettings(raw={}){
  raw=raw&&typeof raw==='object'?raw:{};
  const out={...RELIEF_DEFAULTS};
  const limits={markerHeight:[.08,1],bevel:[.01,.15],subDepth:[.05,1],handLift:[.35,1.8],crystalDome:[.15,1.5],lightAz:[0,360],roughness:[.08,.7]};
  for(const [key,[lo,hi]] of Object.entries(limits)){const n=Number(raw[key]);if(Number.isFinite(n))out[key]=Math.min(hi,Math.max(lo,n));}
  if(typeof raw.crystal==='boolean')out.crystal=raw.crystal;
  // A raised marker must clear the underside of the hour hand.
  out.handLift=Math.max(out.handLift,out.markerHeight+.2);
  return out;
}
export function subdialLayout(state,radius){
  if(!state.sub?.on)return [];
  const raw=[state.sub,...(Array.isArray(state.sub.extra)?state.sub.extra:[])];
  const result=[];
  for(const item of raw.slice(0,4)){
    if(item.on===false)continue;
    const angle=Number(item.at)*Math.PI/6,r=Number(item.diameter)/2,dist=Number(item.dist);
    if(![angle,r,dist].every(Number.isFinite)||r<=0||dist<0||dist+r>=radius-.1)continue;
    const sub={...item,x:Math.sin(angle)*dist,y:Math.cos(angle)*dist,r};
    if(result.some(other=>Math.hypot(sub.x-other.x,sub.y-other.y)<sub.r+other.r+.1))continue;
    result.push(sub);
  }
  return result;
}
export function handAngles(time){return [(time.h%12)*30+time.m*.5,time.m*6+(time.s||0)*.1,(time.s||0)*6];}
export function markerAngles(state){
  const i=state.indices;if(!i?.on||!i.applied)return [];
  const sets={quarters:[12,3,6,9],even:[12,2,4,6,8,10],1212:[12,6],all:[12,1,2,3,4,5,6,7,8,9,10,11]};
  const occupied=state.numerals?.on?(sets[state.numerals.set]||sets.all):[];
  const count=Math.min(60,Math.max(4,Math.round(i.count||12)));
  return Array.from({length:count},(_,n)=>({n,angle:n*360/count})).filter(({n})=>!i.skipNumerals||!occupied.includes(n===0?12:n)).map(i=>i.angle);
}
