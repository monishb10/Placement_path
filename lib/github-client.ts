import {GITHUB_REPOSITORY} from './github-types';

export function normalizeRepository(value:string) {
  const repository=value.trim();
  if(!/^[a-z\d][a-z\d-]{0,38}\/[a-z\d_.-]{1,100}$/i.test(repository)||['.','..'].includes(repository.split('/')[1]))throw new GitHubError('Enter a repository as your-username/DSA.');
  return repository;
}
const repositoryUrl=(repository:string)=>`https://github.com/${normalizeRepository(repository)}`;
const encode = (value:string) => btoa(Array.from(new TextEncoder().encode(value),b=>String.fromCharCode(b)).join(''));
export class GitHubError extends Error {}
function statusError(status:number):GitHubError {
  if(status===401)return new GitHubError('Your GitHub token expired or was revoked. Reconnect GitHub.');
  if(status===403)return new GitHubError('GitHub refused the save. Check Contents: read and write permission and branch rules, or retry after any rate limit clears.');
  if(status===404)return new GitHubError('GitHub could not find your repository or its branch. Check that your token includes this repository, then reconnect.');
  if(status===409)return new GitHubError('The repository changed during this save. Retry to check the latest file.');
  if(status===422)return new GitHubError('GitHub rejected this commit. Check repository branch rules and your token permissions.');
  return new GitHubError('GitHub is unavailable. Your code is saved here; retry the GitHub save.');
}
async function request(token:string,path:string,init:RequestInit={},fetcher:typeof fetch=fetch,repository=GITHUB_REPOSITORY) {
  // Workers requires manual redirect handling. Keep credentials on the fixed API
  // destination and reject redirects without following their Location header.
  let response:Response;
  try{response=await fetcher(`https://api.github.com/repos/${normalizeRepository(repository)}`+path,{...init,redirect:'manual',signal:AbortSignal.timeout(8000),headers:{
    Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'Placement-Path','Content-Type':'application/json',
  }});}catch{throw new GitHubError('Could not reach GitHub. Your code is saved here; please retry.');}
  if(response.status>=300&&response.status<400){
    await response.body?.cancel().catch(()=>{});
    throw new GitHubError('GitHub redirected this request. Check that your repository has not been renamed or moved, then reconnect.');
  }
  return response;
}
export async function inspectRepository(token:string,fetcher:typeof fetch=fetch,repository=GITHUB_REPOSITORY):Promise<string> {
  const response=await request(token,'',{},fetcher,repository);
  if(!response.ok)throw statusError(response.status);
  const repo=await response.json() as {full_name?:string;default_branch?:string;archived?:boolean;permissions?:{push?:boolean}};
  if(repo.full_name?.toLowerCase()!==normalizeRepository(repository).toLowerCase())throw new GitHubError('The token did not resolve the requested repository.');
  if(repo.archived)throw new GitHubError('This repository is archived. GitHub cannot accept new solutions until it is unarchived.');
  if(repo.permissions?.push===false)throw new GitHubError('This GitHub account does not have write access to this repository.');
  if(!repo.default_branch)throw new GitHubError('GitHub did not return a default branch. Please retry.');
  return repo.default_branch;
}
export function solutionPath(task:{topicId:string;number:number;language:string}) {
  if(!/^[a-z0-9-]+$/.test(task.topicId)||!Number.isInteger(task.number)||task.number<1||task.number>10)throw new GitHubError('Invalid coding problem path.');
  return `placement-path/${task.topicId}/problem-${String(task.number).padStart(2,'0')}/${task.language==='sql'?'query.sql':'Main.java'}`;
}
export async function commitSolution(args:{token:string;repository?:string;branch:string;path:string;code:string;title:string;tests:number;previousBlob?:string|null},fetcher:typeof fetch=fetch) {
  const {token,branch,path,code,title,tests,previousBlob,repository=GITHUB_REPOSITORY}=args;
  if(!/^placement-path\/[a-z0-9-]+\/problem-(0[1-9]|10)\/(Main\.java|query\.sql)$/.test(path))throw new GitHubError('Invalid solution destination.');
  const endpoint='/contents/'+path.split('/').map(encodeURIComponent).join('/');
  const fileUrl=`${repositoryUrl(repository)}/blob/${encodeURIComponent(branch)}/${path}`;
  const existing=await request(token,`${endpoint}?ref=${encodeURIComponent(branch)}`,{},fetcher,repository);
  let sha:string|undefined;
  const content=encode(code);
  if(existing.ok){
    const file=await existing.json() as {type?:string;sha?:string;content?:string;encoding?:string;submodule_git_url?:string};
    if(file.type!=='file'||file.encoding!=='base64'||!file.sha||file.submodule_git_url)throw new GitHubError('The destination is not a regular source file. Review it in GitHub before retrying.');
    if(file.content?.replace(/\s/g,'')===content)return {blobSha:file.sha,fileUrl,commitUrl:undefined,unchanged:true};
    if(!previousBlob||file.sha!==previousBlob)throw new GitHubError('This file already contains changes made outside Placement Path. Review it in GitHub; your existing file was kept.');
    sha=file.sha;
  }else if(existing.status!==404)throw statusError(existing.status);
  const response=await request(token,endpoint,{method:'PUT',body:JSON.stringify({
    message:`Solve ${title} (${tests}/${tests} tests passed)`,content,branch,...(sha?{sha}:{}),
  })},fetcher,repository);
  if(!response.ok)throw statusError(response.status);
  const result=await response.json() as {content?:{sha?:string};commit?:{sha?:string}};
  if(!result.content?.sha||!result.commit?.sha)throw new GitHubError('GitHub returned an incomplete confirmation. Retry to check whether the file was saved.');
  return {blobSha:result.content.sha,fileUrl,commitUrl:`${repositoryUrl(repository)}/commit/${result.commit.sha}`,unchanged:false};
}
