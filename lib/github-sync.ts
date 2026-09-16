import {studyDb} from '@/db/study-store';
import {type PracticeTask} from './coding-bank';
import {type Session} from './study-data';
import {sourceHash} from './judge-types';
import {commitSolution,GitHubError,solutionPath} from './github-client';
import {decryptGitHubToken} from './github-vault';
import {GITHUB_REPOSITORY,type GitHubConnection,type GitHubSave} from './github-types';
import {githubVaultSecret,storedGitHubConnection} from './github-connection-store';
export {githubVaultSecret} from './github-connection-store';

type SavedRow={repository:string;sourceHash:string;blobSha:string;fileUrl:string;commitUrl:string|null;savedAt:string};
const savedColumns='repository,source_hash AS sourceHash,blob_sha AS blobSha,file_url AS fileUrl,commit_url AS commitUrl,saved_at AS savedAt';
export async function acceptedSource(session:Session,task:PracticeTask):Promise<string|null> {
  const judge=session.judge;
  if(!session.code.trim()||session.topicId!==task.topicId||!judge?.accepted||judge.mode!=='submit'||judge.total!==task.cases.length||judge.passed!==task.cases.length)return null;
  const hash=await sourceHash(session.code);
  return hash===judge.sourceHash?hash:null;
}
const savedStatus=(row:SavedRow):GitHubSave=>({status:'saved',repository:row.repository,sourceHash:row.sourceHash,fileUrl:row.fileUrl,commitUrl:row.commitUrl??undefined,savedAt:row.savedAt});
export async function githubConnection(userId:string,taskId?:string):Promise<GitHubConnection> {
  const db=studyDb();
  const connection=await storedGitHubConnection(userId);
  const saved=taskId?await db.prepare(`SELECT ${savedColumns} FROM github_saves WHERE user_id=? AND task_id=? AND repository=?`).bind(userId,taskId,connection?.repository??'').first<SavedRow>():null;
  return {configured:!!githubVaultSecret(),connected:!!connection,branch:connection?.branch,repository:connection?.repository??'',githubLogin:connection?.githubLogin??undefined,save:saved?savedStatus(saved):undefined};
}
export async function syncAcceptedSolution(userId:string,task:PracticeTask,session:Session):Promise<GitHubSave> {
  const hash=await acceptedSource(session,task);
  if(!hash)return {status:'not_accepted',message:'Submit all tests with your current code before saving to GitHub.'};
  const db=studyDb(),secret=githubVaultSecret();
  const connection=await storedGitHubConnection(userId);
  if(!connection)return {status:'disconnected',sourceHash:hash};
  if(!secret)return {status:'error',sourceHash:hash,message:'GitHub connection is unavailable. Your code is saved here.'};
  const previous=await db.prepare(`SELECT ${savedColumns} FROM github_saves WHERE user_id=? AND task_id=? AND repository=?`).bind(userId,task.id,connection.repository).first<SavedRow>();
  if(previous?.sourceHash===hash)return savedStatus(previous);
  // Serialize repository commits across problems and tabs; expired leases can be retried.
  const lockId=crypto.randomUUID(),now=Date.now();
  const lock=await db.prepare('UPDATE github_connections SET lock_id=?,lock_until=? WHERE user_id=? AND lock_until<? AND repository=? AND encrypted_token=?').bind(lockId,now+45000,userId,now,connection.repository,connection.encryptedToken).run();
  if(lock.meta.changes!==1)return {status:'busy',sourceHash:hash,message:'Another GitHub save is finishing. Retry in a moment.'};
  try{
    const current=await db.prepare('SELECT payload FROM coding_attempts WHERE user_id=? AND task_id=?').bind(userId,task.id).first<{payload:string}>();
    if(!current||await acceptedSource(JSON.parse(current.payload),task)!==hash)return {status:'not_accepted',message:'Your draft changed. Submit all tests with the current code.'};
    let token:string;
    try{token=await decryptGitHubToken(connection.encryptedToken,userId,secret,connection.repository);}catch{return {status:'error',sourceHash:hash,message:'Your GitHub connection could not be opened. Reconnect GitHub.'};}
    const result=await commitSolution({token,repository:connection.repository,branch:connection.branch,path:solutionPath(task),code:session.code,title:task.title,tests:task.cases.length,previousBlob:previous?.blobSha});
    const savedAt=new Date().toISOString();
    const commitUrl=result.commitUrl??(previous?.sourceHash===hash?previous.commitUrl:undefined)??null;
    await db.prepare('INSERT INTO github_saves (user_id,task_id,source_hash,blob_sha,file_url,commit_url,saved_at,repository) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id,task_id) DO UPDATE SET repository=excluded.repository,source_hash=excluded.source_hash,blob_sha=excluded.blob_sha,file_url=excluded.file_url,commit_url=excluded.commit_url,saved_at=excluded.saved_at').bind(userId,task.id,hash,result.blobSha,result.fileUrl,commitUrl,savedAt,connection.repository).run();
    return {status:'saved',repository:connection.repository,sourceHash:hash,fileUrl:result.fileUrl,commitUrl:commitUrl??undefined,savedAt};
  }catch(error){return {status:'error',sourceHash:hash,message:error instanceof GitHubError?error.message:'Could not confirm the GitHub save. Your code is saved here; retry safely.'};}
  finally{await db.prepare('UPDATE github_connections SET lock_id=NULL,lock_until=0 WHERE user_id=? AND lock_id=?').bind(userId,lockId).run();}
}
