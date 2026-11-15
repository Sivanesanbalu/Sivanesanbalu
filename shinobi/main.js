// Shinobi Engineer — scroll-driven 3D profile for Sivanesan B.
// Original artwork: hand-seal sequence, spiral chakra core, flash-step kunai, lightning.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const USER = 'Sivanesanbalu';
const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture');

// ───────────────────────────── profile data ──
const PROJECTS = [
  { name: 'VoiceForge AI', tag: 'ACTIVE BUILD', repo: 'VoiceForge-AI', stack: 'Next.js · Vapi · PostgreSQL',
    desc: 'Multilingual voice-agent control plane: saved agents, incoming-call routing, call recording and provider usage tracking.' },
  { name: 'Offline Voice RAG', tag: '100% OFFLINE', repo: 'RAG-Offline-Inventory-Management-System', stack: 'Whisper · Qwen · FAISS',
    desc: 'Warehouse inventory voice assistant running fully on-device with Whisper STT, a quantized Qwen LLM and FAISS search.' },
  { name: 'AI Job Agent v2', tag: 'MULTI-AGENT', repo: 'ai-job-agent-v2', stack: 'Agents · LLM · Automation',
    desc: 'Autonomous multi-agent pipeline for job discovery, resume-intelligence matching and application tracking.' },
  { name: 'Book AI Vision', tag: '92% ACCURACY', repo: 'Book_AI_Backend', stack: 'ConvNeXt · FAISS · CV',
    desc: 'Visual book recognition service using a fine-tuned ConvNeXt model with FAISS semantic similarity search.' },
  { name: 'LinguaBridge AI', tag: 'PROTOTYPE', repo: 'linguabridge-ai', stack: 'Speech · Translation · Telephony',
    desc: 'Tamil / Hindi live phone-call translation architecture with provider adapters and deterministic simulations.' },
  { name: 'AI Recruiter + Vision', tag: 'PROCTORED', repo: 'AI_Recruiter_with_computer-vision', stack: 'LLM · BlazeFace · Voice',
    desc: 'Conversational LLM interviews combined with real-time BlazeFace anti-cheating proctoring.' },
];
const TIMELINE = [
  ['FOUNDATION', 'B.Tech · AI & Data Science', 'Kumaraguru College of Technology'],
  ['JAN – JUL 2025', 'Innovation Engineer Trainee', 'Forge Innovation & Ventures'],
  ['2025', 'Eco-Transformers · IEEE ICNGCS', 'Carbon-efficient LLM inference'],
  ['AUG 2026 → NOW', 'GenAI Executive & Forward Deployed Engineer', 'Nunes Instruments'],
];
const SKILLS = ['Python', 'PyTorch', 'LangGraph', 'RAG', 'FAISS', 'Whisper', 'Vapi', 'FastAPI', 'TypeScript', 'Next.js', 'PostgreSQL', 'Docker'];
const SEALS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const LANG_COLORS = { Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a', HTML: '#e34c26', 'Jupyter Notebook': '#DA5B0B', 'C++': '#f34b7d', R: '#198CE7' };

// ───────────────────────────── renderer ──
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: CAPTURE });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#04050d');
scene.fog = new THREE.FogExp2('#04050d', 0.035);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 0.3, 7);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.75, 0.45, 0.32);
composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.AmbientLight('#4a5cff', 0.35));
const keyLight = new THREE.PointLight('#8fe3ff', 30, 30, 1.6);
scene.add(keyLight);
const goldLight = new THREE.DirectionalLight('#ffd84a', 1.2);
goldLight.position.set(4, 6, 3);
scene.add(goldLight);

