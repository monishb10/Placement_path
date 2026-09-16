'use client';

import {useStudyFetch} from './account-context';

import {lazy,Suspense,useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import {BookOpen,Map,BarChart3,ArrowUpRight,Play,Pause,RotateCcw,ChevronRight,Check,Clock3,Flame,Code2,Sparkles,Target,CalendarDays,LockKeyhole,Copy,Lightbulb,GraduationCap,ListChecks,ArrowRight,ExternalLink,Loader2,RefreshCw,CheckCheck,Brain,MessageSquare,Flag,LayoutDashboard} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {Progress} from '@/components/ui/progress';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Toaster} from '@/components/ui/sonner';
import {Empty,EmptyHeader,EmptyMedia,EmptyTitle,EmptyDescription} from '@/components/ui/empty';
import {toast} from 'sonner';
import {blocks,lessons,phases,placementTopics,steps,taskIds,initialState,newSession,localDate,dateFromKey,isComplete,type StudyState,type Session} from '@/lib/study-data';

import {Dashboard} from './dashboard';
const CodingHub=lazy(()=>import('./coding-hub'));
import {countAcceptedCoding,type CodingProgressRow} from '@/lib/coding-progress';
import {TopicLibrary,TopicLesson,PlacementLesson} from './topic-library';
import {topicResources} from '@/lib/topic-resources';
import {hasStudyActivity} from '@/lib/dashboard-data';
import {placementResources,dailyPlacementResourceIds} from '@/lib/placement-resources';

import {WorkspaceHeader,TodayBoard,FocusDock,LearningRoadmap,ProgressView,type WorkspaceView} from './workspace-panels';

type View=WorkspaceView;
type Modal='revision'|'learn'|'placement'|'reflection'|'weekly'|'resource'|'placement-resource'|null;

