import {test} from 'node:test';
import assert from 'node:assert/strict';
import {refineYear,aggregateYears} from '../src/refine-year.mjs';
import {refineCell} from '../src/refine-cell.mjs';
import {scenarioRun,regional} from './m3-helpers.mjs';
import {annualHierarchy} from '../src/annual-inspection.mjs';
import {refineYearTree,aggregateYearTree} from '../src/refine-year.mjs';
function check(p){const c=refineYear({},p,{tick:p.tick});assert.deepEqual(aggregateYears(c),p);
  for(let j=0;j<10;j++){const residual=10n*(p.start.pop-c.samples[j].pop)+BigInt(j)*p.naturalDelta;assert.ok(residual>=0n&&residual<10n);assert.ok(c.samples[j].pop>=0n);}
  assert.deepEqual(c.samples[10],{year:Number(BigInt(p.tick)*10n)+10,...p.end});
  c.samples[4].pop++;assert.throws(()=>aggregateYears(c),/REFINEMENT_CONTRACT_ERROR/);
}
test('arc, region and every cell: exact end boundaries, nonnegative values, rational error less than one',()=>{
  check({tick:'0',start:{pop:10n},end:{pop:0n},naturalDelta:-9n});
  check({tick:'0',start:{pop:0n},end:{pop:100n},naturalDelta:0n});
  for(const t of scenarioRun('lonely-earthlike','m3-1',200).ticks){let delta=0n;
    for(const r of t.pre.regions){const {def,contract,address}=regional(t,r),child=refineCell(def,contract,address);delta+=contract.naturalDelta;
      check({tick:String(t.tick),start:{pop:r.pop,tiers:r.tiers,polityId:r.polityId,era:r.era},end:{pop:contract.end.pop,tiers:contract.end.tiers,polityId:contract.end.polityId,era:contract.end.era},naturalDelta:contract.naturalDelta});
      for(const c of child.cells)check({tick:String(t.tick),start:{...c.start,pop:c.annualStart},end:c.end,naturalDelta:c.naturalDelta});
    }
    check({tick:String(t.tick),start:{pop:t.pre.regions.reduce((n,r)=>n+r.pop,0n),outcome:t.pre.outcome},end:{pop:t.end.regions.reduce((n,r)=>n+r.pop,0n),outcome:t.end.outcome},naturalDelta:delta});
  }
});

test('hierarchical largest remainders preserve every annual sum and strict rational error',()=>{
  let exposed=0;
  for(const t of scenarioRun('crowded-domain','annual-active',20).ticks){
    const tree=annualHierarchy(t);aggregateYearTree(tree);exposed++;
    function checkNode(node){
      for(let j=0;j<10;j++){
        const residual=10n*(node.samples[j].pop-node.contract.start.pop)-BigInt(j)*node.contract.naturalDelta;
        assert.ok(residual>-10n&&residual<10n);assert.ok(node.samples[j].pop>=0n);
      }
      if(node.children){for(let j=0;j<=10;j++)assert.equal(node.children.reduce((n,c)=>n+c.samples[j].pop,0n),node.samples[j].pop);node.children.forEach(checkNode);}
    }
    checkNode(tree);tree.children[0].samples[1].pop++;assert.throws(()=>aggregateYearTree(tree),/REFINEMENT_CONTRACT_ERROR/);
  }
  assert.ok(exposed>0);
  const children=Array.from({length:16},(_,i)=>({id:String(i).padStart(2,'0'),tick:'0',start:{pop:0n},end:{pop:1n},naturalDelta:1n}));
  const p={tick:'0',start:{pop:0n},end:{pop:16n},naturalDelta:16n,children};
  const old=children.reduce((n,c)=>n+refineYear({},c,{tick:0}).samples[1].pop,0n);
  assert.equal(old,0n);assert.equal(refineYear({},p,{tick:0}).samples[1].pop,1n);assert.notEqual(old,1n);
  const tree=refineYearTree(p);assert.equal(tree.children[0].samples[1].pop,1n);assert.equal(tree.children.reduce((n,c)=>n+c.samples[1].pop,0n),1n);
});
