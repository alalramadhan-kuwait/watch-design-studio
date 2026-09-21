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
