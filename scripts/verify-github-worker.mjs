import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

// Use the production Worker runtime, with every outbound request mocked.
// Node-only fetch mocks do not catch unsupported Workers Request options.
const config=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));
const token='github_pat_fake_worker_regression_1234567890';
const api='https://api.github.com';
const repository='/repos/Muthudeenathayalan/DSA';
const destination='/contents/placement-path/variables/problem-01/Main.java';
const code='public class Main { public static void main(String[] args) { System.out.println(1); } }';
const bundle=await build({
  stdin:{contents:`import {inspectRepository,commitSolution} from './lib/github-client.ts';
    export default {async fetch(request){try{
      const result=new URL(request.url).pathname==='/save'
        ? await commitSolution({token:${JSON.stringify(token)},branch:'main',path:'placement-path/variables/problem-01/Main.java',code:${JSON.stringify(code)},title:'Variables',tests:5})
        : await inspectRepository(${JSON.stringify(token)});
      return Response.json({result});
    }catch(error){return Response.json({error:error.message},{status:503});}}};`,resolveDir:process.cwd(),sourcefile:'github-worker-regression.ts'},
  bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',
});
const expected=[];
const reply=(method,path,status,data,headers={})=>expected.push({method,url:api+path,respond:()=>new Response(typeof data==='string'?data:JSON.stringify(data),{status,headers})});
// Return responses directly so the Worker itself handles redirects. Miniflare's
// fetchMock delegates to a host fetch that follows redirects before the Worker.
const mf=new Miniflare({modules:true,compatibilityDate:config.compatibility_date,script:bundle.outputFiles[0].text,outboundService:async request=>{
  const next=expected.shift();assert.ok(next,'Unexpected outbound request');
  assert.equal(request.url,next.url);assert.equal(request.method,next.method);
  assert.equal(request.headers.get('authorization'),`Bearer ${token}`);
  return next.respond(request);
}});
async function run(path='/inspect'){
  const response=await mf.dispatchFetch('https://test.invalid'+path);
  const body=await response.json();
  assert.equal(JSON.stringify(body).includes(token),false,'Never expose a credential in a result');
  return {status:response.status,...body};
}
try{
  reply('GET',repository,200,{full_name:'Muthudeenathayalan/DSA',default_branch:'main',permissions:{push:true}});
  assert.deepEqual(await run(),{status:200,result:'main'},'A valid connection must work in the actual Workers runtime');

  // Both same-host and foreign redirects must stop before forwarding the token.
  for(const status of [301,302,303,307,308]){
    for(const location of [api+'/redirect-target','https://redirect.invalid/credential-trap']){
      reply('GET',repository,status,'',{location});
      const result=await run();assert.equal(result.status,503);assert.match(result.error,/redirected/);
    }
  }
  reply('GET',repository,401,{message:'Bad credentials'});
  assert.match((await run()).error,/expired|revoked/);
  reply('GET',repository,403,{message:'Forbidden'});
  assert.match((await run()).error,/permission/);

  // A normal source-file save still uses the specified branch and code.
  reply('GET',repository+destination+'?ref=main',404,{});
  expected.push({method:'PUT',url:api+repository+destination,respond:async request=>{
    const payload=await request.json();
    assert.equal(payload.branch,'main');
    assert.equal(Buffer.from(payload.content,'base64').toString(),code);
    return Response.json({content:{sha:'a'.repeat(40)},commit:{sha:'b'.repeat(40)}},{status:201});
  }});
  const saved=await run('/save');assert.equal(saved.status,200);assert.equal(saved.result.unchanged,false);
  assert.match(saved.result.fileUrl,/\/DSA\/blob\/main\/placement-path\//);

  // Reject a redirect returned by the write endpoint too; never replay the PUT.
  reply('GET',repository+destination+'?ref=main',404,{});
  reply('PUT',repository+destination,307,'',{location:'https://redirect.invalid/credential-trap'});
  assert.match((await run('/save')).error,/redirected/);
  assert.equal(expected.length,0,'Every expected request must have been handled');
  console.log('PASS: Worker connection, redirect protection, token errors, and source saves. No live GitHub requests.');
}finally{await mf.dispose();}
