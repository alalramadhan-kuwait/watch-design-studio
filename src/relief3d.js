import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {reliefSettings,subdialLayout,handAngles,markerAngles,zoneBands,NOREL_R1,lugTopAt,norelStack,bezelProfile,gemBezelTop,
  braceletPath,braceletRows,linkProfile,cyclopsLens,traceMask,simplifyLoop,nestLoops,loopArea,PBR_METAL} from './relief-model.js';

/* The 3D view. Two builds of the head share one studio:
   - a NOREL case (R3, Concept D, R4) is Blue Creations' own geometry: the
     case middle, lugs, crown and back are the R1 STEP (app/norel-case-r1.glb,
     made by tools/norel-case-glb.py, loaded the first time the view opens),
     and the bezel, crystal and cyclops are built here to the case spec's
     numbers — R4's, the 3 Nov drawing, for the approved case — on a
     President-style bracelet;
   - any other case keeps the procedural build: its outline extruded, a
     rolled rim and a strap.
   Millimetres throughout; +X toward 3, +Y toward 12, +Z toward the viewer,
   the origin on the dial top at its centre. */

const bridge=window.WatchReliefBridge;
const dialog=document.getElementById('relief-dialog');
const mount=document.getElementById('relief-canvas');
const status=document.getElementById('relief-status');
const CASE_GLB='./app/norel-case-r1.glb';
/* phones and tablets: a smaller shadow map, the same everything else */
const LITE=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
let renderer,scene,camera,controls,model,envTarget,keyLight,floor,settings,state,requestId=0,observer,rotation=false,opener;
const textures=new Set();
const loader=new SVGLoader();
const stats=window.__relief3dStats={};
function mesh(geometry,material,parent=model){
  const obj=new THREE.Mesh(geometry,material);obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;
}
function texture(canvas,color=true){const t=new THREE.CanvasTexture(canvas);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();textures.add(t);return t;}
function clearModel(){
  if(model){scene.remove(model);const materials=new Set();model.traverse(o=>{if(!o.userData.keep)o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});materials.forEach(m=>m.dispose());}
  textures.forEach(t=>t.dispose());textures.clear();model=new THREE.Group();scene.add(model);
}

/* ---- metal ----
   Polished steel and gold are mirrors with a little blur; brushed steel is
   rougher and anisotropic, so a softbox stretches into a streak across the
   grain instead of a blob. Colours are reflectances (PBR_METAL), not the
   flat paints the 2D drawing uses. */
const GOLD_NAMES=['yellow gold','rose gold','white gold'];
function metalTone(name,fallback){
  if(GOLD_NAMES.includes(name))return PBR_METAL[name];
  if(name==='steel'||!fallback)return PBR_METAL.steel;
  return fallback;
}
const polished=(color,roughness=.1)=>new THREE.MeshStandardMaterial({color,metalness:1,roughness,envMapIntensity:1});
const brushed=(color,roughness=.3)=>new THREE.MeshPhysicalMaterial({color,metalness:1,roughness,anisotropy:.75,anisotropyRotation:Math.PI/2,envMapIntensity:1});
/* a coloured hex as the metal it names: a 2D gold or steel paint maps to
   its reflectance; anything else (blued, black) is taken as it is */
function metalFromHex(hex){
  const h=String(hex||'').toUpperCase(),c=new THREE.Color(hex||'#cccccc'),hsl={};c.getHSL(hsl);
  if(['#D7B56D','#D7B04B','#C2A24A'].includes(h))return PBR_METAL['yellow gold'];
  if(['#D9A48C','#D9A184'].includes(h))return PBR_METAL['rose gold'];
  if(['#E3E4E6','#E5E3DC'].includes(h))return PBR_METAL['white gold'];
  if(hsl.s<.12&&hsl.l>.62)return PBR_METAL.steel;
  return hex;
}

/* ---- the studio ----
   A softbox studio made in code and baked into an environment map, lit as
   a watch is photographed: a white sweep below, a darker ceiling, a broad
   box overhead, tall strips either side, and black cards and white strips
   standing round the horizon. Polished steel shows these as the crisp
   bright bands and dark lines a product photograph has, rather than the
   even grey of a room; a fluted bezel's facets, which face every way,
   pick up the cards and the strips in turn. */
function studioEnvironment(){
  const env=new THREE.Scene();
  const sky=new THREE.SphereGeometry(100,48,24),col=[],p=sky.attributes.position;
  const lo=new THREE.Color('#c9c7c2'),mid=new THREE.Color('#a3a5a8'),hi=new THREE.Color('#77797d');
  /* the horizon is lit from the key side (upper left, 135°) and falls away
     opposite, so the two faces of each flute catch it unequally */
  for(let i=0;i<p.count;i++){
    const x=p.getX(i)/100,y=p.getY(i)/100,z=p.getZ(i)/100,c=z<0?mid.clone().lerp(lo,Math.min(1,-z*2.5)):mid.clone().lerp(hi,Math.min(1,z*1.6));
    const h=Math.hypot(x,y)||1,side=(-x+y)/h*Math.SQRT1_2,band=Math.max(0,1-Math.abs(z)/.45);
    c.multiplyScalar(1+band*(side>0?1.8*side:.88*side));col.push(c.r,c.g,c.b);}
  sky.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  env.add(new THREE.Mesh(sky,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const box=(w,h,pos,power,tint='#ffffff')=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(tint).multiplyScalar(power),side:THREE.DoubleSide}));m.position.set(...pos);m.lookAt(0,0,0);env.add(m);};
  box(72,46,[-22,24,76],3.2,'#fffaf2');   // the big box overhead, toward 11
  box(14,110,[-78,-4,34],4.0);             // tall strip, left
  box(14,110,[78,6,40],3.4,'#f4f7ff');     // tall strip, right
  box(110,10,[0,84,30],2.6);               // strip behind, along 12
  box(26,26,[42,-40,66],2.2);              // a small kicker
  /* round the horizon, twelve stations: black cards and white strips */
  for(let k=0;k<12;k++){const a=(k+.25)*Math.PI/6;box(k%2?9:13,46,[66*Math.cos(a),66*Math.sin(a),-2],k%2?3.2:0);}
  /* and, just below the horizon where a 45° flute facet looks when the
     watch is seen face on, a fine comb of light and dark: the two faces of
     each flute land on different teeth, so they alternate bright and dark
     as in the photograph */
  /* a dark flag on the table in front, so the links curving away under 6
     show their rounded tops instead of a white blank */
  box(70,34,[0,-52,-40],.12);box(70,34,[0,52,-40],.2);
  for(let k=0;k<36;k++){const a=k*Math.PI/18+.05;box(4.2,8,[60*Math.cos(a),60*Math.sin(a),-7],k%2?3.0:0);}
  const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(env,.015);
  pmrem.dispose();env.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  return target;
}
function backdrop(){
  const cv=document.createElement('canvas');cv.width=cv.height=512;const g=cv.getContext('2d');
  const grad=g.createRadialGradient(256,200,20,256,256,420);grad.addColorStop(0,'#f3f1ec');grad.addColorStop(.55,'#e2dfd8');grad.addColorStop(1,'#bdb9b0');
  g.fillStyle=grad;g.fillRect(0,0,512,512);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
/* A soft contact shadow: blurred ellipses drawn once into a texture, laid
   flat where the watch meets the table. */
function contactShadow(blobs,size){
  const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
  for(const [x,y,rx,ry,a] of blobs){
    g.save();g.translate(128+x/size*256,128-y/size*256);g.scale(rx/size*256,ry/size*256);
    const grad=g.createRadialGradient(0,0,0,0,0,1);grad.addColorStop(0,`rgba(0,0,0,${a})`);grad.addColorStop(.55,`rgba(0,0,0,${a*.55})`);grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad;g.beginPath();g.arc(0,0,1,0,Math.PI*2);g.fill();g.restore();
  }
  const t=texture(cv);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false}));
  m.renderOrder=-1;return m;
}

