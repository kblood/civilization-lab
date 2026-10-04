// Build an explicit per-region contract from inspection witnesses, before
// passing it across the pure refinement boundary. No live solver handle.
import {compare} from './canonical.mjs';
const summary=(r,a)=>({pop:r.pop,tiers:[...r.tiers],polityId:r.polityId,era:r.era,outcome:structuredClone(a.outcome)});
export function regionContract(def,boundary,pre,end,updates,events,regionId,boundaryHistory=null) {
  const b=boundary.regions.find(r=>r.id===regionId),r=pre.regions.find(r=>r.id===regionId),e=end.regions.find(r=>r.id===regionId);
  const naturalDelta=updates.naturalDelta.find(d=>d.regionId===regionId).pop;
  const owners=new Set([regionId,pre.id,...[boundary,pre,end].flatMap(a=>a.polities.filter(p=>p.regions.includes(regionId)).map(p=>p.id))]);
  const mandatoryEvents=events.filter(x=>owners.has(x.ownerId)||x.refs.some(ref=>ref.entityId!==pre.id&&owners.has(ref.entityId))||x.effects.some(e=>e.target===regionId||e.to===regionId)).sort((a,b)=>compare(a.id,b.id));
  const phases=[{phase:'phase0',eventId:null,delta:r.pop-b.pop},{phase:'natural',eventId:null,delta:naturalDelta}];
  for(const event of events.filter(e=>e.phase!==0))for(const x of event.effects){let delta=0n;if(x.field==='region.pop'&&x.target===regionId){if(x.op==='add')delta=BigInt(x.amount);else if(x.op==='transfer')delta=-BigInt(x.amount);}
    if(x.op==='transfer'&&x.toField==='region.pop'&&x.to===regionId)delta+=BigInt(x.amount);
    if(delta!==0n)phases.push({phase:'event',eventId:event.id,delta});}
  return {tick:String(pre.tick),regionId,start:summary(b,boundary),end:summary(e,end),naturalDelta,phases,mandatoryEvents,recipeDigest:def.recipeDigest,boundaryHistory:boundaryHistory??[{tick:String(pre.tick),pop:b.pop},{tick:String(pre.tick+1n),pop:e.pop}]};
}
export function cellDefinition(def,localId){const r=def.planet.partition.value.regions.find(r=>r.id===localId);return {seed:def.seed,manifestDigest:def.manifestDigest,cells:r.cells,weight:r.weight,epochs:def.planet.epochs.value.rows.filter(r=>r.regionId===localId),townThreshold:1000};}
