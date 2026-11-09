const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const context=vm.createContext({});
const chunk=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
vm.runInContext(chunk('function mHash(', 'const MFINISH')+chunk('const GUIL_PATTERNS', 'const MLIGHT')+'\nthis.engine={guilFieldRaw,guilFeature,GUIL_PATTERNS};',context);
const {guilFieldRaw,guilFeature,GUIL_PATTERNS}=context.engine;
const patterns=['tapisserie','perlage','geneva','ecaille','chevron','linen','hammered'];
test('all inline scripts are syntactically valid',()=>{
  for(const m of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
test('new patterns are finite, deterministic and have non-flat distinct fields at UI limits',()=>{
  for(const cell of [.25,.85,2.2])for(const pitch of [.12,.36,1.2]){
    const signatures=new Set();
    for(const pattern of patterns){
      assert.ok(GUIL_PATTERNS.includes(pattern));
      const p={pattern,cell,pitch,wall:26};const values=[];
      for(let i=0;i<150;i++){
        const x=(i%15-7)*.131,y=(Math.floor(i/15)-5)*.173,r=Math.hypot(x,y),a=Math.atan2(y,x);
        const h=guilFieldRaw(p,x,y,r,a);assert.ok(Number.isFinite(h),pattern);assert.equal(h,guilFieldRaw(p,x,y,r,a));values.push(h);
        assert.ok(guilFeature(p,r)>0);
      }
      assert.ok(Math.max(...values)-Math.min(...values)>1e-5,pattern+' must not be flat');
      signatures.add(values.map(v=>v.toFixed(6)).join(','));
    }
    assert.equal(signatures.size,patterns.length);
  }
});
// Exercise the real report logic against fixtures without booting browser UI.
const reports=vm.createContext({hex2rgb:h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),f:(n,d)=>Number(n).toFixed(d),visR:s=>s.case.opening/2});
// The clearance and contrast rows ask how long a hand is actually drawn and
// what metal it is drawn in, so the real helpers go into the context too --
// stubbing them would only test the stubs.
vm.runInContext(chunk('const HAND_MATERIAL = {','const POMME = {')+chunk('const HAND_REACH = [','const HAND_SHARE = [')
  +chunk('  function contrast(a,b)', '  function brief()')+'\nthis.checks=checks;this.contrast=contrast;this.handLength=handLength;this.handCore=handCore;',reports);
const fixture=()=>({case:{locked:true,opening:30.5},dial:{diameter:31.3,color:'#FFFFFF',finish:'guilloche',cell:.85,pitch:.36},hHand:{on:true,length:8,color:'#111111'},mHand:{on:true,length:12,color:'#111111'},sHand:{on:false},numerals:{on:false},indices:{on:false},minute:{on:false},date:{on:false}});
test('checks flag clipped hands, unreadable colours and undersized blanks',()=>{
  const s=fixture();s.hHand.length=16;s.mHand.material='white gold';s.dial.color='#D8D4CB';s.dial.diameter=28;  // #A9A69D on #D8D4CB is 1.65:1
  const rows=reports.checks(s);
  for(const name of ['Hour hand clearance','Minute hand contrast','Dial coverage'])assert.equal(rows.find(t=>t.title===name).ok,false,name);
  assert.equal(reports.contrast('#FFFFFF','#FFFFFF'),1);
  assert.equal(reports.contrast('#000000','#FFFFFF'),21);
});
test('a clean geometry still requires manufacturing review',()=>{
  const rows=reports.checks(fixture());assert.equal(rows.filter(t=>!t.ok).length,1);assert.equal(rows.at(-1).title,'Movement and production review');
});
test('clearance follows the length a hand is drawn at, not the one in the file',()=>{
  const s=fixture();
  // 15.25 mm opening: on the file's 12 mm this passes, at the dial edge it does not
  assert.equal(reports.checks(s).find(t=>t.title==='Minute hand clearance').ok,true);
  s.mHand.reach='to the dial edge';s.mHand.reachTrim=1.05;s.dial.diameter=31.3;
  const row=reports.checks(s).find(t=>t.title==='Minute hand clearance');
  assert.equal(row.ok,false);
  assert.ok(reports.handLength(s.mHand,'mHand',s)>15.25,'the hand really is past the opening');
});
test('contrast is measured on the metal the hand is drawn in',()=>{
  const s=fixture();s.mHand.material='blued steel';
  assert.equal(reports.handCore(s.mHand),'#26355E');
});
test('synthetic stone is always identified for review',()=>{
  const s=fixture();s.dial.finish='stone';s.dial.slab='';assert.equal(reports.checks(s).find(t=>t.title==='Stone source').ok,false);
});
// The case registry and the movement-calendar checks, run against the real source.
const caseCtx=vm.createContext({hex2rgb:h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),f:(n,d)=>Number(n).toFixed(d),visR:s=>s.case.opening/2});
vm.runInContext(chunk('const VERNOY_CASE = {','const CASE_SPEC = new Proxy')+chunk('const HAND_MATERIAL = {','const POMME = {')+chunk('const HAND_REACH = [','const HAND_SHARE = [')
  +chunk('  function contrast(a,b)', '  function brief()')+'\nthis.r={CASES,caseOf,VERNOY_CASE,NOREL_R3,NOREL_D,NOREL_R4,checks};',caseCtx);
const {CASES,caseOf,VERNOY_CASE,NOREL_R3,NOREL_D,NOREL_R4,checks:caseChecks}=caseCtx.r;
test('the NOREL cases carry the SW240-1 calendar, and an unknown case falls back to the Vernoy',()=>{
  assert.equal(Object.keys(CASES).length,4);
  assert.equal(caseOf({case:{model:'no such case'}}),VERNOY_CASE);
  assert.equal(caseOf({case:{}}),VERNOY_CASE);
  for(const K of [NOREL_R3,NOREL_D,NOREL_R4]){
    assert.equal(K.shape,'round');assert.equal(K.calendar.dateW,2.4);assert.equal(K.calendar.dateH,2.0);assert.equal(K.calendar.dateC,9.95);
    assert.ok(K.glassD<K.bezelID&&K.opening<K.glassD&&K.dialD>K.opening,'surfaces stack outside in');
  }
  assert.equal(NOREL_D.bezelOD,NOREL_D.flat,'Concept D sits flush with the case');
  assert.ok(Math.abs((NOREL_D.bezelOD-NOREL_D.bezelID)/2-3.6)<1e-9);
  // the 3 Nov 2026 drawing: Concept D taken up, with its own dial, bezel ring and cyclops
  assert.equal(NOREL_R4.opening,31.4);assert.equal(NOREL_R4.dialD,32.5);assert.equal(NOREL_R4.glassD,33.5);assert.equal(NOREL_R4.height,11.2);
  assert.ok(Math.abs((NOREL_R4.bezelOD-NOREL_R4.bezelID)/2-3.4)<1e-9,'the (3.40) bezel ring');
  assert.ok(Math.abs(NOREL_R4.cyclops.c-NOREL_R4.calendar.dateC)<=0.1,'the cyclops is over the date');
});
test('the cyclops check measures the magnified window against the lens as drawn',()=>{
  const st=noreFixture(); st.case.model=NOREL_R4.model; st.case.opening=31.4;
  st.date.frameW=0.14; st.date.cyclops='2.5×';
  const row=caseChecks(st).find(r=>r.title==='Cyclops coverage');
  assert.ok(row,'there is a cyclops row');
  st.date.cyclops='2.0×';
  assert.equal(caseChecks(st).find(r=>r.title==='Cyclops coverage').ok,true,'2× fits the Ø7.0 × 5.5 lens');
});
const noreFixture=()=>({case:{locked:true,opening:31.4,model:NOREL_D.model},dial:{diameter:32.4,color:'#8DB4E4',finish:'matte'},
  hHand:{on:true,length:8,color:'#F2F4F7'},mHand:{on:true,length:12,color:'#F2F4F7'},sHand:{on:false},numerals:{on:false},indices:{on:false},minute:{on:false},
  date:{on:true,at:3,dist:9.95,w:2.4,h:2.0,cyclops:'2.5×'},day:{on:true,arc:46.5,frame:.6}});
test('a calendar inside the movement apertures passes, and one outside them is flagged',()=>{
  const ok=caseChecks(noreFixture());
  for(const name of ['Date window size','Date window position','Cyclops coverage','Day window arc','Day window clearance'])assert.equal(ok.find(t=>t.title===name).ok,true,name);
  const s=noreFixture();Object.assign(s.date,{w:3.0,h:2.5,dist:9.5});s.day.arc=56;
  const bad=caseChecks(s);
  for(const name of ['Date window size','Date window position','Day window arc'])assert.equal(bad.find(t=>t.title===name).ok,false,name);
});
test('the Vernoy case is not given movement-calendar checks',()=>{
  const s=noreFixture();s.case.model=VERNOY_CASE.model;s.case.opening=30.5;
  assert.equal(caseChecks(s).some(t=>t.title==='Date window size'||t.title==='Day window arc'),false);
});
test('the NOREL design opens with NOREL\'s own logo, drawn from the built-in vector marks', () => {
  const design = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, '../designs/norel-concept-d-powder-blue.json'), 'utf8'));
  assert.equal(design.text.logoMark, 'NOREL logo');
  for (const k of ['NOREL logo', 'NOREL shield', 'NOREL wordmark']) {
    const m = source.match(new RegExp('LOGO_MARKS\\["' + k + '"\\] = \\{w:([\\d.]+), d:"(M[^"]+)"\\}'));
    assert.ok(m, k + ' is defined');
    assert.ok(+m[1] > 0 && m[2].endsWith('Z'), k + ' has a width and a closed path');
  }
  // added after "Your logo", so the numbered ids of the older marks do not move
  assert.ok(source.indexOf('LOGO_MARKS["Your logo"]') < source.indexOf('LOGO_MARKS["NOREL logo"]'));
});

