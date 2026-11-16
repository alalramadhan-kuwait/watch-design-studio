// The second watch, the Time Keeper × Nivada (v3.5.0, its logo and split
// SWISS MADE from v3.6.0), run from the real
// source: its case, the photograph the dial is drawn into, the design its
// card opens, and that it has no calendar. The page itself (the "Your
// watches" row on the Case step, opening the design, the photograph view)
// was checked with Playwright. Its drawn F77 case is in casefirst.test.cjs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(chunk('const VERNOY_CASE = {', 'const CASE_SPEC = new Proxy')
  + '\nthis.r={CASES,CASE_MODELS,caseOf,TK_NIVADA,NOREL_R4,VERNOY_CASE};', ctx);
const { CASES, CASE_MODELS, caseOf, TK_NIVADA: K, NOREL_R4, VERNOY_CASE } = ctx.r;
const design = JSON.parse(fs.readFileSync(path.join(root, 'designs/timekeeper-nivada.json'), 'utf8'));

/* the pixel size of a JPEG, from its frame header */
function jpegSize(buf){
  assert.equal(buf.readUInt16BE(0), 0xFFD8, 'a JPEG');
  let i = 2;
  while (i < buf.length) {
    const m = buf.readUInt16BE(i), len = buf.readUInt16BE(i + 2);
    if (m >= 0xFFC0 && m <= 0xFFCF && m !== 0xFFC4 && m !== 0xFFC8 && m !== 0xFFCC) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  throw new Error('no frame header');
}

test('the Time Keeper × Nivada is a case of its own, beside the NOREL', () => {
  assert.equal(CASES[K.model], K);
  assert.ok(CASE_MODELS.includes(K.model) && CASE_MODELS.includes(NOREL_R4.model));
  assert.equal(caseOf({ case: { model: K.model } }), K);
  assert.equal(caseOf({ case: { model: 'no such case' } }), VERNOY_CASE, 'an unknown case still falls back to the Vernoy');
  assert.equal(K.shape, 'round');
  // the published F77 37 mm figures
  assert.equal(K.flat, 37.0); assert.equal(K.lugToLug, 45.0); assert.equal(K.height, 12.6); assert.equal(K.wr, '10 ATM');
  // surfaces stack outside in, and the crystal opening sits inside the bezel
  assert.ok(K.opening < K.bezelID && K.bezelID < K.bezelOD && K.bezelOD <= K.flat);
  assert.ok(K.opening < K.dialD, 'the dial blank runs under the opening');
  // a strap, a plain bezel with eight screws
  assert.equal(K.bracelet, false); assert.equal(K.flutes, 0); assert.equal(K.screws, 8);
  assert.match(source, /estimate/, 'the estimated figures say so');
});

test('it has no calendar: no day or date window, no cyclops, and the design shows none', () => {
  assert.equal(K.calendar, undefined);
  assert.equal(K.cyclops, undefined);
  assert.equal(design.date.on, false);
  assert.equal(design.day.on, false);
  assert.equal(design.date.cyclops, 'none');
});

test('the case photograph is 2:3, 1040 × 1560, and its opening is measured inside the picture', () => {
  const C = K.photoCal;
  assert.equal(K.photoFile, './app/case-timekeeper-nivada.jpg');
  const img = fs.readFileSync(path.join(root, K.photoFile));
  assert.deepEqual(jpegSize(img), { w: 1040, h: 1560 });
  assert.equal(C.w, 1040); assert.equal(C.h, 1560);
  assert.ok(Math.abs(C.cx - 50) < 1, 'centred across');
  assert.ok(C.cy > 40 && C.cy < 60, 'near the middle down');
  // the opening lies wholly inside the picture, and is a believable share of it
  const r = C.dia / 2 * C.w / 100, x = C.cx * C.w / 100, y = C.cy * C.h / 100;
  assert.ok(x - r > 0 && x + r < C.w && y - r > 0 && y + r < C.h);
  assert.ok(C.dia > 50 && C.dia < 70, String(C.dia));
  // and the scale it implies puts the 37 mm case at about four fifths of the width
  const pxmm = C.w * C.dia / 100 / K.opening;
  assert.ok(Math.abs(pxmm * K.flat / C.w - 0.79) < 0.03, String(pxmm * K.flat / C.w));
  assert.ok(img.length < 400e3, 'small enough to cache');
});

test('the design opens on that case with the dial of the reference render', () => {
  assert.equal(design.case.model, K.model);
  assert.equal(design.case.opening, K.opening);
  assert.equal(design.tpl.on, true, 'shown in the photograph');
  assert.equal(design.case.strap, true);
  const n = design.numerals;
  assert.equal(n.system, 'arabic ٠–٩'); assert.equal(n.set, 'all', 'all twelve hours, 12 and 3 included');
  assert.equal(n.tech, 'applied'); assert.equal(n.material, 'metal'); assert.equal(n.metal, 'rose gold');
  for (const k of ['hHand', 'mHand', 'sHand']) { assert.equal(design[k].on, true); assert.equal(design[k].material, 'rose gold'); }
  assert.ok(design.sHand.tail >= 3, 'a long seconds tail');
  assert.equal(design.text.logo, 'Nivada'); assert.equal(design.text.logoMetal, 'rose gold');
  assert.equal(design.text.line2, 'GRENCHEN'); assert.equal(design.text.foot, 'TIME KEEPER');
  // the reference dial has no minute track and no hour ticks: only the numerals
  assert.equal(design.minute.on, false); assert.equal(design.hour.on, false); assert.equal(design.indices.on, false);
  // every radial figure fits the Ø27.50 opening
  assert.ok(n.radius + n.size / 2 < K.opening / 2);
  assert.ok(design.sHand.length < K.opening / 2);
});

test('the Case step lists both watches, in English and Arabic, and a first visit still opens the NOREL', () => {
  const guide = chunk('/* GUIDED MODE — see the stylesheet note above.', '</script>');
  assert.match(guide, /fetch\("\.\/designs\/timekeeper-nivada\.json"\)/);
  assert.match(guide, /id === "tk-nivada" && tkRef/);
  assert.match(guide, /gT\("start\.yours"\)/);
  const first = chunk('  function firstOpen(){', '\n  }\n');
  assert.match(first, /noreRef/); assert.doesNotMatch(first, /tkRef/);
  const strings = chunk('const GSTR = {en:{', 'const GWORD = {ar:{');
  for (const k of ['start.yours', 'card.tk', 'card.tkSub', 'case.tk', 'case.tkSub']) {
    assert.equal((strings.match(new RegExp('"' + k.replace('.', '\\.') + '":', 'g')) || []).length, 2, k + ' in English and Arabic');
  }
  assert.match(strings, /"card\.tk":"تايم كيبر × نيفادا"/);
});

test('the photograph and the design are held for offline use', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /"\.\/app\/case-timekeeper-nivada\.jpg"/);
  assert.match(sw, /"\.\/designs\/timekeeper-nivada\.json"/);
});

