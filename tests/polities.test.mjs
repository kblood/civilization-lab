import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forced,runForced,region,polity,setOverride } from './civ-helpers.mjs';
test('schism cannot act through a parent retired by an earlier same-tick split',()=>{
  const f=forced('SCHISM');setOverride(f,'hazard.FRAGMENTATION.q32','171798691840');
  const r=runForced(f);assert.ok(r.events.some(e=>e.kind==='FRAGMENTATION'&&e.resolution==='accepted'));
  const schisms=r.events.filter(e=>e.kind==='SCHISM');assert.ok(schisms.length>0);assert.ok(schisms.every(e=>e.resolution==='pre-empted'&&e.effects.length===0));
  assert.ok(r.state.regions.every(r=>r.cultureId.endsWith('#cul:founder')));
});
test('conquest conserves territory, ownership is unique, retired IDs never return',()=>{
  const result=runForced(forced('CONQUEST'));const retired=[];
  assert.ok(result.events.some(e=>e.kind==='CONQUEST'&&e.data.outcome==='CONQUEST'&&e.resolution==='accepted'));
  for(const l of result.ledgers){for(const a of l.archived.filter(a=>a.kind==='polity')){assert.ok(!retired.includes(a.id));retired.push(a.id);}
    assert.equal(l.endState.polities.flatMap(p=>p.regions).length,2);
    for(const r of l.endState.regions){const owners=l.endState.polities.filter(p=>p.regions.includes(r.id));assert.equal(owners.length,r.polityId===null?0:1);if(owners.length)assert.equal(owners[0].id,r.polityId);}
    assert.ok(l.endState.polities.every(p=>!retired.includes(p.id)));
  }
  assert.ok(retired.length>0);
});
test('reciprocal war keeps smaller owner and duplicate declarations never open extra chains',()=>{
  const r=runForced(forced('WAR')),accepted=r.events.filter(e=>e.kind==='WAR'&&e.resolution==='accepted');
  assert.equal(accepted.length,1);assert.equal(r.state.chains.length,1);assert.ok(accepted[0].ownerId.includes('#pol:fixture:a>'));
  assert.ok(r.events.some(e=>e.reason==='reciprocal-war'&&e.data.survivor===accepted[0].id));
});
test('overlapping collapse splits claim parent once and preserve flat identity and regions',()=>{
  const f=forced('COLLAPSE');f.initial.regions=[region('r00',{tiers:[0,1,0,0,0,0,0]}),region('r01')];f.initial.polities=[polity('a',['r00','r01'])];
  const result=runForced(f),splits=result.events.filter(e=>e.kind==='COLLAPSE');
  assert.equal(splits.reduce((n,e)=>n+Number(e.params.splitCount),0),1);
  assert.equal(result.state.polities.length,2);assert.deepEqual(result.state.polities.flatMap(p=>p.regions).sort(),result.state.regions.slice(0,2).map(r=>r.id));
  assert.ok(result.state.polities.every(p=>/^.*#pol:0:19:r00:[01]$/.test(p.id)&&p.parentIds.length===1));
  assert.equal(result.ledgers[0].archived.filter(a=>a.kind==='polity').length,1);
});
