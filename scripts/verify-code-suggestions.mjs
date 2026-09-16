import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {EditorState} from '@codemirror/state';
import {CompletionContext} from '@codemirror/autocomplete';
import {java} from '@codemirror/lang-java';

await mkdir('.sites-runtime/editor-checks', {recursive: true});
await build({entryPoints: ['lib/java-completions.ts'], outfile: '.sites-runtime/editor-checks/completions.mjs', bundle: true, packages: 'external', platform: 'node', format: 'esm'});
const {javaCompletions} = await import('../.sites-runtime/editor-checks/completions.mjs');
let checked = 0;
function complete(source, explicit = false) {
  const pos = source.indexOf('|');
  assert.ok(pos >= 0, 'Each fixture needs a cursor');
  const state = EditorState.create({doc: source.replace('|', ''), selection: {anchor: pos}, extensions: [java()]});
  const result = javaCompletions(new CompletionContext(state, pos, explicit));
  // Every inserted value is one identifier, never a full exercise solution.
  for (const option of result?.options ?? []) {
    assert.match(option.label, /^[A-Za-z_$][\w$]*$/);
    assert.equal(option.apply, undefined);
  }
  checked++;
  return result;
}
const body = text => `public class Main { public static void main(String[] args) { ${text} } }`;
const labels = result => result?.options.map(option => option.label) ?? [];
assert.ok(labels(complete('pub|')).includes('public'));
assert.ok(labels(complete(body('Sys|'))).includes('System'));
assert.ok(labels(complete(body('Scanner input = new Scanner(System.in); input.ne|'))).includes('nextInt'));
assert.ok(labels(complete(body('Scanner input = new Scanner(System.in); input.|'))).includes('nextLine'));
const printing = complete(body('System.out.pr|'));
assert.ok(labels(printing).includes('println'));
assert.equal(labels(printing).includes('nextInt'), false);
assert.ok(printing.options.find(option => option.label === 'println').info.includes('new line'));
assert.ok(labels(complete(body('int age = 20; boolean eligible = true; System.out.println(ag|);'))).includes('age'));
assert.ok(labels(complete(body('int age = 20; boolean eligible = true; el|'))).includes('eligible'));
assert.equal(complete(body('int[] values = new int[2]; values.le|')).options.find(option => option.label === 'length').type, 'property');
assert.equal(complete(body('int values[] = new int[2]; values.le|')).options.find(option => option.label === 'length').type, 'property');
assert.equal(complete(body('String name = "Muthu"; name.le|')).options.find(option => option.label === 'length').type, 'method');
assert.ok(labels(complete(body('List<String> names = new ArrayList<>(); names.ad|'))).includes('add'));
assert.ok(labels(complete(body('HashMap<String, Integer> counts = new HashMap<>(); counts.get|'))).includes('getOrDefault'));
assert.ok(labels(complete(body('var input = new Scanner(System.in); input.ne|'))).includes('nextInt'));
assert.equal(complete(body('System.out.println("pub|");')), null);
assert.equal(complete(body("char letter = 'p|';")), null);
assert.equal(complete(body('// Sys|\n')), null);
assert.equal(complete(body('/* Sys| */')), null);
assert.equal(complete(body('unknown.pr|')), null);
assert.equal(complete(body('int count = 1; count.|')), null);
assert.equal(labels(complete(body('{ int hidden = 0; } hi|'))).includes('hidden'), false);
assert.equal(labels(complete(body('for (int index = 0; index < 3; index++) {} in|'))).includes('index'), false);
assert.ok(labels(complete(body('for (int index = 0; index < 3; index++) { in| }'))).includes('index'));
assert.equal(labels(complete(body('co|; int count = 0;'))).includes('count'), false);
assert.ok(labels(complete('class Main { int total; void work() { this.to| } }')).includes('total'));
assert.ok(labels(complete('class Main { void work(Scanner input) { input.ne| } }')).includes('nextInt'));
const shadow = complete(body('int System = 0; Sys|'));
assert.equal(shadow.options.find(option => option.label === 'System').type, 'variable');
const suffix = complete(body('System.out.pr|intln'));
assert.equal(suffix.to - suffix.from, 7, 'Completing inside an identifier replaces its suffix too');
assert.ok(labels(complete(body('|'), true)).includes('Scanner'));
console.log(`Java suggestions passed ${checked} parser-based checks: keywords, methods, scoped names, arrays, comments, partial edits, and identifier-only inserts.`);
