// Luxury finishes (v3.2.0): two-tone and gold cases on the drawn case and on
// the case photograph, a gem-set bezel, a pavé dial and an ombré dial, run
// from the real source between the GEMS-PURE marks. The look of each was
// checked in WebKit and Chromium with Playwright (contact sheet in the batch
// notes); everything here is geometry, colour, rules and strings.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };

const ctx = vm.createContext({});
vm.runInContext(
  chunk('const hex2rgb = h =>', 'function labOf(')
  + 'const f = (n,d=2)=>Number(n).toFixed(d);\n'
  + 'const pt = (r,deg)=>{const a=(deg-90)*Math.PI/180;return [r*Math.cos(a), r*Math.sin(a)];};\n'
  + chunk('const METALS = {', 'const METAL_NAMES')
  + chunk('const VERNOY_CASE = {', 'const CASE_SPEC = new Proxy')
  + 'const innerZone = () => null;\n'
  + chunk('const HAND_REACH = [', 'const HAND_SHARE = [')
  + chunk('function dayWindow(st){', '/* GEMS-PURE-BEGIN */')
  + chunk('/* GEMS-PURE-BEGIN */', '/* GEMS-PURE-END */')
  + '\nthis.g={NOREL_R4,NOREL_R3,VERNOY_CASE,LUX_GOLD,LUX_STEEL,goldOf,twoToneOf,luxRampLUT,photoPartAt,photoPlan,photoTintPixels,'
  + 'gemBezelOn,gemBezelSpec,gemBezelSVG,ringPt,paveDialOn,paveDialZone,paveDialCentres,paveKeepOut,paveKeepDist,paveDialSVG,'
  + 'ombreStops,luxChecks,migrateMarkers,METALS,GEM_STONES};', ctx);
const G = ctx.g;

const norel = over => {
  const st = {
    case:{locked:true, opening:31.4, model:G.NOREL_R4.model, material:G.LUX_STEEL, twoTone:'none', gemBezel:'none', gemStone:'diamond', gemD:2.1},
    render:{az:135},
    dial:{color:'#A9C3DD', diameter:32.5, ombre:0, pave:'none', paveStone:'diamond', paveD:1.0, paveMetal:'white gold'},
    numerals:{on:true, set:'all', system:'arabic ٠–٩', style:'Noto Naskh Arabic', radius:12.6, size:3.3, align:'outer edge', tech:'printed', material:'ink', height:0.2},
    indices:{on:false, style:'baton', radius:12.6, length:2.4, width:0.55, applied:true, count:12, skipNumerals:true},
    minute:{on:true, diameter:29.6, thickness:0.22},
    day:{on:true, arc:38, edge:'frame', frame:0.6},
    date:{on:true, at:3, dist:9.95, w:2.4, h:2.0, frameW:0.14},
    sub:{on:false}, text:{on:true},
    hHand:{on:true, length:8.5}, mHand:{on:true, length:13}, sHand:{on:false}, handSet:{link:'full set'}
  };
  G.migrateMarkers(st);
  if (over) over(st);
  return st;
};
const cx = () => { let n = 0; return {id:p => p + (++n), defs:[], grads:new Map()}; };

