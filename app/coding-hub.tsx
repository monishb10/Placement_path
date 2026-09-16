'use client';

import {useStudyFetch} from './account-context';

import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {ArrowRight,BookOpen,Check,CheckCheck,ChevronLeft,ChevronRight,Code2,List,Loader2,RefreshCw} from 'lucide-react';
import {toast} from 'sonner';
import {Select,SelectContent,SelectGroup,SelectItem,SelectLabel,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {codingTopics,practiceTasks,practiceById,problemsForTopic} from '@/lib/coding-bank';
import {type Session,type StudyState} from '@/lib/study-data';
import {Sheet,SheetContent,SheetDescription,SheetHeader,SheetTitle,SheetTrigger} from '@/components/ui/sheet';
import {CodingPractice} from './coding-practice';
import {GitHubSyncPanel} from './github-sync-panel';
import {type GitHubSave} from '@/lib/github-types';

type Summary={taskId:string;accepted:number;version:number;updatedAt:string};
type Entry={session:Session;version:number;dirty:boolean;epoch:number;status:'saved'|'saving'|'error';error:string;conflict:boolean;inFlight?:boolean;github?:GitHubSave};
type Props={topicId:string;today:string;todayTopic:string;ready:boolean;legacy:StudyState;onSelect:(id:string)=>void;onLesson:(id:string)=>void;onQuestions:(id:string)=>void;onFocus:()=>void;onExit:()=>void;onDaily:(session:Session)=>void;coachRef:MutableRefObject<()=>void>;onSummary?:(count:number)=>void;onActivity?:(date:string)=>void};

export default function CodingHub({topicId,today,todayTopic,ready,legacy,onSelect,onLesson,onQuestions,onFocus,onExit,onDaily,coachRef,onSummary,onActivity}:Props){
  const fetch = useStudyFetch();
  const topic=codingTopics.find(t=>t.id===topicId)??codingTopics[0];
  const problems=problemsForTopic(topic.id);
  const [choices,setChoices]=useState<Record<string,string>>({}),[listOpen,setListOpen]=useState(false);
  const task=practiceById[choices[topic.id]??problems[0].id]??problems[0];
  const cache=useRef(new Map<string,Entry>()),timers=useRef(new Map<string,ReturnType<typeof setTimeout>>());
  const [revision,redraw]=useState(0),[summaries,setSummaries]=useState<Record<string,Summary>>({}),[loadError,setLoadError]=useState('');
  const alive=useRef(true),persistRef=useRef<(id:string)=>Promise<void>>(async()=>{});
  const entry=cache.current.get(task.id);
  const editable=ready&&!!entry;
  const notify=()=>{if(alive.current)redraw(n=>n+1);};
  const legacyAccepted=new Set([...Object.values(legacy.sessions),...Object.values(legacy.practice??{})].filter(s=>s.judge?.accepted).map(s=>s.topicId));
  const accepted=(id:string)=>summaries[id]?!!summaries[id].accepted:legacyAccepted.has(id);
  const totalAccepted=practiceTasks.filter(t=>accepted(t.id)).length;
  const topicAccepted=problems.filter(t=>accepted(t.id)).length;
  useEffect(()=>{onSummary?.(totalAccepted);},[totalAccepted,onSummary]);
  useEffect(()=>{
    if(!ready)return;
    const abort=new AbortController();
    void fetch('/api/coding',{cache:'no-store',signal:abort.signal}).then(async r=>{const b=await r.json() as {attempts:Summary[];error?:string};if(!r.ok)throw new Error(b.error);return b.attempts;}).then(rows=>{if(!abort.signal.aborted)setSummaries(old=>({...Object.fromEntries(rows.map(r=>[r.taskId,r])),...old}));}).catch(e=>{if(!abort.signal.aborted)setLoadError(e.message);});
    return()=>abort.abort();
  },[ready]);
  async function loadTask(id:string){
    if(!ready||cache.current.has(id))return;
    setLoadError('');
    try{
      const response=await fetch(`/api/coding?taskId=${encodeURIComponent(id)}&date=${today}`,{cache:'no-store'});
      const body=await response.json() as {session:Session;version:number;error?:string};
      if(!response.ok)throw new Error(body.error);
      if(!cache.current.has(id))cache.current.set(id,{session:body.session,version:body.version,dirty:false,epoch:0,status:'saved',error:'',conflict:false});
      notify();
    }catch(error){if(alive.current)setLoadError(error instanceof Error?error.message:'Could not load this draft.');}
  }
  useEffect(()=>{void loadTask(task.id);},[task.id,ready,today]);
  persistRef.current=async(id:string)=>{
    const item=cache.current.get(id);if(!item||!item.dirty||item.inFlight||item.conflict)return;
    item.inFlight=true;item.status='saving';notify();
    const epoch=item.epoch,snapshot=item.session;let success=false;
    try{
      const response=await fetch('/api/coding',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId:id,version:item.version,session:snapshot})});
      const body=await response.json() as {version:number;accepted:number;updatedAt:string;error?:string;github?:GitHubSave;activityDate?:string};
      if(!response.ok){item.conflict=response.status===409;throw new Error(body.error);}
      item.version=body.version;item.dirty=item.epoch!==epoch;item.status=item.dirty?'saving':'saved';item.error='';success=true;
      if(body.github)item.github=body.github;
      if(body.activityDate)onActivity?.(body.activityDate);
      if(alive.current)setSummaries(old=>({...old,[id]:{taskId:id,accepted:body.accepted,version:body.version,updatedAt:body.updatedAt}}));
    }catch(error){item.status='error';item.error=error instanceof Error?error.message:'Saving failed. Please retry.';}
    finally{item.inFlight=false;notify();if(success&&item.dirty)void persistRef.current(id);}
  };
  useEffect(()=>{
    alive.current=true;
    const before=(event:BeforeUnloadEvent)=>{if([...cache.current.values()].some(e=>e.dirty||e.inFlight)){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',before);
    return()=>{alive.current=false;window.removeEventListener('beforeunload',before);for(const timer of timers.current.values())clearTimeout(timer);for(const [id,e] of cache.current)if(e.dirty)void persistRef.current(id);};
  },[]);
  function update(change:(session:Session)=>void){
    const item=cache.current.get(task.id);if(!editable||!item)return;
    const session=structuredClone(item.session);session.date=today;change(session);item.session=session;item.epoch++;item.dirty=true;item.status=item.conflict?'error':'saving';notify();
    if(task.number===1&&task.topicId===todayTopic)onDaily(session);
    clearTimeout(timers.current.get(task.id));timers.current.set(task.id,setTimeout(()=>void persistRef.current(task.id),450));
  }
  async function copyCoach(){
    const session=cache.current.get(task.id)?.session;
    const text=`Help me solve coding problem ${task.number}/10: ${task.title}. Topic: ${topic.title}. Language: ${task.language}.\nProblem: ${task.statement}\nInput: ${task.inputFormat}\nOutput: ${task.outputFormat}\nConstraints: ${task.constraints.join('; ')}\nMy approach: ${session?.explanation||'Not written yet'}\nMy code:\n${session?.code||'Not written yet'}\nLatest result: ${session?.judge?`${session.judge.passed}/${session.judge.total} passed`:'Not run yet'}.\nAsk me to explain my approach. Give one hint at a time, and only show an interview-quality solution after I have attempted and explained mine.`;
    try{await navigator.clipboard.writeText(text);toast.success('Coding prompt copied to clipboard.');}catch{toast.error('Clipboard unavailable. Send your code and approach to your coach.');}
  }
  coachRef.current=()=>void copyCoach();
  function choose(id:string){void persistRef.current(task.id);setChoices(old=>({...old,[topic.id]:id}));setListOpen(false);}
  const groups=[...new Set(codingTopics.map(t=>t.group))];
  const unsavedErrors=[...cache.current].filter(([id,e])=>id!==task.id&&e.status==='error');
  return <div className="coding-hub coding-hub-compact" data-revision={revision}>
    <div className="coding-command-bar">
      <button className="coding-toolbar-button coding-exit-button" aria-label="Back to dashboard" title="Back to dashboard" onClick={onExit}><ChevronLeft size={18}/></button>
      <div className="coding-topic-control"><Code2 size={19}/><Select value={topic.id} onValueChange={id=>{void persistRef.current(task.id);setListOpen(false);onSelect(id);}}><SelectTrigger aria-label="Choose coding topic"><SelectValue/></SelectTrigger><SelectContent>{groups.map(group=><SelectGroup key={group}><SelectLabel>{group}</SelectLabel>{codingTopics.filter(t=>t.group===group).map(t=><SelectItem key={t.id} value={t.id}>{t.title}{t.id===todayTopic?' · Today':''}</SelectItem>)}</SelectGroup>)}</SelectContent></Select></div>
      <Sheet open={listOpen} onOpenChange={setListOpen}><SheetTrigger className="coding-toolbar-button" aria-label={`Browse the 10 problems for ${topic.title}`}><List size={17}/><span>Problems</span><small>{topicAccepted}/10</small></SheetTrigger><SheetContent side="left" className="coding-problems-drawer"><SheetHeader><SheetTitle>{topic.title}</SheetTitle><SheetDescription>10 coding problems · 3 Easy, 4 Medium, 3 Hard</SheetDescription></SheetHeader><div className="coding-drawer-progress"><span>{topicAccepted} of 10 accepted</span><Progress value={topicAccepted*10} aria-label={`${topicAccepted} of 10 problems accepted`}/></div><button className="text-button coding-drawer-concepts" onClick={()=>{setListOpen(false);onQuestions(topic.id);}}>Concept questions <ArrowRight size={14}/></button><div className="coding-drawer-list">{problems.map(p=><button key={p.id} className={`bank-problem ${p.id===task.id?'bank-selected':''} ${accepted(p.id)?'bank-accepted':''}`} aria-pressed={p.id===task.id} onClick={()=>choose(p.id)}><span className="bank-problem-number">{accepted(p.id)?<Check size={16}/>:String(p.number).padStart(2,'0')}</span><span className="bank-problem-title">{p.title}<small>{p.language==='sql'?'SQL':'Java'} · {p.cases.length} tests</small></span><span className={`coding-difficulty difficulty-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span></button>)}</div><p className="coding-drawer-note">Aim for 1–2 problems in your 25-minute practice block. There are {practiceTasks.length} exercises across all topics; {ready?totalAccepted:'—'} accepted.</p></SheetContent></Sheet>
      <div className="coding-problem-navigation"><button className="coding-toolbar-button" disabled={task.number===1} onClick={()=>choose(problems[task.number-2].id)} aria-label="Previous problem"><ChevronLeft size={18}/></button><span>{task.number} / 10</span><button className="coding-toolbar-button" disabled={task.number===10} onClick={()=>choose(problems[task.number].id)} aria-label="Next problem"><ChevronRight size={18}/></button></div>
      <span className="coding-current-title" title={task.title}>{task.title}</span>
      <div className="coding-save-state" role="status">{!entry?<><Loader2 size={14} className="spin"/>Loading draft</>:entry.status==='saving'?<><Loader2 size={14} className="spin"/>Saving…</>:entry.status==='error'?<><RefreshCw size={14}/>Draft needs attention</>:<><CheckCheck size={15}/>{entry.version?'Draft saved':'Ready to code'}</>}</div>
      <button className="coding-toolbar-button coding-lesson-button" onClick={()=>onLesson(topic.id)} aria-label={`Read the ${topic.title} lesson`}><BookOpen size={17}/><span>Lesson</span></button>
      {entry&&<GitHubSyncPanel compact key={`github-${task.id}`} task={task} session={entry.session} draftSaved={!entry.dirty&&!entry.inFlight} saving={entry.status==='saving'} save={entry.github}/>}
    </div>
    {(loadError||entry?.error)&&<div className="coding-error" role="alert"><p>{loadError||entry?.error}</p>{!entry?<button className="text-button" onClick={()=>void loadTask(task.id)}>Retry loading</button>:!entry.conflict&&<button className="text-button" onClick={()=>void persistRef.current(task.id)}>Retry saving</button>}</div>}
    {unsavedErrors.length>0&&<div className="coding-error" role="alert">Unsaved draft: {unsavedErrors.map(([id])=><button key={id} className="text-button" onClick={()=>{const p=practiceById[id];onSelect(p.topicId);setChoices(old=>({...old,[p.topicId]:id}));}}>{practiceById[id].title}<ArrowRight size={14}/></button>)}</div>}
    {!entry?<div className="coding-draft-loading"><Code2 size={25}/><p>{loadError?'Your existing code will appear after loading succeeds.':'Loading your code and approach for this problem…'}</p></div>:<div className="coding-lab-surface"><CodingPractice key={task.id} task={task} session={entry.session} ready={editable}
      onCode={code=>update(s=>{s.code=code;if(code.trim())s.attempted=Math.max(s.attempted,1);})}
      onExplanation={value=>update(s=>{s.explanation=value;})}
      onComplexity={(key,value)=>update(s=>{s.complexity={time:s.complexity?.time??'',space:s.complexity?.space??'',[key]:value};})}
      onStep={(step,done)=>update(s=>{s.steps=done?Array.from(new Set([...s.steps,step])):s.steps.filter(x=>x!==step);})}
      onHint={()=>update(s=>{s.hintUsed=true;s.independent=0;if(s.solved)s.p1='With help';})}
      onAttempt={code=>update(s=>{s.code=code;s.attempted=Math.max(s.attempted,1);s.checks=Array.from(new Set([...s.checks,'code-0']));})}
      onFinish={(summary,source)=>update(s=>{if(s.code!==source)return;s.judge=summary;if(summary.accepted){s.solved=1;s.independent=s.hintUsed?0:1;s.p1=s.hintUsed?'With help':'Without help';}})}
      onCoach={()=>void copyCoach()}/></div>}
  </div>;
}