function init(){
  if(renderer)return;
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label','Interactive 3D watch. Drag to rotate, scroll or pinch to zoom. Arrow keys rotate.');renderer.domElement.tabIndex=0;
  mount.prepend(renderer.domElement);
  scene=new THREE.Scene();scene.background=backdrop();
  camera=new THREE.PerspectiveCamera(32,1,1,800);camera.up.set(0,1,0);
  controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.minDistance=28;controls.maxDistance=220;controls.maxPolarAngle=Math.PI*.83;controls.enableDamping=false;
  controls.addEventListener('change',render);
  const t0=performance.now();envTarget=studioEnvironment();scene.environment=envTarget.texture;scene.environmentIntensity=1;stats.envMs=Math.round(performance.now()-t0);
  keyLight=new THREE.DirectionalLight('#fffaf0',1.1);keyLight.castShadow=true;const sm=LITE?1024:2048;keyLight.shadow.mapSize.set(sm,sm);
  Object.assign(keyLight.shadow.camera,{left:-34,right:34,top:42,bottom:-42,near:10,far:200});keyLight.shadow.bias=-.0004;keyLight.shadow.normalBias=.03;keyLight.shadow.radius=4;
  scene.add(keyLight,keyLight.target);
  floor=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.ShadowMaterial({opacity:.1}));floor.receiveShadow=false;scene.add(floor);
  observer=new ResizeObserver(resize);observer.observe(mount);
  renderer.domElement.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
    const offset=camera.position.clone().sub(controls.target),sph=new THREE.Spherical().setFromVector3(offset);
    if(e.key==='ArrowLeft')sph.theta-=.12;if(e.key==='ArrowRight')sph.theta+=.12;if(e.key==='ArrowUp')sph.phi-=.1;if(e.key==='ArrowDown')sph.phi+=.1;
    sph.phi=Math.max(.1,Math.min(Math.PI*.8,sph.phi));camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));controls.update();render();
  });
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();status.textContent='3D graphics were interrupted. Close this view and reload to restore them; your design is saved.';});
}
function resize(){if(!renderer||!dialog.open)return;const w=mount.clientWidth,h=mount.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();}
function render(){if(renderer&&dialog.open)renderer.render(scene,camera);}
function pose(mode){
  if(!controls)return;
  controls.target.set(0,mode==='macro'?2:mode==='front'?0:-4,mode==='front'?-2:-5);
  camera.position.set(...(mode==='front'?[0,0,122]:mode==='macro'?[13,-21,33]:[38,-64,84]));controls.update();render();
}
function extrudeSVG(svg,material,depth,bevel,z,parent=model,segments=2){
  const data=loader.parse(svg),group=new THREE.Group();parent.add(group);group.scale.y=-1;group.position.z=z;
  for(const path of data.paths){
    if(path.userData?.style?.fill==='none')continue;
    for(const shape of SVGLoader.createShapes(path)){
      mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel*.65,bevelOffset:-bevel*.5,bevelSegments:segments,curveSegments:18,steps:1}),material,group);
    }
  }
  return group;
}
/* A profile [r, z] turned about the dial axis. */
function lathe(pts,segments,material,parent=model){
  const g=new THREE.LatheGeometry(pts.map(([r,z])=>new THREE.Vector2(r,z)),segments);g.rotateX(Math.PI/2);
  return mesh(g,material,parent);
}
/* A fluted bezel, as a ring of straight radial flutes on an outward slope:
   polished land at the crystal, the fluted slope, then a short outer wall.
   Each flute is a ridge and a valley, sampled so both land on vertices. */
function flutedBezel(rb,rbi,land,n,z0,height,material,depth){
  const top=z0+height,prof=[[rbi,top-.15],[rbi+.1,top],[rbi+land,top],[rb,z0+.55],[rb,z0+.3],[rb,z0]];
  const slope=2,dense=[];
  for(let i=0;i<prof.length-1;i++){const [r0,z1]=prof[i],[r1,z2]=prof[i+1],k=i===slope?18:2;for(let j=0;j<k;j++){const t=j/k;dense.push([r0+(r1-r0)*t,z1+(z2-z1)*t,i===slope||(i===slope+1&&j===0)]);}}
  dense.push([...prof[prof.length-1],false]);
  return flutedRing(dense,n,depth,rbi+land,rb,material);
}
/* The fluted band itself: rows [r, z, fluted] turned through n flutes, each
   a V cut as deep as the case's flutes are cut (0.41 mm on the B6098G-A1)
   or a third of the pitch, running out through the outer edge. Flat faces,
   so each side of a flute catches the light on its own. */
