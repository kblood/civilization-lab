import {cpus} from 'node:os';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createScenario,SCENARIOS} from './scenario.mjs';
import {compare} from './canonical.mjs';
import {compareEvents} from './events.mjs';

export const LABEL='seeded scenarios, model attribution, not predictions';
export const METRICS=['industrialE3','atomicE4','interplanetary','eraE5','interstellar','eraE6','extinct','extinctSelf','extinctNatural','extinctStellar','extinctNaturalStellar','colonyOnlyLoss','noLineage','pendingOrigin','collapseRecovery','firstContact','existentialCap','error'];
export const DEFAULT_JOBS=Math.min(4,cpus().length);
const order=(a,b)=>compare(a.scenario,b.scenario)||compare(a.seed,b.seed);
export function ensemblePlan(n,{scenario,untilYear,targetingPolicy,colonyPolicy}={}){
  if(!Number.isSafeInteger(n)||n<1)throw new RangeError('ensemble must be a positive integer');
  if(scenario&&!SCENARIOS.includes(scenario))throw new TypeError('Unknown ensemble scenario');
  return Array.from({length:n},(_,i)=>{const name=scenario??SCENARIOS[i%SCENARIOS.length];return {scenario:name,seed:`${name}-${i}`,untilYear,...(targetingPolicy!==undefined?{targetingPolicy}:{}),...(colonyPolicy!==undefined?{colonyPolicy}:{})};});
}
export function fraction(k,n){const tenths=n?BigInt(k)*1000n/BigInt(n):0n;return `${k}/${n} (${tenths/10n}.${tenths%10n}%)`;}
export function lowerMedian(values){const a=values.filter(v=>v!==null&&v!==undefined).sort((a,b)=>a-b);return a.length?a[Math.floor((a.length-1)/2)]:null;}
const eventLabel=e=>`${e.kind}@${e.dateYear}`;
export function causalExplanation(events,outcome,select=()=>true){
  const accepted=events.filter(e=>e.resolution==='accepted'&&select(e)).sort(compareEvents),byId=new Map(events.map(e=>[e.id,e]));
  let ends=accepted.filter(e=>e.kind==='LINEAGE_EXTINCTION');
  if(!ends.length)ends=accepted.filter(e=>['COLONY_FOUNDED','LAUNCH','SPACEFLIGHT'].includes(e.kind)).slice(-1);
  if(!ends.length)ends=accepted.slice(-1);
  const paths=new Map(),depths=new Map();
  for(const e of [...events].sort(compareEvents)){
    const cause=[...e.causes].filter(c=>byId.has(c.eventId)).sort((a,b)=>(depths.get(b.eventId)??0)-(depths.get(a.eventId)??0)||compare(a.eventId,b.eventId))[0];
    paths.set(e.id,[...(paths.get(cause?.eventId)??[]),e].slice(-8));depths.set(e.id,1+(depths.get(cause?.eventId)??0));
  }
  // First expansion milestones are explicitly labelled chronology, never invented DAG edges.
  const chain=ends.map(e=>paths.get(e.id).map(eventLabel).join(' -> ')).join(' ; ')||'no causal events';
  const milestones=['SPACEFLIGHT','LAUNCH','COLONY_FOUNDED'].map(k=>accepted.find(e=>e.kind===k&&e.data.outcome!=='rejected')).filter(Boolean);
  return `${outcome}: ${chain}${milestones.length?`; first expansion chronology: ${milestones.map(eventLabel).join(' ; ')}`:''}`;
}
export function summarizeRun(task,world,result){
  const events=result.events.filter(e=>e.resolution==='accepted').sort(compareEvents),arcs=result.seenArcs;
  const lineageClasses=result.outcomes.map(l=>l.outcome).sort(compare);
  if(!lineageClasses.length)lineageClasses.push(result.state.origins.some(o=>o.status==='pending'&&o.deliveryTick!==null&&o.deliveryTick>=world.def.untilTick)?'PENDING_ORIGIN':'NO_LINEAGE');
  const classes=[...new Set(lineageClasses)].sort(compare),outcome=classes.join('+');
  const multi=(key)=>[...new Set(arcs.map(a=>a.lineageId))].some(id=>new Set(arcs.filter(a=>a.lineageId===id).map(key)).size>=2);
  const extinct=classes.some(c=>c.startsWith('EXTINCT_'));
  const collapses=events.filter(e=>e.kind==='COLLAPSE'||['NUCLEAR_WAR','RUNAWAY_TECH','ENGINEERED_PANDEMIC'].includes(e.kind)&&e.data.outcome==='collapse');
  const recovery=events.some(e=>e.kind==='RECOVERY'&&collapses.some(c=>c.dateYear<=e.dateYear&&(c.ownerId===e.ownerId||e.ownerId.startsWith(c.ownerId+'#'))));
  const first=result.firstEras;
  const flags={industrialE3:first[3]!==null,atomicE4:first[4]!==null,interplanetary:multi(a=>a.body),eraE5:first[5]!==null,
    interstellar:multi(a=>world.def.planets.find(p=>p.body===a.body).system),eraE6:first[6]!==null,extinct,
    extinctSelf:classes.includes('EXTINCT_SELF'),extinctNatural:classes.includes('EXTINCT_NATURAL'),extinctStellar:classes.includes('EXTINCT_STELLAR'),extinctNaturalStellar:classes.some(c=>['EXTINCT_NATURAL','EXTINCT_STELLAR'].includes(c)),
    colonyOnlyLoss:events.some(e=>e.kind==='EXTINCTION'&&arcs.some(a=>a.id===e.ownerId&&a.isColony&&result.outcomes.some(l=>l.id===a.lineageId&&!l.outcome.startsWith('EXTINCT_')))),
    noLineage:classes.includes('NO_LINEAGE'),pendingOrigin:classes.includes('PENDING_ORIGIN'),collapseRecovery:recovery,firstContact:events.some(e=>e.kind==='FIRST_CONTACT'),existentialCap:classes.includes('EXISTENTIAL_CAP')||events.some(e=>e.data.outcome==='existential-cap'),error:false};
  const byId=new Map(events.map(e=>[e.id,e])),classCauses={};
  const belongs=l=>e=>e.ownerId===l.id||arcs.some(a=>a.lineageId===l.id&&(e.ownerId===a.id||e.ownerId.startsWith(a.id+'#')||e.data.launch?.lineageId===l.id||e.refs?.some(ref=>ref.entityId===a.id)));
  for(const l of result.state.lineages){const own=events.filter(belongs(l));
    const cause=l.outcomeClass.startsWith('EXTINCT_')?(byId.get(l.extinctionCause)?.kind??'NATURAL_UPDATE'):
      own.filter(e=>l.outcomeClass==='EXISTENTIAL_CAP'?e.data.outcome==='existential-cap':l.outcomeClass==='COLLAPSED_RECOVERING'?e.kind==='COLLAPSE'||e.data.outcome==='collapse':e.kind==='COLONY_FOUNDED'||e.kind==='ENERGY_TRANSITION').at(-1)?.kind??'INITIAL_STATE';
    (classCauses[l.outcomeClass]??=[]).push(cause);
  }
  const causes=Object.values(classCauses).flat().sort(compare);
  const birth=events.filter(e=>e.kind==='SAPIENCE').map(e=>e.dateYear),originYear=world.def.forced.initial?Number(world.def.fromTick*10n):birth.length?Math.min(...birth):null;
  // Earliest inhabited boundary, before that tick's technology transitions.
  // First-era witnesses include the pre-state even when century plots omit it.
  const eraOrigin=first[0]??originYear;
  const startedEra=first[0]===null?null:first.reduce((n,y,i)=>y===first[0]?i:n,0);
  return {...(task.targetingPolicy!==undefined?{targetingPolicy:task.targetingPolicy}:{}),...(task.colonyPolicy!==undefined?{colonyPolicy:task.colonyPolicy}:{}),scenario:task.scenario,seed:task.seed,untilYear:task.untilYear??world.def.untilTick*10n+'',endYear:Number(result.state.tick*10n),outcome,classes,flags,originYear:eraOrigin,startedEra,firstEras:first,firstEnergy:result.firstEnergy,maxEra:result.maxEra,
    timeE2:first[2]===null||eraOrigin===null||startedEra>=2?null:first[2]-eraOrigin,timeE3:first[3]===null||eraOrigin===null||startedEra>=3?null:first[3]-eraOrigin,
    causes,classCauses,explanation:result.state.lineages.length?[...result.state.lineages].sort((a,b)=>compare(a.id,b.id)).map(l=>{
      const home=arcs.find(a=>a.lineageId===l.id&&!a.isColony),system=world.def.planets.find(p=>p.body===home?.body)?.system;
      const interstellar=events.find(e=>e.kind==='COLONY_FOUNDED'&&e.data.stage==='FOUNDED'&&belongs(l)(e)&&world.def.planets.find(p=>p.body===e.ownerId)?.system!==system);
      return `${l.id}: ${causalExplanation(events,l.outcomeClass,belongs(l))}${interstellar?`; first interstellar colony: ${eventLabel(interstellar)}`:''}`;
    }).join(' | '):(outcome==='PENDING_ORIGIN'?'PENDING_ORIGIN: origin beyond observation horizon (right-censored)':'NO_LINEAGE: origin window exhausted or origin preempted'),manifestDigest:result.manifestDigest,recipeDigest:result.recipeDigest,resultDigest:result.resultDigest,
    timeline:{observations:result.observations,arcs,events:events.map(e=>({id:e.id,kind:e.kind,dateYear:e.dateYear,ownerId:e.ownerId,salience:e.salience??0,causes:e.causes,data:{outcome:e.data.outcome,launch:e.data.launch}}))}};
}
export function runSeed(task){
  try{const {world,domain}=createScenario(task.scenario,task.seed,{untilYear:task.untilYear,...(task.targetingPolicy!==undefined?{targetingPolicy:task.targetingPolicy}:{}),...(task.colonyPolicy!==undefined?{colonyPolicy:task.colonyPolicy}:{})});if(!domain||world.status)throw new Error(world.status??'Ensemble requires domain');return summarizeRun(task,world,world.compileSummary({observe:true}));}
  catch(e){return {...task,outcome:'ERROR',classes:['ERROR'],flags:Object.fromEntries(METRICS.map(k=>[k,k==='error'])),causes:[],explanation:`ERROR: ${String(e.message).replace(/[\r\n]/g,' ')}`,firstEras:Array(8).fill(null),firstEnergy:Array(7).fill(null),timeE2:null,timeE3:null};}
}
export function eraStatistics(runs,era){
  const n=runs.length,unknown=runs.filter(r=>r.outcome==='ERROR').length;
  const started=runs.filter(r=>r.outcome!=='ERROR'&&r.startedEra!==null&&r.startedEra!==undefined&&r.startedEra>=era);
  const below=runs.filter(r=>r.outcome!=='ERROR'&&!started.includes(r));
  const reached=below.filter(r=>r.firstEras?.[era]!==null&&r.firstEras?.[era]!==undefined);
  const never=below.length-reached.length;
  const times=reached.map(r=>r.firstEras[era]-r.originYear);
  return {era,n,started:started.length,reached:reached.length,never,unknown,
    startedFraction:fraction(started.length,n),reachedFraction:fraction(reached.length,n),neverFraction:fraction(never,n),
    median:lowerMedian(times),leftCensored:started.length,rightCensored:never};
}
export function industrialCalibration(runs){
  const cohort=runs.filter(r=>r.startedEra===3&&r.outcome!=='ERROR');
  return [5,6,7].map(era=>{const reached=cohort.filter(r=>r.firstEras[era]!==null);return {era,n:cohort.length,reached:reached.length,censored:cohort.length-reached.length,median:lowerMedian(reached.map(r=>r.firstEras[era]-r.firstEras[3]))};});
}
export function aggregate(runs){
  const sorted=[...runs].sort(order),n=sorted.length;
  const table=METRICS.map(metric=>{const k=sorted.filter(r=>r.flags[metric]).length;return {metric,k,n,fraction:fraction(k,n)};});
  const classes=[...new Set(sorted.flatMap(r=>r.classes).filter(c=>c!=='ERROR'))].sort(compare);
  const counts=Object.fromEntries(table.map(r=>[r.metric,r.k]));
  const bands=[['outcome classes >= 4',classes.length,4],['collapse then recovery >= 1',counts.collapseRecovery,1],['E3 >= 1',counts.industrialE3,1],['self-extinction >= 1',counts.extinctSelf,1],['multi-body lineage >= 1',counts.interplanetary,1],['NO_LINEAGE >= 1',counts.noLineage,1]].map(([name,observed,target])=>({name,observed,target,verdict:observed>=target?'PASS':'FAIL'}));
  const outcomes=[...new Set(sorted.flatMap(r=>r.classes))].sort(compare).map(outcome=>{
    const own=sorted.filter(r=>r.classes.includes(outcome)),causes=own.flatMap(r=>r.classCauses?.[outcome]??r.causes),kinds=[...new Set(causes)].sort(compare);
    return {outcome,k:own.length,n,fraction:fraction(own.length,n),causes:kinds.map(kind=>({kind,count:causes.filter(c=>c===kind).length})).sort((a,b)=>b.count-a.count||compare(a.kind,b.kind))};
  });
  const eraThresholds=[2,3,4,5,6,7].map(era=>eraStatistics(sorted,era));
  return {n,table,outcomes,bands,eraThresholds,calibration:industrialCalibration(sorted),medianE2:eraThresholds[0].median,medianE3:eraThresholds[1].median,explanations:sorted.map(r=>`${r.scenario}/${r.seed}: ${r.explanation}`)};
}
export async function runEnsemble(tasks,{jobs=DEFAULT_JOBS,timings=false}={}){
  if(!Number.isSafeInteger(jobs)||jobs<1)throw new RangeError('jobs must be a positive integer');
  if(jobs===1)return tasks.map(runSeed).sort(order);
  const output=[];let cursor=0;
  await Promise.all(Array.from({length:Math.min(jobs,tasks.length)},async()=>{
    while(cursor<tasks.length){const task=tasks[cursor++];const result=await new Promise(resolve=>{
      const child=fork(fileURLToPath(new URL('../tools/ensemble-worker.mjs',import.meta.url)),timings?['--timing']:[],{stdio:['ignore','ignore','pipe','ipc'],serialization:'advanced'});let answer=null,errors='';
      child.stderr.on('data',b=>{errors=(errors+b).slice(-2000);if(timings)process.stderr.write(b);});child.on('message',r=>{answer=r;});
      const failure=message=>({...task,outcome:'ERROR',classes:['ERROR'],flags:{error:true},causes:[],explanation:`ERROR: ${message}`,timeE2:null,timeE3:null});
      child.on('error',e=>resolve(failure(e.message)));child.on('exit',code=>resolve(answer??failure(`worker exit ${code}: ${errors.trim()}`)));child.send(task);
    });output.push(result);}
  }));
  return output.sort(order);
}
