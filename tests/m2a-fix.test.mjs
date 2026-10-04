import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlanet,stepPlanet,stateDigest,salientEvents} from '../src/planet.mjs';
import {canonicalBytes} from '../src/canonical.mjs';
import {generatedString} from '../src/witness.mjs';
import {readFileSync} from 'node:fs';
import {extractTable} from './table-helpers.mjs';
import {advanceHazard} from '../src/hazard.mjs';
import {merkleLeafHash,sha256Hex} from '../src/digest.mjs';
import {forced,region,polity,setOverride,runForced} from './civ-helpers.mjs';

test('checkpoint replay reproduces every tick witness and chapter leaf; encoder parity',()=>{
  const f=forced('PLAGUE');f.initial.atTick='638';f.ticks=8;
  const world=createPlanet('temperate',f.seed,{forced:f});world.chapter(0);
  const cp=world.checkpoints.find(c=>c.tick===640n),chapter=world.chapter(1);
  let state=cp.live.arcs[0];const ledgers=[],events=[];
  for(let t=640n;t<646n;t++) {
    const out=stepPlanet(world.def,state);ledgers.push(out.ledger);events.push(...out.events);
    if(out.ledger.structural!==null)assert.equal(stateDigest(out.state),out.ledger.structural);state=out.state;
  }
  assert.deepEqual(ledgers,chapter.ledgers);
  const replay={arcId:world.def.arcId,chapter:'1',ledgers,events};
  assert.deepEqual(Buffer.from(generatedString(replay)),canonicalBytes(replay));
  assert.equal(merkleLeafHash(canonicalBytes(replay)),merkleLeafHash(canonicalBytes(chapter)));
  const changed=structuredClone(state);changed.regions[0].fuel++;
  assert.notEqual(stateDigest(changed),stateDigest(state));
  const reordered=Object.fromEntries(Object.entries(changed).reverse());assert.equal(stateDigest(changed),stateDigest(reordered));
});

test('regional collapse loses one tier, preserves another region and cannot repeat in the tick',()=>{
  const f=forced('COLLAPSE');f.initial.regions=[region('r00',{tiers:[3,3,3,3,2,1,2]}),region('r01',{tiers:[0,0,4,0,0,0,0]})];
  const result=runForced(f),accepted=result.events.filter(e=>e.kind==='COLLAPSE'&&e.resolution==='accepted');
  assert.equal(accepted.length,1);assert.deepEqual(result.state.regions[0].tiers,[2,2,2,2,1,0,1]);
  assert.deepEqual(result.state.regions[1].tiers,[0,0,4,0,0,0,0]);assert.equal(result.state.regions[1].collapse,null);
  assert.ok(accepted[0].refs.some(r=>r.role==='victim'&&r.entityId.endsWith('#r00')));
});

test('war-induced stress supplies a real RAISED_HAZARD cause to later collapse',()=>{
  const f=forced('WAR');f.ticks=12;
  f.initial.regions=['r00','r01'].map(id=>region(id,{infra:'1000',tiers:[1,2,1,1,1,0,2],collapse:{active:true,recoverPop:'10000',recoverInfra:'80000'}}));
  f.initial.polities=[polity('a',['r00']),polity('b',['r01'])];
  setOverride(f,'hazard.COLLAPSE.q32','171798691840');
  const r=runForced(f),collapses=r.events.filter(e=>e.kind==='COLLAPSE'&&e.resolution==='accepted');
  assert.ok(collapses.length>0);
  assert.ok(collapses.some(e=>e.causes.some(c=>c.edge==='RAISED_HAZARD'&&r.events.some(w=>w.id===c.eventId&&w.kind==='WAR'&&w.dateYear<e.dateYear))));
});

test('completed acquisition hazards archive once and counters prevent episode reuse',()=>{
  const r=runForced(forced('AGRICULTURE'));
  const archived=r.ledgers.flatMap(l=>l.archived).filter(a=>a.kind==='hazard'&&a.record.hazardId.kind==='AGRICULTURE');
  assert.ok(archived.length);assert.equal(r.state.hazardLedger.filter(h=>h.hazardId.kind==='AGRICULTURE').length,0);
  for(const a of archived)assert.ok(r.state.hazardEpisodes.find(e=>e.key===a.record.key).episode>a.record.episode);
});

test('salience selection preserves rank with a documented kind diversity cap',()=>{
  const r=runForced(forced('COLLAPSE')),selected=salientEvents(r.events);
  assert.ok(selected.length<=30);for(let i=1;i<selected.length;i++)assert.ok(selected[i].salience<=selected[i-1].salience);
  assert.ok(selected.filter(e=>e.kind==='COLLAPSE').length<=3);
});

test('damage expires at its exact tick between environment epochs',()=>{
  const f=forced('RECOVERY');f.ticks=3;
  f.initial.regions=[region('r00',{damage:[{eventId:'fixture-damage',permille:200,untilTick:'1'}]})];
  const r=runForced(f);
  assert.equal(r.ledgers[0].phase0.state.regions[0].K,4000n);
  assert.equal(r.ledgers[1].phase0.state.regions[0].K,5000n);
  assert.equal(r.state.regions[0].damage.length,0);
});

test('every region field and structural witness matches the independently parsed table',()=>{
  const text=readFileSync('docs/transition-table-v1.md','utf8');
  const table=extractTable(text);
  const schema=table.rules.tickWitness,r=runForced(forced('COLLAPSE')).state;
  const tuples=r.regions.map(region=>{
    assert.deepEqual(Object.keys(region).sort(),[...schema.regionTuple].sort());
    return schema.regionTuple.map(k=>{
      const order=schema.regionNestedTuples[k],v=region[k];if(!order||v===null)return v;
      return Array.isArray(v)?v.map(row=>order.map(key=>row[key])):order.map(key=>v[key]);
    });
  });
  const {regions,hazardLedger,hazardEpisodes,...rest}=r;
  const hash=x=>sha256Hex(canonicalBytes(x));
  assert.equal(stateDigest(r),hash([rest,tuples,hash(hazardLedger.map(hash)),hash(hazardEpisodes)]));
});

test('lazy hazard clocks equal eager M1 advancement through pauses and reopenings',()=>{
  const f=forced('PLAGUE');f.ticks=12;const w=createPlanet('temperate',f.seed,{forced:f});
  let state=w.checkpoints[0].live.arcs[0],checked=0;
  for(let i=0;i<f.ticks;i++) {
    const out=stepPlanet(w.def,state);
    for(const h of out.state.hazardLedger) {
      const old=state.hazardLedger.find(p=>p.key===h.key);if(!old)continue;
      const H=old.H_q32+(state.tick-old.atTick)*old.rate;
      const expected=advanceHazard(w.def,{...old,H_q32:H},h.rate).entry;
      assert.equal(h.H_q32+(out.state.tick-h.atTick)*h.rate,expected.H_q32);
      assert.equal(h.episode,expected.episode);assert.equal(h.E_q32,expected.E_q32);checked++;
    }
    state=out.state;
  }
  assert.ok(checked>10);
});
