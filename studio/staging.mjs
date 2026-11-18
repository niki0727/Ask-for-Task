import {readFile} from 'node:fs/promises';
import {studio} from './server.mjs';
import {postgresStore} from './postgres-store.mjs';

import {hostedAuth} from './hosted-auth.mjs';
if(process.argv.includes('--print-schema')){
 const schema=await readFile(new URL('./schema.sql',import.meta.url),'utf8');
 process.stdout.write('BEGIN;\nCREATE SCHEMA IF NOT EXISTS studio_app;\nSET LOCAL search_path TO studio_app;\n'+schema+'\nALTER TABLE projects ADD COLUMN IF NOT EXISTS sequence bigint GENERATED ALWAYS AS IDENTITY;\nALTER TABLE tasks ADD COLUMN IF NOT EXISTS sequence bigint GENERATED ALWAYS AS IDENTITY;\nCOMMIT;\n');
}else{
 const env=process.env;
 const required=['STUDIO_ORIGIN','STUDIO_PILOT_EMAILS','STUDIO_DATABASE_URL','STUDIO_SUPABASE_URL','STUDIO_SUPABASE_KEY','STUDIO_SUPABASE_ADMIN_KEY'];
 for(const name of required)if(!env[name])throw Error('Missing '+name);
 const origin=new URL(env.STUDIO_ORIGIN);
 if(origin.protocol!=='https:'||origin.origin!==env.STUDIO_ORIGIN)throw Error('STUDIO_ORIGIN must be an HTTPS origin.');
 const allowedEmails=new Set(env.STUDIO_PILOT_EMAILS.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean));
 if(!allowedEmails.size||[...allowedEmails].some(email=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw Error('STUDIO_PILOT_EMAILS must list valid test inboxes.');
 const auth=hostedAuth({url:env.STUDIO_SUPABASE_URL,key:env.STUDIO_SUPABASE_KEY,admin:env.STUDIO_SUPABASE_ADMIN_KEY});
 const store=await postgresStore(env.STUDIO_DATABASE_URL);
 studio({origin:origin.origin,store,allowedEmails,auth}).listen(Number(env.PORT||8786),'0.0.0.0');
}
