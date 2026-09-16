export type Verdict = 'passed' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'time_limit' | 'output_limit' | 'unavailable' | 'ran';
export type CaseResult = {
  caseId: string; verdict: Verdict; stdout: string; stderr: string; compileOutput: string;
  seconds: number | null; memoryBytes: number | null; message?: string;
};
export type JudgeSummary = {
  sourceHash: string; passed: number; total: number; accepted: boolean;
  mode: 'samples' | 'submit'; at: string;
};
export const verdictLabels: Record<Verdict, string> = {
  passed: 'Passed', wrong_answer: 'Wrong answer', compile_error: 'Compilation error',
  runtime_error: 'Runtime error', time_limit: 'Time limit', output_limit: 'Output limit',
  unavailable: 'Runner unavailable', ran: 'Executed',
};
export async function sourceHash(code: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export function debugSuggestion(result: CaseResult, caseName = ''): string {
  if (result.verdict === 'compile_error') return 'Start with the first compiler error. Check the line number, semicolons, variable types, imports, and that the public class is named Main.';
  if (result.verdict === 'time_limit') return 'Check that every loop makes progress and recursion reaches a base case. Then compare your algorithm’s growth with the largest allowed input.';
  if (result.verdict === 'output_limit') return 'Look for a printing loop that never ends or unnecessary debug output. Print only the required answer.';
  if (/IndexOutOfBounds/.test(result.stderr)) return 'An index left the valid range. Check 0-based indices, < versus <=, empty inputs, and pointer updates.';
  if (/InputMismatch|NoSuchElement|NumberFormat/.test(result.stderr)) return 'Check the input format and read count. Consider nextInt versus nextLong, and nextLine immediately after a numeric read.';
  if (/StackOverflow/.test(result.stderr)) return 'Check the recursive base case and whether each call moves toward it. Deep recursion may need an iterative approach.';
  if (/ArithmeticException/.test(result.stderr)) return 'Check division and remainder operations for a zero divisor.';
  if (result.verdict === 'runtime_error') return 'Read the first exception and the line in Main.java. Trace the supplied input through your code before changing the algorithm.';
  if (result.verdict === 'wrong_answer') {
    if (/large|overflow|maximum|upper|long result/i.test(caseName)) return 'Trace the largest values. Check integer overflow and use long before multiplication or addition when required.';
    if (/empty|zero|single|one |base/i.test(caseName)) return 'Check the boundary before entering your loop: empty input, one element, or zero. Confirm the initial value and stopping condition.';
    if (/negative|signed/i.test(caseName)) return 'Check assumptions about positive values. For a maximum, initialize from an actual element instead of zero.';
    return 'Compare the first differing output value. Trace the input by hand, check loop boundaries and ordering, and remove prompts or debug text.';
  }
  if (result.verdict === 'unavailable') return 'Your draft is saved. Retry in a moment; an unavailable runner does not count as a wrong answer.';
  return 'Now explain why your approach works and state its time and auxiliary space complexity.';
}
