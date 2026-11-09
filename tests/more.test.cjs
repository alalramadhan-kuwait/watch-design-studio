// Simple mode's More options sheets, run from the real source: every field a
// sheet offers is one of the full editor's own settings, every word on a
// sheet has its Arabic, a value set on a sheet goes through the same rules
// as the full editor's panel, and the sliders read out in the units the full
// editor gives them. The sheets on screen (opening each one, changing its
// settings and seeing the watch follow, 44 px targets, right to left in
// Arabic) were checked in WebKit and Chromium with Playwright.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(chunk('/* GUIDE-PURE-BEGIN', '/* GUIDE-PURE-END */')
  + '\nthis.g={GSTR,gT,gW,GWORD,glossOpt,gReadout,G_MORE,G_MORE_LABEL,G_MORE_OPT,G_MORE_KIND,gMoreKey,gMoreLabel,gOptLabel,gMoreKind};', ctx);
const G = ctx.g;
const lang = l => vm.runInContext(`GLANG = ${JSON.stringify(l)}`, ctx);
const AR = /[؀-ۿ]/;
const guide = chunk('/* GUIDED MODE — see the stylesheet note above.', '</script>');

/* The full editor's field definitions: the schema, the hand schema, and the
   logo's technique, cartouche and advanced fields. */
