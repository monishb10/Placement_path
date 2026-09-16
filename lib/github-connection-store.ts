import {GITHUB_REPOSITORY} from './github-types';
import {env} from 'cloudflare:workers';
import {studyDb} from '@/db/study-store';
import {inspectRepository} from './github-client';
import {encryptGitHubToken} from './github-vault';

export type Connection={encryptedToken:string;branch:string;repository:string;githubId:string|null;githubLogin:string|null};
type RuntimeSettings={PLACEMENT_GITHUB_VAULT_KEY?:string;PLACEMENT_GITHUB_SETUP_TOKEN?:string;PLACEMENT_GITHUB_SETUP_USER_ID?:string};
export function githubVaultSecret(){return (env as unknown as RuntimeSettings).PLACEMENT_GITHUB_VAULT_KEY;}

export async function storedGitHubConnection(userId:string):Promise<Connection|null>{
  const db=studyDb();
  const read=()=>db.prepare('SELECT encrypted_token AS encryptedToken,branch,repository,github_id AS githubId,github_login AS githubLogin FROM github_connections WHERE user_id=?').bind(userId).first<Connection>();
  const existing=await read();
  // An empty credential records an explicit disconnect; server setup must not undo it.
  if(existing)return existing.encryptedToken?existing:null;
  const settings=env as unknown as RuntimeSettings;
  if(settings.PLACEMENT_GITHUB_SETUP_USER_ID!==userId||!settings.PLACEMENT_GITHUB_SETUP_TOKEN||!settings.PLACEMENT_GITHUB_VAULT_KEY)return null;
  const branch=await inspectRepository(settings.PLACEMENT_GITHUB_SETUP_TOKEN);
  const encrypted=await encryptGitHubToken(settings.PLACEMENT_GITHUB_SETUP_TOKEN,userId,settings.PLACEMENT_GITHUB_VAULT_KEY);
  // A simultaneous manual connection or disconnect always wins over initial setup.
  await db.prepare('INSERT INTO github_connections (user_id,encrypted_token,branch,updated_at,repository) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING').bind(userId,encrypted,branch,new Date().toISOString(),GITHUB_REPOSITORY).run();
  const connection=await read();
  return connection?.encryptedToken?connection:null;
}
