export const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
// Validation without allocating a discarded serialization. Event validation
// needs the safety checks, while chapter hashing later encodes the same data.
export function validateCanonical(value) {
  const ancestors=[];
  function visit(v) {
    if(v===null||typeof v==='boolean'||typeof v==='bigint')return;
    if(typeof v==='string'){if(!v.isWellFormed())throw new TypeError('Malformed Unicode');return;}
    if(typeof v==='number'){if(!Number.isSafeInteger(v))throw new TypeError('Only safe integer numbers are canonical');return;}
    if(typeof v!=='object'||ancestors.includes(v))throw new TypeError('Unsupported or cyclic canonical value');
    const array=Array.isArray(v);
    if(!array&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)throw new TypeError('Plain records required');
    if(Object.getOwnPropertySymbols(v).length)throw new TypeError('Symbol keys unsupported');
    const keys=Object.keys(v).sort(compare);
    if(array&&keys.length!==v.length)throw new TypeError('Dense arrays required');
    ancestors.push(v);
    for(let i=0;i<keys.length;i++) {
      const k=array?String(i):keys[i],d=Object.getOwnPropertyDescriptor(v,k);
      if(!d||!('value' in d))throw new TypeError('Data properties required');
      if(!array&&!k.isWellFormed())throw new TypeError('Malformed Unicode');
      visit(d.value);
    }
    ancestors.pop();
  }
  visit(value);return value;
}
// Entries are installed only after recursively validating and freezing every
// descendant. Weak identity memoisation has no iteration or causal state.
const immutableBytes = new WeakMap();
export function canonicalString(value, freeze = false) {
  const ancestors = [];
  function encode(v) {
    if (v === null) return 'null';
    if (typeof v === 'string') {
      if (!v.isWellFormed()) throw new TypeError('Malformed Unicode');
      return JSON.stringify(v);
    }
    if (typeof v === 'boolean') return String(v);
    if (typeof v === 'bigint') return JSON.stringify(String(v));
    if (typeof v === 'number') {
      if (!Number.isSafeInteger(v)) throw new TypeError('Only safe integer numbers are canonical');
      return String(v);
    }
    if (typeof v !== 'object' || ancestors.includes(v)) throw new TypeError('Unsupported or cyclic canonical value');
    const cached = immutableBytes.get(v);
    if (cached !== undefined) return cached;
    if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw new TypeError('Plain records required');
    if (Object.getOwnPropertySymbols(v).length) throw new TypeError('Symbol keys unsupported');
    ancestors.push(v);
    let result;
    if (Array.isArray(v)) {
      if (Object.keys(v).length !== v.length) throw new TypeError('Dense arrays required');
      result = '[' + Array.from({ length: v.length }, (_, i) => {
        const d = Object.getOwnPropertyDescriptor(v, String(i));
        if (!d || !('value' in d)) throw new TypeError('Dense data arrays required');
        return encode(d.value);
      }).join(',') + ']';
    } else {
      result = '{' + Object.keys(v).sort(compare).map(k => {
        const d = Object.getOwnPropertyDescriptor(v, k);
        if (!('value' in d)) throw new TypeError('Accessors unsupported');
        return encode(k) + ':' + encode(d.value);
      }).join(',') + '}';
    }
    ancestors.pop();
    if (freeze) {
      Object.freeze(v);
      // Avoid retaining an additional history-sized chapter string.
      if (result.length < 65536) immutableBytes.set(v, result);
    }
    return result;
  }
  return encode(value);
}
export const canonicalBytes = value => Buffer.from(canonicalString(value), 'utf8');
export const freezeCanonical = value => { canonicalString(value, true); return value; };