export default function StudyWorkspace(){
  const fetch = useStudyFetch();
  const [view,setView]=useState<View>('dashboard');
  const [roadmapPhase,setRoadmapPhase]=useState<number|undefined>();
  const [codingTopicId,setCodingTopicId]=useState('');
  const [codingOpened,setCodingOpened]=useState(false);
  const [codingAccepted,setCodingAccepted]=useState<number|null>(null);
  const [codingDays,setCodingDays]=useState<string[]>([]);
  const addCodingDay=useCallback((date:string)=>setCodingDays(days=>days.includes(date)?days:[...days,date]),[]);
  const codingCoachRef=useRef<()=>void>(()=>{});
  useEffect(()=>{if(view==='coding')setCodingOpened(true);},[view]);
  const [resourceId,setResourceId]=useState('variables'),[placementResourceId,setPlacementResourceId]=useState('percentages');
  const [resourceTab,setResourceTab]=useState<'concept'|'questions'>('concept'),[placementResourceTab,setPlacementResourceTab]=useState<'concept'|'questions'>('concept');
  const [data,setData]=useState<StudyState>(initialState);
  const dataRef=useRef(data),version=useRef(0),dirty=useRef(false),inFlight=useRef(false),changeNumber=useRef(0),saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [ready,setReady]=useState(false),[saveStatus,setSaveStatus]=useState('loading'),[error,setError]=useState(''),[needsSignIn,setNeedsSignIn]=useState(false);
  useEffect(()=>{if(!ready)return;const abort=new AbortController();void fetch('/api/coding',{cache:'no-store',signal:abort.signal}).then(async response=>{if(!response.ok)return;const body=await response.json() as {attempts:CodingProgressRow[];activityDates:string[]};if(!abort.signal.aborted){setCodingAccepted(countAcceptedCoding(dataRef.current,body.attempts));setCodingDays(days=>[...new Set([...days,...body.activityDates])]);}}).catch(()=>{});return()=>abort.abort();},[ready]);
  const [today,setToday]=useState('');
  const [modal,setModal]=useState<Modal>(null),[activeBlock,setActiveBlock]=useState('code'),[remaining,setRemaining]=useState(25*60),[running,setRunning]=useState(false),[celebrate,setCelebrate]=useState(false);
  const endTime=useRef(0),persistRef=useRef<()=>Promise<void>>(async()=>{});
  const [hintLevel,setHintLevel]=useState(0);
  const [reflection,setReflection]=useState({topicDone:'',p1:'',notes:'',revision:''});
  const load=useCallback(async()=>{
    setError('');setSaveStatus('loading');setNeedsSignIn(false);
    try{
      const response=await fetch('/api/study',{cache:'no-store'});const body=await response.json() as {state:StudyState;version:number;error?:string};
      if(!response.ok){setNeedsSignIn(response.status===401);throw new Error(body.error);}
      dataRef.current=body.state;setData(body.state);version.current=body.version;dirty.current=false;setReady(true);setSaveStatus('saved');
    }catch(e){setError(e instanceof Error?e.message:'Could not load your progress.');setSaveStatus('error');}
  },[]);
  useEffect(()=>{setToday(localDate());void load();const t=setInterval(()=>setToday(localDate()),30000);return()=>clearInterval(t);},[load]);
  persistRef.current=async()=>{
    if(inFlight.current||!dirty.current)return;
    inFlight.current=true;setSaveStatus('saving');const snapshot=dataRef.current,revision=changeNumber.current;let success=false;
    try{
      const response=await fetch('/api/study',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:version.current,state:snapshot})});
      const body=await response.json() as {state:StudyState;version:number;error?:string};if(!response.ok)throw new Error(body.error);
      version.current=body.version;if(changeNumber.current===revision)dirty.current=false;setError('');setSaveStatus(dirty.current?'saving':'saved');success=true;
    }catch(e){setError(e instanceof Error?e.message:'Saving is unavailable. Your changes are still on screen.');setSaveStatus('error');}
    finally{inFlight.current=false;if(success&&dirty.current)void persistRef.current();}
  };
  useEffect(()=>{const handler=(e:BeforeUnloadEvent)=>{if(dirty.current||inFlight.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>{window.removeEventListener('beforeunload',handler);if(saveTimer.current)clearTimeout(saveTimer.current);};},[]);
  const mutate=(updater:(draft:StudyState)=>void)=>{
    if(!ready)return;const draft=structuredClone(dataRef.current);updater(draft);dataRef.current=draft;setData(draft);dirty.current=true;changeNumber.current++;setSaveStatus('saving');
    if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>void persistRef.current(),450);
  };
  const session=data.sessions[today]??newSession(today,data.currentTopic);
  const lesson=lessons.find(l=>l.id===session.topicId)??lessons[0];
  const sessions=Object.values(data.sessions).sort((a,b)=>a.date.localeCompare(b.date));
  const prior=sessions.filter(s=>s.date<today).at(-1);
  const day=sessions.filter(s=>s.date<today).length+1;
  const date=today?dateFromKey(today):null;
  const weekday=date?.getDay()??3;
  const placement=placementTopics[weekday];
  const checked=taskIds.filter(id=>session.checks.includes(id)).length;
  const percent=Math.round(checked/taskIds.length*100);
  const completed=sessions.filter(isComplete);
  const solved=sessions.reduce((sum,s)=>sum+s.solved,0);
  const independent=sessions.reduce((sum,s)=>sum+s.independent,0);
  const updateSession=(update:(s:Session)=>void)=>mutate(d=>{const s=d.sessions[today]??newSession(today,d.currentTopic);update(s);d.sessions[today]=s;});
  const toggleTask=(id:string)=>{
    const was=session.checks.includes(id);updateSession(s=>{s.checks=was?s.checks.filter(v=>v!==id):[...s.checks,id];});
    if(!was&&checked===taskIds.length-1){setCelebrate(true);toast.success('Your daily checklist is complete. Finish with a quick reflection.');setTimeout(()=>setCelebrate(false),1800);}
  };
  const openModal=(value:Modal|'code')=>{if(value==='code'){openCoding(lesson.id);return;}setHintLevel(0);if(value==='reflection')setReflection({topicDone:session.topicDone,p1:session.p1,notes:session.notes,revision:session.revision});setModal(value);};
  const currentTimer=blocks.find(b=>b.id===activeBlock)??blocks[2];
  useEffect(()=>{
    if(!running)return;
    const tick=()=>{const next=Math.max(0,Math.ceil((endTime.current-Date.now())/1000));setRemaining(next);if(next===0){setRunning(false);toast.success('Focus block finished. Take a breath and tick off what you completed.');}};
    const interval=setInterval(tick,250);tick();return()=>clearInterval(interval);
  },[running]);
  const startPause=()=>{if(running){setRunning(false);}else{const duration=remaining>0?remaining:currentTimer.minutes*60;setRemaining(duration);endTime.current=Date.now()+duration*1000;setRunning(true);}};
  const chooseTimer=(id:string,start=false)=>{const b=blocks.find(b=>b.id===id)!;setRunning(false);setActiveBlock(id);setRemaining(b.minutes*60);if(start){endTime.current=Date.now()+b.minutes*60000;setRunning(true);}};
  const weekDates=()=>{if(!date)return [];const monday=new Date(date);const offset=(monday.getDay()+6)%7;monday.setDate(monday.getDate()-offset);return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return localDate(d);});};
  const week=weekDates();
  const weekSessions=week.map(d=>data.sessions[d]).filter((s):s is Session=>!!s&&hasStudyActivity(s));
  let streak=0;if(date){const d=new Date(date);if(!hasStudyActivity(data.sessions[localDate(d)]))d.setDate(d.getDate()-1);for(let i=0;i<600;i++){if(!hasStudyActivity(data.sessions[localDate(d)]))break;streak++;d.setDate(d.getDate()-1);}}
  const previousLesson=prior?lessons.find(l=>l.id===prior.topicId):null;
  const taskLabels:Record<string,string[]>={revision:[prior?`Recall ${previousLesson?.title.toLowerCase()??'your previous topic'}`:'Answer 3 quick baseline questions',prior?'Revisit your last difficult point':'Set your starting point'],learn:[`Understand ${lesson.title.toLowerCase()}`,'Try the Java example yourself','Explain the time & space complexity'],code:[`Attempt: ${lesson.problem}`,'Explain your approach & test edge cases'],placement:[`Review ${placement.concept.toLowerCase()}`,'Answer the interview question aloud']};
  const copyCoach=async()=>{const text=`Start today's preparation. I am on Day ${day}, studying ${lesson.title}. Use the 10-minute revision, 15-minute concept, 25-minute Java practice, and 10-minute placement routine. Placement topic: ${placement.name}. Last weak area: ${prior?.notes||'No previous difficulty recorded'}. Revision needed: ${prior?.revision||'Baseline revision'}. Today's practice: ${lesson.problem}. Latest test result: ${session.judge?`${session.judge.passed}/${session.judge.total} passed on ${session.judge.mode}`:'Not run yet'}. My approach: ${session.explanation||'Not attempted yet'}. My code:\n${session.code||'Not written yet'}\nDo not give me the solution first. Ask me to explain my approach and give one hint at a time.`;try{await navigator.clipboard.writeText(text);toast.success('Coach prompt copied to clipboard.');}catch{toast.error('Clipboard unavailable. You can send your approach in this conversation.');}};
  const saveReflection=()=>{
    if(!reflection.topicDone||!reflection.p1){toast.error('Answer the first two questions before saving.');return;}
    const p1=session.hintUsed&&reflection.p1==='Without help'?'With help':reflection.p1;
    updateSession(s=>{s.topicDone=reflection.topicDone;s.p1=p1;s.p2='N/A';s.notes=reflection.notes;s.revision=reflection.revision;s.attempted=p1==='Not attempted'?0:1;s.solved=['Without help','With help'].includes(p1)?1:0;s.independent=p1==='Without help'?1:0;s.reported=true;});setModal(null);toast.success('Reflection recorded. Your next revision starts here.');
  };
  const resourceLesson=lessons.find(l=>l.id===resourceId)??lessons[0];
  const placementResource=placementResources.find(r=>r.id===(modal==='placement-resource'?placementResourceId:dailyPlacementResourceIds[weekday]))??placementResources[0];
  const openResource=(id:string)=>{setResourceId(id);setResourceTab('concept');setModal('resource');};
  const openQuestions=(id:string)=>{setResourceId(id);setResourceTab('questions');setModal('resource');};
  const openPlacementResource=(id:string)=>{setPlacementResourceId(id);setPlacementResourceTab('concept');setModal('placement-resource');};
  const openPlacementQuestions=(id:string)=>{setPlacementResourceId(id);setPlacementResourceTab('questions');setModal('placement-resource');};
  const openCoding=(id:string)=>{setCodingTopicId(id);setModal(null);setView('coding');};
  const setNextTopic=(id:string)=>{mutate(d=>{d.currentTopic=id;if(!d.sessions[today]||!hasStudyActivity(d.sessions[today]))d.sessions[today]=newSession(today,id);});toast.success(hasStudyActivity(session)?'Topic queued for your next study day.':'Today’s topic updated.');};
  return <Tabs value={view} onValueChange={v=>setView(v as View)} className={`app-shell ${view==='coding'?'coding-shell':''}`}><WorkspaceHeader saveStatus={saveStatus} onHome={()=>setView('dashboard')}/><main className="workspace-content">
    {error&&<div className="error-banner" role="alert"><span>{error}</span>{needsSignIn?<a href="/login" target="_top">Sign in with GitHub <ArrowUpRight size={15}/></a>:<button onClick={()=>ready?void persistRef.current():void load()}><RefreshCw size={15}/>Retry</button>}</div>}
    <TabsContent value={view} className="view-page">
    {view==='dashboard'&&<Dashboard codingDays={codingDays} codingAccepted={codingAccepted} data={data} today={today} day={day} lesson={lesson} session={session} ready={ready} labels={taskLabels} onView={setView} onBlock={openModal} onResource={openResource} onToggle={toggleTask} onPhase={phase=>{setRoadmapPhase(phase);setView('roadmap');}}/>}
    {view==='today'&&<TodayBoard day={day} today={today} lesson={lesson} session={session} labels={taskLabels} ready={ready} onToggle={toggleTask} onBlock={openModal} onFocus={id=>chooseTimer(id,true)} onReflection={()=>openModal('reflection')}/>}
    {(view==='coding'||codingOpened)&&<div className="coding-page" hidden={view!=='coding'}><Suspense fallback={<p role="status">Loading your coding workspace…</p>}><CodingHub onExit={()=>setView('dashboard')} onActivity={addCodingDay} onSummary={setCodingAccepted} topicId={codingTopicId||lesson.id} today={today} todayTopic={lesson.id} ready={ready} legacy={data} onSelect={openCoding} onLesson={id=>lessons.some(l=>l.id===id)?openResource(id):openPlacementResource(id)} onQuestions={id=>lessons.some(l=>l.id===id)?openQuestions(id):openPlacementQuestions(id)} onFocus={()=>chooseTimer('code',true)} coachRef={codingCoachRef} onDaily={draft=>updateSession(s=>{for(const key of ['code','explanation','steps','complexity','judge','attempted','solved','independent','hintUsed','p1'] as const)Object.assign(s,{[key]:draft[key]});s.checks=Array.from(new Set([...s.checks,...draft.checks.filter(id=>id.startsWith('code-'))]));})}/></Suspense></div>}
    {view==='roadmap'&&<LearningRoadmap onCoding={openCoding} initialPhase={roadmapPhase} lesson={lesson} queued={data.currentTopic} mastered={data.mastered} ready={ready} onOpen={openResource} onNext={setNextTopic} onToggle={(id,done)=>mutate(d=>{d.mastered=done?Array.from(new Set([...d.mastered,id])):d.mastered.filter(x=>x!==id);})}/>}
    {view==='library'&&<TopicLibrary mastered={data.mastered} currentTopic={data.currentTopic} onOpen={openResource} onPlacement={openPlacementResource} onQuestions={openQuestions} onPlacementQuestions={openPlacementQuestions} onCoding={openCoding}/>}
    {view==='progress'&&<ProgressView data={data} today={today} onToday={()=>setView('today')} onWeekly={()=>openModal('weekly')}/>}
    </TabsContent><footer className="workspace-footer"><span><GraduationCap size={16}/>Placement Path</span><span><LockKeyhole size={13}/>Your private study workspace</span></footer>
    </main><FocusDock compact={view==='coding'} activeBlock={activeBlock} remaining={remaining} running={running} ready={ready} onChoose={chooseTimer} onStartPause={startPause} onReset={()=>chooseTimer(activeBlock)} onCoach={view==='coding'?()=>codingCoachRef.current():copyCoach}/>
    {celebrate&&<div className="celebration" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--i':i,'--x':`${(i*37)%100}%`,'--r':`${i*29}deg`,'--c':['#3659ed','#a07adb','#2da685','#e9ac51'][i%4]} as CSSProperties}/>)}</div>}
    <Dialog open={modal!==null} onOpenChange={open=>{if(!open)setModal(null);}}><DialogContent className="study-dialog"><DialogHeader><span className="eyebrow">{modal==='resource'?`TOPIC LIBRARY · PHASE ${resourceLesson.phase}`:modal==='placement-resource'?`${placementResource.day.toUpperCase()} · PLACEMENT LIBRARY`:modal==='reflection'?'END-OF-SESSION CHECK-IN':modal==='weekly'?'SUNDAY REVIEW':`DAY ${day} · ${modal==='learn'?'15':'10'} MINUTES`}</span><DialogTitle>{modal==='resource'?resourceLesson.title:modal==='placement-resource'?placementResource.title:modal==='learn'?lesson.title:modal==='revision'?'Warm up your memory':modal==='placement'?placement.concept:modal==='reflection'?'Make tomorrow a little easier':'Your weekly check-in'}</DialogTitle><DialogDescription>{modal==='resource'?'Build understanding with a small example, then try the idea in Java.':modal==='placement-resource'?'Use this reference during a 10-minute placement block.':modal==='learn'?'One concept. A small Java example. Then your own attempt.':modal==='reflection'?'Honest answers help you choose the right pace.':modal==='weekly'?'Review what happened, revisit one weak concept and set a realistic next target.':modal==='revision'?'Try answering aloud before looking at your notes.':'Use a simple example, then explain it in your own words.'}</DialogDescription></DialogHeader><div className="dialog-body">
      {modal==='revision'&&<><div className="lesson-section"><h3>{prior?`Recall: ${previousLesson?.title}`:'Your starting point'}</h3><ol className="question-list">{(prior?[`Explain ${previousLesson?.title.toLowerCase()} in one sentence.`,'When would you use it in a real program?','What is the time and space complexity of your last solution?']:['What is a variable used for?','How would you store a whole number and a decimal in Java?','Have you run a Java program before? What part felt difficult?']).map(q=><li key={q}>{q}</li>)}</ol></div><div className="callout purple-callout"><Brain size={19}/><div><strong>{prior?'Revisit your last difficulty':'No previous mistakes recorded'}</strong><p>{prior?.notes||'Use today to establish your baseline. It is fine not to know an answer yet.'}</p>{prior?.revision&&<p>Revise: {prior.revision}</p>}</div></div><button className="primary-button" onClick={()=>{updateSession(s=>{s.checks=Array.from(new Set([...s.checks,'revision-0','revision-1']));});setModal(null);}}>I’ve finished the revision <Check size={16}/></button></>}
      {modal==='learn'&&<><TopicLesson lesson={lesson} onCoding={()=>openCoding(lesson.id)}/><button className="primary-button" disabled={!ready} onClick={()=>{updateSession(s=>{s.checks=Array.from(new Set([...s.checks,'learn-0']));});setModal(null);}}>I understand the concept <Check size={16}/></button></>}

      {modal==='placement'&&<><PlacementLesson resource={placementResource} onCoding={()=>openCoding(placementResource.id)}/><p className="small-note">Aim for a clear 30–60 second answer: definition, example and one practical difference or limitation.</p>{weekday===0&&<button className="secondary-button" onClick={()=>setModal('weekly')}>Open this week’s review <ArrowRight size={16}/></button>}<button className="primary-button" disabled={!ready} onClick={()=>{updateSession(s=>{s.checks=Array.from(new Set([...s.checks,'placement-0','placement-1']));});setModal(null);}}>I’ve practised my answer <Check size={16}/></button></>}
      {modal==='resource'&&<><TopicLesson lesson={resourceLesson} initialTab={resourceTab} onCoding={()=>openCoding(resourceLesson.id)}/><div className="resource-modal-actions"><button className="secondary-button" onClick={()=>{setModal(null);setView('library');}}>Browse all topics</button><button className="primary-button" disabled={!ready} onClick={()=>{if(resourceLesson.id!==session.topicId)setNextTopic(resourceLesson.id);setModal(null);setView('today');}}>{session.topicId===resourceLesson.id?'Go to today’s checklist':'Set as my next topic'} <ArrowRight size={16}/></button></div></>}
      {modal==='placement-resource'&&<PlacementLesson resource={placementResource} onCoding={()=>openCoding(placementResource.id)} initialTab={placementResourceTab}/>}
      {modal==='reflection'&&<div className="reflection-form"><label className="field-label">1. Did you complete today’s topic?</label><Select value={reflection.topicDone} onValueChange={v=>setReflection(r=>({...r,topicDone:v}))}><SelectTrigger aria-label="Did you complete today’s topic?"><SelectValue placeholder="Choose your answer"/></SelectTrigger><SelectContent>{['Yes','Partly','No'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><label className="field-label">2. Did you solve Problem 1 without help?</label><Select value={reflection.p1} onValueChange={v=>setReflection(r=>({...r,p1:v}))}><SelectTrigger aria-label="Did you solve Problem 1 without help?"><SelectValue placeholder="How did your attempt go?"/></SelectTrigger><SelectContent>{['Without help','With help','Not solved','Not attempted'].map(v=><SelectItem key={v} value={v} disabled={v==='Without help'&&session.hintUsed}>{v}</SelectItem>)}</SelectContent></Select>{session.hintUsed&&<p className="small-note">You opened a hint, so this attempt is recorded as assisted if solved.</p>}<label className="field-label">3. Did you solve Problem 2 without help?</label><p className="readonly-field">N/A — one coding problem in today’s plan.</p><label htmlFor="difficulty" className="field-label">4. What difficulty did you face?</label><textarea id="difficulty" rows={3} value={reflection.notes} maxLength={4000} placeholder="For example: I mixed up int and double…" onChange={e=>setReflection(r=>({...r,notes:e.target.value}))}/><label htmlFor="revision" className="field-label">5. What should be revised tomorrow?</label><textarea id="revision" rows={2} value={reflection.revision} maxLength={4000} placeholder="One specific concept or mistake to revisit…" onChange={e=>setReflection(r=>({...r,revision:e.target.value}))}/><button className="primary-button" onClick={saveReflection}>Save my reflection <Check size={17}/></button></div>}
      {modal==='weekly'&&<><div className="review-totals"><div><strong>{weekSessions.length}</strong><span>study days</span></div><div><strong>{weekSessions.reduce((n,s)=>n+s.solved,0)}</strong><span>problems solved</span></div><div><strong>{weekSessions.reduce((n,s)=>n+s.independent,0)}</strong><span>without help</span></div></div><section className="lesson-section"><h3>What needs another look?</h3>{weekSessions.some(s=>s.notes||s.revision)?<ul className="review-notes">{weekSessions.filter(s=>s.notes||s.revision).map(s=><li key={s.date}><strong>{lessons.find(l=>l.id===s.topicId)?.title}</strong><p>{s.revision||s.notes}</p></li>)}</ul>:<p>No weak areas recorded yet. Use your daily reflection to note where you got stuck.</p>}</section><section className="lesson-section"><h3>Your short weekly test</h3><ol className="question-list"><li>Explain one concept from this week without looking at notes.</li><li>Explain the time and space complexity of one solution you wrote.</li><li>Redo {weekSessions.length?'one problem you attempted this week':'today’s coding problem'} in Java without hints. Test an edge case.</li></ol></section><div className="callout"><Target size={18}/><div><strong>Next week’s targets</strong><p>Revisit your two most difficult points. Solve one related problem each study day. Move to the next topic only when you can explain and code the current one.</p></div></div><p className="small-note">Sunday stays within one hour: 10 minutes of recall, 15 minutes of revision, 25 minutes for the coding test, and 10 minutes for one career task and next-week targets.</p><button className="primary-button" onClick={()=>openModal('reflection')}>Record my revision targets <ArrowRight size={16}/></button></>}
    </div></DialogContent></Dialog><Toaster theme="light" position="top-right"/></Tabs>;
}
