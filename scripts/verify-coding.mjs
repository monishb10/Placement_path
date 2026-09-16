// Run with --live to verify compilation/execution against the configured public runner.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const out = path.resolve('.sites-runtime/judge-checks');
await mkdir(out, {recursive: true});
async function load(name) {
  const source = await readFile(`lib/${name}.ts`, 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}}).outputText;
  const file = path.join(out, name + '.mjs'); await writeFile(file, compiled);
  return import(pathToFileURL(file).href);
}
const {codingTasks, compareOutput} = await load('coding-tasks');
const {lessons, newSession, initialState} = await load('study-data');
const {executeJava, executionResult} = await load('java-executor');
const {sourceHash} = await load('judge-types');
assert.deepEqual(Object.keys(codingTasks).sort(), lessons.map(l => l.id).sort());
const fixtures = [];
for (const task of Object.values(codingTasks)) {
  assert.equal(task.cases.filter(c => c.sample).length, 2);
  assert.ok(task.cases.length >= 5);
  assert.equal(new Set(task.cases.map(c => c.id)).size, task.cases.length);
  for (const test of task.cases) {
    assert.ok(compareOutput(test.expected, test.expected, task.comparison));
    fixtures.push([task.id, test.id, test.input, test.expected, task.comparison]);
  }
}
assert.equal(compareOutput(' 1\r\n2 ', '1 2', 'tokens'), true);
assert.equal(compareOutput('True', 'true', 'tokens'), false);
assert.equal(compareOutput('1000000000000000001', '1000000000000000000', 'tokens'), false);
assert.equal(compareOutput('NaN', '0', 'decimal'), false);
assert.equal(compareOutput('Infinity', '1', 'decimal'), false);
assert.equal(compareOutput('1.6666667', '1.6666666667', 'decimal'), true);
assert.equal(compareOutput('1.6', '1.6666666667', 'decimal'), false);
assert.equal(executionResult({status:'completed',build_result:'failure',build_exit_code:'1'}, '1').verdict, 'compile_error');
assert.equal(executionResult({status:'completed',build_result:'success',result:'timeout'}, '1').verdict, 'time_limit');
assert.equal(executionResult({status:'completed',build_result:'success',result:'success',exit_code:'0',stdout:'x'.repeat(16001)}, '1').verdict, 'output_limit');
assert.equal(executionResult({status:'completed'}, '1').verdict, 'runtime_error');

// Check backward-compatible persistence and reject impossible judge summaries.
const validationSource = (await readFile('lib/study-validation.ts', 'utf8')).replace("'./study-data'", "'./study-data.mjs'");
await writeFile(path.join(out, 'study-validation.mjs'), ts.transpileModule(validationSource, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}}).outputText);
const {stateSchema} = await import(pathToFileURL(path.join(out, 'study-validation.mjs')).href);
const state = initialState(); state.sessions['2026-09-10'] = newSession('2026-09-10', 'arrays');
assert.ok(stateSchema.safeParse(state).success);
state.sessions['2026-09-10'].judge = {sourceHash:await sourceHash('test'),passed:6,total:6,accepted:true,mode:'submit',at:new Date().toISOString()};
state.sessions['2026-09-10'].complexity = {time:'O(n)',space:'O(1)'};
assert.ok(stateSchema.safeParse(state).success);
state.sessions['2026-09-10'].judge.passed = 2;
assert.equal(stateSchema.safeParse(state).success, false);

