import {upgradeSQL} from './schema-upgrades.mjs';
import {resendAlerts} from './enquiry-alerts.mjs';
import {readFile} from 'node:fs/promises';
import {studio} from './server.mjs';
import {postgresStore} from './postgres-store.mjs';

import {hostedAuth} from './hosted-auth.mjs';
if(process.argv.includes('--print-schema')){
 const schema=await readFile(new URL('./schema.sql',import.meta.url),'utf8');
 process.stdout.write('BEGIN;\nCREATE SCHEMA IF NOT EXISTS studio_app;\nSET LOCAL search_path TO studio_app;\n'+schema+'\n'+upgradeSQL()+"\nALTER TABLE projects ADD COLUMN IF NOT EXISTS sequence bigint GENERATED ALWAYS AS IDENTITY;\nALTER TABLE tasks ADD COLUMN IF NOT EXISTS sequence bigint GENERATED ALWAYS AS IDENTITY;\nCOMMIT;\n");
}else{
 const env=process.env;
 const required=['STUDIO_ORIGIN','STUDIO_DATABASE_URL','STUDIO_SUPABASE_URL','STUDIO_SUPABASE_KEY','STUDIO_SUPABASE_ADMIN_KEY'];
 for(const name of required)if(!env[name])throw Error('Missing '+name);
 const origin=new URL(env.STUDIO_ORIGIN);
 if(origin.protocol!=='https:'||origin.origin!==env.STUDIO_ORIGIN)throw Error('STUDIO_ORIGIN must be an HTTPS origin.');
 const redirectOrigins=(env.STUDIO_REDIRECT_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean);
 for(const value of redirectOrigins)if(new URL(value).protocol!=='https:'||new URL(value).origin!==value)throw Error('Use HTTPS origins for Studio redirects.');
 const registrationOpen=env.STUDIO_REGISTRATION==='open';
 const parseEmails=value=>new Set((value||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean));
 const allowedEmails=parseEmails(env.STUDIO_PILOT_EMAILS);
 const operatorEmails=parseEmails(env.STUDIO_OPERATOR_EMAILS);
 for(const email of [...allowedEmails,...operatorEmails])if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Configure valid Studio email addresses.');
 if(!registrationOpen&&!allowedEmails.size)throw Error('Configure pilot inboxes or set STUDIO_REGISTRATION=open.');
 const sendAlert=env.STUDIO_RESEND_KEY?resendAlerts({key:env.STUDIO_RESEND_KEY,from:env.STUDIO_ALERT_FROM,to:env.STUDIO_ALERT_TO,origin:origin.origin}):undefined;
 const auth=hostedAuth({url:env.STUDIO_SUPABASE_URL,key:env.STUDIO_SUPABASE_KEY,admin:env.STUDIO_SUPABASE_ADMIN_KEY});
 const store=await postgresStore(env.STUDIO_DATABASE_URL);
 studio({origin:origin.origin,store,allowedEmails,registrationOpen,operatorEmails,sendAlert,redirectOrigins,auth,apiKey:env.STUDIO_OPENAI_KEY,model:env.STUDIO_OPENAI_MODEL}).listen(Number(env.PORT||8786),'0.0.0.0');
}
