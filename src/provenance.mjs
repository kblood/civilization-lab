// Model attribution: mechanical scores, never counterfactual explanations.
import { compare, canonicalString } from './canonical.mjs';
import { floorDiv as F } from './time.mjs';
import { compareEvents } from './events.mjs';
export const slotSort=(a,b)=>compare(a.target,b.target)||compare(a.field,b.field);
export function distance(a,b,field='') {
  if(a===b)return 0n;
  if(typeof a==='number'||typeof a==='bigint')return BigInt(a)>BigInt(b)?BigInt(a)-BigInt(b):BigInt(b)-BigInt(a);
  if(field==='region.damage')return distance(a.reduce((n,x)=>n+x.permille,0),b.reduce((n,x)=>n+x.permille,0));
  if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every(x=>typeof x==='number'))return a.reduce((n,x,i)=>n+distance(x,b[i]),0n);
  return canonicalString(a)===canonicalString(b)?0n:1n;
}
export function addScore(slots,target,field,eventId,score) {
  if(!score)return;
  let slot=slots.find(s=>s.target===target&&s.field===field);
  if(!slot){slot={target,field,entries:[]};slots.push(slot);}
  const entry=slot.entries.find(e=>e.eventId===eventId);
  if(entry)entry.score+=score;else slot.entries.push({eventId,score});
}
export function mergeProvenance(old,added,stressed=[]) {
  if(!added.length&&old.every(s=>s.field==='polity.stress'&&stressed.includes(s.target)&&s.entries.every(e=>e.score===1n)))return old;
  const out=[];
  for(const s of old)for(const e of s.entries)addScore(out,s.target,s.field,e.eventId,(s.field==='polity.stress'&&stressed.includes(s.target)?F(e.score+1n,2n):F(e.score,2n)));
  for(const s of added)for(const e of s.entries)addScore(out,s.target,s.field,e.eventId,e.score);
  for(const s of out)s.entries.sort((a,b)=>compare(b.score,a.score)||compare(a.eventId,b.eventId)).splice(3);
  return out.sort(slotSort);
}
export function deriveScores(boundary,final,scores,splitIds=[]) {
  if(!scores.length&&!splitIds.length)return;
  const contributors=slots=>{
    const ids=[];
    for(const s of scores)if(slots.some(([t,f])=>s.target===t&&s.field===f))for(const e of s.entries)if(!ids.includes(e.eventId))ids.push(e.eventId);
    return ids.sort(compare);
  };
  const credit=(target,field,b,a,deps,extra=[])=>{
    if(b===a)return;
    let score=distance(b,a,field)-(scores.find(s=>s.target===target&&s.field===field)?.entries.reduce((n,e)=>n+e.score,0n)??0n);
    if(score<=0n)return;
    const ids=[...contributors(deps),...extra].sort(compare).filter((id,i,all)=>!i||id!==all[i-1]);
    if(!ids.length)return;
    const q=F(score,BigInt(ids.length)),rem=Number(score%BigInt(ids.length));
    ids.forEach((id,i)=>addScore(scores,target,field,id,q+(i<rem?1n:0n)));
  };
  for(const r of final.regions) {
    const b=boundary.regions.find(x=>x.id===r.id),deps=fields=>fields.map(f=>[r.id,'region.'+f]);
    credit(r.id,'region.tiers',b.tiers,r.tiers,deps(['tiers','caps']));
    for(const [field,inputs] of [['Kbase',['tiers']],['K',['Kbase','tiers','damage']],['era',['tiers']],['energy',['pop','tiers']],['ceilings',['tiers','caps','resources']]])
      credit(r.id,'region.'+field,b[field],r[field],deps(inputs));
  }
  const ownership=final.regions.map(r=>[r.id,'region.polityId']);
  for(const p of final.polities) {
    const b=boundary.polities.find(x=>x.id===p.id);if(!b)continue;
    for(const field of ['regions','capital','endedYear'])credit(p.id,'polity.'+field,b[field],p[field],[...ownership,[p.id,'polity.endedYear']]);
    credit(p.id,'polity.hegemony',b.hegemony,p.hegemony,[...ownership,...final.regions.map(r=>[r.id,'region.pop']),[p.id,'polity.hegemony']]);
  }
  credit(final.id,'arc.outcome',boundary.outcome,final.outcome,[...ownership,...final.regions.flatMap(r=>[[r.id,'region.pop'],[r.id,'region.tiers']]),...final.polities.map(p=>[p.id,'polity.endedYear'])],splitIds);
  credit(final.id,'arc.perils',boundary.perils,final.perils,final.regions.flatMap(r=>[[r.id,'region.pop'],[r.id,'region.tiers']]));
}
export function causes(pre,event,groups,explicit=[]) {
  const entries=[];
  function add(id,edge,score){let e=entries.find(e=>e.eventId===id&&e.edge===edge);if(e)e.score+=score;else entries.push({eventId:id,edge,score});}
  for(const {edge,slots} of groups)for(const [target,field] of slots)for(const e of pre.provenance.find(s=>s.target===target&&s.field===field)?.entries??[]) {
    if(BigInt(e.eventId.split('|')[2])<BigInt(event.tick))add(e.eventId,edge,e.score);
  }
  for(const x of explicit)if(typeof x.event==='string'?BigInt(x.event.split('|')[2])<BigInt(event.tick):compareEvents(x.event,event)<0)add(typeof x.event==='string'?x.event:x.event.id,x.edge,1n);
  const out=[];
  for(const edge of ['CHAIN','ENABLED','EXOGENOUS','RAISED_HAZARD','TRIGGERED']) {
    const es=entries.filter(e=>e.edge===edge).sort((a,b)=>compare(a.eventId,b.eventId)),sum=es.reduce((n,e)=>n+e.score,0n);
    if(!sum)continue;
    const ws=es.map(e=>({eventId:e.eventId,edge,weightPermille:Number(F(1000n*e.score,sum))}));
    const rem=1000-ws.reduce((n,e)=>n+e.weightPermille,0);for(let i=0;i<rem;i++)ws[i].weightPermille++;
    out.push(...ws);
  }
  return out.sort((a,b)=>compare(a.eventId,b.eventId)||compare(a.edge,b.edge));
}
