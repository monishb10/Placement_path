import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Generate an independent Cloudflare deployment config. Never copy the owner's
// Site identity, secret values, or production database binding into a new host.
const root=fileURLToPath(new URL('../',import.meta.url));
const [databaseId,originInput]=process.argv.slice(2);
if(!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(databaseId??''))throw new Error('Usage: node scripts/configure-friends-host.mjs DATABASE_ID https://your-website.example');
const origin=new URL(originInput);
if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Use the exact HTTPS website origin, without a path, query, or credentials.');
const server=path.join(root,'dist/server');
const built=JSON.parse(await readFile(path.join(server,'wrangler.json'),'utf8'));
if(!built.main||!built.assets?.directory)throw new Error('Run npm run build before configuring the friends deployment.');
const config={
  name:'placement-path-friends',
  main:path.resolve(server,built.main),
  compatibility_date:built.compatibility_date,
  compatibility_flags:built.compatibility_flags,
  no_bundle:built.no_bundle??true,
  ...(built.rules?{rules:built.rules}:{}),
  assets:{...built.assets,directory:path.resolve(server,built.assets.directory)},
  d1_databases:[{binding:'DB',database_name:'placement-path-friends',database_id:databaseId,migrations_dir:path.join(root,'drizzle')}],
  vars:{PLACEMENT_AUTH_MODE:'github',PLACEMENT_PUBLIC_ORIGIN:origin.origin},
};
const output=path.join(root,'.friends-hosting/wrangler.json');
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(config,null,2)+'\n');
console.log('Independent friends hosting configuration created. Follow docs/GITHUB-SIGNIN-SETUP.md for migrations and server secrets.');
