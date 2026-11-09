// Gem hour markers, diamond-set numerals and their fit checks, run from the
// real source between the GEMS-PURE marks (gem-spec.md section 10.1). What
// needs fonts or a canvas was checked in a browser; everything here is
// geometry, strings and rules.
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
  + chunk('/* With a metal (MT)', '/* ---------------------------------------------------------------\n   Breguet numerals')
  + '\nthis.g={GEM_CUTS,GEM_STONES,METALS,NOREL_R4,VERNOY_CASE,gemNorm,gemSize,gemPitch,gemProngs,gemHeight,gemOutline,gemCarats,legacyPlan,hourPlan,'
  + 'migrateMarkers,applyMarkerPreset,markerPresetOf,syncMarkerFlags,gemPlacements,gemFit,gemChecks,gemSummary,distToSector,distToRect,insideLens,'
  + 'gemMarkerSVG,gemOnDial,gemRound,packStones,paveStonesSVG,indexShape,perHourOn,paveOn,gemCutDefaults};', ctx);
const G = ctx.g;
const clone = o => JSON.parse(JSON.stringify(o));

// The NOREL B6098G-A1 R4 as the spec measures it: day window 38° with a
// 0.60 frame, the SW240-1 date at 3 under the 2.2x cyclops.
const norel = over => {
  const st = {
    case:{locked:true, opening:31.4, model:G.NOREL_R4.model}, render:{az:135},
    dial:{color:'#A9C3DD', diameter:32.5},
    numerals:{on:true, set:'all', system:'arabic ٠–٩', style:'Noto Naskh Arabic', radius:12.6, size:3.3, align:'outer edge', tech:'printed', material:'ink', height:0.2},
    indices:{on:false, style:'baton', radius:12.6, length:2.4, width:0.55, color:'#FFFFFF', applied:true, count:12, skipNumerals:true},
    minute:{on:true, diameter:29.6, thickness:0.22},
    day:{on:true, arc:38, edge:'frame', frame:0.6},
    date:{on:true, at:3, dist:9.95, w:2.4, h:2.0, frameW:0.14, cyclops:'2.2×'},
    hHand:{on:true, length:8.5, reach:'free'}, mHand:{on:true, length:13, reach:'free'}, sHand:{on:false},
    handSet:{link:'full set'}
  };
  G.migrateMarkers(st);
  if (over) over(st);
  return st;
};
const rowOf = (st, title) => G.gemChecks(st).find(r => r.title === title);
const FREE = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11];

test('A3 an old design opens with everything new off, and the plan it already showed', () => {
  const old = {numerals:{on:true, set:'quarters'}, indices:{on:true, count:12, skipNumerals:true}, handSet:{link:'full set'}};
  G.migrateMarkers(old);
  assert.equal(old.markers.perHour, false);
  assert.equal(old.indices.metal, null);
  assert.equal(old.numerals.pave, false);
  assert.equal(old.handSet.fitHeight, 4);
  assert.deepEqual([...old.markers.at], [...G.legacyPlan(old)]);
  assert.deepEqual([...old.markers.at], ['numeral','index','index','numeral','index','index','numeral','index','index','numeral','index','index']);
  // saved and opened again, nothing moves
  const again = G.migrateMarkers(clone(old));
  assert.deepEqual(clone(again), clone(old));
  // numerals win where both would sit
  const both = G.migrateMarkers({numerals:{on:true, set:'all'}, indices:{on:true, count:12}});
  assert.ok(both.markers.at.every(k => k === 'numeral'));
  // a dial of 60 indices keeps one rule for every hour
  const sixty = G.migrateMarkers({numerals:{on:false}, indices:{on:true, count:60}, markers:{perHour:true, at:Array(12).fill('gem')}});
  assert.equal(sixty.markers.perHour, false);
});

