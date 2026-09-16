'use client';

import {useState, useId} from 'react';
import {Check, ChevronDown, ClipboardList, Lightbulb} from 'lucide-react';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {questionBanks} from '@/lib/question-banks';
import type {Difficulty, Question} from '@/lib/question-banks/types';

const levels: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const descriptions = {Easy:'Recall the essentials and try a simple application.', Medium:'Apply the idea, explain your reasoning, and connect concepts.', Hard:'Evaluate trade-offs, justify a design, or solve a new scenario.'};

function Text({value}:{value:string}) {
  return <>{value.split(/(`[^`]+`)/g).map((part,i)=>part.startsWith('`')&&part.endsWith('`')?<code key={i}>{part.slice(1,-1)}</code>:part)}</>;
}

function PracticeQuestion({question}:{question:Question}) {
  const id=useId();
  const [choice,setChoice]=useState('');
  const [checked,setChecked]=useState(false);
  const correct=Number(choice)===question.correctIndex;
  return <article className="practice-question" aria-labelledby={`${id}-prompt`}>
    <div className="practice-question-meta"><span className={`difficulty-badge ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span><span>{question.format}</span><span className="practice-question-count">{String(question.number).padStart(2,'0')} / 10</span></div>
    <h4 id={`${id}-prompt`}><span className="question-number">{question.number}.</span><Text value={question.prompt}/></h4>
    {question.options&&<><RadioGroup value={choice} onValueChange={value=>{setChoice(value);setChecked(false);}} aria-labelledby={`${id}-prompt`} className="practice-options">{question.options.map((option,i)=><label className={`practice-option ${checked&&i===question.correctIndex?'option-correct':''} ${checked&&!correct&&choice===String(i)?'option-revisit':''}`} htmlFor={`${id}-${i}`} key={i}><RadioGroupItem id={`${id}-${i}`} value={String(i)}/><span className="option-letter">{String.fromCharCode(65+i)}</span><span><Text value={option}/></span>{checked&&i===question.correctIndex&&<Check size={16} aria-label="Correct answer"/>}</label>)}</RadioGroup><button className="secondary-button question-check" disabled={choice===''} onClick={()=>setChecked(true)}>Check answer <Check size={15}/></button>{checked&&<div className={`question-feedback ${correct?'feedback-correct':''}`} role="status"><strong>{correct?'Correct.':'Take another look.'} Answer: {String.fromCharCode(65+question.correctIndex!)}.</strong><p><Text value={question.answer}/></p></div>}</>}
    {!question.options&&<p className="question-attempt-note">Explain your reasoning aloud or write an answer before opening the key.</p>}
  </article>;
}

export default function QuestionPractice({topicId}:{topicId:string}) {
  const [filter,setFilter]=useState('all');
  const questions=questionBanks[topicId];
  if(!questions) return <p className="small-note">Questions are unavailable for this topic.</p>;
  const shown=levels.filter(level=>filter==='all'||filter===level);
  return <section className="question-practice" aria-label="Topic question practice">
    <div className="question-practice-intro"><span className="question-intro-icon"><ClipboardList size={23}/></span><div><h3>Understand it. Explain it. Apply it.</h3><p>10 original questions · 3 Easy · 4 Medium · 3 Hard</p></div></div>
    <p className="practice-time-note"><Lightbulb size={17}/><span>Use 2–3 questions for daily revision. Save stretch questions for your weekly review and stay within your one-hour routine.</span></p>
    <ToggleGroup type="single" value={filter} onValueChange={value=>{if(value)setFilter(value);}} className="question-filters" aria-label="Filter questions by difficulty"><ToggleGroupItem value="all">All 10</ToggleGroupItem>{levels.map(level=><ToggleGroupItem key={level} value={level}>{level} <span>{level==='Medium'?4:3}</span></ToggleGroupItem>)}</ToggleGroup>
    {shown.map(level=><section className="question-level" key={level} aria-label={`${level} questions`}><div className="question-level-heading"><h3>{level}</h3><p>{descriptions[level]}</p></div><div className="question-cards">{questions.filter(q=>q.difficulty===level).map(q=><PracticeQuestion key={`${topicId}-${q.number}`} question={q}/>)}</div></section>)}
    <details className="question-answer-key"><summary><span><strong>Answer key & suggested responses</strong><small>Attempt first, then compare your reasoning.</small></span><ChevronDown size={20}/></summary><div className="answer-key-content"><p className="answer-key-note">Multiple-choice questions have one correct option. Written answers below are exemplars: another approach can earn full credit when it is correct, justified, and satisfies the stated constraints.</p>{shown.map(level=><section key={level}><h3>{level} · {level==='Easy'?'answers & explanations':'exemplar responses'}</h3><ol start={level==='Easy'?1:level==='Medium'?4:8}>{questions.filter(q=>q.difficulty===level).map(q=><li key={q.number} value={q.number}>{q.options&&<strong>{String.fromCharCode(65+q.correctIndex!)}. </strong>}<Text value={q.answer}/></li>)}</ol></section>)}</div></details>
  </section>;
}
