// The second watch, the Time Keeper × Nivada (v3.5.0), run from the real
// source: its case, the photograph the dial is drawn into, the design its
// Start card opens, and that it has no calendar. The page itself (the Start
// row, opening the design, the photograph view) was checked with Playwright.
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
  assert.equal(design.minute.on, true);
  // every radial figure fits the Ø27.50 opening
  assert.ok(n.radius + n.size / 2 < K.opening / 2);
  assert.ok(design.sHand.length < K.opening / 2);
});

test('Start lists both watches, in English and Arabic, and a first visit still opens the NOREL', () => {
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
