import { eventId, MODEL_VERSION } from '../src/events.mjs';
export function event(overrides = {}) {
  const e = { ordinal: 0, kind: 'PLAGUE', kindRank: 1, level: 'P', ownerId: 'region:r00',
    intentKey: 'h:abc:0', refs: [], tick: '0', dateYear: 1, precision: 'year', phase: 2,
    trigger: { mode: 'hazard', hazardId: 'abc', episode: '0', H_start_q32: '0', distance_q32: '1', h_q32: '10' },
    causes: [], params: {}, effects: [], chain: null, salience: 100, forced: false, modelVersion: MODEL_VERSION, ...overrides };
  return { ...e, id: eventId(e.ownerId, e.kind, e.tick, e.intentKey) };
}
