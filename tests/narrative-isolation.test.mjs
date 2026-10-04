import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {narrative,NAME_GRAMMAR} from '../src/narrative.mjs';
import {scenarioRun} from './m3-helpers.mjs';
const graph=new Map(readdirSync('src').filter(p=>p.endsWith('.mjs')).map(file=>[file,[...readFileSync('src/'+file,'utf8').matchAll(/(?:from\s*|import\s*)['"]\.\/([^'"]+)['"]/g)].map(m=>m[1])]));
function closure(file,seen=new Set()){if(seen.has(file))return seen;seen.add(file);for(const next of graph.get(file)??[])closure(next,seen);return seen;}
test('transitive import graph isolates narrative and keeps refiners away from solver writes',()=>{
  const solvers=['planet.mjs','domain.mjs','m2b.mjs','polities.mjs','tech.mjs','chains.mjs','hazard.mjs','refine-cell.mjs','refine-year.mjs'];
  for(const file of solvers){assert.ok(!closure('narrative.mjs').has(file));assert.ok(!closure(file).has('narrative.mjs'));}
  for(const ref of ['refine-cell.mjs','refine-year.mjs'])for(const s of solvers.filter(s=>!s.startsWith('refine-')))assert.ok(!closure(ref).has(s));
  graph.get('refine-year.mjs').push('planet.mjs');assert.ok(closure('refine-year.mjs').has('planet.mjs'),'negative graph edge is detected');graph.get('refine-year.mjs').pop();
});
test('grammar changes narrative digest without changing the causal result',()=>{
  const {world,result}=scenarioRun('lonely-earthlike','m3-1',100),a=narrative(world.def,result.events),grammar={...NAME_GRAMMAR,prefix:['Changed']},b=narrative(world.def,result.events,[],grammar);
  assert.notEqual(a.narrativeDigest,b.narrativeDigest);assert.equal(world.resultDigest(),result.resultDigest);assert.deepEqual(narrative(world.def,[...result.events].reverse()),a);
});
