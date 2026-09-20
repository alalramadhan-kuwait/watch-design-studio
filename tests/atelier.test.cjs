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
