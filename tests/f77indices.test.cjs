// The Nivada F77 hour markers (v4.5.0): an index style measured on the
// owner's photograph of the F77 37 mm, the "F77 dial" layout, and the 3D
// view's pitched bars. Run from the real source. The page itself (the
// markers with the F77 hands on the Time Keeper x Nivada and the NOREL, the
// 3D view) was checked with Playwright, and every existing index style,
// preset and saved design was confirmed to draw exactly as in 4.4.0.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
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
  + chunk('const F77_LUME', ';') + ';'
  + '\nthis.g={METALS,F77_IX,F77_LUME,f77Bars,f77Index,f77IndexSet,indexShape,applyMarkerPreset,markerPresetOf,migrateMarkers,hourPlan};', ctx);
const G = ctx.g;
const R = 13.75;                                         // a fixture opening radius, mm (the shares do not depend on it)
const ix = (o = {}) => ({ on: true, style: 'f77', radius: 0.808*R, length: 0.28*R, width: 0.078*R, color: '#FFFFFF', applied: true, count: 12, metal: 'polished steel', ...o });
const LA = 135*Math.PI/180;
const draw = (o, a = 30, la = LA) => { let n = 0; return G.indexShape(ix(o), a, k => k + (n++), [], la); };

test('offered wherever an index shape is chosen, in English and Arabic', () => {
  assert.match(chunk('  indices:{title:"Indices"', ']},'), /SEL\("indices\.style","Shape",\["baton","dot","cone","box","diamond","triangle","dagger","double","f77"\]\)/);
  assert.match(source, /chips44\("indices\.style", shp\(\[\["baton","Baton"\],\["double","Double"\],\["f77","Nivada F77"\],/);
  assert.match(source, /"f77":"Nivada F77"/); assert.match(source, /"Nivada F77":"نيفادا F77"/);
  assert.match(chunk('const MARKER_PRESETS = [', '];'), /\["special6", "Special 6"\],\n  \["f77", "F77 dial"\],\n  \["custom", "Each hour…"\]/);
  assert.match(source, /"F77 dial":"ميناء نيفادا F77"/); assert.match(source, /"Lume plots":"نقاط مضيئة"/);
  // the lume plots: a switch in simple mode and a box in the full editor, for the F77 only
  assert.match(source, /if\(ix\.style !== "box" && ix\.style !== "cone"\) h \+= toggle\("indices\.lume", ix\.style === "f77" \? "Lume plots" : "Lume fill", !!ix\.lume\);/);
  assert.match(source, /CK\("indices\.lume", S\.indices\.style === "f77" \? "Lume plots" : "Lume fill"\)/);
});

test('the measured size and place, as shares of the opening, in steel', () => {
  const st = { case: { locked: false, opening: 27.5 }, indices: { style: 'baton', metal: null, count: 60, lume: false } };
  G.f77IndexSet(st);
  const i = st.indices;
  assert.equal(i.style, 'f77'); assert.equal(i.applied, true); assert.equal(i.count, 12); assert.equal(i.metal, 'polished steel');
  assert.equal(i.radius, 11.11); assert.equal(i.length, 3.85); assert.equal(i.width, 1.07);
  assert.ok(Math.abs((i.radius + i.length/2)/R - 0.948) < 0.002, 'outer end at 0.948R (13.03 mm)');
  assert.ok(Math.abs((i.radius - i.length/2)/R - 0.668) < 0.002, 'inner end at 0.668R (9.18 mm)');
  assert.equal(i.lume, false, 'the lume plots are left as they were');
  // a larger case: the same shares; a metal already chosen is kept
  const big = { case: { locked: false, opening: 31.4 }, indices: { metal: 'yellow gold' } };
  G.f77IndexSet(big);
  assert.equal(big.indices.radius, +(15.7*0.808).toFixed(2)); assert.equal(big.indices.metal, 'yellow gold');
  // simple mode sets them when the shape is chosen
  assert.match(source, /else if\(path === "indices\.style" && v === "f77"\) f77IndexSet\(S\);/);
});

test('a single bar, and a pair at 12, 3, 6 and 9', () => {
  const W = 1.07;
  assert.equal(JSON.stringify(G.f77Bars(W, 30)), JSON.stringify([[0, W]]));
  for (const a of [0, 90, 180, 270, 360]) {
    const b = G.f77Bars(W, a);
    assert.equal(b.length, 2, `a pair at ${a}°`);
    const total = (b[1][0] + b[1][1]/2) - (b[0][0] - b[0][1]/2), gap = (b[1][0] - b[1][1]/2) - (b[0][0] + b[0][1]/2);
    assert.ok(Math.abs(total - 1.56) < 0.01, 'the pair 1.56 mm across, as measured');
    assert.ok(gap > 0 && gap < 0.06, 'a hairline between the two bars');
  }
  for (const a of [6, 30, 84, 150, 354]) assert.equal(G.f77Bars(W, a).length, 1);
});

test('a pitched top: two long facets to a ridge, hipped at both ends, each taking the light', () => {
  const one = draw({}, 30), pair = draw({}, 0);
  // the marker itself, after the shadow's offset copies of its footprint
  const own = s => s.slice(s.lastIndexOf('<g transform="rotate('));
  const facets = s => [...own(s).matchAll(/<path d="M[^"]+Z" fill="(#[0-9A-F]{6})"\/>/gi)].map(m => m[1]);
  assert.equal(facets(one).length, 4); assert.equal(facets(pair).length, 8);
  assert.equal(new Set(facets(one)).size, 4, 'each facet its own shade');
  assert.match(one, /^<g transform="translate\([-\d.]+ [-\d.]+\)" opacity="\.08" fill="#000"/, 'in a metal, the gems\' offset-copy shadow');
  assert.match(draw({ metal: null }, 30), /^<g transform="translate\(0\.06 0\.10\)" opacity="0\.35">/, 'in a colour, the batons\' offset copy');
  assert.doesNotMatch(one + pair, /filter/, 'no SVG filters');
  // the hips: the ridge stops half the width short of each end
  const W = ix().width, L = ix().length, ridge = /<path d="M0\.000 (-?[\d.]+) L0\.000 (-?[\d.]+)" fill="none"/.exec(one);
  assert.ok(ridge, 'a ridge line down the middle');
  assert.ok(Math.abs(+ridge[1] - (-L/2 + W/2)) < 0.002 && Math.abs(+ridge[2] - (L/2 - W/2)) < 0.002);
  // in a metal the facets are the metal's own colours; in a colour, shades of it
  const gold = draw({ metal: 'yellow gold' }, 30), M = G.METALS['yellow gold'];
  assert.ok(gold.includes(M.lo));
  assert.match(draw({ metal: null, color: '#123456' }, 30), /stroke="#[0-9A-F]{6}" stroke-opacity="\.5"/i);
  // printed: plain bars, no facets and no shadow
  const printed = draw({ applied: false, metal: null, color: '#123456' }, 30);
  assert.equal(facets(printed).length, 1); assert.match(printed, /^<g transform="rotate/, 'no shadow'); assert.match(printed, /fill="#123456"/);
});

test('no lume in the bar; the MK1 plots beyond the outer end only when asked for', () => {
  assert.doesNotMatch(draw({}, 30), /data-relief="lume"/);
  const lit = draw({ lume: true }, 30), W = ix().width, L = ix().length;
  assert.equal((lit.match(/data-relief="lume"/g) || []).length, 1, 'one plot, not in the shadow');
  assert.match(lit, new RegExp(`fill="${G.F77_LUME}"`));
  assert.equal((draw({ lume: true }, 0).match(/data-relief="lume"/g) || []).length, 1, 'one plot for a pair too');
  const plot = /data-relief="lume" d="M(-?[\d.]+) (-?[\d.]+) A([\d.]+) ([\d.]+)/.exec(lit);
  assert.ok(Math.abs(+plot[2] - (-L/2 - 0.33*W)) < 0.002, 'centred 0.35 mm beyond the outer end');
  assert.ok(Math.abs(2*plot[4] - 0.60) < 0.01 && Math.abs(2*plot[3] - 0.50) < 0.01, '0.60 by 0.50 mm');
});

test('the 3D view builds each bar with its pitched top', () => {
  let n = 0;
  const svg = G.indexShape({ ...ix({ lume: true }), applied: false, metal: null, roof: true }, 0, k => k + (n++), []);
  assert.equal((svg.match(/data-relief="roof"/g) || []).length, 2);
  assert.equal((svg.match(/data-relief="lume"/g) || []).length, 1);
  assert.match(source, /let body=indexShape\(\{\.\.\.st\.indices,applied:false,metal:null,roof:true\}/);
  const r3d = fs.readFileSync(path.join(root, 'src/relief3d.js'), 'utf8');
  assert.match(r3d, /if\(relief==='roof'\)\{const g=roofBar\(shape\.getPoints\(\),depth\);/);
  assert.match(r3d, /function roofBar\(points,depth\)/);
  const bundle = fs.readFileSync(path.join(root, 'vendor/relief3d.bundle.js'), 'utf8');
  assert.match(bundle, /"roof"/, 'the bundle is rebuilt');
});

test('the F77 dial layout: the markers at every free hour, the dotted track, and the hands', () => {
  const st = G.migrateMarkers({
    case: { locked: false, opening: 31.4 }, numerals: { on: true, set: 'all' },
    indices: { on: false, style: 'baton', radius: 12.6, length: 2.4, width: 0.55, color: '#FFFFFF', applied: true, count: 12, metal: null },
    minute: { on: false, style: 'ticks', diameter: 29.6, thickness: 0.22, fives: true },
    day: { on: true }, date: { on: true, at: 3 }
  });
  G.applyMarkerPreset(st, 'f77');
  assert.deepEqual([...st.markers.at], ['none', 'index', 'index', 'none', 'index', 'index', 'index', 'index', 'index', 'index', 'index', 'index'], 'the windows at 12 and 3 stay clear');
  assert.equal(st.markers.perHour, true); assert.equal(st.indices.on, true); assert.equal(st.numerals.on, false);
  assert.equal(st.indices.style, 'f77');
  assert.deepEqual({ ...st.minute }, { on: true, style: 'dots', diameter: +(15.7*1.90).toFixed(2), thickness: 0.20, fives: false });
  assert.equal(G.markerPresetOf(st), 'f77', 'recognised again');
  st.indices.style = 'baton'; assert.equal(G.markerPresetOf(st), 'custom', 'not with other markers');
  assert.match(source, /if\(v === "f77"\) setHand\("f77"\); else \{ commit\(\); paintAll\(\); \}/, 'the guided step sets the F77 hands with it');
});
