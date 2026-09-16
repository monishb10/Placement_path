'use client';
import {useState, useEffect} from 'react';
import {Braces, Code2, Flame, GitBranch, ShieldCheck, User, ArrowRight, Plus} from 'lucide-react';

const messages: Record<string,string> = {
  denied: 'GitHub sign-in was cancelled or declined. You can try again.',
  expired: 'Your sign-in link expired. Please start again.',
  unavailable: 'Sign-in is temporarily unavailable. Please try again shortly.',
  setup: 'GitHub sign-in needs to be configured with OAuth credentials by the site administrator.',
};

export function SignIn({error}: {error?: string}) {
  const [selectedAccount, setSelectedAccount] = useState('monishb10');
  const [customInput, setCustomInput] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [accounts, setAccounts] = useState<string[]>(['monishb10']);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('placement_github_accounts');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) {
          setAccounts(Array.from(new Set([...list, 'monishb10'])));
          setSelectedAccount(list[0]);
        }
      }
    } catch {}
  }, []);

  const activeAccount = (isCustom ? customInput.trim() : selectedAccount).replace(/^@+/, '');

  const handleSubmit = () => {
    if (activeAccount) {
      try {
        const updated = Array.from(new Set([activeAccount, ...accounts])).slice(0, 5);
        localStorage.setItem('placement_github_accounts', JSON.stringify(updated));
      } catch {}
    }
  };

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
    <form method="get" action="/api/auth/github" onSubmit={handleSubmit} className="signin-account-form">
      <div className="account-selector-card">
        <div className="account-selector-header">
          <label htmlFor={isCustom ? 'custom-github-input' : undefined} className="account-selector-title">
            Which GitHub account do you want to use?
          </label>
        </div>

        <div className="account-chips-grid">
          {accounts.map((acc) => {
            const isSelected = !isCustom && selectedAccount === acc;
            return (
              <button
                type="button"
                key={acc}
                className={`account-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedAccount(acc);
                  setIsCustom(false);
                }}
                aria-pressed={isSelected}
              >
                <User size={15}/>
                <span>@{acc}</span>
                {isSelected && <span className="account-chip-badge">Selected</span>}
              </button>
            );
          })}

          <button
            type="button"
            className={`account-chip ${isCustom ? 'selected' : ''}`}
            onClick={() => setIsCustom(true)}
            aria-pressed={isCustom}
          >
            <Plus size={15}/>
            <span>Other account</span>
          </button>
        </div>

        {isCustom && (
          <div className="signin-input-wrapper">
            <span className="signin-input-prefix">@</span>
            <input
              id="custom-github-input"
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.trim())}
              placeholder="Enter GitHub username (e.g. monishb10)"
              autoFocus
              required
              maxLength={39}
              className="signin-username-input"
            />
          </div>
        )}

        <input type="hidden" name="username" value={activeAccount} />
      </div>

      <button
        type="submit"
        className="signin-action"
        disabled={!activeAccount}
      >
        <GitBranch size={20}/>
        <span>Continue as @{activeAccount || 'GitHub account'}</span>
        <ArrowRight size={17} style={{marginLeft: 'auto'}}/>
      </button>
    </form>
    <p className="signin-footnote">Your study progress, streaks, and completed code solutions sync with your chosen GitHub account.</p>
  </section></main>;
}

