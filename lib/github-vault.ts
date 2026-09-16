import {GITHUB_REPOSITORY} from './github-types';
const bytes=(value:string)=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const base64=(value:Uint8Array)=>btoa(Array.from(value,b=>String.fromCharCode(b)).join(''));
async function key(secret:string) {
  const raw=bytes(secret);if(raw.length!==32)throw new Error('GitHub connection is not configured.');
  return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
const context=(userId:string,repository:string)=>new TextEncoder().encode(`placement-path:github:${repository.toLowerCase()}:${userId}`);
const legacyContext=(userId:string)=>new TextEncoder().encode(`placement-path:github:Muthudeenathayalan/DSA:${userId}`);
export async function encryptGitHubToken(token:string,userId:string,secret:string,repository=GITHUB_REPOSITORY) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:context(userId,repository)},await key(secret),new TextEncoder().encode(token));
  return `v2.${base64(iv)}.${base64(new Uint8Array(encrypted))}`;
}
export async function decryptGitHubToken(value:string,userId:string,secret:string,repository=GITHUB_REPOSITORY) {
  const [version,iv,ciphertext]=value.split('.');if(!['v1','v2'].includes(version)||!iv||!ciphertext)throw new Error('Invalid GitHub connection.');
  if(version==='v1'&&repository.toLowerCase()!==GITHUB_REPOSITORY.toLowerCase())throw new Error('Reconnect GitHub for this repository.');
  const decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:version==='v1'?legacyContext(userId):context(userId,repository)},await key(secret),bytes(ciphertext));
  return new TextDecoder().decode(decrypted);
}