function flutedRing(rows,n,depth,r0,r1,material){
  const seg=n*2,pos=[],idx=[],np=rows.length;
  for(let a=0;a<=seg;a++){
    const th=2*Math.PI*a/seg,tri=a%2?-1:1;
    for(const [r,z,fl] of rows){
      let zz=z;
      if(fl){const t=Math.min(1,Math.max(0,(r-r0)/(r1-r0))),env=Math.min(1,t/.05),d=depth||.34*(2*Math.PI*r/n);zz+=d/2*env*tri;}
      pos.push(r*Math.cos(th),r*Math.sin(th),zz);
    }
  }
  for(let a=0;a<seg;a++)for(let i=0;i<np-1;i++){const q=a*np+i,r2=(a+1)*np+i;idx.push(q,q+1,r2,q+1,r2+1,r2);}
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
  g=g.toNonIndexed();g.computeVertexNormals();
  const m=mesh(g,material);m.material.side=THREE.DoubleSide;return m;
}
/* A President-style bracelet for a case with no geometry of its own:
   rows of three links, brushed outers and a polished centre. */
function boxBracelet(width,l2l,steel,pol){
  for(const sgn of [-1,1]){
    let y=sgn*(l2l/2-.4),z=-2.6,tilt=0;
    for(let k=0;k<5;k++){
      const w=width-k*.4,h=4.5,row=new THREE.Group();model.add(row);
      for(const sx of [-1,1]){const o=mesh(new THREE.BoxGeometry(w*.33,h-.2,2.3),steel,row);o.position.x=sx*w*.335;}
      const c=mesh(new THREE.BoxGeometry(w*.32,h-.5,2.6),pol,row);c.position.z=.15;
      tilt+=sgn*(k===0?.07:.16);row.rotation.x=tilt;
      y+=sgn*h/2*Math.cos(tilt);z-=Math.abs(Math.sin(tilt))*h/2;row.position.set(0,y,z);
      y+=sgn*h/2*Math.cos(tilt);z-=Math.abs(Math.sin(tilt))*h/2;
    }
  }
}
function circle(r,color,z,x=0,y=0){const m=mesh(new THREE.CircleGeometry(r,96),color);m.position.set(x,y,z);return m;}
function torus(r,t,z,material,x=0,y=0){const m=mesh(new THREE.TorusGeometry(r,t,12,128),material);m.position.set(x,y,z);return m;}
function subArtwork(sub){
  const cv=document.createElement('canvas');cv.width=cv.height=512;const ctx=cv.getContext('2d'),r=256;
  ctx.fillStyle=sub.color||'#EDEADF';ctx.fillRect(0,0,512,512);ctx.translate(r,r);ctx.scale(4/3,4/3);ctx.strokeStyle=sub.ring||'#252A2C';ctx.fillStyle=ctx.strokeStyle;
  if(sub.track!==false){
    ctx.beginPath();ctx.arc(0,0,166,0,Math.PI*2);ctx.lineWidth=2;ctx.stroke();
    for(let i=0;i<60;i++){ctx.save();ctx.rotate(i*Math.PI/30);ctx.beginPath();ctx.moveTo(0,-165);ctx.lineTo(0,i%5===0?-149:-157);ctx.lineWidth=i%5===0?2:1;ctx.stroke();ctx.restore();}
    ctx.font='28px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';for(let n=10;n<=60;n+=10){const a=n*Math.PI/30;ctx.fillText(String(n),Math.sin(a)*125,-Math.cos(a)*125);}
  }
  return cv;
}
async function svgCanvas(svg,px=1024){
  const img=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Dial artwork could not be rendered.'));img.src=url;});const cv=document.createElement('canvas');cv.width=cv.height=px;cv.getContext('2d').drawImage(img,0,0,px,px);return cv;}finally{URL.revokeObjectURL(url);}
}
const uv={generateTopUV(g,v,a,b,c){return [a,b,c].map(i=>new THREE.Vector2(v[i*3]/uv.d+.5,v[i*3+1]/uv.d+.5));},generateSideWallUV(g,v,a,b,c,d){return [a,b,c,d].map(i=>new THREE.Vector2(v[i*3]/uv.d+.5,v[i*3+2]));},d:31};

/* ---- the NOREL head ---- */
let caseParts=null,caseLoad=null;
function loadCase(){
  if(caseParts)return Promise.resolve(caseParts);
  if(!caseLoad){
    const t0=performance.now();
    caseLoad=new GLTFLoader().loadAsync(CASE_GLB).then(gltf=>{
      const parts={};gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse(o=>{if(o.isMesh)parts[o.name]={geometry:o.geometry,matrix:o.matrixWorld.clone()};});
      let tris=0;for(const k in parts)tris+=parts[k].geometry.index.count/3;
      stats.caseLoadMs=Math.round(performance.now()-t0);stats.caseTriangles=tris;caseParts=parts;return parts;
    }).catch(error=>{caseLoad=null;throw new Error('The case model could not load ('+error.message+').');});
  }
  return caseLoad;
}
function casePart(name,material){
  const p=caseParts[name];if(!p)return null;
  const m=mesh(p.geometry,material);m.userData.keep=true;m.matrixAutoUpdate=false;m.matrix.copy(p.matrix);return m;
}
/* A round brilliant one unit across: table, crown, girdle and pavilion,
   with the crown's facets turned half a step from the table's so they
   alternate light and dark as a cut stone does. */