// ---- Batch of fixes after the v2.10.0 audit ----
// The drawing and editor helpers these touch are small and pure, so they are
// run here from the real source; what needs a browser was checked in one.
const drawCtx = vm.createContext({});
vm.runInContext(chunk('const hex2rgb = h =>', 'function labOf(')+'const f = (n,d=2)=>Number(n).toFixed(d);\n'
  +'const pt = (r,deg)=>{const a=(deg-90)*Math.PI/180;return [r*Math.cos(a), r*Math.sin(a)];};\n'
  +chunk('function facetBar(', '/* ---------------------------------------------------------------\n   Breguet numerals')
  +chunk('const handGeom = h =>', 'function handVec(')
  +'\nthis.d={indexShape,handGeom};', drawCtx);
test('an applied marker casts its shadow as an offset copy, not through a filter WebKit drops', () => {
  for (const style of ['baton','double','dagger','triangle','dot','diamond','box','cone']) {
    let n = 0; const defs = [];
    const svg = drawCtx.d.indexShape({radius:12, length:2.4, width:0.6, color:'#C8C9C7', applied:true, style}, 30, k => k + (n++), defs, 2.3);
    assert.ok(!/filter=/.test(svg) && !defs.some(d => /<filter/.test(d)), style + ' carries no filter');
    assert.match(svg, /^<g transform="translate\(0\.06 0\.10\)" opacity="0\.35">/, style + ' has its shadow copy first');
    assert.equal((svg.match(/rotate\(30\)/g) || []).length, 2, style + ': the shadow and the marker');
  }
  const printed = drawCtx.d.indexShape({radius:12, length:2.4, width:0.6, color:'#111111', applied:false, style:'baton'}, 0, k => k, []);
  assert.ok(!/opacity="0\.35"/.test(printed), 'a printed marker casts no shadow');
});
test('a Breguet pomme wall never reaches past the pomme, so the circle radius stays positive', () => {
  for (const ringW of [0.08, 0.3, 0.75, 1.2, 5]) {
    const g = drawCtx.d.handGeom({length:12, width:0.4, pommeD:1.5, pommePos:86, ringW});
    assert.ok(g.ring < g.pr && g.pr - g.ring > 0, 'wall ' + ringW + ' leaves a hole');
  }
  assert.equal(drawCtx.d.handGeom({length:12, width:0.4, pommeD:1.5, ringW:0.3}).ring, 0.36, 'a sane wall is unchanged (L*0.03 floor)');
});
// Simple mode's own helpers, out of its IIFE.
const guideCtx = vm.createContext({S:null, set:(o,p,v)=>{const k=p.split('.');let t=o;while(k.length>1)t=t[k.shift()];t[k[0]]=v;}});
vm.runInContext(chunk('/* GUIDE-PURE-BEGIN', '/* GUIDE-PURE-END */')+chunk('  const esc2 = s =>', '  const chips = ')+chunk('  const isHex = ', '  const pale = ')
  +chunk('  const STONE_TONE = {', '  const useStone')+chunk('  function put(', '  function apply(')
  // put writes through the full editor's fieldInput; here that is only the write itself
  +'\nfunction fieldInput(p, v){ set(S, p, v); }'
  +'\nthis.g={gv,printClash,put,contrastOf};', guideCtx);
