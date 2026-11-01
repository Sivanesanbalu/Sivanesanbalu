import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

/**
 * Sivanesan B / AI COMMAND CENTER
 * Real-time Three.js geometry + physically lit objects + raycast interactions.
 * No video, GIF, sprite characters or pseudo-3D image in this experience.
 */
const canvas = document.getElementById('three-canvas');
const status = document.getElementById('render-status');
const toast = document.getElementById('toast');
const panel = document.getElementById('module-panel');
const moduleTitle = document.getElementById('module-title');
const moduleDesc = document.getElementById('module-desc');
const moduleIndex = document.getElementById('module-index');
const moduleStack = document.getElementById('module-stack');
const moduleLink = document.getElementById('module-link');
const moduleLabel = document.getElementById('module-label');
const pickerButtons = [...document.querySelectorAll('[data-module]')];
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = window.matchMedia('(max-width: 790px)').matches;
const modules = [
 {name:'VOICE AI',title:'VoiceForge AI',desc:'A configurable voice-agent control plane for agent management, calls, provider integrations and usage. Provider connections require credentials.',stack:'Next.js · TypeScript · PostgreSQL · Vapi',href:'https://github.com/Sivanesanbalu/VoiceForge-AI',color:0x57eaf2,angle:Math.PI*.12},
 {name:'RETRIEVAL',title:'Offline Voice RAG',desc:'A local-first knowledge assistant combining CSV retrieval, FAISS vector search, Whisper speech recognition and compatible Qwen models.',stack:'Python · FAISS · Whisper · Qwen',href:'https://github.com/Sivanesanbalu/RAG-Offline-Inventory-Management-System',color:0xab92ff,angle:Math.PI*.62},
 {name:'AGENT SYSTEMS',title:'AI Job Agent v2',desc:'A multi-step agent pipeline for discovering roles, matching resumes, using browser automation and tracking application status.',stack:'Python · Playwright · Next.js · FastAPI',href:'https://github.com/Sivanesanbalu/ai-job-agent-v2',color:0x70e6b3,angle:Math.PI*1.12},
 {name:'AI RESEARCH',title:'Eco-Transformers',desc:'IEEE-published exploration of efficient transformer inference using self-pruning and activation freezing techniques.',stack:'Research · Transformers · Inference',href:'https://doi.org/10.1109/ICNGCS64900.2025.11183217',color:0xf5ba83,angle:Math.PI*1.62}
];
let scene, camera, renderer, controls, clock;
let rings = [], floating = [], movingDots = [], stars, starRotation=0, glowTexture;
let selected = 0, ready=false, cameraRequest=null, hover=null, pointerDown=null;
let lastUserAction=performance.now(), renderPaused=false, resizeObserver;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hotspots = [];
const stations = [];
const center = new THREE.Vector3(0,1.3,0);
const mobileScale = small ? 0.84 : 1;

