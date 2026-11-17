// The Royal Oak hands (v4.3.0): the hour and minute hands and the matching
// seconds hand of the Royal Oak Selfwinding 41 mm, ref. 15510ST, as a set in
// simple mode, a style in the full editor and on the More options sheet.
// Run from the real source: the outline profiles, the drawn hand, the set's
// lengths and widths, and where the style is offered. The page itself (the
// set on the Time Keeper × Nivada and the NOREL, the 3D view, Arabic) was
// checked with Playwright, and every existing hand style and saved design
// was confirmed to draw exactly as before.
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
  + '\nthis.r={STYLE_W,FACET,FACET_FLAT,facetHand,roPaddle,roLume,roHole,f};', ctx);
const { STYLE_W, FACET, FACET_FLAT, facetHand, roPaddle, roLume, f } = ctx.r;

const R = 15.9;                                   // the 15510ST's open dial radius, mm
const hour = { style: 'royal-oak', length: 0.57*R, width: 0.60, tail: 0, lume: true, material: 'white gold' };
const minute = { style: 'royal-oak', length: 0.875*R, width: 0.56, tail: 0, lume: true, material: 'white gold' };
const seconds = { style: 'ro-seconds', length: 0.92*R, width: 0.19, tail: 0.40*R, lume: false, material: 'white gold' };
const W = h => h.width*STYLE_W[h.style];
const draw = h => facetHand(h, FACET[h.style](h.length, h.tail, W(h)), W(h));
/* the points of a path made of M, L and Z (and arcs, by their end points) */
const points = d => [...d.matchAll(/(-?\d+\.\d+) (-?\d+\.\d+)/g)].map(m => [+m[1], +m[2]]);
const outlineOf = svg => /<path d="(M[^"]+Z)" fill="none" stroke="[^"]+" stroke-opacity="\.55" stroke-width="0\.03" stroke-linejoin="round"\/>$/.exec(svg)[1];

test('the style exists, with its matching seconds hand, wherever hands are chosen', () => {
  assert.equal(STYLE_W['royal-oak'], 2.25); assert.equal(STYLE_W['ro-seconds'], 1.6);
  assert.ok(FACET_FLAT.has('royal-oak') && FACET_FLAT.has('ro-seconds'), 'a flat table between two bevels, not a ridge');
  // the full editor's list, which the More options sheet draws as cards
  const styles = chunk('const HAND_STYLES = [', '];');
  assert.match(styles, /"day-date","dd-seconds","royal-oak","ro-seconds",/);
  assert.match(chunk('hands:[', 'text:['), /\{id:"shape", t:"Shape", src:"@", paths:\["H\.style"\], cards:\["H\.style"\]\}/);
  // simple mode's Hands step: a card with a picture, and a seconds card
  assert.match(source, /const styles = \[\["day-date","Day-date"\],\["royal-oak","Royal Oak"\],/);
  assert.match(source, /data-ghand="\$\{v\}"><div class="gPic">\$\{handPic\(v\)\}/);
  assert.match(source, /\["ro","Royal Oak"\],\["f77","Nivada F77"\],\["needle","Needle"\]/);
  assert.match(source, /sh\.style === "ro-seconds" \? "ro"/, 'the seconds card shows as chosen');
  // names, in English and Arabic
  assert.match(source, /"royal-oak":"Royal Oak", "ro-seconds":"Royal Oak seconds",/);
  assert.match(source, /"Royal Oak":"رويال أوك", "Royal Oak seconds":"ثواني رويال أوك",/);
});

test('the outlines are closed, symmetric and in the right order, tail to tip', () => {
  for (const h of [hour, minute, seconds]) {
    const prof = FACET[h.style](h.length, h.tail, W(h));
    for (let i = 1; i < prof.length; i++) assert.ok(prof[i][0] < prof[i - 1][0], `${h.style}: runs tail to tip`);
    for (const [y, k] of prof) assert.ok(Number.isFinite(y) && k > 0, `${h.style}: a real width at ${y}`);
    assert.equal(prof.at(-1)[0], -h.length, 'ends at the tip');
    const d = outlineOf(draw(h));
    assert.match(d, /^M.*Z$/, 'a closed path');
    const p = points(d);
    assert.ok(p.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)));
    assert.deepEqual(p[0], [-p.at(-1)[0], p.at(-1)[1]], 'the two sides mirror');
    let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1*y2 - x2*y1; }
    assert.ok(Math.abs(a)/2 > 0.5, 'it has area');
  }
});

