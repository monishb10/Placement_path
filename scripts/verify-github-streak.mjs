import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';
import initSqlJs from 'sql.js';

// Exercise real route handlers and SQL migrations; all GitHub requests are mocked.
const dir=path.resolve('.sites-runtime/github-verification');await mkdir(dir,{recursive:true});
globalThis.crypto??=webcrypto;
const secret=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
globalThis.testEnv={PLACEMENT_GITHUB_VAULT_KEY:secret};globalThis.testUser={userId:'learner-a'};
await writeFile(path.join(dir,'runtime.mjs'),`export const env=globalThis.testEnv;export const studyDb=()=>globalThis.testDb;export const getStudyUser=async()=>globalThis.testUser;`);
async function compile(file,name=path.basename(file,'.ts')){
  let source=await readFile(file,'utf8');
  source=source.replace(/from ['"]([^'"]+)['"]/g,(all,spec)=>{
    if(['cloudflare:workers','@/db/study-store','@/app/auth'].includes(spec))return "from './runtime.mjs'";
    if(spec.startsWith('./')||spec.startsWith('@/lib/'))return `from './${path.basename(spec)}.mjs'`;
    return all;
  });
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  await writeFile(path.join(dir,name+'.mjs'),js);return ()=>import(pathToFileURL(path.join(dir,name+'.mjs')).href);
}
const data=await(await compile('lib/study-data.ts'))();
const coding=await(await compile('lib/coding-tasks.ts'))();
const generated=JSON.parse(await readFile('lib/coding-bank.generated.json','utf8'));
const task={...coding.codingTasks.variables,topicId:'variables',number:1,language:'java',title:'Java variables'};
const sqlTask=generated.find(t=>t.language==='sql');
await writeFile(path.join(dir,'coding-bank.mjs'),`export const practiceById=${JSON.stringify({[task.id]:task,[sqlTask.id]:sqlTask})};export const codingTopics=[{id:'variables'},{id:'sql'}];`);
for(const name of ['judge-types','github-types','github-identity','github-client','github-vault','github-connection-store','github-sync','dashboard-data','study-validation'])await compile(`lib/${name}.ts`);
const github=await(await compile('app/api/github/route.ts','github-route'))();
const drafts=await(await compile('app/api/coding/route.ts','coding-route'))();
const {sourceHash}=await import(pathToFileURL(path.join(dir,'judge-types.mjs')).href);
const {acceptedSource}=await import(pathToFileURL(path.join(dir,'github-sync.mjs')).href);
const {encryptGitHubToken,decryptGitHubToken}=await import(pathToFileURL(path.join(dir,'github-vault.mjs')).href);
const {solutionPath}=await import(pathToFileURL(path.join(dir,'github-client.mjs')).href);
const {dashboardStats}=await import(pathToFileURL(path.join(dir,'dashboard-data.mjs')).href);
const SQL=await initSqlJs({locateFile:f=>path.resolve('node_modules/sql.js/dist',f)}),db=new SQL.Database();
for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())db.run(await readFile('drizzle/'+f,'utf8'));
let failSavedRecord=false;
const adapter={prepare(sql){return {args:[],bind(...args){this.args=args;return this;},async run(){
  if(failSavedRecord&&sql.startsWith('INSERT INTO github_saves')){failSavedRecord=false;throw Error('simulated database interruption');}
  db.run(sql,this.args);return {meta:{changes:db.getRowsModified()}};
},async all(){const s=db.prepare(sql);s.bind(this.args);const rows=[];while(s.step())rows.push(s.getAsObject());s.free();return {results:rows};},async first(){return (await this.all()).results[0]??null;}};},async batch(items){db.run('BEGIN');try{const rows=[];for(const item of items)rows.push(await item.run());db.run('COMMIT');return rows;}catch(error){db.run('ROLLBACK');throw error;}}};
globalThis.testDb=adapter;
const api='https://api.github.com/repos/Muthudeenathayalan/DSA',files=new Map();let commits=0,requests=0,forcedStatus=0;
const token='github_pat_example_for_mock_tests_1234567890';
globalThis.fetch=async(url,init={})=>{
  requests++;if(url==='https://api.github.com/user')return Response.json({id:123,login:'Muthudeenathayalan',name:'Muthu',type:'User'});assert.ok(String(url).startsWith(api),'unexpected network destination');
  assert.equal(init.redirect,'manual');assert.equal(init.headers.Authorization,`Bearer ${token}`);
  if(forcedStatus)return Response.json({message:'private provider diagnostic'},{status:forcedStatus});
  if(url===api)return Response.json({full_name:'Muthudeenathayalan/DSA',default_branch:'master',permissions:{push:true}});
  const p=String(url).slice(api.length).split('?')[0];
  if(init.method==='PUT'){
    const body=JSON.parse(init.body),old=files.get(p);assert.equal(body.branch,'master');
    if(old)assert.equal(body.sha,old.sha,'updates must use the latest known SHA');else assert.equal(body.sha,undefined);
    assert.equal(body.author,undefined);assert.equal(body.committer,undefined);
    commits++;const sha=String(commits).padStart(40,'a');files.set(p,{type:'file',encoding:'base64',sha,content:body.content});
    return Response.json({content:{sha},commit:{sha:String(commits).padStart(40,'b')}},{status:old?200:201});
  }
  return files.has(p)?Response.json(files.get(p)):Response.json({message:'Not found'},{status:404});
};
const req=(method,body={},query='')=>new Request('https://study.example/api/test'+query,{method,headers:{'Content-Type':'application/json','sec-fetch-site':'same-origin'},...(method==='GET'?{}:{body:JSON.stringify({...body,...(body.token?{repository:'Muthudeenathayalan/DSA'}:{})})})});
const body=async response=>{const value=await response.json();assert.equal(JSON.stringify(value).includes(token),false,'API must never expose credentials');return value;};

