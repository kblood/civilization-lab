import { canonicalBytes, compare } from './canonical.mjs';
import { encodeFields } from './rng.mjs';
import { floorDiv } from './time.mjs';
export const MODEL_VERSION = 'civ-toy-1';
export const KINDS = Object.freeze([
  Object.freeze({ kind: 'BOOM', rank: 0, level: 'P' }),
  Object.freeze({ kind: 'PLAGUE', rank: 1, level: 'P' }),
]);
const decimal = x => typeof x === 'string' && /^(0|-?[1-9][0-9]*)$/.test(x);
const text = x => typeof x === 'string' && x.length > 0 && x.isWellFormed();
const bounded = (x, a, b) => Number.isSafeInteger(x) && x >= a && x <= b;
const tuple = fields => encodeFields(fields).toString('hex');
export const hazardIntent = (hazardKey, episode) => `h:${hazardKey}:${episode}`;
export const chainIntent = (id, step) => `c:${id}:${step}`;
export const messageIntent = id => `m:${id}`;
export const thresholdIntent = id => `t:${tuple([id])}`;
export function eventId(ownerId, kind, tick, intentKey) {
  if (![ownerId, kind, intentKey].every(text) || [ownerId, kind].some(s => s.includes('|')) || !decimal(String(tick))) throw new TypeError('Invalid event identity');
  return `${ownerId}|${kind}|${tick}|${intentKey}`;
}
export const orderKey = e => [e.dateYear, e.phase, e.ownerId, e.kindRank, e.intentKey];
function compareTuple(a, b) {
  for (let i = 0; i < a.length; i++) { const c = compare(a[i], b[i]); if (c) return c; }
  return 0;
}
export const compareEvents = (a, b) => compareTuple(orderKey(a), orderKey(b));
function sortedUnique(items, key) {
  return items.every((x, i) => !i || compareTuple(key(items[i - 1]), key(x)) < 0);
}
export function validateEvent(e) {
  const fail = () => { throw new TypeError('Invalid CivEvent'); };
  if (!e || typeof e !== 'object') fail();
  const kind = KINDS.find(k => k.kind === e.kind);
  if (!kind || e.kindRank !== kind.rank || e.level !== kind.level || !text(e.ownerId) ||
      !decimal(e.tick) || !Number.isSafeInteger(e.dateYear) || BigInt(e.tick) !== floorDiv(BigInt(e.dateYear), 10n) ||
      !bounded(e.phase, 0, 5) || !bounded(e.ordinal, 0, Number.MAX_SAFE_INTEGER) ||
      !['decade', 'year'].includes(e.precision) || !/^[hcmt]:/.test(e.intentKey) ||
      e.id !== eventId(e.ownerId, e.kind, e.tick, e.intentKey) || e.forced !== false ||
      !bounded(e.salience, 0, 1000) || e.modelVersion !== MODEL_VERSION) fail();
  if (!Array.isArray(e.refs) || !e.refs.every(r => text(r.role) && text(r.entityId)) ||
      !sortedUnique(e.refs, r => [r.role, r.entityId])) fail();
  const edges = ['TRIGGERED', 'RAISED_HAZARD', 'ENABLED', 'CHAIN', 'EXOGENOUS'];
  if (!Array.isArray(e.causes) || !e.causes.every(c => text(c.eventId) && edges.includes(c.edge) && bounded(c.weightPermille, 0, 1000)) ||
      !sortedUnique(e.causes, c => [c.eventId, c.edge])) fail();
  const t = e.trigger;
  if (!t || !['exogenous', 'threshold', 'hazard', 'chain', 'scheduled'].includes(t.mode)) fail();
  if (t.mode === 'hazard' && (!text(t.hazardId) || !decimal(t.episode) || BigInt(t.episode) < 0n ||
      ![t.H_start_q32, t.distance_q32, t.h_q32].every(decimal) || BigInt(t.H_start_q32) < 0n ||
      BigInt(t.distance_q32) <= 0n || BigInt(t.distance_q32) > BigInt(t.h_q32))) fail();
  if (t.saturated !== undefined && typeof t.saturated !== 'boolean') fail();
  if (t.mode === 'threshold' && (!t.crossed || !text(t.crossed.var) || !decimal(t.crossed.value) || !decimal(t.crossed.threshold))) fail();
  if (!e.params || Array.isArray(e.params) || Object.getPrototypeOf(e.params) !== Object.prototype ||
      !Object.keys(e.params).sort(compare).every(k => decimal(e.params[k]))) fail();
  if (!Array.isArray(e.effects) || !e.effects.every(x => text(x.target) && text(x.field) &&
      ['add', 'set', 'scale', 'transfer'].includes(x.op) && decimal(x.amount) &&
      (x.op !== 'transfer' || (text(x.to) && BigInt(x.amount) >= 0n)))) fail();
  if (e.chain !== null && (!e.chain || !text(e.chain.chainId) || !bounded(e.chain.step, 0, Number.MAX_SAFE_INTEGER) ||
      !decimal(e.chain.deadlineTick) || !['active', 'complete', 'fail', 'invalidate', 'timeout'].includes(e.chain.status))) fail();
  canonicalBytes(e); // Reject unsupported values even in optional fields.
  return e;
}
export function sortEvents(events) {
  const sorted = events.map(e => ({ ...validateEvent(e) })).sort(compareEvents);
  const groups = [];
  const ids = sorted.map(e => e.id).sort(compare);
  if (ids.some((id, i) => i && id === ids[i - 1])) throw new TypeError('Duplicate event ID');
  for (const e of sorted) {
    const key = tuple([e.ownerId, e.kind, BigInt(e.tick)]);
    let group = groups.find(g => g.key === key);
    if (!group) { group = { key, next: 0 }; groups.push(group); groups.sort((a, b) => compare(a.key, b.key)); }
    e.ordinal = group.next++;
  }
  return sorted;
}
export function tickLedger({ arcId, tick, startState, naturalDelta, eventIds, endState }) {
  if (!text(arcId) || !decimal(String(tick)) || !/^[a-f0-9]{64}$/.test(startState) ||
      !Array.isArray(naturalDelta) || !naturalDelta.every(x => text(x.regionId) && typeof x.pop === 'bigint') ||
      !sortedUnique(naturalDelta, x => [x.regionId]) || !Array.isArray(eventIds) || !eventIds.every(text)) throw new TypeError('Invalid tick ledger');
  const record = { arcId, tick: String(tick), startState, naturalDelta, eventIds, endState };
  canonicalBytes(record);
  return record;
}
