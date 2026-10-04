import { compare } from './canonical.mjs';
import { sha256Hex } from './digest.mjs';

export const WITNESS_VERSION='m4d-delta-witness-1';
// These field orders are part of the witness schema, not object insertion order.
export const REGION_FIELDS=Object.freeze(['id','localId','pop','Kbase','K','renewable','infra','fuel','forcing','immunityTicks','damage','polityId','cultureId','culture','tiers','caps','era','energy','resources','collapse','lowTicks','ceilings','spaceflight','berthsUsed','recoveries'].sort(compare));
export const ARC_FIELDS=Object.freeze(['id','lineageId','body','episode','foundedYear','foundingTiers','lastDeath','isColony','colonizer','polities','hazardEpisodes','chains','provenance','latches','perils','nonviable','outcome','scenarioParams','inbox','outbox','tick','evacuating','signals','contacts','diffusionEdges','targetFailures','lineageReports'].sort(compare));
// Lengths count UTF-16 code units; the completed text is hashed as UTF-8.
// s<string-length>:<string>, n<integer>;, z/f/t, a<count>:<values>,
// o<count>:<sorted key/value pairs>. BigInts use decimal strings, as in M1.
export function witnessValue(v) {
  if(v===null)return 'z';
  if(typeof v==='boolean')return v?'t':'f';
  if(typeof v==='number')return 'n'+v+';';
  if(typeof v==='bigint')v=String(v);
  if(typeof v==='string')return 's'+v.length+':'+v;
  if(Array.isArray(v)){let text='a'+v.length+':';for(const item of v)text+=witnessValue(item);return text;}
  const keys=Object.keys(v).sort(compare);
  let text='o'+keys.length+':';for(const k of keys)text+='s'+k.length+':'+k+witnessValue(v[k]);return text;
}
// Empty text means equal. v replaces a value; a/o patch containers of equal
// shape. Object patch indices address lexically sorted keys of the old object.
export function valueDelta(a,b) {
  if(a===b)return '';
  if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object') {
    if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length) {
      let text='',count=0;
      for(let i=0;i<b.length;i++){const d=valueDelta(a[i],b[i]);if(d){text+=i+';'+d;count++;}}
      return count?'a'+count+':'+text:'';
    }
    if(!Array.isArray(a)&&!Array.isArray(b)) {
      const keys=Object.keys(b).sort(compare);
      if(Object.keys(a).length===keys.length&&keys.every(k=>Object.hasOwn(a,k))) {
        let text='',count=0;
        for(let i=0;i<keys.length;i++){const k=keys[i],d=valueDelta(a[k],b[k]);if(d){text+=i+';'+d;count++;}}
        return count?'o'+count+':'+text:'';
      }
    }
  }
  return 'v'+witnessValue(b);
}
function fields(before,after,keys) {
  let text='',count=0;
  for(let i=0;i<keys.length;i++) {
    const k=keys[i],d=valueDelta(before[k],after[k]);
    if(d){text+=i+';'+d;count++;}
  }
  return count+':'+text;
}
// Sorted merge; hazard identities are immutable for an existing key.
function hazards(before,after) {
  let text='',count=0,i=0,j=0;
  while(i<before.length||j<after.length) {
    const a=before[i],b=after[j];
    if(!b||(a&&a.key<b.key)){text+=a.key+'d';count++;i++;}
    else if(!a||b.key<a.key){text+=b.key+'v'+witnessValue(b);count++;j++;}
    else {
      if(a!==b&&(a.H_q32!==b.H_q32||a.atTick!==b.atTick||a.rate!==b.rate||a.E_q32!==b.E_q32||a.episode!==b.episode||a.closed!==b.closed)){text+=b.key+'c'+b.H_q32+';'+b.atTick+';'+b.rate+';'+(b.E_q32===a.E_q32?'':b.E_q32)+';'+(b.episode===a.episode?'':b.episode)+';'+(b.closed?'t':'f');count++;}
      i++;j++;
    }
  }
  return count+':'+text;
}
export function transitionText(previous,before,after) {
  let regions='',count=0;
  for(let i=0;i<after.regions.length;i++) {
    if(before.regions[i]?.id!==after.regions[i].id)throw new Error('Region partition changed');
    const delta=fields(before.regions[i],after.regions[i],REGION_FIELDS);
    if(delta!=='0:'){regions+=i+';'+delta;count++;}
  }
  return WITNESS_VERSION+';'+previous+fields(before,after,ARC_FIELDS)+count+':'+regions+hazards(before.hazardLedger,after.hazardLedger);
}
export function transitionDigest(previous,before,after) {return sha256Hex(transitionText(previous,before,after));}