test('simple mode is chosen before the page draws, so the full editor never shows first', () => {
  const head = source.indexOf('<body>'), main = source.indexOf('\n<script>\n', head);
  const early = source.slice(head, source.indexOf('</script>', head));
  assert.match(early, /localStorage\.getItem\("wds:ui"\)\|\|"guided"\)==="guided"\)document\.body\.classList\.add\("guided"\)/);
  assert.ok(source.indexOf('document.body.classList.add("guided")') < main, 'before the main script');
  // the rules that hide the full editor are in the head, ahead of anything drawn
  const headCss = source.slice(0, head);
  assert.match(headCss, /body\.guided \.shell > \.rail, body\.guided \.shell > \.props\{ display:none \}/);
  assert.match(headCss, /body\.guided #mBody > \.rail, body\.guided #mBody > \.props\{ display:none !important \}/);
});

// ---- v3.6.0: Nivada's shield and script, and text split either side of 6 ----
const NIVADA = ['Nivada shield + script', 'Nivada shield', 'Nivada script'];
test('the Nivada marks are built-in vector marks: defined, closed, and inside their own box', () => {
  for (const k of NIVADA) {
    const m = source.match(new RegExp('LOGO_MARKS\\["' + k.replace(/[+]/g, '\\+') + '"\\] = \\{w:([\\d.]+), d:"(M[^"]+)"\\}'));
    assert.ok(m, k + ' is defined');
    const w = +m[1], d = m[2];
    assert.ok(w > 0 && d.endsWith('Z'), k + ' has a width and ends closed');
    // every outline that is started is closed, and nothing but absolute moves, lines and curves is used
    assert.equal((d.match(/M/g) || []).length, (d.match(/Z/g) || []).length, k + ': each outline is closed');
    assert.doesNotMatch(d, /[a-yA-BD-KN-PR-Y]/, k + ': only M, L, C, Q and Z');
    // the end points sit in the mark's box: 100 units high, w wide, centred on the origin
    const ends = [...d.matchAll(/([MLCQ])([^MLCQZ]+)/g)].map(x => x[2].trim().split(/[\s,]+|(?=-)/).filter(Boolean).map(Number).slice(-2));
    for (const [x, y] of ends) {
      assert.ok(Math.abs(y) <= 50.5, `${k}: y ${y} inside the 100-unit height`);
      assert.ok(Math.abs(x) <= w / 2 + 0.5, `${k}: x ${x} inside the ${w} width`);
    }
  }
  // the shield has its rim, groove, field, the W's groove and the W: five outlines
  const sh = source.match(/LOGO_MARKS\["Nivada shield"\] = \{w:[\d.]+, d:"([^"]+)"/)[1];
  assert.equal((sh.match(/M/g) || []).length, 5);
  // added after the NOREL marks, so no older mark moves in the list
  assert.ok(source.indexOf('LOGO_MARKS["NOREL wordmark"]') < source.indexOf('LOGO_MARKS["Nivada shield + script"]'));
  assert.ok(source.indexOf('LOGO_MARKS["Nivada script"]') < source.indexOf('const LOGO_MARK_IDS'));
});

