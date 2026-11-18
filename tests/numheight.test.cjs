// Applied numerals at three heights (v4.9.0): Standard 0.20 mm, High 0.35 mm
// and Extra high 0.50 mm, chosen in simple mode's Made tab and set as the
// piece height the drawing, the 3D view and the maker's sheet already read.
// The drawing was checked with Playwright (Chromium, iPhone 15): the walls and
// the cast shadow grow with the height. Run from the real source.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };

const C = vm.createContext({});
vm.runInContext([
  chunk('const NUM_HEIGHTS =', 'const NUM_MATERIAL = ['),
  chunk('const SW240_HAND_FIT =', '\n'),
  chunk('const HAND_BLADE =', '\n'),
  chunk('const gemDialT =', '\n'),
  'this.r = {NUM_HEIGHTS, numClear};'].join('\n'), C);
const { NUM_HEIGHTS, numClear } = C.r;

test('three heights, the ordinary piece first', () => {
  assert.deepEqual([...NUM_HEIGHTS.map(x => x[0])], [0.20, 0.35, 0.50]);
  assert.deepEqual([...NUM_HEIGHTS.map(x => x[1])], ['Standard', 'High', 'Extra high']);
});

test('the minute hand clears every offered height at the usual hand height', () => {
  for (const [h] of NUM_HEIGHTS) {
    const c = numClear({ numerals: { height: h }, handSet: { fitHeight: 4 } });
    assert.equal(c.tight, false, `${h} mm`);
    assert.ok(Math.abs(c.clear - (0.90 - h)) < 1e-9);
  }
  // an older design without a height is the ordinary piece
  assert.ok(Math.abs(numClear({ numerals: {} }).H - 0.20) < 1e-9);
});

test('too tall for the hands is flagged', () => {
  assert.equal(numClear({ numerals: { height: 0.50 }, handSet: { fitHeight: 3 } }).tight, true, 'low hands');
  assert.equal(numClear({ numerals: { height: 0.65 } }).tight, false, 'a 0.65 mm piece still clears at hand height 4');
  assert.equal(numClear({ numerals: { height: 0.75 } }).tight, true, 'past 0.70 mm it does not');
  assert.equal(numClear({ numerals: { height: 0.60, pave: true } }).tight, true, 'stones add 0.15 mm');
});

test('simple mode offers the heights only for an applied figure, with the clearance said', () => {
  const made = chunk('if(tab === "made"){', 'if(tab === "size"){');
  assert.match(made, /if\(n\.tech === "applied"\)\{[\s\S]*chips44\("numerals\.height", NUM_HEIGHTS/);
  assert.match(made, /gT\(cl\.tight \? "mk\.heightTight" : "mk\.height"/);
  assert.equal((source.match(/"mk\.height": \(mm, cl\)/g) || []).length, 2, 'English and Arabic');
  assert.equal((source.match(/"mk\.heightTight": \(mm, cl\)/g) || []).length, 2);
  assert.match(source, /"height:Standard":"عادي"/);
  assert.match(source, /N\("numerals\.height","Piece height",0\.04,0\.70,\.01\)/);
});

test('the maker\'s sheet says the height of a raised piece and keeps quiet about the ordinary one', () => {
  const row = chunk('/* a raised piece says how tall it is', 'row("numerals"');
  assert.match(row, /nm\.tech === "applied" && nH > 0\.25 \? `, raised \$\{sn\(nH, 2\)\}mm thick`/);
});
