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
  const i=state.indices;
  /* Hours set one by one: a raised marker at every gem hour and every
     applied index hour, none under a calendar window. A gem stands as a
     metal boss of its footprint here; the stone itself is drawn in 2D. */
  const m=state.markers;
  if(m?.perHour&&Array.isArray(m.at)&&Math.round(i?.count||12)===12){
    const cov=new Set();
    if(state.day?.on)cov.add(12);
    if(state.date?.on&&Number.isInteger(state.date.at))cov.add(state.date.at===0?12:state.date.at);
    return m.at.map((k,n)=>({k,n})).filter(({k,n})=>!cov.has(n||12)&&(k==='gem'||k==='gemAlt'||((k==='index'||k==='indexAlt')&&i?.on&&i.applied))).map(({n})=>n*30);
  }
  if(!i?.on||!i.applied)return [];
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

/* ------------------------------------------------------------------
   The NOREL B6098G-A1 in 3D. Two sources, kept apart on purpose:

   R1 geometry — Blue Creations' STEP of the case assembly (R1), tessellated
   by tools/norel-case-glb.py into app/norel-case-r1.glb: the case middle
   with its lugs, the crown and the case back, exactly as drawn. The frame
   is the 3D view's: millimetres, +X toward 3 (the crown), +Y toward 12, +Z
   toward the viewer, the origin on the dial top at its centre. The lug and
   case-wall numbers below were measured off that STEP in the same frame.

   R4 dimensions — the 3 Nov assembly drawing, the case as approved: bezel
   Ø41.00 flush with the case, its ring Ø34.20 inside, glass Ø33.50 x 1.50,
   opening Ø31.40, dial Ø32.50, 11.20 over the crystal, and a Ø7.00 cyclops
   cut to 5.50, 1.10 high, centred 10.00 mm out at 3. The bezel, crystal and
   cyclops are built here from those numbers (72 flutes, as the drawn bezel),
   because the STEP still carries the R1 parts for them.
   ------------------------------------------------------------------ */
export const NOREL_R1 = Object.freeze({
  caseTop:.80,                 // the case middle's top face (STEP z 0), which the bezel sits on
  backBottom:-7.10,            // the case back's lowest point
  lugInner:10.50,              // half the 21.00 between the lugs
  caseWall:20.00,              // the case middle's wall between the lugs, at 12 and 6
  /* the top of a lug, [y, z], from the case top to its tip (STEP section at x 11.5) */
  lugTop:Object.freeze([[16.5,.77],[17,.61],[18.5,-.04],[19.5,-.57],[21,-1.82],[21.5,-2.38],[22,-2.96],[22.5,-3.61],[23,-4.62],[23.5,-5.74]]),
  springBar:Object.freeze([21.5,-5.2])
});
const lerpTable = (t, x) => { if(x <= t[0][0]) return t[0][1]; for(let i = 1; i < t.length; i++) if(x <= t[i][0]){ const [x0, y0] = t[i-1], [x1, y1] = t[i]; return y0 + (y1 - y0)*(x - x0)/(x1 - x0); } return t[t.length-1][1]; };
export const lugTopAt = y => lerpTable(NOREL_R1.lugTop, y);

/* How the head stacks up, from the case spec (R4 unless the spec says
   otherwise): the crystal's top is the height over the case back. */
export function norelStack(K = {}){
  const height = +K.height || 11.20, glassT = +K.glassT || 1.50;
  const glassTop = NOREL_R1.backBottom + height, glassBottom = glassTop - glassT;
  return {caseTop:NOREL_R1.caseTop, glassTop, glassBottom, bezelTop:glassTop - .10,
    bezelOD:+K.bezelOD || 41.00, bezelID:+K.bezelID || 34.20, glassD:+K.glassD || 33.50,
    opening:+K.opening || 31.40, land:Number.isFinite(+K.land) ? +K.land : .50,
    flutes:Math.round(+K.flutes || 72), fluteDepth:+K.fluteDepth || .41};
}
/* The bezel in section, [r, z], as one closed loop from the lip over the
   dial round to its foot on the case. The fluted slope runs from point
   `slope` to `slope + 1`; the gem-set bezel is rounded over instead. */
