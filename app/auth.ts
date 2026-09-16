import {cookies} from 'next/headers';
import {githubAuthSettings, sessionCookieName} from '@/lib/auth-settings';
import {userForGitHubSession} from '@/lib/github-auth';
import type {StudyUser} from '@/lib/account-types';
import {studyDb} from '@/db/study-store';

export const defaultUser: StudyUser = {
  userId: 'github:monishb10',
  displayName: 'monishb10',
  githubLogin: 'monishb10',
  githubId: 'monishb10',
  provider: 'github',
};

export async function getStudyUser(request?: Request): Promise<StudyUser | null> {
  const settings = githubAuthSettings();
  const jar = await cookies();
  const sessionName = settings ? sessionCookieName(settings.secure) : 'placement_session';
  const cookieValue = jar.get(sessionName)?.value ?? jar.get('placement_session')?.value ?? jar.get('__Host-placement_session')?.value ?? '';
  
  let user = await userForGitHubSession(cookieValue);

  // If no session exists and running in local development mode, automatically default to the student user
  if (!user && !settings) {
    user = defaultUser;
    try {
      const now = Date.now();
      const db = studyDb();
      await db.prepare('INSERT INTO github_users (user_id,github_id,login,display_name,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING').bind(defaultUser.userId, defaultUser.githubId, defaultUser.githubLogin, defaultUser.displayName, now, now).run();
    } catch {}
  }

  // An old browser tab must not save one student's open draft into a newly
  // signed-in student's account after a sign-out/sign-in in another tab.
  if (request && user) {
    const expected = request.headers.get('X-Placement-Account');
    if (expected && expected !== user.userId) return null;
    if (!['GET','HEAD'].includes(request.method) && expected !== user.userId) return null;
  }
  return user;
}
