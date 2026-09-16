import {z} from 'zod';
import {getStudyUser} from '@/app/auth';
import {studyDb} from '@/db/study-store';
import {newSession,type StudyState} from '@/lib/study-data';
import {practiceById,codingTopics} from '@/lib/coding-bank';
import {sessionSchemaFor} from '@/lib/study-validation';
import {acceptedSource,syncAcceptedSolution} from '@/lib/github-sync';
import {hasStudyActivity} from '@/lib/dashboard-data';

export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const knownTask=(id:string)=>Object.hasOwn(practiceById,id)?practiceById[id]:undefined;
const sessionSchema=sessionSchemaFor(z.string().refine(id=>codingTopics.some(t=>t.id===id)));
const writeSchema=z.object({taskId:z.string().max(60),version:z.number().int().nonnegative(),session:sessionSchema}).strict();

export async function GET(request:Request){
  const user=await getStudyUser(request);if(!user)return json({error:'Sign in to load your coding progress.'},401);
  try{
    const url=new URL(request.url),id=url.searchParams.get('taskId'),db=studyDb();
    if(!id){
      const rows=await db.prepare("SELECT task_id AS taskId, accepted, version, updated_at AS updatedAt, CASE WHEN length(trim(json_extract(payload,'$.code')))>0 OR length(trim(json_extract(payload,'$.explanation')))>0 OR json_array_length(json_extract(payload,'$.steps'))>0 OR json_extract(payload,'$.attempted')>0 THEN json_extract(payload,'$.date') END AS activityDate FROM coding_attempts WHERE user_id=?").bind(user.userId).all<{taskId:string;accepted:number;version:number;updatedAt:string;activityDate:string|null}>();
      const activity=await db.prepare('SELECT date FROM coding_activity WHERE user_id=? ORDER BY date').bind(user.userId).all<{date:string}>();
      const activityDates=[...new Set([...activity.results.map(r=>r.date),...rows.results.map(r=>r.activityDate).filter((d):d is string=>!!d)])];
      return json({attempts:rows.results,activityDates});
    }
    const task=knownTask(id);if(!task)return json({error:'Unknown coding problem.'},400);
    const row=await db.prepare('SELECT payload,version FROM coding_attempts WHERE user_id=? AND task_id=?').bind(user.userId,id).first<{payload:string;version:number}>();
    if(row)return json({session:JSON.parse(row.payload),version:row.version});
    const date=url.searchParams.get('date')??new Date().toISOString().slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return json({error:'Invalid study date.'},400);
    let session=newSession(date,task.topicId);
    // Q1 retains drafts created before the ten-problem bank was introduced.
    if(task.number===1){
      const previous=await db.prepare('SELECT payload FROM study_states WHERE user_id=?').bind(user.userId).first<{payload:string}>();
      if(previous){
        const old=JSON.parse(previous.payload) as StudyState;
        const daily=old.sessions[date];
        const seed=daily?.topicId===task.topicId?daily:old.practice?.[task.topicId]??Object.values(old.sessions).filter(s=>s.topicId===task.topicId).sort((a,b)=>b.date.localeCompare(a.date))[0];
        if(seed)session={...seed,date};
      }
    }
    return json({session,version:0});
  }catch(error){console.error('Coding progress load failed',error);return json({error:'Could not load coding progress. Please retry.'},503);}
}

export async function PUT(request:Request){
  const user=await getStudyUser(request);if(!user)return json({error:'Sign in to save your code.'},401);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Request not allowed.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Expected JSON.'},415);
  try{
    const raw=await request.text();if(raw.length>110000)return json({error:'This draft is too large.'},413);
    let value:unknown;try{value=JSON.parse(raw);}catch{return json({error:'Invalid draft format.'},400);}
    const parsed=writeSchema.safeParse(value);if(!parsed.success)return json({error:'Some draft fields are invalid.'},400);
    const {taskId,version,session}=parsed.data,task=knownTask(taskId);
    if(!task||task.topicId!==session.topicId)return json({error:'Draft does not match this topic.'},400);
    const total=session.judge?.mode==='submit'?task.cases.length:task.cases.filter(c=>c.sample).length;
    if(session.judge&&session.judge.total!==total)return json({error:'Test summary does not match this problem.'},400);
    const payload=JSON.stringify(session),now=new Date().toISOString(),accepted=await acceptedSource(session,task)?1:0,db=studyDb();
    const write=version===0
      ?db.prepare('INSERT INTO coding_attempts (user_id,task_id,payload,version,accepted,updated_at) VALUES (?,?,?,1,?,?) ON CONFLICT(user_id,task_id) DO NOTHING').bind(user.userId,taskId,payload,accepted,now)
      :db.prepare('UPDATE coding_attempts SET payload=?,version=version+1,accepted=?,updated_at=? WHERE user_id=? AND task_id=? AND version=?').bind(payload,accepted,now,user.userId,taskId,version);
    const activityDate=hasStudyActivity(session)?session.date:undefined;
    const result=activityDate?(await db.batch([write,db.prepare('INSERT INTO coding_activity (user_id,date) SELECT ?,? WHERE EXISTS (SELECT 1 FROM coding_attempts WHERE user_id=? AND task_id=? AND version=? AND payload=?) ON CONFLICT(user_id,date) DO NOTHING').bind(user.userId,activityDate,user.userId,taskId,version+1,payload)]))[0]:await write.run();
    if(result.meta.changes!==1)return json({error:'This problem changed in another tab. Copy your draft before reloading; your current code is still here.'},409);
    // A repository failure must never discard a successfully saved study draft.
    let github;
    if(accepted){try{github=await syncAcceptedSolution(user.userId,task,session);}catch{github={status:'error',message:'Your code is saved here. Could not confirm the GitHub save; please retry.'};}}
    return json({version:version+1,accepted,updatedAt:now,github,activityDate});
  }catch(error){console.error('Coding progress save failed',error);return json({error:'Your draft is still on screen. Saving failed; please retry.'},503);}
}
