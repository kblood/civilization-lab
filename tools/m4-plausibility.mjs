// Same observational statistics for any source root. No source-tree mutation.
import {fork} from 'node:child_process';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {readFileSync,writeFileSync} from 'node:fs';
const args=process.argv.slice(2),arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const root=resolve(arg('--root','.'));
const load=name=>import(pathToFileURL(join(root,'src',name+'.mjs')));
export const quantile=(xs,p)=>{const sorted=[...xs].sort((a,b)=>a-b);return sorted.length?sorted[Math.floor((sorted.length-1)*p/100)]:null;};
const counts=xs=>Object.fromEntries([...new Set(xs)].sort().map(x=>[x,xs.filter(y=>y===x).length]));
const spans=[[0,1],[1,3],[3,4],[4,5],[5,6],[6,7],[3,5],[3,7]];
function render(report){
  const lines=['M4 plausibility: seeded scenarios, model attribution, not predictions',
    'Quantiles: sorted[floor((n-1)*p/100)]; durations in years.',
    'Left = start above source; right = inhabited but target not reached; pending origins and true no-lineage separately censored.',
    'Late events = accepted P events in last half of configured horizon with owning pre-state perils=exited.',
    'Counts retain all N; outcome classes may overlap in multi-lineage domains.'];
  for(const s of report.scenarios){
    lines.push('',`${s.scenario}: N=${s.N}; errors=${s.errors.length}`,
      `Outcomes ${JSON.stringify(s.outcomeClasses)}`,`Lineage outcomes ${JSON.stringify(s.lineageOutcomeClasses)}`,
      `Reach ${JSON.stringify(s.reach)}`,'Era duration: from->to observed p10/p50/p90 left/right/no-lineage/pending/errors (source not reached)');
    for(const d of s.durations)lines.push(`E${d.from}->E${d.to} ${d.observed} ${d.p10}/${d.p50}/${d.p90} ${d.leftCensored}/${d.rightCensored}/${d.noLineage}/${d.pendingOrigin??0}/${d.errors} (${d.sourceNotReached})`);
    lines.push(`Extinctions ${JSON.stringify(s.extinctionEvents)}`,`Colonisation ${JSON.stringify(s.colonisation)}`,
      `Collapse per seed ${JSON.stringify(s.collapsePerSeed)}; perils collapses ${JSON.stringify(s.perilsCollapsePerSeed)}`,
      `Colony death ages ${JSON.stringify(s.colonyDeaths)}`,`Late post-exit ${JSON.stringify(s.latePostExit)}`);
  }
  return lines.join('\n')+'\n';
}
async function measure(scenario,seed){
  const {createScenario}=await load('scenario'),{summarizeRun}=await load('ensemble');
  const compilationStart=process.hrtime.bigint();
  const observedSafe=new Set();let observedPerils=false;
  const {world}=createScenario(scenario,seed),result=world.compileSummary({observe:true,onPerilsTick:({tick,exitedArcs})=>{
    observedPerils=true;for(const id of exitedArcs)observedSafe.add(tick+'|'+id);
  }});
  const compileMs=Number(process.hrtime.bigint()-compilationStart)/1e6;
  const run=summarizeRun({scenario,seed},world,result),events=result.events.filter(e=>e.resolution==='accepted');
  const horizon=Number(world.def.untilTick*10n),half=Math.floor((Number(world.def.fromTick*10n)+horizon)/2);
  const launches=events.filter(e=>e.kind==='LAUNCH'),arrivals=events.filter(e=>e.kind==='COLONY_FOUNDED');
  const failed=new Set(),voyages=new Map(),arcs=new Map(result.seenArcs.map(a=>[a.id,a]));let repeats=0;
  for(const e of events){
    if(e.kind==='LAUNCH'){const v=e.data.launch;voyages.set(v.id,v);if(failed.has(v.lineageId+'|'+v.destination))repeats++;}
    if(e.kind==='VOYAGE_LOST'||e.kind==='COLONY_FOUNDED'&&e.data.outcome==='rejected'){
      const v=voyages.get(e.kind==='VOYAGE_LOST'?e.ownerId:e.data.source);if(v)failed.add(v.lineageId+'|'+v.destination);
    }
    if(['COLONY_LOST','EXTINCTION'].includes(e.kind)){const a=arcs.get(e.ownerId);if(a?.isColony)failed.add(a.lineageId+'|'+a.body);}
  }
  // Stream exact pre-state flags when supported; older roots use public inspection
  // at precisely the late event ticks. Both include transient exits/reentries.
  const late=events.filter(e=>e.level==='P'&&e.dateYear>=half);
  const ticks=[...new Set(late.map(e=>e.tick))].sort((a,b)=>Number(a)-Number(b));
  const lateKinds=[];
  if(ticks.length){
    let safe=observedSafe;
    if(!observedPerils){
      const sample=world.compileSummary({inspectSampleTicks:ticks});
      if(sample.resultDigest!==result.resultDigest)throw new Error('Inspection changed result digest');
      safe=new Set(sample.ledgers.flatMap(l=>l.planets.filter(p=>p.pre.perils==='exited').map(p=>l.ledger.tick+'|'+p.id)));
    }
    for(const e of late){const arc=e.refs.find(r=>r.role==='arc')?.entityId;if(safe.has(e.tick+'|'+arc))lateKinds.push(e.kind);}
  }
  const colonyBirths=new Map();
  for(const e of events)if(e.kind==='COLONY_FOUNDED'&&e.data.stage==='FOUNDED'){
    const id=e.data.target;
    if(id)colonyBirths.set(id,e.dateYear);
  }
  const colonyDeathAges=events.filter(e=>e.kind==='EXTINCTION'&&arcs.get(e.ownerId)?.isColony)
    .map(e=>{const birth=colonyBirths.get(e.ownerId);if(birth===undefined)throw new Error('Missing colony birth '+e.ownerId);return e.dateYear-birth;}).sort((a,b)=>a-b);
  return {_compileMs:compileMs,seed,horizon,outcome:run.outcome,classes:run.classes,lineageClasses:result.outcomes.map(l=>l.outcome),startedEra:run.startedEra,
    colonyDeathAges,colonyArcs:[...arcs.values()].filter(a=>a.isColony).length,firstEras:run.firstEras,multiBody:run.flags.interplanetary,resultDigest:result.resultDigest,
    extinctionEvents:counts(events.filter(e=>e.kind==='LINEAGE_EXTINCTION').map(e=>e.data.outcome)),
    colonisation:{LAUNCH:launches.length,COLONY_FOUNDED:arrivals.filter(e=>e.data.outcome!=='rejected').length,
      newColonies:arrivals.filter(e=>e.data.stage==='FOUNDED').length,reinforcements:arrivals.filter(e=>e.data.stage==='REINFORCEMENT').length,
      rejected:counts(arrivals.filter(e=>e.data.outcome==='rejected').map(e=>e.reason)),COLONY_LOST:events.filter(e=>e.kind==='COLONY_LOST').length,
      VOYAGE_LOST:events.filter(e=>e.kind==='VOYAGE_LOST').length,repeatLaunchesToFailedTarget:repeats},
    collapses:events.filter(e=>e.kind==='COLLAPSE').length,perilsCollapses:events.filter(e=>e.data.outcome==='collapse').length,
    latePostExitEvents:lateKinds.length,latePostExitKinds:counts(lateKinds)};
}
export function aggregate(scenario,runs){
  const n=runs.length,good=runs.filter(r=>!r.error),sum=fn=>good.reduce((v,r)=>v+fn(r),0);
  const share=fn=>{const k=good.filter(fn).length;return {count:k,N:n,permille:Math.floor(k*1000/n)};};
  const durations=spans.map(([from,to])=>{
    const left=good.filter(r=>r.startedEra!==null&&r.startedEra>from),cohort=good.filter(r=>r.startedEra!==null&&r.startedEra<=from);
    const reached=cohort.filter(r=>r.firstEras[from]!==null&&r.firstEras[to]!==null),values=reached.map(r=>r.firstEras[to]-r.firstEras[from]);
    return {from,to,observed:values.length,p10:quantile(values,10),p50:quantile(values,50),p90:quantile(values,90),
      leftCensored:left.length,rightCensored:cohort.length-reached.length,noLineage:good.filter(r=>r.startedEra===null&&!r.classes.includes('PENDING_ORIGIN')).length,pendingOrigin:good.filter(r=>r.classes.includes('PENDING_ORIGIN')).length,
      sourceNotReached:cohort.filter(r=>r.firstEras[from]===null).length,errors:n-good.length};
  });
  const merge=fn=>{const keys=[...new Set(good.flatMap(r=>Object.keys(fn(r))))].sort();return Object.fromEntries(keys.map(k=>[k,sum(r=>fn(r)[k]??0)]));};
  const ages=good.flatMap(r=>r.colonyDeathAges??[]);
  return {scenario,N:n,colonyDeaths:{count:ages.length,p10:quantile(ages,10),p50:quantile(ages,50),p90:quantile(ages,90),within200YearsAfterReserve:ages.filter(a=>a>=1000&&a<=1200).length,rightCensored:sum(r=>r.colonyArcs??0)-ages.length},errors:runs.filter(r=>r.error),outcomeClasses:counts(good.flatMap(r=>r.classes)),lineageOutcomeClasses:counts(good.flatMap(r=>r.lineageClasses)),
    reach:{E3:share(r=>r.firstEras[3]!==null),E4:share(r=>r.firstEras[4]!==null),E5plus:share(r=>r.firstEras[5]!==null),multiBody:share(r=>r.multiBody)},durations,
    extinctionEvents:merge(r=>r.extinctionEvents),colonisation:{...Object.fromEntries(['LAUNCH','COLONY_FOUNDED','newColonies','reinforcements','COLONY_LOST','VOYAGE_LOST','repeatLaunchesToFailedTarget'].map(k=>[k,sum(r=>r.colonisation[k])])),rejected:merge(r=>r.colonisation.rejected)},
    collapsePerSeed:{median:quantile(good.map(r=>r.collapses),50),max:good.length?Math.max(...good.map(r=>r.collapses)):null},
    perilsCollapsePerSeed:{median:quantile(good.map(r=>r.perilsCollapses),50),max:good.length?Math.max(...good.map(r=>r.perilsCollapses)):null},
    latePostExit:{acceptedPEvents:sum(r=>r.latePostExitEvents),seedsWithEvents:share(r=>r.latePostExitEvents>0),kinds:merge(r=>r.latePostExitKinds)},runs};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
if(args.includes('--worker')){
  process.on('message',async task=>{const started=process.hrtime.bigint();let result;
    try{result=await measure(task.scenario,task.seed);}catch(e){result={seed:task.seed,error:String(e.stack)};}
    const ms=Number(process.hrtime.bigint()-started)/1e6,compileMs=result._compileMs;delete result._compileMs;
    process.stderr.write(`${task.scenario}/${task.seed}: compile=${compileMs?.toFixed(2)??'ERROR'} ms; diagnostic=${ms.toFixed(2)} ms${compileMs>=30000?' COMPILE OVER 30s':''}${ms>=30000?' DIAGNOSTIC OVER 30s':''}\n`);
    process.send({result,overBudget:compileMs>=30000});process.disconnect();
  });
}else if(args.includes('--render')){
  const path=arg('--render'),report=JSON.parse(readFileSync(path,'utf8'));
  writeFileSync(path.replace(/\.json$/,'.txt'),render(report));
}else{
  const {SCENARIOS}=await load('scenario'),n=Number(arg('--n','30')),jobs=Number(arg('--jobs','2'));
  if(!Number.isSafeInteger(n)||n<30||!Number.isSafeInteger(jobs)||jobs<1)throw new Error('Require --n >=30 and --jobs >=1');
  const scenarios=arg('--scenario',null)?[arg('--scenario')]:[...SCENARIOS].sort();
  const tasks=scenarios.flatMap(scenario=>Array.from({length:n},(_,i)=>({scenario,seed:scenario+'-'+i}))),rows=[];let cursor=0,overBudget=false;
  await Promise.all(Array.from({length:Math.min(jobs,tasks.length)},async()=>{while(cursor<tasks.length){const task=tasks[cursor++];
    const answer=await new Promise(resolveAnswer=>{
      const child=fork(fileURLToPath(import.meta.url),['--worker','--root',root],{stdio:['ignore','ignore','inherit','ipc'],serialization:'advanced'});let answer=null;
      child.on('message',m=>answer=m);child.on('error',e=>resolveAnswer({result:{seed:task.seed,error:String(e)}}));
      child.on('exit',code=>resolveAnswer(answer??{result:{seed:task.seed,error:'worker exit '+code}}));child.send(task);
    });rows.push({scenario:task.scenario,...answer.result});overBudget ||= answer.overBudget;
  }}));
  const report={version:'m4-plausibility-1',method:{seedPattern:'scenario-i, i=0..N-1',quantile:'sorted[floor((n-1)*p/100)]',
    durations:'Exclude starts above source; separate pending origins, true no-lineage, errors, and right censoring including source not reached. No-lineage is also unobserved advancement, never an observed duration.',
    latePostExit:'Accepted P events dated in last half of configured horizon whose owning arc pre-state has perils=exited; exact event-tick inspection, including reentry. D events excluded because D has no perils state.',
    multiBody:'At least two bodies ever inhabited by one lineage, not necessarily simultaneous. Outcome class counts are per seed; lineage counts separate.',
    failures:'Repeat launch counts use actual earlier failures (omniscient measurement only), not the causal knowledge available to targeting.'},
    scenarios:scenarios.sort().map(s=>aggregate(s,rows.filter(r=>r.scenario===s).sort((a,b)=>a.seed<b.seed?-1:a.seed>b.seed?1:0)))};
  const output=JSON.stringify(report,null,2)+'\n',out=arg('--out',null);if(out){writeFileSync(out,output);if(out.endsWith('.json'))writeFileSync(out.slice(0,-5)+'.txt',render(report));}else process.stdout.write(output);
  if(rows.some(r=>r.error)||overBudget)process.exitCode=1;
}
}
