import {z} from 'zod';
import {lessons,taskIds,steps,projectItems} from './study-data';
const topic=z.string().refine(v=>lessons.some(l=>l.id===v));
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const short=z.string().max(4000);
export const sessionSchemaFor=(topicSchema:z.ZodType<string>)=>z.object({
  date,topicId:topicSchema,checks:z.array(z.string().refine(v=>taskIds.includes(v))).max(9),
  steps:z.array(z.string().refine(v=>steps.includes(v))).max(7),code:z.string().max(20000),explanation:short,notes:short,revision:short,
  attempted:z.number().int().min(0).max(2),solved:z.number().int().min(0).max(2),independent:z.number().int().min(0).max(2),
  topicDone:z.enum(['','Yes','Partly','No']),p1:z.enum(['','Without help','With help','Not solved','Not attempted']),p2:z.literal('N/A'),
  hintUsed:z.boolean(),reported:z.boolean(),
  complexity:z.object({time:z.string().max(120),space:z.string().max(120)}).strict().optional(),
  judge:z.object({sourceHash:z.string().regex(/^[a-f0-9]{64}$/),passed:z.number().int().min(0).max(30),total:z.number().int().min(1).max(30),accepted:z.boolean(),mode:z.enum(['samples','submit']),at:z.string().datetime()}).strict().refine(j=>j.passed<=j.total&&(!j.accepted||(j.mode==='submit'&&j.passed===j.total))).optional(),
}).strict().refine(s=>s.independent<=s.solved&&s.solved<=s.attempted&&!(s.hintUsed&&s.independent>0),'Invalid problem counts');
const session=sessionSchemaFor(topic);
export const stateSchema=z.object({
  currentTopic:topic,mastered:z.array(topic).max(60),
  sessions:z.record(date,session).refine(s=>Object.keys(s).length<=600).refine(s=>Object.entries(s).every(([date,v])=>date===v.date)),
  practice:z.record(topic,session).refine(s=>Object.keys(s).length<=lessons.length).refine(s=>Object.entries(s).every(([id,v])=>id===v.topicId)).optional(),
  projects:z.object({flocksense:z.array(z.string().refine(v=>projectItems.includes(v))).max(12),flowpulse:z.array(z.string().refine(v=>projectItems.includes(v))).max(12)}).strict(),
  projectNotes:z.object({flocksense:short,flowpulse:short}).strict(),
}).strict();
export const writeSchema=z.object({version:z.number().int().nonnegative(),state:stateSchema}).strict();
