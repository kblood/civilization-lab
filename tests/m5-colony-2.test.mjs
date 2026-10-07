import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {forced,runForced,setOverride,region} from './civ-helpers.mjs';
import {graph} from './domain-helpers.mjs';
import {createDomain,createDomainDefinition,arcDefinition,VOYAGE_FIELDS} from '../src/domain.mjs';
import {stepPlanet} from '../src/planet.mjs';
import {createScenario} from '../src/scenario.mjs';
import {COLONY_M5,COLONY_M5_2,allocateByCapacity,maintenancePopulation} from '../src/tech.mjs';
import {inspectionTicks} from '../src/inspection.mjs';
import {regionContract,cellDefinition} from '../src/refinement-contract.mjs';
import {refineCell,aggregateCells} from '../src/refine-cell.mjs';
const c1={colonyPolicy:'m5-colony-1'},c2={colonyPolicy:'m5-colony-2'};
// Fixtures shared with tests/m5-colony.test.mjs (reserve cliff, network) plus two rejection fixtures.
function cliff(network=false,ticks=210){
  const f=forced('COLONY_FOUNDED');f.ticks=ticks;setOverride(f,'parameters.g',Array(8).fill(0));
  if(network)f.initial.regions=Array.from({length:6},(_,i)=>region('r0'+i,{pop:'100000',infra:'1000000',tiers:[5,5,4,6,4,3,4]}));return f;
}
// Foreign-occupied destination (contact-horizon shape); extra origins occupy more of graph(n).
function occupied(n=3,ticks=60,patch={}){
  const input=graph(n);for(let i=1;i<n-1;i++)input.origins.push(`stub:s0${i}:b0`);
  const f=forced('COLONY_FOUNDED');f.initial.atTick='0';f.ticks=ticks;Object.assign(f.initial.voyages[0],{destination:'stub:s01:b0',arrivalYear:5,deliveryTick:'1',...patch});return {input,f};
}
// Barren destination in the home system: uninhabitable for any tiers.
function barren(ticks=10){const f=forced('COLONY_FOUNDED');f.ticks=ticks;Object.assign(f.initial.voyages[0],{destination:'stub:s00:b3'});return f;}
const runOccupied=(opts,...a)=>{const {input,f}=occupied(...a);return createDomain(input,f.seed,{forced:f,...opts}).run();};
const arrivals=r=>r.events.filter(e=>e.kind==='COLONY_FOUNDED');
const moved=e=>e.effects.filter(x=>x.op==='transfer').map(x=>[x.to.slice(x.to.lastIndexOf('#')+1),x.amount]);