function brilliantGeometry(){
  const n=16,pos=[],ring=(r,z,off)=>Array.from({length:n},(_,i)=>{const a=(i+off)*2*Math.PI/n;return [r*Math.cos(a),r*Math.sin(a),z];});
  const table=ring(.285,.16,0),star=ring(.4,.09,.5),girdle=ring(.5,0,0),culet=[0,0,-.43];
  const tri=(a,b,c)=>pos.push(...a,...b,...c);
  for(let i=0;i<n;i++){const j=(i+1)%n;
    tri([0,0,.16],table[i],table[j]);
    tri(table[i],star[i],table[j]);tri(table[i],girdle[i],star[i]);tri(star[i],girdle[j],table[j]);tri(star[i],girdle[i],girdle[j]);
    tri(girdle[j],girdle[i],culet);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}
/* A step-cut baguette, 1 x 1 x its depth: a tapered block with a table. */
function baguetteGeometry(){
  const pos=[],q=(z,s)=>[[-s,-s,z],[s,-s,z],[s,s,z],[-s,s,z]],tbl=q(.18,.36),gird=q(0,.5),bot=q(-.32,.3);
  const quad=(a,b,c,d)=>pos.push(...a,...b,...c,...a,...c,...d);
  quad(...tbl);for(let i=0;i<4;i++){const j=(i+1)%4;quad(gird[i],gird[j],tbl[j],tbl[i]);quad(bot[i],bot[j],gird[j],gird[i]);}
  quad(bot[3],bot[2],bot[1],bot[0]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}
function gemMaterial(colors){
  const clear=colors&&colors.fire>.5;
  /* a cut stone as a faceted mirror over its body colour: each facet throws
     back a different piece of the studio, which is most of what makes a
     diamond read as one at this size */
  return new THREE.MeshStandardMaterial({color:clear?'#ffffff':(colors?.mid||'#9aa6b2'),emissive:clear?'#30343a':(colors?.deep||'#000000'),emissiveIntensity:clear?1:.6,metalness:clear?1:.6,roughness:.0,envMapIntensity:clear?3.4:1.8,flatShading:true});
}
/* Stones set round a ring: one instanced mesh, each turned to the ring's
   surface where it sits. */
function stoneRing(spec,K,material){
  const n=spec.n,geom=spec.cut==='round'?brilliantGeometry():baguetteGeometry(),inst=new THREE.InstancedMesh(geom,material,n);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3();
  const r=spec.rm,z=gemBezelTop(K,r),zIn=gemBezelTop(K,r-.4),zOut=gemBezelTop(K,r+.4),tilt=Math.atan2(zIn-zOut,.8);
  for(let k=0;k<n;k++){
    const a=k*2*Math.PI/n;
    q.setFromEuler(new THREE.Euler(0,tilt,a,'ZYX'));
    if(spec.cut==='round')s.set(spec.d,spec.d,spec.d);else s.set(spec.L,spec.W,spec.L*.55);
    p.set(r*Math.cos(a),r*Math.sin(a),z+(spec.cut==='round'?.05:.02));
    inst.setMatrixAt(k,m.compose(p,q,s));
  }
  inst.castShadow=false;inst.receiveShadow=false;model.add(inst);return inst;
}
/* The bezel to the spec's numbers: fluted, or a polished ring of stones. */
function norelBezel(K,lux,metal){
  const gem=lux.gem,prof=bezelProfile(K,!!gem),pts=prof.pts;
  if(gem){
    lathe(pts.slice().reverse(),256,metal);
    stoneRing(gem,K,gemMaterial(gem.colors));
  }else{
    /* everything but the fluted slope is turned smooth; the slope and the
       top of the outer wall go round as flutes */
    const s=prof.slope,smooth=pts.slice(s+2).concat(pts.slice(0,s+1));
    lathe(smooth.slice().reverse(),256,metal);
    const [r0,z0]=pts[s],[r1,z1]=pts[s+1],rows=[];
    for(let j=0;j<=8;j++){const t=j/8;rows.push([r0+(r1-r0)*t,z0+(z1-z0)*t,true]);}
    rows.push([pts[s+2][0],pts[s+2][1],false]);
    flutedRing(rows,prof.stack.flutes,prof.stack.fluteDepth,r0,r1,metal.clone());
  }
  return prof.stack;
}
/* Sapphire: it shows what is behind it and adds a reflection, so it is
   drawn as reflection alone, added over the dial (no darkening, no second
   render pass for refraction). */
/* (Lit by the environment alone: a near-perfect mirror under the key light
   spreads its highlight into a haze over the whole dial.) */
const glassMaterial=(strength=.05)=>new THREE.MeshBasicMaterial({color:'#000000',envMap:envTarget.texture,combine:THREE.AddOperation,reflectivity:strength,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
function crystal(stack,K){
  const r=stack.glassD/2,top=new THREE.Mesh(new THREE.CircleGeometry(r,128),glassMaterial(.05));top.position.z=stack.glassTop;top.renderOrder=20;model.add(top);
  const side=new THREE.Mesh(new THREE.CylinderGeometry(r,r,stack.glassTop-stack.glassBottom,128,1,true),glassMaterial(.08));side.rotation.x=Math.PI/2;side.position.z=(stack.glassTop+stack.glassBottom)/2;side.renderOrder=20;model.add(side);
  /* the dark gasket between the glass and the bezel's inner edge */
  const gasket=new THREE.Mesh(new THREE.RingGeometry(r-.02,stack.bezelID/2+.01,128),new THREE.MeshStandardMaterial({color:'#121314',roughness:.55,metalness:0}));gasket.position.z=stack.bezelTop-.06;model.add(gasket);
}
/* The cyclops: a clear plano-convex lens on the crystal (Ø7.00 cut flat to
   5.50, 1.10 high, centred 10.00 mm out at 3 on R4). What it shows is the
   dial under it, magnified about its centre: the dial artwork is laid on
   the lens's flat underside with its UVs scaled by 1/magnification about
   that centre, under the dial's own material and light, so the date window,
   its frame and the dial and track round it are seen enlarged, clipped
   exactly to the lens outline and carried with the lens as the view moves.
   Over it, the dome adds only a reflection, a soft highlight along its rim
   and the faint dark line where a real lens bends the light at its edge. */
function cyclops(stack,K,dialMaterial,r){
  const dt=state.date||{},mag=parseFloat(dt.cyclops)||1,cyc=K.cyclops;
  if(!dt.on||mag<=1||!cyc)return;
  const ang=(Number.isFinite(+dt.at)?+dt.at:3)*Math.PI/6,dist=Number.isFinite(+cyc.c)?+cyc.c:(+dt.dist||10);
  const cx=Math.sin(ang)*dist,cy=Math.cos(ang)*dist,lens=cyclopsLens(+cyc.w||7,+cyc.h||5.5,+cyc.lift||1.1),rot=Math.PI/2-ang;
  const group=new THREE.Group();group.position.set(cx,cy,stack.glassTop);group.rotation.z=rot;model.add(group);
  /* the lens outline, inset by k: two arcs joined by the flat cuts */
  const outline=k=>{const a0=Math.asin(Math.min(1,(lens.half-k)/(lens.r-k))),pts=[];
    for(const [from,to] of [[-a0,a0],[Math.PI-a0,Math.PI+a0]])for(let i=0;i<=24;i++){const a=from+(to-from)*i/24;pts.push(new THREE.Vector2((lens.r-k)*Math.cos(a),(lens.r-k)*Math.sin(a)));}
    return pts;};
  /* the magnified dial on the lens's underside */
  const base=new THREE.ShapeGeometry(new THREE.Shape(outline(0))),bp=base.attributes.position,buv=base.attributes.uv;
  for(let i=0;i<bp.count;i++){const lx=bp.getX(i),ly=bp.getY(i),wx=cx+(lx*Math.cos(rot)-ly*Math.sin(rot))/mag,wy=cy+(lx*Math.sin(rot)+ly*Math.cos(rot))/mag;buv.setXY(i,wx/(2*r)+.5,wy/(2*r)+.5);}
  const view=dialMaterial.clone();view.polygonOffset=true;view.polygonOffsetFactor=-2;view.polygonOffsetUnits=-2;
  const bm=new THREE.Mesh(base,view);bm.position.z=.004;group.add(bm);
  /* the dome: polar rings, cut flat across */
  const NR=10,NA=72,pos=[],idx=[];
  for(let i=0;i<=NR;i++)for(let j=0;j<=NA;j++){const rr=lens.r*i/NR,a=j/NA*Math.PI*2,x=rr*Math.cos(a),y=Math.max(-lens.half,Math.min(lens.half,rr*Math.sin(a)));pos.push(x,y,lens.z(x,y));}
  for(let i=0;i<NR;i++)for(let j=0;j<NA;j++){const a=i*(NA+1)+j,b=a+NA+1;idx.push(a,b,a+1,a+1,b,b+1);}
  const dome=new THREE.BufferGeometry();dome.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));dome.setIndex(idx);dome.computeVertexNormals();
  const d=new THREE.Mesh(dome,glassMaterial(.09));d.renderOrder=21;group.add(d);
  /* the two flat cuts, barely there */
  const xc=Math.sqrt(lens.r*lens.r-lens.half*lens.half),wp=[],wi=[],S=24;
  for(const sy of [-1,1]){const b0=wp.length/3;for(let k=0;k<=S;k++){const x=-xc+2*xc*k/S;wp.push(x,sy*lens.half,0,x,sy*lens.half,lens.z(x,sy*lens.half));}
    for(let k=0;k<S;k++){const a=b0+k*2;if(sy>0)wi.push(a,a+2,a+1,a+1,a+2,a+3);else wi.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const walls=new THREE.BufferGeometry();walls.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));walls.setIndex(wi);walls.computeVertexNormals();
  const w=new THREE.Mesh(walls,glassMaterial(.16));w.renderOrder=21;group.add(w);
  /* a ring between two insets of the outline, laid just on the base */
  const band=(k0,k1,material,z)=>{const s=new THREE.Shape(outline(k0));s.holes.push(new THREE.Path(outline(k1).reverse()));const m=new THREE.Mesh(new THREE.ShapeGeometry(s),material);m.position.z=z;m.renderOrder=22;group.add(m);};
  band(0,.09,new THREE.MeshBasicMaterial({color:'#20262c',transparent:true,opacity:.42,depthWrite:false}),.008);           // the refraction line at the edge
  band(.09,.2,new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.22,depthWrite:false,blending:THREE.AdditiveBlending}),.009); // the rim's highlight
}
/* The bracelet, President-style: rows of three rounded links, brushed
   outers and a polished centre, from end links that fill the lugs down
   round a wrist-like curve to the clasp. Each finish is one merged mesh. */
