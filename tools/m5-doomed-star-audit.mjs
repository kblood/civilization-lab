// M5 doomed-star audit (Fable 5.1 brief 2026-10-07, on Kasper's instruction).
// Hard invariants of the m5-stellar-2 evacuation rule over a doomed-star
// ensemble, plus reported (ungated) measurements. Outside src/; no model change.
//
//   node tools/m5-doomed-star-audit.mjs [--n 30] [--jobs 2] [--out out/m5-doomed-star-audit.json] [--no-detail]
//
// Writes <out>.json and a rendered <out>.txt; wall times go to stderr only.
// audit(runs) is pure: it reads only the summarizeRun records of src/ensemble.mjs.
import {writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ensemblePlan,runEnsemble} from '../src/ensemble.mjs';
import {createScenario} from '../src/scenario.mjs';

export const VERSION='m5-doomed-star-audit-1';
export const SCENARIO='doomed-star';
export const DOOM_YEAR=25000;          // fixtures/planets/m4c-doomed-star-system.json, every s00 body
export const DOOM_END_YEAR=25500;      // doom + parameters.stellarGraceYears (500)
export const HOME_SYSTEM='stub:s00';
export const HOME_BODY='stub:s00:b0';
export const REFUGE='stub:s01:b0';
export const REFUGE_SYSTEMS=Object.freeze(['stub:s01','stub:s02']);
export const INTERSTELLAR_YEARS=400;
export const SEED0=SCENARIO+'-0';
export const SEED0_DIGEST='d0d26b3d082d9429ef936b8b1bf90dd1f433188523bd1beea6d26f245850afd0';
const SEED0_HINT='seed 0 digest differs: first check `git log e735dbd..HEAD -- src fixtures docs/transition-table-v1.md`';

const systemOf=body=>typeof body==='string'&&body.includes(':')?body.slice(0,body.lastIndexOf(':')):null;
const inHome=body=>systemOf(body)===HOME_SYSTEM;
const cmp=(a,b)=>a<b?-1:a>b?1:0;
const extinctClass=c=>c.startsWith('EXTINCT_');
// Arc ids are `arc:<body>:<lineageId>:<episode>` (src/domain.mjs arcDefinition); lineage ids start with `lin:`.
const bodyFromArcId=id=>typeof id==='string'&&id.startsWith('arc:')&&id.includes(':lin:')?id.slice(4,id.indexOf(':lin:')):null;

