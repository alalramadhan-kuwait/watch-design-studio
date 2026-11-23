// How the dial's lines are made (v4.6.0): the line under the logo, the line
// above 6 and the words either side of 6 can each be printed, raised print,
// engraved and filled, engraved tone on tone, gloss on matte, brushed across
// the dial's grain, or UV ink; the minute track and printed batons take the
// cut and gloss ones. Run from the real source. The drawing itself was
// checked with Playwright (Chromium, iPhone 15 with touch and a 2000 x 1050
// desktop): TIME KEEPER on the Time Keeper x Nivada in each technique at
// light angles 45, 135, 270 and 360, and every preset and file in designs/
// was compared byte for byte with 4.5.0 (buildSVG and buildTemplate).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };

const consts = chunk("/* How the dial's lettering, a printed minute track and printed batons can", 'function buildSVG(st, o={}){');
const C = vm.createContext({});
vm.runInContext(consts + '\nthis.r={LINE_TECH,LINE_TECH_IDS,MINUTE_TECH,LINE_TECH_LIT,INDEX_TECH_STYLES,LINE_BRUSHED_FINISH,lineTechsUsed};', C);
const R = C.r;
const madeBy = chunk('    const madeBy = (tech, art, mo) => {', '    // minute track');
const textPart = chunk('      const lineInk = tx.lineColor || tx.color;', '    /* Closes the layer group opened above.');

test('seven ways to make a line, printed first, and the track and batons take four of them', () => {
  assert.deepEqual([...R.LINE_TECH_IDS], ['printed', 'double printed', 'engraved + filled', 'engraved', 'gloss on matte', 'brushed across', 'uv ink']);
  assert.deepEqual([...R.MINUTE_TECH], ['engraved + filled', 'engraved', 'gloss on matte']);
  for (const t of R.MINUTE_TECH) assert.ok(R.LINE_TECH_IDS.includes(t));
  // the full editor offers the same values, in the same order
  for (const k of ['line2Tech', 'footTech', 'splitTech'])
    assert.match(source, new RegExp(`SEL\\("text\\.${k}","[^"]+",\\["printed","double printed","engraved \\+ filled","engraved","gloss on matte","brushed across","uv ink"\\]\\)`));
  assert.match(source, /SEL\("minute\.tech","Made by",\["printed","double printed","engraved \+ filled","engraved","gloss on matte"\]\)/);
  assert.match(source, /SEL\("indices\.tech","Made by",\["printed","engraved \+ filled","engraved","gloss on matte"\]\)/);
});

test('only the lines the dial shows, and made some other way than printed, count as used', () => {
  const T = { on: true, line2: 'GRENCHEN', line2On: true, foot: 'TIME KEEPER', footOn: true, split: 'SWISS MADE', splitOn: true };
  assert.deepEqual([...R.lineTechsUsed({ text: T })], [], 'an older design: everything printed');
  assert.deepEqual([...R.lineTechsUsed({ text: { ...T, footTech: 'engraved', line2Tech: 'printed', splitTech: 'uv ink' } })], ['engraved', 'uv ink']);
  assert.deepEqual([...R.lineTechsUsed({ text: { ...T, footTech: 'engraved', footOn: false } })], [], 'a line turned off');
  assert.deepEqual([...R.lineTechsUsed({ text: { ...T, footTech: 'engraved', on: false } })], [], 'the text layer off');
  assert.deepEqual([...R.lineTechsUsed({ text: { ...T, footTech: 'no such way' } })], [], 'an unknown value draws printed');
});

