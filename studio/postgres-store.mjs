import {readFileSync} from 'node:fs';

export async function postgresStore(connectionString){
 const {default:pg}=await import('pg');
 const url=new URL(connectionString);
 const local=['','localhost','127.0.0.1','[::1]'].includes(url.hostname);
 for(const key of ['sslmode','sslrootcert','sslcert','sslkey'])url.searchParams.delete(key);
 const ssl=local?false:{rejectUnauthorized:true,ca:readFileSync(new URL('./supabase-ca.crt',import.meta.url),'utf8')};
 const pool=new pg.Pool({connectionString:url.href,ssl,options:'-c search_path=studio_app',connectionTimeoutMillis:5000,statement_timeout:5000,max:5});
 const query=(q,args)=>{let n=0;return pool.query(q.replaceAll('?',()=>'$'+ ++n),args);};
 const store={all:async(q,a)=>(await query(q,a)).rows,one:async(q,a)=>(await query(q,a)).rows[0],run:async(q,a)=>({changes:(await query(q,a)).rowCount}),close:()=>pool.end()};
 try{
  await pool.query(`SELECT creator_enquiries.notification_sent, creator_enquiries.review_status, members.id, members.details, creator_avatars.owner, projects.sequence, tasks.sequence
   FROM creator_avatars, members, links, sessions, creator_specialties, creator_work, creator_enquiries, projects, tasks
   LIMIT 0`);
 }catch(error){
  await pool.end();
  throw new Error('Studio database is unavailable or missing the current schema.',{cause:error});
 }
 return store;
}
