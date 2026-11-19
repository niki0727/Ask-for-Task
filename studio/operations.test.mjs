import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {studio} from './server.mjs';
import {resendAlerts,enquiryQueue} from './enquiry-alerts.mjs';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {schemaUpgrades} from './schema-upgrades.mjs';

test('operator inbox is isolated and a failed alert never loses an enquiry', async t => {
 let failing=true, attempts=0;
 const server=studio({
  operatorEmails:new Set(['owner@example.test']),
  sendAlert:async()=>{attempts++;if(failing)throw Error('Transient mail failure');return 'accepted-alert';}
 }).listen(0,'127.0.0.1');
 await once(server,'listening');
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const origin='http://127.0.0.1:'+server.address().port;
 async function request(path,method='GET',data,cookie='',status=200){
  const response=await fetch(origin+'/api/'+path,{method,headers:{Cookie:cookie,...(data?{'Content-Type':'application/json'}:{})},body:data&&JSON.stringify(data)});
  const body=await response.json();assert.equal(response.status,status,JSON.stringify(body));
  return {body,cookie:response.headers.get('set-cookie')?.split(';')[0]};
 }
 async function join(email){
  const {body}=await request('access','POST',{email});
  return (await request('verify','POST',{code:new URL(body.localLink,origin).searchParams.get('access')})).cookie;
 }
 const owner=await join('owner@example.test'),creator=await join('creator@example.test');
 assert.equal((await request('session','GET',undefined,owner)).body.operator,true);
 assert.equal((await request('session','GET',undefined,creator)).body.operator,false);
 await request('operator/enquiries','GET',undefined,'',401);
 await request('operator/enquiries','GET',undefined,creator,403);
 const {body:{reference}}=await request('enquiries','POST',{
  creator:'nikita-piazenko',name:'Test client',email:'buyer@example.test',brief:'Synthetic brief',consent:true
 },'',201);
 let row;
 for(let i=0;i<30;i++){
  row=(await request('operator/enquiries','GET',undefined,owner)).body[0];
  if(row.notification_error)break;
  await new Promise(resolve=>setTimeout(resolve,10));
 }
 assert.equal(row.id,reference);assert.equal(row.notification_attempts,1);
 assert.match(row.notification_error,/saved/);
 assert.equal(row.notification_sent,null);
 await request('operator/enquiries/'+reference,'PATCH',{status:'handed-off',note:'Test creator confirmed receipt'},creator,403);
 await request('operator/enquiries/'+reference,'PATCH',{status:'contacted',note:'Sent a test reply'},owner);
 failing=false;
 await request('operator/enquiries/'+reference+'/retry-alert','PATCH',{},owner);
 for(let i=0;i<30;i++){
  row=(await request('operator/enquiries','GET',undefined,owner)).body[0];
  if(row.notification_sent)break;
  await new Promise(resolve=>setTimeout(resolve,10));
 }
 assert.ok(row.notification_sent);assert.equal(row.review_status,'contacted');
 await request('operator/enquiries/'+reference,'PATCH',{status:'handed-off',note:'Test creator confirmed receipt'},owner);
 row=(await request('operator/enquiries','GET',undefined,owner)).body[0];
 assert.ok(row.handed_off);assert.equal(row.operator_note,'Test creator confirmed receipt');
 assert.equal(attempts,2);
});

test('mail alerts contain only the reference and inbox link with stable idempotency', async()=>{
 let payload,headers;
 const send=resendAlerts({
  key:'test',from:'A4T <updates@auth.example.test>',to:'owner@example.test',origin:'https://studio.example.test',
  fetcher:async(_url,options)=>{payload=JSON.parse(options.body);headers=options.headers;return Response.json({id:'provider-id'});}
 });
 assert.equal(await send({id:'enquiry-id',creator_name:'Creator',email:'private@example.test',brief:'Private brief'}),'provider-id');
 assert.equal(headers['Idempotency-Key'],'studio-enquiry-enquiry-id');
 assert.match(payload.text,/https:\/\/studio.example.test\/#inbox/);
 assert.ok(!payload.text.includes('Private brief'));assert.ok(!payload.text.includes('private@example.test'));
});

test('multiple alert workers claim an enquiry once', async()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 for(const [name,definition]of Object.entries(schemaUpgrades.creator_enquiries))db.exec('ALTER TABLE creator_enquiries ADD COLUMN '+name+' '+definition);
 db.prepare('INSERT INTO creator_enquiries(id,creator_id,creator_name,client_name,email,brief,created) VALUES (?,?,?,?,?,?,?)').run('id','creator','Creator','Client','client@example.test','Brief',Date.now());
 const one=async(sql,...args)=>db.prepare(sql).get(...args);
 const run=async(sql,...args)=>db.prepare(sql).run(...args);
 let sends=0;
 const sendAlert=async()=>{sends++;await new Promise(resolve=>setTimeout(resolve,15));return 'accepted';};
 await Promise.all([enquiryQueue({one,run,sendAlert}).drain(),enquiryQueue({one,run,sendAlert}).drain()]);
 assert.equal(sends,1);
 db.close();
});

test('open registration still requires confirmed email',async t=>{
 let requested;
 const user={id:'9efed7cd-167e-43b7-bb0c-78f3552eeb14',email:'new@example.test',user_metadata:{}};
 const server=studio({
  origin:'https://studio.example.test',registrationOpen:true,operatorEmails:new Set(['owner@example.test']),
  auth:{send:async email=>{requested=email;},verify:async()=>({user,access_token:'verified'})}
 }).listen(0,'127.0.0.1');
 await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
 const {request}=await import('node:http');
 const result=await new Promise((resolve,reject)=>{
  const req=request({host:'127.0.0.1',port:server.address().port,path:'/api/access',method:'POST',headers:{Host:'studio.example.test','Content-Type':'application/json'}},async res=>{
   let body='';for await(const chunk of res)body+=chunk;resolve({status:res.statusCode,body:JSON.parse(body)});
  });req.on('error',reject);req.end(JSON.stringify({email:'new@example.test'}));
 });
 assert.equal(result.status,200);assert.equal(requested,'new@example.test');
});
