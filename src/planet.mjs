import { chapterParts, freezeGenerated as deepFreeze } from './witness.mjs';
import { canonicalBytes, canonicalString, compare, freezeCanonical } from './canonical.mjs';
import { merkleRoot, merkleLeafParts, merkleRootFromHashes } from './digest.mjs';
import { floorDiv as F } from './time.mjs';
import { threshold, advanceHazard, compactHazardKey as hazardKey } from './hazard.mjs';
import { eventId, hazardIntent, thresholdIntent, messageIntent, chainIntent, compareEvents, sortEvents } from './events.mjs';
import { kindOf, IMPLEMENTED } from './catalogue.mjs';
import { createDefinition, magnitude, chanceMagnitude, priors, override, originId } from './civ-input.mjs';
import { DOMAINS, MAX_TIERS, NSTAR, COLONY_M5, colonyDrain, colonyStock, discoveryRate, maintenancePopulation, MAX_RECOVERIES, CAPTURE, FUEL, gate, era, capacity, damage, pressure, bevertonHolt, min, max } from './tech.mjs';
import { prepareArc, regionById, polityById, population, members, fighting, clamp, polityRecord, splitRecords, naturalPolity, powerAt, rebuildOwnership } from './polities.mjs';
import { refsUnique, newChain, advanceChain, chainWitness, participant } from './chains.mjs';
import { addScore, distance, deriveScores, mergeProvenance, causes } from './provenance.mjs';
export { createDefinition } from './civ-input.mjs';
export { bevertonHolt } from './tech.mjs';
import { stateDigest } from './state-witness.mjs';
import { transitionDigest, WITNESS_VERSION } from './delta-witness.mjs';
import {extraOpportunities,extraMagnitudes,applyExtra,catastrophe,PERILS,routesFor,TARGETING_M5,receivedSignal} from './m2b.mjs';
export { stateDigest } from './state-witness.mjs';
const boundaryDigests=new WeakMap();
const byId=(a,b)=>compare(a.id,b.id);
const copyArc=a=>({...a,regions:a.regions.map(r=>({...r})),polities:a.polities,hazardLedger:a.hazardLedger,chains:[...a.chains],latches:a.latches,outbox:[]});
const slotCache=new Map();
const slots=(r,...fields)=>{
  const key=r.id+'|'+fields.join('|');let value=slotCache.get(key);
  if(!value){value=fields.map(f=>[r.id,'region.'+f]);if(slotCache.size<4096)slotCache.set(key,value);}return value;
};
export function event(def,arc,kind,owner,intent,trigger,date=Number(arc.tick*10n),phase=kindOf(kind).phase) {
  const k=kindOf(kind),tick=String(arc.tick);
  return {id:eventId(owner,kind,tick,intent),ordinal:0,kind,kindRank:k.kindRank,level:k.owner,ownerId:owner,intentKey:intent,
    refs:[{role:'arc',entityId:arc.id}],tick,dateYear:date,precision:trigger.mode==='hazard'?'year':'decade',phase,trigger,
    causes:[],params:{},effects:[],chain:null,salience:k.salience,forced:false,modelVersion:'civ-m2-1',resolution:'accepted',reason:null,
    data:{sets:[],stage:null,outcome:null,source:null,target:null,survivor:null,launch:null}};
}
export function installEnvironment(def,a) {
  const year=Number(a.tick*10n),life=def.planet.lifecycle.value;
  for(const r of a.regions) {
    const row=def.planet.epochs.value.rows.find(e=>e.regionId===r.localId&&BigInt(e.fromEpoch)<=F(a.tick,100n)&&F(a.tick,100n)<BigInt(e.untilEpoch));
    if(!row)throw new RangeError('Epoch gap');
    if(r.damage.some(d=>d.untilTick<=a.tick))r.damage=r.damage.filter(d=>d.untilTick>a.tick);r.berthsUsed=0;
    r.Kbase=year<life.habitableFromYear||year>=life.habitableUntilYear||
      (def.planet.hosting==='habitat-buildable'&&(r.tiers[0]<5||r.tiers[1]<5))?0n:BigInt(row.Kbase);
    r.resources=row.resources;r.K=capacity(r);r.era=era(r.tiers);r.energy=r.pop*CAPTURE[r.era];
  }
}
export function skeleton(def) {
  const a={id:def.arcId,lineageId:def.lineageId??'lin:'+def.planet.body,body:def.planet.body,episode:def.episode??0,foundedYear:Number(def.fromTick*10n),foundingTiers:Array(7).fill(0),
    lastDeath:null,isColony:false,colonizer:true,regions:[],polities:[],hazardLedger:[],hazardEpisodes:[],chains:[],provenance:[],latches:[],perils:'none',nonviable:false,
    outcome:{biological:'extant',industrialEra:0,regressing:false,political:'none',terminal:false},scenarioParams:def.scenarioParams??priors(def,'lin:'+def.planet.body),inbox:[],outbox:[],tick:def.fromTick,evacuating:false,signals:[],contacts:[],diffusionEdges:[],targetFailures:[],lineageReports:[]};
  a.regions=def.planet.partition.value.regions.map(r=>({id:a.id+'#'+r.id,localId:r.id,pop:0n,Kbase:0n,K:0n,renewable:1000,infra:0n,fuel:0n,forcing:0n,immunityTicks:20,
    damage:[],polityId:null,cultureId:a.id+'#cul:founder',culture:[500,500,500],tiers:Array(7).fill(0),caps:[...MAX_TIERS],era:0,energy:0n,resources:[0,0,0,0],collapse:null,lowTicks:Array(7).fill(0),ceilings:[],spaceflight:false,berthsUsed:0,recoveries:0}));
  const initial=def.forced.initial;
  if(initial) {
    for(const r of a.regions) {
      const patch=initial.regions.find(v=>v.localId===r.localId);
      if(patch)Object.assign(r,patch,{id:r.id,pop:BigInt(patch.pop),infra:BigInt(patch.infra),fuel:BigInt(patch.fuel),forcing:BigInt(patch.forcing),
        collapse:patch.collapse&&{...patch.collapse,recoverPop:BigInt(patch.collapse.recoverPop),recoverInfra:BigInt(patch.collapse.recoverInfra)},damage:patch.damage.map(d=>({...d,untilTick:BigInt(d.untilTick)}))});
      r.caps=[...initial.arc.caps];
    }
    for(const p of initial.polities) {
      const id=a.id+'#pol:fixture:'+p.label,ids=p.regionIds.map(r=>a.id+'#'+r);
      const record=polityRecord(id,ids,a.foundedYear);
      for(const key of ['regime','eliteShare','asabiya','legitimacy','stress','warWeariness','hegemony'])record[key]=p[key];
      a.polities.push(record);for(const r of a.regions)if(ids.includes(r.id))r.polityId=id;
    }
    for(const key of ['isColony','colonizer','perils','nonviable'])a[key]=initial.arc[key];
    if(a.isColony)a.foundingTiers=[...(a.regions.find(r=>r.pop>0n)?.tiers??Array(7).fill(0))];
  }
  if(def.colonyPolicy&&a.isColony)a.colonyReserve=COLONY_M5.reserveInitialYears;
  installEnvironment(def,a);
  a.outcome.industrialEra=a.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.era):n,0);
  a.outcome.political=a.polities.length?'continuous':'none';
  return a;
}
const adjacencyCache=new WeakMap(),incomingCache=new WeakMap();
function incomingOf(def,id) {
  let table=incomingCache.get(def);if(!table){table=new Map(def.planet.partition.value.regions.map(r=>[def.arcId+'#'+r.id,def.edges.filter(e=>e.to===def.arcId+'#'+r.id)]));incomingCache.set(def,table);}
  return table.get(id);
}
function neighboursOf(def,id) {
  let table=adjacencyCache.get(def);if(!table){table=new Map(def.planet.partition.value.regions.map(r=>[def.arcId+'#'+r.id,def.edges.filter(e=>e.from===def.arcId+'#'+r.id)]));adjacencyCache.set(def,table);}
  return table.get(id);
}
let effectiveArc=null;const effectiveCache=new Map();
function effectivePopulation(def,a,r) {
  const cache=effectiveCache;if(effectiveArc!==a){effectiveArc=a;cache.clear();}
  let value=cache.get(r.id);if(value===undefined){value=r.pop+neighboursOf(def,r.id).reduce((n,e)=>n+F(regionById(a,e.to).pop*BigInt(e.contact),1000n),0n);cache.set(r.id,value);}
  return value;
}
const learningThresholds=new WeakMap();
function natural(def,pre,next,scores,collectUpdates) {
  let limits=learningThresholds.get(pre.scenarioParams);
  if(!limits){limits=NSTAR.map(row=>row.map(n=>F(BigInt(n)*BigInt(pre.scenarioParams.learningBias),1000n)));learningThresholds.set(pre.scenarioParams,limits);}
  const deltas=[],polityNatural=[];let drain=0;
  const alive=population(pre.regions)>0n;
  for(let i=0;i<pre.regions.length;i++) {
    const p=pre.regions[i],r=next.regions[i],owner=polityById(pre,p.polityId),neff=effectivePopulation(def,pre,p);
    if(alive) {
      r.pop=bevertonHolt(p.pop,p.K,def.g[p.era]);
      if(pre.nonviable&&r.pop>0n)r.pop-=min(r.pop,max(1n,F(r.pop*100n,1000n)));
      r.infra=F(p.infra*BigInt(def.keep),1000n)+F(p.pop*BigInt(def.build[p.era])*BigInt(1000-(owner?.stress??0)),1000n);
      r.fuel=p.fuel+F(p.pop*BigInt(FUEL[p.era])*BigInt(p.tiers[0]>=5?1000:p.resources[1]),1000n);
      r.forcing=F(p.forcing*990n,1000n)+(p.tiers[0]===3?F(p.energy,1000n):p.tiers[0]===4?F(p.energy,2000n):0n);
      r.renewable=clamp(p.renewable+20-F(pressure(p),50));r.immunityTicks=Math.min(20,p.immunityTicks+1);
      r.lowTicks=p.lowTicks;
      for(let d=0;d<7;d++){
        if(def.colonyPolicy&&pre.isColony&&p.pop>0n&&p.tiers[d]>0&&p.tiers[d]<=pre.foundingTiers[d])drain=Math.max(drain,colonyDrain(maintenancePopulation(pre,p,d,neff,limits[d][p.tiers[d]],def.colonyPolicy,false),limits[d][p.tiers[d]]));
        const v=p.tiers[d]>0&&maintenancePopulation(pre,p,d,neff,limits[d][p.tiers[d]],def.colonyPolicy)<limits[d][p.tiers[d]]?Math.min(2,p.lowTicks[d]+1):0;
        if(v!==p.lowTicks[d]){if(r.lowTicks===p.lowTicks)r.lowTicks=[...p.lowTicks];r.lowTicks[d]=v;}}
      const capital=owner&&regionById(pre,owner.capital);
      r.culture=capital&&p.culture.some((n,j)=>capital.culture[j]!==n)?p.culture.map((n,j)=>n+compare(capital.culture[j],n)):p.culture;
    }
    if(collectUpdates) {
      const delta={regionId:r.id};for(const key of ['pop','infra','fuel','forcing','renewable','immunityTicks'])delta[key]=r[key]-p[key];
      for(const key of ['culture','lowTicks'])delta[key]=r[key].map((n,j)=>n-p[key][j]);deltas.push(delta);
    }
    if(r.pop<p.pop)next.lastDeath={tick:pre.tick,stage:3,ownerId:pre.id,sequence:i,dateYear:Number(pre.tick*10n+9n),eventId:null,kind:null};
  }
  // Evaluate shortfall even at zero stock: unsupported reserves must not oscillate 0 -> 5.
  if(def.colonyPolicy&&pre.isColony)next.colonyReserve=colonyStock(pre.colonyReserve,drain);
  next.polities=pre.polities.map(p=>{
    const q=alive?naturalPolity(pre,p):{...p},d={polityId:p.id};
    const wars=pre.chains.filter(c=>c.kind==='WAR'&&c.refs.some(r=>r.entityId===p.id));
    if(q.legitimacy<p.legitimacy)for(const c of wars)addScore(scores,p.id,'polity.legitimacy',c.chainId,BigInt(p.legitimacy-q.legitimacy));
    if(q.stress>p.stress) {
      const sources=pre.provenance.filter(s=>s.target===p.id&&['polity.legitimacy','polity.stress','polity.warWeariness'].includes(s.field)).flatMap(s=>s.entries);
      for(const e of sources)addScore(scores,p.id,'polity.stress',e.eventId,BigInt(q.stress-p.stress));
      for(const c of wars)addScore(scores,p.id,'polity.stress',c.chainId,BigInt(q.stress-p.stress));
    }
    if(collectUpdates){for(const k of ['eliteShare','asabiya','legitimacy','stress','warWeariness'])d[k]=q[k]-p[k];polityNatural.push(d);}return q;
  });
  return {naturalDelta:deltas,polityNatural};
}
const latchIndices=new WeakMap();
function thresholdIntents(def,pre,next) {
  const out=[];
  const oraclePeriod=override(def,'oracle.launchPeriodYears');
  if(oraclePeriod!==undefined&&Number(pre.tick*10n)-pre.foundedYear===Number(oraclePeriod)){
    const r=pre.regions.find(r=>r.pop>4000n&&r.tiers[3]>=5);
    if(r&&routesFor(def,r,pre).length){
      const e=event(def,pre,'LAUNCH',r.id,messageIntent(pre.id+'#front-oracle'),{mode:'scheduled'}),intent={e,r:r.id};
      extraMagnitudes(def,pre,e,intent);out.push(intent);
    }
  }
  let latches=latchIndices.get(pre.latches);
  if(!latches){latches=new Map();for(const l of pre.latches)latches.set(l.kind+'|'+l.subject,l);latchIndices.set(pre.latches,latches);}
  const hasLosses=pre.latches.some(l=>l.kind==='TECH_LOSS');
  const latched=(kind,subject)=>latches.has(kind+'|'+subject);
  const check=(kind,r,predicate,variable,value,limit,params={},subject=r.id,drivers=()=>[])=>{
    let latch=latches.get(kind+'|'+subject);
    if(!latch&&!predicate)return;
    if(!latch){latch={kind,subject,active:false};next.latches=[...next.latches,latch];}
    if(predicate&&!latch.active) {
      const e=event(def,pre,kind,r.id,thresholdIntent(subject),{mode:'threshold',crossed:{var:variable,value:String(value),threshold:String(limit)}});
      e.params=Object.fromEntries(Object.keys(params).sort(compare).map(k=>[k,String(params[k])]));
      e.causes=causes(pre,e,[{edge:'TRIGGERED',slots:drivers()}]);out.push({e,r:r.id});
    }
    if(latch.active!==predicate){next.latches=next.latches.map(l=>l===latch?{...l,active:predicate}:l);}
  };
  for(const r of pre.regions) {
    const dmg=damage(r);
    check('FAMINE',r,r.pop>0n&&(r.pop*1000n>r.K*1200n||dmg>=300),'region.pop',r.pop,F(r.K*1200n,1000n),{damage:dmg,lossPermille:clamp(pressure(r)-1000+dmg,50,700)},r.id,()=>slots(r,'pop','K','damage'));
    for(let d=0;d<7;d++)if(r.lowTicks[d]>=2||hasLosses&&latched('TECH_LOSS',r.id+'~tech:'+DOMAINS[d]))check('TECH_LOSS',r,r.tiers[d]>0&&r.lowTicks[d]>=2,'region.lowTicks',r.lowTicks[d],2,{domainIndex:d,drop:1},r.id+'~tech:'+DOMAINS[d],()=>slots(r,'tiers','lowTicks'));
    if(r.collapse?.active||latched('RECOVERY',r.id))check('RECOVERY',r,!!r.collapse?.active&&r.pop*2n>=r.collapse.recoverPop&&r.infra*4n>=r.collapse.recoverInfra*3n,'region.infra',r.infra*4n,(r.collapse?.recoverInfra??0n)*3n,{},r.id,()=>slots(r,'collapse','pop','infra'));
    if(r.forcing>=1000000000n||latched('CLIMATE_CATASTROPHE',r.id))check('CLIMATE_CATASTROPHE',r,r.pop>0n&&r.forcing>=1000000000n,'region.forcing',r.forcing,1000000000n,{},r.id,()=>slots(r,'forcing','pop'));
    if(r.tiers[3]>=5||latched('SPACEFLIGHT',r.id))check('SPACEFLIGHT',r,r.tiers[3]>=5,'region.tiers',r.tiers[3],5,{domainIndex:3},r.id,()=>slots(r,'tiers'));
    if(r.tiers[3]<5&&r.spaceflight)next.regions.find(v=>v.id===r.id).spaceflight=false;
  }
  const total=population(pre.regions);
  for(const p of pre.polities)check('HEGEMONY',p,total>0n&&population(members(pre,p))*1000n>=total*600n,'region.pop',population(members(pre,p))*1000n,total*600n,{},p.id,()=>pre.regions.flatMap(r=>slots(r,'pop')));
  if(pre.isColony){check('COLONY_LOST',pre,total>0n&&total<2000n,'region.pop',total,2000n,{},pre.id,()=>pre.regions.flatMap(r=>slots(r,'pop')));if(total>=2000n)next.nonviable=false;}
  if(population(pre.regions)===0n)check('EXTINCTION',pre,population(pre.regions)===0n&&!pre.outcome.terminal,'region.pop',0,0,{},pre.id,()=>pre.regions.flatMap(r=>slots(r,'pop')));
  if(next.latches!==pre.latches)next.latches.sort((a,b)=>compare(a.kind,b.kind)||compare(a.subject,b.subject));
  return out;
}
const opportunityIdentities=new WeakMap();
const regionalOpportunities=new WeakMap(),collapseOpportunities=new WeakMap();
function opportunities(def,pre) {
  let cache=regionalOpportunities.get(def);if(!cache){cache=new Map();regionalOpportunities.set(def,cache);}
  const out=[];
  const term=(name,value)=>({name,value});
  // This definition-scoped memo is lookup-only, never iterated into state.
  let identities=opportunityIdentities.get(def);
  if(!identities){identities=new Map();opportunityIdentities.set(def,identities);}
  const add=(kind,owner,terms,meta={},components={})=>{
    // Kind/domain are closed catalogue tokens, tier is an integer, and the
    // arbitrary edge ID occupies the final suffix (no delimiter ambiguity).
    const address=kind+'/'+(components.domain??'')+'/'+(components.targetTier??'')+'/'+(components.edgeId??'');
    let ownerIdentities=identities.get(owner);
    if(!ownerIdentities){if(identities.size>=256)identities.clear();ownerIdentities=new Map();identities.set(owner,ownerIdentities);}
    let identity=ownerIdentities.get(address);
    if(!identity){const hazardId=Object.freeze({ownerId:owner,kind,...components});
      identity={kind,hazardId,key:hazardKey(hazardId),terms:null,r:meta.r,d:meta.d,target:meta.target,to:meta.to,source:meta.source,attacker:meta.attacker,defender:meta.defender};
      ownerIdentities.set(address,identity);}
    // Ephemeral evaluation workspace, never part of a state/event/witness.
    // Every key is unique within a tick. A regional memo holds only its latest
    // input vector; cold/reordered calls replace that vector and its rates.
    identity.terms=terms.sort((a,b)=>compare(a.name,b.name));identity.to=meta.to;identity.target=meta.target;
    out.push(identity);
  };
  for(const r of pre.regions) {
    const owner=polityById(pre,r.polityId),neighbours=neighboursOf(def,r.id);
    const inputs=[r.pop,r.K,r.tiers,r.caps,r.resources,r.immunityTicks,r.renewable,damage(r),r.polityId,!!owner?.hegemony,
      fighting(pre,r.polityId),pre.chains.some(c=>c.kind==='PLAGUE'&&participant(c,'origin')===r.id)];
    for(const edge of neighbours){const v=regionById(pre,edge.to);inputs.push(v.pop,v.K,v.tiers,v.caps,v.resources,!!polityById(pre,v.polityId)?.hegemony);}
    const old=cache.get(r.id);
    if(old&&inputs.every((v,i)=>v===old.inputs[i])){out.push(...old.entries);continue;}
    const first=out.length,neff=effectivePopulation(def,pre,r);
    const push=clamp(pressure(r)-700+damage(r)+(fighting(pre,r.polityId)?200:0)+(1000-r.renewable),0,2000);
    for(let d=0;d<7;d++) {
      const g=gate(r,d,def.planet.profile,owner);if(!g.eligible)continue;
      const kind=d===1&&r.tiers[d]===0?'AGRICULTURE':'DISCOVERY';
      let rate=discoveryRate(d,r.tiers[d]+1,neff,pre.scenarioParams.innovationPpm);
      if(kind==='AGRICULTURE')rate=F(rate*BigInt(r.resources[3]),1000n);
      add(kind,r.id,[term('kremer',rate)],{r:r.id,d,target:r.tiers[d]+1},{domain:DOMAINS[d],targetTier:r.tiers[d]+1});
    }
    for(const edge of neighbours) {
      const dest=regionById(pre,edge.to);
      if(r.pop>0n&&edge.contact>0&&dest.K>dest.pop) {
        const headroom=F((dest.K-dest.pop)*1000n,max(1n,dest.K));
        add('MIGRATION',r.id,[term('pressure',F(21474836n*BigInt(push)*headroom*BigInt(edge.contact),1000000000n))],{r:r.id,to:dest.id},{edgeId:edge.id});
      }
      if(edge.contact>0&&dest.pop>0n)for(let d=0;d<7;d++)if(r.tiers[d]>dest.tiers[d]&&gate(dest,d,def.planet.profile,polityById(pre,dest.polityId)).eligible)
        add('DIFFUSION',edge.id,[term('contact',F(42949673n*BigInt(r.tiers[d]-dest.tiers[d])*BigInt(edge.contact),1000n))],{r:dest.id,source:r.id,d,target:dest.tiers[d]+1},{domain:DOMAINS[d],edgeId:edge.id});
    }
    if(r.pop>0n&&!pre.chains.some(c=>c.kind==='PLAGUE'&&participant(c,'origin')===r.id)) {
      const connectivity=1000+neighbours.reduce((n,e)=>n+e.contact,0),susceptible=50+F(950*r.immunityTicks,20);
      add('PLAGUE',r.id,[term('density',F(71582788n*BigInt(pressure(r))*BigInt(connectivity)*BigInt(susceptible)*BigInt([10,100,300,600,1000,1000][r.tiers[1]])*BigInt([1000,700,400,150,50][r.tiers[5]]),1000000000000000n))],{r:r.id});
    }
    if(r.polityId===null&&r.pop>=1000n&&r.tiers[1]>=2&&pressure(r)>=100)add('POLITY_FOUNDING',r.id,[term('density',F(42949673n*BigInt(Math.min(1000,pressure(r))),1000n))],{r:r.id});
    cache.set(r.id,{inputs,entries:out.slice(first)});
  }
  for(const attacker of pre.polities)for(const defender of pre.polities) {
    if(attacker.id===defender.id||!population(members(pre,attacker))||!population(members(pre,defender)))continue;
    if(pre.chains.some(c=>c.kind==='WAR'&&c.refs.some(r=>r.entityId===attacker.id)&&c.refs.some(r=>r.entityId===defender.id)))continue;
    const target=members(pre,defender).find(r=>incomingOf(def,r.id).some(e=>attacker.regions.includes(e.from)));if(!target)continue;
    const pa=powerAt(pre,attacker,target.id,def.distances),pd=powerAt(pre,defender,target.id,def.distances),ratio=min(2000n,F(pa*1000n,max(1n,pd)));
    const ac=regionById(pre,attacker.capital),dc=regionById(pre,defender.capital);
    const dist=F(ac.culture.reduce((n,c,i)=>n+Math.abs(c-dc.culture[i]),0),3);
    add('WAR',attacker.id+'>'+defender.id,[term('stress',F(429496730n*ratio*BigInt(Math.max(100,attacker.stress))*BigInt(1000-attacker.warWeariness),1000000000n)),
      term('culture',F(2147483n*BigInt(dist),1000n))],{attacker:attacker.id,defender:defender.id,to:target.id});
  }
  let collapseCache=collapseOpportunities.get(def);if(!collapseCache){collapseCache=new Map();collapseOpportunities.set(def,collapseCache);}
  for(const r of pre.regions.filter(r=>r.pop>0n&&r.era>=1&&!r.collapse?.active)) {
    const owner=polityById(pre,r.polityId),stress=owner?.stress??100,complexity=r.tiers.reduce((a,b)=>a+b,0);
    const old=collapseCache.get(r.id);
    if(old&&old.stress===stress&&old.complexity===complexity&&old.recoveries===r.recoveries){out.push(old.entry);continue;}
    add('COLLAPSE',r.id,[term('stress',F(4294967n*BigInt(stress)*BigInt(stress),1000000n*BigInt(1+Math.min(MAX_RECOVERIES,r.recoveries)))),term('overhead',F(42949n*BigInt(complexity),7n*BigInt(1+Math.min(MAX_RECOVERIES,r.recoveries))))],{r:r.id});
    collapseCache.set(r.id,{stress,complexity,recoveries:r.recoveries,entry:out.at(-1)});
  }
  extraOpportunities(def,pre,add);
  for(const edge of pre.diffusionEdges)for(const r of pre.regions.filter(r=>r.pop>0n))for(let d=0;d<7;d++)if(edge.tiers[d]>r.tiers[d]&&gate(r,d,def.planet.profile,polityById(pre,r.polityId)).eligible)
    add('DIFFUSION',edge.source+'>'+r.id,[term('contact',42949673n*BigInt(edge.tiers[d]-r.tiers[d]))],{r:r.id,source:edge.source,d,target:r.tiers[d]+1},{domain:DOMAINS[d],targetTier:r.tiers[d]+1,edgeId:edge.source+'>'+r.id});
  return out.sort((a,b)=>compare(a.key,b.key));
}
// Provenance has no role in rates or eligibility. Materialise its slots only
// for a firing, from the same pre-state used to calculate the opportunity.
function opportunitySlots(def,pre,o,term) {
  const r=o.r&&regionById(pre,o.r);
  if(term==='gate')return ['AGRICULTURE','DISCOVERY','DIFFUSION'].includes(o.kind)?slots(r,'tiers','caps','resources'):
    o.kind==='POLITY_FOUNDING'?slots(r,'tiers'):o.kind==='LAUNCH'?slots(r,'tiers','spaceflight','pop','infra','fuel'):
    PERILS.includes(o.kind)?[[pre.id,'arc.perils'],...pre.regions.flatMap(r=>slots(r,'tiers'))]:[];
  if(o.kind==='AGRICULTURE'||o.kind==='DISCOVERY')return [...slots(r,'pop'),...neighboursOf(def,r.id).flatMap(e=>slots(regionById(pre,e.to),'pop')),
    ...(o.kind==='AGRICULTURE'?slots(r,'resources'):[])];
  if(o.kind==='MIGRATION')return [...slots(r,'pop','K','damage','renewable'),...slots(regionById(pre,o.to),'pop','K')];
  if(o.kind==='DIFFUSION')return [...(regionById(pre,o.source)?slots(regionById(pre,o.source),'tiers'):[[pre.id,'arc.diffusionEdges']]),...slots(r,'tiers')];
  if(o.kind==='FIRST_CONTACT')return [[pre.id,'arc.signals']];
  if(o.kind==='PLAGUE')return slots(r,'pop','K','immunityTicks','tiers');
  if(o.kind==='POLITY_FOUNDING')return slots(r,'pop','K');
  if(o.kind==='COLLAPSE') {
    const owner=polityById(pre,r.polityId);
    return [...slots(r,'recoveries'),...(term==='stress'?(owner?[[owner.id,'polity.stress']]:[]):slots(r,'tiers','pop'))];
  }
  if(o.kind==='WAR') {
    const attacker=polityById(pre,o.attacker),defender=polityById(pre,o.defender);
    return term==='culture'?[...slots(regionById(pre,attacker.capital),'culture'),...slots(regionById(pre,defender.capital),'culture')]:
      [...members(pre,attacker),...members(pre,defender)].flatMap(r=>slots(r,'pop','tiers')).concat(
        [[attacker.id,'polity.asabiya'],[defender.id,'polity.asabiya'],[attacker.id,'polity.stress'],[attacker.id,'polity.warWeariness']]);
  }
  if(['FRAGMENTATION','REVOLUTION','SCHISM'].includes(o.kind)) {
    const p=polityById(pre,o.hazardId.ownerId);
    if(o.kind==='FRAGMENTATION')return [[p.id,term==='overhead'?'polity.regions':'polity.stress']];
    return [[p.id,'polity.stress'],...members(pre,p).flatMap(r=>slots(r,o.kind==='SCHISM'?'culture':'tiers'))];
  }
  if(o.kind==='LAUNCH')return slots(r,'tiers','spaceflight','pop','infra','fuel');
  if(o.kind==='NATURAL_CATASTROPHE'||PERILS.includes(o.kind))return [];
  throw new Error('Unknown opportunity');
}
let indexedHazards=null,hazardIndex=null;
const hazardIndices={get:ledger=>ledger===indexedHazards?hazardIndex:undefined,
  set(ledger,index){indexedHazards=ledger;hazardIndex=index;}};
