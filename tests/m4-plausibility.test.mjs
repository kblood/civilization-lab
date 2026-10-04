import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aggregate,quantile} from '../tools/m4-plausibility.mjs';
import {createDomain} from '../src/domain.mjs';
import {forced} from './civ-helpers.mjs';
test('integer lower quantiles keep the lower middle and do not interpolate',()=>{
  assert.equal(quantile([],50),null);assert.equal(quantile([9,1,5,3],10),1);
  assert.equal(quantile([9,1,5,3],50),3);assert.equal(quantile([9,1,5,3],90),5);
});
test('streamed perils observations exactly match inspection and cannot mutate histories',()=>{
  const f=forced('SPACEFLIGHT');f.base='fixtures/planets/home-system.json';f.initial.arc.perils='exited';f.ticks=3;
  const world=createDomain(f.base,f.seed,{forced:f}),observed=[];
  const streamed=world.compileSummary({onPerilsTick:row=>{assert.ok(Object.isFrozen(row)&&Object.isFrozen(row.exitedArcs));observed.push(row);}});
  const inspected=world.run();assert.equal(streamed.resultDigest,inspected.resultDigest);
  assert.deepEqual(observed,inspected.ledgers.map(l=>({tick:l.ledger.tick,exitedArcs:l.planets.filter(p=>p.pre.perils==='exited').map(p=>p.id).sort()})));
  assert.ok(observed.some(row=>row.exitedArcs.length));
});
test('duration observations, both censors, no-lineage and errors exhaust N',()=>{
  const row=(startedEra,firstEras)=>({seed:String(startedEra),classes:[],lineageClasses:[],startedEra,firstEras,multiBody:false,
    extinctionEvents:{},colonisation:{LAUNCH:0,COLONY_FOUNDED:0,newColonies:0,reinforcements:0,COLONY_LOST:0,VOYAGE_LOST:0,repeatLaunchesToFailedTarget:0,rejected:{}},
    colonyArcs:3,colonyDeathAges:[1040,1300],collapses:0,perilsCollapses:0,latePostExitEvents:0,latePostExitKinds:{}});
  const s=aggregate('fixture',[row(3,[0,0,0,0,100,null,null,null]),row(4,[0,0,0,0,0,null,null,null]),
    row(0,[0,null,null,null,null,null,null,null]),row(null,Array(8).fill(null)),{...row(null,Array(8).fill(null)),classes:['PENDING_ORIGIN']},{seed:'error',error:'fixture'}]);
  const d=s.durations.find(d=>d.from===3&&d.to===4);
  assert.deepEqual([d.observed,d.p50,d.leftCensored,d.rightCensored,d.noLineage,d.errors,d.sourceNotReached],[1,100,1,1,1,1,1]);
  assert.equal(d.observed+d.leftCensored+d.rightCensored+d.noLineage+d.pendingOrigin+d.errors,s.N);
  assert.equal(d.pendingOrigin,1);
  assert.deepEqual(s.colonyDeaths,{count:10,p10:1040,p50:1040,p90:1300,within200YearsAfterReserve:5,rightCensored:5});
  assert.deepEqual(s.reach.E4,{count:2,N:6,permille:333});
});

test('pending origins are distinct from true no-lineage and stay in N',async()=>{
  const {createScenario}=await import('../src/scenario.mjs');
  const {summarizeRun,aggregate:ensembleAggregate}=await import('../src/ensemble.mjs');
  const {world}=createScenario('lonely-earthlike','pending-label',{untilYear:10});
  const result=world.compileSummary(),task={scenario:'lonely-earthlike',seed:'pending-label'};
  const pending=summarizeRun(task,world,{...result,outcomes:[],state:{...result.state,lineages:[],origins:[{status:'pending',deliveryTick:100n}]}});
  assert.equal(pending.outcome,'PENDING_ORIGIN');assert.equal(pending.flags.noLineage,false);
  const absent=summarizeRun(task,world,{...result,outcomes:[],state:{...result.state,lineages:[],origins:[{status:'no-lineage',deliveryTick:null}]}});
  assert.equal(absent.outcome,'NO_LINEAGE');assert.equal(ensembleAggregate([pending,absent]).n,2);
});
