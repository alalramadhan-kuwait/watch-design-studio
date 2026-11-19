// The date window (v4.11.0): a bevelled cut like the day window's, and the
// digits' height in mm, centred by their ink and kept 0.3 mm clear of the
// window's sides. Both are opt-in: a design without them draws exactly as
// before (checked: all presets and designs/ byte for byte). The drawing was
// checked on the F77 challenge's Basalt Nuit (bevel, 1.3 mm digits in a
// 2.4 × 2.0 window) and Nachtschrift (2.2 mm digits in a framed 4.4 × 2.9).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const C = vm.createContext({ handDrawnK: () => 1, dateAutoDigitH: d => 1.23 });
vm.runInContext(chunk('const VIRTUAL = {', '\n\n') + '\nthis.r = {get, set};', C);
const { get, set } = C.r;

test('the edge choice maps onto the design and back', () => {
  const S = { date: { frameW: 0.14 } };
  assert.equal(get(S, 'date.edgeUi'), 'line', 'every older design: the thin line');
  set(S, 'date.edgeUi', 'bevel'); assert.equal(S.date.edge, 'bevel'); assert.equal(get(S, 'date.edgeUi'), 'bevel');
  set(S, 'date.edgeUi', 'frame'); assert.equal(S.date.edge, undefined); assert.equal(S.date.frameW, 0.4); assert.equal(get(S, 'date.edgeUi'), 'frame');
  set(S, 'date.edgeUi', 'line'); assert.equal(S.date.frameW, 0.14);
  assert.ok(!('edgeUi' in S.date), 'nothing extra is saved');
});

test('the digit height shows the window\'s own until one is set', () => {
  const S = { date: { h: 2.6 } };
  assert.equal(get(S, 'date.digitHUi'), 1.23);
  set(S, 'date.digitHUi', 2.2); assert.equal(S.date.digitH, 2.2); assert.equal(get(S, 'date.digitHUi'), 2.2);
});

test('the drawing: digits by their ink, 0.3 mm clear of the sides, the bevel lit like the day window', () => {
  const d = chunk('    // date window', '      /* The cyclops magnifies');
  assert.match(d, /if\(dt\.digitH > 0\)\{/);
  assert.match(d, /let fs = Math\.min\(dt\.digitH, dt\.h - 0\.3\)\/kh;/);
  assert.match(d, /const room = W1 - 0\.6, wide = Math\.max\(0, \.\.\.ms\.map\(m => m && m\.w > 0 \? m\.w\*fs : 0\)\);/, 'per window: the whole width, or each half of a big date');
  assert.match(d, /const big = !!dt\.big, bar = big \? dateBar\(dt\) : 0, W1 = big \? \+\(\(dt\.w - bar\)\/2\)\.toFixed\(3\) : dt\.w;/);
  assert.match(d, /if\(wide > room\) fs \*= room\/wide;/);
  // without a digit height, exactly the old text
  assert.match(d, /font-size="\$\{f\(dt\.h\*\(ar \? 0\.95 : 0\.78\),2\)\}" fill="\$\{dt\.text\}" text-anchor="middle" dominant-baseline="central">\$\{t\}<\/text>` : ""\);/);
  assert.match(d, /if\(dt\.edge === "bevel"\)\{/);
  assert.match(d, /const line = fw > 0\.2 \|\| dt\.edge === "bevel" \? "" :/);
  // the guided Date step and the full editor offer both
  assert.match(source, /chips\("date\.edgeUi", \[\["bevel","Bevelled cut"\],\["frame","Applied frame"\],\["line","Thin line"\]\], dEdge\)/);
  assert.match(source, /slider\("date\.digitHUi", "Digit height", 0\.6, 4, 0\.05,/);
  assert.match(source, /N\("date\.digitHUi","Digit height",\.6,4,\.05\)/);
  // and the maker's sheet says so
  assert.match(source, /\$\{dt\.digitH > 0 \? `, digits \$\{sn\(dt\.digitH, 2\)\}mm high` : ""\}\$\{dt\.edge === "bevel" \? ", bevelled window \(no frame\)"/);
});
