import test from 'node:test';
import assert from 'node:assert/strict';
import {reliefSettings,subdialLayout,handAngles,markerAngles, zoneStack, zoneBands} from '../src/relief-model.js';

test('old designs and null settings receive safe defaults',()=>{
  assert.deepEqual(reliefSettings(),reliefSettings(null));
  assert.equal(reliefSettings({markerHeight:'bad',crystal:false}).markerHeight,.45);
  assert.equal(reliefSettings({crystal:false}).crystal,false);
});
test('limits prevent hands colliding with raised markers',()=>{
  const s=reliefSettings({markerHeight:12,handLift:-1,subDepth:8,roughness:0});
  assert.equal(s.markerHeight,1);assert.equal(s.handLift,1.2);
  assert.equal(s.subDepth,1);assert.equal(s.roughness,.08);
  assert.deepEqual(reliefSettings(JSON.parse(JSON.stringify(s))),s);
});
test('reference twin registers fit inside the dial without intersecting',()=>{
  const sub={on:true,at:9,dist:7.7,diameter:8.1};
  const pair=subdialLayout({sub:{...sub,extra:[{...sub,at:3}]}},15.25);
  assert.equal(pair.length,2);assert.ok(Math.abs(pair[0].x+7.7)<1e-8);
  assert.ok(Math.abs(pair[1].x-7.7)<1e-8);
  assert.ok(Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y)>pair[0].r+pair[1].r);
});
test('invalid, overlapping and disabled registers cannot corrupt dial geometry',()=>{
  const sub={on:true,at:6,dist:7,diameter:8};
  assert.equal(subdialLayout({sub:{...sub,extra:[sub,{...sub,dist:20},{...sub,at:'bad'}]}},15).length,1);
  assert.deepEqual(subdialLayout({sub:{...sub,on:false}},15),[]);
  assert.equal(subdialLayout({sub:{...sub,extra:{}}},15).length,1);
});
test('raised markers follow applied mode and numeral exclusions',()=>{
  const state={indices:{on:true,applied:true,count:12,skipNumerals:true},numerals:{on:true,set:'quarters'}};
  assert.equal(markerAngles(state).length,8);assert.ok(!markerAngles(state).includes(90));
  state.indices.applied=false;assert.deepEqual(markerAngles(state),[]);
});
test('hands preserve the selected time',()=>{
  assert.deepEqual(handAngles({h:10,m:10,s:30}),[305,63,180]);
});

test('a dial with no lifts stays one flat disc',()=>{
  const flat={sector:{on:true,zones:[{outerD:30,innerD:22},{outerD:22,innerD:0,lift:0}]}};
  assert.deepEqual(zoneBands(flat,15.25,.5),[],'no bands means the old single blank is used');
  assert.deepEqual(zoneStack(flat,15.25),[]);
});

test('zones become bands at their own heights, innermost winning the overlap',()=>{
  const st={sector:{on:true,zones:[{outerD:30,innerD:22,lift:.25},{outerD:22,innerD:0,lift:-.3}]}};
  const bands=zoneBands(st,15.25,.5);
  assert.equal(bands.length,3);
  assert.deepEqual(bands.map(b=>b.lift),[-.3,.25,0]);
  assert.deepEqual(bands.map(b=>[+b.lo.toFixed(2),+b.hi.toFixed(2)]),[[0,11],[11,15],[15,15.25]]);
  // every band is solid from its own face down to the shared underside
  for(const b of bands) assert.ok(Math.abs((b.z+b.depth)-b.lift)<1e-9,'top face sits at the lift');
});

test('an inner zone laid over a larger one takes the overlap',()=>{
  const st={sector:{on:true,zones:[{outerD:30,innerD:0,lift:.4},{outerD:16,innerD:0,lift:-.2}]}};
  const bands=zoneBands(st,15.25,.5);
  assert.deepEqual(bands.map(b=>b.lift),[-.2,.4,0]);
});

test('nonsense zones are left out rather than drawn wrong',()=>{
  const bad={sector:{on:true,zones:[
    {outerD:30,innerD:31,lift:.3},        // inner outside outer
    {outerD:-4,innerD:0,lift:.3},         // negative
    {outerD:20,innerD:0,lift:'x'},        // not a number
    {outerD:20,innerD:0,lift:.002},       // below the flat threshold
    {outerD:20,innerD:0,lift:.3,on:false} // switched off
  ]}};
  assert.deepEqual(zoneStack(bad,15.25),[]);
});

test('a lift is clamped rather than allowed to swallow the case',()=>{
  const st={sector:{on:true,zones:[{outerD:30,innerD:0,lift:99}]}};
  assert.equal(zoneStack(st,15.25)[0].lift,1.2);
  assert.equal(zoneStack({sector:{on:true,zones:[{outerD:30,innerD:0,lift:-99}]}},15.25)[0].lift,-1.2);
});

