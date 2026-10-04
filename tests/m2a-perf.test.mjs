import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractTable} from './table-helpers.mjs';
import {createPlanet,stepPlanet,stateDigest} from '../src/planet.mjs';
import {transitionText,transitionDigest,WITNESS_VERSION,ARC_FIELDS,REGION_FIELDS} from '../src/delta-witness.mjs';
import {canonicalBytes,validateCanonical} from '../src/canonical.mjs';
import {chapterParts} from '../src/witness.mjs';
import {merkleLeafHash,merkleLeafParts,sha256Hex} from '../src/digest.mjs';
import {forced,region} from './civ-helpers.mjs';

const doc=readFileSync('docs/transition-table-v1.md','utf8');
const schema=extractTable(doc,'<!-- M2A-WITNESS-ANNEX -->');
const json=v=>JSON.parse(canonicalBytes(v));

// Independent decoder of the table's grammar; deliberately does not import
// encoder helpers or infer field orders from object insertion order.
function applyText(text,before) {
  let pos=0;
  const until=delimiter=>{const end=text.indexOf(delimiter,pos);assert.ok(end>=pos);const v=text.slice(pos,end);pos=end+1;return v;};
  assert.equal(until(';'),schema.version);
  const previous=text.slice(pos,pos+64);pos+=64;
  function value() {
    const tag=text[pos++];
    if(tag==='z')return null;if(tag==='t')return true;if(tag==='f')return false;
    if(tag==='n')return Number(until(';'));
    const n=Number(until(':'));
    if(tag==='s'){const v=text.slice(pos,pos+n);pos+=n;return v;}
    if(tag==='a')return Array.from({length:n},value);
    assert.equal(tag,'o');const v={};for(let i=0;i<n;i++)v[value()]=value();return v;
  }
  function delta(old) {
    const tag=text[pos++];if(tag==='v')return value();
    const count=Number(until(':')),keys=tag==='o'?Object.keys(old).sort():null;
    assert.ok(tag==='a'||tag==='o');
    for(let i=0;i<count;i++){const index=Number(until(';')),key=keys?keys[index]:index;old[key]=delta(old[key]);}
    return old;
  }
  function fields(record,keys) {
    const count=Number(until(':'));
    for(let i=0;i<count;i++){const key=keys[Number(until(';'))];record[key]=delta(record[key]);}
  }
  const out=json(before);fields(out,schema.arcFields);
  const regions=Number(until(':'));
  for(let i=0;i<regions;i++)fields(out.regions[Number(until(';'))],schema.regionFields);
  const hazards=Number(until(':'));
  for(let i=0;i<hazards;i++) {
    const key=text.slice(pos,pos+64);pos+=64;const tag=text[pos++];
    const index=out.hazardLedger.findIndex(h=>h.key===key);
    if(tag==='d'){assert.ok(index>=0);out.hazardLedger.splice(index,1);}
    else if(tag==='v'){assert.equal(index,-1);out.hazardLedger.push(value());}
    else {
      assert.equal(tag,'c');const h=out.hazardLedger[index];assert.ok(h);
      h.H_q32=until(';');h.atTick=until(';');h.rate=until(';');
      const E=until(';'),episode=until(';');if(E!=='')h.E_q32=E;if(episode!=='')h.episode=episode;
      h.closed=text[pos++]==='t';
    }
  }
  out.hazardLedger.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
  assert.equal(pos,text.length);return {previous,state:out};
}

