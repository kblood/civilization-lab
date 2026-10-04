import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDomain,DOMAIN_FIELDS,VOYAGE_FIELDS,domainStateDigest} from '../src/domain.mjs';
import {forced} from './civ-helpers.mjs';
import {readFileSync} from 'node:fs';
import {extractTable} from './table-helpers.mjs';
test('arc step permutations and colony/home/cold queries produce identical composed roots',()=>{
  const f=forced('COLONY_FOUNDED');f.ticks=4;
  const w=createDomain(f.base,f.seed,{forced:f}),a=w.compileSummary(),b=w.compileSummary({arcOrder:'reverse'});
  assert.equal(a.resultDigest,b.resultDigest);assert.deepEqual(a.events,b.events);assert.equal(a.arcRoots.length,2);
  assert.equal(w.queryArc('stub:s00:b1').resultDigest,a.resultDigest);
  assert.equal(w.queryArc('stub:s00:b0').resultDigest,a.resultDigest);
  w.clearCache();assert.equal(w.queryArc('stub:s00:b1',{cold:true}).resultDigest,a.resultDigest);
  assert.notEqual(a.arcRoots[0].root,a.arcRoots[1].root);
});
test('D delta table covers every field, including archived voyages; structural mutation changes root',()=>{
  const table=extractTable(readFileSync('docs/transition-table-v1.md','utf8'));
  const f=forced('VOYAGE_LOST'),r=createDomain(f.base,f.seed,{forced:f}).run();
  assert.deepEqual(table.rules.domainWitness.fields,DOMAIN_FIELDS);
  assert.deepEqual(Object.keys(r.state).sort(),DOMAIN_FIELDS);
  const voyage=r.archiveRecords.find(a=>a.kind==='voyage').record;
  assert.deepEqual(Object.keys(voyage).sort(),VOYAGE_FIELDS);
  const keys=root=>table.fields.filter(f=>f.path.startsWith(root+'.')).map(f=>f.path.slice(root.length+1)).sort();
  assert.deepEqual(VOYAGE_FIELDS,keys('voyage'));assert.deepEqual(Object.keys(voyage.hazard).sort(),keys('hazard'));
  for(const cp of r.checkpoints)for(const root of ['lineage','voyage','transit','message','origin'])for(const value of cp.live[{lineage:'lineages',voyage:'voyages',transit:'transit',message:'messages',origin:'origins'}[root]])assert.deepEqual(Object.keys(value).sort(),keys(root));
  const changed=structuredClone(r.state);changed.lineages[0].foundedArcs++;
  assert.notEqual(domainStateDigest(changed),domainStateDigest(r.state));
  for(const cp of r.checkpoints)assert.deepEqual(Object.keys(cp).sort(),['archiveRecords','live','tick']);
});
