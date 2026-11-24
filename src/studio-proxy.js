import {featuredCreators} from '../studio/creators.mjs';

const upstreamOrigin = 'https://studio.askfortask.co.uk';
function unavailable(path, method) {
 const headers = {'Cache-Control':'no-store', 'Retry-After':'60'};
 if (method === 'GET' && path === '/studio/api/directory') {
  return Response.json(featuredCreators, {headers:{...headers, 'X-Studio-Directory':'featured'}});
 }
 const message = 'Studio is temporarily busy. Wait a minute and try again.';
 if (path.startsWith('/studio/api/')) return Response.json({error:message}, {status:503,headers});
 return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><title>Studio temporarily busy</title><main><h1>Studio is temporarily busy</h1><p>Wait a minute and try again.</p><p><a href="/studio/#directory">Back to Creator Studio</a> · <a href="/contact/">Contact A4T Studio</a></p></main></html>', {status:503,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}

// A fixed upstream and bounded bodies: this is not an arbitrary URL proxy.
export async function proxyStudio(request, readBody, fetcher=fetch) {
 const url=new URL(request.url);
 const writing=!['GET','HEAD'].includes(request.method);
 if(writing && (request.headers.get('origin')!==url.origin || request.headers.get('sec-fetch-site')==='cross-site')) {
  return Response.json({error:'Please submit from the A4T website.'},{status:403});
 }
 if (request.method === 'GET' && url.pathname === '/studio/api/session' &&
     !/(?:^|;\s*)studio_session=/.test(request.headers.get('cookie') || '')) {
  return Response.json({member:null,hosted:true,operator:false,liveAI:false}, {headers:{'Cache-Control':'no-store'}});
 }
 const headers=new Headers({Accept:request.headers.get('accept')||'*/*'});
 const cookies=(request.headers.get('cookie')||'').split(';').map(item=>item.trim()).filter(item=>/^studio_(?:session|verified)=/.test(item));
 if(cookies.length) headers.set('Cookie',cookies.join('; '));
 if(writing) headers.set('Origin',upstreamOrigin);
 if(request.headers.has('content-type')) headers.set('Content-Type',request.headers.get('content-type'));
 try {
  const body=writing && request.body ? await readBody(request,100000) : undefined;
  const response=await fetcher(upstreamOrigin+url.pathname+url.search, {method:request.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(75000)});
  const json = response.headers.get('content-type')?.startsWith('application/json');
  const unexpectedResponse = url.pathname.startsWith('/studio/api/') && !json &&
    !(url.pathname.startsWith('/studio/api/avatar/') && response.ok && response.headers.get('content-type')?.startsWith('image/'));
  if (response.headers.has('cf-mitigated') || response.headers.get('x-render-routing')?.startsWith('hibernate') ||
      (response.status >= 500 && !json) || unexpectedResponse) {
   await response.body?.cancel();
   return unavailable(url.pathname, request.method);
  }
  const resultHeaders=new Headers(response.headers);
  resultHeaders.set('Cache-Control','no-store');
  return new Response(response.body,{status:response.status,headers:resultHeaders});
 } catch(error) {
  if (error.status === 413) return Response.json({error:'That request is too large.'},{status:413,headers:{'Cache-Control':'no-store'}});
  return unavailable(url.pathname, request.method);
 }
}
