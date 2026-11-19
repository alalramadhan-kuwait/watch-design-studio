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
  assert.match(source, /for\(const tb of \(tabs\.length \? tabs : \[null\]\)\)\{ if\(!\(x\.k === "case" && tb === "shape"\)\) findPage\(out, i, x, tb\); \}/);
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
