from core import *
import core
core.JAVA_HELPERS += r'''
static class Counter{private long value;void add(long delta){value+=delta;}long get(){return value;}}
static class Rectangle{private long l,w;Rectangle(long a,long b){l=a;w=b;}long area(){return l*w;}}
static class Employee{private long base,hours,rate;Employee(long b,long h,long r){base=b;hours=h;rate=r;}long pay(){return base+hours*rate;}}
'''
ar('counter','Encapsulated counter','Create a Counter class with private value starting at 0, add(delta), and get(). Apply the changes and print the value after each one.',lambda a,t:list(itertools.accumulate(a)),'Counter c=new Counter();List<Long> out=new ArrayList<>();for(long x:a){c.add(x);out.add(c.get());}return fmt(out);')
register('rectangle','Rectangle objects','Create a Rectangle class with private length and width, a constructor, and an area() method. Print each supplied rectangle’s area.','Read n, then n pairs length width.','Print areas in input order; n=0: EMPTY.',['2\n3 4\n5 2','1\n1 1','0','2\n0 5\n0 0','1\n100000 100000'],lambda raw:[a*b for a,b in zip(list(map(int,raw.split()))[1::2],list(map(int,raw.split()))[2::2])],'int n=s.nextInt();List<Long> out=new ArrayList<>();while(n-->0){Rectangle r=new Rectangle(s.nextLong(),s.nextLong());out.add(r.area());}return fmt(out);',['0≤n≤1,000','0≤dimensions≤1,000,000'])
register('payroll','Employee pay objects','Create an Employee class exposing pay(). Each record supplies base pay, overtime hours, and rate. Pay equals base+hours×rate. Print each pay; explain how an interface could support a second pay policy.','Read n followed by n triples: base hours rate.','Print n integer payments, or EMPTY.',['2\n1000 4 50\n2000 0 20','1\n0 5 10','0','1\n100 0 0','2\n10 2 3\n999999 100 1000'],lambda raw:[b+h*r for b,h,r in zip(list(map(int,raw.split()))[1::3],list(map(int,raw.split()))[2::3],list(map(int,raw.split()))[3::3])],'int n=s.nextInt();List<Long> out=new ArrayList<>();while(n-->0){Employee e=new Employee(s.nextLong(),s.nextLong(),s.nextLong());out.add(e.pay());}return fmt(out);',['0≤n≤1,000','0≤base,hours,rate≤1,000,000'])
ar('gradebook','Gradebook summary object','Create a GradeBook class that holds scores and exposes passedCount() and bestScore(). A passing score is ≥50. Print those results; an empty gradebook prints 0 NONE.',lambda a,t:f'{sum(x>=50 for x in a)} {max(a) if a else "NONE"}','int count=0;long best=-1;for(long x:a){if(x>=50)count++;best=Math.max(best,x);}return count+" "+(a.length==0?"NONE":""+best);',arrays=[[40,50,80],[0,100],[],[49],[50,50,50]],bounds=['0≤n≤1,000','0≤score≤100'])
register('cart','Shopping cart total','Model each cart line as an object with unit price and quantity. Print total cost and total item count. A zero-quantity line adds nothing.','Read n, followed by n pairs unitPrice quantity.','Print totalCost totalQuantity.',['2\n10 3\n25 2','1\n99 1','0','2\n100 0\n0 5','1\n1000000 1000000'],lambda raw:[sum(a*b for a,b in zip(list(map(int,raw.split()))[1::2],list(map(int,raw.split()))[2::2])),sum(list(map(int,raw.split()))[2::2])],'int n=s.nextInt();long total=0,count=0;while(n-->0){long p=s.nextLong(),q=s.nextLong();total+=p*q;count+=q;}return total+" "+count;',['0≤n≤1,000','0≤unitPrice,quantity≤1,000,000'])
def stockroom(raw):
 z=list(map(int,raw.split()));v=z[0]
 for d in z[2:]:
  if v+d>=0:v+=d
 return v