// ───────────────────────────── helpers ──
function glyphTexture(ch, { size = 256, color = '#ffd84a', bg = null, font = '900 170px "Noto Serif JP", serif', glow = true } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, size, size); }
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (glow) { g.shadowColor = color; g.shadowBlur = 28; }
  g.fillStyle = color; g.fillText(ch, size / 2, size / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function sealCircleTexture() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2);
  g.strokeStyle = '#ffd84a'; g.fillStyle = '#ffd84a'; g.shadowColor = '#ffb800'; g.shadowBlur = 16;
  for (const [r, w] of [[490, 6], [450, 2], [330, 4], [300, 1.5], [150, 3]]) { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
  g.font = '900 54px "Noto Serif JP", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  SEALS.forEach((s, i) => { g.save(); g.rotate(i / 12 * Math.PI * 2); g.fillText(s, 0, -392); g.restore(); });
  g.font = '600 22px "JetBrains Mono", monospace';
  const ring = 'SIVANESAN · AI ENGINEER · RAG · AGENTS · VOICE AI · ECO-TRANSFORMERS · ';
  [...ring].forEach((ch, i, a) => { g.save(); g.rotate(i / a.length * Math.PI * 2); g.fillText(ch, 0, -314); g.restore(); });
  for (let i = 0; i < 8; i++) { g.save(); g.rotate(i / 8 * Math.PI * 2); g.lineWidth = 2; g.beginPath(); g.moveTo(0, -150); g.lineTo(0, -300); g.stroke(); g.restore(); }
  g.font = '900 150px "Noto Serif JP", serif'; g.fillText('閃', 0, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const DOT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
// ───────────────────────────── sky: stars + embers + moon ──
function makePoints(n, spread, color, size, opacity) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * spread; pos[i * 3 + 1] = (Math.random() - .3) * spread * .6; pos[i * 3 + 2] = -Math.random() * spread * .8 - 5; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ map: DOT, color, size, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
}
scene.add(makePoints(2500, 160, '#cfe0ff', .35, .7));
const embers = makePoints(400, 30, '#ffb347', .12, .8);
embers.geometry.attributes.position.array.forEach((_, i, a) => { if (i % 3 === 2) a[i] = (Math.random() - .5) * 20; });
scene.add(embers);
const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 48, 48), new THREE.MeshBasicMaterial({ color: '#fff4c4', fog: false }));
moon.position.set(-26, 16, -70); scene.add(moon);

// ground seal formula
const sealCircle = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: sealCircleTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
sealCircle.rotation.x = -Math.PI / 2; sealCircle.position.y = -2.2; scene.add(sealCircle);