const schema = chunk('const SCHEMA = {', '\nlet swGroup');
const logo = chunk('const LOGO_TECH_FIELDS = {', 'const DAY_NAMES_EN');
const at = s => schema.indexOf(s);
const zoneEnd = at('  borders:{title'), bandEnd = at('  chapter:{title'), handAt = at('function handSchema');
/* every field constructor, by the path G_MORE would call it */
const FIELDS = new Map();
const addField = (key, type, label, rest) => {
  const e = FIELDS.get(key) || { type, labels: new Set(), rest: [] };
  if (label != null) e.labels.add(label); e.rest.push(rest); FIELDS.set(key, e);
};
const ctor = /\b(N|C|SEL|CK|TX|TG|SEG|CHIP)\((k\+"\.(\w+)"|"([\w.]+)")\s*,\s*(?:"([^"]*)"|`[^`]*`|[^,)]+)/g;
for (const [text, base] of [[schema, 0], [logo, -1]]) {
  for (const m of text.matchAll(ctor)) {
    let key = m[4];
    if (!key) {
      const i = m.index + base;
      key = (base < 0 ? '?' : i > handAt ? 'H' : i < zoneEnd && i > at('  sector:{title') ? 'sector.zones.#' : i < bandEnd && i > zoneEnd ? 'borders.bands.#' : '?') + '.' + m[3];
    }
    const t = {N: 'num', C: 'col', SEL: 'sel', CK: 'chk', TX: 'txt', TG: 'toggle', SEG: 'seg', CHIP: 'chips'}[m[1]];
    addField(key, t, m[5] == null ? null : m[5], text.slice(m.index, m.index + 600));
  }
}
const ACTS = new Set([...schema.matchAll(/ACT\("(\w+)(:"\+i)?"?/g)].map(m => 'act:' + m[1] + (m[2] ? ':#' : '')));
// the headings inside the dial's stone controls, the only ones a sheet keeps
const HEADS = new Set([...schema.slice(at('  dial:{title'), at('  sector:{title')).matchAll(/\{t:"head", l:"([^"]+)"\}/g)].map(m => 'head|' + m[1]));
const LAYER_ON = new Set([...chunk('const LAYER_GROUPS = [', '\n];').matchAll(/\["\w+","[^"]+","([\w.]+)"\]/g)].map(m => m[1]));
const SECTIONS = Object.entries(G.G_MORE).flatMap(([k, list]) => list.map(sec => ({ k, ...sec })));
const SRC = s => s === '@' ? ['hHand', 'mHand', 'sHand'] : [s];

test('every step after Start has a sheet, and each section draws from a real schema entry', () => {
  assert.deepEqual(Object.keys(G.G_MORE), ['case', 'dial', 'markers', 'hands', 'text', 'calendar', 'finish']);
  for (const sec of SECTIONS) {
    for (const s of SRC(sec.src)) assert.match(schema, new RegExp('(\\n  |, )' + s + ':'), `${sec.k}:${sec.id} reads SCHEMA.${s}`);
    if (sec.on) { assert.ok(LAYER_ON.has(sec.on), sec.on + ' is the switch the full editor lists'); assert.ok(sec.onLabel, sec.id + ' names its switch'); }
    if (sec.show) assert.ok(LAYER_ON.has(sec.show), sec.show + ' is a part that can be on or off');
    assert.ok(new Set(sec.paths).size === sec.paths.length, sec.id + ' lists a path twice');
  }
});

test('every field a sheet offers maps to a real schema path', () => {
  const bad = [];
  for (const sec of SECTIONS) for (const p of sec.paths) {
    if (p.startsWith('act:')) { if (!ACTS.has(p)) bad.push(p); continue; }
    if (p === 'head') { assert.ok([...HEADS].length, 'the schema has headings'); continue; }
    if (p === 'say' || p === 'linkbar') { assert.match(schema, new RegExp(`t:"${p}"`), p); continue; }
    if (p.startsWith('text.')) { if (!FIELDS.has(p) && !FIELDS.has('?.' + p.slice(5))) bad.push(p); continue; }
    if (!FIELDS.has(p)) bad.push(sec.k + ':' + p);
  }
  assert.deepEqual(bad, [], 'paths no schema field writes');
  // the narrowed list of finishes is a list the schema has
  const fin = G.G_MORE.dial.find(s => s.id === 'surface').opts['dial.finish'];
  for (const o of fin) assert.match(FIELDS.get('dial.finish').rest[0], new RegExp(`"${o}"`), o);
  assert.deepEqual([...fin], ['brushed', 'sandblasted', 'metallic', 'circular'], 'the four finishes the step does not offer');
});

test('a sheet path is named as the schema field is: zones and bands as #, the hand being set as H.', () => {
  assert.equal(G.gMoreKey({ t: 'num', p: 'sector.zones.3.cell' }), 'sector.zones.#.cell');
  assert.equal(G.gMoreKey({ t: 'num', p: 'borders.bands.0.dia' }), 'borders.bands.#.dia');
  assert.equal(G.gMoreKey({ t: 'num', p: 'mHand.width' }, 'mHand'), 'H.width');
  assert.equal(G.gMoreKey({ t: 'num', p: 'handSet.minuteScale' }, 'mHand'), 'handSet.minuteScale');
  assert.equal(G.gMoreKey({ t: 'act', a: 'zoneDel:2' }), 'act:zoneDel:#');
  assert.equal(G.gMoreKey({ t: 'head', l: 'Chatoyancy' }), 'head');
  assert.equal(G.gMoreLabel({ t: 'head', l: 'Chatoyancy' }), 'Silky shimmer');
  assert.equal(G.gMoreLabel({ t: 'sel', p: 'text.logoMetal', l: 'Name metal' }), 'Name metal', 'the label that differs by technique');
  assert.equal(G.gMoreLabel({ t: 'sel', p: 'text.logoMetal', l: 'Metal' }), 'Metal');
});

/* the words a sheet can show for each field */
const labelsOf = (sec, p) => {
  if (p === 'head') return [...HEADS].map(h => G.G_MORE_LABEL[h]);
  if (p === 'say') return [];
  const base = G.G_MORE_LABEL[p];
  const f = FIELDS.get(p) || FIELDS.get('?.' + p.slice(5));
  const variants = f ? [...f.labels].map(l => G.G_MORE_LABEL[p + '|' + l] || base) : [base];
  return [base, ...variants];
};
test('every setting has a plain name, and every name and heading its Arabic', () => {
  const missing = [], noAr = [];
  lang('ar');
  try {
    for (const sec of SECTIONS) {
      for (const w of [sec.t, sec.onLabel].filter(Boolean)) if (!AR.test(G.gW(w))) noAr.push(w);
      for (const p of sec.paths) for (const l of labelsOf(sec, p)) {
        if (l == null) { missing.push(sec.k + ':' + p); continue; }
        if (!AR.test(G.gW(l))) noAr.push(l);
      }
    }
    // the words built into the sheet itself
    for (const w of ['Hour hand', 'Minute hand', 'Seconds hand', 'Automatic', 'hidden']) if (!AR.test(G.gW(w))) noAr.push(w);
  } finally { lang('en'); }
  assert.deepEqual(missing, [], 'paths with no name');
  assert.deepEqual([...new Set(noAr)], [], 'names with no Arabic');
  // no name is kept for a path no sheet offers
  const used = new Set(SECTIONS.flatMap(s => s.paths));
  const orphans = Object.keys(G.G_MORE_LABEL).filter(k => !used.has(k.split('|')[0]) && !(k.startsWith('head|') && used.has('head')));
  assert.deepEqual(orphans, [], 'names for nothing');
});

/* The values a list can take, worked out from its definition: the constant
   lists are read out of the source and the expression run against them. */
const literal = name => vm.runInNewContext(chunk(`const ${name} = `, ';').replace(`const ${name} = `, ''));
const keysOf = name => [...chunk(`const ${name} = {`, '\n};').matchAll(/^ {2}"([^"]+)"\s*:/gm)].map(m => m[1]);
const LISTS = {
  GUIL_PATTERNS: literal('GUIL_PATTERNS'), NUM_MAKE: literal('NUM_MAKE'), GEM_METALS: literal('GEM_METALS'),
  METAL_NAMES: keysOf('METALS'), HAND_MATERIALS: keysOf('HAND_MATERIAL'), NUM_SYSTEMS: keysOf('NUM_SYSTEM'),
  LOGO_MARK_IDS: keysOf('LOGO_MARKS'), HAND_VEC_NAMES: keysOf('BUILTIN_HAND_VEC'),
  LOGO_TECH: vm.runInNewContext(chunk('const LOGO_TECH = ', ';').replace('const LOGO_TECH = ', '')),
  FILL_OPTS: vm.runInNewContext(chunk('const FILL_OPTS  = ', ';').replace('const FILL_OPTS  = ', '')),
  PRINT_TYPE: vm.runInNewContext(chunk('const PRINT_TYPE = ', ';').replace('const PRINT_TYPE = ', '')),
  DAY_NAMES_EN: literal('DAY_NAMES_EN'),
  HAND_REACH: vm.runInNewContext(chunk('const HAND_REACH = ', ';').replace('const HAND_REACH = ', ''))
};
LISTS.HAND_REACH_H = ['share of the minute hand'].concat(LISTS.HAND_REACH);
LISTS.HAND_STYLES = vm.runInNewContext(chunk('const HAND_STYLES = ', ';').replace('const HAND_STYLES = ', ''), { HAND_VEC_NAMES: LISTS.HAND_VEC_NAMES });
const MATERIALS = keysOf('NUM_MATERIAL_DEF');
function optionsOf(f, key) {
  const call = f.rest.find(r => /^(SEL|SEG)\(/.test(r)); if (!call) return [];
  // the third argument: from after the label to the bracket that closes the call
  const i = call.indexOf(',', call.indexOf(',') + 1) + 1;
  let d = 0, j = i;
  for (; j < call.length; j++) { const c = call[j]; if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) { if (d === 0) break; d--; } }
  const expr = call.slice(i, j);
  const env = { ...LISTS, k: 'hHand', T: { logoImg: {} }, S: { numerals: { tech: 'applied' } }, numMaterialsFor: () => MATERIALS, HAND_REACH_H: LISTS.HAND_REACH_H };
  const v = vm.runInNewContext('(' + expr + ')', env);
  return v.map(o => Array.isArray(o) ? o[0] : o);
}
test('every choice on a sheet has a plain name and its Arabic', () => {
  const noAr = [], seen = [];
  lang('ar');
  try {
    for (const sec of SECTIONS) for (const p of sec.paths) {
      const f = FIELDS.get(p) || FIELDS.get('?.' + p.slice(5));
      if (!f || (f.type !== 'sel' && f.type !== 'seg')) continue;
      let opts = optionsOf(f, p);
      if (sec.opts && sec.opts[p]) opts = opts.filter(o => sec.opts[p].includes(o));
      assert.ok(opts.length, p + ' has choices');
      for (const o of opts) {
        const en = G.gOptLabel(p, o); seen.push(en);
        // figures, and the reference name the Arabic glossary keeps as it is printed
        if (!/^[\d.]+×$/.test(en) && G.gW(en) !== 'Day-Date' && !AR.test(G.gW(en))) noAr.push(p + ' = ' + o + ' (' + en + ')');
      }
    }
  } finally { lang('en'); }
  assert.deepEqual(noAr, [], 'choices with no Arabic');
  assert.ok(seen.length > 150, 'the scan found the choices (' + seen.length + ')');
  // all twenty-five hand shapes are offered, the four drawn spindles by name
  assert.equal(LISTS.HAND_STYLES.length, 25);
  assert.equal(G.gOptLabel('H.style', 'vector · Vernoy spindle 90%'), 'Vernoy spindle 90%');
  assert.equal(G.gOptLabel('indices.style', 'diamond'), 'Diamond shape', 'the marker shape, not the stone');
  assert.equal(G.gOptLabel('H.style', 'dd-seconds'), 'Long needle', 'the shared glossary answers first where it has a name');
});

test('the parts that fold, their states and what the buttons say have Arabic', () => {
  const subs = [...new Set([...schema.matchAll(/SUB\("([^"]+)"/g), ...logo.matchAll(/SUB\("([^"]+)"/g)].map(m => m[1]))];
  const named = ['Zone', 'Outer zone', 'Centre field', 'Band', 'Innermost band', 'Outermost band'];
  const states = ['same as dial', 'plain', 'line', 'beads', 'arc', 'rounded', 'hairline', 'none', 'raised', 'bevelled', 'set by hand', 'follows the logo', 'custom', 'metal']
    .concat(LISTS.GUIL_PATTERNS, LISTS.METAL_NAMES);
  const says = [...chunk('function runAct(a, tr){', '\n/* ---- events ---- */').matchAll(/say\((?:a === "matchFromHour" \? )?"([^"]+)"(?: : "([^"]+)")?\)/g)].flatMap(m => [m[1], m[2]]).filter(Boolean);
  assert.ok(says.length >= 7, 'the messages were found');
  lang('ar');
  try {
    const noAr = [...subs, ...named, ...says].filter(w => !AR.test(G.gW(w)))
      .concat(states.filter(s => !AR.test(G.gW(G.gOptLabel('', s)))));
    assert.deepEqual(noAr, []);
    assert.equal(G.gT('more.zoneN', 2), 'المنطقة 2'); assert.equal(G.gT('more.bandN', 3), 'الشريط 3');
    assert.equal(G.gT('more.count', 1), 'إعداد واحد'); assert.equal(G.gT('more.count', 6), '6 إعدادات');
  } finally { lang('en'); }
  assert.equal(G.gT('more.count', 1), '1 setting'); assert.equal(G.gT('more.count', 6), '6 settings');
  for (const k of Object.keys(G.G_MORE)) for (const w of ['more.open.', 'more.sum.']) { assert.ok(G.GSTR.en[w + k], w + k); assert.match(G.GSTR.ar[w + k], AR, w + k); }
});

test('a schema slider reads out in its own unit', () => {
  const kind = (u, min, max) => G.gMoreKind({ u, min, max });
  assert.equal(kind('mm', 0, 3), 'mm'); assert.equal(kind('°', 0, 90), 'deg'); assert.equal(kind('%', 20, 80), 'pcv');
  assert.equal(kind('×', 0.4, 1.2), 'x'); assert.equal(kind('h', 1, 12), 'h'); assert.equal(kind('px', 160, 720), 'px');
  assert.equal(kind('', 0, 1), 'pct', 'a share from 0 to 1 reads in per cent'); assert.equal(kind('', 4, 24), 'num');
  assert.equal(G.gReadout(12, 'num', 1), '12'); assert.equal(G.gReadout(-0.25, 'num', 0.01), '-0.25');
  assert.equal(G.gReadout(47.35, 'pcv', 0.05), '47.4%'); assert.equal(G.gReadout(0.8, 'x', 0.02), '0.80×');
  assert.equal(G.gReadout(3, 'h', 1), "3 o'clock"); assert.equal(G.gReadout(340, 'px', 20), '340 px');
  lang('ar');
  try {
    assert.equal(G.gReadout(0.8, 'x', 0.02), '⁦0.80×⁩', 'a multiple keeps its sign beside the number');
    assert.equal(G.gReadout(3, 'h', 1), 'الساعة 3');
  } finally { lang('en'); }
});

test('a value set on a sheet goes through the full editor\'s own rules', () => {
  // the full editor's panel writes through fieldInput and fieldChosen
  const input = chunk('document.addEventListener("input", e=>{\n  if(e.target.dataset.pg) return;', '\n});');
  assert.match(input, /fieldInput\(p, v\);/);
  const change = chunk('document.addEventListener("change", e=>{\n  if(e.target.dataset.pg)', '\n});');
  assert.match(change, /fieldChosen\(p\);\n  commit\(\);/, 'what a choice brings is in the same undo step');
  assert.match(source, /if\(t\.dataset\.act\)\{\n    const r = runAct\(t\.dataset\.act\);/);
  // and simple mode writes through the same three
  assert.match(guide, /function put\(path, v\)\{\n    if\(\/\^ink\(Own\)\?:\/\.test\(path\)\)\{ setInk\(path, v\); return; \}\n    fieldInput\(path, v\);/);
  assert.match(guide, /else put\(path, v\);\n    fieldChosen\(path\);/);
  assert.match(guide, /const r = runAct\(a, gW\);/, 'a sheet button runs the panel\'s action, its message in the reader\'s language');
  assert.match(guide, /else if\(path === "ui\.link"\) setHandLink\(!!v\);/);
  // the sheet is drawn from the schema itself
  assert.match(guide, /const sc = SCHEMA\[src === "@" \? sheetHand : src\];/);
  // the fields that depend on a choice are built when the panel is
  for (const k of ['minute', 'date', 'day']) assert.match(schema, new RegExp(`\\n  ${k}:\\{title:[\\s\\S]{0,700}?fields:\\(\\)=>\\[`), k);
});

/* the full editor's write rules and actions, run */
const ed = vm.createContext({});
vm.runInContext('let S, toasts = [], synced = [];\nconst set = (o,p,v)=>{const k=p.split(".");k.slice(0,-1).reduce((x,i)=>x[i],o)[k.pop()]=v;};\n'
  + 'const toast = m => toasts.push(m); const syncHands = k => synced.push(k); const syncMarkerFlags = () => {}; const snapVectorLengths = k => synced.push("snap:" + k);\n'
  + 'const stylesFor = sys => sys === "roman I–XII" ? ["roman-a", "roman-b"] : ["vernoy"]; const applyFamilyDefaults = () => {}; const slabsOf = () => [{id:"s1"}];\n'
  + 'const METALS = {"polished steel":{base:"#D6DADE"}, "yellow gold":{base:"#D7B04B"}};\n'
  + chunk('const hexOf = ', '\nconst isColourBox') + '\n'
  + chunk('function fieldInput(p, v){', 'let casePrev') + chunk('function runAct(a, tr){', '\n/* ---- events ---- */')
  + '\nthis.e={fieldInput,fieldChosen,setHandLink,runAct,get S(){return S;},set S(v){S=v;},toasts,synced};', ed);
test('the shared rules: a numeral system keeps a face it has, a plate starts from its metal, the hands link', () => {
  const E = ed.e;
  E.S = { numerals: { system: 'western 0–9', style: 'vernoy' }, text: { plateTintOn: false, plateMetal: 'yellow gold', plateTint: '' }, handSet: { link: 'off' }, mHand: {} };
  E.fieldInput('numerals.system', 'roman I–XII'); E.fieldChosen('numerals.system');
  assert.equal(E.S.numerals.style, 'roman-a', 'a face the roman set does not have gives way to one it does');
  E.fieldInput('text.plateTintOn', true); E.fieldChosen('text.plateTintOn');
  assert.equal(E.S.text.plateTint, '#D7B04B');
  E.fieldInput('mHand.style', 'cathedral');
  assert.ok(E.synced.includes('snap:mHand'), 'a supplied hand takes its drawn length');
  E.setHandLink(true); assert.equal(E.S.handSet.link, 'full set'); assert.ok(E.synced.includes('hHand'));
  E.setHandLink(false); assert.equal(E.S.handSet.link, 'off');
});
test('the panel\'s actions run the same from either mode, in the reader\'s language', () => {
  const E = ed.e;
  E.S = { sector: { on: false, zones: [] }, borders: { bands: [] }, handSet: { link: 'off' } };
  assert.equal(E.runAct('zoneAdd', w => '«' + w + '»'), 'paint');
  assert.equal(E.S.sector.zones.length, 1); assert.equal(E.S.sector.on, true);
  assert.equal(E.toasts.at(-1), '«Zone added»');
  assert.equal(E.runAct('zoneAdd'), 'paint'); assert.ok(E.S.sector.zones[1].outerD < E.S.sector.zones[0].outerD, 'a new zone goes inside');
  assert.equal(E.runAct('zoneDel:7'), '', 'no such zone, nothing to do');
  assert.equal(E.runAct('zoneDel:0'), 'paint'); assert.equal(E.S.sector.zones.length, 1);
  assert.equal(E.runAct('borderAdd'), 'paint'); assert.equal(E.S.borders.bands[0].dia, 24);
  assert.equal(E.runAct('borderDel:0'), 'paint'); assert.equal(E.S.borders.bands.length, 0);
  assert.equal(E.runAct('matchFromMinute'), 'paint'); assert.equal(E.S.handSet.link, 'off', 'matching leaves the link as it was');
  assert.equal(E.toasts.at(-1), 'Set matched to the minute hand');
});

test('how many of the full editor\'s settings the sheets reach', () => {
  const paths = new Set();
  for (const sec of SECTIONS) {
    if (sec.on) paths.add(sec.on);
    for (const p of sec.paths) {
      if (/^(act:|head$|say$|linkbar$)/.test(p)) continue;
      if (p.startsWith('H.')) for (const h of ['hHand', 'mHand', 'sHand']) paths.add(h + p.slice(1));
      else paths.add(p.replace('.#.', '.0.'));
    }
  }
  assert.ok(paths.size >= 230, 'settings on the sheets: ' + paths.size);
});

test('the sheet is a dialog with a Done, opened from a pill and a row, and kept clear of the full editor', () => {
  assert.match(guide, /el\.className = "gSheet"; el\.setAttribute\("role", "dialog"\);/);
  assert.match(guide, /class="gSheetDone" data-gsheet="0">\$\{gT\("more\.done"\)\}/);
  assert.match(guide, /<button type="button" class="gMoreTop" data-gsheet="1"/);
  assert.match(guide, /class="gMoreRow" data-gsheet="1"/);
  assert.match(guide, /e\.key === "Escape" && sheetOn/);
  // data-k is how the full editor recognises a component row; the sheet must not carry it
  assert.doesNotMatch(guide, /dataset\.k\b/);
  // a slider on the sheet and the same one on the step keep separate ids
  assert.match(guide, /slider\(p, lab, fd\.min, fd\.max, fd\.step, v, G_MORE_KIND\[key\] \|\| gMoreKind\(fd\), "gms"\)/);
  // 44 px targets, and the sheet mirrors in Arabic
  const css = chunk('/* MORE OPTIONS. A pill beside the tabs', '/* "Whole watch" and back');
  assert.match(css, /\.gMoreTop\{[^}]*min-height:44px/); assert.match(css, /\.gSheetDone\{[^}]*min-height:44px/);
  assert.match(css, /\.gMsub > summary\{ min-height:44px/); assert.match(css, /\.gMact\{[^}]*min-height:44px/);
  assert.match(css, /margin-inline-start:auto/, 'logical sides, so the rows mirror by themselves');
  assert.doesNotMatch(css, /filter:/, 'no filters');
});
