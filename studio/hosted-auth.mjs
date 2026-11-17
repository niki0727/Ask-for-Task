export function hostedAuth({url,key,admin,fetcher=fetch}){
 const base=new URL(url);
 if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co')||base.origin!==url)throw Error('Use the HTTPS Supabase project origin.');
 async function request(path,method,data,credential=key,privileged=false){
  const r=await fetcher(base.origin+'/auth/v1/'+path,{method,headers:{
   apikey:privileged?admin:key,...(credential!==key&&!(privileged&&admin.startsWith('sb_secret_'))?{Authorization:'Bearer '+credential}:{}),'Content-Type':'application/json'
  },body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Object.assign(Error(r.status===429?'Please wait before trying again.':'Studio account request could not be completed. Check your link or credentials.'),{status:r.status===429?429:r.status>=500?502:400});
  return r.status===204?null:r.json();
 }
 const session=async promise=>{
  const s=await promise;
  if(!s?.user?.email_confirmed_at||!s.user.email||!s.user.id||!s.access_token)throw Object.assign(Error('Verify your email first.'),{status:403});
  s.user.email=s.user.email.toLowerCase();return s;
 };
 return {
  send:(email,name)=>request('otp','POST',{email,data:{name},create_user:true}),
  verify:code=>session(request('verify','POST',{token_hash:code,type:'email'})),
  login:(email,password)=>session(request('token?grant_type=password','POST',{email,password})),
  async password(proof,id,password){
   const u=await request('user','GET',null,proof);
   if(u.id!==id)throw Object.assign(Error('Open a fresh email link.'),{status:403});
   return request('user','PUT',{password},proof);
  },
  remove:id=>request('admin/users/'+encodeURIComponent(id),'DELETE',null,admin,true)
 };
}