// ───────────────────────────── spiral chakra core ──
const coreVS = `varying vec3 vP; varying vec3 vN; varying vec3 vV;
void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const coreFS = `uniform float uTime; uniform float uSpeed; uniform vec3 uColA; uniform vec3 uColB; uniform float uAlpha; uniform float uBands;
varying vec3 vP; varying vec3 vN; varying vec3 vV;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
void main(){
  vec3 p = normalize(vP);
  float ang = atan(p.z, p.x); float lat = asin(clamp(p.y,-1.,1.));
  float sw = ang * uBands + lat * 6.0 - uTime * uSpeed + n(vec2(ang*2., lat*3. - uTime)) * 2.5;
  float streak = pow(0.5 + 0.5 * sin(sw), 6.0);
  float fres = pow(1.0 - abs(dot(vN, vV)), 2.2);
  vec3 col = mix(uColA, uColB, streak) * (0.18 + streak * 0.9) + uColB * fres * 0.9;
  gl_FragColor = vec4(col, uAlpha * (0.12 + streak * 0.6 + fres * 0.8));
}`;
const core = new THREE.Group(); scene.add(core);
const coreUniforms = [];
[[1.0, 9, 3.0, .95], [1.18, 5, -4.2, .55], [1.36, 7, 6.0, .35]].forEach(([r, bands, speed, alpha]) => {
  const u = { uTime: { value: 0 }, uSpeed: { value: speed }, uBands: { value: bands }, uAlpha: { value: alpha },
    uColA: { value: new THREE.Color('#1a4dff') }, uColB: { value: new THREE.Color('#bff3ff') } };
  coreUniforms.push(u);
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 64), new THREE.ShaderMaterial({ uniforms: u, vertexShader: coreVS, fragmentShader: coreFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.rotation.set(Math.random() * 3, Math.random() * 3, 0); core.add(m);
});
const coreInner = new THREE.Mesh(new THREE.SphereGeometry(.34, 32, 32), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
core.add(coreInner);
const rings = [];
for (let i = 0; i < 4; i++) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45 + i * .14, .012, 8, 160), new THREE.MeshBasicMaterial({ color: '#9ff0ff', transparent: true, opacity: .45, blending: THREE.AdditiveBlending }));
  ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0); ring.userData.spin = (i % 2 ? -1 : 1) * (2 + i);
  core.add(ring); rings.push(ring);
}
// vortex particles spiralling inward
const VN = 2600, vortexGeo = new THREE.BufferGeometry(), vPos = new Float32Array(VN * 3), vState = [];
for (let i = 0; i < VN; i++) vState.push({ r: 1.2 + Math.random() * 1.8, a: Math.random() * Math.PI * 2, y: (Math.random() - .5) * 2.2, s: .6 + Math.random() });
vortexGeo.setAttribute('position', new THREE.BufferAttribute(vPos, 3));
const vortex = new THREE.Points(vortexGeo, new THREE.PointsMaterial({ map: DOT, color: '#8fe8ff', size: .05, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false }));
core.add(vortex);

// ───────────────────────────── hand seals ring ──
const sealSprites = SEALS.map((ch, i) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTexture(ch), transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending }));
  const a = i / 12 * Math.PI * 2 - Math.PI / 2;
  sp.position.set(Math.cos(a) * 2.9, -Math.sin(a) * 2.9, 0); sp.scale.setScalar(.75);
  core.add(sp); return sp;
});
const hud = document.getElementById('seal-hud');
SEALS.forEach(s => { const e = document.createElement('span'); e.textContent = s; hud.appendChild(e); });

// ───────────────────────────── kunai ──
const steel = new THREE.MeshStandardMaterial({ color: '#c9d3e6', metalness: 1, roughness: .22 });
const wrap = new THREE.MeshStandardMaterial({ color: '#1b1d2e', metalness: .2, roughness: .8 });
const tagTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 360; const g = c.getContext('2d');
  g.fillStyle = '#f3e7c8'; g.fillRect(0, 0, 128, 360); g.strokeStyle = '#b3261e'; g.lineWidth = 6; g.strokeRect(10, 10, 108, 340);
  g.fillStyle = '#1a1a1a'; g.font = '900 78px "Noto Serif JP", serif'; g.textAlign = 'center'; g.fillText('閃', 64, 120); g.fillText('雷', 64, 230);
  g.fillStyle = '#b3261e'; g.font = '700 30px "Noto Serif JP", serif'; g.fillText('式', 64, 315);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
function makeKunai() {
  const k = new THREE.Group();
  const prof = [new THREE.Vector2(0, 0), new THREE.Vector2(.15, .28), new THREE.Vector2(.11, .55), new THREE.Vector2(0, 1.0)];
  const blade = new THREE.Mesh(new THREE.LatheGeometry(prof, 4), steel); blade.scale.z = .25; k.add(blade);
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .05, 12), steel); guard.position.y = -.02; k.add(guard);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .48, 12), wrap); handle.position.y = -.28; k.add(handle);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(.043, .008, 6, 16), steel); b.rotation.x = Math.PI / 2; b.position.y = -.08 - i * .07; k.add(b); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.1, .018, 10, 32), steel); ring.position.y = -.62; k.add(ring);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(.2, .56), new THREE.MeshBasicMaterial({ map: tagTex, side: THREE.DoubleSide, color: '#8d846f' }));
  tag.position.set(.0, -.98, .02); k.add(tag); k.userData.tag = tag;
  const glow = new THREE.Mesh(new THREE.RingGeometry(.5, .56, 64), new THREE.MeshBasicMaterial({ color: '#ffd84a', transparent: true, opacity: .8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -1.4; k.add(glow); k.userData.glow = glow;
  k.scale.setScalar(1.25);
  return k;
}
const kunaiSpots = [[-6, .4, -4], [6.5, 1.4, -8], [-4.5, 2.2, -14], [5, -.4, -18], [-6.5, 1, -23], [3, 2.6, -28]];
const kunais = kunaiSpots.map(([x, y, z], i) => { const k = makeKunai(); k.position.set(x, y, z); k.rotation.set(Math.PI, i * .7, (i % 2 ? .25 : -.25)); scene.add(k); return k; });

// ───────────────────────────── lightning ──
const boltMat = new THREE.LineBasicMaterial({ color: '#fff3a8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
const bolt = new THREE.Line(new THREE.BufferGeometry(), boltMat); scene.add(bolt);
function strike(a, b) {
  const pts = [], N = 26;
  for (let i = 0; i <= N; i++) { const p = a.clone().lerp(b, i / N); if (i && i < N) p.add(new THREE.Vector3((Math.random() - .5) * .9, (Math.random() - .5) * .9, (Math.random() - .5) * .9)); pts.push(p); }
  bolt.geometry.dispose(); bolt.geometry = new THREE.BufferGeometry().setFromPoints(pts); boltMat.opacity = 1;
}
const flashEl = document.getElementById('flash');
function flash() { flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on'); }

// ───────────────────────────── DOM content ──
const $ = s => document.querySelector(s);
$('#skills').innerHTML = SKILLS.map(s => `<li>${s}</li>`).join('');
$('#timeline').innerHTML = TIMELINE.map(([w, a, b]) => `<li><div class="when">${w}</div><div class="what">${a}</div><div class="where">${b}</div></li>`).join('');
const sections = [...document.querySelectorAll('[data-scene]')];
const dots = $('.dots');
sections.forEach((s, i) => { s.id = 's' + i; const a = document.createElement('a'); a.href = '#s' + i; a.setAttribute('aria-label', 'Section ' + (i + 1)); dots.appendChild(a); });
let shownProject = -1;
function showProject(i) {
  if (i === shownProject) return;
  const card = $('#project-card'), p = PROJECTS[i];
  card.classList.add('swap');
  setTimeout(() => {
    card.innerHTML = `<div class="top"><h3>${p.name}</h3><span class="tag">${p.tag}</span></div><p>${p.desc}</p><p class="stack">${p.stack}</p>
      <a class="btn" href="https://github.com/${USER}/${p.repo}" target="_blank" rel="noopener">Open repo ↗</a>`;
    card.classList.remove('swap');
  }, 160);
  $('#project-index').textContent = `KUNAI ${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
  shownProject = i;
}
showProject(0);

