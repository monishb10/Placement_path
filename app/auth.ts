import {cookies} from 'next/headers';
import {githubAuthSettings, sessionCookieName} from '@/lib/auth-settings';
import {userForGitHubSession} from '@/lib/github-auth';
import type {StudyUser} from '@/lib/account-types';

export async function getStudyUser(request?: Request): Promise<StudyUser | null> {
  const settings = githubAuthSettings();
  const jar = await cookies();
  const sessionName = settings ? sessionCookieName(settings.secure) : 'placement_session';
  const cookieValue = jar.get(sessionName)?.value ?? jar.get('placement_session')?.value ?? jar.get('__Host-placement_session')?.value ?? '';
  
  let user = await userForGitHubSession(cookieValue);

  // An old browser tab must not save one student's open draft into a newly
  // signed-in student's account after a sign-out/sign-in in another tab.
  if (request && user) {
    const expected = request.headers.get('X-Placement-Account');
    if (expected && expected !== user.userId) return null;
    if (!['GET','HEAD'].includes(request.method) && expected !== user.userId) return null;
  }
  return user;
}