function bracelet(K,mats){
  const thick=2.7,w0=(+K.lugWidth||21)-.1,w1=+K.clasp||16;
  /* the first row's top meets the lug tips; its underside is the path */
  const theta0=-25*Math.PI/180,yTop=23.0,zTop=lugTopAt(23.0)+.12,y0=yTop+Math.sin(theta0)*thick,z0=zTop-Math.cos(theta0)*thick;
  const path=braceletPath({y0,z0,theta0,R:20}),rows=braceletRows(path,{pitch:5.3,gap:.42,w0,w1});
  const pieces={outer:[],centre:[],endOuter:[],endCentre:[]};
  const linkGeom=(len,width,th)=>{const bev=Math.min(.32,width*.08),depth=Math.max(.05,width-2*bev);
    const g=new THREE.ExtrudeGeometry(new THREE.Shape(linkProfile(len,th).map(([u,v])=>new THREE.Vector2(u,v))),{depth,bevelEnabled:true,bevelThickness:bev,bevelSize:bev*.7,bevelOffset:-bev*.7,bevelSegments:3,curveSegments:1,steps:1});
    g.translate(0,0,-depth/2);return g;};
  const frame=(sgn,y,z,th,x=0)=>{const T=new THREE.Vector3(0,sgn*Math.cos(th),Math.sin(th)),N=new THREE.Vector3(0,-sgn*Math.sin(th),Math.cos(th)),X=new THREE.Vector3(sgn,0,0);
    return new THREE.Matrix4().makeBasis(T,N,X).setPosition(x,sgn*y,z);};
  for(const sgn of [-1,1])for(const row of rows){
    const wc=row.width*.42,g=.24,wo=(row.width-wc-2*g)/2,base=frame(sgn,row.y,row.z,row.theta);
    pieces.centre.push(linkGeom(row.length,wc,thick*1.06).applyMatrix4(base));
    for(const sx of [-1,1]){const off=new THREE.Matrix4().makeTranslation(0,0,sx*(wc/2+g+wo/2));pieces.outer.push(linkGeom(row.length,wo,thick).applyMatrix4(base.clone().multiply(off)));}
  }
  /* end links: solid between the lugs, their top following the lug tops
     down to the first row, with the centre stripe standing a little proud */
  const ys=[],top=[];for(let y=NOREL_R1.caseWall+.05;y<=22.2;y+=.35){ys.push(y);top.push([y,lugTopAt(y)-.12]);}
  top.push([yTop,zTop]);
  const outline=[...top,[y0,z0],[NOREL_R1.caseWall+.6,z0+.4],[NOREL_R1.caseWall+.05,-4.0]];
  const capLine=[...top].reverse().map(([y,z])=>[y,z-1.1]);
  const endShape=pts=>new THREE.Shape(pts.map(([y,z])=>new THREE.Vector2(y,z)));
  const endGeom=(pts,width,lift=0)=>{const bev=.2,g=new THREE.ExtrudeGeometry(endShape(pts),{depth:width-2*bev,bevelEnabled:true,bevelThickness:bev,bevelSize:bev*.6,bevelOffset:-bev*.6,bevelSegments:2,curveSegments:1,steps:1});g.translate(0,lift,-(width-2*bev)/2);return g;};
  for(const sgn of [-1,1]){
    const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(0,sgn,0),new THREE.Vector3(0,0,1),new THREE.Vector3(sgn,0,0));
    pieces.endOuter.push(endGeom(outline,w0).applyMatrix4(m));
    pieces.endCentre.push(endGeom([...top,...capLine],w0*.42,.1).applyMatrix4(m));
  }
  const merged=(list,mat)=>{const g=mergeGeometries(list.map(x=>x.index?x.toNonIndexed():x),false);list.forEach(x=>x.dispose());g.computeVertexNormals();return mesh(g,mat);};
  merged(pieces.outer.concat(pieces.endOuter),mats.outer);
  merged(pieces.centre.concat(pieces.endCentre),mats.centre);
  return path;
}
/* Applied metal numerals: the 2D renderer draws them alone, the outline
   is traced and stood up off the dial at the design's height and bevel. */
