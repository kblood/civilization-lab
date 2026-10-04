import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDomainDefinition,originSchedule} from '../src/domain.mjs';
import {ceilDiv} from '../src/time.mjs';
test('hard steps sum exact waits and round delivery up; horizons never redraw or shorten life',()=>{
  const d=createDomainDefinition('fixtures/domains/toy-12.json','toy-1',{years:100}),o=d.origins[0],p=d.planets[0];
  assert.equal(BigInt(o.sapienceYear),o.waitYears.reduce((a,b)=>a+b,0n));
  assert.equal(o.deliveryTick,ceilDiv(BigInt(o.sapienceYear),10n));
  assert.deepEqual(originSchedule({...d,untilTick:1n},p),o);
  const dead=structuredClone(p);dead.lifecycle.value.habitableUntilYear=10;
  const none=originSchedule(d,dead);assert.equal(none.status,'no-lineage');assert.equal(none.sapienceYear,null);assert.deepEqual(none.waitYears,o.waitYears);
  const empty=structuredClone(p);empty.lifecycle.value.complexLifeFromYear=null;assert.equal(originSchedule(d,empty).status,'no-lineage');
});
