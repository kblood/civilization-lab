import {test} from 'node:test';
import assert from 'node:assert/strict';
import {refineCell,aggregateCells,splitPopulation} from '../src/refine-cell.mjs';
import {checkProjection} from '../src/levels.mjs';
import {scenarioRun,regional} from './m3-helpers.mjs';
import {below} from '../src/rng.mjs';
test('four active scenarios: every region/tick preserves populations, phase budgets, events and categorical state',()=>{
  for(const name of ['lonely-earthlike','harsh-anoxic','crowded-domain','high-perils']){
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
});
test('zero subtree, all-zero fallback, canonical epoch reweighting and independent-growth negative control',()=>{
  assert.deepEqual(splitPopulation(17n,Array(16).fill(0n)),[1n,1n,1n,1n,1n,1n,1n,1n,1n,1n,1n,1n,1n,1n,1n,2n]);
  assert.equal(splitPopulation(17n,[...Array(8).fill(0n),...Array(8).fill(1n)]).slice(0,8).reduce((a,b)=>a+b),0n);
  const {ticks}=scenarioRun('lonely-earthlike'),t=ticks.at(-1),{def,contract,address}=regional(t,t.pre.regions[0]);
  def.epochs=[{fromEpoch:'0',untilEpoch:'1',cellWeights:Array(16).fill('1')},{fromEpoch:'1',untilEpoch:'2',cellWeights:['16',...Array(15).fill('0')]}];
  const c=refineCell(def,contract,address);assert.equal(c.cells[0].end.pop,contract.end.pop);assert.deepEqual(aggregateCells(c),contract);
  const next={...contract,tick:'100',start:contract.end,end:contract.end,naturalDelta:0n,phases:[],mandatoryEvents:[],boundaryHistory:[...contract.boundaryHistory,{tick:'101',pop:contract.end.pop}]};
  assert.deepEqual(refineCell(def,next,{...address,tick:100n}).cells.map(c=>c.start),c.cells.map(c=>c.end));
  assert.equal(checkProjection(def,contract,address,refineCell,aggregateCells).status,'ok');
  const wrong=(d,p,a)=>{const child=refineCell(d,p,a);child.cells[0].end.pop+=1n+below({worldSeed:d.seed,manifestDigest:d.manifestDigest,level:'C',entityId:child.cells[0].id,purpose:'ref.cell.local',episodeOrBucket:BigInt(p.tick),ordinal:99},10n);return child;};
  assert.equal(checkProjection(def,contract,address,wrong,aggregateCells).status,'REFINEMENT_CONTRACT_ERROR');
});
test('town abandonment retains its founding identity across independent tick queries',()=>{
  const def={seed:'town',manifestDigest:'0'.repeat(64)},history=[{tick:'0',pop:8000n},{tick:'1',pop:32000n},{tick:'2',pop:32000n},{tick:'3',pop:8000n}];
  function query(tick){const start=history[tick].pop,end=history[tick+1].pop;return refineCell(def,{tick:String(tick),regionId:'r',start:{pop:start},end:{pop:end},naturalDelta:end-start,phases:[{phase:'natural',delta:end-start}],mandatoryEvents:[],boundaryHistory:history.slice(0,tick+2)},{regionId:'r',tick});}
  const abandoned=query(2).annotations.filter(e=>e.kind==='TOWN_ABANDONED'),founded=query(0).annotations.filter(e=>e.kind==='TOWN_FOUNDED');
  assert.equal(abandoned.length,16);assert.deepEqual(abandoned.map(e=>e.townId).sort(),founded.map(e=>e.townId).sort());assert.ok(abandoned.every(e=>e.foundingTick==='1'));
});
