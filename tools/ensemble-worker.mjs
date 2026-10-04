import {performance} from 'node:perf_hooks';
import {runSeed} from '../src/ensemble.mjs';
process.once('message',task=>{
  const start=performance.now(),result=runSeed(task);
  if(process.argv.includes('--timing'))console.error(`Seed wall ms: ${task.scenario}/${task.seed} ${(performance.now()-start).toFixed(2)}`);
  process.send(result,()=>process.disconnect());
});
