// The maker's sheet (v4.8.0): one A3 landscape PDF page in the maker's own
// layout, as approved in Claude Design. Run from the real source: the
// specification lines written from the design, the change marks between
// versions, the file name, where every block sits on the page, and what the
// page may use so svg2pdf keeps it vector. The page itself (the Finish step's
// "For the maker" section, the preview, the PDF made in Chromium on desktop
// and on an emulated iPhone 15, Share and Save to device) was checked with
// Playwright, and every preset and saved design was confirmed to draw
// exactly as in 4.7.1.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(chunk('const PANTONE_FAMS =', 'const pantoneFind') + chunk('const hex2rgb = h =>', 'function pantoneLabel(')
  + 'const clone = o => JSON.parse(JSON.stringify(o));\n'
  + chunk('const deep = (a,b)=>', '\n') + '\n'
  + chunk('const VERNOY_CASE = {', 'const CASE_SPEC = new Proxy')
  + chunk('/* SHEET-PURE-BEGIN */', '/* SHEET-PURE-END */')
  + '\nthis.g={sheetRows,sheetPlan,sheetCompare,sheetInfo,sheetStrap,sheetFileName,buildSheetSVG,caseOutlineDrawing,sheetTextW,sheetMovement,sheetHandWarning,'
  + 'sheetCasebackRing,sheetFinishes,numArtSVG,numArtMetrics,SHEET_GRID,CASES,TK_NIVADA,NOREL_R4,VERNOY_CASE,deep,clone,nearestPantone};', ctx);
const G = ctx.g;
const BASE_SHEET = vm.runInContext('(' + chunk('  sheet:{designNo:"", date:""', '\n};').replace(/^\s*sheet:/, '') + ')', ctx);
const load = f => JSON.parse(fs.readFileSync(path.join(root, 'designs', f), 'utf8'));
const tk = () => G.deep({sheet:BASE_SHEET}, load('timekeeper-nivada.json'));
const norel = () => G.deep({sheet:BASE_SHEET}, load('norel-concept-d-powder-blue.json'));
const NOW = new Date(2026, 10, 17);
const greyA1 = st => { const a = G.clone(st); a.case.strapColor = '#B1B2B3'; a.sheet.strap = {type:'fabric Velcro'}; return a; };
const J = x => JSON.parse(JSON.stringify(x));
const line = r => (r.label ? r.label + ' ' : '') + r.text + (r.note ? ' ' + r.note : '') + (r.mark ? ` (${r.mark})` : '');

test('the specification lines are written from the design, in the maker\'s words and order', () => {
  const rows = G.sheetRows(tk());
  assert.deepEqual(J(rows.map(r => r.key)), ['case','band','dial','numerals','logo','logoScript','printing','hands','sec','buckle']);
  assert.deepEqual(J(rows.filter(r => !r.quiet).map(r => (r.label ? r.label + ' ' : '') + r.text)), [
    'Case: Stainless steel, vertical brush, polished bevels',
    'Band: Black rubber strap, flat',
    'Dial: Silver white vertical brush dial',
    'Shiny rose gold applied Arabic-Indic numerals, Noto Naskh Arabic font, 12 pcs',
    'Applied logo rose gold (shiny & sandblasted)',
    'Shiny rose gold UP logo Nivada',
    'Black printed: GRENCHEN, TIME KEEPER, SWISS MADE',
    'Hands: Shiny rose gold, pencil (W36017)',
    'Sec. Hand: Shiny rose gold, counterweight tail']);
  assert.ok(!rows.some(r => r.key === 'date'), 'no date row while the date is off');
  // the NOREL: its bracelet, its day-date, its printed numerals
  const n = G.sheetRows(norel()), t = n.map(line).join('\n');
  assert.match(t, /Band: Stainless steel bracelet/);
  assert.match(t, /Date: Arabic-Indic digits/); assert.match(t, /Day: Arabic day disc/);
  assert.match(t, /printed Arabic-Indic numerals, Noto Naskh Arabic font, \d+ pcs/);
});

