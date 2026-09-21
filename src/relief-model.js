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

/* A dial is made up: discs printed or turned on top of one another, and a
   chapter ring standing proud of a sunken centre is a step you can feel with
   a fingernail. The 2D renderer has described that as a list of concentric
   zones for a while; in 3D it was still one flat disc wearing a picture of
   them, so a step read as a painted ring — no silhouette at a grazing angle,
   nothing casting onto what is below it.
   A zone carries a lift in millimetres. Zero means flat, which is every
   design that existed before this and is why nothing moves unless you ask. */
export function zoneStack(state, radius){
  const zones = state?.sector?.on ? (Array.isArray(state.sector.zones) ? state.sector.zones : []) : [];
  const out = [];
  for(const z of zones.slice(0, 8)){
    if(!z || z.on === false) continue;
    const outer = Math.min(Number(z.outerD)/2, radius);
    const inner = Math.max(0, Number(z.innerD || 0)/2);
    const lift  = Number(z.lift);
    if(!Number.isFinite(outer) || outer <= 0) continue;
    if(!Number.isFinite(inner) || inner >= outer - .02) continue;
    if(!Number.isFinite(lift) || Math.abs(lift) < .005) continue;   // a flat zone stays paint
    out.push({outer, inner, lift: Math.min(1.2, Math.max(-1.2, lift))});
  }
  return out.sort((a, b) => b.outer - a.outer);        // outermost first
}

/* The radius, cut into bands that each sit at one height. An inner zone lies
   over its neighbour — the same rule the 2D renderer draws by — so where two
   overlap the innermost wins. Adjacent bands at the same height are merged:
   a wall between two faces that are level is a seam for nothing. */
export function zoneBands(state, radius, floor){
  const zones = zoneStack(state, radius);
  if(!zones.length) return [];
  const cuts = new Set([0, radius]);
  for(const z of zones){ cuts.add(z.outer); cuts.add(z.inner); }
  const edge = [...cuts].filter(v => v >= 0 && v <= radius).sort((a, b) => a - b);
  const bands = [];
  for(let i = 0; i < edge.length - 1; i++){
    const lo = edge[i], hi = edge[i + 1];
    if(hi - lo < .02) continue;
    const mid = (lo + hi)/2;
    let lift = 0;
    for(const z of zones) if(mid < z.outer && mid >= z.inner) lift = z.lift;
    const last = bands[bands.length - 1];
    if(last && Math.abs(last.lift - lift) < 1e-9) last.hi = hi;
    else bands.push({lo, hi, lift});
  }
  /* Each band is solid from its own face down to the common underside, so the
     wall between two of them is geometry rather than a drawn edge. */
  const base = Number.isFinite(floor) ? floor : .4;
  return bands.map(b => ({...b, depth: b.lift + base, z: -base}));
}
