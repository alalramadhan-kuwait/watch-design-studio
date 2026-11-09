// Simple mode's words and decisions, run from the real source between the
// GUIDE-PURE marks: the strings table, the glossary, where a reload resumes,
// how steps split into tabs, where the watch is framed, how sliders read out,
// what counts as printing, and how a design check is put in plain words.
// The page itself (layout, taps, framing on screen) was checked in WebKit and
// Chromium with Playwright.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(chunk('/* GUIDE-PURE-BEGIN', '/* GUIDE-PURE-END */')
  + '\nthis.g={GSTR,gT,glossOpt,gResumeStep,gTabsFor,gFrameBox,gFramePart,gReadout,gPrintParts,gCommonInk,gPlainCheck,G_CHECK_WORDS,G_RESUME_MS};', ctx);
const G = ctx.g;
const guide = chunk('/* GUIDED MODE — see the stylesheet note above.', '</script>');
const STEPS = ['start','case','dial','markers','hands','text','calendar','finish'];

test('every string simple mode asks for is in the strings table', () => {
  const used = new Set([...guide.matchAll(/gT\("([^"]+)"/g)].map(m => m[1]));
  for (const k of STEPS) { used.add('step.' + k); used.add('lead.' + k); }
  const flags = [{}, {hasCalendar:true}, {num:true}, {ix:true}, {num:true, gems:true}, {gems:true}];
  for (const k of STEPS) for (const o of flags) for (const t of G.gTabsFor(k, o)) used.add('tab.' + k + '.' + t);
  for (const p of ['minute','numerals','indices','text']) used.add('ink.part.' + p);
  for (const k of STEPS) for (const t of [null, 'day', 'date', 'seconds']) used.add('part.' + G.gFramePart(k, t));
  const missing = [...used].filter(k => !k.endsWith('.') && !(k in G.GSTR.en));
  assert.deepEqual(missing, []);
  // nothing in the table is left unused but the keys built from parts
  assert.equal(G.gT('next', 'Dial'), 'Next: Dial');
  assert.equal(G.gT('no.such.key'), 'no.such.key', 'a missing key shows itself rather than nothing');
});

test('the glossary gives proper names, and leaves stored values alone', () => {
  assert.equal(G.glossOpt('mop'), 'Pearl sheen');
  assert.equal(G.glossOpt('guilloche'), 'Guilloché');
  assert.equal(G.glossOpt('sunburst'), 'Sunburst');
  assert.equal(G.glossOpt('western 0–9'), 'Western 0–9', 'anything unlisted gets a capital');
  assert.equal(G.glossOpt('2.2×'), '2.2×');
  assert.equal(G.glossOpt(4), 4);
  // the full editor reads its option labels from it, with the value kept in the attribute
  assert.match(source, /<option value="\$\{esc\(o\)[^>]*>\$\{esc\(typeof glossOpt === "function" \? glossOpt\(o\) : o\)\}<\/option>/);
  assert.match(source, /SEL\("date\.cyclops","Magnifier"/, 'Magnifier in both modes');
});

test('a reload goes back to the step for half an hour, then to Start', () => {
  const now = 1e12;
  assert.equal(G.gResumeStep(null, now), 0, 'first visit');
  assert.equal(G.gResumeStep({step:3, t:now - 60e3}, now), 3);
  assert.equal(G.gResumeStep({step:3, t:now - G.G_RESUME_MS - 1}, now), 0);
  assert.equal(G.gResumeStep({step:3, at:now - 1000}, now), 3, 'the last edit counts when nothing newer is known');
  assert.equal(G.gResumeStep({step:0, t:now}, now), 0);
  assert.equal(G.gResumeStep({step:12, t:now}, now), 0, 'a step that does not exist');
});

test('long steps split into tabs, and empty tabs are left out', () => {
  assert.deepEqual([...G.gTabsFor('dial')], ['colour','surface','track']);
  assert.deepEqual([...G.gTabsFor('text')], ['logo','lines','colour']);
  assert.deepEqual([...G.gTabsFor('calendar', {hasCalendar:true})], ['day','daylook','date']);
  assert.deepEqual([...G.gTabsFor('calendar', {hasCalendar:false})], ['date'], 'no day window on a case without a calendar');
  assert.deepEqual([...G.gTabsFor('markers', {num:true})], ['style','font','made','size']);
  assert.deepEqual([...G.gTabsFor('markers', {ix:true})], ['style','shape','made','size'], 'indices have a shape, not a font');
  assert.deepEqual([...G.gTabsFor('markers', {gems:true})], ['style','gems'], 'gems only');
  assert.deepEqual([...G.gTabsFor('markers', {})], ['style'], 'a clean dial');
  assert.deepEqual([...G.gTabsFor('start')], []); assert.deepEqual([...G.gTabsFor('finish')], []);
});

test('each step frames the part it edits', () => {
  const g = {opening:31.4, day:{y:-12.6, w:8.6}, date:{x:9.95, y:0}};
  for (const k of ['start','case','finish']) assert.equal(G.gFrameBox(k, null, g), 'case');
  const dial = G.gFrameBox('dial', 'colour', g);
  assert.equal(dial.x, 0); assert.equal(dial.y, 0); assert.ok(dial.w > 31.4 && dial.w < 34, 'the whole dial with a small margin');
  for (const k of ['markers','text']) assert.deepEqual({...G.gFrameBox(k, null, g)}, {...dial});
  const day = G.gFrameBox('calendar', 'daylook', g), date = G.gFrameBox('calendar', 'date', g);
  assert.equal(day.y, -12.6); assert.ok(day.w < dial.w/2, 'the day window close up');
  assert.equal(date.x, 9.95); assert.ok(date.w < dial.w/2);
  assert.ok(G.gFrameBox('hands', 'seconds', g).w < dial.w, 'the centre, for the counterweight');
  assert.deepEqual({...G.gFrameBox('calendar', 'date', {opening:31.4})}, {...dial}, 'a window that is off frames the dial');
  assert.equal(G.gFrameBox('dial', null, {}), 'case', 'no geometry, no guess');
  assert.equal(G.gFramePart('calendar', 'date'), 'date'); assert.equal(G.gFramePart('hands', 'seconds'), 'centre');
});

test('sliders read out in millimetres, degrees, per cent, or above and below the centre', () => {
  assert.equal(G.gReadout(3.3, 'mm', 0.05), '3.30 mm');
  assert.equal(G.gReadout(12.6, 'mm', 0.05), '12.60 mm');
  assert.equal(G.gReadout(0.04, 'mm', 0.01), '0.04 mm');
  assert.equal(G.gReadout(38, 'deg', 0.5), '38.0°');
  assert.equal(G.gReadout(0.35, 'pct', 0.05), '35%');
  assert.equal(G.gReadout(-6.2, 'pos', 0.1), '6.2 mm above the centre', 'minus is towards 12');
  assert.equal(G.gReadout(6.6, 'pos', 0.1), '6.6 mm below the centre');
  assert.equal(G.gReadout(0, 'pos', 0.1), 'At the centre');
});

test('printing is the inked parts only, and the printing colour is the one most of them share', () => {
  const st = {minute:{on:true, color:'#1F2D47'}, numerals:{on:true, tech:'printed', material:'ink', color:'#1f2d47'}, indices:{on:false},
    text:{on:true, logoTech:'printed', color:'#1F2D47', lineColor:'#1F2D47', line2:'AUTOMATIC'}};
  assert.deepEqual([...G.gPrintParts(st).map(p => p[0])], ['minute','numerals','text']);
  assert.equal(G.gCommonInk(G.gPrintParts(st)), '#1F2D47', 'case does not split a colour');
  st.minute.color = '#C9A55A';
  assert.equal(G.gCommonInk(G.gPrintParts(st)), '#1F2D47', 'one part set separately does not move the printing colour');
  st.numerals.tech = 'applied'; st.numerals.material = 'metal';
  st.text.logoTech = 'applied metal'; st.text.lineColor = '#FFFFFF';
  assert.deepEqual([...G.gPrintParts(st).map(p => p.join(' '))], ['minute #C9A55A', 'text #FFFFFF'], 'applied metal is not ink; the lines still are');
  st.text.line2 = ''; st.text.foot = '';
  assert.deepEqual([...G.gPrintParts(st).map(p => p[0])], ['minute'], 'a metal logo with no lines prints nothing');
  st.minute.on = false; assert.equal(G.gCommonInk(G.gPrintParts(st)), null);
  st.indices = {on:true, metal:null, color:'#FFFFFF'};
  assert.deepEqual([...G.gPrintParts(st).map(p => p[0])], ['indices']);
  st.indices.metal = 'white gold'; assert.equal(G.gPrintParts(st).length, 0);
});

test('the design check is put in plain words, on the step that fixes it', () => {
  assert.equal(G.gPlainCheck({ok:true, title:'Cyclops coverage'}), null, 'a pass is not a warning');
  for (const t of ['Movement and production review', 'Gem setting production review', 'Case reference', 'Stone source']) assert.equal(G.gPlainCheck({ok:false, title:t}), null, t + ' is a note');
  const cy = G.gPlainCheck({ok:false, title:'Cyclops coverage', layer:'date'});
  assert.equal(cy.step, 'calendar'); assert.equal(cy.text, "The magnifier doesn't cover the whole date.");
  assert.equal(G.gPlainCheck({ok:false, title:'Numeral envelope', layer:'numerals'}).text, 'The numerals run under the bezel.');
  assert.equal(G.gPlainCheck({ok:false, title:'Minute hand contrast', layer:'hands'}).step, 'hands');
  const other = G.gPlainCheck({ok:false, title:'Something new', layer:'text'});
  assert.equal(other.step, 'text', 'an unknown check still lands on its step');
  for (const [t, [k, words]] of Object.entries(G.G_CHECK_WORDS)) {
    assert.ok(STEPS.includes(k), t);
    assert.doesNotMatch(words, /Cyclops|envelope|ΔE|#[0-9A-F]{6}/i, t + ' is in plain words');
  }
  // every title the check can raise today has words of its own
  const titles = new Set([...source.matchAll(/add\([^,]+,\s*['"]([A-Z][^'"]+)['"]/g)].map(m => m[1]));
  for (const t of ['Hour','Minute','Seconds']) for (const s of [' hand clearance', ' hand contrast']) titles.add(t + s);
  const quiet = new Set(['Movement and production review','Gem setting production review','Case reference','Stone source','Two-tone parts']);
  const unworded = [...titles].filter(t => !quiet.has(t) && !G.G_CHECK_WORDS[t] && !/^Hour hand|^Minute hand|^Seconds hand|^\$|^name/.test(t));
  assert.deepEqual(unworded, []);
});

test('simple mode is version 3.2.0 and the drawing code is not touched by its preview', () => {
  assert.match(source, /const APP_VERSION = "3\.2\.0";/);
  // the preview's seconds-hand change is undone whatever happens while drawing
  const v = chunk('function viewSVG(){', 'function viewSVGOf(){');
  assert.match(v, /finally\{ S\.meta\.time = t; S\.sHand\.on = on; \}/);
  assert.doesNotMatch(chunk('function exportPlan(', '\n}\n'), /WatchGuidePreview/, 'exports never ask for the preview');
});
