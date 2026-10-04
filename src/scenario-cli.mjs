import {createScenario} from './scenario.mjs';
import {narrative} from './narrative.mjs';
import {inspectionTicks} from './inspection.mjs';
import {regionContract,cellDefinition} from './refinement-contract.mjs';
import {refineCell,aggregateCells} from './refine-cell.mjs';
import {refineYear,aggregateYears} from './refine-year.mjs';
import {checkProjection} from './levels.mjs';
import {annualHierarchy} from './annual-inspection.mjs';
import {aggregateYearTree} from './refine-year.mjs';
export function scenarioCLI(name,seed,untilYear){
  const {scenario,world,domain}=createScenario(name,seed,{untilYear});
  if(world.status)throw new Error(world.status+': '+world.reason);
  const result=domain?world.compileSummary({observe:true,inspectSampleTicks:[world.def.fromTick,(world.def.fromTick+world.def.untilTick)/2n,world.def.untilTick-1n].map(String)}):world.run(),ticks=inspectionTicks(world,result,domain),story=narrative(world.def,result.events);
  console.log(`Scenario ${scenario.id}; seed ${seed}; through year ${result.state.tick*10n}; ${result.events.length} events.`);
  console.log(`Outcome: ${result.outcome}; maximum era E${result.maxEra}.`);
  const first=new Map();
  for(const t of ticks)for(const [year,state] of [[Number(t.tick*10n),t.pre],[Number((t.tick+1n)*10n),t.end]])for(const r of state.regions)if(r.pop>0n&&(!first.has(r.era)||year<first.get(r.era)))first.set(r.era,year);
  if(domain){first.clear();result.firstEras.forEach((year,era)=>{if(year!==null)first.set(era,year);});}
  for(const [era,year] of [...first].sort((a,b)=>a[0]-b[0]))console.log(`E${era} first reached: ${year}`);
  if(!first.size)console.log('Era first reached: none (no lineage in this interval).');
  const byId=new Map(result.events.map(e=>[e.id,e])),label=e=>e?`${e.kind}@${e.dateYear} (${e.ownerId})`:'genesis';
  console.log('Most salient events (model attribution):');
  for(const row of story.chronicle){const e=byId.get(row.eventId);console.log(`${label(e)}; causes ${e.causes.map(c=>`${c.edge}: ${label(byId.get(c.eventId))}`).join(', ')||'none'}`);}
  let checked=0;
  for(const t of ticks.filter((_,i)=>i===0||i===ticks.length-1||i===Math.floor(ticks.length/2)))for(const r of t.pre.regions){
    const contract=regionContract(t.def,t.start,t.pre,t.end,t.updates,t.events,r.id,t.regionHistory[r.id]),address={regionId:r.id,tick:t.tick};
    const c=checkProjection(cellDefinition(t.def,r.localId),contract,address,refineCell,aggregateCells);
    const annual={tick:String(t.tick),start:{pop:r.pop},end:{pop:t.end.regions.find(x=>x.id===r.id).pop},naturalDelta:contract.naturalDelta};
    const y=checkProjection({},annual,address,refineYear,aggregateYears);
    if(c.status!=='ok'||y.status!=='ok')throw new Error(`REFINEMENT_CONTRACT_ERROR ${r.id}: ${c.reason??y.reason}`);checked++;
  }
  for(const t of ticks.filter((_,i)=>i===0||i===ticks.length-1||i===Math.floor(ticks.length/2)))aggregateYearTree(annualHierarchy(t));
  console.log(`Level consistency: PASS (${checked} sampled region-ticks; exact C/region/arc sums at every annual sample of sampled ticks).`);
  console.log(`Manifest digest: ${result.manifestDigest}\nRecipe digest: ${result.recipeDigest}\nResult digest: ${result.resultDigest}\nNarrative digest: ${story.narrativeDigest}`);
}
