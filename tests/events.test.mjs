import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortEvents, validateEvent, orderKey, compareEvents, chainIntent, messageIntent, thresholdIntent } from '../src/events.mjs';
import { event } from './helpers.mjs';
test('insertion independent IDs, total key, intent tie-break and dense group ordinals', () => {
  const input = [event({ intentKey: 'h:z:0' }), event({ intentKey: 'h:a:0' }),
    event({ intentKey: 'h:b:0', kind: 'BOOM', kindRank: 0 }),
    event({ intentKey: 'h:c:0', ownerId: 'other', dateYear: 0 }),
    event({ intentKey: 'h:d:0', dateYear: 5 }), event({ tick: '1', dateYear: 10 })];
  const sorted = sortEvents(input);
  for (const shuffled of [[...input].reverse(), [input[3], input[1], input[5], input[0], input[4], input[2]]]) assert.deepEqual(sortEvents(shuffled), sorted);
  assert.deepEqual(sorted.filter(e => e.ownerId === 'region:r00' && e.kind === 'PLAGUE' && e.tick === '0').map(e => [e.intentKey, e.ordinal]), [['h:a:0', 0], ['h:z:0', 1], ['h:d:0', 2]]);
  assert.equal(sorted.at(-1).ordinal, 0);
  assert.deepEqual(orderKey(input[0]), [1, 2, 'region:r00', 1, 'h:z:0']);
  assert.ok(sorted.every((e, i) => !i || compareEvents(sorted[i - 1], e) < 0));
  assert.deepEqual(input.map(e => e.ordinal), [0, 0, 0, 0, 0, 0]);
  assert.equal(sortEvents([input[0]])[0].id, input[0].id);
  assert.throws(() => sortEvents([input[0], input[0]]));
  assert.match(chainIntent('x', 1), /^c:/); assert.match(messageIntent('x'), /^m:/); assert.match(thresholdIntent('x'), /^t:/);
});
test('schema rejects invalid event fields, nested records and identity mismatch', () => {
  assert.equal(validateEvent(event()).kind, 'PLAGUE');
  const bad = [{ id: 'bad' }, { tick: '01' }, { tick: '1' }, { dateYear: 1.5 }, { phase: 6 }, { ordinal: -1 },
    { kindRank: 9 }, { kind: 'UNKNOWN' }, { level: 'N' }, { precision: 'hour' }, { forced: true }, { salience: 1001 },
    { modelVersion: 'other' }, { intentKey: 'bad' }, { params: { loss: '01' } }, { params: { loss: 1 } },
    { refs: [{ role: 'z', entityId: 'a' }, { role: 'a', entityId: 'b' }] },
    { causes: [{ eventId: 'a', edge: 'BAD', weightPermille: 10 }] },
    { effects: [{ target: 'r', field: 'pop', op: 'transfer', amount: '1' }] }, { chain: {} },
    { trigger: { mode: 'hazard', hazardId: 'a', episode: '0', H_start_q32: '0', distance_q32: '11', h_q32: '10' } },
    { trigger: { mode: 'hazard', hazardId: 'a', episode: '0', H_start_q32: '0', distance_q32: '0', h_q32: '10' } }];
  for (const patch of bad) assert.throws(() => validateEvent({ ...event(), ...patch }), JSON.stringify(patch));
});
