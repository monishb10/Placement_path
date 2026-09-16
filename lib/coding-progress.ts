import type {StudyState} from './study-data';
export type CodingProgressRow={taskId:string;accepted:number};
export function countAcceptedCoding(state:StudyState,rows:CodingProgressRow[]):number{
  const statuses=new Map<string,boolean>();
  for(const session of [...Object.values(state.sessions),...Object.values(state.practice??{})])if(session.judge?.accepted)statuses.set(session.topicId,true);
  for(const row of rows)statuses.set(row.taskId,!!row.accepted);
  return [...statuses.values()].filter(Boolean).length;
}
