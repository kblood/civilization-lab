import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scenarioRun,regional} from './m3-helpers.mjs';
import {refineCell} from '../src/refine-cell.mjs';
import {refineYear} from '../src/refine-year.mjs';
import {narrative} from '../src/narrative.mjs';
import {centurySummaries,eras} from '../src/views.mjs';
test('none/some/all cells, shuffled refinements, views, narrative and cold starts preserve P/D roots',()=>{
  for(const name of ['lonely-earthlike','crowded-domain']){const {world,result,ticks}=scenarioRun(name,'m3-1',100),before={result:result.resultDigest,d:result.dRoot??null,arcs:result.arcRoots??null};
    const jobs=ticks.flatMap(t=>t.pre.regions.map(r=>()=>{const {def,contract,address}=regional(t,r);refineCell(def,contract,address);refineYear({}, {tick:String(t.tick),start:{pop:r.pop},end:{pop:contract.end.pop},naturalDelta:contract.naturalDelta},address);}));
    jobs[0]();narrative(world.def,result.events);centurySummaries(ticks,result.events);eras(ticks);
    assert.equal(world.resultDigest(),before.result);
    for(const i of [...jobs.keys()].filter(i=>i%2).reverse().concat([...jobs.keys()].filter(i=>i%2===0)))jobs[i]();
    world.clearCache();const after=world.compileSummary();assert.deepEqual({result:after.resultDigest,d:after.dRoot??null,arcs:after.arcRoots??null},before);
    assert.equal(scenarioRun(name,'m3-1',100).result.resultDigest,before.result);
  }
});
