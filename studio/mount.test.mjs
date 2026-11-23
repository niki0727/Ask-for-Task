import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {studio} from './server.mjs';
import {mountData} from './mount.mjs';

test('mounted Studio keeps login, profiles, session cookies and logout on the main website',async t=>{
 const server=studio().listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
 const origin='http://127.0.0.1:'+server.address().port;
 const html=await (await fetch(origin+'/studio/')).text();
 assert.match(html,/name="studio-base" content="\/studio"/);assert.match(html,/src="\/studio\/studio.js"/);
 assert.match(html,/href="\/studio\/privacy\/"/);assert.doesNotMatch(html,/href="\/studio\/\/studio/);
 const access=await fetch(origin+'/studio/api/access',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'mounted@example.com'})});
 const {localLink}=await access.json();assert.match(localLink,/^\/studio\/\?access=/);
 const code=new URL(localLink,origin).searchParams.get('access');
 const verified=await fetch(origin+'/studio/api/verify',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({code})});
 assert.equal(verified.status,200);const cookie=verified.headers.get('set-cookie');assert.match(cookie,/Path=\/studio\//);
 const session=await (await fetch(origin+'/studio/api/session',{headers:{Cookie:cookie.split(';')[0]}})).json();assert.equal(session.member.email,'mounted@example.com');
 const profile=await (await fetch(origin+'/studio/creators/nikita-piazenko')).text();assert.match(profile,/action="\/studio\/api\/enquiries"/);
 const logout=await fetch(origin+'/studio/api/logout',{method:'POST',headers:{Origin:origin,Cookie:cookie.split(';')[0],'Content-Type':'application/json'},body:'{}'});assert.match(logout.headers.get('set-cookie'),/Path=\/studio\/; Max-Age=0/);
 assert.deepEqual(mountData({avatar:'/api/avatar/abc',bio:'/api/avatar/keep-my-words'},'/studio'),{avatar:'/studio/api/avatar/abc',bio:'/api/avatar/keep-my-words'});
});
