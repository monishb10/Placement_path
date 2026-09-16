import {Braces, Code2, Flame, GitBranch, LockKeyhole} from 'lucide-react';
import {authMode, githubAuthSettings} from '@/lib/auth-settings';
import {chatGPTSignInPath} from './chatgpt-auth';

const messages: Record<string,string> = {
  denied: 'GitHub sign-in was cancelled or declined. You can try again.',
  expired: 'Your sign-in link expired. Please start again.',
  unavailable: 'Sign-in is temporarily unavailable. Please try again shortly.',
  setup: 'GitHub sign-in needs to be configured by the person hosting this website.',
};
export function SignIn({error}: {error?: string}) {
  const github = authMode() === 'github', configured = !github || !!githubAuthSettings();
  return <main className="signin-page"><section className="signin-card">
    <div className="signin-brand"><span className="wordmark-icon"><Braces size={25}/></span><strong>placement<span>path</span>.</strong></div>
    <span className="signin-eyebrow">YOUR DAILY STUDY WORKSPACE</span>
    <h1>Make today count.</h1><p>Sign in to continue your Java, DSA and placement preparation.</p>
    <div className="signin-details"><span><Flame size={19}/>Your streak and study history</span><span><Code2 size={19}/>Your code, test results and revisions</span><span><LockKeyhole size={19}/>Progress saved to your own account</span></div>
    {(error && messages[error] || !configured) && <p className="signin-error" role="alert">{error && messages[error] || messages.setup}</p>}
    {configured ? <a className="signin-action" href={github ? '/api/auth/github' : chatGPTSignInPath('/')} target="_top">{github ? <GitBranch size={20}/> : <LockKeyhole size={20}/>}Continue with {github ? 'GitHub' : 'ChatGPT'}</a> : <button className="signin-action" disabled><GitBranch size={20}/>GitHub sign-in awaiting setup</button>}
    <p className="signin-footnote">{github ? 'GitHub confirms your identity. You can connect a repository separately when you want to save accepted solutions.' : 'Your study progress stays separate from other learners.'}</p>
  </section></main>;
}
