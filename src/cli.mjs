#!/usr/bin/env node
import { createToy } from './toy.mjs';
import { createPlanet, salientEvents } from './planet.mjs';
import { IMPLEMENTED } from './catalogue.mjs';
import { compareEvents } from './events.mjs';
import {createDomain} from './domain.mjs';
import {scenarioCLI} from './scenario-cli.mjs';
import {ensemblePlan,runEnsemble,aggregate,DEFAULT_JOBS} from './ensemble.mjs';
import {writeReport,aggregateText} from './report.mjs';
import {SCENARIOS} from './scenario.mjs';
const args=process.argv.slice(2), value=key=>args[args.indexOf(key)+1];
if(args.includes('--ensemble')) {
  const tasks=ensemblePlan(Number(value('--ensemble')),{scenario:args.includes('--scenario')?value('--scenario'):undefined,untilYear:args.includes('--until-year')?Number(value('--until-year')):undefined});
  const runs=await runEnsemble(tasks,{jobs:args.includes('--jobs')?Number(value('--jobs')):DEFAULT_JOBS,timings:true});
  const timelines=[...new Set(args.flatMap((a,i)=>a==='--timeline'?[args[i+1]]:[]))].sort();
  const extras=timelines.filter(seed=>!runs.some(r=>r.seed===seed)).map(seed=>{const scenario=args.includes('--scenario')?value('--scenario'):SCENARIOS.find(s=>seed.startsWith(s+'-'));if(!scenario)throw new Error('Timeline seed needs a scenario prefix or --scenario');return {scenario,seed,untilYear:args.includes('--until-year')?Number(value('--until-year')):undefined};});
  const extraRuns=extras.length?await runEnsemble(extras,{jobs:args.includes('--jobs')?Number(value('--jobs')):DEFAULT_JOBS}):[];
  const files=writeReport(runs,{out:args.includes('--out')?value('--out'):'out',timelines,extraRuns});
  console.log(aggregateText(aggregate(runs)));console.log('SVG files:\n'+files.join('\n'));
  if([...runs,...extraRuns].some(r=>r.flags.error))process.exitCode=1;
} else if(args.includes('--scenario')) {
  scenarioCLI(value('--scenario'),args.includes('--seed')?value('--seed'):'s1',args.includes('--until-year')?Number(value('--until-year')):undefined);
} else if(args.includes('--domain')) {
  const fixture=value('--domain'),seed=args.includes('--seed')?value('--seed'):'toy-1';
  const world=createDomain(fixture,seed,{years:args.includes('--years')?Number(value('--years')):undefined});
  if(world.status){console.log(`${world.status}: ${world.reason}`);process.exitCode=1;}
  else {
  const r=world.compileSummary();
  if(args.includes('--digest'))console.log(r.resultDigest);
  else {
    console.log(`M2b ${world.def.domain.id}; seed ${seed}; through year ${r.state.tick*10n}; ${r.events.length} events.`);
    console.log(`Outcome: ${r.outcome}; maximum era E${r.maxEra}; arcs ever founded ${r.state.lineages.reduce((n,l)=>n+l.foundedArcs,0)}.`);
    for(const l of r.outcomes)console.log(`${l.id}: ${l.outcome}`);
    const byId=new Map(r.events.map(e=>[e.id,e]));
    const label=e=>e?`${e.kind}@${e.dateYear} (${e.ownerId})`:'genesis';
    console.log('Most salient events (model attribution; at most three per kind):');
    for(const e of salientEvents(r.events))console.log(`${label(e)}; causes ${e.causes.map(c=>`${c.edge}: ${label(byId.get(c.eventId))}`).join(', ')||'none'}`);
    console.log('Event counts:');for(const k of IMPLEMENTED)console.log(`${k.kind}: ${r.events.filter(e=>e.kind===k.kind).length}`);
    console.log(`Manifest digest: ${r.manifestDigest}\nRecipe digest: ${r.recipeDigest}\nResult digest: ${r.resultDigest}\nD root: ${r.dRoot}`);
    for(const a of r.arcRoots)console.log(`${a.id}: ${a.root}`);
  }
  }
} else if(args.includes('--civ')) {
  const fixture=value('--civ'),seed=args.includes('--seed')?value('--seed'):'civ-m2a-1',years=args.includes('--years')?Number(value('--years')):20000;
  const world=createPlanet(fixture,seed,{years});
  if(world.status){console.log(`${world.status}: ${world.reason}`);process.exitCode=1;}
  else {
    const result=world.compileSummary();
    if(args.includes('--digest'))console.log(result.resultDigest);
    else {
      console.log(`M2b ${fixture}; seed ${seed}; ${result.ticks*10} years; ${result.state.regions.length} regions; ${result.events.length} events.`);
      console.log(`Outcome: ${result.outcome}; population ${result.state.regions.reduce((n,r)=>n+r.pop,0n)}; era E${result.state.outcome.industrialEra}; live polities ${result.state.polities.length}.`);
      console.log(`Maximum era: E${result.maxEra}; first reached at year ${result.firstReachedYear}.`);
      console.log('Event counts (all / accepted / openers / steps / pre-empted / eligible hazard opportunity-ticks):');
      for(const k of IMPLEMENTED){const es=result.events.filter(e=>e.kind===k.kind);console.log(`${k.kind}: ${es.length} / ${es.filter(e=>e.resolution==='accepted').length} / ${es.filter(e=>['OUTBREAK','DECLARED'].includes(e.data.stage)).length} / ${es.filter(e=>e.phase===3).length} / ${es.filter(e=>e.resolution==='pre-empted').length} / ${k.trigger==='hazard'?result.exposures.find(e=>e.kind===k.kind).opportunityTicks:'n/a'}`);}
      console.log('Most salient events (model attribution):');
      const byId=new Map(result.events.map(e=>[e.id,e]));
      const label=e=>`${e.kind}@${e.dateYear} (${e.ownerId.replaceAll(world.def.arcId+'#','').replaceAll(world.def.arcId,'arc')})`;
      for(const e of salientEvents(result.events))console.log(`${label(e)}; causes ${e.causes.map(c=>`${c.edge}: ${label(byId.get(c.eventId))}`).join(', ')||'none'}`);
      console.log(`Manifest digest: ${result.manifestDigest}\nRecipe digest: ${result.recipeDigest}\nResult digest: ${result.resultDigest}`);
    }
  }
} else {
const toy = createToy();
const root = toy.resultDigest();
if (process.argv.includes('--digest')) console.log(root);
else {
  const chapters = [toy.chapter(0), toy.chapter(1)];
  console.log(`Toy civ-toy-1: 12,800 years, 1 region, ${chapters.reduce((n, c) => n + c.events.length, 0)} events; final population ${chapters[1].ledgers.at(-1).endState.pop}.`);
  console.log(`Result digest: ${root}`);
}
}