// Free practice must survive persistence without replacing the daily record.
const practiceState = initialState();
practiceState.sessions['2026-09-11'] = newSession('2026-09-11', 'variables');
const extra = newSession('2026-09-11', 'arrays');
extra.code = 'public class Main { public static void main(String[] args) {} }';
extra.explanation = 'Scan the input once while maintaining the largest value.';
extra.attempted = 1; extra.solved = 1; extra.independent = 1;
extra.judge = {sourceHash:await sourceHash(extra.code),passed:6,total:6,accepted:true,mode:'submit',at:new Date().toISOString()};
practiceState.practice = {arrays:extra};
const persisted = stateSchema.parse(JSON.parse(JSON.stringify(practiceState)));
assert.equal(persisted.practice.arrays.code, extra.code);
assert.equal(persisted.practice.arrays.judge.accepted, true);
assert.equal(persisted.sessions['2026-09-11'].code, '');
assert.equal(persisted.currentTopic, 'variables');
const mismatched = structuredClone(practiceState); mismatched.practice.arrays.topicId = 'strings';
assert.equal(stateSchema.safeParse(mismatched).success, false);
const assisted = structuredClone(practiceState); assisted.practice.arrays.hintUsed = true;
assert.equal(stateSchema.safeParse(assisted).success, false);
const invalidKey = structuredClone(practiceState); invalidKey.practice.unknown = extra;
assert.equal(stateSchema.safeParse(invalidKey).success, false);
const statsSource = (await readFile('lib/dashboard-data.ts', 'utf8')).replace("'./study-data'", "'./study-data.mjs'");
await writeFile(path.join(out, 'dashboard-data.mjs'), ts.transpileModule(statsSource, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {dashboardStats} = await import(pathToFileURL(path.join(out, 'dashboard-data.mjs')).href);
const stats = dashboardStats(persisted, '2026-09-11');
assert.equal(stats.solved, 1); assert.equal(stats.independent, 1); assert.equal(stats.attempted, 1);
assert.equal(stats.tasks, 0); assert.equal(stats.activeDays, 0);
persisted.practice.arrays.date = '2026-09-12';
assert.equal(dashboardStats(persisted, '2026-09-11').solved, 0);
console.log(`Static checks passed: ${lessons.length} tasks, ${fixtures.length} fixtures, output comparison, backward-compatible daily/extra-practice persistence, and dashboard totals.`);
const live = process.argv.includes('--live');
const javaLocal = process.argv.includes('--java-local');
if (!live && !javaLocal) process.exit(0);

// urllib honors this development environment's outbound proxy. Production uses fetch.
const network = async (url, options = {}) => {
  const script = `import sys,json,urllib.request,urllib.error,base64
d=json.load(sys.stdin); o=d['options']; body=o.get('body')
r=urllib.request.Request(d['url'],data=body.encode() if body is not None else None,headers=o.get('headers',{}),method=o.get('method','GET'))
try:
 q=urllib.request.urlopen(r,timeout=18); status=q.status; data=q.read(250000)
except urllib.error.HTTPError as e:
 status=e.code; data=e.read(250000)
print(json.dumps({'status':status,'body':base64.b64encode(data).decode()}))`;
  const response = JSON.parse(execFileSync('python', ['-c', script], {input:JSON.stringify({url:String(url),options}),encoding:'utf8',timeout:23000,maxBuffer:400000}));
  return new Response(Buffer.from(response.body, 'base64'), {status:response.status});
};
async function localJava(source, input, caseId) {
  const java = '/usr/lib/jvm/java-17-openjdk-amd64/bin/java';
  const file = path.join(out, 'Main.java'); await writeFile(file, source);
  try { execFileSync(java, ['com.sun.tools.javac.Main', '-d', out, file], {encoding:'utf8',timeout:15000,stdio:['pipe','pipe','pipe']}); }
  catch (error) { return executionResult({build_result:'failure',build_exit_code:'1',build_stderr:String(error.stderr??'')},caseId); }
  try {
    const stdout = execFileSync(java, ['-Xmx128m','-cp',out,'Main'], {input,encoding:'utf8',timeout:3000,killSignal:'SIGKILL',stdio:['pipe','pipe','pipe']});
    return executionResult({build_result:'success',build_exit_code:'0',result:'success',exit_code:'0',stdout},caseId);
  } catch (error) {
    return executionResult({build_result:'success',build_exit_code:'0',result:error.code==='ETIMEDOUT'?'timeout':'failure',exit_code:String(error.status??1),stdout:String(error.stdout??''),stderr:String(error.stderr??'')},caseId);
  }
}
const runJava = javaLocal ? localJava : (source,input,caseId) => executeJava(source,input,caseId,network);
const b64 = text => Buffer.from(text).toString('base64');
const fixtureJava = fixtures.map(row => `{${row.map(value => '"' + b64(value) + '"').join(',')}}`).join(',\n');
const reference = `import java.util.*;
public class Main {
  static class Node { int v; Node l,r; Node(int v){this.v=v;} }
  static long[] arr(Scanner s,int n){long[] a=new long[n];for(int i=0;i<n;i++)a[i]=s.nextLong();return a;}
  static String join(long[] a){if(a.length==0)return "EMPTY";StringJoiner j=new StringJoiner(" ");for(long v:a)j.add(""+v);return j.toString();}
  static Node tree(Scanner s){int n=s.nextInt();if(n==0)return null;String[] a=new String[n];for(int i=0;i<n;i++)a[i]=s.next();if(a[0].equals("null"))return null;Node root=new Node(Integer.parseInt(a[0]));Queue<Node> q=new ArrayDeque<>();q.add(root);int i=1;while(!q.isEmpty()&&i<n){Node p=q.remove();String x=a[i++];if(!x.equals("null")){p.l=new Node(Integer.parseInt(x));q.add(p.l);}if(i<n){x=a[i++];if(!x.equals("null")){p.r=new Node(Integer.parseInt(x));q.add(p.r);}}}return root;}
  static int count(Node p){return p==null?0:1+count(p.l)+count(p.r);}
  static int depth(Node p){return p==null?0:1+Math.max(depth(p.l),depth(p.r));}
  static void inorder(Node p,List<Long> a){if(p==null)return;inorder(p.l,a);a.add((long)p.v);inorder(p.r,a);}
  static String list(List<Long> a){long[] b=new long[a.size()];for(int i=0;i<b.length;i++)b[i]=a.get(i);return join(b);}
  static int find(int[] p,int x){while(x!=p[x]){p[x]=p[p[x]];x=p[x];}return x;}
  static String solve(String id,String input){Scanner s=new Scanner(input);switch(id){
    case "variables":{String name=s.nextLine();int age=s.nextInt();double hours=s.nextDouble();boolean eligible=s.nextBoolean();return "Name: "+name+"\\nAge: "+age+"\\nHours: "+hours+"\\nEligible: "+eligible;}
    case "operators":{int sum=s.nextInt()+s.nextInt()+s.nextInt();return sum+" "+(sum/3.0);}
    case "input":return s.nextInt()+" "+s.nextInt()+" "+s.nextInt();
    case "conditions":{int n=s.nextInt();return n>0?"positive":n<0?"negative":"zero";}
    case "loops":case "recursion":{long n=s.nextLong();return ""+(n*(n+1)/2);}
    case "arrays":{int n=s.nextInt();long[] a=arr(s,n);long best=a[0];for(long v:a)best=Math.max(best,v);return ""+best;}
    case "strings":{int n=0;for(char c:input.toLowerCase(Locale.ROOT).toCharArray())if("aeiou".indexOf(c)>=0)n++;return ""+n;}
    case "methods":return ""+(s.nextInt()%2==0);
    case "oop":{long balance=s.nextLong();int n=s.nextInt();for(int i=0;i<n;i++){long d=s.nextLong();if(d>0)balance+=d;}return ""+balance;}
    case "arraylist":{int n=s.nextInt();List<Long>a=new ArrayList<>();for(long v:arr(s,n))if(v%2==0)a.add(v);return list(a);}
    case "hashmap":{int n=s.nextInt();Map<String,Integer>m=new TreeMap<>();for(int i=0;i<n;i++){String w=s.next();m.put(w,m.getOrDefault(w,0)+1);}if(m.isEmpty())return "EMPTY";StringJoiner j=new StringJoiner("\\n");for(String k:m.keySet())j.add(k+" "+m.get(k));return j.toString();}
    case "hashset":{int n=s.nextInt();Set<Long> seen=new HashSet<>();boolean duplicate=false;for(long v:arr(s,n))if(!seen.add(v))duplicate=true;return ""+duplicate;}
    case "collections":{int n=s.nextInt();Set<Long> a=new TreeSet<>();for(long v:arr(s,n))a.add(v);return list(new ArrayList<>(a));}
    case "complexity":{long n=s.nextLong();return ""+(n*n);}
    case "sorting":{long[] a=arr(s,s.nextInt());Arrays.sort(a);return join(a);}
    case "binary-search":{int n=s.nextInt();long target=s.nextLong();long[]a=arr(s,n);int p=Arrays.binarySearch(a,target);return ""+(p<0?-1:p);}
    case "two-pointers":{long[]a=arr(s,s.nextInt());for(int l=0,r=a.length-1;l<r;l++,r--){long t=a[l];a[l]=a[r];a[r]=t;}return join(a);}
    case "sliding-window":{int n=s.nextInt(),k=s.nextInt();long[]a=arr(s,n);long sum=0;for(int i=0;i<k;i++)sum+=a[i];long best=sum;for(int i=k;i<n;i++){sum+=a[i]-a[i-k];best=Math.max(best,sum);}return ""+best;}
    case "prefix-sum":{long[]a=arr(s,s.nextInt());for(int i=1;i<a.length;i++)a[i]+=a[i-1];return join(a);}
    case "hashing":{int n=s.nextInt();long target=s.nextLong();long[]a=arr(s,n);Map<Long,Integer>seen=new HashMap<>();for(int i=0;i<n;i++){Integer j=seen.get(target-a[i]);if(j!=null)return j+" "+i;seen.put(a[i],i);}throw new Error("No two-sum pair");}
    case "linked-list":{int n=s.nextInt();LinkedList<Long>a=new LinkedList<>();for(long v:arr(s,n))a.add(v);int size=0;for(long v:a)size++;return ""+size;}
    case "stack":{int balance=0;for(char c:input.trim().toCharArray()){balance+=c=='('?1:-1;if(balance<0)return "false";}return ""+(balance==0);}
    case "queue":{int n=s.nextInt(),k=s.nextInt();Queue<Long>q=new ArrayDeque<>();for(long v:arr(s,n))q.add(v);while(k-->0&&!q.isEmpty())q.remove();return q.isEmpty()?"EMPTY":""+q.peek();}
    case "trees":return ""+count(tree(s));
    case "bst":{int n=s.nextInt();long target=s.nextLong();boolean found=false;for(long v:arr(s,n))if(v==target)found=true;return ""+found;}
    case "tree-dfs":return ""+depth(tree(s));
    case "tree-bfs":{Node root=tree(s);if(root==null)return "EMPTY";Queue<Node>q=new ArrayDeque<>();q.add(root);StringJoiner levels=new StringJoiner("\\n");while(!q.isEmpty()){int n=q.size();StringJoiner level=new StringJoiner(" ");while(n-->0){Node p=q.remove();level.add(""+p.v);if(p.l!=null)q.add(p.l);if(p.r!=null)q.add(p.r);}levels.add(level.toString());}return levels.toString();}
    case "traversals":{List<Long>a=new ArrayList<>();inorder(tree(s),a);return list(a);}
    case "heap":{int n=s.nextInt(),k=s.nextInt();long[]a=arr(s,n);Arrays.sort(a);return ""+a[n-k];}
    case "greedy":{int n=s.nextInt();int[][]a=new int[n][2];for(int i=0;i<n;i++){a[i][0]=s.nextInt();a[i][1]=s.nextInt();}Arrays.sort(a,Comparator.comparingInt(v->v[1]));int end=-1,count=0;for(int[] v:a)if(v[0]>=end){count++;end=v[1];}return ""+count;}
    case "graphs":case "graph-traversal":{int n=s.nextInt(),e=s.nextInt(),start=0,target=0;if(id.equals("graph-traversal")){start=s.nextInt();target=s.nextInt();}List<List<Integer>>g=new ArrayList<>();for(int i=0;i<n;i++)g.add(new ArrayList<>());for(int i=0;i<e;i++){int u=s.nextInt(),v=s.nextInt();g.get(u).add(v);g.get(v).add(u);}if(id.equals("graphs")){StringJoiner out=new StringJoiner("\\n");for(int i=0;i<n;i++){Collections.sort(g.get(i));String row=i+":";for(int v:g.get(i))row+=" "+v;out.add(row);}return out.toString();}boolean[]seen=new boolean[n];Queue<Integer>q=new ArrayDeque<>();q.add(start);seen[start]=true;while(!q.isEmpty()){int u=q.remove();for(int v:g.get(u))if(!seen[v]){seen[v]=true;q.add(v);}}return ""+seen[target];}
    case "union-find":{int n=s.nextInt(),e=s.nextInt();int[]p=new int[n];for(int i=0;i<n;i++)p[i]=i;boolean cycle=false;for(int i=0;i<e;i++){int u=find(p,s.nextInt()),v=find(p,s.nextInt());if(u==v)cycle=true;else p[u]=v;}return ""+cycle;}
    case "dp":{long[]a=arr(s,s.nextInt());long x=0,y=0;for(int i=2;i<=a.length;i++){long z=Math.min(y+a[i-1],x+a[i-2]);x=y;y=z;}return ""+y;}
    case "fibonacci":case "climbing":{int n=s.nextInt();long a=0,b=1;if(id.equals("climbing"))n++;for(int i=0;i<n;i++){long c=a+b;a=b;b=c;}return ""+a;}
    case "knapsack":{int n=s.nextInt(),w=s.nextInt();long[]weights=arr(s,n),values=arr(s,n);long[]dp=new long[w+1];for(int i=0;i<n;i++)for(int c=w;c>=weights[i];c--)dp[c]=Math.max(dp[c],dp[c-(int)weights[i]]+values[i]);return ""+dp[w];}
    case "subset":{int n=s.nextInt(),target=s.nextInt();long[]a=arr(s,n);boolean[]dp=new boolean[target+1];dp[0]=true;for(long v:a)for(int c=target;c>=v;c--)dp[c]|=dp[c-(int)v];return ""+dp[target];}
    case "lis":{long[]a=arr(s,s.nextInt());int[]dp=new int[a.length];int best=0;for(int i=0;i<a.length;i++){dp[i]=1;for(int j=0;j<i;j++)if(a[j]<a[i])dp[i]=Math.max(dp[i],dp[j]+1);best=Math.max(best,dp[i]);}return ""+best;}
    case "grid-dp":{int rows=s.nextInt(),cols=s.nextInt();long[]dp=new long[cols];Arrays.fill(dp,1);for(int r=1;r<rows;r++)for(int c=1;c<cols;c++)dp[c]+=dp[c-1];return ""+dp[cols-1];}
    default:throw new Error("Missing reference: "+id);
  }}
  static String decode(String s){return new String(Base64.getDecoder().decode(s),java.nio.charset.StandardCharsets.UTF_8);}
  public static void main(String[] args){String[][] tests={${fixtureJava}};int failures=0;
    for(String[] encoded:tests){String[]t=new String[5];for(int i=0;i<5;i++)t[i]=decode(encoded[i]);String actual=solve(t[0],t[2]).trim();String[]a=actual.split("\\\\s+"),b=t[3].trim().split("\\\\s+");boolean ok=a.length==b.length;
      if(ok)for(int i=0;i<a.length;i++){if(t[4].equals("decimal")){if(Math.abs(Double.parseDouble(a[i])-Double.parseDouble(b[i]))>0.000001)ok=false;}else if(!a[i].equals(b[i]))ok=false;}
      if(!ok){failures++;System.out.println("FAIL "+t[0]+"/"+t[1]+" actual="+actual+" expected="+t[3]);}
    }System.out.println(failures==0?"ALL "+tests.length+" FIXTURES PASSED":"FAILURES: "+failures);
  }
}`;
const fixtureResult = await runJava(reference, '', 'fixtures');
assert.equal(fixtureResult.verdict, 'ran', JSON.stringify(fixtureResult));
assert.equal(fixtureResult.stdout.trim(), `ALL ${fixtures.length} FIXTURES PASSED`);
console.log(`Java reference check passed for all ${fixtures.length} task fixtures.`);

const checks = [
  {name:'correct negative maximum',source:'public class Main {public static void main(String[] a){java.util.Scanner s=new java.util.Scanner(System.in);int n=s.nextInt(),m=s.nextInt();for(int i=1;i<n;i++)m=Math.max(m,s.nextInt());System.out.println(m);}}',input:'4\n-7 -2 -11 -3',verdict:'ran',expected:'-2'},
  {name:'wrong maximum initialization',source:'public class Main {public static void main(String[] a){java.util.Scanner s=new java.util.Scanner(System.in);int n=s.nextInt(),m=0;for(int i=0;i<n;i++)m=Math.max(m,s.nextInt());System.out.println(m);}}',input:'4\n-7 -2 -11 -3',verdict:'ran',expected:'0'},
  {name:'compiler error',source:'public class Main {public static void main(String[] a){System.out.println(;}}',input:'',verdict:'compile_error'},
  {name:'runtime exception',source:'public class Main {public static void main(String[] a){int[] values={1};System.out.println(values[2]);}}',input:'',verdict:'runtime_error'},
  {name:'time limit',source:'public class Main {public static void main(String[] a){while(true){}}}',input:'',verdict:'time_limit'},
  {name:'empty line input',source:'public class Main {public static void main(String[] a){java.util.Scanner s=new java.util.Scanner(System.in);System.out.println(s.nextLine().length());}}',input:'\n',verdict:'ran',expected:'0'},
];
for (const check of checks) {
  const result = await runJava(check.source, check.input, '1');
  assert.equal(result.verdict, check.verdict, check.name + ': ' + JSON.stringify(result));
  if (check.expected !== undefined) assert.equal(result.stdout.trim(), check.expected);
  if (check.name === 'wrong maximum initialization') assert.equal(compareOutput(result.stdout, '-2', 'tokens'), false);
  console.log(`${javaLocal ? 'Local Java' : 'Live'} check passed: ${check.name}.`);
}
