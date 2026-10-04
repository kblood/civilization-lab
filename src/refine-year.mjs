import {floorDiv} from './time.mjs';
import {canonicalBytes} from './canonical.mjs';
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
