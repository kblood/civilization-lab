import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createScenario,loadScenario,SCENARIOS} from '../src/scenario.mjs';
test('from-scratch scenario begins at E0; lonely retains unforced hard-step origins',()=>{
  assert.ok(SCENARIOS.includes('forager-future'));assert.equal(loadScenario('forager-future').untilYear,120000);
  const {world}=createScenario('forager-future','m4-start',{untilYear:10}),r=world.compileSummary({observe:true});
  assert.equal(r.firstEras[0],0);assert.equal(r.firstEras[1],null);
  const lonely=createScenario('lonely-earthlike','m4-lonely',{untilYear:10}).world;
  assert.equal(lonely.def.forced.initial,null);assert.equal(lonely.def.planets[0].lifecycle.value.habitableUntilYear,2000000);
  assert.equal(loadScenario('lonely-earthlike').untilYear,320000);
});
