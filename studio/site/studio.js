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
function populate(form,data){for(const item of form.elements)if(item.name&&item.type!=='file')item.type==='checkbox'?item.checked=Boolean(data[item.name]):item.value=data[item.name]||'';}
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
 updateProfilePreview();
}
function toggleSpecialty(label,restore){
 const index=specialties.findIndex(s=>s.toLowerCase()===label.toLowerCase());
 if(index>=0)specialties.splice(index,1);
 else if(specialties.length>=8){$('specialty-status').textContent='Choose up to eight specialties.';return;}
 else specialties.push(label);
 drawSpecialties();
 $('profile-status').textContent='Unsaved changes';
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
  const route='/creators/'+encodeURIComponent(p.id);
  const profile=el('a','View creator profile ↗');profile.href=route;
  if(p.works?.length){
   const item=p.works[0];
   if(item.image){
    const img=el('img','');img.className='work-preview';img.src=item.image;if(item.imageSmall){img.srcset=item.imageSmall+' 800w, '+item.image+' 1920w';img.sizes='(max-width: 760px) 90vw, 600px';}img.alt=item.alt;img.loading='lazy';img.width=800;img.height=532;a.prepend(img);
   }
   const work=el('p','');const link=el('a',item.title);link.href=item.url;
   work.append(link,' · '+item.credit);a.append(work);
  }
  if(p.avatar){const avatar=el('img','');avatar.src=p.avatar;avatar.alt='';avatar.className='avatar card-avatar';a.querySelector('h3').prepend(avatar);}
  a.append(profile);
  if(p.available){
   const enquiry=el('a','Enquire about this creator');enquiry.href=route+'#enquiry';enquiry.className='button creator-enquiry';
   a.append(el('p','Open to project enquiries'),enquiry);
  }
  return a;
 }));
 if(!people.length)$('people').append(el('p','Public profiles appear here when creators choose to share them.'));
}
async function refresh(){
 const {member,liveAI,hosted:staging}=await api('session');
 hosted=Boolean(staging);
 $('password-option').hidden=!hosted||Boolean(member);
 $('password-option').open=false;
 $('workspace-title').textContent=member?'Your studio':'Welcome to Studio';
 if(hosted)$('access-help').textContent='New here or returning? Enter your email and we’ll send you a sign-in link.';
 $('save-phrase').hidden=!hosted||!recentlyVerified;
 $('phrase-note').textContent=!hosted?'Try a phrase locally. Saving it is available in staging.':recentlyVerified?'You can set or replace your passphrase now.':'Open a fresh email link to set or replace your passphrase.';
 $('access').hidden=Boolean(member);$('member').hidden=!member;
 if(!member)resetProfileEditor();
 $('nav-work').textContent=member?'My studio':'Sign in';
 $('share').hidden=!liveAI;
 $('ai-draft-controls').hidden=!liveAI;
 $('draft-unavailable').hidden=liveAI;
 $('ai-mode').textContent=liveAI?'Use the local guide or opt in to live AI for this request.':'Local planning guide · live AI is not configured.';
 if(member){$('identity').textContent=member.name;populate($('profile'),member);specialties=member.specialties||[];const profileLink=$('public-profile-link');profileLink.hidden=!member.visible;profileLink.href='/creators/'+encodeURIComponent(member.id);$('specialty-custom').value='';$('specialty-status').textContent='';drawSpecialties();renderWork(member.works);renderSocials(member.socials||[]);showAvatar(member.avatar);updateProfilePreview();await projects();}
 await directory();
}
function addWork(item={}){
 if($('work-fields').children.length>=3)return;
 const field=$('work-template').content.firstElementChild.cloneNode(true);
 field.querySelector('legend').textContent='Project details';
 for(const input of field.querySelectorAll('input'))input.value=item[input.name]||'';
 const details=el('details','');details.className='work-item';details.open=!item.title;
 const summary=el('summary',item.title||'New project');
 field.querySelector('[name=title]').oninput=event=>{summary.textContent=event.target.value||'New project';};
 const actions=el('div','');actions.className='actions';
 for(const [label,direction]of [['Move up',-1],['Move down',1]]){
  const button=el('button',label);button.type='button';button.className='text-button';
  button.onclick=()=>{
   const sibling=direction===-1?details.previousElementSibling:details.nextElementSibling;
   if(!sibling)return;
   if(direction===-1)details.parentNode.insertBefore(details,sibling);
   else details.parentNode.insertBefore(sibling,details);
   $('work-status').textContent='Order changed · save selected work when ready';
  };
  actions.append(button);
 }
 const remove=el('button','Remove project');remove.type='button';remove.className='text-button';
 remove.onclick=()=>{details.remove();$('work-add').disabled=false;$('work-status').textContent='Project removed from this edit · save when ready';};
 actions.append(remove);details.append(summary,field,actions);$('work-fields').append(details);
 $('work-add').disabled=$('work-fields').children.length>=3;
}
function renderWork(items=[]){
 $('work-fields').replaceChildren();
 for(const item of items)addWork(item);
 if(!items.length)addWork();
 $('work-add').disabled=$('work-fields').children.length>=3;
}
$('work-add').onclick=()=>addWork();
bind('work',async ()=>{
 const items=[...$('work-fields').children].map(field=>Object.fromEntries(
  [...field.querySelectorAll('input')].map(input=>[input.name,input.value.trim()])
 )).filter(item=>Object.values(item).some(Boolean));
 const status=$('work-status');
 try{
  await api('work','PUT',{items});
  await directory();
  status.textContent='Selected work saved.';
 }catch(error){status.textContent=error.message;}
});
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
 if(data.sent){$('notice').textContent='Check your inbox. Open the Studio email and follow the sign-in link.';return;}
 link.href=data.localLink;
 link.hidden=false;
 $('notice').textContent='Your access link is ready.';
 link.focus();
});

