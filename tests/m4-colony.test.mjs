import {test} from 'node:test';
import assert from 'node:assert/strict';
import {forced,runForced,setOverride,region} from './civ-helpers.mjs';
import {graph} from './domain-helpers.mjs';
import {createDomain,arcDefinition} from '../src/domain.mjs';
import {createPlanet,stepPlanet,stateDigest} from '../src/planet.mjs';
import {message} from '../src/m2b.mjs';
import {maintenancePopulation,COLONY_ARCHIVE_YEARS} from '../src/tech.mjs';
test('founding reserve lets a small habitat colony grow without the old maintenance death loop',()=>{
  const f=forced('COLONY_FOUNDED');f.ticks=210;const r=runForced(f),a=r.state.arcs.find(a=>a.isColony);
  assert.ok(a);assert.ok(a.regions[0].pop>4000n);assert.ok(a.regions[0].tiers[0]>=5&&a.regions[0].tiers[1]>=5);
  assert.ok(!r.events.some(e=>['TECH_LOSS','EXTINCTION'].includes(e.kind)&&e.ownerId.startsWith(a.id)));
});
test('knowledge reserve expires exactly, protects copied tiers only, and never creates people',()=>{
  const a={isColony:true,foundedYear:10,tick:100n,foundingTiers:[5]},r={pop:4000n,tiers:[5]};
  assert.equal(maintenancePopulation(a,r,0,4000n,80000n),80000n);
  a.tick=BigInt((10+COLONY_ARCHIVE_YEARS)/10);assert.equal(maintenancePopulation(a,r,0,4000n,80000n),4000n);
  a.tick=2n;r.tiers[0]=6;assert.equal(maintenancePopulation(a,r,0,4000n,80000n),4000n);assert.equal(r.pop,4000n);
});

test('reserve cliff exposes maintenance loss and habitat death after expiry',()=>{
  const f=forced('COLONY_FOUNDED');f.ticks=210;setOverride(f,'parameters.g',Array(8).fill(0)); // [scenario] isolate an undersupported reserve, no growth
  const result=runForced(f);
  const birth=result.events.find(e=>e.kind==='COLONY_FOUNDED'&&e.data.stage==='FOUNDED');assert.ok(birth);
  const own=result.events.filter(e=>e.ownerId.startsWith(birth.data.target));
  const loss=own.find(e=>e.kind==='TECH_LOSS'),death=own.find(e=>e.kind==='EXTINCTION');
  assert.ok(loss);assert.ok(death);
  assert.equal(loss.dateYear-birth.dateYear,1020);assert.equal(death.dateYear-birth.dateYear,1040);
});

// Zero growth isolates knowledge maintenance from demographic self-sufficiency.
function networkFixture(){
  const f=forced('COLONY_FOUNDED');f.ticks=210;
  f.initial.regions=Array.from({length:6},(_,i)=>region('r0'+i,{pop:'100000',infra:'1000000',tiers:[5,5,4,6,4,3,4]}));
  setOverride(f,'parameters.g',Array(8).fill(0));return f;
}

test('delivered living-parent support preserves a zero-growth habitat past reserve expiry, in either arc order',()=>{
  const f=networkFixture(),w=createDomain(f.base,f.seed,{forced:f});
  const result=w.run(),reverse=w.run({arcOrder:'reverse'});
  assert.equal(result.resultDigest,reverse.resultDigest);
  const a=result.state.arcs.find(a=>a.isColony);assert.ok(a);
  assert.equal(a.regions[0].pop,4000n);assert.ok(a.regions[0].tiers[0]>=5&&a.regions[0].tiers[1]>=5);
  assert.ok(a.lineageReports.length>0);
  assert.ok(!result.events.some(e=>['TECH_LOSS','EXTINCTION'].includes(e.kind)&&e.ownerId.startsWith(a.id)));
  const queued=result.ledgers[0].state.messages.filter(m=>m.type==='STATUS');assert.equal(queued.length,2);
  assert.ok(queued.every(m=>m.deliveryTick>BigInt(result.ledgers[0].ledger.tick)));
  assert.ok(result.ledgers[0].state.arcs.every(a=>a.lineageReports.length===0));
  assert.ok(result.ledgers[1].state.arcs.every(a=>a.lineageReports.length===1));
  // Continue this exact colony in isolation: no more reports arrive after the parent goes silent.
  const pd=arcDefinition(w.def,a.body,a.lineageId,a.episode,BigInt(a.foundedYear/10),a.scenarioParams);
  const expiry=a.lineageReports[0].reportYear+300+a.lineageReports[0].routeDelayYears;
  let isolated=a;const later=[];
  while(!isolated.outcome.terminal&&Number(isolated.tick*10n)<expiry+100){
    const out=stepPlanet(pd,isolated);later.push(...out.events);
    if(Number(isolated.tick*10n)<expiry)assert.equal(out.state.regions[0].lowTicks[0],0);
    isolated=out.state;
  }
  assert.ok(later.some(e=>e.kind==='TECH_LOSS'&&e.dateYear===expiry+20));
  assert.ok(isolated.outcome.terminal);

});

