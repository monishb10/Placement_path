from core import *
def gridraw(a):return str(len(a))+' '+str(len(a[0]))+'\n'+'\n'.join(' '.join(map(str,row)) for row in a)
def readgrid(raw):
 z=list(map(int,raw.split()));r,c=z[:2];return [z[2+i*c:2+(i+1)*c] for i in range(r)]
GRIDS=[[[1,2,3],[4,5,6]],[[3]],[[0,0],[0,0]],[[2,1,4,3]],[[2],[3],[1]]]
def grid(key,title,statement,fn,java,fixtures=GRIDS,bounds=None):
 register(key,title,statement,'Read positive row count r and column count c, followed by r×c integers in row-major order.','Print the requested integer.',[gridraw(a) for a in fixtures],lambda raw:fn(readgrid(raw)),'int r=s.nextInt(),c=s.nextInt();long[][] a=new long[r][c];for(int i=0;i<r;i++)for(int j=0;j<c;j++)a[i][j]=s.nextLong();'+java,bounds or ['1≤r,c≤20','0≤cell≤1,000'])
def route(a,mode):
 r,c=len(a),len(a[0]);d=[[0]*c for _ in a]
 for i in range(r):
  for j in range(c):
   prev=([d[i-1][j]] if i else [])+([d[i][j-1]] if j else [])
   if mode=='obstacle':d[i][j]=0 if a[i][j] else (sum(prev) if i or j else 1)
   else:d[i][j]=a[i][j]+((min(prev) if mode=='min' else max(prev)) if prev else 0)
 return d[-1][-1]
for key,title,mode in [('gridmin','Minimum right/down path sum','min'),('gridmax','Maximum right/down path sum','max')]:
 grid(key,title,'Move only right or down from top-left to bottom-right. Include both endpoint costs. Print the '+('minimum' if mode=='min' else 'maximum')+' possible total.',lambda a,m=mode:route(a,m),'long[][] d=new long[r][c];for(int i=0;i<r;i++)for(int j=0;j<c;j++){if(i==0&&j==0)d[i][j]=a[i][j];else if(i==0)d[i][j]=d[i][j-1]+a[i][j];else if(j==0)d[i][j]=d[i-1][j]+a[i][j];else d[i][j]=Math.'+('min' if mode=='min' else 'max')+'(d[i-1][j],d[i][j-1])+a[i][j];}return ""+d[r-1][c-1];')
BINARY=[[[0,0,0],[0,1,0],[0,0,0]],[[0]],[[1]],[[0,1,0]],[[0,0],[0,0]]]
grid('obstacle','Paths avoiding blocked cells','Cells are 0 (open) or 1 (blocked). Count right/down routes between opposite corners. A blocked endpoint yields 0.',lambda a:route(a,'obstacle'),'long[][] d=new long[r][c];for(int i=0;i<r;i++)for(int j=0;j<c;j++)if(a[i][j]==0)d[i][j]=i==0&&j==0?1:(i>0?d[i-1][j]:0)+(j>0?d[i][j-1]:0);return ""+d[r-1][c-1];',BINARY,['1≤r,c≤20','Each cell is 0 or 1; counts fit in long.'])
def falling(a,maximize=False):
 d=a[0].copy()
 for row in a[1:]:d=[v+(max if maximize else min)(d[max(0,j-1):min(len(d),j+2)]) for j,v in enumerate(row)]
 return (max if maximize else min)(d)