function ping(message){
 toast.textContent=message; toast.classList.add('visible');
 clearTimeout(ping.timer); ping.timer=setTimeout(()=>toast.classList.remove('visible'),2300);
}
function material(color,metal=.58,rough=.34,extra={}){
 return new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough,...extra});
}
function mesh(parent,geometry,mat,x=0,y=0,z=0){
 const object=new THREE.Mesh(geometry,mat);
 object.position.set(x,y,z);parent.add(object);return object;
}
function cylinder(parent,rt,rb,h,mat,x=0,y=0,z=0,seg=64){
 return mesh(parent,new THREE.CylinderGeometry(rt,rb,h,seg),mat,x,y,z);
}
function ring(parent,r,t,mat,y=0,x=0,z=0){
 const o=mesh(parent,new THREE.TorusGeometry(r,t,9,96),mat,x,y,z);
 o.rotation.x=Math.PI/2;return o;
}
function orb(parent,r,mat,x=0,y=0,z=0,seg=24){
 return mesh(parent,new THREE.IcosahedronGeometry(r,seg>16?2:1),mat,x,y,z);
}
function edgeBetween(parent,a,b,color,radius=.024,opacity=1){
 const p1=new THREE.Vector3(...a),p2=new THREE.Vector3(...b),d=p2.clone().sub(p1);
 const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,d.length(),8),
 new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity}));
 m.position.copy(p1).add(p2).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
 parent.add(m);return m;
}
function textureGlow(){
 const c=document.createElement('canvas');c.width=128;c.height=128;
 const g=c.getContext('2d');
 const grad=g.createRadialGradient(64,64,3,64,64,63);
 grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.14,'rgba(124,249,244,.82)');
 grad.addColorStop(.43,'rgba(75,175,243,.2)');grad.addColorStop(1,'rgba(75,175,243,0)');
 g.fillStyle=grad;g.fillRect(0,0,128,128);
 return new THREE.CanvasTexture(c);
}
function halo(parent,color,size,x,y,z,opacity=.62){
 const s=new THREE.Sprite(new THREE.SpriteMaterial({
  map:glowTexture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending
 }));
 s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s;
}
function labelSprite(text,color=0xa0ffff){
 const c=document.createElement('canvas');c.width=512;c.height=128;
 const g=c.getContext('2d');g.clearRect(0,0,512,128);
 g.fillStyle='rgba(8,31,47,0.70)';g.beginPath();g.roundRect(16,15,480,98,19);g.fill();
 g.strokeStyle='#5deade88';g.lineWidth=2;g.stroke();
 g.fillStyle='#a8bcd7';g.font='500 21px monospace';g.textAlign='center';
 g.fillText('MODULE / SYSTEM',256,49);
 g.fillStyle='#'+color.toString(16).padStart(6,'0');
 g.font='bold 35px Arial';g.fillText(text,256,93);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));
 sprite.scale.set(2.7,.68,1);return sprite;
}
function field(){
 const geometry=new THREE.BufferGeometry();
 const count=1450,pos=new Float32Array(count*3),col=new Float32Array(count*3);
 const palette=[new THREE.Color(0x5bcfe8),new THREE.Color(0x6679bc),new THREE.Color(0xb2fff5)];
 for(let i=0;i<count;i++){
  const radius=22+Math.random()*72,theta=Math.random()*Math.PI*2,v=Math.random()*1.45-.4;
  pos[3*i]=Math.cos(theta)*radius;pos[3*i+1]=v*radius*.43+8;
  pos[3*i+2]=Math.sin(theta)*radius;
  const c=palette[Math.floor(Math.random()*palette.length)];
  col[3*i]=c.r;col[3*i+1]=c.g;col[3*i+2]=c.b;
 }
 geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));
 geometry.setAttribute('color',new THREE.BufferAttribute(col,3));
 const m=new THREE.PointsMaterial({size:.15,sizeAttenuation:true,transparent:true,opacity:.8,vertexColors:true,depthWrite:false});
 stars=new THREE.Points(geometry,m);scene.add(stars);
 const grid=new THREE.GridHelper(90,54,0x26768e,0x133b52);
 grid.position.y=-3.5;grid.material.opacity=.19;grid.material.transparent=true;scene.add(grid);
 // Thin glowing circular grid markings that stay in world space.
 for(let i=0;i<4;i++)ring(scene,8.5+i*2.9,.006,
  new THREE.MeshBasicMaterial({color:i%2?0x5989cf:0x43b8bc,transparent:true,opacity:.2}),-3.47);
}
function makeCore(){
 const root=new THREE.Group();scene.add(root);
 const dark=material(0x183346,.75,.25),rimMat=material(0x2f8290,.82,.21),
 cyanBasic=new THREE.MeshBasicMaterial({color:0x5ceee3,transparent:true,opacity:.86}),
 violetBasic=new THREE.MeshBasicMaterial({color:0x9388ff,transparent:true,opacity:.7});
 // Physical suspended central octagonal platform with beveled levels.
 cylinder(root,5.55,5.7,.44,dark,0,-1.08,0,10);
 cylinder(root,5.25,5.4,.16,rimMat,0,-.76,0,10);
 cylinder(root,4.95,5.05,.14,material(0x071c2f,.65,.29),0,-.62,0,10);
 ring(root,5.18,.038,cyanBasic,-.65);
 ring(root,4.6,.018,new THREE.MeshBasicMaterial({color:0x5a9bd6,transparent:true,opacity:.67}),-.53);
 cylinder(root,2.4,2.55,.6,dark,0,-.15,0,10);
 cylinder(root,2.1,2.18,.16,material(0x284c59,.87,.19),0,.24,0,10);
 ring(root,2.05,.045,cyanBasic,.32);
 // Lit reactor sphere: genuine spherical polygons, inner core, animated orbit rings.
 const reactor=new THREE.Group();reactor.position.set(0,2.17,0);root.add(reactor);
 const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(1.48,2),
 new THREE.MeshPhysicalMaterial({color:0x176687,metalness:.48,roughness:.18,transmission:.25,thickness:.8,transparent:true,opacity:.7,side:THREE.DoubleSide,clearcoat:1}));
 reactor.add(shell);floating.push({o:shell,type:'spin',rate:.11});
 const geo=new THREE.IcosahedronGeometry(1.57,2);
 const wire=new THREE.LineSegments(new THREE.EdgesGeometry(geo),
 new THREE.LineBasicMaterial({color:0x8bfff1,transparent:true,opacity:.7}));
 reactor.add(wire);floating.push({o:wire,type:'spin',rate:-.2});
 orb(reactor,.68,new THREE.MeshBasicMaterial({color:0x98fff6}),0,0,0);
 halo(reactor,0x5dfff1,4.7,0,0,0,.9);
 const orbitMaterials=[cyanBasic,violetBasic,
 new THREE.MeshBasicMaterial({color:0x85beff,transparent:true,opacity:.75})];
 for(let i=0;i<3;i++){
  let r=mesh(reactor,new THREE.TorusGeometry(2.28+i*.36,.014+i*.008,8,100),orbitMaterials[i]);
  r.rotation.set(.3+i*.65,i*.47,.2+i*.4);
  rings.push({o:r,rate:(i%2?-.18:.16)*(1+i*.16)});
 }
 // Reactor levitation / energy columns.
 for(let i=0;i<12;i++){
  let a=i*Math.PI/6;
  cylinder(root,.07,.13,.56,new THREE.MeshBasicMaterial({color:i%3?0x2d7eab:0x72dccc}),Math.cos(a)*3.8,-.13,Math.sin(a)*3.8,8);
  const light=orb(root,.105,cyanBasic,Math.cos(a)*3.8,.2,Math.sin(a)*3.8);
  floating.push({o:light,type:'bob',y:.2,phase:i});
 }
 for(let i=0;i<3;i++){
  let r=ring(root,3.0+i*.47,.018,orbitMaterials[i],1.1+i*.32);
  rings.push({o:r,rate:((i%2)*2-1)*.08});
 }
 return root;
}
function makeVoice(root,color){
 const cyan=new THREE.MeshBasicMaterial({color}),chrome=material(0x9bb6cc,.77,.18);
 // Model microphone capsule with soundwave arcs in full 3D.
 cylinder(root,.22,.24,1.18,chrome,0,1.4,0,18);
 const mic=mesh(root,new THREE.SphereGeometry(.32,20,16),material(color,.48,.24),0,2.12,0);
 mic.scale.y=1.38;
 edgeBetween(root,[0,1.25,0],[0,.8,0],color,.045);
 cylinder(root,.51,.51,.055,chrome,0,.75,0,20);
 for(let i=0;i<4;i++){
  const t=mesh(root,new THREE.TorusGeometry(.63+i*.31,.026,8,64,Math.PI),cyan,0,1.65,0);
  t.rotation.z=Math.PI*.5; t.rotation.x=Math.PI*.5;
  floating.push({o:t,type:'wave',phase:i});
 }
}
function makeRag(root,color){
 const tile=material(0x183d63,.78,.27),edge=new THREE.MeshBasicMaterial({color});
 for(let i=0;i<5;i++){
  const slab=mesh(root,new THREE.BoxGeometry(1.55,.13,1.05),tile,(i-2)*.07,1.12+i*.23,(i-2)*-.08);
  slab.rotation.y=.1*i;slab.rotation.z=.055*i;
  const line=mesh(slab,new THREE.BoxGeometry(1.58,.018,1.08),edge,0,.065,0);
  line.material.transparent=true;line.material.opacity=.58;
  floating.push({o:slab,type:'bob',y:slab.position.y,phase:i*.75});
 }
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;orb(root,.1,new THREE.MeshBasicMaterial({color}),Math.cos(a)*1.25,2.65+Math.sin(i*1.1)*.3,Math.sin(a)*1.25,12);
 }
}
function makeAgent(root,color){
 const coords=[[0,2.7,0],[-.88,1.85,0],[.86,1.9,.43],[.1,1.18,-.95],[1.14,2.7,-.5],[-1.2,2.8,.32]];
 const links=[[0,1],[0,2],[0,4],[0,5],[1,3],[2,3],[4,2],[5,1]];
 for(let i=0;i<links.length;i++){const [a,b]=links[i];edgeBetween(root,coords[a],coords[b],color,.024,.7)}
 coords.forEach((p,i)=>{
  const m=orb(root,i===0?.27:.18,new THREE.MeshPhysicalMaterial({color,metalness:.28,roughness:.15,emissive:color,emissiveIntensity:i===0?.5:.28}),...p);
  floating.push({o:m,type:'bob',y:p[1],phase:i*1.1,amp:.07});
  halo(root,color,i===0?.68:.46,...p,.5);
 });
}
function makeResearch(root,color){
 const earth=orb(root,1.04,material(0x39426a,.56,.2),0,1.93,0);
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.07,2)),
 new THREE.LineBasicMaterial({color,transparent:true,opacity:.8}));
 outline.position.y=1.93;root.add(outline);
 floating.push({o:earth,type:'spin',rate:.18});
 floating.push({o:outline,type:'spin',rate:-.14});
 for(let i=0;i<3;i++){
  const loop=mesh(root,new THREE.TorusGeometry(1.36+i*.22,.023,8,60),
  new THREE.MeshBasicMaterial({color,transparent:true,opacity:.45}));
  loop.position.y=1.93;loop.rotation.set(.3+i*.7,.12+i*.5,.2+i*.3);
  rings.push({o:loop,rate:.11*(i%2?-1:1)});
 }
}
function makeStation(data,index){
 const root=new THREE.Group(),radius=9.2;
 root.position.set(Math.cos(data.angle)*radius,-1.02,Math.sin(data.angle)*radius);
 scene.add(root);stations.push(root);
 let base=material(0x132b42,.66,.32),cap=material(0x1b4758,.77,.22),
 light=new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:.88});
 const platform=cylinder(root,2.13,2.22,.36,base,0,0,0,8);
 cylinder(root,1.98,2.06,.11,cap,0,.24,0,8);
 ring(root,1.91,.027,light,.31);
 ring(root,1.67,.012,new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:.47}),.33);
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4;
  const x=Math.cos(angle)*1.83,z=Math.sin(angle)*1.83;
  cylinder(root,.052,.065,.25,new THREE.MeshBasicMaterial({color:data.color}),x,.44,z,7);
 }
 const actors=new THREE.Group();root.add(actors);
 if(index===0)makeVoice(actors,data.color);
 else if(index===1)makeRag(actors,data.color);
 else if(index===2)makeAgent(actors,data.color);
 else makeResearch(actors,data.color);
 halo(root,data.color,3.4,0,1.4,0,.26);
 const label=labelSprite(data.name,data.color);label.position.set(0,3.8,0);root.add(label);
 const hit=new THREE.Mesh(new THREE.CylinderGeometry(2.23,2.23,5,8),
 new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
 hit.position.y=1.75;root.add(hit);hit.userData.index=index;hotspots.push(hit);
 const origin=new THREE.Vector3(0,.65,0),end=root.position.clone().add(new THREE.Vector3(0,.6,0));
 const mid=origin.clone().lerp(end,.5);mid.y=1.8;
 const path=new THREE.QuadraticBezierCurve3(origin,mid,end);
 const conduit=mesh(scene,new THREE.TubeGeometry(path,35,.035,8,false),
 new THREE.MeshBasicMaterial({color:data.color,transparent:true,opacity:.36}));
 conduit.userData.index=index;
 const dot=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),new THREE.MeshBasicMaterial({color:data.color}));
 scene.add(dot);movingDots.push({o:dot,path,offset:index*.25});
 return root;
}
function init(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:!small,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,small?1.15:1.55));
  renderer.setSize(innerWidth,innerHeight,false);
  scene=new THREE.Scene();scene.background=new THREE.Color(0x040d18);
  scene.fog=new THREE.FogExp2(0x071523,.015);
  clock=new THREE.Clock();glowTexture=textureGlow();
  camera=new THREE.PerspectiveCamera(small?49:43,innerWidth/innerHeight,.1,160);
  camera.position.set(small?23:18,12,small?26:20);
  controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.055;controls.enablePan=false;
  controls.enableZoom=true;controls.minDistance=12;controls.maxDistance=44;
  controls.minPolarAngle=.22;controls.maxPolarAngle=1.49;
  controls.target.copy(center);
  controls.autoRotate=!prefersReduced;controls.autoRotateSpeed=.22;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xb7e7ff,0x10213b,2.05));
  let key=new THREE.DirectionalLight(0xa1ffff,3.7);key.position.set(8,19,8);scene.add(key);
  let rim=new THREE.DirectionalLight(0x8889ff,2.4);rim.position.set(-9,7,-9);scene.add(rim);
  let accent=new THREE.PointLight(0x4ef0df,75,22);accent.position.set(0,4,0);scene.add(accent);
  field();makeCore();modules.forEach(makeStation);
  ready=true;status.textContent='WEBGL ONLINE  /  REAL-TIME 3D';document.body.classList.remove('no-webgl');
  window.addEventListener('resize',resize,{passive:true});
  canvas.addEventListener('pointerdown',onDown,{passive:true});
  canvas.addEventListener('pointerup',onUp,{passive:true});
  canvas.addEventListener('pointermove',onMove,{passive:true});
  canvas.addEventListener('pointerleave',()=>{hover=null;canvas.style.cursor='grab'});
  canvas.addEventListener('wheel',interaction,{passive:true});
  controls.addEventListener('start',interaction);
  document.addEventListener('visibilitychange',()=>{renderPaused=document.hidden});
  window.addEventListener('keydown',onKey);
  document.getElementById('reset-camera').addEventListener('click',()=>resetCamera());
  document.getElementById('explore-button').addEventListener('click',()=>focusStation(selected));
  pickerButtons.forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.module),true)));
  select(0,false);
  animate();
 }catch(error){
  console.error('3D initialization failed',error);
  document.body.classList.add('no-webgl');
  status.textContent='3D UNAVAILABLE  /  PROJECT LINKS WORK';
 }
}
function select(index,focus){
 selected=index;const m=modules[index];
 moduleTitle.textContent=m.title;moduleDesc.textContent=m.desc;moduleStack.textContent=m.stack;
 moduleLabel.textContent=m.name;moduleIndex.textContent='0'+(index+1)+' / 04';
 moduleLink.href=m.href;moduleLink.textContent=index===3?'Read IEEE research ↗':'Explore repository ↗';
 pickerButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 if(focus&&ready)focusStation(index);
}
function interaction(){lastUserAction=performance.now();if(controls)controls.autoRotate=false}
function focusStation(index){
 interaction();
 // Smoothly target the genuine 3D station, while keeping the camera outside it.
 const station=stations[index];
 if(!station)return;
 const target=station.position.clone().add(new THREE.Vector3(0,1.75,0));
 const direction=camera.position.clone().sub(controls.target).normalize();
 let pos=target.clone().add(direction.multiplyScalar(small?16:12.7));
 pos.y=Math.max(pos.y,6.2);
 cameraRequest={target,pos};
 ping('3D FOCUS  /  '+modules[index].name);
}
function resetCamera(){
 interaction();cameraRequest={
  target:center.clone(),pos:new THREE.Vector3(small?23:18,12,small?26:20)
 };
 ping('CAMERA RESET  /  COMMAND CENTER');
}
function onKey(event){
 if(event.key==='r'||event.key==='R')resetCamera();
 const num=Number(event.key);
 if(num>=1&&num<=4)select(num-1,true);
}
function onDown(e){pointerDown={x:e.clientX,y:e.clientY}}
function onUp(e){
 if(!pointerDown)return;
 const dist=Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y);
 pointerDown=null;if(dist>7)return;
 const hit=cast(e);if(hit){select(hit.userData.index,true)}
}
function onMove(e){
 if(!ready||pointerDown)return;
 const hit=cast(e);hover=hit;canvas.style.cursor=hit?'pointer':'grab';
}
function cast(event){
 const rect=canvas.getBoundingClientRect();
 pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
 pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(hotspots,false);
 return hits.length?hits[0].object:null;
}
function resize(){
 if(!renderer)return;
 const w=innerWidth,h=innerHeight;camera.aspect=w/h;
 camera.fov=window.matchMedia('(max-width:790px)').matches?49:43;
 camera.updateProjectionMatrix();renderer.setSize(w,h,false);
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<790?1.15:1.55));
}
function animate(){
 requestAnimationFrame(animate);if(!ready||renderPaused)return;
 const dt=Math.min(clock.getDelta(),.06),t=clock.elapsedTime;
 if(!prefersReduced){
  rings.forEach((r,i)=>{r.o.rotation.y+=dt*r.rate;r.o.rotation.z+=dt*r.rate*.28});
  floating.forEach((f,i)=>{
   if(f.type==='spin'){f.o.rotation.y+=dt*f.rate;f.o.rotation.x+=dt*f.rate*.26}
   else if(f.type==='bob')f.o.position.y=f.y+Math.sin(t*1.5+f.phase)*(.07+(f.amp||.015));
   else if(f.type==='wave'){const s=1+Math.sin(t*2.1+f.phase)*.095;f.o.scale.set(s,s,s)}
  });
  movingDots.forEach(m=>{m.o.position.copy(m.path.getPoint((t*.075+m.offset)%1))});
  if(stars)stars.rotation.y=starRotation+=(dt*.0025);
 }
 if(cameraRequest){
  controls.target.lerp(cameraRequest.target,.042);
  camera.position.lerp(cameraRequest.pos,.042);
  if(camera.position.distanceTo(cameraRequest.pos)<.04&&controls.target.distanceTo(cameraRequest.target)<.04)
   cameraRequest=null;
 }
 if(performance.now()-lastUserAction>30000&&!prefersReduced&&!cameraRequest)controls.autoRotate=true;
 controls.update();renderer.render(scene,camera);
}
if(canvas)init();
