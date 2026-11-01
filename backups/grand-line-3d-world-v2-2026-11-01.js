import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

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
const boat=new THREE.Group();scene.add(boat);boat.position.y=.7;
let rings=[[-4,.1],[-3.5,.88],[-2.5,1.5],[0,1.83],[2.4,1.55],[3.3,1],[3.6,.18]];
let pos=[],idx=[];for(let [z,w] of rings)for(let [x,y] of [[-w,.2],[w,.2],[w*.7,-1],[-w*.7,-1]])pos.push(x,y,z);
for(let k=0;k<rings.length-1;k++)for(let j=0;j<4;j++){let a=k*4+j,b=k*4+(j+1)%4,c=(k+1)*4+(j+1)%4,d=(k+1)*4+j;idx.push(a,b,d,b,c,d)}
idx.push(0,1,2,0,2,3);let last=(rings.length-1)*4;idx.push(last,last+2,last+1,last,last+3,last+2);
const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));hg.setIndex(idx);hg.computeVertexNormals();add(boat,hg,teak);
box(boat,2.85,.2,5.8,deck,0,.35,.2);
for(let z=-2.4;z<3;z+=.4)box(boat,2.8,.015,.035,dark,0,.46,z);
for(let s of [-1,1]){for(let z=-2.4;z<2.9;z+=1)cy(boat,.07,.08,.62,rope,s*1.45,.76,z);line(boat,[s*1.45,1.05,-2.6],[s*1.45,1.05,2.9],.07,gold)}
const cloth=[];
for(let [z,top,bottom,width] of [[-1.2,5.8,3.05,3.8],[1.5,4.9,3.65,2.9]]){
cy(boat,.13,.14,6.4,dark,0,3.55,z);line(boat,[-width/2,top,z],[width/2,top,z],.1,rope);
let g=new THREE.PlaneGeometry(width,top-bottom,14,10),o=add(boat,g,canvasMat,0,(top+bottom)/2,z-.1);o.userData.base=new Float32Array(g.attributes.position.array);cloth.push(o);
for(let s of [-1,1])line(boat,[s*width/2,top,z],[s*1.5,.55,z+1.5],.025,rope);
}
line(boat,[0,5.8,-1.2],[0,6.8,-1.2],.07,gold);
let flag=add(boat,new THREE.PlaneGeometry(1.2,.53,6,3),M(0xbb554b),.65,6.33,-1.2);flag.userData.base=new Float32Array(flag.geometry.attributes.position.array);cloth.push(flag);
let deckLight=sph(boat,.25,M(0xffd17c,.2),1.3,1.22,2.7);deckLight.material.emissive=new THREE.Color(0xb97132);deckLight.material.emissiveIntensity=.5;
const captainHolder=new THREE.Group();captainHolder.position.set(0,.47,.75);boat.add(captainHolder);let captain=null;
function makeCaptain(theme){
const g=new THREE.Group();
const c=theme==='storm'?{coat:0x214968,pants:0x29344c,hat:0x17374c,band:0xf1b967,skin:0xe4aa81}:theme==='shadow'?{coat:0x583b6a,pants:0x29283d,hat:0x312741,band:0xc7a1dd,skin:0xc99172}:{coat:0xb34b42,pants:0x2d5d75,hat:0xe1b875,band:0xb5473d,skin:0xe4ad84};
let co=M(c.coat),pa=M(c.pants),ha=M(c.hat),ba=M(c.band),sk=M(c.skin),shoe=M(0x29242a),hair=M(0x2c2426);
for(let s of [-1,1]){cy(g,.2,.23,.78,pa,s*.23,.59,0);cy(g,.24,.2,.37,shoe,s*.23,.19,.1)}
cy(g,.34,.47,1.03,co,0,1.48,0);box(g,.32,.8,.25,M(0xf2e3c9),0,1.53,.31);cy(g,.12,.15,.2,sk,0,2.12,0);
sph(g,.38,sk,0,2.49,0);for(let s of [-1,1]){sph(g,.055,hair,s*.14,2.54,.36);let arm=cy(g,.15,.15,.84,co,s*.51,1.58,0);arm.rotation.z=s*.31;sph(g,.15,sk,s*.63,1.11,0)}
for(let i=0;i<7;i++){let a=i*Math.PI*2/7;sph(g,.12,hair,Math.cos(a)*.3,2.8,Math.sin(a)*.3)}
cy(g,.62,.62,.075,ha,0,2.95,0);cy(g,.37,.41,.44,ha,0,3.18,0);cy(g,.41,.41,.1,ba,0,3.03,0);
if(theme==='storm'){let plume=add(g,new THREE.ConeGeometry(.14,.8,8),M(0xffefc4),.4,3.58,0);plume.rotation.z=-.35}
if(theme==='shadow'){let cape=add(g,new THREE.ConeGeometry(.72,1.24,12,1,true),M(0x362a4d),0,1.39,-.16);cape.rotation.x=.14}
return g;
}
function replaceCaptain(theme){if(captain)captainHolder.remove(captain);captain=makeCaptain(theme);captainHolder.add(captain);say((theme==='straw'?'Straw Hat Explorer':theme==='storm'?'Storm Captain':'Shadow Navigator')+' aboard!')}
replaceCaptain('straw');
document.querySelector('#character').addEventListener('change',e=>replaceCaptain(e.target.value));
const upload=document.querySelector('#model');
document.querySelector('#upload-button').addEventListener('click',()=>upload.click());
upload.addEventListener('change',e=>{let f=e.target.files?.[0];if(!f)return;if(!f.name.toLowerCase().endsWith('.glb'))return say('Choose a .glb file');if(f.size>20e6)return say('Please choose a model under 20 MB');let u=URL.createObjectURL(f);new GLTFLoader().load(u,gltf=>{try{let model=gltf.scene;let bounds=new THREE.Box3().setFromObject(model);let size=bounds.getSize(new THREE.Vector3());if(size.y<=.001)throw Error('Invalid 3D model');let scale=3.1/Math.max(size.y,size.x*.8,size.z*.8);model.scale.setScalar(scale);let center=bounds.getCenter(new THREE.Vector3());model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);if(captain)captainHolder.remove(captain);captain=model;captainHolder.add(captain);say('Custom 3D captain loaded!')}catch(err){say('Could not read 3D model')}URL.revokeObjectURL(u)},undefined,()=>{URL.revokeObjectURL(u);say('Model failed to load')})});
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
boat.position.y=.72+(reduced?0:Math.sin(t*1.3)*.14);boat.rotation.z=reduced?0:Math.sin(t*.9)*.025;boat.rotation.x=reduced?0:Math.sin(t*.67)*.022;
if(!reduced)for(let o of cloth){let a=o.geometry.attributes.position,b=o.userData.base;for(let i=0;i<a.count;i++){let k=i*3;a.array[k+2]=b[k+2]+Math.sin(t*1.25+b[k]*1.6+b[k+1]*.6)*.14;}a.needsUpdate=true;o.geometry.computeVertexNormals()}
let alpha=reduced?1:1-Math.exp(-delta*2.4);for(let k of ['x','y','z','d','a','p'])look[k]+=(target[k]-look[k])*alpha;
let a=look.a,p=look.p,d=look.d;camera.position.lerp(new THREE.Vector3(look.x+Math.sin(a)*d,look.y+Math.sin(p)*d*.9,look.z+Math.cos(a)*d),reduced?1:Math.min(1,delta*4));
camera.lookAt(look.x,look.y,look.z);renderer.render(scene,camera);requestAnimationFrame(frame)}
document.documentElement.dataset.engine='ready';frame();spinner.classList.add('loaded');
