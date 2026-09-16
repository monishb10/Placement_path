'use client';

import {useStudyFetch} from './account-context';

import {useEffect, useRef, useState} from 'react';
import {AlertCircle, ArrowUpRight, Check, CheckCheck, Clock3, Code2, Copy, ExternalLink, Lightbulb, Loader2, Maximize2, Minimize2, Play, Send, Square, Terminal, X} from 'lucide-react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Checkbox} from '@/components/ui/checkbox';
import {Progress} from '@/components/ui/progress';
import {ResizablePanelGroup,ResizablePanel,ResizableHandle} from '@/components/ui/resizable';
import {ToggleGroup,ToggleGroupItem} from '@/components/ui/toggle-group';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {CodeEditor} from './code-editor';
import {toast} from 'sonner';
import {type CodingCase} from '@/lib/coding-tasks';
import {type PracticeTask,codingTopics} from '@/lib/coding-bank';
import {executeSql} from '@/lib/sql-executor';
import {debugSuggestion, sourceHash, verdictLabels, type CaseResult, type JudgeSummary} from '@/lib/judge-types';
import {gfgUrl} from '@/lib/topic-resources';
import {steps, type Session} from '@/lib/study-data';

type Props = {
  task: PracticeTask; session: Session; ready: boolean;
  onCode: (code: string) => void; onExplanation: (text: string) => void;
  onComplexity: (key: 'time' | 'space', value: string) => void;
  onStep: (step: string, checked: boolean) => void; onHint: () => void;
  onAttempt: (code: string) => void; onFinish: (summary: JudgeSummary, code: string) => void;
  onCoach: () => void;
};
type RunMode = 'samples' | 'submit' | 'custom';
export function CodingPractice({task, session, ready, onCode, onExplanation, onComplexity, onStep, onHint, onAttempt, onFinish, onCoach}: Props) {
  const fetch = useStudyFetch();
  const sql=task.language==='sql';
  const reference=codingTopics.find(t=>t.id===task.topicId)!;
  const language=sql?'SQL':'Java';
  const [code, setCode] = useState(session.code || task.starter);
  const [customInput, setCustomInput] = useState('');
  const [mobilePane,setMobilePane]=useState('problem');
  const [focusedPane,setFocusedPane]=useState<'code'|'results'|null>(null);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [running, setRunning] = useState(false), [runMode, setRunMode] = useState<RunMode>('samples');
  const [activeCase, setActiveCase] = useState(task.cases[0].id), [runningCase, setRunningCase] = useState('');
  const [editorTab, setEditorTab] = useState('tests'), [problemTab, setProblemTab] = useState('problem');
  const [runSource, setRunSource] = useState(''), [inputSnapshot, setInputSnapshot] = useState('');
  const [hints, setHints] = useState(0), [hash, setHash] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [allowExternalExecution, setAllowExternalExecution] = useState(false);
  const [pendingRun, setPendingRun] = useState<RunMode | null>(null);
  const controller = useRef<AbortController | null>(null), mounted = useRef(true), edited = useRef(false);
  const approachRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (!edited.current) setCode(session.code || task.starter); }, [ready, session.code, task.starter]);
  useEffect(() => { let active = true; void sourceHash(code).then(value => { if (active) setHash(value); }); return () => { active = false; }; }, [code]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);

  async function run(mode: RunMode, permissionGranted = false) {
    if (controller.current || !ready || !code.trim()) return;
    if (mode === 'submit' && !session.explanation.trim()) {
      setFocusedPane(null); setMobilePane('problem'); setProblemTab('approach'); toast.message('Explain your approach before submitting.');
      setTimeout(() => approachRef.current?.focus(), 0); return;
    }
    if (!sql && !allowExternalExecution && !permissionGranted) { setPendingRun(mode); return; }
    const abort = new AbortController(); controller.current = abort;
    const source = code;
    const tests: CodingCase[] = mode === 'custom' ? [{id: 'custom', name: 'Custom input', input: customInput, expected: '', sample: false}] : mode === 'samples' ? task.cases.filter(c => c.sample) : task.cases;
    setRunning(true); setCancelled(false); setResults([]); setRunMode(mode); setRunSource(source); setInputSnapshot(customInput);
    setFocusedPane(pane=>pane?'results':null); setMobilePane('results'); setActiveCase(tests[0].id); setEditorTab(mode === 'custom' ? 'custom' : 'tests'); onAttempt(source);
    const finished: CaseResult[] = [];
    try {
      for (const test of tests) {
        if (abort.signal.aborted) break;
        setRunningCase(test.id);
        let result: CaseResult;
        try {
          if(sql){result=await executeSql(source,test,mode==='custom',abort.signal);}else{
          const response = await fetch('/api/judge', {method: 'POST', headers: {'Content-Type': 'application/json'}, signal: abort.signal,
            body: JSON.stringify({topicId: task.topicId, taskId:task.id, caseId: test.id, code: source, allowExternalExecution: true, ...(mode === 'custom' ? {customInput: test.input} : {})})});
          const body = await response.json() as CaseResult & {error?: string};
          if (!response.ok) throw new Error(body.error || 'Could not run this test. Please retry.');
          if (!Object.hasOwn(verdictLabels, body.verdict)) throw new Error('The runner returned an incomplete result. Please retry.');
          result = body;
          }
        } catch (error) {
          if (abort.signal.aborted) break;
          result = {caseId: test.id, verdict: 'unavailable', stdout: '', stderr: '', compileOutput: '', seconds: null, memoryBytes: null, message: error instanceof Error ? error.message : 'The runner is unavailable. Please retry.'};
        }
        if (!mounted.current || abort.signal.aborted) break;
        finished.push(result); setResults([...finished]);
        if (result.verdict !== 'passed' && result.verdict !== 'ran' && finished.every(r => r.verdict === 'passed' || r === result)) setActiveCase(test.id);
        // Recompiling the same broken program or hammering an unavailable service adds no value.
        if (['compile_error', 'unavailable', 'output_limit', 'time_limit'].includes(result.verdict)) break;
      }
      if (!mounted.current || abort.signal.aborted) return;
      if (mode !== 'custom') {
        const passed = finished.filter(r => r.verdict === 'passed').length;
        const accepted = mode === 'submit' && finished.length === tests.length && passed === tests.length;
        const summary: JudgeSummary = {sourceHash: await sourceHash(source), passed, total: tests.length, accepted, mode, at: new Date().toISOString()};
        if (!mounted.current || abort.signal.aborted) return;
        onFinish(summary, source);
        if (accepted) toast.success('All provided tests passed. Your solved count is updated.');
        else if (passed === tests.length) toast.success('Samples passed. Submit to check every provided case.');
      }
    } finally {
      controller.current = null;
      if (mounted.current) { setRunning(false); setRunningCase(''); if (abort.signal.aborted) setCancelled(true); }
    }
  }
  const passed = results.filter(r => r.verdict === 'passed').length;
  const expectedCount = runMode === 'samples' ? task.cases.filter(c => c.sample).length : runMode === 'custom' ? 1 : task.cases.length;
  const stale = !!runSource && runSource !== code;
  const selectedTest = activeCase === 'custom' ? {id: 'custom', name: 'Custom input', input: inputSnapshot, expected: ''} : task.cases.find(c => c.id === activeCase)!;
  const selectedResult = results.find(r => r.caseId === activeCase);
  const accepted = !cancelled && !running && !stale && runMode === 'submit' && passed === task.cases.length;
  const oldSummary = session.judge;
  const currentSummary = oldSummary?.sourceHash === hash;

  function showResult(test: {name: string; input: string; expected: string}, result?: CaseResult, custom = false) {
    return <div className="judge-case-detail">
      <div className="case-detail-heading"><h3>{test.name}</h3>{result && <span className={`verdict verdict-${result.verdict}`}>{verdictLabels[result.verdict]}</span>}</div>
      <div className="test-io"><div><span>Input</span><pre>{test.input || '(empty input)'}</pre></div>{!custom && <div className="expected-output"><span>Expected output</span><pre>{test.expected}</pre></div>}<div className={result?.verdict === 'wrong_answer' ? 'incorrect-output' : ''}><span>Your output</span><pre>{result ? result.stdout || '(no output)' : 'Not run yet'}</pre></div></div>
      {result?.compileOutput && <div className="compiler-message"><strong>Compiler diagnostics</strong><pre>{result.compileOutput}</pre></div>}
      {result?.stderr && <div className="compiler-message"><strong>Runtime error output</strong><pre>{result.stderr}</pre></div>}
      {result?.message && <p className="runner-message" role="status">{result.message}</p>}
      {result && <div className="test-result-meta">{result.seconds !== null && <span><Clock3 size={14}/>{result.seconds.toFixed(3)} s</span>}{result.memoryBytes !== null && <span>{(result.memoryBytes / 1024 / 1024).toFixed(1)} MB</span>}</div>}
      {result && !['passed','ran'].includes(result.verdict) && <div className="debug-advice"><Lightbulb size={18}/><p>{sql?'Check the SQL error, column order, sort order, NULL handling, and duplicate rows. Compare the first differing row.':debugSuggestion(result, test.name)}</p></div>}
    </div>;
  }

  function expandControl(pane:'code'|'results'){
    const expanded=focusedPane===pane;
    return <button type="button" className="coding-pane-expand" aria-label={expanded?'Show all three panels':`Expand ${pane==='code'?'code editor':'test cases'}`} title={expanded?'Show all panels':`Expand ${pane==='code'?'code':'tests'}`} aria-pressed={expanded} onClick={()=>setFocusedPane(expanded?null:pane)}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button>;
  }

  return <div className="judge-workspace judge-workspace-compact" data-mobile-pane={mobilePane} data-focused-pane={focusedPane??'all'}>
    <div className="compact-judge-toolbar"><a className="compact-gfg-link" href={gfgUrl(reference.path)} target="_blank" rel="noopener noreferrer" aria-label="Read this topic on GeeksforGeeks"><span>GFG</span><ExternalLink size={14}/></a>{!sql?<div className="runner-provider"><Checkbox id="allow-java-service" className="task-checkbox" checked={allowExternalExecution} disabled={running} onCheckedChange={value=>setAllowExternalExecution(value===true)}/><label htmlFor="allow-java-service">Send my code and test input to <a href="https://paiza.io/en" target="_blank" rel="noopener noreferrer">Paiza.IO <ArrowUpRight size={12}/></a> when I run or submit.</label></div>:<p className="runner-provider">SQLite runs in your browser. Your query saves with this exercise.</p>}<div className="judge-runbar"><div>{running ? <button className="secondary-button" onClick={() => controller.current?.abort()}><Square size={14}/>Stop</button> : <><button className="secondary-button" disabled={!ready || !code.trim()} onClick={() => void run('samples')}><Play size={15}/>Run samples</button><button className="primary-button" disabled={!ready || !code.trim()} onClick={() => void run('submit')}><Send size={15}/>Submit all tests</button></>}</div></div></div>
    <ToggleGroup type="single" value={mobilePane} onValueChange={value=>{if(value)setMobilePane(value);}} className="coding-mobile-panes" aria-label="Choose workspace panel"><ToggleGroupItem value="problem" aria-controls="coding-description-pane">Problem</ToggleGroupItem><ToggleGroupItem value="code" aria-controls="coding-source-pane"><Code2 size={15}/>Code</ToggleGroupItem><ToggleGroupItem value="results" aria-controls="coding-results-pane"><Terminal size={15}/>Results{running&&<Loader2 size={13} className="spin"/>}</ToggleGroupItem></ToggleGroup>
    <ResizablePanelGroup orientation="horizontal" className="coding-split-view">
      <ResizablePanel id="description" defaultSize="28%" minSize="20%" className="coding-description-panel"><section id="coding-description-pane" className="judge-problem-pane"><Tabs value={problemTab} onValueChange={setProblemTab} className="judge-problem-tabs"><TabsList className="judge-tabs" aria-label="Problem and approach"><TabsTrigger value="problem">Problem</TabsTrigger><TabsTrigger value="approach">Your approach</TabsTrigger></TabsList><TabsContent value="problem"><div className="compact-problem-intro"><h1>{task.number}. {task.title}</h1><span className={`coding-difficulty difficulty-${task.difficulty.toLowerCase()}`}>{task.difficulty}</span><span>{task.cases.length} test cases</span></div><p className="judge-statement">{task.statement}</p><section><h3>Input format</h3><p>{task.inputFormat}</p></section><section><h3>Output format</h3><p>{task.outputFormat}</p></section><section><h3>Constraints</h3><ul>{task.constraints.map(c => <li key={c}>{c}</li>)}</ul></section><section><h3>Sample cases</h3>{task.cases.filter(c => c.sample).map(c => <div className="problem-sample" key={c.id}><strong>{c.name}</strong><div><span>Input</span><pre>{c.input || '(empty line)'}</pre></div><div><span>Output</span><pre>{c.expected}</pre></div></div>)}</section><p className="judge-rules">{sql?'Write one SQLite SELECT query, optionally with WITH clauses. Row order, column order, and values must match.':'Use public class Main without a package declaration. Read standard input and print only the answer. Whitespace between output tokens is ignored; text is case-sensitive.'}</p><p className="small-note">Passing these {task.cases.length} provided tests checks output correctness. Explain the required data structure, algorithm, and complexity separately; tests do not inspect your implementation style.</p></TabsContent><TabsContent value="approach"><h3>Think, code, test, explain</h3><div className="judge-approach-steps">{steps.map((step, i) => <div className="task-row" key={step}><Checkbox id={`judge-step-${i}`} checked={session.steps.includes(step)} className="task-checkbox" disabled={!ready} onCheckedChange={v => onStep(step, v === true)}/><label htmlFor={`judge-step-${i}`}>{step}</label></div>)}</div><label htmlFor="judge-approach" className="field-label">Explain your approach before submitting</label><textarea ref={approachRef} id="judge-approach" disabled={!ready || running} rows={5} maxLength={4000} value={session.explanation} placeholder="My first idea is… It takes… I can improve it by… The key edge case is…" onChange={e => onExplanation(e.target.value)}/><div className="judge-complexity-fields"><label>Time complexity<input disabled={!ready || running} value={session.complexity?.time ?? ''} maxLength={120} placeholder="For example: O(n)" onChange={e => onComplexity('time', e.target.value)}/></label><label>Auxiliary space<input disabled={!ready || running} value={session.complexity?.space ?? ''} maxLength={120} placeholder="For example: O(1)" onChange={e => onComplexity('space', e.target.value)}/></label></div><div className="judge-hints">{hints > 0 && <div className="debug-advice"><Lightbulb size={18}/><p>{hints === 1 ? 'Trace the first sample by hand. Write down the values that change and the answer you expect.' : hints === 2 ? task.hint : `Translate your approach into small ${language} steps. Test the smallest valid input before trying larger cases.`}</p></div>}<button className="secondary-button" disabled={!ready || hints >= 3 || running} onClick={() => {setHints(h => h + 1); onHint();}}><Lightbulb size={16}/>{hints ? hints === 3 ? 'All hints shown' : 'Next hint' : 'Get one hint'}</button><button className="text-button" disabled={!ready} onClick={onCoach}>Ask your coach <Copy size={14}/></button></div></TabsContent></Tabs></section></ResizablePanel>
      <ResizableHandle withHandle className="coding-column-handle" aria-label="Resize the problem and coding panels"/>
        <ResizablePanel id="source" defaultSize="44%" minSize="32%" className="coding-source-panel"><section id="coding-source-pane" className="judge-editor-pane"><div className="java-file-bar"><span><Code2 size={17}/><strong>Code</strong><span className="coding-filename">{sql?'query.sql':'Main.java'}</span></span><div className="coding-editor-actions"><span>{running ? <><Loader2 className="spin" size={14}/>Running</> : language}</span>{expandControl('code')}</div></div><div className="java-editor"><CodeEditor value={code} language={sql?'sql':'java'} disabled={!ready || running} onChange={value => {edited.current = true; setCode(value); onCode(value);}} onRun={() => void run('samples')}/></div></section></ResizablePanel>
        <ResizableHandle withHandle className="coding-column-handle" aria-label="Resize the code editor and test cases"/>
        <ResizablePanel id="results" defaultSize="28%" minSize="22%" className="coding-results-panel"><section id="coding-results-pane"><Tabs value={editorTab} onValueChange={setEditorTab} className="judge-results"><div className="coding-results-heading"><TabsList className="judge-tabs" aria-label="Tests and custom input"><TabsTrigger value="tests"><CheckCheck size={16}/>Test cases <span>{task.cases.length}</span></TabsTrigger><TabsTrigger value="custom"><Terminal size={16}/>Custom input</TabsTrigger></TabsList>{expandControl('results')}</div><TabsContent value="tests">{(running||accepted||results.length>0||oldSummary)&&<div className={`judge-summary ${accepted ? 'judge-accepted' : ''}`} aria-live="polite">{running ? <><Loader2 className="spin" size={18}/><div><strong>Running test {runningCase} of {expectedCount}</strong><small>{sql?'Running your query on a fresh database for each case.':'Compilation and execution can take a few seconds per case.'}</small></div></> : accepted ? <><CheckCheck size={22}/><div><strong>Accepted · all {task.cases.length} tests passed</strong><small>Explain your final time and space complexity, then save your reflection.</small></div></> : results.length && runMode !== 'custom' ? <><AlertCircle size={20}/><div><strong>{cancelled ? 'Run stopped' : `${passed} / ${expectedCount} tests passed`}{stale ? ' · code changed' : ''}</strong><small>{stale ? 'These results belong to the previous code. Run again to check your changes.' : passed === expectedCount ? 'Samples passed. Submit all tests to check the edge cases.' : 'Select a case below to compare expected and actual output.'}</small></div></> : oldSummary ? <><CheckCheck size={20}/><div><strong>Last {oldSummary.mode === 'submit' ? 'submission' : 'sample run'}: {oldSummary.passed}/{oldSummary.total} passed</strong><small>{currentSummary ? 'Run again to inspect individual outputs.' : 'Your code has changed since that run.'}</small></div></> : <><Terminal size={20}/><div><strong>{task.cases.length} provided tests</strong><small>Start with the samples, then submit for boundary cases too.</small></div></>}</div>}{running && runMode !== 'custom' && <Progress value={results.length / expectedCount * 100} aria-label="Test execution progress"/>}<div className="judge-case-buttons" role="group" aria-label="Choose a test case">{task.cases.map(c => {const result = results.find(r => r.caseId === c.id); return <button key={c.id} className={`${activeCase === c.id ? 'case-active' : ''} ${result ? `case-${result.verdict}` : ''}`} aria-label={`${c.sample?'Sample':'Test'} ${c.id}: ${c.name}${result?` · ${verdictLabels[result.verdict]}`:''}`} title={c.name} aria-pressed={activeCase === c.id} onClick={() => setActiveCase(c.id)}>{runningCase === c.id ? <Loader2 size={14} className="spin"/> : result?.verdict === 'passed' ? <Check size={14}/> : result ? <X size={14}/> : null}<span>Case {c.id}</span></button>;})}</div>{activeCase !== 'custom' && showResult(selectedTest, selectedResult)}</TabsContent><TabsContent value="custom">{runMode === 'custom' && results.length > 0 && (stale || customInput !== inputSnapshot) && <p className="runner-message">This output belongs to the previous code or input. Run again to check your changes.</p>}<label className="field-label" htmlFor="custom-stdin">{sql?'Custom database setup (CREATE / INSERT)':'Standard input'}</label><textarea id="custom-stdin" value={customInput} rows={4} maxLength={4000} disabled={running} placeholder={sql?'Paste CREATE TABLE and INSERT statements for a custom database…':'Enter input in the format described in the problem…'} onChange={e => setCustomInput(e.target.value)}/><div className="custom-input-actions"><span>Custom runs show output and do not count as a submission.</span><button className="secondary-button" disabled={!ready || running || !code.trim()} onClick={() => void run('custom')}><Play size={14}/>Run input</button></div>{runMode === 'custom' && (results.length > 0 || running) && showResult({name: 'Custom run', input: inputSnapshot, expected: ''}, results[0], true)}</TabsContent></Tabs></section></ResizablePanel>
    </ResizablePanelGroup>
    <Dialog open={pendingRun !== null} onOpenChange={open => {if (!open) setPendingRun(null);}}>
      <DialogContent className="runner-consent-dialog">
        <DialogHeader><DialogTitle>Run Java with Paiza.IO?</DialogTitle><DialogDescription>Your code and test input will be sent to Paiza.IO to compile and run. Allow this while this exercise is open?</DialogDescription></DialogHeader>
        <DialogFooter><button type="button" className="secondary-button" onClick={() => setPendingRun(null)}>Cancel</button><button type="button" className="primary-button" onClick={() => {const mode = pendingRun; if (!mode) return; setPendingRun(null); setAllowExternalExecution(true); void run(mode, true);}}><Play size={16}/>Allow &amp; run</button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
