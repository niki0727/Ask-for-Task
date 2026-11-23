import test from 'node:test';
import assert from 'node:assert/strict';
import {proxyStudio} from './studio-proxy.js';

test('Studio stays same-site while forwarding only its cookies to the fixed app',async()=>{
 const request=new Request('https://askfortask.co.uk/studio/api/profile',{method:'PUT',headers:{Origin:'https://askfortask.co.uk',Cookie:'other=private; studio_session=abc; studio_verified=proof',Authorization:'Bearer unrelated','Content-Type':'application/json'},body:'{"name":"Test"}'});
 let called;
 const response=await proxyStudio(request,async r=>new Uint8Array(await r.arrayBuffer()),async(url,init)=>{
  called={url,init};return new Response('{"ok":true}',{headers:{'Set-Cookie':'studio_session=new; Path=/studio/; HttpOnly; Secure','Content-Security-Policy':"default-src 'self'"}});
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
