import { floorDiv } from './time.mjs';
import { canonicalBytes, canonicalString, compare } from './canonical.mjs';
import { sha256Hex, merkleRoot } from './digest.mjs';
import { createManifest, manifestDigest, deepFreeze, TOY_INPUT } from './manifest.mjs';
import { createHazard, advanceHazard } from './hazard.mjs';
import { below, draw, key64 } from './rng.mjs';
import { eventId, hazardIntent, sortEvents, tickLedger, MODEL_VERSION } from './events.mjs';
import { checkProjection } from './levels.mjs';

export function bevertonHolt(pop, capacity, g) {
  if (typeof pop !== 'bigint' || typeof capacity !== 'bigint' || pop < 0n || capacity < 0n ||
      !Number.isSafeInteger(g) || g < 0) throw new RangeError('Invalid population parameters');
  if (pop === 0n || capacity === 0n) return 0n;
  return floorDiv(pop * capacity * (1000000n + BigInt(g)), 1000000n * capacity + BigInt(g) * pop);
}
export function createDefinition(seed = 'civ-toy-1', ticks = 1280) {
  if (typeof seed !== 'string' || !seed.isWellFormed() || !Number.isSafeInteger(ticks) || ticks < 1 || ticks > 1920) throw new RangeError('Toy horizon is 1..1920 ticks');
  const manifest = createManifest();
  const md = manifestDigest(manifest);
  return deepFreeze({ seed, ticks, manifest, manifestDigest: md,
    recipeDigest: sha256Hex(canonicalBytes({ seed, manifest, ticks })), ...TOY_INPUT });
}
function genesis(def) {
  return { pop: def.initialPop, capacity: def.capacity,
    hazards: def.hazards.map(h => createHazard(def, { ownerId: def.regionId, kind: h.kind }))
      .sort((a, b) => compare(a.key, b.key)) };
}
const stateDigest = state => sha256Hex(canonicalBytes(state));
function magnitudeAddress(def, id) {
  return { worldSeed: def.seed, manifestDigest: def.rngManifestDigest??def.manifestDigest, level: 'P', entityId: id,
    purpose: 'evt.toy.magnitude', episodeOrBucket: 0, ordinal: 0 };
}
function step(def, state, tick, magnitude = below) {
  const intents = [], hazards = [];
  for (const entry of state.hazards) {
    const config = def.hazards.find(h => h.kind === entry.hazardId.kind);
    const next = advanceHazard(def, entry, config.h_q32, state.pop > 0n);
    hazards.push(next.entry);
    for (const firing of next.firings) {
      const { H_start, distance, h, episode } = firing.evidence;
      const kind = config.kind === 'boom' ? 'BOOM' : 'PLAGUE';
      const intentKey = hazardIntent(entry.key, episode);
      const id = eventId(def.regionId, kind, tick, intentKey);
      const permille = BigInt(config.minPermille) + magnitude(magnitudeAddress(def, id), BigInt(config.spanPermille));
      intents.push({ id, ordinal: 0, kind, kindRank: kind === 'BOOM' ? 0 : 1, level: 'P',
        ownerId: def.regionId, intentKey, refs: [{ role: 'arc', entityId: def.arcId }],
        tick: String(tick), dateYear: tick * 10 + firing.yearOffset, precision: 'year', phase: 2,
        trigger: { mode: 'hazard', hazardId: entry.key, episode: String(episode), H_start_q32: String(H_start),
          distance_q32: String(distance), h_q32: String(h), saturated: firing.saturated === true },
        causes: [], params: { permille: String(permille) }, effects: [], chain: null,
        salience: kind === 'BOOM' ? 100 : 300, forced: false, modelVersion: MODEL_VERSION });
    }
  }
  const natural = bevertonHolt(state.pop, state.capacity, def.g);
  let pop = natural;
  const events = sortEvents(intents);
  for (const e of events) {
    // Fractions always read the stock remaining at this event's turn.
    const amount = floorDiv(pop * BigInt(e.params.permille), 1000n) * (e.kind === 'BOOM' ? 1n : -1n);
    pop += amount;
    e.effects = [{ target: def.regionId, field: 'pop', op: 'add', amount: String(amount) }];
  }
  const endState = { pop, capacity: state.capacity, hazards: hazards.sort((a, b) => compare(a.key, b.key)) };
  const ledger = tickLedger({ arcId: def.arcId, tick, startState: stateDigest(state),
    naturalDelta: [{ regionId: def.regionId, pop: natural - state.pop }], eventIds: events.map(e => e.id), endState });
  return { ledger, events, start: state };
}