export function bezelProfile(K = {}, gem = false){
  const s = norelStack(K), ri = s.bezelID/2, ro = s.bezelOD/2, rg = s.glassD/2, rl = s.opening/2;
  const top = s.bezelTop, land = Math.min(s.land, (ro - ri)/3), c = .08;
  const pts = [[rl, .12], [rg, s.glassBottom], [ri, s.glassBottom], [ri, top - c], [ri + c, top]];
  let slope = -1;
  if(gem){
    /* a flatter rounded ring that seats a row of stones */
    const w = ro - ri;
    for(let k = 0; k <= 8; k++){ const t = k/8; pts.push([ri + c + (w - c - .25)*t, top - .35*t*t - .45*t]); }
    pts.push([ro, top - 1.1]);
  }else{
    pts.push([ri + land, top]); slope = pts.length - 1;
    pts.push([ro, top - (ro - ri - land)]);           // 45°, as the drawn bezel
  }
  pts.push([ro, s.caseTop + .18], [ro - .18, s.caseTop], [rl + .5, s.caseTop], [rl + .2, .12]);
  return {pts, slope, stack:s};
}
/* The ring's top at radius r on a gem-set bezel, for seating the stones. */
export function gemBezelTop(K, r){
  const {pts} = bezelProfile(K, true);
  let best = pts[4][1];
  for(let i = 4; i < pts.length - 1; i++){ const [r0, z0] = pts[i], [r1, z1] = pts[i+1]; if(r >= r0 && r <= r1 && r1 > r0) best = z0 + (z1 - z0)*(r - r0)/(r1 - r0); }
  return best;
}

/* ---- the bracelet ----
   A President-style bracelet hangs from the lugs and curves down and away
   as it would round a wrist or a display: it leaves the end link at a
   shallow angle, turns on an arc of radius R, and runs back level under the
   watch to the clasp at the bottom. One side, +Y, in the YZ plane; the
   other is its mirror. The path is the links' underside: their tops are
   `thick` further out along the normal (-sin θ, cos θ). */
export function braceletPath({y0 = 21.9, z0 = -6.6, theta0 = -25*Math.PI/180, R = 20} = {}){
  const cy = y0 + R*Math.sin(theta0), cz = z0 - R*Math.cos(theta0);   // the arc's centre, right of the tangent
  const arc = R*(theta0 + Math.PI), run = Math.max(0, cy);
  const at = s => {
    if(s <= arc){ const th = theta0 - s/R; return {y:cy - R*Math.sin(th), z:cz + R*Math.cos(th), theta:th}; }
    return {y:cy - (s - arc), z:cz - R, theta:-Math.PI};
  };
  return {length:arc + run, at, bottom:cz - R};
}
/* What the bracelet is built to. From Blue Creations' variant sheet for the
   B6098G-A1 (R3, 2026-10-29) where it says so; the rest measured off the
   two renders they supplied, scaled by the 21.0 band at the lugs: the V1
   watch on that sheet (60.2 px/mm at 150 dpi; its Ø41.0 bezel gives 59.0,
   so the scale holds to 2%) and app/case-norel-r4-real.jpg (21.58 px/mm,
   from the Ø31.40 opening; the band there measures 20.86 at the lugs).
     sheet  BAND 21.0 x 16.0 MM: 21.0 at the lugs, 16.0 at the clasp
     sheet  CASE SIZE 41.0 x 48.0 MM: 48.0 lug to lug
     sheet  outer links "Vertical Brushed": the grain runs along the bracelet
     sheet  centre links "Shiny": polished
     sheet  concealed clasp, its cover drawn alone: vertical flutes, the NOREL
            shield over the NOREL wordmark, and "9.0MM" — whose extension
            lines stop on the outside of the N and the L, so 9.0 is the
            wordmark's width, not the cover's
     render centre link 9.09 wide on the sheet, 9.13 on the photograph:
            0.433 of the band
     render pitch at the lugs 4.65 on the sheet (the links further down are
            foreshortened as the bracelet curves away), 5.15 on the
            photograph: 4.90, between the two
     render joint: the dark line between rows is 6-7% of the pitch, the
            shaded valley about 12%: a 0.35 gap between rounded tops
     render taper: 0.13 (photograph) to 0.145 (sheet) mm narrower per mm
            along the bracelet near the lugs: 0.14 until it reaches 16.0,
            then straight to the clasp
     render clasp cover: 33 flutes across; 1.14 as long as wide at the
            arched end's middle, 1.09 at its sides; the shield 0.41 and the
            wordmark's cap height 0.14 of the wordmark's width, the shield's
            middle 0.25 and the wordmark's baseline 0.45 of the cover's
            length from the arched end
   Not on either source, so still estimates: the links' thickness (2.70)
   and the 0.24 gap between a centre link and its outers. The cover is
   drawn about 18.3 wide against its 9.0 wordmark, wider than the 16.0
   band it closes; here it takes the band's 16.0 and keeps the 9.0
   wordmark, the two dimensioned numbers, and the drawing's proportions
   for the rest. */