function resetProfileEditor(){
 $('profile').reset();
 specialties=[];
 renderSocials([]);
 renderWork([]);
 closeCrop();
 showAvatar('');
 $('import-source').value='';
 $('import-url').value='';
 $('import-status').textContent='';
 $('draft-consent').checked=false;
 $('review-draft').reset();
 $('review-draft').hidden=true;
 draftSpecialties=[];
 $('draft-specialties').textContent='';
 $('profile-status').textContent='';
 $('work-status').textContent='';
 $('avatar-status').textContent='';
 $('draft-tools').open=false;
 showPanel('profile-panel');
 drawSpecialties();
 updateProfilePreview();
}
function readSocials(){
 return [...$('social-fields').children].map(row=>({
  label:row.querySelector('[data-social-label]').value.trim(),
  url:row.querySelector('[data-social-url]').value.trim()
 })).filter(item=>item.label||item.url);
}
function renderSocials(items){
 $('social-fields').replaceChildren();$('social-add').disabled=false;
 for(const item of items)addSocial(item);
}
function addSocial(item={}){
 if($('social-fields').children.length>=4)return;
 const row=el('div','');row.className='social-row';
 const label=el('label','Label'),name=el('input','');
 name.dataset.socialLabel='';name.maxLength=40;name.value=item.label||'';name.placeholder='e.g. Instagram';label.append(name);
 const address=el('label','Link'),url=el('input','');
 url.dataset.socialUrl='';url.type='url';url.maxLength=500;url.value=item.url||'';url.placeholder='https://';address.append(url);
 const remove=el('button','Remove');remove.type='button';remove.className='text-button';
 remove.onclick=()=>{row.remove();updateProfilePreview();$('social-add').disabled=false;};
 row.append(label,address,remove);$('social-fields').append(row);
 $('social-add').disabled=$('social-fields').children.length>=4;
}
$('social-add').onclick=()=>addSocial();

