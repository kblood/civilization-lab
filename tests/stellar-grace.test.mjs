import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDomain} from '../src/domain.mjs';
import {forced,region,setOverride} from './civ-helpers.mjs';
test('stellar grace ends occupation: evacuation survivors elsewhere vs everyone left behind',()=>{
  for(const survivors of [true,false]){
    const f=forced('STELLAR_DOOM');f.base='fixtures/domains/m3b-doomed-star.json';f.initial.atTick='299';f.ticks=53;
    f.initial.regions=[region('r00',{pop:'100000',infra:'10000000',tiers:[5,5,4,6,4,3,4]})];
    setOverride(f,'parameters.g',Array(8).fill(0));setOverride(f,'parameters.keepPermille','1000');
    if(survivors)setOverride(f,'hazard.LAUNCH.q32','171798691840');
    const r=createDomain(f.base,f.seed,{forced:f}).run(),doom=r.events.filter(e=>e.kind==='STELLAR_DOOM');
    assert.deepEqual(doom.map(e=>e.dateYear),[3000,3500]);assert.ok(!r.state.arcs.some(a=>a.body==='stub:s00:b0'));
    if(survivors){assert.ok(r.events.some(e=>e.kind==='COLONY_FOUNDED'));assert.ok(r.state.arcs.some(a=>a.body!=='stub:s00:b0'&&a.regions.some(r=>r.pop>0n)));assert.ok(!r.outcome.startsWith('EXTINCT_'));}
    else {assert.equal(r.outcome,'EXTINCT_STELLAR');assert.equal(r.state.lineages[0].lastDeath.kind,'STELLAR_DOOM');}
  }
});
test('stellar grace override is declared, bounded and also prevents late origins',()=>{
  const f=forced('STELLAR_DOOM');f.base='fixtures/domains/m3b-doomed-star.json';f.initial=null;f.ticks=400;
  setOverride(f,'origin.deliveryYear','3600');setOverride(f,'parameters.stellarGraceYears','500');
  const world=createDomain(f.base,f.seed,{forced:f});assert.equal(world.def.origins[0].status,'no-lineage');assert.equal(world.compileSummary().outcome,'NO_LINEAGE');
  setOverride(f,'parameters.stellarGraceYears','501');assert.throws(()=>createDomain(f.base,f.seed,{forced:f}),/Unsupported/);
});
