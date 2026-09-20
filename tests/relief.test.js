import test from 'node:test';
import assert from 'node:assert/strict';
import {reliefSettings,subdialLayout,handAngles,markerAngles} from '../src/relief-model.js';

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
