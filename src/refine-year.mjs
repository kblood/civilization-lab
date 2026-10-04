import {floorDiv} from './time.mjs';
import {canonicalBytes,compare} from './canonical.mjs';
import {contractError} from './refine-cell.mjs';
// No solver imports. A unit can be an arc, region or allocated cell.
export function refineYear(def,parentContract,unitAddress) {
  try{return refineYearImpl(def,parentContract,unitAddress);}catch(error){if(error.code==='REFINEMENT_CONTRACT_ERROR')throw error;contractError('invalid annual contract');}
}
function refineYearImpl(def,parentContract,unitAddress) {
  const p=structuredClone(parentContract);
  if(BigInt(unitAddress.tick)!==BigInt(p.tick))contractError('annual address');
  const samples=Array.from({length:11},(_,j)=>({year:Number(BigInt(p.tick)*10n)+j,...structuredClone(j===10?p.end:p.start),pop:j===10?p.end.pop:p.start.pop+floorDiv(BigInt(j)*p.naturalDelta,10n)}));
  if(samples.some(s=>s.pop<0n))contractError('negative annual population');
  return {contract:p,samples};
}
export function aggregateYears(child) {
  const expected=refineYear({},child.contract,{tick:child.contract.tick});
  if(!canonicalBytes(expected.samples).equals(canonicalBytes(child.samples)))contractError('annual bridge');
  return {...structuredClone(child.contract),start:strip(child.samples[0]),end:strip(child.samples[10])};
}
function strip({year,...state}){return state;}

// The parent owns the allocation. Children receive their apportioned series;
// no child reads another child or consumes randomness.
export function apportionYears(parent, contracts) {
  const rows=[...contracts].sort((a,b)=>compare(a.id,b.id));
  if(new Set(rows.map(r=>r.id)).size!==rows.length)contractError('duplicate annual child');
  const children=rows.map(p=>({id:p.id,...refineYear({},p,{tick:p.tick})}));
  for(let j=0;j<=10;j++){
    const ranked=rows.map((p,i)=>{const numerator=10n*p.start.pop+BigInt(j)*p.naturalDelta;
      return {i,id:p.id,remainder:numerator-10n*floorDiv(numerator,10n)};
    }).sort((a,b)=>compare(b.remainder,a.remainder)||compare(a.id,b.id));
    const total=children.reduce((n,c)=>n+c.samples[j].pop,0n);
    const k=parent.samples[j].pop-total;
    if(k<0n||k>BigInt(ranked.filter(r=>r.remainder>0n).length)||j===10&&k!==0n)contractError('annual child budgets');
    for(let i=0;i<Number(k);i++)children[ranked[i].i].samples[j].pop++;
  }
  return children;
}

export function refineYearTree(contract) {
  const root=refineYear({},contract,{tick:contract.tick});
  function descend(node,p){
    if(!p.children)return;
    for(const key of ['start','end'])if(p.children.reduce((n,c)=>n+c[key].pop,0n)!==p[key].pop)contractError('annual boundary sum');
    if(p.children.reduce((n,c)=>n+c.naturalDelta,0n)!==p.naturalDelta)contractError('annual delta sum');
    node.children=apportionYears(node,p.children);
    for(const c of node.children)descend(c,p.children.find(p=>p.id===c.id));
  }
  descend(root,contract);return root;
}

export function aggregateYearTree(tree){
  const expected=refineYearTree(tree.contract);
  if(!canonicalBytes(expected).equals(canonicalBytes(tree)))contractError('annual hierarchy');
  return structuredClone(tree.contract);
}