test('a design with none of the new finishes asks nothing of them', () => {
  const st = norel();
  assert.equal(G.twoToneOf(st), null);
  assert.equal(G.gemBezelOn(st), false);
  assert.equal(G.paveDialOn(st), false);
  assert.equal(G.photoPlan(st, G.NOREL_R4), null, 'the photograph shows it as it is');
  assert.deepEqual([...G.luxChecks(st)], []);
  // and the drawing only reaches for them when they are on
  const rc = chunk('  const roundCase = () => {', '  /* ---------------- CASE + STRAP');
  assert.match(rc, /const two = twoToneOf\(st\), MG = two \? LUX_GOLD\[two\] : M0;/);
  assert.match(rc, /for\(let i=0;i<\(GB \? 0 : n\);i\+\+\)/);
  assert.match(source, /if\(d\.on && d\.ombre > 0\)\{/);
  assert.match(source, /if\(d\.on && paveDialOn\(st\)\)\{/);
  // the state defaults are all "off"
  const base = chunk('const BASE = {', 'const PRESETS = {');
  assert.match(base, /twoTone:"none", gemBezel:"none", gemStone:"diamond", gemD:2\.10/);
  assert.match(base, /ombre:0, pave:"none", paveStone:"diamond", paveD:1\.00, paveMetal:"white gold"/);
});

test('two-tone is gold parts on a steel case; a gold case is gold all over', () => {
  assert.equal(G.twoToneOf(norel(s => { s.case.twoTone = 'yellow gold'; })), 'yellow gold');
  assert.equal(G.twoToneOf(norel(s => { s.case.twoTone = 'rose gold'; })), 'rose gold');
  assert.equal(G.twoToneOf(norel(s => { s.case.twoTone = 'white gold'; })), null, 'two-tone is yellow or rose');
  assert.equal(G.twoToneOf(norel(s => { s.case.twoTone = 'yellow gold'; s.case.material = G.LUX_GOLD['rose gold']; })), null, 'a gold case has no steel to set it on');
  for (const k of ['yellow gold', 'rose gold', 'white gold']) assert.equal(G.goldOf(G.LUX_GOLD[k].toLowerCase()), k);
  assert.equal(G.goldOf('#3B3D42'), null);
  // the photograph with its parts measured can show either; one without cannot, so the drawn case shows
  assert.deepEqual({...G.photoPlan(norel(s => { s.case.twoTone = 'rose gold'; }), G.NOREL_R4)}, {full:null, two:'rose gold', gem:false});
  assert.deepEqual({...G.photoPlan(norel(s => { s.case.material = G.LUX_GOLD['white gold']; }), G.NOREL_R4)}, {full:'white gold', two:null, gem:false});
  assert.equal(G.photoPlan(norel(s => { s.case.model = G.NOREL_R3.model; s.case.twoTone = 'yellow gold'; }), G.NOREL_R3), false);
});

test('the gold ramps keep dark dark, white white and turn mid grey gold', () => {
  for (const tone of ['yellow gold', 'rose gold', 'white gold']) {
    const L = G.luxRampLUT(tone), at = v => [L[v*3], L[v*3 + 1], L[v*3 + 2]];
    assert.deepEqual(at(255), [255, 255, 255], tone + ': the white ground stays white');
    assert.ok(at(0).every(c => c < 24), tone + ': black stays near black');
    for (let v = 1; v < 256; v++) assert.ok(L[v*3] + L[v*3 + 1] + L[v*3 + 2] >= L[v*3 - 3] + L[v*3 - 2] + L[v*3 - 1], tone + ' rises at ' + v);
  }
  const y = G.luxRampLUT('yellow gold'), mid = [y[160*3], y[160*3 + 1], y[160*3 + 2]];
  assert.ok(mid[0] > mid[2] + 70, 'mid grey becomes a saturated yellow');
  const w = G.luxRampLUT('white gold'), wm = [w[160*3], w[160*3 + 1], w[160*3 + 2]];
  assert.ok(wm[0] - wm[2] < 12, 'white gold stays nearly neutral');
});

test('the photographed parts: bezel ring, crown and centre links, and nothing else', () => {
  const P = G.NOREL_R4.photoParts, at = (x, y) => ({...G.photoPartAt(P, x, y, 0.05)});
  assert.equal(at(0, -18.5).bezel, 1, 'the bezel at 12');
  assert.equal(at(-18.8, 0).bezel, 1, 'the bezel at 9');
  assert.equal(at(0, -16.0).bezel, 0, 'inside the crystal edge is the case');
  assert.equal(at(0, -20.6).bezel, 0, 'the rim at 12 is lower than a circle would put it');
  assert.equal(at(0, 20.4).bezel, 1, '…and at 6 reaches further');
  assert.equal(at(22, 0.4).crown, 1, 'the crown');
  assert.equal(at(22, -6).crown, 0);
  assert.equal(at(0, -26).links, 1, 'a centre link above the case');
  assert.equal(at(3, 30).links, 1, 'and below it');
  assert.equal(at(6.5, -26).links, 0, 'the outer links stay steel');
  assert.equal(at(0, -12).links, 0, 'no link inside the bezel');
  // a synthetic photograph: a two-tone pass turns the bezel and links gold and leaves the rest
  const w = 200, h = 300, cal = {cx:100, cy:150, s:4};
  const src = new Uint8ClampedArray(w*h*4).fill(160);
  const out = G.photoTintPixels(src, w, h, cal, P, {full:null, two:'yellow gold'});
  const px = (x, y) => { const i = (Math.round(cal.cy + y*cal.s)*w + Math.round(cal.cx + x*cal.s))*4; return [out[i], out[i + 1], out[i + 2]]; };
  assert.ok(px(0, -18.5)[0] > px(0, -18.5)[2] + 50, 'bezel is gold');
  assert.ok(px(0, -30)[0] > px(0, -30)[2] + 50, 'centre link is gold');
  assert.deepEqual(px(-15, -30), [160, 160, 160], 'outer link is untouched');
  assert.deepEqual(px(0, 0), [160, 160, 160], 'the dial area is untouched');
  const full = G.photoTintPixels(src, w, h, cal, P, {full:'rose gold', two:null});
  assert.ok(full[0] > full[2] + 30, 'a whole gold case takes every pixel');
});

test('the gem-set bezel is laid out from the case drawing', () => {
  const r = G.gemBezelSpec(norel(s => { s.case.gemBezel = 'round'; }));
  assert.equal(r.od, 41.00); assert.equal(r.id, 34.20);
  assert.ok(Math.abs(r.w - 3.40) < 1e-9, 'the ring is 3.40 mm (bezelOD/bezelID)');
  assert.equal(r.d, 2.10); assert.equal(r.n, 52);
  assert.equal(r.metal, 'white gold', 'a steel watch takes a white gold bezel');
  assert.ok(Math.abs(r.ct - 52*0.0037*Math.pow(2.1, 3)) < 1e-9);
  // a stone too big for the ring is drawn at the largest that fits, and said so
  const big = G.gemBezelSpec(norel(s => { s.case.gemBezel = 'round'; s.case.gemD = 3.2; }));
  assert.ok(Math.abs(big.d - 2.70) < 1e-9); assert.equal(big.want, 3.2);
  const b = G.gemBezelSpec(norel(s => { s.case.gemBezel = 'baguette'; s.case.twoTone = 'rose gold'; s.case.gemStone = 'ruby'; }));
  assert.equal(b.n % 2, 0); assert.ok(b.L > 2.6 && b.L < 2.8);
  assert.equal(b.metal, 'rose gold'); assert.equal(b.stone, 'ruby');
  // the cushion case has no round bezel to set
  assert.equal(G.gemBezelOn(norel(s => { s.case.model = G.VERNOY_CASE.model; s.case.gemBezel = 'round'; })), false);
  // drawn with no filters, a few stones repeated
  for (const cut of ['round', 'baguette']) {
    const c = cx(), svg = G.gemBezelSVG(G.gemBezelSpec(norel(s => { s.case.gemBezel = cut; })), {inner:[0, 0, 17.1, 17.1], outer:[0, 0, 20.5, 20.5]}, 135*Math.PI/180, c);
    const all = svg + c.defs.join('');
    assert.doesNotMatch(all, /filter|feGaussian|feDrop/, cut + ' uses no filter');
    assert.equal((svg.match(/<use /g) || []).length, cut === 'round' ? 52 : 60);
    assert.ok(all.length < 120000, cut + ' stays small: ' + all.length);
  }
  // a ring point: t runs inner edge to outer, deg from 12
  assert.deepEqual([...G.ringPt({inner:[0, 0, 10, 10], outer:[0, 0, 20, 20]}, 0.5, 90)].map(v => +v.toFixed(6) + 0), [15, 0]);
});

test('the pavé dial: stones in the zone, clear of the windows, the centre and the printing', () => {
  const st = norel(s => { s.dial.pave = 'full'; });
  const Z = G.paveDialZone(st);
  assert.ok(Math.abs(Z.r1 - (14.80 - 0.11 - 0.20)) < 1e-9, 'stops 0.20 inside the minute track');
  assert.equal(Z.r0, 1.45, 'the hands\' centre is kept clear');
  const cs = G.paveDialCentres(st), d = 1.0, p = d + 0.12;
  assert.ok(cs.length > 300 && cs.length < 600, 'a few hundred stones: ' + cs.length);
  const keep = G.paveKeepOut(st);
  for (const [x, y] of cs) {
    const r = Math.hypot(x, y);
    assert.ok(r >= Z.r0 + d/2 - 1e-6 && r <= Z.r1 - d/2 + 1e-6, 'inside the zone');
    for (const k of keep) assert.ok(G.paveKeepDist(k, x, y) >= d/2 + (k.m || 0) - 1e-6, 'clear of ' + k.t);
  }
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++)
    assert.ok(Math.hypot(cs[i][0] - cs[j][0], cs[i][1] - cs[j][1]) >= p - 0.02, 'a pitch apart');
  assert.ok(keep.some(k => k.t === 'sector'), 'the day window'); assert.ok(keep.some(k => k.t === 'rect'), 'the date window');
  // applied figures stand on the stones; printed ones keep their gold
  const applied = G.paveKeepOut(norel(s => { s.dial.pave = 'full'; s.numerals.tech = 'applied'; }));
  assert.ok(applied.length < keep.length);
  assert.ok(G.paveDialCentres(norel(s => { s.dial.pave = 'full'; s.numerals.tech = 'applied'; })).length > cs.length);
  // the centre and the ring split the dial at the markers' inner edge
  const c = G.paveDialZone(norel(s => { s.dial.pave = 'centre'; })), ring = G.paveDialZone(norel(s => { s.dial.pave = 'ring'; }));
  assert.ok(Math.abs(c.r1 - (12.6 - 1.65 - 0.35)) < 1e-9); assert.equal(ring.r0, c.r1);
  // lettering given by the renderer is kept clear, a curved line at 6 included
  const txt = [{t:'sector', r0:5.6, r1:6.4, half:30, m:0.1, flip:true}];
  assert.ok(G.paveDialCentres(st, txt).every(([x, y]) => G.paveKeepDist(txt[0], x, y) >= 0.6 - 1e-6));
  assert.equal(G.paveKeepDist(txt[0], 0, 6), 0, 'the sector sits at 6');
  // drawn with no filters
  const k = cx(), svg = G.paveDialSVG(cs, d, 'diamond', G.METALS['white gold'], 2.3, k, 0.6, Z) + k.defs.join('');
  assert.doesNotMatch(svg, /filter/);
  assert.equal((svg.match(/<use /g) || []).length, cs.length);
});

test('ombré deepens to the edge in the dial\'s own colour, by the amount', () => {
  const s0 = G.ombreStops('#004A1C', 0), s1 = G.ombreStops('#004A1C', 1);
  assert.ok(s0.every(x => x[2] === 0), 'nothing at 0');
  assert.equal(s1[1][2], 0, 'the middle shows the colour itself');
  assert.ok(s1[4][2] > 0.9 && s1[4][2] > s1[3][2] && s1[3][2] > s1[2][2], 'darker toward the edge');
  assert.match(source, /if\(cl && \/ombré\/\.test\(cl\[0\]\) && !\(S\.dial\.ombre > 0\)\) S\.dial\.ombre = 0\.7;/, 'a classic named ombré turns it on');
  assert.equal((source.match(/\/ombré\/\.test\(cl\[0\]\)/g) || []).length, 2, 'in simple mode and the full editor');
});

test('the design check flags what Blue Creations must make or confirm', () => {
  const rows = G.luxChecks(norel(s => { s.case.gemBezel = 'round'; s.dial.pave = 'full'; s.case.twoTone = 'yellow gold'; }), {n:400});
  const by = t => rows.find(r => r.title === t);
  assert.equal(by('Gem-set bezel').ok, false);
  assert.match(by('Gem-set bezel').detail, /3\.40 mm wide \(Ø41\.00 outside, Ø34\.20 inside, from the case drawing\)/);
  assert.match(by('Gem-set bezel').detail, /Blue Creations must make a gem-set bezel/);
  assert.equal(by('Gem-set bezel').layer, 'case');
  assert.match(by('Pavé dial').detail, /brass Ø32\.50 × 0\.40 mm/);
  assert.match(by('Pavé dial').detail, /0\.8–1\.0 mm thick/);
  assert.match(by('Pavé dial').detail, /^400 stones of Ø1\.00 mm, about 1\.48 ct/);
  assert.equal(by('Pavé dial').layer, 'dial');
  assert.match(by('Two-tone parts').detail, /yellow gold on a steel case/);
});

test('simple mode offers them, in English and Arabic, through the escaping helper', () => {
  const guide = chunk('/* GUIDED MODE — see the stylesheet note above.', '</script>');
  assert.match(guide, /data-gset="ui\.metal" data-gv='\$\{gv\(v\)\}'/, 'metal values go through gv');
  assert.match(guide, /chips44\("case\.gemBezel"/);
  assert.match(guide, /stoneChips\("case\.gemStone"/);
  assert.match(guide, /chips44\("dial\.pave"/);
  assert.match(guide, /slider\("dial\.ombre", "Ombré"/);
  const ar = chunk('const GWORD = {ar:{', '}};');
  for (const w of ['Steel and yellow gold', 'Steel and rose gold', 'Bezel', 'Fluted', 'Round stones', 'Baguettes', 'Bezel stones', 'Pavé', 'Whole dial', 'Centre', 'Outer ring', 'Ombré'])
    assert.ok(ar.includes(`"${w}":`), w + ' has its Arabic');
  // the full editor has the fields too
  const schema = chunk('const SCHEMA = {', '  sector:{title:"Dial zones"');
  for (const p of ['case.twoTone', 'case.gemBezel', 'case.gemStone', 'case.gemD', 'dial.ombre', 'dial.pave', 'dial.paveStone', 'dial.paveD', 'dial.paveMetal'])
    assert.ok(schema.includes(`"${p}"`), p);
});

test('the Arabic words for the case and the movement are the owner\'s', () => {
  const ar = chunk('const GSTR = {en:{', '/* the design check\'s rows in Arabic');
  assert.doesNotMatch(ar, /هيكل|ماكينة|علبة/, 'no older word for the case or the movement');
  assert.match(ar, /"step\.case":"القالب"/);
  assert.match(ar, /"All case settings":"كل إعدادات القالب"/);
  assert.match(ar, /محرك يوم وتاريخ/);
});