// Per-run facts from the summarizeRun record (src/ensemble.mjs:63-70).
// timeline.arcs (seenArcs) carries id/body/lineageId/isColony but no population,
// so arc death is derived from accepted EXTINCTION events per arc and lineage
// death from LINEAGE_EXTINCTION; the final observation's per-arc pop is a cross-check.
export function runFacts(run,{doomYear=DOOM_YEAR,doomEndYear=DOOM_END_YEAR}={}) {
  const t=run.timeline??{arcs:[],events:[],observations:[]},events=t.events??[];
  const arcs=[...(t.arcs??[])].sort((a,b)=>cmp(a.id,b.id)),arcById=new Map(arcs.map(a=>[a.id,a]));
  const bodyOfArc=id=>arcById.get(id)?.body??bodyFromArcId(id);
  const launches=events.filter(e=>e.kind==='LAUNCH'&&e.data?.launch).map(e=>{const l=e.data.launch;
    return {seed:run.seed,id:e.id,dateYear:e.dateYear,sourceArc:l.sourceArc,source:bodyOfArc(l.sourceArc),destination:l.destination,
      launchYear:l.launchYear,arrivalYear:l.arrivalYear,transportTier:l.tiers?.[3]??null,lineageId:l.lineageId};});
  const launchById=new Map(launches.map(l=>[l.id,l]));
  const extinction=new Map(),dooms=new Map(),lineageEnd=new Map();
  for(const e of events) {
    if(e.kind==='EXTINCTION'&&!(extinction.get(e.ownerId)<=e.dateYear))extinction.set(e.ownerId,e.dateYear);
    if(e.kind==='STELLAR_DOOM')dooms.set(e.ownerId,[...(dooms.get(e.ownerId)??[]),e.dateYear].sort((a,b)=>a-b));
    if(e.kind==='LINEAGE_EXTINCTION')lineageEnd.set(e.ownerId,e.data?.outcome??null);
  }
  const last=t.observations?.at(-1),finalPop=last&&last.year===run.endYear?new Map(last.arcs.map(a=>[a.id,BigInt(a.pop)>0n])):null;
  const fates=arcs.map(a=>{
    const extinctionYear=extinction.get(a.id)??null,doomEnd=(dooms.get(a.id)??[]).find(y=>y>=doomEndYear)??null;
    return {id:a.id,body:a.body,lineageId:a.lineageId,isColony:!!a.isColony,dead:extinctionYear!==null,extinctionYear,
      doomYears:dooms.get(a.id)??[],stellarDoomEnd:doomEnd!==null&&extinctionYear!==null&&doomEnd<=extinctionYear,
      finalPopPositive:finalPop?finalPop.get(a.id)??false:null};
  });
  const arrivals=events.filter(e=>e.kind==='COLONY_FOUNDED').map(e=>{
    const launch=(e.causes??[]).map(c=>launchById.get(c.eventId)).find(Boolean)??null;
    return {seed:run.seed,id:e.id,dateYear:e.dateYear,destination:e.ownerId,rejected:e.data?.outcome==='rejected',launch};
  });
  const lineages=[...new Set([...arcs.map(a=>a.lineageId),...lineageEnd.keys()])].filter(Boolean).sort(cmp);
  return {arcs:fates,launches,arrivals,lineages,lineageEnd,doomYear,doomEndYear};
}

const lineageAlive=(f,id)=>!f.lineageEnd.has(id);
const survivor=run=>Array.isArray(run.classes)&&run.classes.some(c=>!extinctClass(c)&&!['ERROR','NO_LINEAGE','PENDING_ORIGIN'].includes(c));
const launchRow=l=>({seed:l.seed,id:l.id,dateYear:l.dateYear,source:l.source,destination:l.destination,arrivalYear:l.arrivalYear,transportTier:l.transportTier});

// Seeds the CLI re-runs at jobs=1 for I7: seed 0 plus the first surviving seed;
// if no seed survives, the run with the most accepted events (ties by run order).
export function rerunSeeds(runs) {
  const seeds=[SEED0],alive=runs.find(r=>r.seed!==SEED0&&survivor(r));
  if(alive)return {seeds:[...seeds,alive.seed],choice:'first surviving seed'};
  const busy=runs.filter(r=>r.seed!==SEED0).reduce((best,r)=>(r.timeline?.events?.length??0)>(best?.timeline?.events?.length??-1)?r:best,null);
  return {seeds:busy?[...seeds,busy.seed]:seeds,choice:'no surviving seed; busiest other seed'};
}
// Seeds whose persons/rejection reasons need a raw in-process run (summarizeRun drops params and reason).
export function detailSeeds(runs,opts={}) {
  return runs.filter(r=>r.outcome!=='ERROR').filter(r=>{const f=runFacts(r,opts);
    return f.launches.some(l=>l.dateYear>=f.doomYear&&l.dateYear<f.doomEndYear&&inHome(l.source))||f.arrivals.some(a=>a.rejected);
  }).map(r=>r.seed);
}

