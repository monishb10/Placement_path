import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

// Real Worker routes and D1, with all GitHub traffic mocked. No real accounts,
// OAuth apps, tokens, repositories, or student records are accessed.
const origin = 'https://study.example';
const vaultKey = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
const bundle = await build({stdin: {resolveDir: process.cwd(), sourcefile: 'multiuser-test.ts', contents: `
  import {startGitHubSignIn,finishGitHubSignIn,signOutGitHub} from './lib/github-auth';
  import {getStudyUser} from './app/auth';
  import * as study from './app/api/study/route';
  import * as coding from './app/api/coding/route';
  import * as github from './app/api/github/route';
  import {newSession} from './lib/study-data';
  import {practiceById} from './lib/coding-bank';
  export default {async fetch(request) {
    globalThis.currentRequest=request;
    const path=new URL(request.url).pathname;
    if(path==='/api/auth/github')return startGitHubSignIn(request);
    if(path==='/api/auth/github/callback')return finishGitHubSignIn(request);
    if(path==='/api/auth/logout')return signOutGitHub(request);
    if(path==='/identity')return Response.json(await getStudyUser(request));
    if(path==='/fixture')return Response.json({task:practiceById.variables,session:newSession('2026-09-16','variables')});
    const module=path==='/api/study'?study:path==='/api/coding'?coding:github;
    return module[request.method](request);
  }};
`}, plugins: [{name: 'request-context', setup(builder) {
  builder.onResolve({filter: /^next\/headers$/}, () => ({path: 'headers', namespace: 'test'}));
  builder.onResolve({filter: /chatgpt-auth$/}, () => ({path: 'chatgpt', namespace: 'test'}));
  builder.onLoad({filter: /.*/, namespace: 'test'}, args => ({loader: 'js', contents: args.path === 'chatgpt' ? 'export async function getChatGPTUser(){return null;}' : `export async function cookies(){return {get(name){const values=(globalThis.currentRequest.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(name+'='));return values.length===1?{value:values[0].slice(name.length+1)}:undefined;}};}`}));
}}], external: ['cloudflare:workers'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022'});
const tokens = {Alice:'github_pat_alice_test_only_1234567890',Bob:'github_pat_bob_test_only_1234567890'};
const ids = {Alice:101,Bob:202};
const files = new Map(), writes = [];
let identityName = 'Alice', codeExchanges = 0, expectedVerifier;
const mf = new Miniflare({modules: true, compatibilityDate: '2026-05-15', compatibilityFlags: ['nodejs_compat'], script: bundle.outputFiles[0].text,
  d1Databases: {DB: 'test-study-db'}, bindings: {PLACEMENT_AUTH_MODE:'github',PLACEMENT_PUBLIC_ORIGIN:origin,PLACEMENT_GITHUB_CLIENT_ID:'test-client',PLACEMENT_GITHUB_CLIENT_SECRET:'test-secret',PLACEMENT_GITHUB_VAULT_KEY:vaultKey},
  outboundService: async request => {
    const url = new URL(request.url);
    if (url.href === 'https://github.com/login/oauth/access_token') {
      assert.equal(request.method,'POST');
      const body = new URLSearchParams(await request.text());
      assert.equal(body.get('client_id'),'test-client');assert.equal(body.get('client_secret'),'test-secret');
      assert.equal(body.get('redirect_uri'),origin+'/api/auth/github/callback');
      assert.equal(body.get('code_verifier'),expectedVerifier);codeExchanges++;
      return Response.json({access_token:'oauth-test-'+identityName,token_type:'bearer'});
    }
    assert.equal(url.origin,'https://api.github.com','Only expected GitHub API calls are allowed');
    const token = request.headers.get('Authorization')?.slice(7);
    const name = token?.startsWith('oauth-test-') ? token.slice('oauth-test-'.length) : Object.keys(tokens).find(key=>tokens[key]===token);
    assert.ok(name,'Unknown credential');
    if (url.pathname === '/user') return Response.json({id:ids[name],login:name,name:name+' Student',type:'User'});
    const match = url.pathname.match(/^\/repos\/([^/]+)\/([^/]+)(.*)$/);
    assert.ok(match);assert.equal(match[1],name,'A credential cannot be used for another student’s repository');
    const [,owner,repo,suffix] = match;
    if (!suffix) return Response.json({full_name:`${owner}/${repo}`,default_branch:'main',permissions:{push:true}});
    assert.ok(suffix.startsWith('/contents/placement-path/'));
    const key = `${owner}/${repo}${suffix}`;
    if (request.method === 'PUT') {
      const body = await request.json();assert.equal(body.branch,'main');
      const old = files.get(key);if(old)assert.equal(body.sha,old.sha);
      const sha = String(writes.length+1).padStart(40,'a');
      files.set(key,{type:'file',encoding:'base64',sha,content:body.content});writes.push({repository:`${owner}/${repo}`,code:Buffer.from(body.content,'base64').toString()});
      return Response.json({content:{sha},commit:{sha:String(writes.length).padStart(40,'b')}},{status:201});
    }
    return files.has(key)?Response.json(files.get(key)):Response.json({message:'Not found'},{status:404});
  },
});
const cookie = (response,name) => response.headers.getSetCookie().find(value=>value.startsWith(name+'='))?.split(';')[0];
const hash = async text => Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))).toString('base64url');
async function request(path,{method='GET',body,cookie:session,account,...more}={}) {
  return mf.dispatchFetch(origin+path,{method,redirect:'manual',headers:{'Content-Type':'application/json',Origin:origin,'sec-fetch-site':'same-origin',...(session?{Cookie:session}:{}),...(account?{'X-Placement-Account':account}:{}),...more},...(body?{body:JSON.stringify(body)}:{})});
}
async function begin() {
  const response = await request('/api/auth/github');assert.equal(response.status,303);
  const url = new URL(response.headers.get('Location'));assert.equal(url.origin,'https://github.com');
  assert.equal(url.searchParams.get('scope'),'read:user');assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  const stateCookie = cookie(response,'__Host-placement_oauth');assert.ok(stateCookie);
  const value = stateCookie.split('=')[1], [state,verifier] = value.split('.');
  assert.equal(url.searchParams.get('state'),state);assert.equal(url.searchParams.get('code_challenge'),await hash(verifier));
  assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);assert.match(response.headers.get('set-cookie'),/Secure/);
  return {stateCookie,state,verifier};
}
async function login(name,flow=undefined) {
  const f=flow??await begin();identityName=name;expectedVerifier=f.verifier;
  const response=await request('/api/auth/github/callback?code=mock-code&state='+f.state,{cookie:f.stateCookie});
  assert.equal(response.status,303);assert.equal(response.headers.get('Location'),origin+'/');
  assert.ok(response.headers.get('set-cookie').includes('Max-Age=604800'));
  return {cookie:cookie(response,'__Host-placement_session'),account:'github:'+ids[name]};
}
try {
  const db = await mf.getD1Database('DB');
  const migrations=(await readdir('drizzle')).filter(name=>name.endsWith('.sql')).sort();
  for(const name of migrations) for(const sql of (await readFile('drizzle/'+name,'utf8')).split(';').map(s=>s.replace(/--> statement-breakpoint/g,'').trim()).filter(Boolean)) await db.prepare(sql).run();
  assert.equal((await request('/api/study')).status,401);
  const invalid = await begin();
  assert.match((await request('/api/auth/github/callback?code=x&state=bad',{cookie:invalid.stateCookie})).headers.get('Location'),/expired/);
  assert.equal(codeExchanges,0);
  const expired = await begin();await db.prepare('UPDATE oauth_states SET expires_at=0').run();
  assert.match((await request('/api/auth/github/callback?code=x&state='+expired.state,{cookie:expired.stateCookie})).headers.get('Location'),/expired/);
  assert.equal(codeExchanges,0);
  const flow=await begin(),alice=await login('Alice',flow),bob=await login('Bob');
  const exchanges=codeExchanges;
  assert.match((await request('/api/auth/github/callback?code=x&state='+flow.state,{cookie:flow.stateCookie})).headers.get('Location'),/expired/);
  assert.equal(codeExchanges,exchanges,'An OAuth state can be consumed only once');
  assert.equal((await (await request('/identity',alice)).json()).githubId,'101');
  assert.equal((await (await request('/identity',bob)).json()).githubId,'202');
  const record = await (await request('/api/study',alice)).json();
  record.state.mastered=['variables'];
  assert.equal((await request('/api/study',{...alice,method:'PUT',body:record})).status,200);
  assert.deepEqual((await (await request('/api/study',bob)).json()).state.mastered,[]);
  assert.deepEqual((await (await request('/api/study?userId=github:202',alice)).json()).state.mastered,['variables']);
  assert.equal((await request('/api/study',{...bob,account:alice.account,method:'PUT',body:record})).status,401,'A stale tab cannot save into another signed-in account');
  assert.equal((await request('/api/study',{...bob,account:undefined,method:'PUT',body:record})).status,401);
  assert.equal((await request('/api/study',{cookie:'__Host-placement_session=github:101'})).status,401);
  const connect = (session,name,repository=name+'/DSA') => request('/api/github',{...session,method:'PUT',body:{token:tokens[name],repository}});
  assert.equal((await connect(alice,'Bob')).status,403,'A student cannot connect another account’s token');
  assert.equal((await connect(bob,'Bob','Alice/DSA')).status,403);
  assert.equal((await connect(alice,'Alice')).status,200);assert.equal((await connect(bob,'Bob')).status,200);
  const rows=await db.prepare('SELECT user_id,encrypted_token,repository FROM github_connections').all();
  assert.equal(rows.results.length,2);for(const row of rows.results){assert.ok(row.encrypted_token.startsWith('v2.'));assert.equal(Object.values(tokens).some(token=>row.encrypted_token.includes(token)),false);}
  const fixture=await (await request('/fixture')).json();
  async function saveCode(session,code,version=0) {
    const draft=structuredClone(fixture.session);draft.code=code;draft.explanation='Read the values and print the required fields.';draft.attempted=1;
    const sourceHash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code))).toString('hex');
    draft.judge={sourceHash,passed:fixture.task.cases.length,total:fixture.task.cases.length,accepted:true,mode:'submit',at:new Date().toISOString()};
    const response=await request('/api/coding',{...session,method:'PUT',body:{taskId:'variables',version,session:draft}});
    assert.equal(response.status,200);const result=await response.json();assert.equal(result.github.status,'saved');return result;
  }
  await saveCode(alice,'public class Main { /* Alice draft */ }');
  await saveCode(bob,'public class Main { /* Bob draft */ }');
  assert.deepEqual(writes.map(row=>row.repository),['Alice/DSA','Bob/DSA']);
  assert.ok(writes[0].code.includes('Alice'));assert.ok(writes[1].code.includes('Bob'));
  assert.ok((await (await request('/api/coding?taskId=variables',alice)).json()).session.code.includes('Alice'));
  assert.ok((await (await request('/api/coding?taskId=variables',bob)).json()).session.code.includes('Bob'));
  assert.equal((await connect(alice,'Alice','Alice/Practice')).status,200);
  assert.equal((await (await request('/api/github?taskId=variables',alice)).json()).save,undefined);
  assert.equal((await (await request('/api/github',{...alice,method:'POST',body:{taskId:'variables'}})).json()).save.status,'saved');
  assert.equal(writes.at(-1).repository,'Alice/Practice','Changing repositories must not reuse another destination’s saved badge or blob');
  await db.prepare('UPDATE github_connections SET lock_until=? WHERE user_id=?').bind(Date.now()+45000,alice.account).run();
  assert.equal((await request('/api/github',{...alice,method:'DELETE',body:{}})).status,409);
  assert.equal((await connect(alice,'Alice')).status,409);
  assert.equal((await request('/api/auth/logout',{...bob,method:'POST',Origin:'https://foreign.example'})).status,403);
  assert.equal((await request('/api/auth/logout',{...bob,method:'POST'})).status,303);
  assert.equal((await request('/api/study',bob)).status,401);
  const bobAgain=await login('Bob');assert.ok((await (await request('/api/coding?taskId=variables',bobAgain)).json()).session.code.includes('Bob'));
  await db.prepare('UPDATE auth_sessions SET expires_at=0 WHERE user_id=?').bind(alice.account).run();
  assert.equal((await request('/api/study',alice)).status,401);
  console.log('PASS: GitHub PKCE/state, replay and expiry, secure cookies, sign-out, durable returning users, two-account data isolation, stale tabs, identity-checked repository tokens, separate commits, destination switches and save locks. Every external call was mocked.');
} finally {await mf.dispose();}
