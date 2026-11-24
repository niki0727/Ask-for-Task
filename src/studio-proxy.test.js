import test from 'node:test';
import assert from 'node:assert/strict';
import {proxyStudio} from './studio-proxy.js';

test('Studio stays same-site while forwarding only its cookies to the fixed app',async()=>{
 const request=new Request('https://askfortask.co.uk/studio/api/profile',{method:'PUT',headers:{Origin:'https://askfortask.co.uk',Cookie:'other=private; studio_session=abc; studio_verified=proof',Authorization:'Bearer unrelated','Content-Type':'application/json'},body:'{"name":"Test"}'});
 let called;
 const response=await proxyStudio(request,async r=>new Uint8Array(await r.arrayBuffer()),async(url,init)=>{
  called={url,init};return new Response('{"ok":true}',{headers:{'Content-Type':'application/json','Set-Cookie':'studio_session=new; Path=/studio/; HttpOnly; Secure','Content-Security-Policy':"default-src 'self'"}});
 });
 assert.equal(called.url,'https://studio.askfortask.co.uk/studio/api/profile');
 assert.equal(called.init.headers.get('origin'),'https://studio.askfortask.co.uk');
 assert.equal(called.init.headers.get('cookie'),'studio_session=abc; studio_verified=proof');
 assert.equal(called.init.headers.get('authorization'),null);
 assert.match(response.headers.get('set-cookie'),/Path=\/studio\//);
 assert.equal(response.headers.get('cache-control'),'no-store');
});
test('Studio rejects cross-site writes and handles cold-start failures without leaking errors',async()=>{
 let called=false;const fetcher=async()=>{called=true;throw Error('private infrastructure details');};
 const request=origin=>new Request('https://askfortask.co.uk/studio/api/access',{method:'POST',headers:{Origin:origin},body:'{}'});
 assert.equal((await proxyStudio(request('https://untrusted.example'),async()=>new Uint8Array(),fetcher)).status,403);
 assert.equal(called,false);
 const failed=await proxyStudio(request('https://askfortask.co.uk'),async()=>new Uint8Array(),fetcher);
 assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/private infrastructure/);
 const large=await proxyStudio(request('https://askfortask.co.uk'),async()=>{throw Object.assign(Error(),{status:413});},fetcher);
 assert.equal(large.status,413);
});
test('the Worker preserves Studio API paths instead of adding page trailing slashes',async()=>{
 const {default:worker}=await import('./worker.js');const previous=globalThis.fetch;let target;
 globalThis.fetch=async(url)=>{target=url;return Response.json({member:null});};
 try{
  const response=await worker.fetch(new Request('https://askfortask.co.uk/studio/api/session',{headers:{Cookie:'studio_session=test'}}),{});
  assert.equal(response.status,200);assert.equal(target,'https://studio.askfortask.co.uk/studio/api/session');
 }finally{globalThis.fetch=previous;}
});

test('Render startup challenges stay out of the Studio UI and public discovery has a fallback', async()=>{
 const challenge=async()=>new Response('<h1>Just a moment</h1>',{status:429,headers:{'CF-Mitigated':'challenge','X-Render-Routing':'hibernate-rate-limited','Content-Type':'text/html'}});
 const directory=await proxyStudio(new Request('https://askfortask.co.uk/studio/api/directory'),null,challenge);
 assert.equal(directory.headers.get('X-Studio-Directory'),'featured');
 assert((await directory.json()).some(person=>person.id==='nikita-piazenko'));
 const verify=new Request('https://askfortask.co.uk/studio/api/verify',{
  method:'POST',headers:{Origin:'https://askfortask.co.uk','Content-Type':'application/json'},body:'{}'
 });
 const unavailable=await proxyStudio(verify,async()=>new Uint8Array(),challenge);
 assert.equal(unavailable.status,503);
 assert.equal(unavailable.headers.get('Retry-After'),'60');
 assert.match((await unavailable.json()).error,/temporarily busy/);
 const limited=await proxyStudio(new Request('https://askfortask.co.uk/studio/api/directory'),null,
  async()=>Response.json({error:'Please wait before trying again.'},{status:429}));
 assert.equal(limited.status,429);
});

test('public Studio pages and signed-out session checks avoid the sleeping backend',async()=>{
 const {default:worker}=await import('./worker.js');
 const env={ASSETS:{fetch:async req=>new Response(new URL(req.url).pathname)}};
 const page=await worker.fetch(new Request('https://askfortask.co.uk/studio/?discipline=photography'),env);
 assert.equal(await page.text(),'/_studio-shell/');
 assert.match(page.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
 const session=await worker.fetch(new Request('https://askfortask.co.uk/studio/api/session'),env);
 assert.equal((await session.json()).member,null);
 const internal=await worker.fetch(new Request('https://askfortask.co.uk/_studio-shell/'),env);
 assert.equal(internal.status,404);
});

test('Studio email requests go directly to Auth and only confirm a successful send', async t => {
 const {default:worker}=await import('./worker.js');
 let attempts=0;
 let allowed=true;
 let providerStatus=200;
 const env={
  STUDIO_AUTH_URL:'https://example.supabase.co',
  STUDIO_AUTH_PUBLISHABLE_KEY:'test-publishable-key',
  STUDIO_ACCESS_LIMIT:{limit:async()=>({success:allowed})}
 };
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  attempts++;
  assert.equal(url,'https://example.supabase.co/auth/v1/otp');
  assert.equal(options.headers.apikey,'test-publishable-key');
  assert.equal(JSON.parse(options.body).email,'creator@example.com');
  return Response.json({}, {status:providerStatus});
 });
 const send=(email,origin='https://askfortask.co.uk')=>worker.fetch(
  new Request('https://askfortask.co.uk/studio/api/access',{
   method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email})
  }),env
 );
 assert.equal((await send('creator@example.com','https://example.org')).status,403);
 assert.equal((await send('invalid')).status,400);
 assert.equal(attempts,0);
 assert.deepEqual(await (await send('Creator@example.com')).json(),{sent:true});
 providerStatus=429;
 const throttled=await send('creator@example.com');
 assert.equal(throttled.status,429);
 assert.equal(throttled.headers.get('Retry-After'),'60');
 allowed=false;
 assert.equal((await send('creator@example.com')).status,429);
 assert.equal(attempts,2);
});

test('featured creator profiles load from public assets with or without a trailing slash',async()=>{
 const {default:worker}=await import('./worker.js');
 const env={ASSETS:{fetch:async req=>new Response(new URL(req.url).pathname)}};
 for(const suffix of ['', '/']){
  const r=await worker.fetch(new Request('https://askfortask.co.uk/studio/creators/nikita-piazenko'+suffix),env);
  assert.equal(r.status,200);
  assert.equal(await r.text(),'/_studio-shell/creators/nikita-piazenko');
  assert.equal(r.headers.get('X-Robots-Tag'),'noindex');
 }
});