test('delta table covers every state field; independent decoder reconstructs every replay state',()=>{
  assert.equal(schema.version,WITNESS_VERSION);assert.deepEqual(schema.arcFields,ARC_FIELDS);assert.deepEqual(schema.regionFields,REGION_FIELDS);
  const f=forced('WAR');f.initial.atTick='638';f.ticks=74;
  const w=createPlanet('temperate',f.seed,{forced:f});w.chapter(0);
  let state=w.checkpoints.find(c=>c.tick===640n).live.arcs[0];
  assert.deepEqual(Object.keys(state).sort(),[...schema.arcFields,'regions','hazardLedger'].sort());
  for(const r of state.regions)assert.deepEqual(Object.keys(r).sort(),schema.regionFields);
  const expected=w.chapter(1),ledgers=[],events=[];let previous=stateDigest(state),boundaries=0;
  while(state.tick<w.def.untilTick&&!state.outcome.terminal) {
    const out=stepPlanet(w.def,state);
    assert.equal(out.ledger.startState,previous);
    const text=transitionText(out.ledger.phase0.state,out.pre,out.state);
    assert.equal(sha256Hex(text),out.ledger.endState);
    assert.deepEqual(applyText(text,out.pre),{previous:out.ledger.phase0.state,state:json(out.state)});
    assert.equal(transitionText(out.ledger.phase0.state,structuredClone(out.pre),structuredClone(out.state)),text);
    if(out.ledger.phase0.state!==previous) {
      const phase=transitionText(previous,state,out.pre);
      assert.equal(sha256Hex(phase),out.ledger.phase0.state);
      assert.deepEqual(applyText(phase,state).state,json(out.pre));boundaries++;
    }
    if(out.ledger.structural!==null)assert.equal(out.ledger.structural,stateDigest(out.state));
    previous=out.ledger.structural??out.ledger.endState;state=out.state;
    ledgers.push(out.ledger);events.push(...out.events);
  }
  assert.ok(boundaries>0,'includes an environment epoch after deserializing checkpoint 640');
  assert.deepEqual(ledgers,expected.ledgers);
  const replay={arcId:w.def.arcId,chapter:'1',ledgers,events};
  assert.equal(merkleLeafHash(canonicalBytes(replay)),merkleLeafHash(canonicalBytes(expected)));
  const changed=structuredClone(state);changed.regions[0].fuel++;
  assert.notEqual(transitionDigest(previous,state,changed),transitionDigest(previous,state,state));
});

test('streamed chapter bytes, length and leaf hash match canonical encoding',()=>{
  const f=forced('COLLAPSE'),w=createPlanet('temperate',f.seed,{forced:f}),c=w.chapter(0);
  const bytes=canonicalBytes(c),stream=merkleLeafParts(chapterParts(c));
  assert.equal([...chapterParts(c)].join(''),bytes.toString());
  assert.equal(stream.bytes,bytes.length);assert.equal(stream.hash,merkleLeafHash(bytes));
});

test('two-chapter LRU eviction, warm caches, interleaving, cold replay and clearing preserve roots',()=>{
  const w=createPlanet('temperate','perf-cache',{years:19210}),root=w.resultDigest();
  assert.equal(w.cachedChapterCount,2);
  w.chapter(0);assert.equal(w.cachedChapterCount,2);
  createPlanet('arid','other-cache',{years:100}).compileSummary();
  assert.equal(w.resultDigest([...w.indices].reverse()),root);
  assert.equal(w.resultDigest(w.indices,{cold:true}),root);
  assert.equal(w.compileSummary().resultDigest,root);assert.ok(w.cachedChapterCount<=2);
  w.clearCache();assert.equal(w.cachedChapterCount,0);assert.equal(w.resultDigest(),root);
});

test('warm rate templates recompute target tiers and preserve forced event records',()=>{
  const f=forced('DIFFUSION');f.ticks=12;
  f.initial.regions=[region('r00',{pop:'100000',infra:'100000',tiers:[4,4,4,4,4,3,3]}),region('r01',{pop:'10000'})];
  const w=createPlanet('temperate',f.seed,{forced:f}),first=w.run();
  assert.ok(first.events.some(e=>e.kind==='DIFFUSION'&&e.resolution==='accepted'&&Number(e.params.targetTier)>=2));
  w.clearCache();const second=w.run();
  assert.deepEqual(second.events,first.events);assert.equal(second.resultDigest,first.resultDigest);
});

test('allocation-free canonical validation retains unsafe-value rejection',()=>{
  const cycle={};cycle.self=cycle;
  let accessed=false;const getter={get unsafe(){accessed=true;return 1;}};
  for(const value of [cycle,getter,[,1],{x:undefined},{x:1.5},{x:Infinity},{x:'\ud800'},
    {'\ud800':1},{[Symbol('hidden')]:1},new Map(),Object.assign([1],{extra:2}),{x:()=>0}]) {
    assert.throws(()=>canonicalBytes(value));assert.throws(()=>validateCanonical(value));
  }
  assert.equal(accessed,false);
  for(const value of [null,[1n,-2,true,'🪐;:'],{z:[1,2],a:{b:false}},Object.create(null)]) {
    const bytes=canonicalBytes(value);assert.equal(validateCanonical(value),value);assert.deepEqual(canonicalBytes(value),bytes);
  }
});
