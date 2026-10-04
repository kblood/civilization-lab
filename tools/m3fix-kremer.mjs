// Fixed before examining M3-fix results. Never filter or replace seeds.
// Observation-only analysis; no fixture or model mutation.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createPlanet} from '../src/planet.mjs';
import {readFixture,digest} from '../src/environment.mjs';
import {compare} from '../src/canonical.mjs';
import {lowerMedian} from '../src/ensemble.mjs';
import {gate,DOMAINS} from '../src/tech.mjs';
import {forced,region} from '../tests/civ-helpers.mjs';
export const PANEL=Object.freeze(Array.from({length:16},(_,i)=>`signature-${i}`));
const PLANETS=['temperate','cold-archipelago'],HORIZON=10000;
const output={status:'RUNNING',panel:[...PANEL],planets:PLANETS,horizon:HORIZON,recipeTicks:40000,
  medianRule:'lower median including 10001 for no E2 by 10000; also report attained-only median and censor count',
  initial:'Only r00 inhabited, pop=10000, every tier=1; ordinary hazard priors; deliveryYear=0',
  sources:[{url:'../../src/planet.mjs',confidence:'high',claim:'N_eff uses effective contact; DIFFUSION uses gap times effective contact.'},
    {url:'../transition-table-v1.md',confidence:'high',claim:'Cold fixture declares 10-ring, Kbase=1000, effective contact=25; temperate 12-ring, Kbase=5000, contact=500.'}],fixtures:{},runs:[],summary:{}};
mkdirSync('docs/evidence',{recursive:true});
const save=()=>writeFileSync('docs/evidence/m3fix-kremer.json',JSON.stringify(output,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n');
save(); // Freeze the complete panel on disk before evaluating any seed.
for(const name of PLANETS){
  const fixture=readFixture(`fixtures/planets/${name}.json`),regions=fixture.partition.value.regions,epochs=fixture.epochs.value.rows;
  output.fixtures[name]={digest:digest(fixture),profile:fixture.profile,regionCount:regions.length,
    totalKbase:epochs.filter(r=>r.fromEpoch==='0').reduce((n,r)=>n+BigInt(r.Kbase),0n),
    regions:regions.map(r=>({id:r.id,adjacency:r.adjacency.map(e=>({...e,effectiveContact:e.barrier?Math.floor(e.contactPermille/4):e.contactPermille}))})),epochs,
    initialR00Capacity:BigInt(epochs.find(r=>r.regionId==='r00').Kbase)*2500n/1000n};
  for(const seed of PANEL){
    const f=forced('SAPIENCE');f.base=`fixtures/planets/${name}.json`;f.seed=seed;f.ticks=40000;
    f.initial={...forced('DISCOVERY').initial,regions:[region('r00',{pop:'10000',tiers:[1,1,1,1,1,1,1]})]};f.overrides=[{key:'origin.deliveryYear',value:'0'}];
    const world=createPlanet(f.base,seed,{forced:f,untilYear:HORIZON}),plain=world.compileSummary(),view=world.run();
    if(view.resultDigest!==plain.resultDigest)throw new Error('Inspection changed digest: '+name+'/'+seed);
    const accepted=plain.events.filter(e=>e.resolution==='accepted'),steps=new Map(),gates=new Map();
    let neffSum=0n,popSum=0n,liveRegionTicks=0,neffMin=null,neffMax=0n;
    for(const ledger of view.ledgers){const a=ledger.phase0.state;
      for(const r of a.regions){if(r.pop===0n)continue;
        const neff=r.pop+world.def.edges.filter(e=>e.from===r.id).reduce((n,e)=>n+a.regions.find(v=>v.id===e.to).pop*BigInt(e.contact)/1000n,0n);
        neffSum+=neff;popSum+=r.pop;liveRegionTicks++;neffMin=neffMin===null||neff<neffMin?neff:neffMin;neffMax=neff>neffMax?neff:neffMax;
        for(let d=0;d<7;d++){const g=gate(r,d,world.def.planet.profile,a.polities.find(p=>p.id===r.polityId));const key=`${DOMAINS[d]}:${r.tiers[d]+1}:${g.eligible?'eligible':'blocked'}:${g.ceilings.map(c=>c.reason).join(',')}`;gates.set(key,(gates.get(key)??0)+1);}
      }
    }
    for(const e of accepted.filter(e=>['AGRICULTURE','DISCOVERY','DIFFUSION'].includes(e.kind))){
      const key=[e.kind,e.data.target??e.ownerId,e.params.domainIndex,e.params.targetTier].join('|');steps.set(key,(steps.get(key)??0)+1);
    }
    const first=accepted.find(e=>e.kind==='ENERGY_TRANSITION'&&Number(e.params.toEra)>=2)?.dateYear??null;
    const row={planet:name,seed,firstE2:first,censored:first===null,resultDigest:plain.resultDigest,manifestDigest:plain.manifestDigest,recipeDigest:plain.recipeDigest,
      priors:plain.state.scenarioParams,exposures:plain.exposures,neff:{sum:neffSum,populationSum:popSum,liveRegionTicks,min:neffMin,max:neffMax,meanExact:`${neffSum}/${liveRegionTicks}`},
      gateOpportunityTicks:[...gates].sort((a,b)=>compare(a[0],b[0])).map(([key,count])=>({key,count})),
      acceptedTierSteps:[...steps].sort((a,b)=>compare(a[0],b[0])).map(([key,count])=>({key,count})),
      acceptedKindCounts:[...new Set(accepted.map(e=>e.kind))].sort(compare).map(kind=>({kind,count:accepted.filter(e=>e.kind===kind).length}))};
    output.runs.push(row);save();console.log(`${name}/${seed}: E2 ${first??'censored'}; digest ${plain.resultDigest}`);
  }
  const own=output.runs.filter(r=>r.planet===name),times=own.map(r=>r.firstE2??10001);
  output.summary[name]={times,median:lowerMedian(times),attainedMedian:lowerMedian(own.map(r=>r.firstE2)),censored:own.filter(r=>r.censored).length,
    diffusionOpportunityTicks:own.reduce((n,r)=>n+r.exposures.find(e=>e.kind==='DIFFUSION').opportunityTicks,0),
    tierStepCount:own.reduce((n,r)=>n+r.acceptedTierSteps.reduce((n,s)=>n+s.count,0),0)};
}
output.status='OBSERVED';output.modelChanges=[];output.fixtureChanges=[];output.changedGoldens=[];
output.conclusion=output.summary['cold-archipelago'].median>output.summary.temperate.median?'16-seed direction MET; four-seed regression still reported separately':'16-seed direction NOT MET; no unsupported tuning';
save();console.log(JSON.stringify(output.summary,null,2));console.log(output.conclusion);
