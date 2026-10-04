import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareEvents } from '../src/events.mjs';
import { mergeProvenance } from '../src/provenance.mjs';
import { forced,runForced,setOverride } from './civ-helpers.mjs';
import { loadPlanet } from '../src/environment.mjs';
test('every causal edge is strictly earlier; real chains and hazards are covered',()=>{
  for(const kind of ['PLAGUE','CONQUEST','AGRICULTURE']){
    const result=runForced(forced(kind));let edges=0;
    for(const e of result.events){for(const c of e.causes){const cause=result.events.find(e=>e.id===c.eventId);assert.ok(cause);assert.ok(compareEvents(cause,e)<0);edges++;}
      if(e.trigger.mode==='hazard'){assert.ok(BigInt(e.trigger.distance_q32)>0n);assert.ok(BigInt(e.trigger.distance_q32)<=BigInt(e.trigger.h_q32));}
    }
    assert.ok(edges>0); // A strict total order on all edges proves acyclicity.
  }
});
test('provenance decays, merges repeated sources, breaks score ties by event ID',()=>{
  const old=[{target:'r',field:'region.pop',entries:[{eventId:'z',score:8n},{eventId:'a',score:4n},{eventId:'zero',score:1n}]}];
  const additions=[{target:'r',field:'region.pop',entries:[{eventId:'a',score:2n},{eventId:'c',score:4n},{eventId:'b',score:4n}]}];
  assert.deepEqual(mergeProvenance(old,additions)[0].entries,[{eventId:'a',score:4n},{eventId:'b',score:4n},{eventId:'c',score:4n}]);
  assert.deepEqual(mergeProvenance(old,additions),mergeProvenance(old,[{...additions[0],entries:[...additions[0].entries].reverse()}]));
});
test('natural extinction records every active-chain invalidation once and archives all owners',()=>{
  const f=forced('WAR');f.initial.atTick='99';f.ticks=4;
  const original=loadPlanet().planet.epochs.value.rows;
  const rows=[...original.map(r=>({...r,untilEpoch:'1'})),...original.map(r=>({...r,fromEpoch:'1',Kbase:'0'}))];
  setOverride(f,'epoch.rows',rows);const r=runForced(f);
  assert.equal(r.state.outcome.terminal,true);assert.equal(r.state.lastDeath.eventId,null);
  assert.equal(r.state.chains.length,0);assert.equal(r.state.polities.length,0);assert.equal(r.state.hazardLedger.length,0);
  const extinct=r.events.find(e=>e.kind==='EXTINCTION');assert.equal(extinct.tick,'101');
  const invalid=r.events.filter(e=>e.data.stage==='INVALIDATED');assert.ok(invalid.length>0);assert.ok(invalid.every(e=>e.reason==='arc-ended'&&e.chain.status==='invalidate'));
  const archives=r.ledgers.flatMap(l=>l.archived).filter(a=>a.kind==='chain');assert.equal(archives.length,invalid.length);
  assert.ok(archives.every(a=>a.record.nextTick===null&&a.record.frontier.length===0));
});
