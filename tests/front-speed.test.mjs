import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDomain} from '../src/domain.mjs';
import {graph,expansionFixture} from './domain-helpers.mjs';
import {setOverride} from './civ-helpers.mjs';
test('uniform front: actual D deliveries match d / (ceil(d/v) + launch period) exactly',()=>{
  const input=graph(5),d=200000n,v=10000n,T=20n;input.id='uniform-front-oracle';
  for(const r of input.routes){r.distanceMicroLy=String(d);r.travelYearsByTransportTier[7]=Number(d/v);}
  const f=expansionFixture('m3-front');f.initial.atTick='0';f.ticks=15;
  setOverride(f,'oracle.launchPeriodYears',String(T));setOverride(f,'hazard.VOYAGE_LOST.q32','0');
  const result=createDomain(input,f.seed,{forced:f}).run(),arrivals=result.events.filter(e=>e.kind==='COLONY_FOUNDED'&&e.data.stage==='FOUNDED');
  assert.equal(arrivals.length,3);
  for(const [i,e] of arrivals.entries()){assert.equal(BigInt(e.dateYear),BigInt(i+1)*(d/v+T));assert.equal(BigInt(e.params.arrivalYear),BigInt(e.params.deliveryYear));assert.equal(d*BigInt(i+1)*(d/v+T),d*BigInt(e.dateYear));}
  assert.ok(!result.events.some(e=>e.kind==='VOYAGE_LOST'));
  const launches=result.events.filter(e=>e.kind==='LAUNCH'&&e.resolution==='accepted');assert.equal(launches.length,3);
  assert.throws(()=>assert.equal(BigInt(arrivals[0].dateYear)+10n,d/v+T),assert.AssertionError,'negative travel-lag control');
});
