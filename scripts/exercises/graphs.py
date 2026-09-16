from core import *
import core
core.JAVA_HELPERS += r'''
static class G{int n;List<Integer>[] adj;int[][] edges;@SuppressWarnings("unchecked") G(Scanner s,boolean directed){n=s.nextInt();int m=s.nextInt();adj=new List[n];for(int i=0;i<n;i++)adj[i]=new ArrayList<>();edges=new int[m][2];for(int i=0;i<m;i++){int a=s.nextInt(),b=s.nextInt();edges[i]=new int[]{a,b};adj[a].add(b);if(!directed)adj[b].add(a);}for(var a:adj)Collections.sort(a);}}
static int[] distances(G g,int start){int[] d=new int[g.n];Arrays.fill(d,-1);Queue<Integer> q=new ArrayDeque<>();d[start]=0;q.add(start);while(!q.isEmpty()){int u=q.remove();for(int v:g.adj[u])if(d[v]<0){d[v]=d[u]+1;q.add(v);}}return d;}
static void dfs(G g,int u,boolean[] seen,List<Integer> out){seen[u]=true;out.add(u);for(int v:g.adj[u])if(!seen[v])dfs(g,v,seen,out);}
static class DSU{int[] p,size;DSU(int n){p=new int[n];size=new int[n];for(int i=0;i<n;i++){p[i]=i;size[i]=1;}}int find(int x){while(x!=p[x]){p[x]=p[p[x]];x=p[x];}return x;}boolean union(int a,int b){a=find(a);b=find(b);if(a==b)return false;if(size[a]<size[b]){int t=a;a=b;b=t;}p[b]=a;size[a]+=size[b];return true;}}
'''
def graphraw(n,e,tail=[]):return f'{n} {len(e)}\n'+'\n'.join(f'{a} {b}' for a,b in e)+'\n'+' '.join(map(str,tail))
GRAPHS=[(5,[(0,1),(0,2),(1,3),(2,3)]),(4,[(0,1),(2,3)]),(1,[]),(3,[(0,1),(1,2),(2,0)]),(4,[])]
def readgraph(raw,directed=False):
 z=list(map(int,raw.split()));n,m=z[:2];edges=list(zip(z[2:2+2*m:2],z[3:2+2*m:2]));adj=[[] for _ in range(n)]
 for a,b in edges:
  adj[a].append(b)
  if not directed:adj[b].append(a)
 return n,edges,[sorted(v) for v in adj],z[2+2*m:]
def groups(adj):
 seen=set();out=[]
 for i in range(len(adj)):
  if i in seen:continue
  q=[i];seen.add(i);group=[]
  while q:
   u=q.pop();group.append(u)
   for v in adj[u]:
    if v not in seen:seen.add(v);q.append(v)
  out.append(group)
 return out
def distances(adj,start):
 d=[-1]*len(adj);d[start]=0;q=collections.deque([start])
 while q:
  u=q.popleft()
  for v in adj[u]:
   if d[v]<0:d[v]=d[u]+1;q.append(v)
 return d
def gr(key,title,statement,fn,java,directed=False,tail=False,fixtures=None):
 register(key,title,statement,'Read n vertices and m edges, then m endpoint pairs u v. Vertices are numbered 0..n−1. Edges are '+('directed.' if directed else 'undirected.')+(' Then read starting vertex s.' if tail else ''),'Print the requested answer; an empty sequence is EMPTY.',fixtures or [graphraw(n,e,[0] if tail else []) for n,e in GRAPHS],lambda raw:fn(*readgraph(raw,directed)),'G g=new G(s,'+str(directed).lower()+');'+java,['1≤n≤200','0≤m≤2,000','No self-loops or duplicate edges.'])
gr('degrees','Vertex degrees','Print the degree of each vertex from 0 through n−1.',lambda n,e,a,t:list(map(len,a)),'List<Integer> out=new ArrayList<>();for(var a:g.adj)out.add(a.size());return fmt(out);')
gr('components','Count connected components','Print the number of connected components, including isolated vertices.',lambda n,e,a,t:len(groups(a)),'DSU d=new DSU(g.n);int count=g.n;for(int[] e:g.edges)if(d.union(e[0],e[1]))count--;return ""+count;')
gr('largestcomponent','Largest connected group','Print the number of vertices in the largest connected component.',lambda n,e,a,t:max(map(len,groups(a))),'DSU d=new DSU(g.n);int best=1;for(int[] e:g.edges){d.union(e[0],e[1]);best=Math.max(best,d.size[d.find(e[0])]);}return ""+best;')
gr('componentsizes','Size of each vertex’s group','For every vertex, print the size of its connected component, in vertex order.',lambda n,e,a,t:[next(len(c) for c in groups(a) if i in c) for i in range(n)],'DSU d=new DSU(g.n);for(int[] e:g.edges)d.union(e[0],e[1]);List<Integer> out=new ArrayList<>();for(int i=0;i<g.n;i++)out.add(d.size[d.find(i)]);return fmt(out);')
gr('graphdist','Unweighted shortest distances','From starting vertex s, print the fewest edges to every vertex in index order; unreachable vertices use −1.',lambda n,e,a,t:distances(a,t[0]),'int[] d=distances(g,s.nextInt());List<Integer> out=new ArrayList<>();for(int x:d)out.add(x);return fmt(out);',tail=True)
def dfsorder(a,start):
 seen=set();out=[]
 def visit(u):
  seen.add(u);out.append(u)
  for v in a[u]:
   if v not in seen:visit(v)
 visit(start);return out
