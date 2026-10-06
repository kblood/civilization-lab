import {test} from 'node:test';
import assert from 'node:assert/strict';
import {forced,runForced,setOverride} from './civ-helpers.mjs';
import {createDomain,createDomainDefinition} from '../src/domain.mjs';
import {createScenario} from '../src/scenario.mjs';
import {createPlanet,stepPlanet,stateDigest} from '../src/planet.mjs';
import {TARGETING_M5,routesFor,message,extraMagnitudes} from '../src/m2b.mjs';
import {graph} from './domain-helpers.mjs';
import {address} from '../src/civ-input.mjs';
import {threshold} from '../src/hazard.mjs';
import {narrative} from '../src/narrative.mjs';
import {cellDefinition} from '../src/refinement-contract.mjs';
import {refineCell} from '../src/refine-cell.mjs';
const options={targetingPolicy:'m5-targeting-1'};
test('targeting policy is domain-only, versioned, and excluded only from RNG addressing',()=>{
  const a=createDomainDefinition(),b=createDomainDefinition(undefined,undefined,options);
  assert.equal(Object.hasOwn(a.manifest.scenarioPriors,'targetingPolicy'),false);
  assert.equal(a.targetingPolicy,null);assert.equal(Object.hasOwn(a,'rngManifestDigest'),false);
  assert.equal(Object.hasOwn(createPlanet().def,'rngManifestDigest'),false);
  assert.deepEqual(b.manifest.scenarioPriors.targetingPolicy,TARGETING_M5);
  assert.equal(b.rngManifestDigest,a.manifestDigest);assert.notEqual(b.manifestDigest,a.manifestDigest);assert.notEqual(b.recipeDigest,a.recipeDigest);
  assert.ok(Object.isFrozen(TARGETING_M5));assert.ok(Object.isFrozen(TARGETING_M5.colonyDiedBackoffYears));
  for(const targetingPolicy of ['unknown',null]) {
    assert.throws(()=>createDomainDefinition(undefined,undefined,{targetingPolicy}),RangeError);
    assert.throws(()=>createDomain(undefined,undefined,{targetingPolicy}),RangeError);
    assert.throws(()=>createScenario('crowded-domain','gate',{targetingPolicy}),RangeError);
  }
  assert.throws(()=>createPlanet(undefined,undefined,options),RangeError);
  assert.throws(()=>createScenario('fixtures/planets/temperate.json','gate',options),RangeError);
  assert.equal(createScenario('crowded-domain','gate',options).world.def.targetingPolicy.version,options.targetingPolicy);
});
function inboxHarness() {
  const f=forced('RECOVERY'),w=createPlanet(f.base,f.seed,{forced:f}),def={...w.def,targetingPolicy:TARGETING_M5};
  let a=w.checkpoints[0].live.arcs[0];
  return {get state(){return a;},deliver(type,data){a=stepPlanet(def,{...a,inbox:[message(def.domain.id,a.tick,'remote',type,a.id,null,data,0,a.tick)]}).state;return a;}};
}
test('reason-specific delivered memory keeps signals and uses event years, capped counts and duplicate receipts',()=>{
  for(const [reason,delays] of [['transit-loss',[500,500]],['occupied',[2000,2000]],['uninhabitable',[10000,10000]],['colony-died',[1000,2000,4000,8000,8000]]]) {
    const h=inboxHarness(),signal={source:'foreign',body:'remote',lineageId:'foreign',tiers:[0,0,0,0,0,0,0],strength:0,physical:false,arrivalYear:0};
    h.deliver('SIGNAL',{signal});
    for(let i=0;i<delays.length;i++) {
      const failure={body:'remote',eventId:'failure-'+i,reason,year:-100+i,transportTier:reason==='colony-died'?null:5};
      h.deliver('TARGET_FAILURE',{failure});const entry=h.state.targetFailures[0];
      assert.deepEqual(entry,{body:'remote',count:Math.min(4,i+1),eventId:failure.eventId,failureYear:failure.year,reason,transportTier:failure.transportTier,untilYear:failure.year+delays[i]});
      assert.deepEqual(h.state.signals,[signal]);h.deliver('TARGET_FAILURE',{failure});assert.deepEqual(h.state.targetFailures,[entry]);
    }
  }
});
test('own-lineage newer success clears failure; stale failures and older/generic signals cannot erase success chronology',()=>{
  const h=inboxHarness(),failure={body:'remote',eventId:'failed',reason:'colony-died',year:100,transportTier:null};
  const signal={source:'colony',body:'remote',lineageId:h.state.lineageId,tiers:[0,0,0,0,0,0,0],strength:0,physical:false,arrivalYear:0,eventYear:101};
  h.deliver('TARGET_FAILURE',{failure});
  h.deliver('SIGNAL',{signal:{...signal,lineageId:'foreign'}});assert.equal(h.state.targetFailures.length,1);
  h.deliver('SIGNAL',{signal:{...signal,eventYear:100}});assert.equal(h.state.targetFailures.length,1);
  h.deliver('SIGNAL',{signal});assert.deepEqual(h.state.targetFailures,[]);
  h.deliver('SIGNAL',{signal:{...signal,eventYear:90}});
  const {eventYear,...generic}=signal;h.deliver('SIGNAL',{signal:generic});assert.equal(h.state.signals[0].eventYear,101);
  h.deliver('TARGET_FAILURE',{failure:{...failure,eventId:'stale'}});assert.deepEqual(h.state.targetFailures,[]);
  h.deliver('TARGET_FAILURE',{failure:{...failure,eventId:'equal',year:101}});assert.equal(h.state.targetFailures.length,1);
});
const route={from:'home',to:'remote',destinationHosting:'habitable',travelYearsByTransportTier:Array(8).fill(10)};
const routeDef={planet:{body:'home'},routes:[route],targetingPolicy:TARGETING_M5};
const region={id:'r',tiers:[5,5,5,5],pop:10000n,infra:100000n,fuel:100000n};
test('every reason expires at its boundary; only transit loss permits a higher transport tier bypass',()=>{
  for(const [reason,untilYear] of [['transit-loss',500],['occupied',2000],['uninhabitable',10000],['colony-died',8000]]) {
    const pre={tick:BigInt(untilYear/10-1),lineageId:'own',signals:[],targetFailures:[{body:'remote',reason,untilYear,transportTier:5}]};
    assert.equal(routesFor(routeDef,region,pre).length,0);
    assert.equal(routesFor(routeDef,region,{...pre,tick:BigInt(untilYear/10)}).length,1);
    assert.equal(routesFor(routeDef,{...region,tiers:[5,5,5,6]},pre).length,reason==='transit-loss'?1:0);
    assert.equal(routesFor({...routeDef,targetingPolicy:null},{...region,tiers:[5,5,5,6]},pre).length,0);
    assert.equal(routesFor(routeDef,{...region,tiers:[5,5,5,6]},{...pre,signals:[{body:'remote',lineageId:'foreign',arrivalYear:untilYear}]}).length,0);
  }
});
test('launch params record delivered prior reason and activity, including active tier bypass; default omits both',()=>{
  const r={...region,tiers:[5,5,5,6]},pre={tick:10n,regions:[r],signals:[],lineageId:'own',targetFailures:[]};
  const def={...routeDef,seed:'launch',manifestDigest:'manifest',forced:{overrides:[]}};
  for(const [memory,reason,active] of [[null,'none','0'],[{reason:'colony-died',untilYear:100},'colony-died','0'],[{reason:'transit-loss',untilYear:500,transportTier:5},'transit-loss','1']]) {
    const e={id:'launch',kind:'LAUNCH',params:{}},p={...pre,targetFailures:memory?[{body:'remote',...memory}]:[]};
    extraMagnitudes(def,p,e,{r:'r'});assert.equal(e.params.priorFailure,reason);assert.equal(e.params.priorFailureActive,active);
  }
  const e={id:'launch',kind:'LAUNCH',params:{}};extraMagnitudes({...def,targetingPolicy:null},pre,e,{r:'r'});
  assert.equal(Object.hasOwn(e.params,'priorFailure'),false);assert.equal(Object.hasOwn(e.params,'priorFailureActive'),false);
});
test('default golden stays pinned; policy draws match every arc until the first failure receipt',()=>{
  const f=forced('VOYAGE_LOST');f.ticks=43;const a=runForced(f),b=runForced(f,options);
  assert.equal(a.resultDigest,'4cf14477bf3977e8f0d5c0f88356821057a7f75dce87175f7a062ae14335b253');
  assert.equal(a.manifestDigest,'90051eb7386ddd879699310799a800a1ccbaaab72806c532565eb9f564df9138');
  assert.equal(a.recipeDigest,'d834f0fee814a1c61be91f3b8532d9a88d82dba258d09972b291ef414b69e2de');
  const first=b.ledgers.find(l=>l.state.arcs.some(a=>a.targetFailures.length));assert.ok(first);
  let compared=0;
  for(const tick of a.ledgers.filter(l=>BigInt(l.ledger.tick)<BigInt(first.ledger.tick))) {
    const other=b.ledgers.find(l=>l.ledger.tick===tick.ledger.tick);assert.deepEqual(tick.state.arcs.map(a=>a.id),other.state.arcs.map(a=>a.id));
    for(const arc of tick.state.arcs)assert.equal(stateDigest(arc),stateDigest(other.state.arcs.find(a=>a.id===arc.id)));
    compared++;
  }
  assert.ok(compared>0);assert.notEqual(a.resultDigest,b.resultDigest);
  const failure=b.state.arcs[0].targetFailures[0],event=b.events.find(e=>e.id===failure.eventId);
  assert.equal(failure.reason,'transit-loss');assert.equal(failure.failureYear,event.dateYear);assert.equal(failure.transportTier,7);assert.equal(failure.untilYear,event.dateYear+500);
});
test('domain emits classified failures and dated founding/reinforcement evidence only with the policy',()=>{
  const messages=r=>r.ledgers.flatMap(l=>l.state.messages);
  const check=(r,reason)=>{
    const notices=messages(r).filter(m=>m.type==='TARGET_FAILURE');assert.ok(notices.length);
    for(const m of notices){const e=r.events.find(e=>e.id===m.payload.failure.eventId);assert.equal(m.payload.failure.reason,reason);assert.equal(m.payload.failure.year,e.dateYear);assert.equal(m.payload.failure.transportTier,reason==='colony-died'?null:6);}
  };
  const success=forced('COLONY_FOUNDED');success.ticks=3;
  success.initial.voyages.push({...success.initial.voyages[0],label:'b',arrivalYear:15,deliveryTick:'2'});
  const on=runForced(success,options),off=runForced(success);
  for(const stage of ['FOUNDED','REINFORCEMENT']) {
    const e=on.events.find(e=>e.kind==='COLONY_FOUNDED'&&e.data.stage===stage);assert.ok(e);
    const signals=messages(on).filter(m=>m.type==='SIGNAL'&&m.causeEventId===e.id);assert.ok(signals.length);
    assert.ok(signals.every(m=>m.payload.signal.eventYear===e.dateYear));
  }
  assert.ok(messages(off).filter(m=>m.type==='SIGNAL').every(m=>!Object.hasOwn(m.payload.signal,'eventYear')));
  const rejected=forced('COLONY_FOUNDED');rejected.initial.voyages[0].tiers[0]=0;
  check(runForced(rejected,options),'uninhabitable');
  assert.ok(messages(runForced(rejected)).filter(m=>m.type==='TARGET_FAILURE').every(m=>Object.keys(m.payload.failure).sort().join(',')==='body,eventId'));
  const occupied=forced('COLONY_FOUNDED'),input=graph(3);input.origins.push('stub:s01:b0');
  occupied.initial.atTick='0';occupied.ticks=3;occupied.initial.voyages[0].destination='stub:s01:b0';
  check(createDomain(input,occupied.seed,{forced:occupied,...options}).run(),'occupied');
  const lost=forced('COLONY_FOUNDED');lost.initial.voyages[0].pop='1000';lost.ticks=3;check(runForced(lost,options),'colony-died');
  const extinct=forced('COLONY_FOUNDED');extinct.ticks=108;setOverride(extinct,'parameters.g',Array(8).fill(0));
  const result=runForced(extinct,options);assert.ok(result.events.some(e=>e.kind==='EXTINCTION'));check(result,'colony-died');
});

test('solver, hazard, narrative and cell RNG addresses share variates despite different manifests',()=>{
  const a=createDomainDefinition(),b=createDomainDefinition(undefined,undefined,options);
  assert.deepEqual(address(a,'entity','test'),address(b,'entity','test'));
  assert.equal(threshold(a,{ownerId:'entity',kind:'PLAGUE'},0n),threshold(b,{ownerId:'entity',kind:'PLAGUE'},0n));
  assert.deepEqual(narrative(a,[],['entity']),narrative(b,[],['entity']));
  const ca=cellDefinition({...a,planet:a.planets[0]},'r00'),cb=cellDefinition({...b,planet:b.planets[0]},'r00');
  assert.equal(cb.rngManifestDigest,ca.manifestDigest);assert.notEqual(cb.manifestDigest,ca.manifestDigest);
  const p={tick:'0',regionId:'region',start:{pop:100n},end:{pop:100n},phases:[],naturalDelta:0n,mandatoryEvents:[{id:'event',dateYear:0}]};
  assert.deepEqual(refineCell(ca,p,{regionId:'region',tick:0n}),refineCell(cb,p,{regionId:'region',tick:0n}));
});
