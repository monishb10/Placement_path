import {getStudyUser} from '@/app/auth';
import {studyDb} from '@/db/study-store';
import {initialState} from '@/lib/study-data';
import {writeSchema} from '@/lib/study-validation';

export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
  const user=await getStudyUser(request);
  if(!user) return json({error:'Sign in to load your study progress.'},401);
  try{
    const record=await studyDb().prepare('SELECT payload, version FROM study_states WHERE user_id = ?').bind(user.userId).first<{payload:string;version:number}>();
    return json({state:record?JSON.parse(record.payload):initialState(),version:record?.version??0});
  }catch(e){console.error('Study load failed',e);return json({error:'Your progress could not be loaded. Please try again.'},503);}
}
export async function PUT(request:Request){
  const user=await getStudyUser(request);
  if(!user)return json({error:'Sign in to save your study progress.'},401);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Request not allowed.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Expected JSON.'},415);
  try{
    const raw=await request.text();
    if(raw.length>900000)return json({error:'The progress record is too large.'},413);
    let body:unknown;try{body=JSON.parse(raw);}catch{return json({error:'Invalid progress format.'},400);}
    const parsed=writeSchema.safeParse(body);
    if(!parsed.success)return json({error:'Some progress fields are invalid. Please check your entries.'},400);
    const {state,version}=parsed.data;
    const db=studyDb();
    const payload=JSON.stringify(state),now=new Date().toISOString();
    const result=version===0
      ?await db.prepare('INSERT INTO study_states (user_id,payload,version,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId,payload,now).run()
      :await db.prepare('UPDATE study_states SET payload=?, version=version+1, updated_at=? WHERE user_id=? AND version=?').bind(payload,now,user.userId,version).run();
    if(result.meta.changes!==1)return json({error:'Progress changed in another tab. Your unsaved work is still here. Copy it before reloading.'},409);
    return json({version:version+1});
  }catch(e){console.error('Study save failed',e);return json({error:'Your changes are still on screen. Saving is unavailable; please retry.'},503);}
}
