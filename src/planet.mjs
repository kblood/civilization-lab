import { canonicalBytes, canonicalString, compare, freezeCanonical } from './canonical.mjs';
import { merkleRoot, merkleLeafHash, merkleRootFromHashes } from './digest.mjs';
import { deepFreeze } from './manifest.mjs';
import { floorDiv as F } from './time.mjs';
import { createHazard, advanceHazard, hazardKey } from './hazard.mjs';
import { eventId, hazardIntent, thresholdIntent, messageIntent, chainIntent, compareEvents, sortEvents, tickLedger } from './events.mjs';
import { kindOf, IMPLEMENTED } from './catalogue.mjs';
import { createDefinition, magnitude, chanceMagnitude, priors, override, originId } from './civ-input.mjs';
import { digest } from './environment.mjs';
import { DOMAINS, MAX_TIERS, NSTAR, CAPTURE, FUEL, gate, era, capacity, damage, pressure, bevertonHolt, min, max } from './tech.mjs';
import { population, members, fighting, clamp, polityRecord, splitRecords, naturalPolity, powerAt, rebuildOwnership } from './polities.mjs';
import { refsUnique, newChain, advanceChain, chainWitness, participant } from './chains.mjs';
import { addScore, distance, deriveScores, mergeProvenance, causes } from './provenance.mjs';
export { createDefinition } from './civ-input.mjs';
export { bevertonHolt } from './tech.mjs';
const byId=(a,b)=>compare(a.id,b.id);
const copyArc=a=>({...a,regions:a.regions.map(r=>({...r})),polities:a.polities.map(p=>({...p})),hazardLedger:[...a.hazardLedger],chains:[...a.chains],latches:a.latches.map(l=>({...l})),outbox:[]});
const slots=(r,...fields)=>fields.map(f=>[r.id,'region.'+f]);
function event(def,arc,kind,owner,intent,trigger,date=Number(arc.tick*10n),phase=kindOf(kind).phase) {
  const k=kindOf(kind),tick=String(arc.tick);
  return {id:eventId(owner,kind,tick,intent),ordinal:0,kind,kindRank:k.kindRank,level:k.owner,ownerId:owner,intentKey:intent,
    refs:[{role:'arc',entityId:arc.id}],tick,dateYear:date,precision:trigger.mode==='hazard'?'year':'decade',phase,trigger,
    causes:[],params:{},effects:[],chain:null,salience:k.salience,forced:false,modelVersion:'civ-m2-1',resolution:'accepted',reason:null,
    data:{sets:[],stage:null,outcome:null,source:null,target:null,survivor:null,launch:null}};
}
function installEnvironment(def,a) {
  const year=Number(a.tick*10n),life=def.planet.lifecycle.value;
  for(const r of a.regions) {
    const row=def.planet.epochs.value.rows.find(e=>e.regionId===r.localId&&BigInt(e.fromEpoch)<=F(a.tick,100n)&&F(a.tick,100n)<BigInt(e.untilEpoch));
    if(!row)throw new RangeError('Epoch gap');
    r.damage=r.damage.filter(d=>d.untilTick>a.tick);r.berthsUsed=0;
    r.Kbase=year<life.habitableFromYear||year>=life.habitableUntilYear||
      (def.planet.hosting==='habitat-buildable'&&(r.tiers[0]<5||r.tiers[1]<5))?0n:BigInt(row.Kbase);
    r.resources=row.resources;r.K=capacity(r);r.era=era(r.tiers);r.energy=r.pop*CAPTURE[r.era];
  }
}
function skeleton(def) {
  const a={id:def.arcId,lineageId:'lin:'+def.planet.body,body:def.planet.body,episode:0,foundedYear:Number(def.fromTick*10n),foundingTiers:Array(7).fill(0),
    lastDeath:null,isColony:false,colonizer:true,regions:[],polities:[],hazardLedger:[],chains:[],provenance:[],latches:[],perils:'none',nonviable:false,
    outcome:{biological:'extant',industrialEra:0,regressing:false,political:'none',terminal:false},scenarioParams:priors(def,'lin:'+def.planet.body),inbox:[],outbox:[],tick:def.fromTick};
  a.regions=def.planet.partition.value.regions.map(r=>({id:a.id+'#'+r.id,localId:r.id,pop:0n,Kbase:0n,K:0n,renewable:1000,infra:0n,fuel:0n,forcing:0n,immunityTicks:20,
    damage:[],polityId:null,cultureId:a.id+'#cul:founder',culture:[500,500,500],tiers:Array(7).fill(0),caps:[...MAX_TIERS],era:0,energy:0n,resources:[0,0,0,0],collapse:null,lowTicks:Array(7).fill(0),ceilings:[],spaceflight:false,berthsUsed:0}));
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
  installEnvironment(def,a);
  a.outcome.industrialEra=a.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.era):n,0);
  a.outcome.political=a.polities.length?'continuous':'none';
  return a;
}
function effectivePopulation(def,a,r) {
  return r.pop+def.edges.filter(e=>e.from===r.id).reduce((n,e)=>n+F(a.regions.find(r=>r.id===e.to).pop*BigInt(e.contact),1000n),0n);
}
function natural(def,pre,next) {
  const deltas=[],polityNatural=[];
  const alive=population(pre.regions)>0n;
  for(let i=0;i<pre.regions.length;i++) {
    const p=pre.regions[i],r=next.regions[i],owner=pre.polities.find(v=>v.id===p.polityId),neff=effectivePopulation(def,pre,p);
    if(alive) {
      r.pop=bevertonHolt(p.pop,p.K,def.g[p.era]);
      if(pre.nonviable&&r.pop>0n)r.pop-=min(r.pop,max(1n,F(r.pop*100n,1000n)));
      r.infra=F(p.infra*BigInt(def.keep),1000n)+F(p.pop*BigInt(def.build[p.era])*BigInt(1000-(owner?.stress??0)),1000n);
      r.fuel=p.fuel+F(p.pop*BigInt(FUEL[p.era])*BigInt(p.tiers[0]>=5?1000:p.resources[1]),1000n);
      r.forcing=F(p.forcing*990n,1000n)+(p.tiers[0]===3?F(p.energy,1000n):p.tiers[0]===4?F(p.energy,2000n):0n);
      r.renewable=clamp(p.renewable+20-F(pressure(p),50));r.immunityTicks=Math.min(20,p.immunityTicks+1);
      r.lowTicks=p.tiers.map((t,d)=>t>0&&neff<F(BigInt(NSTAR[d][t])*BigInt(pre.scenarioParams.learningBias),1000n)?Math.min(2,p.lowTicks[d]+1):0);
      const capital=owner&&pre.regions.find(r=>r.id===owner.capital);
      r.culture=p.culture.map((n,j)=>capital?n+compare(capital.culture[j],n):n);
    }
    const delta={regionId:r.id};for(const key of ['pop','infra','fuel','forcing','renewable','immunityTicks'])delta[key]=r[key]-p[key];
    for(const key of ['culture','lowTicks'])delta[key]=r[key].map((n,j)=>n-p[key][j]);deltas.push(delta);
    if(r.pop<p.pop)next.lastDeath={tick:pre.tick,stage:3,ownerId:pre.id,sequence:i,dateYear:Number(pre.tick*10n+9n),eventId:null,kind:null};
  }
  next.polities=pre.polities.map(p=>{
    const q=alive?naturalPolity(pre,p):{...p},d={polityId:p.id};for(const k of ['eliteShare','asabiya','legitimacy','stress','warWeariness'])d[k]=q[k]-p[k];polityNatural.push(d);return q;
  });
  return {naturalDelta:deltas,polityNatural};
}
function thresholdIntents(def,pre,next) {
  const out=[];
  const check=(kind,r,predicate,variable,value,limit,params={},subject=r.id,drivers=[])=>{
    let latch=next.latches.find(l=>l.kind===kind&&l.subject===subject);
    if(!latch&&!predicate)return;
    if(!latch){latch={kind,subject,active:false};next.latches.push(latch);}
    if(predicate&&!latch.active) {
      const e=event(def,pre,kind,r.id,thresholdIntent(subject),{mode:'threshold',crossed:{var:variable,value:String(value),threshold:String(limit)}});
      e.params=Object.fromEntries(Object.keys(params).sort(compare).map(k=>[k,String(params[k])]));
      e.causes=causes(pre,e,[{edge:'TRIGGERED',slots:drivers}]);out.push({e,r:r.id});
    }
    latch.active=predicate;
  };
  for(const r of pre.regions) {
    const dmg=damage(r);
    check('FAMINE',r,r.pop>0n&&(r.pop*1000n>r.K*1200n||dmg>=300),'region.pop',r.pop,F(r.K*1200n,1000n),{damage:dmg,lossPermille:clamp(pressure(r)-1000+dmg,50,700)},r.id,slots(r,'pop','K','damage'));
    for(let d=0;d<7;d++)check('TECH_LOSS',r,r.tiers[d]>0&&r.lowTicks[d]>=2,'region.lowTicks',r.lowTicks[d],2,{domainIndex:d,drop:1},r.id+'~tech:'+DOMAINS[d],slots(r,'tiers','lowTicks'));
    check('RECOVERY',r,!!r.collapse?.active&&r.pop*2n>=r.collapse.recoverPop&&r.infra*4n>=r.collapse.recoverInfra*3n,'region.infra',r.infra*4n,(r.collapse?.recoverInfra??0n)*3n,{},r.id,slots(r,'collapse','pop','infra'));
  }
  check('EXTINCTION',pre,population(pre.regions)===0n&&!pre.outcome.terminal,'region.pop',0,0,{},pre.id,pre.regions.flatMap(r=>slots(r,'pop')));
  next.latches.sort((a,b)=>compare(a.kind,b.kind)||compare(a.subject,b.subject));
  return out;
}
function opportunities(def,pre) {
  const out=[];
  const term=(name,value,drivers)=>({name,value,drivers});
  const add=(kind,owner,terms,meta={},components={},gateSlots=[])=>out.push({kind,hazardId:{ownerId:owner,kind,...components},terms:terms.sort((a,b)=>compare(a.name,b.name)),...meta,gateSlots});
  for(const r of pre.regions) {
    const owner=pre.polities.find(p=>p.id===r.polityId),neff=effectivePopulation(def,pre,r);
    const neighbours=def.edges.filter(e=>e.from===r.id);
    const popSlots=[...slots(r,'pop'),...neighbours.flatMap(e=>slots(pre.regions.find(r=>r.id===e.to),'pop'))];
    for(let d=0;d<7;d++) {
      const g=gate(r,d,def.planet.profile,owner);if(!g.eligible)continue;
      const kind=d===1&&r.tiers[d]===0?'AGRICULTURE':'DISCOVERY';
      let rate=F(BigInt(kind==='AGRICULTURE'?40:400)*neff*BigInt(pre.scenarioParams.innovationPpm),1000000n);
      if(kind==='AGRICULTURE')rate=F(rate*BigInt(r.resources[3]),1000n);
      add(kind,r.id,[term('kremer',rate,[...popSlots,...(kind==='AGRICULTURE'?slots(r,'resources'):[])])],{r:r.id,d,target:r.tiers[d]+1},{domain:DOMAINS[d],targetTier:r.tiers[d]+1},slots(r,'tiers','caps','resources'));
    }
    for(const edge of neighbours) {
      const dest=pre.regions.find(r=>r.id===edge.to);
      if(r.pop>0n&&edge.contact>0&&dest.K>dest.pop) {
        const headroom=F((dest.K-dest.pop)*1000n,max(1n,dest.K));
        const push=clamp(pressure(r)-700+damage(r)+(fighting(pre,r.polityId)?200:0)+(1000-r.renewable),0,2000);
        add('MIGRATION',r.id,[term('pressure',F(21474836n*BigInt(push)*headroom*BigInt(edge.contact),1000000000n),[...slots(r,'pop','K','damage','renewable'),...slots(dest,'pop','K')])],{r:r.id,to:dest.id},{edgeId:edge.id});
      }
      if(edge.contact>0&&dest.pop>0n)for(let d=0;d<7;d++)if(r.tiers[d]>dest.tiers[d]&&gate(dest,d,def.planet.profile,pre.polities.find(p=>p.id===dest.polityId)).eligible)
        add('DIFFUSION',edge.id,[term('contact',F(42949673n*BigInt(r.tiers[d]-dest.tiers[d])*BigInt(edge.contact),1000n),[...slots(r,'tiers'),...slots(dest,'tiers')])],{r:dest.id,source:r.id,d,target:dest.tiers[d]+1},{domain:DOMAINS[d],edgeId:edge.id},slots(dest,'tiers','caps','resources'));
    }
    if(r.pop>0n&&!pre.chains.some(c=>c.kind==='PLAGUE'&&participant(c,'origin')===r.id)) {
      const connectivity=1000+neighbours.reduce((n,e)=>n+e.contact,0),susceptible=50+F(950*r.immunityTicks,20);
      add('PLAGUE',r.id,[term('density',F(71582788n*BigInt(pressure(r))*BigInt(connectivity)*BigInt(susceptible)*BigInt([10,100,300,600,1000,1000][r.tiers[1]])*BigInt([1000,700,400,150,50][r.tiers[5]]),1000000000000000n),slots(r,'pop','K','immunityTicks','tiers'))],{r:r.id});
    }
    if(r.polityId===null&&r.pop>=1000n&&r.tiers[1]>=2&&pressure(r)>=100)add('POLITY_FOUNDING',r.id,[term('density',F(42949673n*BigInt(Math.min(1000,pressure(r))),1000n),slots(r,'pop','K'))],{r:r.id}, {},slots(r,'tiers'));
  }
  for(const attacker of pre.polities)for(const defender of pre.polities) {
    if(attacker.id===defender.id||!population(members(pre,attacker))||!population(members(pre,defender)))continue;
    if(pre.chains.some(c=>c.kind==='WAR'&&c.refs.some(r=>r.entityId===attacker.id)&&c.refs.some(r=>r.entityId===defender.id)))continue;
    const target=members(pre,defender).find(r=>def.edges.some(e=>e.to===r.id&&attacker.regions.includes(e.from)));if(!target)continue;
    const pa=powerAt(pre,attacker,target.id,def.distances),pd=powerAt(pre,defender,target.id,def.distances),ratio=min(2000n,F(pa*1000n,max(1n,pd)));
    const ac=pre.regions.find(r=>r.id===attacker.capital),dc=pre.regions.find(r=>r.id===defender.capital);
    const dist=F(ac.culture.reduce((n,c,i)=>n+Math.abs(c-dc.culture[i]),0),3);
    add('WAR',attacker.id+'>'+defender.id,[term('stress',F(429496730n*ratio*BigInt(Math.max(100,attacker.stress))*BigInt(1000-attacker.warWeariness),1000000000n),
      [...members(pre,attacker),...members(pre,defender)].flatMap(r=>slots(r,'pop','tiers')).concat([[attacker.id,'polity.asabiya'],[defender.id,'polity.asabiya'],[attacker.id,'polity.stress'],[attacker.id,'polity.warWeariness']])),
      term('culture',F(2147483n*BigInt(dist),1000n),[...slots(ac,'culture'),...slots(dc,'culture')])],{attacker:attacker.id,defender:defender.id,to:target.id});
  }
  if(population(pre.regions)>0n&&pre.outcome.industrialEra>=1) {
    const stress=pre.polities.reduce((n,p)=>Math.max(n,p.stress),pre.polities.length?0:100),complexity=pre.regions.filter(r=>r.pop>0n).reduce((n,r)=>n+r.tiers.reduce((a,b)=>a+b,0),0);
    add('COLLAPSE',pre.id,[term('stress',F(42949673n*BigInt(stress)*BigInt(stress),1000000n),pre.polities.map(p=>[p.id,'polity.stress'])),term('overhead',F(42949n*BigInt(complexity),7n),pre.regions.flatMap(r=>slots(r,'tiers','pop')))]);
  }
  return out.map(o=>({...o,key:hazardKey(o.hazardId)})).sort((a,b)=>compare(a.key,b.key));
}
function hazardIntents(def,pre,next,exposures) {
  const out=[];
  for(const o of opportunities(def,pre)) {
    if(o.key.length>65536)throw new RangeError('Hazard identity exceeds contract bound');
    exposures.find(x=>x.kind===o.kind).opportunityTicks++;
    const previous=next.hazardLedger.find(h=>h.key===o.key)??{...createHazard(def,o.hazardId),closed:false};
    const total=o.terms.reduce((n,t)=>n+t.value,0n),h=BigInt(override(def,`hazard.${o.kind}.q32`)??total);
    const result=advanceHazard(def,previous,h);
    const index=next.hazardLedger.findIndex(h=>h.key===o.key);if(index<0)next.hazardLedger.push(result.entry);else next.hazardLedger[index]=result.entry;
    for(const f of result.firings) {
      const v=f.evidence,e=event(def,pre,o.kind,o.hazardId.ownerId,hazardIntent(o.key,v.episode),{mode:'hazard',hazardId:o.key,episode:String(v.episode),H_start_q32:String(v.H_start),distance_q32:String(v.distance),h_q32:String(v.h),saturated:f.saturated===true},Number(pre.tick*10n)+f.yearOffset);
      e.causes=causes(pre,e,[{edge:'RAISED_HAZARD',slots:o.terms.filter(t=>4n*t.value>=total).flatMap(t=>t.drivers)},{edge:'ENABLED',slots:o.gateSlots}]);
      if(['AGRICULTURE','DISCOVERY','DIFFUSION'].includes(e.kind))e.params={domainIndex:String(o.d),targetTier:String(o.target)};
      if(e.kind==='DIFFUSION'){e.data.source=o.source;e.data.target=o.r;}
      if(e.kind==='MIGRATION'){e.params={fraction:String(magnitude(def,e.id,'evt.migration.fraction',50,250))};e.data.source=o.r;e.data.target=o.to;}
      if(e.kind==='PLAGUE'){e.params={lossPermille:String(magnitude(def,e.id,'evt.plague.loss',100,300))};e.data.stage='OUTBREAK';}
      if(e.kind==='WAR')e.data.stage='DECLARED';
      if(e.kind==='COLLAPSE')e.params={drop:String(magnitude(def,e.id,'evt.collapse.drop',1,2)),splitCount:'0'};
      if(e.kind==='POLITY_FOUNDING')e.data.target=`${pre.id}#pol:${pre.tick}:12:${pre.regions.find(r=>r.id===o.r).localId}:0`;
      out.push({...o,e});
    }
  }
  next.hazardLedger.sort((a,b)=>compare(a.key,b.key));return out;
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
    if(e.kind==='COLLAPSE')i.splits=pre.polities.filter(p=>p.regions.length>=2&&claim(['retire:'+p.id,...p.regions.map(id=>'territory:'+id)])).map(p=>p.id);
  }
}
// All primitive writes go through this recorder. Intermediate changes score
// before a later operation can cancel them; sets retain the final atomic value.
function recorder(arc,scores) {
  let sequence=0;
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
      if(amount>0n)arc.lastDeath={tick:arc.tick,stage:4,ownerId:arc.id,sequence,dateYear:e.dateYear,eventId:e.id,kind:e.kind};
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
  return {set,loss,transfer};
}
function applyIntents(def,pre,next,intents,scores) {
  const op=recorder(next,scores),splitEvents=[];
  for(const i of intents) {
    const e=i.e,r=next.regions.find(r=>r.id===i.r),p=pre.regions.find(r=>r.id===i.r);
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
        for(const v of next.regions) {
          const before=pre.regions.find(r=>r.id===v.id),old=v.collapse;
          op.set(e,v,'region','collapse',{active:true,recoverPop:max(old?.recoverPop??0n,before.pop),recoverInfra:max(old?.recoverInfra??0n,before.infra)});
          e.refs.push({role:'victim',entityId:v.id});op.loss(e,v,300);op.loss(e,v,700,'infra');op.set(e,v,'region','tiers',v.tiers.map(t=>Math.max(0,t-Number(e.params.drop))));
        }
        let count=0;
        for(const id of i.splits) {
          const parent=next.polities.find(p=>p.id===id);if(!parent||parent.endedYear!==null)continue;
          const children=splitRecords(pre,pre.polities.find(p=>p.id===id),e);
          op.set(e,parent,'polity','endedYear',e.dateYear);
          op.set(e,next,'arc','polities',[...next.polities,...children].sort(byId));
          for(const child of children)for(const rid of child.regions)op.set(e,next.regions.find(r=>r.id===rid),'region','polityId',child.id);
          count++;
        }
        e.params.splitCount=String(count);if(count)splitEvents.push(e.id);break;
      }
      case 'RECOVERY':if(canonicalString(r.collapse)!==canonicalString(p.collapse))preempt(e,'new-collapse');else op.set(e,r,'region','collapse',null);break;
      case 'EXTINCTION': {
        op.set(e,next,'arc','outcome',{...next.outcome,terminal:true,biological:'extinct'});
        for(const polity of next.polities)if(polity.endedYear===null)op.set(e,polity,'polity','endedYear',e.dateYear);
        for(const v of next.regions)op.set(e,v,'region','polityId',null);break;
      }
      default:throw new Error('Unimplemented M2a event '+e.kind);
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
  installEnvironment(def,next);
  for(const r of next.regions) {
    r.tiers=r.tiers.map((t,d)=>Math.min(t,r.caps[d]));r.K=capacity(r);r.era=era(r.tiers);r.energy=r.pop*CAPTURE[r.era];
    r.ceilings=DOMAINS.flatMap((_,d)=>gate(r,d,def.planet.profile,next.polities.find(p=>p.id===r.polityId)).ceilings)
      .sort((a,b)=>compare(a.domain,b.domain)||compare(a.targetTier,b.targetTier)||compare(a.reason,b.reason));
  }
  rebuildOwnership(next,Number(pre.tick*10n+10n));
  const frontier=next.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.era):n,0);
  next.outcome={biological:population(next.regions)>0n?'extant':'extinct',industrialEra:frontier,regressing:frontier<pre.outcome.industrialEra,
    political:splitEvents.length?'fragmented':next.polities.some(p=>p.endedYear===null)?'continuous':'none',terminal:next.outcome.terminal};
  if(next.perils==='none'&&frontier>=3)next.perils='active';
}
function archive(next) {
  const out=[];
  const retired=next.polities.filter(p=>p.endedYear!==null).map(p=>p.id);
  for(const h of next.hazardLedger) {
    const owners=h.hazardId.kind==='WAR'?h.hazardId.ownerId.split('>'):[h.hazardId.ownerId];
    if(next.outcome.terminal||owners.some(id=>retired.includes(id))) {
      const index=next.hazardLedger.indexOf(h);next.hazardLedger[index]={...h,closed:true};
    }
  }
  for(const [field,kind,idKey,predicate] of [['polities','polity','id',p=>p.endedYear!==null],['hazardLedger','hazard','key',h=>h.closed],['chains','chain','chainId',c=>c.status!=='active']]) {
    for(const record of next[field].filter(predicate))out.push({scope:next.id,kind,id:record[idKey],record});
    next[field]=next[field].filter(r=>!predicate(r));
  }
  next.provenance=next.provenance.filter(s=>!retired.includes(s.target));
  next.latches=next.latches.filter(s=>!retired.includes(s.subject));
  next.chains.sort((a,b)=>compare(a.chainId,b.chainId));
  return out.sort((a,b)=>compare(a.scope,b.scope)||compare(a.kind,b.kind)||compare(a.id,b.id));
}
export function stepPlanet(def,boundary,{founding=false}={}) {
  if(boundary.outcome.terminal)throw new Error('Terminal arc');
  const pre=copyArc(boundary),scores=[],phase0events=[];
  installEnvironment(def,pre);
  if(founding) {
    const positive=pre.regions.filter(r=>r.Kbase>0n);if(!positive.length)throw new Error('no-lineage');
    const e=event(def,pre,'SAPIENCE',pre.id,messageIntent(originId(pre.body)),{mode:'scheduled'});
    const count=Math.min(positive.length,magnitude(def,e.id,'evt.sapience.regions',1,2));e.params={regionCount:String(count)};
    const op=recorder(pre,scores);for(const r of positive.slice(0,count)){op.set(e,r,'region','pop',1000n);op.set(e,r,'region','infra',1000n);}
    installEnvironment(def,pre);phase0events.push(e);
  }
  const next=copyArc(pre);
  const exposures=IMPLEMENTED.map(k=>({kind:k.kind,opportunityTicks:0}));
  const intents=[...thresholdIntents(def,pre,next),...hazardIntents(def,pre,next,exposures),...chainIntents(def,pre)].sort((a,b)=>compareEvents(a.e,b.e));
  resolveLocks(pre,intents);
  const updates=natural(def,pre,next),splitEvents=applyIntents(def,pre,next,intents,scores);
  derive(def,pre,next,splitEvents);
  const events=[...phase0events,...intents.map(i=>i.e)];
  for(const r of next.regions) {
    const p=pre.regions.find(p=>p.id===r.id);if(p.era===r.era)continue;
    const ids=scores.find(s=>s.target===r.id&&s.field==='region.tiers')?.entries.map(e=>e.eventId)??[];
    const enabling=events.filter(e=>ids.includes(e.id)&&e.resolution==='accepted');
    const date=enabling.reduce((n,e)=>Math.max(n,e.dateYear),Number(pre.tick*10n));
    const e=event(def,pre,'ENERGY_TRANSITION',r.id,thresholdIntent(r.id),{mode:'threshold',crossed:{var:'region.era',value:String(r.era),threshold:String(p.era)}},date,5);
    e.params={fromEra:String(p.era),toEra:String(r.era)};e.causes=causes(pre,e,[],enabling.map(event=>({event,edge:'ENABLED'})));events.push(e);
  }
  deriveScores(boundary,next,scores,splitEvents);next.provenance=mergeProvenance(pre.provenance,scores);
  const archived=archive(next);next.tick++;
  for(const e of events) {
    for(const key of ['source','target','survivor'])if(e.data[key]!==null)e.refs.push({role:key,entityId:e.data[key]});
    e.refs=refsUnique(e.refs);e.data.sets.sort((a,b)=>compare(a.target,b.target)||compare(a.field,b.field));
  }
  const sorted=sortEvents(events);
  const ledger=tickLedger({arcId:pre.id,tick:pre.tick,startState:digest(boundary),...updates,eventIds:sorted.map(e=>e.id),endState:next,
    phase0:{eventIds:phase0events.map(e=>e.id),state:pre,inboxEffects:[]},archived});
  return {ledger,events:sorted,exposures};
}
export function outcomeClass(arc) {
  if(arc.outcome.terminal)return 'EXTINCT_NATURAL';
  const living=arc.regions.filter(r=>r.pop>0n);
  if(living.some(r=>r.caps.some((v,d)=>v<MAX_TIERS[d])))return 'EXISTENTIAL_CAP';
  if(living.some(r=>r.collapse?.active))return 'COLLAPSED_RECOVERING';
  if(arc.isColony&&living.some(r=>r.tiers.some((v,d)=>v<arc.foundingTiers[d])))return 'REGRESSED_STABLE';
  return 'EXTANT_PLANETARY';
}
// Standalone M2a has one reserved lineage/arc and no D catalogue events.
// The complete domain envelope and barrier witnesses are retained so M2b
// can add queues/voyages without changing checkpoint or root formats.
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
  const genesis=skeleton(def);
  if(def.forced.initial===null&&!genesis.regions.some(r=>r.Kbase>0n))return {status:'uninhabited',reason:'no-lineage'};
  let checkpoints=[{tick:def.fromTick,live:domainState(def,genesis),archiveRecords:[]}],cache=[];
  const indices=Array.from({length:Number(F(def.untilTick-1n,640n)-F(def.fromTick,640n)+1n)},(_,i)=>Number(F(def.fromTick,640n))+i);
  function chapter(index,{cold=false}={}) {
    if(!indices.includes(index))throw new RangeError('outside-model-range');
    const cached=!cold&&cache.find(c=>c.index===index);if(cached)return cached.value;
    const from=max(def.fromTick,BigInt(index)*640n),until=min(def.untilTick,BigInt(index+1)*640n);
    const cp=cold?checkpoints[0]:checkpoints.filter(c=>c.tick<=from).at(-1);
    let state=cp.live.arcs[0]??cp.archiveRecords.find(a=>a.kind==='arc'&&a.id===def.arcId)?.record,archiveRecords=[...cp.archiveRecords];const ledgers=[],events=[],domainLedgers=[],exposures=IMPLEMENTED.map(k=>({kind:k.kind,opportunityTicks:0}));
    while(state.tick<until&&!state.outcome.terminal) {
      const startDomain=domainState(def,state);
      const out=stepPlanet(def,state,{founding:state.tick===def.fromTick&&def.forced.initial===null});
      const domainArchived=out.ledger.endState.outcome.terminal?[{scope:'D:'+def.domain.id,kind:'arc',id:def.arcId,record:out.ledger.endState}]:[];
      const domainLedger=freezeCanonical({domainId:def.domain.id,tick:String(state.tick),startState:digest(startDomain),endState:domainState(def,out.ledger.endState),eventIds:[],transfers:[],archived:domainArchived});
      if(state.tick>=from){ledgers.push(out.ledger);events.push(...out.events);domainLedgers.push(domainLedger);for(const x of out.exposures)exposures.find(e=>e.kind===x.kind).opportunityTicks+=x.opportunityTicks;}
      state=out.ledger.endState;archiveRecords.push(...out.ledger.archived);
      archiveRecords.push(...domainArchived);
      if(state.tick%640n===0n&&!checkpoints.some(c=>c.tick===state.tick)){checkpoints.push({tick:state.tick,live:domainLedger.endState,archiveRecords:[...archiveRecords]});checkpoints.sort((a,b)=>compare(a.tick,b.tick));}
    }
    const value={arcId:def.arcId,chapter:String(index),ledgers,events:sortEvents(events)};
    const domain={domainId:def.domain.id,chapter:String(index),ledgers:domainLedgers,events:[]};
    freezeCanonical(value);freezeCanonical(domain);
    const record={index,value,domain,exposures,pHash:merkleLeafHash(canonicalBytes(value)),dHash:merkleLeafHash(canonicalBytes(domain))};
    if(!cold){cache.push(record);cache.sort((a,b)=>compare(a.index,b.index));}
    else coldResults.push(record);
    return value;
  }
  let coldResults=[];
  return {def,chapter,indices,
    get checkpoints(){return structuredClone(checkpoints);},
    clearCache(){cache=[];checkpoints=[{tick:def.fromTick,live:domainState(def,genesis),archiveRecords:[]}];},
    resultDigest(order=indices,options={}) {
      if(canonicalString([...order].sort(compare))!==canonicalString(indices))throw new RangeError('Every chapter required once');
      coldResults=[];order.forEach(i=>chapter(i,options));
      const cs=indices.map(i=>(options.cold?coldResults:cache).find(c=>c.index===i));
      const root=composedRoot(def,cs.map(c=>c.pHash),cs.map(c=>c.dHash));coldResults=[];return root;
    },
    compileSummary() {
      const hashes=[],dHashes=[],events=[],exposures=IMPLEMENTED.map(k=>({kind:k.kind,opportunityTicks:0}));let state=genesis,ticks=0;
      for(const index of indices) {
        const c=chapter(index),record=cache.find(c=>c.index===index);hashes.push(record.pHash);dHashes.push(record.dHash);events.push(...c.events);
        for(const x of record.exposures)exposures.find(e=>e.kind===x.kind).opportunityTicks+=x.opportunityTicks;
        ticks+=c.ledgers.length;state=c.ledgers.at(-1)?.endState??state;
        cache=cache.filter(c=>c.index!==index);
      }
      return {outcome:outcomeClass(state),state,events:sortEvents(events),ticks,exposures,manifestDigest:def.manifestDigest,recipeDigest:def.recipeDigest,resultDigest:composedRoot(def,hashes,dHashes)};
    },
    run(){const chapters=indices.map(i=>chapter(i)),events=sortEvents(chapters.flatMap(c=>c.events)),ledgers=chapters.flatMap(c=>c.ledgers),state=ledgers.at(-1)?.endState??genesis;
      return {outcome:outcomeClass(state),state,events,ledgers,manifestDigest:def.manifestDigest,recipeDigest:def.recipeDigest,resultDigest:this.resultDigest()};}
  };
}
