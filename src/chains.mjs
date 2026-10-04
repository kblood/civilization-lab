import { compare } from './canonical.mjs';
export const refSort=(a,b)=>compare(a.role,b.role)||compare(a.entityId,b.entityId);
export function refsUnique(refs){return refs.sort(refSort).filter((r,i,a)=>!i||refSort(a[i-1],r)!==0);}
export function newChain(event,refs,frontier=[]) {
  return {chainId:event.id,kind:event.kind,refs:refsUnique(refs),step:0,nextTick:BigInt(event.tick)+1n,
    deadlineTick:BigInt(event.tick)+3n,status:'active',reason:null,frontier:[...frontier].sort(compare),visited:[...frontier].sort(compare)};
}
export function advanceChain(c,tick,status='active',reason=null,frontier=[],visited=c.visited) {
  return {...c,step:c.step+1,nextTick:status==='active'?tick+1n:null,status,reason,
    frontier:status==='active'?[...frontier].sort(compare):[],visited:[...visited].sort(compare).filter((v,i,a)=>!i||v!==a[i-1])};
}
export const chainWitness=c=>({chainId:c.chainId,step:c.step,deadlineTick:String(c.deadlineTick),status:c.status});
export const participant=(c,role)=>c.refs.find(r=>r.role===role)?.entityId;
