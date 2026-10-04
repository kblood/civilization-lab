import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlanet } from '../src/planet.mjs';
import {createDomain} from '../src/domain.mjs';
test('report short toy-12 domain compilation cost without a timing assertion',()=>{
  const start=process.hrtime.bigint(),r=createDomain('fixtures/domains/toy-12.json','toy-1',{years:100}).compileSummary();
  console.log(`Observed short toy-12: ${(Number(process.hrtime.bigint()-start)/1000000).toFixed(2)} ms; ${r.ticks} ticks; ${r.arcRoots.length} populated arcs`);
  assert.equal(r.outcome,'EXTANT_PLANETARY');assert.match(r.resultDigest,/^[a-f0-9]{64}$/);
});
test('busy temperate seed compiles 20000 years including all root hashing in under 2000 ms',()=>{
  const start=process.hrtime.bigint();
  const result=createPlanet('temperate','civ-m2a-5',{years:20000}).compileSummary();
  const elapsed=Number(process.hrtime.bigint()-start)/1000000;
  assert.ok(result.ticks>0&&result.ticks<=2000);
  if(result.ticks<2000)assert.equal(result.state.outcome.terminal,true,'only terminal histories may stop early');
  assert.ok(result.events.length>=100,'busy seed must emit at least 100 events');assert.match(result.resultDigest,/^[a-f0-9]{64}$/);
  const populated=result.state.regions.filter(r=>r.pop>0n).length;
  assert.ok(populated>1||result.state.regions.some(r=>r.tiers.some(t=>t>0)),'history must populate multiple regions or advance a tier');
  console.log(`Observed 20 kyr civ-m2a-5: ${elapsed.toFixed(2)} ms; ${result.events.length} events; ${populated} populated regions`);
  assert.ok(elapsed<2000,`${elapsed.toFixed(2)} ms exceeds 2000 ms`);
});
