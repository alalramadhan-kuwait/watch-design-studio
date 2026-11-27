// Improvement plan, phase 2: missing capabilities. Every preset and
// designs/ file draws byte for byte as before each step.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const chunk = (a, b) => { const i = source.indexOf(a); assert.ok(i >= 0, a); const j = source.indexOf(b, i); assert.ok(j > i, b); return source.slice(i, j); };

test('lume (v4.13.0): one colour for every hand and marker, and lume in any applied marker', () => {
  assert.match(source, /LUME_NOW = st\.lume && \/\^#\[0-9a-f\]\{6\}\$\/i\.test\(st\.lume\.color \|\| ""\) \? st\.lume\.color : null;/);
  assert.match(source, /const LUME_COLOURS = \[\["","Green-white"\],\["#E7D7A8","Old radium"\],\["#EFE6CB","Vintage cream"\],\["#F3F3EE","White"\],\["#D7E8F1","Ice blue"\],\["#CFE6C6","Jade"\]\];/);
  assert.doesNotMatch(source.replace(/lumeC\("#E9EFDF"\)|lumeC\("#D8E4C8"\)|: "#E9EFDF"|: "#D8E4C8"/g, ''), /fill="#E9EFDF"|fill="#D8E4C8"/, 'no lume paint left hard-coded');
  const L = chunk('function indexLume(ix, a){', '\n}\n');
  assert.match(L, /if\(!ix\.lume \|\| ix\.style === "f77" \|\| ix\.style === "box" \|\| ix\.style === "cone"\) return "";/);
  for (const k of ['dot', 'double', 'diamond', 'triangle', 'dagger']) assert.match(L, new RegExp(`case "${k}":`));
  assert.match(source, /const mk = indexShape\(ixK, i\*30, id, defs, laI\) \+ indexLume\(ixK, i\*30\);/);
  assert.match(source, /swatches\("lume\.color", LUME_COLOURS\.map/);
  assert.match(source, /add\("Lume", `\$\{nm2\} lume on the \$\{lumed\.join\(", "\)\}`, lc, ""\);/);
  // BASE carries an empty colour: older designs keep their green-white
  assert.match(source, /  lume:\{color:""\},\n  handSet:/);
});

test('minute track (v4.14.0): width rail to rail, rail and tick weights, five-minute style, a gap at 6, a check for the rehaut', () => {
  assert.match(source, /const rail = mt\.railW > 0 \? mt\.railW : Math\.max\(0\.045, Math\.min\(0\.08, t\*0\.18\)\);/, 'automatic as before');
  assert.match(source, /const tickW = mt\.tickW > 0 \? mt\.tickW : rail\*1\.15, fiveSt = mt\.fiveStyle \|\| "inward", gap6 = \+mt\.gap6 \|\| 0;/);
  assert.match(source, /if\(bold && fiveSt === "flared"\)\{/);
  assert.match(source, /const p0 = pt\(bold && fiveSt === "inward" \? r - t - Math\.min\(0\.45, t\*1\.2\) : r - t, a\)/);
  assert.match(source, /if\(inGap\(a\)\) continue;/);
  assert.match(source, /const gapR = gap6 > 0 \? 2\*Math\.ceil\(gap6\/12 - 1e-9\)\*6 : 0;/, 'the rails stop at the last mark');
  assert.match(source, /trackWMM:\{get:m => \+\(\(\+m\.thickness \|\| 0\)\*\(m\.style === "railroad" \? 2 : 1\)\)/);
  assert.match(source, /add\(mo<=r-0\.10,'Minute track in view'/);
  assert.match(source, /"Minute track in view":\["dial","Part of the minute track is hidden under the rehaut\."\]/);
  assert.match(source, /chips\("minute\.fiveStyle", \[\["inward","Run inward"\],\["plain","Plain"\],\["flared","Flared"\]\]/);
});

test('honeycomb guilloché and a brushed-steel chapter ring (v4.15.0)', () => {
  assert.match(source, /const GUIL_PATTERNS = \["clous","nid","orge",/);
  assert.match(source, /nid:"nid d'abeille \(honeycomb\)"/);
  const g = chunk('    case "nid": {', '    case "clous": {');
  assert.match(g, /const hd = Math\.max\(qx, qx\*0\.5 \+ qy\*0\.8660254\);/, 'the hexagonal distance');
  assert.match(g, /return \(0\.5 - hd\)\*c\*tw\*\(P\.facet \|\| 1\);/);
  assert.match(source, /S\.dial\.pattern === "clous" \|\| S\.dial\.pattern === "nid"/, 'lay and facet offered as for clous');
  assert.match(source, /SEL\("chapter\.finish","Finish",\["flat","matte","gloss","sunburst","grained","enamel","brushedsteel"(,"circular","sandblasted")?\]\)/);
});

test('each hour its own size and turn (v4.16.0), for markers and stones, and the maker is told', () => {
  assert.match(source, /const hourRot = \(st, i, a\) => \{ const t = hourTune\(st, i\); if\(!t \|\| t\.rot == null\) return 0; return t\.rot === "upright" \? -a : \(\+t\.rot \|\| 0\); \};/);
  assert.match(source, /const g = sc === 1 \? g0 : Object\.assign\(\{\}, g0, \{d:g0\.d\*sc, L:g0\.L\*sc, W:g0\.W\*sc, s:g0\.s\*sc\}\);/);
  assert.match(source, /const m = gemMarkerSVG\(g, la - \(a \+ rot\)\*Math\.PI\/180, seed, cx, dialT\);/, 'the facets lit for the stone\'s own angle');
  assert.match(source, /if\(sc !== 1\) ixK = Object\.assign\(\{\}, ixK, \{length:ixK\.length\*sc, width:ixK\.width\*sc\}\);/);
  assert.match(source, /chips44\("ui\.hourRot", \[\["0","Toward the centre"\],\["upright","Upright"\],\["45","On point"\],\["90","Across"\]\], cur\)/);
  assert.match(source, /slider\("markers\.hourScaleUi", "Size of this hour", 0\.6, 1\.6, 0\.05,/);
  assert.match(source, /row\("perHour", "", `Per hour: \$\{tt\}`/);
});

test('big date (v4.18.0): two windows in one opening, tens and units discs, a centre bar, the size outside the frame', () => {
  const vm = require('node:vm');
  const ctx = vm.createContext({});
  vm.runInContext(chunk('function dateBar(dt){', 'function dateAutoDigitH(dt){') + 'this.r = {dateBar, dateOuter};', ctx);
  const { dateBar, dateOuter } = ctx.r;
  assert.equal(dateBar({w:4.8}), 0.8, 'a 0.8 mm bar unless set');
  assert.equal(dateBar({w:4.8, bar:2}), 1.44, 'never more than 30% of the opening');
  assert.equal(dateBar({w:4.8, bar:0.1}), 0.3);
  assert.deepEqual(JSON.parse(JSON.stringify(dateOuter({w:4.8, h:2.04, edge:'bevel', bevel:0.25}))), {w:5.3, h:2.54, e:0.25});
  assert.deepEqual(JSON.parse(JSON.stringify(dateOuter({w:4.8, h:2.04, frameW:0.4}))), {w:5.6, h:2.84, e:0.4});
  assert.equal(dateOuter({w:4.8, h:2.04, frameW:0.14}).e, 0, 'a thin printed line adds nothing');
  // drawing: one window as before, or two halves of dt.w either side of the bar
  const d = chunk('    // date window', '      /* The cyclops magnifies');
  assert.match(d, /const xs = big \? \[-\(W1 \+ bar\)\/2, \(W1 \+ bar\)\/2\] : \[0\];/);
  assert.match(d, /const atX = \(x, s\) => big \? `<g transform="translate\(\$\{f\(x,3\)\},0\)">\$\{s\}<\/g>` : s;/, 'a single window is not wrapped');
  assert.match(d, /const parts = big \? \[num\[0\] === "0" && dt\.zero === "blank" \? "" : toAr\(num\[0\]\), toAr\(num\[1\]\)\] : \[digits\];/);
  // turning it on widens to two windows of at least 2 mm, turning it off gives the width back
  assert.match(source, /bigUi:\{get:d => d\.big \? "big" : "single",/);
  assert.match(source, /d\.wSingle = d\.w; d\.big = true; d\.w = Math\.max\(d\.w, \+\(2\*Math\.max\(2\.0, d\.h\*0\.9\) \+ Math\.max\(0\.3, \+d\.bar > 0 \? \+d\.bar : 0\.8\)\)\.toFixed\(2\)\);/);
  assert.match(source, /delete d\.big; if\(d\.wSingle > 0\) d\.w = d\.wSingle; delete d\.wSingle;/);
  // the check, the sheet and the controls
  assert.match(source, /if\(st\.date&&st\.date\.on&&st\.date\.big\)add\(!!\(cal&&cal\.bigDate\),'Big date movement'/);
  assert.match(source, /if\(cal&&st\.date&&st\.date\.on&&!st\.date\.big\)\{/, 'the single-ring size and position rows do not judge a big date');
  assert.match(source, /\$\{dt\.big \? `big date, tens and units discs, \$\{sn\(dateBar\(dt\), 2\)\}mm centre bar; ` : ""\}/);
  assert.match(source, /\(\$\{mm\(o\.w\)\} × \$\{mm\(o\.h\)\}mm outside\)/);
  assert.match(source, /chips\("date\.bigUi", \[\["single","One window"\],\["big","Big date"\]\]/);
  assert.match(source, /SEL\("date\.bigUi","Windows",\["single","big"\]\)/);
});

test('findability (v4.19.0): find a setting, folds kept, long rows wrapped, "+ Any" first, labels say what they move', () => {
  // the search: every step's page and More sheet, as this design has them
  assert.match(source, /<input type="search" class="gFindIn" placeholder="\$\{esc2\(gT\("find\.ph"\)\)\}"/);
  assert.match(source, /function findPage\(out, i, x, tb\)\{/);
  assert.match(source, /for\(const tb of \(tabs\.length \? tabs : \[null\]\)\)\{ if\(!\(x\.k === "case" && \(tb === "shape" \|\| tb === "designs"\)\)\) findPage\(out, i, x, tb\); \}/);
  assert.match(source, /out\.push\(\{i, t:lab, where:x\.t \+ " › " \+ gW\(sec\.t\), sec:id, subs, p:/);
  assert.match(source, /if\(r\.tab\) subTab\[STEPS\[r\.i\]\.k\] = r\.tab;/, 'a result opens its tab');
  assert.match(source, /secOpen\.add\(r\.sec\); secShut\.delete\(r\.sec\);/, 'and its section of the sheet');
  assert.match(source, /el\.scrollIntoView\(\{block:"center", behavior:"smooth"\}\);/);
  assert.match(source, /"find\.ph":"Find a setting"/); assert.match(source, /"find\.ph":"ابحث عن إعداد"/);
  // Arabic matches with or without hamza and tashkeel
  const norm = new Function('return ' + source.match(/const findNorm = (t => [^\n]+);/)[1])();
  assert.equal(norm('أبعاد'), norm('ابعاد'));
  assert.equal(norm('Guilloché'), 'guilloche');
  // the More sheet opens the way it was left, after a reload too
  assert.match(source, /const FOLD_KEY = "wds\.moreFolds";/);
  assert.match(source, /if\(d\.dataset\.gmsec \|\| d\.dataset\.gmsub\) saveFolds\(\);/);
  assert.match(source, /try \{ localStorage\.setItem\(FOLD_KEY,/);
  // a choice row of more than six wraps, so the ninth is not off the screen
  assert.match(source, /const chips = \(path, opts, cur\) => `<div class="gChips\$\{opts\.length > 6 \? " wrap" : ""\}">/);
  assert.match(source, /\.gChips\.gMade, \.gChips\.wrap\{ flex-wrap:wrap;/);
  // "+ Any" first, wearing the colour when it is not one of the swatches
  const sw = chunk('  const swatches = (path, list, cur, opt) => {', '\n  const ');
  assert.ok(sw.indexOf('<label title=') < sw.indexOf('${list.map('), '"+ Any" comes first');
  assert.match(sw, /const own = isHex\(cur\) && !list\.some/);
  // labels that name what they move
  for (const [k, l] of [['minute.diameter', 'Minute track diameter'], ['hour.diameter', 'Hour track diameter'], ['numerals.radius', 'Numerals from centre'], ['indices.radius', 'Indices from centre']])
    assert.match(source, new RegExp(`"${k.replace('.', '\\.')}":"${l}"|slider\\("${k.replace('.', '\\.')}", "${l}"`), k + ': on the More table, or on its tab since 4.47.0');
  assert.match(source, /slider\("indices\.radius", "Indices from centre", 6, 14\.5, 0\.05, ix\.radius\)/, 'the index distance beside the index size');
  // the hands say whether they move together, where they are changed
  assert.match(source, /h \+= toggle\("ui\.link", "Hands move together", L\)/);
  // a panel with more below fades at its foot
  assert.match(source, /function downEdge\(\)\{ body\.classList\.toggle\("down",/);
});

test('research board (v4.21.0): references in the design file, on the specification, and names kept off the watch', () => {
  const vm = require('node:vm');
  const ctx = vm.createContext({});
  vm.runInContext(chunk('function researchHits(st, words){', '\n/* a big date') + 'this.r = researchHits;', ctx);
  const hits = ctx.r;
  const st = {text:{logo:'Nivada', line2:'TIME KEEPER', foot:'SWISS MADE'}, hHand:{style:'dauphine'}, numerals:{style:'Bodoni Moda'}, dial:{pattern:'clous'}, meta:{name:'Calatrava study'}};
  assert.deepEqual(JSON.parse(JSON.stringify(hits(st, ['nivada', 'Bodoni']))), [{w:'nivada', where:'the logo'}, {w:'Bodoni', where:"the numerals' face"}]);
  assert.equal(hits(st, ['Calatrava']).length, 0, "the design's own name is not on the watch");
  assert.match(source, /add\(!hits\.length, 'Names kept off the watch',/);
  assert.match(source, /"Names kept off the watch":\["text",/);
  // kept in S.sheet.research: {refs:[{id, title, url, note}], avoid}
  assert.match(source, /const r = \{id:v\("id"\), title:v\("title"\), url:v\("url"\), note:v\("note"\)\};/);
  assert.match(source, /apply\("sheet\.research\.refs", refs\.slice\(0, 40\)\)/);
  assert.match(source, /textIn\("sheet\.research\.avoid", "Keep off the watch", R\.avoid, gT\("rs\.avoidPh"\)\)/);
  assert.match(source, /add\("Reference" \+ \(r\.id \? " " \+ r\.id : ""\),/);
  // a link opens apart from the studio, never as a script
  assert.match(source, /<a href="\$\{esc2\(\/\^https\?:\\\/\\\/\/i\.test\(r\.url\) \? r\.url : "https:\/\/" \+ r\.url\)\}" target="_blank" rel="noopener noreferrer"/);
});

test('export polish (v4.22.0): the image size kept on the device, 2400 px on a phone, files named after the design', () => {
  assert.match(source, /const EXPORT_PX_KEY = "wds:exportPx";/);
  assert.match(source, /return S\.exportPx \|\| mine \|\| \(isTouch \? 2400 : 3000\);/);
  assert.doesNotMatch(source, /S\.exportPx \|\| \(isTouch \? 1600 : 3000\)/, 'no stray default left');
  assert.match(source, /<button class="btn" data-px="3000" style="flex:1">Largest<\/button>/);
  const slugSrc = source.match(/const slug = \(\) => ([\s\S]+?\|\| "watch");/)[1];
  const slugOf = name => new Function('S', 'return ' + slugSrc)({meta:{name}});
  assert.equal(slugOf('Time Keeper × Nivada — Huit Carrés'), 'time-keeper-nivada-huit-carres');
  assert.equal(slugOf('ساعة تايم كيبر'), 'ساعة-تايم-كيبر');
  assert.equal(slugOf('***'), 'watch');
  assert.match(source, /const pngName = kind => kind === "template" \|\| kind === "front" \? `\$\{slug\(\)\}\.png` : `\$\{slug\(\)\}-\$\{kind\}\.png`;/);
});

test('colour as made (v4.23.0): the lamp\'s darkening undone on request, the rendered colour shown, and a clear coat that reads', () => {
  // exposure raised by the flat dial's irradiance, only when asked
  assert.match(source, /const expo = exposure\*\(opt\.asMade \? 1\/\(G\.ambient \+ \(1 - G\.ambient\)\*Math\.max\(0\.05, L\[2\]\)\) : 1\);/);
  assert.match(source, /override: surf \|\| null, brush, asMade:!!made,/);
  assert.match(source, /\(surf\.dome \|\| surf\.satin \|\| surf\.granSize \|\| surf\.granite !== undefined\) \? surf : null, st\.dial\.brushDir, !!\(st\.render && st\.render\.asMade\)\);/);
  assert.match(source, /mode, az, el, px, CASE_SPEC\.dialD, made \? "made" : "",/, 'the cache keeps the two apart');
  // the studio light: 0.30 ambient and the key at 52 degrees light a flat dial at 0.85
  const k = 1 / (0.30 + 0.70 * Math.sin(52 * Math.PI / 180));
  assert.ok(k > 1.15 && k < 1.2);
  // the clear coats each have a sheen, matte none
  for (const [f, v] of [['gloss', '0\\.05'], ['lacquer', '0\\.07'], ['enamel', '0\\.03']]) assert.match(source, new RegExp(`  ${f}: +\\{[^\\n]*sheen:${v}\\}`));
  assert.doesNotMatch(source.match(/  matte: +\{[^\n]*\}/)[0], /sheen/);
  // the Colour tab: as typed beside as rendered, and the switch
  assert.match(source, /const rh = d\.finish !== "stone" \? renderedDialHex\(S\) : null;/);
  assert.match(source, /toggle\("render\.asMade", "Show the colour as made", !!S\.render\.asMade\)/);
  assert.match(source, /"col\.asMade":"Raises the light so the render shows the paint as it is, not as a lamp darkens it\. The maker's sheet always gives the colour typed\."/);
});

test('production artwork (v4.24.0): a dimensioned plan, a separation per ink, the stones placed, and vector layers', () => {
  // the inks: printed, double-printed or filled parts of the specification, by colour
  const di = chunk('function dialInks(st){', '\n}\n');
  assert.match(di, /\/\^\(Minute track\|Hour track\|Numerals\|Indexes\|Logo\|Text \)\//);
  assert.match(di, /print\|filled\|uv ink/);
  // a separation keeps a part within ΔE 4 of its ink, drops see-through passes and the second copy of a part, and never prints stones or windows
  const io = chunk('function inkOnly(svg, hex, colour, skip){', '\n}\n');
  assert.match(io, /const fOk = df <= 4, sOk = ds <= 4;/);
  assert.match(io, /const see = \+cs\.opacity < 0\.9 \|\| \(fOk && \+cs\.fillOpacity < 0\.9 && !sOk\);/);
  assert.match(io, /if\(was && was\.d <= d0\)\{ el\.setAttribute\("display", "none"\); return; \}/);
  assert.match(source, /const sk = new Set\(\["gems", "day", "date", "sub"\]\)/);
  assert.match(source, /if\(nm\.tech === "applied"\) sk\.add\("numerals"\); if\(ix\.applied !== false\) sk\.add\("indices"\);/);
  // pages: plan at 4:1, each ink at 1:1 and 4:1 from a 2400 dpi separation, the stones; the date window upright
  assert.match(source, /await page\(dialPlanSVG\(S, under, box, info\), true\);/);
  assert.match(source, /const png = await artPNG\(inkOnly\(artDial\(S, "sep" \+ i\), inks\[i\]\.hex, null, artSkip\(S\)\), box, 2400\);/);
  assert.match(source, /const gp = gemPlanSVG\(S, box, info\); if\(gp\) await page\(gp\);/);
  assert.doesNotMatch(chunk('function dialPlanSVG(', '\n}\n'), /rotate\(/, 'windows are drawn upright, as on the dial');
  // the vector layers: one nested svg per ink, sized in the outer viewBox's own units
  assert.match(source, /<svg id="ink-\$\{i \+ 1\}" data-ink="\$\{ink\.hex\}" viewBox="\$\{vb\}" width="\$\{gf\(box\)\}" height="\$\{gf\(box\)\}"/);
  // offered in Export and in Finish
  assert.match(source, /id="dialArtBtn"/); assert.match(source, /id="inkLayersBtn"/);
  assert.match(source, /\["dialart","Dial artwork \(PDF\)","Plan, inks and stones"\]/);
});

test('closing the review (v4.25.0): a date on the no-date P024, lines of writing apart, lettering clear of the opening, the logo carries its line', () => {
  assert.match(source, /if\(st\.date&&st\.date\.on&&!st\.date\.big&&!cal&&\/without date\/i\.test\(mv\)\)add\(false,'Date and the movement',/);
  assert.match(source, /gap=Math\.abs\(a\[1\]-b\[1\]\)-\(a\[2\]\+b\[2\]\)\/2; if\(gap<0\.15\)/);
  assert.match(source, /add\(R<=r-0\.30,'Lettering clear of the opening',/);
  for (const t of ['Date and the movement', 'Lines of writing apart', 'Lettering clear of the opening']) assert.ok(source.split(`"${t}":`).length >= 3, t + ' has its plain sentence and its Arabic');
  assert.match(source, /else if\(path === "text\.logoY"\)\{ const dy = \+v - \(\+S\.text\.logoY \|\| 0\); S\.text\.logoY = \+v;/);
  assert.match(source, /S\.text\.line2Follow !== false\) S\.text\.line2Y = \+\(\(\+S\.text\.line2Y \|\| 0\) \+ dy\)\.toFixed\(3\);/);
  assert.match(source, /\(s\.k === "text" && S\.sHand && S\.sHand\.on \? `<p class="gNote">\$\{gT\("text\.secHidden"\)\}<\/p>` : ""\)/);
});

test('track numbers (v4.26.0): 5 to 60 or 1 to 12 round the minute track, upright in the lower half, checked against the opening', () => {
  const m = chunk('      if(mt.nums === "minutes" || mt.nums === "hours"){', '\n    // hour track');
  assert.match(m, /const lab0? = mt\.nums === "hours" \? String\(i \|\| 12\) : String\(i \? i\*5 : 60\);/);   // lab0 since 4.61.0: the same numbers, also in the dial's figures
  assert.match(m, /const rot = a > 90 && a < 270 \? a \+ 180 : a, p = pt\(nr, a\);/);
  assert.match(m, /if\(inGap\(a\)\) continue;/, 'none in the gap at 6');
  assert.match(source, /chips\("minute\.nums", \[\["none","None"\],\["minutes","5 to 60"\],\["hours","1 to 12"\]\], nmode\)/);
  assert.match(source, /SEL\("minute\.nums","Track numbers",\["none","minutes","hours"\]\)/);
  assert.match(source, /add\(R<=r-0\.30,'Track numbers in view',/);
  assert.match(source, /, numbered \$\{mt\.nums === "hours" \? "1 to 12" : "5 to 60"\}/);
  // the turn: upright at 12 and 6, reading down at 3 and up at 9
  const rot = a => a > 90 && a < 270 ? a + 180 : a;
  assert.deepEqual([0, 90, 180, 270].map(rot), [0, 90, 360, 270]);
});

test('painted hands (v4.27.0): a lacquered colour of the hand\'s own, kept when the file is opened again', () => {
  // a material of its own, its colours from the hand's colour; not offered as a metal
  assert.match(source, /"painted": +\{core:"#888888", dark:"#101112", lite:"#FFFFFF", spec:0\.34\}/);
  assert.match(source, /const HAND_MATERIALS = Object\.keys\(HAND_MATERIAL\)\.filter\(k => k !== "painted"\);/);
  assert.match(source, /if\(h\.paint && !h\.material && \/\^#\[0-9a-f\]\{6\}\$\/i\.test\(h\.color \|\| ""\)\) return "painted";/);
  assert.match(source, /if\(m === "painted"\) return h\.color;/);
  // only a hand marked painted: older colour hands draw as they always did
  assert.match(source, /const handPainted = h => !!h && !!h\.paint && !h\.material/);
  // stored as an empty metal, which opening the file does not fill back in with steel
  assert.match(source, /S\.sHand\.material = ""; S\.sHand\.color = c; S\.sHand\.paint = true;/);
  assert.match(source, /S\[k\]\.material = ""; S\[k\]\.color = c; S\[k\]\.paint = true;/);
  // the choices, and a metal clears the mark without touching a painted seconds
  assert.match(source, /chips\("sHand\.material", METALS6\.concat\(\[\["flame blue","Flame blue"\],\["gilt","Gilt"\],\["painted","Painted"\]\]\)/);
  assert.match(source, /swatches\("sHand\.color", HAND_PAINT, sh\.color, \{row:true\}\)/);
  assert.match(source, /if\(S\[k\] && !\(k === "sHand" && handPainted\(S\[k\]\)\)\)\{ S\[k\]\.material = v; delete S\[k\]\.paint; \}/);
  assert.match(source, /const HAND_SHARE = \[[^\]]*"paint"(,"bevel")?\];/);
  // the sheet says painted, and keeps a PANTONE name as written
  assert.match(source, /return h\.paint \? `\$\{nm\} painted/);
});

test('granular dial (v4.28.0): a fine hard grain sized in mm, each grain light or dark, the light ones glinting', () => {
  assert.match(source, /  granular: +\{rough:0\.62, metal:0\.06, aniso:0\.00, groove:"none", +coat:0\.08, grain:0, +dish:0\.012, granite:1, granSize:0\.07\},/);
  assert.match(source, /let GRAN_SHARP = 3, GRAN_K = 1\.3, GRAN_G = 2\.2;/);
  // in millimetres, so the same in every picture
  assert.match(source, /const n1 = mVnoise\(ux\/gs, uy\/gs\), n2 = mVnoise\(ux\/\(gs\*0\.5\) \+ 17\.3, uy\/\(gs\*0\.5\) - 9\.1\);/);
  assert.match(source, /: albedoTex \? mSrgb2lin\(albedoTex\[i\+c\]\/255\) : kd\[c\]\)\*granK;/);
  assert.match(source, /if\(granG > 0\) v \+= granG\*\(0\.05 \+ 0\.6\*spec\);/);
  // the size and strength reach the raster and its cache
  assert.match(source, /if\(finish === "granular"\)\{ if\(st\.dial\.granSize > 0\) surf\.granSize = \+st\.dial\.granSize;/);
  assert.match(source, /surf \? \[surf\.dome, surf\.satin, surf\.granSize, surf\.granite\]\.join\("\."\) : "-",/);
  // offered, named, and drawn in the plain drawing too
  assert.match(source, /\["grained","Grained"\],(\["sandblasted","Sandblasted"\],)?\["granular","Granular"\],/);
  assert.match(source, /slider\("dial\.granSize", "Grain size", 0\.04, 0\.30, 0\.01,/);
  assert.match(source, /\} else if\(finish==="granular"\)\{/);
  assert.match(source, /granular:"granular, coarse grain"/);
});

test('timing flange (v4.29.0): ticks from the inner or outer edge, fifths between the minutes, and long minute marks on the dial', () => {
  assert.match(source, /const tSpan = L => tAlign === "inner" \? \[r, r \+ L\] : tAlign === "outer" \? \[r - L, r\] : \[r - L\/2, r \+ L\/2\];/);
  assert.match(source, /len = five&&mt\.fives \? Math\.max\(mt\.fiveLen, 0\.6\) : \(mt\.tickLen > 0 \? \+mt\.tickLen : Math\.max\(t\*1\.6, 0\.42\)\);/, 'unset, the length is the old one');
  assert.match(source, /for\(let i = 0; i < 300; i\+\+\)\{ if\(i % 5 === 0\) continue; const a = i\*1\.2; if\(inGap\(a\)\) continue;/);
  assert.match(source, /else if\(ht\.style==="minuteMarks"\)\{ const L = ht\.len > 0 \? \+ht\.len : 1\.4;/);
  assert.match(source, /for\(let i=0;i<60;i\+\+\)\{ if\(i%5===0\) continue; const a=i\*6, p0=pt\(r-L,a\), p1=pt\(r,a\);/, 'none where the hours are');
  assert.match(source, /marksOn:\{get:h => !!h\.on && h\.style === "minuteMarks",/);
  assert.match(source, /chips\("minute\.tickAlign", \[\["centre","Centre"\],\["inner","Inner edge"\],\["outer","Outer edge"\]\]/);
  assert.match(source, /toggle\("minute\.fifths", "Fifths between the minutes", !!S\.minute\.fifths\)/);
  assert.match(source, /toggle\("hour\.marksOn", "Minute marks on the dial", get\(S, "hour\.marksOn"\)\)/);
});

test('square plots and a woven Velcro strap (v4.30.0)', () => {
  // an applied square with chamfered edges, each lit by where it faces, and its lume
  assert.match(source, /case "square": \{ const q = W, b = W\*0\.22,/);
  assert.match(source, /case "square": +s = `<rect x="\$\{f\(-W\*0\.62,3\)\}"/);
  assert.match(source, /case "square": +return g\(`<rect x="\$\{f\(-W,3\)\}"/);
  assert.match(source, /\["dot","Dot"\],\["square","Square"\],\["diamond","Diamond"\],\["box","Box"\]\]\), ix\.style\)/);
  // the strap: a rib knit in mm and a twisted cord seam, on the photograph
  assert.match(source, /function fabricTex\(x, y\)\{/);
  assert.match(source, /const cw = 0\.90, bl = 0\.45, col = Math\.floor\(x\/cw\)/);
  assert.match(source, /const tw = 0\.62 \+ 0\.38\*Math\.cos\(2\*Math\.PI\*\(ay\/0\.42 \+ off\*1\.6\)\)/);
  assert.match(source, /if\(\(c\.strapType !== "fabric" && c\.strapType !== "alligator"( && c\.strapType !== "bracelet")?( && c\.strapType !== "crackle")?\) \|\| !K\.photoStrap \|\| K\.bracelet \|\| c\.strap === false\) return null;/);
  assert.match(source, /\+ "\|" \+ \(fab \? \(fab\.type \|\| "fabric"\) \+ \(fab\.stitch \|\| ""\) : ""\);/, 'cached apart from rubber');
  assert.match(source, /\["rubber","Rubber"\],\["fabric","Fabric \(Velcro\)"\],\["alligator","Alligator leather"\](,\["crackle","Vintage crackle leather"\])?(,\["bracelet","Steel bracelet"\])?\]/);
  assert.match(source, /S\.sheet\.strap\.type = v === "fabric" \? "fabric Velcro" : v === "alligator"( \|\| v === "crackle" \|\| v === "leather")? \? "leather" : (v === "bracelet" \? "bracelet" : )?"rubber";/, 'the maker\'s sheet says so');
});

test('printed rehaut ring (v4.31.0): a ring outside the dial on the photograph, with a minute track of its own', () => {
  assert.match(source, /  rehaut:\{on:false, color:"#141A24", marks:"dots", markColor:"#EDEFF2"\},/, 'off unless chosen');
  const t = chunk('  let rehautOver = "";', '  return `<svg xmlns');
  assert.match(t, /if\(own && RH && RH\.on\)\{/, 'only over a photographed case');
  assert.match(t, /r0 = openMM\/2 - 0\.02, r1 = RH\.outerD > openMM \? RH\.outerD\/2 : Math\.min\(openMM\/2 \+ 1\.05,/);
  assert.match(t, /if\(RH\.marks === "ticks"\)\{ const L = \(r1 - r0\)\*\(five \? 0\.62 : 0\.38\)/);
  assert.match(source, /<\/g>\$\{rehautOver\}\$\{gemOver\}/);
  assert.match(source, /toggle\("rehaut\.on", "Outer chapter ring \(rehaut\)", !!\(S\.rehaut && S\.rehaut\.on\)\)/);
  assert.match(source, /chips\("rehaut\.marks", \[\["dots","Dots"\],\["ticks","Ticks"\],\["none","None"\]\]/);
  assert.match(source, /if\(rh && rh\.on\) add\("Outer chapter ring \(rehaut\)", `printed, between the dial and the bezel/);
});

test('concepts (v4.32.0): the studio\'s designs kept in the repository and on the start screen', () => {
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  assert.ok(list.length >= 8);
  for (const c of list) {
    const st = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', c.file), 'utf8'));
    assert.ok(st.case && st.dial && st.meta, c.id + ' is a design');
    assert.ok(fs.existsSync(path.join(__dirname, '../concepts', c.picture)), c.id + ' has its picture');
  }
  assert.match(source, /fetch\("\.\/concepts\/index\.json"\)/);
  assert.match(source, /else if\(id\.startsWith\("c:"\)\)\{ const c = conceptRefs\.find\(x => x\.id === id\);/);
  assert.match(fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8'), /"\.\/concepts\/index\.json",/, 'offline too');
});

test('power reserve, small seconds, lance, alligator (v4.33.0)', () => {
  assert.match(source, /  power:\{on:false, at:3, dist:10\.8, r:6\.0,/, 'off unless chosen');
  assert.match(source, /<g data-layer="power">/);
  assert.match(source, /\["power","Power reserve","power\.on"\],/, 'listed with the parts');
  assert.match(source, /CK\("power\.on","Show a power reserve"\),/);
  assert.match(source, /SEL\("sub\.ticks","Track marks",\["12","60"\]\)/);
  assert.match(source, /CK\("sub\.hand","Small seconds hand"\)/);
  assert.match(source, /"Lance":"رمح"/);
  const g = chunk('function alligatorTex(x, y){', 'function strapTintPixels(');
  assert.match(g, /B = \[4\.5, 7\.9\]/, 'a broad scale down the middle, narrower to the edges');
  assert.match(g, /mHash\(id, 8\.1\)\*rl/, 'each column on its own rhythm');
  assert.match(source, /tex = gator \? alligatorTex\(x, y \+ 60\) : fabricTex\(x \+ 40, y \+ 60\);/, 'measured from the strap\'s centre line');
  for (const t of ['Power reserve and the movement', 'Small seconds and the movement']) assert.ok(source.includes(t), t);
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  assert.ok(list.findIndex(x => x.id === 'chocolat-77') >= 0, 'listed among the concepts (the newest first: or-damier since 4.42.0)');
});

test('designs tab and the movement rule (v4.34.0)', () => {
  assert.match(source, /if\(k === "case"\) return \["designs","shape","metal"\];/);
  assert.match(source, /if\(tab === "designs"\) return (cmpSet \? compareBlock\(\) : )?watchesBlock\(\);/);
  assert.match(source, /data-gdo="keep">\$\{gT\("start\.saveNow"\)\}/, 'Save beside what was saved');
  assert.match(source, /powerReserve:\(\) => !!caseOf\(S\)\.powerReserve \|\| !!\(S\.power && S\.power\.on\)\}/);
  assert.match(source, /"sub\.hand":\(\) => !!caseOf\(S\)\.smallSeconds \|\| !!\(S\.sub && S\.sub\.hand\),/);
  assert.match(source, /\{id:"power", (tab:"extras", )?t:"Power reserve", src:"power", need:"powerReserve", needSay:"more\.noPower",/);
  assert.ok(!/powerReserve:\s*true|smallSeconds:\s*true/.test(source), 'no case has such a movement yet; a test to change when one does');
  // every concept keeps to what its movement drives
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  for (const c of list) {
    const st = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', c.file), 'utf8'));
    assert.ok(!(st.power && st.power.on), c.id + ': no power reserve');
    assert.ok(!(st.sub && st.sub.hand), c.id + ': no small seconds');
    if (st.case.model === 'Time Keeper × Nivada · F77') assert.ok(!(st.date && st.date.on), c.id + ': the P024 in the F77 has no date');
  }
  assert.match(fs.readFileSync(path.join(__dirname, '../CLAUDE.md'), 'utf8'), /Complications need a movement that drives them/);
});

test('red gold, the photo tent and leather that reads as leather (v4.35.0)', () => {
  assert.match(source, /"red gold":"#D39B78"/, 'a 5N red gold beside the rose');
  assert.match(source, /  "red gold":   \[\[0,"#140905"\],\[\.18,"#402416"\],\[\.40,"#9E5834"\],\[\.60,"#C09072"\]/, 'measured off a photograph of a polished 5N case');
  assert.match(source, /\[LUX_GOLD\["red gold"\],"Red gold \(5N\)"\]/, 'offered with the case metals');
  assert.match(source, /"rose gold":  \[\[0,"#130806"\],\[\.18,"#43221A"\]/, 'the rose gold as it was: designs in it unchanged');
  assert.match(source, /  tent:    \{az:135, el:52, key:1\.5, skyFloor:0\.02, skyTop:0\.14,/, 'a dark surround: no grey veil on a dark dial');
  assert.match(source, /SEL\("render\.mode","Renderer",\["old","studio","tent","neutral"\]\)/);
  assert.match(source, /tent:"Photo tent"/); assert.match(source, /"Photo tent":"خيمة تصوير"/);
  const g = chunk('function alligatorTex(x, y){', 'function strapTintPixels(');
  assert.match(g, /crease = 0\.30\*Math\.exp\(-Math\.pow\(d\/0\.11, 2\)\), rim = 0\.09\*/, 'thin creases with a lit rim, not gaps');
  assert.match(source, /pad = hwP \? 1 - 0\.32\*Math\.pow\(Math\.min\(1, Math\.abs\(x\)\/hwP\), 5\) : 1;/, 'padded: darker as it rolls over');
  assert.match(source, /seg = \(\(\(ay % 3\.0\) \+ 3\.0\) % 3\.0\)\/3\.0/, 'a twisted cord diving in every 3 mm');
  const c = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/chocolat-77.json'), 'utf8'));
  assert.equal(c.case.material, '#D39B78'); assert.equal(c.render.mode, 'tent'); assert.equal(c.dial.color, '#694229');
});

test('the logo comes with the case (v4.36.0)', () => {
  assert.match(source, /logo:\{brand:"Nivada", marks:\["Nivada shield \+ script", "Nivada script", "Nivada shield"\], text:"Nivada"\}/);
  assert.match(source, /logo:\{brand:"NOREL", marks:\["NOREL logo", "NOREL shield", "NOREL wordmark"\], text:"NOREL"\}/);
  assert.match(source, /logo:\{brand:"Vernoy", marks:\["Vernoy wordmark \(traced\)"\], text:"VERNOY", fromLetters:0\.70\}/);
  assert.match(source, /function commit\(\)\{\n  keepCaseLogo\(S\);/, 'held on every change');
  assert.match(source, /function paintAll\(\)\{ keepCaseLogo\(S\);/, 'and on every design opened');
  assert.match(source, /if\(tab === "logo" && caseBrandLogo\(S\)\)\{/, 'the Logo tab offers the brand\'s marks only');
  assert.match(source, /VERNOY_ART\.wordmark\.inner = VERNOY_ART\.wordmark\.inner\.replace\(\/ fill="#151515"\/g, ""\);/, 'the wordmark takes the dial\'s ink');
  assert.match(source, /'Logo and the case'/);
  // every concept carries its case's brand's logo
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  for (const c of list) {
    const st = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', c.file), 'utf8'));
    if (st.case.model === 'Time Keeper × Nivada · F77') assert.match(st.text.logoMark, /^Nivada (shield \+ script|script|shield)$/, c.id + ' carries the Nivada logo');
  }
  assert.match(fs.readFileSync(path.join(__dirname, '../CLAUDE.md'), 'utf8'), /The logo is the case's brand's/);
});

test('even figures (v4.36.1)', () => {
  assert.match(source, /"FPJ":\{family:"wdsfpj", (seated:true, )?src:/, 'FPJ is even in the font itself since 4.36.2, so it needs no flag');
  assert.match(source, /if\(!F \|\| !F\.even \|\| drawnOutline \|\| arcSet\) return \(\) => 1;/, 'other fonts as they were');
  assert.match(source, /return label => \{ const m = inkMetrics\(famUsed, label\); return m && m\.h > 0 \? Math\.max\(1, Math\.min\(1\.6, top\/m\.h\)\) : 1; \};/, 'each brought to the tallest');
  assert.match(source, /const label = numeralLabel\(n, sys\), sc = sc0\*evenK\(label\), fz = fsz\*sc;/);
});

test('the FPJ font rebuilt: one figure height, clean outlines (v4.36.2)', () => {
  const dir = path.join(__dirname, '../tools/fpj-font');
  for (const f of ['rebuild.py', 'glyphs.py', 'specimen.py', 'fpj-traced.woff2', 'fpj.woff2', 'README.md']) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const b64 = fs.readFileSync(path.join(dir, 'fpj.woff2')).toString('base64');
  assert.ok(source.includes('"FPJ":{family:"wdsfpj", seated:true, src:"data:font/woff2;base64,' + b64 + '"'), 'the studio carries the rebuilt font');
  assert.match(fs.readFileSync(path.join(dir, 'rebuild.py'), 'utf8'), /^H = 700 /m, 'one height for all ten');
});

test('FPJ figures upright (v4.36.3)', () => {
  const dir = path.join(__dirname, '../tools/fpj-font');
  assert.match(fs.readFileSync(path.join(dir, 'rebuild.py'), 'utf8'), /^TURN = \{'0': -13\.0, '2': 5\.0, '4': 5\.5, '5': 2\.5, '6': -2\.0, '7': -2\.0, '8': 1\.0\}$/m, 'the 0, 2 and 4 stood upright');
  for (const f of ['lean.py', 'segs.py', 'guides.py']) assert.ok(fs.existsSync(path.join(dir, f)), f + ' kept to measure them again');
  assert.match(source, /retraced from the photograph of the watch \(tools\/fpj-font\/retrace\)/, 'since 4.36.5 retraced from the watch');
});

test('FPJ figures seated, one by one (v4.36.4)', () => {
  const rb = fs.readFileSync(path.join(__dirname, '../tools/fpj-font/rebuild.py'), 'utf8');
  assert.match(rb, /^OVER = 10$/m, 'round and pointed edges dip past the lines');
  assert.match(rb, /^ROUND_TOP = set\('012346789'\)$/m); assert.match(rb, /^ROUND_BOTTOM = set\('035689'\)$/m);
  assert.match(rb, /^SEAT_ON_BASE = \{'2'\}$/m, 'the 2 on its base, not its tail');
  assert.match(rb, /^WIDTH = \{'2': 660\}$/m);
  assert.match(source, /"FPJ":\{family:"wdsfpj", seated:true, src:/, 'one baseline on the dial');
  assert.match(source, /if\(SF && SF\.seated && !drawnOutline\)\{ const mS = inkMetrics\(famUsed, NUM_SYSTEM\[sys\] \|\| "0123456789"\); if\(mS\) iy = -mS\.cy\*fz; \}/);
  for (const f of ['measure.py', 'big.py', 'turns.py']) assert.ok(fs.existsSync(path.join(__dirname, '../tools/fpj-font', f)), f);
});

test('FPJ figures retraced from the watch (v4.36.5)', () => {
  const dir = path.join(__dirname, '../tools/fpj-font/retrace');
  for (const f of ['extract.py', 'build.py', 'outlines.json', 'circle.txt', 'turn.json', 'base-for-3.woff2', 'README.md']) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const o = JSON.parse(fs.readFileSync(path.join(dir, 'outlines.json'), 'utf8'));
  assert.deepEqual(Object.keys(o).sort(), ['0', '1', '2', '4', '5', '6', '7', '8', '9'], 'every figure the dial has; the 3 it has not');
  const b = fs.readFileSync(path.join(dir, 'build.py'), 'utf8');
  assert.match(b, /^WEIGHT_FULL = set\('7 8'\.split\(\)\)/m, 'only the 7 and 8 brought to the set weight');
  assert.match(b, /^WEIGHT_PART = 0\.0 /m, 'the others as printed on the watch');
  assert.match(b, /out = out\.buffer\(-4, join_style=1\)\.buffer\(4, join_style=1\)/, 'spurs trimmed');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'turn.json'), 'utf8')), { 1: -2.6, 8: 1.8 });
  assert.ok(!fs.existsSync(path.join(dir, 'journe.jpg')), 'the photograph is not kept in the repository');
});

test('FPJ, the numerals new designs start in (v4.36.6)', () => {
  assert.match(source, /const DEFAULT_NUMERAL_FONT = "FPJ";/);
  assert.match(source, /S\.numerals\.system = "western 0–9"; S\.numerals\.style = DEFAULT_NUMERAL_FONT; \}/, 'a new design starts in FPJ');
  assert.match(source, /S\.numerals\.style = ok\.indexOf\(DF\) >= 0 \? DF : ok\[0\] \|\| "vernoy";/, 'Western figures turn to FPJ when the face cannot draw them');
  const tk = JSON.parse(fs.readFileSync(path.join(__dirname, '../designs/timekeeper-nivada.json'), 'utf8'));
  const st = tk.state || tk;
  assert.equal(st.numerals.system, 'arabic ٠–٩', 'the Time Keeper × Nivada keeps its Arabic figures'); assert.equal(st.numerals.style, 'Noto Naskh Arabic');
});

test('Max Bill Study, and tools to lift any dial (v4.37.0)', () => {
  const dir = path.join(__dirname, '../tools/dial-font');
  for (const f of ['dial.py', 'lift.py', 'build.py', 'maxbill/outlines.json', 'maxbill/face.json', 'maxbill/spec2.json', 'maxbill/maxbill.woff2', 'maxbill/README.md']) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const b64 = fs.readFileSync(path.join(dir, 'maxbill/maxbill.woff2')).toString('base64');
  assert.ok(source.includes('"Max Bill Study":{family:"wdsmaxbill", seated:true, src:"data:font/woff2;base64,' + b64 + '"}'), 'the studio carries the face');
  const o = JSON.parse(fs.readFileSync(path.join(dir, 'maxbill/outlines.json'), 'utf8'));
  assert.deepEqual(Object.keys(o).sort(), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], 'all ten figures from the watch');
  assert.ok(!fs.readdirSync(path.join(dir, 'maxbill')).some(f => /\.(jpe?g)$/i.test(f)), 'the photograph is not kept');
  assert.match(fs.readFileSync(path.join(dir, 'build.py'), 'utf8'), /def spline_ring\(/, 'outlines fitted between their corners');
});

test('Lange 1815 Study (v4.38.0)', () => {
  const dir = path.join(__dirname, '../tools/dial-font/lange');
  for (const f of ['outlines.json', 'spec.json', 'face.json', 'lange.woff2', 'README.md']) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const b64 = fs.readFileSync(path.join(dir, 'lange.woff2')).toString('base64');
  assert.ok(source.includes('"Lange 1815 Study":{family:"wdslange", seated:true, src:"data:font/woff2;base64,' + b64 + '"}'), 'the studio carries the face');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'face.json'), 'utf8')).derive, { 6: ['9', 180] }, 'the 6, cut by the small seconds, drawn from the 9');
  assert.match(fs.readFileSync(path.join(__dirname, '../tools/dial-font/build.py'), 'utf8'), /for d, \(src, ang\) in CFG\.get\('derive', \{\}\)\.items\(\):/);
  assert.ok(!fs.readdirSync(dir).some(f => /\.(jpe?g|png)$/i.test(f)), 'the photograph is not kept');
});

test('Reverso Study (v4.39.0)', () => {
  const dir = path.join(__dirname, '../tools/dial-font/reverso');
  for (const f of ['outlines.json', 'spec.json', 'face.json', 'reverso.woff2', 'README.md']) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const b64 = fs.readFileSync(path.join(dir, 'reverso.woff2')).toString('base64');
  assert.ok(source.includes('"Reverso Study":{family:"wdsreverso", seated:true, src:"data:font/woff2;base64,' + b64 + '"}'), 'the studio carries the face');
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(path.join(dir, 'outlines.json'), 'utf8'))).sort(), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], 'all ten from the watch');
  assert.ok(!fs.readdirSync(dir).some(f => /\.(jpe?g|png)$/i.test(f)), 'the photograph is not kept');
});

test('Pilot Study (v4.40.0)', () => {
  const dir = path.join(__dirname, '../tools/dial-font/pilot');
  for (const f of ['outlines.json', 'spec.json', 'face.json', 'pilot.woff2', 'README.md']) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const b64 = fs.readFileSync(path.join(dir, 'pilot.woff2')).toString('base64');
  assert.ok(source.includes('"Pilot Study":{family:"wdspilot", seated:true, src:"data:font/woff2;base64,' + b64 + '"}'), 'the studio carries the face');
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
  assert.equal(spec.dark, false, 'light figures on a dark dial');
  for (const d of ['0', '2', '7']) assert.match(spec.digits[d].from, /hands at 10:15/, d + ' traced whole where no hand covers it (since 4.40.1)');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'face.json'), 'utf8')).grow_per, { 0: -11.5, 2: -11.5, 7: -11.5 }, 'brought to the set\'s weight');
  const lift = fs.readFileSync(path.join(__dirname, '../tools/dial-font/lift.py'), 'utf8');
  for (const k of ["'unline'", "'boost'", "'box'", "'keep_px'"]) assert.ok(lift.includes(k), k);
  assert.ok(!fs.readdirSync(dir).some(f => /\.(jpe?g|png)$/i.test(f)), 'the photograph is not kept');
});

test('thickness for every figure, thinner too (v4.40.2)', () => {
  assert.match(source, /h \+= slider\("numerals\.weight", "Thickness", -0\.3, 0\.45, 0\.01, n\.weight \|\| 0\);/, 'shown for applied figures too (to -0.3 since 4.44.1)');
  assert.doesNotMatch(source, /stroke="\$\{st\.dial\.color\}" stroke-width="\$\{f\(-weight,3\)\}"/, 'no outline in the dial colour');
  assert.match(source, /const thinned = \(markup, w, k = 1\) => \{/);
  assert.match(source, /<mask id="\$\{mid\}" maskUnits="userSpaceOnUse"/);
  assert.match(source, /defs\.push\(`<g id="\$\{gid\}">\$\{weight < 0 \? thinned\(glyph, -weight, kOf\(ns\)\) : glyph\}<\/g>`\);/, 'applied pieces thinned');
  assert.match(source, /const pw = weight > 0 && kOf\(1\) > 0 \? weight : 0;/, 'applied pieces thickened, not only diamond-set ones');
  assert.match(source, /const wrapped = wrap\(g, kOf\(ns\)\);/);
  const M = chunk('function migrateNumerals(st){', '\n}\n');
  assert.match(M, /if\(!nm\.weightLive\)\{\n    if\(nm\.tech === "applied" && !\(typeof paveOn === "function" && paveOn\(st\)\)\) nm\.weight = 0;\n    nm\.weightLive = true;/, 'a value carried unseen cleared once');
});

test('the fonts as a grid (v4.40.3)', () => {
  assert.match(source, /h \+= `<div class="gCards gFaces all">\$\{faces\.map\(/, 'a grid, not one row');
  assert.match(source, /\.gCards\.all\{ display:grid !important;/);
  assert.match(source, /\.gCards\.all\.gFaces \.gName\{ white-space:normal;/, 'long names on two lines');
});

test('tap the watch to edit what you tapped (v4.41.0)', () => {
  const src = chunk('function gPickTarget(st, layer, x, y, pv){', '\n}\n') + '\n}';
  const pt = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
  const pick = new Function('pt', 'visR', src + '\nreturn gPickTarget;')(pt, st => 14);
  const st = { minute:{on:true, diameter:24, thickness:0.1}, hour:{on:false}, chapter:{on:true, innerD:20, outerD:21}, date:{on:true, at:3, dist:9, w:2.6, h:2},
    sub:{on:true, at:6, dist:7, diameter:6}, text:{logoY:-6, line2:'Time Keeper', line2Y:-3.5}, sHand:{on:true}, meta:{time:{h:10, m:10, s:30}} };
  assert.deepEqual(pick(st, 'numerals', 0, -10), {step:'markers', tab:'font'});
  assert.deepEqual(pick(st, 'indices', 0, -10), {step:'markers', tab:'shape'});
  assert.deepEqual(pick(st, 'text', 0, -6.2), {step:'text', tab:'logo'});
  assert.deepEqual(pick(st, 'text', 0, -3.4), {step:'text', tab:'lines'});
  assert.deepEqual(pick(st, 'hands', 0, 5, null), {step:'hands', tab:'seconds', hand:'sHand'}, 'at 6, where the seconds hand stands at :30');
  assert.deepEqual(pick(st, 'hands', 3, -0.5, null), {step:'hands', tab:'shape', hand:'mHand'}, 'towards 2, the minute hand');
  assert.deepEqual(pick(st, 'hands', 0, 5, {hideSeconds:true}).hand !== 'sHand', true, 'no seconds hand drawn, none picked');
  assert.deepEqual(pick(st, 'dial', -11.95, 0), {step:'dial', tab:'track'}, 'the minute track');
  assert.deepEqual(pick(st, 'dial', 0, 10.2), {step:'dial', tab:'keep', sec:'chapter'}, 'the chapter ring');
  assert.deepEqual(pick(st, 'dial', 9, 0), {step:'calendar', tab:'date'}, 'the date window');
  assert.deepEqual(pick(st, 'dial', 0, 7.5), {step:'dial', tab:'keep', sec:'sub'}, 'the sub-dial');
  assert.deepEqual(pick(st, 'dial', -5, -2), {step:'dial', tab:'keep'}, 'the plain dial keeps the tab');
  assert.deepEqual(pick(st, null, 0, -16), {step:'case', tab:'shape'}, 'the case');
  assert.equal(pick(st, null, 40, 40), null, 'the background is nothing');
  assert.match(source, /if\(ctm && ctm\.a && window\.WatchGuidePick\(k, \(e\.clientX - ctm\.e\)\/ctm\.a, \(e\.clientY - ctm\.f\)\/ctm\.d\)\) return;/);
  assert.match(source, /findGo\(\{i, tab: tab \|\| undefined, sec: t\.sec \? t\.step \+ ":" \+ t\.sec : undefined\}\);/);
  assert.match(source, /if\(Date\.now\(\) - stageDragAt < 400\) return;/, 'the end of a drag is not a tap');
});

test('Or Damier, the Vernoy photograph in gold, fine pomme rings (v4.42.0)', () => {
  // the design: the Vernoy cushion in gold on its photograph, Vernoy's own logo, no complication
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  assert.ok(list.findIndex(x => x.id === 'or-damier') >= 0, 'listed (newest first: noir-77 since 4.45.0)');
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/or-damier.json'), 'utf8'));
  assert.equal(d.case.model, 'Vernoy cushion · RD26-0172');
  assert.equal(d.case.material, '#D7B56D', 'yellow gold');
  assert.equal(d.tpl.on, true, 'on the photograph');
  assert.equal(d.text.logoMark, 'Vernoy wordmark (traced)', 'the case\'s own logo');
  assert.equal(d.sHand.on, false, 'the 1062 has no seconds');
  assert.equal(d.date.on, false); assert.equal(d.power.on, false); assert.equal(d.sub.on, false);
  assert.equal(d.numerals.system, 'roman I–XII'); assert.equal(d.numerals.tech, 'double printed', 'raised print (since 4.43.1)'); assert.equal(d.numerals.material, 'ink');
  assert.equal(d.sector.zones.some(z => z.pattern === 'damier' && z.edge === 'beads'), true, 'the checker centre edged in beads');
  assert.ok(fs.existsSync(path.join(__dirname, '../concepts/or-damier.jpg')));
  // the photograph: gold and the strap laid on by where the steel and the strap are
  assert.match(source, /builtinTint:\{body:\[18\.7, 10\.5\], deep:\[17\.6, 9\.6\], lug:\[9\.5, 12\.6, 21\.9\], crown:\[17\.4, 20\.6, 2\.7\], strap:\[10\.7, 16\.5\], strapL:58\}/);
  assert.match(source, /if\(!own && K\.builtinTint && tplImage === BUILTIN_CASE && \(vernoyGold\(st\) \|\| vernoyStrapHex\(st\)\)\)\{/);
  assert.match(source, /const metalShows = \(K, m\) => steelish\(m\) \|\| \(\(!!K\.photoParts \|\| !!K\.builtinTint\) && !!goldOf\(m\)\);/);
  const vm = require('node:vm'), ctx = vm.createContext({});
  vm.runInContext(chunk('const LUX_RAMP = {', '\n};\n') + '\n};\n' + chunk('function luxRampLUT(tone){', '\n}\n') + '\n}\n'
    + 'const hex2rgb = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];\n'
    + chunk('function builtinTintPixels(', '\n/* a fabric strap') + '\nthis.r = builtinTintPixels;', ctx);
  const T = {body:[18.7, 10.5], deep:[17.6, 9.6], lug:[9.5, 12.6, 21.9], crown:[17.4, 20.6, 2.7], strap:[10.7, 16.5], strapL:58};
  // three pixels in a row, 1 px per mm about x = 0: steel on the case at (16, 0), the white ground, a brown strap pixel
  const px = (r, g, b) => [r, g, b, 255];
  const W = 3, src = new Uint8ClampedArray([...px(150, 152, 154), ...px(255, 255, 255), ...px(78, 54, 41)]);
  const one = (i, y) => ctx.r(src, W, 1, {cx: [-15.5, -29.5, -1.5][i], cy: y, s: 1}, T, 'yellow gold', '#1E1E20').slice(i*4, i*4 + 3);
  const steel = one(0, 0.5); assert.ok(steel[0] > steel[2] + 20, 'steel on the case turns gold ' + steel);
  assert.deepEqual([...one(1, 0.5)], [255, 255, 255], 'the ground stays white');
  const strap = one(2, -19.5); assert.ok(strap[0] < 60 && Math.abs(strap[0] - strap[2]) < 12, 'the brown strap turns black ' + strap);
  // fine pomme rings once one is set
  assert.match(source, /const POMME_MIN = h\.fineRing \? 0\.07 : 0\.17, RING_MIN = h\.fineRing \? 0\.012 : 0\.030;/);
  assert.match(source, /if\(\/\^\(hHand\|mHand\|sHand\)\\\.\(pommeD\|ringW\)\$\/\.test\(p\)\)\{/);
});

test('a solid gold dial (v4.43.0)', () => {
  assert.match(source, /const DIAL_BLANKS = \[("German silver", )?("stainless steel", )?"18k yellow gold", "18k rose gold", "18k white gold"\];/);
  assert.match(source, /const dialBlank = st => \{ const b = st && st\.dial && st\.dial\.blank; return DIAL_BLANKS\.indexOf\(b\) >= 0 \? b : \(caseOf\(st\)\.dialMat \|\| "brass"\); \};/);
  assert.match(source, /let h = `<h3>\$\{gW\("Dial made of"\)\}<\/h3>` \+ chips\("dial\.blank"/, 'the choice in Dial › Surface');
  assert.match(source, /SEL\("dial\.blank","Dial made of",/, 'and in the full editor');
  assert.match(source, /dialText = `Solid \$\{d\.blank\} dial, \$\{sheetDialFinish\(d\)\}, \$\{sheetColourName\(d\.color\)\}`;/, 'the maker\'s sheet leads with it');
  assert.match(source, /<div><span>Dial blank<\/span><b>Ø\$\{f\(K\.dialD\)\} × \$\{f\(K\.dialT\)\} \$\{dialBlank\(S\)\}<\/b><\/div>/);
  assert.doesNotMatch(source, /\$\{f\(K\.dialT\)\} brass blank/, 'no blank called brass whatever it is');
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/or-damier.json'), 'utf8'));
  assert.equal(d.dial.blank, '18k yellow gold', 'Or Damier\'s dial is solid gold');
});

test('Or Damier as made: raised-print numerals, painted spear-tipped hands (v4.43.1)', () => {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/or-damier.json'), 'utf8'));
  for (const k of ['hHand', 'mHand']) {
    assert.equal(d[k].style, 'pomme-ouverte'); assert.equal(d[k].paint, true); assert.equal(d[k].material, '', 'paint, not a metal');
    assert.equal(d[k].color, '#38322F', 'a dark satin grey'); assert.equal(d[k].finish, 'brushed'); assert.equal(d[k].fineRing, true);
  }
  assert.ok(d.hHand.tipW >= 0.6 && d.mHand.tipW >= 0.45, 'spear tips beyond the ring');
  assert.equal(d.dial.blank, '18k yellow gold');
  // a painted hand's tip has a soft sheen, not a polished metal ridge
  assert.match(source, /stroke-opacity="\$\{MAT === "painted" \? 0\.15 : 0\.7\}" stroke-width="\$\{f\(tw\*0\.3,3\)\}"/);
});

test('a real sandblasted finish (v4.44.0)', () => {
  assert.match(source, /let FROST_SIZE = 0\.035, FROST_K = 1\.7, FROST_TILT = 1\.0, FROST_G = 3\.2, FROST_SHARP = 2\.8;/);
  assert.match(source, /  sandblasted: \{rough:0\.82, metal:0\.60, aniso:0\.00, groove:"none",   coat:0\.02, grain:0\.095, dish:0\.015, frost:1\},/);
  const F = chunk('      if(M.frost > 0){', '      if(M.grain > 0 && M.groove === "none"){');
  assert.match(F, /mVnoise\(ux\/fs, uy\/fs\)/, 'grains in mm, not pixels');
  assert.match(F, /granK \*= /); assert.match(F, /granG \+= /); assert.match(F, /nx \+= \(f1 - 0\.5\)\*fa\*FROST_TILT/);
  assert.match(source, /\["grained","Grained"\],\["sandblasted","Sandblasted"\],\["granular","Granular"\]/, 'offered in simple mode');
  assert.match(source, /\} else if\(finish==="sandblasted"\)\{/, 'and drawn in the plain view');
  for (const dir of ['designs', 'concepts']) for (const f of fs.readdirSync(path.join(__dirname, '..', dir)).filter(f => f.endsWith('.json') && f !== 'gin.json' && !/^f77-41-blue-/.test(f)))   // gin (4.51.0) and the frosted F77 41s (4.60.0) were made after it
    assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '..', dir, f), 'utf8'), /"finish": ?"sandblasted"/, f + ' did not use it, so it draws as before');
});

test('thinner figures (v4.44.1)', () => {
  assert.match(source, /N\("numerals\.weight","Thickness",-0\.30,0\.45,\.01\),/, 'the full editor');
  assert.match(source, /if\(\(n\.weight \|\| 0\) < -0\.15\) h \+= `<p class="gNote">\$\{gT\("num\.thinNote"\)\}<\/p>`;/, 'a note past -0.15');
  assert.match(source, /"num\.thinNote":"Taken in this far/); assert.match(source, /"num\.thinNote":"لما ترقّق/);
});

test('Noir 77, a steel bracelet for the F77, a rounded line face (v4.45.0)', () => {
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  assert.ok(list.findIndex(x => x.id === 'noir-77') >= 0, 'listed (newest first: gin since 4.51.0)');
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/noir-77.json'), 'utf8'));
  assert.equal(d.case.model, 'Time Keeper × Nivada · F77'); assert.equal(d.case.strapType, 'bracelet'); assert.equal(d.sheet.strap.type, 'bracelet');
  assert.ok(['Nivada script', 'Nivada shield + script', 'Nivada shield'].includes(d.text.logoMark), 'the case\'s own logo');
  assert.equal(d.date.on, false, 'the P024 has no date'); assert.equal(d.numerals.set, 'all', 'so the 3 is a figure');
  assert.equal(d.text.line2Font, 'Comfortaa');
  assert.match(d.sheet.research.avoid, /Royal Oak/);
  for (const k of ['hHand', 'mHand']) assert.notEqual(d[k].style, 'royal-oak', 'no hand named for the watch followed');
  assert.equal(d.sHand.secTip, 'arrow');
  // the bracelet on the photograph
  assert.match(source, /function braceletTex\(x, ay, hw, y0\)\{/);
  assert.match(source, /c\.strapType !== "alligator" && c\.strapType !== "bracelet"( && c\.strapType !== "crackle")?\) \|\| !K\.photoStrap/);
  assert.match(source, /\["alligator","Alligator leather"\],(\["crackle","Vintage crackle leather"\],)?\["bracelet","Steel bracelet"\]/);
  assert.match(source, /v === "bracelet" \? "bracelet" : "rubber"/);
  const vm = require('node:vm'), ctx = vm.createContext({});
  vm.runInContext(chunk('function mHash(x, y){', '\n') + '\n' + chunk('function vNoise(x, y){', '\n}\n') + '\n}\n' + chunk('function braceletTex(x, ay, hw, y0){', '\n}\n') + '\n}\nthis.r = braceletTex;', ctx);
  const join = ctx.r(0, 22.5 + 0.03 + 4.4/2, 10, 22.5), centre = ctx.r(0, 22.5 + 4.4, 10, 22.5), outer = ctx.r(6, 22.5 + 2.2, 10, 22.5);
  assert.ok(join[1] < 60, 'a dark join between links'); assert.ok(centre[1] > 200, 'a bright polished centre link'); assert.ok(outer[1] > 120 && outer[1] < 220, 'a brushed outer link');
  // the rounded line face
  assert.match(source, /"Comfortaa":\{family:"wdstxcomfortaa", latin:"sans", latinOnly:true, src:"data:font\/woff2;base64,/);
  assert.match(source, /A && !A\.latinOnly && !hasArabic\(txt\)/);
});

test('figures turned round the dial, reading upright (v4.46.0)', () => {
  const P = chunk('      const place = (n, a, sc0) => {', '\n      };\n');
  assert.match(P, /const flip = nm\.orient === "radial" && !arcSet && !!nm\.flipLower && a > 90\.001 && a < 269\.999;/, 'below 3 and 9 only');
  assert.match(P, /if\(flip\)\{ const inf = Math\.max\(\.\.\.P\.map\(q => q\[1\]\)\); return \{p: pt\(Ro - inf, a\), ix: ixC, iy: 0, a: a \+ 180, s:sc\}; \}/, 'turned, and placed by its outer edge');
  assert.match(P, /a: flip \? a \+ 180 : a, s:sc\}; \};/, 'centred figures turn too');
  assert.match(source, /CK\("numerals\.flipLower","Lower figures read upright"\)/);
  // since 4.47.0 the Direction cards on the Size tab carry it (numDirTiles)
  assert.match(source, /"Lower figures read upright":"الأرقام السفلية تُقرأ معتدلة"/);
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/noir-77.json'), 'utf8'));
  assert.equal(d.numerals.orient, 'radial'); assert.equal(d.numerals.arc, false); assert.equal(d.numerals.flipLower, true);
});

test('More options on the tabs, and choices as pictures (v4.47.0)', () => {
  const vm = require('node:vm'), G = vm.createContext({});
  vm.runInContext(chunk('/* GUIDE-PURE-BEGIN', '/* GUIDE-PURE-END */') + '\nthis.g={G_MORE};', G);
  for (const [k, secs] of Object.entries(G.g.G_MORE)) for (const sec of secs) assert.ok(sec.tab, k + ':' + sec.id + ' has a tab');
  assert.match(source, /const hasSheet = k => !!\(G_MORE\[k\] && G_MORE\[k\]\.some\(sec => !sec\.tab\)\);/);
  assert.match(source, /function inlineMore\(k, tab\)\{/);
  assert.match(source, /for\(const sec of G_MORE\[k\]\)\{ if\(sec\.tab\) continue;/, 'the sheet keeps only what has no tab');
  assert.equal((source.match(/closest\("\.gSheet"\)/g) || []).length, 0, 'a change on a tab carries as one in the sheet did');
  assert.match(source, /\{id:"power", tab:"extras", t:"Power reserve", src:"power", need:"powerReserve", needSay:"more\.noPower",/, 'the movement gate kept');
  // Direction as pictures
  const ctx = vm.createContext({});
  vm.runInContext(chunk('const numDirOf = ', '\n/* The tabs a step') + '\nthis.r={numDirOf, numDirSet};', ctx);
  const { numDirOf, numDirSet } = ctx.r, n = { orient: 'upright', arc: true };
  for (const v of ['radialUp', 'radial', 'curve', 'upright', 'radialUp']) { numDirSet({ numerals: n }, v); assert.equal(numDirOf(n), v, v); }
  assert.equal(n.flipLower, true); assert.equal(n.arc, false);
  assert.match(source, /optTiles\("num\.dir", dirs, numDirOf\(n\),/);
  assert.match(source, /else if\(path === "num\.dir"\) numDirSet\(S, v\);/);
  assert.match(source, /"Lower figures upright":"السفلية معتدلة"/);
  assert.match(source, /function optPic\(path, v, o\)\{/);
});

test('a Strap step (v4.48.0)', () => {
  assert.match(source, /const STEPS = \["case","dial","markers","hands","text","calendar","strap","finish"\]/, 'before Finish, so the earlier steps keep their places');
  const V = chunk('    strap(){', '\n    calendar(tab){');
  assert.match(V, /data-gset="case\.strapType"/, 'the strap types as pictures');
  assert.match(V, /\{cy:K\.flat\*0\.7, side:K\.flat\*0\.56\}/, 'each picture the strap itself');
  for (const p of ['case.strapColor', 'case.stitch', 'sheet.strap.buckle', 'sheet.strap.buckleColor', 'sheet.strap.buckleLogo', 'sheet.strap.style']) assert.ok(V.includes('"' + p + '"'), p);
  const C = chunk('    case(tab){', '\n    dial(tab){');
  assert.ok(!C.includes('"case.strapType"') && !C.includes('"case.strapColor"'), 'no longer on the Case tab');
  assert.match(source, /if\(k === "strap"\) return "watch";/, 'framed whole');
  assert.match(source, /if\(Math\.abs\(y\) > visR\(st\)\*1\.5 && Math\.abs\(x\) < visR\(st\)\*0\.9\) return \{step:"strap", tab:null\};/, 'a tap on the strap opens it');
  assert.match(source, /"step\.strap":"Strap"/); assert.match(source, /"step\.strap":"الحزام"/);
  assert.match(source, /<g>|stepIcon/); assert.match(chunk('const STEP_ICON = {', '\n  };'), /\n    strap:'</);
});

test('larger step icons (v4.48.1)', () => {
  assert.match(source, /\.gProg\{ display:flex; flex-wrap:wrap;/, 'the steps on a row of their own');
  assert.match(source, /\.gProgBar\{ flex:1 1 100%;/);
  assert.match(source, /\.gProgBar button b\{ display:grid; place-items:center; width:100%; height:42px;/);
});

test('the dial shows what it is made of (v4.48.2)', () => {
  const vm = require('node:vm'), ctx = vm.createContext({});
  vm.runInContext('const LUX_GOLD = {"yellow gold":"#D7B56D", "rose gold":"#D9A48C", "red gold":"#D39B78", "white gold":"#E3E4E6"};\n'
    + chunk('const DIAL_COVERS = ', '\n/* The tabs a step') + '\nthis.r = dialBlankSet;', ctx);
  const set = ctx.r, st = { dial: { color: '#DDDFE1', finish: 'brushedsteel', blank: '' }, sector: { zones: [{ color: '#DDDFE1' }, { color: '#222222' }] } };
  set(st, '18k yellow gold'); assert.equal(st.dial.color, '#D7B56D'); assert.equal(st.sector.zones[0].color, '#D7B56D', 'a zone in the dial colour follows'); assert.equal(st.sector.zones[1].color, '#222222');
  set(st, '18k rose gold'); assert.equal(st.dial.color, '#D9A48C');
  set(st, ''); assert.equal(st.dial.color, '#DDDFE1', 'brass puts the colour before back'); assert.equal(st.dial.blank, '');
  const en = { dial: { color: '#FFFFFF', finish: 'enamel', blank: '' } };
  set(en, '18k yellow gold'); assert.equal(en.dial.color, '#FFFFFF', 'enamel covers the metal'); assert.equal(en.dial.blank, '18k yellow gold');
  assert.match(source, /else if\(path === "dial\.blank"\) dialBlankSet\(S, v\);/, 'simple mode');
  assert.match(source, /if\(p === "dial\.blank" && typeof dialBlankSet === "function"\)\{ dialBlankSet\(S, v\); return; \}/, 'the full editor');
});

test('changing the figures keeps the hour plots (v4.48.3)', () => {
  const F = chunk('  function setMarkers(k){', '\n  /* ---- framing');
  assert.match(F, /if\(!n\.on \|\| S\.markers\.perHour\) ix\.on = false;\n      n\.on = true;/, 'indices go only when figures replace batons or nothing');
  assert.doesNotMatch(F, /n\.on = true; ix\.on = false;/);
});

test('a stainless steel dial (v4.49.0)', () => {
  const vm = require('node:vm'), ctx = vm.createContext({});
  vm.runInContext('const LUX_GOLD = {"yellow gold":"#D7B56D", "rose gold":"#D9A48C", "red gold":"#D39B78", "white gold":"#E3E4E6"}; const LUX_STEEL = "#C8C9C7";\n'
    + chunk('const DIAL_COVERS = ', '\n/* The tabs a step') + '\nthis.r = dialBlankSet;', ctx);
  const st = { dial: { color: '#0A0B0C', finish: 'sunburst', blank: '' } };
  ctx.r(st, 'stainless steel'); assert.equal(st.dial.color, '#C8C9C7', 'the dial shows the steel');
  ctx.r(st, '18k yellow gold'); assert.equal(st.dial.color, '#D7B56D');
  ctx.r(st, ''); assert.equal(st.dial.color, '#0A0B0C', 'brass puts the colour before back');
  assert.match(source, /const DIAL_BLANKS = \[("German silver", )?"stainless steel", "18k yellow gold", "18k rose gold", "18k white gold"\];/);
  assert.match(source, /else if\(d\.blank === "stainless steel" && d\.finish !== "stone"\) dialText = `Stainless steel dial, /, "the maker's sheet");
  assert.match(source, /"stainless steel":"ستيل"/);
});

test('German silver, a dial engraved throughout, crackled leather (v4.50.0)', () => {
  const vm = require('node:vm');
  assert.match(source, /const DIAL_BLANKS = \["German silver", "stainless steel", /);
  assert.match(source, /else if\(d\.blank === "German silver" && d\.finish !== "stone"\) dialText = `Solid German silver dial, /);
  // engrave everything
  const ctx = vm.createContext({});
  vm.runInContext(chunk('function engraveAll(st){', '\n}\n') + '\n}\nthis.r = engraveAll;', ctx);
  const st = { numerals: { on: true, color: '#16181B', tech: 'engraved + filled' }, minute: { on: true, style: 'dots', tech: 'printed' }, indices: { on: false }, text: { on: true, logoTech: 'printed', engDepth: 0.12 } };
  ctx.r(st);
  assert.equal(st.minute.tech, 'engraved + filled'); assert.equal(st.minute.color, '#16181B');
  assert.equal(st.text.logoTech, 'engraved'); assert.equal(st.text.engFill, 'lacquer'); assert.equal(st.text.engColor, '#16181B');
  for (const k of ['line2Tech', 'footTech', 'splitTech']) assert.equal(st.text[k], 'engraved + filled');
  assert.equal(st.text.engDepth, 0.035, 'cut shallow, so a fine wordmark survives');
  assert.match(source, /data-gset="ui\.engraveAll" data-gv="true"/); assert.match(source, /else if\(path === "ui\.engraveAll"\) engraveAll\(S\);/);
  // the crackle
  const c2 = vm.createContext({});
  vm.runInContext(chunk('function mHash(x, y){', '\n') + '\n' + chunk('function vNoise(x, y){', '\n}\n') + '\n}\n' + chunk('function crackleTex(x, y){', '\n}\n') + '\n}\nthis.r = crackleTex;', c2);
  let cracked = 0, n = 0;
  for (let x = -9; x < 9; x += 0.07) for (let y = 30; y < 40; y += 0.07) { const [sh, cr] = c2.r(x, y); n++; if (cr > 0.5) cracked++; assert.ok(sh > 0.6 && sh < 1.2); }
  const share = cracked / n; assert.ok(share > 0.03 && share < 0.25, 'cracks and flecks cover a part of the strap, not all of it: ' + share.toFixed(3));
  assert.match(source, /\["alligator","Alligator leather"\],\["crackle","Vintage crackle leather"\],\["bracelet","Steel bracelet"\]/);
  assert.match(source, /if\(K\.builtinTint && c\.strap !== false && c\.strapType === "crackle"\)/, "on the Vernoy's photograph too");
});

test('Gin: a hand-engraved German silver dial (v4.51.0)', () => {
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  assert.ok(list.findIndex(x => x.id === 'gin') >= 0, 'listed (the F77 41 set comes first since 4.55.0)');
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/gin.json'), 'utf8'));
  assert.equal(d.case.model, 'Vernoy cushion · RD26-0172'); assert.equal(d.text.logoMark, 'Vernoy wordmark (traced)', "the case's own logo");
  assert.equal(d.dial.blank, 'German silver'); assert.equal(d.dial.finish, 'sandblasted');
  assert.equal(d.numerals.tech, 'engraved + filled'); assert.equal(d.minute.tech, 'engraved + filled'); assert.equal(d.text.logoTech, 'engraved');
  assert.equal(d.chapter.finish, 'circular'); assert.equal(d.case.strapType, 'crackle');
  assert.equal(d.sHand.on, false); assert.equal(d.sub.on, false, 'no small seconds: the 1062 does not drive one');
  assert.match(d.sheet.research.avoid, /Naoya Hida/);
  assert.match(source, /SEL\("chapter\.finish","Finish",\["flat","matte","gloss","sunburst","grained","enamel","brushedsteel","circular","sandblasted"\]\)/);
});

test('the Breguet figures take their thickness (v4.51.1)', () => {
  assert.match(source, /const kOf = ns => styleUsed === "vernoy" \|\| styleUsed === "breguet" \? ns\/100 : 1;/);
  assert.match(source, /body\.push\(engrave\(gid, kOf\(ns\)\)\);/);
  assert.match(source, /stroke-width="\$\{f\(cutW\/kE,4\)\}"/, 'a widened cut is mm on the dial');
  assert.match(source, /if\(cutW > 0 && E\.b > 0\.0005\)\{/, 'the bevel under the fill when widened');
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/gin.json'), 'utf8'));
  assert.ok(d.numerals.style === 'breguet' || d.numerals.style === 'Hida Breguet Study', 'Gin: Breguet figures (its own Hida face since 4.52.0)');
});

test('Hida Breguet Study, and Gin wears it (v4.52.0)', () => {
  const dir = path.join(__dirname, '../tools/dial-font/hida');
  for (const f of ['outlines.json', 'face.json', 'hida.woff2', 'README.md']) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const b64 = fs.readFileSync(path.join(dir, 'hida.woff2')).toString('base64');
  assert.ok(source.includes('"Hida Breguet Study":{family:"wdshidabreguet", seated:true, src:"data:font/woff2;base64,' + b64 + '"}'), 'the studio carries the face');
  const face = JSON.parse(fs.readFileSync(path.join(dir, 'face.json'), 'utf8'));
  assert.deepEqual(face.derive, { 9: ['6', 180] }, 'the 9 is the 6 turned, as the Type 8A shows it');
  assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(path.join(dir, 'outlines.json'), 'utf8'))).sort(), ['0', '1', '2', '3', '4', '5', '6', '7', '8'], 'nine figures from the photographs');
  assert.ok(!fs.readdirSync(dir).some(f => /\.(jpe?g|png|webp)$/i.test(f)), 'the photographs are not kept');
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/gin.json'), 'utf8'));
  assert.equal(d.numerals.style, 'Hida Breguet Study'); assert.equal(d.numerals.tech, 'engraved + filled');
  assert.equal(d.sheet.research.avoid, 'Naoya Hida, Tokyo', "the maker's name stays off the dial");
  assert.equal(d.text.logoMark, 'Vernoy wordmark (traced)', "the case's own logo");
});

test('the F77 in 41 mm (v4.53.0)', () => {
  const vm = require('node:vm');
  const ctx = vm.createContext({});
  const a = source.indexOf('const VERNOY_CASE = {'), b = source.indexOf('const CASE_SPEC = new Proxy');
  vm.runInContext(source.slice(a, b) + '\nthis.r={CASES,TK_NIVADA,TK_NIVADA_41};', ctx);
  const { CASES, TK_NIVADA: K38, TK_NIVADA_41: K } = ctx.r;
  assert.equal(CASES['Time Keeper × Nivada · F77 41'], K);
  // Nivada's published figures
  assert.equal(K.flat, 41); assert.equal(K.lugToLug, 50); assert.equal(K.height, 12.05);
  assert.equal(K.movement, K38.movement, 'the same Soprod P024, without date'); assert.equal(K.calendar, undefined);
  assert.deepEqual(K.logo, K38.logo, "Nivada's own logo");
  // estimated from the renders: the same dial, a wider bezel
  assert.ok(K.opening === 28 || K.opening === 29.17, 'the dial as the renders show it (29.17 on the photograph since 4.55.0)');
  assert.equal(K.f77.bezel.rx, 20.5); assert.equal(K.f77.bezel.flat, 31.96); assert.equal(K.f77.screws.r, 18.31);
  assert.equal(K.f77.body.lugEnd, 25); assert.equal(K.outline, 'f77');
  assert.match(K.tol, /estimate(s|d) until Nivada sends a 41 mm drawing/);
  // drawn: no photograph, and not the 38's drawings
  assert.ok(K.photoFile === undefined || K.photoFile === './app/case-nivada-f77-41.jpg'); assert.equal(K.sheet.drawings, null); assert.ok(K38.sheet.drawings, 'the 38 keeps its own');
  assert.match(source, /const now = \[NOREL_R4\.model, TK_NIVADA\.model, TK_NIVADA_41\.model(, TK_NIVADA_41C\.model)?, VERNOY_CASE\.model\]/);
  assert.match(source, /"case\.tk41":"Nivada F77 41 · Time Keeper", "case\.tk41Sub":"41 mm · (drawn, figures estimated|reference, estimated|Nivada's photograph)"/);
  assert.match(source, /"case\.tk41":"نيفادا F77 41 · تايم كيبر"/);
});

test('the F77 41 optimised, and a drawn F77 bracelet (v4.54.0)', () => {
  const vm = require('node:vm'); const ctx = vm.createContext({});
  const a = source.indexOf('const VERNOY_CASE = {'), b = source.indexOf('const CASE_SPEC = new Proxy');
  vm.runInContext(source.slice(a, b) + '\nthis.r={CASES,TK_NIVADA,TK_NIVADA_41,TK_NIVADA_41C};', ctx);
  const { CASES, TK_NIVADA: K38, TK_NIVADA_41: A, TK_NIVADA_41C: C } = ctx.r;
  assert.equal(CASES['Time Keeper × Nivada · F77 41 optimised'], C);
  // A stays the reference
  assert.ok(A.opening === 28 || A.opening === 29.17); assert.equal(A.f77.bezel.flat, 31.96); assert.equal(A.f77.screws.r, 18.31);
  // C: the 38's share of the width, real parts at real size
  assert.equal(C.opening, 30.2); assert.ok(Math.abs(C.opening/C.flat - K38.opening/K38.flat) < 0.001, "the 38's dial share");
  assert.equal(C.f77.bezel.flat, 33.4); assert.equal(+(C.f77.bezel.rx - C.f77.bezel.chRx).toFixed(2), 0.7, 'the chamfer as thin as the 38s');
  assert.equal(C.f77.screws.d, 1.5); assert.equal(C.f77.screws.r, 18.44); assert.equal(C.crownD, 6);
  assert.equal(C.lugToLug, 50); assert.equal(C.height, 12.05); assert.equal(C.movement, K38.movement); assert.equal(C.calendar, undefined);
  assert.deepEqual(C.logo, K38.logo); assert.equal(C.photoFile, undefined); assert.equal(C.sheet.drawings, null);
  assert.ok(A.estimate && C.estimate && !K38.estimate, 'the 41s are marked as estimates');
  assert.match(C.tol, /design proposal/); assert.match(C.tol, /not a Nivada specification/);
  // the bracelet: Nivada's widths
  assert.deepEqual([K38.f77.bracelet.w0*2, K38.f77.bracelet.w1*2], [22, 16]);
  assert.deepEqual([A.f77.bracelet.w0*2, A.f77.bracelet.w1*2], [24, 18]); assert.equal(C.f77.bracelet, A.f77.bracelet);
  assert.match(source, /const BR = c\.strap && c\.strapType === "bracelet" && F\.bracelet;/);
  assert.match(source, /if\(c\.strap && !BR\)\{/, 'the rubber strap only when no bracelet');
  assert.match(source, /\} else if\(K\.f77 && K\.f77\.bracelet\)\{\n\s+\/\* a drawn F77 \(the 41s\)/);
  assert.match(source, /\+ \(K\.estimate \? `<p class="gNote">\$\{gT\("case\.estimate"\)\}<\/p>` : ""\)/);
  for (const k of ['case.tk41c', 'case.tk41cSub', 'case.estimate']) assert.equal((source.match(new RegExp('"' + k.replace('.', '\\.') + '":', 'g')) || []).length, 2, k + ' in English and Arabic');
  assert.match(source, /"case\.tk41Sub":"41 mm · (reference, estimated|Nivada's photograph)"/);
});

test('the real F77 41, four silver dials, and sets side by side (v4.55.0)', () => {
  const vm = require('node:vm'); const ctx = vm.createContext({});
  const a = source.indexOf('const VERNOY_CASE = {'), b = source.indexOf('const CASE_SPEC = new Proxy');
  vm.runInContext(source.slice(a, b) + '\nthis.r={TK_NIVADA_41,TK_NIVADA_41C};', ctx);
  const { TK_NIVADA_41: A, TK_NIVADA_41C: C } = ctx.r;
  assert.equal(A.photoFile, './app/case-nivada-f77-41.jpg'); assert.ok(fs.existsSync(path.join(__dirname, '../app/case-nivada-f77-41.jpg')));
  assert.deepEqual({ ...A.photoCal }, { w: 1040, h: 1560, cx: 49.73, cy: 43.61, dia: 58.9 });
  assert.equal(A.opening, 29.17); assert.equal(A.flat, 41); assert.equal(A.bracelet, true);
  assert.equal(C.photoFile, undefined, 'the optimised 41 stays drawn'); assert.equal(C.opening, 30.2);
  assert.match(fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8'), /"\.\/app\/case-nivada-f77-41\.jpg"/);
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  const set = list.filter(x => /^F77 41 · /.test(x.set || '') && !/^F77 41 · (Hands|Refined batons|Complete dials|Frosted silver and blue|Grey and honey gold)$/.test(x.set) || x.id === 'f77-41-current');
  assert.ok(set.length >= 4 && set[0].id === 'f77-41-current', 'a set on the 41, the current design first');
  for (const c of set) {
    const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', c.file), 'utf8'));
    assert.equal(d.case.model, 'Time Keeper × Nivada · F77 41', c.id); assert.equal(d.meta.set, c.set);
    assert.equal(d.numerals.system, 'arabic ٠–٩', c.id); assert.equal(d.numerals.metal, 'rose gold', c.id);
    assert.equal(d.hHand.material, 'rose gold', c.id); assert.ok(/^Nivada /.test(d.text.logoMark), c.id + ": the case's own logo");
    assert.ok(fs.existsSync(path.join(__dirname, '../concepts', c.picture)), c.picture);
  }
  assert.match(source, /set:String\(c\.set \|\| ""\), ref:j/);
  assert.match(source, /data-gcmp="\$\{esc2\(set\)\}">\$\{gT\("start\.compare"\)\}/);
  assert.match(source, /if\(tab === "designs"\) return cmpSet \? compareBlock\(\) : watchesBlock\(\);/);
  assert.match(source, /thumb\(c\.st, "cmp\|" \+ \(c\.id \|\| "now"\), \{cy:0, side\}\)/, 'one scale for the whole row');
  for (const k of ['start.compare', 'start.cmpBack', 'start.cmpNow', 'start.cmpTitle', 'start.cmpNote', 'start.cmpFacts'])
    assert.equal((source.match(new RegExp('"' + k.replace('.', '\\.') + '":', 'g')) || []).length, 2, k + ' in English and Arabic');
});

test('three haute-horlogerie dials for the F77 41 (v4.56.0)', () => {
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  const set = list.filter(x => x.set === 'F77 41 · Haute horlogerie');
  assert.deepEqual(set.map(x => x.id), ['f77-41-current', 'f77-41-calatrava', 'f77-41-sector', 'f77-41-guilloche']);
  for (const id of ['f77-41-grand-arabic', 'f77-41-chapter-ring', 'f77-41-concentric', 'f77-41-tapisserie'])
    assert.ok(!fs.existsSync(path.join(__dirname, '../concepts', id + '.json')), id + ' set aside');
  const read = id => JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', id + '.json'), 'utf8'));
  const A = read('f77-41-calatrava'), B = read('f77-41-sector'), C = read('f77-41-guilloche');
  for (const d of [A, B, C]) {
    assert.equal(d.case.model, 'Time Keeper × Nivada · F77 41'); assert.equal(d.numerals.system, 'arabic ٠–٩');
    assert.equal(d.hHand.material, 'rose gold'); assert.equal(d.mHand.material, 'rose gold');
    assert.deepEqual(d.meta.time, { h: 10, m: 7, s: 37 }, 'the hands set between the figures');
    assert.ok(d.text.logoSize <= 2.4, 'the name kept quiet');
  }
  assert.equal(A.numerals.style, 'AlTarikh Study'); assert.equal(A.numerals.tech, 'applied'); assert.equal(A.numerals.metal, 'rose gold');
  assert.equal(A.minute.style, 'railroad'); assert.equal(A.hHand.style, 'feuille'); assert.equal(A.text.logoMark, 'Nivada script');
  assert.equal(B.numerals.style, 'Markazi Text'); assert.equal(B.numerals.tech, 'printed'); assert.equal(B.sector.zones.length, 2); assert.equal(B.hHand.style, 'lance');
  assert.equal(C.numerals.style, 'Aref Ruqaa'); assert.equal(C.sector.zones[0].pattern, 'clous'); assert.equal(C.hHand.style, 'pomme-ouverte');
});

test('precise Arabic numeral typography and five new faces (v4.57.0)', () => {
  const vm = require('node:vm');
  // the new faces: every weight has the ten Arabic-Indic figures (the outlines are read from the embedded files)
  const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/font-outlines.json'), 'utf8'));
  const W = {'Noto Kufi Arabic':[300,500,600,700], 'IBM Plex Sans Arabic':[200,300,500,600,700], 'Kufam':[500,600,700], 'Alexandria':[300,500,600,700], 'Ruwudu':[500,600,700]};
  for (const [face, ws] of Object.entries(W)) for (const k of [face].concat(ws.map(w => face + '@' + w))) {
    assert.ok(OUT[k], k); for (const c of '٠١٢٣٤٥٦٧٨٩') assert.ok(OUT[k].g[c], k + ' has ' + c);
    assert.match(source, new RegExp('"' + face + '":\\{family:"wds[a-z]+", src:"data:font/woff2;base64,[A-Za-z0-9+/=]+", ar:true' + (face === 'Ruwudu' ? ', noFa:true' : '') + ', weights:\\{'));
  }
  assert.ok(!/DIN Next/.test(source.slice(source.indexOf('const BUILTIN_FONTS = {'), source.indexOf('\n};', source.indexOf('const BUILTIN_FONTS = {')))), 'no unlicensed DIN Next');
  // designs saved before keep their layout; new ones are precise
  assert.match(source, /numerals:\{on:true, layout:"precise", style:"vernoy"/);
  const ctx = vm.createContext({});
  const i = source.indexOf('const deep = (a,b)=>'), j = source.indexOf('\n', i);
  vm.runInContext('const clone = o => JSON.parse(JSON.stringify(o)); const BASE = {numerals:{layout:"precise", size:3}};' + source.slice(i, j) + '\nthis.r={deep,BASE};', ctx);
  assert.equal(ctx.r.deep(ctx.r.BASE, {numerals:{size:4}}).numerals.layout, 'legacy');
  assert.equal(ctx.r.deep(ctx.r.BASE, {numerals:{size:4, layout:'precise'}}).numerals.layout, 'precise');
  assert.equal(ctx.r.deep(ctx.r.BASE, {}).numerals.layout, 'precise');
  // the precise layout: figures by their ink, groups digit by digit, kept clear
  for (const re of [/const hRef = hs\[hs\.length >> 1\], size = \+nm\.size > 0 \? \+nm\.size : 3/, /if\(i\) x \+= gapMM\*sc\*\(c === zero \|\| chars\[i-1\] === zero \? opt\.zeroGap : 1\)/,
    /if\(R \+ sup > PR\.limit\)\{ pulled = R \+ sup - PR\.limit; R -= pulled; \}/, /if\(PRE\)\{ const q = numPlacePrecise\(st, PRE, numeralLabel\(n, sys\), a, sc0\); if\(q\) return q; \}/,
    /font-weight="\$\{PRE\.W\}"/, /if\(typeof numIsPrecise === "function" && numIsPrecise\(nm\)\) return 1;/])
    assert.match(source, re);
  // the track's inner edge and the limit it sets
  const c2 = vm.createContext({});
  const a2 = source.indexOf('function trackInnerEdge(st)'), b2 = source.indexOf('/* the layout of one design', a2);
  vm.runInContext('const visR = st => st.case.opening/2;' + source.slice(a2, b2) + '\nthis.r={trackInnerEdge,numOuterLimit};', c2);
  const st = {case:{opening:29.17}, numerals:{radius:11.9}, minute:{on:true, style:'railroad', diameter:27.9, thickness:0.065, fives:true}};
  const ti = c2.r.trackInnerEdge(st), rail = Math.max(0.045, Math.min(0.08, 0.065*0.18));
  assert.ok(Math.abs(ti - (13.95 - 0.065 - 0.065*1.2 - rail/2)) < 1e-9);
  assert.ok(Math.abs(c2.r.numOuterLimit(st) - (ti - 0.30)) < 1e-9);
  st.minute.on = false; assert.ok(Math.abs(c2.r.numOuterLimit(st) - (14.585 - 0.30)) < 1e-9);
  // the artwork: the space between the inks, ٠ centred on its partner
  const c3 = vm.createContext({});
  const a3 = source.indexOf('function numArtRunInk('), b3 = source.indexOf('/* drawn with its ink centred on cx', a3);
  vm.runInContext(source.slice(a3, b3) + '\nthis.r={numArtRunInk};', c3);
  const G = {'١':{a:0.3, d:'', b:[0.05, -0.7, 0.15, 0]}, '٠':{a:0.3, d:'', b:[0.1, -0.2, 0.2, -0.1]}};
  const r = c3.r.numArtRunInk(G, '١٠', 10, 0.4, {opt:{zero:'mid', zeroGap:0.85}, zero:'٠'});
  assert.ok(Math.abs((r.parts[1].x + 0.1*10) - (r.parts[0].x + 0.15*10) - 0.4*0.85) < 1e-9, 'the space between the inks');
  assert.ok(Math.abs((r.parts[1].y + (-0.15)*10) - (-0.35*10)) < 1e-9, '٠ centred on ١');
  // the comparison and the controls
  assert.match(source, /function numCompareBlock\(\)\{/); assert.match(source, /data-gset="num\.use" data-gv='\$\{gv\(face \+ "\|" \+ w\)\}'/);
  assert.match(source, /else if\(path === "num\.layout"\) numLayoutSet\(S, v\);/);
  assert.match(source, /slider\("numerals\.pairGapUi", "Space inside 10, 11, 12", 0, 1\.2, 0\.02/);
  for (const k of ['Numerals and the minute track', 'Hour hand and the numerals', 'Numeral face', 'Numerals kept clear'])
    assert.equal((source.match(new RegExp('"' + k + '":', 'g')) || []).length, 2, k + ' in both tables');
  assert.ok(fs.existsSync(path.join(__dirname, '../tools/font-outlines.py')));
  assert.match(fs.readFileSync(path.join(__dirname, '../tools/font-outlines.py'), 'utf8'), /yield m\.group\(1\) \+ "@" \+ wm\.group\(1\), wm\.group\(2\)/);
});


test('fine metal hands, and refined batons for the F77 41 (v4.58.0)', () => {
  const vm = require('node:vm');
  // designs saved before keep the classic drawing; new ones are fine
  const ctx = vm.createContext({});
  const i = source.indexOf('const deep = (a,b)=>'), j = source.indexOf('\n', i);
  vm.runInContext('const clone = o => JSON.parse(JSON.stringify(o)); const BASE = {render:{az:135, hands:"fine"}, numerals:{layout:"precise"}};' + source.slice(i, j) + '\nthis.r={deep,BASE};', ctx);
  assert.equal(ctx.r.deep(ctx.r.BASE, {hHand:{}}).render.hands, 'classic');
  assert.equal(ctx.r.deep(ctx.r.BASE, {}).render.hands, 'classic', 'a preset that keeps the base hands too');
  assert.equal(ctx.r.deep(ctx.r.BASE, {render:{hands:'fine'}}).render.hands, 'fine');
  assert.match(source, /render:\{mode:"studio", az:135, el:40, quality:340, view:"front", hands:"fine"\}/);
  assert.match(source, /S\.render\.hands = "fine";\s+\/\/ a new design's hands/);
  // the model: no facet darker than 46% toward the metal's dark; shadows by height
  const c2 = vm.createContext({mix:(a, b, t) => t});
  const a2 = source.indexOf('function fineTone('), b2 = source.indexOf('function fineFacets(', a2);
  vm.runInContext(source.slice(a2, b2) + '\nthis.r={fineTone};', c2);
  assert.equal(c2.r.fineTone('', {dark:'', lite:''}, -5), 0.46); assert.equal(c2.r.fineTone('', {dark:'', lite:''}, 5), 0.9);
  assert.match(source, /const HAND_LIFT = \{hHand:0\.24, mHand:0\.46, sHand:0\.66\};/);
  assert.match(source, /return withShadow\(a, handPath\(h, Object\.assign\(\{angle:a, key:k\}, hctx\)\), k\) \+ \(FINE \? fineCollet\(h, k\) : collet\(h, k\)\);/);
  assert.match(source, /const fine = ctx && ctx\.fine && FINE_HANDS\.has\(h\.style\) && !h\.lume;/);
  // the two new batons and the controls
  assert.match(source, /"baton-ridge":\(L,T\) => \[\[T,\.50\],\[-L,\.50\]\],/); assert.match(source, /"baton-taper":\(L,T,W\) => \[\[T,\.50\],\[0,\.50\],\[-\(L - W\*0\.70\),\.36\],\[-L,0\]\],/);
  assert.ok(!/"baton-ridge"/.test(source.slice(source.indexOf('const FACET_FLAT'), source.indexOf('\n', source.indexOf('const FACET_FLAT')))), 'the ridged baton has a ridge, not a table');
  assert.match(source, /chips\("render\.hands", \[\["fine","Fine metal"\],\["classic","Classic"\]\]/);
  assert.match(source, /slider\("hands\.bevel", "Bevel width", 0\.15, 0\.60, 0\.01/);
  for (const w of ['Ridged baton', 'Tapered baton', 'Hand finish', 'Fine metal', 'Bevel width']) assert.match(source, new RegExp('"' + w + '":"[^"]*[\\u0600-\\u06FF]'));
  // the set: the original dial on the real 41, B and three refinements
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  const set = list.filter(x => x.set === 'F77 41 · Refined batons');
  assert.deepEqual(set.map(x => x.id), ['f77-41-batons-ref', 'f77-41-batons-polished', 'f77-41-batons-ridged', 'f77-41-batons-tapered']);
  assert.ok(!list.some(x => x.set === 'F77 41 · Hands'), 'the earlier hand set replaced');
  const read = id => JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', id + '.json'), 'utf8'));
  const orig = JSON.parse(fs.readFileSync(path.join(__dirname, '../designs/timekeeper-nivada.json'), 'utf8'));
  const want = [['classic', 'baton'], ['fine', 'baton'], ['fine', 'baton-ridge'], ['fine', 'baton-taper']];
  set.forEach((c, n) => { const d = read(c.id);
    assert.equal(d.case.model, 'Time Keeper × Nivada · F77 41');
    assert.deepEqual([d.render.hands, d.hHand.style], want[n], c.id);
    assert.equal(d.numerals.style, orig.numerals.style, "the original dial's numerals"); assert.equal(d.dial.color, orig.dial.color);
    for (const k of ['hHand', 'mHand', 'sHand']) assert.equal(d[k].material, 'rose gold'); });
});

test('four complete dials for the F77 41 (v4.59.0)', () => {
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  const set = list.filter(x => x.set === 'F77 41 · Complete dials');
  assert.deepEqual(set.map(x => x.id), ['f77-41-dial-current', 'f77-41-dial-continuum', 'f77-41-dial-architecture', 'f77-41-dial-heritage', 'f77-41-dial-measure']);
  const read = id => JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', id + '.json'), 'utf8'));
  for (const c of set.slice(1)) {
    const d = read(c.id);
    assert.equal(d.case.model, 'Time Keeper × Nivada · F77 41'); assert.equal(d.numerals.system, 'arabic ٠–٩');
    assert.equal(d.numerals.layout, 'precise'); assert.equal(d.numerals.tech, 'applied'); assert.equal(d.numerals.metal, 'rose gold');
    assert.equal(d.render.hands, 'fine'); assert.ok(d.minute.on);
    for (const k of ['hHand', 'mHand', 'sHand']) assert.equal(d[k].material, 'rose gold');
    assert.ok(['brushedsteel'].includes(d.dial.finish), c.id + ': a silver that renders silver');
  }
  assert.equal(read('f77-41-dial-continuum').chapter.on, true);
  assert.equal(read('f77-41-dial-architecture').sector.zones[0].pattern, 'cercles');
  assert.equal(read('f77-41-dial-heritage').sector.zones[0].pattern, 'clous');
  assert.equal(read('f77-41-dial-measure').indices.metal, 'rose gold'); assert.equal(read('f77-41-dial-measure').numerals.set, 'quarters');
});

test('the four dials in frosted silver and blue (v4.60.0)', () => {
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  const set = list.filter(x => x.set === 'F77 41 · Frosted silver and blue');
  assert.deepEqual(set.map(x => x.id), ['f77-41-blue-continuum', 'f77-41-blue-architecture', 'f77-41-blue-heritage', 'f77-41-blue-measure']);
  for (const c of set) {
    const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', c.file), 'utf8'));
    assert.equal(d.case.model, 'Time Keeper × Nivada · F77 41'); assert.equal(d.numerals.system, 'arabic ٠–٩');
    assert.equal(d.dial.blank, 'German silver'); assert.equal(d.dial.finish, 'sandblasted');
    assert.equal(d.numerals.tech, 'engraved + filled'); assert.equal(d.numerals.color, '#16181B');
    for (const k of ['hHand', 'mHand', 'sHand']) assert.equal(d[k].material, 'flame blue', c.id + ' ' + k);
    assert.equal(d.render.hands, 'fine'); assert.ok(/^Nivada /.test(d.text.logoMark), "the case's own logo");
  }
  assert.ok(list.some(x => x.id === 'f77-41-dial-continuum'), 'the rose-gold versions kept');
});

test('grey and honey gold (v4.61.0): a honey gold metal, track numbers in the dial\'s figures, and the set on the F77 41', () => {
  assert.match(source, /const APP_VERSION = "4\.61\.\d+";|const APP_VERSION = "(4\.(6[2-9]|[7-9]\d)|[5-9])\./);
  // the metal: on dial parts and hands, on the chips, in Arabic, and by name on the making sheet
  assert.match(source, /"honey gold":\s+\{base:"#D9BE92", hi:"#FFF3DE", lo:"#6C5531"\}/);
  assert.match(source, /"honey gold":\s+\{core:"#C8AA7C", dark:"#3A2B15", lite:"#FFF1DA", spec:0\.90\}/);
  assert.ok(source.split('["honey gold","Honey gold"]').length - 1 >= 5, 'offered for numerals, indices, hands and the logo');
  assert.match(source, /"Honey gold":"ذهب عسلي"/); assert.match(source, /"honey gold":"honey gold \(a pale warm gold, between yellow and rose\)"/);
  // track numbers in the hour numerals' own figures, only offered where those are not western
  assert.match(source, /sysN = mt\.numSys === "dial" && nmN\.system && nmN\.system !== "western 0–9" && nmN\.system !== "roman I–XII" \? nmN\.system : null/);
  assert.match(source, /chips\("minute\.numSys", \[\["western","Western"\],\["dial","As the hour numerals"\]\]/);
  assert.match(source, /"As the hour numerals":"مثل أرقام الساعات"/); assert.match(source, /"Track figures":"أرقام المسار"/);
  assert.match(source, /in the dial's own figures/);
  // moving a design to another case size takes the track's numbers and the space inside 10, 11, 12 with it
  assert.match(source, /sc\(st\.minute, \["diameter","numR","numSize"\]\)/); assert.match(source, /sc\(st\.numerals, \["radius","size","pairGap"\]\)/);
  // the set
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/index.json'), 'utf8'));
  const set = list.filter(x => x.set === 'F77 41 · Grey and honey gold');
  assert.deepEqual(set.map(x => x.id), ['f77-41-honey-lancet', 'f77-41-honey-baton', 'f77-38-honey-strap']);
  const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  for (const c of set) {
    const d = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', c.file), 'utf8'));
    assert.ok(fs.existsSync(path.join(__dirname, '../concepts', c.picture)), c.picture); assert.ok(sw.includes('"./concepts/' + c.file + '"'), c.file + ' held offline');
    assert.equal(d.meta.set, c.set); assert.equal(d.numerals.system, 'arabic ٠–٩'); assert.equal(d.numerals.layout, 'precise');
    assert.equal(d.dial.finish, 'grained'); assert.equal(d.numerals.tech, 'applied'); assert.equal(d.numerals.metal, 'honey gold');
    assert.equal(d.hHand.material, 'honey gold'); assert.equal(d.mHand.material, 'honey gold'); assert.equal(d.sHand.material, 'flame blue');
    assert.equal(d.minute.numSys, 'dial'); assert.equal(d.render.hands, 'fine');
    // the movement drives centre seconds only: nothing of the reference's complications
    assert.equal(d.date.on, false); assert.ok(!(d.sub && d.sub.on), 'no sub-dial'); assert.ok(!(d.power && d.power.on), 'no power reserve');
    assert.ok(/^Nivada /.test(d.text.logoMark), "the case's own logo"); assert.equal(d.text.line2, 'TIME KEEPER');
    assert.match(d.sheet.research.refs[0].note, /Left out: the tourbillon/);
  }
  assert.deepEqual(set.map(c => JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts', c.file), 'utf8')).case.model),
    ['Time Keeper × Nivada · F77 41', 'Time Keeper × Nivada · F77 41', 'Time Keeper × Nivada · F77']);
  const strap = JSON.parse(fs.readFileSync(path.join(__dirname, '../concepts/f77-38-honey-strap.json'), 'utf8'));
  assert.equal(strap.case.strapType, 'alligator'); assert.equal(strap.case.strapColor, '#4B2F1E');
});
