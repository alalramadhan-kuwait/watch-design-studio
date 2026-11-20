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
  assert.match(source, /SEL\("chapter\.finish","Finish",\["flat","matte","gloss","sunburst","grained","enamel","brushedsteel"\]\)/);
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
    assert.match(source, new RegExp(`"${k.replace('.', '\\.')}":"${l}"`));
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
  assert.match(m, /const lab = mt\.nums === "hours" \? String\(i \|\| 12\) : String\(i \? i\*5 : 60\);/);
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
  assert.match(source, /const HAND_SHARE = \[[^\]]*"paint"\];/);
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
  assert.match(source, /\["grained","Grained"\],\["granular","Granular"\],/);
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
  assert.match(source, /if\(\(c\.strapType !== "fabric" && c\.strapType !== "alligator"\) \|\| !K\.photoStrap \|\| K\.bracelet \|\| c\.strap === false\) return null;/);
  assert.match(source, /\+ "\|" \+ \(fab \? \(fab\.type \|\| "fabric"\) \+ \(fab\.stitch \|\| ""\) : ""\);/, 'cached apart from rubber');
  assert.match(source, /chips\("case\.strapType", \[\["rubber","Rubber"\],\["fabric","Fabric \(Velcro\)"\],\["alligator","Alligator leather"\]\]/);
  assert.match(source, /S\.sheet\.strap\.type = v === "fabric" \? "fabric Velcro" : v === "alligator" \? "leather" : "rubber";/, 'the maker\'s sheet says so');
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
  assert.equal(list[0].id, 'chocolat-77', 'the newest concept first');
});

test('designs tab and the movement rule (v4.34.0)', () => {
  assert.match(source, /if\(k === "case"\) return \["designs","shape","metal"\];/);
  assert.match(source, /if\(tab === "designs"\) return watchesBlock\(\);/);
  assert.match(source, /data-gdo="keep">\$\{gT\("start\.saveNow"\)\}/, 'Save beside what was saved');
  assert.match(source, /powerReserve:\(\) => !!caseOf\(S\)\.powerReserve \|\| !!\(S\.power && S\.power\.on\)\}/);
  assert.match(source, /"sub\.hand":\(\) => !!caseOf\(S\)\.smallSeconds \|\| !!\(S\.sub && S\.sub\.hand\),/);
  assert.match(source, /\{id:"power", t:"Power reserve", src:"power", need:"powerReserve", needSay:"more\.noPower",/);
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
  assert.match(source, /h \+= slider\("numerals\.weight", "Thickness", -0\.1, 0\.45, 0\.01, n\.weight \|\| 0\);/, 'shown for applied figures too');
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