// Auth, connection isolation, encryption, and default-branch discovery.
globalThis.testUser=null;assert.equal((await github.GET(req('GET'))).status,401);globalThis.testUser={userId:'learner-a'};
const foreign=req('PUT',{token});foreign.headers.set('sec-fetch-site','cross-site');assert.equal((await github.PUT(foreign)).status,403);
let response=await github.PUT(req('PUT',{token}));assert.equal(response.status,200);assert.equal((await body(response)).branch,'master');assert.equal(commits,0);
const encrypted=(await adapter.prepare('SELECT encrypted_token FROM github_connections').first()).encrypted_token;
assert.equal(encrypted.includes(token),false);assert.equal(await decryptGitHubToken(encrypted,'learner-a',secret),token);
await assert.rejects(()=>decryptGitHubToken(encrypted,'learner-b',secret));
// Existing private-site connections use v1 encryption and must survive upgrade.
const legacyIv=crypto.getRandomValues(new Uint8Array(12));
const legacyKey=await crypto.subtle.importKey('raw',Buffer.from(secret,'base64'),{name:'AES-GCM'},false,['encrypt']);
const legacyBytes=await crypto.subtle.encrypt({name:'AES-GCM',iv:legacyIv,additionalData:new TextEncoder().encode('placement-path:github:Muthudeenathayalan/DSA:learner-a')},legacyKey,new TextEncoder().encode(token));
const legacyToken=`v1.${Buffer.from(legacyIv).toString('base64')}.${Buffer.from(legacyBytes).toString('base64')}`;
assert.equal(await decryptGitHubToken(legacyToken,'learner-a',secret),token);
await assert.rejects(()=>decryptGitHubToken(legacyToken,'learner-a',secret,'another-user/DSA'));
assert.notEqual(await encryptGitHubToken(token,'learner-a',secret),encrypted);
assert.equal(solutionPath(sqlTask).endsWith('/query.sql'),true);
assert.throws(()=>solutionPath({...task,topicId:'../outside'}));

