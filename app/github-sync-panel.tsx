'use client';

import {useStudyFetch} from './account-context';

import {useEffect,useState} from 'react';
import {CheckCheck,ChevronDown,ExternalLink,GitBranch,Loader2,RefreshCw} from 'lucide-react';
import {Collapsible,CollapsibleContent,CollapsibleTrigger} from '@/components/ui/collapsible';
import {Input} from '@/components/ui/input';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetTrigger} from '@/components/ui/sheet';
import {type GitHubConnection,type GitHubSave} from '@/lib/github-types';
import {sourceHash} from '@/lib/judge-types';
import {type PracticeTask} from '@/lib/coding-bank';
import {type Session} from '@/lib/study-data';

type Props={task:PracticeTask;session:Session;draftSaved:boolean;saving:boolean;save?:GitHubSave;compact?:boolean};
export function GitHubSyncPanel({task,session,draftSaved,saving,save,compact=false}:Props){
  const fetch = useStudyFetch();
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [connection,setConnection]=useState<GitHubConnection|null>(null),[loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false),[token,setToken]=useState(''),[busy,setBusy]=useState(false);
  const [repository,setRepository]=useState('');
  const [error,setError]=useState(''),[result,setResult]=useState<GitHubSave|undefined>(save),[hash,setHash]=useState('');
  useEffect(()=>{let active=true;void sourceHash(session.code).then(h=>{if(active)setHash(h);});return()=>{active=false;};},[session.code]);
  useEffect(()=>{if(save)setResult(save);},[save]);
  async function load(signal?:AbortSignal){
    setLoading(true);setError('');
    try{
      const response=await fetch(`/api/github?taskId=${encodeURIComponent(task.id)}`,{cache:'no-store',signal});
      const body=await response.json() as GitHubConnection&{error?:string};
      if(!response.ok)throw new Error(body.error||'Could not load GitHub.');
      if(!signal?.aborted){setConnection(body);setRepository(body.repository||body.suggestedRepository||'');setResult(body.save);setError(body.setupError??'');}
    }catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'Could not load GitHub.');}
    finally{if(!signal?.aborted)setLoading(false);}
  }
  useEffect(()=>{const abort=new AbortController();void load(abort.signal);return()=>abort.abort();},[task.id]);
  const accepted=!!hash&&session.judge?.sourceHash===hash&&session.judge.accepted&&session.judge.mode==='submit'&&session.judge.passed===task.cases.length&&session.judge.total===task.cases.length;
  const savedCurrent=!!connection?.connected&&result?.status==='saved'&&result.sourceHash===hash&&result.repository===connection.repository;
  const savingCurrent=!!connection?.connected&&saving&&accepted;
  async function connect(){
    if(busy||!token.trim()||!repository.trim())return;setBusy(true);setError('');
    try{
      const response=await fetch('/api/github',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token.trim(),repository:repository.trim()})});
      const body=await response.json() as GitHubConnection&{error?:string};
      if(!response.ok)throw new Error(body.error||'Could not connect GitHub.');
      setConnection(body);setToken('');setOpen(false);
      setResult(undefined);
    }catch(e){setError(e instanceof Error?e.message:'Could not connect GitHub.');}
    finally{setBusy(false);}
  }
  async function disconnect(){
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/github',{method:'DELETE',headers:{'Content-Type':'application/json'},body:'{}'});
      const body=await response.json() as GitHubConnection&{error?:string};
      if(!response.ok)throw new Error(body.error||'Could not disconnect GitHub.');
      setConnection(body);setToken('');setOpen(false);
    }catch(e){setError(e instanceof Error?e.message:'Could not disconnect GitHub.');}
    finally{setBusy(false);}
  }
  async function retry(){
    if(!accepted||!draftSaved||busy)return;setBusy(true);setError('');
    try{
      const response=await fetch('/api/github',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId:task.id})});
      const body=await response.json() as {save:GitHubSave;error?:string};
      if(!response.ok)throw new Error(body.error||'Could not save to GitHub.');
      setResult(body.save);
      if(body.save.status==='disconnected')void load();
    }catch(e){setError(e instanceof Error?e.message:'Could not save to GitHub.');}
    finally{setBusy(false);}
  }
  const panel=<Collapsible open={open} onOpenChange={value=>{setOpen(value);if(!value)setToken('');}} className="github-sync-panel">
    <div className="github-sync-header"><div className="github-sync-icon"><GitBranch size={22}/></div><div className="github-sync-copy"><strong>Save passing solutions to GitHub</strong>{connection?.repository?<a href={`https://github.com/${connection.repository}`} target="_blank" rel="noopener noreferrer">{connection.repository}<ExternalLink size={13}/></a>:<span className="github-connected-account">Choose your own repository</span>}</div><CollapsibleTrigger className="secondary-button" disabled={loading||busy}>{connection?.connected?'Manage connection':'Connect GitHub'}<ChevronDown size={15} className={open?'github-chevron-open':''}/></CollapsibleTrigger></div>
    <div className="github-sync-status" role="status" aria-live="polite">{loading?<><Loader2 size={16} className="spin"/>Loading GitHub connection…</>:connection?.connected?<><GitBranch size={16}/><span>Auto-save on · {connection.branch} · after all tests pass</span></>:<span>Connect once to automatically commit your accepted Java programs and SQL queries.</span>}</div>
    <CollapsibleContent className="github-connection-content">
      <p>Create a fine-grained GitHub token for a repository you own:</p>
      <ol><li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">GitHub token settings <ExternalLink size={13}/></a> and choose your account as the resource owner.</li><li>Under Repository access, choose <strong>Only select repositories → your study repository</strong>.</li><li>Set the repository permission <strong>Contents → Read and write</strong>, choose an expiration, and generate the token.</li></ol>
      <form onSubmit={event=>{event.preventDefault();void connect();}}><label htmlFor="github-repository">Repository (owner/name)</label><Input className="github-repository-input" id="github-repository" value={repository} maxLength={140} autoComplete="off" spellCheck={false} placeholder="your-username/Placement_path" disabled={busy||!connection?.configured} onChange={event=>setRepository(event.target.value)}/><label htmlFor="github-access-token">Fine-grained access token</label><Input id="github-access-token" type="password" value={token} maxLength={260} autoComplete="off" spellCheck={false} placeholder="github_pat_…" disabled={busy||!connection?.configured} onChange={event=>setToken(event.target.value)}/><p className="github-token-note">Paste your token here, not in chat. It is encrypted when saved and used only for this repository.</p><div className="github-connection-actions"><button type="submit" className="primary-button" disabled={busy||!token.trim()||!repository.trim()||!connection?.configured}>{busy?<Loader2 size={16} className="spin"/>:<GitBranch size={16}/>}Connect & enable auto-save</button>{connection?.connected&&<button type="button" className="text-button" disabled={busy||savingCurrent} onClick={()=>void disconnect()}>Disconnect</button>}</div></form>
      {!connection?.configured&&!loading&&<p className="github-inline-error">GitHub connection is temporarily unavailable. Your coding drafts still save here.</p>}
      <p className="github-token-note">Solutions go to <code>placement-path/{task.topicId}/problem-{String(task.number).padStart(2,'0')}/{task.language==='sql'?'query.sql':'Main.java'}</code>. A changed, accepted solution updates its file. Disconnecting stops future saves and keeps existing repository files.</p>
      <a className="github-help-link" href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target="_blank" rel="noopener noreferrer">GitHub’s token guide <ExternalLink size={13}/></a>
    </CollapsibleContent>
    {error&&<div className="github-inline-error" role="alert">{error}{!connection&&<button className="text-button" onClick={()=>void load()}><RefreshCw size={14}/>Retry connection check</button>}</div>}
    {savingCurrent?<div className="github-submission-result"><Loader2 size={17} className="spin"/>Saving your accepted solution…</div>:savedCurrent?<div className="github-submission-result github-saved"><CheckCheck size={18}/><span>Saved to GitHub</span><a href={result.fileUrl} target="_blank" rel="noopener noreferrer">View code <ExternalLink size={14}/></a>{result.commitUrl&&<a href={result.commitUrl} target="_blank" rel="noopener noreferrer">Commit <ExternalLink size={14}/></a>}</div>:connection?.connected&&<div className="github-submission-result"><span>{result?.sourceHash===hash&&(result.status==='error'||result.status==='busy')?result.message:accepted?'All tests passed. Your solution is ready to save.':'Use Submit all tests. When every case passes, your current code will be committed automatically.'}</span>{accepted&&<button className="secondary-button" disabled={!draftSaved||busy} onClick={()=>void retry()}>{busy?<Loader2 size={15} className="spin"/>:<RefreshCw size={15}/>}Save to GitHub</button>}</div>}
  </Collapsible>;
  const needsAttention=!!error||result?.sourceHash===hash&&(result.status==='error'||result.status==='busy');
  const label=loading?'GitHub…':savingCurrent?'Saving to GitHub':needsAttention?'GitHub: retry':savedCurrent?'Saved to GitHub':connection?.connected?'GitHub on':'Connect GitHub';
  return compact?<Sheet open={drawerOpen} onOpenChange={value=>{setDrawerOpen(value);if(value&&!connection?.connected)setOpen(true);if(!value)setToken('');}}><SheetTrigger className={`coding-github-button ${needsAttention?'github-attention':''} ${savedCurrent?'github-confirmed':''}`} aria-label={`${label}. Open GitHub connection and save details.`} title={label}>{loading||savingCurrent?<Loader2 size={16} className="spin"/>:savedCurrent?<CheckCheck size={16}/>:<GitBranch size={16}/>}<span>{label}</span></SheetTrigger><SheetContent className="coding-github-drawer"><SheetHeader><SheetTitle>GitHub saves</SheetTitle><SheetDescription>Save accepted solutions to your own GitHub repository.</SheetDescription></SheetHeader><div className="coding-github-drawer-body">{panel}</div></SheetContent></Sheet>:panel;
}
