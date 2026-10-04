import {test} from 'node:test';
import assert from 'node:assert/strict';
import {refineYear,refineYearTree,aggregateYearTree} from '../src/refine-year.mjs';
import {scenarioRun} from './m3-helpers.mjs';
import {annualHierarchy} from '../src/annual-inspection.mjs';
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
