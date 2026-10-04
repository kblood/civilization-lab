import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalBytes} from '../src/canonical.mjs';
import {scenarios,queries,digest} from './refinement-order-child.mjs';

function shuffled(jobs){
  const order=[...jobs];let state=0x5eed;
  // Fixed-seed Fisher-Yates permutation, independent of the production RNG.
  for(let i=order.length-1;i>0;i--){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const j=state%(i+1);[order[i],order[j]]=[order[j],order[i]];
  }
  return order;
}

test('full cell and annual outputs are invariant under warm and cold query orders',()=>{
  const expected=new Map();
  for(const [name,seed] of scenarios){
    const jobs=queries(name,seed),baseline=new Map();let anchors=0,locals=0;
    for(const kind of ['cells','annual'])for(const q of jobs[kind]){
      const output=q.run(),key=kind+':'+q.key;
      assert.ok(!baseline.has(key),'unique query key '+key);
      baseline.set(key,canonicalBytes(output));
      if(kind==='cells'){
        anchors+=output.anchors.length;
        locals+=output.annotations.filter(a=>['RAID','LOCAL_FLOOD','LOCAL_SUCCESSION'].includes(a.kind)).length;
      }
    }
    assert.ok(anchors>0,name+': mandatory anchors exercised');
    assert.ok(locals>0,name+': local annotations exercised');
    for(const [label,reorder] of [['reversed',xs=>[...xs].reverse()],['shuffled',shuffled]]){
      // Pollute placement, town and allocation caches with another seeded world,
      // then interleave later/earlier queries before each complete comparison.
      const unrelated=queries(name,seed+'-warm');
      for(const kind of label==='shuffled'?['cells']:['annual','cells']){
        unrelated[kind].at(-1).run();unrelated[kind][0].run();
        jobs[kind].at(-1).run();jobs[kind][0].run();
        const order=reorder(jobs[kind]);
        assert.notDeepEqual(order.map(q=>q.key),jobs[kind].map(q=>q.key),kind+' order must differ');
        for(const q of order){
          assert.ok(canonicalBytes(q.run()).equals(baseline.get(kind+':'+q.key)),
            `${name}: ${kind} ${label} canonical bytes differ at ${q.key}`);
        }
      }
    }
    expected.set(name,digest(baseline));
  }
  const child=spawnSync(process.execPath,[fileURLToPath(new URL('./refinement-order-child.mjs',import.meta.url))],
    {encoding:'utf8',timeout:1500,maxBuffer:1024*1024});
  assert.ifError(child.error);
  assert.equal(child.status,0,child.stderr);
  const rows=child.stdout.trim().split('\n').map(line=>JSON.parse(line));
  assert.deepEqual(rows.map(row=>row.name).sort(),[...expected.keys()].sort());
  for(const row of rows)assert.equal(row.digest,expected.get(row.name),row.name+': cold canonical digest differs');
});
