import type {Completion,CompletionContext,CompletionResult} from '@codemirror/autocomplete';
import {ensureSyntaxTree,syntaxTree} from '@codemirror/language';

const keywords='abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static super switch synchronized this throw throws transient try var void volatile while true false null'.split(' ');
const classes=['System','Math','String','StringBuilder','Integer','Long','Double','Boolean','Character','Object','Scanner','Arrays','Collections','List','ArrayList','LinkedList','Map','HashMap','TreeMap','Set','HashSet','TreeSet','Queue','Deque','ArrayDeque','Stack','PriorityQueue','Comparator','BufferedReader','InputStreamReader','PrintWriter'];
const method=(label:string,detail:string,info?:string):Completion=>({label,type:'method',detail,info});
const common=[method('toString','() → String'),method('equals','(other) → boolean'),method('hashCode','() → int')];
const sized=[method('size','() → int'),method('isEmpty','() → boolean'),method('clear','() → void')];
const list=[...sized,method('add','(value) → boolean'),method('get','(index) → value'),method('set','(index, value) → old value'),method('remove','(index or value)'),method('contains','(value) → boolean'),method('indexOf','(value) → int'),method('sort','(comparator) → void'),method('toArray','() → array')];
const queue=[...sized,method('offer','(value) → boolean'),method('add','(value) → boolean'),method('poll','() → head or null'),method('peek','() → head or null'),method('remove','() → head'),method('contains','(value) → boolean')];
const deque=[...queue,method('push','(value) → void'),method('pop','() → head'),method('addFirst','(value) → void'),method('addLast','(value) → void'),method('pollFirst','() → first or null'),method('pollLast','() → last or null'),method('peekFirst','() → first or null'),method('peekLast','() → last or null')];
const map=[...sized,method('put','(key, value) → old value'),method('get','(key) → value'),method('getOrDefault','(key, fallback) → value'),method('containsKey','(key) → boolean'),method('containsValue','(value) → boolean'),method('remove','(key) → old value'),method('keySet','() → Set'),method('values','() → Collection'),method('entrySet','() → Set')];
const set=[...sized,method('add','(value) → boolean'),method('contains','(value) → boolean'),method('remove','(value) → boolean'),method('toArray','() → array')];
const members:Record<string,Completion[]>={
  Scanner:[method('nextInt','() → int'),method('nextLong','() → long'),method('nextDouble','() → double'),method('nextBoolean','() → boolean'),method('nextLine','() → String','Reads the rest of the current line.'),method('next','() → String','Reads the next whitespace-separated token.'),method('hasNext','() → boolean'),method('hasNextInt','() → boolean'),method('hasNextLine','() → boolean'),method('close','() → void')],
  String:[method('length','() → int'),method('charAt','(index) → char'),method('substring','(start, end) → String'),method('equals','(other) → boolean'),method('equalsIgnoreCase','(other) → boolean'),method('compareTo','(other) → int'),method('contains','(text) → boolean'),method('indexOf','(text) → int'),method('split','(regex) → String[]'),method('trim','() → String'),method('toLowerCase','() → String'),method('toUpperCase','() → String'),method('toCharArray','() → char[]'),method('isEmpty','() → boolean'),method('startsWith','(prefix) → boolean'),method('endsWith','(suffix) → boolean'),method('replace','(target, replacement) → String')],
  StringBuilder:[method('append','(value) → StringBuilder'),method('insert','(index, value) → StringBuilder'),method('reverse','() → StringBuilder'),method('delete','(start, end) → StringBuilder'),method('deleteCharAt','(index) → StringBuilder'),method('setCharAt','(index, char) → void'),method('length','() → int'),method('charAt','(index) → char'),method('toString','() → String')],
  List:list,ArrayList:list,LinkedList:[...list,...deque],Map:map,HashMap:map,TreeMap:[...map,method('firstKey','() → key'),method('lastKey','() → key'),method('floorKey','(key) → key'),method('ceilingKey','(key) → key')],
  Set:set,HashSet:set,TreeSet:[...set,method('first','() → value'),method('last','() → value'),method('floor','(value) → value'),method('ceiling','(value) → value')],
  Queue:queue,PriorityQueue:queue,Deque:deque,ArrayDeque:deque,Stack:[...list,method('push','(value) → value'),method('pop','() → value'),method('peek','() → value'),method('empty','() → boolean')],
  BufferedReader:[method('readLine','() → String'),method('read','() → int'),method('close','() → void')],
};
const printMethods=[method('println','(value) → void','Prints a value, then starts a new line.'),method('print','(value) → void','Prints a value without starting a new line.'),method('printf','(format, values) → PrintStream'),method('flush','() → void')];
const staticMembers:Record<string,Completion[]>={
  System:[{label:'out',type:'property',detail:'PrintStream'},{label:'in',type:'property',detail:'InputStream'},{label:'err',type:'property',detail:'PrintStream'},method('arraycopy','(source, start, target, offset, count)'),method('currentTimeMillis','() → long'),method('nanoTime','() → long')],
  'System.out':printMethods,'System.err':printMethods,
  Math:[method('max','(a, b) → number'),method('min','(a, b) → number'),method('abs','(value) → number'),method('sqrt','(value) → double'),method('pow','(base, exponent) → double'),method('floor','(value) → double'),method('ceil','(value) → double'),method('round','(value) → integer'),{label:'PI',type:'constant',detail:'double'}],
  Arrays:[method('sort','(array) → void'),method('binarySearch','(array, key) → int'),method('fill','(array, value) → void'),method('copyOf','(array, length) → array'),method('copyOfRange','(array, from, to) → array'),method('equals','(a, b) → boolean'),method('toString','(array) → String'),method('asList','(values) → List')],
  Collections:[method('sort','(list) → void'),method('reverse','(list) → void'),method('max','(collection) → value'),method('min','(collection) → value'),method('frequency','(collection, value) → int'),method('binarySearch','(list, key) → int'),method('swap','(list, i, j) → void')],
  Integer:[method('parseInt','(text) → int'),method('valueOf','(value) → Integer'),method('toString','(value) → String'),{label:'MAX_VALUE',type:'constant',detail:'int'},{label:'MIN_VALUE',type:'constant',detail:'int'}],
  Long:[method('parseLong','(text) → long'),method('valueOf','(value) → Long'),{label:'MAX_VALUE',type:'constant',detail:'long'},{label:'MIN_VALUE',type:'constant',detail:'long'}],
  Double:[method('parseDouble','(text) → double'),method('isNaN','(value) → boolean'),method('isFinite','(value) → boolean')],
  Character:[method('isDigit','(char) → boolean'),method('isLetter','(char) → boolean'),method('isWhitespace','(char) → boolean'),method('toLowerCase','(char) → char'),method('toUpperCase','(char) → char')],
};
const scopes=new Set(['Block','ForStatement','EnhancedForStatement','CatchClause','MethodDeclaration','ConstructorDeclaration','LambdaExpression','ClassBody','InterfaceBody','EnumBody']);
type Symbol={name:string;type:string;kind:'variable'|'property'|'method'|'class';scopeStart:number};

