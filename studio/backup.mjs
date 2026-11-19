import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {mkdir,readFile,writeFile,appendFile,rename,stat,mkdtemp,rm,readdir} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {spawn} from 'node:child_process';
import {pipeline} from 'node:stream/promises';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {join,basename} from 'node:path';
import {homedir,tmpdir,userInfo} from 'node:os';
import pg from 'pg';

const home=process.env.STUDIO_BACKUP_HOME||join(homedir(),'Library','Application Support','A4T Studio');
const command=process.argv[2]||'backup';
const quote=value=>'"'+value.replaceAll('"','""')+'"';
await mkdir(home,{recursive:true,mode:0o700});
const keyPath=join(home,'backup-key');
let key;
try{key=await readFile(keyPath);}catch(error){
 if(error.code!=='ENOENT'||command!=='backup')throw error;
 key=randomBytes(32);await writeFile(keyPath,key,{flag:'wx',mode:0o600});
}
if(key.length!==32)throw Error('The local backup encryption key is invalid.');
function childProcess(command,args,env={}){
 const child=spawn(command,args,{env:{...process.env,LC_ALL:'C',LANG:'C',...env},stdio:['pipe','pipe','pipe']});
 let errorText='';
 child.stderr.on('data',data=>{errorText=(errorText+data).slice(-5000);});
 const done=new Promise((resolve,reject)=>{
  child.once('error',reject);
  child.once('close',code=>code===0?resolve():reject(Error(command+' failed. '+errorText)));
 });
 return {child,done};
}
async function run(command,args,env={}){
 const task=childProcess(command,args,env);task.child.stdin.end();task.child.stdout.resume();await task.done;
}
async function* portableSQL(stream){
 let copying=false;
 for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
  // Supabase's per-column version metadata is absent from standard PostgreSQL.
  // Keep COPY payloads byte-for-byte at the line level, including matching text.
  if(!copying&&/^ALTER TABLE ONLY (auth|studio_app)\.\w+ ALTER COLUMN \w+ SET \(pg_attver=\d+\);$/.test(line))continue;
  yield line+'\n';
  if(!copying&&/^COPY .* FROM stdin;$/.test(line))copying=true;
  else if(copying&&line==='\\.')copying=false;
 }
}
async function counts(client){
 const {rows}=await client.query("SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema IN ('studio_app','auth') AND table_type='BASE TABLE' ORDER BY table_schema,table_name");
 const result={};
 for(const table of rows){
  const name=quote(table.table_schema)+'.'+quote(table.table_name);
  result[table.table_schema+'.'+table.table_name]=(await client.query('SELECT count(*)::text AS count FROM '+name)).rows[0].count;
 }
 return result;
}
if(command==='backup'){
 const raw=process.env.STUDIO_DATABASE_URL||(await readFile(join(home,'database-url.txt'),'utf8')).trim();
 const url=new URL(raw);
 const socket=url.searchParams.get('host');
 const local=process.env.STUDIO_BACKUP_TEST_LOCAL==='1'&&(socket?.startsWith('/')||['localhost','127.0.0.1'].includes(url.hostname));
 url.searchParams.delete('sslmode');
 const caPath=join(home,'database-ca.crt');
 const client=new pg.Client({connectionString:url.href,ssl:local?false:{rejectUnauthorized:true,ca:await readFile(caPath,'utf8')}});
 const temporary=await mkdtemp(join(tmpdir(),'a4t-backup-'));
 let partial;
 try{
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const snapshot=(await client.query('SELECT pg_export_snapshot() AS id')).rows[0].id;
  const manifest={created:new Date().toISOString(),tables:await counts(client)};
  const escaped=value=>String(value).replaceAll('\\','\\\\').replaceAll(':','\\:');
  const host=socket||url.hostname,port=url.port||'5432',database=decodeURIComponent(url.pathname.slice(1)||'postgres');
  const username=decodeURIComponent(url.username)||userInfo().username;
  const passfile=join(temporary,'pgpass');
  await writeFile(passfile,[host,port,database,username,decodeURIComponent(url.password)].map(escaped).join(':')+'\n',{mode:0o600});
  const directory=join(home,'backups');await mkdir(directory,{recursive:true,mode:0o700});
  const target=join(directory,manifest.created.replace(/[:.]/g,'-')+'.aes');
  partial=target+'.partial';
  const iv=randomBytes(12);await writeFile(partial,Buffer.concat([Buffer.from('A4TBK1'),iv]),{flag:'wx',mode:0o600});
  const task=childProcess('pg_dump',['--no-password','--format=custom','--no-owner','--no-privileges','--schema=studio_app','--schema=auth','--snapshot='+snapshot],{
   PGHOST:host,PGPORT:port,PGDATABASE:database,PGUSER:username,PGPASSFILE:passfile,
   PGSSLMODE:local?'disable':'verify-full',PGSSLROOTCERT:caPath,PGCONNECT_TIMEOUT:'15'
  });
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  await Promise.all([pipeline(task.child.stdout,cipher,createWriteStream(partial,{flags:'a'})),task.done]);
  await appendFile(partial,cipher.getAuthTag());
  await client.query('COMMIT');
  await rename(partial,target);partial=null;
  await writeFile(target+'.json',JSON.stringify(manifest,null,2),{mode:0o600});
  await run(process.execPath,[fileURLToPath(import.meta.url),'verify',target],{STUDIO_BACKUP_HOME:home});
  await writeFile(target+'.verified',new Date().toISOString(),{mode:0o600});
  for(const name of await readdir(directory)){
   if(!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.aes$/.test(name))continue;
   const old=join(directory,name);
   if((await stat(old)).mtimeMs<Date.now()-30*86400000){
    for(const suffix of ['', '.json', '.verified'])await rm(old+suffix,{force:true});
   }
  }
  console.log(target);
 }finally{
  await client.end();
  if(partial)await rm(partial,{force:true});
  await rm(temporary,{recursive:true,force:true});
 }
}else if(command==='verify'){
 const file=process.argv[3];
 if(!file)throw Error('Provide the encrypted backup path to verify.');
 const info=await stat(file),header=Buffer.alloc(18),tag=Buffer.alloc(16);
 const {open}=await import('node:fs/promises');
 const handle=await open(file,'r');
 try{await handle.read(header,0,18,0);await handle.read(tag,0,16,info.size-16);}finally{await handle.close();}
 if(header.subarray(0,6).toString()!=='A4TBK1')throw Error('Unrecognized backup format.');
 const manifest=JSON.parse(await readFile(file+'.json','utf8'));
 const temporary=await mkdtemp(join(tmpdir(),'a4t-restore-'));
 const cluster=join(temporary,'db');let started=false,client;
 try{
  await run('initdb',['-D',cluster,'-A','trust','--no-locale','--encoding=UTF8']);
  try{await run('pg_ctl',['-D',cluster,'-o',"-h '' -k "+temporary,'-l',join(temporary,'postgres.log'),'start']);}
  catch(error){throw new Error(error.message+'\n'+await readFile(join(temporary,'postgres.log'),'utf8'));}
  started=true;
  const environment={PGHOST:temporary,PGPORT:'5432',PGUSER:userInfo().username,PGSSLMODE:'disable'};
  const archive=childProcess('pg_restore',['--no-owner','--no-privileges','--file=-']);
  const restore=childProcess('psql',['--no-password','--dbname=postgres','-v','ON_ERROR_STOP=1'],environment);
  restore.child.stdout.resume();
  const decipher=createDecipheriv('aes-256-gcm',key,header.subarray(6));decipher.setAuthTag(tag);
  await Promise.all([
   pipeline(createReadStream(file,{start:18,end:info.size-17}),decipher,archive.child.stdin),
   pipeline(portableSQL(archive.child.stdout),restore.child.stdin),
   archive.done,restore.done
  ]);
  client=new pg.Client({host:temporary,database:'postgres',user:userInfo().username});await client.connect();
  const restored=await counts(client);
  if(JSON.stringify(restored)!==JSON.stringify(manifest.tables))throw Error('Restored table counts differ from the backup snapshot.');
  console.log(JSON.stringify({backup:basename(file),restoredTables:Object.keys(restored).length,verified:true}));
 }finally{
  if(client)await client.end();
  if(started)await run('pg_ctl',['-D',cluster,'-m','immediate','stop']);
  await rm(temporary,{recursive:true,force:true});
 }
}else{
 throw Error('Use backup or verify <encrypted-file>.');
}
