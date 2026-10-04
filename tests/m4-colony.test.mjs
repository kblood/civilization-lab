import {test} from 'node:test';
import assert from 'node:assert/strict';
import {forced,runForced,setOverride} from './civ-helpers.mjs';
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
