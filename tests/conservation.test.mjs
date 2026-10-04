import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forced,runForced,region,setOverride } from './civ-helpers.mjs';
test('800 permille migrations resolve 80 then 16; each transfer balances every tick',()=>{
  const f=forced('MIGRATION');f.id='interaction-two-migrations';f.initial.regions=[region('r00',{pop:'100'})];
  setOverride(f,'magnitude.evt.migration.fraction','800');setOverride(f,'parameters.g',Array(8).fill(0));setOverride(f,'parameters.build',Array(8).fill(0));
  const result=runForced(f),transfers=result.events.flatMap(e=>e.effects.filter(x=>x.op==='transfer'));
  assert.deepEqual(transfers.slice(0,2).map(t=>BigInt(t.amount)),[80n,16n]);
  assert.notEqual(transfers[1].amount,'80'); // Original-stock debit negative control.
  for(const l of result.ledgers){const balance=l.endState.regions.map(r=>({id:r.id,value:0n}));let out=0n,into=0n;
    for(const e of result.events.filter(e=>e.tick===l.tick))for(const t of e.effects.filter(x=>x.op==='transfer')){balance.find(x=>x.id===t.target).value-=BigInt(t.amount);out+=BigInt(t.amount);balance.find(x=>x.id===t.to).value+=BigInt(t.amount);into+=BigInt(t.amount);assert.equal(t.toField,'region.pop');}
    assert.equal(out,into);assert.equal(balance.reduce((n,x)=>n+x.value,0n),0n);
    assert.equal(l.endState.regions.reduce((n,r)=>n+r.pop,0n),100n);
  }
});
