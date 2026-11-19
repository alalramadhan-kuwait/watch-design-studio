// Improvement plan, phase 2: missing capabilities. Every preset and
// designs/ file draws byte for byte as before each step.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };

test('lume (v4.13.0): one colour for every hand and marker, and lume in any applied marker', () => {
  assert.match(source, /LUME_NOW = st\.lume && \/\^#\[0-9a-f\]\{6\}\$\/i\.test\(st\.lume\.color \|\| ""\) \? st\.lume\.color : null;/);
  assert.match(source, /const LUME_COLOURS = \[\["","Green-white"\],\["#E7D7A8","Old radium"\],\["#EFE6CB","Vintage cream"\],\["#F3F3EE","White"\],\["#D7E8F1","Ice blue"\],\["#CFE6C6","Jade"\]\];/);
  assert.doesNotMatch(source.replace(/lumeC\("#E9EFDF"\)|lumeC\("#D8E4C8"\)|: "#E9EFDF"|: "#D8E4C8"/g, ''), /fill="#E9EFDF"|fill="#D8E4C8"/, 'no lume paint left hard-coded');
  const L = chunk('function indexLume(ix, a){', '\n}\n');
  assert.match(L, /if\(!ix\.lume \|\| ix\.style === "f77" \|\| ix\.style === "box" \|\| ix\.style === "cone"\) return "";/);
  for (const k of ['dot', 'double', 'diamond', 'triangle', 'dagger']) assert.match(L, new RegExp(`case "${k}":`));
  assert.match(source, /const mk = indexShape\(ixK, i\*30, id, defs, laI\) \+ indexLume\(ixK, i\*30\);/);
  assert.match(source, /swatches\("lume\.color", LUME_COLOURS\.map/);
  assert.match(source, /add\("Lume", `\$\{nm2\} lume on the \$\{lumed\.join\(", "\)\}`, lc, ""\);/);
  // BASE carries an empty colour: older designs keep their green-white
  assert.match(source, /  lume:\{color:""\},\n  handSet:/);
});

test('minute track (v4.14.0): width rail to rail, rail and tick weights, five-minute style, a gap at 6, a check for the rehaut', () => {
  assert.match(source, /const rail = mt\.railW > 0 \? mt\.railW : Math\.max\(0\.045, Math\.min\(0\.08, t\*0\.18\)\);/, 'automatic as before');
  assert.match(source, /const tickW = mt\.tickW > 0 \? mt\.tickW : rail\*1\.15, fiveSt = mt\.fiveStyle \|\| "inward", gap6 = \+mt\.gap6 \|\| 0;/);
  assert.match(source, /if\(bold && fiveSt === "flared"\)\{/);
  assert.match(source, /const p0 = pt\(bold && fiveSt === "inward" \? r - t - Math\.min\(0\.45, t\*1\.2\) : r - t, a\)/);
  assert.match(source, /if\(inGap\(a\)\) continue;/);
  assert.match(source, /const gapR = gap6 > 0 \? 2\*Math\.ceil\(gap6\/12 - 1e-9\)\*6 : 0;/, 'the rails stop at the last mark');
  assert.match(source, /trackWMM:\{get:m => \+\(\(\+m\.thickness \|\| 0\)\*\(m\.style === "railroad" \? 2 : 1\)\)/);
  assert.match(source, /add\(mo<=r-0\.10,'Minute track in view'/);
  assert.match(source, /"Minute track in view":\["dial","Part of the minute track is hidden under the rehaut\."\]/);
  assert.match(source, /chips\("minute\.fiveStyle", \[\["inward","Run inward"\],\["plain","Plain"\],\["flared","Flared"\]\]/);
});

test('honeycomb guilloché and a brushed-steel chapter ring (v4.15.0)', () => {
  assert.match(source, /const GUIL_PATTERNS = \["clous","nid","orge",/);
  assert.match(source, /nid:"nid d'abeille \(honeycomb\)"/);
  const g = chunk('    case "nid": {', '    case "clous": {');
  assert.match(g, /const hd = Math\.max\(qx, qx\*0\.5 \+ qy\*0\.8660254\);/, 'the hexagonal distance');
  assert.match(g, /return \(0\.5 - hd\)\*c\*tw\*\(P\.facet \|\| 1\);/);
  assert.match(source, /S\.dial\.pattern === "clous" \|\| S\.dial\.pattern === "nid"/, 'lay and facet offered as for clous');
  assert.match(source, /SEL\("chapter\.finish","Finish",\["flat","matte","gloss","sunburst","grained","enamel","brushedsteel"\]\)/);
});

test('each hour its own size and turn (v4.16.0), for markers and stones, and the maker is told', () => {
  assert.match(source, /const hourRot = \(st, i, a\) => \{ const t = hourTune\(st, i\); if\(!t \|\| t\.rot == null\) return 0; return t\.rot === "upright" \? -a : \(\+t\.rot \|\| 0\); \};/);
  assert.match(source, /const g = sc === 1 \? g0 : Object\.assign\(\{\}, g0, \{d:g0\.d\*sc, L:g0\.L\*sc, W:g0\.W\*sc, s:g0\.s\*sc\}\);/);
  assert.match(source, /const m = gemMarkerSVG\(g, la - \(a \+ rot\)\*Math\.PI\/180, seed, cx, dialT\);/, 'the facets lit for the stone\'s own angle');
  assert.match(source, /if\(sc !== 1\) ixK = Object\.assign\(\{\}, ixK, \{length:ixK\.length\*sc, width:ixK\.width\*sc\}\);/);
  assert.match(source, /chips44\("ui\.hourRot", \[\["0","Toward the centre"\],\["upright","Upright"\],\["45","On point"\],\["90","Across"\]\], cur\)/);
  assert.match(source, /slider\("markers\.hourScaleUi", "Size of this hour", 0\.6, 1\.6, 0\.05,/);
  assert.match(source, /row\("perHour", "", `Per hour: \$\{tt\}`/);
});

test('big date (v4.18.0): two windows in one opening, tens and units discs, a centre bar, the size outside the frame', () => {
  const vm = require('node:vm');
  const ctx = vm.createContext({});
  vm.runInContext(chunk('function dateBar(dt){', 'function dateAutoDigitH(dt){') + 'this.r = {dateBar, dateOuter};', ctx);
  const { dateBar, dateOuter } = ctx.r;
  assert.equal(dateBar({w:4.8}), 0.8, 'a 0.8 mm bar unless set');
  assert.equal(dateBar({w:4.8, bar:2}), 1.44, 'never more than 30% of the opening');
  assert.equal(dateBar({w:4.8, bar:0.1}), 0.3);
  assert.deepEqual(JSON.parse(JSON.stringify(dateOuter({w:4.8, h:2.04, edge:'bevel', bevel:0.25}))), {w:5.3, h:2.54, e:0.25});
  assert.deepEqual(JSON.parse(JSON.stringify(dateOuter({w:4.8, h:2.04, frameW:0.4}))), {w:5.6, h:2.84, e:0.4});
  assert.equal(dateOuter({w:4.8, h:2.04, frameW:0.14}).e, 0, 'a thin printed line adds nothing');
  // drawing: one window as before, or two halves of dt.w either side of the bar
  const d = chunk('    // date window', '      /* The cyclops magnifies');
  assert.match(d, /const xs = big \? \[-\(W1 \+ bar\)\/2, \(W1 \+ bar\)\/2\] : \[0\];/);
  assert.match(d, /const atX = \(x, s\) => big \? `<g transform="translate\(\$\{f\(x,3\)\},0\)">\$\{s\}<\/g>` : s;/, 'a single window is not wrapped');
  assert.match(d, /const parts = big \? \[num\[0\] === "0" && dt\.zero === "blank" \? "" : toAr\(num\[0\]\), toAr\(num\[1\]\)\] : \[digits\];/);
  // turning it on widens to two windows of at least 2 mm, turning it off gives the width back
  assert.match(source, /bigUi:\{get:d => d\.big \? "big" : "single",/);
  assert.match(source, /d\.wSingle = d\.w; d\.big = true; d\.w = Math\.max\(d\.w, \+\(2\*Math\.max\(2\.0, d\.h\*0\.9\) \+ Math\.max\(0\.3, \+d\.bar > 0 \? \+d\.bar : 0\.8\)\)\.toFixed\(2\)\);/);
  assert.match(source, /delete d\.big; if\(d\.wSingle > 0\) d\.w = d\.wSingle; delete d\.wSingle;/);
  // the check, the sheet and the controls
  assert.match(source, /if\(st\.date&&st\.date\.on&&st\.date\.big\)add\(!!\(cal&&cal\.bigDate\),'Big date movement'/);
  assert.match(source, /if\(cal&&st\.date&&st\.date\.on&&!st\.date\.big\)\{/, 'the single-ring size and position rows do not judge a big date');
  assert.match(source, /\$\{dt\.big \? `big date, tens and units discs, \$\{sn\(dateBar\(dt\), 2\)\}mm centre bar; ` : ""\}/);
  assert.match(source, /\(\$\{mm\(o\.w\)\} × \$\{mm\(o\.h\)\}mm outside\)/);
  assert.match(source, /chips\("date\.bigUi", \[\["single","One window"\],\["big","Big date"\]\]/);
  assert.match(source, /SEL\("date\.bigUi","Windows",\["single","big"\]\)/);
});
