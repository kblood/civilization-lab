import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlanet,stepPlanet} from '../src/planet.mjs';
import {MAX_RECOVERIES} from '../src/tech.mjs';
import {extraOpportunities} from '../src/m2b.mjs';
import {forced,region,polity} from './civ-helpers.mjs';
test('accepted recoveries retain learning and retain generic collapse exposure at the learning bound',()=>{
  const f=forced('COLLAPSE'),w=createPlanet(f.base,f.seed,{forced:f});let state=w.checkpoints[0].live.arcs[0];
  for(let count=0;count<MAX_RECOVERIES;count++){
    // Restore demographic viability to isolate the recovery/collapse policy.
    state={...state,regions:state.regions.map((r,i)=>i?{...r}:{...r,tiers:[3,3,3,3,3,2,3],pop:10000n,infra:100000n,collapse:{active:true,recoverPop:10000n,recoverInfra:100000n}})};
    const recovered=stepPlanet(w.def,state);assert.ok(recovered.events.some(e=>e.kind==='RECOVERY'&&e.resolution==='accepted'));
    assert.equal(recovered.state.regions[0].recoveries,count+1);state=stepPlanet(w.def,recovered.state).state;
    assert.equal(!!state.regions[0].collapse,true);
  }
  assert.equal(state.regions[0].recoveries,4);
});
test('post-perils constitutional renewal persists even with zero stress',()=>{
  const f=forced('REVOLUTION');f.initial.regions=[region('r00',{tiers:[4,4,4,4,4,3,4]})];f.initial.polities=[polity('p',['r00'],{stress:0})];
  const w=createPlanet(f.base,f.seed,{forced:f}),a=w.checkpoints[0].live.arcs[0],terms=[];
  extraOpportunities(w.def,{...a,perils:'exited'},(kind,owner,t)=>{if(kind==='REVOLUTION')terms.push(...t);});
  assert.equal(terms.find(t=>t.name==='renewal').value,4294967n);
});

test('generic collapse rates reduce with saturated learning and cache keys include recoveries',()=>{
  const f=forced('COLLAPSE');f.overrides=f.overrides.filter(x=>!x.key.startsWith('hazard.COLLAPSE'));
  const w=createPlanet(f.base,f.seed,{forced:f}),a=w.checkpoints[0].live.arcs[0];
  const rate=n=>stepPlanet(w.def,{...a,regions:a.regions.map(r=>({...r,recoveries:n}))}).state.hazardLedger.find(h=>h.hazardId.kind==='COLLAPSE').rate;
  const base=rate(0),learned=rate(4);assert.ok(learned>0n);assert.ok(learned<base);
  assert.ok(base-5n*learned<10n);assert.equal(rate(0),base);assert.equal(rate(5),learned);
});
