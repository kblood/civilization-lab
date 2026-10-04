import assert from 'node:assert/strict';
import {createDomain} from '../src/domain.mjs';
import {loadScenario,SCENARIOS} from '../src/scenario.mjs';
import {MAX_TIERS,CAPTURE} from '../src/tech.mjs';
import {forced,setOverride} from './civ-helpers.mjs';
export function plausibilityShard(shard){
  const exposure={hazard:0,transfer:0,polity:0,extinction:0,transit:0};
  for(let i=shard*16;i<(shard+1)*16;i++){
    const scenario=SCENARIOS[i%5],kind=['LAUNCH','PLAGUE','FRAGMENTATION','RUNAWAY_TECH','MIGRATION'][i%5],f=forced(kind);
    f.base=loadScenario(scenario).description;f.seed=`${scenario}-plausibility-${i}`;f.ticks=4;
    setOverride(f,'parameters.g',Array(8).fill(0));setOverride(f,'parameters.keepPermille','1000');
    const world=createDomain(f.base,f.seed,{forced:f}),result=world.run(),ended=new Set(),accounts=new Map();
    assert.ok(result.ledgers.length>0);assert.ok(result.ledgers[0].planets.some(p=>p.pre.regions.some(r=>r.pop>0n)),'nonzero active exposure');
    for(const snapshot of result.ledgers){
      for(const p of snapshot.planets){assert.ok(!ended.has(p.id),'extinction absorbing for each arc identity');
        for(const r of p.state.regions){assert.ok(r.pop>=0n);assert.ok(r.era>=0&&r.era<=7);assert.equal(r.energy,r.pop*CAPTURE[r.era]);r.tiers.forEach((tier,d)=>assert.ok(tier>=0&&tier<=MAX_TIERS[d]));}
        if(p.state.outcome.terminal){ended.add(p.id);exposure.extinction++;assert.ok(p.state.regions.every(r=>r.pop===0n));}
      }
      const events=result.events.filter(e=>e.tick===snapshot.ledger.tick&&e.resolution==='accepted');
      for(const e of events){if(e.trigger.mode==='hazard')exposure.hazard++;if(/POLITY_FOUNDING|FRAGMENTATION|HEGEMONY|REVOLUTION|CONQUEST/.test(e.kind))exposure.polity++;
        for(const x of e.effects){if(x.op==='transfer'){assert.ok(BigInt(x.amount)>=0n);exposure.transfer++;
          if(x.field==='transit.pop')accounts.set(x.target,(accounts.get(x.target)??0n)-BigInt(x.amount));if(x.toField==='transit.pop')accounts.set(x.to,(accounts.get(x.to)??0n)+BigInt(x.amount));
        }else if(x.field==='transit.pop'&&x.op==='add')accounts.set(x.target,(accounts.get(x.target)??0n)+BigInt(x.amount));}
      }
      for(const [id,n] of accounts){assert.ok(n>=0n);assert.equal(snapshot.state.transit.find(a=>a.id===id)?.pop??0n,n);}
      for(const a of snapshot.state.transit){exposure.transit++;assert.equal(a.pop,accounts.get(a.id)??0n);}
    }
  }
  for(const [key,value] of Object.entries(exposure))assert.ok(value>0,`NONZERO EXPOSURE ${key}`);
}