export const BRACELET = Object.freeze({
  lugWidth:21.0, clasp:16.0, lugToLug:48.0,                       // sheet
  centreShare:.433, pitch:4.90, gap:.35, taper:.14,                  // measured
  thick:2.70, centreGap:.24,                                         // estimated
  cover:Object.freeze({width:16.0, wordmark:9.0, longMid:1.14, longSide:1.09, flutes:33,
    shieldH:.41*9.0, capH:.14*9.0, shieldAt:.25, baseAt:.45, thick:1.3})
});
/* The rows of links along that path, from `start` to `end` (arc length):
   as many whole rows as fit at about `pitch`, stretched a little so they
   fill it exactly, narrowing by `taper` mm per mm from the lug width to the
   clasp's and no further. */
export function braceletRows(path, {pitch = BRACELET.pitch, gap = BRACELET.gap, start = 0, end, w0 = BRACELET.lugWidth, w1 = BRACELET.clasp, taper = BRACELET.taper} = {}){
  const stop = Number.isFinite(end) ? Math.min(end, path.length) : path.length;
  const len = stop - start, n = Math.max(1, Math.round(len/pitch)), p = len/n, rows = [];
  for(let k = 0; k < n; k++){
    const s = start + (k + .5)*p, q = path.at(s);
    rows.push({s, ...q, length:p - gap, width:Math.max(w1, w0 - taper*(s - start))});
  }
  return rows;
}
/* Where along the bottom run the clasp sits: centred `toward` 6 of the
   watch's axis (y < 0), its cover `length` long. Each side's rows stop at
   its end. */
export function claspSpan(path, length, toward = 4){
  const y0 = -toward - length/2, y1 = -toward + length/2;
  /* on the bottom run a point at y is at arc length length - |y| on the side
     whose half it is in */
  return {y0, y1, endPlus:path.length - Math.max(0, y1), endMinus:path.length - Math.max(0, -y0)};
}
/* The cover's outline in its own plane: x across, y along, the arched end
   at +y. */
export function claspCoverOutline(C = BRACELET.cover, n = 24){
  const w = C.width/2, ls = C.width*C.longSide, lm = C.width*C.longMid, pts = [[-w, 0], [w, 0]];
  for(let i = 0; i <= n; i++){ const x = w - 2*w*i/n, t = x/w; pts.push([x, ls + (lm - ls)*(1 - t*t)]); }
  return pts;
}
/* A link in section along the bracelet: flat underneath, straight sides, a
   rounded top (half an ellipse), so a row of them reads as a run of
   rounded barrels with a dark gap between each. [u, v] with u along the
   bracelet and v outward. */
export function linkProfile(length, thick, segs = 16){
  const h = length/2, side = thick*.34, pts = [[-h, 0], [h, 0], [h, side]];
  for(let i = 1; i < segs; i++){ const a = Math.PI*i/segs; pts.push([h*Math.cos(a), side + (thick - side)*Math.sin(a)]); }
  pts.push([-h, side]);
  return pts;
}

/* ---- the cyclops ----
   A plano-convex lens on the crystal: a circle of diameter d cut flat to
   `cut` across, `lift` high at the middle. x runs out along the radius it
   sits on, y across it. */
export function cyclopsLens(d = 7, cut = 5.5, lift = 1.1){
  const r = d/2, R = (r*r + lift*lift)/(2*lift);
  return {r, half:cut/2, R, lift, z:(x, y) => Math.max(0, Math.sqrt(Math.max(0, R*R - x*x - y*y)) - (R - lift))};
}

/* ---- tracing artwork into outlines ----
   Applied numerals are set in fonts the 3D view cannot read, so the 2D
   renderer draws them alone and their silhouette is traced: marching
   squares at half coverage, then simplified, then sorted into outlines and
   the holes inside them. Pixel units, y down. */
