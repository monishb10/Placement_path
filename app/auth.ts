import {cookies} from 'next/headers';
import {getChatGPTUser} from './chatgpt-auth';
import {authMode, githubAuthSettings, sessionCookieName} from '@/lib/auth-settings';
import {userForGitHubSession} from '@/lib/github-auth';
import type {StudyUser} from '@/lib/account-types';

export async function getStudyUser(request?: Request): Promise<StudyUser | null> {
  let user: StudyUser | null;
  if (authMode() === 'github') {
    const settings = githubAuthSettings();
    if (!settings) return null;
    const jar = await cookies();
    user = await userForGitHubSession(jar.get(sessionCookieName(settings.secure))?.value ?? '');
  } else {
    const account = await getChatGPTUser();
    user = account ? {userId: account.userId, displayName: account.displayName, provider: 'chatgpt'} : null;
  }
  // An old browser tab must not save one student's open draft into a newly
  // signed-in student's account after a sign-out/sign-in in another tab.
  if (request && user) {
    const expected = request.headers.get('X-Placement-Account');
    if (expected && expected !== user.userId) return null;
    if (authMode() === 'github' && !['GET','HEAD'].includes(request.method) && expected !== user.userId) return null;
  }
  return user;
}
