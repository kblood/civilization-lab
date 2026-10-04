import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlanet } from '../src/planet.mjs';
import {createDomain} from '../src/domain.mjs';
test('report short toy-12 domain compilation cost without a timing assertion',()=>{
  const start=process.hrtime.bigint(),r=createDomain('fixtures/domains/toy-12.json','toy-1',{years:100}).compileSummary();
  console.log(`Observed short toy-12: ${(Number(process.hrtime.bigint()-start)/1000000).toFixed(2)} ms; ${r.ticks} ticks; ${r.arcRoots.length} populated arcs`);
  assert.equal(r.outcome,'EXTANT_PLANETARY');assert.match(r.resultDigest,/^[a-f0-9]{64}$/);
});
test('one temperate seed compiles 20000 years including all root hashing in under 2000 ms',()=>{
  const start=process.hrtime.bigint();
  const result=createPlanet('temperate','civ-m2a-1',{years:20000}).compileSummary();
  const elapsed=Number(process.hrtime.bigint()-start)/1000000;
  assert.equal(result.ticks,2000);assert.ok(result.events.length>1);assert.match(result.resultDigest,/^[a-f0-9]{64}$/);
  console.log(`Observed 20 kyr: ${elapsed.toFixed(2)} ms`);
  assert.ok(elapsed<2000,`${elapsed.toFixed(2)} ms exceeds 2000 ms`);
});