export function traceMask(alpha, w, h, threshold = 128){
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && alpha[y*w + x] >= threshold;
  const val = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? alpha[y*w + x] : 0;
  const pt = (x0, y0, x1, y1) => { const a = val(x0, y0), b = val(x1, y1), t = a === b ? .5 : Math.min(1, Math.max(0, (threshold - a)/(b - a))); return [x0 + (x1 - x0)*t, y0 + (y1 - y0)*t]; };
  /* edges of cell (x, y): 0 top, 1 right, 2 bottom, 3 left; keyed so
     neighbouring cells share them */
  const key = (x, y, e) => e === 0 ? `h${x},${y}` : e === 2 ? `h${x},${y+1}` : e === 3 ? `v${x},${y}` : `v${x+1},${y}`;
  const edgePt = (x, y, e) => e === 0 ? pt(x, y, x+1, y) : e === 1 ? pt(x+1, y, x+1, y+1) : e === 2 ? pt(x, y+1, x+1, y+1) : pt(x, y, x, y+1);
  /* segments run with the inside on their right in y-down pixels */
  const TABLE = {1:[[3,2]], 2:[[2,1]], 3:[[3,1]], 4:[[1,0]], 5:[[3,0],[1,2]], 6:[[2,0]], 7:[[3,0]],
                 8:[[0,3]], 9:[[0,2]], 10:[[0,1],[2,3]], 11:[[0,1]], 12:[[1,3]], 13:[[1,2]], 14:[[2,3]]};
  const next = new Map(), pos = new Map();
  for(let y = -1; y < h; y++) for(let x = -1; x < w; x++){
    const c = (on(x, y) ? 8 : 0) | (on(x+1, y) ? 4 : 0) | (on(x+1, y+1) ? 2 : 0) | (on(x, y+1) ? 1 : 0);
    const segs = TABLE[c]; if(!segs) continue;
    for(const [a, b] of segs){ const ka = key(x, y, a), kb = key(x, y, b); next.set(ka, kb); if(!pos.has(ka)) pos.set(ka, edgePt(x, y, a)); if(!pos.has(kb)) pos.set(kb, edgePt(x, y, b)); }
  }
  const loops = [];
  for(const startKey of next.keys()){
    if(!next.has(startKey)) continue;
    const loop = []; let k = startKey;
    while(next.has(k)){ loop.push(pos.get(k)); const n = next.get(k); next.delete(k); k = n; }
    if(loop.length >= 3) loops.push(loop);
  }
  return loops;
}
export function loopArea(loop){ let a = 0; for(let i = 0, j = loop.length - 1; i < loop.length; j = i++) a += (loop[j][0] - loop[i][0])*(loop[j][1] + loop[i][1]); return a/2; }
/* Ramer–Douglas–Peucker on a closed loop. */
export function simplifyLoop(loop, eps = .4){
  if(loop.length < 8) return loop.slice();
  let far = 0, fd = -1; for(let i = 1; i < loop.length; i++){ const d = Math.hypot(loop[i][0] - loop[0][0], loop[i][1] - loop[0][1]); if(d > fd){ fd = d; far = i; } }
  const rdp = (pts) => {
    if(pts.length < 3) return pts;
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length-1], L = Math.hypot(bx - ax, by - ay) || 1e-9;
    let idx = 0, dm = 0;
    for(let i = 1; i < pts.length - 1; i++){ const d = Math.abs((bx - ax)*(ay - pts[i][1]) - (ax - pts[i][0])*(by - ay))/L; if(d > dm){ dm = d; idx = i; } }
    if(dm <= eps) return [pts[0], pts[pts.length-1]];
    const l = rdp(pts.slice(0, idx + 1)), r = rdp(pts.slice(idx));
    return l.slice(0, -1).concat(r);
  };
  const a = rdp(loop.slice(0, far + 1)), b = rdp(loop.slice(far).concat([loop[0]]));
  return a.slice(0, -1).concat(b.slice(0, -1));
}
const inside = (p, loop) => { let c = false; for(let i = 0, j = loop.length - 1; i < loop.length; j = i++){ const [xi, yi] = loop[i], [xj, yj] = loop[j]; if((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi)*(p[1] - yi)/(yj - yi) + xi) c = !c; } return c; };
/* Outlines with the holes that sit directly inside them: a loop nested an
   even number of times is an outline, an odd number a hole (the counter of
   an 8, the bowl of a 6, a 0 inside the ring of a 10). */
export function nestLoops(loops, minArea = 2){
  const L = loops.filter(l => Math.abs(loopArea(l)) >= minArea);
  const depth = L.map((l, i) => L.reduce((n, m, j) => n + (j !== i && Math.abs(loopArea(m)) > Math.abs(loopArea(l)) && inside(l[0], m) ? 1 : 0), 0));
  const out = [];
  L.forEach((l, i) => { if(depth[i]%2 === 0) out.push({outer:l, holes:[], i}); });
  L.forEach((l, i) => {
    if(depth[i]%2 === 0) return;
    let best = null;
    for(const o of out) if(depth[o.i] === depth[i] - 1 && inside(l[0], o.outer) && (!best || Math.abs(loopArea(o.outer)) < Math.abs(loopArea(best.outer)))) best = o;
    if(best) best.holes.push(l);
  });
  return out.map(({outer, holes}) => ({outer, holes}));
}

/* ---- metal colours ----
   The 2D studio paints gold as a flat hex chosen to read well in a drawing.
   Lit by an environment, metal wants its reflectance instead (the base
   colour of a physically based metal): these are measured F0 values for
   18k yellow, rose and white gold and 316L steel, in sRGB. */
export const PBR_METAL = Object.freeze({"yellow gold":"#F2CC86", "rose gold":"#EEC0A9", "white gold":"#E4E3DE", "steel":"#CDD0D3"});
