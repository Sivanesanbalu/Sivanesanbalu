/* Grand Line portfolio: accessible progressive enhancements; static HTML remains readable without JS. */
(()=>{'use strict';
const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header=$('.site-header'),progress=$('#progress'),menu=$('#menu-toggle'),nav=$('#header-links');
let rafScheduled=false;
function scrollState(){
if(rafScheduled)return;rafScheduled=true;
requestAnimationFrame(()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
progress.style.width=(window.scrollY/max*100).toFixed(2)+'%';
header.classList.toggle('scrolled',scrollY>36);rafScheduled=false;});
}
addEventListener('scroll',scrollState,{passive:true});addEventListener('resize',scrollState);scrollState();
if(menu){menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'✕':'☰';nav.classList.toggle('open',open);});
$$('#header-links a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');menu.textContent='☰';nav.classList.remove('open')}));}
const hero=$('.hero'),poster=$('.poster-wrap'),personaRole=$('#persona-role'),personaTag=$('#persona-tag'),personaDesc=$('#persona-desc');
const personaData={
captain:{title:'AI ENGINEER · GRAND LINE CAPTAIN',tag:'BUILDING THE IMPOSSIBLE',desc:'Engineer by craft. Explorer by instinct.'},
inventor:{title:'FULL-STACK AI SYSTEMS INVENTOR',tag:'SHIPPING REAL SYSTEMS',desc:'From prototype to production.'},
researcher:{title:'IEEE-PUBLISHED AI RESEARCHER',tag:'CURIOUS BEYOND THE HORIZON',desc:'Exploring efficient intelligence.'}
};
$('button[data-persona]').forEach(btn=>btn.addEventListener('click',()=>{
const mode=btn.dataset.persona;const d=personaData[mode];if(!d)return;
$('button[data-persona]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
document.body.dataset.persona=mode;hero.dataset.persona=mode;
personaRole.textContent=d.title;personaTag.textContent=d.tag;personaDesc.textContent=d.desc;
}));
if(poster&&!reduced&&matchMedia('(pointer:fine)').matches){
let pointerRaf=0;const origin={x:0,y:0};
hero.addEventListener('pointermove',e=>{
const rect=poster.getBoundingClientRect();origin.x=((e.clientX-(rect.left+rect.width/2))/innerWidth);origin.y=((e.clientY-(rect.top+rect.height/2))/innerHeight);
if(pointerRaf)return;pointerRaf=requestAnimationFrame(()=>{poster.style.transform='rotateY('+Math.max(-12,Math.min(12,origin.x*19))+'deg) rotateX('+Math.max(-10,Math.min(10,-origin.y*12))+'deg) translateY(-5px)';pointerRaf=0;});
});
hero.addEventListener('pointerleave',()=>{poster.style.transform='rotateY(0deg) rotateX(0deg)';});
}
const filterButtons=$$('[data-project-filter]'),cards=$$('.project-card');
filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
const group=btn.dataset.projectFilter;filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
cards.forEach(card=>card.hidden=group!=='all'&&!card.dataset.categories.split(' ').includes(group));
$('#project-status').textContent=cards.filter(c=>!c.hidden).length+' featured expeditions shown';
if(window.ScrollTrigger)window.ScrollTrigger.refresh();
}));
const archiveToggle=$('#archive-toggle'),archiveBody=$('#archive-body'),search=$('#repo-search'),repoList=$('#repo-list'),archiveStatus=$('#archive-status');
let repos=null,repoLoaded=false;
function repoElement(repo){
const a=document.createElement('a');const url=String(repo.html_url||'');
a.href=url.startsWith('https://github.com/Sivanesanbalu/')?url:'https://github.com/Sivanesanbalu?tab=repositories';
a.target='_blank';a.rel='noopener noreferrer';
const title=document.createElement('strong');title.textContent=repo.name||'Untitled repository';
const p=document.createElement('p');p.textContent=(repo.description||'Explore the source and project history').slice(0,165);
const s=document.createElement('small');s.textContent=[repo.language,repo.stargazers_count?repo.stargazers_count+' ★':'',repo.updated_at?'Updated '+new Date(repo.updated_at).toLocaleDateString('en-GB',{year:'numeric',month:'short'}):''].filter(Boolean).join(' · ');
a.append(title,p,s);return a;
}
function drawRepos(){
if(!repos)return;const q=search.value.trim().toLowerCase();
const visible=repos.filter(r=>[r.name,r.description,r.language].join(' ').toLowerCase().includes(q));
repoList.replaceChildren();const frag=document.createDocumentFragment();
visible.forEach(r=>frag.append(repoElement(r)));repoList.append(frag);
archiveStatus.textContent=visible.length+' repositories matching your search';
}
async function loadRepos(){
if(repoLoaded)return;repoLoaded=true;
archiveStatus.textContent='Fetching current public repositories from GitHub…';
try{
const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),12000);
let res;
try{res=await fetch('https://api.github.com/users/Sivanesanbalu/repos?per_page=100&type=public&sort=updated',{signal:ctrl.signal,headers:{Accept:'application/vnd.github+json'}});}
finally{clearTimeout(timer);}
if(!res.ok)throw Error('GitHub API responded '+res.status);
const result=await res.json();if(!Array.isArray(result))throw Error('Unexpected API response');
repos=result.filter(r=>!r.fork).concat(result.filter(r=>r.fork)).sort((a,b)=>new Date(b.pushed_at||b.updated_at)-new Date(a.pushed_at||a.updated_at));
drawRepos();
const count=$('#repo-count');if(count&&result.length)count.textContent=result.length+'+';
}catch(err){
archiveStatus.textContent='Live repository listing unavailable right now. The featured repositories below remain linked.';
const a=document.createElement('a');a.textContent='Browse all repositories on GitHub ↗';a.href='https://github.com/Sivanesanbalu?tab=repositories';a.target='_blank';a.rel='noopener noreferrer';repoList.replaceChildren(a);
}}
if(archiveToggle){archiveToggle.addEventListener('click',()=>{
const open=archiveToggle.getAttribute('aria-expanded')!=='true';
archiveToggle.setAttribute('aria-expanded',String(open));archiveToggle.textContent=open?'Close all repositories −':'Explore full repository archive +';archiveBody.hidden=!open;
if(open)loadRepos();
});search.addEventListener('input',drawRepos);}
const observer=new IntersectionObserver(entries=>{
entries.forEach(entry=>{if(entry.isIntersecting){const n=entry.target.dataset.arc;if(n)$('#current-arc').textContent=n.toUpperCase();}});
},{rootMargin:'-30% 0px -45% 0px',threshold:0});
$$('[data-arc]').forEach(el=>observer.observe(el));
if(!reduced&&window.gsap&&window.ScrollTrigger){
const gsap=window.gsap;gsap.registerPlugin(window.ScrollTrigger);
gsap.set('.hero-copy .overline,.hero-title,.hero-sub,.hero-intro,.hero-actions,.hero-proof',{opacity:0,y:34});
gsap.timeline({defaults:{ease:'power3.out',duration:.95}})
.to('.hero-copy .overline',{opacity:1,y:0},0)
.to('.hero-title',{opacity:1,y:0},.15)
.to('.hero-sub',{opacity:1,y:0},.3)
.to('.hero-intro',{opacity:1,y:0},.4)
.to('.hero-actions',{opacity:1,y:0},.53)
.to('.hero-proof',{opacity:1,y:0},.68)
.fromTo('.poster-wrap',{opacity:0,y:85,rotation:7},{opacity:1,y:0,rotation:-3,duration:1.5},.3);
$$('.section-top,.manifesto,.chapter-content,.chapter-art,.atlas-head,.project-card,.research-grid,.skillgroup,.contact h2,.contact p').forEach(el=>{
gsap.fromTo(el,{opacity:0,y:el.classList.contains('chapter-art')?60:35},{opacity:1,y:0,duration:1,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
});
gsap.utils.toArray('.chapter-art').forEach(el=>{
const inner=el.querySelector('.art-num');if(inner)gsap.fromTo(inner,{y:45},{y:-35,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:1.3}});
});
gsap.to('.sun',{y:-55,scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
gsap.to('.hero-horizon',{y:90,scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
}
const back=$('#back-top');if(back)back.addEventListener('click',()=>scrollTo({top:0,behavior:reduced?'instant':'smooth'}));
})();