test("a choice's value survives an apostrophe: Tiger's eye can be tapped", () => {
  const attr = guideCtx.g.gv("tiger's eye");
  assert.ok(!attr.includes("'"), 'no bare apostrophe left to close the attribute');
  const back = attr.replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  assert.equal(JSON.parse(back), "tiger's eye");
});
const guideState = over => {
  const s = {dial:{color:'#A9C3DD', finish:'sunburst', stone:''}, numerals:{on:true, tech:'printed', color:'#1F2D47'}, indices:{on:false},
    minute:{on:true, color:'#1F2D47'}, text:{on:true, color:'#1F2D47', lineColor:'#1F2D47', logoTech:'printed', line2:'AUTOMATIC', foot:''}};
  for (const k in over) Object.assign(s[k], over[k]);
  return s;
};
test('the contrast warning covers every dial colour, not only stones, and reads the lines\' own colour', () => {
  const fix = () => { const c = guideCtx.g.printClash(); return c ? c.label : ''; };
  guideCtx.S = guideState({});
  assert.equal(fix(), '', 'navy on powder blue reads');
  guideCtx.S = guideState({dial:{color:'#0E1F55'}});
  assert.equal(fix(), 'Print in white', 'navy printing on a navy dial');
  guideCtx.S = guideState({dial:{color:'#F4F2EC'}, numerals:{color:'#F4F4F2'}, minute:{color:'#F4F4F2'}, text:{color:'#F4F4F2', lineColor:'#F4F4F2'}});
  assert.equal(fix(), 'Print in navy', 'white printing on a white dial');
  guideCtx.S = guideState({dial:{finish:'stone', stone:'lapis lazuli'}});
  assert.equal(fix(), 'Print in white', 'a stone is judged by its slab');
  // only the second line is navy: the logo and the figures are already white
  guideCtx.S = guideState({dial:{color:'#0E1F55'}, numerals:{color:'#F4F4F2'}, minute:{color:'#F4F4F2'}, text:{color:'#F4F4F2', lineColor:'#1F2D47'}});
  assert.equal(fix(), 'Print in white', 'the lines are checked in lineColor');
  guideCtx.S = guideState({dial:{color:'#0E1F55'}, numerals:{tech:'applied', material:'metal', color:'#1F2D47'}, minute:{color:'#F4F4F2'}, text:{color:'#1F2D47', lineColor:'#F4F4F2', logoTech:'applied metal'}});
  assert.equal(fix(), '', 'applied metal is not printing');
});
test('Text colour in simple mode colours the second line and lower text too', () => {
  guideCtx.S = guideState({});
  guideCtx.g.put('text.color', '#C8102E');
  assert.equal(guideCtx.S.text.color, '#C8102E'); assert.equal(guideCtx.S.text.lineColor, '#C8102E');
  guideCtx.g.put('minute.color', '#FFFFFF');
  assert.equal(guideCtx.S.text.lineColor, '#C8102E', 'other colours leave the lines alone');
});
// The full editor's input rules.
const edCtx = vm.createContext({});
vm.runInContext(chunk('const clampTo = ', 'let casePrev')+chunk('const NUM_DEFAULT = ', 'let shownShape')+'\nthis.e={clampTo,hexOf,numDefault,panelShape};', edCtx);
test('a typed number keeps to its range and a colour box takes only colours', () => {
  const box = {min:'6', max:'44'};
  assert.equal(edCtx.e.clampTo(box, 60), 44); assert.equal(edCtx.e.clampTo(box, -5), 6); assert.equal(edCtx.e.clampTo(box, 29.6), 29.6);
  assert.equal(edCtx.e.clampTo({min:'', max:''}, 123), 123, 'no range, no clamp');
  assert.equal(edCtx.e.hexOf('blue-ish'), null); assert.equal(edCtx.e.hexOf('#12345'), null); assert.equal(edCtx.e.hexOf('rgb(1,2,3)'), null);
  assert.equal(edCtx.e.hexOf('#a9c3dd'), '#A9C3DD'); assert.equal(edCtx.e.hexOf('abc'), '#AABBCC'); assert.equal(edCtx.e.hexOf(' #1F2D47 '), '#1F2D47');
});
test('a missing number shows what the drawing uses, never NaN', () => {
  const N = (p, min, max) => ({p, min, max});
  assert.equal(edCtx.e.numDefault(N('dial.lay', 0, 90)), 0);
  assert.equal(edCtx.e.numDefault(N('dial.facet', 0.2, 2)), 1);
  assert.equal(edCtx.e.numDefault(N('sector.zones.0.lift', -1.2, 1.2)), 0);
  assert.equal(edCtx.e.numDefault(N('hHand.reachTrim', 0.8, 1.05)), 0.97);
  assert.equal(edCtx.e.numDefault(N('anything.else', 2, 9)), 2, 'otherwise the nearest end of the range');
});
test('the panel is rebuilt when a choice changes which controls exist', () => {
  edCtx.SCHEMA = {dial:{fields:() => [{t:'sel', p:'dial.pattern'}].concat(edCtx.pat === 'clous' ? [{t:'num', p:'dial.lay'}] : [])}};
  edCtx.sel = 'dial'; edCtx.pat = 'geneva';
  vm.runInContext('var sel = this.sel; var SCHEMA = this.SCHEMA;', edCtx);
  const a = edCtx.e.panelShape(); edCtx.pat = 'clous';
  assert.notEqual(edCtx.e.panelShape(), a, 'clous brings in its lay angle');
  edCtx.pat = 'geneva'; assert.equal(edCtx.e.panelShape(), a);
});
// The technical sheet and the PNG size.
const sheetCtx = vm.createContext({});
vm.runInContext(chunk('const VERNOY_CASE = {','const CASE_SPEC = new Proxy')+'const f = (n,d=2)=>Number(n).toFixed(d);\n'
  +chunk('function caseGeomRows(', 'function specSheet(')+'let tplW = 1040, tplH = 1560;\n'+chunk('function pngSize(', 'function exportPlan(')
  +'\nthis.s={caseGeomRows,pngSize,NOREL_R4,VERNOY_CASE,set:(w,h)=>{tplW=w;tplH=h;}};', sheetCtx);
test('the technical sheet describes a round case as round', () => {
  const round = sheetCtx.s.caseGeomRows(sheetCtx.s.NOREL_R4).map(r => r.join(': ')).join('\n');
  assert.doesNotMatch(round, /corner|flats/i);
  assert.match(round, /Case: round, Ø41\.00 mm/); assert.match(round, /Bezel: Ø41\.00 outside, Ø34\.20 inside, 72 flutes/); assert.match(round, /Bracelet: 21\.00/);
  const cushion = sheetCtx.s.caseGeomRows(sheetCtx.s.VERNOY_CASE).map(r => r[0]);
  assert.ok(cushion.includes('Profile radii') && cushion.includes('Strap width'), 'the cushion keeps its own rows');
});
test('a PNG of the photographed view is as large as the size chosen', () => {
  for (const side of [1200, 2000, 3000]) assert.deepEqual({...sheetCtx.s.pngSize(side, true)}, {W:side, H:side*1.5});
  assert.deepEqual({...sheetCtx.s.pngSize(3000, false)}, {W:3000, H:3000});
  const big = sheetCtx.s.pngSize(6000, true);
  assert.ok(big.W * big.H <= 16.7e6, 'never past the largest canvas a phone draws');
});
