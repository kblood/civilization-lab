import { canonicalBytes, compare, freezeCanonical, validateCanonical } from './canonical.mjs';
import { freezeGenerated } from './witness.mjs';
import { encodeFields } from './rng.mjs';
import { floorDiv } from './time.mjs';
import { kindOf } from './catalogue.mjs';
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
export const compareEvents = (a, b) => compare(a.dateYear,b.dateYear)||compare(a.phase,b.phase)||compare(a.ownerId,b.ownerId)||compare(a.kindRank,b.kindRank)||compare(a.intentKey,b.intentKey);
function sortedUnique(items, key) {
  return items.every((x, i) => !i || compareTuple(key(items[i - 1]), key(x)) < 0);
}
const validatedEvents=new WeakSet();
export function validateEvent(e) {
  if(validatedEvents.has(e))return e;
  const fail = () => { throw new TypeError('Invalid CivEvent'); };
  if (!e || typeof e !== 'object') fail();
  const m2 = e.modelVersion === 'civ-m2-1';
  const row = m2 && kindOf(e.kind);
  const kind = m2 ? row && { rank: row.kindRank, level: row.owner } : KINDS.find(k => k.kind === e.kind);
  if (!kind || e.kindRank !== kind.rank || e.level !== kind.level || !text(e.ownerId) ||
      !decimal(e.tick) || !Number.isSafeInteger(e.dateYear) || BigInt(e.tick) !== floorDiv(BigInt(e.dateYear), 10n) ||
      !bounded(e.phase, 0, 5) || !bounded(e.ordinal, 0, Number.MAX_SAFE_INTEGER) ||
      !['decade', 'year'].includes(e.precision) || !/^[hcmt]:/.test(e.intentKey) ||
      e.id !== eventId(e.ownerId, e.kind, e.tick, e.intentKey) || e.forced !== false ||
      !bounded(e.salience, 0, 1000) || (!m2 && e.modelVersion !== MODEL_VERSION)) fail();
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
  if (m2) {
    const keys = ['id','ordinal','kind','kindRank','level','ownerId','intentKey','refs','tick','dateYear','precision','phase','trigger','causes','params','effects','chain','salience','forced','modelVersion','resolution','reason','data'];
    if (Object.keys(e).sort(compare).join('|') !== keys.sort(compare).join('|') || e.id.length > 65536 ||
      !['accepted','pre-empted'].includes(e.resolution) || !(e.reason === null || text(e.reason)) ||
      !e.data || Object.keys(e.data).sort(compare).join('|') !== 'launch|outcome|sets|source|stage|survivor|target' ||
      !Array.isArray(e.data.sets) || !sortedUnique(e.data.sets, s => [s.target,s.field]) || e.refs.some(r=>r.entityId.length>65536)) fail();
    for (const x of e.effects) {
      if (!row.writes.includes(x.field) || Object.keys(x).sort(compare).join('|') !== (x.op==='transfer'?'amount|field|op|target|to|toField':'amount|field|op|target') || x.op==='scale') fail();
      if (x.op === 'transfer' ? !text(x.toField) : ('to' in x || 'toField' in x)) fail();
      if (x.op === 'transfer' && !row.writes.includes(x.toField)) fail();
      if (x.op === 'set' && (x.amount !== '0' || !e.data.sets.some(s=>s.target===x.target&&s.field===x.field))) fail();
    }
    if(e.data.sets.some(s=>!e.effects.some(x=>x.op==='set'&&s.target===x.target&&s.field===x.field)))fail();
    if(e.data.sets.some(s=>Object.keys(s).sort(compare).join('|')!=='field|target|value'))fail();
    if(e.resolution==='pre-empted'&&e.effects.length)fail();
    const paramsByKind={SAPIENCE:['regionCount'],MIGRATION:['fraction'],AGRICULTURE:['domainIndex','targetTier'],DISCOVERY:['domainIndex','targetTier'],DIFFUSION:['domainIndex','targetTier'],
      FAMINE:['damage','lossPermille'],PLAGUE:['OUTBREAK','SPREAD'].includes(e.data.stage)?['lossPermille']:[],WAR:e.data.stage==='CAMPAIGN'?['lossPermille']:[],TECH_LOSS:['domainIndex','drop'],
      ENERGY_TRANSITION:['fromEra','toEra'],POLITY_FOUNDING:[],CONQUEST:['winPpm','won'],COLLAPSE:['drop','splitCount'],RECOVERY:[],EXTINCTION:[]};
    if(row.milestone==='M2a'&&Object.keys(e.params).sort(compare).join('|')!==paramsByKind[e.kind].sort(compare).join('|'))fail();
  }
  validateCanonical(e); // Reject unsupported values even in optional fields.
  return e;
}
export function sortEvents(events) {
  const sorted = events.map(validateEvent).sort(compareEvents);
  const groups = new Map();
  const ids = sorted.map(e => e.id).sort(compare);
  if (ids.some((id, i) => i && id === ids[i - 1])) throw new TypeError('Duplicate event ID');
  for (let i=0;i<sorted.length;i++) {
    let e=sorted[i];
    const key = JSON.stringify([e.ownerId, e.kind, e.tick]);
    let group = groups.get(key);
    if (!group) { group = { key, next: 0 }; groups.set(key, group); }
    const ordinal=group.next++;
    if(e.ordinal!==ordinal||!Object.isFrozen(e))e=sorted[i]={...e,ordinal};
    if(e.modelVersion==='civ-m2-1'){freezeGenerated(e);validatedEvents.add(e);}
  }
  return sorted;
}
export function tickLedger({ arcId, tick, startState, naturalDelta, eventIds, endState, phase0, polityNatural, archived }) {
  if (!text(arcId) || !decimal(String(tick)) || !/^[a-f0-9]{64}$/.test(startState) ||
      !Array.isArray(naturalDelta) || !naturalDelta.every(x => text(x.regionId) && typeof x.pop === 'bigint') ||
      !sortedUnique(naturalDelta, x => [x.regionId]) || !Array.isArray(eventIds) || !eventIds.every(text)) throw new TypeError('Invalid tick ledger');
  const record = { arcId, tick: String(tick), startState, naturalDelta, eventIds, endState };
  if (phase0 !== undefined) Object.assign(record, {phase0,polityNatural,archived});
  if (phase0 !== undefined) freezeCanonical(record);
  else canonicalBytes(record);
  return record;
}