test('silent parent support expires at report age plus route delay, then TECH_LOSS; undelivered status cannot help',()=>{
  const f=forced('COLONY_LOST');f.initial.atTick='200';
  f.initial.regions=[region('r00',{pop:'4000',tiers:[5,5,4,6,4,3,4]})];
  setOverride(f,'parameters.g',Array(8).fill(0));
  const w=createPlanet(f.base,f.seed,{forced:f});
  const initial=structuredClone(w.checkpoints[0].live.arcs[0]);initial.foundedYear=0;
  const status={source:'parent',lineageId:initial.lineageId,population:1000000n,tiers:[5,5,4,6,4,3,4],reportYear:2000,routeDelayYears:20};
  const notice=message('test',200n,'parent','STATUS',initial.id,null,{status},0,202n);
  let a=initial;
  for(let i=0;i<2;i++)a=stepPlanet(w.def,a).state;
  assert.equal(a.lineageReports.length,0);assert.equal(a.regions[0].lowTicks[0],2);
  a=stepPlanet(w.def,{...a,inbox:[notice]}).state;
  assert.equal(a.regions[0].lowTicks[0],0);
  const clone=structuredClone(a);clone.lineageReports=[];assert.notEqual(stateDigest(a),stateDigest(clone));
  while(a.tick<232n){const out=stepPlanet(w.def,a);assert.ok(!out.events.some(e=>e.kind==='TECH_LOSS'));a=out.state;}
  assert.equal(maintenancePopulation(a,a.regions[0],0,4000n,40000n),4000n);
  const events=[];
  for(let i=0;i<3;i++){const out=stepPlanet(w.def,a);events.push(...out.events);a=out.state;}
  assert.ok(events.some(e=>e.kind==='TECH_LOSS'&&e.dateYear===2340));
  // A queued message alone is not delivered state, and cannot confer maintenance.
  assert.equal(maintenancePopulation({...initial,outbox:[notice]},initial.regions[0],0,4000n,40000n),4000n);
});

test('STATUS requires a declared route, even for a fixture-founded own-lineage destination',()=>{
  const input=graph(3),f=networkFixture();f.ticks=4;
  // s02 is deliberately disconnected. Fixture arrival is exogenous.
  f.initial.voyages[0].destination='stub:s02:b0';
  const result=createDomain(input,f.seed,{forced:f}).run();
  assert.equal(result.state.arcs.length,2);
  assert.ok(result.ledgers.every(l=>!l.state.messages.some(m=>m.type==='STATUS')));
  assert.ok(result.state.arcs.every(a=>a.lineageReports.length===0));
  f.initial.voyages[0].destination='stub:s01:b0';
  const linked=createDomain(input,f.seed,{forced:f}).run();
  const queued=linked.ledgers[0].state.messages.filter(m=>m.type==='STATUS');
  assert.equal(queued.length,2);assert.ok(queued.every(m=>m.payload.status.routeDelayYears===1&&m.deliveryTick===3n));
  assert.ok(linked.ledgers[1].state.arcs.every(a=>a.lineageReports.length===0));
  assert.ok(linked.ledgers[2].state.arcs.every(a=>a.lineageReports.length===1));

});

test('support is domain-qualified, own-lineage only, source-sorted and latest-report only',()=>{
  const f=forced('RECOVERY'),w=createPlanet(f.base,f.seed,{forced:f});
  let a=w.checkpoints[0].live.arcs[0];
  const report=(source,population,tiers,lineageId=a.lineageId,reportYear=0)=>({source,population:BigInt(population),tiers,lineageId,reportYear,routeDelayYears:0});
  const statuses=[report('z',10003,[5]),report('a',20004,[4]),report('alien',1000000,[5],'foreign'),report(a.id,1000000,[5])];
  a=stepPlanet(w.def,{...a,inbox:statuses.map((status,i)=>message('test',a.tick,status.source,'STATUS',a.id,null,{status},i,a.tick))}).state;
  assert.deepEqual(a.lineageReports.map(r=>r.source),['a','z']);
  const r={pop:1n,tiers:[5]};assert.equal(maintenancePopulation(a,r,0,1n,40000n),1001n);
  assert.equal(maintenancePopulation({...a,lineageReports:[...a.lineageReports].reverse()},r,0,1n,40000n),1001n);
  r.tiers=[4];assert.equal(maintenancePopulation(a,r,0,1n,10000n),3001n);
  const old=a.lineageReports;
  a=stepPlanet(w.def,{...a,inbox:[message('test',a.tick,'z','STATUS',a.id,null,{status:report('z',999999,[5])},0,a.tick)]}).state;
  assert.deepEqual(a.lineageReports,old,'duplicate reportYear cannot replace a report');
});
