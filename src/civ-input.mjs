import { loadPlanet, StubEnvironment, TABLE, CONTRACT_TEXT, digest, Availability, exact, sortedUnique } from './environment.mjs';
import { sha256Hex } from './digest.mjs';
import { deepFreeze } from './manifest.mjs';
import { IMPLEMENTED } from './catalogue.mjs';
import { below, chance, encodeFields, expQ32 } from './rng.mjs';
import { compare } from './canonical.mjs';
import { MAX_TIERS, GROWTH, BUILD } from './tech.mjs';
import { floorDiv as F } from './time.mjs';
export const address=(def,entityId,purpose,level='P')=>({worldSeed:def.seed,manifestDigest:def.manifestDigest,level,entityId,purpose,episodeOrBucket:0n,ordinal:0});
export const override=(def,key)=>def.forced.overrides.find(o=>o.key===key)?.value;
export function magnitude(def,id,purpose,lo,hi) {
  const fixed=override(def,`magnitude.${purpose}`);
  if(fixed!==undefined)return Number(fixed);
  return lo+Number(below(address(def,id,purpose),BigInt(hi-lo+1)));
}
export function chanceMagnitude(def,id,purpose,ppm) {
  const fixed=override(def,`magnitude.${purpose}`);
  return fixed===undefined?chance(address(def,id,purpose),ppm):fixed==='1';
}
export const originId=body=>'origin:'+encodeFields([body]).toString('hex');
export function priors(def,lineageId) {
  const log=(purpose,lo,hi)=>1n<<BigInt(lo+Number(below(address(def,lineageId,purpose,'D'),BigInt(hi-lo+1))));
  return {learningBias:Number(log('prior.learning',8,12)),innovationPpm:Number(log('prior.innovation',17,23)),
    nuclearQ32:log('prior.nuclear',8,24),pandemicQ32:log('prior.pandemic',12,28),runawayQ32:log('prior.runaway',14,29),
    sharedRiskPpm:Number(log('prior.shared',0,19)),colonizerPpm:Number(log('prior.colonizer',15,19))};
}
export function postSapience(base,seed,ticks) {
  return {schemaVersion:'civ-forced-stub-1',id:'post-sapience',base,seed,ticks,initial:null,
    overrides:[{key:'origin.deliveryYear',value:'0'}],expect:'SAPIENCE'};
}
const nat=s=>typeof s==='string'&&/^(0|[1-9][0-9]*)$/.test(s);
function tuple(a,maxs){if(!Array.isArray(a)||a.length!==maxs.length||a.some((n,i)=>!Number.isSafeInteger(n)||n<0||n>maxs[i]))throw new TypeError('Invalid tuple');}
function validateForced(f,planet) {
  exact(f,['schemaVersion','id','base','seed','ticks','initial','overrides','expect']);
  if(f.schemaVersion!=='civ-forced-stub-1'||!Number.isSafeInteger(f.ticks)||f.ticks<1||f.ticks>40000||!IMPLEMENTED.some(k=>k.kind===f.expect))throw new TypeError('Invalid forced fixture');
  sortedUnique(f.overrides,o=>o.key);
  const support={'evt.sapience.regions':[1,2],'evt.migration.fraction':[50,250],'evt.plague.loss':[100,300],'evt.collapse.drop':[1,2],'evt.war.campaign':[20,100],'evt.conquest.win':[0,1]};
  for(const o of f.overrides) {
    exact(o,['key','value']);
    if(o.key==='epoch.rows')continue;
    if(['parameters.g','parameters.build'].includes(o.key)){tuple(o.value,Array(8).fill(Number.MAX_SAFE_INTEGER));continue;}
    if(!nat(o.value))throw new TypeError('Canonical nonnegative override required');
    if(o.key==='origin.deliveryYear'){if(BigInt(o.value)%10n||BigInt(o.value)>400000n)throw new TypeError('Invalid origin boundary');continue;}
    if(o.key==='parameters.keepPermille'){if(BigInt(o.value)>1000n)throw new TypeError('Invalid keep');continue;}
    const h=/^hazard\.([A-Z_]+)\.q32$/.exec(o.key);
    if(h&&IMPLEMENTED.some(k=>k.kind===h[1]&&k.trigger==='hazard'))continue;
    const m=/^magnitude\.(.+)$/.exec(o.key),bounds=m&&support[m[1]];
    if(bounds&&Number(o.value)>=bounds[0]&&Number(o.value)<=bounds[1])continue;
    if(f.id==='interaction-two-migrations'&&o.key==='magnitude.evt.migration.fraction'&&o.value==='800')continue;
    throw new TypeError(`Unsupported M2a override ${o.key}`);
  }
  if(f.initial!==null) {
    const i=f.initial;exact(i,['atTick','regions','polities','arc','voyages']);
    if(!nat(i.atTick)||BigInt(i.atTick)+BigInt(f.ticks)>40000n||i.voyages.length)throw new TypeError('Invalid M2a initial');
    sortedUnique(i.regions,r=>r.localId);sortedUnique(i.polities,p=>p.label);
    for(const r of i.regions) {
      exact(r,['localId','pop','infra','fuel','forcing','tiers','culture','lowTicks','collapse','damage']);
      if(!planet.partition.value.regions.some(x=>x.id===r.localId)||!['pop','infra','fuel','forcing'].every(k=>nat(r[k])))throw new TypeError('Invalid initial region');
      tuple(r.tiers,MAX_TIERS);tuple(r.culture,[1000,1000,1000]);tuple(r.lowTicks,Array(7).fill(2));
      if(r.collapse!==null){exact(r.collapse,['active','recoverPop','recoverInfra']);if(typeof r.collapse.active!=='boolean'||!nat(r.collapse.recoverPop)||!nat(r.collapse.recoverInfra))throw new TypeError('Invalid collapse');}
      for(const d of r.damage){exact(d,['eventId','permille','untilTick']);if(!nat(d.untilTick)||!Number.isSafeInteger(d.permille)||d.permille<0||d.permille>1000)throw new TypeError('Invalid damage');}
    }
    exact(i.arc,['isColony','colonizer','perils','nonviable','caps','chains']);tuple(i.arc.caps,MAX_TIERS);
    if(!['none','active','exited'].includes(i.arc.perils)||['isColony','colonizer','nonviable'].some(k=>typeof i.arc[k]!=='boolean')||i.arc.chains.length)throw new TypeError('Unsupported initial arc');
    const owned=[];
    for(const p of i.polities) {
      exact(p,['label','regionIds','regime','eliteShare','asabiya','legitimacy','stress','warWeariness','hegemony']);sortedUnique(p.regionIds);
      if(!/^[A-Za-z0-9_-]{1,64}$/.test(p.label)||!p.regionIds.length||!['band','chiefdom','empire','federation','republic','state','technocracy'].includes(p.regime)||typeof p.hegemony!=='boolean')throw new TypeError('Invalid polity');
      tuple(['eliteShare','asabiya','legitimacy','stress','warWeariness'].map(k=>p[k]),Array(5).fill(1000));
      for(const id of p.regionIds){if(owned.includes(id)||!planet.partition.value.regions.some(r=>r.id===id))throw new TypeError('Overlapping ownership');owned.push(id);}
    }
  }
}
export function createDefinition(fixture='temperate',seed='civ-m2a-1',{years=20000,forced=null}={}) {
  if(typeof seed!=='string'||!seed.isWellFormed()||!Number.isSafeInteger(years)||years<10||years%10||years>400000)throw new RangeError('Invalid run');
  const {path,planet:original}=loadPlanet(fixture);
  forced=structuredClone(forced??postSapience(path,seed,years/10));
  const initialOverride=forced.overrides.find(o=>o.key==='initial');
  if(initialOverride){if(forced.initial!==null&&digest(forced.initial)!==digest(initialOverride.value))throw new TypeError('Conflicting initial overrides');forced.initial=initialOverride.value;forced.overrides=forced.overrides.filter(o=>o.key!=='initial');}
  if(forced.seed!==seed||forced.base!==path)throw new TypeError('Forced seed/base mismatch');
  const planet=structuredClone(original);
  const epochs=forced.overrides.find(o=>o.key==='epoch.rows');if(epochs)planet.epochs=Availability.known({rows:epochs.value});
  for(const key of ['lifecycle','partition','epochs'])if(planet[key].status!=='known')return {status:planet[key].status==='unsupported'?'not-modelled':'uninhabited',reason:planet[key].capability??planet[key].reason};
  validateForced(forced,planet);
  if(forced.initial===null&&forced.overrides.find(o=>o.key==='origin.deliveryYear')?.value!=='0')throw new TypeError('M2a requires the recorded post-sapience origin at year 0');
  const env=new StubEnvironment([planet]),domain={schemaVersion:'civ-domain-stub-1',id:'standalone:'+planet.system,
    systems:[{id:planet.system,fixture:path,bodyPrefix:planet.body.slice(0,planet.body.lastIndexOf(':'))}],routes:[],origins:[planet.body],fromYear:0,untilYear:400000};
  const systems=[{schemaVersion:'civ-system-stub-1',id:planet.system,bodies:[planet],routes:[]}];
  const manifest={manifestVersion:'civ-manifest-1',modelVersion:'civ-m2-1',rngVersion:'civ-rng-1',samplerVersion:'civ-samplers-1',arithmeticVersion:'civ-fixed-1',catalogueVersion:'civ-catalogue-1',partitionVersion:'civ-stub-regions-1',tickYears:10,chapterTicks:640,envEpochYears:1000,atlasVersions:{},
    inputBundleDigest:digest({domain,systems,forced}),scenarioPriors:{parameters:{version:'civ-transition-table-1',milestone:'M2a',overrides:forced.overrides},contractDigest:sha256Hex(Buffer.from(CONTRACT_TEXT)),tableDigest:digest(TABLE),
      originRateLog2:[12,22],learningLog2:[8,12],innovationLog2:[17,23],nuclearLog2:[8,24],pandemicLog2:[12,28],runawayLog2:[14,29],sharedLog2:[0,19],colonizerLog2:[15,19]}};
  const fromTick=BigInt(forced.initial?.atTick??'0'),untilTick=fromTick+BigInt(forced.ticks),arcId=`arc:${planet.body}:lin:${planet.body}:0`;
  const def={seed,manifest:deepFreeze(manifest),manifestDigest:digest(manifest),recipeDigest:digest({seed,manifest,fromTick,untilTick}),fromTick,untilTick,forced:deepFreeze(forced),planet:deepFreeze(planet),domain,arcId,env};
  const rates=[0,1,2].map(j=>1n<<(12n+below(address(def,originId(planet.body),`orig.rate.${j}`,'D'),11n)));
  const waits=rates.map((rate,j)=>{const e=expQ32(address(def,originId(planet.body),`orig.step.${j}`,'D'));return F(e+rate-1n,rate);});
  def.origin={body:planet.body,rates,waitYears:waits,sapienceYear:Number(override(def,'origin.deliveryYear')??fromTick*10n),deliveryTick:BigInt(override(def,'origin.deliveryYear')??fromTick*10n)/10n,status:'founded'};
  def.g=override(def,'parameters.g')??GROWTH;def.build=override(def,'parameters.build')??BUILD;def.keep=Number(override(def,'parameters.keepPermille')??490);
  def.edges=planet.partition.value.regions.flatMap(r=>r.adjacency.map(e=>({id:`${arcId}#${r.id}~${e.to}`,from:`${arcId}#${r.id}`,to:`${arcId}#${e.to}`,contact:e.barrier?Math.floor(e.contactPermille/4):e.contactPermille}))).sort((a,b)=>compare(a.id,b.id));
  def.distances=[];
  for(const r of planet.partition.value.regions){const from=arcId+'#'+r.id,queue=[{to:from,hops:0}];for(let n=0;n<queue.length;n++)for(const e of def.edges.filter(e=>e.from===queue[n].to))if(!queue.some(q=>q.to===e.to))queue.push({to:e.to,hops:queue[n].hops+1});def.distances.push(...queue.map(q=>({from,...q})));}
  def.distances.sort((a,b)=>compare(a.from,b.from)||compare(a.to,b.to));
  return deepFreeze(def);
}
