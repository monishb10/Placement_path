import StudyWorkspace from './study-workspace';
import {getStudyUser, defaultUser} from './auth';
import {AccountProvider} from './account-context';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = (await getStudyUser()) ?? defaultUser;
  return (
    <AccountProvider user={user}>
      <StudyWorkspace/>
    </AccountProvider>
  );
}