test('A4 the windowed hours are empty whatever the plan says, and each layout gives its plan', () => {
  const st = norel(s => { s.markers.perHour = true; s.markers.at = Array(12).fill('gem'); });
  const plan = G.hourPlan(st);
  assert.equal(plan[0].covered, true); assert.equal(plan[0].kind, 'none');
  assert.equal(plan[3].covered, true); assert.equal(plan[3].kind, 'none');
  const expect = {
    qGems:h => h === 6 || h === 9 ? 'gem' : 'numeral', qNums:h => h === 6 || h === 9 ? 'numeral' : 'gem',
    allDiamond:() => 'gem', allBag:() => 'gem', sap69:h => h === 6 || h === 9 ? 'gemAlt' : 'gem', special6:h => h === 6 ? 'indexAlt' : 'index'
  };
  for (const [id, fn] of Object.entries(expect)) {
    const s = G.applyMarkerPreset(norel(), id);
    assert.equal(s.markers.perHour, true, id);
    for (const h of FREE) assert.equal(s.markers.at[h % 12], fn(h), id + ' at ' + h);
    assert.equal(s.markers.at[0], 'none'); assert.equal(s.markers.at[3], 'none');
    assert.equal(G.markerPresetOf(s), id, id + ' is recognised again');
  }
  const bag = G.applyMarkerPreset(norel(), 'allBag');
  assert.equal(bag.gem.cut, 'baguette'); assert.equal(bag.numerals.on, false);
  const sap = G.applyMarkerPreset(norel(), 'sap69');
  assert.equal(sap.gemAlt.stone, 'blue sapphire'); assert.equal(sap.gemAlt.metal, sap.gem.metal);
  const s6 = G.applyMarkerPreset(norel(), 'special6');
  assert.equal(s6.indices.on, true); assert.equal(s6.indices.metal, 'white gold'); assert.equal(s6.indices.altStyle, 'double');
  assert.equal(G.applyMarkerPreset(norel(), 'uniform').markers.perHour, false);
  // a hand-made plan is "Each hour…"
  const own = G.applyMarkerPreset(norel(), 'allDiamond'); own.markers.at[6] = 'none';
  assert.equal(G.markerPresetOf(own), 'custom');
});

// one marker of every cut, stone count, setting and stone
const combos = () => {
  const out = [];
  for (const [cut, K] of Object.entries(G.GEM_CUTS)) for (const n of K.n) for (const setting of K.settings[n])
    for (const stone of Object.keys(G.GEM_STONES)) out.push(G.gemNorm({cut, n, setting, stone, metal:'white gold', ...G.gemCutDefaults(cut, n)}));
  return out;
};
const draw = (g, seed = 3, la = 135 * Math.PI / 180) => { let k = 0; const defs = []; const s = G.gemOnDial(g, 30, 13, la, seed, {id:p => p + (k++), defs, grads:new Map()}, 0.40); return {s, defs:defs.join('')}; };

test('A5 no gem uses a filter, and each casts three offset shadow copies', () => {
  const all = combos();
  // GEM_CUTS allows 14 cut, count and setting combinations (the spec's "15" counts one twice)
  assert.equal(all.length, 14 * 5, 'every combination, five stones');
  for (const g of all) {
    const {s, defs} = draw(g);
    assert.ok(!/filter=|<filter|feDropShadow|feGaussianBlur/.test(s + defs), JSON.stringify(g));
    for (const op of ['.08', '.15', '.30']) assert.match(s, new RegExp(`<g transform="translate\\([^)]*\\)" opacity="\\${op}"`));
  }
  // metal indices too
  for (const style of ['baton','double','dagger','triangle','dot','diamond','box','cone']) {
    let n = 0; const defs = [];
    const svg = G.indexShape({radius:12, length:2.4, width:0.6, color:'#C8C9C7', applied:true, style, metal:'rose gold'}, 30, k => k + (n++), defs, 2.3);
    assert.ok(!/filter/.test(svg + defs.join('')), style);
    assert.equal((svg.match(/opacity="\.(08|15|30)"/g) || []).length, 3, style + ' has its three shadow copies');
  }
});

