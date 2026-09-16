export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Question = {
  number: number; difficulty: Difficulty;
  format: 'Multiple choice' | 'Short answer' | 'Case study' | 'Discussion';
  prompt: string; answer: string; options?: string[]; correctIndex?: number;
};
type Draft = Omit<Question, 'number' | 'difficulty'>;
export const M = (prompt: string, options: string[], correctIndex: number, answer: string): Draft => ({format:'Multiple choice',prompt,options,correctIndex,answer});
export const S = (prompt: string, answer: string): Draft => ({format:'Short answer',prompt,answer});
export const C = (prompt: string, answer: string): Draft => ({format:'Case study',prompt,answer});
export const D = (prompt: string, answer: string): Draft => ({format:'Discussion',prompt,answer});
export function B(questions: Draft[]): Question[] {
  if (questions.length !== 10) throw new Error('Each topic requires exactly ten questions.');
  return questions.map((q,i)=>({...q,number:i+1,difficulty:i<3?'Easy':i<7?'Medium':'Hard'}));
}
