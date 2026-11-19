(() => {
 const byId=id=>document.getElementById(id);
 const element=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
 const statuses={new:'New',contacted:'Contacted','handed-off':'Handed off',closed:'Closed'};
 let rows=[];
 let generation=0;
 async function request(path,method='GET',data){
  const response=await fetch('/api/operator/'+path,{
   method,...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})
  });
  const result=await response.json();
  if(!response.ok)throw Error(result.error);
  return result;
 }
 function render(){
  const visible=byId('inbox-filter').value==='all'?rows:rows.filter(row=>!['closed','handed-off'].includes(row.review_status));
  byId('inbox-list').replaceChildren(...visible.map(row=>{
   const article=element('article','');article.className='enquiry-card';
   const heading=element('h4',row.client_name+' · '+row.creator_name);
   const date=element('p',new Date(Number(row.created)).toLocaleString());
   date.className='muted';
   const reference=element('p','Reference '+row.id);reference.className='field-note';
   const brief=element('p',row.brief);brief.className='enquiry-brief';
   const reply=element('a','Reply to '+row.client_name+' ↗');
   reply.href='mailto:'+encodeURIComponent(row.email)+'?subject='+encodeURIComponent('Your A4T Studio enquiry · '+row.id);
   const email=element('p',row.email);
   const delivery=element('p',row.notification_sent?'Email alert accepted by provider':row.notification_attempts>=6?'Email alert needs attention':'Email alert pending');
   delivery.className='field-note';
   const form=element('form','');
   const label=element('label','Status'),select=element('select','');
   select.name='status';
   for(const [value,title]of Object.entries(statuses)){const option=element('option',title);option.value=value;select.append(option);}
   select.value=row.review_status;label.append(select);
   const noteLabel=element('label','Private A4T note'),note=element('textarea','');
   note.name='note';note.maxLength=1000;note.rows=3;note.value=row.operator_note;noteLabel.append(note);
   const save=element('button','Save enquiry');
   const feedback=element('p','');feedback.setAttribute('role','status');
   const hint=element('p','Mark “Handed off” after the creator has received the agreed brief.');
   hint.className='field-note';
   form.append(label,noteLabel,hint,save,feedback);
   form.onsubmit=async event=>{
    event.preventDefault();save.disabled=true;feedback.textContent='Saving…';
    try{
     await request('enquiries/'+row.id,'PATCH',{status:select.value,note:note.value});
     row.review_status=select.value;row.operator_note=note.value;
     feedback.textContent='Saved';
    }catch(error){feedback.textContent=error.message;}
    finally{save.disabled=false;}
   };
   article.append(heading,date,reference,brief,email,reply,delivery,form);
   if(!row.notification_sent&&row.notification_attempts>=6){
    const retry=element('button','Retry email alert');retry.type='button';retry.className='outline';
    retry.onclick=async()=>{
     retry.disabled=true;
     try{await request('enquiries/'+row.id+'/retry-alert','PATCH',{});feedback.textContent='Alert queued for retry.';}
     catch(error){feedback.textContent=error.message;}
     finally{retry.disabled=false;}
    };
    article.append(retry);
   }
   return article;
  }));
  if(!visible.length)byId('inbox-list').append(element('p','No enquiries here yet.'));
 }
 async function refresh(){
  byId('inbox-status').textContent='Loading enquiries…';
  const current=++generation;
  try{const incoming=await request('enquiries');if(current!==generation||byId('operator-tab').hidden)return;rows=incoming;render();byId('inbox-status').textContent='';}
  catch(error){byId('inbox-status').textContent=error.message;}
 }
 window.addEventListener('studio-operator-change',event=>{if(!event.detail){generation++;rows=[];byId('inbox-list').replaceChildren();}});
 window.addEventListener('studio-inbox-open',refresh);
 byId('inbox-refresh').onclick=refresh;
 byId('inbox-filter').onchange=render;
})();