register('stockroom','Inventory with validated updates','Create an inventory object initialized with stock. Apply each signed change only if it would keep stock nonnegative; reject the whole change otherwise. Print final stock.','Read initial stock, q, and q signed changes.','Print final stock.',['10 4\n5 -8 -20 2','0 2\n-1 5','0 0','3 3\n-3 0 -1','1000000 2\n1000000 -1'],stockroom,'long stock=s.nextLong();int q=s.nextInt();while(q-->0){long d=s.nextLong();if(stock+d>=0)stock+=d;}return ""+stock;',['0≤initialStock≤1,000,000','0≤q≤1,000','|change|≤1,000,000'])
def parking(raw):
 z=list(map(int,raw.split()));cap=z[0];v=0;out=[]
 for d in z[2:]:
  if 0<=v+d<=cap:v+=d;out.append(v)
  else:out.append('REJECT')
 return out
register('parking','Capacity-controlled parking','Create a ParkingLot class with capacity and current occupancy initially zero. Each event is +1 (arrival) or −1 (departure). Accept only if occupancy stays within 0..capacity. Print new occupancy for accepted events or REJECT.','Read capacity, q, then q events.','Print one token per event; q=0: EMPTY.',['2 5\n1 1 1 -1 -1','0 2\n1 -1','3 0','1 3\n-1 1 -1','2 4\n1 -1 -1 1'],parking,'int cap=s.nextInt(),q=s.nextInt(),v=0;List<String> out=new ArrayList<>();while(q-->0){int d=s.nextInt();if(v+d>=0&&v+d<=cap){v+=d;out.add(""+v);}else out.add("REJECT");}return fmt(out);',['0≤capacity,q≤1,000','Every event is 1 or −1.'])
def lending(raw):
 z=raw.split();n,q=map(int,z[:2]);held=set();out=[]
 for i in range(q):
  op,ident=z[2+i*2:4+i*2];b=int(ident);ok=b not in held if op=='BORROW' else b in held
  if ok:
   if op=='BORROW':held.add(b)
   else:held.remove(b)
  out.append(str(ok).lower())
 return out
register('lending','Library lending state','There are books numbered 1..n, each initially available. A BORROW succeeds only if available; RETURN succeeds only if borrowed. Encapsulate status in a Library class. Print whether each operation succeeds.','Read n,q, then q lines of BORROW id or RETURN id.','Print true/false per operation; q=0: EMPTY.',['3 4\nBORROW 1\nBORROW 1\nRETURN 1\nRETURN 1','1 2\nRETURN 1\nBORROW 1','1 0','2 4\nBORROW 1\nBORROW 2\nRETURN 1\nBORROW 1','2 2\nBORROW 2\nRETURN 2'],lending,'int n=s.nextInt(),q=s.nextInt();Set<Integer> held=new HashSet<>();List<String> out=new ArrayList<>();while(q-->0){String op=s.next();int id=s.nextInt();out.add(""+(op.equals("BORROW")?held.add(id):held.remove(id)));}return fmt(out);',['1≤n≤1,000','0≤q≤1,000','IDs are valid.'])
def transfer(raw):
 a,t=unpack(raw);q=t[0]
 for i in range(q):
  f,to,v=t[1+3*i:4+3*i]
  if v>0 and a[f]>=v:a[f]-=v;a[to]+=v
 return a
ar('transfer','Atomic account transfers','Create Account objects with private balances. Read q transfers: fromIndex toIndex amount. Apply both debit and credit only if amount>0 and source has enough money. Rejected transfers change nothing. Same-account transfers leave balance unchanged.',lambda a,t:transfer(arr(a,t)),'int q=s.nextInt();while(q-->0){int f=s.nextInt(),to=s.nextInt();long v=s.nextLong();if(v>0&&a[f]>=v){a[f]-=v;a[to]+=v;}}return fmt(a);',[arr(a,t) for a,t in [([10,20],[2,0,1,5,1,0,100]),([0],[1,0,0,1]),([5],[1,0,0,5]),([1,2],[0]),([100,0,0],[2,0,1,40,1,2,20])]],extra=' Then read q and q triples.',bounds=['1≤n≤100','0≤balance≤1,000,000','0≤q≤1,000','Valid account indices; |amount|≤1,000,000'])
def minstack(raw):
 z=raw.split();q=int(z[0]);i=1;st=[];out=[]
 for _ in range(q):
  op=z[i];i+=1
  if op=='PUSH':st.append(int(z[i]));i+=1
  elif op=='POP':out.append(st.pop() if st else 'EMPTY')
  else:out.append(min(st) if st else 'EMPTY')
 return out
