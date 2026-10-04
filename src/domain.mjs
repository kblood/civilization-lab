import {compare,canonicalBytes,canonicalString} from './canonical.mjs';
import {digest,readFixture,validateStub,validatePlanet,Availability,StubEnvironment} from './environment.mjs';
import {createDefinition,validateForced,address,override,priors,originId,chanceMagnitude} from './civ-input.mjs';
import {skeleton,installEnvironment,stepPlanet,event,recorder,maximumEra} from './planet.mjs';
import {stateDigest} from './state-witness.mjs';
import {valueDelta} from './delta-witness.mjs';
import {chapterParts,freezeGenerated,generatedString} from './witness.mjs';
import {sha256Hex,merkleRoot,merkleRootFromHashes,merkleLeafParts} from './digest.mjs';
import {floorDiv as F,ceilDiv as C} from './time.mjs';
import {below,expQ32,chance} from './rng.mjs';
import {hazardKey,compactHazardKey,advanceHazard} from './hazard.mjs';
import {messageIntent,thresholdIntent,hazardIntent,compareEvents,sortEvents} from './events.mjs';
import {population} from './polities.mjs';
import {GROWTH,BUILD,MAX_TIERS,min,max,era} from './tech.mjs';
import {payload,message,PERILS} from './m2b.mjs';
const byId=(a,b)=>compare(a.id,b.id),routeOrder=(a,b)=>compare(a.from,b.from)||compare(a.to,b.to);
const archiveOrder=(a,b)=>compare(a.scope,b.scope)||compare(a.kind,b.kind)||compare(a.id,b.id);
const messageOrder=(a,b)=>compare(a.deliveryTick,b.deliveryTick)||compare(a.targetId,b.targetId)||compare(a.id,b.id);
const noForced=()=>({initial:null,overrides:[]});
function safeYear(n){const v=Number(n);if(!Number.isSafeInteger(v))throw new RangeError('Unsafe year');return v;}
export function expandDomain(input) {
  const raw=typeof input==='string'?readFixture(input):structuredClone(input);
  let domain=raw;
  if(raw.schemaVersion==='civ-system-stub-1')domain={schemaVersion:'civ-domain-stub-1',id:'standalone:'+raw.id,systems:[{id:raw.id,fixture:input,bodyPrefix:raw.bodies[0].body.slice(0,raw.bodies[0].body.lastIndexOf(':'))}],routes:[],origins:[raw.bodies[0].body],fromYear:0,untilYear:2000000};
  validateStub(domain,'DomainStub');
  if(domain.id.length>128||/^(arc:|lin:)/.test(domain.id))throw new TypeError('Invalid domain identity');
  if(domain.fromYear%10||domain.untilYear%10||domain.untilYear<=domain.fromYear)throw new TypeError('Domain bounds');
  const systems=domain.systems.map(ref=>{
    const source=readFixture(ref.fixture),system=source.schemaVersion==='civ-planet-stub-1'?{schemaVersion:'civ-system-stub-1',id:source.system,bodies:[source],routes:[]}:source;
    validateStub(system,'SystemStub');
    const rename=id=>ref.bodyPrefix+id.slice(id.lastIndexOf(':'));
    return {...system,id:ref.id,bodies:system.bodies.map(p=>({...p,system:ref.id,body:rename(p.body)})).sort((a,b)=>compare(a.body,b.body)),routes:system.routes.map(r=>({...r,from:rename(r.from),to:rename(r.to)})).sort(routeOrder)};
  }).sort(byId);
  const planets=systems.flatMap(s=>s.bodies).sort((a,b)=>compare(a.body,b.body));planets.forEach(validatePlanet);
  const routes=[...domain.routes,...systems.flatMap(s=>s.routes)].sort(routeOrder);
  for(let j=0;j<routes.length;j++) {
    const r=routes[j],a=planets.find(p=>p.body===r.from),b=planets.find(p=>p.body===r.to),distance=BigInt(r.distanceMicroLy);
    const years=r.kind==='in-system'?[null,null,null,null,null,20,5,1]:[null,null,null,null,null,null,null,distance<=10000000n?safeYear(C(distance,10000n)):null];
    if(!a||!b||r.from===r.to||j&&routeOrder(routes[j-1],r)===0||r.destinationHosting!==b.hosting||canonicalString(years)!==canonicalString(r.travelYearsByTransportTier)||
      (r.kind==='in-system'?(a.system!==b.system||distance!==0n):(a.system===b.system||distance<=0n)))throw new TypeError('Invalid route');
  }
  for(const [rows,key] of [[domain.systems,r=>r.id],[domain.origins,r=>r],[planets,r=>r.body]])if(rows.some((r,j)=>j&&key(rows[j-1])>=key(r)))throw new TypeError('Duplicate or unsorted identity');
  if(domain.origins.some(id=>!planets.some(p=>p.body===id)))throw new TypeError('Unknown origin');
  return {domain,systems,planets,routes};
}
export function originSchedule(def,p) {
  const id=originId(p.body),rates=[0,1,2].map(j=>1n<<(12n+below(address(def,id,`orig.rate.${j}`,'D'),11n)));
  const waitYears=rates.map((rate,j)=>C(expQ32(address(def,id,`orig.step.${j}`,'D')),rate));
  const life=p.lifecycle.value,start=life.complexLifeFromYear;
  const physical=override(def,'origin.deliveryYear')!==undefined?BigInt(override(def,'origin.deliveryYear')):start===null?null:BigInt(Math.max(start,life.habitableFromYear))+waitYears.reduce((a,b)=>a+b,0n);
  const delivery=physical===null?null:C(physical,10n);
  const habitableUntil=life.stellarDoomYear==null?life.habitableUntilYear:Math.min(life.habitableUntilYear,life.stellarDoomYear+Number(override(def,'parameters.stellarGraceYears')??500));
  if(physical===null||physical>=BigInt(habitableUntil)||delivery*10n>=BigInt(habitableUntil))return {body:p.body,rates,waitYears,sapienceYear:null,deliveryTick:null,status:'no-lineage'};
  return {body:p.body,rates,waitYears,sapienceYear:safeYear(physical),deliveryTick:delivery,status:'pending'};
}
export function arcDefinition(def,body,lineageId,episode,fromTick,scenarioParams,initial=null) {
  const planet=def.planets.find(p=>p.body===body),arcId=`arc:${body}:${lineageId}:${episode}`;
  const edges=planet.partition.value.regions.flatMap(r=>r.adjacency.map(e=>({id:`${arcId}#${r.id}~${e.to}`,from:`${arcId}#${r.id}`,to:`${arcId}#${e.to}`,contact:e.barrier?F(e.contactPermille,4):e.contactPermille}))).sort(byId);
  const distances=[];
  for(const r of planet.partition.value.regions){const from=arcId+'#'+r.id,queue=[{to:from,hops:0}];for(let j=0;j<queue.length;j++)for(const e of edges.filter(e=>e.from===queue[j].to))if(!queue.some(q=>q.to===e.to))queue.push({to:e.to,hops:queue[j].hops+1});distances.push(...queue.map(q=>({from,...q})));}
  return freezeGenerated({...def,planet,arcId,lineageId,episode,fromTick,scenarioParams,edges,distances:distances.sort((a,b)=>compare(a.from,b.from)||compare(a.to,b.to)),forced:{...def.forced,initial}});
}
export function createDomainDefinition(input='fixtures/domains/toy-12.json',seed='toy-1',{years,forced=null,untilYear}={}) {
  if(typeof seed!=='string'||!seed.isWellFormed()||years!==undefined&&(!Number.isSafeInteger(years)||years<10||years%10))throw new RangeError('Invalid run');
  const bundle=expandDomain(input),home=bundle.planets.find(p=>p.body===bundle.domain.origins[0])??bundle.planets[0];
  for(const p of bundle.planets)for(const key of ['lifecycle','partition','epochs'])if(p[key].status!=='known')return {status:p[key].status==='unsupported'?'not-modelled':'uninhabited',reason:p[key].capability??p[key].reason};
  forced=forced&&structuredClone(forced);
  if(forced){if(forced.seed!==seed||typeof input==='string'&&forced.base!==input)throw new TypeError('Forced seed/base mismatch');validateForced(forced,home);}
  const epochOverride=forced?.overrides.find(o=>o.key==='epoch.rows');
  if(epochOverride){home.epochs=Availability.known({rows:epochOverride.value});validatePlanet(home);}
  const template=createDefinition('temperate',seed,{years:10}).manifest;
  const manifest={...template,inputBundleDigest:digest({domain:bundle.domain,systems:bundle.systems,forced}),scenarioPriors:{...template.scenarioPriors,parameters:{version:'civ-transition-table-1',milestone:'M2b',overrides:forced?.overrides??[]}}};
  if(bundle.planets.some(p=>p.lifecycle.value.stellarDoomYear!=null))manifest.scenarioPriors.stellarPolicy={version:'m3b-stellar-1',graceYears:Number(forced?.overrides.find(o=>o.key==='parameters.stellarGraceYears')?.value??500)};
  const def={...bundle,seed,manifest,manifestDigest:digest(manifest),forced:forced??noForced(),compactHazards:true,
    g:forced?.overrides.find(o=>o.key==='parameters.g')?.value??GROWTH,build:forced?.overrides.find(o=>o.key==='parameters.build')?.value??BUILD,keep:Number(forced?.overrides.find(o=>o.key==='parameters.keepPermille')?.value??490)};
  if(bundle.planets.some(p=>['lifecycle','partition','epochs'].some(k=>p[k].status!=='known')))throw new TypeError('not-modelled: required domain capability');
  def.origins=bundle.domain.origins.map(id=>originSchedule(def,bundle.planets.find(p=>p.body===id)));
  def.fromTick=BigInt(forced?.initial?.atTick??F(bundle.domain.fromYear,10));
  const first=def.origins.filter(o=>o.deliveryTick!==null).reduce((n,o)=>min(n,o.deliveryTick),BigInt(F(bundle.domain.untilYear,10)));
  def.untilTick=forced?def.fromTick+BigInt(forced.ticks):min(BigInt(F(bundle.domain.untilYear,10)),first+BigInt((years??400000)/10));
  if(untilYear!==undefined){if(!Number.isSafeInteger(untilYear))throw new RangeError('Invalid end year');def.untilTick=BigInt(F(untilYear,10));}
  if(def.fromTick>=def.untilTick||def.untilTick>BigInt(F(bundle.domain.untilYear,10)))throw new RangeError('outside-model-range');
  def.recipeDigest=digest({seed,manifest,fromTick:def.fromTick});
  return freezeGenerated(def);
}
export const DOMAIN_FIELDS=Object.freeze(['id','tick','lineages','arcs','voyages','transit','messages','origins','bodyEpisodes','latches','coverage'].sort(compare));
export const VOYAGE_FIELDS=Object.freeze(['id','lineageId','sourceArc','sourceRegion','destination','launchEventId','launchYear','arrivalYear','deliveryTick','tiers','cultureId','culture','status','hazard','lastDeath'].sort(compare));
const dView=(state,roots)=>Object.fromEntries(DOMAIN_FIELDS.map(k=>[k,k==='arcs'?state.arcs.map(a=>({id:a.id,root:roots.get(a.id)??stateDigest(a)})):state[k]]));
export const domainStateDigest=state=>sha256Hex(generatedString(dView(state,new Map())));
const dThreshold=(def,id,episode)=>expQ32({...address(def,hazardKey(id),'haz.VOYAGE_LOST','D'),episodeOrBucket:episode});
function voyageHazard(def,id){const hazardId=Object.freeze({ownerId:id,kind:'VOYAGE_LOST'});return {hazardId,key:compactHazardKey(hazardId),episode:0n,H_q32:0n,E_q32:dThreshold(def,hazardId,0n),closed:false};}
function dEvent(def,state,kind,owner,intent,trigger,date,phase) {const e=event(def,state,kind,owner,intent,trigger,date,phase);e.refs=[];return e;}
function finishEvent(e){e.refs.sort((a,b)=>compare(a.role,b.role)||compare(a.entityId,b.entityId));e.data.sets.sort((a,b)=>compare(a.target,b.target)||compare(a.field,b.field));return e;}
function death(state,v,e,sequence,stage) {v.lastDeath={tick:state.tick,stage,ownerId:stage===0?v.destination:v.id,sequence,dateYear:e.dateYear,eventId:e.id,kind:e.kind};}
const deathOrder=(a,b)=>compare(a.tick,b.tick)||compare(a.stage,b.stage)||compare(a.ownerId,b.ownerId)||compare(a.sequence,b.sequence);
export function lineageOutcome(state,lineage,planets) {
  if(lineage.outcomeClass.startsWith('EXTINCT_'))return lineage.outcomeClass;
  const arcs=state.arcs.filter(a=>a.lineageId===lineage.id),living=arcs.flatMap(a=>a.regions.filter(r=>r.pop>0n));
  if(living.some(r=>r.caps.some((v,d)=>v<MAX_TIERS[d])))return 'EXISTENTIAL_CAP';
  if(living.some(r=>r.collapse?.active))return 'COLLAPSED_RECOVERING';
  const systems=arcs.map(a=>planets.find(p=>p.body===a.body).system).sort(compare).filter((v,j,all)=>!j||v!==all[j-1]);
  if(systems.length>=2)return 'EXTANT_MULTI_SYSTEM';if(arcs.length>=2)return 'EXTANT_MULTI_BODY';
  if(arcs.some(a=>a.isColony&&a.regions.some(r=>r.pop>0n&&r.tiers.some((v,d)=>v<a.foundingTiers[d]))))return 'REGRESSED_STABLE';
  return 'EXTANT_PLANETARY';
}
function sustaining(a,planet) {
  const pop=population(a.regions);
  return !a.nonviable&&pop>=2000n&&a.regions.reduce((n,r)=>n+r.K,0n)>=pop&&a.regions.reduce((n,r)=>n+r.infra,0n)>=10n*pop&&
    a.regions.every(r=>!r.pop||r.tiers[1]>=2&&(planet.hosting!=='habitat-buildable'||r.tiers[0]>=5&&r.tiers[1]>=5));
}
export function createDomain(input='fixtures/domains/toy-12.json',seed='toy-1',options={}) {
  const def=createDomainDefinition(input,seed,options);
  if(def.status)return def;
  let cached=null;
  function compile({inspect=false,observe=false,inspectSampleTicks=[],arcOrder='forward',suppressLineages=[],prefixUntil=null,onPerilsTick=null}={}) {
    let state={id:def.domain.id,tick:def.fromTick,lineages:[],arcs:[],voyages:[],transit:[],messages:[],origins:structuredClone(def.origins),bodyEpisodes:def.planets.map(p=>({body:p.body,nextEpisode:0})),latches:[],coverage:'complete-domain'};
    const definitions=new Map(),roots=new Map(),arcRecords=[],archives=[],events=[],snapshots=[],checkpoints=[],dHashes=[];
    const observations=[],firstEras=Array(8).fill(null),firstEnergy=Array(7).fill(null),seenArcs=new Map();
    function observation(arcs,year,plot){
      for(const a of arcs){seenArcs.set(a.id,{id:a.id,body:a.body,lineageId:a.lineageId,isColony:a.isColony});
        for(const r of a.regions)if(r.pop>0n){for(let i=0;i<=r.era;i++)if(firstEras[i]===null||year<firstEras[i])firstEras[i]=year;
          for(let i=0;i<=r.tiers[0];i++)if(firstEnergy[i]===null||year<firstEnergy[i])firstEnergy[i]=year;}}
      if(plot)observations.push({year,arcs:arcs.map(a=>({id:a.id,body:a.body,pop:String(population(a.regions)),era:a.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.era):n,0),polities:a.polities.filter(p=>p.regions.some(id=>a.regions.some(r=>r.id===id&&r.pop>0n))).length})).sort(byId)});
    }
    let dLedgers=[],dEvents=[],chapter=F(state.tick,640n),previous=domainStateDigest(state),ticks=0,maxChapterBytes=0;
    function reserve(body,lineageId,initial=null) {
      const slot=state.bodyEpisodes.find(b=>b.body===body),episode=slot.nextEpisode++;let l=state.lineages.find(l=>l.id===lineageId);
      if(!l){l={id:lineageId,arcs:[],voyages:[],contacts:[],foundedArcs:0,lastDeath:null,scenarioParams:priors(def,lineageId),perilsSafe:false,outcomeClass:'EXTANT_PLANETARY',extinctionCause:null};state.lineages.push(l);state.lineages.sort(byId);}
      const pd=arcDefinition(def,body,lineageId,episode,state.tick,l.scenarioParams,initial),arc=skeleton(pd);definitions.set(arc.id,pd);
      state.arcs.push(arc);state.arcs.sort(byId);l.arcs.push(arc.id);l.arcs.sort(compare);l.foundedArcs++;
      arcRecords.push({id:arc.id,body,genesis:freezeGenerated(structuredClone(arc)),hashes:[],ledgers:[],events:[],prefixHashes:[]});arcRecords.sort(byId);return arc;
    }
    function register(v,persons,fixture=null) {
      v={...v,hazard:voyageHazard(def,v.id),lastDeath:null};state.voyages.push(v);state.transit.push({id:'transit:'+v.id,pop:persons});
      state.lineages.find(l=>l.id===v.lineageId).voyages.push(v.id);
        const ordinal=state.messages.filter(m=>m.type==='ARRIVAL'&&m.id.startsWith(`${state.id}#msg:${state.tick}~${v.sourceArc}~ARRIVAL~${v.destination}~`)).length;
        const m=message(state.id,state.tick,v.sourceArc,'ARRIVAL',v.destination,v.launchEventId,{voyageId:v.id},ordinal,v.deliveryTick);
      if(fixture)m.id=state.id+'#fixture-arrival:'+fixture;
      state.messages.push(m);
    }
    if(def.forced.initial&&!suppressLineages.includes('lin:'+(def.domain.origins[0]??def.planets[0].body))) {
      const body=def.domain.origins[0]??def.planets[0].body,arc=reserve(body,'lin:'+body,def.forced.initial);
      const origin=state.origins.find(o=>o.body===body);if(origin)origin.status='founded';
      for(const v of def.forced.initial.voyages) {
        const r=arc.regions.find(r=>r.localId===v.sourceLocalRegionId);
        if(v.sourceBody!==body||!r||!def.planets.some(p=>p.body===v.destination)||v.arrivalYear<=v.launchYear||BigInt(v.deliveryTick)!==max(C(BigInt(v.arrivalYear),10n),F(BigInt(v.launchYear),10n)+1n)||v.tiers[3]<5||v.tiers[3]>7)throw new TypeError('Invalid fixture voyage');
        register({id:arc.id+'#voy:fixture:'+v.label,lineageId:arc.lineageId,sourceArc:arc.id,sourceRegion:r.id,destination:v.destination,launchEventId:arc.id+'#launch-fixture:'+v.label,launchYear:v.launchYear,arrivalYear:v.arrivalYear,deliveryTick:BigInt(v.deliveryTick),tiers:v.tiers,cultureId:r.cultureId,culture:r.culture,status:'transit'},BigInt(v.pop),v.label);
      }
    }
    state.messages.sort(messageOrder);state.voyages.sort(byId);state.transit.sort(byId);previous=domainStateDigest(state);
    checkpoints.push({tick:state.tick,live:structuredClone(state),archiveRecords:[]});
    function flush() {
      for(const record of arcRecords)if(record.ledgers.length) {
        const leaf={arcId:record.id,chapter:String(chapter),ledgers:record.ledgers,events:record.events};
        const h=merkleLeafParts(chapterParts(leaf));record.hashes.push(h.hash);maxChapterBytes=Math.max(maxChapterBytes,h.bytes);
        if(prefixUntil!==null){const ls=leaf.ledgers.filter(l=>BigInt(l.tick)<BigInt(prefixUntil));if(ls.length)record.prefixHashes.push(merkleLeafParts(chapterParts({...leaf,ledgers:ls,events:leaf.events.filter(e=>BigInt(e.tick)<BigInt(prefixUntil))})).hash);}
        record.ledgers=[];record.events=[];
      }
      if(dLedgers.length){const h=merkleLeafParts(chapterParts({domainId:state.id,chapter:String(chapter),ledgers:dLedgers,events:dEvents}));dHashes.push(h.hash);maxChapterBytes=Math.max(maxChapterBytes,h.bytes);}
      dLedgers=[];dEvents=[];
    }
    while(state.tick<def.untilTick) {
      const t=state.tick,start=previous,before=dView(state,roots),tickEvents=[],pEvents=[],transfers=[],retired=[],arrivals=new Map(),starts=new Map(),founding=[];
      // Copy only D-owned records. P inputs remain unchanged until their own step.
      state={...state,lineages:state.lineages.map(l=>({...l,arcs:[...l.arcs],voyages:[...l.voyages]})),origins:state.origins.map(o=>({...o})),bodyEpisodes:state.bodyEpisodes.map(b=>({...b})),arcs:[...state.arcs],voyages:state.voyages.map(v=>({...v})),transit:state.transit.map(v=>({...v})),messages:[...state.messages],latches:[...state.latches]};
      function writable(a) {if(!starts.has(a.id)){starts.set(a.id,a);const copy={...a,regions:a.regions.map(r=>({...r})),inbox:[...a.inbox]};state.arcs[state.arcs.findIndex(v=>v.id===a.id)]=copy;return copy;}return state.arcs.find(v=>v.id===a.id);}
      const due=state.messages.filter(m=>m.deliveryTick===t).sort(messageOrder);state.messages=state.messages.filter(m=>m.deliveryTick!==t);
      for(const m of due) {
        if(m.type==='SIGNAL'){
          const a=state.arcs.find(a=>a.body===m.targetId||a.id===m.targetId);if(!a)continue;
          const e=dEvent(def,state,'SIGNAL_ARRIVAL',a.id,messageIntent(m.id),{mode:'scheduled'},Number(t*10n),0);
          e.params={arrivalYear:String(m.payload.signal.arrivalYear),deliveryYear:String(t*10n)};
          const {arrivalYear,...signal}=m.payload.signal;
          e.data.source=signal.source;e.data.target=a.id;
          const signals=a.signals.some(s=>s.source===signal.source)?a.signals:[...a.signals,signal].sort((a,b)=>compare(a.source,b.source));
          e.effects.push({target:a.id,field:'arc.signals',op:'set',amount:'0'});e.data.sets.push({target:a.id,field:'arc.signals',value:signals});
          writable(a).inbox.push({...m,payload:{...m.payload,signal},causeEventId:e.id});tickEvents.push(finishEvent(e));continue;
        }
        if(m.type!=='ARRIVAL'){const a=state.arcs.find(a=>a.id===m.targetId);if(a)writable(a).inbox.push(m);continue;}
        const v=state.voyages.find(v=>v.id===m.payload.voyageId);if(!v||v.status!=='transit')continue;
        const account=state.transit.find(a=>a.id==='transit:'+v.id),persons=account.pop,p=def.planets.find(p=>p.body===v.destination);
        const e=dEvent(def,state,'COLONY_FOUNDED',v.destination,messageIntent(m.id),{mode:'scheduled'},Number(t*10n),0);
        e.params={persons:String(persons),launchYear:String(v.launchYear),arrivalYear:String(v.arrivalYear),deliveryYear:String(t*10n)};e.data.source=v.id;e.refs.push({role:'source',entityId:v.id});
        if(!v.launchEventId.includes('#launch-fixture:'))e.causes=[{eventId:v.launchEventId,edge:'EXOGENOUS',weightPermille:1000}];
        let a=state.arcs.find(a=>a.body===v.destination),reason=a&&a.lineageId!==v.lineageId?'occupied-by-other-lineage':null;
        const life=p.lifecycle.value,host=p.hosting==='habitable'||p.hosting==='habitat-buildable'&&v.tiers[0]>=5&&v.tiers[1]>=5;
        if(!reason&&(!host||Number(t*10n)<life.habitableFromYear||Number(t*10n)>=life.habitableUntilYear||life.stellarDoomYear!=null&&Number(t*10n)>=life.stellarDoomYear+Number(override(def,'parameters.stellarGraceYears')??500)||!p.epochs.value.rows.some(r=>BigInt(r.fromEpoch)<=F(t,100n)&&F(t,100n)<BigInt(r.untilEpoch)&&BigInt(r.Kbase)>0n)))reason='destination-uninhabitable';
        if(reason){e.data.outcome='rejected';e.data.stage='REJECTED';e.reason=reason;e.effects.push({target:account.id,field:'transit.pop',op:'add',amount:String(-persons)});account.pop=0n;v.status=reason==='occupied-by-other-lineage'?'turned-away':'lost';death(state,v,e,tickEvents.filter(x=>x.kind==='COLONY_FOUNDED'&&x.ownerId===v.destination).length,0);
          if(reason==='occupied-by-other-lineage'){
            const prefix=`${state.id}#msg:${t}~${v.sourceArc}~SIGNAL~${a.id}~`,ordinal=state.messages.filter(m=>m.id.startsWith(prefix)).length;
            state.messages.push(message(state.id,t,v.sourceArc,'SIGNAL',a.id,e.id,{signal:{source:v.sourceArc,lineageId:v.lineageId,body:arcRecords.find(a=>a.id===v.sourceArc).body,tiers:v.tiers,strength:1000,physical:true,arrivalYear:Number(t*10n)}},ordinal));}}
        else {
          const fresh=!a;if(fresh){a=reserve(v.destination,v.lineageId);starts.set(a.id,structuredClone(a));a.isColony=true;a.foundingTiers=[...v.tiers];a.colonizer=chanceMagnitude(def,a.id,'arc.colonizer',a.scenarioParams.colonizerPpm);for(const r of a.regions){r.cultureId=v.cultureId;r.culture=[...v.culture];}
            const landing=a.regions[0];landing.tiers=[...v.tiers];installEnvironment(definitions.get(a.id),a);
          }else a=writable(a);
          const r=a.regions.find(r=>r.K>0n)??a.regions[0];
          if(fresh){r.tiers=[...v.tiers];r.infra=10n*persons;}
          r.pop+=persons;account.pop=0n;v.status='delivered';installEnvironment(definitions.get(a.id),a);a.outcome={...a.outcome,industrialEra:a.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.era):n,0)};
          e.effects.push({target:account.id,field:'transit.pop',op:'transfer',amount:String(persons),to:r.id,toField:'region.pop'});transfers.push({eventId:e.id,...e.effects.at(-1)});
          if(fresh) {
            e.effects.push({target:r.id,field:'region.infra',op:'add',amount:String(10n*persons)});
            const before=starts.get(a.id);
            for(const field of ['colonizer','foundingTiers','isColony'])if(canonicalString(a[field])!==canonicalString(before[field])){e.effects.push({target:a.id,field:'arc.'+field,op:'set',amount:'0'});e.data.sets.push({target:a.id,field:'arc.'+field,value:a[field]});}
            for(const v of a.regions)for(const field of ['culture','cultureId','tiers'])if(canonicalString(v[field])!==canonicalString(before.regions.find(r=>r.id===v.id)[field])){e.effects.push({target:v.id,field:'region.'+field,op:'set',amount:'0'});e.data.sets.push({target:v.id,field:'region.'+field,value:v[field]});}
          }
          e.data.target=a.id;e.data.stage=fresh?'FOUNDED':'REINFORCEMENT';e.refs.push({role:'target',entityId:a.id});
          arrivals.set(a.id,[...(arrivals.get(a.id)??[]),e.id]);
        }
        v.hazard={...v.hazard,closed:true};e.effects.push({target:v.id,field:'voyage.status',op:'set',amount:'0'});e.data.sets.push({target:v.id,field:'voyage.status',value:v.status});tickEvents.push(finishEvent(e));
      }
      for(const o of state.origins.filter(o=>o.status==='pending'&&o.deliveryTick===t).sort((a,b)=>compare(a.body,b.body))) {
        if(suppressLineages.includes('lin:'+o.body))continue;
        if(state.arcs.some(a=>a.body===o.body)){o.status='preempted';continue;}
        const p=def.planets.find(p=>p.body===o.body);
        if(!p.epochs.value.rows.some(r=>BigInt(r.fromEpoch)<=F(t,100n)&&F(t,100n)<BigInt(r.untilEpoch)&&BigInt(r.Kbase)>0n)){o.status='no-lineage';o.sapienceYear=null;o.deliveryTick=null;continue;}
        const regime=override(def,'origins.startingRegime')==='1'?def.forced.initial:null;
        const a=reserve(o.body,'lin:'+o.body,regime);o.status='founded';if(!regime)founding.push(a.id);
      }
      const losses=[];
      for(const v of state.voyages.filter(v=>v.status==='transit'&&t>F(BigInt(v.launchYear),10n)&&t<v.deliveryTick).sort((a,b)=>compare(a.hazard.key,b.hazard.key))) {
        const h=BigInt(override(def,'hazard.VOYAGE_LOST.q32')??[21474836n,4294967n,429496n][v.tiers[3]-5]),result=advanceHazard(def,v.hazard,h,true,dThreshold);v.hazard=result.entry;
        for(const f of result.firings){const x=f.evidence,e=dEvent(def,state,'VOYAGE_LOST',v.id,hazardIntent(v.hazard.key,x.episode),{mode:'hazard',hazardId:v.hazard.key,episode:String(x.episode),H_start_q32:String(x.H_start),distance_q32:String(x.distance),h_q32:String(x.h),saturated:f.saturated===true},Number(t*10n)+f.yearOffset,2);e.data.outcome='lost';e.refs=[{role:'voyage',entityId:v.id}];losses.push({e,v});}
      }
      losses.sort((a,b)=>compareEvents(a.e,b.e));
      for(const {e,v} of losses){if(v.status!=='transit'){e.resolution='pre-empted';e.reason='target-ended';}else{const account=state.transit.find(a=>a.id==='transit:'+v.id);e.effects.push({target:account.id,field:'transit.pop',op:'add',amount:String(-account.pop)});account.pop=0n;v.status='lost';v.hazard={...v.hazard,closed:true};death(state,v,e,0,2);e.effects.push({target:v.id,field:'voyage.status',op:'set',amount:'0'});e.data.sets.push({target:v.id,field:'voyage.status',value:'lost'});}tickEvents.push(finishEvent(e));}
      const stepArcs=[...state.arcs].sort(byId);if(arcOrder==='reverse')stepArcs.reverse();
      const sample=inspect||inspectSampleTicks.includes(String(t));
      const results=stepArcs.filter(a=>!suppressLineages.includes(a.lineageId)).map(a=>({id:a.id,out:stepPlanet(definitions.get(a.id),a,{founding:founding.includes(a.id),collectUpdates:sample,startBoundary:starts.get(a.id)??a,arrivalIds:arrivals.get(a.id)??[],arrivalEvents:tickEvents.filter(e=>e.kind==='COLONY_FOUNDED'&&e.data.target===a.id)})})).sort(byId);
      if(onPerilsTick)onPerilsTick(Object.freeze({tick:String(t),exitedArcs:Object.freeze(results.filter(r=>r.out.pre.perils==='exited').map(r=>r.id))}));
      if(observe){observation(results.map(r=>r.out.pre),Number(t*10n),t===def.fromTick||t%10n===0n);observation(results.map(r=>r.out.state),Number((t+1n)*10n),t+1n===def.untilTick||results.some(r=>r.out.state.outcome.terminal));}
      for(const {id,out} of results){state.arcs[state.arcs.findIndex(a=>a.id===id)]=out.state;roots.set(id,out.ledger.structural??out.ledger.endState);const record=arcRecords.find(r=>r.id===id);record.ledgers.push(out.ledger);record.events.push(...out.events);pEvents.push(...out.events);retired.push(...out.ledger.archived);}
      // No P step can see any other step's output. Only this barrier expands it.
      const allTick=[...tickEvents,...pEvents].sort(compareEvents);
      // Reports travel from the observed body, along a declared link, at light speed.
      // Failed voyages are conservatively reported no earlier than planned arrival.
      function report(sourceBody,lineageId,type,causeEventId,data,earliestYear=Number((t+1n)*10n)) {
        for(const target of [...state.arcs].filter(a=>a.lineageId===lineageId&&!a.outcome.terminal).sort(byId)) {
          const route=def.routes.find(r=>r.from===sourceBody&&r.to===target.body)??def.routes.find(r=>r.to===sourceBody&&r.from===target.body);
          if(sourceBody!==target.body&&!route)continue;
          const delay=route?Number(C(BigInt(route.distanceMicroLy),1000000n)):0;
          const delivery=max(t+1n,C(BigInt(earliestYear+delay),10n));
          const ordinal=state.messages.filter(m=>m.type===type&&m.targetId===target.id).length;
          const deliveredData=data.signal?{...data,signal:{...data.signal,arrivalYear:earliestYear+delay}}:data;
          state.messages.push(message(state.id,t,sourceBody,type,target.id,causeEventId,deliveredData,ordinal,delivery));
        }
      }
      for(const e of allTick.filter(e=>e.resolution==='accepted')) {
        if(e.kind==='COLONY_FOUNDED'||e.kind==='VOYAGE_LOST') {
          const v=state.voyages.find(v=>v.id===(e.kind==='VOYAGE_LOST'?e.ownerId:e.data.source));
          if(!v)continue;
          if(e.kind==='VOYAGE_LOST'||e.data.outcome==='rejected')report(v.destination,v.lineageId,'TARGET_FAILURE',e.id,{failure:{body:v.destination,eventId:e.id}},Math.max(Number((t+1n)*10n),v.arrivalYear));
          if(e.kind==='COLONY_FOUNDED'&&e.data.outcome!=='rejected') {
            const a=state.arcs.find(a=>a.id===e.data.target);
            report(a.body,a.lineageId,'SIGNAL',e.id,{signal:{source:a.id,lineageId:a.lineageId,body:a.body,tiers:v.tiers,strength:1000,physical:true,arrivalYear:Number((t+1n)*10n)}});
          }
        }
        if(e.kind==='COLONY_LOST'||e.kind==='EXTINCTION') {
          const a=state.arcs.find(a=>a.id===e.ownerId);
          if(a?.isColony)report(a.body,a.lineageId,'TARGET_FAILURE',e.id,{failure:{body:a.body,eventId:e.id}});
        }
      }

      for(const a of [...state.arcs].sort(byId))if(a.regions.some(r=>r.pop>0n&&r.tiers[4]>=3)&&!state.latches.some(l=>l.kind==='SIGNAL_EMITTED'&&l.subject===a.id)){
        state.latches.push({kind:'SIGNAL_EMITTED',subject:a.id,active:true});
        const tiers=Array.from({length:7},(_,d)=>a.regions.reduce((n,r)=>r.pop>0n?Math.max(n,r.tiers[d]):n,0));
        for(const route of def.routes.filter(r=>r.from===a.body)){
          const lightYears=route.lightYears??Number(C(BigInt(route.distanceMicroLy),1000000n)),emissionYear=Number((t+1n)*10n),arrivalYear=emissionYear+lightYears;
          state.messages.push(message(state.id,t,a.id,'SIGNAL',route.to,null,{signal:{source:a.id,lineageId:a.lineageId,body:a.body,tiers,strength:1000,physical:false,arrivalYear}},0,max(t+1n,C(BigInt(arrivalYear),10n))));
        }
      }
      for(const e of pEvents.filter(e=>e.kind==='LAUNCH'&&e.resolution==='accepted').sort(compareEvents)){const x=e.effects.find(x=>x.op==='transfer');register(e.data.launch,BigInt(x.amount));transfers.push({eventId:e.id,...x});}
      const outbound=state.arcs.flatMap(a=>a.outbox.filter(m=>m.type==='SHARED').map(m=>({a,m}))).sort((a,b)=>compare(a.m.id,b.m.id));
      for(const {a,m} of outbound)for(const target of state.arcs.filter(b=>b.lineageId===a.lineageId&&b.id!==a.id&&!b.outcome.terminal))state.messages.push(message(state.id,t,a.id,'SHARED',target.id,m.causeEventId,m.payload,Number(m.id.split('~').at(-1))));
      for(const l of state.lineages) {
        const deaths=[l.lastDeath,...state.arcs.filter(a=>a.lineageId===l.id).map(a=>a.lastDeath),...state.voyages.filter(v=>v.lineageId===l.id).map(v=>v.lastDeath)].filter(Boolean).sort(deathOrder);l.lastDeath=deaths.at(-1)??null;
      }
      for(const a of state.arcs.filter(a=>a.outcome.terminal))retired.push({scope:'D:'+state.id,kind:'arc',id:a.id,record:a});
      state.arcs=state.arcs.filter(a=>!a.outcome.terminal);
      for(const v of state.voyages.filter(v=>v.status!=='transit')){retired.push({scope:'D:'+state.id,kind:'voyage',id:v.id,record:v});const account=state.transit.find(a=>a.id==='transit:'+v.id);retired.push({scope:'D:'+state.id,kind:'transit',id:account.id,record:account});}
      state.voyages=state.voyages.filter(v=>v.status==='transit').sort(byId);state.transit=state.transit.filter(a=>state.voyages.some(v=>a.id==='transit:'+v.id)).sort(byId);
      for(const l of state.lineages) {
        const arcs=state.arcs.filter(a=>a.lineageId===l.id);l.arcs=arcs.map(a=>a.id);l.voyages=state.voyages.filter(v=>v.lineageId===l.id).map(v=>v.id);
        const safe=arcs.some(a=>a.regions.some(r=>r.pop>0n&&r.tiers[6]>=5))||arcs.filter(a=>sustaining(a,def.planets.find(p=>p.body===a.body))).length>=3;
        const changed=safe!==l.perilsSafe;
        const cause=allTick.filter(e=>e.resolution==='accepted'&&e.refs.some(ref=>['arc','target'].includes(ref.role)&&arcRecords.some(a=>a.id===ref.entityId&&a.genesis.lineageId===l.id))&&e.effects.some(x=>['region.pop','region.infra','region.tiers','region.K','region.Kbase','region.damage','arc.nonviable','arc.outcome'].includes(x.field))).at(-1)?.id??null;
        for(const a of arcs)if(changed||safe&&arrivals.has(a.id))state.messages.push(message(state.id,t,state.id,safe?'PERILS_EXIT':'PERILS_REENTER',a.id,cause,{}));
        l.perilsSafe=safe;l.outcomeClass=lineageOutcome(state,l,def.planets);
        if(l.foundedArcs>0&&!l.arcs.length&&!l.voyages.length&&!state.latches.some(x=>x.kind==='LINEAGE_EXTINCTION'&&x.subject===l.id&&x.active)) {
          const e=dEvent(def,state,'LINEAGE_EXTINCTION',l.id,thresholdIntent(l.id),{mode:'threshold',crossed:{var:'region.pop',value:'0',threshold:'0'}},Number(t*10n+9n),5);
          l.outcomeClass=l.lastDeath?.kind==='STELLAR_DOOM'?'EXTINCT_STELLAR':PERILS.includes(l.lastDeath?.kind)?'EXTINCT_SELF':'EXTINCT_NATURAL';l.extinctionCause=l.lastDeath?.eventId??null;
          e.params={livingArcs:'0',transitPop:'0'};e.refs=[{role:'lineage',entityId:l.id}];e.data.outcome=l.outcomeClass;
          if(l.extinctionCause){const causeEvent=events.concat(allTick).find(x=>x.id===l.extinctionCause);if(causeEvent&&compareEvents(causeEvent,e)<0)e.causes=[{eventId:l.extinctionCause,edge:'TRIGGERED',weightPermille:1000}];}
          for(const key of ['outcomeClass','extinctionCause'])if(key!=='extinctionCause'||l[key]!==null){e.effects.push({target:l.id,field:'lineage.'+key,op:'set',amount:'0'});e.data.sets.push({target:l.id,field:'lineage.'+key,value:l[key]});}
          state.latches.push({kind:'LINEAGE_EXTINCTION',subject:l.id,active:true});tickEvents.push(finishEvent(e));
        }
      }
      state.messages.sort(messageOrder);state.latches.sort((a,b)=>compare(a.kind,b.kind)||compare(a.subject,b.subject));state.tick++;
      const sortedD=sortEvents(tickEvents),sortedAll=[...sortedD,...pEvents].sort(compareEvents);events.push(...sortedAll);dEvents.push(...sortedD);
      transfers.sort((a,b)=>compareEvents(sortedAll.find(e=>e.id===a.eventId),sortedAll.find(e=>e.id===b.eventId)));retired.sort(archiveOrder);archives.push(...retired);
      const after=dView(state,roots);previous=sha256Hex('m2b-domain-delta-1;'+start+valueDelta(before,after));
      const ledger=freezeGenerated({domainId:state.id,tick:String(t),startState:start,endState:previous,eventIds:sortedD.map(e=>e.id),transfers,archived:retired});dLedgers.push(ledger);ticks++;
      if(sample)snapshots.push({ledger,state:structuredClone(state),planets:results.map(r=>({id:r.id,...r.out}))});
      const terminal=state.lineages.length>0&&state.lineages.every(l=>l.outcomeClass.startsWith('EXTINCT_'))&&!state.origins.some(o=>o.status==='pending'&&o.deliveryTick>=state.tick);
      if(state.tick%640n===0n||state.tick===def.untilTick||terminal){flush();checkpoints.push({tick:state.tick,live:structuredClone(state),archiveRecords:[...archives]});chapter=F(state.tick,640n);}
      if(terminal)break;
    }
    flush();
    const arcRoots=arcRecords.map(r=>({id:r.id,root:merkleRootFromHashes(r.hashes)})),dRoot=merkleRootFromHashes(dHashes),entries=[...arcRoots,{id:'D:'+state.id,root:dRoot}].sort(byId);
    const maximum=arcRecords.map(r=>maximumEra(r.genesis,events.filter(e=>e.level==='P'&&e.refs.some(x=>x.role==='arc'&&x.entityId===r.id))));
    return {state,events,ledgers:snapshots,archiveRecords:archives,checkpoints,ticks,maxChapterBytes,observations,firstEras,firstEnergy,seenArcs:[...seenArcs.values()].sort(byId),maxEra:maximum.reduce((n,m)=>Math.max(n,m.maxEra),0),
      outcome:state.lineages.length?state.lineages[0].outcomeClass:'NO_LINEAGE',outcomes:state.lineages.map(l=>({id:l.id,outcome:l.outcomeClass})),arcRoots,dRoot,
      prefixRoots:arcRecords.map(r=>({id:r.id,root:merkleRootFromHashes(r.prefixHashes)})),manifestDigest:def.manifestDigest,recipeDigest:def.recipeDigest,resultDigest:merkleRoot(entries.map(canonicalBytes))};
  }
  return {def,compileSummary:compile,run:(options={})=>compile({...options,inspect:true}),clearCache(){cached=null;},
    resultDigest(options={}){return compile(options).resultDigest;},
    queryArc(id,{cold=false}={}){if(cold||!cached)cached=compile();const root=cached.arcRoots.find(a=>a.id===id||a.id.startsWith('arc:'+id+':lin:'));return {root:root?.root??null,resultDigest:cached.resultDigest};}};
}
