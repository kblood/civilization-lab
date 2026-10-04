import { IMPLEMENTED } from '../src/catalogue.mjs';
import { createPlanet } from '../src/planet.mjs';
import {createDomain} from '../src/domain.mjs';
import {loadPlanet} from '../src/environment.mjs';
export const region=(localId='r00',patch={})=>({localId,pop:'10000',infra:'100000',fuel:'100000',forcing:'0',tiers:[0,0,0,0,0,0,0],culture:[500,500,500],lowTicks:[0,0,0,0,0,0,0],collapse:null,damage:[],...patch});
export const polity=(label,regionIds,patch={})=>({label,regionIds,regime:'state',eliteShare:100,asabiya:600,legitimacy:600,stress:100,warWeariness:0,hegemony:false,...patch});
export function forced(kind,patch={}) {
  let regions=[region()],polities=[],ticks=1,chosen=kind;
  const extra=[];
  if(kind==='MIGRATION')regions=[region('r00',{pop:'100000'}),region('r01',{pop:'1000'})];
  if(['DISCOVERY','COLLAPSE','DIFFUSION'].includes(kind))regions=[region('r00',{tiers:[0,1,0,0,0,0,0]})];
  if(kind==='DIFFUSION')regions.push(region('r01'));
  if(kind==='FAMINE')regions=[region('r00',{pop:'100000'})];
  if(kind==='PLAGUE'){ticks=4;regions.push(region('r01'));}
  if(kind==='TECH_LOSS')regions=[region('r00',{pop:'1',tiers:[0,0,0,0,4,0,0],lowTicks:[0,0,0,0,2,0,0]})];
  if(kind==='ENERGY_TRANSITION')chosen='AGRICULTURE';
  if(kind==='POLITY_FOUNDING')regions=[region('r00',{tiers:[0,2,0,0,0,0,0]})];
  if(['WAR','CONQUEST'].includes(kind)){
    chosen='WAR';regions=[region('r00',{pop:kind==='CONQUEST'?'100000':'10000'}),region('r01',{pop:'1000'})];
    polities=[polity('a',['r00']),polity('b',['r01'])];
    if(kind==='CONQUEST'){ticks=4;extra.push({key:'magnitude.evt.conquest.win',value:'1'});}
  }
  if(kind==='RECOVERY')regions=[region('r00',{collapse:{active:true,recoverPop:'10000',recoverInfra:'100000'}})];
  if(kind==='EXTINCTION')regions=[];
  if(kind==='HEGEMONY')polities=[polity('a',['r00'])];
  if(['FRAGMENTATION','SCHISM'].includes(kind)){regions.push(region('r01'));polities=[polity('a',['r00','r01'],{stress:1000})];}
  if(kind==='REVOLUTION'){regions=[region('r00',{tiers:[0,0,0,0,1,0,0]})];polities=[polity('a',['r00'],{stress:1000})];}
  if(kind==='NATURAL_CATASTROPHE')extra.push({key:'parameters.naturalExtinctionPpm',value:'0'});
  if(kind==='CLIMATE_CATASTROPHE')regions=[region('r00',{forcing:'1000000000'})];
  if(kind==='SPACEFLIGHT')regions=[region('r00',{tiers:[0,0,0,5,0,0,0]})];
  if(kind==='COLONY_LOST')regions=[region('r00',{pop:'1000'})];
  if(kind==='ENGINEERED_PANDEMIC'){regions=[region('r00',{tiers:[0,0,0,0,4,4,0]})];extra.push({key:'outcome.'+kind,value:'existential-cap'});}
  if(kind==='RUNAWAY_TECH'){regions=[region('r00',{tiers:[0,0,0,0,5,0,0]})];extra.push({key:'outcome.'+kind,value:'extinction'});ticks=2;}
  if(kind==='NUCLEAR_WAR'){regions=['r00','r01'].map(id=>region(id,{tiers:[4,0,4,0,0,0,0]}));polities=[polity('a',['r00']),polity('b',['r01'])];extra.push({key:'outcome.'+kind,value:'collapse'});ticks=2;}
  if(kind==='LAUNCH'){regions=[region('r00',{tiers:[5,5,4,6,4,3,4]})];ticks=2;}
  if(kind==='LINEAGE_EXTINCTION')regions=[];
  const initial={atTick:'0',regions,polities,arc:{isColony:false,colonizer:true,perils:'none',nonviable:false,caps:[6,5,5,7,5,4,5],chains:[]},voyages:[]};
  const f={schemaVersion:'civ-forced-stub-1',id:'reach-'+kind,base:'fixtures/planets/temperate.json',seed:'m2-reach:'+kind,ticks,initial:kind==='SAPIENCE'?null:initial,
    overrides:[{key:'origin.deliveryYear',value:'0'},...IMPLEMENTED.filter(k=>k.trigger==='hazard').map(k=>({key:`hazard.${k.kind}.q32`,value:k.kind===chosen?'171798691840':'0'})),...extra].sort((a,b)=>a.key<b.key?-1:1),expect:kind,...patch};
  if(['NUCLEAR_WAR','ENGINEERED_PANDEMIC','RUNAWAY_TECH'].includes(kind))f.initial.arc.perils='active';
  if(kind==='NUCLEAR_WAR')setOverride(f,'hazard.WAR.q32','171798691840');
  if(kind==='COLONY_LOST')f.initial.arc.isColony=true;
  if(kind==='CLIMATE_SHIFT'){f.initial.atTick='99';f.ticks=2;const rows=loadPlanet().planet.epochs.value.rows;setOverride(f,'epoch.rows',[...rows.map(r=>({...r,untilEpoch:'1'})),...rows.map(r=>({...r,fromEpoch:'1',Kbase:'1000'}))]);}
  if(['LAUNCH','COLONY_FOUNDED'].includes(kind))f.base='fixtures/planets/home-system.json';
  if(kind==='LAUNCH')f.initial.atTick='9';
  if(['VOYAGE_LOST','LINEAGE_EXTINCTION'].includes(kind))f.base='fixtures/domains/toy-12.json';
  if(['VOYAGE_LOST','COLONY_FOUNDED'].includes(kind)) {
    const lost=kind==='VOYAGE_LOST';f.initial.atTick='1';
    f.initial.voyages=[{label:'a',sourceBody:'stub:s00:b0',sourceLocalRegionId:'r00',destination:lost?'stub:s01:b0':'stub:s00:b1',pop:lost?'2000':'4000',tiers:lost?[5,5,5,7,5,4,5]:[5,5,4,6,4,3,4],launchYear:0,arrivalYear:lost?400:5,deliveryTick:lost?'40':'1'}];
  }
  return f;
}
export function runForced(f){return !f.base.includes('/domains/')&&!f.base.endsWith('/home-system.json')?createPlanet(f.base,f.seed,{forced:f}).run():createDomain(f.base,f.seed,{forced:f}).run();}
export function setOverride(f,key,value){f.overrides=f.overrides.filter(o=>o.key!==key).concat({key,value}).sort((a,b)=>a.key<b.key?-1:1);return f;}