const facets = s => (s.match(/<path [^>]*stroke-opacity="\.32"/g) || []);
test('A6 the same state draws the same SVG, and sparkle moves only the glints', () => {
  const g = G.gemNorm({cut:'round', n:1, d:1.5});
  assert.equal(draw(g).s, draw(g).s);
  const lo = draw({...g, sparkle:0}).s, hi = draw({...g, sparkle:1}).s;
  assert.deepEqual(facets(lo), facets(hi), 'facets do not move');
  const glints = s => (s.match(/fill="#FFFFFF" opacity="\.95"/g) || []).length;
  assert.equal(glints(lo), 0); assert.equal(glints(hi), 2);
  assert.notEqual(draw(g, 3).s, draw(g, 4).s, 'each hour gets its own stone');
});

test('A7 facet counts: brilliant 33, melee 9, baguette 12 + table, princess 8 + table + 8', () => {
  const la = 2.3;
  assert.equal(facets(G.gemRound(0, 0, 1.5, 'diamond', la, 1, .6)).length, 33);
  assert.equal(facets(G.gemRound(0, 0, 1.0, 'diamond', la, 1, .6)).length, 33);
  assert.equal(facets(G.gemRound(0, 0, 0.8, 'diamond', la, 1, .6)).length, 9);
  const bag = G.gemMarkerSVG(G.gemNorm({cut:'baguette', n:1}), la, 1, {id:p => p, defs:[], grads:new Map()}).body;
  assert.equal((bag.match(/<path [^>]*stroke-opacity="\.3"/g) || []).length, 12);
  assert.equal((bag.match(/<rect [^>]*fill="#[0-9A-F]{6}" stroke="#FFFFFF" stroke-opacity="\.3"/g) || []).length, 1, 'the table');
  const pr = G.gemMarkerSVG(G.gemNorm({cut:'princess', n:1}), la, 1, {id:p => p, defs:[], grads:new Map()}).body;
  assert.equal((pr.match(/<path [^>]*stroke-opacity="\.3"/g) || []).length, 8);
  assert.equal((pr.match(/<path [^>]*opacity="\.75"/g) || []).length, 8, 'the pinwheel');
});

test('A8 footprints, stack pitch and prong counts', () => {
  const sz = o => { const s = G.gemSize(G.gemNorm(o)); return [+s.w.toFixed(2), +s.l.toFixed(2)]; };
  assert.deepEqual(sz({cut:'round', n:1, d:1.5, setting:'bezel'}), [1.8, 1.8]);
  assert.deepEqual(sz({cut:'round', n:2, d:1.2, setting:'bezel'}), [1.5, 2.82]);
  assert.deepEqual(sz({cut:'round', n:3, d:1.0, setting:'channel'}), [1.3, 3.32]);
  assert.deepEqual(sz({cut:'baguette', n:1, L:2.6, W:1.1}), [1.4, 2.9]);
  assert.deepEqual(sz({cut:'baguette', n:2, L:2.4, W:0.8, setting:'channel'}), [2.0, 2.7]);
  for (const [setting, add] of [['bezel', .12], ['prong', .10], ['channel', .04]])
    assert.ok(Math.abs(G.gemPitch(G.gemNorm({cut:'round', n:2, d:1.2, setting})) - 1.2 - add) < 1e-9, setting);
  assert.deepEqual([1, 2, 3].map(n => G.gemProngs(G.gemNorm({cut:'round', n, setting:'prong', ...G.gemCutDefaults('round', n)})).length), [4, 6, 8]);
});

