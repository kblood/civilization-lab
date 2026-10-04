// Internal encoder for solver-created, closed-schema data. Public inputs use
// canonical.mjs validation. This produces the same canonical bytes, with no
// descriptor/schema revalidation on each generated tick.
import { compare } from './canonical.mjs';
// Normalize one streamed record at a time. Retain no encoded trees or strings;
// event/archive records already own their source data.
export function generatedValue(v) {
  if(v===null||typeof v!=='object')return typeof v==='bigint'?String(v):v;
  let out;
  const keys=Object.keys(v);
  if(Array.isArray(v))out=v.map(generatedValue);
  else {out={};for(const k of keys.sort(compare))out[k]=generatedValue(v[k]);}
  return out;
}
export function generatedString(v) {return JSON.stringify(generatedValue(v));}

export function* chapterParts(value) {
  yield '{';let first=true;
  for(const key of Object.keys(value).sort(compare)) {
    if(!first)yield ',';first=false;yield JSON.stringify(key)+':';
    const v=value[key];
    if(!Array.isArray(v)){yield generatedString(v);continue;}
    yield '[';
    for(let i=0;i<v.length;i++){if(i)yield ',';yield generatedString(v[i]);}
    yield ']';
  }
  yield '}';
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
