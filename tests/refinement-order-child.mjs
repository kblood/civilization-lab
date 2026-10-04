import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {scenarioRun,regional} from './m3-helpers.mjs';
import {refineCell} from '../src/refine-cell.mjs';
import {annualHierarchy} from '../src/annual-inspection.mjs';
import {canonicalBytes,compare} from '../src/canonical.mjs';

export const scenarios=[['lonely-earthlike','m3-4'],['crowded-domain','m3-1']];
export function queries(name,seed){
  const {ticks}=scenarioRun(name,seed,20);
  return {
    cells:ticks.flatMap(t=>t.pre.regions.map(r=>{
      const {def,contract,address}=regional(t,r);
      return {key:r.id+'@'+t.tick,run:()=>refineCell(def,contract,address)};
    })),
    // Domain inspection contains one entry per planet at each tick.
    annual:ticks.map(t=>({key:t.pre.body+'@'+t.tick,run:()=>annualHierarchy(t)})),
  };
}
export function digest(outputs){
  const hash=createHash('sha256');
  for(const [key,bytes] of [...outputs].sort(([a],[b])=>compare(a,b))){
    // Canonical pair framing includes keys and prevents concatenation ambiguity.
    hash.update(canonicalBytes([key,bytes.toString('utf8')]));
  }
  return hash.digest('hex');
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  // Reverse both scenario and query order in a fresh module graph.
  for(const [name,seed] of [...scenarios].reverse()){
    const jobs=queries(name,seed),outputs=new Map();
    for(const kind of ['annual','cells'])for(const q of [...jobs[kind]].reverse()){
      outputs.set(kind+':'+q.key,canonicalBytes(q.run()));
    }
    console.log(JSON.stringify({name,digest:digest(outputs)}));
  }
}