let session=data.newSession('2026-09-10',task.topicId),version=0;
session.code='public class Main { /* café ☕ */ }';session.explanation='Read the input and compute the answer.';session.attempted=1;
async function save(){const response=await drafts.PUT(req('PUT',{taskId:task.id,version,session}));const value=await body(response);assert.equal(response.status,200,JSON.stringify(value));version=value.version;return value;}
async function accepted(){session.judge={sourceHash:await sourceHash(session.code),passed:task.cases.length,total:task.cases.length,accepted:true,mode:'submit',at:new Date().toISOString()};}
await save();assert.equal(commits,0,'drafts do not commit');
session.judge={sourceHash:await sourceHash(session.code),passed:2,total:2,accepted:false,mode:'samples',at:new Date().toISOString()};await save();assert.equal(commits,0,'passing samples do not commit');
await accepted();session.code+=' // edited after tests';assert.equal(await acceptedSource(session,task),null);assert.equal((await save()).accepted,0);assert.equal(commits,0,'stale results do not commit');
await accepted();let saved=await save();assert.equal(saved.github.status,'saved');assert.equal(commits,1);
const destination='/contents/placement-path/variables/problem-01/Main.java';
assert.equal(Buffer.from(files.get(destination).content,'base64').toString('utf8'),session.code,'save source verbatim, including Unicode');
const countBefore=requests;await save();assert.equal(commits,1,'identical accepted submissions are idempotent');assert.equal(requests,countBefore);
session.code+='\n// another accepted approach';await accepted();await save();assert.equal(commits,2,'changed accepted code updates one file');
session.judge.accepted=false;session.judge.passed--;await save();assert.equal(commits,2,'failed tests do not commit');
session.code+='\n// token failure';await accepted();forcedStatus=401;saved=await save();assert.equal(saved.github.status,'error');assert.equal(saved.accepted,1);assert.match(saved.github.message,/expired|revoked/);assert.equal(commits,2);forcedStatus=0;
assert.equal((await adapter.prepare('SELECT version FROM coding_attempts WHERE user_id=? AND task_id=?').bind('learner-a',task.id).first()).version,version,'GitHub failure preserves study progress');
saved=await body(await github.POST(req('POST',{taskId:task.id})));assert.equal(saved.save.status,'saved');assert.equal(commits,3);

// Retry after the provider saved but the local confirmation failed makes no duplicate commit.
session.code+='\n// confirmation retry';await accepted();failSavedRecord=true;saved=await save();assert.equal(saved.github.status,'error');assert.equal(commits,4);
saved=await body(await github.POST(req('POST',{taskId:task.id})));assert.equal(saved.save.status,'saved');assert.equal(commits,4);
// External edits are not overwritten, and concurrent requests serialize through a lease.
const previousFile=files.get(destination);files.set(destination,{...previousFile,sha:'external-change',content:Buffer.from('// edited in GitHub').toString('base64')});
session.code+='\n// conflict';await accepted();saved=await save();assert.equal(saved.github.status,'error');assert.match(saved.github.message,/outside Placement Path/);assert.equal(commits,4);files.set(destination,previousFile);
db.run('UPDATE github_connections SET lock_until=?',[Date.now()+45000]);saved=await body(await github.POST(req('POST',{taskId:task.id})));assert.equal(saved.save.status,'busy');assert.equal(commits,4);
db.run('UPDATE github_connections SET lock_until=0');saved=await body(await github.POST(req('POST',{taskId:task.id})));assert.equal(saved.save.status,'saved');assert.equal(commits,5);

