import {studyDb} from '@/db/study-store';
import {authCookie, githubAuthSettings, oauthCookieName, readCookie, sessionCookieName} from './auth-settings';
import {githubIdentity} from './github-identity';
import {githubVaultSecret} from './github-connection-store';
import {encryptGitHubToken} from './github-vault';
import {inspectRepository} from './github-client';
import type {StudyUser} from './account-types';

const encode = (bytes: Uint8Array) => btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const random = () => encode(crypto.getRandomValues(new Uint8Array(32)));
export const authHash = async (value: string) => encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
const maxAge = 7 * 24 * 60 * 60;
const opaque = /^[A-Za-z0-9_-]{43}$/;
function redirect(location: string, cookies: string[] = []) {
  const headers = new Headers({Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'});
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(null, {status: 303, headers});
}

export async function startGitHubSignIn(request: Request) {
  const url = new URL(request.url);
  const usernameParam = url.searchParams.get('username')?.trim() || url.searchParams.get('login')?.trim();
  const cleanUsername = usernameParam ? usernameParam.replace(/^@+/, '') : '';
  const settings = githubAuthSettings();
  if (!settings) {
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (loopback || process.env.NODE_ENV !== 'production') {
      const login = (cleanUsername && /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleanUsername))
        ? cleanUsername
        : (cleanUsername || 'monishb10');
      const userId = `github:${login}`;
      const session = random(), hash = await authHash(session);
      const now = Date.now();
      try {
        const db = studyDb();
        await db.batch([
          db.prepare('INSERT INTO github_users (user_id,github_id,login,display_name,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET login=excluded.login,display_name=excluded.display_name,updated_at=excluded.updated_at').bind(userId, login, login, login, now, now),
          db.prepare('INSERT INTO auth_sessions (session_hash,user_id,expires_at) VALUES (?,?,?)').bind(hash, userId, now + maxAge * 1000),
        ]);
        return redirect('/', [authCookie(sessionCookieName(false), session, maxAge, false)]);
      } catch {
        return redirect('/login?error=unavailable');
      }
    }
    return redirect('/login?error=setup');
  }
  if (new URL(request.url).origin !== settings.origin) return new Response('Invalid sign-in origin.', {status: 403});
  if (request.headers.has('next-router-prefetch') || /prefetch/i.test(request.headers.get('purpose') ?? request.headers.get('sec-purpose') ?? '')) return new Response(null, {status: 204});
  try {
    const state = random(), verifier = random(), challenge = await authHash(verifier), now = Date.now(), db = studyDb();
    const previous = readCookie(request, oauthCookieName(settings.secure)).split('.')[0];
    await db.batch([
      db.prepare('DELETE FROM oauth_states WHERE expires_at<=? OR state_hash=?').bind(now, opaque.test(previous) ? await authHash(previous) : ''),
      db.prepare('INSERT INTO oauth_states (state_hash,challenge,expires_at) VALUES (?,?,?)').bind(await authHash(state), challenge, now + 600000),
    ]);
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    const params: Record<string, string> = {
      client_id: settings.clientId,
      redirect_uri: settings.callback,
      scope: 'read:user,repo',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    };
    if (cleanUsername) {
      params.login = cleanUsername;
    }
    authorizeUrl.search = new URLSearchParams(params).toString();
    return redirect(authorizeUrl.href, [authCookie(oauthCookieName(settings.secure), `${state}.${verifier}`, 600, settings.secure)]);
  } catch {return redirect('/login?error=unavailable');}
}

export async function finishGitHubSignIn(request: Request, fetcher: typeof fetch = fetch) {
  const settings = githubAuthSettings();
  if (!settings) return redirect('/login?error=setup');
  if (new URL(request.url).origin !== settings.origin) return new Response('Invalid sign-in origin.', {status: 403});
  const clear = authCookie(oauthCookieName(settings.secure), '', 0, settings.secure);
  const fail = (reason: string) => redirect('/login?error=' + reason, [clear]);
  const query = new URL(request.url).searchParams;
  const state = query.get('state') ?? '', code = query.get('code') ?? '';
  const [cookieState, verifier] = readCookie(request, oauthCookieName(settings.secure)).split('.');
  if (!opaque.test(state) || state !== cookieState || !opaque.test(verifier ?? '')) return fail('expired');
  try {
    const db = studyDb(), now = Date.now();
    const consumed = await db.prepare('DELETE FROM oauth_states WHERE state_hash=? AND challenge=? AND expires_at>? RETURNING state_hash').bind(await authHash(state), await authHash(verifier), now).first();
    if (!consumed) return fail('expired');
    if (query.has('error')) return fail('denied');
    if (!code || code.length > 500) return fail('expired');
    const response = await fetcher('https://github.com/login/oauth/access_token', {
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(10000),
      headers: {Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Placement-Path'},
      body: new URLSearchParams({client_id: settings.clientId, client_secret: settings.clientSecret, code, redirect_uri: settings.callback, code_verifier: verifier}).toString(),
    });
    if (!response.ok) return fail('unavailable');
    const result = await response.json() as {access_token?: string; token_type?: string; error?: string};
    if (result.error || !result.access_token || result.access_token.length > 1024 || result.token_type?.toLowerCase() !== 'bearer') return fail('denied');
    const identity = await githubIdentity(result.access_token, fetcher);
    const userId = `github:${identity.id}`, session = random(), hash = await authHash(session);
    const oldSession = readCookie(request, sessionCookieName(settings.secure));
    await db.batch([
      db.prepare('INSERT INTO github_users (user_id,github_id,login,display_name,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET login=excluded.login,display_name=excluded.display_name,updated_at=excluded.updated_at').bind(userId, identity.id, identity.login, identity.name, now, now),
      db.prepare('DELETE FROM auth_sessions WHERE expires_at<=? OR session_hash=?').bind(now, opaque.test(oldSession) ? await authHash(oldSession) : ''),
      db.prepare('INSERT INTO auth_sessions (session_hash,user_id,expires_at) VALUES (?,?,?)').bind(hash, userId, now + maxAge * 1000),
    ]);
    const vaultSecret = githubVaultSecret();
    if (vaultSecret) {
      const repo = `${identity.login}/Placement_path`;
      try {
        const branch = await inspectRepository(result.access_token, fetcher, repo).catch(() => 'main');
        const encrypted = await encryptGitHubToken(result.access_token, userId, vaultSecret, repo);
        await db.prepare('INSERT INTO github_connections (user_id,encrypted_token,branch,updated_at,repository,github_id,github_login) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET encrypted_token=excluded.encrypted_token,branch=excluded.branch,updated_at=excluded.updated_at,repository=excluded.repository,github_id=excluded.github_id,github_login=excluded.github_login WHERE lock_until<?').bind(userId, encrypted, branch, new Date().toISOString(), repo, identity.id, identity.login, Date.now()).run();
      } catch {}
    }
    return redirect(settings.origin + '/', [clear, authCookie(sessionCookieName(settings.secure), session, maxAge, settings.secure)]);
  } catch {return fail('unavailable');}
}

export async function userForGitHubSession(value: string): Promise<StudyUser | null> {
  if (!opaque.test(value)) return null;
  const row = await studyDb().prepare('SELECT u.user_id AS userId,u.github_id AS githubId,u.login AS githubLogin,u.display_name AS displayName FROM auth_sessions s JOIN github_users u ON u.user_id=s.user_id WHERE s.session_hash=? AND s.expires_at>?').bind(await authHash(value), Date.now()).first<Omit<StudyUser,'provider'>>();
  return row ? {...row, provider: 'github'} : null;
}
export async function signOutGitHub(request: Request) {
  const settings = githubAuthSettings();
  if (settings && (request.headers.get('origin') !== settings.origin || request.headers.get('sec-fetch-site') === 'cross-site')) {
    return new Response('Request not allowed.', {status: 403});
  }
  const secure = settings?.secure ?? false;
  const origin = settings?.origin ?? new URL(request.url).origin;
  try {
    const session = readCookie(request, sessionCookieName(secure));
    if (opaque.test(session)) await studyDb().prepare('DELETE FROM auth_sessions WHERE session_hash=?').bind(await authHash(session)).run();
    return redirect(origin + '/login', [authCookie(sessionCookieName(secure), '', 0, secure)]);
  } catch {return new Response('Sign out is temporarily unavailable. Please retry.', {status: 503});}
}