test('Version A reproduces the approved page: the owner\'s mark on the dial and note on the script', () => {
  const plan = G.sheetPlan(tk(), [], NOW), A = plan.versions[0];
  assert.equal(plan.versions.length, 1);
  assert.equal(A.label, 'A');
  assert.equal(line(A.rows.find(r => r.key === 'dial')), 'Dial: Silver white vertical brush dial (changed)');
  assert.equal(line(A.rows.find(r => r.key === 'logoScript')), 'Shiny rose gold UP logo Nivada (same as before)');
  assert.ok(!A.rows.some(r => r.key === 'buckle'), 'the buckle is drawn, not listed, while it has no mark');
  assert.equal(plan.info.designNo, '103277_4');
  assert.equal(plan.info.brand, 'NIVADA GRENCHEN');
  assert.equal(plan.info.movement, 'Automatic Soprod P024 (without Date)');
  assert.equal(plan.info.date, '2026-11-17', 'empty means today');
  assert.equal(plan.fileName, 'NIVADA-GRENCHEN_103277_4_2026-11-17.pdf');
});

test('later versions list only what differs from A, marked, with the Pantone swatch for a new colour', () => {
  const st = tk(), a1 = greyA1(st);
  st.sheet.versions = [{ref:'v1', label:''}];
  const plan = G.sheetPlan(st, [{id:'v1', name:'grey fabric', state:a1}], NOW), V = plan.versions[1];
  assert.equal(V.label, 'A1');
  assert.deepEqual(J(V.rows.map(line)), ['Band: Grey fabric Velcro strap (New color)', 'Buckle: Silver colour (New color)']);
  assert.deepEqual([...V.rows[0].swatches], ['#B1B2B3']);
  const p = G.nearestPantone('#B1B2B3'); assert.equal(p.code, 'Cool Gray 5 C'); assert.ok(p.exact);
  const svg = G.buildSheetSVG(plan, {}).svg;
  assert.match(svg, /<rect x="[\d.]+" y="[\d.]+" width="5.82" height="3.70" fill="#B1B2B3"/);
  assert.match(svg, />Cool Gray 5 C</);
  assert.match(svg, /fill="#D7263D">\(New color\)</);
  // its buckle caption carries the mark too
  assert.match(svg, />Buckle of Velcro Fabric strap</); assert.match(svg, />silver color</);
});

test('marks against a baseline: (changed), (New), (New color), and nothing for the same', () => {
  const base = tk(), A = tk();
  delete A.sheet.rows.dial;                                   // the automatic marks only
  A.hHand.style = 'dauphine'; A.date.on = true; A.dial.color = '#E9E7E1';
  A.sheet.baseline = 'b';
  const rows = G.sheetPlan(A, [{id:'b', name:'Nivada 103277_3 A', state:base}], NOW).versions[0].rows;
  const by = k => rows.find(r => r.key === k);
  assert.equal(by('hands').mark, 'changed');
  assert.equal(by('date').mark, 'New');
  assert.equal(by('dial').mark, 'New color'); assert.deepEqual([...by('dial').swatches], ['#E9E7E1']);
  assert.equal(by('case').mark, ''); assert.equal(by('band').mark, '');
  // the owner's own mark wins over the automatic one, and "none" clears it
  A.sheet.rows = {hands:{mark:'none'}, case:{mark:'changed', note:'(bevel wider)'}};
  const r2 = G.sheetPlan(A, [{id:'b', name:'x', state:base}], NOW).versions[0].rows;
  assert.equal(r2.find(r => r.key === 'hands').mark, '');
  assert.equal(line(r2.find(r => r.key === 'case')), 'Case: Stainless steel, vertical brush, polished bevels (bevel wider) (changed)');
});