const splitCtx = vm.createContext({});
vm.runInContext(chunk('const AR_CHARS = ', 'const arText')
  + 'const letterFam = () => "sans";\n'
  + chunk('const runWidth = (() => {', 'const pt = (r,deg)')
  + '\nthis.s={splitWords,splitPlace,splitLine};', splitCtx);
const { splitWords, splitPlace, splitLine } = splitCtx.s;
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

test('the split line breaks at a bar, a middle dot or the middle space, and Arabic reads from the right', () => {
  assert.deepEqual([...splitWords('SWISS MADE')], ['SWISS', 'MADE']);
  assert.deepEqual([...splitWords('SWISS · MADE')], ['SWISS', 'MADE']);
  assert.deepEqual([...splitWords('MADE IN | SWITZERLAND')], ['MADE IN', 'SWITZERLAND']);
  assert.deepEqual([...splitWords('SWISS MADE QUARTZ MOVT')], ['SWISS MADE', 'QUARTZ MOVT']);
  assert.deepEqual([...splitWords('AUTOMATIC')], ['AUTOMATIC', '']);
  assert.deepEqual([...splitWords('  ')], ['', '']);
  // the first word of an Arabic line is the one on the right of the 6
  assert.deepEqual([...splitWords('صنع سويسري')], ['سويسري', 'صنع']);
});

test('split text sits symmetric about 6: mirrored places, the same radius, and the same gap to the 6', () => {
  for (const [r, gap] of [[12.85, 2.0], [10, 0.5], [13.5, 4]]) {
    // equal words mirror exactly
    const [L, R] = splitPlace([2, 2], r, gap);
    near(L.x, -R.x, 'x mirrored'); near(L.y, R.y, 'same height'); near(L.rot, -R.rot, 'turned opposite ways');
    near(L.deg + R.deg, 360, 'clock angles mirror about 6'); assert.ok(L.x < 0 && R.x > 0 && L.y > 0, 'left and right of the 6, below centre');
    near(Math.hypot(L.x, L.y), r, 'on the chosen circle'); near(Math.hypot(R.x, R.y), r, 'on the chosen circle');
    assert.ok(L.deg > 180 && R.deg < 180, 'SWISS toward 7, MADE toward 5');
    // unequal words keep the same clear space either side of the 6
    const w = [2.4, 1.6], [A, B] = splitPlace(w, r, gap);
    near((A.deg - 180) * Math.PI / 180 * r - w[0] / 2, gap, 'gap on the left');
    near((180 - B.deg) * Math.PI / 180 * r - w[1] / 2, gap, 'gap on the right');
    // laid along the circle, each word is turned by its own angle from the 6
    near(A.rot, A.deg - 180, 'left word leans with the circle'); near(B.rot, B.deg - 180, 'right word leans with the circle');
  }
  // off, empty or switched off as a whole, it draws nothing
  assert.equal(splitLine({ on: true, splitOn: false, split: 'SWISS MADE', splitSize: 0.6 }).length, 0);
  assert.equal(splitLine({ on: true, splitOn: true, split: '', splitSize: 0.6 }).length, 0);
  assert.equal(splitLine({ on: false, splitOn: true, split: 'SWISS MADE', splitSize: 0.6 }).length, 0);
  const two = splitLine({ on: true, splitOn: true, split: 'SWISS MADE', splitSize: 0.6, splitR: 12.85, splitGap: 2 });
  assert.deepEqual([...two].map(p => p.t), ['SWISS', 'MADE']);
  assert.ok(two.every(p => p.r === 12.85 && p.size === 0.6));
});

