import * as THREE from 'three';
import {createGrandLineShip,createAnimeCrew} from './grandline-3d-kit.js';

/* Original modeled pirate galleon and articulated crew on the portfolio homepage. */
const stage=document.querySelector('#real3d-frame'),canvas=document.querySelector('#real3d-canvas');
const status=document.querySelector('#real3d-status');
const mobile=matchMedia('(max-width:700px)').matches;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
let scene,renderer,camera,ship,crew=[],oceanTime,clock,elapsed=0,ready=false,visible=false;
let paused=false,focused='captain',drag=false,lastX=0,lastY=0;
let current={x:0,y:2.4,z:0,d:mobile?16:16,a:.5,p:.35};
let target={...current};
function note(t){if(status)status.textContent=t}
function select(kind){
 const actor=crew.find(a=>a.kind===kind);
 if(!actor)return;
 focused=kind;
 document.querySelectorAll('[data-stage-crew]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stageCrew===kind)));
 for(const a of crew){
   a.rig.group.scale.setScalar(a.scale*(a.kind===kind?1.16:1));
   a.rig.group.rotation.y=a.kind===kind?-.16:.08;
 }
 target={x:actor.x*.35,y:2.25,z:actor.z*.22,d:12.6,a:kind==='swordsman'?-.52:kind==='navigator'?.65:.18,p:.32};
 actor.rig.setAction(kind==='swordsman'?'slash':kind==='navigator'?'point':'wave');
 note(actor.label+' selected — articulated 3D character, not an SVG.');
}
function tour(){
 target={x:0,y:2,z:.1,d:18,a:1.05,p:.55};
 document.querySelectorAll('[data-stage-crew]').forEach(b=>b.setAttribute('aria-pressed','false'));
 note('Inspect the hull, cannons, deck, rigging, sails, figurehead and wake.');
}
function gesture(){
 const a=crew.find(c=>c.kind===focused);
 if(a){a.rig.setAction(a.kind==='swordsman'?'slash':a.kind==='navigator'?'point':'wave');note(a.label+' performing a real 3D joint animation.');}
}
function waterMaterial(){
 oceanTime={value:0};
 return new THREE.ShaderMaterial({
 side:THREE.DoubleSide,uniforms:{time:oceanTime},
 vertexShader:'uniform float time;varying vec3 vWorld;varying float vHeight;void main(){vec3 v=position;float wave=sin(v.x*.66+time*.9)*.21+cos(v.y*.78-time*.7)*.17+sin((v.x+v.y)*.36+time*.5)*.12;v.z+=wave;vHeight=wave;vec4 w=modelMatrix*vec4(v,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:'uniform float time;varying vec3 vWorld;varying float vHeight;void main(){float fres=pow(1.-abs(normalize(cameraPosition-vWorld).y),3.);float glimmer=pow(max(0.,sin(vWorld.x*3.+time)*cos(vWorld.z*2.9-time*1.2)),16.);vec3 c=mix(vec3(.015,.102,.15),vec3(.07,.28,.33),.48+.44*sin(vWorld.z*.07));c+=vec3(.10,.23,.22)*fres+vec3(.11,.17,.16)*smoothstep(.10,.48,vHeight)+vec3(.33,.29,.21)*glimmer*.21;float fog=smoothstep(25.,70.,length(vWorld.xz));c=mix(c,vec3(.10,.24,.31),fog*.62);gl_FragColor=vec4(c,1.);}'
 });
}
function init(){
 if(ready||!stage||!canvas)return;ready=true;
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.35;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.25:1.7));
  renderer.shadowMap.enabled=!mobile;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x14384f);scene.fog=new THREE.FogExp2(0x183a4d,.009);
  camera=new THREE.PerspectiveCamera(mobile?45:40,1,.1,150);
  scene.add(new THREE.HemisphereLight(0xa8dbf1,0x29495a,2.5));
  const sun=new THREE.DirectionalLight(0xffd59f,3.9);sun.position.set(-11,22,-14);
  sun.castShadow=!mobile;sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;
  scene.add(sun);
  const rim=new THREE.DirectionalLight(0x7ad4e4,1.9);rim.position.set(11,8,12);scene.add(rim);
  const orb=new THREE.Mesh(new THREE.SphereGeometry(4,22,14),new THREE.MeshBasicMaterial({color:0xffdba9,fog:false}));
  orb.position.set(-33,26,-49);scene.add(orb);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(180,180,mobile?56:100,mobile?56:100),waterMaterial());
  water.rotation.x=-Math.PI/2;water.position.y=-.36;scene.add(water);
  ship=createGrandLineShip(THREE,{mobile});scene.add(ship.group);
  crew=[
   {kind:'swordsman',label:'Swordsman',x:-1.03,z:.74,scale:.62},
   {kind:'captain',label:'Straw-hat captain',x:0,z:-1.27,scale:.70},
   {kind:'navigator',label:'Navigator',x:1.03,z:1.1,scale:.63}
  ].map(a=>{const rig=createAnimeCrew(THREE,a.kind,{mobile});rig.group.position.set(a.x,.48,a.z);rig.group.scale.setScalar(a.scale);ship.group.add(rig.group);return {...a,rig};});
  clock=new THREE.Clock();
  resize();
  stage.dataset.ready='true';
  note('Real 3D ready · Select a character, drag to orbit or inspect the ship.');
  requestAnimationFrame(frame);
 }catch(err){
   console.error('Grand Line 3D stage',err);
   stage.dataset.error='true';stage.dataset.errorMessage=String(err?.message||err).slice(0,200);note('3D startup: '+stage.dataset.errorMessage);
 }
}
function resize(){
 if(!renderer)return;
 const r=stage.getBoundingClientRect(),w=Math.max(220,Math.round(r.width)),h=Math.max(200,Math.round(r.height));
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
}
function frame(){
 requestAnimationFrame(frame);
 if(!renderer||!visible||document.hidden)return;
 const delta=Math.min(clock.getDelta(),.05);
 elapsed+=(!paused&&!reduced?delta:0);
 oceanTime.value=elapsed;
 if(!paused&&!reduced){ship.update(elapsed);crew.forEach(a=>a.rig.update(elapsed));}
 const weight=reduced?1:1-Math.exp(-delta*2.5);
 for(const k of Object.keys(current))current[k]+=(target[k]-current[k])*weight;
 const a=current.a,d=current.d,p=current.p;
 camera.position.set(current.x+Math.sin(a)*d,current.y+Math.sin(p)*d*.9,current.z+Math.cos(a)*d);
 camera.lookAt(current.x,current.y,current.z);
 renderer.render(scene,camera);
}
if(stage&&canvas){
 canvas.addEventListener('pointerdown',e=>{
  drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=e.clientX-lastX,dy=e.clientY-lastY;
  target.a-=dx*.005;target.p=THREE.MathUtils.clamp(target.p+dy*.003,.15,1.0);
  lastX=e.clientX;lastY=e.clientY;
 });
 canvas.addEventListener('pointerup',()=>drag=false);
 canvas.addEventListener('pointercancel',()=>drag=false);
 canvas.addEventListener('wheel',e=>{target.d=THREE.MathUtils.clamp(target.d+e.deltaY*.014,8.5,26)},{passive:true});
 document.querySelectorAll('[data-stage-crew]').forEach(b=>b.addEventListener('click',()=>{if(!ready)init();select(b.dataset.stageCrew);}));
 document.querySelector('#stage3d-inspect')?.addEventListener('click',()=>{if(!ready)init();tour();});
 document.querySelector('#stage3d-action')?.addEventListener('click',()=>{if(!ready)init();gesture();});
 document.querySelector('#stage3d-pause')?.addEventListener('click',e=>{
  paused=!paused;e.currentTarget.textContent=paused?'▶ Resume 3D motion':'Ⅱ Pause 3D motion';
  e.currentTarget.setAttribute('aria-pressed',String(paused));
 });
 window.addEventListener('resize',resize,{passive:true});
 document.addEventListener('visibilitychange',()=>clock?.getDelta());
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{
   for(const e of entries){if(e.target===stage){visible=e.isIntersecting;if(visible&&!ready)init();if(visible&&clock)clock.getDelta();}}
  },{rootMargin:'180px',threshold:0}).observe(stage);
 }else{visible=true;init();}
}
