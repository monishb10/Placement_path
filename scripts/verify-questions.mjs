import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync, readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

// Validate the actual authored content independently of its UI and build bundle.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temporary=mkdtempSync(join(tmpdir(),'placement-questions-'));
try {
  const files=['lib/study-data.ts','lib/placement-resources.ts',...readdirSync(join(root,'lib/question-banks')).filter(f=>f.endsWith('.ts')).map(f=>`lib/question-banks/${f}`)];
  for(const file of files){
    const result=ts.transpileModule(readFileSync(join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
    const destination=join(temporary,file.replace(/\.ts$/,'.js'));
    mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,result.outputText);
  }
  const require=createRequire(join(temporary,'check.cjs'));
  const {lessons}=require('./lib/study-data.js');
  const {placementResources}=require('./lib/placement-resources.js');
  const {questionBanks}=require('./lib/question-banks/index.js');
  const expected=[...lessons,...placementResources].map(t=>t.id).sort();
  assert.equal(new Set(expected).size,59,'59 distinct topic guides');
  assert.deepEqual(Object.keys(questionBanks).sort(),expected,'Each topic must have exactly one bank, with no orphan banks');
  const prompts=new Set(), formats=['Multiple choice','Short answer','Case study','Discussion'];
  let total=0, multipleChoice=0;
  for(const [topic,questions] of Object.entries(questionBanks)){
    assert.equal(questions.length,10,`${topic}: ten questions`);
    const seenFormats=new Set();
    for(const [i,q] of questions.entries()){
      const label=`${topic} question ${i+1}`;
      assert.equal(q.number,i+1,`${label}: numbering`);
      assert.equal(q.difficulty,i<3?'Easy':i<7?'Medium':'Hard',`${label}: difficulty order`);
      assert.ok(q.prompt.trim().length>0,`${label}: nonempty question`);
      assert.ok(q.answer.trim().length>0,`${label}: answer guidance present`);
      const normalized=q.prompt.toLowerCase().replace(/\s+/g,' ').trim();
      assert.ok(!prompts.has(normalized),`${label}: duplicate prompt`);prompts.add(normalized);
      assert.ok(formats.includes(q.format),`${label}: known format`);seenFormats.add(q.format);
      for(const value of [q.prompt,q.answer,...(q.options??[])]){
        assert.equal((value.match(/`/g)??[]).length%2,0,`${label}: balanced inline code`);
        assert.ok(!/undefined|\[object Object\]/.test(value),`${label}: accidental serialization`);
      }
      if(q.format==='Multiple choice'){
        multipleChoice++;
        assert.equal(q.options.length,4,`${label}: four options`);
        assert.equal(new Set(q.options).size,4,`${label}: unique options`);
        assert.ok(q.options.every(option=>option.trim().length>0),`${label}: nonempty options`);
        assert.ok(Number.isInteger(q.correctIndex)&&q.correctIndex>=0&&q.correctIndex<4,`${label}: answer index`);
      } else {
        assert.equal(q.options,undefined,`${label}: written-answer format`);
        assert.equal(q.correctIndex,undefined,`${label}: no misleading auto-grading`);
      }
      total++;
    }
    assert.deepEqual([...seenFormats].sort(),[...formats].sort(),`${topic}: all four question formats`);
  }
  assert.equal(total,590,'Complete requested question coverage');
  console.log(`Verified ${expected.length} topics / ${total} distinct questions: 177 Easy, 236 Medium, 177 Hard. ${multipleChoice} multiple-choice answer keys and ${total-multipleChoice} written exemplars. All topics include all four formats.`);
} finally {rmSync(temporary,{recursive:true,force:true});}