// Chapters are cached values; checkpoints contain only causal boundary state.
export function createToy(seed = 'civ-toy-1', { ticks = 1280 } = {}) {
  const def = createDefinition(seed, ticks);
  let checkpoints = [deepFreeze({ tick: 0, state: genesis(def) })];
  let cache = [];
  const materialisation = { chapters: [], annualTicks: [] };
  function rememberCheckpoint(tick, state) {
    if (!checkpoints.some(c => c.tick === tick)) {
      checkpoints.push(deepFreeze({ tick, state }));
      checkpoints.sort((a, b) => compare(a.tick, b.tick));
    }
  }
  function chapter(index, { cold = false } = {}) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= Math.ceil(def.ticks / 640)) throw new RangeError('outside-model-range');
    const cached = !cold && cache.find(c => c.chapter === index);
    if (cached) return cached;
    const from = index * 640, until = Math.min(from + 640, def.ticks);
    const cp = cold ? { tick: 0, state: genesis(def) } : checkpoints.filter(c => c.tick <= from).at(-1);
    let state = cp.state;
    const ledgers = [], events = [], starts = [];
    for (let tick = cp.tick; tick < until; tick++) {
      const out = step(def, state, tick);
      if (tick >= from) { ledgers.push(out.ledger); events.push(...out.events); starts.push(state); }
      state = out.ledger.endState;
      if ((tick + 1) % 640 === 0) rememberCheckpoint(tick + 1, state);
    }
    const result = deepFreeze({ arcId: def.arcId, chapter: index, ledgers, events: sortEvents(events), starts });
    if (!cold) { cache.push(result); cache.sort((a, b) => compare(a.chapter, b.chapter)); }
    if (!materialisation.chapters.includes(index)) { materialisation.chapters.push(index); materialisation.chapters.sort(compare); }
    return result;
  }
  function annual(tick) {
    if (!Number.isSafeInteger(tick) || tick < 0 || tick >= def.ticks) throw new RangeError('outside-model-range');
    const c = chapter(floorDiv(tick, 640));
    const i = tick % 640, ledger = c.ledgers[i];
    const result = checkProjection({ start: c.starts[i], events: c.events.filter(e => e.tick === ledger.tick) }, ledger,
      { tick }, refineAnnual, aggregate);
    if (!materialisation.annualTicks.includes(tick)) { materialisation.annualTicks.push(tick); materialisation.annualTicks.sort(compare); }
    return result;
  }
  return { def, materialisation, chapter, annual,
    get checkpoints() { return structuredClone(checkpoints); },
    clearCache() { cache = []; checkpoints = [deepFreeze({ tick: 0, state: genesis(def) })]; },
    resultDigest(order = Array.from({ length: Math.ceil(def.ticks / 640) }, (_, i) => i), options = {}) {
      const expected = Array.from({ length: Math.ceil(def.ticks / 640) }, (_, i) => i);
      if (canonicalString([...order].sort(compare)) !== canonicalString(expected)) throw new RangeError('Every chapter must appear exactly once');
      return digestChapters(order.map(i => chapter(i, options)));
    } };
}
export function digestChapters(chapters) {
  return merkleRoot([...chapters].sort((a, b) => compare(a.arcId, b.arcId) || compare(a.chapter, b.chapter))
    .map(({ arcId, chapter, ledgers, events }) => canonicalBytes({ arcId, chapter, ledgers, events })));
}
export function refineAnnual(def, ledger, address) {
  if (String(address.tick) !== ledger.tick || stateDigest(def.start) !== ledger.startState) throw new Error('Invalid refinement input');
  const naturalEnd = def.start.pop + ledger.naturalDelta[0].pop;
  const samples = Array.from({ length: 11 }, (_, j) => ({ year: Number(ledger.tick) * 10 + j,
    pop: j === 10 ? ledger.endState.pop : def.start.pop + floorDiv(BigInt(j) * ledger.naturalDelta[0].pop, 10n) }));
  return { arcId: ledger.arcId, tick: ledger.tick, regionId: ledger.naturalDelta[0].regionId,
    start: structuredClone(def.start), naturalEnd, events: structuredClone(def.events),
    boundary: structuredClone(ledger.endState), samples };
}
export function aggregate(child) {
  const { start, samples, naturalEnd } = child;
  const delta = naturalEnd - start.pop;
  if (samples.length !== 11 || samples.some((s, j) => s.year !== Number(child.tick) * 10 + j || s.pop < 0n ||
      (j < 10 && s.pop !== start.pop + floorDiv(BigInt(j) * delta, 10n)))) throw new Error('Invalid annual path');
  const events = sortEvents(child.events);
  let pop = naturalEnd;
  for (const e of events) {
    if (e.tick !== child.tick) throw new Error('Event outside contract');
    for (const effect of e.effects) {
      if (effect.target !== child.regionId || effect.field !== 'pop' || effect.op !== 'add') throw new Error('Invalid toy effect');
      pop += BigInt(effect.amount);
      if (pop < 0n) throw new Error('Negative population');
    }
  }
  if (pop !== samples[10].pop || pop !== child.boundary.pop) throw new Error('End boundary mismatch');
  return tickLedger({ arcId: child.arcId, tick: child.tick, startState: stateDigest(start),
    naturalDelta: [{ regionId: child.regionId, pop: delta }], eventIds: events.map(e => e.id),
    endState: { ...child.boundary, pop } });
}

// NEGATIVE CONTROLS ONLY. No production solver calls either variant.
export function WRONG_refineWritesParent(def, ledger, address) {
  ledger.naturalDelta[0].pop += 1n;
  return refineAnnual(def, ledger, address);
}
export function WRONG_sequentialRoot(seed, order) {
  const def = createDefinition(seed);
  const k = key64(magnitudeAddress(def, 'WRONG-shared'));
  let counter = 0n;
  const shared = (_addr, n) => draw(k, counter++) % n;
  const chapters = [];
  for (const index of order) {
    // Each query replays from genesis, consuming one shared mutable stream.
    let state = genesis(def);
    const ledgers = [], events = [];
    for (let tick = 0; tick < (index + 1) * 640; tick++) {
      const out = step(def, state, tick, shared);
      state = out.ledger.endState;
      if (tick >= index * 640) { ledgers.push(out.ledger); events.push(...out.events); }
    }
    chapters.push({ arcId: def.arcId, chapter: index, ledgers, events: sortEvents(events) });
  }
  return digestChapters(chapters);
}