test('policy-off and m5-colony-1 goldens captured on untouched main f034d7b stay byte-identical',()=>{
  // The policy-off reserve-cliff golden (d834a696…) is already pinned in m5-colony.test.mjs; not re-run here.
  const golden={off:{network:'a1fcceaccede1b2de14434efc17cff94a2a08df4688f08106eb1c592f80ca97a',
    occupied:'1aaf7e007057a017bac73304c00bfd63a33745118bc847da525d8747e6c7a2e4',barren:'07edb5f059a1f6b0275f822ff6742846f4a0fd6bf916f6f4e320b98bf9eec15e'},
    c1:{cliff:'78aeff32ffd2203c0ae4da7d5ad0b1cdc0cb1f8597c58ff2791e5cc6e283507b',network:'ef191aaa6509464f49b59e45487f941bddb258ba630e50af13c7a8ee07933c5f',
    occupied:'1aaf7e007057a017bac73304c00bfd63a33745118bc847da525d8747e6c7a2e4',barren:'07edb5f059a1f6b0275f822ff6742846f4a0fd6bf916f6f4e320b98bf9eec15e'}};
  for(const [name,opts] of [['off',{}],['c1',c1]]){
    const net=cliff(true),seen={...(name==='c1'?{cliff:runForced(cliff(),opts).resultDigest}:{}),network:createDomain(net.base,net.seed,{forced:net,...opts}).compileSummary().resultDigest,
      occupied:runOccupied(opts).resultDigest,barren:runForced(barren(),opts).resultDigest};
    assert.deepEqual(seen,golden[name],name);
  }
  const v2=runForced(cliff(),c2).resultDigest;assert.notEqual(v2,golden.c1.cliff,'negative control: m5-colony-2 changes the history');
});
test('capacity-aware allocation: largest remainder, id tie-break, founding and reinforcement split by remaining room',()=>{
  assert.deepEqual(allocateByCapacity(10n,[{id:'b',room:1n},{id:'a',room:1n},{id:'c',room:1n}]),[{id:'a',persons:4n},{id:'b',persons:3n},{id:'c',persons:3n}]);
  assert.deepEqual(allocateByCapacity(7n,[{id:'a',room:0n},{id:'b',room:3n},{id:'c',room:1n}]),[{id:'b',persons:5n},{id:'c',persons:2n}]);
  assert.deepEqual(allocateByCapacity(5n,[{id:'a',room:0n}]),[]);assert.deepEqual(allocateByCapacity(0n,[{id:'a',room:9n}]),[]);
  for(const [p,rooms] of [[4001n,[3n,5n,7n,11n]],[1n,[5n,5n]],[999999n,[1n,2n,3n]]])assert.equal(allocateByCapacity(p,rooms.map((room,i)=>({id:'r'+i,room}))).reduce((n,s)=>n+s.persons,0n),p);
  const tick=71,run=opts=>{const f=cliff(false,tick+1);f.initial.voyages.push({...f.initial.voyages[0],label:'b',pop:'2000',tiers:[...f.initial.voyages[0].tiers],arrivalYear:tick*10,deliveryTick:String(tick)});return runForced(f,opts);};
  const one=run(c1),two=run(c2),[f1,r1]=arrivals(one),[f2,r2]=arrivals(two);
  // Negative: m5-colony-1 keeps the first positive-capacity region for both arrivals.
  assert.deepEqual(moved(f1),[['r00','4000']]);assert.deepEqual(moved(r1),[['r00','2000']]);
  // Founding: eight equal-room regions on the habitat-buildable body get 500 each.
  assert.deepEqual(moved(f2),Array.from({length:8},(_,i)=>['r0'+i,'500']));
  assert.deepEqual(moved(r2),Array.from({length:8},(_,i)=>['r0'+i,'250']));
  const before=two.ledgers.find(l=>l.ledger.tick===String(tick-1)).state.arcs.find(a=>a.isColony);
  assert.ok(before.regions.every(r=>r.K-r.pop===119500n));
  assert.equal(r2.data.sets.find(s=>s.field==='arc.colonyReserve').value,r1.data.sets.find(s=>s.field==='arc.colonyReserve').value,'reserve rules are inherited unchanged');
  // Diverted reinforcement into the populated home world: room-weighted, not equal.
  const home=arrivals(runForced(barren(),c2))[1];assert.equal(home.data.stage,'REINFORCEMENT');
  assert.equal(moved(home).reduce((n,[,a])=>n+BigInt(a),0n),4000n);assert.ok(new Set(moved(home).map(([,a])=>a)).size>1);
});
test('unsupported reserve cliff: no hidden survival boost; disconnect timing measured on the network fixture',()=>{
  const r=runForced(cliff(),c2),birth=r.events.find(e=>e.kind==='COLONY_FOUNDED'&&e.data.stage==='FOUNDED'),own=r.events.filter(e=>e.ownerId.startsWith(birth.data.target));
  assert.equal(own.find(e=>e.kind==='TECH_LOSS').dateYear-birth.dateYear,1020);assert.equal(own.find(e=>e.kind==='EXTINCTION').dateYear-birth.dateYear,1040);
  assert.ok(r.ledgers.every(l=>l.state.arcs.every(a=>Object.hasOwn(a,'colonyReserve')===a.isColony)));
  // Disconnect at support expiry (year 2400): first TECH_LOSS 3850 under m5-colony-1 (pinned there) but
  // 3420 here, because the 4000 founders are split 8 x 500 by capacity. Recorded as a fixture property.
  const f=cliff(true),w=createDomain(f.base,f.seed,{forced:f,...c2});let a=w.run().state.arcs.find(a=>a.isColony),loss;
  assert.deepEqual(a.regions.map(r=>r.pop),Array(8).fill(500n));
  const support=a.lineageReports.find(x=>!x.source.endsWith('#specialists'));assert.equal(support.reportYear+300+support.routeDelayYears,2400);
  const pd=arcDefinition(w.def,a.body,a.lineageId,a.episode,BigInt(a.foundedYear/10),a.scenarioParams);
  while(!loss&&!a.outcome.terminal&&a.tick<400n){const out=stepPlanet(pd,a);loss=out.events.find(e=>e.kind==='TECH_LOSS');a=out.state;}
  assert.equal(loss.dateYear,3420);
});
test('rejected voyage is diverted to the best declared route and reinforces there; negative without a route',()=>{
  const r=runForced(barren(),c2),[rej,arr]=arrivals(r),leg=rej.refs.find(x=>x.role==='voyage').entityId;
  assert.equal(rej.reason,'destination-uninhabitable');assert.equal(rej.data.outcome,'rejected');assert.equal(rej.data.stage,'DIVERTED');
  assert.ok(leg.endsWith('#voy:fixture:a~diverted'));
  assert.deepEqual(rej.effects.find(x=>x.op==='transfer'),{target:'transit:'+leg.slice(0,-'~diverted'.length),field:'transit.pop',op:'transfer',amount:'4000',to:'transit:'+leg,toField:'transit.pop'});
  // b3 -> b0 (habitable, 5 years at transport tier 6) beats b1/b2 (habitat-buildable).
  assert.equal(arr.ownerId,'stub:s00:b0');assert.equal(arr.dateYear,20);assert.deepEqual(arr.causes,[{eventId:rej.id,edge:'EXOGENOUS',weightPermille:1000}]);
  const old=r.archiveRecords.find(x=>x.kind==='voyage'&&x.id.endsWith('#voy:fixture:a')).record,next=r.archiveRecords.find(x=>x.kind==='voyage'&&x.id===leg).record;
  assert.equal(old.status,'diverted');assert.equal(old.lastDeath,null);assert.equal(next.status,'delivered');assert.deepEqual(Object.keys(next).sort(),VOYAGE_FIELDS);
  assert.equal(next.launchEventId,rej.id);assert.equal(next.arrivalYear,15);
  assert.equal(r.events.filter(e=>e.kind==='LINEAGE_EXTINCTION').length,0);
  // Negative: off and m5-colony-1 still kill all passengers at the barren body.
  for(const opts of [{},c1]){const [e]=arrivals(runForced(barren(),opts));assert.equal(e.data.stage,'REJECTED');assert.deepEqual(e.effects.find(x=>x.field==='transit.pop'),{target:e.effects[0].target,field:'transit.pop',op:'add',amount:'-4000'});}
});
test('foreign-occupied arrival is stranded for a finite window, retried once, then lost; negatives without habitat tiers',()=>{
  const r=runOccupied(c2),[a,b]=arrivals(r);
  assert.equal(a.data.stage,'STRANDED');assert.equal(a.reason,'occupied-by-other-lineage');assert.equal(b.dateYear-a.dateYear,COLONY_M5_2.strandedSurvivalYears);
  assert.equal(b.data.stage,'REJECTED');assert.equal(b.reason,'occupied-by-other-lineage');
  const statuses=r.archiveRecords.filter(x=>x.kind==='voyage').map(x=>[x.id.slice(x.id.lastIndexOf('#')+1),x.record.status,x.record.lastDeath?.eventId??null]);
  assert.deepEqual(statuses,[['voy:fixture:a','stranded',null],['voy:fixture:a~stranded','turned-away',b.id]]);
  // Both arrivals still signal the occupant (contact is physical either way).
  assert.equal(r.events.filter(e=>e.kind==='SIGNAL_ARRIVAL').length,2);
  // Negative: without habitat tiers (Energy 4) there is no stranding; all die at once, as by default.
  const weak=runOccupied(c2,3,60,{tiers:[4,5,4,6,4,3,4]}),[w]=arrivals(weak);
  assert.equal(arrivals(weak).length,1);assert.equal(w.data.stage,'REJECTED');assert.equal(w.dateYear,10);
  // Bounded chain: diverted once (s01 -> s02, both occupied), then stranded once, then lost: three arrivals, never a fourth.
  const chain=runOccupied(c2,4,60,{tiers:[5,5,4,7,4,3,4]});
  assert.deepEqual(arrivals(chain).map(e=>[e.ownerId,e.dateYear,e.data.stage]),[['stub:s01:b0',10,'DIVERTED'],['stub:s02:b0',20,'STRANDED'],['stub:s02:b0',520,'REJECTED']]);
  assert.ok(chain.archiveRecords.some(x=>x.kind==='voyage'&&x.id.endsWith('~diverted~stranded')&&x.record.status==='turned-away'));
});
test('arriving specialists join the maintenance roster: bounded credit, tier-qualified, replaced by newer arrivals',()=>{
  const tick=71,f=cliff(false,tick+1);f.initial.voyages.push({...f.initial.voyages[0],label:'b',pop:'2000',tiers:[5,5,4,6,4,2,4],arrivalYear:tick*10,deliveryTick:String(tick)});
  const r=runForced(f,c2),early=r.ledgers.find(l=>l.ledger.tick==='2').state.arcs.find(a=>a.isColony),late=r.state.arcs.find(a=>a.isColony);
  const roster=a=>a.lineageReports.find(x=>x.source===a.id+'#specialists');
  assert.deepEqual(roster(early).qualified[0],[4000n,4000n,4000n,4000n,4000n,4000n,0n]);assert.equal(roster(early).reportYear,10);assert.equal(roster(early).population,4000n);
  assert.deepEqual(roster(late).qualified[5],[2000n,2000n,2000n,0n,0n]);assert.equal(roster(late).reportYear,710);
  const limit=1000000000n,credit=(a,tickNow,d)=>{const x={...a,tick:BigInt(tickNow)},y={...x,lineageReports:x.lineageReports.filter(s=>s!==roster(a))};return maintenancePopulation(x,x.regions[0],d,500n,limit,COLONY_M5_2,false)-maintenancePopulation(y,y.regions[0],d,500n,limit,COLONY_M5_2,false);};
  assert.equal(credit(early,30,0),400n);assert.equal(credit(early,31,0),0n,'bounded: expires 300 years after arrival');
  assert.equal(credit(late,72,0),200n);assert.equal(credit(late,72,5),0n,'negative: Medicine 2 specialists cannot qualify a Medicine 3 region');
  for(const opts of [{},c1]){const s=runForced(cliff(false,3),opts).state.arcs.find(a=>a.isColony);assert.equal(roster(s),undefined);}
});
test('RNG parity, manifest block, rejection of unknown policies and CLI plumbing',()=>{
  const off=createDomainDefinition(),one=createDomainDefinition(undefined,undefined,c1),two=createDomainDefinition(undefined,undefined,c2);
  for(const d of [two,createDomainDefinition(undefined,undefined,{...c2,targetingPolicy:'m5-targeting-1'})])assert.equal(d.rngManifestDigest,off.manifestDigest);
  assert.ok(Object.isFrozen(COLONY_M5_2));assert.deepEqual(two.colonyPolicy,COLONY_M5_2);assert.deepEqual(two.manifest.scenarioPriors.colonyPolicy,COLONY_M5_2);
  for(const [k,v] of Object.entries(COLONY_M5))if(k!=='version')assert.equal(COLONY_M5_2[k],v);
  assert.deepEqual(one.colonyPolicy,COLONY_M5);assert.notEqual(two.manifestDigest,one.manifestDigest);assert.notEqual(two.recipeDigest,one.recipeDigest);
  for(const colonyPolicy of ['bogus',null,'m5-colony-3'])for(const fn of [()=>createDomainDefinition(undefined,undefined,{colonyPolicy}),()=>createScenario('crowded-domain','gate',{colonyPolicy})])assert.throws(fn,{name:'RangeError',message:'Unknown colony policy'});
  assert.throws(()=>createScenario('fixtures/planets/temperate.json','gate',c2),RangeError);
  // CLI passes the value through verbatim (src/cli.mjs unchanged); its bogus-value exit is pinned in m5-colony.test.mjs.
  const ok=spawnSync(process.execPath,['src/cli.mjs','--scenario','crowded-domain','--colony-policy','m5-colony-2','--until-year','20'],{encoding:'utf8',timeout:10000});assert.equal(ok.status,0,ok.stderr);
  assert.ok(ok.stdout.includes(createScenario('crowded-domain','s1',{...c2,untilYear:20}).world.def.manifestDigest));
});
test('witnesses, projection and arc order stay consistent for split, diverted and stranded arrivals',()=>{
  for(const {input,f} of [{f:cliff(false,4)},{f:barren(4)},occupied(3,3)]){
    const w=createDomain(input??f.base,f.seed,{forced:f,...c2}),r=w.run();
    assert.equal(r.resultDigest,w.compileSummary().resultDigest);assert.equal(r.resultDigest,w.run({arcOrder:'reverse'}).resultDigest);
    for(const t of inspectionTicks(w,r,true))for(const region of t.start.regions){const p=regionContract(t.def,t.start,t.pre,t.end,t.updates,t.events,region.id),d=cellDefinition(t.def,region.localId);assert.deepEqual(aggregateCells(refineCell(d,p,{regionId:region.id,tick:t.tick})),p);}
  }
});
