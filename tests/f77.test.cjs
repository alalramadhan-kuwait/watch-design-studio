// The Nivada F77 hands (v4.4.0): the hour and minute hands and the matching
// seconds hand of Nivada Grenchen's F77 37 mm, as a set in simple mode, a
// style in the full editor and on the More options sheet. Run from the real
// source: the outline profiles, the drawn hand, the set's lengths and
// widths, and where the style is offered. The page itself (the set on the
// Time Keeper × Nivada and the NOREL, the 3D view, Arabic) was checked with
// Playwright, and every existing hand style and saved design was confirmed
// to draw exactly as before.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };

/* the hand library, from the material table to the end of facetHand */
const ctx = vm.createContext({});
vm.runInContext(
  chunk('const hex2rgb = h =>', 'function labOf') + '\n'
  + chunk('const f = (n,d=2)', '\n') + '\n'
  + chunk('const STYLE_W = {', '/* Supplied hand artwork') + '\n'
  + chunk('const HAND_MATERIAL = {', 'const POMME = {') + '\n'
  + chunk('const FACET = {', 'function handPath(')
  + '\nthis.r={STYLE_W,FACET,FACET_FLAT,facetHand,f77Plot,f77Weight,f77Lume,f77Hole,F77_LUME};', ctx);
const { STYLE_W, FACET, FACET_FLAT, facetHand, f77Plot, f77Weight, f77Lume, F77_LUME } = ctx.r;