register('minstack','Stack with constant-time minimum','Implement PUSH x, POP, and MIN. POP prints and removes the top; MIN prints the smallest current value without removing it. Empty POP or MIN prints EMPTY. Aim for O(1) per operation.','Read q, then q commands.','Print results only for POP/MIN; if there are no results, print EMPTY.',['6\nPUSH 4\nPUSH 2\nMIN\nPOP\nMIN\nPOP','2\nPOP\nMIN','0','5\nPUSH -2\nPUSH -2\nPOP\nMIN\nPOP','4\nPUSH 9\nPUSH 1\nPUSH 7\nMIN'],minstack,'int q=s.nextInt();Deque<Long> st=new ArrayDeque<>(),mins=new ArrayDeque<>();List<String> out=new ArrayList<>();while(q-->0){String op=s.next();if(op.equals("PUSH")){long x=s.nextLong();st.push(x);mins.push(mins.isEmpty()?x:Math.min(x,mins.peek()));}else if(op.equals("POP")){if(st.isEmpty())out.add("EMPTY");else{out.add(""+st.pop());mins.pop();}}else out.add(mins.isEmpty()?"EMPTY":""+mins.peek());}return fmt(out);',['0≤q≤1,000','|x|≤1,000,000'])
def lru(a,t):
 cap=t[0];cache=[];miss=0
 for x in a:
  if x in cache:cache.remove(x)
  else:miss+=1
  cache.append(x)
  if len(cache)>cap:cache.pop(0)
 return miss
ar('lru','LRU cache misses','Read cache capacity k. Process page IDs with a least-recently-used cache initially empty. Every access refreshes recency; a miss inserts and may evict the least recent item. Capacity zero means every access misses. Print misses.',lru,'int k=s.nextInt(),miss=0;LinkedHashMap<Long,Boolean> cache=new LinkedHashMap<>(16,0.75f,true);for(long x:a){if(cache.get(x)==null)miss++;cache.put(x,true);if(cache.size()>k)cache.remove(cache.keySet().iterator().next());}return ""+miss;',[arr(a,[k]) for a,k in [([1,2,1,3,1,2],2),([1,1,1],0),([],3),([1,2,3],5),([2,2,2],1)]],extra=' Then read capacity k (0≤k≤1,000).')
def fcfs(raw):
 z=list(map(int,raw.split()));clock=0;out=[]
 for a,b in zip(z[1::2],z[2::2]):start=max(clock,a);out.append(start-a);clock=start+b
 return out
register('fcfs','First-come-first-served waiting times','Jobs arrive in nondecreasing arrival-time order; ties keep input order. A single server runs jobs to completion. Print the waiting time of each job.','Read n then n pairs arrivalTime serviceDuration.','Print waiting times in input order, or EMPTY.',['3\n0 3\n1 2\n5 4','2\n5 2\n10 1','0','1\n0 0','3\n0 5\n0 2\n0 1'],fcfs,'int n=s.nextInt();long clock=0;List<Long> out=new ArrayList<>();while(n-->0){long a=s.nextLong(),b=s.nextLong();clock=Math.max(clock,a);out.add(clock-a);clock+=b;}return fmt(out);',['0≤n≤1,000','0≤arrival,duration≤1,000,000','Arrivals are sorted.'])
ar('sjf','Shortest-job-first schedule','All jobs arrive at time 0. Print their execution order as zero-based indices using nonpreemptive shortest-job-first; ties use lower input index.',lambda a,t:sorted(range(len(a)),key=lambda i:(a[i],i)),'List<Integer> out=new ArrayList<>();for(int i=0;i<a.length;i++)out.add(i);out.sort(Comparator.comparingLong((Integer i)->a[i]).thenComparingInt(i->i));return fmt(out);',arrays=[[6,2,8,3],[2,2,1],[],[0],[0,5,0]],bounds=['0≤n≤1,000','0≤duration≤1,000,000'])
from structures import twoarrays
def firstfit(a,b):
 a=a.copy();out=[]
 for x in b:
  j=next((i for i,v in enumerate(a) if v>=x),-1);out.append(j)
  if j>=0:a[j]-=x
 return out
