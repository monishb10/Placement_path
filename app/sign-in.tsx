import {Braces, Code2, Flame, GitBranch, ShieldCheck} from 'lucide-react';

const messages: Record<string,string> = {
  denied: 'GitHub sign-in was cancelled or declined. You can try again.',
  expired: 'Your sign-in link expired. Please start again.',
  unavailable: 'Sign-in is temporarily unavailable. Please try again shortly.',
  setup: 'GitHub sign-in needs to be configured with OAuth credentials by the site administrator.',
};

export function SignIn({error}: {error?: string}) {
  return <main className="signin-page"><section className="signin-card">
    <div className="signin-brand"><span className="wordmark-icon"><Braces size={25}/></span><strong>placement<span>path</span>.</strong></div>
    <span className="signin-eyebrow">YOUR DAILY STUDY WORKSPACE</span>
    <h1>Make today count.</h1><p>Sign in with your GitHub account to continue your Java, DSA and placement preparation.</p>
    <div className="signin-details">
      <span><Flame size={19}/>Your streak and study history</span>
      <span><Code2 size={19}/>Your code, test results and revisions</span>
      <span><ShieldCheck size={19}/>Auto-contribute accepted code to your repository</span>
    </div>
    {error && messages[error] && <p className="signin-error" role="alert">{messages[error]}</p>}
    <a className="signin-action" href="/api/auth/github" target="_top">
      <GitBranch size={20}/>Continue with GitHub
    </a>
    <p className="signin-footnote">Your study progress, streaks, and completed code solutions sync with your GitHub account.</p>
  </section></main>;
}

