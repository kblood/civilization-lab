import assert from 'node:assert/strict';
import {refineCell,aggregateCells} from '../src/refine-cell.mjs';
import {scenarioRun,regional} from './m3-helpers.mjs';
export function checkCellScenarios(names){
  for(const name of names){
    const {ticks,result}=scenarioRun(name);assert.ok(result.events.length>0);assert.ok(ticks[0].pre.regions.some(r=>r.pop>0n));
    assert.equal(Number(ticks.at(-1).tick+1n)*10,1000);
    for(const t of ticks){let start=0n,end=0n;
      for(const r of t.pre.regions){const {def,contract,address}=regional(t,r),c=refineCell(def,contract,address);
        assert.deepEqual(aggregateCells(c),contract);assert.equal(c.anchors.length,contract.mandatoryEvents.length);
        assert.ok(c.annotations.every(e=>e.effects.length===0));start+=c.cells.reduce((n,c)=>n+c.start.pop,0n);end+=c.cells.reduce((n,c)=>n+c.end.pop,0n);}
      assert.equal(start,t.start.regions.reduce((n,r)=>n+r.pop,0n));assert.equal(end,t.end.regions.reduce((n,r)=>n+r.pop,0n));
      for(const e of t.events)for(const x of e.effects.filter(x=>x.op==='transfer'))assert.ok(BigInt(x.amount)>=0n);
    }
  }

}