const previewSize=matchMedia('(min-width:761px)');
$('profile-preview-details').open=previewSize.matches;
previewSize.addEventListener('change',()=>{$('profile-preview-details').open=previewSize.matches;});
function updateProfilePreview(){
 const form=$('profile'),value=name=>form.elements.namedItem(name).value.trim();
 $('preview-name').textContent=value('name')||'Your name';
 $('preview-role').textContent=value('role');
 $('preview-headline').textContent=value('headline');
 $('preview-bio').textContent=value('bio');
 $('bio-count').textContent=value('bio').length+' / 500';
 $('preview-specialties').replaceChildren(...specialties.map(item=>el('li',item)));
 $('preview-location').textContent=[value('place'),form.elements.remote.checked?'Remote projects':''].filter(Boolean).join(' · ');
 $('preview-visibility').textContent=form.elements.visible.checked
  ? form.elements.available.checked?'Public · Open to enquiries':'Public profile'
  : 'Private · Visible only to you';
 const links=readSocials().filter(item=>/^https:\/\//i.test(item.url)&&item.label);
 $('preview-socials').replaceChildren(...links.map(item=>{
  const a=el('a',item.label+' ↗');a.href=item.url;a.rel='noopener noreferrer';return a;
 }));
}
$('profile').addEventListener('input',()=>{updateProfilePreview();$('profile-status').textContent='Unsaved changes';});

function showAvatar(url){
 for(const id of ['avatar-current','preview-avatar']){
  const target=$(id);target.replaceChildren();
  if(url){const img=el('img','');img.src=url;img.alt='';target.append(img);}
  else target.textContent='A4T';
 }
 $('avatar-remove').hidden=!url;
}
let avatarImage=null;
function drawAvatar(){
 if(!avatarImage)return;
 const canvas=$('avatar-canvas'),context=canvas.getContext('2d');
 const size=Math.min(avatarImage.width,avatarImage.height);
 const x=(avatarImage.width-size)*Number($('avatar-x').value)/100;
 const y=(avatarImage.height-size)*Number($('avatar-y').value)/100;
 context.fillStyle='#fff';context.fillRect(0,0,384,384);
 context.drawImage(avatarImage,x,y,size,size,0,0,384,384);
}
$('avatar-file').onchange=async event=>{
 const file=event.target.files[0],status=$('avatar-status');
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){
  status.textContent='Choose a JPG, PNG or WebP under 8 MB.';event.target.value='';return;
 }
 try{
  avatarImage?.close();
  avatarImage=await createImageBitmap(file,{resizeWidth:1200,resizeQuality:'high'});
  $('avatar-x').value=50;$('avatar-y').value=50;
  $('avatar-crop').hidden=false;status.textContent='Adjust the crop, then save your photo.';drawAvatar();
 }catch{status.textContent='This image could not be opened. Try another photo.';}
};
$('avatar-x').oninput=drawAvatar;$('avatar-y').oninput=drawAvatar;
function closeCrop(){avatarImage?.close();avatarImage=null;$('avatar-crop').hidden=true;$('avatar-file').value='';}
$('avatar-cancel').onclick=()=>{closeCrop();$('avatar-status').textContent='';};
$('avatar-save').onclick=async()=>{
 const button=$('avatar-save'),status=$('avatar-status');button.disabled=true;
 try{
  let photo=$('avatar-canvas').toDataURL('image/jpeg',.82).split(',')[1];
  if(photo.length>64000)photo=$('avatar-canvas').toDataURL('image/jpeg',.55).split(',')[1];
  const result=await api('avatar','PUT',{image:photo});
  showAvatar(result.avatar+'?v='+Date.now());closeCrop();
  status.textContent='Photo saved.';await directory();
 }catch(error){status.textContent=error.message;}
 finally{button.disabled=false;}
};
$('avatar-remove').onclick=async()=>{
 try{await api('avatar','DELETE');showAvatar('');$('avatar-status').textContent='Photo removed.';await directory();}
 catch(error){$('avatar-status').textContent=error.message;}
};
$('import-read').onclick=async()=>{
 const button=$('import-read'),status=$('import-status');button.disabled=true;status.textContent='Reading the public page…';
 try{
  const result=await api('profile-source','POST',{url:$('import-url').value.trim()});
  $('import-source').value=result.text;status.textContent='Page text ready. Keep the parts about your own work.';
 }catch(error){status.textContent=error.message;}
 finally{button.disabled=false;}
};
$('import-copy').onclick=()=>{
 const source=$('import-source').value.trim(),status=$('import-status');
 if(!source){status.textContent='Paste your existing bio first.';return;}
 if(source.length>500){status.textContent='Choose the part of the source you want to use, up to 500 characters.';return;}
 $('profile').elements.bio.value=source;updateProfilePreview();
 $('profile-status').textContent='Unsaved changes';status.textContent='Added to your bio. Edit it below, then save your profile.';
};
let draftSpecialties=[];
bind('profile-import',async()=>{
 const status=$('import-status');
 try{
  status.textContent='Preparing your draft…';
  const draft=await api('profile-draft','POST',{source:$('import-source').value,tone:$('draft-tone').value,consent:$('draft-consent').checked});
  populate($('review-draft'),draft);draftSpecialties=draft.specialties;
  $('draft-specialties').textContent=draft.specialties.join(' · ');
  $('review-draft').hidden=false;status.textContent='Your draft is ready to review.';
 }catch(error){status.textContent=error.message;}
});
bind('review-draft',async form=>{
 for(const [name,value]of Object.entries(fields(form)))if(value.trim())$('profile').elements.namedItem(name).value=value;
 if(draftSpecialties.length)specialties=draftSpecialties;
 drawSpecialties();updateProfilePreview();$('review-draft').hidden=true;
 $('profile-status').textContent='Draft applied · save when ready';
});
$('draft-discard').onclick=()=>{$('review-draft').hidden=true;};
bind('profile',async f=>{
 const d=fields(f),status=$('profile-status');
 status.textContent='Saving…';
 try{
  await api('profile','PUT',{...d,specialties,socials:readSocials(),remote:Boolean(d.remote),visible:Boolean(d.visible),available:Boolean(d.available)});
  const {member}=await api('session');
  $('identity').textContent=member.name;
  $('public-profile-link').hidden=!member.visible;
  $('public-profile-link').href='/creators/'+encodeURIComponent(member.id);
  await directory();
  status.textContent='Saved';
 }catch(error){status.textContent=error.message;}
});
bind('project',async f=>{const result=await api('projects'+(active?'/'+active:''),active?'PUT':'POST',fields(f));await projects();await openProject(result.id||active);$('notice').textContent='Project saved.';});
bind('task',async f=>{const id=active;await api('projects/'+id+'/tasks','POST',fields(f));f.reset();await openProject(id,false);});
bind('assist',async f=>{const d=fields(f),id=active;$('answer').textContent='Preparing a suggestion…';try{const result=await api('projects/'+id+'/assist','POST',{question:d.question,share:Boolean(d.share)});if(active===id)$('answer').textContent=(result.mode==='ai'?'Live AI':'Local guide')+'\n\n'+result.answer;}catch(e){if(active===id)$('answer').textContent=e.message;}});
click('new-project',()=>clearProject());
click('delete-project',async()=>{if(!confirm('Delete this project and its tasks?'))return;await api('projects/'+active,'DELETE');clearProject();await projects();});
click('logout',async()=>{await api('logout','POST',{});clearProject();recentlyVerified=false;phraseInput.value='';$('access-link').hidden=true;await refresh();});
click('delete-account',async()=>{if(!confirm('Delete your account, profile and saved projects?'))return;await api('account','DELETE');clearProject();recentlyVerified=false;phraseInput.value='';$('access-link').hidden=true;await refresh();});
// Preserve the visitor’s chosen path through the local access link.
const intentCopy={creator:'Sign in to create your creator profile.',project:'Sign in to start a private project.'};
function showPanel(id){
 for(const panel of document.querySelectorAll('.workspace-panel'))panel.hidden=panel.id!==id;
 for(const tab of document.querySelectorAll('[data-panel]'))tab.setAttribute('aria-pressed',String(tab.dataset.panel===id));
}
for(const tab of document.querySelectorAll('[data-panel]'))tab.onclick=()=>showPanel(tab.dataset.panel);
function showIntent(intent){
 if(!Object.hasOwn(intentCopy,intent))return;
 const target=$('member').hidden?'access':intent==='creator'?'profile':'project';
 $('access-intent').textContent=intentCopy[intent];
 $('access-intent').hidden=false;
 if(!$('member').hidden){showPanel(intent==='creator'?'profile-panel':'projects-panel');$(target).querySelector('input').focus();}
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
async function openAccessLink(){
 const url=new URL(location.href);
 const localCode=url.searchParams.get('access');
 const emailCode=new URLSearchParams(url.hash.slice(1)).get('studio_access');
 if(!localCode&&!emailCode){await refresh();return;}
 $('notice').textContent='';
 $('confirm-email').hidden=true;
 history.replaceState(null,'','/#workspace');
 if(localCode){await api('verify','POST',{code:localCode});await resumeIntent();return;}
 await refresh();
 const confirm=$('confirm-email');confirm.hidden=false;confirm.focus();
 confirm.onclick=()=>guard(async()=>{
  confirm.disabled=true;
  try{await api('verify','POST',{code:emailCode});recentlyVerified=true;confirm.hidden=true;await resumeIntent();}
  finally{confirm.disabled=false;}
 });
}
window.addEventListener('hashchange',()=>{
 if(new URLSearchParams(location.hash.slice(1)).has('studio_access'))guard(openAccessLink);
});
guard(openAccessLink);
