import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {forced,runForced,setOverride,region} from './civ-helpers.mjs';
import {createDomain,createDomainDefinition,arcDefinition} from '../src/domain.mjs';
import {createDefinition,createPlanet,stepPlanet,stateDigest} from '../src/planet.mjs';
import {createScenario} from '../src/scenario.mjs';
import {COLONY_M5,colonyDrain,colonyStock,qualifiedPopulation,maintenancePopulation} from '../src/tech.mjs';
import {ARC_FIELDS,COLONY_ARC_FIELDS,transitionDigest} from '../src/delta-witness.mjs';
import {inspectionTicks} from '../src/inspection.mjs';
import {regionContract,cellDefinition} from '../src/refinement-contract.mjs';
import {refineCell,aggregateCells} from '../src/refine-cell.mjs';
import {ensemblePlan,runSeed} from '../src/ensemble.mjs';
import {reportMarkdown} from '../src/report.mjs';
const options={colonyPolicy:'m5-colony-1'};
function fixture(network=false){
  const f=forced('COLONY_FOUNDED');f.ticks=210;setOverride(f,'parameters.g',Array(8).fill(0));
  // Same network fixture as m4-colony (kept local to leave existing tests unedited).
  if(network)f.initial.regions=Array.from({length:6},(_,i)=>region('r0'+i,{pop:'100000',infra:'1000000',tiers:[5,5,4,6,4,3,4]}));return f;
}
test('default reserve-cliff golden captured before M5 edits; unsupported policy has no survival boost',()=>{
  const f=fixture(),off=runForced(f),on=runForced(f,options);
  assert.equal(off.resultDigest,'d834a696192776f958841bf3dfabe55d5cb136b63d34470d22beac3b575abad4');
  assert.equal(off.manifestDigest,'8aac2b797f89958b6138877db4c57863af2f8e6b7ee2115988ca13e40d349adb');
  assert.equal(off.recipeDigest,'d265fa22e2ae63a0a1dff3ae48c9ad86b9d2a4eb04e23d827a94bd427de3ddcc');
  for(const result of [off,on]){
    const birth=result.events.find(e=>e.kind==='COLONY_FOUNDED'&&e.data.stage==='FOUNDED'),own=result.events.filter(e=>e.ownerId.startsWith(birth.data.target));
    assert.equal(own.find(e=>e.kind==='TECH_LOSS').dateYear-birth.dateYear,1020);
    assert.equal(own.find(e=>e.kind==='EXTINCTION').dateYear-birth.dateYear,1040);
  }
  assert.ok(off.ledgers.every(l=>l.state.arcs.every(a=>!Object.hasOwn(a,'colonyReserve'))));
  assert.ok(on.ledgers.every(l=>l.state.arcs.every(a=>Object.hasOwn(a,'colonyReserve')===a.isColony)));
});
test('drain ceiling, empty stock and capped local regain',()=>{
  assert.ok(Object.isFrozen(COLONY_M5));
  for(const [maint,drain] of [[80000n,0],[60000n,3],[4000n,10]])assert.equal(colonyDrain(maint,80000n),drain);
  assert.equal(colonyStock(2,10),0);assert.equal(colonyStock(0,10),0);
  assert.equal(colonyStock(995,0),1000);assert.equal(colonyStock(999,0),1000);assert.equal(colonyStock(0,0),5);
});
test('disconnect drains actual maximum gap: TECH_LOSS delayed 1430 years',()=>{
  const years=[];
  for(const opts of [{},options]){
    const f=fixture(true),w=createDomain(f.base,f.seed,{forced:f,...opts}),r=w.run();
    let a=r.state.arcs.find(a=>a.isColony);
    const pd=arcDefinition(w.def,a.body,a.lineageId,a.episode,BigInt(a.foundedYear/10),a.scenarioParams),expiry=a.lineageReports[0].reportYear+300+a.lineageReports[0].routeDelayYears;
    assert.equal(expiry,2400);
    if(opts.colonyPolicy){assert.equal(a.colonyReserve,1000);assert.ok(r.ledgers.slice(3).every(l=>l.state.arcs.find(a=>a.isColony).colonyReserve===1000));}
    let loss;
    while(!a.outcome.terminal&&a.tick<400n){const out=stepPlanet(pd,a);if(Number(a.tick*10n)<expiry&&opts.colonyPolicy)assert.equal(out.state.colonyReserve,1000);loss??=out.events.find(e=>e.kind==='TECH_LOSS');a=out.state;}
    assert.ok(loss);years.push(loss.dateYear);
  }
  assert.deepEqual(years,[2420,3850]);assert.equal(years[1]-years[0],1430);assert.ok(years[1]-years[0]>=100);
});
test('small advanced enclave cannot qualify a large low-tier population',()=>{
  const f=fixture(true);f.ticks=4;const w=createDomain(f.base,f.seed,{forced:f,...options}),result=w.run();
  const a=structuredClone(result.state.arcs.find(a=>a.isColony));a.tick=200n;a.foundedYear=0;a.colonyReserve=0;
  const parent={regions:[{pop:1000n,tiers:[5,5,4,6,4,3,4]},{pop:1000000n,tiers:Array(7).fill(0)}]};
  const qualified=qualifiedPopulation(parent);assert.deepEqual(qualified[0],[1001000n,1000n,1000n,1000n,1000n,1000n,0n]);
  a.lineageReports=[{source:'parent',lineageId:a.lineageId,population:1001000n,tiers:[5,5,4,6,4,3,4],qualified,reportYear:2000,routeDelayYears:0}];
  const pd=arcDefinition(w.def,a.body,a.lineageId,a.episode,0n,a.scenarioParams),off={...pd};delete off.colonyPolicy;
  assert.equal(maintenancePopulation(a,a.regions[0],0,4000n,80000n),104100n);
  assert.equal(maintenancePopulation(a,a.regions[0],0,4000n,80000n,COLONY_M5),4100n);
  assert.equal(stepPlanet(off,a).state.regions[0].lowTicks[0],0);
  assert.equal(stepPlanet(pd,a).state.regions[0].lowTicks[0],1);
  const statuses=result.ledgers.flatMap(l=>l.state.messages).filter(m=>m.type==='STATUS');assert.ok(statuses.length);
  assert.ok(statuses.every(m=>m.payload.status.qualified.length===7));
});
test('reinforcement refills +500, caps, and requires every founding tier; effects witness the stock',()=>{
  for(const [tick,qualifies] of [[71,true],[51,true],[71,false]]){
    const f=fixture();f.ticks=tick+1;const v={...f.initial.voyages[0],label:'b',pop:'2000',tiers:[...f.initial.voyages[0].tiers],arrivalYear:tick*10,deliveryTick:String(tick)};
    if(!qualifies)v.tiers[5]--;f.initial.voyages.push(v);
    const r=runForced(f,options),e=r.events.find(e=>e.kind==='COLONY_FOUNDED'&&e.data.stage==='REINFORCEMENT');assert.ok(e);
    const before=r.ledgers.find(l=>l.ledger.tick===String(tick-1)).state.arcs.find(a=>a.isColony).colonyReserve;
    const set=e.data.sets.find(s=>s.field==='arc.colonyReserve');
    if(qualifies){assert.equal(set.value,Math.min(1000,before+500));assert.ok(e.effects.some(x=>x.field==='arc.colonyReserve'&&x.op==='set'));if(tick===71)assert.equal(set.value-before,500);else assert.equal(set.value,1000);}
    else assert.equal(set,undefined);
  }
});
test('RNG parity for either or both policies, targeting baseline remains pinned',()=>{
  const off=createDomainDefinition();assert.equal(Object.hasOwn(off,'colonyPolicy'),false);
  for(const opts of [options,{targetingPolicy:'m5-targeting-1'},{...options,targetingPolicy:'m5-targeting-1'}]){
    const d=createDomainDefinition(undefined,undefined,opts);assert.equal(d.rngManifestDigest,off.manifestDigest);
    if(opts.colonyPolicy){assert.deepEqual(d.colonyPolicy,COLONY_M5);assert.deepEqual(d.manifest.scenarioPriors.colonyPolicy,COLONY_M5);}
    else {assert.equal(d.rngManifestDigest,'6c76fcb786723c7388128ec44ef9b3e94232622de4f6bd11777eeee5b20a9d39');assert.equal(d.manifestDigest,'5956a5ec13c16b2c960e61b89d668470c03cdfb81a02f6df3ad1beb7f32a43f4');}
  }
});
test('policy rejection and CLI manifest plumbing, combined flags and report metadata',()=>{
  for(const colonyPolicy of ['bogus',null])for(const fn of [()=>createDomainDefinition(undefined,undefined,{colonyPolicy}),()=>createDomain(undefined,undefined,{colonyPolicy}),()=>createScenario('crowded-domain','gate',{colonyPolicy})])assert.throws(fn,{name:'RangeError',message:'Unknown colony policy'});
  for(const fn of [createDefinition,createPlanet])assert.throws(()=>fn(undefined,undefined,options),RangeError);
  assert.throws(()=>createScenario('fixtures/planets/temperate.json','gate',options),RangeError);
  const cli=(...args)=>spawnSync(process.execPath,['src/cli.mjs',...args],{encoding:'utf8',timeout:10000});
  assert.notEqual(cli('--scenario','crowded-domain','--colony-policy','bogus','--until-year','20').status,0);
  for(const extra of [[],['--targeting-policy','m5-targeting-1']]){
    const opts={...options,...(extra.length?{targetingPolicy:'m5-targeting-1'}:{})},r=cli('--scenario','crowded-domain','--colony-policy','m5-colony-1','--until-year','20',...extra);
    assert.equal(r.status,0,r.stderr);assert.ok(r.stdout.includes(createScenario('crowded-domain','s1',{...opts,untilYear:20}).world.def.manifestDigest));
  }
  const task=ensemblePlan(1,{scenario:'crowded-domain',untilYear:20,...options})[0],r=runSeed(task);
  assert.equal(r.colonyPolicy,options.colonyPolicy);assert.ok(reportMarkdown([r]).includes('Colony policy: m5-colony-1'));
});
test('reserve is committed by delta/state witnesses and survives inspection/projection and arc order',()=>{
  const f=fixture();f.ticks=4;const w=createDomain(f.base,f.seed,{forced:f,...options}),r=w.run();
  assert.equal(r.resultDigest,w.compileSummary().resultDigest);assert.equal(r.resultDigest,w.run({arcOrder:'reverse'}).resultDigest);
  assert.deepEqual(COLONY_ARC_FIELDS,[...ARC_FIELDS,'colonyReserve']);
  const a=r.state.arcs.find(a=>a.isColony),b={...a,colonyReserve:a.colonyReserve-1};
  assert.notEqual(stateDigest(a),stateDigest(b));assert.notEqual(transitionDigest('prior',a,a),transitionDigest('prior',a,b));
  for(const t of inspectionTicks(w,r,true))for(const region of t.start.regions){const p=regionContract(t.def,t.start,t.pre,t.end,t.updates,t.events,region.id),d=cellDefinition(t.def,region.localId);assert.deepEqual(aggregateCells(refineCell(d,p,{regionId:region.id,tick:t.tick})),p);}
});