test('zones are ignored entirely when the sector is off',()=>{
  assert.deepEqual(zoneStack({sector:{on:false,zones:[{outerD:30,innerD:0,lift:.5}]}},15.25),[]);
});

test('hours set one by one raise a marker at each gem and applied index hour, none under a window',()=>{
  const at=['none','gem','gem','gem','index','gemAlt','indexAlt','numeral','none','gem','gem','gem'];
  const state={indices:{on:true,applied:true,count:12},numerals:{on:true,set:'all'},markers:{perHour:true,at},day:{on:true},date:{on:true,at:3}};
  assert.deepEqual(markerAngles(state),[30,60,120,150,180,270,300,330]);
  state.indices.applied=false;
  assert.deepEqual(markerAngles(state),[30,60,150,270,300,330],'printed indices are flat; gems still stand');
  state.markers.perHour=false;assert.deepEqual(markerAngles(state),[],'off: today\'s rule');
});

/* ---- the NOREL head (v3.4.0) ---- */
import {NOREL_R1,lugTopAt,norelStack,bezelProfile,gemBezelTop,braceletPath,braceletRows,linkProfile,cyclopsLens,traceMask,simplifyLoop,nestLoops,loopArea,PBR_METAL} from '../src/relief-model.js';
import {readFileSync} from 'node:fs';

test('the head stacks to the R4 drawing: 11.20 over the crystal, bezel just below the glass',()=>{
  const s=norelStack({});
  assert.ok(Math.abs(s.glassTop-NOREL_R1.backBottom-11.2)<1e-9);
  assert.ok(Math.abs(s.glassTop-s.glassBottom-1.5)<1e-9);
  assert.ok(s.bezelTop<s.glassTop&&s.glassBottom>1.5,'the glass clears the hands');
  assert.equal(s.flutes,72);
});
test('the R4 bezel profile runs from the Ø31.40 opening to Ø41.00 with a 45° fluted slope',()=>{
  const {pts,slope}=bezelProfile({bezelOD:41,bezelID:34.2,glassD:33.5,opening:31.4,land:.5});
  const rs=pts.map(p=>p[0]);
  assert.ok(Math.abs(Math.min(...rs)-15.7)<1e-9);assert.ok(Math.abs(Math.max(...rs)-20.5)<1e-9);
  const [r0,z0]=pts[slope],[r1,z1]=pts[slope+1];
  assert.ok(Math.abs((z0-z1)/(r1-r0)-1)<1e-9,'45 degrees');
  assert.ok(Math.abs(r0-(17.1+.5))<1e-9,'the polished land is 0.50 wide');
  // a gem-set bezel has no flutes, and its top falls away from the crystal
  const g=bezelProfile({},true);assert.equal(g.slope,-1);
  assert.ok(gemBezelTop({},17.5)>gemBezelTop({},20));
});
test('the lug top falls toward the tips',()=>{
  for(let y=16.5;y<23.5;y+=.5)assert.ok(lugTopAt(y+.5)<lugTopAt(y));
});
test('the bracelet curves down and away and meets its mirror at the clasp',()=>{
  const p=braceletPath({y0:22,z0:-7,theta0:-25*Math.PI/180,R:20});
  const end=p.at(p.length);
  assert.ok(Math.abs(end.y)<1e-9,'the last point is on the centre line');
  assert.ok(Math.abs(end.theta+Math.PI)<1e-9,'running back level under the watch');
  assert.ok(p.bottom<-30,'well below the head');
  let prev=p.at(0);
  for(let s=.5;s<=p.length;s+=.5){const q=p.at(s);assert.ok(Math.abs(Math.hypot(q.y-prev.y,q.z-prev.z)-.5)<1e-3,'unit speed, and no jump where the arc meets the run');assert.ok(q.theta<=prev.theta+1e-12,'only ever turning down');prev=q;}
  const rows=braceletRows(p,{pitch:5.3,gap:.4,w0:21,w1:16});
  assert.ok(rows.length>=10);
  assert.ok(Math.abs(rows[0].width-21)<1,'lug width at the case');
  assert.equal(rows[rows.length-1].width,16,'clasp width at the bottom');
  for(let i=1;i<rows.length;i++)assert.ok(rows[i].s-rows[i-1].s>rows[i].length,'a gap between rows');
});
test('a link is rounded on top and flat underneath',()=>{
  const pr=linkProfile(5,2.7);
  assert.equal(Math.min(...pr.map(p=>p[1])),0);
  assert.ok(Math.abs(Math.max(...pr.map(p=>p[1]))-2.7)<.05);
  assert.ok(loopArea(pr)!==0);
});
test('the cyclops is 1.10 high at the middle and meets the glass at its rim',()=>{
  const l=cyclopsLens(7,5.5,1.1);
  assert.ok(Math.abs(l.z(0,0)-1.1)<1e-9);assert.ok(Math.abs(l.z(3.5,0))<1e-9);
  assert.equal(l.half,2.75);
});
test('tracing finds an outline and the hole inside it',()=>{
  const w=40,h=40,a=new Uint8Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const r=Math.hypot(x-20,y-20);a[y*w+x]=r<14&&r>6?255:0;}
  const loops=traceMask(a,w,h).map(l=>simplifyLoop(l,.3));
  assert.equal(loops.length,2);
  const shapes=nestLoops(loops);
  assert.equal(shapes.length,1);assert.equal(shapes[0].holes.length,1);
  const area=Math.abs(loopArea(shapes[0].outer))-Math.abs(loopArea(shapes[0].holes[0]));
  assert.ok(Math.abs(area-Math.PI*(14*14-6*6))/(Math.PI*(14*14-6*6))<.06,'a ring of the right area');
  // two separate figures, one with a counter (an 8 has two)
  const b=new Uint8Array(w*h);for(let y=5;y<35;y++){for(let x=3;x<13;x++)b[y*w+x]=255;for(let x=20;x<36;x++)b[y*w+x]=(x>24&&x<31&&y>10&&y<29)?0:255;}
  const s2=nestLoops(traceMask(b,w,h));
  assert.equal(s2.length,2);assert.deepEqual(s2.map(s=>s.holes.length).sort(),[0,1]);
});
test('metals are reflectances, gold warmer than steel',()=>{
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const [r,g,b]=rgb(PBR_METAL['yellow gold']);assert.ok(r>g&&g>b);
  const s=rgb(PBR_METAL.steel);assert.ok(Math.max(...s)-Math.min(...s)<12);
});
test('the case model ships, is compact and is cached for offline use',()=>{
  const glb=readFileSync(new URL('../app/norel-case-r1.glb',import.meta.url));
  assert.equal(glb.readUInt32LE(0),0x46546C67,'a GLB');
  assert.ok(glb.length<1.5e6,'under 1.5 MB');
  const json=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
  assert.deepEqual(json.meshes.map(m=>m.name),['case','crown','caseback']);
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(sw,/"\.\/app\/norel-case-r1\.glb"/);
  const src=readFileSync(new URL('../src/relief3d.js',import.meta.url),'utf8');
  assert.match(src,/CASE_GLB='\.\/app\/norel-case-r1\.glb'/);
});

