import {forced,region,setOverride} from './civ-helpers.mjs';
export function graph(count=5) {
  const id=i=>'s'+String(i).padStart(2,'0'),body=i=>'stub:'+id(i)+':b0';
  return {schemaVersion:'civ-domain-stub-1',id:'test-graph',systems:Array.from({length:count},(_,i)=>({id:id(i),bodyPrefix:'stub:'+id(i),fixture:'fixtures/planets/temperate.json'})),routes:Array.from({length:count-2},(_,i)=>({from:body(i),to:body(i+1),kind:'interstellar',distanceMicroLy:'10000',travelYearsByTransportTier:[null,null,null,null,null,null,null,1],destinationHosting:'habitable'})),origins:[body(0)],fromYear:0,untilYear:2000000};
}
export function expansionFixture(seed='graph-3') {
  const f=forced('LAUNCH');f.seed=seed;f.initial.atTick='9';f.ticks=34;
  f.initial.regions=[region('r00',{pop:'100000',infra:'10000000',fuel:'10000000',tiers:[5,5,5,7,5,4,5]})];
  setOverride(f,'parameters.g',Array(8).fill(0));setOverride(f,'parameters.keepPermille','1000');setOverride(f,'magnitude.arc.colonizer','1');
  return f;
}
