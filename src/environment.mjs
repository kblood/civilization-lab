import { readFileSync } from 'node:fs';
import { canonicalBytes, compare } from './canonical.mjs';
import { sha256Hex } from './digest.mjs';
import { deepFreeze } from './manifest.mjs';
import { floorDiv } from './time.mjs';
export const digest = value => sha256Hex(canonicalBytes(value));
export const Availability = Object.freeze({
  known: value => ({status:'known',value:structuredClone(value),digest:digest(value)}),
  absent: reason => ({status:'absent',reason}),
  unsupported: capability => ({status:'unsupported',capability}),
});
const FULL_CONTRACT_TEXT = readFileSync(new URL('../docs/transition-table-v1.md',import.meta.url),'utf8')
  .replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').replace(/\n*$/,'\n');
// The original contract remains the RNG address domain. The append-only
// witness annex versions encoding, not dynamics; its version is in every leaf.
export const CONTRACT_TEXT=FULL_CONTRACT_TEXT.split('\n<!-- M2A-WITNESS-ANNEX -->')[0];
export const TABLE = deepFreeze(JSON.parse(CONTRACT_TEXT.slice(CONTRACT_TEXT.indexOf('## Machine-readable table')).match(/```json\n([\s\S]*?)\n```/)[1]));
const schema = JSON.parse(CONTRACT_TEXT.match(/```jsonschema\n([\s\S]*?)\n```/)[1]);
export function exact(value, keys) {
  if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).sort(compare).join('|')!==[...keys].sort(compare).join('|'))throw new TypeError('Invalid closed record');
}
export function sortedUnique(rows,key=x=>x) {
  if(!Array.isArray(rows)||rows.some((r,i)=>i&&compare(key(rows[i-1]),key(r))>=0))throw new TypeError('Expected sorted unique array');
}
function validate(value,s) {
  if(s.$ref)return validate(value,schema.$defs[s.$ref.split('/').at(-1)]);
  if(s.oneOf||s.anyOf) {
    const count=(s.oneOf||s.anyOf).filter(part=>{try{validate(value,part);return true;}catch{return false;}}).length;
    if(!count||(s.oneOf&&count!==1))throw new TypeError('Invalid schema alternative'); return;
  }
  if('const' in s&&value!==s.const)throw new TypeError('Invalid constant');
  if(s.enum&&!s.enum.includes(value))throw new TypeError('Invalid enum');
  if(s.type==='null'&&value!==null)throw new TypeError('Expected null');
  if(s.type==='integer'&&(!Number.isSafeInteger(value)||value<(s.minimum??-Number.MAX_SAFE_INTEGER)||value>(s.maximum??Number.MAX_SAFE_INTEGER)))throw new TypeError('Invalid integer');
  if(s.type==='boolean'&&typeof value!=='boolean')throw new TypeError('Invalid boolean');
  if(s.type==='string'&&(typeof value!=='string'||!value.isWellFormed()||value.length<(s.minLength??0)||(s.pattern&&!new RegExp(s.pattern).test(value))))throw new TypeError('Invalid string');
  if(s.type==='array') {
    if(!Array.isArray(value)||value.length<(s.minItems??0)||value.length>(s.maxItems??Infinity))throw new TypeError('Invalid array');
    value.forEach(v=>validate(v,s.items));
  }
  if(s.type==='object') {
    exact(value,s.required);
    for(const k of Object.keys(s.properties).sort(compare))validate(value[k],s.properties[k]);
  }
}
export function validatePlanet(p) {
  canonicalBytes(p); validate(p,schema.$defs.PlanetStub);
  if(p.body.length>128||p.system.length>128||p.body.includes(':lin:')||/^(arc:|lin:)/.test(p.system))throw new TypeError('Invalid identity');
  for(const key of ['lifecycle','partition','epochs'])if(p[key].status==='known'&&digest(p[key].value)!==p[key].digest)throw new TypeError('Availability digest mismatch');
  if(p.lifecycle.status==='known') {
    const l=p.lifecycle.value;
    if(l.habitableUntilYear<=l.habitableFromYear||[l.habitableFromYear,l.habitableUntilYear,l.complexLifeFromYear,l.stellarDoomYear].some(y=>y!==null&&y%10!==0))throw new TypeError('Invalid lifecycle');
  }
  if(p.partition.status==='known') {
    const rs=p.partition.value.regions; sortedUnique(rs,r=>r.id);
    for(const r of rs) {
      sortedUnique(r.cells,c=>c.id); sortedUnique(r.adjacency,e=>e.to);
      for(const e of r.adjacency) {
        const back=rs.find(v=>v.id===e.to)?.adjacency.find(v=>v.to===r.id);
        if(e.to===r.id||!back||back.barrier!==e.barrier||back.contactPermille!==e.contactPermille)throw new TypeError('Asymmetric adjacency');
      }
    }
    if(p.epochs.status==='known') {
      const rows=p.epochs.value.rows;
      for(let i=0;i<rows.length;i++) {
        const r=rows[i],prev=rows[i-1];
        if(!rs.some(x=>x.id===r.regionId)||BigInt(r.untilEpoch)<=BigInt(r.fromEpoch)||r.resources[3]!==floorDiv(r.domesticablesPpm,1000)||
          (prev&&(BigInt(prev.fromEpoch)>BigInt(r.fromEpoch)||(prev.fromEpoch===r.fromEpoch&&prev.regionId>=r.regionId))))throw new TypeError('Invalid epoch');
      }
      for(const r of rs) {
        const own=rows.filter(x=>x.regionId===r.id);
        if(!own.length||BigInt(own[0].fromEpoch)>0n||BigInt(own.at(-1).untilEpoch)<400n||own.some((x,i)=>i&&x.fromEpoch!==own[i-1].untilEpoch))throw new TypeError('Epoch gap/overlap');
      }
    }
  }
  return p;
}
export function loadPlanet(name='temperate') {
  const aliases={'temperate-12':'temperate','arid-8':'arid','cold-archipelago-10':'cold-archipelago'};
  name=aliases[name]??name;
  const path=name.endsWith('.json')?name:`fixtures/planets/${name}.json`;
  if(path.includes('\\')||path.split('/').some(x=>x==='.'||x==='..')||path.startsWith('/'))throw new TypeError('Invalid fixture path');
  return {path,planet:validatePlanet(JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8')))};
}
export class StubEnvironment {
  constructor(planets,routes=[]) { this.planets=deepFreeze(structuredClone(planets).sort((a,b)=>compare(a.body,b.body))); this.routeRows=deepFreeze(structuredClone(routes)); this.planets.forEach(validatePlanet); }
  lifecycle(body){return structuredClone(this.planets.find(p=>p.body===body)?.lifecycle??Availability.absent('unknown-body'));}
  regions(body){return structuredClone(this.planets.find(p=>p.body===body)?.partition??Availability.absent('unknown-body'));}
  epoch(body,region,index){
    const p=this.planets.find(p=>p.body===body);
    if(!p)return Availability.absent('unknown-body');
    if(p.epochs.status!=='known')return structuredClone(p.epochs);
    const row=p.epochs.value.rows.find(r=>r.regionId===region&&BigInt(r.fromEpoch)<=BigInt(index)&&BigInt(index)<BigInt(r.untilEpoch));
    if(!row)throw new RangeError('Epoch gap');
    const {fromEpoch,untilEpoch,...value}=row;
    return Availability.known(value);
  }
  routes(){return Availability.known(this.routeRows);}
}
