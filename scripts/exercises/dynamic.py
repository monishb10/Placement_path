from core import *
def wiggle(a):
 up=down=1 if a else 0
 for i in range(1,len(a)):
  if a[i]>a[i-1]:up=down+1
  elif a[i]<a[i-1]:down=up+1
 return max(up,down)
def recurrence(n,bases,offsets,mod=1000000007):
 d=list(bases)
 for i in range(len(d),n+1):d.append(sum(d[i-j] for j in offsets if i>=j)%mod)
 return d[n]
def rec(key,title,statement,bases,offsets,limit=100):
 scalar(key,title,statement+' Print the result modulo 1,000,000,007.',lambda n:recurrence(n,bases,offsets),'int n=s.nextInt();long[] d=new long[Math.max(n+1,'+str(len(bases))+')];long[] base={'+','.join(map(str,bases))+'};System.arraycopy(base,0,d,0,base.length);for(int i=base.length;i<=n;i++){for(int k:new int[]{'+','.join(map(str,offsets))+'})if(i>=k)d[i]=(d[i]+d[i-k])%1000000007;}return ""+d[n];',['5','7','0','1',str(limit)],['0≤n≤'+str(limit)])
rec('lucas','Lucas recurrence','Read n. L(0)=2, L(1)=1, and L(n)=L(n−1)+L(n−2).',[2,1],[1,2])
rec('tribonacci','Tribonacci recurrence','Read n. T(0)=0, T(1)=0, T(2)=1; later values sum the previous three.',[0,0,1],[1,2,3])
rec('steps13','Stairs with steps 1 or 3','Read n. Count ordered sequences of moves of size 1 or 3 totaling n. The empty sequence counts once for n=0.',[1],[1,3])
rec('steps123','Stairs with three move sizes','Read n. Count ordered move sequences using 1, 2, or 3 steps that total n. There is one empty sequence.',[1],[1,2,3])
rec('binaryno11','Binary strings without 11','Read n. Count length-n binary strings with no consecutive 1 bits; the empty string counts once.',[1,2],[1,2])
rec('tiling4','Tile a 4-by-n board','Use 4×1 tiles, allowed to rotate. Read n and count tilings of a 4×n rectangle. The empty board has one tiling.',[1],[1,4])
rec('fibonaccieven','Even-index Fibonacci values','Read n. Print F(2n), where F(0)=0 and F(1)=1.',[0,1],[1,2])
# Replace this exercise with its true even-index recurrence, not F(n).
RECIPES.pop('fibonaccieven')
scalar('fibonaccieven','Even-index Fibonacci values','Read n. Print F(2n) modulo 1,000,000,007, where F(0)=0,F(1)=1.',lambda n:recurrence(2*n,[0,1],[1,2]),'int n=s.nextInt();long a=0,b=1;for(int i=0;i<2*n;i++){long c=(a+b)%1000000007;a=b;b=c;}return ""+a;',['3','5','0','1','100'],['0≤n≤100'])
scalar('fibsum','Fibonacci prefix sum','Read n. Print F(0)+…+F(n) modulo 1,000,000,007, with F(0)=0,F(1)=1.',lambda n:sum(recurrence(i,[0,1],[1,2]) for i in range(n+1))%1000000007,'int n=s.nextInt();long a=0,b=1,total=0;for(int i=0;i<=n;i++){total=(total+a)%1000000007;long c=(a+b)%1000000007;a=b;b=c;}return ""+total;',['5','8','0','1','100'],['0≤n≤100'])
def catalan(n):return math.comb(2*n,n)//(n+1)%1000000007
scalar('catalan','Count balanced bracket strings','Read n pairs of round brackets. Count the balanced strings using exactly n pairs, modulo 1,000,000,007.',catalan,'int n=s.nextInt();long[] d=new long[n+1];d[0]=1;for(int i=1;i<=n;i++)for(int j=0;j<i;j++)d[i]=(d[i]+d[j]*d[i-1-j])%1000000007;return ""+d[n];',['3','4','0','1','100'],['0≤n≤100'])
def friend(n):
 a,b=1,1
 for i in range(2,n+1):a,b=b,(b+(i-1)*a)%1000000007
 return b