twoarrays('firstfit','First-fit memory allocation','First array contains free block sizes; second contains requested sizes. Process requests in order; allocate each from the first block with enough remaining capacity, reducing that block. Print its index or −1 if impossible.',firstfit,'List<Integer> out=new ArrayList<>();for(long x:b){int found=-1;for(int i=0;i<a.length;i++)if(a[i]>=x){found=i;a[i]-=x;break;}out.add(found);}return fmt(out);',[([10,20],[5,10,10,8]),([],[1]),([5],[]),([5,5],[6,5,5]),([1],[1,1])],['0≤n,m≤1,000','Block sizes≥0, requests>0; all≤1,000,000'])
def transactions(raw):
 z=raw.split();v=int(z[0]);q=int(z[1]);snap=None;i=2
 for _ in range(q):
  op=z[i];i+=1
  if op=='BEGIN':snap=v
  elif op=='ADD':v+=int(z[i]);i+=1
  elif op=='ROLLBACK':v=snap;snap=None
  else:snap=None
 return v
register('transactions','Single-level transaction simulator','Maintain an integer value. BEGIN snapshots it, ADD x changes it, ROLLBACK restores the snapshot, and COMMIT retains changes. Transactions never nest; every BEGIN has exactly one COMMIT or ROLLBACK. ADD may occur outside a transaction.','Read initialValue and q, then q commands.','Print the final value.',['10 4\nBEGIN\nADD 5\nADD -2\nROLLBACK','0 3\nBEGIN\nADD 7\nCOMMIT','5 0','1 1\nADD -4','0 6\nBEGIN\nADD 5\nCOMMIT\nBEGIN\nADD 7\nROLLBACK'],transactions,'long v=s.nextLong(),snapshot=0;int q=s.nextInt();while(q-->0){String op=s.next();switch(op){case "BEGIN":snapshot=v;break;case "ADD":v+=s.nextLong();break;case "ROLLBACK":v=snapshot;break;default:break;}}return ""+v;',['0≤q≤1,000','|initialValue|,|x|≤1,000,000','Command sequences follow the stated transaction rules.'])
register('groupbudget','GROUP BY in Java','Each record has a department ID and signed amount. Aggregate amounts by department and output department-total pairs in increasing department order.','Read n, then n pairs departmentId amount.','Print flattened departmentId total pairs, or EMPTY.',['4\n2 10\n1 5\n2 -3\n1 8','2\n4 0\n4 0','0','1\n1 -10','3\n3 7\n2 9\n1 5'],lambda raw:groupbudget(raw),'int n=s.nextInt();Map<Long,Long> totals=new TreeMap<>();while(n-->0)totals.merge(s.nextLong(),s.nextLong(),Long::sum);List<Long> out=new ArrayList<>();for(var e:totals.entrySet()){out.add(e.getKey());out.add(e.getValue());}return fmt(out);',['0≤n≤1,000','1≤departmentId≤1,000,000','|amount|≤1,000,000'])
def groupbudget(raw):
 z=list(map(int,raw.split()));d=collections.Counter()
 for k,v in zip(z[1::2],z[2::2]):d[k]+=v
 return [v for k in sorted(d) for v in [k,d[k]]]
