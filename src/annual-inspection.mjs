import {regionContract,cellDefinition} from './refinement-contract.mjs';
import {refineCell} from './refine-cell.mjs';
import {refineYearTree} from './refine-year.mjs';

export function annualHierarchy(t){
  const children=t.pre.regions.map(r=>{
    const p=regionContract(t.def,t.start,t.pre,t.end,t.updates,t.events,r.id,t.regionHistory[r.id]);
    const cells=refineCell(cellDefinition(t.def,r.localId),p,{regionId:r.id,tick:t.tick});
    return {id:r.id,tick:String(t.tick),start:{pop:r.pop},end:{pop:p.end.pop},naturalDelta:p.naturalDelta,
      children:cells.cells.map(c=>({id:c.id,tick:String(t.tick),start:{...c.start,pop:c.annualStart},end:c.end,naturalDelta:c.naturalDelta}))};
  });
  return refineYearTree({tick:String(t.tick),start:{pop:children.reduce((n,c)=>n+c.start.pop,0n)},end:{pop:children.reduce((n,c)=>n+c.end.pop,0n)},naturalDelta:children.reduce((n,c)=>n+c.naturalDelta,0n),children});
}
