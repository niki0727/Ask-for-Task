import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {studio} from './server.mjs';

test('membership, visibility, project ownership and assistant permissions', async t=>{
 let upstream;
 const server=studio({apiKey:'test',model:'test',fetchAI:async(_,options)=>{
  upstream=JSON.parse(options.body);
  return Response.json({output:[{type:'message',content:[{type:'output_text',text:'A sample answer.'}]}]});
 }}).listen(0,'127.0.0.1');
 await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
 const origin='http://127.0.0.1:'+server.address().port;
 async function req(path,method='GET',data,cookie='',expected=200,requestOrigin=origin){
  const r=await fetch(origin+'/api/'+path,{method,headers:{Cookie:cookie,Origin:requestOrigin,...(data?{'Content-Type':'application/json'}:{})},body:data&&JSON.stringify(data)});
  const result=await r.json();assert.equal(r.status,expected,JSON.stringify(result));
  return {result,cookie:r.headers.get('set-cookie')?.split(';')[0]};
 }
 async function join(name){
  const {result}=await req('access','POST',{email:name+'@example.com',name});
  const code=new URL(result.localLink,origin).searchParams.get('access');
  const {cookie}=await req('verify','POST',{code});
  await req('verify','POST',{code},'',400);return cookie;
 }
 const a=await join('Alex'),b=await join('Bea');
 assert.deepEqual((await req('directory')).result,[]);
 const profile={name:'Alex',portfolio:'https://example.com/work',visible:true,available:false,specialties:['Portraits','Beatmaking','portraits','Album covers']};
 await req('profile','PUT',profile,a);
 const directory=(await req('directory')).result;
 assert.equal(directory[0].name,'Alex');assert.equal(directory[0].available,0);assert.ok(!('email' in directory[0]));
 assert.deepEqual(directory[0].specialties,['portraits','Beatmaking','Album covers']);
 assert.deepEqual((await req('session','GET',undefined,a)).result.member.specialties,directory[0].specialties);
 await req('profile','PUT',{...profile,visible:false},a);
 assert.deepEqual((await req('directory')).result,[]);
 await req('profile','PUT',profile,a,403,'https://other.example');
 const {result:{id}}=await req('projects','POST',{title:'Launch',brief:'Creative brief',due:'2027-01-01',budget:'£1,000'},a,201);
 await req('projects/'+id,'GET',undefined,b,404);
 await req('projects/'+id+'/assist','POST',{question:'What now?',share:true},b,404);
 await req('projects/'+id+'/tasks','POST',{title:'Confirm brief'},a,201);
 const {result:{tasks:[task]}}=await req('projects/'+id,'GET',undefined,a);
 assert.equal(task.title,'Confirm brief');
 const path='projects/'+id+'/assist';
 assert.match((await req(path,'POST',{question:'budget'},a)).result.answer,/£1,000/);assert.equal(upstream,undefined);
 assert.equal((await req(path,'POST',{question:'scope',share:true},a)).result.mode,'ai');
 assert.equal(upstream.store,false);assert.equal(JSON.parse(upstream.input).brief,'Creative brief');assert.ok(!upstream.input.includes('@example.com'));
 await req('projects/'+id+'/tasks/'+task.id,'PATCH',{done:true},a);
 assert.equal((await req('projects/'+id,'GET',undefined,a)).result.tasks[0].done,1);
 await req('logout','POST',{},a);await req('projects','GET',undefined,a,401);
 const again=await join('Alex');
 assert.equal((await req('projects','GET',undefined,again)).result[0].id,id);
 await req('account','DELETE',undefined,again);await req('projects','GET',undefined,again,401);
 const newAccount=await join('Alex');assert.deepEqual((await req('projects','GET',undefined,newAccount)).result,[]);
});

test('hosted mode verifies email before issuing a session and returns the existing profile on password sign-in',async t=>{
 const {hostedAuth}=await import('./hosted-auth.mjs');
 const id='30202f74-39dc-48b6-9836-b1fba90867b7',email='creator@example.com';
 const person={id,email,email_confirmed_at:'2026-11-17T00:00:00Z',user_metadata:{name:'Creator'}};
 let used=false,password;
 const auth=hostedAuth({url:'https://test.supabase.co',key:'publishable',admin:'admin',fetcher:async(url,options)=>{
  const path=new URL(url).pathname.split('/').at(-1),data=JSON.parse(options.body||'null');
  assert.equal(options.headers.apikey,'publishable');
  if(path==='otp'){assert.equal(data.email,email);return Response.json({});}
  if(path==='verify'){
   assert.equal(data.type,'email');
   if(used||data.token_hash!=='mail-token')return new Response('',{status:400});
   used=true;
  }else if(path==='token'){if(data.password!==password)return new Response('',{status:400});}
  else if(path==='user'){
   assert.equal(options.headers.Authorization,'Bearer verified-token');
   if(options.method==='PUT')password=data.password;
   return Response.json(person);
  }else assert.fail(path);
  return Response.json({user:person,access_token:'verified-token'});
 }});
 const origin='https://staging.example.com';
 const pgUrl=process.env.STUDIO_TEST_DATABASE_URL;
 const store=pgUrl?await (await import('./postgres-store.mjs')).postgresStore(pgUrl):undefined;
 const server=studio({auth,origin,store,allowedEmails:new Set([email])}).listen(0,'127.0.0.1');
 await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
 async function req(path,method,data,cookie='',status=200){
  const {request}=await import('node:http');
  const res=await new Promise((resolve,reject)=>{
   const q=request({hostname:'127.0.0.1',port:server.address().port,path:'/api/'+path,method,
    headers:{Host:'staging.example.com',Origin:origin,Cookie:cookie,'Content-Type':'application/json'}
   },async r=>{try{let body='';for await(const c of r)body+=c;resolve({status:r.statusCode,body,cookies:r.headers['set-cookie']||[]});}catch(e){reject(e);}});
   q.on('error',reject);q.end(data&&JSON.stringify(data));
  });
  const json=JSON.parse(res.body);assert.equal(res.status,status,JSON.stringify(json));
  return {json,cookie:res.cookies.map(c=>{assert.match(c,/; Secure/);return c.split(';')[0];}).join('; ')};
 }
 assert.deepEqual((await req('access','POST',{email:'not-in-pilot@example.com'})).json,{sent:true});
 assert.deepEqual((await req('access','POST',{email})).json,{sent:true});
 await req('verify','POST',{code:'invalid'},'',400);
 const {cookie}=await req('verify','POST',{code:'mail-token'});
 await req('verify','POST',{code:'mail-token'},'',400);
 await req('profile','PUT',{name:'Creator',role:'Music & sound',specialties:['Beatmaking']},cookie);
 await req('password','PUT',{password:'canvas-ink-moss-frost-brass-rain-024891'},cookie.split(';')[0],403);
 await req('password','PUT',{password:'canvas-ink-moss-frost-brass-rain-024891'},cookie);
 const resumed=await req('password-sign-in','POST',{email,password});
 assert.deepEqual((await req('session','GET',null,resumed.cookie)).json.member.specialties,['Beatmaking']);
 const project=await req('projects','POST',{title:'Pilot brief',brief:'Test scope'},resumed.cookie,201);
 await req('projects/'+project.json.id+'/tasks','POST',{title:'Confirm usage'},resumed.cookie,201);
 assert.equal((await req('projects/'+project.json.id,'GET',null,resumed.cookie)).json.tasks[0].title,'Confirm usage');
});