function hazardIntents(def,pre,next,exposures) {
  const out=[],seen=new Set();let changed=false,added=false;
  let indices=hazardIndices.get(pre.hazardLedger);
  if(!indices){indices=new Map(pre.hazardLedger.map((h,i)=>[h.key,i]));hazardIndices.set(pre.hazardLedger,indices);}
  const put=(index,entry)=>{
    if(!changed){next.hazardLedger=[...pre.hazardLedger];changed=true;}
    // Entry descendants consist only of the already-frozen hazard identity.
    if(index===undefined){added=true;next.hazardLedger.push(Object.freeze(entry));}else next.hazardLedger[index]=Object.freeze(entry);
  };
  for(const o of opportunities(def,pre)) {
    if(o.key.length>65536)throw new RangeError('Hazard identity exceeds contract bound');
    exposures.find(x=>x.kind===o.kind).opportunityTicks++;
    seen.add(o.key);
    const index=indices.get(o.key),stored=index===undefined?null:pre.hazardLedger[index];
    let previous=stored;
    if(!previous) {
      const episode=pre.hazardEpisodes.find(e=>e.key===o.key)?.episode??0n;
      previous={hazardId:o.hazardId,key:o.key,episode,H_q32:0n,E_q32:threshold(def,o.hazardId,episode),closed:false,atTick:pre.tick,rate:0n};
    }
    const total=o.terms.reduce((n,t)=>n+t.value,0n),h=BigInt(override(def,`hazard.${o.kind}.q32`)??total);
    const H=previous.H_q32+(pre.tick-previous.atTick)*previous.rate;
    if(stored&&previous.rate===h&&H+h<previous.E_q32)continue;
    if(H+h<previous.E_q32) {
      put(index,{hazardId:previous.hazardId,key:previous.key,episode:previous.episode,H_q32:H+h,E_q32:previous.E_q32,closed:previous.closed,atTick:pre.tick+1n,rate:h});
      continue;
    }
    const result=advanceHazard(def,{...previous,H_q32:H},h);
    put(index,{...result.entry,atTick:pre.tick+1n,rate:h});
    for(const f of result.firings) {
      const v=f.evidence,e=event(def,pre,o.kind,o.hazardId.ownerId,hazardIntent(o.key,v.episode),{mode:'hazard',hazardId:o.key,episode:String(v.episode),H_start_q32:String(v.H_start),distance_q32:String(v.distance),h_q32:String(v.h),saturated:f.saturated===true},Number(pre.tick*10n)+f.yearOffset);
      e.causes=causes(pre,e,[{edge:'RAISED_HAZARD',slots:o.terms.filter(t=>4n*t.value>=total).flatMap(t=>opportunitySlots(def,pre,o,t.name))},{edge:'ENABLED',slots:opportunitySlots(def,pre,o,'gate')}]);
      if(['AGRICULTURE','DISCOVERY','DIFFUSION'].includes(e.kind))e.params={domainIndex:String(o.d),targetTier:String(o.target)};
      if(e.kind==='DIFFUSION'){e.data.source=o.source;e.data.target=o.r;}
      if(e.kind==='MIGRATION'){e.params={fraction:String(magnitude(def,e.id,'evt.migration.fraction',50,250))};e.data.source=o.r;e.data.target=o.to;}
      if(e.kind==='PLAGUE'){e.params={lossPermille:String(magnitude(def,e.id,'evt.plague.loss',100,300))};e.data.stage='OUTBREAK';}
      if(e.kind==='WAR')e.data.stage='DECLARED';
      if(e.kind==='COLLAPSE')e.params={drop:String(magnitude(def,e.id,'evt.collapse.drop',1,1)),splitCount:'0'};
      if(e.kind==='POLITY_FOUNDING')e.data.target=`${pre.id}#pol:${pre.tick}:12:${regionById(pre,o.r).localId}:0`;
      const intent={...o,e};extraMagnitudes(def,pre,e,intent);out.push(intent);
    }
  }
  for(let i=0;i<pre.hazardLedger.length;i++) {
    const h=pre.hazardLedger[i];
    if(h.rate>0n&&!seen.has(h.key))put(i,{...h,H_q32:h.H_q32+(pre.tick-h.atTick)*h.rate,atTick:pre.tick,rate:0n});
  }
  if(changed){if(added)next.hazardLedger.sort((a,b)=>compare(a.key,b.key));Object.freeze(next.hazardLedger);if(!added)hazardIndices.set(next.hazardLedger,indices);}return out;
}
function chainIntents(def,pre) {
  const out=[];
  for(const c of pre.chains) {
    const ended=population(pre.regions)===0n;
    if(c.nextTick<pre.tick)throw new Error('Past-due chain');
    if(!ended&&c.nextTick!==pre.tick)continue;
    const a=pre.polities.find(p=>p.id===participant(c,'attacker')),d=pre.polities.find(p=>p.id===participant(c,'defender')),target=pre.regions.find(r=>r.id===participant(c,'target'));
    const invalid=ended||(c.kind==='WAR'&&(!a||!d||target?.polityId!==d.id));
    const kind=c.kind==='WAR'&&!invalid&&pre.tick>=c.deadlineTick?'CONQUEST':c.kind;
    const owner=c.chainId.split('|')[0],e=event(def,pre,kind,owner,chainIntent(c.chainId,c.step+1),{mode:'chain'},Number(pre.tick*10n),3);
    e.refs.push(...c.refs,{role:'chain',entityId:c.chainId});e.causes=causes(pre,e,[],[{event:c.chainId,edge:'CHAIN'}]);
    let transition,victims=[];
    if(invalid){e.data.stage='INVALIDATED';transition=advanceChain(c,pre.tick,'invalidate',ended?'arc-ended':'participant-ended');}
    else if(kind==='PLAGUE') {
      if(pre.tick<c.deadlineTick)victims=pre.regions.filter(r=>r.pop>0n&&r.immunityTicks>=5&&!c.visited.includes(r.id)&&def.edges.some(edge=>c.frontier.includes(edge.from)&&edge.to===r.id&&edge.contact>=100)).map(r=>r.id);
      if(!victims.length){e.data.stage='BURNOUT';transition=advanceChain(c,pre.tick,'complete',pre.tick>=c.deadlineTick?'burnout':'no-frontier');}
      else {e.data.stage='SPREAD';e.params={lossPermille:String(magnitude(def,e.id,'evt.plague.loss',100,300))};transition=advanceChain(c,pre.tick,'active',null,victims,[...c.visited,...victims]);}
    } else if(kind==='WAR') {
      e.data.stage='CAMPAIGN';e.params={lossPermille:String(magnitude(def,e.id,'evt.war.campaign',20,100))};victims=[...members(pre,a),...members(pre,d)].sort(byId).map(r=>r.id);transition=advanceChain(c,pre.tick);
    } else {
      const pa=powerAt(pre,a,target.id,def.distances),pd=powerAt(pre,d,target.id,def.distances),p=pa+pd===0n?0:Number(max(0n,F((pa-pd)*1000000n,pa+pd)));
      const won=chanceMagnitude(def,e.id,'evt.conquest.win',p);e.params={winPpm:String(p),won:won?'1':'0'};e.data.stage='END';
      e.data.outcome=won?'CONQUEST':a.warWeariness>=700||d.warWeariness>=700?'PEACE':'STALEMATE';
      transition=advanceChain(c,pre.tick,won?'complete':'timeout',won?'conquest':e.data.outcome==='PEACE'?'peace':'stalemate');
    }
    e.reason=transition.reason;
    out.push({e,oldChain:c,transition,victims,attacker:a?.id,defender:d?.id,to:target?.id});
  }
  return out;
}
function preempt(e,reason){e.resolution='pre-empted';e.reason=reason;e.effects=[];e.data.sets=[];}
function resolveLocks(pre,intents) {
  const locks=[];
  const claim=(keys)=>{if(keys.some(k=>locks.includes(k)))return false;locks.push(...keys);return true;};
  const declarations=intents.filter(i=>i.e.kind==='WAR'&&i.e.phase===2);
  for(const i of declarations) {
    const others=declarations.filter(j=>j.attacker===i.defender&&j.defender===i.attacker);
    if(others.length&&i.e.ownerId>others[0].e.ownerId){const winner=others.sort((a,b)=>compareEvents(a.e,b.e))[0];preempt(i.e,'reciprocal-war');i.e.data.survivor=winner.e.id;}
  }
  for(const i of intents) {
    const e=i.e;if(e.resolution==='pre-empted')continue;
    if(['AGRICULTURE','DISCOVERY','DIFFUSION'].includes(e.kind)&&!claim([`gain:${i.r}:${i.d}`]))preempt(e,'target-conflict');
    if(e.kind==='PLAGUE'&&e.phase===2&&!claim(['plague:'+i.r]))preempt(e,'duplicate-chain');
    if(e.kind==='WAR'&&e.phase===2&&!claim(['war:'+ [i.attacker,i.defender].sort(compare).join('>')]))preempt(e,'duplicate-chain');
    if(e.kind==='POLITY_FOUNDING'&&!claim(['territory:'+i.r]))preempt(e,'target-conflict');
    if(e.kind==='CONQUEST'&&e.params.won==='1'&&!claim(['territory:'+i.to])){preempt(e,'target-conflict');i.transition=advanceChain(i.oldChain,pre.tick,'fail','stalemate');}
    if(e.kind==='COLLAPSE'&&!claim(['collapse:'+i.r])){preempt(e,'target-conflict');continue;}
    if(e.kind==='COLLAPSE')i.splits=pre.polities.filter(p=>p.id===regionById(pre,i.r)?.polityId&&p.regions.length>=2&&claim(['retire:'+p.id,...p.regions.map(id=>'territory:'+id)])).map(p=>p.id);
    if(e.kind==='FRAGMENTATION') {const p=polityById(pre,e.ownerId);if(!claim(['retire:'+p.id,...p.regions.map(id=>'territory:'+id)]))preempt(e,'target-conflict');}
    if(e.kind==='REVOLUTION'&&!claim(['regime:'+e.ownerId]))preempt(e,'target-conflict');
    if(e.kind==='SCHISM'&&!claim(members(pre,polityById(pre,e.ownerId)).slice(F(members(pre,polityById(pre,e.ownerId)).length,2)).map(r=>'culture:'+r.id)))preempt(e,'target-conflict');
    if(e.kind==='LAUNCH'&&!claim(['window:'+i.r]))preempt(e,'target-conflict');
  }
}
// All primitive writes go through this recorder. Intermediate changes score
// before a later operation can cancel them; sets retain the final atomic value.
export function recorder(arc,scores,{sequenceStart=0,stage=4}={}) {
  let sequence=sequenceStart;
  function changed(e,target,field,before,after){addScore(scores,target,field,e.id,distance(before,after,field));}
  function set(e,obj,root,key,value) {
    const field=root+'.'+key,old=obj[key];if(!distance(old,value,field))return;
    changed(e,obj.id,field,old,value);obj[key]=value;
    if((typeof value==='number'||typeof value==='bigint')&&(typeof old==='number'||typeof old==='bigint'))e.effects.push({target:obj.id,field,op:'add',amount:String(BigInt(value)-BigInt(old))});
    else {
      const present=e.data.sets.find(s=>s.target===obj.id&&s.field===field);
      if(present)present.value=structuredClone(value);
      else {e.effects.push({target:obj.id,field,op:'set',amount:'0'});e.data.sets.push({target:obj.id,field,value:structuredClone(value)});}
    }
  }
  function loss(e,r,fraction,field='pop') {
    const amount=F(r[field]*BigInt(fraction),1000n);
    set(e,r,'region',field,r[field]-amount);
    if(field==='pop') {
      if(amount>0n)arc.lastDeath={tick:arc.tick,stage,ownerId:arc.id,sequence,dateYear:e.dateYear,eventId:e.id,kind:e.kind};
      sequence++;
    }
    return amount;
  }
  function transfer(e,from,to,fraction) {
    const amount=F(from.pop*BigInt(fraction),1000n);sequence++;
    if(!amount)return false;
    changed(e,from.id,'region.pop',from.pop,from.pop-amount);changed(e,to.id,'region.pop',to.pop,to.pop+amount);
    from.pop-=amount;to.pop+=amount;e.effects.push({target:from.id,field:'region.pop',op:'transfer',amount:String(amount),to:to.id,toField:'region.pop'});return true;
  }
  function launch(e,from,to,amount){changed(e,from.id,'region.pop',from.pop,from.pop-amount);from.pop-=amount;sequence++;e.effects.push({target:from.id,field:'region.pop',op:'transfer',amount:String(amount),to,toField:'transit.pop'});}
  return {set,loss,transfer,launch,getSequence:()=>sequence};
}
function applyIntents(def,pre,next,intents,scores) {
  const op=recorder(next,scores),splitEvents=[];
  for(const i of intents) {
    const e=i.e,r=next.regions.find(r=>r.id===i.r),p=regionById(pre,i.r);
    const endedParticipant=[i.attacker,i.defender].filter(Boolean).some(id=>!next.polities.some(p=>p.id===id&&p.endedYear===null));
    if(e.resolution==='accepted'&&!['EXTINCTION','ENERGY_TRANSITION'].includes(e.kind)&&!['INVALIDATED','BURNOUT'].includes(e.data.stage)) {
      if(endedParticipant)preempt(e,'target-ended');
      else if(population(next.regions)===0n||(r&&r.pop===0n&&['MIGRATION','AGRICULTURE','DISCOVERY','DIFFUSION','PLAGUE','POLITY_FOUNDING'].includes(e.kind)))preempt(e,'no-people');
    }
    if(e.resolution==='accepted')switch(e.kind) {
      case 'MIGRATION':if(!op.transfer(e,r,next.regions.find(r=>r.id===i.to),Number(e.params.fraction)))preempt(e,'no-stock');break;
      case 'AGRICULTURE':case 'DISCOVERY':case 'DIFFUSION': {
        const tiers=[...r.tiers],value=Math.min(tiers[i.d]+1,i.target,r.caps[i.d]);
        if(value<=tiers[i.d])preempt(e,'no-gain');else {tiers[i.d]=value;op.set(e,r,'region','tiers',tiers);}break;
      }
      case 'TECH_LOSS': {
        const d=Number(e.params.domainIndex),tiers=[...r.tiers],low=[...r.lowTicks];tiers[d]=Math.max(0,tiers[d]-1);low[d]=0;
        op.set(e,r,'region','tiers',tiers);op.set(e,r,'region','lowTicks',low);break;
      }
      case 'FAMINE':op.loss(e,r,Number(e.params.lossPermille));op.set(e,r,'region','renewable',Math.max(0,r.renewable-100));break;
      case 'PLAGUE': {
        if(['BURNOUT','INVALIDATED'].includes(e.data.stage))break;
        const victims=e.phase===2?[r.id]:i.victims;
        for(const id of victims) {
          const v=next.regions.find(r=>r.id===id);e.refs.push({role:'victim',entityId:id});op.loss(e,v,Number(e.params.lossPermille));op.set(e,v,'region','immunityTicks',0);
          const polity=next.polities.find(p=>p.id===v.polityId&&p.endedYear===null);if(polity)op.set(e,polity,'polity','eliteShare',Math.max(0,polity.eliteShare-50));
        }
        if(e.phase===2){const c=newChain(e,[{role:'origin',entityId:r.id}],[r.id]);next.chains.push(c);i.transition=c;e.refs.push(...c.refs,{role:'chain',entityId:c.chainId});}break;
      }
      case 'POLITY_FOUNDING': {
        const polity=polityRecord(e.data.target,[r.id],e.dateYear);
        op.set(e,next,'arc','polities',[...next.polities,polity].sort(byId));op.set(e,r,'region','polityId',polity.id);break;
      }
      case 'WAR': {
        if(e.data.stage==='INVALIDATED')break;
        if(e.phase===2){const c=newChain(e,[{role:'attacker',entityId:i.attacker},{role:'defender',entityId:i.defender},{role:'target',entityId:i.to}]);next.chains.push(c);i.transition=c;e.refs.push(...c.refs,{role:'chain',entityId:c.chainId});}
        else {
          for(const id of i.victims){const v=next.regions.find(r=>r.id===id);e.refs.push({role:'victim',entityId:id});op.loss(e,v,Number(e.params.lossPermille));op.loss(e,v,50,'infra');}
          for(const id of [i.attacker,i.defender].sort(compare)){const polity=next.polities.find(p=>p.id===id);op.set(e,polity,'polity','warWeariness',clamp(polity.warWeariness+100));}
        }break;
      }
      case 'CONQUEST':if(e.params.won==='1')op.set(e,next.regions.find(r=>r.id===i.to),'region','polityId',i.attacker);break;
      case 'COLLAPSE': {
        for(const v of next.regions.filter(v=>v.id===i.r)) {
          const before=regionById(pre,v.id),old=v.collapse;
          op.set(e,v,'region','collapse',{active:true,recoverPop:max(old?.recoverPop??0n,before.pop),recoverInfra:max(old?.recoverInfra??0n,before.infra)});
          e.refs.push({role:'victim',entityId:v.id});op.loss(e,v,300);op.loss(e,v,700,'infra');op.set(e,v,'region','tiers',v.tiers.map(t=>Math.max(0,t-Number(e.params.drop))));
        }
        let count=0;
        for(const id of i.splits) {
          const parent=next.polities.find(p=>p.id===id);if(!parent||parent.endedYear!==null)continue;
          const children=splitRecords(pre,polityById(pre,id),e);
          op.set(e,parent,'polity','endedYear',e.dateYear);
          op.set(e,next,'arc','polities',[...next.polities,...children].sort(byId));
          for(const child of children)for(const rid of child.regions)op.set(e,next.regions.find(r=>r.id===rid),'region','polityId',child.id);
          count++;
        }
        e.params.splitCount=String(count);if(count)splitEvents.push(e.id);break;
      }
      case 'RECOVERY':if(canonicalString(r.collapse)!==canonicalString(p.collapse))preempt(e,'new-collapse');else {op.set(e,r,'region','collapse',null);op.set(e,r,'region','recoveries',Math.min(MAX_RECOVERIES,r.recoveries+1));}break;
      case 'EXTINCTION': {
        op.set(e,next,'arc','outcome',{...next.outcome,terminal:true,biological:'extinct'});
        for(const polity of next.polities)if(polity.endedYear===null)op.set(e,polity,'polity','endedYear',e.dateYear);
        for(const v of next.regions)op.set(e,v,'region','polityId',null);break;
      }
      default:applyExtra(def,pre,next,i,op,preempt,splitEvents);
    }
    if(i.oldChain) {
      if(e.resolution==='pre-empted'&&['CAMPAIGN','SPREAD'].includes(e.data.stage))i.transition=advanceChain(i.oldChain,pre.tick,'active',null,[],i.oldChain.visited);
      const index=next.chains.findIndex(c=>c.chainId===i.oldChain.chainId);next.chains[index]=i.transition;
    }
    if(i.transition)e.chain=chainWitness(i.transition);
  }
  return splitEvents;
}
function derive(def,pre,next,splitEvents) {
  if(def.planet.hosting==='habitat-buildable')installEnvironment(def,next);
  for(const r of next.regions) {
    const p=regionById(pre,r.id),oldCeilings=r.ceilings;
    deepFreeze(r.tiers);
    if((r.tiers!==p.tiers||r.caps!==p.caps)&&r.tiers.some((t,d)=>t>r.caps[d]))r.tiers=r.tiers.map((t,d)=>Math.min(t,r.caps[d]));
    if(r.tiers!==p.tiers||r.damage!==p.damage||r.Kbase!==p.Kbase)r.K=capacity(r);
    if(r.tiers!==p.tiers)r.era=era(r.tiers);r.energy=r.pop*CAPTURE[r.era];
    if(pre.tick===def.fromTick||r.tiers!==p.tiers||r.caps!==p.caps||r.resources!==p.resources)r.ceilings=DOMAINS.flatMap((_,d)=>gate(r,d,def.planet.profile,next.polities.find(p=>p.id===r.polityId)).ceilings)
      .sort((a,b)=>compare(a.domain,b.domain)||compare(a.targetTier,b.targetTier)||compare(a.reason,b.reason));
    if(r.ceilings.length===oldCeilings.length&&r.ceilings.every((c,i)=>c===oldCeilings[i]))r.ceilings=oldCeilings;
  }
  rebuildOwnership(next,Number(pre.tick*10n+10n));
  const frontier=next.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.era):n,0);
  next.outcome={biological:population(next.regions)>0n?'extant':'extinct',industrialEra:frontier,regressing:frontier<pre.outcome.industrialEra,
    political:splitEvents.length?'fragmented':next.polities.some(p=>p.endedYear===null)?'continuous':'none',terminal:next.outcome.terminal};
  if(next.perils==='none'&&frontier>=3)next.perils='active';
}
function archive(def,next,acquisition) {
  const out=[];
  const retired=next.polities.filter(p=>p.endedYear!==null).map(p=>p.id);
  let counters=null;
  const closing=[];
  if(acquisition||retired.length||next.outcome.terminal)for(const h of next.hazardLedger) {
    const owners=h.hazardId.kind==='WAR'?h.hazardId.ownerId.split('>'):[h.hazardId.ownerId];
    let acquired=false;
    if(['AGRICULTURE','DISCOVERY','DIFFUSION'].includes(h.hazardId.kind)) {
      const rid=h.hazardId.kind==='DIFFUSION'?(def.edges.find(e=>e.id===h.hazardId.edgeId)?.to??next.regions.find(r=>h.hazardId.edgeId.endsWith('>'+r.id))?.id):h.hazardId.ownerId;
      acquired=next.regions.find(r=>r.id===rid).tiers[DOMAINS.indexOf(h.hazardId.domain)]>=h.hazardId.targetTier;
    }
    if(next.outcome.terminal||owners.some(id=>retired.includes(id))||acquired) {
      closing.push(h.key);
      const record=Object.freeze({...h,H_q32:h.H_q32+(next.tick+1n-h.atTick)*h.rate,atTick:next.tick+1n,rate:0n,closed:true});
      out.push({scope:next.id,kind:'hazard',id:h.key+':'+h.episode,record});
      if(acquired&&!next.outcome.terminal) {
        if(!counters)counters=[...next.hazardEpisodes];
        const entry={key:h.key,episode:h.episode+1n},index=counters.findIndex(e=>e.key===h.key);
        if(index<0)counters.push(entry);else counters[index]=entry;
      }
    }
  }
  if(closing.length)next.hazardLedger=Object.freeze(next.hazardLedger.filter(h=>!closing.includes(h.key)));
  if(counters)next.hazardEpisodes=deepFreeze(counters.sort((a,b)=>compare(a.key,b.key)));
  for(const [field,kind,idKey,predicate] of [['polities','polity','id',p=>p.endedYear!==null],['chains','chain','chainId',c=>c.status!=='active']]) {
    const closed=next[field].filter(predicate);if(!closed.length)continue;
    for(const record of closed)out.push({scope:next.id,kind,id:record[idKey],record});
    next[field]=next[field].filter(r=>!predicate(r));
  }
  if(retired.length)next.provenance=next.provenance.filter(s=>!retired.includes(s.target));
  if(retired.length)next.latches=next.latches.filter(s=>!retired.includes(s.subject));
  next.chains.sort((a,b)=>compare(a.chainId,b.chainId));
  return out.sort((a,b)=>compare(a.scope,b.scope)||compare(a.kind,b.kind)||compare(a.id,b.id));
}
export function stepPlanet(def,boundary,{founding=false,collectUpdates=true,startBoundary=boundary,arrivalIds=[],arrivalEvents=[]}={}) {
  if(boundary.outcome.terminal)throw new Error('Terminal arc');
  const year=Number(boundary.tick*10n),life=def.planet.lifecycle.value;
  const environmentBoundary=boundary.tick===def.fromTick||boundary.tick%100n===0n||
    [life.habitableFromYear,life.habitableUntilYear].some(y=>year>=y&&year-10<y)||
    boundary.regions.some(r=>r.berthsUsed!==0||r.damage.some(d=>d.untilTick<=boundary.tick));
  const doomEnd=life.stellarDoomYear==null?null:life.stellarDoomYear+Number(override(def,'parameters.stellarGraceYears')??500);
  const expired=doomEnd!==null&&year>=doomEnd;
  const doom=life.stellarDoomYear===year||expired;
  const hasInbox=boundary.inbox.length>0||doom;
  const pre=environmentBoundary||founding||hasInbox?copyArc(boundary):{...boundary,outbox:[]},scores=[],phase0events=[],inboxEffects=[];
  for(const e of arrivalEvents)for(const x of e.effects) {
    if(x.op==='transfer'&&pre.regions.some(r=>r.id===x.to))addScore(scores,x.to,x.toField,e.id,BigInt(x.amount));
    const r=pre.regions.find(r=>r.id===x.target),old=startBoundary.regions.find(r=>r.id===x.target);
    if(r&&x.op==='add')addScore(scores,x.target,x.field,e.id,BigInt(x.amount)<0n?-BigInt(x.amount):BigInt(x.amount));
    if(r&&x.op==='set'){const key=x.field.split('.')[1],value=e.data.sets.find(s=>s.target===r.id&&s.field===x.field).value;addScore(scores,r.id,x.field,e.id,distance(old[key],value,x.field));}
  }
  let phase0Sequence=0;
  if(hasInbox)for(const m of boundary.inbox) {
    const e={id:m.causeEventId??m.id,kind:m.payload.kind,dateYear:year,effects:[],data:{sets:[]},refs:[]},op=recorder(pre,m.causeEventId?scores:[],{sequenceStart:phase0Sequence,stage:1});
    if(m.type==='STATUS'&&m.payload.status) {
      const status=m.payload.status,old=pre.lineageReports.find(r=>r.source===status.source);
      if(status.source!==pre.id&&status.lineageId===pre.lineageId&&(!old||status.reportYear>old.reportYear))op.set(e,pre,'arc','lineageReports',[...pre.lineageReports.filter(r=>r.source!==status.source),status].sort((a,b)=>compare(a.source,b.source)));
    }
    if(m.type==='TARGET_FAILURE'&&!def.targetingPolicy){const f=m.payload.failure,old=pre.targetFailures.find(x=>x.body===f.body);if(old?.eventId!==f.eventId){const count=Math.min(4,(old?.count??0)+1);op.set(e,pre,'arc','signals',pre.signals.filter(s=>s.body!==f.body));op.set(e,pre,'arc','targetFailures',[...pre.targetFailures.filter(x=>x.body!==f.body),{body:f.body,count,eventId:f.eventId,untilYear:year+1000*(1<<(count-1))}].sort((a,b)=>compare(a.body,b.body)));}}
    if(m.type==='TARGET_FAILURE'&&def.targetingPolicy) {
      const f=m.payload.failure,old=pre.targetFailures.find(x=>x.body===f.body);
      const newerSuccess=pre.signals.some(s=>s.body===f.body&&s.lineageId===pre.lineageId&&s.eventYear>f.year);
      if(!newerSuccess&&old?.eventId!==f.eventId) {
        const count=Math.min(4,(old?.count??0)+1),retry={'transit-loss':TARGETING_M5.transitLossRetryYears,occupied:TARGETING_M5.occupancyYears,
          uninhabitable:TARGETING_M5.uninhabitableResurveyYears,'colony-died':TARGETING_M5.colonyDiedBackoffYears[count-1]}[f.reason];
        op.set(e,pre,'arc','targetFailures',[...pre.targetFailures.filter(x=>x.body!==f.body),{body:f.body,count,eventId:f.eventId,failureYear:f.year,reason:f.reason,transportTier:f.transportTier,untilYear:f.year+retry}].sort((a,b)=>compare(a.body,b.body)));
      }
    }
    if(m.type==='SHARED')catastrophe(boundary,pre,e,op,m.payload);
    if(m.type==='PERILS_EXIT')op.set(e,pre,'arc','perils','exited');
    if(m.type==='PERILS_REENTER')op.set(e,pre,'arc','perils',pre.outcome.industrialEra>=3||pre.perils!=='none'?'active':'none');
    if(m.type==='SIGNAL'&&m.payload.signal) {
      const signal=receivedSignal(def,pre,m.payload.signal);
      op.set(e,pre,'arc','signals',[...pre.signals.filter(s=>s.source!==signal.source),{...signal,arrivalYear:signal.arrivalYear??year}].sort((a,b)=>compare(a.source,b.source)));
      if(def.targetingPolicy&&signal.lineageId===pre.lineageId&&pre.targetFailures.some(f=>f.body===signal.body&&signal.eventYear>f.failureYear))
        op.set(e,pre,'arc','targetFailures',pre.targetFailures.filter(f=>f.body!==signal.body||signal.eventYear<=f.failureYear));
    }
    phase0Sequence=op.getSequence();
    inboxEffects.push({messageId:m.id,causeEventId:m.causeEventId,effects:e.effects,sets:e.data.sets.sort((a,b)=>compare(a.target,b.target)||compare(a.field,b.field))});
  }
  pre.inbox=[];
  if(doom){const e=event(def,pre,'STELLAR_DOOM',pre.id,messageIntent(pre.id+(expired?'#doom-end':'#doom')),{mode:'exogenous'},year,0),op=recorder(pre,scores,{stage:1});
    if(!expired&&pre.regions.some(r=>r.pop>0n&&r.tiers[0]>=5))op.set(e,pre,'arc','evacuating',true);else for(const r of pre.regions)op.loss(e,r,1000);
    phase0events.push(e);}
  if(environmentBoundary||founding||hasInbox) {
    const old=pre.regions.map(r=>({Kbase:r.Kbase,resources:r.resources}));installEnvironment(def,pre);
    if(!founding&&(boundary.tick%100n===0n||year===life.habitableUntilYear)&&old.some((v,j)=>v.Kbase!==pre.regions[j].Kbase||v.resources.some((x,k)=>x!==pre.regions[j].resources[k]))) {
      const e=event(def,pre,'CLIMATE_SHIFT',pre.id,messageIntent(pre.id+'#env:'+pre.tick),{mode:'exogenous'});
      for(let j=0;j<pre.regions.length;j++)for(const key of ['Kbase','resources'])if(canonicalString(old[j][key])!==canonicalString(pre.regions[j][key])) {
        const r=pre.regions[j];e.effects.push({target:r.id,field:'region.'+key,op:'set',amount:'0'});e.data.sets.push({target:r.id,field:'region.'+key,value:r[key]});
        addScore(scores,r.id,'region.'+key,e.id,distance(old[j][key],r[key]));
      }
      phase0events.push(e);
    }
  }
  if(founding) {
    const positive=pre.regions.filter(r=>r.Kbase>0n);if(!positive.length)throw new Error('no-lineage');
    const e=event(def,pre,'SAPIENCE',pre.id,messageIntent(originId(pre.body)),{mode:'scheduled'});
    const count=Math.min(positive.length,magnitude(def,e.id,'evt.sapience.regions',1,2));e.params={regionCount:String(count)};
    const op=recorder(pre,scores);for(const r of positive.slice(0,count)){op.set(e,r,'region','pop',1000n);op.set(e,r,'region','infra',1000n);}
    installEnvironment(def,pre);phase0events.push(e);
  }
  const startDigest=boundaryDigests.get(startBoundary)??stateDigest(startBoundary);
  const phaseDigest=environmentBoundary||founding||hasInbox||startBoundary!==boundary||boundary.outbox.length?transitionDigest(startDigest,startBoundary,pre):startDigest;
  prepareArc(pre);
  const next=copyArc(pre);
  const exposures=IMPLEMENTED.map(k=>({kind:k.kind,opportunityTicks:0}));
  const intents=[...thresholdIntents(def,pre,next),...hazardIntents(def,pre,next,exposures),...chainIntents(def,pre)].sort((a,b)=>compareEvents(a.e,b.e));
  resolveLocks(pre,intents);
  const updates=natural(def,pre,next,scores,collectUpdates),splitEvents=applyIntents(def,pre,next,intents,scores);
  derive(def,pre,next,splitEvents);
  const events=[...phase0events,...intents.map(i=>i.e)];
  for(const r of next.regions) {
    const p=regionById(pre,r.id);if(p.era===r.era)continue;
    const ids=scores.find(s=>s.target===r.id&&s.field==='region.tiers')?.entries.map(e=>e.eventId)??[];
    const enabling=events.filter(e=>ids.includes(e.id)&&e.resolution==='accepted');
    const date=enabling.reduce((n,e)=>Math.max(n,e.dateYear),Number(pre.tick*10n));
    const e=event(def,pre,'ENERGY_TRANSITION',r.id,thresholdIntent(r.id),{mode:'threshold',crossed:{var:'region.era',value:String(r.era),threshold:String(p.era)}},date,5);
    e.params={fromEra:String(p.era),toEra:String(r.era)};e.causes=causes(pre,e,[],enabling.map(event=>({event,edge:'ENABLED'})));events.push(e);
  }
  deriveScores(boundary,next,scores,splitEvents);next.provenance=mergeProvenance(pre.provenance,scores,next.polities.filter(p=>p.stress>100).map(p=>p.id));
  const archived=archive(def,next,events.some(e=>['AGRICULTURE','DISCOVERY','DIFFUSION'].includes(e.kind)&&e.resolution==='accepted'));
  next.outbox.sort((a,b)=>compare(a.type,b.type)||compare(a.targetId,b.targetId)||compare(a.causeEventId??'',b.causeEventId??'')||compare(canonicalString(a.payload),canonicalString(b.payload)));
  for(let j=0,ordinal=0;j<next.outbox.length;j++){const m=next.outbox[j],p=next.outbox[j-1];ordinal=p&&p.type===m.type&&p.targetId===m.targetId?ordinal+1:0;m.id=m.id.slice(0,m.id.lastIndexOf('~')+1)+ordinal;}
  next.tick++;
  for(const e of events) {
    for(const key of ['source','target','survivor'])if(e.data[key]!==null)e.refs.push({role:key,entityId:e.data[key]});
    e.refs=refsUnique(e.refs);e.data.sets.sort((a,b)=>compare(a.target,b.target)||compare(a.field,b.field));
  }
  const sorted=sortEvents(events);

  const structural=next.tick%640n===0n||next.outcome.terminal?stateDigest(next):null;
  const ledger=deepFreeze({witnessVersion:WITNESS_VERSION,arcId:pre.id,tick:String(pre.tick),startState:startDigest,
    eventIds:sorted.map(e=>e.id),endState:transitionDigest(phaseDigest,pre,next),structural,
    phase0:{eventIds:[...arrivalIds,...phase0events.map(e=>e.id)],state:phaseDigest,inboxEffects},archived});
  boundaryDigests.set(next,structural??ledger.endState);
  return {ledger,state:next,pre,updates,events:sorted,exposures,boundary:startBoundary};
}
export function maximumEra(initial,events) {
  let maxEra=initial.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.era):n,0),firstReachedYear=Number(initial.tick*10n);
  for(const e of events)if(e.kind==='ENERGY_TRANSITION'&&Number(e.params.toEra)>maxEra) {
    maxEra=Number(e.params.toEra);firstReachedYear=(Number(e.tick)+1)*10;
  }
  return {maxEra,firstReachedYear};
}
export function salientEvents(events,limit=30) {
  const counts=new Map();
  return [...events].sort((a,b)=>b.salience-a.salience||compareEvents(a,b)).filter(e=>{
    const count=counts.get(e.kind)??0;if(count>=3)return false;counts.set(e.kind,count+1);return true;
  }).slice(0,limit);
}
export function outcomeClass(arc) {
  if(arc.outcome.terminal)return arc.lastDeath?.kind==='STELLAR_DOOM'?'EXTINCT_STELLAR':PERILS.includes(arc.lastDeath?.kind)?'EXTINCT_SELF':'EXTINCT_NATURAL';
  const living=arc.regions.filter(r=>r.pop>0n);
  if(living.some(r=>r.caps.some((v,d)=>v<MAX_TIERS[d])))return 'EXISTENTIAL_CAP';
  if(living.some(r=>r.collapse?.active))return 'COLLAPSED_RECOVERING';
  if(arc.isColony&&living.some(r=>r.tiers.some((v,d)=>v<arc.foundingTiers[d])))return 'REGRESSED_STABLE';
  return 'EXTANT_PLANETARY';
}
// Standalone M2a has one reserved lineage/arc and no D catalogue events.
// Checkpoints retain the complete domain envelope. With no M2a coupling,
// per-tick D witnesses reference the P digest; M2b needs its own barrier format.
function domainState(def,arc) {
  const alive=!arc.outcome.terminal;
  return {id:def.domain.id,tick:arc.tick,lineages:[{id:arc.lineageId,arcs:alive?[arc.id]:[],voyages:[],contacts:[],foundedArcs:1,lastDeath:arc.lastDeath,
    scenarioParams:arc.scenarioParams,perilsSafe:false,outcomeClass:alive?outcomeClass(arc):'EXTANT_PLANETARY',extinctionCause:null}],
    arcs:alive?[arc]:[],voyages:[],transit:[],messages:[],origins:[def.origin],bodyEpisodes:[{body:arc.body,nextEpisode:1}],latches:[],coverage:'complete-domain'};
}
function composedRoot(def,pHashes,dHashes) {
  const entries=[{id:def.arcId,root:merkleRootFromHashes(pHashes)},{id:'D:'+def.domain.id,root:merkleRootFromHashes(dHashes)}].sort(byId);
  return merkleRoot(entries.map(canonicalBytes));
}
export function createPlanet(fixture='temperate',seed='civ-m2a-1',options={}) {
  const def=createDefinition(fixture,seed,options);if(def.status)return def;
  const genesis=deepFreeze(skeleton(def));
  if(def.forced.initial===null&&!genesis.regions.some(r=>r.Kbase>0n))return {status:'uninhabited',reason:'no-lineage'};
  let checkpoints=[{tick:def.fromTick,live:domainState(def,genesis),archiveRecords:[]}],cache=[],lastRecord=null;
  const indices=Array.from({length:Number(F(def.untilTick-1n,640n)-F(def.fromTick,640n)+1n)},(_,i)=>Number(F(def.fromTick,640n))+i);
  function chapter(index,{cold=false,inspect=false}={}) {
    if(!indices.includes(index))throw new RangeError('outside-model-range');
    const cached=!cold&&cache.find(c=>c.index===index&&(!inspect||c.snapshots.length));
    if(cached){cache=cache.filter(c=>c!==cached);cache.push(cached);lastRecord=cached;return cached.value;}
    const from=max(def.fromTick,BigInt(index)*640n),until=min(def.untilTick,BigInt(index+1)*640n);
    const cp=cold?checkpoints[0]:checkpoints.filter(c=>c.tick<=from).at(-1);
    let state=cp.live.arcs[0]??cp.archiveRecords.find(a=>a.kind==='arc'&&a.id===def.arcId)?.record,archiveRecords=[...cp.archiveRecords];const ledgers=[],snapshots=[],events=[],domainLedgers=[],exposures=IMPLEMENTED.map(k=>({kind:k.kind,opportunityTicks:0}));
    while(state.tick<until&&!state.outcome.terminal) {
      const out=stepPlanet(def,state,{founding:state.tick===def.fromTick&&def.forced.initial===null,collectUpdates:inspect});
      const domainArchived=out.state.outcome.terminal?[{scope:'D:'+def.domain.id,kind:'arc',id:def.arcId,record:out.state}]:[];
      const domainLedger={domainId:def.domain.id,tick:String(state.tick),arcState:out.ledger.endState,archived:domainArchived};
      if(state.tick>=from){ledgers.push(out.ledger);if(inspect)snapshots.push(freezeCanonical({...out.ledger,...out.updates,boundaryState:out.boundary,endState:out.state,phase0:{...out.ledger.phase0,state:out.pre}}));events.push(...out.events);domainLedgers.push(domainLedger);for(const x of out.exposures)exposures.find(e=>e.kind===x.kind).opportunityTicks+=x.opportunityTicks;}
      state=out.state;archiveRecords.push(...out.ledger.archived);
      archiveRecords.push(...domainArchived);
      if(state.tick%640n===0n&&!checkpoints.some(c=>c.tick===state.tick)){checkpoints.push({tick:state.tick,live:deepFreeze(domainState(def,state)),archiveRecords:[...archiveRecords]});checkpoints.sort((a,b)=>compare(a.tick,b.tick));}
    }
    // Each tick was sorted/validated once; disjoint tick date intervals preserve order.
    const value={arcId:def.arcId,chapter:String(index),ledgers,events};
    const domain={domainId:def.domain.id,chapter:String(index),ledgers:domainLedgers,events:[]};
    deepFreeze(value);deepFreeze(domain);
    const p=merkleLeafParts(chapterParts(value)),d=merkleLeafParts(chapterParts(domain));
    const record={index,value,domain,exposures,state,snapshots,chapterBytes:p.bytes+d.bytes,pHash:p.hash,dHash:d.hash};
    lastRecord=record;
    if(!cold){cache=cache.filter(c=>c.index!==index);cache.push(record);if(cache.length>2)cache.shift();}
    return value;
  }
  return {def,chapter,indices,
    get checkpoints(){return structuredClone(checkpoints);},
    get cachedChapterCount(){return cache.length;},
    clearCache(){cache=[];lastRecord=null;checkpoints=[{tick:def.fromTick,live:domainState(def,genesis),archiveRecords:[]}];},
    resultDigest(order=indices,options={}) {
      if(canonicalString([...order].sort(compare))!==canonicalString(indices))throw new RangeError('Every chapter required once');
      const cs=[];for(const i of order){chapter(i,options);cs.push({index:i,pHash:lastRecord.pHash,dHash:lastRecord.dHash});}
      cs.sort((a,b)=>compare(a.index,b.index));lastRecord=null;
      return composedRoot(def,cs.map(c=>c.pHash),cs.map(c=>c.dHash));
    },
    compileSummary() {
      const hashes=[],dHashes=[],events=[],exposures=IMPLEMENTED.map(k=>({kind:k.kind,opportunityTicks:0}));let state=genesis,ticks=0,maxChapterBytes=0;
      for(const index of indices) {
        const c=chapter(index),record=lastRecord;hashes.push(record.pHash);dHashes.push(record.dHash);events.push(...c.events);
        for(const x of record.exposures)exposures.find(e=>e.kind===x.kind).opportunityTicks+=x.opportunityTicks;
        ticks+=c.ledgers.length;state=record.state;maxChapterBytes=Math.max(maxChapterBytes,record.chapterBytes);
        cache=cache.filter(c=>c.index!==index);lastRecord=null;
      }
      deepFreeze(state);
      return {...maximumEra(genesis,events),outcome:outcomeClass(state),state,events,ticks,exposures,maxChapterBytes,manifestDigest:def.manifestDigest,recipeDigest:def.recipeDigest,resultDigest:composedRoot(def,hashes,dHashes)};
    },
    run(){
      cache=[];const events=[],ledgers=[],pHashes=[],dHashes=[];let state=genesis;
      for(const i of indices){chapter(i,{inspect:true});const c=lastRecord;events.push(...c.value.events);ledgers.push(...c.snapshots);pHashes.push(c.pHash);dHashes.push(c.dHash);state=c.state;}
      lastRecord=null;
      return {...maximumEra(genesis,events),outcome:outcomeClass(state),state,events,ledgers,manifestDigest:def.manifestDigest,recipeDigest:def.recipeDigest,resultDigest:composedRoot(def,pHashes,dHashes)};
    }
  };
}
