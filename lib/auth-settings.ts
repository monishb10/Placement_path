import {env} from 'cloudflare:workers';

export function authMode(): 'github' {
  return 'github';
}
export function githubAuthSettings() {
  const clientId = env.PLACEMENT_GITHUB_CLIENT_ID?.trim();
  const clientSecret = env.PLACEMENT_GITHUB_CLIENT_SECRET?.trim();
  const configuredOrigin = env.PLACEMENT_PUBLIC_ORIGIN?.trim();
  if (!clientId || !clientSecret || !configuredOrigin) return null;
  try {
    const url = new URL(configuredOrigin);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
        (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))) return null;
    return {clientId, clientSecret, origin: url.origin, secure: url.protocol === 'https:', callback: url.origin + '/api/auth/github/callback'};
  } catch {return null;}
}
export const sessionCookieName = (secure: boolean) => secure ? '__Host-placement_session' : 'placement_session';
export const oauthCookieName = (secure: boolean) => secure ? '__Host-placement_oauth' : 'placement_oauth';
export function authCookie(name: string, value: string, maxAge: number, secure: boolean) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
export function readCookie(request: Request, name: string) {
  const matches = (request.headers.get('cookie') ?? '').split(';').map(v => v.trim()).filter(v => v.startsWith(name + '='));
  return matches.length === 1 ? matches[0].slice(name.length + 1) : '';
}
