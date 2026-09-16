import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

// Exercise the real judge route in Workers. All Paiza.IO traffic is intercepted;
// this check never sends a user's source or input to an external service.
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
const bundle = await build({
  stdin: {contents: `import {POST} from './app/api/judge/route.ts';
    import {practiceById} from './lib/coding-bank.ts';
    export default {fetch(request) {
      if (new URL(request.url).pathname === '/fixture') return Response.json(practiceById.variables);
      return POST(request);
    }};`, resolveDir: process.cwd(), sourcefile: 'java-worker-check.ts'},
  plugins: [{name: 'signed-in-test-user', setup(build) {
    build.onResolve({filter: /\/app\/auth$/}, () => ({path: 'test-auth', namespace: 'test-auth'}));
    build.onLoad({filter: /.*/, namespace: 'test-auth'}, () => ({contents: 'export async function getStudyUser() {return {id: "test-user"};}', loader: 'js'}));
  }}],
  bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022',
});
const outbound = [];
const mf = new Miniflare({modules: true, compatibilityDate: config.compatibility_date, script: bundle.outputFiles[0].text, outboundService: async request => {
  const next = outbound.shift();
  assert.ok(next, 'Unexpected outbound request');
  assert.equal(request.url, next.url);
  assert.equal(request.method, next.method);
  assert.equal(request.headers.has('authorization'), false);
  assert.equal(request.headers.has('cookie'), false);
  if (next.body) assert.deepEqual(await request.json(), next.body);
  return Response.json(next.response, {status: next.status ?? 200});
}});
const source = 'public class Main { public static void main(String[] args) { System.out.println("test"); } }';
const api = 'https://api.paiza.io/runners/';
function execution(input, result) {
  outbound.push({method: 'POST', url: api + 'create', body: {language: 'java', source_code: source, input, longpoll: true, api_key: 'guest'}, response: {id: 'mock-run', status: 'running'}});
  outbound.push({method: 'GET', url: api + 'get_details?id=mock-run&api_key=guest', response: {status: 'completed', build_result: 'success', build_exit_code: '0', result: 'success', exit_code: '0', stdout: '', time: '0.01', memory: '1024', ...result}});
}
async function run(changes = {}) {
  const response = await mf.dispatchFetch('https://test.invalid/api/judge', {
    method: 'POST', headers: {'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin'},
    body: JSON.stringify({topicId: 'variables', taskId: 'variables', caseId: '1', code: source, allowExternalExecution: true, ...changes}),
  });
  return {status: response.status, ...await response.json()};
}
try {
  const task = await (await mf.dispatchFetch('https://test.invalid/fixture')).json();
  assert.equal((await run({allowExternalExecution: false})).status, 400);
  assert.equal((await run({allowExternalExecution: undefined})).status, 400);
  assert.equal((await run({code: '   '})).status, 400);
  assert.equal((await run({caseId: 'missing'})).status, 400);

  execution(task.cases[0].input, {stdout: task.cases[0].expected});
  let result = await run();
  assert.equal(result.status, 200); assert.equal(result.verdict, 'passed');
  assert.equal(result.stdout, task.cases[0].expected);

  execution(task.cases[0].input, {stdout: 'Name:MuthuAge:20Hours:1.5Eligible:true'});
  assert.equal((await run()).verdict, 'wrong_answer', 'Report a formatting mistake as a failed test');

  execution(task.cases[0].input, {build_result: 'failure', build_exit_code: '1', build_stderr: 'Main.java:1: error: missing semicolon'});
  result = await run();
  assert.equal(result.verdict, 'compile_error'); assert.match(result.compileOutput, /missing semicolon/);

  execution('custom\n0 0.0 false\n', {stdout: 'custom result'});
  result = await run({caseId: 'custom', customInput: 'custom\n0 0.0 false\n'});
  assert.equal(result.verdict, 'ran'); assert.equal(result.stdout, 'custom result');

  outbound.push({method: 'POST', url: api + 'create', status: 429, response: {error: 'busy'}});
  result = await run();
  assert.equal(result.verdict, 'unavailable'); assert.match(result.message, /busy/);
  assert.equal(outbound.length, 0);
  console.log('Worker judge checks passed: consent required, source/input delivery, passed tests, wrong answers, compiler errors, custom runs, and retryable service failures. All external calls mocked.');
} finally {await mf.dispose();}
