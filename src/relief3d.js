import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {reliefSettings,subdialLayout,handAngles,markerAngles,zoneBands} from './relief-model.js';

const bridge=window.WatchReliefBridge;
const dialog=document.getElementById('relief-dialog');
const mount=document.getElementById('relief-canvas');
const status=document.getElementById('relief-status');
let renderer,scene,camera,controls,model,envTarget,keyLight,settings,state,requestId=0,observer,rotation=false,opener;
const textures=new Set();
const loader=new SVGLoader();
const mat=(color,roughness=.25,metalness=1)=>new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:1.2});
function mesh(geometry,material,parent=model){
  const obj=new THREE.Mesh(geometry,material);obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;
}
function texture(canvas,color=true){const t=new THREE.CanvasTexture(canvas);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.add(t);return t;}
function clearModel(){
  if(model){scene.remove(model);const materials=new Set();model.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});materials.forEach(m=>m.dispose());}
  textures.forEach(t=>t.dispose());textures.clear();model=new THREE.Group();scene.add(model);
}
function init(){
  if(renderer)return;
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.8;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label','Interactive 3D watch. Drag to rotate, scroll or pinch to zoom. Arrow keys rotate.');renderer.domElement.tabIndex=0;
  mount.prepend(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#d8d5cd');
  camera=new THREE.PerspectiveCamera(36,1,.1,500);camera.up.set(0,1,0);
  controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.minDistance=32;controls.maxDistance=140;controls.maxPolarAngle=Math.PI*.83;controls.enableDamping=false;
  controls.addEventListener('change',render);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();envTarget=pmrem.fromScene(room,.04);scene.environment=envTarget.texture;scene.environmentIntensity=.5;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#ffffff','#7e827d',.45));
  keyLight=new THREE.DirectionalLight('#fff9ef',2);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);
  Object.assign(keyLight.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:180});keyLight.shadow.bias=-.00015;keyLight.shadow.normalBias=.025;keyLight.shadow.radius=3;scene.add(keyLight);
  const fill=new THREE.DirectionalLight('#dce6ff',.5);fill.position.set(20,20,35);scene.add(fill);
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
  controls.target.set(0,0,-1);
  camera.position.set(...(mode==='front'?[0,0,91]:mode==='macro'?[15,-24,37]:[27,-42,63]));controls.update();render();
}
function extrudeSVG(svg,material,depth,bevel,z,parent=model){
  const data=loader.parse(svg),group=new THREE.Group();parent.add(group);group.scale.y=-1;group.position.z=z;
  for(const path of data.paths){
    if(path.userData?.style?.fill==='none')continue;
    for(const shape of SVGLoader.createShapes(path)){
      mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel*.65,bevelSegments:2,curveSegments:18,steps:1}),material,group);
    }
  }
  return group;
}
function circle(r,color,z,x=0,y=0){const m=mesh(new THREE.CircleGeometry(r,96),color);m.position.set(x,y,z);return m;}
function torus(r,t,z,material,x=0,y=0){const m=mesh(new THREE.TorusGeometry(r,t,12,128),material);m.position.set(x,y,z);return m;}
function subArtwork(sub){
  const cv=document.createElement('canvas');cv.width=cv.height=384;const ctx=cv.getContext('2d'),r=192;
  ctx.fillStyle=sub.color||'#EDEADF';ctx.fillRect(0,0,384,384);ctx.translate(r,r);ctx.strokeStyle=sub.ring||'#252A2C';ctx.fillStyle=ctx.strokeStyle;
  if(sub.track!==false){
    ctx.beginPath();ctx.arc(0,0,166,0,Math.PI*2);ctx.lineWidth=2;ctx.stroke();
    for(let i=0;i<60;i++){ctx.save();ctx.rotate(i*Math.PI/30);ctx.beginPath();ctx.moveTo(0,-165);ctx.lineTo(0,i%5===0?-149:-157);ctx.lineWidth=i%5===0?2:1;ctx.stroke();ctx.restore();}
    ctx.font='28px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';for(let n=10;n<=60;n+=10){const a=n*Math.PI/30;ctx.fillText(String(n),Math.sin(a)*125,-Math.cos(a)*125);}
  }
  return cv;
}
async function svgCanvas(svg){
  const img=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Dial artwork could not be rendered.'));img.src=url;});const cv=document.createElement('canvas');cv.width=cv.height=1024;cv.getContext('2d').drawImage(img,0,0,1024,1024);return cv;}finally{URL.revokeObjectURL(url);}
}
const uv={generateTopUV(g,v,a,b,c){return [a,b,c].map(i=>new THREE.Vector2(v[i*3]/uv.d+.5,v[i*3+1]/uv.d+.5));},generateSideWallUV(g,v,a,b,c,d){return [a,b,c,d].map(i=>new THREE.Vector2(v[i*3]/uv.d+.5,v[i*3+2]));},d:31};
async function rebuild(){
  const token=++requestId;mount.dataset.ready='loading';status.textContent='Rendering dial and metal…';document.getElementById('relief-export').disabled=true;
  try{
  state=bridge.snapshot();settings=reliefSettings(state.relief3d);syncInputs();
  const r=bridge.radius(state),subdials=subdialLayout(state,r),surface=bridge.surfaceSVG(state,subdials.length>0);
    const cv=await svgCanvas(surface);if(token!==requestId||!dialog.open)return;
    clearModel();uv.d=r*2;
    const steel=mat(state.case.material||'#bbc1c5',.19),darkMetal=mat('#5c6266',.34);
    const outline=bridge.caseOutline(state);
    if(state.case.on){
      extrudeSVG(outline,steel,state.case.thickness||7.9,.22,-(state.case.thickness||7.9)+.5);
      // A polished rolled inner rim picks up the studio softboxes.
      torus(r+.15,.36,.55,steel);torus(r+.48,.10,.93,steel);
      for(const sy of [-1,1])for(const sx of [-1,1]){const lug=mesh(new THREE.BoxGeometry(2.0,6,2.2),steel);lug.position.set(sx*((state.case.lugWidth||20.1)/2+1),sy*((state.case.lugToLug||42.8)/2-2.7),-2.3);}
      if(state.case.strap){const leather=mat(state.case.strapColor||'#34251c',.84,0);for(const sign of [-1,1]){const strap=mesh(new THREE.BoxGeometry(state.case.lugWidth||20.1,16,1.8),leather);strap.position.set(0,sign*((state.case.lugToLug||42.8)/2+4),-3.3);}}
      const crown=mesh(new THREE.CylinderGeometry(2.2,2.2,2.7,48),steel);crown.rotation.z=Math.PI/2;crown.position.set((state.case.diameter||36)/2+1,-.1,-3.4);
      for(let i=0;i<28;i++){const a=i*Math.PI/14;const groove=mesh(new THREE.BoxGeometry(2.6,.10,.12),darkMetal);groove.position.set(crown.position.x,Math.sin(a)*2.18-.1,Math.cos(a)*2.18-3.4);groove.rotation.x=-a;}
    }
    const shape=new THREE.Shape();shape.absarc(0,0,r,0,Math.PI*2,false);
    subdials.forEach(sub=>{const hole=new THREE.Path();hole.absarc(sub.x,sub.y,sub.r,0,Math.PI*2,true);shape.holes.push(hole);});
    const bump=texture(bridge.heightCanvas(state,384),false);
    const dialMaterial=new THREE.MeshStandardMaterial({map:texture(cv),color:'#ffffff',metalness:state.dial.finish==='stone'?.25:.4,roughness:settings.roughness,bumpMap:bump,bumpScale:state.dial.finish==='guilloche'?.10:.055,envMapIntensity:.85});
    const base=Math.max(.4,settings.subDepth),wallMat=mat(state.dial.color,.4,.6);
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
      const blank=mesh(new THREE.ExtrudeGeometry(shape,{depth:base,bevelEnabled:false,curveSegments:96,UVGenerator:uv}),[dialMaterial,wallMat]);blank.position.z=-base;
    }
    // Front/back share the map; hole walls use the second material.
    for(const sub of subdials){
      const floor=mat('#ffffff',.85,0);floor.envMapIntensity=.3;floor.map=texture(subArtwork(sub));circle(sub.r,floor,-settings.subDepth+.012,sub.x,sub.y);
      torus(sub.r+.02,.065,-.025,steel,sub.x,sub.y);
      const sh=mesh(new THREE.BoxGeometry(.18,sub.r*.78,.10),darkMetal);sh.position.set(sub.x+sub.r*.2,sub.y+sub.r*.27,-settings.subDepth+.15);sh.rotation.z=-.65;
      const hub=mesh(new THREE.SphereGeometry(.24,20,12),steel);hub.scale.z=.4;hub.position.set(sub.x,sub.y,-settings.subDepth+.19);
    }
    const markerMetal=mat(state.indices.color||'#d0d4d6',Math.max(.08,settings.roughness*.6));
    for(const angle of markerAngles(state))extrudeSVG(bridge.indexSVG(state,angle),markerMetal,settings.markerHeight,Math.min(settings.bevel,(state.indices.width||.5)*.2),.025);
    const angles=handAngles(state.meta.time);
    ['hHand','mHand','sHand'].forEach((key,i)=>{
      if(!state[key].on)return;
      const material=mat(bridge.handColor(state[key]),state[key].finish==='matte'?.55:.17);
      const group=extrudeSVG(bridge.handSVG(state,key),material,.12,Math.min(.045,(state[key].width||.4)*.12),settings.handLift+i*.23);
      group.rotation.z=-angles[i]*Math.PI/180;
    });
    if(state.hHand.on||state.mHand.on||state.sHand.on){
      const hub=mesh(new THREE.SphereGeometry(Math.max(.5,(state.hHand.boss||1.4)/2),32,16),steel);hub.scale.z=.3;hub.position.z=settings.handLift+.5;
    }
    if(settings.crystal&&state.case.on){
      const h=settings.crystalDome,R=(r*r+h*h)/(2*h),theta=Math.asin(r/R);
      const glass=new THREE.MeshPhysicalMaterial({color:'#ffffff',metalness:0,roughness:.045,transmission:0,ior:1.5,transparent:true,opacity:.10,envMapIntensity:.5,side:THREE.FrontSide,depthWrite:false});
      const cap=mesh(new THREE.SphereGeometry(R,96,24,0,Math.PI*2,0,theta),glass);cap.rotation.x=Math.PI/2;cap.position.z=settings.handLift+.85+h-R;cap.castShadow=false;cap.receiveShadow=false;
    }
    const floor=mesh(new THREE.PlaneGeometry(500,500),new THREE.MeshStandardMaterial({color:'#c9c7bf',roughness:1,metalness:0}));floor.position.z=-(state.case.thickness||7.9)-.7;floor.castShadow=false;
    const a=settings.lightAz*Math.PI/180;keyLight.position.set(Math.cos(a)*35,Math.sin(a)*35,60);
    document.getElementById('relief-name').textContent=state.meta.name;
    status.textContent='Drag to orbit · Pinch or scroll to zoom · Arrow keys to rotate';document.getElementById('relief-export').disabled=false;
    mount.dataset.ready='true';resize();render();
  }catch(error){if(token!==requestId)return;status.textContent='3D preview could not load. '+error.message;mount.dataset.ready='error';}
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