// counters for research
const counters = [...document.querySelectorAll('[data-count]')];
let countersStart = 0;
function runCounters() { if (!countersStart) countersStart = performance.now(); }
function tickCounters() {
  if (!countersStart) return;
  const k = Math.min(1, (performance.now() - countersStart) / 1400);
  counters.forEach(el => { el.textContent = Math.round(+el.dataset.count * (1 - Math.pow(1 - k, 3))); });
}

// live GitHub stats
async function loadStats() {
  try {
    const [user, repos] = await Promise.all([
      fetch(`https://api.github.com/users/${USER}`).then(r => r.json()),
      fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`).then(r => r.json()),
    ]);
    const own = repos.filter(r => !r.fork && r.name !== USER);
    const stars = own.reduce((s, r) => s + r.stargazers_count, 0);
    const langs = {}; own.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
    const top = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const days = Math.floor((Date.now() - new Date(user.created_at)) / 864e5);
    const month = own.filter(r => Date.now() - new Date(r.pushed_at) < 30 * 864e5).length;
    $('#stats').innerHTML = [[own.length, 'PROJECTS'], [stars, 'STARS'], [month, 'ACTIVE 30D'], [Object.keys(langs).length, 'LANGUAGES'], [user.followers, 'FOLLOWERS'], [days, 'DAYS ON GH']]
      .map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join('');
    const total = top.reduce((s, x) => s + x[1], 0) || 1;
    $('#langs').innerHTML = top.map(([l, n]) => `<div class="lang"><span>${l}</span><div class="bar"><i style="background:${LANG_COLORS[l] || '#9aa4ff'}" data-w="${(n / top[0][1] * 100).toFixed(0)}"></i></div><span class="mono small">${Math.round(n / total * 100)}%</span></div>`).join('');
    $('#recent').textContent = 'recently shipped ▸ ' + own.slice(0, 6).map(r => r.name).join(' · ');
  } catch (e) {
    $('#stats').innerHTML = '<p class="mono small">GitHub rate limit reached — chakra will return shortly.</p>';
  }
}
loadStats();

// ───────────────────────────── scroll → scene state ──
const camTarget = new THREE.Vector3(0, .3, 7), lookTarget = new THREE.Vector3(), look = new THREE.Vector3();
const corePosTarget = new THREE.Vector3();
let activeScene = 0, kunaiIndex = 0, lastKunai = 0, coreColor = 0;
function readScroll() {
  const vh = innerHeight;
  activeScene = 0;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= vh * .5) activeScene = i; });
  const tall = sections[2].getBoundingClientRect();
  const prog = THREE.MathUtils.clamp(-tall.top / (tall.height - vh), 0, .9999);
  kunaiIndex = Math.floor(prog * PROJECTS.length);
  [...dots.children].forEach((d, i) => d.classList.toggle('on', i === activeScene));
}
addEventListener('scroll', readScroll, { passive: true });

function sceneTargets(t) {
  sealCircle.material.opacity += ((activeScene === 4 || activeScene === 6 ? .9 : activeScene === 0 ? .35 : .12) - sealCircle.material.opacity) * .05;
  switch (activeScene) {
    case 0: corePosTarget.set(0, -1.35, 0); camTarget.set(0, .2, 9.2); lookTarget.set(0, -.2, 0); coreColor = 0; break;
    case 1: corePosTarget.set(2.3, .2, 0); camTarget.set(-.4, .6, 6.4); lookTarget.set(.9, .1, 0); coreColor = 0; break;
    case 2: {
      const k = kunais[kunaiIndex];
      corePosTarget.set(0, .1, 0); coreColor = 0;
      const off = new THREE.Vector3(.6 + Math.sin(t * .3) * .4, -.2, 5.2);
      camTarget.copy(k.position).add(off); lookTarget.copy(k.position).add(new THREE.Vector3(0, -1.5, 0));
      if (kunaiIndex !== lastKunai) { strike(kunais[lastKunai].position, k.position); flash(); camera.position.copy(camTarget); lastKunai = kunaiIndex; showProject(kunaiIndex); }
      break;
    }
    case 3: corePosTarget.set(-2.2, .4, -6); camTarget.set(6, 5, 9); lookTarget.set(0, 0, -14); coreColor = 0; break;
    case 4: corePosTarget.set(3.1, .2, 0); camTarget.set(.4, 1.6, 7); lookTarget.set(1.2, -.2, 0); coreColor = 1; runCounters(); break;
    case 5: corePosTarget.set(-2.3, .2, 0); camTarget.set(Math.sin(t * .2) * 1.5, .7, 6.6); lookTarget.set(-.9, .1, 0); coreColor = 0;
      document.querySelectorAll('.lang .bar i').forEach(i => { i.style.width = i.dataset.w + '%'; }); break;
    case 6: corePosTarget.set(0, -1.6, 0); camTarget.set(0, .8, 8.6); lookTarget.set(0, -.3, 0); coreColor = 2; break;
  }
}
const palettes = [['#1a4dff', '#bff3ff'], ['#0c8a5b', '#b8ffd9'], ['#ff8a00', '#fff1b3']];

// ───────────────────────────── animation ──
let intro = 0; // 0..1 seal sequence → core charge
function frame(t, dt) {
  // seal sequence 0–5s, then charge
  intro = Math.min(1, t / 6);
  const lit = Math.floor(Math.min(t, 5.4) / .45);
  sealSprites.forEach((s, i) => { const on = i <= lit; s.material.opacity += ((on ? (activeScene === 0 ? .8 : .2) : .08) - s.material.opacity) * .2; s.scale.setScalar(.75 + (i === lit && t < 5.5 ? .25 : 0)); });
  [...hud.children].forEach((e, i) => e.classList.toggle('on', i === lit && t < 5.6));
  hud.classList.toggle('gone', t > 6.2 || activeScene !== 0);
  const charge = THREE.MathUtils.smoothstep(t, 2.5, 6.5);
  const pulse = 1 + Math.sin(t * 9) * .02;
  core.scale.setScalar((.15 + .85 * charge) * pulse * (activeScene === 6 ? .85 : activeScene === 0 ? .62 : activeScene === 2 || activeScene === 3 ? .8 : 1));
  core.position.lerp(corePosTarget, .05);
  keyLight.position.copy(core.position);
  keyLight.intensity = 4 + 14 * charge;

  const [ca, cb] = palettes[coreColor];
  coreUniforms.forEach(u => { u.uTime.value = t; u.uColA.value.lerp(new THREE.Color(ca), .04); u.uColB.value.lerp(new THREE.Color(cb), .04); });
  coreInner.material.color.lerp(new THREE.Color(cb), .04);
  vortex.material.color.lerp(new THREE.Color(cb), .04);
  core.children.forEach((m, i) => { if (m.isMesh && m.geometry.type === 'SphereGeometry' && m !== coreInner) { m.rotation.y += dt * (1.5 + i); m.rotation.x += dt * .4; } });
  rings.forEach(r => { r.rotation.z += dt * r.userData.spin; r.rotation.x += dt * .3; });
  for (let i = 0; i < VN; i++) {
    const p = vState[i];
    p.a += dt * p.s * 5 / p.r; p.r -= dt * .35 * p.s; p.y *= (1 - dt * .4);
    if (p.r < .9) { p.r = 2.6 + Math.random() * .6; p.y = (Math.random() - .5) * 2.4; }
    vPos[i * 3] = Math.cos(p.a) * p.r; vPos[i * 3 + 1] = p.y; vPos[i * 3 + 2] = Math.sin(p.a) * p.r;
  }
  vortexGeo.attributes.position.needsUpdate = true;
  vortex.rotation.z = .35;

  kunais.forEach((k, i) => {
    k.rotation.y += dt * .5; k.position.y = kunaiSpots[i][1] + Math.sin(t * 1.3 + i) * .12;
    k.userData.tag.rotation.y = Math.sin(t * 3 + i) * .35;
    const active = activeScene === 2 && i === kunaiIndex;
    k.userData.glow.material.opacity += ((active ? 1 : .25) - k.userData.glow.material.opacity) * .1;
    k.userData.glow.scale.setScalar(1 + (active ? Math.sin(t * 6) * .12 : 0));
  });
  sealCircle.rotation.z += dt * .15;
  boltMat.opacity *= .86;
  if (activeScene === 6 && Math.random() < .03) { const a = core.position.clone(); strike(a, a.clone().add(new THREE.Vector3((Math.random() - .5) * 8, (Math.random() - .2) * 5, (Math.random() - .5) * 4))); }

  const ea = embers.geometry.attributes.position.array;
  for (let i = 0; i < ea.length; i += 3) { ea[i + 1] += dt * .25; ea[i] += Math.sin(t + i) * dt * .1; if (ea[i + 1] > 8) ea[i + 1] = -4; }
  embers.geometry.attributes.position.needsUpdate = true;

  sceneTargets(t);
  tickCounters();
  camera.position.lerp(camTarget, .045);
  look.lerp(lookTarget, .06);
  camera.lookAt(look);
  composer.render();
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < 760 ? 65 : 50; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize(); readScroll();

if (CAPTURE) {
  // deterministic frame stepping for rendering the README banner
  document.body.classList.add('capture');
  let last = 0;
  window.__render = t => { frame(t, Math.max(0, t - last)); last = t; return true; };
  window.__ready = true;
} else {
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => { const dt = Math.min(clock.getDelta(), .05); frame(clock.elapsedTime, dt); });
}