test('A9 how high a gem stands on a 0.40 dial, and a thinner dial caps the seat', () => {
  const H = (o, t = 0.40) => G.gemHeight(G.gemNorm(o), t);
  assert.ok(Math.abs(H({cut:'round', d:1.5}) - 0.665) <= 0.01);
  assert.ok(Math.abs(H({cut:'round', d:1.8}) - 0.848) <= 0.01);
  assert.ok(Math.abs(H({cut:'baguette', L:2.6, W:1.1}) - 0.62) <= 0.01);
  assert.ok(Math.abs(H({cut:'princess', s:1.3}) - 0.686) <= 0.01);
  assert.ok(Math.abs(H({cut:'round', n:3, d:1.0, setting:'channel'}) - 0.41) <= 0.01);
  assert.ok(Math.abs(H({cut:'round', d:1.5}, 0.30) - (0.915 - 0.15)) <= 1e-9, 'a 0.30 dial seats only 0.15');
});

test('A10 room under the hands', () => {
  const g = d => norel(s => { G.applyMarkerPreset(s, 'allDiamond'); s.gem.d = d; });
  let st = g(1.5), r = rowOf(st, 'Gem height under the hands');
  assert.equal(r.ok, true); assert.match(r.detail, /0\.23 mm clear/);
  st = g(1.8); r = rowOf(st, 'Gem height under the hands');
  assert.equal(r.ok, false); assert.match(r.detail, /will touch/);
  st.handSet.fitHeight = 5; r = rowOf(st, 'Gem height under the hands');
  assert.equal(r.ok, true); assert.match(r.detail, /0\.30 mm clear/);
  st = g(1.5); st.hHand.reach = 'to the numerals'; st.indices.on = false;
  st.numerals.on = true;  // the hour hand set to reach the (now gem) markers
  st.hHand.length = 12; st.hHand.reach = 'free';
  assert.equal(rowOf(st, 'Gem height under the hands').ok, false, 'a long hour hand at 0.48 meets a 0.67 stone');
  // another movement: unknown, so reviewed
  st = g(1.5); st.case.model = G.VERNOY_CASE.model; st.case.opening = 30.5;
  r = rowOf(st, 'Gem height under the hands'); assert.equal(r.ok, false); assert.match(r.detail, /unknown for this movement/);
});

test('A11 gems beside the day window', () => {
  const at = (arc, mode) => norel(s => { G.applyMarkerPreset(s, 'allDiamond'); s.numerals.on = false; s.indices.radius = 12.6; s.day.arc = arc; s.markers.dayClear = mode; });
  let st = at(38, 'touch'), r = rowOf(st, 'Gems beside the day window');
  assert.equal(r.ok, true);
  const gap = G.gemPlacements(st).find(p => p.hour === 11).gap;
  assert.ok(gap > 0.7 && gap < 1.0, 'about 0.87 mm: ' + gap);
  assert.equal(rowOf(at(53, 'touch'), 'Gems beside the day window').ok, false);
  st = at(45, 'move');
  const p = G.gemPlacements(st).filter(q => q.hour === 1 || q.hour === 11);
  for (const q of p) assert.ok(q.drop || Math.abs(q.a - q.i * 30) <= 4 + 1e-9);
  assert.equal(rowOf(st, 'Gems beside the day window').ok, true);
  assert.equal(p[0].a - 30, 330 - p[1].a, 'the pair moves as a pair');
  const dropped = at(53, 'drop');
  assert.ok(G.gemPlacements(dropped).filter(q => q.hour === 1 || q.hour === 11).every(q => q.drop));
});

test('A12 the date window and the magnifier', () => {
  const st = norel(s => G.applyMarkerPreset(s, 'allDiamond'));
  assert.equal(rowOf(st, 'Gems and the date window').ok, true);
  // a gem at 3 with the date off but the lens fitted
  const three = norel(s => { G.applyMarkerPreset(s, 'allDiamond'); s.date.on = false; s.markers.at[3] = 'gem'; });
  const r = rowOf(three, 'Gems and the date window');
  assert.equal(r.ok, false); assert.match(r.detail, /under the magnifier/);
});

