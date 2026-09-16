import {z} from 'zod';
import {getStudyUser} from '@/app/auth';
import {compareOutput} from '@/lib/coding-tasks';
import {practiceById} from '@/lib/coding-bank';
import {executeJava} from '@/lib/java-executor';

export const dynamic = 'force-dynamic';
const requestSchema = z.object({
  topicId: z.string().max(40), taskId:z.string().max(60).optional(), caseId: z.string().max(20), allowExternalExecution: z.literal(true),
  code: z.string().min(1).max(20000), customInput: z.string().max(4000).optional(),
}).strict();
const json = (data: unknown, status = 200) => Response.json(data, {status, headers: {'Cache-Control': 'no-store'}});
export async function POST(request: Request) {
  const user = await getStudyUser(request);
  if (!user) return json({error: 'Sign in to run Java code.'}, 401);
  if (request.headers.get('sec-fetch-site') === 'cross-site') return json({error: 'Request not allowed.'}, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({error: 'Expected JSON.'}, 415);
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 110000) return json({error: 'Your code or input is too large.'}, 413);
  let raw: string;
  try { raw = await request.text(); } catch { return json({error: 'Could not read this run.'}, 400); }
  if (raw.length > 110000) return json({error: 'Your code or input is too large.'}, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({error: 'Invalid run request.'}, 400); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return json({error: 'Check your code and input before running.'}, 400);
  const {topicId,taskId,caseId,code,customInput} = parsed.data;
  const id=taskId??topicId;
  const task=Object.hasOwn(practiceById,id)?practiceById[id]:undefined;
  const test = task?.cases.find(c => c.id === caseId);
  if (!task || task.language!=='java' || task.topicId!==topicId || caseId !== 'custom' && !test) return json({error: 'This test case does not exist.'}, 400);
  if (!code.trim()) return json({error: 'Write your Java code first.'}, 400);
  const result = await executeJava(code, caseId === 'custom' ? customInput ?? '' : test!.input, caseId);
  if (test && result.verdict === 'ran') result.verdict = compareOutput(result.stdout, test.expected, task.comparison) ? 'passed' : 'wrong_answer';
  return json(result);
}
