// Frozen matched-seed observational panel. Fresh sequential workers; no simulation edits.
import {fork,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {measure,aggregate,quantile} from './m4-plausibility.mjs';

const file=fileURLToPath(import.meta.url),cmp=(a,b)=>a<b?-1:a>b?1:0;
export const ARMS=Object.freeze([
  Object.freeze({id:'B',options:Object.freeze({})}),
  Object.freeze({id:'T',options:Object.freeze({targetingPolicy:'m5-targeting-1'})}),
  Object.freeze({id:'C',options:Object.freeze({colonyPolicy:'m5-colony-2'})}),
  Object.freeze({id:'TC',options:Object.freeze({targetingPolicy:'m5-targeting-1',colonyPolicy:'m5-colony-2'})})
]);
export const PANEL_SCENARIOS=Object.freeze(['crowded-domain','high-perils','doomed-star']);
export function panelPlan({n=30,untilYear=30000,smoke=false}={}){
  if(!Number.isSafeInteger(n)||n<1||n>30||!Number.isSafeInteger(untilYear)||untilYear<10||untilYear>30000)throw new RangeError('Panel N must be 1..30 and horizon 10..30000');
  if(!smoke&&(n!==30||untilYear!==30000))throw new RangeError('Frozen panel requires N=30 and horizon=30000; use --smoke for tooling checks');
  return PANEL_SCENARIOS.flatMap(scenario=>Array.from({length:n},(_,i)=>ARMS.map((_,j)=>{
    const arm=ARMS[(i+j)%ARMS.length];return {scenario,seed:`${scenario}-${i}`,arm:arm.id,untilYear,...arm.options};
  })).flat());
}
const scalarMetrics=r=>{
  const d=r.voyageDiagnostics;
  return {launches:r.colonisation.LAUNCH,newColonies:r.colonisation.newColonies,reinforcements:r.colonisation.reinforcements,
    diversionEvents:d.arrivalStages.DIVERTED??0,strandingEvents:d.arrivalStages.STRANDED??0,terminalRejectionEvents:d.arrivalStages.REJECTED??0,
    transitLossEvents:r.colonisation.VOYAGE_LOST,repeatFailedLegDestinationLaunches:d.repeatLaunchesToPreviouslyRejectedOrLostLegDestination,
    originalCohorts:d.originalCohorts,rescuedCohorts:d.rescuedCohorts,deliveredPersons:BigInt(d.persons.delivered),lostPersons:BigInt(d.persons.lost),
    pendingPersons:BigInt(d.persons.inTransit),rescuedDeliveredPersons:BigInt(d.rescuedPersons.delivered),
    colonyDeaths:r.colonyDeathAges.length,colonyDeathAge1000To1200:r.colonyDeathAges.filter(v=>v>=1000&&v<=1200).length,
    survivingLineages:r.lineageClasses.filter(v=>!v.startsWith('EXTINCT_')).length,
    multiBodyEver:r.multiBody?1:0,compileMs:r.performance.compileMs,compileCpuMs:r.performance.compileCpuMs,
    processPeakRssMiB:r.performance.processPeakRssMiB};
};
export function pairedContrast(rows,{id,left,right,interaction=false}={}){
  const bySeed=new Map();for(const r of rows){if(!bySeed.has(r.seed))bySeed.set(r.seed,new Map());bySeed.get(r.seed).set(r.arm,r);}
  const needed=interaction?['B','T','C','TC']:[left,right],pairs=[],missing=[];
  for(const [seed,arms] of [...bySeed].sort((a,b)=>cmp(a[0],b[0]))){
    if(needed.some(a=>!arms.has(a)||arms.get(a).error)){missing.push(seed);continue;}
    const metrics=Object.fromEntries(needed.map(a=>[a,scalarMetrics(arms.get(a))]));
    const deltas=Object.fromEntries(Object.keys(metrics[needed[0]]).map(k=>[k,interaction?(metrics.TC[k]-metrics.C[k])-(metrics.T[k]-metrics.B[k]):metrics[left][k]-metrics[right][k]]));
    pairs.push({seed,deltas});
  }
  const metrics={};
  for(const key of Object.keys(pairs[0]?.deltas??{})){
    const xs=pairs.map(p=>p.deltas[key]).sort(cmp),big=typeof xs[0]==='bigint',zero=big?0n:0;
    const sum=xs.reduce((n,x)=>n+x,zero),q=p=>xs[Math.floor((xs.length-1)*p/100)];
    metrics[key]={count:xs.length,mean:big?{numerator:String(sum),denominator:xs.length}:sum/xs.length,
      p10:big?String(q(10)):q(10),p50:big?String(q(50)):q(50),p90:big?String(q(90)):q(90),
      positive:xs.filter(v=>v>zero).length,zero:xs.filter(v=>v===zero).length,negative:xs.filter(v=>v<zero).length};
  }
  return {id,N:bySeed.size,completePairs:pairs.length,missingSeeds:missing,metrics};
}
const performanceSummary=rows=>Object.fromEntries(['compileMs','compileCpuMs','diagnosticMs','rssAfterCompileMiB','processPeakRssMiB'].map(k=>{
  const xs=rows.filter(r=>!r.error).map(r=>r.performance[k]);return [k,{p10:quantile(xs,10),p50:quantile(xs,50),p90:quantile(xs,90),max:xs.length?Math.max(...xs):null}];
}));
function diagnosticSummary(rows){
  const good=rows.filter(r=>!r.error),ds=good.map(r=>r.voyageDiagnostics);
  const merge=k=>{const keys=[...new Set(ds.flatMap(d=>Object.keys(d[k])))].sort(cmp);return Object.fromEntries(keys.map(key=>[key,ds.reduce((n,d)=>n+(d[k][key]??0),0)]));};
  const persons=k=>Object.fromEntries(['original','delivered','lost','inTransit'].map(key=>[key,String(ds.reduce((n,d)=>n+BigInt(d[k][key]),0n))]));
  const knowledgeRows=good.filter(r=>r.launchPriorFailure);
  const knowledge=knowledgeRows.length?{availability:'observed',runs:knowledgeRows.length,counts:Object.fromEntries(['none','transit-loss','occupied','uninhabitable','colony-died','active'].map(k=>[k,knowledgeRows.reduce((n,r)=>n+r.launchPriorFailure[k],0)]))}:{availability:'unavailable',runs:0,counts:null};
  return {originalCohorts:ds.reduce((n,d)=>n+d.originalCohorts,0),rescuedCohorts:ds.reduce((n,d)=>n+d.rescuedCohorts,0),
    arrivalStages:merge('arrivalStages'),rejectionReasons:merge('rejectionReasons'),terminalRejectionReasons:merge('terminalRejectionReasons'),pendingLegs:merge('pendingLegs'),terminalFates:merge('terminalFates'),
    persons:persons('persons'),rescuedPersons:persons('rescuedPersons'),conservationPass:ds.every(d=>d.conservation.pass),knowledge,
    compileOver30Seconds:good.filter(r=>r.performance.compileMs>=30000).length};
}
const observation=r=>{const {_compileMs,_compileCpuMs,_rssAfterCompileMiB,_processPeakRssMiB,performance,...rest}=r;return rest;};
const equalObservation=(a,b)=>JSON.stringify(observation(a))===JSON.stringify(observation(b));
export function panelReport(tasks,rows,{metadata={},reruns=[]}={}){
  const scenarios=PANEL_SCENARIOS.map(scenario=>{
    const s=rows.filter(r=>r.scenario===scenario);
    return {scenario,arms:ARMS.map(a=>{const rs=s.filter(r=>r.arm===a.id).sort((x,y)=>cmp(x.seed,y.seed));
      return {id:a.id,options:a.options,...aggregate(scenario,rs),voyages:diagnosticSummary(rs),performance:performanceSummary(rs)};}),
      pairedContrasts:[['T-B','T','B'],['TC-C','TC','C'],['C-B','C','B'],['TC-T','TC','T']].map(([id,left,right])=>pairedContrast(s,{id,left,right})).concat(pairedContrast(s,{id:'(TC-C)-(T-B)',interaction:true}))};
  });
  const errors=rows.filter(r=>r.error),conservationFailures=rows.filter(r=>!r.error&&!r.voyageDiagnostics.conservation.pass);
  const identities=new Set(rows.map(r=>`${r.scenario}|${r.seed}|${r.arm}`));
  const complete=tasks.length===rows.length&&identities.size===tasks.length&&tasks.every(t=>identities.has(`${t.scenario}|${t.seed}|${t.arm}`));
  const deterministicReruns=reruns.map(r=>({scenario:r.scenario,seed:r.seed,arm:r.arm,pass:!r.error&&equalObservation(rows.find(x=>x.scenario===r.scenario&&x.seed===r.seed&&x.arm===r.arm)??{},r),resultDigest:r.resultDigest,error:r.error}));
  return {version:'m5-matched-policy-panel-1',...metadata,complete,pass:complete&&!errors.length&&!conservationFailures.length&&deterministicReruns.length===12&&deterministicReruns.every(r=>r.pass),
    plannedRuns:tasks.length,finishedRuns:rows.length,errors:errors.map(r=>({scenario:r.scenario,seed:r.seed,arm:r.arm,error:r.error})),
    conservationFailures:conservationFailures.map(r=>({scenario:r.scenario,seed:r.seed,arm:r.arm,...r.voyageDiagnostics.conservation})),deterministicReruns,
    method:{jobs:1,arms:ARMS,seedPattern:'<scenario>-0 through <scenario>-29 (matched across arms)',order:'Per seed i: rotate [B,T,C,TC] left by i modulo 4; scenarios kept separate',
      horizon:'30000 configured years; early terminal stops are retained; pending accounts are censored at the actual endYear',
      cohortAccounting:'One original LAUNCH/fixture transit account; follow explicit rescue transfers. Original persons = landed + died before landing + current transit. Landing is not survival to the horizon; descendants and demographic changes are not tracked.',
      rejection:'Stock rejected includes DIVERTED and STRANDED attempts; terminalRejectionEvents counts only REJECTED. Delivered rescue persons are passengers that eventually landed after at least one rescue leg.',
      repeatFailure:'repeatFailedLegDestinationLaunches includes actual earlier rejected/lost destinations on all legs (omniscient observation); stock repeatLaunchesToFailedTarget only links original LAUNCH voyages.',
      knowledge:'launchPriorFailure is observed only for T/TC. Absent B/C fields mean unavailable, never zero. Contrast tests do not invent baseline knowledge.',
      colonyAge:'Stock within200YearsAfterReserve means age since founding 1000..1200 inclusive. Reinforcement can replenish reserve; this metric does not measure time since actual reserve depletion.',
      paired:'Complete matched seeds per scenario only. Four directed contrasts and interaction (TC-C)-(T-B). Missing/error seeds excluded from pair metrics and disclosed; no pooled scenario statistic.',
      quantile:'Sorted lower order statistic floor((N-1)*p/100); integer person means reported as exact numerator/denominator.',
      performance:'Fresh process per run, wall and process CPU during createScenario+compileSummary; diagnostic time includes analysis; peak RSS is process lifetime maximum through compilation, not an isolated compilation allocation.',
      reruns:'Repeat seed 0 under all four arms for every scenario. Compare all deterministic observations and result/manifest/recipe digests, excluding measured times/memory.',
      interpretation:'Authored scenario comparisons, not forecasts or calibrated probabilities. Policies remain opt-in.'},scenarios};
}
export function renderPanel(report){
  const lines=['# M5 matched policy panel','',`Complete: ${report.complete}; pass: ${report.pass}; runs: ${report.finishedRuns}/${report.plannedRuns}`,`Mode: ${report.mode??'unknown'}; Node: ${report.node??'unknown'}; commit: ${report.commit??'unknown'}`,'',
    'B = default; T = m5-targeting-1; C = m5-colony-2; TC = both. Counts are scenario evidence, not forecasts. Policies remain opt-in.'];
  for(const s of report.scenarios){lines.push('',`## ${s.scenario}`,'','| Arm | N | Errors | Launches | Foundings | Reinforcements | Diverted | Stranded | Terminal rejection | Compile median ms |','| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
    for(const a of s.arms){const good=a.runs.filter(r=>!r.error),sum=k=>good.reduce((n,r)=>n+(r.voyageDiagnostics.arrivalStages[k]??0),0);
      lines.push(`| ${a.id} | ${a.N} | ${a.errors.length} | ${a.colonisation.LAUNCH} | ${a.colonisation.newColonies} | ${a.colonisation.reinforcements} | ${sum('DIVERTED')} | ${sum('STRANDED')} | ${sum('REJECTED')} | ${a.performance.compileMs.p50??'unknown'} |`);}
    for(const a of s.arms)lines.push('',`${a.id} persons ${JSON.stringify(a.voyages.persons)}; rescued cohort persons ${JSON.stringify(a.voyages.rescuedPersons)}; fate counts ${JSON.stringify(a.voyages.terminalFates)}; conservation ${a.voyages.conservationPass}; delivered-knowledge ${JSON.stringify(a.voyages.knowledge)}; compilation >=30 seconds ${a.voyages.compileOver30Seconds}.`);
    for(const c of s.pairedContrasts){lines.push('',`${c.id}: ${c.completePairs}/${c.N} complete pairs; missing ${JSON.stringify(c.missingSeeds)}.`);
      for(const [k,v] of Object.entries(c.metrics))lines.push(`- ${k}: mean ${typeof v.mean==='object'?`${v.mean.numerator}/${v.mean.denominator}`:v.mean}; p10/p50/p90 ${v.p10}/${v.p50}/${v.p90}; positive/zero/negative ${v.positive}/${v.zero}/${v.negative}`);}
  }
  lines.push('','## Method','');for(const [k,v] of Object.entries(report.method))lines.push(`- ${k}: ${typeof v==='string'?v:JSON.stringify(v)}`);
  lines.push('',`Conservation failures: ${report.conservationFailures.length}; deterministic rerun failures: ${report.deterministicReruns.filter(r=>!r.pass).length}.`);
  return lines.join('\n')+'\n';
}
function sourceFingerprint(root){
  const paths=[];function visit(dir){for(const e of readdirSync(join(root,dir),{withFileTypes:true}).sort((a,b)=>cmp(a.name,b.name))){const p=join(dir,e.name);if(e.isDirectory())visit(p);else paths.push(p);}}
  for(const p of ['src','fixtures'])visit(p);
  paths.push(relative(root,file),'tools/m4-plausibility.mjs','tools/m5-voyage-diagnostics.mjs');
  return createHash('sha256').update(paths.map(p=>p.replaceAll('\\','/')+'\0'+createHash('sha256').update(readFileSync(join(root,p))).digest('hex')).join('\n')).digest('hex');
}
async function runTask(task,root){
  return new Promise(resolveTask=>{
    const child=fork(file,['--worker','--root',root],{cwd:root,stdio:['ignore','ignore','inherit','ipc'],serialization:'advanced'});let answer;
    child.once('message',r=>answer=r);child.once('error',e=>resolveTask({...task,error:String(e)}));
    child.once('exit',code=>resolveTask(answer??{...task,error:'Worker exit '+code}));child.send(task);
  });
}
if(process.argv[1]&&resolve(process.argv[1])===file){
  const args=process.argv.slice(2),arg=(k,f)=>args.includes(k)?args[args.indexOf(k)+1]:f;
  if(args.includes('--worker'))process.once('message',async task=>{
    const start=process.hrtime.bigint();let row;
    try{const r=await measure(task.scenario,task.seed,task);row={...task,...observation(r),performance:{compileMs:r._compileMs,compileCpuMs:r._compileCpuMs,rssAfterCompileMiB:r._rssAfterCompileMiB,processPeakRssMiB:r._processPeakRssMiB,diagnosticMs:Number(process.hrtime.bigint()-start)/1e6}};}
    catch(e){row={...task,error:String(e.stack)};}
    process.send(row);process.disconnect();
  });
  else{
    if(args.includes('--jobs')&&arg('--jobs')!=='1')throw new RangeError('Panel requires --jobs 1');
    const smoke=args.includes('--smoke'),n=Number(arg('--n',smoke?'1':'30')),untilYear=Number(arg('--until-year',smoke?'100':'30000'));
    const tasks=panelPlan({n,untilYear,smoke}),root=resolve(arg('--root','.'));
    if(!args.includes('--run'))process.stdout.write(JSON.stringify({mode:smoke?'SMOKE':'PANEL',runRequired:true,tasks},null,2)+'\n');
    else{
      const out=resolve(arg('--out',smoke?'out/m5-policy-smoke.json':'out/m5-policy-panel.json'));
      if(!out.endsWith('.json'))throw new TypeError('--out must end in .json');
      const checkpoint=out.slice(0,-5)+'.checkpoint.json',sourceHash=sourceFingerprint(root);
      let commit;try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{commit='unavailable';}
      const metadata={mode:smoke?'SMOKE (not policy evidence)':'PANEL',node:process.version,platform:process.platform,arch:process.arch,commit,sourceHash,n,untilYear};
      const checkpointKey=JSON.stringify({metadata,tasks});let rows=[],reruns=[];
      if(args.includes('--resume')&&existsSync(checkpoint)){const saved=JSON.parse(readFileSync(checkpoint,'utf8'));if(saved.checkpointKey!==checkpointKey)throw new Error('Checkpoint source/runtime/config mismatch');rows=saved.rows;reruns=saved.reruns??[];}
      else if(existsSync(checkpoint)||existsSync(out))throw new Error('Output exists; use --resume or choose a new output path');
      mkdirSync(dirname(out),{recursive:true});
      const save=()=>{if(sourceFingerprint(root)!==sourceHash)throw new Error('Source changed during panel');writeFileSync(checkpoint,JSON.stringify({checkpointKey,rows,reruns},null,2)+'\n');};
      const done=new Set(rows.map(r=>`${r.scenario}|${r.seed}|${r.arm}`));
      for(const task of tasks){if(done.has(`${task.scenario}|${task.seed}|${task.arm}`))continue;
        const row=await runTask(task,root);rows.push(row);save();process.stderr.write(`${rows.length}/${tasks.length} ${task.scenario}/${task.seed}/${task.arm}: ${row.error?'ERROR':`${row.performance.compileMs.toFixed(1)} ms; conservation ${row.voyageDiagnostics.conservation.pass}`}\n`);
      }
      for(const task of tasks.filter(t=>t.seed===t.scenario+'-0')){
        if(reruns.some(r=>r.scenario===task.scenario&&r.seed===task.seed&&r.arm===task.arm))continue;
        reruns.push(await runTask(task,root));save();process.stderr.write(`rerun ${task.scenario}/${task.arm}\n`);
      }
      const report=panelReport(tasks,rows,{metadata,reruns});writeFileSync(out,JSON.stringify(report,null,2)+'\n');writeFileSync(out.slice(0,-5)+'.md',renderPanel(report));
      process.stderr.write(`Panel ${report.pass?'PASS':'FAIL'}; wrote ${out}\n`);if(!report.pass)process.exitCode=1;
    }
  }
}
