"""Original exercise definitions and independent Python answer oracles."""
import json, math, collections, itertools, heapq, bisect, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RECIPES = {}
JAVA_HELPERS = r'''
static long[] array(Scanner s){int n=s.nextInt();long[] a=new long[n];for(int i=0;i<n;i++)a[i]=s.nextLong();return a;}
static String fmt(long[] a){StringJoiner j=new StringJoiner(" ");for(long x:a)j.add(""+x);return a.length==0?"EMPTY":j.toString();}
static String fmt(Collection<?> a){StringJoiner j=new StringJoiner(" ");for(Object x:a)j.add(x.toString());return a.isEmpty()?"EMPTY":j.toString();}
static long gcd(long a,long b){a=Math.abs(a);b=Math.abs(b);while(b!=0){long t=a%b;a=b;b=t;}return a;}
static long power(long a,int n){long r=1;while(n>0){if((n&1)==1)r*=a;a*=a;n>>=1;}return r;}
static boolean prime(long n){if(n<2)return false;for(long d=2;d<=n/d;d++)if(n%d==0)return false;return true;}
static String line(String raw){return raw.replaceFirst("[\\r\\n]+$", "");}
static String words(String raw){return raw.trim();}
'''

def register(key, title, statement, input_format, output_format, fixtures, oracle, java,
             constraints=None, hint=None, comparison='tokens'):
    assert key not in RECIPES, key
    cases=[]
    for i,item in enumerate(fixtures):
        name,raw=item if isinstance(item,tuple) else (f'Sample {i+1}' if i<2 else f'Case {i+1}',str(item))
        cases.append(dict(id=str(i+1),name=name,input=raw,expected='',sample=i<2))
    assert len(cases)>=5
    RECIPES[key]=dict(key=key,title=title,statement=statement,inputFormat=input_format,outputFormat=output_format,
      constraints=constraints or ['Each numeric input is between −1,000,000 and 1,000,000, unless restricted further in the statement.'],cases=cases,java=java,comparison=comparison,_oracle=oracle,
      hint=hint or 'Trace the first sample, identify the information you must maintain, then test the smallest allowed input.')

def materialize():
    for recipe in RECIPES.values():
        for case in recipe['cases']:
            answer=recipe['_oracle'](case['input'])
            if isinstance(answer,bool):answer=str(answer).lower()
            if isinstance(answer,(list,tuple)):answer=' '.join(map(str,answer)) if answer else 'EMPTY'
            case['expected']=str(answer)

def arr(a,tail=()):return str(len(a))+'\n'+' '.join(map(str,a))+'\n'+' '.join(map(str,tail))
def unpack(raw):
    z=list(map(int,raw.split()));return z[1:1+z[0]],z[1+z[0]:]
ARRAYS=[[3,-1,4,3,0],[],[-5,-2,-8],[7],[2,2,2,2],[0,1,-1,0,10,-10]]
def ar(key,title,statement,fn,java,arrays=None,extra='',bounds=None,hint=None):
    fixtures=arrays if arrays is not None else ARRAYS
    formatted=[arr(x) if not isinstance(x,str) else x for x in fixtures]
    register(key,title,statement,'Read n, then n integers separated by whitespace.'+extra,
      'Print the requested result. For a sequence with no elements, print EMPTY.',formatted,
      lambda raw:fn(*unpack(raw)), 'long[] a=array(s);'+java,
      bounds or ['0 ≤ n ≤ 1,000','−1,000,000 ≤ each array value ≤ 1,000,000','Use long for sums and products.'],hint)

def scalar(key,title,statement,fn,java,fixtures,bounds=None,output='Print the requested result.',comparison='tokens',input_format='Read the integers described in the problem, separated by whitespace.',hint=None):
    register(key,title,statement,input_format,output,[str(x) for x in fixtures],lambda raw:fn(*map(int,raw.split())),java,bounds,hint,comparison)

def string(key,title,statement,fn,java,fixtures=None,hint=None,output='Print the requested result.'):
    samples=fixtures or ['placement','Java 123','', 'aaaa','a b a','racecar']
    register(key,title,statement,'Read one complete line. The line may be empty.',output,
      [x+'\n' for x in samples],lambda raw:fn(raw.rstrip('\r\n')),'String text=line(raw);'+java,
      ['0–1,000 ASCII characters unless a narrower alphabet is stated.'],hint)
