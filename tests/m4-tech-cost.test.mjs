import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DISCOVERY_COST,NSTAR,discoveryRate} from '../src/tech.mjs';
import {TABLE} from '../src/environment.mjs';
import {createPlanet,stepPlanet} from '../src/planet.mjs';
import {forced} from './civ-helpers.mjs';
test('tier costs match the contract and slow acquisition at equal population',()=>{
  assert.deepEqual(DISCOVERY_COST,TABLE.rules.m4a.discoveryCost);assert.deepEqual(NSTAR,TABLE.rules.m4a.Nstar);
  for(let d=0;d<7;d++)for(let t=2;t<DISCOVERY_COST[d].length;t++){
    assert.ok(discoveryRate(d,t,1000000n,1000000)<discoveryRate(d,t-1,1000000n,1000000));
    assert.ok(NSTAR[d][t]>NSTAR[d][t-1]);
  }
  assert.equal(discoveryRate(0,6,1000000n,1000000),133333n);
  const f=forced('DISCOVERY');f.overrides=f.overrides.filter(o=>o.key!=='hazard.DISCOVERY.q32');
  const w=createPlanet(f.base,f.seed,{forced:f}),pre=w.checkpoints[0].live.arcs[0],out=stepPlanet(w.def,pre);
  const hazard=out.state.hazardLedger.find(h=>h.hazardId.kind==='DISCOVERY'&&h.hazardId.domain==='Energy');
  assert.equal(hazard.rate,discoveryRate(0,1,pre.regions[0].pop,pre.scenarioParams.innovationPpm));
});