async function appliedNumerals(r){
  const spec=bridge.numeralsSVG?bridge.numeralsSVG(state,1024):null;if(!spec)return null;
  const px=1024,cv=await svgCanvas(spec.svg,px),data=cv.getContext('2d').getImageData(0,0,px,px).data,alpha=new Uint8Array(px*px);
  for(let i=0;i<px*px;i++)alpha[i]=data[i*4+3];
  const s=2*r/px,loops=traceMask(alpha,px,px,128).map(l=>simplifyLoop(l,.35));
  const shapes=nestLoops(loops,4).map(({outer,holes})=>{
    const toV=l=>{const v=l.map(([x,y])=>new THREE.Vector2(x*s-r,r-y*s));if(THREE.ShapeUtils.isClockWise(v))v.reverse();return v;};
    const sh=new THREE.Shape(toV(outer));for(const h of holes){const v=toV(h).reverse();sh.holes.push(new THREE.Path(v));}return sh;
  });
  if(!shapes.length)return null;
  const h=Math.max(.05,spec.height),bev=Math.min(spec.bevel,h*.45,.08);
  const g=new THREE.ExtrudeGeometry(shapes,{depth:Math.max(.02,h-bev),bevelEnabled:true,bevelThickness:bev,bevelSize:bev*.8,bevelOffset:-bev*.8,bevelSegments:2,curveSegments:1,steps:1});
  const m=mesh(g,polished(metalFromHex(spec.metal),.12));m.position.z=bev;return m;
}

