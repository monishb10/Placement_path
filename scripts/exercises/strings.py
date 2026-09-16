from core import *
def cancel(t):
 st=[]
 for c in t:
  if st and st[-1]==c:st.pop()
  else:st.append(c)
 return ''.join(st) or 'EMPTY'
def valid(t):
 st=[]
 for c in t:
  if c in '([{':st.append(c)
  elif not st or '([{'.index(st.pop())!=')]}'.index(c):return False
 return not st
string('length','Count characters','Print the number of ASCII characters, including spaces.',len,'return ""+text.length();')
string('strreverse','Reverse text','Print the characters in reverse order. Preserve spaces. For an empty line print EMPTY.',lambda t:t[::-1] or 'EMPTY','return text.isEmpty()?"EMPTY":new StringBuilder(text).reverse().toString();')
string('palindrome','Exact palindrome','Print true if the line reads the same forward and backward. Spaces and case matter; an empty line is a palindrome.',lambda t:t==t[::-1],'int l=0,r=text.length()-1;while(l<r)if(text.charAt(l++)!=text.charAt(r--))return "false";return "true";')
string('wordcount','Count whitespace-separated words','A word is a maximal nonempty sequence of non-space characters. Input contains ASCII spaces, letters and digits. Print the number of words.',lambda t:len(t.split()),'return ""+(text.trim().isEmpty()?0:text.trim().split(" +").length);',fixtures=['learn Java daily','one','', '  spaced   words  ','123 x y'])
string('charcategories','Count letters and digits','Print counts of ASCII letters, digits, and all other characters, in that order.',lambda t:[sum(c.isalpha() for c in t),sum(c.isdigit() for c in t),sum(not c.isalnum() for c in t)],'int a=0,d=0,o=0;for(char c:text.toCharArray()){if(c>=\'a\'&&c<=\'z\'||c>=\'A\'&&c<=\'Z\')a++;else if(c>=\'0\'&&c<=\'9\')d++;else o++;}return a+" "+d+" "+o;')
string('normalized','Normalize a title','Trim leading/trailing spaces, collapse runs of spaces to one, and lowercase ASCII letters. Print EMPTY if no words remain.',lambda t:' '.join(t.lower().split()) or 'EMPTY','String v=text.trim().toLowerCase(Locale.ROOT).replaceAll(" +"," ");return v.isEmpty()?"EMPTY":v;',fixtures=['  Java   DEVELOPER ','Data Analyst','','   ','A b C'])
string('reversewords','Reverse word order','Reverse the order of space-separated words. Use one space between output words. Print EMPTY for a blank line.',lambda t:' '.join(t.split()[::-1]) or 'EMPTY','String v=text.trim();if(v.isEmpty())return "EMPTY";String[] a=v.split(" +");Collections.reverse(Arrays.asList(a));return String.join(" ",a);',fixtures=['one two three','Java','','  a  b ','solo'])
string('firstchar','First unique character index','Print the zero-based index of the first character appearing once, or −1. Case and spaces matter.',lambda t:next((i for i,c in enumerate(t) if t.count(c)==1),-1),'int[] f=new int[128];for(char c:text.toCharArray())f[c]++;for(int i=0;i<text.length();i++)if(f[text.charAt(i)]==1)return ""+i;return "-1";')
string('compress','Run-length encoding','Input consists only of lowercase letters. Encode each maximal repeated run as its letter followed by its length, including length 1. Print EMPTY for empty input.',lambda t:''.join(c+str(len(list(g))) for c,g in itertools.groupby(t)) or 'EMPTY','StringBuilder b=new StringBuilder();for(int i=0;i<text.length();){int j=i+1;while(j<text.length()&&text.charAt(j)==text.charAt(i))j++;b.append(text.charAt(i)).append(j-i);i=j;}return b.length()==0?"EMPTY":b.toString();',fixtures=['aaabbc','abc','','z','aaaaaaaaaaaa'])
string('longunique','Longest substring without repeats','Print the length of the longest contiguous substring with no repeated characters. Spaces are characters.',lambda t:max([0]+[j-i for i in range(len(t)) for j in range(i+1,len(t)+1) if len(set(t[i:j]))==j-i]),'int[] last=new int[128];Arrays.fill(last,-1);int l=0,best=0;for(int r=0;r<text.length();r++){char c=text.charAt(r);l=Math.max(l,last[c]+1);best=Math.max(best,r-l+1);last[c]=r;}return ""+best;',fixtures=['abcabcbb','bbbbb','','pwwkew','a b c'],hint='A repeated character inside the active window forces its left boundary forward. Never move the boundary backward.')
string('longpal','Longest palindromic substring length','Print the length of the longest contiguous palindrome. Case and spaces matter; empty input yields 0.',lambda t:max([0]+[j-i for i in range(len(t)) for j in range(i+1,len(t)+1) if t[i:j]==t[i:j][::-1]]),'int best=0;for(int c=0;c<2*text.length()-1;c++){int l=c/2,r=l+c%2;while(l>=0&&r<text.length()&&text.charAt(l)==text.charAt(r)){best=Math.max(best,r-l+1);l--;r++;}}return ""+best;',fixtures=['babad','cbbd','','a','aaaa'])
string('brackets','Validate mixed brackets','Input contains only (), [], and {}. Print true if all brackets match and are correctly nested.',valid,'Deque<Character> st=new ArrayDeque<>();for(char c:text.toCharArray()){if("([{ ".indexOf(c)>=0)st.push(c);else{if(st.isEmpty())return "false";char o=st.pop();if((o==\'(\'&&c!=\')\')||(o==\'[\'&&c!=\']\')||(o==\'{\'&&c!=\'}\'))return "false";}}return ""+st.isEmpty();',fixtures=['([]){}','([)]','','{[()]}','(('])

