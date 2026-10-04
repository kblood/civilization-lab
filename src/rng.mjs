import { logPos, positiveQ32 } from './fixed.mjs';
import { compare } from './canonical.mjs';
export const PURPOSES = Object.freeze(['evt.toy.magnitude', 'evt.war.campaign', 'haz.boom',
  'haz.plague', 'haz.toy', 'nar.name', 'nar.arc', 'nar.polity', 'nar.culture', 'nar.settlement', 'pol.split.part', 'ref.cell.site', 'ref.cell.anchor', 'ref.cell.local', 'haz.FIRST_CONTACT',
  'haz.MIGRATION', 'haz.AGRICULTURE', 'haz.PLAGUE', 'haz.NATURAL_CATASTROPHE',
  'haz.DISCOVERY', 'haz.DIFFUSION', 'haz.POLITY_FOUNDING', 'haz.WAR',
  'haz.FRAGMENTATION', 'haz.REVOLUTION', 'haz.SCHISM', 'haz.COLLAPSE',
  'haz.NUCLEAR_WAR', 'haz.ENGINEERED_PANDEMIC', 'haz.RUNAWAY_TECH', 'haz.LAUNCH', 'haz.VOYAGE_LOST',
  'orig.rate.0', 'orig.rate.1', 'orig.rate.2', 'orig.step.0', 'orig.step.1', 'orig.step.2',
  'prior.learning', 'prior.innovation', 'prior.nuclear', 'prior.pandemic', 'prior.runaway', 'prior.shared', 'prior.colonizer',
  'evt.sapience.regions', 'evt.migration.fraction', 'evt.plague.loss', 'evt.natural.loss', 'evt.natural.duration',
  'out.NATURAL_CATASTROPHE', 'evt.collapse.drop', 'evt.revolution.regime', 'evt.schism.coordinate',
  'evt.conquest.win', 'evt.perils.drop', 'evt.perils.shared', 'out.NUCLEAR_WAR', 'out.ENGINEERED_PANDEMIC',
  'out.RUNAWAY_TECH', 'evt.launch.destination', 'arc.colonizer'].sort(compare));
const MOD = 1n << 64n, MASK = MOD - 1n;
function integer(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || Object.is(value, -0)) throw new TypeError('Canonical integer required');
  return BigInt(value);
}
export function encodeFields(fields) {
  return Buffer.concat(fields.map(value => {
    let tag, payload;
    if (typeof value === 'string') {
      if (!value.isWellFormed()) throw new TypeError('Lone surrogate');
      tag = 'S'; payload = Buffer.from(value, 'utf8');
    } else if (value instanceof Uint8Array) {
      tag = 'B'; payload = Buffer.from(value);
    } else {
      tag = 'I'; payload = Buffer.from(String(integer(value)), 'ascii');
    }
    const header = Buffer.alloc(5);
    header[0] = tag.charCodeAt(0); header.writeUInt32BE(payload.length, 1);
    return Buffer.concat([header, payload]);
  }));
}
export function keyBytes(addr, attempt = 0) {
  if (!PURPOSES.includes(addr.purpose)) throw new RangeError('Unregistered RNG purpose');
  const strings = [addr.worldSeed, addr.manifestDigest, addr.level, addr.entityId, addr.purpose];
  if (strings.some(s => typeof s !== 'string')) throw new TypeError('String address fields required');
  return encodeFields(['civ-rng-1', ...strings, integer(addr.episodeOrBucket), integer(addr.ordinal), integer(attempt)]);
}
export function fnv1a64(bytes) {
  let h = 14695981039346656037n;
  for (const b of bytes) h = ((h ^ BigInt(b)) * 1099511628211n) & MASK;
  return h;
}
export function mix64(z) {
  z = integer(z) & MASK;
  z = ((z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n) & MASK;
  z = ((z ^ (z >> 27n)) * 0x94D049BB133111EBn) & MASK;
  return z ^ (z >> 31n);
}
export const key64 = (addr, attempt = 0) => mix64(fnv1a64(keyBytes(addr, attempt)));
export function draw(key, n) {
  n = integer(n);
  if (n < 0n) throw new RangeError('Negative counter');
  return mix64((integer(key) + (n + 1n) * 0x9E3779B97F4A7C15n) & MASK);
}
export const u53 = (addr, i = 0) => draw(key64(addr), i) >> 11n;
// drawFn is a test seam only; production callers always use counter-mode draw.
export function belowWithAttempt(addr, n, i = 0, drawFn = draw) {
  if (typeof n !== 'bigint' || n < 1n || n > MOD) throw new RangeError('below domain is 1..2^64 BigInt');
  const limit = MOD - MOD % n;
  for (let attempt = 0; attempt < 128; attempt++) {
    const d = drawFn(key64(addr, attempt), i);
    if (typeof d !== 'bigint' || d < 0n || d >= MOD) throw new RangeError('Invalid draw');
    if (d < limit) return { value: d % n, acceptedAttempt: attempt };
  }
  throw Object.assign(new Error('RNG_EXHAUSTED'), { code: 'RNG_EXHAUSTED' });
}
export const below = (addr, n, i = 0, drawFn = draw) => belowWithAttempt(addr, n, i, drawFn).value;
export function chance(addr, ppm, i = 0) {
  if (!Number.isSafeInteger(ppm) || ppm < 0 || ppm > 1000000) throw new RangeError('Invalid ppm');
  return below(addr, 1000000n, i) < BigInt(ppm);
}
export function expQ32FromU52(u52) {
  if (typeof u52 !== 'bigint' || u52 < 0n || u52 >= (1n << 52n)) throw new RangeError('Invalid u52');
  return positiveQ32(-logPos((Number(u52) + 0.5) / 4503599627370496));
}
export const expQ32 = (addr, i = 0) => expQ32FromU52(draw(key64(addr), i) >> 12n);
export function weightedPick(addr, items, i = 0) {
  const sorted = [...items].sort((a, b) => compare(a.id, b.id));
  let total = 0n;
  for (let j = 0; j < sorted.length; j++) {
    const { id, weight } = sorted[j];
    if (typeof id !== 'string' || !id.isWellFormed() || (j && id === sorted[j - 1].id) || typeof weight !== 'bigint' || weight < 0n) throw new TypeError('Unique IDs and nonnegative integer weights required');
    total += weight;
  }
  let r = below(addr, total, i);
  for (const item of sorted) { if (r < item.weight) return item; r -= item.weight; }
  throw new Error('Unreachable weighted pick');
}
export function sortedUniformYears(addr, count, from, until) {
  if (![count, from, until].every(Number.isSafeInteger) || count < 0 || until <= from) throw new RangeError('Invalid year sample');
  return Array.from({ length: count }, (_, index) => ({
    year: Number(BigInt(from) + below(addr, BigInt(until) - BigInt(from), index)), index,
  })).sort((a, b) => compare(a.year, b.year) || compare(a.index, b.index));
}
