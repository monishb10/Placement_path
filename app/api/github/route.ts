import {getStudyUser} from '@/app/auth';
import {studyDb} from '@/db/study-store';
import {practiceById} from '@/lib/coding-bank';
import {githubConnection,githubVaultSecret,syncAcceptedSolution} from '@/lib/github-sync';
import {encryptGitHubToken} from '@/lib/github-vault';
import {inspectRepository,GitHubError,normalizeRepository} from '@/lib/github-client';
import {githubIdentity} from '@/lib/github-identity';

export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const knownTask=(id:unknown)=>typeof id==='string'&&Object.hasOwn(practiceById,id)?practiceById[id]:undefined;
export async function GET(request:Request){
  const user=await getStudyUser(request);if(!user)return json({error:'Sign in to manage GitHub.'},401);
  const id=new URL(request.url).searchParams.get('taskId');if(id&&!knownTask(id))return json({error:'Unknown coding problem.'},400);
  try{const connection=await githubConnection(user.userId,id??undefined);return json({...connection,suggestedRepository:connection.repository||(user.githubLogin?`${user.githubLogin}/Placement_path`:'monishb10/Placement_path')});}catch(error){
    if(error instanceof GitHubError)return json({configured:!!githubVaultSecret(),connected:false,repository:'',setupError:error.message});
    return json({error:'Could not load your GitHub connection. Please retry.'},503);
  }
}
async function mutate(request:Request,operation:'connect'|'save'|'disconnect'){
  const user=await getStudyUser(request);if(!user)return json({error:'Sign in to manage GitHub.'},401);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Request not allowed.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Expected JSON.'},415);
  try{
    const raw=await request.text();if(raw.length>1200)return json({error:'Request is too large.'},413);
    let body:Record<string,unknown>;try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();}catch{return json({error:'Invalid request.'},400);}
    const db=studyDb();
    if(operation==='disconnect'){
      const result=await db.prepare("INSERT INTO github_connections (user_id,encrypted_token,branch,updated_at,repository) VALUES (?,'','',?,'') ON CONFLICT(user_id) DO UPDATE SET encrypted_token='',branch='',updated_at=excluded.updated_at WHERE lock_until<?").bind(user.userId,new Date().toISOString(),Date.now()).run();
      if(result.meta.changes!==1)return json({error:'A GitHub save is still finishing. Try disconnecting again shortly.'},409);
      return json(await githubConnection(user.userId));
    }
    if(operation==='connect'){
      const token=typeof body.token==='string'?body.token.trim():'';
      if(!/^github_pat_[A-Za-z0-9_]{20,240}$/.test(token))return json({error:'Enter a fine-grained GitHub personal access token for your repository.'},400);
      const secret=githubVaultSecret();if(!secret)return json({error:'GitHub connection is not configured yet.'},503);
      // The repository is chosen by this student and verified against the token.
      // A legacy open tab may reconnect only its existing repository.
      const current=typeof body.repository==='string'?null:await githubConnection(user.userId);
      const repository=normalizeRepository(typeof body.repository==='string'?body.repository:current?.repository??'');
      let identity;
      try{identity=await githubIdentity(token);}catch{return json({error:'Could not verify your GitHub token. Check its expiration and try again.'},400);}
      if(user.githubId&&identity.id!==user.githubId)return json({error:'Use a token from the GitHub account you signed in with.'},403);
      if(repository.split('/')[0].toLowerCase()!==identity.login.toLowerCase())return json({error:'Choose a repository owned by your GitHub account.'},403);
      const branch=await inspectRepository(token,fetch,repository);
      const encrypted=await encryptGitHubToken(token,user.userId,secret,repository);
      const write=await db.prepare('INSERT INTO github_connections (user_id,encrypted_token,branch,updated_at,repository,github_id,github_login) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET encrypted_token=excluded.encrypted_token,branch=excluded.branch,updated_at=excluded.updated_at,repository=excluded.repository,github_id=excluded.github_id,github_login=excluded.github_login WHERE lock_until<?').bind(user.userId,encrypted,branch,new Date().toISOString(),repository,identity.id,identity.login,Date.now()).run();
      if(write.meta.changes!==1)return json({error:'A GitHub save is still finishing. Try connecting again shortly.'},409);
      return json(await githubConnection(user.userId));
    }
    const task=knownTask(body.taskId);if(!task)return json({error:'Unknown coding problem.'},400);
    const row=await db.prepare('SELECT payload FROM coding_attempts WHERE user_id=? AND task_id=?').bind(user.userId,task.id).first<{payload:string}>();
    if(!row)return json({save:{status:'not_accepted',message:'Save your draft and submit all tests first.'}});
    return json({save:await syncAcceptedSolution(user.userId,task,JSON.parse(row.payload))});
  }catch(error){return json({error:error instanceof GitHubError?error.message:'Could not update your GitHub connection. Please retry.'},503);}
}
export const PUT=(request:Request)=>mutate(request,'connect');
export const POST=(request:Request)=>mutate(request,'save');
export const DELETE=(request:Request)=>mutate(request,'disconnect');