// Activity is durable across dates and has one row per user/day, independent of problem edits.
session.date='2026-09-11';await save();await save();let rows=await body(await drafts.GET(req('GET')));assert.deepEqual(rows.activityDates.sort(),['2026-09-10','2026-09-11']);
assert.equal((await adapter.prepare('SELECT count(*) AS n FROM coding_activity').first()).n,2);
const stale={...session,date:'2026-09-12',code:'stale conflicting draft'};response=await drafts.PUT(req('PUT',{taskId:task.id,version:1,session:stale}));assert.equal(response.status,409);
assert.equal((await adapter.prepare('SELECT count(*) AS n FROM coding_activity').first()).n,2,'conflicting draft cannot write another day');
globalThis.testUser={userId:'learner-b'};assert.equal((await body(await github.GET(req('GET')))).connected,false);assert.deepEqual((await body(await drafts.GET(req('GET')))).activityDates,[]);
globalThis.testUser={userId:'learner-a'};await github.DELETE(req('DELETE'));assert.equal((await body(await github.GET(req('GET')))).connected,false);assert.equal(commits,5,'disconnect keeps repository files');
saved=await body(await github.POST(req('POST',{taskId:task.id})));assert.equal(saved.save.status,'disconnected');

// Calendar behavior: deduplicate activity, preserve yesterday until today ends, reset across gaps.
const state=data.initialState();let stats=dashboardStats(state,'2026-09-11',7,['2026-09-09','2026-09-10','2026-09-10']);
assert.equal(stats.streak,2);assert.equal(stats.bestStreak,2);assert.equal(stats.studiedToday,false);
stats=dashboardStats(state,'2026-09-12',7,['2026-09-09','2026-09-10']);assert.equal(stats.streak,0);assert.equal(stats.bestStreak,2);
state.sessions['2026-09-11']=data.newSession('2026-09-11','variables');state.sessions['2026-09-11'].checks=['learn-0'];
stats=dashboardStats(state,'2026-09-11',7,['2026-09-09','2026-09-10','2026-09-11','2026-09-12']);assert.equal(stats.streak,3);assert.equal(stats.activeDays,3);assert.equal(stats.tasks,1);
assert.equal(dashboardStats(data.initialState(),'2024-03-01',7,['2024-02-28','2024-02-29','2024-03-01']).streak,3);
assert.equal(dashboardStats(data.initialState(),'2026-01-01',7,['2025-12-31','2026-01-01']).streak,2);
// Server-provided credentials initialize only the named authenticated account, once.
globalThis.testEnv.PLACEMENT_GITHUB_SETUP_TOKEN=token;
globalThis.testEnv.PLACEMENT_GITHUB_SETUP_USER_ID='setup-owner';
globalThis.testUser={userId:'unrelated-user'};
assert.equal((await body(await github.GET(req('GET')))).connected,false);
globalThis.testUser={userId:'setup-owner'};
let setup=await body(await github.GET(req('GET')));assert.equal(setup.connected,true);assert.equal(setup.branch,'master');
let setupRow=await adapter.prepare('SELECT encrypted_token FROM github_connections WHERE user_id=?').bind('setup-owner').first();
assert.equal(await decryptGitHubToken(setupRow.encrypted_token,'setup-owner',secret),token);
const afterSetup=requests;assert.equal((await body(await github.GET(req('GET')))).connected,true);assert.equal(requests,afterSetup);
await github.DELETE(req('DELETE'));assert.equal((await body(await github.GET(req('GET')))).connected,false,'disconnect must not auto-reconnect');
assert.equal(requests,afterSetup);
await github.PUT(req('PUT',{token}));assert.equal((await body(await github.GET(req('GET')))).connected,true,'manual reconnect remains available');
globalThis.testEnv.PLACEMENT_GITHUB_SETUP_USER_ID='expired-setup';globalThis.testUser={userId:'expired-setup'};forcedStatus=401;
setup=await body(await github.GET(req('GET')));assert.equal(setup.configured,true);assert.equal(setup.connected,false);assert.match(setup.setupError,/expired|revoked/);forcedStatus=0;
assert.equal((await github.PUT(req('PUT',{token}))).status,200,'a failed initial token must not block its replacement');
db.close();console.log('PASS: authenticated account-scoped setup, encrypted connection, disconnect stays disconnected, accepted-only saves, retries, conflicts, and streaks. No live GitHub writes.');
