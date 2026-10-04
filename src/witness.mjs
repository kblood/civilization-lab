// Internal encoder for solver-created, closed-schema data. Public inputs use
// canonical.mjs validation. This produces the same canonical bytes, with no
// descriptor/schema revalidation on each generated tick. Cache only frozen data.
import { compare } from './canonical.mjs';
const strings=new WeakMap();
export function generatedString(v) {
  if(v===null)return 'null';
  const type=typeof v;
  if(type==='number'||type==='boolean')return String(v);
  if(type==='bigint')return '"'+v+'"';
  if(type==='string')return JSON.stringify(v);
  const old=strings.get(v);if(old!==undefined)return old;
  const text=Array.isArray(v)?'['+v.map(generatedString).join(',')+']':
    '{'+Object.keys(v).sort(compare).map(k=>JSON.stringify(k)+':'+generatedString(v[k])).join(',')+'}';
  if(Object.isFrozen(v)&&text.length<65536)strings.set(v,text);
  return text;
}

// Only for records assembled by the solver; reused frozen descendants were
// recursively frozen here (or validated by freezeCanonical) on first creation.
export function freezeGenerated(value) {
  if(value&&typeof value==='object'&&!Object.isFrozen(value)) {
    for(const key of Object.keys(value).sort(compare))freezeGenerated(value[key]);
    Object.freeze(value);
  }
  return value;
}