register('joins','Implement a left lookup join','The first table maps unique department IDs to budgets. The second table lists employees’ department IDs in employee order. Print the matched budget for each employee, or NULL if missing.','Read n and n pairs departmentId budget; then m and m employeeDepartment IDs.','Print m budget/NULL tokens, or EMPTY.',['2\n1 100\n2 200\n3\n2 1 3','0\n2\n1 2','1\n5 0\n0','1\n1 -10\n2\n1 1','3\n3 30\n1 10\n2 20\n3\n1 2 3'],lambda raw:joins(raw),'int n=s.nextInt();Map<Long,Long> d=new HashMap<>();while(n-->0)d.put(s.nextLong(),s.nextLong());int m=s.nextInt();List<String> out=new ArrayList<>();while(m-->0){Long v=d.get(s.nextLong());out.add(v==null?"NULL":""+v);}return fmt(out);',['0≤n,m≤1,000','IDs are positive and≤1,000,000; budgets have absolute value≤1,000,000.'])
def joins(raw):
 z=list(map(int,raw.split()));n=z[0];d=dict(zip(z[1:2*n+1:2],z[2:2*n+1:2]));return [d.get(x,'NULL') for x in z[2*n+2:]]
register('keywordmatch','Count a skill keyword','Read a lowercase skill keyword and one ASCII sentence. Count case-insensitive whole-word matches. Words are maximal runs of A–Z or a–z; punctuation separates words.','Read keyword on line 1, text on line 2.','Print the count.',['java\nJava, SQL and JAVA.','sql\nNoSQL SQL sql.','java\n','a\nA aaaa a','python\nPython/python PYTHON'],lambda raw:re.findall('[a-z]+',raw.split('\n')[1].lower()).count(raw.split('\n')[0]),'String[] lines=raw.split("\\n",-1);String key=lines[0],text=lines[1].toLowerCase(Locale.ROOT);int count=0;for(String w:text.split("[^a-z]+"))if(w.equals(key))count++;return ""+count;',['Keyword: 1–30 lowercase letters','Text: 0–1,000 ASCII characters'])
ar('longeststreak','Longest active-day streak','Each value is a daily completed-task count. Print the longest consecutive run of days with count>0. Zero breaks a streak.',lambda a,t:max([0]+[len(list(g)) for active,g in itertools.groupby(a,lambda x:x>0) if active]),'int best=0,run=0;for(long x:a){run=x>0?run+1:0;best=Math.max(best,run);}return ""+best;',arrays=[[1,2,0,1,1,1],[0,0],[],[1],[1,0,2,0,3]],bounds=['0≤n≤1,000','0≤count≤1,000,000'])
ar('packetorder','Reassemble unique packet IDs','Packets arrive out of order and may be retransmitted. Print the distinct sequence IDs in increasing order.',lambda a,t:sorted(set(a)),'Set<Long> out=new TreeSet<>();for(long x:a)out.add(x);return fmt(out);')
ar('checksum','Eight-bit additive checksum','Input values are bytes 0..255. Print the checksum byte c such that (sum(bytes)+c) mod 256=0 and 0≤c≤255.',lambda a,t:(-sum(a))%256,'long sum=0;for(long x:a)sum+=x;return ""+((256-sum%256)%256);',arrays=[[1,2,3],[255,1],[],[0],[255,255,255]],bounds=['0≤n≤1,000','0≤byte≤255'])
string('ipv4','Validate dotted IPv4','Print true if the line has exactly four decimal components from 0 to 255, separated by dots. Leading zeros are forbidden except the single digit 0. Signs, spaces, and empty components are invalid.',lambda t:len(t.split('.'))==4 and all(re.fullmatch('0|[1-9][0-9]{0,2}',p) and int(p)<=255 for p in t.split('.')),'String[] p=text.split("[.]",-1);if(p.length!=4)return "false";for(String v:p){if(!v.matches("0|[1-9][0-9]{0,2}")||Integer.parseInt(v)>255)return "false";}return "true";',fixtures=['192.168.1.1','256.1.2.3','','0.0.0.0','01.2.3.4','1.2.3.'])
