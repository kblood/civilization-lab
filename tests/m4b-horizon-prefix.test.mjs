import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlanet,stepPlanet,skeleton} from '../src/planet.mjs';
import {createDomain,createDomainDefinition} from '../src/domain.mjs';
import {createScenario} from '../src/scenario.mjs';
import {createDefinition,forcedModelInput} from '../src/civ-input.mjs';
import {digest} from '../src/environment.mjs';
import {forced} from './civ-helpers.mjs';

const clipped=(chapter,until)=>({...chapter,events:chapter.events.filter(e=>BigInt(e.tick)<until),ledgers:chapter.ledgers.filter(l=>BigInt(l.tick)<until)});
function equalPrefix(a,b,domain=false){
  assert.equal(a.def.manifestDigest,b.def.manifestDigest);
  assert.equal(a.def.recipeDigest,b.def.recipeDigest);
  const end=a.def.untilTick,x=a.run({prefixUntil:end}),y=b.run({prefixUntil:end});
  assert.ok(x.events.length>0);assert.ok(x.ledgers.length>0);
  assert.deepEqual(x.events.map(e=>e.id),y.events.filter(e=>BigInt(e.tick)<end).map(e=>e.id));
  assert.deepEqual(x.events,y.events.filter(e=>BigInt(e.tick)<end));
  // Full inspection ledgers include every P/D tick witness, not just events.
  assert.deepEqual(x.ledgers,y.ledgers.filter(l=>BigInt(domain?l.ledger.tick:l.tick)<end));
  if(domain)assert.deepEqual(x.prefixRoots,y.prefixRoots);
  else for(const i of a.indices){
    const p=a.chapter(i),q=clipped(b.chapter(i),end);
    assert.deepEqual(p,q);assert.equal(digest(p),digest(q));
  }
}
for(const domain of [false,true])test(`${domain?'D':'P'} forced durations preserve prefix across tick 640 and endpoint precedence`,()=>{
  const f=forced('PLAGUE');f.initial.atTick='638';f.ticks=3;
  if(domain)f.base='fixtures/domains/toy-12.json';
  const make=domain?createDomain:createPlanet,build=(ticks,options={})=>make(f.base,f.seed,{forced:{...f,ticks},...options});
  equalPrefix(build(3),build(7),domain);
  equalPrefix(build(3),build(7,{untilYear:6459}),domain);
  equalPrefix(build(7,{untilYear:6419}),build(3,{untilYear:6450}),domain);
  assert.equal(build(7,{untilYear:6419}).def.untilTick,641n);
  assert.equal(f.ticks,3);assert.equal(f.initial.atTick,'638');
});
test('P scenario absolute horizons preserve all events, ledgers and partial chapter witnesses',()=>{
  const make=untilYear=>createScenario('fixtures/scenarios/lonely-bounded.json','m4b-probe',{untilYear}).world;
  equalPrefix(make(110),make(230));
});
test('negative control reinstates the old forced.ticks input bundle and detects changed witnesses',()=>{
  function old(ticks){
    const f=forced('PLAGUE');f.initial.atTick='638';f.ticks=ticks;
    const def=createDefinition(f.base,f.seed,{forced:f});
    const systems=[{schemaVersion:'civ-system-stub-1',id:def.planet.system,bodies:[def.planet],routes:[]}];
    const manifest={...def.manifest,inputBundleDigest:digest({domain:def.domain,systems,forced:f})};
    const wrong={...def,manifest,manifestDigest:digest(manifest),recipeDigest:digest({seed:def.seed,manifest,fromTick:def.fromTick})};
    let state=skeleton(wrong);const ledgers=[],events=[];
    for(let i=0;i<3;i++){const out=stepPlanet(wrong,state);state=out.state;ledgers.push(out.ledger);events.push(...out.events);}
    return {def:wrong,ledgers,events};
  }
  const a=old(3),b=old(7);
  assert.throws(()=>assert.equal(a.def.manifestDigest,b.def.manifestDigest),assert.AssertionError);
  assert.throws(()=>assert.equal(a.def.recipeDigest,b.def.recipeDigest),assert.AssertionError);
  assert.throws(()=>assert.deepEqual(a.ledgers,b.ledgers),assert.AssertionError);
});
test('model projection retains declared data and validates both supplied and effective bounds',()=>{
  const f=forced('PLAGUE'),{ticks,...declared}=f;
  assert.deepEqual(forcedModelInput(f),{...declared,modelTickMaximum:40000});
  assert.equal(forcedModelInput(null),null);
  for(const domain of [false,true]){
    const base=domain?'fixtures/domains/toy-12.json':f.base,make=domain?createDomainDefinition:createDefinition;
    const build=(patch={},options={})=>make(base,f.seed,{forced:{...f,base,...patch},...options});
    for(const ticks of [0,40001,1.5])assert.throws(()=>build({ticks},{untilYear:10}));
    for(const untilYear of [0,400010,1.5,NaN])assert.throws(()=>build({ticks:1},{untilYear}));
    assert.equal(build({ticks:40000}).untilTick,40000n);
    const late={...f.initial,atTick:'199999'};
    assert.equal(build({initial:late,ticks:1}).untilTick,200000n);
    assert.throws(()=>build({initial:late,ticks:1},{untilYear:2000010}));
    assert.notEqual(build().manifestDigest,build({initial:{...f.initial,atTick:'1'}}).manifestDigest);
    assert.notEqual(build().manifestDigest,build({id:f.id+'-declared'}).manifestDigest);
  }
  // The supported P initial override alias must resolve before endpoint arithmetic.
  const alias={...f,initial:null,overrides:[...f.overrides,{key:'initial',value:{...f.initial,atTick:'638'}}].sort((a,b)=>a.key<b.key?-1:1)};
  assert.equal(createDefinition(f.base,f.seed,{forced:alias,untilYear:6410}).untilTick,641n);
});