test('A13 stone size and the setting', () => {
  const s = o => norel(st => { G.applyMarkerPreset(st, 'allDiamond'); Object.assign(st.gem, o); });
  assert.equal(rowOf(s({d:0.9}), 'Stone size').ok, false);
  assert.equal(rowOf(s({d:1.5}), 'Stone size').ok, true);
  assert.equal(rowOf(s({stone:'emerald', setting:'prong'}), 'Setting and stone').ok, false);
  assert.equal(rowOf(s({metal:'polished steel', setting:'prong'}), 'Setting and stone').ok, false);
  assert.equal(rowOf(s({stone:'black diamond'}), 'Setting and stone').ok, false);
  assert.equal(rowOf(s({}), 'Setting and stone').ok, true, 'diamond, bezel, white gold');
  // the review rows are there, and nothing gem-related is added to a dial without gems
  assert.equal(G.gemChecks(norel()).length, 0);
  assert.equal(rowOf(s({}), 'Gem setting production review').ok, false);
  assert.match(rowOf(s({origin:'lab'}), 'Gem setting production review').detail, /lab-grown/);
});

test('A14 stones packed into a stroke', () => {
  const bar = (wmm, hmm, ppm = 100) => { const w = Math.round(wmm * ppm), h = Math.round(hmm * ppm), m = new Uint8Array(w * h).fill(1); return [m, w, h]; };
  let [m, w, h] = bar(1.10, 3.30);
  const s = G.packStones(m, w, h, 100, 0.80, 0.12, 0.10);
  assert.equal(s.length, 3);
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) assert.ok(Math.hypot(s[i][0] - s[j][0], s[i][1] - s[j][1]) >= 0.90 - 1e-9);
  for (const [x, y] of s) assert.ok(Math.min(x, 1.10 - x, y, 3.30 - y) >= 0.52 - 1e-9, 'inside by a stone and its wall');
  [m, w, h] = bar(0.60, 3.30);
  assert.equal(G.packStones(m, w, h, 100, 0.80, 0.12, 0.10).length, 0);
  // a loop: outer Ø1.6, inner Ø0.5
  const N = 180, ring = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot(x + .5 - 90, y + .5 - 90) / 100; ring[y * N + x] = r <= 0.8 && r >= 0.25 ? 1 : 0; }
  assert.ok(G.packStones(ring, N, N, 100, 0.80, 0.12, 0.10).length <= 2);
  // the diamond-set check: a figure with fewer than two stones, and the size, are reviewed
  const st = norel(x => Object.assign(x.numerals, {tech:'applied', material:'metal', metal:'yellow gold', pave:true, paveD:0.8, paveStone:'diamond', style:'Lalezar', size:3.3}));
  assert.equal(G.paveOn(st), true);
  let row = G.gemChecks(st, {nums:[{n:9, label:'٩', count:1}], total:1}).find(r => r.title === 'Diamond-set numerals');
  assert.equal(row.ok, false); assert.match(row.detail, /٩ gets fewer than 2 stones/);
  st.numerals.size = 4.0;
  row = G.gemChecks(st, {nums:[{n:9, label:'٩', count:3}], total:3}).find(r => r.title === 'Diamond-set numerals');
  assert.equal(row.ok, true);
  st.numerals.paveD = 0.7;
  assert.equal(G.gemChecks(st).find(r => r.title === 'Stone size').ok, false, '0.70 is reviewed');
  // the drawn-outline sets cannot be set with stones
  st.numerals.system = 'western 0–9'; st.numerals.style = 'vernoy';
  assert.equal(G.paveOn(st), false);
  // stones, seats and beads come out as plain shapes
  const svg = G.paveStonesSVG([[0, 0], [0.9, 0]], 0.8, 'diamond', G.METALS['yellow gold'], 2.3, 1, .45);
  assert.equal((svg.match(/r="\.075"/g) || []).length, 2, 'two grain beads between neighbours');
  assert.ok(!/filter/.test(svg));
});

