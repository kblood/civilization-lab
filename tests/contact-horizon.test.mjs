import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDomain} from '../src/domain.mjs';
import {graph} from './domain-helpers.mjs';
import {forced} from './civ-helpers.mjs';
test('one immutable manifest: other lineage execution cannot change pre-contact prefix',()=>{
  const input=graph(3);input.origins.push('stub:s01:b0');
  const f=forced('COLONY_FOUNDED');f.initial.atTick='0';f.ticks=4;
  Object.assign(f.initial.voyages[0],{destination:'stub:s01:b0',arrivalYear:25,deliveryTick:'3'});
  const w=createDomain(input,f.seed,{forced:f});
  const full=w.compileSummary({prefixUntil:3n}),suppressed=w.compileSummary({suppressLineages:['lin:stub:s00:b0'],prefixUntil:3n});
  assert.equal(full.manifestDigest,suppressed.manifestDigest);assert.equal(full.recipeDigest,suppressed.recipeDigest);
  const id='arc:stub:s01:b0:lin:stub:s01:b0:0';
  assert.equal(full.prefixRoots.find(a=>a.id===id).root,suppressed.prefixRoots.find(a=>a.id===id).root);
  assert.notEqual(full.resultDigest,suppressed.resultDigest,'negative control: D histories really differ');
  const arrival=full.events.find(e=>e.kind==='COLONY_FOUNDED');assert.equal(arrival.reason,'occupied-by-other-lineage');assert.equal(arrival.data.target,null);
  assert.ok(full.archiveRecords.some(a=>a.kind==='voyage'&&a.record.status==='turned-away'));
});