def pairstr(key,title,statement,fn,java,fixtures,hint=None):
 register(key,title,statement,'Read two complete lines a and b; either may be empty.','Print the requested answer.',[a+'\n'+b+'\n' for a,b in fixtures],lambda raw:fn(*raw.split('\n')[:2]),'String[] lines=raw.split("\\n",-1);String a=lines[0],b=lines[1];'+java,['Each line contains 0–200 lowercase ASCII letters unless stated otherwise.'],hint)
PAIR=[('listen','silent'),('abc','abc'),('',''),('a',''),('aab','abb')]
pairstr('anagram','Compare character multisets','Print true if the two lines contain the same characters with the same counts.',lambda a,b:sorted(a)==sorted(b),'char[] x=a.toCharArray(),y=b.toCharArray();Arrays.sort(x);Arrays.sort(y);return ""+Arrays.equals(x,y);',PAIR)
pairstr('subsequence','Check a subsequence','Print true if a can be obtained from b by deleting zero or more characters without reordering.',lambda a,b:any(''.join(b[i] for i in ix)==a for ix in itertools.combinations(range(len(b)),len(a))),'int i=0;for(int j=0;j<b.length()&&i<a.length();j++)if(a.charAt(i)==b.charAt(j))i++;return ""+(i==a.length());',[('ace','abcde'),('aec','abcde'),('','abc'),('a',''),('aa','aaa')])
pairstr('findpattern','First substring match','Print the first zero-based starting index of b in a, or −1 if absent. An empty pattern matches at 0. Implement a search; discuss how a prefix function improves worst-case time.',lambda a,b:a.find(b),'return ""+a.indexOf(b);',[('ababcabc','abc'),('aaaa','aa'),('',''),('abc','d'),('ab','abc')])
pairstr('lcp','Longest common prefix','Print the common starting substring, or EMPTY if its length is zero.',lambda a,b:next((a[:i] or 'EMPTY' for i in range(min(len(a),len(b))+1) if i==min(len(a),len(b)) or a[i]!=b[i])),'int i=0;while(i<a.length()&&i<b.length()&&a.charAt(i)==b.charAt(i))i++;return i==0?"EMPTY":a.substring(0,i);',[('flower','flow'),('dog','cat'),('','abc'),('a','a'),('prefix','presto')])
def lcs(a,b):
 d=[[0]*(len(b)+1) for _ in range(len(a)+1)]
 for i,x in enumerate(a,1):
  for j,y in enumerate(b,1):d[i][j]=d[i-1][j-1]+1 if x==y else max(d[i-1][j],d[i][j-1])
 return d[-1][-1]
pairstr('lcs','Longest common subsequence length','Print the maximum length of a sequence that is a subsequence of both lines.',lcs,'int[][] d=new int[a.length()+1][b.length()+1];for(int i=1;i<=a.length();i++)for(int j=1;j<=b.length();j++)d[i][j]=a.charAt(i-1)==b.charAt(j-1)?d[i-1][j-1]+1:Math.max(d[i-1][j],d[i][j-1]);return ""+d[a.length()][b.length()];',[('abcde','ace'),('abc','def'),('','abc'),('aaa','aa'),('aggtab','gxtxayb')])
def edit(a,b):
 d=list(range(len(b)+1))
 for i,x in enumerate(a,1):
  row=[i]
  for j,y in enumerate(b,1):row.append(d[j-1] if x==y else 1+min(d[j],row[-1],d[j-1]))
  d=row
 return d[-1]
pairstr('edit','Minimum edit distance','One operation inserts, deletes, or replaces one character. Print the minimum operations to transform a into b.',edit,'int[][] d=new int[a.length()+1][b.length()+1];for(int i=0;i<=a.length();i++)d[i][0]=i;for(int j=0;j<=b.length();j++)d[0][j]=j;for(int i=1;i<=a.length();i++)for(int j=1;j<=b.length();j++)d[i][j]=a.charAt(i-1)==b.charAt(j-1)?d[i-1][j-1]:1+Math.min(d[i-1][j-1],Math.min(d[i-1][j],d[i][j-1]));return ""+d[a.length()][b.length()];',[('kitten','sitting'),('cat','cut'),('','abc'),('same','same'),('abc','')])
string('adjacentcancel','Remove adjacent duplicates repeatedly','Repeatedly remove adjacent equal pairs until no such pair remains. Print the surviving string or EMPTY.',lambda t:cancel(t),'StringBuilder st=new StringBuilder();for(char c:text.toCharArray()){int n=st.length();if(n>0&&st.charAt(n-1)==c)st.setLength(n-1);else st.append(c);}return st.length()==0?"EMPTY":st.toString();',fixtures=['abbaca','azxxzy','','aaaa','abc'])