export function audit(runs,{reruns=[],details={},expectedSeed0Digest=SEED0_DIGEST,doomYear=DOOM_YEAR,doomEndYear=DOOM_END_YEAR}={}) {
  const opts={doomYear,doomEndYear},per=runs.map(run=>({run,f:runFacts(run,opts)}));
  const all=key=>per.flatMap(({f})=>f[key]);
  const launches=all('launches'),arrivals=all('arrivals');
  const inv=(id,title,violations,extra={})=>({id,title,pass:violations.length===0,violations,...extra});
  const lateHome=launches.filter(l=>l.dateYear>=doomYear&&inHome(l.source));

  const I1=inv('I1',`zero accepted LAUNCH dated >= ${doomYear} from an ${HOME_SYSTEM} body to any ${HOME_SYSTEM}:* body`,
    lateHome.filter(l=>inHome(l.destination)).map(launchRow),
    {note:`Gated on ${HOME_SYSTEM} launchers: m5-stellar-2 does not restrict launchers on undoomed worlds, so returns from ${REFUGE_SYSTEMS.join('/')} to ${HOME_BODY} are reported (reported.returnsToHome) and appear in I8 when rejected.`});
  const I2=inv('I2',`every accepted LAUNCH dated >= ${doomYear} from an ${HOME_SYSTEM} body targets ${REFUGE}`,
    lateHome.filter(l=>l.destination!==REFUGE).map(launchRow));
  const I3=inv('I3',`zero accepted LAUNCH dated >= ${doomEndYear} from any ${HOME_SYSTEM} body`,
    launches.filter(l=>l.dateYear>=doomEndYear&&inHome(l.source)).map(launchRow));
  const I4=inv('I4',`no ${HOME_SYSTEM} arc alive at the horizon; every ${HOME_SYSTEM} arc existing at ${doomEndYear} died with STELLAR_DOOM`,
    per.flatMap(({run,f})=>f.arcs.filter(a=>inHome(a.body)).flatMap(a=>{
      const v=[];
      if(!a.dead)v.push('alive at horizon (no EXTINCTION event)');
      if(a.finalPopPositive)v.push('population > 0 in the final observation');
      if(a.dead&&a.extinctionYear>=doomEndYear&&!a.stellarDoomEnd)v.push(`existed at ${doomEndYear} but EXTINCTION at ${a.extinctionYear} has no STELLAR_DOOM at or after ${doomEndYear} before it`);
      return v.map(problem=>({seed:run.seed,arc:a.id,body:a.body,extinctionYear:a.extinctionYear,doomYears:a.doomYears,problem}));
    })),{method:'Arc death from accepted EXTINCTION events per arc (timeline.arcs has no population); STELLAR_DOOM dated >= doom-end and <= the EXTINCTION year counts as the cause; the final observation pop is a cross-check.'});
  const I5=inv('I5',`every lineage not EXTINCT_* at the horizon has a living arc in ${REFUGE_SYSTEMS.join('/')} and firstEras[6] non-null before ${doomEndYear}`,
    per.flatMap(({run,f})=>{
      if(run.outcome==='ERROR')return [];
      const v=[],extinctOnly=Array.isArray(run.classes)&&run.classes.length>0&&run.classes.every(extinctClass);
      for(const id of f.lineages.filter(id=>lineageAlive(f,id))) {
        const living=f.arcs.filter(a=>a.lineageId===id&&!a.dead&&REFUGE_SYSTEMS.includes(systemOf(a.body)));
        if(!living.length)v.push({seed:run.seed,lineage:id,problem:`no living arc in ${REFUGE_SYSTEMS.join('/')}`});
        else if(living.every(a=>a.finalPopPositive===false))v.push({seed:run.seed,lineage:id,problem:'refuge arcs have no population in the final observation'});
        const e6=run.firstEras?.[6]??null;
        if(e6===null||e6>=doomEndYear)v.push({seed:run.seed,lineage:id,firstEra6:e6,problem:`firstEras[6] not before ${doomEndYear}`});
        if(extinctOnly)v.push({seed:run.seed,lineage:id,problem:`no LINEAGE_EXTINCTION but run classes are ${run.classes.join('+')}`});
      }
      return v;
    }),{method:'Lineage end from LINEAGE_EXTINCTION events; living arc = no EXTINCTION event (cross-checked against the final observation pop).'});
  const I6=inv('I6','no ERROR seed',runs.filter(r=>r.outcome==='ERROR'||r.classes?.includes('ERROR')).map(r=>({seed:r.seed,explanation:r.explanation??null})));
  const seed0=runs.find(r=>r.seed===SEED0),i7=[];
  if(seed0&&seed0.resultDigest!==expectedSeed0Digest)i7.push({seed:SEED0,expected:expectedSeed0Digest,observed:seed0.resultDigest??null,hint:SEED0_HINT});
  for(const x of reruns){const r=runs.find(r=>r.seed===x.seed);if(!r||r.resultDigest!==x.resultDigest)i7.push({seed:x.seed,mode:x.mode,ensemble:r?.resultDigest??null,rerun:x.resultDigest??null});}
  const I7=inv('I7',`determinism: ${SEED0} resultDigest = ${expectedSeed0Digest.slice(0,8)}…; re-runs at jobs=1 identical`,i7,
    {skipped:!seed0&&!reruns.length,seed0Digest:seed0?.resultDigest??null,reruns:reruns.map(x=>({seed:x.seed,mode:x.mode,resultDigest:x.resultDigest,identical:runs.find(r=>r.seed===x.seed)?.resultDigest===x.resultDigest}))});
  const singleLineage=new Map(per.map(({run,f})=>[run.seed,f.lineages.length<=1]));
  const rejections=arrivals.filter(a=>a.rejected).map(a=>{
    const reported=details[a.seed]?.reasons?.[a.id];
    const reason=reported??(singleLineage.get(a.seed)?'destination-uninhabitable':'unclassified');
    const l=a.launch,category=!l?'no linked launch':
      l.launchYear<doomYear&&inHome(l.source)&&inHome(l.destination)&&l.arrivalYear>=doomEndYear?'pre-doom in-system voyage arriving at or after doom-end':
      systemOf(l.source)==='stub:s01'&&l.destination===HOME_BODY?'s01 -> s00:b0 return':'other';
    return {seed:a.seed,id:a.id,dateYear:a.dateYear,destination:a.destination,reason,reasonSource:reported?'raw event':'derived (single-lineage domain: occupied-by-other-lineage impossible)',
      launchYear:l?.launchYear??null,arrivalYear:l?.arrivalYear??null,source:l?.source??null,category};
  });
  const I8=inv('I8','every destination-uninhabitable rejection is a pre-25,000 in-system voyage arriving >= 25,500 or an s01 -> s00:b0 return',
    rejections.filter(x=>x.reason==='unclassified'||x.reason==='destination-uninhabitable'&&!['pre-doom in-system voyage arriving at or after doom-end','s01 -> s00:b0 return'].includes(x.category)),
    {rejections,method:'Rejected COLONY_FOUNDED linked to its LAUNCH through causes; summarizeRun drops e.reason, so the reason comes from the raw detail run when present, otherwise it is derived.'});
  const invariants=[I1,I2,I3,I4,I5,I6,I7,I8];

  // Reported, not gated.
  const outcomeClasses={},outcomes={};
  for(const r of runs){for(const c of r.classes??['ERROR'])outcomeClasses[c]=(outcomeClasses[c]??0)+1;outcomes[r.outcome]=(outcomes[r.outcome]??0)+1;}
  const sortObj=o=>Object.fromEntries(Object.entries(o).sort(([a],[b])=>cmp(a,b)));
  const survivors=runs.filter(survivor).map(r=>({seed:r.seed,outcome:r.outcome,firstEra6:r.firstEras?.[6]??null,viaTier7:r.firstEras?.[6]!=null&&r.firstEras[6]<doomEndYear}));
  const by=(fn,year)=>runs.filter(r=>fn(r)!=null&&fn(r)<=year).map(r=>({seed:r.seed,year:fn(r)}));
  const grace=launches.filter(l=>l.dateYear>=doomYear&&l.dateYear<doomEndYear&&inHome(l.source)).map(l=>{
    const persons=details[l.seed]?.persons?.[l.id]??null;return {...launchRow(l),persons};});
  const knownPersons=grace.filter(g=>g.persons!==null);
  const companionLaunches=launches.filter(l=>l.dateYear<doomYear&&inHome(l.source)&&inHome(l.destination)&&l.destination!==HOME_BODY);
  const companions=per.flatMap(({run,f})=>f.arcs.filter(a=>inHome(a.body)&&a.body!==HOME_BODY).map(a=>({seed:run.seed,arc:a.id,body:a.body,extinctionYear:a.extinctionYear,
    fate:!a.dead?'alive':a.extinctionYear<doomYear?'died before doom':a.extinctionYear<doomEndYear?'died in grace window':a.stellarDoomEnd?'died at doom-end (STELLAR_DOOM)':'died at/after doom-end, other cause'})));
  const fateCounts=sortObj(companions.reduce((o,c)=>({...o,[c.fate]:(o[c.fate]??0)+1}),{}));
  const refuge=per.filter(({run})=>survivor(run)).map(({run,f})=>{
    const accepted=f.arrivals.filter(a=>a.destination===REFUGE&&!a.rejected),fromHome=accepted.filter(a=>inHome(a.launch?.source));
    const latestArrival=fromHome.reduce((n,a)=>Math.max(n,a.launch.arrivalYear),-Infinity);
    return {seed:run.seed,arrivals:accepted.map(a=>({dateYear:a.dateYear,source:a.launch?.source??null,launchYear:a.launch?.launchYear??null,arrivalYear:a.launch?.arrivalYear??null})),
      firstArrival:accepted[0]?.dateYear??null,latestHomeSourcedArrivalYear:fromHome.length?latestArrival:null,
      withinLatestPossible:!fromHome.length||latestArrival<=doomEndYear-1+INTERSTELLAR_YEARS};
  });
  const reported={
    outcomeClasses:sortObj(outcomeClasses),outcomes:sortObj(outcomes),survivors,
    survivorsOnlyViaTier7:survivors.every(s=>s.viaTier7),
    eraE5By25000:{count:by(r=>r.firstEras?.[5],doomYear).length,seeds:by(r=>r.firstEras?.[5],doomYear),record:'4/30 E5plus over 30,000 years (docs/evidence/m4-plausibility-after.json, pre-neighbours fixture)'},
    energy5By25000:{count:by(r=>r.firstEnergy?.[5],doomYear).length,seeds:by(r=>r.firstEnergy?.[5],doomYear),note:'evacuation gate: energy tier >= 5 at the doom year'},
    tier7Before25500:runs.filter(r=>r.firstEras?.[6]!=null&&r.firstEras[6]<doomEndYear).map(r=>({seed:r.seed,year:r.firstEras[6]})),
    graceWindowLaunches:{count:grace.length,wasted:grace.filter(g=>inHome(g.destination)).length,wastedNote:'old "2/7 wasted on b1/b2" metric; must read 0 under m5-stellar-2',
      personsKnown:knownPersons.length,persons:knownPersons.length?String(knownPersons.reduce((n,g)=>n+BigInt(g.persons),0n)):null,launches:grace},
    preDoomCompanionLaunches:{count:companionLaunches.length,launches:companionLaunches.map(launchRow),companionColonies:companions.length,fates:fateCounts,colonies:companions},
    trigger:{metric:`seeds with firstEnergy[6] < ${doomYear}`,count:runs.filter(r=>r.firstEnergy?.[6]!=null&&r.firstEnergy[6]<doomYear).length,expected:0,
      seeds:runs.filter(r=>r.firstEnergy?.[6]!=null&&r.firstEnergy[6]<doomYear).map(r=>({seed:r.seed,year:r.firstEnergy[6]}))},
    refugeArrivals:refuge,
    returnsToHome:launches.filter(l=>l.dateYear>=doomYear&&inHome(l.destination)&&!inHome(l.source)).map(launchRow),
  };
  return {version:VERSION,scenario:SCENARIO,n:runs.length,doomYear,doomEndYear,pass:invariants.every(i=>i.pass),invariants,reported,
    method:{arcs:'timeline.arcs (seenArcs) has no final populations: arc death is derived from EXTINCTION events per arc, lineage death from LINEAGE_EXTINCTION; the final observation pop is a cross-check.',
      persons:'summarizeRun drops LAUNCH params, so persons come from an in-process raw run of the seeds that need them (--no-detail skips it).',
      label:'seeded scenarios, model attribution, not predictions'}};
}