test('the split line is drawn without a filter, and is offered in the full editor and simple mode in both languages', () => {
  const draw = chunk('const split = splitLine(tx);', '\n    }\n');
  assert.doesNotMatch(draw, /filter/);
  assert.match(draw, /rotate\(/); assert.match(draw, /splitCurve === false/);
  // the track and the pavé both leave room for it
  assert.match(source, /for\(const p of splitLine\(tx\)\) out\.push\(\{deg: p\.deg/);
  assert.match(source, /for\(const p of splitLine\(tx\)\)\{\n\s+const hh/);
  // the full editor
  const schema = chunk('const SCHEMA = {', '\nlet swGroup');
  for (const k of ['text.splitOn', 'text.split"', 'text.splitFont', 'text.splitSize', 'text.splitR', 'text.splitGap', 'text.splitCurve'])
    assert.ok(schema.includes('"' + k.replace(/"$/, '') + '"'), k + ' in the schema');
  // simple mode's Text step, with its words in English and Arabic
  const guide = chunk('/* GUIDED MODE — see the stylesheet note above.', '</script>');
  assert.match(guide, /textIn\("text\.split", gT\("text\.field"\)/);
  assert.match(guide, /else if\(path === "text\.split"\)\{ S\.text\.split = v; S\.text\.splitOn = !!v; \}/);
  const strings = chunk('const GSTR = {en:{', 'const GWORD = {ar:{');
  assert.match(strings, /"text\.split6":"Split either side of 6"/);
  assert.match(strings, /"text\.split6":"مقسوم حول ٦"/);
  const words = chunk('const GWORD = {ar:{', 'const gW = ');
  for (const w of ['Space either side of 6', 'Lean with the curve', 'Distance from centre', ...NIVADA]) assert.match(words, new RegExp('"' + w.replace(/[+]/g, '\\+') + '":"[^"]*[؀-ۿ]'), w + ' has its Arabic');
  // off by default, so no other design changes
  assert.match(source, /splitOn:false, split:"SWISS MADE"/);
});

test('the Time Keeper × Nivada uses all three: the shield over the script, GRENCHEN under it, SWISS MADE split round the 6', () => {
  const t = design.text;
  assert.equal(t.logoMark, 'Nivada shield + script');
  assert.equal(t.logoTech, 'applied metal'); assert.equal(t.logoMetal, 'rose gold');
  assert.equal(t.line2, 'GRENCHEN'); assert.ok(t.line2Y > t.logoY, 'GRENCHEN under the lock-up');
  assert.ok(t.logoY + t.logoSize / 2 < t.line2Y - t.line2Size / 2, 'the lock-up clears GRENCHEN');
  assert.equal(t.splitOn, true); assert.equal(t.split, 'SWISS MADE'); assert.equal(t.splitCurve, true);
  const [L, R] = splitLine(t);
  assert.equal(L.t, 'SWISS'); assert.equal(R.t, 'MADE');
  // near the edge, outside the numerals and inside the opening
  assert.ok(t.splitR > design.numerals.radius && t.splitR + t.splitSize / 2 < K.opening / 2);
  assert.ok(t.splitR > t.footY, 'below TIME KEEPER');
});
