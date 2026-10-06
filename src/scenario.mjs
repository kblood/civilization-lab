import {readFixture,exact} from './environment.mjs';
import {createPlanet} from './planet.mjs';
import {createDomain} from './domain.mjs';
import {compare} from './canonical.mjs';
export const SCENARIOS=['lonely-earthlike','crowded-domain','harsh-anoxic','doomed-star','high-perils','forager-future'];
export function loadScenario(name){
  const path=SCENARIOS.includes(name)?'fixtures/scenarios/'+name+'.json':name,raw=readFixture(path);
  if(raw.schemaVersion!=='civ-scenario-1'){
    if(!['civ-planet-stub-1','civ-domain-stub-1','civ-system-stub-1'].includes(raw.schemaVersion))throw new TypeError('Unknown scenario description');
    return {schemaVersion:'civ-scenario-1',id:raw.id??raw.body,description:path,startingFixture:null,overrides:[],untilYear:20000};
  }
  exact(raw,['schemaVersion','id','description','startingFixture','overrides','untilYear']);
  if(typeof raw.id!=='string'||!Number.isSafeInteger(raw.untilYear)||raw.untilYear<10||raw.untilYear>2000000||!Array.isArray(raw.overrides)||raw.startingFixture!==null&&typeof raw.startingFixture!=='string')throw new TypeError('Invalid scenario');
  return raw;
}
export function createScenario(name,seed,{untilYear,targetingPolicy}={}){
  const scenario=loadScenario(name),input=readFixture(scenario.description),domain=input.schemaVersion!=='civ-planet-stub-1';
  const initial=scenario.startingFixture===null?null:readFixture(scenario.startingFixture);
  const forced=initial===null?null:{schemaVersion:'civ-forced-stub-1',id:'scenario:'+scenario.id,base:scenario.description,seed,ticks:40000,initial,expect:'SAPIENCE',overrides:[{key:'origin.deliveryYear',value:'0'},...scenario.overrides].sort((a,b)=>compare(a.key,b.key))};
  if(initial===null&&scenario.overrides.length)throw new TypeError('Overrides require an explicit starting fixture');
  const world=(domain?createDomain:createPlanet)(scenario.description,seed,{forced,untilYear:untilYear??scenario.untilYear,targetingPolicy});
  return {scenario,world,domain};
}
