const $=id=>document.getElementById(id);
const fields=form=>Object.fromEntries(new FormData(form));
const el=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;};
let active=null, hosted=false, recentlyVerified=false;
async function api(path,method='GET',payload){
 const r=await fetch('/api/'+path,{method,...(payload?{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{})});
 const data=await r.json();
 if(!r.ok)throw Error(data.error);return data;
}
function bind(id,fn){$(id).addEventListener('submit',async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;$('notice').textContent='';try{await fn(e.currentTarget);}catch(error){$('notice').textContent=error.message;}finally{button.disabled=false;}});}
function click(id,fn){$(id).onclick=()=>guard(fn);}
async function guard(fn){try{await fn();}catch(e){$('notice').textContent=e.message;}}
function populate(form,data){for(const item of form.elements)if(item.name)item.type==='checkbox'?item.checked=Boolean(data[item.name]):item.value=data[item.name]||'';}
const specialtyIdeas={
 'music & sound':['Beatmaking','Songwriting','Vocals','Music production','Composition','DJing','Sound design','Mixing & mastering'],
 photography:['Portraits','Events','Fashion','Food & drink','Products','Architecture','Documentary','Travel & landscape'],
 'film & video':['Directing','Cinematography','Documentary','Music videos','Editing','Colour grading'],
 'design & art direction':['Brand identity','Graphic design','Typography','Editorial design','Packaging','Art direction'],
 'illustration & visual art':['Illustration','Painting','Drawing','Printmaking','Sculpture','Mixed media','Installation'],
 'animation & 3d':['Motion design','2D animation','3D modelling','Stop motion','Visual effects'],
 'writing & editorial':['Copywriting','Journalism','Scriptwriting','Editing','Creative writing'],
 'fashion & styling':['Fashion design','Wardrobe styling','Costume','Makeup','Set styling'],
 'performance & live arts':['Acting','Dance','Theatre','Live performance','Choreography'],
 'architecture & spatial design':['Architecture','Interiors','Exhibitions','Set design','Public spaces'],
 'digital & interactive':['Web design','UX & UI','Creative coding','Games','Interactive installations'],
 'creative production':['Creative direction','Event production','Casting','Location scouting','Production management']
};
let specialties=[];
const roleInput=$('profile').elements.namedItem('role');
function drawSpecialties(){
 const role=roleInput.value.trim().toLowerCase();
 const choices=specialtyIdeas[role]||(role.includes('photo')?specialtyIdeas.photography:/music|sound|songwrit|beatmak/.test(role)?specialtyIdeas['music & sound']:/artist|visual art/.test(role)?specialtyIdeas['illustration & visual art']:[]);
 const button=(label,action)=>{const b=el('button',label);b.type='button';b.onclick=action;return b;};
 $('specialty-suggestions').replaceChildren(...choices.map(label=>{
  const picked=specialties.some(s=>s.toLowerCase()===label.toLowerCase());
  const b=button(label,()=>toggleSpecialty(label,label));
  b.dataset.specialty=label;b.setAttribute('aria-pressed',String(picked));return b;
 }));
 $('specialty-picked').replaceChildren(...specialties.filter(label=>!choices.some(c=>c.toLowerCase()===label.toLowerCase())).map(label=>{
  const b=button(label+' ×',()=>toggleSpecialty(label));
  b.setAttribute('aria-label','Remove '+label);return b;
 }));
}
function toggleSpecialty(label,restore){
 const index=specialties.findIndex(s=>s.toLowerCase()===label.toLowerCase());
 if(index>=0)specialties.splice(index,1);
 else if(specialties.length>=8){$('specialty-status').textContent='Choose up to eight specialties.';return;}
 else specialties.push(label);
 drawSpecialties();
 $('specialty-status').textContent=(index>=0?'Removed ':'Added ')+label+'.';
 if(restore)[...$('specialty-suggestions').children].find(b=>b.dataset.specialty===restore)?.focus();
 else $('specialty-custom').focus();
}
function addSpecialty(){
 const input=$('specialty-custom'),label=input.value.trim();
 if(!label)return;
 if(specialties.some(s=>s.toLowerCase()===label.toLowerCase())){$('specialty-status').textContent='That specialty is already added.';return;}
 if(specialties.length>=8){$('specialty-status').textContent='Choose up to eight specialties.';return;}
 toggleSpecialty(label);input.value='';
}
roleInput.addEventListener('input',drawSpecialties);
$('specialty-add').onclick=addSpecialty;
$('specialty-custom').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addSpecialty();}});
async function directory(){
 const people=await api('directory');
 $('people').replaceChildren(...people.map(p=>{
  const a=el('article','');a.append(el('h3',p.name),el('p',[p.role,p.place].filter(Boolean).join(' · ')),el('p',p.bio));
  if(p.specialties?.length){const list=el('ul','');list.className='disciplines';list.append(...p.specialties.map(label=>el('li',label)));a.append(list);}
  if(p.portfolio){const l=el('a','View portfolio ↗');l.href=p.portfolio;l.rel='noopener noreferrer';a.append(l);}
  if(p.available)a.append(el('p','Open to project enquiries'));
  return a;
 }));
 if(!people.length)$('people').append(el('p','Public profiles appear here when creators choose to share them.'));
}
async function refresh(){
 const {member,liveAI,hosted:staging}=await api('session');
 hosted=Boolean(staging);
 $('password-login').hidden=!hosted||Boolean(member);
 if(hosted)$('access-help').textContent='We’ll email you a one-time link to open your Studio account.';
 $('save-phrase').hidden=!hosted||!recentlyVerified;
 $('phrase-note').textContent=!hosted?'Try a phrase locally. Saving it is available in staging.':recentlyVerified?'You can set or replace your passphrase now.':'Open a fresh email link to set or replace your passphrase.';
 $('access').hidden=Boolean(member);$('member').hidden=!member;
 $('nav-work').textContent=member?'My studio':'Sign in';
 $('share').hidden=!liveAI;
 $('ai-mode').textContent=liveAI?'Use the local guide or opt in to live AI for this request.':'Local planning guide · live AI is not configured.';
 if(member){$('identity').textContent=member.name;populate($('profile'),member);specialties=member.specialties||[];$('specialty-custom').value='';$('specialty-status').textContent='';drawSpecialties();await projects();}
 await directory();
}
async function projects(){
 const list=await api('projects');
 $('projects').replaceChildren(...list.map(p=>{const b=el('button',p.title);b.type='button';b.className='outline';b.onclick=()=>guard(()=>openProject(p.id));return b;}));
}
async function openProject(id,clearAnswer=true){
 const p=await api('projects/'+id);
 active=id;$('project-heading').textContent='Edit project';populate($('project'),p);
 $('desk').hidden=false;if(clearAnswer)$('answer').textContent='';
 $('tasks').replaceChildren(...p.tasks.map(t=>{
 const li=el('li',''), check=el('input',''), label=el('label',t.title), remove=el('button','Remove');
 check.type='checkbox';check.checked=Boolean(t.done);label.prepend(check);remove.type='button';remove.className='outline';remove.setAttribute('aria-label','Remove '+t.title);
 check.onchange=()=>guard(async()=>{try{await api('projects/'+id+'/tasks/'+t.id,'PATCH',{done:check.checked});}catch(e){check.checked=!check.checked;throw e;}});
 remove.onclick=()=>guard(async()=>{await api('projects/'+id+'/tasks/'+t.id,'DELETE');await openProject(id,false);});
 li.append(label,remove);return li;
 }));
}
function clearProject(){active=null;$('project').reset();$('assist').reset();$('desk').hidden=true;$('project-heading').textContent='Start a project';}
bind('access',async f=>{
 const link=$('access-link');
 link.hidden=true;link.removeAttribute('href');
 const data=await api('access','POST',fields(f));
 if(data.sent){$('notice').textContent='Check your inbox for your Studio link.';return;}
 link.href=data.localLink;
 link.hidden=false;
 $('notice').textContent='Your access link is ready.';
 link.focus();
});
bind('profile',async f=>{const d=fields(f);await api('profile','PUT',{...d,specialties,visible:Boolean(d.visible),available:Boolean(d.available)});await refresh();$('notice').textContent='Profile saved.';});
bind('project',async f=>{const result=await api('projects'+(active?'/'+active:''),active?'PUT':'POST',fields(f));await projects();await openProject(result.id||active);$('notice').textContent='Project saved.';});
bind('task',async f=>{const id=active;await api('projects/'+id+'/tasks','POST',fields(f));f.reset();await openProject(id,false);});
bind('assist',async f=>{const d=fields(f),id=active;$('answer').textContent='Preparing a suggestion…';try{const result=await api('projects/'+id+'/assist','POST',{question:d.question,share:Boolean(d.share)});if(active===id)$('answer').textContent=(result.mode==='ai'?'Live AI':'Local guide')+'\n\n'+result.answer;}catch(e){if(active===id)$('answer').textContent=e.message;}});
click('new-project',()=>clearProject());
click('delete-project',async()=>{if(!confirm('Delete this project and its tasks?'))return;await api('projects/'+active,'DELETE');clearProject();await projects();});
click('logout',async()=>{await api('logout','POST',{});clearProject();recentlyVerified=false;phraseInput.value='';$('access-link').hidden=true;await refresh();});
click('delete-account',async()=>{if(!confirm('Delete your account, profile and saved projects?'))return;await api('account','DELETE');clearProject();recentlyVerified=false;phraseInput.value='';$('access-link').hidden=true;await refresh();});
// Preserve the visitor’s chosen path through the local access link.
const intentCopy={creator:'Sign in to create your creator profile.',project:'Sign in to start a private project.'};
function showIntent(intent){
 if(!Object.hasOwn(intentCopy,intent))return;
 const target=$('member').hidden?'access':intent==='creator'?'profile':'project';
 $('access-intent').textContent=intentCopy[intent];
 $('access-intent').hidden=false;
 if(!$('member').hidden)$(target).querySelector('input').focus();
 else requestAnimationFrame(()=>$(target).elements.namedItem('email').focus({preventScroll:true}));
}
for(const link of document.querySelectorAll('[data-intent]')){
 link.addEventListener('click',event=>{
  const intent=link.dataset.intent;
  sessionStorage.setItem('studio-intent',intent);
  if(!$('member').hidden)event.preventDefault();
  showIntent(intent);
 });
}
$('nav-work').addEventListener('click',()=>{
 sessionStorage.removeItem('studio-intent');$('access-intent').hidden=true;
});
const phraseInput=$('phrase').elements.namedItem('password');
const phraseWords='amber anchor apple apron atlas autumn birch bloom brass brook brush canvas cedar chalk clay cloud coral cotton dawn dune ember fern field flute fog forest frost glass grain harbour ink ivory ivy jade kite leaf linen lupin maple mist moss night oak ocean olive onyx opal paper pearl pine plum quartz rain reed ridge robin sage salt shell silk slate snow stone thyme'.split(' ');
$('generate-phrase').onclick=()=>{
 const bytes=crypto.getRandomValues(new Uint8Array(6)),digits=crypto.getRandomValues(new Uint32Array(1))[0]%1000000;
 phraseInput.value=[...bytes].map(n=>phraseWords[n&63]).join('-')+'-'+String(digits).padStart(6,'0');
 phraseInput.type='text';$('show-phrase').textContent='Hide phrase';$('show-phrase').setAttribute('aria-pressed','true');phraseInput.focus();
};
$('show-phrase').onclick=()=>{
 const show=phraseInput.type==='password';phraseInput.type=show?'text':'password';
 $('show-phrase').textContent=show?'Hide phrase':'Show phrase';$('show-phrase').setAttribute('aria-pressed',String(show));
};
bind('phrase',async f=>{
 if(!hosted||!recentlyVerified)return;
 await api('password','PUT',fields(f));f.reset();recentlyVerified=false;
 phraseInput.type='password';$('show-phrase').textContent='Show phrase';$('show-phrase').setAttribute('aria-pressed','false');
 await refresh();$('notice').textContent='Passphrase saved. You can still use an email link.';
});
async function resumeIntent(){
 const intent=sessionStorage.getItem('studio-intent');
 sessionStorage.removeItem('studio-intent');
 await refresh();showIntent(intent);
}
bind('password-login',async f=>{
 await api('password-sign-in','POST',fields(f));f.reset();recentlyVerified=false;await resumeIntent();
});
guard(async()=>{
 const url=new URL(location.href);
 const localCode=url.searchParams.get('access');
 const emailCode=new URLSearchParams(url.hash.slice(1)).get('studio_access');
 if(!localCode&&!emailCode){await refresh();return;}
 history.replaceState(null,'','/#workspace');
 if(localCode){await api('verify','POST',{code:localCode});await resumeIntent();return;}
 await refresh();
 const confirm=$('confirm-email');confirm.hidden=false;confirm.focus();
 confirm.onclick=()=>guard(async()=>{
  confirm.disabled=true;
  try{await api('verify','POST',{code:emailCode});recentlyVerified=true;confirm.hidden=true;await resumeIntent();}
  finally{confirm.disabled=false;}
 });
});