gr('dfsorder','Deterministic graph DFS','Starting at s, print recursive DFS discovery order, considering neighbors in increasing vertex order. Omit unreachable vertices.',lambda n,e,a,t:dfsorder(a,t[0]),'List<Integer> out=new ArrayList<>();dfs(g,s.nextInt(),new boolean[g.n],out);return fmt(out);',tail=True)
gr('bfsorder','Deterministic graph BFS','Starting at s, print BFS discovery order. Consider neighbors increasingly and mark visited when enqueuing. Omit unreachable vertices.',lambda n,e,a,t:bfs(a,t[0]),'List<Integer> out=new ArrayList<>();boolean[] seen=new boolean[g.n];Queue<Integer> q=new ArrayDeque<>();int start=s.nextInt();q.add(start);seen[start]=true;while(!q.isEmpty()){int u=q.remove();out.add(u);for(int v:g.adj[u])if(!seen[v]){seen[v]=true;q.add(v);}}return fmt(out);',tail=True)
def bfs(a,start):
 q=collections.deque([start]);seen={start};out=[]
 while q:
  u=q.popleft();out.append(u)
  for v in a[u]:
   if v not in seen:seen.add(v);q.append(v)
 return out
gr('cyclic','Detect any undirected cycle','Print true if the graph contains a cycle, otherwise false.',lambda n,e,a,t:len(e)>n-len(groups(a)),'DSU d=new DSU(g.n);for(int[] e:g.edges)if(!d.union(e[0],e[1]))return "true";return "false";')
gr('redundantedges','Count redundant connections','Process edges in input order. Count edges whose endpoints were already connected by earlier edges.',lambda n,e,a,t:len(e)-n+len(groups(a)),'DSU d=new DSU(g.n);int count=0;for(int[] e:g.edges)if(!d.union(e[0],e[1]))count++;return ""+count;')
gr('crosspairs','Pairs in different components','Count unordered vertex pairs whose members lie in different connected components.',lambda n,e,a,t:(n*n-sum(len(c)**2 for c in groups(a)))//2,'DSU d=new DSU(g.n);for(int[] e:g.edges)d.union(e[0],e[1]);long total=0,seen=0;for(int i=0;i<g.n;i++)if(d.find(i)==i){total+=seen*d.size[i];seen+=d.size[i];}return ""+total;')
gr('bipartite','Two-color a graph','Print true if vertices can be divided into two sets so every edge crosses between sets. Check all components.',lambda n,e,a,t:bipartite(a),'int[] color=new int[g.n];Arrays.fill(color,-1);for(int start=0;start<g.n;start++)if(color[start]<0){Queue<Integer> q=new ArrayDeque<>();q.add(start);color[start]=0;while(!q.isEmpty()){int u=q.remove();for(int v:g.adj[u]){if(color[v]<0){color[v]=1-color[u];q.add(v);}else if(color[v]==color[u])return "false";}}}return "true";')
def bipartite(a):
 for mask in range(1<<len(a)):
  if all((mask>>u&1)!=(mask>>v&1) for u in range(len(a)) for v in a[u]):return True
 return False
def topo(n,e,a,t):
 deg=[0]*n
 for u,v in e:deg[v]+=1
 q=[i for i in range(n) if deg[i]==0];heapq.heapify(q);out=[]
 while q:
  u=heapq.heappop(q);out.append(u)
  for v in a[u]:
   deg[v]-=1
   if deg[v]==0:heapq.heappush(q,v)
 return out if len(out)==n else 'CYCLE'
gr('toposort','Dependency order','Print the lexicographically smallest topological ordering. If any directed cycle prevents a full ordering, print CYCLE.',topo,'int[] in=new int[g.n];for(int[] e:g.edges)in[e[1]]++;PriorityQueue<Integer> q=new PriorityQueue<>();for(int i=0;i<g.n;i++)if(in[i]==0)q.add(i);List<Integer> out=new ArrayList<>();while(!q.isEmpty()){int u=q.poll();out.add(u);for(int v:g.adj[u])if(--in[v]==0)q.add(v);}return out.size()==g.n?fmt(out):"CYCLE";',directed=True)
gr('dynamicgroups','Component count after each edge','Start with n isolated vertices. After adding each edge in input order, print the current component count.',lambda n,e,a,t:[len(groups(readgraph(graphraw(n,e[:i]))[2])) for i in range(1,len(e)+1)],'DSU d=new DSU(g.n);int count=g.n;List<Integer> out=new ArrayList<>();for(int[] e:g.edges){if(d.union(e[0],e[1]))count--;out.add(count);}return fmt(out);')
gr('connectnetwork','Reconnect a network','One operation removes one existing edge and reconnects its endpoints to any two vertices. Print minimum operations to connect all vertices, or −1 if the edge count is insufficient.',lambda n,e,a,t:len(groups(a))-1 if len(e)>=n-1 else -1,'if(g.edges.length<g.n-1)return "-1";DSU d=new DSU(g.n);int count=g.n;for(int[] e:g.edges)if(d.union(e[0],e[1]))count--;return ""+(count-1);')
