import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IMPLEMENTED } from '../src/catalogue.mjs';
import { forced,runForced } from './civ-helpers.mjs';
import {createDomain} from '../src/domain.mjs';
import {contactFixture} from './m3-kind-helpers.mjs';
import {refineCell} from '../src/refine-cell.mjs';
test('all 31 M2 kinds still fire through their actual guards and hazards',()=>{
  assert.equal(IMPLEMENTED.filter(k=>k.kindRank<=31).length,31);
  for(const k of IMPLEMENTED.filter(k=>k.kindRank<=31)){const result=runForced(forced(k.kind));assert.ok(result.events.some(e=>e.kind===k.kind&&e.resolution==='accepted'),k.kind);assert.ok(result.events.every(e=>IMPLEMENTED.some(k=>k.kind===e.kind)));}
});
test('forced radio arrival, receiver contact and stellar extinction/evacuation reach kinds 32–34',()=>{
  const {input,f}=contactFixture(),result=createDomain(input,f.seed,{forced:f}).run();
  for(const kind of ['SIGNAL_ARRIVAL','FIRST_CONTACT'])assert.ok(result.events.some(e=>e.kind===kind&&e.resolution==='accepted'),kind);
  const arrival=result.events.find(e=>e.kind==='SIGNAL_ARRIVAL');assert.equal(arrival.dateYear,30);assert.equal(arrival.params.arrivalYear,'30');
  const contact=result.events.find(e=>e.kind==='FIRST_CONTACT'&&e.resolution==='accepted');assert.ok(contact.effects.every(x=>x.field!=='region.tiers'));
  const receiver=result.state.arcs.find(a=>a.id===contact.ownerId);assert.equal(receiver.contacts.length,1);assert.equal(receiver.diffusionEdges.length,1);
  for(const energy of [1,5]){const doom=forced('STELLAR_DOOM');doom.base='fixtures/domains/doomed-star.json';doom.initial.atTick='49';doom.ticks=3;doom.initial.regions[0].tiers[0]=energy;
    const r=createDomain(doom.base,doom.seed,{forced:doom}).run();assert.ok(r.events.some(e=>e.kind==='STELLAR_DOOM'));
    if(energy===1)assert.equal(r.outcome,'EXTINCT_STELLAR');else assert.equal(r.state.arcs[0].evacuating,true);
  }
});
test('forced C allocation fixture reaches all five annotations with zero stock effect',()=>{
  const def={seed:'c-forced-1',manifestDigest:'0'.repeat(64)},seen=new Set();
  for(let tick=0;tick<100;tick++){const start=tick%2?32000n:8000n,end=tick%2?8000n:32000n,p={tick:String(tick),regionId:'r00',start:{pop:start},end:{pop:end},naturalDelta:end-start,phases:[{phase:'natural',eventId:null,delta:end-start}],mandatoryEvents:[],recipeDigest:'fixture'};
    const child=refineCell(def,p,{regionId:'r00',tick});for(const e of child.annotations){assert.deepEqual(e.effects,[]);seen.add(e.kind);}}
  assert.deepEqual([...seen].sort(),IMPLEMENTED.filter(k=>k.owner==='C').map(k=>k.kind).sort());
});
