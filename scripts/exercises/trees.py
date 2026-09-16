from core import *
import core
core.JAVA_HELPERS += r'''
static class T{long v;T l,r;T(long x){v=x;}}
static T tree(Scanner s){int m=s.nextInt();String[] a=new String[m];for(int i=0;i<m;i++)a[i]=s.next();if(m==0||a[0].equals("null"))return null;T root=new T(Long.parseLong(a[0]));Queue<T> q=new ArrayDeque<>();q.add(root);int i=1;while(!q.isEmpty()&&i<m){T n=q.remove();if(!a[i].equals("null")){n.l=new T(Long.parseLong(a[i]));q.add(n.l);}i++;if(i<m){if(!a[i].equals("null")){n.r=new T(Long.parseLong(a[i]));q.add(n.r);}i++;}}return root;}
static long tsum(T n){return n==null?0:n.v+tsum(n.l)+tsum(n.r);}
static int height(T n){return n==null?0:1+Math.max(height(n.l),height(n.r));}
static int leaves(T n){return n==null?0:n.l==null&&n.r==null?1:leaves(n.l)+leaves(n.r);}
static void trav(T n,int order,List<Long> out){if(n==null)return;if(order==0)out.add(n.v);trav(n.l,order,out);if(order==1)out.add(n.v);trav(n.r,order,out);if(order==2)out.add(n.v);}
static boolean bal(T n){return n==null||Math.abs(height(n.l)-height(n.r))<=1&&bal(n.l)&&bal(n.r);}
static int diameter(T n){return n==null?0:Math.max(height(n.l)+height(n.r),Math.max(diameter(n.l),diameter(n.r)));}
static boolean path(T n,long t){return n!=null&&(n.l==null&&n.r==null?n.v==t:path(n.l,t-n.v)||path(n.r,t-n.v));}
static boolean bstValid(T n,long low,long high){return n==null||n.v>low&&n.v<high&&bstValid(n.l,low,n.v)&&bstValid(n.r,n.v,high);}
static long maxPath(T n,long[] best){if(n==null)return 0;long l=Math.max(0,maxPath(n.l,best)),r=Math.max(0,maxPath(n.r,best));best[0]=Math.max(best[0],n.v+l+r);return n.v+Math.max(l,r);}
'''
def parse(raw):
 z=raw.split();m=int(z[0]);a=z[1:m+1];tail=list(map(int,z[m+1:]));
 if not a or a[0]=='null':return None,tail
 root=[int(a[0]),None,None];q=collections.deque([root]);i=1
 while q and i<m:
  n=q.popleft()
  for side in [1,2]:
   if i<m:
    if a[i]!='null':n[side]=[int(a[i]),None,None];q.append(n[side])
    i+=1
 return root,tail
def ser(a,tail=[]):return str(len(a))+'\n'+' '.join(map(str,a))+'\n'+' '.join(map(str,tail))
TREES=[[5,2,8,1,3,7,9],[],[-2],[1,'null',2,'null',3,'null',4],[0,-2,3,'null',-1]]
def nodes(n):return [] if n is None else [n]+nodes(n[1])+nodes(n[2])
def height(n):return 0 if n is None else 1+max(height(n[1]),height(n[2]))
def travel(n,order):
 if n is None:return []
 l,r=travel(n[1],order),travel(n[2],order)
 return [n[0]]+l+r if order==0 else l+[n[0]]+r if order==1 else l+r+[n[0]]
def levels(n):
 if not n:return []
 q=[n];out=[]
 while q:out.append([x[0] for x in q]);q=[c for x in q for c in x[1:] if c]
 return out
def nodelevels(n):
 q=[n] if n else [];out=[]
 while q:out.append(q);q=[c for x in q for c in x[1:] if c]
 return out
def tr(key,title,statement,fn,java,fixtures=None,extra='',hint=None):
 register(key,title,statement,'Read m and then m level-order tokens, using null for missing children. Consume children left then right only for real nodes (compact queue format). m=0 denotes an empty tree.'+extra,'Print the requested value or sequence; an empty sequence is EMPTY.',fixtures or [ser(a) for a in TREES],lambda raw:fn(*parse(raw)),'T root=tree(s);'+java,['0≤m≤1,000','Node values are integers between −1,000,000 and 1,000,000.','Serialization is valid; trailing null tokens may be omitted.'],hint)
