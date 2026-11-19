// Improvement plan, phase 1, first fixes (v4.11.1), from the F77 design
// challenge's reproduced bugs. Every preset and designs/ file draws byte for
// byte as before; these change what the controls do, not saved designs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };

test('"Each hour…" starts from the markers on the dial, not from a stale list', () => {
  const f = chunk('function applyMarkerPreset(st, id){', '\n}\n');
  assert.match(f, /if\(id === "custom"\)\{\n    if\(!m\.perHour\)\{ const now = hourPlan\(st\); m\.at = now\.map\(q => q\.covered \? "none" : q\.kind\); \}/);
});

test('the window notes appear only on a watch with windows, and name its own maker', () => {
  assert.match(source, /const covN = coveredHours\(S\);\n    if\(covN\.size\) h \+=/);
  assert.match(source, /function makerOf\(st\)\{/);
  assert.match(source, /const TK_NIVADA = \{\n  maker:"Nivada",/);
  assert.match(source, /return ownMaker\(typeof s === "function" \? s\(\.\.\.a\) : s\); \};/);
  assert.match(source, /\$\{caseOf\(st\)\.calendar \? " The day and date discs run under the dial/);
  // no check sentence hard-codes Blue Creations any more
  const checks = chunk('function gemChecks(st, pave){', '\nfunction ');
  assert.doesNotMatch(checks.replace(/makerOf\(st\)/g, ''), /"[^"]*Blue Creations[^"]*"/);
});

test('"To the minute track" puts the tip on the track\'s inner edge for its style', () => {
  assert.match(source, /if\(last === "reach" && par && typeof par === "object" && typeof onReachChoice === "function"\) onReachChoice\(par, v, o\);/);
  const t = chunk('function trackTrim(st){', '\n}\n');
  assert.match(t, /mt\.style === "railroad" \? r - t/);
  assert.match(t, /\(mt\.style === "dots" \|\| mt\.style === "beads"\) \? r - t\*0\.55/);
  assert.match(t, /: r - Math\.max\(t\*1\.6, 0\.42\)\/2;/);
  assert.match(source, /if\(v === "to the minute track"\) h\.reachTrim = \+trackTrim\(st\)\.toFixed\(4\);/);
});

test('linked hands: shape only by default, the seconds hand left out and never the source, and the screen says what else changed', () => {
  assert.match(source, /handSet:\{link:"style only", minuteScale:0\.80, secondsScale:0\.52, includeSeconds:false, fitHeight:4\}/);
  const s = chunk('function syncHands(master){', '\n}\n');
  assert.match(s, /if\(master !== "hHand" && master !== "mHand"\) return changed;/);
  assert.match(s, /return changed;$/);
  assert.match(source, /if\(alsoHands\.length\) toast\(gT\("hands\.also"/);
});

test('a strap of another colour keeps the photograph where the case has a measured strap', () => {
  assert.match(source, /function strapTintPixels\(d, W, H, cal, P, hex, fab\)\{/);
  assert.match(source, /let strapHex = own \? photoStrapHex\(st, K\) : null;/);
  assert.match(source, /if\(own && \(\(plan && \(plan\.full \|\| plan\.two\)\) \|\| strapHex\)\)\{ own = tintedPhoto\(K, plan \|\| \{\}, strapHex, fab\);/);
  assert.match(source, /if\(path === "case\.strapColor"\) return !!K\.bracelet \|\| !!K\.photoStrap \|\|/);
  // the sheet does not tint a second time, and no screen-only helper is used in the drawing
  assert.doesNotMatch(source, /sheetStrapTint/);
  assert.doesNotMatch(chunk('const photoStrapHex = ', '\n};'), /isHex\(/);
});

test('the figure beside every guided slider can be tapped to type an exact value', () => {
  assert.match(source, /<output><button type="button" class="gSlVal" data-gtype="\$\{path\}" data-min="\$\{min\}" data-max="\$\{max\}" data-kind="\$\{kind\}"/);
  assert.match(source, /if\(d\.gtype\)\{ typeValue\(t\); return; \}/);
  const f = chunk('function typeValue(btn){', '\n  function apply(path, v, sheet){');
  assert.match(f, /inp\.inputMode = kind === "pos" \? "text" : "decimal"/);
  assert.match(f, /v = Math\.min\(max, Math\.max\(min, v\)\);\n        apply\(path, v, sheet\);/);
  assert.match(f, /\.replace\(",", "\."\)/, 'a comma is a decimal point');
  assert.match(f, /e\.key === "Escape"/);
  // dragging the slider updates the figure, not the button's place
  assert.match(source, /out = box\.querySelector\("\.gSlVal"\) \|\| box\.querySelector\("output"\);/);
  // 16 px so iOS does not zoom into the field
  assert.match(source, /\.gSlIn\{ font:600 16px\/1\.3 var\(--sans\)/);
});

test('sizes are shown as heights on the dial: the figures\' ink, the letters\' capitals', () => {
  for (const k of ['heightMM', 'line2CapMM', 'footCapMM', 'splitCapMM']) assert.match(chunk('const VIRTUAL = {', '\n};'), new RegExp('\\n  ' + k + ':\\{get:'));
  assert.match(source, /function numFigureK\(nm\)\{/);
  assert.match(chunk('function numFigureK(nm){', '\n}\n'), /return Math\.max\(0\.6, Math\.min\(2\.4, 0\.72\/m\.h\)\)\*m\.h;/, 'the dial\'s own rule for the font size');
  assert.match(source, /slider\("numerals\.heightMM", "Figure height", 1\.0, 4\.0, 0\.05, get\(S, "numerals\.heightMM"\)\)/);
  assert.match(source, /slider\("text\.footCapMM", "Letter height", 0\.25, 1\.5, 0\.02, get\(S, "text\.footCapMM"\)\)/);
  assert.match(source, /N\("numerals\.heightMM","Figure height",\.7,5,\.05\)/);
  assert.doesNotMatch(source, /slider\("numerals\.size", "Size"/);
});
