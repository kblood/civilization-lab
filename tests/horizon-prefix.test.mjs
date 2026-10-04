import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlanet,stepPlanet,skeleton} from '../src/planet.mjs';
import {createDomain} from '../src/domain.mjs';
import {digest} from '../src/environment.mjs';
import {postSapience} from '../src/civ-input.mjs';
import {canonicalBytes} from '../src/canonical.mjs';
import {merkleLeafHash} from '../src/digest.mjs';

function samePrefix(a,b) {
  assert.deepEqual(a.events.map(e=>e.id),b.events.filter(e=>BigInt(e.tick)<a.until).map(e=>e.id));
  assert.deepEqual(a.ledgers,b.ledgers.filter(l=>BigInt(l.tick)<a.until));
}
test('standalone complete chapters and an unaligned last tick are horizon independent',()=>{
  const a=createPlanet('temperate','civ-m2a-2',{years:6410}),b=createPlanet('temperate','civ-m2a-2',{years:12820});
  assert.equal(a.def.manifestDigest,b.def.manifestDigest);assert.equal(a.def.recipeDigest,b.def.recipeDigest);
  assert.deepEqual(a.chapter(0),b.chapter(0));
  assert.equal(merkleLeafHash(canonicalBytes(a.chapter(0))),merkleLeafHash(canonicalBytes(b.chapter(0))));
  samePrefix({...a.chapter(1),until:a.def.untilTick},b.chapter(1));
});
test('toy-12 event IDs, P and D tick digests and chapter prefix roots agree',()=>{
  const path='fixtures/domains/toy-12.json',forced=postSapience(path,'toy-1',40);
  const a=createDomain(path,'toy-1',{forced,untilYear:100}),b=createDomain(path,'toy-1',{forced,untilYear:200});
  const x=a.run({prefixUntil:a.def.untilTick}),y=b.run({prefixUntil:a.def.untilTick});
  assert.equal(a.def.manifestDigest,b.def.manifestDigest);assert.equal(a.def.recipeDigest,b.def.recipeDigest);
  samePrefix({events:x.events,ledgers:x.ledgers.map(s=>s.ledger),until:a.def.untilTick},{events:y.events,ledgers:y.ledgers.map(s=>s.ledger)});
  assert.deepEqual(x.ledgers.map(s=>s.planets.map(p=>p.ledger)),y.ledgers.slice(0,x.ledgers.length).map(s=>s.planets.map(p=>p.ledger)));
  assert.deepEqual(x.prefixRoots,y.prefixRoots);
});
test('negative control: hashing execution horizon into the manifest fails the same prefix comparison',()=>{
  function wrong(years){const w=createPlanet('temperate','civ-m2a-2',{years}),def={...w.def,manifestDigest:digest({manifest:w.def.manifest,horizon:years})};let state=skeleton(def);const ledgers=[],events=[];
    for(let i=0;i<10;i++){const o=stepPlanet(def,state,{founding:i===0});state=o.state;ledgers.push(o.ledger);events.push(...o.events);}return {ledgers,events,until:10n};}
  assert.throws(()=>samePrefix(wrong(100),wrong(200)),assert.AssertionError);
});
