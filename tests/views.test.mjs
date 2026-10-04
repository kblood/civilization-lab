import {test} from 'node:test';
import assert from 'node:assert/strict';
import {centurySummaries,chapterSummaries,eras,displayEnergyIndices} from '../src/views.mjs';
import {scenarioRun} from './m3-helpers.mjs';
import {forced,setOverride} from './civ-helpers.mjs';
import {createPlanet} from '../src/planet.mjs';
import {inspectionTicks} from '../src/inspection.mjs';
test('century min/max are a fold over ticks; indices aggregate power',()=>{
  const {ticks,result}=scenarioRun();
  for(const c of centurySummaries(ticks,result.events)){const rows=ticks.filter(t=>Number(t.tick*10n)>=c.fromYear&&Number(t.tick*10n)<c.untilYear),p=[rows[0].start,...rows.map(r=>r.end)].map(a=>a.regions.reduce((n,r)=>n+r.pop,0n));assert.equal(c.min,p.reduce((a,b)=>a<b?a:b));assert.equal(c.max,p.reduce((a,b)=>a>b?a:b));}
  assert.equal(chapterSummaries(ticks,result.events).length,1);assert.ok(eras(ticks).length>0);
  assert.equal(displayEnergyIndices(900000n,200n).morris,4500);
});
test('real forced collapse and recovery are visible within the same century',()=>{
  const f=forced('COLLAPSE');f.ticks=10;setOverride(f,'parameters.g',Array(8).fill(1000000));setOverride(f,'parameters.build',Array(8).fill(100));setOverride(f,'parameters.keepPermille','1000');
  const world=createPlanet(f.base,f.seed,{forced:f}),result=world.run(),ticks=inspectionTicks(world,result),c=centurySummaries(ticks,result.events)[0];
  assert.ok(result.events.some(e=>e.kind==='COLLAPSE'&&e.resolution==='accepted'));assert.ok(result.events.some(e=>e.kind==='RECOVERY'&&e.dateYear<100));
  assert.ok(c.min<c.start&&c.min<c.end);
});
test('a collapse followed by recovery within a century remains visible in minimum',()=>{
  const state=pop=>({regions:[{pop,energy:pop*4500n}],outcome:{industrialEra:1}}),values=[100n,100n,20n,30n,70n,100n,100n,100n,100n,100n,100n];
  const ticks=values.slice(0,10).map((p,i)=>({tick:BigInt(i),start:state(p),end:state(values[i+1])})),c=centurySummaries(ticks,[])[0];
  assert.equal(c.start,100n);assert.equal(c.end,100n);assert.equal(c.min,20n);assert.equal(c.max,100n);
});
