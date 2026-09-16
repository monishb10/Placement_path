import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import initSqlJs from 'sql.js';

const runtime=path.resolve('.sites-runtime/coding-verification');
await mkdir(runtime,{recursive:true});
const newTasks=JSON.parse(await readFile('lib/coding-bank.generated.json','utf8'));
async function module(name,replace=s=>s){
  const source=replace(await readFile(`lib/${name}.ts`,'utf8'));
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  const file=path.join(runtime,name+'.mjs');await writeFile(file,compiled);return import(pathToFileURL(file).href);
}
const {codingTasks,compareOutput}=await module('coding-tasks');
const {lessons,newSession}=await module('study-data');
const {placementResources}=await module('placement-resources');
const all=[...Object.values(codingTasks).map(t=>({...t,topicId:t.id,number:1,difficulty:'Easy',language:'java'})),...newTasks];
assert.equal(all.length,590);assert.equal(new Set(all.map(t=>t.id)).size,590);
assert.equal(all.filter(t=>t.language==='java').length,580);assert.equal(all.filter(t=>t.language==='sql').length,10);
for(const topic of [...lessons,...placementResources]){
  const tasks=all.filter(t=>t.topicId===topic.id).sort((a,b)=>a.number-b.number);
  assert.equal(tasks.length,10,topic.id);
  assert.deepEqual(tasks.map(t=>t.number),[1,2,3,4,5,6,7,8,9,10]);
  assert.deepEqual(tasks.map(t=>t.difficulty),['Easy','Easy','Easy','Medium','Medium','Medium','Medium','Hard','Hard','Hard']);
  assert.equal(new Set(tasks.map(t=>t.statement)).size,10,`${topic.id} has a repeated statement`);
  for(const task of tasks){
    assert.ok(task.cases.length>=5);assert.equal(task.cases.filter(c=>c.sample).length,2);
    assert.ok(task.starter.trim()&&task.statement&&task.inputFormat&&task.outputFormat&&task.constraints.length);
    for(const c of task.cases)assert.ok(compareOutput(c.expected,c.expected,task.comparison));
  }
}

// Execute the exact browser worker logic with the actual SQL.js engine, without browser QA.
const SQL=await initSqlJs({locateFile:f=>path.resolve('node_modules/sql.js/dist',f)});
let output;
const scope={importScripts:()=>{},initSqlJs:async()=>SQL,performance,self:{postMessage:r=>{output=r;}}};
vm.runInNewContext(await readFile('public/sql/runner.js','utf8'),scope);
const sqlRefs=JSON.parse(await readFile(path.join(runtime,'sql-reference.json'),'utf8'));
let sqlCases=0;
for(const task of sqlRefs)for(const c of task.cases){
  await scope.self.onmessage({data:{query:task.query,setup:c.input,caseId:c.id,expected:c.expected,custom:false}});
  assert.equal(output.verdict,'passed',`${task.id}/${c.id}: ${output.stderr} ${output.stdout}`);sqlCases++;
}
const setup=sqlRefs[0].cases[0].input;
for(const query of ['SELECT bad_column FROM employees','DELETE FROM employees','SELECT 1; SELECT 2;','-- no query']){
  await scope.self.onmessage({data:{query,setup,caseId:'invalid',expected:'',custom:false}});
  assert.equal(output.verdict,'runtime_error',query);
}
await scope.self.onmessage({data:{query:'SELECT id FROM employees ORDER BY id DESC',setup,caseId:'wrong',expected:'[]',custom:false}});
assert.equal(output.verdict,'wrong_answer');
await scope.self.onmessage({data:{query:'SELECT 42;',setup,caseId:'custom',custom:true}});
assert.equal(output.verdict,'ran');assert.equal(output.stdout,'[[42]]');

// New normalized storage keeps topics, problems, users, and optimistic versions isolated.
const db=new SQL.Database();
for(const file of ['drizzle/0000_tearful_trish_tilby.sql','drizzle/0001_nice_eternity.sql']){
  db.run(await readFile(file,'utf8'));
}
const save=(user,id,text,version)=>{
  if(version===0)db.run('INSERT INTO coding_attempts(user_id,task_id,payload,version,accepted,updated_at) VALUES (?,?,?,1,0,?) ON CONFLICT(user_id,task_id) DO NOTHING',[user,id,text,'2026-09-11']);
  else db.run('UPDATE coding_attempts SET payload=?,version=version+1 WHERE user_id=? AND task_id=? AND version=?',[text,user,id,version]);
  return db.getRowsModified();
};
assert.equal(save('a','arrays__02','draft one',0),1);assert.equal(save('a','arrays__03','draft two',0),1);
assert.equal(save('b','arrays__02','other user',0),1);assert.equal(save('a','arrays__02','stale overwrite',0),0);
assert.equal(save('a','arrays__02','saved change',1),1);assert.equal(save('a','arrays__02','stale overwrite',1),0);
assert.equal(db.exec("SELECT payload FROM coding_attempts WHERE user_id='a' AND task_id='arrays__03'")[0].values[0][0],'draft two');
db.close();
const {sessionSchemaFor}=await module('study-validation',s=>s.replace("'./study-data'","'./study-data.mjs'"));
const {z}=await import('zod');
const schema=sessionSchemaFor(z.string().refine(id=>[...lessons,...placementResources].some(t=>t.id===id)));
for(const topic of [...lessons,...placementResources])assert.ok(schema.safeParse(newSession('2026-09-11',topic.id)).success);
const invalid=newSession('2026-09-11','sql');invalid.solved=1;assert.equal(schema.safeParse(invalid).success,false);
const {countAcceptedCoding}=await module('coding-progress');
const old={sessions:{a:{topicId:'arrays',judge:{accepted:true}},b:{topicId:'arrays',judge:{accepted:true}}},practice:{strings:{topicId:'strings',judge:{accepted:true}}}};
assert.equal(countAcceptedCoding(old,[{taskId:'arrays',accepted:1},{taskId:'arrays__02',accepted:1},{taskId:'sql__10',accepted:1}]),4);
assert.equal(countAcceptedCoding(old,[{taskId:'arrays',accepted:0}]),1);
console.log(`PASS: 590 exercises, 59 topics, 3/4/3 distribution; ${all.reduce((n,t)=>n+t.cases.length,0)} provided cases; ${sqlCases} real SQL cases; rejected invalid queries; isolated/versioned persistence.`);
