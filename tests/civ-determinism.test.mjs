import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createPlanet } from '../src/planet.mjs';
import { canonicalBytes,freezeCanonical } from '../src/canonical.mjs';
import { forced } from './civ-helpers.mjs';
// Self-generated golden: stability only, not an independent correctness oracle.
const GOLDEN='868931e18ed59a4c11a68df399be4ce074911d44d1886176a4f07bd9011c57e5';
test('same seed twice and fresh process; other seed differs; self-generated golden',()=>{
  const make=seed=>createPlanet('temperate',seed,{years:100});
  const a=make('civ-m2a-golden'),root=a.resultDigest();assert.equal(root,GOLDEN);
  assert.throws(()=>{a.def.seed='mutated';});assert.throws(()=>{a.def.edges[0].contact=0;});
  assert.equal(make('civ-m2a-golden').resultDigest(),root);assert.notEqual(make('civ-m2a-other').resultDigest(),root);
  const child=spawnSync(process.execPath,['src/cli.mjs','--civ','temperate','--seed','civ-m2a-golden','--years','100','--digest'],{encoding:'utf8',timeout:1500});
  assert.equal(child.status,0,child.stderr);assert.equal(child.stdout.trim(),root);
  assert.equal(a.compileSummary().resultDigest,root);
});
test('chapter-boundary fixture forward, reverse, cold and cache clearing agree',()=>{
  const f=forced('PLAGUE');f.initial.atTick='638';
  const make=()=>createPlanet('temperate',f.seed,{forced:f});
  const a=make(),root=a.resultDigest([0,1]);
  assert.equal(make().resultDigest([1,0]),root);assert.equal(make().resultDigest([1,0],{cold:true}),root);
  a.clearCache();assert.equal(a.resultDigest(),root);assert.throws(()=>a.resultDigest([0,0]));
  assert.deepEqual(a.checkpoints.map(c=>c.tick),[638n,640n]);
  for(const cp of a.checkpoints){assert.deepEqual(Object.keys(cp).sort(),['archiveRecords','live','tick']);assert.equal(cp.live.coverage,'complete-domain');assert.ok(!/rngState|cursor|streamState/.test(canonicalBytes(cp).toString()));}
  const chapter=a.chapter(0);assert.throws(()=>chapter.ledgers[0].endState.regions[0].pop++);
});
test('immutable serialization cache preserves bytes and rejects unsafe values',()=>{
  const value={z:[1n,2,{'a':'x'}],a:{n:4}},before=canonicalBytes(value);
  freezeCanonical(value);assert.deepEqual(canonicalBytes(value),before);assert.throws(()=>value.z[2].a='changed');
  assert.throws(()=>freezeCanonical({get a(){return 1;}}));
});
