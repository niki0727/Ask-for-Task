const upstreamOrigin = 'https://studio.askfortask.co.uk';
// A fixed upstream and bounded bodies: this is not an arbitrary URL proxy.
export async function proxyStudio(request, readBody, fetcher=fetch) {
 const url=new URL(request.url);
 const writing=!['GET','HEAD'].includes(request.method);
 if(writing && (request.headers.get('origin')!==url.origin || request.headers.get('sec-fetch-site')==='cross-site')) {
  return Response.json({error:'Please submit from the A4T website.'},{status:403});
 }
 const headers=new Headers({Accept:request.headers.get('accept')||'*/*'});
 const cookies=(request.headers.get('cookie')||'').split(';').map(item=>item.trim()).filter(item=>/^studio_(?:session|verified)=/.test(item));
 if(cookies.length) headers.set('Cookie',cookies.join('; '));
 if(writing) headers.set('Origin',upstreamOrigin);
 if(request.headers.has('content-type')) headers.set('Content-Type',request.headers.get('content-type'));
 try {
  const body=writing && request.body ? await readBody(request,100000) : undefined;
  const response=await fetcher(upstreamOrigin+url.pathname+url.search, {method:request.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(75000)});
  const resultHeaders=new Headers(response.headers);
  resultHeaders.set('Cache-Control','no-store');
  return new Response(response.body,{status:response.status,headers:resultHeaders});
 } catch(error) {
  const status=error.status===413?413:503;
  return Response.json({error:status===413?'That request is too large.':'Studio is waking up. Please try again in a moment.'},{status,headers:{'Cache-Control':'no-store'}});
 }
}
