"""Build the original coding bank and verify every new fixture with real Java/SQLite."""
import sys,json,subprocess,base64,hashlib
import core,scalars,arrays,strings,trees,dynamic,structures,graphs,grids,applied,advanced,models
from profiles import PROFILES
from sql_bank import tasks as sql_tasks
core.materialize()
root=core.ROOT
out=[];jobs=[]
starter='import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        // Read the input, implement your approach, and print the answer.\n        \n    }\n}\n'
placement=set('percentages ratio average profit work speed probability logical dbms os networks java-interview hr resume github flocksense flowpulse'.split())
for topic,keys in PROFILES.items():
 keys=keys.split();start=1 if topic in placement else 2
 assert len(keys)==11-start,(topic,len(keys))
 assert len(set(keys))==len(keys),topic
 for number,key in enumerate(keys,start):
  r=core.RECIPES[key]
  record={k:v for k,v in r.items() if k not in ['key','java','_oracle']}
  ident=topic if number==1 else f'{topic}__{number:02}'
  record.update(id=ident,topicId=topic,number=number,difficulty='Easy' if number<=3 else 'Medium' if number<=7 else 'Hard',language='java',starter=starter)
  # The coding contract is shared where practicing the same pattern across related subjects helps transfer.
  out.append(record)
  for c in r['cases']:jobs.append((ident,key,c))
sql,sqlrefs=sql_tasks();out.extend(sql)
assert len(out)==549,len(out)
assert len({x['id'] for x in out})==549
dest=root/'lib/coding-bank.generated.json'
text=json.dumps(out,ensure_ascii=False,indent=2)+'\n'
if '--check' in sys.argv:assert dest.read_text()==text,'Generated coding bank is stale; run generate.py.'
else:dest.write_text(text)
runtime=root/'.sites-runtime/coding-verification';runtime.mkdir(parents=True,exist_ok=True)
(runtime/'sql-reference.json').write_text(json.dumps(sqlrefs))
if '--verify' in sys.argv:
 used=sorted({key for _,key,_ in jobs})
 methods='\n'.join('static String r_'+key+'(String raw){Scanner s=new Scanner(raw);'+core.RECIPES[key]['java']+'}\n' for key in used)
 dispatch='switch(key){'+''.join('case "'+key+'":return r_'+key+'(raw);' for key in used)+'default:throw new IllegalArgumentException(key);}'
 source='import java.util.*;import java.io.*;import java.nio.charset.StandardCharsets;\npublic class ReferenceSuite{'+core.JAVA_HELPERS+methods+'static String solve(String key,String raw){'+dispatch+'}public static void main(String[] args)throws Exception{BufferedReader in=new BufferedReader(new InputStreamReader(System.in));String row;while((row=in.readLine())!=null){String[] p=row.split("\\t",-1);try{String value=solve(p[0],new String(Base64.getDecoder().decode(p[1]),StandardCharsets.UTF_8));System.out.println(Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8)));}catch(Throwable e){System.out.println("ERROR:"+p[0]+":"+e);}}}}'
 (runtime/'ReferenceSuite.java').write_text(source)
 java='/usr/lib/jvm/java-17-openjdk-amd64/bin/java'
 subprocess.run([java,'com.sun.tools.javac.Main',str(runtime/'ReferenceSuite.java')],check=True)
 inputs=''.join(k+'\t'+base64.b64encode(c['input'].encode()).decode()+'\n' for _,k,c in jobs)
 result=subprocess.run([java,'-cp',str(runtime),'ReferenceSuite'],input=inputs,text=True,capture_output=True,check=True,timeout=90)
 lines=result.stdout.splitlines();assert len(lines)==len(jobs),(len(lines),len(jobs))
 errors=[]
 for (ident,key,c),line in zip(jobs,lines):
  if line.startswith('ERROR:'):errors.append((ident,c['id'],line));continue
  actual=base64.b64decode(line).decode();expected=c['expected'];mode=core.RECIPES[key]['comparison']
  if mode=='decimal' and expected!='EMPTY':
   try:
    a,b=list(map(float,actual.split())),list(map(float,expected.split()));ok=len(a)==len(b) and all(abs(x-y)<=1e-6 for x,y in zip(a,b))
   except ValueError:ok=False
  else:ok=actual.split()==expected.split()
  if not ok:errors.append((ident,c['id'],key,expected,actual))
 if errors:print(json.dumps(errors,indent=2));sys.exit(1)
 print(f'PASS: {len(jobs)} Java fixture executions across {len(used)} independently authored algorithms.')
print(f'Generated {len(out)} new exercises: {len(out)-10} Java and 10 SQL. Together with 41 preserved tasks: 590.')
