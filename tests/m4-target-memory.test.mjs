import {test} from 'node:test';
import assert from 'node:assert/strict';
import {forced,runForced} from './civ-helpers.mjs';
import {routesFor,message} from '../src/m2b.mjs';
import {stateDigest,createPlanet,stepPlanet} from '../src/planet.mjs';
test('voyage failure is remembered only after a light-delayed report; cooldown is witnessed',()=>{
  const f=forced('VOYAGE_LOST');f.ticks=43;const r=runForced(f);
  const early=r.ledgers.filter(l=>BigInt(l.ledger.tick)<41n);assert.ok(early.every(l=>l.state.arcs.every(a=>a.targetFailures.length===0)));
  const a=r.state.arcs[0],memory=a.targetFailures.find(x=>x.body==='stub:s01:b0');assert.ok(memory);assert.equal(memory.count,1);assert.equal(memory.untilYear,1410);
  assert.ok(r.events.some(e=>e.id===memory.eventId&&e.kind==='VOYAGE_LOST'));
  const copy=structuredClone(a);copy.targetFailures=[];assert.notEqual(stateDigest(a),stateDigest(copy));
  const def={planet:{body:a.body},routes:[{from:a.body,to:memory.body,destinationHosting:'habitable',travelYearsByTransportTier:Array(8).fill(10)}]},region={tiers:[5,5,5,7]};
  assert.equal(routesFor(def,region,a).length,0);assert.equal(routesFor(def,region,{...a,tick:141n}).length,1);
});
test('distinct delivered failures back off, duplicate last receipts do not extend the deadline',()=>{
  const f=forced('RECOVERY'),w=createPlanet(f.base,f.seed,{forced:f});let a=w.checkpoints[0].live.arcs[0];
  for(let j=0;j<5;j++){
    const year=Number(a.tick*10n),eventId='failure-'+j;
    const notice=message(w.def.domain.id,a.tick,'remote','TARGET_FAILURE',a.id,eventId,{failure:{body:'remote',eventId}},0,a.tick);
    a=stepPlanet(w.def,{...a,inbox:[notice]}).state;
    const memory=a.targetFailures[0];assert.equal(memory.count,Math.min(4,j+1));assert.equal(memory.untilYear,year+[1000,2000,4000,8000,8000][j]);
    a=stepPlanet(w.def,{...a,inbox:[notice]}).state;assert.deepEqual(a.targetFailures[0],memory);
  }
});