/* ---- the bracelet to Blue Creations' sheet (v3.4.1) ---- */
import {BRACELET,claspSpan,claspCoverOutline} from '../src/relief-model.js';
test('the bracelet carries the sheet\'s numbers and the measured proportions',()=>{
  assert.equal(BRACELET.lugWidth,21.0);assert.equal(BRACELET.clasp,16.0);assert.equal(BRACELET.lugToLug,48.0);
  assert.equal(BRACELET.cover.wordmark,9.0,'9.0 is the wordmark on the clasp cover');
  assert.ok(Math.abs(BRACELET.centreShare*21-9.1)<.1,'a 9.1 centre link at the lugs');
  assert.ok(BRACELET.pitch>=4.65&&BRACELET.pitch<=5.15,'pitch between the two renders');
});
test('the links narrow from 21 at the lugs to 16 and stop short of the clasp',()=>{
  const p=braceletPath({y0:21.86,z0:-6.95,theta0:-25*Math.PI/180,R:20}),C=BRACELET.cover,span=claspSpan(p,C.width*C.longMid);
  assert.ok(span.y0<0&&span.y1>0&&span.y0+span.y1<0,'the clasp sits under the watch, toward 6');
  assert.ok(Math.abs(span.y1-span.y0-C.width*C.longMid)<1e-9);
  for(const end of [span.endPlus,span.endMinus]){
    const rows=braceletRows(p,{end});
    assert.ok(rows[rows.length-1].s+rows[rows.length-1].length/2<=end+1e-9,'no row runs under the clasp');
    for(let i=1;i<rows.length;i++)assert.ok(rows[i].width<=rows[i-1].width);
    assert.equal(rows[rows.length-1].width,16);
    assert.ok(rows[0].width>20.3);
    const p0=rows[1].s-rows[0].s;assert.ok(Math.abs(p0-BRACELET.pitch)<.6,'about the measured pitch');
  }
  // 0.14 narrower per mm: 16.0 is reached about 36 mm down the bracelet
  const rows=braceletRows(p,{end:span.endPlus}),at=rows.find(r=>r.width===16);
  assert.ok(at.s>30&&at.s<42);
});
test('the clasp cover is 16.0 wide with its arched end longer than its sides',()=>{
  const o=claspCoverOutline();
  const xs=o.map(p=>p[0]),ys=o.map(p=>p[1]);
  assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-16)<1e-9);
  assert.ok(Math.abs(Math.max(...ys)-16*1.14)<.01);
  assert.ok(Math.abs(o[2][1]-16*1.09)<1e-9);
  assert.ok(loopArea(o)!==0);
});
