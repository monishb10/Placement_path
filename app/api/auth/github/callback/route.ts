import {finishGitHubSignIn} from '@/lib/github-auth';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => finishGitHubSignIn(request);
