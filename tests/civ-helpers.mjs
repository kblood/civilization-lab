import { IMPLEMENTED } from '../src/catalogue.mjs';
import { createPlanet } from '../src/planet.mjs';
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
  const initial={atTick:'0',regions,polities,arc:{isColony:false,colonizer:true,perils:'none',nonviable:false,caps:[6,5,5,7,5,4,5],chains:[]},voyages:[]};
  const f={schemaVersion:'civ-forced-stub-1',id:'reach-'+kind,base:'fixtures/planets/temperate.json',seed:'m2-reach:'+kind,ticks,initial:kind==='SAPIENCE'?null:initial,
    overrides:[{key:'origin.deliveryYear',value:'0'},...IMPLEMENTED.filter(k=>k.trigger==='hazard').map(k=>({key:`hazard.${k.kind}.q32`,value:k.kind===chosen?'171798691840':'0'})),...extra].sort((a,b)=>a.key<b.key?-1:1),expect:kind,...patch};
  return f;
}
export function runForced(f){return createPlanet('temperate',f.seed,{forced:f}).run();}
export function setOverride(f,key,value){f.overrides=f.overrides.filter(o=>o.key!==key).concat({key,value}).sort((a,b)=>a.key<b.key?-1:1);return f;}
