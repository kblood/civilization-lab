import { sha256Hex } from './digest.mjs';
import { generatedString } from './witness.mjs';
const hashes=new WeakMap();
function cachedHash(record,encode) {
  const old=hashes.get(record);if(old!==undefined)return old;
  const hash=sha256Hex(encode(record));if(Object.isFrozen(record))hashes.set(record,hash);return hash;
}
export function regionTuple(r) {
  return [r.id,r.localId,String(r.pop),String(r.Kbase),String(r.K),r.renewable,String(r.infra),String(r.fuel),String(r.forcing),r.immunityTicks,
    r.damage.map(d=>[d.eventId,d.permille,String(d.untilTick)]),r.polityId,r.cultureId,r.culture,r.tiers,r.caps,r.era,String(r.energy),r.resources,
    r.collapse&&[r.collapse.active,String(r.collapse.recoverPop),String(r.collapse.recoverInfra)],r.lowTicks,
    r.ceilings.map(c=>[c.domain,c.targetTier,c.reason]),r.spaceflight,r.berthsUsed];
}
const hazardHash=h=>cachedHash(h,v=>generatedString(v));
const hazardRoot=entries=>cachedHash(entries,v=>JSON.stringify(v.map(hazardHash)));
const episodeRoot=entries=>cachedHash(entries,v=>generatedString(v));
// Versioned structural commitment: every region field is in the fixed tuple;
// all other arc fields retain canonical keyed encoding. Collections stay sorted.
export function stateDigest(arc) {
  const {regions,hazardLedger,hazardEpisodes,...rest}=arc;
  return sha256Hex('['+generatedString(rest)+','+JSON.stringify(regions.map(regionTuple))+','+
    JSON.stringify(hazardRoot(hazardLedger))+','+JSON.stringify(episodeRoot(hazardEpisodes))+']');
}
