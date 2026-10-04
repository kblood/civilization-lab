import { compare } from './canonical.mjs';
import { floorDiv as F } from './time.mjs';
import { pressure, prepareRegion, max } from './tech.mjs';
export const clamp = (x,a=0,b=1000)=>Math.min(b,Math.max(a,x));
const snapshots=new WeakMap(),populations=new WeakMap();
export function prepareArc(arc) {
  const regions=new Map(arc.regions.map(r=>[r.id,r])),polities=new Map(arc.polities.map(p=>[p.id,p]));
  const groups=new Map(arc.polities.map(p=>[p.id,[]])),wars=new Set();
  for(const r of arc.regions){prepareRegion(r);groups.get(r.polityId)?.push(r);}
  for(const c of arc.chains)if(c.kind==='WAR'&&c.status==='active')for(const r of c.refs)if(['attacker','defender'].includes(r.role))wars.add(r.entityId);
  populations.set(arc.regions,arc.regions.reduce((n,r)=>n+r.pop,0n));
  for(const p of arc.polities){const rs=groups.get(p.id);populations.set(rs,rs.reduce((n,r)=>n+r.pop,0n));}
  snapshots.set(arc,{regions,polities,groups,wars});
}
export const regionById=(arc,id)=>snapshots.get(arc)?.regions.get(id)??arc.regions.find(r=>r.id===id);
export const polityById=(arc,id)=>snapshots.get(arc)?.polities.get(id)??arc.polities.find(p=>p.id===id);
export const population=regions=>populations.get(regions)??regions.reduce((n,r)=>n+r.pop,0n);
export const members=(arc,p)=>snapshots.get(arc)?.groups.get(p.id)??arc.regions.filter(r=>r.polityId===p.id);
export const fighting=(arc,id)=>snapshots.has(arc)?snapshots.get(arc).wars.has(id):arc.chains.some(c=>c.kind==='WAR'&&c.status==='active'&&c.refs.some(r=>['attacker','defender'].includes(r.role)&&r.entityId===id));
export function polityRecord(id,regionIds,year,parent=null) {
  return {id,regions:[...regionIds].sort(compare),capital:[...regionIds].sort(compare)[0],regime:parent?.regime??'state',
    eliteShare:parent?.eliteShare??100,asabiya:parent?700:600,legitimacy:600,stress:parent?200:100,
    warWeariness:parent?.warWeariness??0,foundedYear:year,endedYear:null,parentIds:parent?[parent.id]:[],hegemony:false};
}
export function splitRecords(arc,p,event) {
  const rs=members(arc,p); if(rs.length<2)return [];
  const middle=F(rs.length,2),anchor=rs[0].localId;
  return [rs.slice(0,middle),rs.slice(middle)].map((part,i)=>polityRecord(`${arc.id}#pol:${event.tick}:${event.kindRank}:${anchor}:${i}`,part.map(r=>r.id),event.dateYear,p));
}
export function naturalPolity(arc,p) {
  const rs=members(arc,p),count=BigInt(rs.length),war=fighting(arc,p.id)?1:0;
  const avg=Number(F(rs.reduce((n,r)=>n+BigInt(pressure(r)),0n),max(1n,count)));
  const maxI=rs.reduce((n,r)=>Math.max(n,r.tiers[4]),0);
  const target=clamp(F(avg,2)+p.eliteShare+F(1000-p.legitimacy,2)+20*(rs.length-1)-F(p.asabiya,2));
  return {...p,stress:F(3*p.stress+target,4),legitimacy:clamp(p.legitimacy+5-F(p.stress,100)-10*war),
    asabiya:clamp(p.asabiya+10*war-2),eliteShare:clamp(p.eliteShare+1+maxI-F(p.stress,100)),warWeariness:clamp(p.warWeariness+100*war-20*(1-war))};
}
const distanceLookups=new WeakMap();
export function powerAt(arc,p,target,distances) {
  let lookup=distanceLookups.get(distances);
  if(!lookup){lookup=new Map(distances.map(d=>[d.from+'|'+d.to,d.hops]));distanceLookups.set(distances,lookup);}
  return members(arc,p).reduce((sum,r)=>{
    const hops=lookup.get(r.id+'|'+target);
    if(hops===undefined)return sum;
    let v=F(r.pop*BigInt(1+r.tiers[2])*BigInt(500+p.asabiya),1000n);
    for(let i=0;i<hops;i++)v=F(v*800n,1000n);
    return sum+v;
  },0n);
}
export function rebuildOwnership(arc,year) {
  for(const p of arc.polities) {
    const owned=members(arc,p).map(r=>r.id);
    if(owned.length!==p.regions.length||owned.some((id,i)=>id!==p.regions[i]))p.regions=owned;
    if(!p.regions.length){if(p.endedYear===null)p.endedYear=year;}
    else if(!p.regions.includes(p.capital))p.capital=p.regions[0];
    if(population(arc.regions)===0n||population(members(arc,p))*1000n<population(arc.regions)*600n)p.hegemony=false;
  }
}