test('the hour and minute hands: parallel sides, a neck and shoulder, a chamfered square tip, no tail', () => {
  for (const h of [hour, minute]) {
    const w = W(h), prof = FACET['royal-oak'](h.length, 0, w);
    assert.equal(prof[0][0], 0, 'no tail');
    assert.equal(prof[0][1], 0.19, 'a neck 0.38 of the width runs into the collet');
    assert.equal(prof[2][1], 0.5); assert.equal(prof[3][1], 0.5, 'full width from the shoulder to the tip: no taper');
    assert.ok(Math.abs((prof[1][0] - prof[2][0]) - (0.5 - 0.19)*w) < 1e-9, 'a 45 degree shoulder');
    assert.equal(prof.at(-1)[1], 0.34, 'the end face is about two thirds of the width');
    assert.ok(Math.abs((prof[3][0] - prof[4][0]) - 0.30*w) < 1e-9, 'the corners are chamfered back 0.3 of the width');
  }
  // widths as measured: hour 1.35 mm, minute 1.26 mm
  assert.ok(Math.abs(W(hour) - 1.35) < 0.01); assert.ok(Math.abs(W(minute) - 1.26) < 0.01);
});

test('the lume is a channel let into the table, inside the metal, short of both ends', () => {
  const svg = draw(hour), w = W(hour), c = roLume(hour.length, w);
  assert.ok(c.hw*2 < 0.42*w, 'narrower than the table');
  assert.ok(c.y1 > -hour.length && c.y0 < FACET['royal-oak'](hour.length, 0, w)[2][0], 'starts past the shoulder, stops short of the tip');
  assert.match(svg, /<path data-relief="lume" d="M[^"]+Z" fill="#E9EFDF"\/>/);
  // the table is cut through where the channel goes, so the 3D view can sink the lume
  assert.match(svg, /Z M[^"]+Z" fill="#[0-9A-F]{6}" fill-rule="evenodd"\/>/i);
  assert.equal((svg.match(/data-relief="lume"/g) || []).length, 1);
  // the plain stripe the other hands get is not drawn as well
  assert.doesNotMatch(svg, /fill="#E9EFDF" stroke=/);
  // lume off: a whole table and no channel
  const off = draw({ ...hour, lume: false });
  assert.doesNotMatch(off, /data-relief="lume"|fill-rule="evenodd"/);
});

test('the seconds hand: a fine needle with a slotted paddle behind the centre, and no lume', () => {
  const w = W(seconds), p = roPaddle(seconds.tail, w);
  assert.ok(Math.abs(w - 0.304) < 0.001, 'a 0.3 mm needle');
  assert.ok(Math.abs(p.k*2*w - 1.1) < 0.01, 'a 1.1 mm paddle');
  assert.ok(p.slot.y0 > p.s1 && p.slot.y1 < seconds.tail - p.ch + w*0.1, 'the slot lies inside the paddle');
  assert.ok(p.slot.hw < 0.42*p.k*w, 'and inside its table');
  const svg = draw({ ...seconds, lume: true });
  assert.doesNotMatch(svg, /#E9EFDF/, 'no lume on the seconds hand, even when the set has it on');
  assert.match(svg, / A0\.188 0\.188 0 0 1 [^"]+Z" fill="#[0-9A-F]{6}" fill-rule="evenodd"\/>/i, 'the slot is cut through the table');
  // too short a tail for a paddle: a plain needle, still closed
  assert.equal(roPaddle(1, w), null);
  assert.match(outlineOf(draw({ ...seconds, tail: 1 })), /^M.*Z$/);
});

test('choosing Royal Oak in simple mode sets all three hands at the measured lengths', () => {
  const body = chunk('  function setHand(hs){', '  /* Done on the Finish step');
  const run = (mat) => {
    const S = { hHand: { style: 'baton', material: mat }, mHand: { style: 'baton', material: mat }, sHand: { style: 'stick', secTip: 'needle', material: mat } };
    const c = vm.createContext({ S, caseOf: () => ({ opening: 31.8 }), snapVectorLengths() {}, syncHands() {}, commit() {}, paintAll() {} });
    vm.runInContext(body + '\nsetHand("royal-oak");', c);
    return S;
  };
  const S = run('polished steel'), Rr = 31.8/2;
  assert.equal(S.hHand.style, 'royal-oak'); assert.equal(S.mHand.style, 'royal-oak'); assert.equal(S.sHand.style, 'ro-seconds');
  assert.equal(S.mHand.reach, 'free'); assert.equal(S.mHand.length, +(Rr*0.875).toFixed(2));
  assert.equal(S.hHand.reach, 'share of the minute hand'); assert.equal(S.hHand.hourShare, 0.65);
  assert.ok(Math.abs(0.875*0.65 - 0.57) < 0.005, 'the hour hand lands at 0.57R, as measured');
  assert.equal(S.sHand.length, +(Rr*0.92).toFixed(2)); assert.equal(S.sHand.tail, +(Rr*0.40).toFixed(2));
  assert.equal(S.hHand.tail, 0); assert.equal(S.mHand.tail, 0);
  assert.equal(S.hHand.width, 0.60); assert.equal(S.mHand.width, 0.56); assert.equal(S.sHand.width, 0.19);
  assert.equal(S.hHand.lume, true); assert.equal(S.mHand.lume, true); assert.equal(S.sHand.lume, false);
  for (const k of ['hHand', 'mHand', 'sHand']) assert.equal(S[k].material, 'white gold', 'steel hands become white gold');
  for (const k of ['hHand', 'mHand', 'sHand']) assert.equal(run('rose gold')[k].material, 'rose gold', 'a gold hand keeps its metal');
  // moving on to another shape keeps the Royal Oak seconds, as the Day-Date's long needle is kept
  const c = vm.createContext({ S, caseOf: () => ({ opening: 31.8 }), snapVectorLengths() {}, syncHands() {}, commit() {}, paintAll() {} });
  vm.runInContext(body + '\nsetHand("dauphine");', c);
  assert.equal(S.sHand.style, 'ro-seconds');
});

test('collets as measured, and the 3D view sinks the lume and skips drawing-only paths', () => {
  const coll = chunk('const collet = (h, k) => {', '/* Stable identifiers');
  assert.match(coll, /h\.style === "ro-seconds" && k === "sHand" \? 0\.80/);
  assert.match(coll, /h\.style === "royal-oak" && k !== "sHand" \? \(k === "hHand" \? 1\.10 : 0\.95\)/);
  const r3d = fs.readFileSync(path.join(root, 'src/relief3d.js'), 'utf8');
  assert.match(r3d, /getAttribute\?\.\('data-relief'\)/);
  assert.match(r3d, /if\(relief==='skip'\)continue;/);
  assert.match(r3d, /depth:depth\*\.55,bevelEnabled:false/);
  const bundle = fs.readFileSync(path.join(root, 'vendor/relief3d.bundle.js'), 'utf8');
  assert.match(bundle, /data-relief/, 'the bundle is rebuilt');
  // no SVG filters in what the new hands draw
  assert.doesNotMatch(draw(hour) + draw(seconds), /filter/);
});
