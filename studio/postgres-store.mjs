export async function postgresStore(connectionString){
 const {default:pg}=await import('pg');
 const pool=new pg.Pool({connectionString:connectionString,options:'-c search_path=studio_app',connectionTimeoutMillis:5000,statement_timeout:5000,max:5});
 const query=(q,args)=>{let n=0;return pool.query(q.replaceAll('?',()=>'$'+ ++n),args);};
 const store={all:async(q,a)=>(await query(q,a)).rows,one:async(q,a)=>(await query(q,a)).rows[0],run:async(q,a)=>({changes:(await query(q,a)).rowCount}),close:()=>pool.end()};
 try{await pool.query('SELECT id FROM studio_app.members LIMIT 0');}catch(error){await pool.end();throw error;}
 return store;
}
