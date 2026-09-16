import {redirect} from 'next/navigation';
import {getStudyUser} from '@/app/auth';
import {SignIn} from '@/app/sign-in';
export const dynamic = 'force-dynamic';
export default async function Login({searchParams}: {searchParams: Promise<{error?: string}>}) {
  if (await getStudyUser()) redirect('/');
  return <SignIn error={(await searchParams).error}/>;
}
