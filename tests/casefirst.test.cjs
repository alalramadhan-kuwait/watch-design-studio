// v4.0.0: the Case comes first, the real photographs, and the F77 drawn as
// itself. Run from the real source: the seven steps and where a reload of an
// older record lands, the words in both languages, which choices the
// photograph can show, and the F77's measured figures. The page itself (the
// new step 1 in English and Arabic, the cards in their photographs, a metal
// staying on the photograph, "Show the real photo", and the F77 drawn beside
// its photograph) was checked with Playwright in Chromium at iPhone 15 size.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const guide = chunk('/* GUIDED MODE — see the stylesheet note above.', '</script>');
const strings = chunk('const GSTR = {en:{', 'const GWORD = {ar:{');

test('seven steps, the Case first, and no Start step left behind', () => {
  assert.match(guide, /const STEPS = \["case","dial","markers","hands","text","calendar","finish"\]/);
  assert.doesNotMatch(guide, /\bstart\(\)\{/, 'no Start view');
  assert.doesNotMatch(strings, /"step\.start"|"lead\.start"/);
  assert.match(guide, /gResumeStep\(rec, Date\.now\(\), 7\)/);
  // a record kept by 3.x counted Start as step 0: it moves down one
  assert.match(guide, /if\(rec\.v !== 4\)\{ rec\.step = Math\.max\(0, \(\+rec\.step \|\| 0\) - 1\); rec\.seen = rec\.seen\.map\(i => i - 1\)\.filter\(i => i >= 0\); rec\.v = 4; \}/);
  // opening a design stays on the Case step; Continue goes back to the step left
  assert.match(guide, /step = 0; rec\.step = 0;/);
  assert.match(guide, /data-gcontinue="\$\{back\}"/);
});

test('the Case step carries what Start did: your watches, the language, Start from…', () => {
  const block = chunk('  function watchesBlock(){', '\n  const VIEW = {');
  for (const s of ['data-gstart="${esc2(c.id)}"', 'data-glang="${l}"', 'id="gStartFrom" data-gdo="startAll"', 'gT("start.continue")', 'versions'])
    assert.ok(block.includes(s), s);
  assert.match(guide, /return watchesBlock\(\) \+ `<h3>\$\{gT\("case\.cases"\)\}<\/h3>/);
  // and Start from… is in More as well
  assert.match(guide, /slots\.prepend\(mobileStart\)/);
});

test('the F77 is named for what it is, in both languages', () => {
  assert.match(strings, /"case\.tk":"Nivada F77 · Time Keeper"/);
  assert.match(strings, /"case\.tk":"نيفادا F77 · تايم كيبر"/);
  for (const k of ['photo.show', 'photo.changed', 'photo.again', 'start.from', 'start.fromSub', 'start.fromHint', 'case.cases'])
    assert.equal((strings.match(new RegExp('"' + k.replace('.', '\\.') + '":', 'g')) || []).length, 2, k + ' in English and Arabic');
});

test('the photograph stays on for what it can show, and only then', () => {
  const ctx = vm.createContext({});
  vm.runInContext(chunk('const LUX_GOLD = {', '/* Two-tone in the Rolesor way')
    + '\nconst isHex = c => /^#[0-9a-f]{6}$/i.test(c || "");\n'
    + chunk('  const steelish = m =>', '  /* the whole design as its photograph can show it */')
    + '\nthis.t = {photoShows, LUX_STEEL, LUX_GOLD};', ctx);
  const { photoShows, LUX_STEEL, LUX_GOLD } = ctx.t;
  const TK = { photoFile: 'x', photoOwn: { finish: 'brushed', strapColor: '#1E1E20' }, bracelet: false };
  const NOREL = { photoFile: 'y', photoOwn: { finish: 'polished' }, bracelet: true, photoParts: {} };
  for (const K of [TK, NOREL]) {
    assert.equal(photoShows(K, 'ui.metal', LUX_STEEL), true, 'steel');
    assert.equal(photoShows(K, 'ui.metal', '#C8CBCF'), true, 'the design files\' steel, a shade off');
    assert.equal(photoShows(K, 'ui.metal', '#3B3D42'), false, 'black');
    assert.equal(photoShows(K, 'case.finish', 'satin'), false);
    assert.equal(photoShows(K, 'case.finish', K.photoOwn.finish), true, 'its own finish');
    assert.equal(photoShows(K, 'case.strap', false), false);
  }
  // gold and two-tone are laid onto the NOREL photograph, which has its parts measured, not the F77's
  assert.equal(photoShows(NOREL, 'ui.metal', 'two:rose gold'), true);
  assert.equal(photoShows(NOREL, 'ui.metal', LUX_GOLD['yellow gold']), true);
  assert.equal(photoShows(TK, 'ui.metal', 'two:rose gold'), false);
  assert.equal(photoShows(TK, 'ui.metal', LUX_GOLD['rose gold']), false);
  // the F77 is photographed on its black strap; the NOREL on its bracelet, which no strap colour changes
  assert.equal(photoShows(TK, 'case.strapColor', '#1e1e20'), true);
  assert.equal(photoShows(TK, 'case.strapColor', '#4E3629'), false);
  assert.equal(photoShows(NOREL, 'case.strapColor', '#4E3629'), true);
  // the button, on the stage, whenever a photographed case is drawn
  assert.match(guide, /photoBtn\.id = "gPhotoBtn"/);
  // (since 4.2.0 every case with a photograph, the Vernoy's built-in one included; not on R3 or Concept D, which have their own note)
  assert.match(guide, /front && !old && hasPhoto\(K\) && \(!S\.tpl\.on \|\| photoPlan\(S, K\) === false\)/);
});

test('cards show a photographed case in its photograph, with its own ids', () => {
  assert.match(guide, /buildTemplate\(st, \{tag:"pt" \+ n, insTag:"pi" \+ n, material:false\}\)/);
  assert.match(source, /tag:o\.insTag \|\| "ins", matPx:o\.matPx, material:o\.material\}/, 'the main view keeps "ins"');
});

test('the F77 is drawn as an octagon measured off its photograph', () => {
  const ctx = vm.createContext({});
  vm.runInContext(chunk('const VERNOY_CASE = {', 'const CASE_SPEC = new Proxy') + '\nthis.K = TK_NIVADA;', ctx);
  const K = ctx.K, F = K.f77, Z = F.bezel, B = F.body;
  assert.equal(K.outline, 'f77');
  assert.equal(K.shape, 'round', 'still a round opening for everything else that asks');
  assert.ok(Math.abs(2 * Z.h - K.bezelOD) < 0.2, 'the sides are the Ø36.0 across the flats');
  assert.ok(Z.d < Z.h && Z.h < Z.v, 'short diagonals, the sides a little in from the top and bottom');
  assert.ok(Z.flat / 2 > K.bezelID / 2 && Z.flat / 2 < Z.h - Z.chamfer, 'the brushed top runs between the bevel and the chamfer');
  // the side curve meets the flank where they are said to
  const arc = B.bulge - (B.sideR - Math.sqrt(B.sideR ** 2 - B.sideY ** 2));
  assert.ok(Math.abs(arc - B.sideX) < 0.02, String(arc));
  assert.ok(B.top > Z.v && B.lugEnd * 2 < K.lugToLug, 'the lug ends inside 45.00 lug to lug');
  // every screw head on the brushed top, clear of the chamfer and of the bevel to the crystal
  const S = F.screws, heads = [[S.along, Z.v - S.inTop], [Z.h - S.inSide, S.along]];
  for (const [x, y] of heads) {
    assert.ok(Math.hypot(x, y) - S.d / 2 > Z.flat / 2, 'outside the bevel');
    assert.ok(Math.max(x, y) + S.d / 2 < Math.max(Z.h, Z.v) - Z.chamfer, 'inside the chamfer');
  }
  assert.ok(F.crown.x0 < B.bulge && F.crown.x1 - F.crown.x0 > 2.5, 'the crown stands out of the case at 3');
  assert.deepEqual({ ...K.photoOwn }, { finish: 'brushed', strapColor: '#1E1E20' });
  // drawn by its own function, picked where the round case is
  assert.match(source, /\(K\.outline === "f77" \? f77Case : roundCase\)\(\);/);
  assert.doesNotMatch(chunk('  const f77Case = () => {', '  /* ---------------- CASE + STRAP (RD26-0172'), /filter=/, 'no SVG filters');
});
