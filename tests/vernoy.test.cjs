// v4.2.0: the Vernoy as the third of your watches, on its built-in
// photograph; a way off the earlier NOREL drawings; and a brushed steel
// dial, which the Time Keeper × Nivada now wears. Run from the real source.
// The page itself (step 1 with three watches in English and Arabic, the
// Vernoy opened on its photograph, its case card, the note on R3 and
// Concept D, the Surface chips and the Nivada dial beside its reference)
// was checked with Playwright in Chromium at iPhone 15 size, with touch.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const guide = chunk('/* GUIDED MODE — see the stylesheet note above.', '</script>');
const strings = chunk('const GSTR = {en:{', 'const GWORD = {ar:{');
const words = chunk('const GWORD = {ar:{', '\n};');
const design = JSON.parse(fs.readFileSync(path.join(root, 'designs/timekeeper-nivada.json'), 'utf8'));

const cases = vm.createContext({});
vm.runInContext(chunk('const VERNOY_CASE = {', 'const CASE_SPEC = new Proxy')
  + chunk('const tplAvail = st =>', 'const caseOutlinePath')
  + '\nthis.r={CASES,CASE_MODELS,VERNOY_CASE,NOREL_R3,NOREL_D,NOREL_R4,TK_NIVADA,hasPhoto};', cases);
const C = cases.r;

test('every case has a photograph, the Vernoy its built-in one', () => {
  for (const m of C.CASE_MODELS) assert.equal(C.hasPhoto(C.CASES[m]), true, m);
  assert.equal(C.VERNOY_CASE.photoFile, undefined, 'the Vernoy keeps no file of its own');
  assert.equal(C.VERNOY_CASE.photo, true);
  assert.deepEqual({ ...C.VERNOY_CASE.photoOwn }, { finish: 'polished', strapColor: '#4E3629', strap: 'brown' });
  assert.equal(C.hasPhoto(null), false);
  // every place v4.0.0 asked photoFile now asks hasPhoto, except where the file itself is read
  for (const s of ['if(!hasPhoto(K) || !st.tpl || !st.tpl.on || !tplAvail(st)', 'hasPhoto(caseOf(st)) && st.tpl && st.tpl.on',
    'if(!hasPhoto(K) || S.tpl.on) return thumb', 'if(hasPhoto(K)){ h += toggle("tpl.on"', 'if(!hasPhoto(K)) return false;', 'if(!hasPhoto(K)) return;',
    'if(hasPhoto(K0) && photoOn', 'if(S.tpl.on && hasPhoto(K) && photoPlan(S, K) === false)'])
    assert.ok(guide.includes(s), s);
  assert.match(source, /S\.tpl\.on = hasPhoto\(B\);/, 'picking a case shows its photograph');
  // the Vernoy's photograph is the built-in picture where the design lines it up, as the main view has it
  assert.match(guide, /C = K\.photoFile \? K\.photoCal : \{w:tplW, h:tplH, cx:st\.tpl\.cx, cy:st\.tpl\.cy, dia:st\.tpl\.dia\}/);
});

test('the Vernoy photograph keeps steel, polished and its brown strap, and nothing else', () => {
  const ctx = vm.createContext({});
  vm.runInContext(chunk('const LUX_GOLD = {', '/* Two-tone in the Rolesor way')
    + '\nconst isHex = c => /^#[0-9a-f]{6}$/i.test(c || "");\n'
    + chunk('  const steelish = m =>', '  /* the whole design as its photograph can show it */')
    + '\nthis.t = {photoShows, LUX_STEEL, LUX_GOLD};', ctx);
  const { photoShows, LUX_STEEL, LUX_GOLD } = ctx.t, V = C.VERNOY_CASE;
  assert.equal(photoShows(V, 'ui.metal', LUX_STEEL), true);
  assert.equal(photoShows(V, 'case.material', '#C8C9C7'), true, 'the design\'s own steel');
  assert.equal(photoShows(V, 'ui.metal', LUX_GOLD['yellow gold']), false);
  assert.equal(photoShows(V, 'ui.metal', 'two:rose gold'), false);
  assert.equal(photoShows(V, 'case.finish', 'polished'), true);
  assert.equal(photoShows(V, 'case.finish', 'brushed'), false);
  assert.equal(photoShows(V, 'case.strapColor', '#4e3629'), true);
  assert.equal(photoShows(V, 'case.strapColor', '#1E1E20'), false);
  assert.equal(photoShows(V, 'case.strap', false), false);
  // putting the strap back names it
  assert.match(guide, /gT\(own\.strap === "brown" \? "photo\.brownStrap" : "photo\.blackStrap"\)/);
});