scalar('friends','Single friends and pairs','Read n labeled friends. Count arrangements where each friend is single or in one unordered pair. Print modulo 1,000,000,007.',friend,'int n=s.nextInt();long a=1,b=1;for(int i=2;i<=n;i++){long c=(b+(i-1)*a)%1000000007;a=b;b=c;}return ""+b;',['3','4','0','1','100'],['0≤n≤100'])
def derange(n):
 d=[1,0]
 for i in range(2,n+1):d.append((i-1)*(d[i-1]+d[i-2])%1000000007)
 return d[n]
scalar('derange','Derangements','Read n. Count permutations of 1..n where no item remains in its original position. Empty permutation counts once. Print modulo 1,000,000,007.',derange,'int n=s.nextInt();if(n==0)return "1";long a=1,b=0;for(int i=2;i<=n;i++){long c=(i-1)*(a+b)%1000000007;a=b;b=c;}return ""+b;',['3','4','0','1','100'],['0≤n≤100'])
def subsets(a,target):return sum(sum(a[i] for i in range(len(a)) if mask>>i&1)==target for mask in range(1<<len(a)))
TAIL=[arr(a,[t]) for a,t in [([2,3,5],5),([0,0,1],1),([],0),([4],3),([1,1,1,1],2)]]
ar('subsetcount','Count target-sum subsets','Read nonnegative target t. Count subsets of indices whose values sum to t. Equal values at different indices are distinct choices; include the empty subset.',lambda a,t:subsets(a,t[0]),'int target=s.nextInt();long[] d=new long[target+1];d[0]=1;for(long x:a)for(int j=target;j>=x;j--)d[j]+=d[j-(int)x];return ""+d[target];',TAIL,extra=' Then read target t.',bounds=['0≤n≤20','0≤a[i]≤100','0≤t≤2,000'])
ar('partition','Equal partition','Values are nonnegative. Print true if all elements can be split between two subsets with equal sum. Empty subsets are allowed.',lambda a,t:sum(a)%2==0 and subsets(a,sum(a)//2)>0,'int sum=0;for(long x:a)sum+=(int)x;if(sum%2==1)return "false";boolean[] d=new boolean[sum/2+1];d[0]=true;for(long x:a)for(int j=sum/2;j>=x;j--)d[j]|=d[j-(int)x];return ""+d[sum/2];',arrays=[[1,5,11,5],[1,2,3,5],[],[0,0],[1]],bounds=['0≤n≤20','0≤a[i]≤100'])
ar('partitiondiff','Minimum partition difference','Assign every nonnegative element to one of two groups. Print the smallest absolute difference between their sums.',lambda a,t:min(abs(sum(a)-2*sum(a[i] for i in range(len(a)) if m>>i&1)) for m in range(1<<len(a))),'int total=0;for(long x:a)total+=(int)x;boolean[] d=new boolean[total/2+1];d[0]=true;for(long x:a)for(int j=total/2;j>=x;j--)d[j]|=d[j-(int)x];for(int j=total/2;j>=0;j--)if(d[j])return ""+(total-2*j);return "0";',arrays=[[1,6,11,5],[1,2,7],[],[0,0],[9]],bounds=['0≤n≤20','0≤a[i]≤100'])
ar('subsetreachable','Count distinct subset sums','Print how many distinct totals can be formed by subsets, including total zero. Values are nonnegative.',lambda a,t:len({sum(a[i] for i in range(len(a)) if m>>i&1) for m in range(1<<len(a))}),'int total=0;for(long x:a)total+=(int)x;boolean[] d=new boolean[total+1];d[0]=true;for(long x:a)for(int j=total;j>=x;j--)d[j]|=d[j-(int)x];int count=0;for(boolean v:d)if(v)count++;return ""+count;',arrays=[[1,2,2],[3,7],[],[0,0],[5]],bounds=['0≤n≤20','0≤a[i]≤100'])
def coin(a,t,mode):
 d=[0]*(t+1);d[0]=1
 if mode=='ordered':
  for i in range(1,t+1):d[i]=sum(d[i-x] for x in a if x<=i)
 else:
  for x in a:
   for i in range(x,t+1):d[i]+=d[i-x]
 return d[t]
COINS=[arr(a,[t]) for a,t in [([1,2,5],5),([2,3],7),([],0),([4],3),([1],10)]]
for key,title,ordered in [('coinways','Unordered coin combinations',False),('orderedcoins','Ordered move combinations',True)]:
 ar(key,title,'Read distinct positive denominations and target t. Each value may be used repeatedly. Count '+('ordered sequences' if ordered else 'combinations ignoring order')+' totaling t; target zero has one empty choice.',lambda a,t,o=ordered:coin(a,t[0],'ordered' if o else 'unordered'),'int t=s.nextInt();long[] d=new long[t+1];d[0]=1;'+('for(int i=1;i<=t;i++)for(long x:a)if(x<=i)d[i]+=d[i-(int)x];' if ordered else 'for(long x:a)for(int i=(int)x;i<=t;i++)d[i]+=d[i-(int)x];')+'return ""+d[t];',COINS,extra=' Then read target t.',bounds=['0≤n≤10; denominations are distinct','1≤a[i]≤30','0≤t≤30'])
def coinmin(a,t):
 d=[0]+[t+1]*t
 for i in range(1,t+1):d[i]=min([t+1]+[d[i-x]+1 for x in a if x<=i])
 return -1 if d[t]>t else d[t]
ar('coinmin','Minimum number of coins','Read positive distinct denominations and target t. Coins are unlimited. Print the minimum coin count, or −1 if impossible.',lambda a,t:coinmin(a,t[0]),'int t=s.nextInt();int[] d=new int[t+1];Arrays.fill(d,t+1);d[0]=0;for(int i=1;i<=t;i++)for(long x:a)if(x<=i)d[i]=Math.min(d[i],d[i-(int)x]+1);return ""+(d[t]>t?-1:d[t]);',COINS,extra=' Then read t.',bounds=['0≤n≤10','1≤a[i]≤100','0≤t≤1,000'])
def inc(a,kind):
 if not a:return 0
 d=[1]*len(a)
 for i in range(len(a)):
  for j in range(i):
   if (a[j]<=a[i] if kind=='nondec' else a[j]>a[i] if kind=='decreasing' else a[j]<a[i]):d[i]=max(d[i],d[j]+1)
 return max(d)
for key,title,kind,condition in [('nondec','Longest nondecreasing subsequence','nondec','≤'),('decreasing','Longest decreasing subsequence','decreasing','>')]:
 ar(key,title,'Print the maximum length of a subsequence where each selected value is '+('at least' if kind=='nondec' else 'strictly less than')+' the previous one. A subsequence may skip indices.',lambda a,t,k=kind:inc(a,k),'int[] d=new int[a.length];int best=0;for(int i=0;i<a.length;i++){d[i]=1;for(int j=0;j<i;j++)if(a[j]'+('<=' if kind=='nondec' else '>')+'a[i])d[i]=Math.max(d[i],d[j]+1);best=Math.max(best,d[i]);}return ""+best;')
def incsum(a):
 d=a.copy()
 for i in range(len(a)):
  for j in range(i):
   if a[j]<a[i]:d[i]=max(d[i],d[j]+a[i])
 return max(d,default=0)
ar('incsum','Maximum-sum increasing subsequence','Print the greatest sum of a nonempty strictly increasing subsequence. If n=0 print 0. Negative values are allowed.',lambda a,t:incsum(a),'long[] d=a.clone();long best=a.length==0?0:Long.MIN_VALUE;for(int i=0;i<a.length;i++){for(int j=0;j<i;j++)if(a[j]<a[i])d[i]=Math.max(d[i],d[j]+a[i]);best=Math.max(best,d[i]);}return ""+best;')
def liscount(a):
 d=[1]*len(a);c=[1]*len(a)
 for i in range(len(a)):
  for j in range(i):
   if a[j]<a[i]:
    if d[j]+1>d[i]:d[i],c[i]=d[j]+1,c[j]
    elif d[j]+1==d[i]:c[i]+=c[j]
 return sum(c[i] for i in range(len(a)) if d[i]==max(d)) if a else 0
ar('liscount','Count longest increasing subsequences','Count index-distinct strictly increasing subsequences of maximum length. Print 0 for an empty input.',lambda a,t:liscount(a),'int[] d=new int[a.length];long[] c=new long[a.length];int best=0;for(int i=0;i<a.length;i++){d[i]=1;c[i]=1;for(int j=0;j<i;j++)if(a[j]<a[i]){if(d[j]+1>d[i]){d[i]=d[j]+1;c[i]=c[j];}else if(d[j]+1==d[i])c[i]+=c[j];}best=Math.max(best,d[i]);}long count=0;for(int i=0;i<a.length;i++)if(d[i]==best)count+=c[i];return ""+count;',arrays=[[1,3,5,4,7],[2,2,2,2],[],[1],[1,2,1,2]],bounds=['0≤n≤30','|a[i]|≤1,000,000'])
def bitonic(a):
 d=[1]*len(a);e=d.copy()
 for i in range(len(a)):
  for j in range(i):
   if a[j]<a[i]:d[i]=max(d[i],d[j]+1)
 for i in range(len(a)-1,-1,-1):
  for j in range(i+1,len(a)):
   if a[j]<a[i]:e[i]=max(e[i],e[j]+1)
 return max([0]+[d[i]+e[i]-1 for i in range(len(a))])
ar('bitonic','Longest bitonic subsequence','Find a longest subsequence that strictly increases and then strictly decreases. Either side may contain only the peak.',lambda a,t:bitonic(a),'int n=a.length;int[] d=new int[n],e=new int[n];Arrays.fill(d,1);Arrays.fill(e,1);for(int i=0;i<n;i++)for(int j=0;j<i;j++)if(a[j]<a[i])d[i]=Math.max(d[i],d[j]+1);for(int i=n-1;i>=0;i--)for(int j=i+1;j<n;j++)if(a[j]<a[i])e[i]=Math.max(e[i],e[j]+1);int best=0;for(int i=0;i<n;i++)best=Math.max(best,d[i]+e[i]-1);return ""+best;')
def rob(a):
 p,q=0,0
 for x in a:p,q=q,max(q,p+x)
 return q
ar('rob','Maximum nonadjacent sum','Choose array elements with no adjacent selected indices. Print the maximum sum; choosing none is allowed.',lambda a,t:rob(a),'long p=0,q=0;for(long x:a){long next=Math.max(q,p+x);p=q;q=next;}return ""+q;')
ar('robcircle','Nonadjacent picks on a circle','The first and last indices are adjacent. Choose nonadjacent values for maximum sum; choosing none is allowed.',lambda a,t:0 if not a else max(0,a[0]) if len(a)==1 else max(rob(a[:-1]),rob(a[1:])),'if(a.length==0)return "0";if(a.length==1)return ""+Math.max(0,a[0]);long best=0;for(int start=0;start<=1;start++){long p=0,q=0;for(int i=start;i<a.length-1+start;i++){long next=Math.max(q,p+a[i]);p=q;q=next;}best=Math.max(best,q);}return ""+best;')
ar('wiggle','Longest alternating subsequence','Print the longest subsequence whose consecutive differences alternate strictly positive and strictly negative. Equal consecutive values do not count as a turn.',lambda a,t:wiggle(a),'if(a.length==0)return "0";int up=1,down=1;for(int i=1;i<a.length;i++){if(a[i]>a[i-1])up=down+1;else if(a[i]<a[i-1])down=up+1;}return ""+Math.max(up,down);')