test('up to three more versions, labelled A1 to A3; a label of the owner\'s own survives saving and opening', () => {
  const st = tk(), saved = [1, 2, 3, 4].map(i => ({id:'v' + i, name:'v' + i, state:greyA1(st)}));
  st.sheet.versions = saved.map(v => ({ref:v.id, label:''}));
  assert.deepEqual(J(G.sheetPlan(st, saved, NOW).versions.map(v => v.label)), ['A', 'A1', 'A2', 'A3']);
  st.sheet.versions[1].label = 'B';
  const reopened = G.deep({sheet:BASE_SHEET}, JSON.parse(JSON.stringify(st)));
  assert.deepEqual(J(G.sheetPlan(reopened, saved, NOW).versions.map(v => v.label)), ['A', 'A1', 'B', 'A3']);
  // a version that is no longer saved is left out, not an error
  st.sheet.versions = [{ref:'gone', label:''}];
  assert.equal(G.sheetPlan(st, saved, NOW).versions.length, 1);
  // four on the sheet still fit inside the page, beside the 200% render
  st.sheet.versions = saved.slice(0, 3).map(v => ({ref:v.id, label:''}));
  const pl = G.sheetPlan(st, saved, NOW), fake = {url:'data:image/jpeg;base64,AA', wmm:47.76, hmm:71.64, fx:0.5, fy:0.4784};
  const { boxes } = G.buildSheetSVG(pl, {versions:[fake, fake, fake, fake]});
  const right = Math.max(...boxes.filter(b => /^(text|version)A/.test(b.name)).map(b => b.x + b.w));
  assert.ok(right < 288, 'the versions stop short of the 200% render (' + right.toFixed(1) + ')');
});

test('a design saved before the sheet existed opens with the case\'s defaults', () => {
  const old = load('valmont-cushion-roman.json');
  assert.equal(old.sheet, undefined);
  const st = G.deep({sheet:BASE_SHEET}, old), plan = G.sheetPlan(st, [], NOW);
  assert.equal(plan.versions.length, 1);
  assert.equal(plan.info.designNo, '');
  assert.ok(plan.fileName.endsWith('_2026-11-17.pdf'));
  // with no sheet at all, as a stored design might be
  delete st.sheet;
  assert.doesNotThrow(() => G.buildSheetSVG(G.sheetPlan(st, [], NOW), {}));
  // the case's defaults
  const K = G.TK_NIVADA, N = G.NOREL_R4;
  assert.equal(K.sheet.brand, 'NIVADA GRENCHEN'); assert.equal(N.sheet.brand, 'NOREL / Blue Creations');
  assert.equal(G.sheetMovement(norel()), 'Automatic Sellita SW240-1 (Day-Date)');
  const s = G.sheetStrap(tk());
  assert.deepEqual({...s}, {type:'rubber', style:'flat', maker:'', buckle:'pin buckle', buckleColor:'steel', buckleLogo:'engraved'});
  // another kind of strap brings its own buckle, not the rubber strap's details
  const f = G.sheetStrap(greyA1(tk()));
  assert.deepEqual({...f}, {type:'fabric Velcro', style:'', maker:'', buckle:'Velcro loop', buckleColor:'silver', buckleLogo:'none'});
  assert.equal(G.sheetStrap(norel()).buckle, 'folding clasp');
});

test('the file is named for the maker: brand, design number, date', () => {
  assert.equal(G.sheetFileName({brand:'NIVADA GRENCHEN', designNo:'103277_4', date:'2026-11-17'}), 'NIVADA-GRENCHEN_103277_4_2026-11-17.pdf');
  assert.equal(G.sheetFileName({brand:'NOREL / Blue Creations', designNo:'', date:'2026-11-17'}), 'NOREL_2026-11-17.pdf');
  assert.equal(G.sheetFileName({brand:'', designNo:'A/7 ß', date:'2026-11-17'}), 'Design_A-7_2026-11-17.pdf');
  assert.equal(G.sheetFileName({brand:'تايم كيبر', designNo:'1', date:'2026-11-17'}), 'Design_1_2026-11-17.pdf');
});