test('a printed line is drawn by exactly the call it always was', () => {
  assert.match(textPart, /if\(tch === "printed"\) body\.push\(line\(tx\.line2, tx\.line2Y, tx\.line2Size, tx\.line2Curve, letterFam\(tx\.line2Font, "sans", defs\), 0\.14\)\);/);
  assert.match(textPart, /if\(tch === "printed"\) body\.push\(line\(tx\.foot, {2}tx\.footY, {2}tx\.footSize, {2}tx\.footCurve, {2}letterFam\(tx\.footFont, "sans", defs\), 0\.22\)\);/);
  assert.match(textPart, /ink = stch === "printed" \? tx\.lineColor \|\| tx\.color : "inherit"/);
  assert.match(textPart, /if\(stch !== "printed"\)/);
});

test('every technique is shapes, offset copies and masks: no SVG filter, which WebKit drops in the photograph', () => {
  assert.doesNotMatch(madeBy, /filter=|<filter|fe[A-Z]/);
  assert.match(madeBy, /<mask id=/);
  // the scene's light: its direction and its height
  assert.match(madeBy, /st\.render && st\.render\.az/);
  assert.match(madeBy, /st\.render && st\.render\.el/);
  // the cut's dark wall is on the light's side (+L), the lit one opposite
  assert.match(madeBy, /use\(dark, 0, 0, minus\(-lx\*s, -ly\*s\)/);
  assert.match(madeBy, /use\(lite, 0, 0, minus\(lx\*h, ly\*h\)/);
  // brushed across falls back to tone on tone on a dial that is not brushed
  assert.match(madeBy, /if\(tech === "brushed across" && !LINE_BRUSHED_FINISH\.has\(st\.dial\.finish\)\) tech = "engraved";/);
  assert.deepEqual([...R.LINE_BRUSHED_FINISH], ['brushed', 'brushedsteel']);
  // UV ink: nothing by daylight, the glow only with the lamp on, and a colour of its own in the dial maker's artwork
  assert.match(madeBy, /if\(scope === "dial"\) return use\(UV_ART\);\s*if\(!\(st\.render && st\.render\.uv\)\) return "";/);
  assert.match(source, /if\(uvGlow\.length\)\{/);
});

test('the minute track and the batons go through the same drawing, beads and applied parts excepted', () => {
  assert.match(source, /const mtech = MINUTE_TECH\.indexOf\(mt\.tech\) >= 0 && mt\.style !== "beads" \? mt\.tech : "";/);
  assert.match(source, /const tcol = mtech \? "inherit" : mt\.color/);
  assert.match(source, /const ixTech = ix\.on && !ix\.applied && !\(ix\.metal && METALS\[ix\.metal\]\)/);
  assert.deepEqual([...R.INDEX_TECH_STYLES].sort(), ['baton', 'dagger', 'diamond', 'dot', 'double', 'triangle']);
});

/* simple mode's words */
const G = vm.createContext({});
vm.runInContext(chunk('/* GUIDE-PURE-BEGIN', '/* GUIDE-PURE-END */') + '\nthis.g={GSTR,gT,gW,GWORD,G_MORE,G_MORE_LABEL,gOptLabel,G_CHECK_WORDS,G_CHECK_AR};', G);
const W = G.g;
const AR = /[؀-ۿ]/;
const lang = l => vm.runInContext(`GLANG = ${JSON.stringify(l)}`, G);

test('Text -> Lines: a Made by row under each line, the light angle and the UV lamp, all in Arabic too', () => {
  const guide = chunk('      if(tab === "lines"){', '      const blk = printingBlock("text");');
  for (const k of ['text.line2Tech', 'text.footTech', 'text.splitTech']) assert.match(guide, new RegExp(`madeChips\\("${k.replace('.', '\\.')}"\\)`));
  assert.match(guide, /slider\("render\.az", "Light angle", 0, 360, 1,/);
  assert.match(guide, /toggle\("render\.uv", "Show under UV", !!S\.render\.uv\)/);
  lang('ar');
  try {
    for (const [, l] of R.LINE_TECH) assert.match(W.gW(l), AR, l);
    for (const w of ['Made by', 'Light', 'Light angle', 'Show under UV', 'How the lines are made', 'Under the logo, made by', 'Above 6, made by', 'Either side of 6, made by'])
      assert.match(W.gW(w), AR, w);
    for (const k of ['text.lightNote', 'text.brushNote', 'text.faintNote', 'text.uvNote']) assert.match(W.gT(k), AR, k);
  } finally { lang('en'); }
  for (const k of ['text.lightNote', 'text.brushNote', 'text.faintNote', 'text.uvNote']) assert.doesNotMatch(W.gT(k), AR, k);
  // not repeated in a More section since 4.47.0: the Lines tab is where they are
  assert.equal(W.G_MORE.text.find(s => s.id === 'linesmade'), undefined);
  assert.equal(W.gOptLabel('text.footTech', 'engraved'), 'Engraved, tone on tone');
  assert.equal(W.gOptLabel('text.footTech', 'engraved + filled'), 'Engraved and filled');
  assert.equal(W.gOptLabel('text.footTech', 'uv ink'), 'UV ink');
  assert.ok(W.G_MORE.markers.find(s => s.id === 'indices').paths.includes('indices.tech'));
});

/* the design check */
const reports = vm.createContext({ hex2rgb: h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), f: (n, d) => Number(n).toFixed(d), visR: s => s.case.opening / 2 });
vm.runInContext(consts + chunk('const HAND_MATERIAL = {', 'const POMME = {') + chunk('const HAND_REACH = [', 'const HAND_SHARE = [')
  + chunk('  function contrast(a,b)', '  function brief()') + '\nthis.checks=checks;', reports);
const fixture = () => ({ case: { locked: true, opening: 30.5 }, dial: { diameter: 31.3, color: '#DDDFE1', finish: 'brushedsteel' }, hHand: { on: true, length: 8, color: '#111111' },
  mHand: { on: true, length: 12, color: '#111111' }, sHand: { on: false }, numerals: { on: false }, indices: { on: false }, minute: { on: false }, date: { on: false },
  text: { on: true, foot: 'TIME KEEPER', footOn: true, line2: 'GRENCHEN', line2On: true, split: 'SWISS MADE', splitOn: true } });
const rowsOf = s => JSON.parse(JSON.stringify(reports.checks(s).filter(r => /lettering|UV ink/.test(r.title)).map(r => [r.title, r.ok])));

test('the design check: engraving needs metal, tone on tone and gloss may be faint, UV ink needs the supplier', () => {
  assert.deepEqual(rowsOf(fixture()), [], 'printed lines add nothing');
  const s = fixture(); s.text.footTech = 'engraved + filled';
  assert.deepEqual(rowsOf(s), [['Engraved lettering', true]], '0.40 mm brass is fine for about 0.05 mm');
  assert.match(reports.checks(s).find(r => r.title === 'Engraved lettering').detail, /0\.40 mm brass is fine/);
  s.text.footTech = 'engraved'; s.text.line2Tech = 'gloss on matte';
  assert.deepEqual(rowsOf(s), [['Engraved lettering', true], ['Faint lettering', false]]);
  const u = fixture(); u.text.splitTech = 'uv ink';
  assert.deepEqual(rowsOf(u), [['UV ink', false]]);
  const b = fixture(); b.text.footTech = 'brushed across';
  assert.deepEqual(rowsOf(b), [['Brushed lettering', true]]);
  b.dial.finish = 'matte';
  assert.deepEqual(rowsOf(b), [['Brushed lettering', false]], 'shown as tone on tone instead');
  const t = fixture(); t.minute = { on: true, style: 'ticks', tech: 'gloss on matte' };
  assert.deepEqual(rowsOf(t), [['Faint lettering', false]], 'the track counts too');
  // every row has its plain words in both languages
  for (const k of ['Engraved lettering', 'Faint lettering', 'Brushed lettering', 'UV ink']) {
    assert.ok(W.G_CHECK_WORDS[k], k); assert.match(W.G_CHECK_AR[k], AR, k);
  }
});
