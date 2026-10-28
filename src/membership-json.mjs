/** Membership-only Species number codec. Generic Civ integer canonical APIs
 * remain unchanged. Integer-only parsed values retain their exact old encoding. */
const MAX_NODES=1000000, MAX_TEXT=32*1024*1024, MAX_TOKEN=65536, MAX_ARRAY=250000;
const fail=message=>{throw new TypeError(`Membership JSON: ${message}`);};
const wellFormed=value=>!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
export const validMembershipNumber=value=>typeof value==='number'&&Number.isFinite(value)&&!Object.is(value,-0)&&(!Number.isInteger(value)||Number.isSafeInteger(value));
const index=value=>Number.isSafeInteger(value)&&value>=0;
function factPath(path){return path.length===4&&path[0]==='biology'&&path[1]==='facts'&&index(path[2])&&path[3]==='value';}
export function allowsMembershipNumber(path,mode){
  if(mode==='transport'){if(path[0]!=='ledger')return false;path=path.slice(1);mode='ledger';}
  if(mode==='ledger'){if(path[0]!=='records'||!index(path[1]))return false;path=path.slice(2);mode='record';}
  if(mode==='record'){
    if(path[0]!=='sourceEvidence')return false;path=path.slice(1);
    if(path[0]==='species')return factPath(path.slice(1));
    return path[0]==='individuals'&&index(path[1])&&factPath(path.slice(2));
  }
  if(mode==='bundle'){
    if((path[0]==='species'||path[0]==='individuals')&&index(path[1]))return factPath(path.slice(2));
    return path.length===4&&path[0]==='representations'&&index(path[1])&&path[2]==='coordinates'&&path[3]==='metersPerUnit';
  }
  return false;
}
export function membershipCanonicalString(value){
  const ancestors=new Set();
  function encode(v){
    if(v===null)return 'null';
    if(typeof v==='boolean')return String(v);
    if(typeof v==='string'){if(!wellFormed(v))fail('malformed Unicode');return JSON.stringify(v);}
    if(typeof v==='number'){if(!validMembershipNumber(v))fail('finite numbers without negative zero or unsafe integer values required');return JSON.stringify(v);}
    if(!v||typeof v!=='object'||ancestors.has(v))fail('plain acyclic JSON required');
    const array=Array.isArray(v),keys=Reflect.ownKeys(v);
    if(array ? Object.getPrototypeOf(v)!==Array.prototype||keys.length!==v.length+1 : ![null,Object.prototype].includes(Object.getPrototypeOf(v)))fail('plain JSON required');
    ancestors.add(v);
    const data=key=>{const d=Object.getOwnPropertyDescriptor(v,key);if(!d||!('value' in d)||!d.enumerable)fail('own JSON data required');return d.value;};
    let result;
    if(array){result='['+Array.from({length:v.length},(_,i)=>encode(data(String(i)))).join(',')+']';}
    else{if(keys.some(key=>typeof key!=='string'))fail('symbol keys unsupported');result='{'+keys.sort().map(key=>encode(key)+':'+encode(data(key))).join(',')+'}';}
    ancestors.delete(v);return result;
  }
  return encode(value);
}
export const membershipCanonicalBytes=value=>new TextEncoder().encode(membershipCanonicalString(value));
export function freezeMembershipJson(value){membershipCanonicalString(value);const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(value);return value;}

export function parseMembershipJson(text, label = 'JSON', mode = 'strict') {
  if (!text.length || text.charCodeAt(0) === 0xfeff) fail(`${label}: empty JSON or BOM is not supported`);
  let at = 0, nodes = 0, units = 0;
  const invalid = message => fail(`${label}: ${message} at UTF-16 offset ${at}`);
  function whitespace() {
    while (at < text.length && (text[at] === ' ' || text[at] === '\n' || text[at] === '\r' || text[at] === '\t')) at++;
  }
  function string() {
    const start = at++;
    while (at < text.length) {
      if (at - start > 6 * MAX_TOKEN + 2) invalid('string/key exceeds token bound');
      const char = text[at++];
      if (char === '"') {
        let value;
        try { value = JSON.parse(text.slice(start, at)); } catch { invalid('invalid string'); }
        units += value.length;
        if (!wellFormed(value) || value.length > MAX_TOKEN || units > MAX_TEXT) invalid('malformed or oversized string/key text');
        return value;
      }
      if (char.charCodeAt(0) < 32) invalid('unescaped control character');
      if (char === '\\') {
        const escape = text[at++];
        if (escape === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(at, at + 4))) invalid('invalid Unicode escape');
          at += 4;
        } else if (!['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(escape)) invalid('invalid string escape');
      }
    }
    invalid('unterminated string');
  }
  function value(depth, path = []) {
    if (++nodes > MAX_NODES || depth > 64) invalid('JSON exceeds node/depth budget');
    whitespace();
    const char = text[at];
    if (char === '"') return string();
    if (char === '{') {
      at++; whitespace();
      const result = Object.create(null), keys = new Set();
      if (text[at] === '}') { at++; return result; }
      for (;;) {
        if (text[at] !== '"') invalid('expected object key');
        const key = string();
        if (keys.has(key)) invalid('duplicate decoded object key');
        keys.add(key); whitespace();
        if (text[at++] !== ':') invalid('expected colon');
        result[key] = value(depth + 1, [...path, key]); whitespace();
        if (text[at] === '}') { at++; return result; }
        if (text[at++] !== ',') invalid('expected object comma');
        whitespace();
      }
    }
    if (char === '[') {
      at++; whitespace();
      const result = [];
      if (text[at] === ']') { at++; return result; }
      for (;;) {
        if (result.length === MAX_ARRAY) invalid('array exceeds entry bound');
        result.push(value(depth + 1, [...path, result.length])); whitespace();
        if (text[at] === ']') { at++; return result; }
        if (text[at++] !== ',') invalid('expected array comma');
      }
    }
    for (const [literal, parsed] of [['true', true], ['false', false], ['null', null]]) {
      if (text.startsWith(literal, at)) { at += literal.length; return parsed; }
    }
    const start = at;
    while (at < text.length && !/[\s,}\]]/.test(text[at])) {
      if (at - start >= (allowsMembershipNumber(path, mode) ? MAX_TOKEN : 17)) invalid('oversized numeric token');
      at++;
    }
    const token = text.slice(start, at), parsed = Number(token);
    const finite = allowsMembershipNumber(path, mode);
    const grammar = finite ? /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/ : /^-?(?:0|[1-9][0-9]*)$/;
    if (!grammar.test(token) || (finite ? !validMembershipNumber(parsed) : !Number.isSafeInteger(parsed) || Object.is(parsed,-0))) invalid('invalid numeric token for this contract path');
    return parsed;
  }
  const result = value(0); whitespace();
  if (at !== text.length) invalid('trailing JSON content');
  return result;
}