grid('falling','Minimum falling path sum','Start anywhere in the first row. Each step moves to the next row in the same or an adjacent column. Print the minimum total to the last row.',falling,'long[] d=a[0].clone();for(int i=1;i<r;i++){long[] next=new long[c];for(int j=0;j<c;j++){long best=d[j];if(j>0)best=Math.min(best,d[j-1]);if(j+1<c)best=Math.min(best,d[j+1]);next[j]=best+a[i][j];}d=next;}long best=d[0];for(long v:d)best=Math.min(best,v);return ""+best;')
grid('goldmine','Maximum falling path reward','Start anywhere in row 0. Each move advances one row and changes the column by −1, 0, or +1. Print the greatest collected sum.',lambda a:falling(a,True),'long[] d=a[0].clone();for(int i=1;i<r;i++){long[] next=new long[c];for(int j=0;j<c;j++){long best=d[j];if(j>0)best=Math.max(best,d[j-1]);if(j+1<c)best=Math.max(best,d[j+1]);next[j]=best+a[i][j];}d=next;}long best=d[0];for(long v:d)best=Math.max(best,v);return ""+best;')
def square(a):
 return max([0]+[k*k for k in range(1,min(len(a),len(a[0]))+1) for i in range(len(a)-k+1) for j in range(len(a[0])-k+1) if all(a[x][y]==1 for x in range(i,i+k) for y in range(j,j+k))])
grid('onesquare','Largest all-one square','The matrix is binary. Print the area of its largest contiguous square containing only 1 values.',square,'int[][] d=new int[r+1][c+1];int best=0;for(int i=1;i<=r;i++)for(int j=1;j<=c;j++)if(a[i-1][j-1]==1){d[i][j]=1+Math.min(d[i-1][j-1],Math.min(d[i-1][j],d[i][j-1]));best=Math.max(best,d[i][j]);}return ""+(best*best);',fixtures=[[[1,1,0],[1,1,1]],[[0]],[[1]],[[1,1,1]],[[0,0],[0,0]]],bounds=['1≤r,c≤20','Each cell is 0 or 1.'])
def island(a):
 seen=set();count=0
 for i in range(len(a)):
  for j in range(len(a[0])):
   if not a[i][j] or (i,j) in seen:continue
   count+=1;q=[(i,j)];seen.add((i,j))
   while q:
    x,y=q.pop()
    for p,v in [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]:
     if 0<=p<len(a) and 0<=v<len(a[0]) and a[p][v] and (p,v) not in seen:seen.add((p,v));q.append((p,v))
 return count
grid('islands','Count four-connected islands','Cells with 1 are land; 0 means water. Count land components using only horizontal and vertical neighbors.',island,'boolean[][] seen=new boolean[r][c];int count=0;int[] dx={1,-1,0,0},dy={0,0,1,-1};for(int i=0;i<r;i++)for(int j=0;j<c;j++)if(a[i][j]==1&&!seen[i][j]){count++;Queue<int[]> q=new ArrayDeque<>();q.add(new int[]{i,j});seen[i][j]=true;while(!q.isEmpty()){int[] v=q.remove();for(int k=0;k<4;k++){int x=v[0]+dx[k],y=v[1]+dy[k];if(x>=0&&x<r&&y>=0&&y<c&&a[x][y]==1&&!seen[x][y]){seen[x][y]=true;q.add(new int[]{x,y});}}}}return ""+count;',fixtures=[[[1,0,1],[1,0,1]],[[0]],[[1]],[[1,0,1]],[[1,1],[1,1]]],bounds=['1≤r,c≤20','Each cell is 0 or 1.'])
grid('gridtotal','Matrix total','Print the sum of all matrix cells.',lambda a:sum(map(sum,a)),'long total=0;for(long[] row:a)for(long v:row)total+=v;return ""+total;')
grid('diagonalpath','Minimum path with diagonal moves','Move right, down, or diagonally down-right from the top-left to bottom-right. Print the minimum total cell cost, including endpoints.',lambda a:diag(a),'long[][] d=new long[r][c];for(int i=0;i<r;i++)for(int j=0;j<c;j++){long best=i==0&&j==0?0:Long.MAX_VALUE;if(i>0)best=Math.min(best,d[i-1][j]);if(j>0)best=Math.min(best,d[i][j-1]);if(i>0&&j>0)best=Math.min(best,d[i-1][j-1]);d[i][j]=a[i][j]+best;}return ""+d[r-1][c-1];')
def diag(a):
 d=[[0]*len(a[0]) for _ in a]
 for i,row in enumerate(a):
  for j,v in enumerate(row):d[i][j]=v+min(([d[i-1][j]] if i else [])+([d[i][j-1]] if j else [])+([d[i-1][j-1]] if i and j else []) or [0])
 return d[-1][-1]