test('the page: A3 in millimetres, every block inside it, the renders at 1:1 and 200%', () => {
  const st = tk(), a1 = greyA1(st); st.sheet.versions = [{ref:'v1', label:''}];
  const plan = G.sheetPlan(st, [{id:'v1', name:'g', state:a1}], NOW);
  const photo = {url:'data:image/jpeg;base64,AA', wmm:1040/(1040*0.5863/28), hmm:1560/(1040*0.5863/28), fx:0.5, fy:0.4784};
  const R = {versions:[photo, photo], hands:{url:'data:image/jpeg;base64,AB', wmm:32}, dial:{url:'data:image/jpeg;base64,AC', wmm:32},
    front:{url:'data:image/jpeg;base64,AD', wpx:1160, hpx:870}, side:{url:'data:image/jpeg;base64,AE', wpx:740, hpx:925}};
  const { svg, boxes } = G.buildSheetSVG(plan, R);
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"[^>]* width="420mm" height="297mm" viewBox="0 0 420 297">/);
  for(const b of boxes){
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 420.001 && b.y + b.h <= 297.001, `${b.name} inside the page (${b.x.toFixed(1)}, ${b.y.toFixed(1)}, ${b.w.toFixed(1)} × ${b.h.toFixed(1)})`);
  }
  const by = n => boxes.find(b => b.name === n);
  // Version A at 1:1, its dial centre where the approved design has it
  const A = by('versionA'); assert.ok(Math.abs(A.w - photo.wmm) < 1e-6);
  assert.ok(Math.abs(A.x + A.w*0.5 - 66.17) < 0.01 && Math.abs(A.y + A.h*0.4784 - 49.13) < 0.01);
  // the 200% render: twice the size, the dial at (336.10, 79.31)
  const H = by('hero'); assert.ok(Math.abs(H.w - 2*photo.wmm) < 1e-6);
  assert.ok(Math.abs(H.x + H.w*0.5 - 336.10) < 0.01 && Math.abs(H.y + H.h*0.4784 - 79.31) < 0.01);
  assert.match(svg, />200%</);
  // the footer band, the panels, the movement, the brand tracked glyph by glyph
  const F = by('footer'); assert.equal(F.y, 284.5); assert.equal(F.y + F.h, 297);
  assert.match(svg, />Date: 17 November 2026</); assert.match(svg, />Design number: 103277_4</); assert.match(svg, />Designer: </);
  assert.match(svg, />Movement:  Automatic Soprod P024 \(without Date\)</);
  assert.match(svg, />H\/M.Hands: W36017 \(8.5x12mm\)</); assert.match(svg, />Sec. Hand: find existing \(13mm\)</);
  for(const t of ['Applied logo', 'Nivada script logo', 'Black printed', 'Numerals, 12 pcs', 'Applied, shiny rose gold',
    'Font: Noto Naskh Arabic', 'Dial', 'Vertical brush, silver white', 'Numerals', 'Caseback', 'XX/XX to XX/XX', 'Buckle for rubber', 'Engraved logo'])
    assert.ok(svg.includes('>' + t + '<'), t);
  assert.equal((svg.match(/y="292.3"[^>]*font-weight="bold"[^>]*>[A-Z]</g) || []).length, 14, 'NIVADA GRENCHEN set one glyph at a time');
  // the owner's two drawings stand in the technical row
  assert.ok(by('front') && by('side'));
});

