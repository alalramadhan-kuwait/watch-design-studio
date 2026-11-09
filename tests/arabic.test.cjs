// Simple mode in Arabic, and Arabic on the dial, run from the real source:
// every sentence and label has its Arabic, the panel turns right to left,
// English is unchanged, the Arabic faces are embedded, and a disc in two
// languages is flagged for the movement maker. The page itself (layout,
// right-to-left rows and sliders, lettering shaped in Safari) was checked in
// WebKit and Chromium with Playwright.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(chunk('/* GUIDE-PURE-BEGIN', '/* GUIDE-PURE-END */')
  + '\nthis.g={GSTR,gT,gW,GWORD,G_DIR,G_CHECK_WORDS,G_CHECK_AR,gReadout,gPlainCheck};', ctx);
const G = ctx.g;
const lang = l => vm.runInContext(`GLANG = ${JSON.stringify(l)}`, ctx);
const guide = chunk('/* GUIDED MODE — see the stylesheet note above.', '</script>');
const AR = /[؀-ۿ]/;

test('every sentence simple mode shows has its Arabic, of the same kind', () => {
  const en = G.GSTR.en, ar = G.GSTR.ar;
  const missing = Object.keys(en).filter(k => !(k in ar));
  assert.deepEqual(missing, [], 'keys with no Arabic');
  assert.deepEqual(Object.keys(ar).filter(k => !(k in en)), [], 'Arabic keys English does not have');
  for (const k of Object.keys(en)) {
    assert.equal(typeof ar[k], typeof en[k], k + ' is a ' + typeof en[k] + ' in both');
    if (typeof ar[k] === 'function') {
      const args = Array.from({length: Math.max(1, en[k].length)}, (_, i) => i === 0 ? (k === 'list' ? ['أ', 'ب', 'ج'] : 3) : 2);
      const s = ar[k](...args);
      assert.equal(typeof s, 'string', k);
      if (!/^(col\.pantone|day\.custom|u\.deg|u\.pct|u\.x|eg\.|more$)/.test(k)) assert.match(s, AR, k + ' reads in Arabic');
    } else if (en[k] && !/^(card\.norel|card\.vernoy|case\.(norel|r3|d)|lang\.more)$|^eg\./.test(k)) assert.match(ar[k], AR, k + ' reads in Arabic');
  }
  assert.equal(ar['lang.more'], 'English', 'the switch is written in the language it switches to');
  assert.equal(en['lang.more'], 'عربي');
});

test('gT speaks the chosen language and falls back to English', () => {
  lang('ar');
  try {
    assert.equal(G.gT('next', G.gT('step.dial')), 'التالي: الميناء');
    assert.equal(G.gT('step.markers'), 'المؤشرات');
    assert.equal(G.gT('no.such.key'), 'no.such.key');
    assert.equal(G.gT('fin.issues', 1), 'أمر واحد يحتاج نظرة');
    assert.equal(G.gT('fin.issues', 4), '4 أمور تحتاج نظرة');
    assert.equal(G.gT('list', ['الأرقام', 'المؤشرات', 'مسار الدقائق']), 'الأرقام، المؤشرات ومسار الدقائق');
    // millimetres keep Western digits; a degree or a per cent is isolated so its sign stays beside the number
    assert.equal(G.gReadout(3.3, 'mm', 0.05), '3.30 ملم');
    assert.equal(G.gReadout(-6.2, 'pos', 0.1), '6.2 ملم فوق المركز');
    assert.equal(G.gReadout(38, 'deg', 0.5), '⁦38.0°⁩');
    assert.equal(G.gReadout(0.35, 'pct', 0.05), '⁦35%⁩');
    assert.equal(G.gT('text.eg', G.gT('eg.line2')), 'مثلاً أوتوماتيك');
  } finally { lang('en'); }
  // English is exactly as it was
  assert.equal(G.gT('next', 'Dial'), 'Next: Dial');
  assert.equal(G.gReadout(38, 'deg', 0.5), '38.0°');
  assert.equal(G.gReadout(0.35, 'pct', 0.05), '35%');
  assert.equal(G.gT('list', ['numerals', 'markers', 'minute track']), 'numerals, markers and minute track');
  assert.equal(G.gT('gem.summary', 9, 'Ø1.50 mm', '0.12', '0.45', '0.30', true), '9 stones · Ø1.50 mm · ≈ 0.12 ct · stands 0.45 mm · 0.30 mm under the minute hand · lab-grown');
  assert.equal(G.gW('Gold'), 'Gold', 'labels are untouched in English');
});

