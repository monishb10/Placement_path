import StudyWorkspace from './study-workspace';
import {getStudyUser} from './auth';
import {AccountProvider} from './account-context';
import {SignIn} from './sign-in';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const user = await getStudyUser();
  return user ? <AccountProvider user={user}><StudyWorkspace/></AccountProvider> : <SignIn/>;
}