test('A15 metal indices are painted in the metal; colour indices as before', () => {
  let n = 0; const defs = [];
  const gold = G.indexShape({radius:12, length:2.4, width:0.6, color:'#FFFFFF', applied:true, style:'baton', metal:'yellow gold'}, 60, k => k + (n++), defs, 2.3);
  const M = G.METALS['yellow gold'];
  assert.ok(gold.includes(M.lo), 'lo'); assert.ok(/#E[0-9A-F]{5}|#F[0-9A-F]{5}/.test(gold), 'lit bevels toward hi');
  const dot = G.indexShape({radius:12, length:2.4, width:0.6, color:'#FFFFFF', applied:false, style:'dot', metal:'yellow gold'}, 60, k => k + (n++), defs, 2.3);
  assert.ok(defs.join('').includes(M.hi) && defs.join('').includes(M.base), 'hi and base in the dot gradient');
  assert.ok(!gold.includes('#FFFFFF"/>'), 'the colour is not used');
  const plain = G.indexShape({radius:12, length:2.4, width:0.6, color:'#123456', applied:false, style:'baton', metal:null}, 60, k => k, []);
  assert.match(plain, /fill="#123456"/);
});

test('A16 each stone in its own colours; fire only where it belongs', () => {
  for (const [name, S] of Object.entries(G.GEM_STONES)) {
    const s = G.gemRound(0, 0, 1.5, name, 2.3, 1, .6);
    assert.match(s, new RegExp(`^<circle cx="0" cy="0" r="0\\.75" fill="${S.deep}"/>`), name + ' girdle');
    const fire = (s.match(/opacity="\.6"\/>/g) || []).length;
    assert.equal(fire, Math.round(4 * S.fire), name + ' fire');
  }
  assert.equal((G.gemRound(0, 0, 0.9, 'diamond', 2.3, 1, .6).match(/opacity="\.6"\/>/g) || []).length, 4, 'a 0.9 diamond still throws fire');
  assert.equal((G.gemRound(0, 0, 0.8, 'diamond', 2.3, 1, .6).match(/opacity="\.6"\/>/g) || []).length, 0, 'melee below 0.9 does not');
});

// The design check as the Atelier runs it, with the real checks() around the gem rows.
const reports = vm.createContext({hex2rgb:h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), visR:s => s.case.opening / 2});
vm.runInContext(chunk('const hex2rgb = h =>', 'function labOf(') + 'const f = (n,d=2)=>Number(n).toFixed(d);\n'
  + 'const pt = (r,deg)=>{const a=(deg-90)*Math.PI/180;return [r*Math.cos(a), r*Math.sin(a)];};\n'
  + chunk('const METALS = {', 'const METAL_NAMES') + chunk('const VERNOY_CASE = {', 'const CASE_SPEC = new Proxy') + 'const innerZone = () => null;\n'
  + chunk('const HAND_MATERIAL = {', 'const POMME = {') + chunk('const HAND_REACH = [', 'const HAND_SHARE = [')
  + chunk('function dayWindow(st){', '/* GEMS-PURE-BEGIN */') + chunk('/* GEMS-PURE-BEGIN */', '/* GEMS-PURE-END */')
  + chunk('  function contrast(a,b)', '  function brief()') + '\nthis.checks=checks;', reports);
test('A17 the design check carries the gem rows, before the production review', () => {
  const st = norel(s => { G.applyMarkerPreset(s, 'allDiamond'); s.dial.finish = 'matte'; s.hHand.color = s.mHand.color = '#1F2D47'; s.hHand.material = s.mHand.material = 'blued steel'; });
  const rows = reports.checks(JSON.parse(JSON.stringify(st)));
  const titles = rows.map(r => r.title);
  for (const t of ['Gem height under the hands', 'Gems beside the day window', 'Gems and the date window', 'Gem envelope', 'Stone seat in the dial', 'Gem setting production review'])
    assert.ok(titles.includes(t), t);
  assert.equal(titles.at(-1), 'Movement and production review');
});
