import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDomain,lineageOutcome} from '../src/domain.mjs';
import {forced,runForced,setOverride,region} from './civ-helpers.mjs';
test('collapse is not extinction; regression can recover; permanent cap blocks its domains',()=>{
  const c=runForced(forced('COLLAPSE'));assert.equal(c.state.outcome.terminal,false);assert.equal(c.outcome,'COLLAPSED_RECOVERING');
  const f=forced('COLLAPSE');f.ticks=20;setOverride(f,'parameters.keepPermille','1000');setOverride(f,'parameters.build',Array(8).fill(100));
  assert.ok(runForced(f).events.some(e=>e.kind==='RECOVERY'));
  const p=runForced(forced('ENGINEERED_PANDEMIC'));assert.equal(p.outcome,'EXISTENTIAL_CAP');assert.ok(p.state.regions.every(r=>r.caps[4]===3&&r.caps[5]===2));
  assert.ok(p.state.regions[0].ceilings.some(c=>c.reason==='existential-cap'));
});
test('nonviable colony keeps living people; extinction waits for all arcs and voyages',()=>{
  const c=runForced(forced('COLONY_LOST'));assert.ok(c.state.regions[0].pop>0n);assert.equal(c.state.nonviable,true);assert.equal(c.state.outcome.terminal,false);
  const extinct=runForced(forced('LINEAGE_EXTINCTION'));assert.equal(extinct.outcome,'EXTINCT_NATURAL');assert.equal(extinct.events.filter(e=>e.kind==='LINEAGE_EXTINCTION').length,1);
  const f=forced('COLONY_FOUNDED');f.initial.regions=[];f.initial.voyages[0].arrivalYear=400;f.initial.voyages[0].deliveryTick='40';
  const r=runForced(f);assert.equal(r.events.filter(e=>e.kind==='LINEAGE_EXTINCTION').length,0);assert.equal(r.state.transit[0].pop,4000n);
});
test('O5 sends EXIT at the barrier and delivers it only on the next tick',()=>{
  const f=forced('LINEAGE_EXTINCTION');f.initial.regions=[region('r00',{tiers:[5,5,4,6,4,3,5]})];f.ticks=2;
  const r=runForced(f),first=r.ledgers[0],second=r.ledgers[1];
  assert.equal(first.state.arcs[0].perils,'active');assert.ok(first.state.messages.some(m=>m.type==='PERILS_EXIT'&&m.deliveryTick===1n));
  assert.equal(second.state.arcs[0].perils,'exited');assert.ok(second.planets[0].ledger.phase0.inboxEffects.some(m=>m.sets.some(s=>s.field==='arc.perils'&&s.value==='exited')));
});
test('shared catastrophe uses one resolved payload at t+1 with no recipient resampling',()=>{
  const f=forced('COLONY_FOUNDED');f.ticks=3;f.initial.regions=[region('r00',{tiers:[0,0,0,0,5,0,0]})];f.initial.arc.perils='active';
  setOverride(f,'hazard.RUNAWAY_TECH.q32','171798691840');setOverride(f,'outcome.RUNAWAY_TECH','existential-cap');setOverride(f,'magnitude.evt.perils.shared','1');
  const r=runForced(f),shared=r.ledgers[1].planets.find(p=>p.state.isColony).ledger.phase0.inboxEffects;
  assert.ok(shared.length>0);assert.ok(shared.every(m=>m.causeEventId.includes('|RUNAWAY_TECH|')));
  assert.ok(r.ledgers[1].planets.find(p=>p.state.isColony).state.regions.every(r=>r.caps[4]===3));
});
test('loss of two self-sustaining colonies queues REENTER and delivers it one tick later',()=>{
  const f=forced('COLONY_FOUNDED');f.seed='perils-reenter-1';f.ticks=6;
  f.initial.regions=[region('r00',{pop:'100000',infra:'10000000',tiers:[5,5,4,6,4,3,4]})];
  f.initial.voyages.push({...f.initial.voyages[0],label:'b',destination:'stub:s00:b2'});setOverride(f,'parameters.g',Array(8).fill(0));
  const r=runForced(f),lost=r.ledgers.find(l=>l.state.messages.some(m=>m.type==='PERILS_REENTER'));
  assert.ok(lost);assert.equal(lost.state.arcs[0].perils,'exited');assert.equal(lost.state.lineages[0].perilsSafe,false);
  const next=r.ledgers.find(l=>BigInt(l.ledger.tick)===BigInt(lost.ledger.tick)+1n);assert.equal(next.state.arcs[0].perils,'active');
  assert.equal(r.state.arcs.length,1);assert.equal(r.state.lineages[0].foundedArcs,3);
});
test('natural extinction override cannot silently exceed the rate cap',()=>{
  const f=forced('NATURAL_CATASTROPHE');setOverride(f,'parameters.naturalExtinctionPpm','1000');
  assert.throws(()=>runForced(f),/Natural extinction rate cap/);
  setOverride(f,'parameters.naturalExtinctionPpm','0');assert.ok(runForced(f).events.some(e=>e.kind==='NATURAL_CATASTROPHE'));
});
test('same-lineage reinforcement rescues a nonviable colony without importing higher tiers',()=>{
  const f=forced('COLONY_FOUNDED');f.initial.regions=[region('r00',{pop:'1000'})];f.initial.arc.isColony=true;f.initial.arc.nonviable=true;
  f.initial.voyages[0].destination='stub:s00:b0';setOverride(f,'parameters.g',Array(8).fill(0));
  const r=runForced(f),a=r.state.arcs[0];assert.equal(a.nonviable,false);assert.ok(a.regions[0].pop>=2000n);assert.deepEqual(a.regions[0].tiers,[0,0,0,0,0,0,0]);
  assert.equal(r.events.find(e=>e.kind==='COLONY_FOUNDED').data.stage,'REINFORCEMENT');assert.equal(r.state.lineages[0].foundedArcs,1);
});
