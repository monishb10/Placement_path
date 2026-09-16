from core import *
ar('sortabs','Sort by magnitude','Sort by increasing absolute value, breaking ties by the smaller signed value.',lambda a,t:sorted(a,key=lambda x:(abs(x),x)),'List<Long> out=new ArrayList<>();for(long x:a)out.add(x);out.sort(Comparator.comparingLong((Long x)->Math.abs(x)).thenComparingLong(x->x));return fmt(out);')
ar('rangetotal','Answer inclusive range queries','Read q and q valid pairs l,r after the array. For each, print the sum from zero-based l through r inclusive. Preprocess once for O(1) queries.',lambda a,t:[sum(a[t[1+i*2]:t[2+i*2]+1]) for i in range(t[0])],'long[] p=new long[a.length+1];for(int i=0;i<a.length;i++)p[i+1]=p[i]+a[i];int q=s.nextInt();List<Long> out=new ArrayList<>();while(q-->0){int l=s.nextInt(),r=s.nextInt();out.add(p[r+1]-p[l]);}return fmt(out);',[arr(a,t) for a,t in [([1,2,3,4],[3,0,3,1,2,0,0]),([-2,5],[1,0,1]),([],[0]),([7],[2,0,0,0,0]),([0,0,0],[1,1,2])]],extra=' Then read q and q index pairs.',bounds=['0≤n,q≤1,000','0≤l≤r<n for every query','|a[i]|≤1,000,000'])
def ship(a,days):
 def fits(c):
  used,total=1,0
  for x in a:
   if total+x>c:used+=1;total=0
   total+=x
  return used<=days
 return next(c for c in range(max(a),sum(a)+1) if fits(c))
ar('shipcapacity','Minimum sequential shipping capacity','Positive package weights must stay in order. Read maximum days d. Each day ships a consecutive batch of total weight at most capacity. Print the minimum capacity needed; days may be unused.',lambda a,t:ship(a,t[0]),'int days=s.nextInt();long lo=0,hi=0;for(long x:a){lo=Math.max(lo,x);hi+=x;}while(lo<hi){long mid=lo+(hi-lo)/2,total=0;int used=1;for(long x:a){if(total+x>mid){used++;total=0;}total+=x;}if(used<=days)hi=mid;else lo=mid+1;}return ""+lo;',[arr(a,[d]) for a,d in [([1,2,3,4,5],3),([3,2,2,4,1,4],3),([7],1),([2,2,2],10),([5,1,2],1)]],extra=' Then read d.',bounds=['1≤n≤1,000','1≤weight≤1,000,000','1≤d≤1,000'],hint='Feasibility is monotonic in capacity. Binary-search between the heaviest item and the total weight.')
ar('mindistance','Maximize minimum placement distance','Read k. Choose k distinct positions from the array, maximizing the minimum distance between any two chosen positions. Positions are distinct.',lambda a,t:max(min(y-x for x,y in zip(c,c[1:])) for c in itertools.combinations(sorted(a),t[0])),'int k=s.nextInt();Arrays.sort(a);long lo=0,hi=a[a.length-1]-a[0];while(lo<hi){long mid=lo+(hi-lo+1)/2,last=a[0];int count=1;for(long x:a)if(x-last>=mid){count++;last=x;}if(count>=k)lo=mid;else hi=mid-1;}return ""+lo;',[arr(a,[k]) for a,k in [([1,2,8,4,9],3),([0,10],2),([-4,0,4],3),([1,3,5,7],2),([9,2,15,6],3)]],extra=' Then read k.',bounds=['2≤n≤1,000','2≤k≤n','Distinct positions; |position|≤1,000,000'])
def unbounded(raw):
 z=list(map(int,raw.split()));n,w=z[:2];items=list(zip(z[2::2],z[3::2]));d=[0]*(w+1)
 for c in range(1,w+1):d[c]=max([0]+[v+d[c-wt] for wt,v in items if wt<=c])
 return d[w]