export function render(report) {
  const lines=[`M5 doomed-star audit (${report.version}): seeded scenarios, model attribution, not predictions`,
    `N=${report.n}; doom ${report.doomYear}; doom-end ${report.doomEndYear}; verdict ${report.pass?'PASS':'FAIL'}`,'','Hard invariants:'];
  for(const i of report.invariants){
    lines.push(`${i.id} ${i.skipped?'SKIPPED':i.pass?'PASS':'FAIL'}  ${i.title}${i.violations.length?` (${i.violations.length} violations)`:''}`);
    for(const v of i.violations.slice(0,20))lines.push('    '+JSON.stringify(v));
    if(i.note)lines.push('    note: '+i.note);
  }
  const I7=report.invariants.find(i=>i.id==='I7'),I8=report.invariants.find(i=>i.id==='I8'),r=report.reported;
  lines.push('',`I7 seed 0 digest: ${I7.seed0Digest}`);for(const x of I7.reruns)lines.push(`I7 rerun ${x.seed} (${x.mode}): ${x.resultDigest} ${x.identical?'identical':'DIFFERENT'}`);
  lines.push(`I8 rejections (${I8.rejections.length}):`);for(const x of I8.rejections)lines.push('    '+JSON.stringify(x));
  lines.push('','Reported (not gated):',`Outcome classes ${JSON.stringify(r.outcomeClasses)}`,`Outcomes ${JSON.stringify(r.outcomes)}`,
    `Survivors ${JSON.stringify(r.survivors)}; only via tier 7: ${r.survivorsOnlyViaTier7}`,
    `Era E5 by ${report.doomYear}: ${r.eraE5By25000.count} ${JSON.stringify(r.eraE5By25000.seeds)} (record ${r.eraE5By25000.record})`,
    `Energy tier 5 by ${report.doomYear}: ${r.energy5By25000.count} ${JSON.stringify(r.energy5By25000.seeds)}`,
    `Tier 7 (firstEras[6]) before ${report.doomEndYear}: ${JSON.stringify(r.tier7Before25500)}`,
    `Grace-window launches [${report.doomYear}, ${report.doomEndYear}) from ${HOME_SYSTEM}: ${r.graceWindowLaunches.count}; wasted on ${HOME_SYSTEM}: ${r.graceWindowLaunches.wasted}; persons ${r.graceWindowLaunches.persons??'n/a'} (${r.graceWindowLaunches.personsKnown}/${r.graceWindowLaunches.count} known)`);
  for(const g of r.graceWindowLaunches.launches)lines.push('    '+JSON.stringify(g));
  lines.push(`Pre-doom launches to ${HOME_SYSTEM} companions: ${r.preDoomCompanionLaunches.count}; companion colonies ${r.preDoomCompanionLaunches.companionColonies}; fates ${JSON.stringify(r.preDoomCompanionLaunches.fates)}`,
    `Trigger (${r.trigger.metric}): ${r.trigger.count} (expected ${r.trigger.expected}) ${JSON.stringify(r.trigger.seeds)}`,
    `Returns to ${HOME_SYSTEM} dated >= ${report.doomYear} from other systems: ${r.returnsToHome.length}`);
  for(const x of r.returnsToHome)lines.push('    '+JSON.stringify(x));
  lines.push(`COLONY_FOUNDED on ${REFUGE} per surviving seed (latest possible ${HOME_SYSTEM}-sourced arrival ${report.doomEndYear-1+INTERSTELLAR_YEARS}):`);
  for(const x of r.refugeArrivals)lines.push(`    ${x.seed}: first ${x.firstArrival}; latest ${HOME_SYSTEM}-sourced arrival ${x.latestHomeSourcedArrivalYear}; within ${x.withinLatestPossible}; ${x.arrivals.length} arrivals`);
  lines.push('',`Method: ${report.method.arcs}`,`Persons: ${report.method.persons}`);
  return lines.join('\n')+'\n';
}