test('the Vernoy is the third of your watches, opening the RD26-0172 design on its photograph', () => {
  const block = chunk('  function watchesBlock(){', '\n  const VIEW = {');
  const n = block.indexOf('id:"norel"'), t = block.indexOf('id:"tk-nivada"'), v = block.indexOf('id:"vernoy"');
  assert.ok(n > 0 && n < t && t < v, 'NOREL, Time Keeper × Nivada, Vernoy');
  assert.match(block, /n !== "Standard" && n !== VERNOY_DESIGN/, 'not listed again under Start from');
  assert.match(guide, /const VERNOY_DESIGN = "Vernoy — RD26-0172";/);
  assert.match(source, /"Vernoy — RD26-0172":\{\}/, 'the design is the base design');
  assert.match(source, /meta:\{name:"Vernoy — RD26-0172"/);
  const vs = chunk('  function vernoyState(){', '\n  }\n');
  assert.match(vs, /st\.case\.model = VERNOY_CASE\.model; st\.tpl\.on = true;/);
  assert.match(guide, /else if\(id === "vernoy"\) st = vernoyState\(\);/);
});

test('the new words are there in English and Arabic', () => {
  for (const k of ['card.vernoyRd', 'card.vernoyRdSub', 'photo.brownStrap', 'photo.toR4', 'photo.toR4Note', 'photo.onR4'])
    assert.equal((strings.match(new RegExp('"' + k.replace('.', '\\.') + '":', 'g')) || []).length, 2, k);
  assert.match(strings, /"card\.vernoyRd":"Vernoy RD26‑0172", "card\.vernoyRdSub":"Cushion · 36 mm"/);
  assert.match(strings, /"card\.vernoyRd":"فيرنوي RD26‑0172", "card\.vernoyRdSub":"وسادية · 36 ملم"/);
  assert.match(strings, /"photo\.toR4":"Switch to the 3 Nov case \(real photo\)"/);
  assert.match(source, /"Direction":"الاتجاه"/);
  for (const w of ['Brushed steel', 'Vertical', 'Horizontal', 'Circular'])
    assert.match(words, new RegExp('"' + w + '":"[^"]*[؀-ۿ]'), w);
});

test('an earlier NOREL drawing offers the 3 Nov case on its photograph', () => {
  assert.match(guide, /const earlierNorel = st => \{ const m = st && st\.case && st\.case\.model; return m === NOREL_R3\.model \|\| m === NOREL_D\.model; \};/);
  const to = chunk('  function toR4(){', '\n  }\n');
  assert.match(to, /apply\("case\.model", NOREL_R4\.model\);/);
  assert.match(to, /if\(!S\.tpl\.on\)\{ S\.tpl\.on = true;/);
  assert.match(guide, /r4Btn\.hidden = !old;/);
  assert.match(guide, /stg0\.appendChild\(r4Btn\)/);
  // a lit pill of at least 44 px, shown only in simple mode
  assert.match(source, /#gR4Btn\{[^}]*min-height:44px/);
  assert.match(source, /body\.guided #gR4Btn:not\(\[hidden\]\)\{ display:inline-flex \}/);
  assert.equal(C.NOREL_R4.photoFile, './app/case-norel-r4-real.jpg', 'the 3 Nov case has the real photograph');
});

/* the dial shader and its brushed steel, from the source */
/* (a listener the chunk sets up for the page is given somewhere to go) */
const shade = vm.createContext({ addEventListener() {} });
vm.runInContext(chunk('const f = (n,d=2)', ';') + ';\n' + chunk('const mSrgb2lin = c =>', 'const _matCache = new Map();')
  + '\nthis.d = {renderDialPixels, brushPaths2D, brushDirOf, BRUSH_DIRS, MFINISH};', shade);
const D = shade.d;
const render = (base, brush, px = 96) => D.renderDialPixels({ px, dialMM: 28.5, base, finish: 'brushedsteel', lighting: 'studio', light: { az: 135, el: 44 }, brush, ss: 1 });
/* how much the grey changes stepping across x and stepping across y, in the middle of the dial */
function steps(buf, px) {
  let dx = 0, dy = 0;
  for (let y = px * 0.3 | 0; y < px * 0.7; y++) for (let x = px * 0.3 | 0; x < px * 0.7; x++) {
    const i = (y * px + x) * 4;
    dx += Math.abs(buf[i] - buf[i + 4]); dy += Math.abs(buf[i] - buf[i + px * 4]);
  }
  return { dx, dy };
}

test('brushed steel is a surface in simple mode and the full editor, with a direction', () => {
  assert.match(guide, /chips\("dial\.finish", \[\["sunburst","Sunburst"\],\["brushedsteel","Brushed steel"\]/);
  assert.match(guide, /chips\("dial\.brushDir", \[\["vertical","Vertical"\],\["horizontal","Horizontal"\],\["circular","Circular"\]\], brushDirOf\(d\.brushDir\)\)/);
  assert.deepEqual([...D.BRUSH_DIRS], ['vertical', 'horizontal', 'circular']);
  assert.equal(D.brushDirOf(undefined), 'vertical', 'vertical unless chosen, as on the Nivada');
  assert.equal(D.brushDirOf('sideways'), 'vertical');
  assert.match(source, /SEL\("dial\.finish","Finish",\["matte","gloss","sunburst","guilloche","brushedsteel","brushed",/);
  assert.match(source, /if\(S\.dial\.finish === "brushedsteel"\) return base\.concat\(\[SEL\("dial\.brushDir","Direction",BRUSH_DIRS\)\]\);/);
  assert.match(source, /brushed:"brushed", brushedsteel:"brushedsteel",/, 'the material path knows it');
  assert.match(source, /brushedsteel:"Brushed steel"/, 'and the full editor names it');
  // the old "brushed" is left exactly as it was, for designs saved with it
  assert.equal(D.MFINISH.brushed.groove, 'linear');
  assert.match(source, /\} else if\(finish==="brushed"\)\{\n      for\(let y=-rOut;y<rOut;y\+=0\.22\)/);
});

test('the grain runs the way it is set, the same every time, in the dial colour', () => {
  const v = render('#DDDFE1', 'vertical'), h = render('#DDDFE1', 'horizontal');
  const sv = steps(v, 96), sh = steps(h, 96);
  assert.ok(sv.dx > 1.5 * sv.dy, `vertical grain changes across x: ${sv.dx} vs ${sv.dy}`);
  assert.ok(sh.dy > 1.5 * sh.dx, `horizontal grain changes across y: ${sh.dy} vs ${sh.dx}`);
  assert.deepEqual([...render('#DDDFE1', 'vertical')], [...v], 'deterministic');
  const mean = buf => { const m = [0, 0, 0]; let n = 0; for (let i = 0; i < buf.length; i += 4) if (buf[i + 3]) { m[0] += buf[i]; m[1] += buf[i + 1]; m[2] += buf[i + 2]; n++; } return m.map(x => x / n); };
  // a steel grey close to the colour chosen, so it matches the case it was taken from
  const g = mean(v);
  for (const [c, want] of g.map((x, i) => [x, [0xDD, 0xDF, 0xE1][i]])) assert.ok(Math.abs(c - want) < 14, `${c} near ${want}`);
  // and the dial colour tints it: blue steel stays blue
  const b = mean(render('#2D4F86', 'vertical'));
  assert.ok(b[2] > b[0] + 50, 'blue');
  assert.ok(render('#DDDFE1', 'circular').some((x, i) => i % 4 === 3 && x === 255));
});

test('the drawn brushed steel is strokes and gradients, never a filter', () => {
  const a = D.brushPaths2D(14.25, 'vertical'), b = D.brushPaths2D(14.25, 'vertical');
  assert.equal(a.length, 6); assert.deepEqual(a, b);
  assert.ok(a.join('').split('M').length > 300, 'dense');
  assert.match(a.join(''), /^M-?[\d.]+ -?[\d.]+V/, 'vertical strokes');
  assert.match(D.brushPaths2D(14.25, 'horizontal').join(''), /H/);
  assert.match(D.brushPaths2D(14.25, 'circular').join(''), /A/);
  const branch = chunk('} else if(finish==="brushedsteel"){', '} else if(finish==="brushed"){');
  assert.doesNotMatch(branch, /filter/);
});

test('the Time Keeper × Nivada dial is brushed steel, grain 12 to 6, in the steel of its case', () => {
  assert.equal(design.dial.finish, 'brushedsteel');
  assert.equal(design.dial.brushDir, 'vertical');
  assert.equal(design.dial.color, '#DDDFE1');
  // the rose gold hands still read on it (the studio's own 2:1 check)
  const lum = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
  assert.ok(ratio('#C69076', design.dial.color) >= 2, 'the rose gold hands, as drawn');
  // the Valmont study is on the old "brushed" dial, which stays a finish of
  // its own, drawn as before (its renders were checked byte for byte)
  const valmont = JSON.parse(fs.readFileSync(path.join(root, 'designs/valmont-cushion-roman.json'), 'utf8'));
  assert.equal(valmont.dial.finish, 'brushed');
});
