// P-owned M2b recipes. The only cross-body inputs here are immutable routes;
// live coupling is carried by the closed messages consumed at the D barrier.
import {compare} from './canonical.mjs';
import {floorDiv as F,ceilDiv as C} from './time.mjs';
import {address,magnitude,chanceMagnitude,override} from './civ-input.mjs';
import {weightedPick} from './rng.mjs';
import {population,members,regionById,splitRecords} from './polities.mjs';
import {min,max} from './tech.mjs';
export const PERILS=['NUCLEAR_WAR','ENGINEERED_PANDEMIC','RUNAWAY_TECH'];
export const payload=(patch={})=>({voyageId:null,kind:null,outcome:null,lossPermille:0,infraLossPermille:0,tierDrop:0,damagePermille:0,damageTicks:0,caps:null,launch:null,signal:null,failure:null,status:null,...patch});
export function message(domain,tick,source,type,target,causeEventId,data,ordinal=0,deliveryTick=tick+1n) {
  return {id:`${domain}#msg:${tick}~${source}~${type}~${target}~${ordinal}`,type,causeEventId,targetId:target,deliveryTick,payload:payload(data)};
}
export const berths=r=>[4000n,8000n,16000n][r.tiers[3]-5]??0n;
// M4c [scenario]: foreign occupancy becomes unknown after 2,000 years.
export const OCCUPANCY_YEARS=2000;
export function routesFor(def,r,pre=null) {
  return (def.routes??[]).filter(e=>e.from===def.planet.body&&e.travelYearsByTransportTier[r.tiers[3]]!==null&&
    (!pre||!pre.signals.some(s=>s.body===e.to&&s.lineageId!==pre.lineageId&&Number(pre.tick*10n)<s.arrivalYear+OCCUPANCY_YEARS)&&!pre.targetFailures.some(f=>f.body===e.to&&Number(pre.tick*10n)<f.untilYear))&&
    (e.destinationHosting==='habitable'||e.destinationHosting==='habitat-buildable'&&r.tiers[0]>=5&&r.tiers[1]>=5));
}
export function extraOpportunities(def,pre,add) {
  if(!population(pre.regions))return;
  const term=(name,value)=>({name,value});
  add('NATURAL_CATASTROPHE',pre.id,[term('impact',214748n),term('volcano',214748n)]);
  const information=pre.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.tiers[4]):n,0);
  for(const signal of pre.signals)if(signal.lineageId!==pre.lineageId&&!pre.contacts.some(c=>c.source===signal.source)&&(information>0||signal.physical))add('FIRST_CONTACT',pre.id,[term('signal',F(42949673n*BigInt(Math.max(signal.physical?1:0,information))*BigInt(signal.strength),1000n))],{source:signal.source},{edgeId:signal.source});
  for(const p of pre.polities) {
    const rs=members(pre,p),maxI=rs.reduce((n,r)=>Math.max(n,r.tiers[4]),0);
    if(rs.length>=2) {
      add('FRAGMENTATION',p.id,[term('stress',F(2147483n*BigInt(p.stress),1000n)),term('overhead',429496n*BigInt(rs.length-1))]);
      const capital=regionById(pre,p.capital),dist=rs.reduce((n,r)=>Math.max(n,F(r.culture.reduce((s,v,j)=>s+Math.abs(v-capital.culture[j]),0),3)),0);
      if(dist>=100||p.stress>=500)add('SCHISM',p.id,[term('distance',F(4294967n*BigInt(Math.max(dist,F(p.stress,2))),1000n))]);
    }
    if(maxI>=1&&population(rs)>0n)add('REVOLUTION',p.id,[term('stress',F(4294967n*BigInt(p.stress)*BigInt(maxI),5000n)),term('renewal',pre.perils==='exited'&&maxI>=4?4294967n:0n)]);
  }
  if(pre.perils==='active') {
    if(pre.regions.some(r=>r.pop>0n&&r.tiers[5]>=4&&r.tiers[4]>=4))add('ENGINEERED_PANDEMIC',pre.id,[term('prior',pre.scenarioParams.pandemicQ32)]);
    if(pre.regions.some(r=>r.pop>0n&&r.tiers[4]>=5))add('RUNAWAY_TECH',pre.id,[term('prior',pre.scenarioParams.runawayQ32)]);
    if(pre.chains.length&&pre.regions.some(r=>r.pop>0n&&r.tiers[0]>=4&&r.tiers[2]>=4)) {
      const armed=pre.polities.filter(p=>members(pre,p).some(r=>r.tiers[0]>=4&&r.tiers[2]>=4)).map(p=>p.id);
      const wars=pre.chains.filter(c=>c.kind==='WAR'&&c.refs.filter(r=>['attacker','defender'].includes(r.role)).every(r=>armed.includes(r.entityId))).length;
      if(armed.length>=2&&wars)add('NUCLEAR_WAR',pre.id,[term('prior',pre.scenarioParams.nuclearQ32*BigInt(Math.min(4,wars)))]);
    }
  }
  if(override(def,'oracle.launchPeriodYears')===undefined&&(pre.colonizer||pre.evacuating)&&(pre.tick%10n===0n||pre.evacuating)&&def.routes?.length)for(const r of pre.regions)if(r.spaceflight&&r.tiers[3]>=5&&r.pop>4000n&&min(min(F(r.infra,10n),F(r.fuel,5n)),berths(r))>=2000n&&routesFor(def,r,pre).length)
    add('LAUNCH',r.id,[term('window',pre.evacuating?4294967300n:429496730n)],{r:r.id},{edgeId:r.id+'~window'});
}
export function extraMagnitudes(def,pre,e,o) {
  if(e.kind==='NATURAL_CATASTROPHE') {
    const h=BigInt(e.trigger.h_q32),p=Number(override(def,'parameters.naturalExtinctionPpm')??min(1000n,F(3067833n*1000000n,max(1n,h))));
    if(h*BigInt(p)>3067833n*1000000n)throw new RangeError('Natural extinction rate cap');
    const extinct=override(def,'outcome.NATURAL_CATASTROPHE')??(chanceMagnitude(def,e.id,'out.NATURAL_CATASTROPHE',p)?'extinction':'survivable');
    e.data.outcome=extinct;e.params={lossPermille:String(extinct==='extinction'?1000:magnitude(def,e.id,'evt.natural.loss',100,400)),damageTicks:String(extinct==='extinction'?0:magnitude(def,e.id,'evt.natural.duration',5,20)),extinctionPpm:String(p)};
  }
  if(PERILS.includes(e.kind)) {
    const weights={NUCLEAR_WAR:[700,250,50],ENGINEERED_PANDEMIC:[650,250,100],RUNAWAY_TECH:[500,350,150]}[e.kind];
    const names=['collapse','existential-cap','extinction'];
    const outcome=override(def,'outcome.'+e.kind)??weightedPick(address(def,e.id,'out.'+e.kind),names.map((id,j)=>({id,weight:BigInt(weights[j])}))).id;
    const drop=magnitude(def,e.id,'evt.perils.drop',1,3),shared=chanceMagnitude(def,e.id,'evt.perils.shared',pre.scenarioParams.sharedRiskPpm);
    const [pop,infra]=e.kind==='NUCLEAR_WAR'?[600,800]:e.kind==='ENGINEERED_PANDEMIC'?[700,200]:[500,500];
    e.data.outcome=outcome;e.params={lossPermille:String(outcome==='extinction'?1000:outcome==='existential-cap'?F(pop,2):pop),infraLossPermille:String(outcome==='extinction'?1000:outcome==='existential-cap'?F(infra,2):infra),tierDrop:String(outcome==='collapse'?drop:0),damagePermille:e.kind==='NUCLEAR_WAR'?'600':'0',damageTicks:e.kind==='NUCLEAR_WAR'?'10':'0',shared:shared?'1':'0',outcomeIndex:String(names.indexOf(outcome))};
  }
  if(e.kind==='REVOLUTION'){o.regime=magnitude(def,e.id,'evt.revolution.regime',0,5);e.params={regimeIndex:String(o.regime)};}
  if(e.kind==='SCHISM'){o.coordinate=magnitude(def,e.id,'evt.schism.coordinate',0,2);e.params={coordinate:String(o.coordinate)};}
  if(e.kind==='LAUNCH') {
    const r=regionById(pre,o.r),route=weightedPick(address(def,e.id,'evt.launch.destination'),routesFor(def,r,pre).map(route=>({id:route.to,weight:route.destinationHosting==='habitable'?1000n:200n,route}))).route;
    o.route=route;e.params={persons:String(min(min(F(r.infra,10n),F(r.fuel,5n)),min(berths(r),max(0n,r.pop-2000n)))),travelYears:String(route.travelYearsByTransportTier[r.tiers[3]])};
  }
}
export function shock(op,e,r,permille,ticks,tick) {
  if(permille)op.set(e,r,'region','damage',[...r.damage,{eventId:e.id,permille,untilTick:tick+1n+BigInt(ticks)}].sort((a,b)=>compare(a.untilTick,b.untilTick)||compare(a.eventId,b.eventId)));
}
export const perilCaps=kind=>({NUCLEAR_WAR:[3,5,3,4,3,4,3],ENGINEERED_PANDEMIC:[6,5,5,7,3,2,5],RUNAWAY_TECH:[4,4,4,4,3,3,3]})[kind];
export function catastrophe(pre,next,e,op,p) {
  for(let j=0;j<next.regions.length;j++) {
    const r=next.regions[j],before=pre.regions[j];e.refs.push({role:'victim',entityId:r.id});
    if(p.outcome==='collapse')op.set(e,r,'region','collapse',{active:true,recoverPop:max(r.collapse?.recoverPop??0n,before.pop),recoverInfra:max(r.collapse?.recoverInfra??0n,before.infra)});
    op.loss(e,r,p.lossPermille);op.loss(e,r,p.infraLossPermille,'infra');
    if(p.caps){op.set(e,r,'region','caps',r.caps.map((v,d)=>Math.min(v,p.caps[d])));op.set(e,r,'region','tiers',r.tiers.map((v,d)=>Math.min(v,r.caps[d])));}
    if(p.tierDrop)op.set(e,r,'region','tiers',r.tiers.map(v=>Math.max(0,v-p.tierDrop)));
    shock(op,e,r,p.damagePermille,p.damageTicks,pre.tick);
  }
}
export function applyExtra(def,pre,next,i,op,preempt,splitEvents) {
  const e=i.e,r=next.regions.find(r=>r.id===i.r),p=next.polities.find(p=>p.id===e.ownerId);
  switch(e.kind) {
    case 'FIRST_CONTACT': {
      if(next.contacts.some(c=>c.source===i.source)){preempt(e,'already-contacted');break;}
      const signal=pre.signals.find(s=>s.source===i.source);e.data.source=i.source;
      op.set(e,next,'arc','contacts',[...next.contacts,{source:i.source,eventId:e.id,dateYear:e.dateYear}].sort((a,b)=>compare(a.source,b.source)));
      op.set(e,next,'arc','diffusionEdges',[...next.diffusionEdges,{source:i.source,tiers:[...signal.tiers]}].sort((a,b)=>compare(a.source,b.source)));break;
    }
    case 'HEGEMONY':if(p)op.set(e,p,'polity','hegemony',true);break;
    case 'FRAGMENTATION': {
      if(!p||p.endedYear!==null){preempt(e,'target-ended');break;}
      const children=splitRecords(pre,pre.polities.find(p=>p.id===e.ownerId),e);
      op.set(e,p,'polity','endedYear',e.dateYear);op.set(e,next,'arc','polities',[...next.polities,...children].sort((a,b)=>compare(a.id,b.id)));
      for(const child of children)for(const id of child.regions)op.set(e,next.regions.find(r=>r.id===id),'region','polityId',child.id);
      splitEvents.push(e.id);break;
    }
    case 'REVOLUTION': {
      if(!p||p.endedYear!==null){preempt(e,'target-ended');break;}
      const original=pre.polities.find(p=>p.id===e.ownerId),regimes=['band','chiefdom','empire','federation','republic','state','technocracy'].filter(v=>v!==original.regime);
      op.set(e,p,'polity','regime',regimes[i.regime]);op.set(e,p,'polity','legitimacy',700);op.set(e,p,'polity','eliteShare',F(p.eliteShare,2));op.set(e,p,'polity','stress',200);break;
    }
    case 'SCHISM': {
      if(!p||p.endedYear!==null){preempt(e,'target-ended');break;}
      const original=pre.polities.find(p=>p.id===e.ownerId),rs=members(pre,original),capital=regionById(pre,original.capital);
      for(const old of rs.slice(F(rs.length,2))) {
        const v=next.regions.find(r=>r.id===old.id),culture=[...v.culture];culture[i.coordinate]=(capital.culture[i.coordinate]+500)%1001;
        op.set(e,v,'region','cultureId',`${pre.id}#cul:${pre.tick}:18:${rs[0].localId}:1`);op.set(e,v,'region','culture',culture);
      }break;
    }
    case 'SPACEFLIGHT':op.set(e,r,'region','spaceflight',true);break;
    case 'COLONY_LOST':op.set(e,next,'arc','nonviable',true);break;
    case 'CLIMATE_CATASTROPHE':shock(op,e,r,500,100,pre.tick);break;
    case 'NATURAL_CATASTROPHE':catastrophe(pre,next,e,op,payload({outcome:e.data.outcome,lossPermille:Number(e.params.lossPermille),infraLossPermille:e.data.outcome==='extinction'?0:Number(e.params.lossPermille),damagePermille:e.data.outcome==='extinction'?0:300,damageTicks:Number(e.params.damageTicks)}));break;
    case 'NUCLEAR_WAR':case 'ENGINEERED_PANDEMIC':case 'RUNAWAY_TECH': {
      const data=payload({kind:e.kind,outcome:e.data.outcome,...Object.fromEntries(['lossPermille','infraLossPermille','tierDrop','damagePermille','damageTicks'].map(k=>[k,Number(e.params[k])])),caps:e.data.outcome==='existential-cap'?perilCaps(e.kind):null});
      catastrophe(pre,next,e,op,data);
      if(e.params.shared==='1')next.outbox.push(message(def.domain.id,pre.tick,pre.id,'SHARED',pre.lineageId,e.id,data));break;
    }
    case 'LAUNCH': {
      const persons=min(min(F(r.infra,10n),F(r.fuel,5n)),min(berths(regionById(pre,r.id))-BigInt(r.berthsUsed),max(0n,r.pop-2000n)));
      if(persons<2000n){preempt(e,'no-stock');break;}
      const old=regionById(pre,r.id),arrival=e.dateYear+Number(e.params.travelYears),id=`${pre.id}#voy:${pre.tick}:${r.localId}`;
      if(!Number.isSafeInteger(arrival))throw new RangeError('Unsafe arrival year');
      e.params.persons=String(persons);e.data.launch={id,lineageId:pre.lineageId,sourceArc:pre.id,sourceRegion:r.id,destination:i.route.to,launchEventId:e.id,launchYear:e.dateYear,arrivalYear:arrival,deliveryTick:max(C(BigInt(arrival),10n),pre.tick+1n),tiers:[...old.tiers],cultureId:old.cultureId,culture:[...old.culture],status:'transit'};
      op.set(e,r,'region','infra',r.infra-10n*persons);op.set(e,r,'region','fuel',r.fuel-5n*persons);op.set(e,r,'region','berthsUsed',r.berthsUsed+Number(persons));
      op.launch(e,r,'transit:'+id,persons);
      next.outbox.push(message(def.domain.id,pre.tick,pre.id,'LAUNCH',i.route.to,e.id,{launch:e.data.launch}));break;
    }
  }
}
