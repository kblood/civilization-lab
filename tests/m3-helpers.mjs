import {createScenario} from '../src/scenario.mjs';
import {inspectionTicks} from '../src/inspection.mjs';
import {regionContract,cellDefinition} from '../src/refinement-contract.mjs';
export function scenarioRun(name='lonely-earthlike',seed='m3-1',untilYear=1000){const {world,domain}=createScenario(name,seed,{untilYear}),result=world.run();return {world,domain,result,ticks:inspectionTicks(world,result,domain)};}
export function regional(t,r){return {def:cellDefinition(t.def,r.localId),contract:regionContract(t.def,t.start,t.pre,t.end,t.updates,t.events,r.id,t.regionHistory[r.id]),address:{regionId:r.id,tick:t.tick}};}
