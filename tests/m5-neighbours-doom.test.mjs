import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {readFixture,Availability} from '../src/environment.mjs';
import {createScenario} from '../src/scenario.mjs';
import {uninhabitableAt} from '../src/domain.mjs';

// Legacy 3000-year stellar-grace control, deliberately kept unchanged.
const exemptions=['fixtures/planets/m3b-doomed-star-system.json'];
function consistentDoom(system){
  assert.equal(new Set(system.bodies.map(p=>p.lifecycle.value.stellarDoomYear)).size,1,
    'System bodies must have all-null or identical stellarDoomYear values');
}
test('system fixtures share stellar doom, except the explicit legacy control',()=>{
  const systems=readdirSync(new URL('../fixtures/planets/',import.meta.url)).filter(n=>n.endsWith('.json')).sort()
    .map(n=>'fixtures/planets/'+n).filter(p=>readFixture(p).schemaVersion==='civ-system-stub-1');
  assert.ok(systems.length>0);
  for(const path of systems)if(!exemptions.includes(path))consistentDoom(readFixture(path));
  for(const path of exemptions){
    assert.ok(systems.includes(path));
    assert.throws(()=>consistentDoom(readFixture(path)),/System bodies must/);
  }
});
test('doomed neighbours share the home doom and only tier-7 interstellar destinations survive',()=>{
  const def=createScenario('doomed-star','m5-neighbours-doom',{untilYear:10}).world.def;
  const home=def.planets.find(p=>p.body==='stub:s00:b0');
  assert.equal(home.lifecycle.value.stellarDoomYear,25000);
  const bodies=def.planets.filter(p=>p.body.startsWith('stub:s00:'));
  assert.equal(bodies.length,4);
  for(const p of bodies){
    assert.equal(p.lifecycle.value.stellarDoomYear,home.lifecycle.value.stellarDoomYear);
    assert.deepEqual(p.lifecycle,Availability.known(p.lifecycle.value));
  }
  const firstExpiredTick=2550n;
  for(const body of ['stub:s00:b1','stub:s00:b2']){
    const p=bodies.find(p=>p.body===body);
    for(const t of [2499n,2500n,firstExpiredTick-1n])assert.equal(uninhabitableAt(def,p,t),false);
    assert.equal(uninhabitableAt(def,p,firstExpiredTick),true);
  }
  const surviving=def.routes.filter(r=>bodies.some(p=>p.body===r.from)&&
    !uninhabitableAt(def,def.planets.find(p=>p.body===r.to),firstExpiredTick));
  assert.ok(surviving.length>0);
  for(const route of surviving){
    assert.equal(route.kind,'interstellar');
    assert.deepEqual(route.travelYearsByTransportTier.flatMap((v,i)=>v===null?[]:[i]),[7]);
  }
});
