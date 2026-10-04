import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bevertonHolt,createPlanet } from '../src/planet.mjs';
import { forced,runForced,region,setOverride } from './civ-helpers.mjs';
import { loadPlanet } from '../src/environment.mjs';
test('half-up BH bounds, zero guards and infrastructure decay',()=>{
  for(const p of [0n,1n,100n,10000n])for(const k of [0n,1n,5000n])for(const g of [0,10050,221403]){const n=bevertonHolt(p,k,g);if(!p||!k)assert.equal(n,0n);else assert.ok(n>= (p<k?p:k)&&n<=(p>k?p:k));}
  assert.equal(bevertonHolt(100n,5000n,10050),101n);assert.throws(()=>bevertonHolt(-1n,1n,0));
  const f=forced('RECOVERY');setOverride(f,'parameters.build',Array(8).fill(0));const r=runForced(f);
  assert.equal(r.ledgers[0].naturalDelta[0].infra,-51000n);
});
test('stock replay matches every boundary; losses read remaining stocks',()=>{
  const result=runForced(forced('PLAGUE'));
  for(const l of result.ledgers){const stocks=l.phase0.state.regions.map((r,i)=>({id:r.id,pop:r.pop+l.naturalDelta[i].pop,infra:r.infra+l.naturalDelta[i].infra,fuel:r.fuel+l.naturalDelta[i].fuel}));
    for(const e of result.events.filter(e=>e.tick===l.tick&&e.phase!==0))for(const x of e.effects){const r=stocks.find(r=>r.id===x.target);const field=x.field.split('.')[1];if(!r||!(field in r))continue;
      if(e.kind==='PLAGUE'&&field==='pop')assert.equal(BigInt(x.amount),-(r.pop*BigInt(e.params.lossPermille)/1000n));
      if(x.op==='add')r[field]+=BigInt(x.amount);else if(x.op==='transfer'){r[field]-=BigInt(x.amount);stocks.find(r=>r.id===x.to)[field]+=BigInt(x.amount);}
      assert.ok(r[field]>=0n);
    }
    for(const r of stocks){const actual=l.endState.regions.find(v=>v.id===r.id);for(const k of ['pop','infra','fuel'])assert.equal(r[k],actual[k]);}
  }
});
test('one gain per domain; derived transition iff committed era changes; ceilings recorded',()=>{
  const result=runForced(forced('AGRICULTURE'));
  assert.equal(result.events.filter(e=>e.kind==='AGRICULTURE'&&e.resolution==='accepted').length,1);
  assert.ok(result.events.some(e=>e.kind==='AGRICULTURE'&&e.resolution==='pre-empted'));
  for(const l of result.ledgers)for(const r of l.endState.regions){const p=l.phase0.state.regions.find(p=>p.id===r.id);assert.equal(result.events.filter(e=>e.tick===l.tick&&e.kind==='ENERGY_TRANSITION'&&e.ownerId===r.id).length,p.era===r.era?0:1);}
  const f=forced('DISCOVERY');f.initial.regions=[region('r00',{tiers:[3,0,4,0,3,0,0]})];
  const rows=loadPlanet().planet.epochs.value.rows.map(r=>({...r,resources:[800,800,0,800]}));setOverride(f,'epoch.rows',rows);
  assert.ok(runForced(f).state.regions[0].ceilings.some(c=>c.domain==='Energy'&&c.targetTier===4&&c.reason==='resource:fissiles'));
});
test('K=0 natural death precedes migration, next-tick extinction retains witness',()=>{
  const f=forced('MIGRATION');f.ticks=2;const rows=loadPlanet().planet.epochs.value.rows;rows[0].Kbase='0';setOverride(f,'epoch.rows',rows);
  const r=runForced(f);assert.equal(r.ledgers[0].naturalDelta[0].pop,-100000n);
  assert.ok(r.events.some(e=>e.kind==='MIGRATION'&&e.ownerId.endsWith('#r00')&&e.reason==='no-people'));
  assert.equal(r.ledgers[0].endState.lastDeath.kind,null);
});
test('simultaneous same-domain loss and gain use pre-state gates and one remaining-tier increment',()=>{
  const f=forced('DISCOVERY');f.initial.regions=[region('r00',{tiers:[1,1,1,1,0,0,0],lowTicks:[2,0,0,0,0,0,0]})];
  const r=runForced(f),loss=r.events.find(e=>e.kind==='TECH_LOSS'&&e.params.domainIndex==='0'),gain=r.events.find(e=>e.kind==='DISCOVERY'&&e.params.domainIndex==='0'&&e.resolution==='accepted');
  assert.ok(loss&&gain);assert.equal(gain.params.targetTier,'2');assert.equal(r.state.regions[0].tiers[0],1);
  assert.equal(r.events.filter(e=>e.kind==='DISCOVERY'&&e.params.domainIndex==='0'&&e.resolution==='accepted').length,1);
});