register('unbounded','Unbounded knapsack value','Choose any number of copies of each item. Stay within capacity W and maximize total value. Unused capacity is allowed.','Read n and W, then n pairs: positive weight and nonnegative value.','Print the maximum value.',['3 7\n2 5\n3 8\n4 9','2 5\n2 3\n4 10','0 0','1 0\n1 9','1 5\n6 20'],unbounded,'int n=s.nextInt(),w=s.nextInt();int[] wt=new int[n];long[] val=new long[n];for(int i=0;i<n;i++){wt[i]=s.nextInt();val[i]=s.nextLong();}long[] d=new long[w+1];for(int c=1;c<=w;c++)for(int i=0;i<n;i++)if(wt[i]<=c)d[c]=Math.max(d[c],d[c-wt[i]]+val[i]);return ""+d[w];',['0≤n≤100','0≤W≤1,000','1≤weight≤1,000','0≤value≤1,000,000'])
ar('rodcut','Maximum rod-cutting revenue','The array gives prices for lengths 1..n. Cut a rod of length n into pieces of integer length, maximizing revenue. The entire rod must be sold.',lambda a,t:rod(a),'long[] d=new long[a.length+1];for(int len=1;len<=a.length;len++)for(int k=1;k<=len;k++)d[len]=Math.max(d[len],a[k-1]+d[len-k]);return ""+d[a.length];',arrays=[[1,5,8,9],[2,3],[],[7],[3,5,8,9,10]],bounds=['0≤n≤100','0≤price≤1,000,000'])
def rod(a):
 d=[0]*(len(a)+1)
 for n in range(1,len(a)+1):d[n]=max(a[k-1]+d[n-k] for k in range(1,n+1))
 return d[-1]
ar('targetsigns','Assign signs to reach a target','Read target t. Assign + or − to every nonnegative value and count index-distinct assignments totaling t. Zero has two sign choices.',lambda a,t:sum(sum(x*sgn for x,sgn in zip(a,signs))==t[0] for signs in itertools.product([-1,1],repeat=len(a))),'long target=s.nextLong();Map<Long,Long> d=new HashMap<>();d.put(0L,1L);for(long x:a){Map<Long,Long> next=new HashMap<>();for(var e:d.entrySet()){next.merge(e.getKey()+x,e.getValue(),Long::sum);next.merge(e.getKey()-x,e.getValue(),Long::sum);}d=next;}return ""+d.getOrDefault(target,0L);',[arr(a,[t]) for a,t in [([1,1,1,1,1],3),([0,0,1],1),([],0),([2],1),([2,3],-1)]],extra=' Then read target t.',bounds=['0≤n≤20','0≤a[i]≤100','|t|≤2,000'])
scalar('noadjacenttwos','Stairs without consecutive double steps','Read n. Count ordered sequences of steps 1 and 2 totaling n, where two size-2 steps cannot be adjacent. Include the empty sequence for n=0. Print modulo 1,000,000,007.',lambda n:nat(n),'int n=s.nextInt();long[][] d=new long[n+1][2];d[0][0]=1;for(int i=1;i<=n;i++){d[i][0]=(d[i-1][0]+d[i-1][1])%1000000007;if(i>=2)d[i][1]=d[i-2][0];}return ""+((d[n][0]+d[n][1])%1000000007);',['4','6','0','1','100'],['0≤n≤100'])
def nat(n):
 d=[[0,0] for _ in range(n+1)];d[0][0]=1
 for i in range(1,n+1):d[i]=[sum(d[i-1])%1000000007,d[i-2][0] if i>=2 else 0]
 return sum(d[n])%1000000007
ar('divisiblechain','Largest divisible subset length','Values are positive and distinct. Find the largest subset where, after sorting, each next value is divisible by its predecessor. Print its length.',lambda a,t:divchain(a),'Arrays.sort(a);int[] d=new int[a.length];int best=0;for(int i=0;i<a.length;i++){d[i]=1;for(int j=0;j<i;j++)if(a[i]%a[j]==0)d[i]=Math.max(d[i],d[j]+1);best=Math.max(best,d[i]);}return ""+best;',arrays=[[1,2,3,8],[3,5,7],[],[4],[2,4,8,16]],bounds=['0≤n≤1,000','1≤a[i]≤1,000,000; values are distinct'])
def divchain(a):
 a=sorted(a);d=[1]*len(a)
 for i in range(len(a)):
  for j in range(i):
   if a[i]%a[j]==0:d[i]=max(d[i],d[j]+1)
 return max(d,default=0)