const R = 13.75;                                  // the F77's open dial radius, mm (27.50 opening)
const hour = { style: 'f77', length: 0.59*R, width: 0.50, tail: 0.18*R, lume: true, material: 'polished steel' };
const minute = { style: 'f77', length: 0.87*R, width: 0.45, tail: 0.18*R, lume: true, material: 'polished steel' };
const seconds = { style: 'f77-seconds', length: 0.88*R, width: 0.14, tail: 0.27*R, lume: true, material: 'polished steel' };
const W = h => h.width*STYLE_W[h.style];
const draw = h => facetHand(h, FACET[h.style](h.length, h.tail, W(h)), W(h));
const points = d => [...d.matchAll(/(-?\d+\.\d+) (-?\d+\.\d+)/g)].map(m => [+m[1], +m[2]]);
const outlineOf = svg => /<path d="(M[^"]+Z)" fill="none" stroke="[^"]+" stroke-opacity="\.55" stroke-width="0\.03" stroke-linejoin="round"\/>$/.exec(svg)[1];

test('the style exists, with its matching seconds hand, wherever hands are chosen', () => {
  assert.equal(STYLE_W['f77'], 2.0); assert.equal(STYLE_W['f77-seconds'], 1.6);
  assert.ok(FACET_FLAT.has('f77') && FACET_FLAT.has('f77-seconds'), 'flat polished tops, not a ridge');
  const styles = chunk('const HAND_STYLES = [', '];');
  assert.match(styles, /"royal-oak","ro-seconds","f77","f77-seconds",/);
  // simple mode's Hands step: a card beside Royal Oak, and a seconds card
  assert.match(source, /\["royal-oak","Royal Oak"\],\["f77","Nivada F77"\],/);
  assert.match(source, /\["ro","Royal Oak"\],\["f77","Nivada F77"\],\["needle","Needle"\]/);
  assert.match(source, /sh\.style === "f77-seconds" \? "f77"/, 'the seconds card shows as chosen');
  assert.match(source, /else if\(tip === "f77"\)\{ sh\.secTip = "f77"; sh\.style = "f77-seconds"; sh\.width = 0\.14;/);
  // names, in English and Arabic
  assert.match(source, /"f77":"Nivada F77", "f77-seconds":"Nivada F77 seconds",/);
  assert.match(source, /"Nivada F77":"نيفادا F77", "Nivada F77 seconds":"ثواني نيفادا F77",/);
});

test('the outlines are closed, symmetric and in the right order, tail to tip', () => {
  for (const h of [hour, minute, seconds, { ...hour, tail: 0 }, { ...seconds, tail: 0.5 }]) {
    const prof = FACET[h.style](h.length, h.tail, W(h));
    for (let i = 1; i < prof.length; i++) assert.ok(prof[i][0] < prof[i - 1][0], `${h.style}: runs tail to tip`);
    for (const [y, k] of prof) assert.ok(Number.isFinite(y) && k > 0, `${h.style}: a real width at ${y}`);
    assert.equal(prof.at(-1)[0], -h.length, 'ends at the tip');
    const p = points(outlineOf(draw(h)));
    assert.deepEqual(p[0], [-p.at(-1)[0], p.at(-1)[1]], 'the two sides mirror');
  }
});

test('the hour and minute hands: parallel bars, square ends, measured widths and a tail', () => {
  for (const h of [hour, minute]) {
    const prof = FACET.f77(h.length, h.tail, W(h));
    assert.equal(prof[0][0], h.tail, 'a tail through the centre');
    assert.ok(prof.slice(1, -1).every(([, k]) => k === 0.5), 'full width from end to end: no taper');
    assert.ok(prof.at(-1)[1] > 0.4, 'a square tip, only its corners eased');
  }
  assert.ok(Math.abs(W(hour) - 1.0) < 1e-9); assert.ok(Math.abs(W(minute) - 0.9) < 1e-9);
});

test('a channel runs the whole length between two rails, with the lume in it', () => {
  const svg = draw(hour), w = W(hour);
  // the floor of the channel is sunk below the rails in the 3D view, and reaches both ends
  const floor = /<path data-relief="sunk" d="(M[^"]+Z)"/.exec(svg);
  assert.ok(floor, 'a sunk channel floor');
  const ys = points(floor[1]).map(p => p[1]);
  assert.equal(Math.max(...ys), +hour.tail.toFixed(3)); assert.equal(Math.min(...ys), +(-hour.length).toFixed(3), 'open at the tip and the tail');
  assert.ok(Math.min(...points(floor[1]).map(p => Math.abs(p[0]))) >= 0.13*w - 0.001);
  // the lume: half the width, from 4.7 mm out to 0.7 of the width short of the tip
  const c = f77Lume(hour.length, w);
  assert.ok(Math.abs(c.y0 + 4.7) < 1e-9 && Math.abs(c.y1 + hour.length - 0.7*w) < 1e-9);
  assert.equal(c.hw, 0.25*w);
  assert.ok(Math.abs(f77Lume(minute.length, W(minute)).y0 + 4.7) < 1e-9, 'the same distance out on both hands');
  assert.equal(F77_LUME, '#EEEDE6', 'white, as in the photograph');
  assert.equal((svg.match(/data-relief="lume"/g) || []).length, 1);
  assert.match(svg, new RegExp(`data-relief="lume" d="M[^"]+Z" fill="${F77_LUME}"`));
  assert.doesNotMatch(svg, /#E9EFDF/, 'not the plain lume stripe the other hands get');
  // lume off: the channel stays, empty, and there is no lume
  const off = draw({ ...hour, lume: false });
  assert.match(off, /data-relief="sunk"/); assert.doesNotMatch(off, /data-relief="lume"|#EEEDE6/);
});

test('the seconds hand: a needle with a framed lume plot just inside the markers, and a flat counterweight', () => {
  const w = W(seconds), p = f77Plot(seconds.length, w), cw = f77Weight(seconds.tail, w);
  assert.ok(Math.abs(w - 0.224) < 0.001, 'a 0.22 mm needle');
  assert.ok(Math.abs(p.y0/R - 0.585) < 0.01 && Math.abs(p.y1/R - 0.678) < 0.01, 'the plot from 0.585R to 0.68R');
  assert.ok(Math.abs(p.k*2*w - 0.76) < 0.01, 'a 0.75 mm frame');
  assert.ok(Math.abs(cw.k*2*w - 0.44) < 0.01, 'a 0.43 mm counterweight');
  const svg = draw(seconds);
  assert.match(svg, /fill-rule="evenodd"/, 'the plot cut through the table for the 3D view');
  assert.equal((svg.match(/data-relief="lume"/g) || []).length, 1);
  const off = draw({ ...seconds, lume: false });
  assert.doesNotMatch(off, /data-relief="lume"|fill-rule="evenodd"/);
  // too short for a plot or a counterweight: a plain needle, still closed
  assert.equal(f77Plot(2, w), null); assert.equal(f77Weight(0.5, w), null);
  assert.match(outlineOf(draw({ ...seconds, length: 2, tail: 0.5 })), /^M.*Z$/);
  assert.doesNotMatch(draw(hour) + svg, /filter/, 'no SVG filters in what the new hands draw');
});

test('choosing Nivada F77 in simple mode sets all three hands at the measured lengths, metals kept', () => {
  const body = chunk('  function setHand(hs){', '  /* Done on the Finish step');
  const run = (mat, hs = 'f77', S0) => {
    const S = S0 || { hHand: { style: 'baton', material: mat }, mHand: { style: 'baton', material: mat }, sHand: { style: 'stick', secTip: 'needle', material: mat } };
    const c = vm.createContext({ S, caseOf: () => ({ opening: 27.5 }), snapVectorLengths() {}, syncHands() {}, commit() {}, paintAll() {} });
    vm.runInContext(body + `\nsetHand(${JSON.stringify(hs)});`, c);
    return S;
  };
  const S = run('polished steel'), Rr = 27.5/2;
  assert.equal(S.hHand.style, 'f77'); assert.equal(S.mHand.style, 'f77'); assert.equal(S.sHand.style, 'f77-seconds');
  assert.equal(S.mHand.length, +(Rr*0.87).toFixed(2)); assert.equal(S.hHand.hourShare, 0.68);
  assert.ok(Math.abs(0.87*0.68 - 0.59) < 0.005, 'the hour hand lands at 0.59R, as measured');
  assert.equal(S.hHand.tail, +(Rr*0.18).toFixed(2)); assert.equal(S.mHand.tail, +(Rr*0.18).toFixed(2));
  assert.equal(S.sHand.length, +(Rr*0.88).toFixed(2)); assert.equal(S.sHand.tail, +(Rr*0.27).toFixed(2));
  assert.equal(S.hHand.width, 0.50); assert.equal(S.mHand.width, 0.45); assert.equal(S.sHand.width, 0.14);
  assert.equal(S.hHand.lume, true); assert.equal(S.mHand.lume, true); assert.equal(S.sHand.lume, true);
  for (const mat of ['polished steel', 'rose gold', 'blued steel', 'yellow gold'])
    for (const k of ['hHand', 'mHand', 'sHand']) assert.equal(run(mat)[k].material, mat, 'the F77 is steel: every metal is kept as it is');
  // moving on to another shape keeps the F77 seconds, as the other sets' seconds are kept
  run(null, 'dauphine', S);
  assert.equal(S.sHand.style, 'f77-seconds');
});

test('collets as measured, and the 3D view sets the channel floor below the rails', () => {
  const coll = chunk('const collet = (h, k) => {', '/* Stable identifiers');
  assert.match(coll, /h\.style === "f77-seconds" && k === "sHand" \? 0\.55/);
  assert.match(coll, /h\.style === "f77" && k !== "sHand" \? \(k === "hHand" \? 0\.85 : 0\.70\)/);
  assert.match(coll, /h\.style === "ro-seconds" \|\| h\.style === "f77-seconds"/, 'a flat seconds cap, as the Royal Oak has');
  const r3d = fs.readFileSync(path.join(root, 'src/relief3d.js'), 'utf8');
  assert.match(r3d, /sunk=relief==='sunk'/);
  assert.match(r3d, /if\(sunk\)\{mesh\(new THREE\.ExtrudeGeometry\(shape,\{depth:depth\*\.35,bevelEnabled:false/);
  const bundle = fs.readFileSync(path.join(root, 'vendor/relief3d.bundle.js'), 'utf8');
  assert.match(bundle, /"sunk"/, 'the bundle is rebuilt');
});