// Raw in-process run: the same createScenario + compileSummary({observe:true}) as runSeed,
// keeping LAUNCH params.persons and rejected COLONY_FOUNDED reasons that summarizeRun drops.
export function detail(task) {
  const {world}=createScenario(task.scenario,task.seed,{untilYear:task.untilYear});
  const result=world.compileSummary({observe:true}),events=result.events.filter(e=>e.resolution==='accepted');
  return {seed:task.seed,resultDigest:result.resultDigest,
    persons:Object.fromEntries(events.filter(e=>e.kind==='LAUNCH'&&e.data.launch&&e.dateYear>=DOOM_YEAR).map(e=>[e.id,String(e.params.persons)])),
    reasons:Object.fromEntries(events.filter(e=>e.kind==='COLONY_FOUNDED'&&e.data.outcome==='rejected').map(e=>[e.id,e.reason]))};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
  const n=Number(arg('--n','30')),jobs=Number(arg('--jobs','2')),out=arg('--out','out/m5-doomed-star-audit.json');
  if(!Number.isSafeInteger(n)||n<1||!Number.isSafeInteger(jobs)||jobs<1)throw new RangeError('Require --n >= 1 and --jobs >= 1');
  if(!out.endsWith('.json'))throw new TypeError('--out must end in .json');
  const ms=start=>(Number(process.hrtime.bigint()-start)/1e6).toFixed(0)+' ms',t0=process.hrtime.bigint();
  const runs=await runEnsemble(ensemblePlan(n,{scenario:SCENARIO}),{jobs});
  process.stderr.write(`ensemble ${n} seeds at jobs=${jobs}: ${ms(t0)}\n`);
  const t1=process.hrtime.bigint(),pick=rerunSeeds(runs);
  const reruns=(await runEnsemble(pick.seeds.map(seed=>({scenario:SCENARIO,seed,untilYear:undefined})),{jobs:1})).map(r=>({seed:r.seed,mode:'runEnsemble jobs=1',resultDigest:r.resultDigest}));
  process.stderr.write(`I7 re-runs ${pick.seeds.join(', ')} (${pick.choice}): ${ms(t1)}\n`);
  const details={};
  if(!args.includes('--no-detail'))for(const seed of detailSeeds(runs)){
    const t2=process.hrtime.bigint(),d=detail({scenario:SCENARIO,seed,untilYear:undefined});details[seed]=d;
    reruns.push({seed,mode:'in-process detail',resultDigest:d.resultDigest});
    process.stderr.write(`detail ${seed}: ${ms(t2)}\n`);
  }
  const report={...audit(runs,{reruns,details}),rerunChoice:pick.choice,detailSeeds:Object.keys(details).sort(cmp)};
  mkdirSync(dirname(resolve(out)),{recursive:true});
  writeFileSync(out,JSON.stringify(report,null,2)+'\n');writeFileSync(out.slice(0,-5)+'.txt',render(report));
  process.stderr.write(`audit ${report.pass?'PASS':'FAIL'}; total ${ms(t0)}; wrote ${out} and ${out.slice(0,-5)}.txt\n`);
  if(!report.pass||report.invariants.some(i=>i.skipped))process.exitCode=1;
}
