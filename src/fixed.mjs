import { floorDiv } from './time.mjs';
export { ceilDiv } from './time.mjs';
export const ONE = 2n ** 32n;
export function mulDiv(a, b, c) {
  if ([a, b, c].some(x => typeof x !== 'bigint')) throw new TypeError('BigInt required');
  return floorDiv(a * b, c);
}
export const mulQ32 = (a, b) => mulDiv(a, b, ONE);
export const divQ32 = (a, b) => mulDiv(a, ONE, b);
// Exact algorithm port of universe-atlas/src/det-math.ts (type annotations removed).
// Domain: finite x > 0, as in Atlas.
export function logPos(x) {
  let e = 0;
  while (x > 2) {
    x *= 0.5;
    e++;
  }
  while (x < 1) {
    x *= 2;
    e--;
  }
  const t = (x - 1) / (x + 1);
  let v = t,
    s = t;
  for (let i = 3; i < 24; i += 2) {
    v *= t * t;
    s += v / i;
  }
  return 2 * s + e * 0.6931471805599453;
}
export function positiveQ32(e) {
  if (!Number.isFinite(e) || !Number.isFinite(e * 4294967296)) throw new RangeError('Finite Q32 input required');
  const q = BigInt(Math.floor(e * 4294967296));
  return q < 1n ? 1n : q;
}
