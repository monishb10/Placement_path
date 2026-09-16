# Share Placement Path with friends

This version supports individual GitHub accounts. Each student gets separate
study progress, streaks, code drafts, reflections and GitHub settings. Students
can sign out and return to the same account later.

The downloaded files contain the implementation. GitHub sign-in becomes available
after the host configures an OAuth application and a database. No shared password
or personal GitHub token is included.

## Choose how your friends use it

**One shared website:** you configure and host it once, then give your friends
the website URL. They each sign in with their own GitHub account. This is the
usual way to share a study platform.

**Separate local copies:** each friend installs the ZIP, creates their own local
database and configures their own GitHub OAuth application. Local study records
are separate from records on a hosted website.

Your existing private Sites publication continues using ChatGPT sign-in and its
existing access policy. GitHub-only sign-in in this ZIP is intended for an
independently hosted deployment. The existing private link has not been opened
to the public. The two identity systems have separate user IDs; changing providers
does not automatically transfer existing progress between accounts.

## 1. Register a GitHub OAuth application

Open [GitHub OAuth application settings](https://github.com/settings/developers)
and choose **New OAuth App**. Use a name such as `Placement Path Study`.

For a shared website, set:

- Homepage URL: `https://YOUR-WEBSITE-DOMAIN`
- Authorization callback URL: `https://YOUR-WEBSITE-DOMAIN/api/auth/github/callback`

For local development, use:

- Homepage URL: `http://localhost:5173`
- Authorization callback URL: `http://localhost:5173/api/auth/github/callback`

Use a separate OAuth application for local development. Keep the callback URL
exact, including the scheme, port and path. Copy the Client ID and generate a
Client Secret. Store the secret only in your server configuration.

The app requests `read:user` for identity. Repository write permissions are
configured separately by each student. The sign-in token is not retained by
Placement Path after GitHub confirms the user's identity.

See GitHub's official [registration guide](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
and [authorization flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

## 2. Try it locally

Install Node.js 22.13 or later. Extract the ZIP, open its `placement-path` folder
in VS Code and use the terminal in that folder.

```sh
npm run install:ci
npm run build
```

Copy `.dev.vars.example` to `.dev.vars` and fill in the Client ID and Client Secret.
The example sets `PLACEMENT_AUTH_MODE=github` and the local website origin.
Keep the actual `.dev.vars` file private.

On a **fresh local database**, apply all five SQL files once, in order:

```sh
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_tearful_trish_tilby.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_nice_eternity.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_goofy_starhawk.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_calm_doorman.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0004_glossy_sebastian_shaw.sql
npm run dev
```

If you already applied the first four migrations from the previous ZIP, apply
only `0004_glossy_sebastian_shaw.sql`. It adds account tables and repository
settings while retaining existing records. Do not rerun applied SQL files.

Open `http://localhost:5173` and select **Continue with GitHub**. Each fresh
GitHub account starts with empty progress.

## 3. Host one website for your friends

The project already targets Cloudflare Workers with a D1 database. The included
helper prepares a standalone configuration from the build output; it does not
use the original private Site's database, owner credentials or access policy.

Sign in to your own Cloudflare account and create a new database:

```sh
npx wrangler login
npx wrangler d1 create placement-path-friends
```

Copy the returned database ID. Use your intended HTTPS website address below.
For a Workers subdomain, the address is normally
`https://placement-path-friends.YOUR-SUBDOMAIN.workers.dev`; verify YOUR-SUBDOMAIN
in your Cloudflare account. A custom domain can be used instead.

```sh
npm run build
node scripts/configure-friends-host.mjs YOUR-DATABASE-ID https://YOUR-WEBSITE-DOMAIN
npx wrangler d1 migrations apply DB --remote --config .friends-hosting/wrangler.json
npx wrangler deploy --config .friends-hosting/wrangler.json
```

Now set the OAuth values through Wrangler's secret prompts:

```sh
npx wrangler secret put PLACEMENT_GITHUB_CLIENT_ID --config .friends-hosting/wrangler.json
npx wrangler secret put PLACEMENT_GITHUB_CLIENT_SECRET --config .friends-hosting/wrangler.json
```

Ensure the OAuth application homepage/callback and `PLACEMENT_PUBLIC_ORIGIN`
all use the exact deployed origin. The sign-in screen remains disabled until
the required OAuth settings are configured. Future builds should be followed
by the helper again, then migration application and deployment.

Official references: [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
and [server secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

### Optional: enable repository saves

Generate a new encryption key on the host's computer:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
npx wrangler secret put PLACEMENT_GITHUB_VAULT_KEY --config .friends-hosting/wrangler.json
```

Paste that generated value into the secret prompt. For local development, put
the key in `.dev.vars` instead. Keep this key stable: changing it requires users
to reconnect their repository tokens. GitHub sign-in and study tracking work
without repository saving.

Do not copy the original owner's `PLACEMENT_GITHUB_SETUP_TOKEN` or
`PLACEMENT_GITHUB_SETUP_USER_ID` into a shared deployment. They are legacy,
owner-specific setup options and are not needed by your friends.

## What each friend does

1. Open your hosted URL and choose **Continue with GitHub**.
2. Authorize the app and start their daily study routine.
3. To save accepted code, create a repository under their own GitHub account.
4. In **Coding → Connect GitHub**, enter `their-username/their-repository`.
5. Create a fine-grained token for only that repository with **Contents: Read
   and write**, and enter it in the website's password field.
6. Explain their approach and submit all provided tests. Accepted code is saved
   to their connected repository. Sample runs and failed submissions do not
   trigger an accepted-solution save.

The token must belong to the same GitHub account used to sign in. Each student
can change or disconnect their repository. Changing repositories resets the
current destination's save status; existing files in the old repository remain.

Java execution still requires the student's explicit Paiza.IO consent and
network access. Autocomplete provides short Java suggestions rather than
exercise solutions.

## Verification and limits

```sh
node node_modules/typescript/bin/tsc --noEmit
node scripts/verify-multiuser-auth.mjs
node scripts/verify-github-streak.mjs
node scripts/verify-code-suggestions.mjs
```

The account test uses the Worker runtime and a local D1 database with simulated
GitHub responses. It covers PKCE, state expiry/replay, sign-out, separate student
records, stale browser tabs, token/account matching, repository changes and
commit destinations. Completing a real OAuth round trip requires your own
registered OAuth application and configured host.
