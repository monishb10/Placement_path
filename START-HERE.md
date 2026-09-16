# Placement Path — full source code

This ZIP includes the placement dashboard, daily study routine, streak tracking,
Java/SQL coding exercises, code suggestions, tests, GeeksforGeeks links and
individual GitHub accounts.

## Share with friends

Start with `docs/GITHUB-SIGNIN-SETUP.md`.

Host one shared website, configure a GitHub OAuth application once, and share
that website URL with your friends. Each friend can then sign in with their
own GitHub account and keep separate study progress, streaks and code drafts.
They can optionally connect their own repository to save accepted solutions.

GitHub sign-in is implemented but requires your OAuth Client ID, Client Secret,
website address and database configuration before it can be used. Credentials
are not included in this ZIP. The setup guide covers both local use and a shared
Cloudflare deployment, including database migrations.

The existing private ChatGPT Site continues using ChatGPT sign-in and its
current access policy. This ZIP's GitHub-only sign-in is for an independently
hosted copy. Existing ChatGPT progress is not automatically transferred to a
GitHub account.

## Open the project

Extract the ZIP and open the `placement-path` folder in VS Code.
Read `README.md` for the project structure, then follow the GitHub setup guide
for installation and hosting. Use Node.js 22.13 or later.

- `.dev.vars.example`: local GitHub configuration template; fill your own values.
- `docs/GITHUB-SIGNIN-SETUP.md`: shared website and local setup instructions.
- `scripts/configure-friends-host.mjs`: standalone Cloudflare configuration helper.
- `drizzle/`: database migrations. Follow the guide for fresh vs existing databases.

The source archive excludes installed dependencies, generated build files,
personal database records, actual environment secrets and Git history.

## Verification

TypeScript and the production build passed. Worker/database tests cover separate
accounts, login state and expiry, sign-out, returning users, stale browser tabs,
repository ownership and accepted-code destinations. GitHub responses were
simulated; a live OAuth round trip requires your configured application.

Source revision: 9c1ab207389b3c289b6260e4ab5f775f1f646510
