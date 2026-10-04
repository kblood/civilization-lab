import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDomain} from '../src/domain.mjs';
import {forced,runForced,setOverride,region} from './civ-helpers.mjs';
import {graph,expansionFixture} from './domain-helpers.mjs';
test('known arrival chain on five-node graph never reaches the disconnected node',()=>{
  const f=expansionFixture(),w=createDomain(graph(),f.seed,{forced:f}),r=w.compileSummary();
  const founded=r.events.filter(e=>e.kind==='COLONY_FOUNDED'&&e.data.stage==='FOUNDED');
  assert.deepEqual(founded.slice(0,3).map(e=>[e.ownerId,e.dateYear]),[['stub:s01:b0',110],['stub:s02:b0',210],['stub:s03:b0',310]]);
  assert.ok(!r.arcRoots.some(a=>a.id.includes('stub:s04:b0')));
  assert.ok(r.events.filter(e=>e.kind==='LAUNCH'&&e.resolution==='accepted').every(e=>graph().routes.some(route=>route.from===e.data.launch.sourceArc.split(':lin:')[0].slice(4)&&route.to===e.data.launch.destination)));
});
test('launch conserves exact passengers; year 2 plus one-year travel delivers at tick 1',()=>{
  const f=forced('COLONY_FOUNDED');f.initial.voyages[0].tiers=[5,5,5,7,5,4,5];f.initial.voyages[0].launchYear=2;f.initial.voyages[0].arrivalYear=3;
  const r=runForced(f),e=r.events.find(e=>e.kind==='COLONY_FOUNDED');
  assert.equal(e.dateYear,10);assert.equal(e.tick,'1');assert.notEqual(e.dateYear,3);
  assert.equal(e.params.persons,'4000');assert.equal(r.state.transit.length,0);
  assert.equal(e.effects.find(x=>x.op==='transfer').amount,'4000');
});
test('equal-time arrivals resolve by ID, reinforce once, and preserve landing tiers',()=>{
  const f=forced('COLONY_FOUNDED'),v=f.initial.voyages[0];f.initial.voyages.push({...v,label:'z',tiers:[6,5,5,7,5,4,5]});
  const r=runForced(f),es=r.events.filter(e=>e.kind==='COLONY_FOUNDED');
  assert.deepEqual(es.map(e=>e.data.stage),['FOUNDED','REINFORCEMENT']);
  const colony=r.state.arcs.find(a=>a.isColony);assert.deepEqual(colony.foundingTiers,v.tiers);assert.equal(r.state.lineages[0].foundedArcs,2);
});
test('voyage loss records actual deaths; source extinction cannot cancel a later arrival',()=>{
  const lost=runForced(forced('VOYAGE_LOST')),v=lost.archiveRecords.find(a=>a.kind==='voyage').record;
  assert.equal(v.status,'lost');assert.equal(v.lastDeath.kind,'VOYAGE_LOST');assert.equal(v.lastDeath.stage,2);
  const f=forced('COLONY_FOUNDED');f.initial.regions=[];f.ticks=4;Object.assign(f.initial.voyages[0],{arrivalYear:25,deliveryTick:'3'});
  const r=runForced(f);assert.ok(r.events.find(e=>e.kind==='EXTINCTION').dateYear<r.events.find(e=>e.kind==='COLONY_FOUNDED').dateYear);
  assert.equal(r.events.filter(e=>e.kind==='LINEAGE_EXTINCTION').length,0);assert.ok(r.state.arcs.some(a=>a.isColony));
});
test('colony inherits starting tiers rather than caps, and can innovate above them',()=>{
  const f=forced('COLONY_FOUNDED');setOverride(f,'hazard.DISCOVERY.q32','171798691840');
  const r=runForced(f),colony=r.state.arcs.find(a=>a.isColony);
  assert.deepEqual(colony.foundingTiers,[5,5,4,6,4,3,4]);
  assert.ok(colony.regions.some(r=>r.tiers.some((v,d)=>v>colony.foundingTiers[d])));
  assert.deepEqual(colony.regions[0].caps,[6,5,5,7,5,4,5]);
});
