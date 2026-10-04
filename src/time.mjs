export const YEAR_NS = 31_557_600n * 10n ** 9n;
export const CIV_MAX_YEAR = Number.MAX_SAFE_INTEGER;
export const WIDTHS = Object.freeze({ year: 1, decade: 10, tick: 10, century: 100,
  millennium: 1000, envEpoch: 1000, chapter: 6400 });

function operands(a, b) {
  if (typeof a !== typeof b || !['number', 'bigint'].includes(typeof a)) throw new TypeError('Matching integer types required');
  if (typeof a === 'number' && (!Number.isSafeInteger(a) || !Number.isSafeInteger(b))) throw new RangeError('Safe integers required');
  if (b === 0 || b === 0n) throw new RangeError('Division by zero');
  return [BigInt(a), BigInt(b)];
}
export function floorDiv(a, b) {
  const [x, y] = operands(a, b);
  let q = x / y;
  if (x % y !== 0n && (x < 0n) !== (y < 0n)) q--;
  return typeof a === 'number' ? Number(q) : q;
}
export function ceilDiv(a, b) {
  const [x, y] = operands(a, b);
  const q = -floorDiv(-x, y);
  return typeof a === 'number' ? Number(q) : q;
}
export function yearFromNs(ns) {
  if (typeof ns !== 'bigint') throw new TypeError('Nanoseconds must be BigInt');
  const y = floorDiv(ns, YEAR_NS);
  return y < -BigInt(CIV_MAX_YEAR) || y > BigInt(CIV_MAX_YEAR)
    ? { status: 'outside-model-range' } : Number(y);
}
export function bucket(year, width) {
  const w = typeof width === 'string' ? WIDTHS[width] : width;
  if (!Number.isSafeInteger(w) || w <= 0) throw new RangeError('Positive safe width required');
  return floorDiv(year, typeof year === 'bigint' ? BigInt(w) : w);
}
export function interval(from, until) {
  if (typeof from !== typeof until || !['number', 'bigint'].includes(typeof from) ||
      (typeof from === 'number' && (!Number.isSafeInteger(from) || !Number.isSafeInteger(until))) || from > until) throw new RangeError('Invalid interval');
  return { from, until };
}
export const contains = ({ from, until }, value) => from <= value && value < until;
export function intersection(a, b) {
  const from = a.from > b.from ? a.from : b.from;
  const until = a.until < b.until ? a.until : b.until;
  return from < until ? interval(from, until) : null;
}
// BigInt endpoints keep the boundary beyond the last safe year exact.
export function bucketInterval(year, width) {
  const w = BigInt(typeof width === 'string' ? WIDTHS[width] : width);
  if (w <= 0n) throw new RangeError('Positive width required');
  const from = floorDiv(BigInt(year), w) * w;
  return interval(from, from + w);
}
