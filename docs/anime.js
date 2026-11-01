/* Anime crew interactions — no tracking, no audio, no external character assets. */
(()=>{
'use strict';
const crew=document.querySelector('.anime-crew');
const visual=document.querySelector('.hero-visual');
const buttons=[...document.querySelectorAll('[data-crew-choice]')];
const caption=document.getElementById('crew-caption');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const info={
captain:'The dreamer — a straw-hat captain who represents curiosity and ambition.',
swordsman:'The swordsman — discipline, focus and the resolve to finish the build.',
navigator:'The navigator — curiosity, strategy and finding the next engineering island.'
};
function spotlight(id){
if(!crew||!info[id])return;
crew.dataset.spotlight=id;
buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.crewChoice===id)));
if(caption)caption.textContent=info[id];
crew.classList.remove('crew-switch-flash');void crew.offsetWidth;crew.classList.add('crew-switch-flash');
}
buttons.forEach(b=>b.addEventListener('click',()=>spotlight(b.dataset.crewChoice)));
if(crew&&visual&&!reduce.matches&&matchMedia('(pointer:fine)').matches){
let raf=0,x=0,y=0;
visual.addEventListener('pointermove',e=>{
const r=visual.getBoundingClientRect();
x=(e.clientX-r.left)/r.width-.5;y=(e.clientY-r.top)/r.height-.5;
if(raf)return;
raf=requestAnimationFrame(()=>{
const dx=Math.max(-1,Math.min(1,x*2)),dy=Math.max(-1,Math.min(1,y*2));
crew.style.setProperty('--crew-left-x',(dx*-17).toFixed(1)+'px');
crew.style.setProperty('--crew-right-x',(dx*17).toFixed(1)+'px');
crew.style.setProperty('--crew-center-x',(dx*7).toFixed(1)+'px');
crew.style.setProperty('--crew-y',(dy*-12).toFixed(1)+'px');
raf=0;});
},{passive:true});
visual.addEventListener('pointerleave',()=>{
for(const k of ['--crew-left-x','--crew-right-x','--crew-center-x','--crew-y'])crew.style.removeProperty(k);
});
}
const chapters=[...document.querySelectorAll('.chapter')];
const seen=new WeakSet();
if('IntersectionObserver' in window){
const watcher=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(entry.isIntersecting&&!seen.has(entry.target)){
seen.add(entry.target);entry.target.classList.add('arc-active');
watcher.unobserve(entry.target);
}
});
},{rootMargin:'-12% 0px -20% 0px',threshold:.12});
chapters.forEach(el=>watcher.observe(el));
}else{chapters.forEach(el=>el.classList.add('arc-active'));}
const motionBtn=document.getElementById('motion-control');
if(motionBtn){
let paused=reduce.matches;
const apply=()=>{
document.body.classList.toggle('ambient-paused',paused);
motionBtn.setAttribute('aria-pressed',String(paused));
motionBtn.textContent=paused?'▶ Resume effects':'Ⅱ Pause effects';
motionBtn.setAttribute('aria-label',paused?'Resume ambient effects':'Pause ambient effects');
};
apply();
motionBtn.addEventListener('click',()=>{paused=!paused;apply();});
}
const charter=document.querySelector('.navigator-brief');
if(charter&&!reduce.matches){
const compass=charter.querySelector('.navigator-route');
if(compass&&'IntersectionObserver' in window){
new IntersectionObserver(entries=>{
entries.forEach(e=>{if(e.isIntersecting)charter.classList.add('chart-ready');});
},{threshold:.25}).observe(charter);
}
}
})();