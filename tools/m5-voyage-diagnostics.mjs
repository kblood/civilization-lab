// Observation only: consume raw accepted events and ledger accounts, never simulation rules.
const compare=(a,b)=>a<b?-1:a>b?1:0;
const increment=(o,k)=>{o[k]=(o[k]??0)+1;};
const accountId=id=>id.startsWith('transit:')?id.slice(8):null;
const totals=()=>({original:0n,delivered:0n,lost:0n,inTransit:0n});
const strings=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,String(v)]));

export function voyageDiagnostics(result,{sampleLimit=20}={}){
  if(!Number.isSafeInteger(sampleLimit)||sampleLimit<0||sampleLimit>100)throw new RangeError('sampleLimit must be 0..100');
  const events=result.events.filter(e=>e.resolution==='accepted');
  const voyages=new Map((result.archiveRecords??[]).filter(r=>r.kind==='voyage').map(r=>[r.id,r.record]));
  for(const v of result.state.voyages??[])voyages.set(v.id,v);
  const parents=new Map(),legKinds=new Map(),initial=new Map(),cohorts=new Map();
  const arrivalStages={},rejectionReasons={},terminalRejectionReasons={};
  // Follow explicit transit-to-transit transfers, rather than treating each rescue leg as a launch.
  for(const e of events){
    if(e.kind==='LAUNCH'&&e.data.launch){
      const v=e.data.launch;voyages.set(v.id,v);
      const persons=e.effects.filter(x=>x.op==='transfer'&&x.to==='transit:'+v.id&&x.toField==='transit.pop').reduce((n,x)=>n+BigInt(x.amount),0n);
      initial.set(v.id,{persons,source:'LAUNCH transfer'});
    }
    if(e.kind==='COLONY_FOUNDED'){
      increment(arrivalStages,e.data.stage??'UNKNOWN');
      if(e.data.outcome==='rejected')increment(rejectionReasons,e.reason??'unknown');
      if(e.data.stage==='REJECTED')increment(terminalRejectionReasons,e.reason??'unknown');
      for(const x of e.effects)if(x.op==='transfer'&&x.field==='transit.pop'&&x.toField==='transit.pop'){
        const parent=accountId(x.target),child=accountId(x.to);
        if(!parent||!child||parents.has(child))throw new Error('Invalid or duplicate rescue transfer');
        parents.set(child,parent);legKinds.set(child,e.data.stage);
      }
    }
  }
  const rootOf=id=>{const visited=new Set();while(parents.has(id)){if(visited.has(id))throw new Error('Cyclic rescue chain');visited.add(id);id=parents.get(id);}return id;};
  const get=id=>{const root=rootOf(id);if(!cohorts.has(root))cohorts.set(root,{id:root,...totals(),source:initial.get(root)?.source??'fixture account',rescued:false,legs:0});return cohorts.get(root);};
  for(const id of voyages.keys()){const c=get(id);c.legs++;if(parents.has(id))c.rescued=true;}
  for(const [id,v] of initial)get(id).original=v.persons;
  // Fixture voyages predate the event log. Infer their initial account from its first debit;
  // normal scenario cohorts always have an explicit LAUNCH transfer.
  const inferred=new Set();
  for(const e of events){
    const debits=new Map();
    for(const x of e.effects){
      if(x.field!=='transit.pop')continue;
      const id=accountId(x.target);if(!id)continue;
      if(x.op==='transfer')debits.set(id,(debits.get(id)??0n)+BigInt(x.amount));
      else if(x.op==='add'&&BigInt(x.amount)<0n)debits.set(id,(debits.get(id)??0n)-BigInt(x.amount));
      const c=get(id);
      if(x.op==='transfer'&&x.toField==='region.pop')c.delivered+=BigInt(x.amount);
      if(x.op==='add'&&BigInt(x.amount)<0n)c.lost-=BigInt(x.amount);
    }
    for(const [id,persons] of debits){const root=rootOf(id);if(id===root&&!initial.has(root)&&!inferred.has(root)){get(root).original=persons;inferred.add(root);}}
  }
  const pendingLegs={DIVERTED:0,STRANDED:0,ORIGINAL:0};
  for(const a of result.state.transit??[]){const id=accountId(a.id);if(!id)continue;const c=get(id);c.inTransit+=BigInt(a.pop);
    increment(pendingLegs,legKinds.get(id)??'ORIGINAL');
    if(!initial.has(c.id)&&!inferred.has(c.id)&&id===c.id){c.original=BigInt(a.pop);inferred.add(c.id);}
  }
  const persons=totals(),rescuedPersons=totals(),terminalFates={delivered:0,lost:0,inTransit:0,mixed:0,unaccounted:0};
  const mismatches=[],samples=[];let rescuedCohorts=0,fixtureCohorts=0;
  for(const c of [...cohorts.values()].sort((a,b)=>compare(a.id,b.id))){
    for(const k of Object.keys(persons)){persons[k]+=c[k];if(c.rescued)rescuedPersons[k]+=c[k];}
    if(c.rescued)rescuedCohorts++;
    if(c.source==='fixture account')fixtureCohorts++;
    const residual=c.original-c.delivered-c.lost-c.inTransit,active=['delivered','lost','inTransit'].filter(k=>c[k]>0n);
    increment(terminalFates,residual!==0n?'unaccounted':active.length===1?active[0]:active.length>1?'mixed':'unaccounted');
    if(residual!==0n)mismatches.push({id:c.id,...strings({original:c.original,delivered:c.delivered,lost:c.lost,inTransit:c.inTransit,residual})});
    if(c.rescued&&samples.length<sampleLimit)samples.push({id:c.id,legs:c.legs,...strings({original:c.original,delivered:c.delivered,lost:c.lost,inTransit:c.inTransit})});
  }
  // This observation uses actual past rejected/lost legs, not delivered causal knowledge.
  const failed=new Set();let repeatLaunches=0;
  for(const e of events){
    if(e.kind==='LAUNCH'&&e.data.launch){const v=e.data.launch;if(failed.has(v.lineageId+'|'+v.destination))repeatLaunches++;}
    if(e.kind==='VOYAGE_LOST'||e.kind==='COLONY_FOUNDED'&&e.data.outcome==='rejected'){
      const v=voyages.get(e.kind==='VOYAGE_LOST'?e.ownerId:e.data.source);if(v)failed.add(v.lineageId+'|'+v.destination);
    }
  }
  return {version:'m5-voyage-diagnostics-1',originalCohorts:cohorts.size,fixtureCohorts,rescuedCohorts,
    arrivalStages,rejectionReasons,terminalRejectionReasons,pendingLegs,terminalFates,
    persons:strings(persons),rescuedPersons:strings(rescuedPersons),repeatLaunchesToPreviouslyRejectedOrLostLegDestination:repeatLaunches,
    conservation:{pass:mismatches.length===0,mismatchCount:mismatches.length,residual:String(persons.original-persons.delivered-persons.lost-persons.inTransit),samples:mismatches.slice(0,sampleLimit)},
    rescuedCohortSamples:samples};
}
