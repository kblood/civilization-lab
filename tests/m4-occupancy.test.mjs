import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlanet,stepPlanet} from '../src/planet.mjs';
import {routesFor,message,OCCUPANCY_YEARS} from '../src/m2b.mjs';
import {forced} from './civ-helpers.mjs';
test('an undelivered occupant signal cannot affect targeting; delivered knowledge must',()=>{
  const f=forced('RECOVERY'),w=createPlanet(f.base,f.seed,{forced:f}),pre=w.checkpoints[0].live.arcs[0];
  const route={from:pre.body,to:'remote',destinationHosting:'habitable',travelYearsByTransportTier:Array(8).fill(10)};
  const def={...w.def,routes:[route]},region={tiers:[5,5,5,7]};
  const signal={source:'remote-arc',lineageId:'foreign',body:'remote',tiers:[5,5,5,7,5,4,5],strength:1000,physical:false};
  const queued=message(def.domain.id,0n,'remote','SIGNAL',pre.id,null,{signal},0,1n);
  assert.equal(routesFor(def,region,pre).length,1); // D queue is intentionally inaccessible here.
  const delivered=stepPlanet(def,{...pre,tick:1n,inbox:[queued]}).pre;
  assert.equal(routesFor(def,region,delivered).length,0);
  const expired={...delivered,tick:BigInt((10+OCCUPANCY_YEARS)/10)};
  assert.equal(routesFor(def,region,expired).length,1);
  assert.equal(routesFor(def,region,{...expired,tick:expired.tick-1n}).length,0);
  const refreshed=stepPlanet(def,{...expired,inbox:[{...queued,deliveryTick:expired.tick,payload:{...queued.payload,signal:{...signal,arrivalYear:Number(expired.tick*10n)}}}]}).pre;
  assert.equal(routesFor(def,region,refreshed).length,0);
  const own={...delivered,signals:delivered.signals.map(s=>({...s,lineageId:pre.lineageId}))};
  assert.equal(routesFor(def,region,own).length,1);
  assert.equal(routesFor(def,region,{...own,targetFailures:[{body:'remote',untilYear:100}]}).length,0);assert.equal(routesFor(def,region,pre).length,1);
});