test('only what svg2pdf draws as vector: Helvetica text, paths, no filters, masks, textPath or letter-spacing', () => {
  const st = tk(); st.sheet.notes = 'Please confirm the crown logo depth.';
  const { svg } = G.buildSheetSVG(G.sheetPlan(st, [], NOW), {});
  assert.doesNotMatch(svg, /<filter|filter=|<mask|mask=|<textPath|letter-spacing|<foreignObject|@font-face|mix-blend|<marker|<use /);
  const fams = new Set([...svg.matchAll(/font-family="([^"]+)"/g)].map(m => m[1]));
  assert.deepEqual([...fams], ["Helvetica, Arial, 'Liberation Sans', sans-serif"]);
  assert.match(svg, />Notes:</);
  // the caseback's ring is set glyph by glyph on the circle, turned so the edition number sits under its callout
  assert.ok((svg.match(/<text transform="rotate\(/g) || []).length > 50);
});

test('words Helvetica cannot draw go in as pictures, drawn by the browser', () => {
  const st = tk(); st.sheet.caseback = 'تايم كيبر · XX/XX · SWISS MADE'; st.sheet.designer = 'محمد';
  const seen = [];
  const raster = (t, size) => { seen.push(t); return {url:'data:image/png;base64,QQ', wmm:t.length*size*0.5, hmm:size*1.5, ascmm:size*1.05}; };
  const { svg } = G.buildSheetSVG(G.sheetPlan(st, [], NOW), {}, {raster});
  assert.ok(seen.includes('تايم كيبر'), 'the Arabic ring words');
  assert.ok(seen.includes('Designer: محمد'), 'a mixed line is drawn whole');
  assert.doesNotMatch(svg, />[^<]*[؀-ۿ][^<]*</, 'no Arabic left as text');
  assert.ok((svg.match(/<image href="data:image\/png;base64,QQ"/g) || []).length >= 2);
  assert.deepEqual([...G.sheetCasebackRing(st)], ['تايم كيبر', 'XX/XX', 'SWISS MADE']);
});

test('a case with no drawing gets a vector outline from its figures, with the maker\'s dimensions', () => {
  const N = G.NOREL_R4, svg = G.caseOutlineDrawing(N, G.sheetFinishes(norel()), 40.5, 247);
  for(const t of ['41mm', '26.4mm', '21mm', '48mm', '31.4mm', 'Dial Opening']) assert.ok(svg.includes('>' + t + '<'), t);
  // the 41mm dimension's arrow tips are 41.00 apart, the 48mm's 48.00
  const tips = [...svg.matchAll(/<path d="M([\d.]+) ([\d.]+)L[^"]+Z" fill="#B23A55"\/>/g)].map(m => [+m[1], +m[2]]);
  assert.ok(tips.some(a => tips.some(b => Math.abs(b[1] - a[1]) < 1e-6 && Math.abs(b[0] - a[0] - 41) < 0.01)), '41mm');
  assert.ok(tips.some(a => tips.some(b => Math.abs(b[0] - a[0]) < 1e-6 && Math.abs(b[1] - a[1] - 48) < 0.01)), '48mm');
  assert.equal((svg.match(/stroke-width="0.07"/g) || []).length, 1, 'the 72 flutes, as one path');
  // no side view is made up for it, and the page falls back to this outline
  const { svg: page, boxes } = G.buildSheetSVG(G.sheetPlan(norel(), [], NOW), {});
  assert.ok(page.includes('>41mm<') && !boxes.some(b => b.name === 'side'));
});

test('the hand reference is checked against the lengths the maker gave for it', () => {
  const st = tk();
  assert.equal(G.sheetHandWarning(st), '');
  st.hHand.length = 8.1;
  assert.equal(G.sheetHandWarning(st), 'Hour hand drawn 8.1 mm, reference says 8.5 mm');
  st.sheet.handRef = '';
  assert.equal(G.sheetHandWarning(st), '');
});

test('the drawing code is untouched: the dial\'s production guides are only left out when asked', () => {
  assert.match(source, /if\(scope==="dial" && o\.guides !== false\)\{\n    over\.push\(`<circle r="\$\{dialD\/2\}" fill="none" stroke="#1F4E6B"/);
  assert.match(source, /buildSVG\(d, mat \? \{scope:"dial", guides:false, matPx:SHEET_MAT_HERO, tag:"sd"\}/);
  // svgToPng draws on white and hands back a PNG unless told otherwise
  assert.match(source, /g\.fillStyle = \(opt && opt\.bg\) \|\| "#fff";/);
  assert.match(source, /if\(opt && opt\.canvas\)\{ settled = true; clearTimeout\(timer\); clean\(\); resolve\(cv\); return; \}/);
});

test('the PDF libraries are vendored at pinned versions with their licences, loaded on first use and kept offline', () => {
  for(const f of ['jspdf-2.5.2.umd.min.js', 'svg2pdf-2.2.4.umd.min.js', 'JSPDF-LICENSE.txt', 'SVG2PDF-LICENSE.txt'])
    assert.ok(fs.existsSync(path.join(root, 'vendor', f)), f);
  assert.match(fs.readFileSync(path.join(root, 'vendor/JSPDF-LICENSE.txt'), 'utf8'), /Permission is hereby granted/);
  assert.match(fs.readFileSync(path.join(root, 'vendor/jspdf-2.5.2.umd.min.js'), 'utf8').slice(0, 2000), /jsPDF/);
  assert.doesNotMatch(source, /<script[^>]+src="\.\/vendor\/(jspdf|svg2pdf)/, 'not loaded with the page');
  assert.match(source, /await add\("\.\/vendor\/jspdf-2\.5\.2\.umd\.min\.js"\);/);
  for(const f of ['./vendor/jspdf-2.5.2.umd.min.js', './vendor/svg2pdf-2.2.4.umd.min.js', './app/tk-f77-front.png', './app/tk-f77-side.png'])
    assert.ok(sw.includes(`"${f}"`), f + ' in the offline shell');
  // the owner's drawings are the sizes the case says
  for(const [f, w, h] of [['tk-f77-front.png', 1160, 870], ['tk-f77-side.png', 740, 925]]){
    const b = fs.readFileSync(path.join(root, 'app', f));
    assert.equal(b.readUInt32BE(16), w, f); assert.equal(b.readUInt32BE(20), h, f);
    assert.ok(b.length < 150000, f + ' is optimised');
  }
  assert.deepEqual(J(G.TK_NIVADA.sheet.drawings.front), {file:'./app/tk-f77-front.png', w:1160, h:870});
});

test('offered where the design is finished and exported, in English and Arabic', () => {
  assert.match(source, /\["maker","Maker's sheet \(PDF\)","A3 for the maker"\]/);
  assert.match(source, /"Maker's sheet \(PDF\)":"ورقة المصنع \(PDF\)"/);
  assert.match(source, /<button class="btn" id="mkSheetBtn"[^>]*>Maker's sheet \(PDF\)<\/button>/);
  assert.match(source, /\["For the maker", \[\n    \["sheet","Maker's sheet",null\]\]\]/);
  assert.match(source, /maker:\(\)=>openMakerSheet\(\)/);
  assert.match(source, /type === "application\/pdf"\n    \? \(shareable \? "Share opens your phone's share sheet: Mail, WhatsApp or Save to Files\."/);
  // simple mode's form writes into the design, so the details travel with it and its saved versions
  for(const p of ['sheet.designNo', 'sheet.designer', 'sheet.brand', 'sheet.movement', 'sheet.strap.type', 'sheet.strap.buckle', 'sheet.handRef', 'sheet.secRef', 'sheet.caseback', 'sheet.notes'])
    assert.ok(source.includes(`"${p}"`), p);
});

test('the dial panel points at every part with how it is made, one label for each technique', () => {
  const st = tk(); st.text.footTech = 'engraved + filled';
  const rows = G.sheetRows(st).map(r => r.text);
  assert.ok(rows.includes('Black printed: GRENCHEN, SWISS MADE'), rows.join(' | '));
  assert.ok(rows.includes('Engraved, filled black: TIME KEEPER'));
  const { svg, boxes } = G.buildSheetSVG(G.sheetPlan(st, [], NOW), {});
  // a label wraps to its column, so the heading is read across its lines
  for(const t of ['Black printed', 'TIME KEEPER', 'Engraved, filled black'])
    assert.ok(svg.includes('>' + t + '<'), t);
  assert.match(svg, />GRENCHEN · SWISS( MADE)?</);
  // the dial panel above the hands, the numerals in the dial's old place, nothing overlapping
  const by = n => boxes.find(b => b.name === n), over = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const D = by('dial'), N = by('numerals'), H = by('hands');
  assert.ok(D && N && H);
  assert.ok(D.w > 110 && D.y + D.h < H.y && D.y + D.h < N.y, 'the dial panel spans the hands and numerals and sits above them');
  for(const b of boxes) if(b !== D) assert.ok(!over(D, b), `dial panel clear of ${b.name}`);
  // every technique a line can take has words for the maker
  for(const t of ['printed','double printed','engraved + filled','engraved','gloss on matte','brushed across','uv ink']){
    const s2 = tk(); s2.text.line2Tech = t;
    assert.ok(G.sheetRows(s2).some(r => /GRENCHEN/.test(r.text) && !/undefined/.test(r.text)), t);
  }
});

test('the numerals panel names the font and how the figures are made', () => {
  const st = tk(); st.numerals.height = 0.5;
  const { svg } = G.buildSheetSVG(G.sheetPlan(st, [], NOW), {numerals:{url:'data:image/jpeg;base64,AF', ar:1/3}});
  assert.match(svg, />Font: Noto Naskh Arabic</);
  assert.match(svg, />Applied, shiny rose gold</);
  assert.match(svg, />4mm high, 0.5mm thick, 12 pcs</);
  assert.match(svg, /<image href="data:image\/jpeg;base64,AF"/);
  // the plain styles are named by the font they stand for; the drawn sets as drawn
  const name = (style, system) => { const s2 = tk(); Object.assign(s2.numerals, {style, system}); return G.sheetRows(s2).find(r => r.key === 'numerals').text; };
  assert.match(name('modern', 'western 0–9'), /Barlow Condensed font/);
  assert.match(name('vernoy', 'western 0–9'), /Vernoy figures \(drawn\) font/);
  assert.match(name('vernoy', 'arabic ٠–٩'), /Amiri font/);
  // the NOREL: its day and date windows have their own labels
  const n = G.buildSheetSVG(G.sheetPlan(norel(), [], NOW), {}).svg;
  assert.match(n, />Day window</); assert.match(n, />Date window</);
});

test('the numerals artwork: the font\'s own outlines, black on white, sized as the dial draws them', () => {
  const OUT = JSON.parse(fs.readFileSync(path.join(root, 'app/font-outlines.json'), 'utf8'));
  const naskh = OUT['Noto Naskh Arabic'].g;
  for(const c of '٠١٢٣٤٥٦٧٨٩') assert.ok(naskh[c] && /^M/.test(naskh[c].d), c);
  // y runs down: a digit's ink sits above its baseline
  assert.ok(naskh['١'].b[1] < 0 && naskh['١'].b[3] <= 0.001);
  assert.match(naskh['١'].d, / 0\.243 -0\.009Q/, 'minus signs kept');
  const st = tk(), A = '٠١٢٣٤٥٦٧٨٩', lab = n => String(n).split('').map(d => A[+d]).join('');
  const labels = Array.from({length:12}, (_, i) => lab(i + 1));
  const M = G.numArtMetrics(st, OUT);
  assert.ok(Math.abs(M.h - 0.72*st.numerals.size) < 1e-9, 'digits\' ink 0.72 of the numeral size, as the dial draws them');
  const svg = G.numArtSVG(st, OUT, {brand:'NIVADA GRENCHEN', designNo:'103277_4', date:'2026-11-18'}, labels);
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="297mm" height="210mm" viewBox="0 0 297 210">/);
  // ten digits, then twelve figures twice (5:1 and 1:1), three of them two digits long
  assert.equal((svg.match(/<path /g) || []).length, 10 + 2*15);
  assert.doesNotMatch(svg, /<image|<filter|<mask|<textPath|letter-spacing|<use /);
  assert.ok(!/[؀-ۿ]/.test(svg.replace(/d="[^"]*"/g, '')), 'no Arabic as text: it is all outline');
  assert.match(svg, />Numerals · Noto Naskh Arabic</);
  assert.match(svg, />Hour figures, 5:1/); assert.match(svg, />Actual size, 1:1</);
  assert.match(svg, /Applied, shiny rose gold  ·  12 pcs  ·  digits 2.9mm high  ·  0.2mm thick/);
  // a dial with windows: only the figures it carries
  const n = norel(); n.numerals.style = 'Noto Naskh Arabic';
  const sv2 = G.numArtSVG(n, OUT, {brand:'NOREL'}, labels);
  assert.ok(sv2);
  // a drawn set or a font with no outlines is not faked
  const v = tk(); v.numerals.style = 'vernoy'; v.numerals.system = 'western 0–9';
  assert.equal(G.numArtSVG(v, OUT, {}, labels), null);
  assert.match(sw, /"\.\/app\/font-outlines\.json"/);
});