// These are local language/identifier suggestions, never exercise answers.
export function javaCompletions(context:CompletionContext):CompletionResult|null{
  const {state,pos}=context;
  const tree=ensureSyntaxTree(state,pos,30)??syntaxTree(state);
  for(let node=tree.resolveInner(pos,-1);node;){
    if(/Comment|StringLiteral|CharacterLiteral|TextBlock/.test(node.name))return null;
    if(!node.parent)break;node=node.parent;
  }
  const word=context.matchBefore(/[\w$]*/);
  if(!word)return null;
  const prefix=state.sliceDoc(Math.max(0,word.from-150),word.from);
  const memberAccess=/\.\s*$/.test(prefix);
  if(!context.explicit&&!memberAccess&&!/^[A-Za-z_$]/.test(word.text))return null;
  const symbols=new Map<string,Symbol>();
  tree.iterate({enter(ref){
    if(ref.name!=='Definition')return;
    const node=ref.node,parent=node.parent;
    if(!parent||node.from<=pos&&node.to>word.from)return;
    let declaration=parent,kind:Symbol['kind']='variable';
    if(parent.name==='VariableDeclarator'){
      if(!parent.parent)return;declaration=parent.parent;
      if(declaration.name==='FieldDeclaration')kind='property';
    }else if(parent.name==='MethodDeclaration')kind='method';
    else if(/^(Class|Interface|Enum)Declaration$/.test(parent.name))kind='class';
    else if(!['FormalParameter','CatchFormalParameter','InferredParameter'].includes(parent.name))return;
    if(kind==='variable'&&node.to>pos)return;
    let scope=declaration.parent;
    while(scope&&!scopes.has(scope.name))scope=scope.parent;
    if(scope&&(pos<scope.from||pos>scope.to))return;
    const name=state.sliceDoc(node.from,node.to);
    let type='';
    for(let child=declaration.firstChild;child;child=child.nextSibling){
      if(/Type/.test(child.name)||child.name==='var'){type=state.sliceDoc(child.from,child.to);break;}
    }
    if(type==='var')type=state.sliceDoc(parent.from,parent.to).match(/\bnew\s+([\w.]+(?:\s*\[\s*\])?)/)?.[1]??'';
    if(/^\s*\[/.test(state.sliceDoc(node.to,parent.to)))type+='[]';
    const symbol={name,type,kind,scopeStart:scope?.from??0};
    if(!symbols.has(name)||symbol.scopeStart>=symbols.get(name)!.scopeStart)symbols.set(name,symbol);
  }});
  let options:Completion[];
  if(memberAccess){
    const receiver=prefix.match(/([\w$]+(?:\s*\.\s*[\w$]+)*)\s*\.\s*$/)?.[1].replace(/\s/g,'');
    if(!receiver)return null;
    const variable=symbols.get(receiver.replace(/^this\./,''));
    if(receiver==='this')options=[...symbols.values()].filter(s=>s.kind==='property'||s.kind==='method').map(s=>({label:s.name,type:s.kind,detail:s.type}));
    else if(variable){
      const type=variable.type.replace(/<.*>/g,'').replace(/\s/g,'');
      options=type.includes('[')?[{label:'length',type:'property',detail:'int','info':'Arrays use length without parentheses.'}]:[...(members[type.split('.').pop()!]??[]),...(!/^(byte|short|int|long|float|double|char|boolean)$/.test(type)?common:[])];
    }else options=staticMembers[receiver]??[];
    if(!options.length)return null;
  }else options=[
    ...[...symbols.values()].map(s=>({label:s.name,type:s.kind,detail:s.type,boost:5})),
    ...keywords.map(label=>({label,type:'keyword',detail:'Java',boost:0})),
    ...classes.map(label=>({label,type:'class',detail:'Java',boost:0})),
  ];
  const byName=new Map<string,Completion>();
  for(const option of options)if(!byName.has(option.label))byName.set(option.label,option);
  const unique=[...byName.values()];
  const suffix=state.sliceDoc(pos,Math.min(pos+100,state.doc.length)).match(/^[\w$]*/)?.[0]??'';
  return {from:word.from,to:pos+suffix.length,options:unique,validFor:/^[\w$]*$/};
}
