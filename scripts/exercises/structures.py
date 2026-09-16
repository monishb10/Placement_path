from core import *
ar('middle','Middle list element','Build a singly linked list from the input. Print its middle value; for even length choose the second middle. Empty list: EMPTY. Use slow and fast pointers.',lambda a,t:a[len(a)//2] if a else 'EMPTY','return a.length==0?"EMPTY":""+a[a.length/2];')
ar('removenth','Remove kth node from the end','Build a singly linked list. Read k after its values and remove the kth node from the end. If k is not in 1..n, keep the list unchanged. Print remaining values.',lambda a,t:a[:len(a)-t[0]]+a[len(a)-t[0]+1:] if 1<=t[0]<=len(a) else a,'int k=s.nextInt();List<Long> out=new ArrayList<>();for(int i=0;i<a.length;i++)if(k<1||k>a.length||i!=a.length-k)out.add(a[i]);return fmt(out);',[arr(a,[k]) for a,k in [([1,2,3,4,5],2),([7],1),([],1),([1,2],3),([5,6,7],3)]],extra=' Then read k (0≤k≤1,001).',hint='Move a fast pointer k nodes ahead, then move both pointers. A dummy head simplifies removal of the first node.')
ar('listcycle','Locate a linked-list cycle entry','Build nodes in array order. Read pos; if pos≥0, link the tail to the zero-based node pos. Otherwise leave the tail null. Use Floyd’s algorithm and print the cycle entry index or −1.',lambda a,t:t[0],'int pos=s.nextInt();return ""+pos;',[arr(a,[k]) for a,k in [([3,2,0,-4],1),([7],0),([],-1),([1,2],-1),([1,2,3],0)]],extra=' Then read pos, which is −1 or a valid index; empty list uses −1.')
# The cycle entry is supplied by the serialization; testing it cannot prove Floyd’s implementation.
# Use an operational cycle-removal exercise instead, where output includes the distinct traversal.
RECIPES.pop('listcycle')
ar('pairsswap','Swap neighboring list nodes','Build a singly linked list and swap every adjacent pair of nodes. Leave an unmatched last node in place. Print the resulting values.',lambda a,t:[a[i+1] if i%2==0 and i+1<len(a) else a[i-1] if i%2 else a[i] for i in range(len(a))],'for(int i=0;i+1<a.length;i+=2){long v=a[i];a[i]=a[i+1];a[i+1]=v;}return fmt(a);')
ar('listpal','Check a linked-list palindrome','Build a singly linked list. Print true if its values read identically from both ends. Aim for O(n) time and O(1) auxiliary space by reversing half, then restoring it.',lambda a,t:a==a[::-1],'for(int i=0;i<a.length/2;i++)if(a[i]!=a[a.length-1-i])return "false";return "true";',arrays=[[1,2,1],[1,2],[],[4],[2,2,2,2]])
ar('kthsmall','Kth smallest with a heap','Read valid one-based k. Print the kth smallest array element; duplicates occupy separate ranks.',lambda a,t:sorted(a)[t[0]-1],'int k=s.nextInt();PriorityQueue<Long> q=new PriorityQueue<>(Comparator.reverseOrder());for(long x:a){q.add(x);if(q.size()>k)q.poll();}return ""+q.peek();',[arr(a,[k]) for a,k in [([7,2,5,1],2),([4,4,2],2),([8],1),([-4,-2,-8],3),([1,2,3],1)]],extra=' Then read k.',bounds=['1≤n≤1,000','1≤k≤n','|a[i]|≤1,000,000'])
ar('rope','Minimum rope connection cost','Repeatedly join two ropes, paying their combined length and adding that combined rope back. Print the minimum total cost. Zero or one rope costs zero.',lambda a,t:ropes(a),'PriorityQueue<Long> q=new PriorityQueue<>();for(long x:a)q.add(x);long total=0;while(q.size()>1){long v=q.poll()+q.poll();total+=v;q.add(v);}return ""+total;',arrays=[[4,3,2,6],[1,2,3],[],[5],[0,0,2]],bounds=['0≤n≤1,000','0≤length≤1,000,000'])
def ropes(a):
 q=a.copy();heapq.heapify(q);total=0
 while len(q)>1:
  v=heapq.heappop(q)+heapq.heappop(q);total+=v;heapq.heappush(q,v)
 return total
ar('runningmedian','Median after each insertion','After each new value, print the median of the prefix seen so far. For even prefix length, print the mean of the two middle values.',lambda a,t:' '.join(str((sorted(a[:i])[i//2]+sorted(a[:i])[(i-1)//2])/2) for i in range(1,len(a)+1)) or 'EMPTY','PriorityQueue<Long> lo=new PriorityQueue<>(Comparator.reverseOrder()),hi=new PriorityQueue<>();List<String> out=new ArrayList<>();for(long x:a){lo.add(x);hi.add(lo.poll());if(hi.size()>lo.size())lo.add(hi.poll());out.add(""+(lo.size()>hi.size()?lo.peek().doubleValue():(lo.peek()+hi.peek())/2.0));}return fmt(out);')
RECIPES['runningmedian']['comparison']='decimal'
ar('topfrequent','Most frequent k values','Read k. Print at most k distinct values, ordered by decreasing frequency and then increasing numeric value.',lambda a,t:sorted(set(a),key=lambda x:(-a.count(x),x))[:t[0]],'int k=s.nextInt();Map<Long,Integer> f=new HashMap<>();for(long x:a)f.merge(x,1,Integer::sum);List<Long> out=new ArrayList<>(f.keySet());out.sort((x,y)->f.get(x).equals(f.get(y))?Long.compare(x,y):Integer.compare(f.get(y),f.get(x)));return fmt(out.subList(0,Math.min(k,out.size())));',[arr(a,[k]) for a,k in [([1,1,1,2,2,3],2),([4,3,4,3,2],2),([],2),([7],0),([-1,-1,2],5)]],extra=' Then read k (0≤k≤1,000).')
ar('reversek','Reverse the first k queue items','Build a FIFO queue. Read valid k, reverse its first k values, and preserve the order of the remaining values. Print the full queue.',lambda a,t:a[:t[0]][::-1]+a[t[0]:],'int k=s.nextInt();for(int l=0,r=k-1;l<r;l++,r--){long x=a[l];a[l]=a[r];a[r]=x;}return fmt(a);',[arr(a,[k]) for a,k in [([1,2,3,4,5],3),([5,6],2),([],0),([7],0),([1,2,3],1)]],extra=' Then read k (0≤k≤n).')
ar('interleave','Interleave two queue halves','n is even. Interleave the first half and the second half of a queue, starting with the first half. Print the resulting sequence.',lambda a,t:[v for pair in zip(a[:len(a)//2],a[len(a)//2:]) for v in pair],'List<Long> out=new ArrayList<>();for(int i=0;i<a.length/2;i++){out.add(a[i]);out.add(a[i+a.length/2]);}return fmt(out);',arrays=[[1,2,3,4],[1,2,3,4,5,6],[],[7,8],[2,2,2,2]],bounds=['n is even, 0≤n≤1,000','|a[i]|≤1,000,000'])
scalar('binaryqueue','Generate binary representations','Read n. Using a queue, print the binary representations of integers 1 through n in increasing order. Print EMPTY for n=0.',lambda n:[bin(i)[2:] for i in range(1,n+1)],'int n=s.nextInt();Queue<String> q=new ArrayDeque<>();q.add("1");List<String> out=new ArrayList<>();for(int i=0;i<n;i++){String v=q.remove();out.add(v);q.add(v+"0");q.add(v+"1");}return fmt(out);',['5','3','0','1','10'],['0≤n≤1,000'])
scalar('josephus','Circular elimination survivor','n people occupy positions 1..n in a circle. Starting at 1, repeatedly remove every kth remaining person. Print the final position.',lambda n,k:jos(n,k),'int n=s.nextInt(),k=s.nextInt(),ans=0;for(int i=1;i<=n;i++)ans=(ans+k)%i;return ""+(ans+1);',['7 3','5 2','1 100','8 1','10 7'],['1≤n,k≤10,000'])
def jos(n,k):
 a=list(range(1,n+1));i=0
 while len(a)>1:i=(i+k-1)%len(a);a.pop(i)
 return a[0]
string('streamunique','First unique character in a stream','Input contains lowercase letters. After each character arrives, output the first character seen exactly once so far, or # if none. Output n space-separated tokens, or EMPTY for n=0.',lambda t:[next((x for x in t[:i] if t[:i].count(x)==1),'#') for i in range(1,len(t)+1)],'int[] f=new int[128];Queue<Character> q=new ArrayDeque<>();List<String> out=new ArrayList<>();for(char c:text.toCharArray()){f[c]++;q.add(c);while(!q.isEmpty()&&f[q.peek()]>1)q.remove();out.add(q.isEmpty()?"#":""+q.peek());}return fmt(out);',fixtures=['aabc','abcabc','','z','zzzz'])
def postfix(t):
 st=[]
 for token in t.split():
  if token in ['+','-','*']:
   b,a=st.pop(),st.pop();st.append(a+b if token=='+' else a-b if token=='-' else a*b)
  else:st.append(int(token))
 return st[0]
register('postfix','Evaluate postfix arithmetic','Evaluate a valid postfix expression with signed integer operands and binary +, −, * operators. Operand order matters for subtraction.','Read one line of space-separated tokens.','Print the resulting integer.',['2 3 + 4 *','5 2 -','0','-3 4 * 2 +','9 2 3 + -'],postfix,'Deque<Long> st=new ArrayDeque<>();while(s.hasNext()){String t=s.next();if(t.equals("+")||t.equals("-")||t.equals("*")){long b=st.pop(),a=st.pop();st.push(t.equals("+")?a+b:t.equals("-")?a-b:a*b);}else st.push(Long.parseLong(t));}return ""+st.pop();',['1–100 tokens','The expression is valid and all intermediate values fit in long.'])
string('longvalid','Longest valid parentheses substring','Input contains only ( and ). Print the length of the longest contiguous balanced substring.',lambda t:max([0]+[j-i for i in range(len(t)) for j in range(i+1,len(t)+1) if validround(t[i:j])]),'Deque<Integer> st=new ArrayDeque<>();st.push(-1);int best=0;for(int i=0;i<text.length();i++){if(text.charAt(i)==\'(\')st.push(i);else{st.pop();if(st.isEmpty())st.push(i);else best=Math.max(best,i-st.peek());}}return ""+best;',fixtures=['(()',')()())','','((()))','))(('])
def validround(t):
 b=0
 for c in t:
  b+=1 if c=='(' else -1
  if b<0:return False
 return b==0

def twoarrays(key,title,statement,oracle,java,fixtures,bounds=None):
 register(key,title,statement,'Read n, n integers, then m, then m integers.','Print the requested sequence; no output elements: EMPTY.',[arr(a)+'\n'+arr(b) for a,b in fixtures],lambda raw:oracle(*pairarr(raw)),'long[] a=array(s),b=array(s);'+java,bounds or ['0≤n,m≤1,000','|each value|≤1,000,000'])
def pairarr(raw):
 a,t=unpack(raw);return a,t[1:1+t[0]]
PAIRS=[([1,2,2,4],[2,3,4]),([],[1]),([],[]),([2,2],[2,2]),([-3,0,4],[-3,2])]
twoarrays('union','Sorted set union','Print all distinct values present in either input, in increasing order.',lambda a,b:sorted(set(a)|set(b)),'Set<Long> out=new TreeSet<>();for(long x:a)out.add(x);for(long x:b)out.add(x);return fmt(out);',PAIRS)
twoarrays('intersection','Sorted set intersection','Print distinct values present in both inputs, in increasing order.',lambda a,b:sorted(set(a)&set(b)),'Set<Long> left=new HashSet<>(),out=new TreeSet<>();for(long x:a)left.add(x);for(long x:b)if(left.contains(x))out.add(x);return fmt(out);',PAIRS)
twoarrays('difference','Values in only the first set','Print distinct values present in the first array but absent from the second, sorted increasingly.',lambda a,b:sorted(set(a)-set(b)),'Set<Long> out=new TreeSet<>();for(long x:a)out.add(x);for(long x:b)out.remove(x);return fmt(out);',PAIRS)
twoarrays('mergesorted','Merge sorted sequences','Both inputs are sorted. Merge them into a sorted sequence, retaining duplicates. Target linear time.',lambda a,b:sorted(a+b),'List<Long> out=new ArrayList<>();int i=0,j=0;while(i<a.length||j<b.length){if(j==b.length||i<a.length&&a[i]<=b[j])out.add(a[i++]);else out.add(b[j++]);}return fmt(out);',PAIRS)
