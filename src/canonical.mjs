export const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export function canonicalString(value) {
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
    return result;
  }
  return encode(value);
}
export const canonicalBytes = value => Buffer.from(canonicalString(value), 'utf8');
