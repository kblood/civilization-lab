import grammarData from './name-grammar.json' with {type:'json'};
import {below} from './rng.mjs';
import {compare,canonicalBytes} from './canonical.mjs';
import {sha256Hex} from './digest.mjs';
export const NAME_GRAMMAR=grammarData;
export function narrative(def,eventLog,identities=[],grammar=NAME_GRAMMAR) {
  const events=[...eventLog].sort((a,b)=>compare(a.dateYear,b.dateYear)||compare(a.phase,b.phase)||compare(a.kindRank,b.kindRank)||compare(a.ownerId,b.ownerId)||compare(a.intentKey,b.intentKey));
  const ids=[...new Set([...identities,...events.flatMap(e=>[e.ownerId,...e.refs.map(r=>r.entityId)])])].sort(compare);
  const names=ids.map(id=>{const type=id.includes('/site')?'settlement':id.includes('#pol:')?'polity':id.includes('#cul:')?'culture':'arc';
    const addr={worldSeed:def.seed,manifestDigest:def.manifestDigest,level:'N',entityId:id,purpose:'nar.'+type,episodeOrBucket:0n,ordinal:0};
    const pick=(part,i)=>part[Number(below(addr,BigInt(part.length),i))];
    return {id,name:pick(grammar.prefix,0)+pick(grammar.suffix,1)+' '+pick(grammar[type],2)};});
  const labels=new Map(names.map(n=>[n.id,n.name]));
  const selected=[...events].sort((a,b)=>compare(b.salience,a.salience)||compare(a.dateYear,b.dateYear)||compare(a.id,b.id)).slice(0,30);
  const chronicle=selected.map(e=>({eventId:e.id,dateYear:e.dateYear,salience:e.salience,text:`${labels.get(e.ownerId)}: ${e.kind.toLowerCase().replaceAll('_',' ')}.`,causes:e.causes.map(c=>c.eventId)}));
  return {names,chronicle,narrativeDigest:sha256Hex(canonicalBytes({grammar,names,chronicle}))};
}
