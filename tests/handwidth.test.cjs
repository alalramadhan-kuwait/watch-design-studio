// The hands' Width shows the width the hand is drawn at (v4.10.5). Each
// shape multiplies its base width by its own factor (STYLE_W), and the
// slider used to show the base width: a designer who set a baton hand to
// "1.4" got one 2.66 mm wide. The design still keeps the base width, so
// every saved design draws exactly as before (checked: all presets and
// designs/ byte for byte), and only the number on the slider changed.
// The widest point of every shape was measured in Chromium at base width 1.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const C = vm.createContext({});
vm.runInContext(chunk('const VIRTUAL = {', '\n\n') + '\n' + chunk('const STYLE_W = {', '/* Supplied hand artwork') + '\nthis.r = {get, set, handDrawnK, STYLE_W};', C);
const { get, set, handDrawnK } = C.r;

test('the slider reads and writes the drawn width; the design keeps its base width', () => {
  const S = { hHand: { style: 'baton', width: 1.4 }, mHand: { style: 'leaf', width: 0.4 } };
  assert.equal(get(S, 'hHand.widthMM'), 2.66);
  assert.equal(get(S, 'hHand.width'), 1.4, 'real fields unchanged');
  set(S, 'hHand.widthMM', 1.6);
  assert.ok(Math.abs(S.hHand.width - 1.6/1.9) < 1e-4);
  assert.ok(!('widthMM' in S.hHand), 'nothing extra is saved in the design');
  assert.ok(Math.abs(get(S, 'hHand.widthMM') - 1.6) < 1e-3);
  // a tapered blade is measured at its widest, not at the factor
  assert.equal(handDrawnK('leaf'), 2.36); assert.equal(handDrawnK('dauphine'), 3); assert.equal(handDrawnK('sword'), 2.5);
  assert.equal(get(S, 'mHand.widthMM'), 0.944);
});

test('every editor offers the drawn width, under one name', () => {
  assert.match(source, /N\(k\+"\.widthMM","Width \(as drawn\)",\.1,4,\.01\)/);
  assert.doesNotMatch(source, /N\(k\+"\.width","Body width"/);
  assert.match(source, /paths:\["H\.stem","H\.widthMM","H\.tail"/);
  assert.match(source, /const VEC_SUPPLIES = new Set\(\["width","widthMM",/);
});