async function rebuild(){
  const token=++requestId;mount.dataset.ready='loading';status.textContent='Rendering dial and metal…';document.getElementById('relief-export').disabled=true;
  try{
    const t0=performance.now();
    state=bridge.snapshot();settings=reliefSettings(state.relief3d);syncInputs();
    const spec=bridge.caseSpec?bridge.caseSpec(state):null,round=!!spec&&spec.shape==='round',norel=!!spec&&spec.norel&&round&&state.case.on;
    if(norel&&!caseParts){status.textContent='Loading the case…';await loadCase();if(token!==requestId||!dialog.open)return;}
    const r=bridge.radius(state),subdials=subdialLayout(state,r),PX=2048;
    let tm=performance.now();const surface=bridge.surfaceSVG(state,subdials.length>0,true,PX,norel&&settings.crystal);stats.surfaceSvgMs=Math.round(performance.now()-tm);
    tm=performance.now();const cv=await svgCanvas(surface,PX);stats.surfaceRasterMs=Math.round(performance.now()-tm);if(token!==requestId||!dialog.open)return;
    clearModel();uv.d=r*2;
    const lux=bridge.lux?bridge.lux(state):{};
    /* the case's metals: steel or a whole gold case; two-tone puts gold on
       the bezel, the crown and the bracelet's centre links */
    const caseTone=lux.full?PBR_METAL[lux.full]:metalFromHex(state.case.material||'#bbc1c5');
    const accent=lux.two?PBR_METAL[lux.two]:caseTone;
    const steel=polished(caseTone,.09),darkMetal=polished('#5c6266',.34);
    let floorZ=-(state.case.thickness||7.9)-.7,shadowBlobs=[[0,0,24,24,.5]],shadowSize=90;
    if(norel){
      casePart('case',steel);casePart('crown',polished(accent,.1));casePart('caseback',brushed(caseTone,.26));
      const bezelMetal=lux.gem?polished(PBR_METAL[lux.gem.metal]||accent,.08):polished(accent,.07);
      const stack=norelBezel(spec,lux,bezelMetal);
      if(state.case.strap){
        const path=bracelet(spec,{outer:brushed(caseTone,.3),centre:polished(accent,.07)});
        floorZ=path.bottom-.02;shadowBlobs=[[0,0,11,19,.55],[0,0,22,34,.28]];shadowSize=110;
      }else{floorZ=NOREL_R1.backBottom-.02;shadowBlobs=[[0,0,19,19,.55],[0,0,28,30,.25]];}
      model.userData.stack=stack;
    }else if(state.case.on){
      const outline=bridge.caseOutline(state);
      extrudeSVG(outline,steel,state.case.thickness||7.9,.22,-(state.case.thickness||7.9)+.5);
      if(round){
        flutedBezel(spec.bezelOD/2,Math.max(r+.6,spec.bezelID/2),spec.land||.5,spec.flutes||60,.5,1.15,polished(accent,.08),spec.fluteDepth);
        torus(r+.15,.30,.55,steel);
      }else{
        // A polished rolled inner rim picks up the studio softboxes.
        torus(r+.15,.36,.55,steel);torus(r+.48,.10,.93,steel);
      }
      const lw=state.case.lugWidth||20.1,l2l=state.case.lugToLug||42.8;
      for(const sy of [-1,1])for(const sx of [-1,1]){const lug=mesh(new THREE.BoxGeometry(round?2.7:2.0,6,round?2.8:2.2),steel);lug.position.set(sx*(lw/2+(round?1.35:1)),sy*(l2l/2-2.7),-2.3);}
      if(state.case.strap&&round&&spec.bracelet)boxBracelet(lw,l2l,brushed(caseTone,.36),polished(accent,.08));
      else if(state.case.strap){const leather=new THREE.MeshStandardMaterial({color:state.case.strapColor||'#34251c',roughness:.78,metalness:0});for(const sign of [-1,1]){const strap=mesh(new THREE.BoxGeometry(lw,16,1.8),leather);strap.position.set(0,sign*(l2l/2+4),-3.3);}}
      const cr=round?(spec.crownD||6.5)/2:2.2,cz=round?-3.0:-3.4,crownMetal=polished(accent,.1);
      const crown=mesh(new THREE.CylinderGeometry(cr,cr,round?2.9:2.7,48),crownMetal);crown.rotation.z=Math.PI/2;crown.position.set((state.case.diameter||36)/2+(round?1.2:1),-.1,cz);
      const ng=round?36:28;
      for(let i=0;i<ng;i++){const a=i*2*Math.PI/ng;const groove=mesh(new THREE.BoxGeometry(round?3.0:2.6,.10,.12),darkMetal);groove.position.set(crown.position.x,Math.sin(a)*(cr-.02)-.1,Math.cos(a)*(cr-.02)+cz);groove.rotation.x=-a;}
      shadowBlobs=[[0,0,(state.case.diameter||36)*.62,(state.case.lugToLug||42)*.75,.5]];
    }
    const shape=new THREE.Shape();shape.absarc(0,0,r,0,Math.PI*2,false);
    subdials.forEach(sub=>{const hole=new THREE.Path();hole.absarc(sub.x,sub.y,sub.r,0,Math.PI*2,true);shape.holes.push(hole);});
    tm=performance.now();const bump=texture(bridge.heightCanvas(state,384),false);stats.heightMs=Math.round(performance.now()-tm);
    const fin=state.dial.finish,matte=fin==='matte'||fin==='flat';
    const dialMaterial=new THREE.MeshStandardMaterial({map:texture(cv),color:'#ffffff',metalness:fin==='stone'?.05:matte?.12:.35,roughness:matte?Math.max(.45,settings.roughness):settings.roughness,bumpMap:bump,bumpScale:fin==='guilloche'?.10:.055,envMapIntensity:.9});
    const base=Math.max(.4,settings.subDepth),wallMat=polished(state.dial.color,.4);wallMat.metalness=.6;
    const bands=zoneBands(state,r,base);
    if(bands.length){
      /* The dial is a stack of discs rather than one wearing a picture of a
         stack. Each band is solid from its own face down to the shared
         underside, so the step between two zones is geometry: it has a
         silhouette at a grazing angle and it casts onto what is below it.
         Every band samples the same dial artwork through the same planar UV,
         so the printing lands exactly where it always did. */
      for(const band of bands){
        const ring=new THREE.Shape();ring.absarc(0,0,band.hi,0,Math.PI*2,false);
        if(band.lo>.02){const inner=new THREE.Path();inner.absarc(0,0,band.lo,0,Math.PI*2,true);ring.holes.push(inner);}
        for(const sub of subdials){
          const d=Math.hypot(sub.x,sub.y);
          if(d-sub.r<band.hi&&d+sub.r>band.lo){const h=new THREE.Path();h.absarc(sub.x,sub.y,sub.r,0,Math.PI*2,true);ring.holes.push(h);}
        }
        const disc=mesh(new THREE.ExtrudeGeometry(ring,{depth:band.depth,bevelEnabled:false,curveSegments:96,UVGenerator:uv}),[dialMaterial,wallMat]);
        disc.position.z=band.z;
      }
    }else{
      const blank=mesh(new THREE.ExtrudeGeometry(shape,{depth:base,bevelEnabled:false,curveSegments:128,UVGenerator:uv}),[dialMaterial,wallMat]);blank.position.z=-base;
    }
    // Front/back share the map; hole walls use the second material.
    for(const sub of subdials){
      const floorMat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.85,metalness:0,envMapIntensity:.3});floorMat.map=texture(subArtwork(sub));circle(sub.r,floorMat,-settings.subDepth+.012,sub.x,sub.y);
      torus(sub.r+.02,.065,-.025,steel,sub.x,sub.y);
      const sh=mesh(new THREE.BoxGeometry(.18,sub.r*.78,.10),darkMetal);sh.position.set(sub.x+sub.r*.2,sub.y+sub.r*.27,-settings.subDepth+.15);sh.rotation.z=-.65;
      const hub=mesh(new THREE.SphereGeometry(.24,20,12),steel);hub.scale.z=.4;hub.position.set(sub.x,sub.y,-settings.subDepth+.19);
    }
    const im=state.indices.metal,markerMetal=polished(GOLD_NAMES.includes(im)?PBR_METAL[im]:im==='polished steel'||im==='rhodium'?PBR_METAL.steel:metalFromHex(state.indices.color||'#d0d4d6'),Math.max(.06,settings.roughness*.5));
    for(const angle of markerAngles(state))extrudeSVG(bridge.indexSVG(state,angle),markerMetal,settings.markerHeight,Math.min(settings.bevel,(state.indices.width||.5)*.2),.025);
    /* stones on the gem-set hours, on their cups */
    for(const g of (bridge.gems?bridge.gems(state):[])){
      const a=g.a*Math.PI/180,geo=g.cut==='round'?brilliantGeometry():baguetteGeometry(),st=mesh(geo,gemMaterial(g.colors));
      if(g.cut==='round')st.scale.setScalar(g.d||1.5);else{st.scale.set(g.W||1.1,g.L||2.6,(g.W||1.1)*.6);}
      st.position.set(Math.sin(a)*g.r,Math.cos(a)*g.r,settings.markerHeight+.025+(g.cut==='round'?(g.d||1.5)*.1:.05));st.rotation.z=-a;st.castShadow=false;
    }
    tm=performance.now();await appliedNumerals(r);stats.numeralsMs=Math.round(performance.now()-tm);if(token!==requestId||!dialog.open)return;
    const angles=handAngles(state.meta.time);
    ['hHand','mHand','sHand'].forEach((key,i)=>{
      if(!state[key].on)return;
      const tone=metalFromHex(bridge.handColor(state[key])),hsl={};new THREE.Color(tone).getHSL(hsl);
      const material=polished(tone,state[key].finish==='matte'?.5:hsl.s>.25&&hsl.l<.45?.22:.08);
      const group=extrudeSVG(bridge.handSVG(state,key),material,i===2?.08:.12,Math.min(.06,(state[key].width||.4)*.14),settings.handLift+i*.23,model,3);
      group.rotation.z=-angles[i]*Math.PI/180;
    });
    if(state.hHand.on||state.mHand.on||state.sHand.on){
      const hub=mesh(new THREE.SphereGeometry(Math.max(.5,(state.hHand.boss||1.4)/2),32,16),steel);hub.scale.z=.3;hub.position.z=settings.handLift+.5;
    }
    if(norel){
      const stack=model.userData.stack;
      /* the cyclops is part of the crystal: with the crystal off, the 2D
         drawing's view through it stays printed on the dial instead */
      if(settings.crystal){crystal(stack,spec);cyclops(stack,spec,dialMaterial,r);}
    }else if(settings.crystal&&state.case.on){
      const h=settings.crystalDome,R=(r*r+h*h)/(2*h),theta=Math.asin(r/R);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(R,96,24,0,Math.PI*2,0,theta),glassMaterial(.06));cap.rotation.x=Math.PI/2;cap.position.z=settings.handLift+.85+h-R;cap.renderOrder=20;model.add(cap);
    }
    floor.position.z=floorZ;
    const blob=contactShadow(shadowBlobs,shadowSize);blob.position.z=floorZ+.02;model.add(blob);
    const a=settings.lightAz*Math.PI/180;
    keyLight.position.set(Math.cos(a)*30,Math.sin(a)*30,90);keyLight.target.position.set(0,0,0);
    scene.environmentRotation.set(0,0,(settings.lightAz-135)*Math.PI/180);
    let tris=0;model.traverse(o=>{if(o.isMesh&&o.geometry){const n=o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count;tris+=n/3*(o.isInstancedMesh?o.count:1);}});
    Object.assign(stats,{triangles:Math.round(tris),buildMs:Math.round(performance.now()-t0),norel});
    document.getElementById('relief-name').textContent=state.meta.name;
    status.textContent='Drag to orbit · Pinch or scroll to zoom · Arrow keys to rotate';document.getElementById('relief-export').disabled=false;
    mount.dataset.ready='true';resize();render();
  }catch(error){if(token!==requestId)return;console.error('[3d]',error);status.textContent='3D preview could not load. '+error.message;mount.dataset.ready='error';}
}
function syncInputs(){for(const [key,value] of Object.entries(settings)){const input=document.querySelector(`[data-relief="${key}"]`);if(input){if(input.type==='checkbox')input.checked=value;else input.value=value;const output=input.parentElement.querySelector('output');if(output)output.textContent=typeof value==='number'?value.toFixed(key==='lightAz'?0:2)+(key==='lightAz'?'°':key==='roughness'?'':' mm'):'';}}}
function commitSettings(){const raw={...settings};document.querySelectorAll('[data-relief]').forEach(i=>raw[i.dataset.relief]=i.type==='checkbox'?i.checked:Number(i.value));bridge.settings(reliefSettings(raw));rebuild();}
export async function open(){
  opener=document.getElementById('open-relief');dialog.showModal();
  try{init();pose('angle');resize();await rebuild();}catch(error){status.textContent='Your browser could not start WebGL 3D. The 2D editor remains available. '+error.message;mount.dataset.ready='error';}
}
window.WatchRelief3D={open};
document.querySelectorAll('[data-relief]').forEach(input=>input.addEventListener('change',commitSettings));
document.getElementById('relief-close').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{requestId++;rotation=false;renderer?.setAnimationLoop(null);document.getElementById('relief-rotate').setAttribute('aria-pressed','false');bridge.closed();opener?.focus();});
document.querySelectorAll('[data-camera]').forEach(button=>button.onclick=()=>pose(button.dataset.camera));
document.getElementById('relief-rotate').onclick=e=>{if(!renderer||mount.dataset.ready!=='true')return;rotation=!rotation;e.currentTarget.setAttribute('aria-pressed',String(rotation));if(rotation){let last=0;renderer.setAnimationLoop(time=>{if(!last)last=time;const dt=Math.min(.04,(time-last)/1000);last=time;const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,0,1),dt*.18);camera.position.copy(controls.target).add(offset);controls.update();render();});}else renderer.setAnimationLoop(null);};
document.getElementById('relief-reference').onclick=()=>{bridge.reference();rebuild();pose('angle');};
document.getElementById('relief-undo').onclick=()=>{bridge.undo();rebuild();};
document.getElementById('relief-export').onclick=()=>{if(!renderer||mount.dataset.ready!=='true')return;render();renderer.domElement.toBlob(blob=>{if(!blob){status.textContent='The image could not be saved.';return;}const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=(state.meta.name||'watch').replace(/[^a-z0-9_-]/gi,'-')+'-3d.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);},'image/png');};
