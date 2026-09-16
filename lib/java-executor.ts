import type {CaseResult} from './judge-types';

// Only this fixed, public code-execution API receives submitted source and stdin.
// Never forward the Site's identity headers, cookies, or user profile to it.
const runnerOrigin = 'https://api.paiza.io';
type RunnerDetails = {
  id?: string; status?: string; error?: string; message?: string;
  build_stdout?: string; build_stderr?: string; build_exit_code?: string | number;
  build_result?: string; stdout?: string; stderr?: string; exit_code?: string | number;
  result?: string; time?: string; memory?: string;
};
export type RunnerFetch = typeof fetch;
async function boundedJson(response: Response): Promise<RunnerDetails> {
  if (!response.ok) throw new Error(response.status === 429 ? 'The Java service is busy. Please retry shortly.' : 'The Java service could not accept this run. Please retry.');
  if (!response.body) throw new Error('The Java service returned an empty response.');
  const reader = response.body.getReader();
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 196608) { await reader.cancel(); throw new Error('OUTPUT_LIMIT'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as RunnerDetails; }
  catch { throw new Error('The Java service returned an unreadable result. Please retry.'); }
}
const numberOrNull = (value: unknown) => value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
export function executionResult(details: RunnerDetails, caseId: string): CaseResult {
  const result: CaseResult = {caseId, verdict: 'ran', stdout: String(details.stdout ?? '').slice(0, 16000), stderr: String(details.stderr ?? '').slice(0, 8000), compileOutput: [details.build_stderr, details.build_stdout].filter(Boolean).join('\n').slice(0, 12000), seconds: numberOrNull(details.time), memoryBytes: numberOrNull(details.memory)};
  if (/timeout/i.test(`${details.build_result} ${details.result}`)) return {...result, verdict: 'time_limit'};
  if (details.build_result && details.build_result !== 'success' || details.build_exit_code != null && String(details.build_exit_code) !== '0') return {...result, verdict: 'compile_error'};
  if (String(details.stdout ?? '').length > 16000 || String(details.stderr ?? '').length > 8000) return {...result, verdict: 'output_limit'};
  if (details.result !== 'success' || String(details.exit_code) !== '0') return {...result, verdict: 'runtime_error'};
  return result;
}
export async function executeJava(code: string, input: string, caseId: string, fetcher: RunnerFetch = fetch): Promise<CaseResult> {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 28000);
  const fallback: CaseResult = {caseId, verdict: 'unavailable', stdout: '', stderr: '', compileOutput: '', seconds: null, memoryBytes: null};
  try {
    let details = await boundedJson(await fetcher(`${runnerOrigin}/runners/create`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, signal: controller.signal,
      body: JSON.stringify({language: 'java', source_code: code, input, longpoll: true, api_key: 'guest'}),
    }));
    if (!details.id || !/^[a-zA-Z0-9-]{1,100}$/.test(details.id)) throw new Error('The Java service did not create a run. Please retry.');
    const id = details.id;
    for (let attempt = 0; attempt < 22; attempt++) {
      details = await boundedJson(await fetcher(`${runnerOrigin}/runners/get_details?id=${encodeURIComponent(id)}&api_key=guest`, {signal: controller.signal}));
      if (details.status === 'completed') return executionResult(details, caseId);
      if (details.status !== 'running') throw new Error('The Java service returned an unexpected run status. Please retry.');
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    return {...fallback, message: 'The Java service is still busy. Retry this test; no verdict was recorded.'};
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'OUTPUT_LIMIT') return {...fallback, verdict: 'output_limit', message: 'The program produced too much output.'};
    return {...fallback, message: controller.signal.aborted ? 'The runner did not respond in time. Your code was not marked incorrect; please retry.' : message || 'The Java runner is unavailable. Please retry.'};
  } finally { clearTimeout(deadline); }
}
