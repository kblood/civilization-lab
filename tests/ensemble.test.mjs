import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aggregate,ensemblePlan,fraction,causalExplanation,METRICS,runEnsemble,summarizeRun} from '../src/ensemble.mjs';
test('hand-built summaries have exact counts, lower medians, explanations and observed bands',()=>{
  const rows=[['EXTINCT_SELF',{extinctSelf:true,extinct:true,industrialE3:true},['RUNAWAY_TECH'],10],['EXTANT_MULTI_BODY',{interplanetary:true,collapseRecovery:true,industrialE3:true},[],30],['NO_LINEAGE',{noLineage:true},[],null],['EXISTENTIAL_CAP',{existentialCap:true},[],50]].map(([outcome,flags,causes,time],i)=>({scenario:'fixture',seed:String(i),classes:[outcome],outcome,flags,causes,timeE2:time,timeE3:time,explanation:outcome+': fixture'}));
  const a=aggregate(rows.reverse());assert.equal(a.n,4);assert.equal(a.medianE2,30);assert.equal(a.medianE3,30);
  assert.equal(a.table.find(r=>r.metric==='industrialE3').fraction,'2/4 (50.0%)');assert.equal(a.table.find(r=>r.metric==='atomicE4').fraction,'0/4 (0.0%)');
  const expected={industrialE3:2,interplanetary:1,extinct:1,extinctSelf:1,noLineage:1,collapseRecovery:1,existentialCap:1};
  assert.deepEqual(a.table,METRICS.map(metric=>({metric,k:expected[metric]??0,n:4,fraction:`${expected[metric]??0}/4 (${(expected[metric]??0)*25}.0%)`})));
  assert.equal(a.outcomes.find(r=>r.outcome==='EXTINCT_SELF').causes[0].kind,'RUNAWAY_TECH');assert.equal(a.outcomes.find(r=>r.outcome==='EXTINCT_SELF').causes[0].count,1);
  assert.deepEqual(a.bands.map(b=>b.verdict),Array(6).fill('PASS'));assert.deepEqual(a.explanations,['fixture/0: EXTINCT_SELF: fixture','fixture/1: EXTANT_MULTI_BODY: fixture','fixture/2: NO_LINEAGE: fixture','fixture/3: EXISTENTIAL_CAP: fixture']);
  assert.deepEqual(aggregate(rows.slice(0,1)).bands.map(b=>b.verdict),['FAIL','FAIL','FAIL','FAIL','FAIL','FAIL']);
  assert.equal(fraction(1,3),'1/3 (33.3%)');assert.equal(fraction(2,3),'2/3 (66.6%)');
  assert.deepEqual(ensemblePlan(6).map(r=>r.seed),['lonely-earthlike-0','crowded-domain-1','harsh-anoxic-2','doomed-star-3','high-perils-4','lonely-earthlike-5']);
  assert.deepEqual(ensemblePlan(2,{scenario:'doomed-star'}).map(r=>r.seed),['doomed-star-0','doomed-star-1']);
});
test('errored seeds remain in the denominator and completion order cannot drop them',async()=>{
  const tasks=ensemblePlan(2,{untilYear:-10}),runs=await runEnsemble(tasks,{jobs:2});
  assert.equal(runs.length,2);assert.ok(runs.every(r=>r.outcome==='ERROR'));assert.deepEqual(runs.map(r=>r.seed),['crowded-domain-1','lonely-earthlike-0']);assert.equal(aggregate(runs).table.find(r=>r.metric==='error').fraction,'2/2 (100.0%)');
});
test('explanations follow actual DAG edges, with explicit chronological expansion milestones',()=>{
  const event=(id,kind,dateYear,causes=[])=>({id,kind,dateYear,phase:0,ownerId:'arc',kindRank:0,intentKey:id,resolution:'accepted',causes:causes.map(eventId=>({eventId,edge:'TRIGGERED'})),data:{}});
  const events=[event('a','RUNAWAY_TECH',10),event('b','EXTINCTION',20,['a']),event('c','LINEAGE_EXTINCTION',29,['b']),event('unrelated','PLAGUE',15)];
  assert.equal(causalExplanation(events.reverse(),'EXTINCT_SELF'),'EXTINCT_SELF: RUNAWAY_TECH@10 -> EXTINCTION@20 -> LINEAGE_EXTINCTION@29');
  const expansion=[event('s','SPACEFLIGHT',0),event('l','LAUNCH',10,['s']),event('f','COLONY_FOUNDED',20,['l'])];
  assert.equal(causalExplanation(expansion,'EXTANT_MULTI_BODY'),'EXTANT_MULTI_BODY: SPACEFLIGHT@0 -> LAUNCH@10 -> COLONY_FOUNDED@20; first expansion chronology: SPACEFLIGHT@0 ; LAUNCH@10 ; COLONY_FOUNDED@20');
});
test('past colony extinction is a colony-only loss; nonviability alone is not extinction',()=>{
  const world={def:{planets:[{body:'b0',system:'s0'},{body:'b1',system:'s1'}],forced:{initial:{}},fromTick:0n,untilTick:3n}};
  const result={events:[{id:'death',kind:'EXTINCTION',dateYear:20,phase:5,ownerId:'colony',kindRank:15,intentKey:'x',resolution:'accepted',causes:[],refs:[],data:{}}],
    seenArcs:[{id:'home',body:'b0',lineageId:'lin',isColony:false},{id:'colony',body:'b1',lineageId:'lin',isColony:true}],outcomes:[{id:'lin',outcome:'EXTANT_PLANETARY'}],state:{tick:3n,lineages:[{id:'lin',outcomeClass:'EXTANT_PLANETARY',extinctionCause:null}]},firstEras:[0,null,null,null,null,null,null,null],firstEnergy:[0,null,null,null,null,null,null],maxEra:0,observations:[]};
  const task={scenario:'fixture',seed:'fixture'};
  const a=summarizeRun(task,world,result);assert.equal(a.flags.colonyOnlyLoss,true);assert.equal(a.flags.interplanetary,true);assert.equal(a.flags.interstellar,true);assert.equal(a.flags.eraE5,false);
  result.events[0].kind='COLONY_LOST';assert.equal(summarizeRun(task,world,result).flags.colonyOnlyLoss,false);
  result.seenArcs[1].lineageId='other';assert.equal(summarizeRun(task,world,result).flags.interplanetary,false);
});
