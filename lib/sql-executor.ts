import type {CaseResult} from './judge-types';
import type {CodingCase} from './coding-tasks';

export function executeSql(query:string,test:CodingCase,custom:boolean,signal:AbortSignal):Promise<CaseResult>{
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(new DOMException('Stopped','AbortError'));return;}
    const worker=new Worker('/sql/runner.js');
    let timer:ReturnType<typeof setTimeout>;
    const cleanup=()=>{clearTimeout(timer);worker.terminate();signal.removeEventListener('abort',abort);};
    const abort=()=>{cleanup();reject(new DOMException('Stopped','AbortError'));};
    signal.addEventListener('abort',abort,{once:true});
    worker.onmessage=event=>{cleanup();resolve(event.data as CaseResult);};
    worker.onerror=()=>{cleanup();reject(new Error('The SQL engine could not load. Please retry.'));};
    timer=setTimeout(()=>{cleanup();resolve({caseId:test.id,verdict:'time_limit',stdout:'',stderr:'',compileOutput:'',seconds:8,memoryBytes:null,message:'Query stopped after 8 seconds. Check recursive termination and joins.'});},8000);
    worker.postMessage({query,setup:test.input,caseId:test.id,expected:test.expected,custom});
  });
}
