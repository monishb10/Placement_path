export type GitHubIdentity = {id: string; login: string; name: string};
export async function githubIdentity(token: string, fetcher: typeof fetch = fetch): Promise<GitHubIdentity> {
  const response = await fetcher('https://api.github.com/user', {
    redirect: 'manual', signal: AbortSignal.timeout(10000),
    headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Placement-Path', 'X-GitHub-Api-Version': '2026-03-10'},
  });
  if (!response.ok) throw new Error('GitHub could not verify this account. Sign in again or check your token.');
  const user = await response.json() as {id?: number; login?: string; name?: string; type?: string};
  if (!Number.isSafeInteger(user.id) || user.id! <= 0 || typeof user.login !== 'string' || !/^[a-z\d][a-z\d-]{0,38}$/i.test(user.login) || user.type !== 'User') throw new Error('GitHub returned an invalid user profile.');
  return {id: String(user.id), login: user.login, name: typeof user.name === 'string' && user.name.trim() ? user.name.trim().slice(0,100) : user.login};
}
