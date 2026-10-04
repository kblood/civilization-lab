import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aggregate,ensemblePlan,fraction,causalExplanation,METRICS,runEnsemble,summarizeRun} from '../src/ensemble.mjs';
test('hand-built summaries have exact counts, lower medians, explanations and observed bands',()=>{
  const rows=[['EXTINCT_SELF',{extinctSelf:true,extinct:true,industrialE3:true},['RUNAWAY_TECH'],10],['EXTANT_MULTI_BODY',{interplanetary:true,collapseRecovery:true,industrialE3:true},[],30],['NO_LINEAGE',{noLineage:true},[],null],['EXISTENTIAL_CAP',{existentialCap:true},[],50]].map(([outcome,flags,causes,time],i)=>({scenario:'fixture',seed:String(i),classes:[outcome],outcome,flags,causes,startedEra:time===null?null:0,originYear:0,firstEras:[0,0,time,time,null,null,null,null],timeE2:time,timeE3:time,explanation:outcome+': fixture'}));
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

test('left-censored starts are counted but excluded from time-to-era medians',()=>{
  const row=(seed,startedEra,firstEras,outcome='EXTANT_PLANETARY')=>({scenario:'fixture',seed,startedEra,originYear:100,firstEras,outcome,classes:[outcome],flags:{industrialE3:firstEras[3]!==null},causes:[],explanation:'fixture'});
  const a=aggregate([
    row('start',4,[100,100,100,100,100,300,400,500]),
    row('reach',1,[100,100,120,160,200,300,null,null]),
    row('never',1,[100,100,null,null,null,null,null,null]),
    row('empty',null,Array(8).fill(null),'NO_LINEAGE'),
    row('error',null,Array(8).fill(null),'ERROR'),
  ]);
  const e=a.eraThresholds.find(e=>e.era===3);
  assert.deepEqual(e,{era:3,n:5,started:1,reached:1,never:2,unknown:1,startedFraction:'1/5 (20.0%)',reachedFraction:'1/5 (20.0%)',neverFraction:'2/5 (40.0%)',median:60,leftCensored:1,rightCensored:2});
  assert.equal(a.medianE2,20);assert.equal(a.medianE3,60);
  assert.equal(a.table.find(r=>r.metric==='industrialE3').k,2);
  assert.equal(aggregate([row('only',3,[100,100,100,100,null,null,null,null])]).medianE3,null);
});

test('industrial calibration includes exactly E3 starts and excludes nonattainment from medians',()=>{
  const rows=[
    {startedEra:3,firstEras:[100,100,100,100,200,500,700,900]},
    {startedEra:3,firstEras:[100,100,100,100,300,700,null,null]},
    {startedEra:4,firstEras:[100,100,100,100,100,110,120,130]},
  ].map((r,i)=>({...r,scenario:'fixture',seed:String(i),originYear:100,outcome:'EXTANT_PLANETARY',classes:['EXTANT_PLANETARY'],flags:{},causes:[],explanation:'fixture'}));
  assert.deepEqual(aggregate(rows).calibration,[{era:5,n:2,reached:2,censored:0,median:400},{era:6,n:2,reached:1,censored:1,median:600},{era:7,n:2,reached:1,censored:1,median:800}]);
});