tr('treesum','Total node value','Print the sum of every node value. An empty tree sums to zero.',lambda n,t:sum(x[0] for x in nodes(n)),'return ""+tsum(root);')
tr('leafcount','Count leaf nodes','A leaf has no children. Print the number of leaves.',lambda n,t:sum(x[1] is None and x[2] is None for x in nodes(n)),'return ""+leaves(root);')
tr('treemax','Largest tree value','Print the largest value, or EMPTY for an empty tree.',lambda n,t:max(x[0] for x in nodes(n)) if n else 'EMPTY','if(root==null)return "EMPTY";List<Long> a=new ArrayList<>();trav(root,0,a);return ""+Collections.max(a);')
for key,title,order in [('preorder','Preorder traversal',0),('inorder','Inorder traversal',1),('postorder','Postorder traversal',2)]:
 tr(key,title,'Print values in '+title.lower()+', visiting the left subtree before the right.',lambda n,t,o=order:travel(n,o),'List<Long> out=new ArrayList<>();trav(root,'+str(order)+',out);return fmt(out);')
tr('minheight','Minimum root-to-leaf depth','Print the minimum number of nodes on a root-to-leaf path. Empty tree: 0. A missing child is not a leaf path.',lambda n,t:min([height(n)] + [i+1 for i,layer in enumerate(nodelevels(n)) if any(x[1] is None and x[2] is None for x in layer)]) if n else 0,'if(root==null)return "0";Queue<T> q=new ArrayDeque<>();q.add(root);int d=0;while(!q.isEmpty()){d++;for(int k=q.size();k>0;k--){T n=q.remove();if(n.l==null&&n.r==null)return ""+d;if(n.l!=null)q.add(n.l);if(n.r!=null)q.add(n.r);}}return "0";')
tr('balanced','Check height balance','Print true if at every node the two subtree heights differ by at most one.',lambda n,t:all(abs(height(x[1])-height(x[2]))<=1 for x in nodes(n)),'return ""+bal(root);',hint='Return a subtree height together with whether it is balanced, so each subtree is processed once.')
tr('diameter','Tree diameter in edges','Print the greatest number of edges on a simple path between any two nodes. An empty tree has diameter 0.',lambda n,t:max([0]+[height(x[1])+height(x[2]) for x in nodes(n)]),'return ""+diameter(root);',hint='At each node, a path through it combines its two subtree heights. Track the best while computing heights.')
tr('leftview','Left side view','Print the first visible node at each depth when viewed from the left, from root downward.',lambda n,t:[a[0] for a in levels(n)],'List<Long> out=new ArrayList<>();Queue<T> q=new ArrayDeque<>();if(root!=null)q.add(root);while(!q.isEmpty()){int k=q.size();for(int i=0;i<k;i++){T n=q.remove();if(i==0)out.add(n.v);if(n.l!=null)q.add(n.l);if(n.r!=null)q.add(n.r);}}return fmt(out);')
tr('rightview','Right side view','Print the last node at each depth, from root downward.',lambda n,t:[a[-1] for a in levels(n)],'List<Long> out=new ArrayList<>();Queue<T> q=new ArrayDeque<>();if(root!=null)q.add(root);while(!q.isEmpty()){int k=q.size();for(int i=0;i<k;i++){T n=q.remove();if(i==k-1)out.add(n.v);if(n.l!=null)q.add(n.l);if(n.r!=null)q.add(n.r);}}return fmt(out);')
tr('levelsum','Total at every level','Print each depth’s sum, starting at the root.',lambda n,t:[sum(a) for a in levels(n)],'List<Long> out=new ArrayList<>();Queue<T> q=new ArrayDeque<>();if(root!=null)q.add(root);while(!q.isEmpty()){long total=0;for(int k=q.size();k>0;k--){T n=q.remove();total+=n.v;if(n.l!=null)q.add(n.l);if(n.r!=null)q.add(n.r);}out.add(total);}return fmt(out);')
tr('zigzag','Zigzag level order','Flatten the levels into one sequence. Read depth 0 left-to-right, depth 1 right-to-left, alternating thereafter.',lambda n,t:[x for i,a in enumerate(levels(n)) for x in (a if i%2==0 else a[::-1])],'List<Long> out=new ArrayList<>();Queue<T> q=new ArrayDeque<>();if(root!=null)q.add(root);boolean rev=false;while(!q.isEmpty()){List<Long> row=new ArrayList<>();for(int k=q.size();k>0;k--){T n=q.remove();row.add(n.v);if(n.l!=null)q.add(n.l);if(n.r!=null)q.add(n.r);}if(rev)Collections.reverse(row);out.addAll(row);rev=!rev;}return fmt(out);')
tr('treewidth','Largest occupied level','Print the maximum number of actual nodes at any depth. Do not count missing positions.',lambda n,t:max([0]+[len(a) for a in levels(n)]),'Queue<T> q=new ArrayDeque<>();if(root!=null)q.add(root);int best=0;while(!q.isEmpty()){int k=q.size();best=Math.max(best,k);while(k-->0){T n=q.remove();if(n.l!=null)q.add(n.l);if(n.r!=null)q.add(n.r);}}return ""+best;')
def paths(n):return [] if not n else [[n[0]]] if n[1] is None and n[2] is None else [[n[0]]+p for c in n[1:] for p in paths(c)]
tr('pathsum','Root-to-leaf target sum','Read target t after the tree. Print true if a root-to-leaf path sums to t. The empty tree has no path.',lambda n,t:any(sum(p)==t[0] for p in paths(n)),'return ""+path(root,s.nextLong());',[ser(a,[t]) for a,t in [(TREES[0],8),([],0),([-2],-2),([1,2,3],1),(TREES[3],10)]],extra=' Then read target t (|t|≤1,000,000,000).')
tr('validbst','Validate a strict BST','Print true if every node is greater than all values in its left subtree and smaller than all values in its right subtree. Duplicate keys are invalid.',lambda n,t:all(a<b for a,b in zip(travel(n,1),travel(n,1)[1:])),'return ""+bstValid(root,Long.MIN_VALUE,Long.MAX_VALUE);',[ser(a) for a in [TREES[0],[],[2,2,3],[5,1,7,'null','null',4,8],[-3,-4,-2]]])
tr('bstfloor','BST floor query','The input is a valid BST with distinct keys. Read target t. Print the greatest key≤t, or NONE.',lambda n,t:max([x[0] for x in nodes(n) if x[0]<=t[0]],default='NONE'),'long t=s.nextLong();Long best=null;while(root!=null){if(root.v<=t){best=root.v;root=root.r;}else root=root.l;}return best==null?"NONE":""+best;',[ser(a,[t]) for a,t in [(TREES[0],6),(TREES[0],0),([],2),([-2],-2),(TREES[0],20)]],extra=' Then read target t (|t|≤1,000,000).')
tr('bstceil','BST ceiling query','The input is a valid BST with distinct keys. Read target t. Print the smallest key≥t, or NONE.',lambda n,t:min([x[0] for x in nodes(n) if x[0]>=t[0]],default='NONE'),'long t=s.nextLong();Long best=null;while(root!=null){if(root.v>=t){best=root.v;root=root.l;}else root=root.r;}return best==null?"NONE":""+best;',[ser(a,[t]) for a,t in [(TREES[0],6),(TREES[0],10),([],2),([-2],-2),(TREES[0],-20)]],extra=' Then read target t (|t|≤1,000,000).')
tr('bstkth','Kth smallest BST key','The input is a strict BST. Read one-based k. Print its kth smallest key, or NONE if k is outside 1..node count.',lambda n,t:sorted(x[0] for x in nodes(n))[t[0]-1] if 1<=t[0]<=len(nodes(n)) else 'NONE','int k=s.nextInt();List<Long> out=new ArrayList<>();trav(root,1,out);return k>=1&&k<=out.size()?""+out.get(k-1):"NONE";',[ser(a,[t]) for a,t in [(TREES[0],3),(TREES[0],7),([],1),([-2],1),(TREES[0],8)]],extra=' Then read k (0≤k≤1,001).')
def maxpath(n):
 best=-10**18
 def walk(x):
  nonlocal best
  if not x:return 0
  l,r=max(0,walk(x[1])),max(0,walk(x[2]));best=max(best,x[0]+l+r);return x[0]+max(l,r)
 walk(n);return best if n else 'EMPTY'
tr('maxpath','Maximum path sum','A nonempty simple path may start and end anywhere. Print its greatest node sum. Print EMPTY for an empty tree.',lambda n,t:maxpath(n),'if(root==null)return "EMPTY";long[] best={Long.MIN_VALUE};maxPath(root,best);return ""+best[0];',[ser(a) for a in [[-10,9,20,'null','null',15,7],[-3],[],[1,2,3],[-2,-1,-3]]])
