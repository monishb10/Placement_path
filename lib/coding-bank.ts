import {codingTasks as foundations,type CodingTask} from './coding-tasks';
import {lessons} from './study-data';
import {topicResources} from './topic-resources';
import {placementResources} from './placement-resources';
import generated from './coding-bank.generated.json';

export type PracticeTask=CodingTask&{topicId:string;title:string;number:number;difficulty:'Easy'|'Medium'|'Hard';language:'java'|'sql';hint:string;};
export const codingTopics=[
  ...lessons.map(l=>({id:l.id,title:l.title,group:`Phase ${l.phase}`,path:topicResources[l.id].path})),
  ...placementResources.map(r=>({id:r.id,title:r.title,group:r.group,path:r.path})),
];
const initial=lessons.map(l=>({...foundations[l.id],topicId:l.id,title:l.problem,number:1,difficulty:'Easy' as const,language:'java' as const,hint:l.hint}));
export const practiceTasks=[...initial,...generated as PracticeTask[]];
export const practiceById:Record<string,PracticeTask>=Object.fromEntries(practiceTasks.map(t=>[t.id,t]));
export const problemsForTopic=(id:string)=>practiceTasks.filter(t=>t.topicId===id).sort((a,b)=>a.number-b.number);
