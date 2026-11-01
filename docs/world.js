import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createGrandLineShip,createAnimeCrew} from './grandline-3d-kit.js';

const canvas=document.querySelector('#world');
const stage=document.querySelector('#stage');
const spinner=document.querySelector('#loading');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=matchMedia('(max-width: 700px)').matches;
const toast=document.querySelector('#toast');
function say(s){toast.textContent=s;toast.hidden=false;clearTimeout(say.timer);say.timer=setTimeout(()=>toast.hidden=true,3600)}
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0c263b);scene.fog=new THREE.FogExp2(0x0a2b3d,.012);
const renderer=new THREE.WebGLRenderer({canvas,antialias:!mobile,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.25:1.65));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
renderer.shadowMap.enabled=!mobile;
const camera=new THREE.PerspectiveCamera(45,1,.1,150);
const hemi=new THREE.HemisphereLight(0xa8d9fa,0x234052,2.5);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffd9a7,3.7);key.position.set(-12,20,-15);key.castShadow=!mobile;key.shadow.mapSize.set(1024,1024);scene.add(key);
const sky=new THREE.Mesh(new THREE.SphereGeometry(100,32,18),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){float h=normalize(p).y;vec3 a=vec3(.35,.43,.43),b=vec3(.12,.29,.44),c=vec3(.015,.05,.12);vec3 col=mix(a,b,smoothstep(-.2,.3,h));col=mix(col,c,smoothstep(.3,1.,h));gl_FragColor=vec4(col,1.);}' }));scene.add(sky);
const sun=new THREE.Mesh(new THREE.SphereGeometry(4,24,16),new THREE.MeshBasicMaterial({color:0xffdba8,fog:false}));sun.position.set(-35,25,-46);scene.add(sun);
const waterTime={value:0};
const sea=new THREE.Mesh(new THREE.PlaneGeometry(180,180,88,88),new THREE.ShaderMaterial({
side:THREE.DoubleSide,uniforms:{time:waterTime},
vertexShader:['uniform float time;varying vec3 vPos;varying float vW;',
'void main(){vec3 p=position;float w=sin(p.x*.6+time*.9)*.22+cos(p.y*.78-time*.7)*.19+sin((p.x+p.y)*.33+time*.43)*.13;',
'p.z+=w;vW=w;vec4 a=modelMatrix*vec4(p,1.);vPos=a.xyz;gl_Position=projectionMatrix*viewMatrix*a;}'].join('\n'),
fragmentShader:['uniform float time;varying vec3 vPos;varying float vW;',
'void main(){float fres=pow(1.-abs(normalize(cameraPosition-vPos).y),3.);float sp=pow(max(0.,sin(vPos.x*3.2+time)*cos(vPos.z*2.8-time*1.2)),16.);',
'vec3 c=mix(vec3(.018,.12,.20),vec3(.045,.31,.36),.5+.5*sin(vPos.z*.08));c+=vec3(.12,.23,.24)*fres+vec3(.09,.18,.16)*smoothstep(.1,.5,vW)+vec3(.28,.29,.22)*sp*.26;',
'gl_FragColor=vec4(c,1.);}'].join('\n')
}));sea.rotation.x=-Math.PI/2;sea.position.y=-.35;scene.add(sea);
function M(c,rough=.75,metal=0){return new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal})}
const teak=M(0x70402d),dark=M(0x34262c),deck=M(0x9b643d),gold=M(0xe2b46a,.4,.42),canvasMat=new THREE.MeshStandardMaterial({color:0xf8e3b8,roughness:.82,side:THREE.DoubleSide}),rope=M(0xae9067);
function add(parent,g,m,x=0,y=0,z=0){let o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!mobile;o.receiveShadow=!mobile;parent.add(o);return o}
function box(p,w,h,d,m,x=0,y=0,z=0){return add(p,new THREE.BoxGeometry(w,h,d),m,x,y,z)}
function cy(p,a,b,h,m,x=0,y=0,z=0){return add(p,new THREE.CylinderGeometry(a,b,h,12),m,x,y,z)}
function sph(p,r,m,x=0,y=0,z=0){return add(p,new THREE.SphereGeometry(r,14,10),m,x,y,z)}
function line(p,a,b,rad,m){let aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b);let o=add(p,new THREE.CylinderGeometry(rad,rad,aa.distanceTo(bb),8),m);o.position.copy(aa).add(bb).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bb.sub(aa).normalize());return o}
/* Grand Line V3: original detailed modeled galleon and full spatial articulated 3D crew */
const ship=createGrandLineShip(THREE,{mobile});
const boat=ship.group;
scene.add(boat);
const actors=[
 {kind:'captain',name:'Straw-hat Captain',x:0,z:-1.05,scale:.69},
 {kind:'swordsman',name:'Triple-blade Swordsman',x:-1.04,z:.8,scale:.62},
 {kind:'navigator',name:'Navigator',x:1.02,z:1.12,scale:.62}
].map(cfg=>{
 const rig=createAnimeCrew(THREE,cfg.kind,{mobile});
 rig.group.position.set(cfg.x,.48,cfg.z);rig.group.scale.setScalar(cfg.scale);
 boat.add(rig.group);
 return {...cfg,rig};
});
let selectedActor='captain';
function pickActor(kind){
 const actor=actors.find(a=>a.kind===kind);
 if(!actor)return;
 selectedActor=kind;
 document.querySelector('#character').value=kind;
 for(const a of actors){
   a.rig.group.scale.setScalar(a.scale*(a.kind===kind?1.14:1));
   a.rig.group.rotation.y=a.kind===kind?-.15:.06;
 }
 target={x:0,y:2.1,z:0,d:kind==='captain'?10.7:10.6,a:kind==='swordsman'?-0.42:.47,p:.33};
 actor.rig.setAction(kind==='swordsman'?'slash':kind==='navigator'?'point':'wave');
 say(actor.name+' selected — native 3D rig with animated joints');
}
document.querySelector('#character').addEventListener('change',e=>pickActor(e.target.value));
document.querySelector('#crew-action').addEventListener('click',()=>{
 const a=actors.find(a=>a.kind===selectedActor);
 if(a){a.rig.setAction(a.kind==='swordsman'?'slash':a.kind==='navigator'?'point':'wave');say(a.name+' performs a 3D animated action')}
});
document.querySelector('#ship-tour').addEventListener('click',()=>{
 document.querySelectorAll('[data-island]').forEach(b=>b.setAttribute('aria-pressed','false'));
 target={x:0,y:2.3,z:0,d:15.5,a:Math.PI*.67,p:.46};
 for(const actor of actors)actor.rig.setAction('wave');
 say('Galleon tour — full 3D hull, rigging, cannons, deck and ocean wake');
});
const upload=document.querySelector('#model');
document.querySelector('#upload-button').addEventListener('click',()=>upload.click());
upload.addEventListener('change',e=>{
 const file=e.target.files?.[0];
 if(!file)return;
 if(!file.name.toLowerCase().endsWith('.glb'))return say('Choose a .glb 3D character file.');
 if(file.size>20*1024*1024)return say('Maximum GLB size is 20 MB.');
 const url=URL.createObjectURL(file);
 new GLTFLoader().load(url,gltf=>{
   try{
     const model=gltf.scene;
     const bounds=new THREE.Box3().setFromObject(model);
     const dims=bounds.getSize(new THREE.Vector3());
     if(!(Number.isFinite(dims.y)&&dims.y>.001))throw Error('Invalid 3D model bounds');
     const k=2.25/Math.max(dims.y,dims.x*.8,dims.z*.8);
     model.scale.setScalar(k);
     const center=bounds.getCenter(new THREE.Vector3());
     model.position.set(-center.x*k,-bounds.min.y*k+.50,-center.z*k-1.08);
     model.traverse(o=>{if(o.isMesh){o.castShadow=!mobile;o.receiveShadow=!mobile;}});
     if(upload.custom)boat.remove(upload.custom);
     upload.custom=model;boat.add(model);
     say('Custom GLB model loaded — original ship and crew stay in the scene.');
   }catch(err){say('Unable to prepare this GLB file.');}
   URL.revokeObjectURL(url);
 },undefined,()=>{
   URL.revokeObjectURL(url);say('GLB could not load. Try a self-contained GLB.');
 });
});
const islands=[];
function island(id,x,z,tint,gem,kind){const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);let sand=M(0xe1b879),grass=M(tint),stone=M(0x546675),accent=M(gem,.4,.18);
add(root,new THREE.CylinderGeometry(3.4,4.15,1.32,11),sand,0,.55,0);
add(root,new THREE.CylinderGeometry(3.22,3.48,.36,11),grass,0,1.38,0);
for(let i=0;i<9;i++){let a=i*Math.PI*2/9,r=2.9+(i%3)*.16;let rock=add(root,new THREE.DodecahedronGeometry(.48+(i%3)*.07,0),stone,Math.cos(a)*r,.9,Math.sin(a)*r);rock.rotation.y=i}
if(kind==='voice'){cy(root,.72,.86,3.2,M(0xe8e5d7),0,3.15,0);cy(root,1.1,.93,.38,accent,0,4.96,0);sph(root,.65,M(0x84e7ef,.2,.23),0,5.55,0);}
if(kind==='rag'){box(root,2.5,2.7,2,M(0xe7dcc8),0,2.8,0);for(let s of [-1,1])for(let i=0;i<2;i++)box(root,.38,.82,.25,accent,s*.73,2.5+i*.95,1.12);add(root,new THREE.ConeGeometry(1.9,1.3,4),M(0x7b594a),0,4.9,0).rotation.y=Math.PI/4;}
if(kind==='agents'){for(let i=0;i<3;i++){let a=i*Math.PI*2/3;cy(root,.22,.26,2.2,M(0x809ca5),Math.sin(a)*1.25,2.8,Math.cos(a)*1.25);sph(root,.51,accent,Math.sin(a)*1.25,4.06,Math.cos(a)*1.25);}sph(root,.55,accent,0,4.65,0)}
if(kind==='green'){for(let i=0;i<5;i++){let a=i*Math.PI*2/5,x=Math.sin(a)*1.2,z=Math.cos(a)*1.2;cy(root,.16,.22,1.7,M(0x70472d),x,2.6,z);add(root,new THREE.ConeGeometry(.8,1.65,7),M(0x73c883),x,4,z)}sph(root,.55,accent,0,5.1,0)}
sph(root,.17,accent,0,6.3,0);
root.traverse(o=>{if(o.isMesh)o.userData.island=id});islands.push({id,root,x,z});
}
island('voice',-15,-13,0x6d9e84,0x61d7ea,'voice');
island('rag',15,-16,0x779b78,0xe8ba66,'rag');
island('agents',-16,15,0x67988e,0x7de5e3,'agents');
island('green',16,13,0x81ac74,0x98dd87,'green');
const data={
voice:{title:'Voice AI Port',copy:'Voice agents, real-time speech interactions, transcription and production conversational AI.',query:'voice',x:-15,z:-13},
rag:{title:'RAG Island',copy:'Retrieval-augmented generation, document reasoning, vector search and knowledge pipelines.',query:'rag',x:15,z:-16},
agents:{title:'Agent Fleet',copy:'Multi-agent tools, coordinated workflows, durable automation and intelligent systems.',query:'agent',x:-16,z:15},
green:{title:'Green AI Atoll',copy:'Eco-Transformers research on energy-efficient LLM inference with self-pruning and activation freezing.',query:'transformer',x:16,z:13}};
let look={x:0,y:1.8,z:0,d:23,a:.43,p:.48},target={...look};
function selectIsland(id){let d=data[id];if(!d)return;target={x:d.x,y:2,z:d.z,d:13,a:.53,p:.56};document.querySelectorAll('[data-island]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.island===id)));document.querySelector('#chapter').textContent='CAPTAIN’S LOG / '+id.toUpperCase();document.querySelector('#title').textContent=d.title;document.querySelector('#summary').textContent=d.copy;let a=document.querySelector('#repo-link');a.href='https://github.com/Sivanesanbalu?tab=repositories&q='+encodeURIComponent(d.query);a.textContent='Explore related projects ↗';say('Sailing to '+d.title)}
document.querySelectorAll('[data-island]').forEach(b=>b.addEventListener('click',()=>selectIsland(b.dataset.island)));
document.querySelector('#set-sail').addEventListener('click',()=>{selectIsland('voice');document.querySelector('#island-controls').scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'})});
let ray=new THREE.Raycaster(),drag=false,move=false,lastX=0,lastY=0,startX=0,startY=0;
canvas.addEventListener('pointerdown',e=>{drag=true;move=false;lastX=startX=e.clientX;lastY=startY=e.clientY;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag)return;let dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(e.clientX-startX)+Math.abs(e.clientY-startY)>10)move=true;target.a-=dx*.0045;target.p=THREE.MathUtils.clamp(target.p+dy*.004,.15,1.12);lastX=e.clientX;lastY=e.clientY});
canvas.addEventListener('pointerup',e=>{drag=false;if(move)return;let rect=canvas.getBoundingClientRect();let p=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height*2-1));ray.setFromCamera(p,camera);let hits=ray.intersectObjects(islands.map(i=>i.root),true);for(let h of hits){if(h.object.userData.island){selectIsland(h.object.userData.island);break}}});
canvas.addEventListener('wheel',e=>{target.d=THREE.MathUtils.clamp(target.d+e.deltaY*.015,8,34)},{passive:true});
function resize(){const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}window.addEventListener('resize',resize);resize();
const clock=new THREE.Clock();let elapsed=0;
function frame(){let delta=Math.min(clock.getDelta(),.04);elapsed+=reduced?0:delta;let t=elapsed;waterTime.value=t;
ship.update(t);
if(!reduced)for(const actor of actors)actor.rig.update(t);
let alpha=reduced?1:1-Math.exp(-delta*2.4);for(let k of ['x','y','z','d','a','p'])look[k]+=(target[k]-look[k])*alpha;
let a=look.a,p=look.p,d=look.d;camera.position.lerp(new THREE.Vector3(look.x+Math.sin(a)*d,look.y+Math.sin(p)*d*.9,look.z+Math.cos(a)*d),reduced?1:Math.min(1,delta*4));
camera.lookAt(look.x,look.y,look.z);renderer.render(scene,camera);requestAnimationFrame(frame)}
document.documentElement.dataset.engine='ready';frame();spinner.classList.add('loaded');