def chain(raw):
 z=list(map(int,raw.split()));a=sorted(zip(z[1::2],z[2::2]));d=[1]*len(a)
 for i in range(len(a)):
  for j in range(i):
   if a[j][0]<a[i][0] and a[j][1]<a[i][1]:d[i]=max(d[i],d[j]+1)
 return max(d,default=0)
for key,title,statement in [('envelopes','Nested envelopes','Envelope A fits in B only if both dimensions are strictly smaller. Rotation is forbidden. Find the longest nesting chain.'),('bridges','Maximum noncrossing bridges','Each proposed bridge connects an integer position on the north bank to one on the south bank. Choose the largest set whose north and south positions both strictly increase. Sharing an endpoint is forbidden.')]:
 register(key,title,statement,'Read n, followed by n pairs of positive integers.','Print the maximum number selected.',['4\n5 4\n6 4\n6 7\n2 3','3\n1 1\n1 2\n2 3','0','1\n9 2','4\n1 4\n2 3\n3 2\n4 1'],chain,'int n=s.nextInt();long[][] a=new long[n][2];for(int i=0;i<n;i++){a[i][0]=s.nextLong();a[i][1]=s.nextLong();}Arrays.sort(a,Comparator.comparingLong(x->x[0]));int[] d=new int[n];int best=0;for(int i=0;i<n;i++){d[i]=1;for(int j=0;j<i;j++)if(a[j][0]<a[i][0]&&a[j][1]<a[i][1])d[i]=Math.max(d[i],d[j]+1);best=Math.max(best,d[i]);}return ""+best;',['0≤n≤500','1≤each coordinate≤1,000,000'])
# A separate two-sequence DP problem replaces the mathematically identical bridge variant.
RECIPES.pop('bridges')
from structures import twoarrays

def lcis(a,b):
 candidates=[[]]
 for x in a:candidates += [c+[x] for c in candidates if not c or x>c[-1]]
 def contained(c):
  i=0
  for x in b:
   if i<len(c) and x==c[i]:i+=1
  return i==len(c)
 return max(len(c) for c in candidates if contained(c))
twoarrays('bridges','Longest common increasing subsequence','Find the maximum length of a strictly increasing sequence that is a subsequence of both inputs. It must preserve each input’s order.',lcis,'int[] d=new int[b.length];for(long x:a){int best=0;for(int j=0;j<b.length;j++){if(b[j]<x)best=Math.max(best,d[j]);else if(b[j]==x)d[j]=Math.max(d[j],best+1);}}int ans=0;for(int x:d)ans=Math.max(ans,x);return ""+ans;', [([3,4,9,1],[5,3,8,9,10,2,1]),([1,2,3],[3,2,1]),([],[]),([2,2],[2]),([1,3,2,4],[1,2,4])],['0≤n,m≤500','|each value|≤1,000,000'])
from grids import grid
def rect(a):return max([0]+[(r-i)*(c-j) for i in range(len(a)) for r in range(i+1,len(a)+1) for j in range(len(a[0])) for c in range(j+1,len(a[0])+1) if all(a[x][y]==1 for x in range(i,r) for y in range(j,c))])
grid('gridrectangle','Largest all-one rectangle','Print the area of the largest contiguous rectangle containing only ones in a binary matrix.',rect,'long[] h=new long[c];long best=0;for(int i=0;i<r;i++){for(int j=0;j<c;j++)h[j]=a[i][j]==0?0:h[j]+1;Deque<Integer> st=new ArrayDeque<>();for(int j=0;j<=c;j++){long v=j==c?0:h[j];while(!st.isEmpty()&&h[st.peek()]>=v){long height=h[st.pop()];int left=st.isEmpty()?0:st.peek()+1;best=Math.max(best,height*(j-left));}st.push(j);}}return ""+best;',fixtures=[[[1,0,1],[1,1,1]],[[0]],[[1]],[[1,1,1]],[[1,1],[1,1]]],bounds=['1≤r,c≤20','Each cell is 0 or 1.'])