test('every label written into the steps has an Arabic word', () => {
  const W = G.GWORD.ar, labels = new Set();
  // [value, "Label"] pairs in chip, card and swatch lists
  for (const m of guide.matchAll(/\[\s*(?:"[^"]*"|null|-?\d+(?:\.\d+)?|DAY_BOTH|DAY_ALT|'[^']*')\s*,\s*"([A-Z][^"]*)"/g)) labels.add(m[1]);
  // headings, toggles, sliders, text fields and "All … settings" links
  for (const m of guide.matchAll(/gW\("([^"]+)"\)/g)) labels.add(m[1]);
  for (const m of guide.matchAll(/(?:toggle|textIn)\("[^"]+",\s*"([^"]+)"/g)) labels.add(m[1]);
  for (const m of guide.matchAll(/slider\([^,]+,\s*"([^"]+)"/g)) labels.add(m[1]);
  for (const m of guide.matchAll(/more\("[^"]+",\s*"([^"]+)"\)/g)) labels.add(m[1]);
  // the preset layouts and the dial colours shown by name
  for (const m of chunk('const MARKER_PRESETS = [', '];').matchAll(/\["\w+", "([^"]+)"\]/g)) labels.add(m[1]);
  for (const m of chunk('const DIAL_CLASSICS = [', '];').matchAll(/\["([^"]+)","#/g)) labels.add(m[1]);
  // proper names and figures stay as they are
  const asIs = /^(NOREL|Pantone|Day-Date|\d|[IVX ]+$|Ø)/;
  const missing = [...labels].filter(l => !asIs.test(l) && W[l] == null);
  assert.deepEqual(missing, [], 'labels with no Arabic word');
  assert.ok(labels.size > 150, 'the scan found the labels (' + labels.size + ')');
  lang('ar');
  try {
    assert.equal(G.gW('Diamond'), 'ألماس', 'the stone');
    assert.equal(G.gW('Diamond', 'shape'), 'معيّن', 'the marker shape');
    assert.equal(G.gW('Amiri'), 'Amiri', "a face's name is its name");
  } finally { lang('en'); }
});

test('the design check reads in Arabic, the bilingual disc included', () => {
  assert.deepEqual(Object.keys(G.G_CHECK_WORDS).filter(t => !G.G_CHECK_AR[t]), [], 'every worded check has Arabic');
  for (const [t, s] of Object.entries(G.G_CHECK_AR)) assert.match(s, AR, t);
  assert.deepEqual([...G.G_CHECK_WORDS['Bilingual day disc']], ['calendar', 'Sellita must confirm a bilingual SW240-1 day disc.']);
  lang('ar');
  try {
    const w = G.gPlainCheck({ok:false, title:'Bilingual day disc', layer:'day'});
    assert.equal(w.step, 'calendar'); assert.match(w.text, /Sellita/); assert.match(w.text, AR);
  } finally { lang('en'); }
  // the check itself raises it for either kind of disc, as a point to settle
  const c = chunk("      if(st.day.lang==='Arabic + English'||st.day.lang==='Arabic / English'){", '\n    }\n');
  assert.match(c, /add\(false,'Bilingual day disc',/);
  assert.match(c, /Sellita must confirm/);
  // and simple mode puts the warning on the day tab
  assert.match(guide, /w\.tab = \/\^Day\|day disc\/\.test\(w\.title\)/);
});

test('the panel turns right to left in Arabic; the watch does not', () => {
  assert.equal(G.G_DIR.ar, 'rtl'); assert.equal(G.G_DIR.en, 'ltr');
  assert.match(guide, /guide\.dir = G_DIR\[GLANG\]/);
  assert.match(guide, /const LANG_KEY = "wds:lang";/, 'the choice is kept on the device');
  assert.match(guide, /localStorage\.setItem\(LANG_KEY, l\)/);
  // the switch is on the Start step and in More
  assert.match(guide, /data-glang="\$\{l\}"/);
  assert.match(guide, /slots\.prepend\(mobileLang\)/);
  // the stage is never given a direction, and the mirrored rules are all scoped to the panel
  assert.doesNotMatch(guide, /stage[^\n]*\.dir\s*=/);
  const css = chunk('/* RIGHT TO LEFT. The panel in Arabic', '</style>');
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+\{/g).map(s => s.replace(/\{$/, '').trim()).filter(s => s && !s.startsWith('@media'));
  for (const sel of rules) for (const part of sel.split(',')) assert.match(part.trim(), /^#guide\[dir=rtl\]|^body\.guided #gLangBtn$/, part);
  assert.match(css, /linear-gradient\(to left, var\(--ds-brand\)/, 'a slider fills from the right');
});

test('the Arabic faces are embedded, listed and shaped straight on a curve', () => {
  // the interface face, in the sans stack after Plex Sans, limited to Arabic
  assert.match(source, /--sans:"IBM Plex Sans","IBM Plex Sans Arabic",system-ui,sans-serif;/);
  for (const w of [400, 600]) assert.match(source, new RegExp(`@font-face\\{font-family:'IBM Plex Sans Arabic';font-style:normal;font-weight:${w};font-display:swap;unicode-range:U\\+0600-06FF[^;]*;src:url\\(data:font/woff2;base64,d09GMg`));
  // the dial's lettering faces: the disc faces by the same names, now with the whole alphabet
  const block = chunk('const TEXT_FONTS_AR = {', '\n};');
  const names = [...block.matchAll(/^\s*"([^"]+)":\{family:"(wdstx\w+)", latin:"(serif|sans)", src:"data:font\/woff2;base64,(d09GMg[A-Za-z0-9+/=]+)"\}/gm)];
  assert.deepEqual(names.map(m => m[1]), ['Naskh', 'Amiri', 'Cairo', 'El Messiri', 'Tajawal']);
  assert.ok(!/Reem Kufi/.test(block), 'Reem Kufi, whose joins broke, is not offered');
  for (const m of names) assert.ok(m[4].length > 8000, m[1] + ' carries more than the seven day names');
  const day = chunk('const DAY_FONTS = {', '\n};');
  for (const m of names) assert.match(day, new RegExp(`"${m[1]}":\\{sc:"ar"`), m[1] + ' is also a disc face');
  assert.match(source, /const LETTER_FONTS = \["serif", "sans"\]\.concat\(Object\.keys\(TEXT_FONTS_AR\)\);/);
  assert.match(source, /const LINE_FONTS = \["sans", "serif"\]\.concat\(Object\.keys\(TEXT_FONTS_AR\)\);/);
  // serif and sans are written exactly as before, so existing designs do not change
  const lf = chunk('function letterFam(name, dflt, defs){', '\n}\n');
  const letterFam = new Function('TEXT_FONTS_AR', 'SERIF_FAM', 'SANS_FAM', lf + '\n}\nreturn letterFam;')(
    {Amiri:{family:'wdstxamiri', latin:'serif', src:'x'}}, "'Cormorant Garamond',Georgia,serif", "'IBM Plex Sans',sans-serif");
  assert.equal(letterFam('serif', 'sans'), "'Cormorant Garamond',Georgia,serif");
  assert.equal(letterFam('sans', 'sans'), "'IBM Plex Sans',sans-serif");
  assert.equal(letterFam(undefined, 'sans'), "'IBM Plex Sans',sans-serif", 'an old design with no line face');
  const defs = [];
  assert.equal(letterFam('Amiri', 'sans', defs), "'wdstxamiri','Cormorant Garamond',Georgia,serif");
  letterFam('Amiri', 'sans', defs);
  assert.equal(defs.length, 1, 'the face goes into the drawing once');
  // Arabic is never set on a textPath: each curved construction bends it instead
  const text = chunk('    // text\n    const tx = st.text;', '  /* ---------------- HANDS');
  assert.equal((text.match(/bentLine\(/g) || []).length, 5, 'the lines, printed logo, reserved and embossed cartouches and the nameplate');
  assert.match(chunk('const AR_CHARS', 'function bentLine'), /direction="rtl"/);
  assert.doesNotMatch(chunk('const arText', 'function bentLine'), /letter-spacing/, 'Arabic is not tracked');
});

test('a disc in two languages: both names in the window, or alternating', () => {
  assert.match(source, /const DAY_BOTH = "Arabic \+ English", DAY_ALT = "Arabic \/ English";/);
  assert.match(source, /SEL\("day\.lang","Day names",DAY_LANGS\)/);
  assert.match(guide, /chips\("day\.lang", \[\["Arabic","Arabic"\],\["English","English"\],\[DAY_BOTH,"Both together"\],\[DAY_ALT,"Alternating"\]\]/);
  const r = chunk('      const i = Math.max(0, DAY_NAMES_EN.indexOf(dy.shown));', 'tagLayer("day", dayStart);');
  assert.match(r, /const ar = dy\.lang === DAY_ALT \? dy\.altShown !== "English" : dy\.lang !== "English";/, 'a one-language disc reads as before');
  assert.match(r, /if\(both\) body\.push\(.*dayPair\(/);
  assert.match(chunk('function dayPair(', '\n}\n'), /bendArt\(straight/, 'the pair is bent like a single name, never set on a path');
});
