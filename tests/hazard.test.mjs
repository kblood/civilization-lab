import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceHazard, createHazard, hazardKey, threshold } from '../src/hazard.mjs';
import { ONE } from '../src/fixed.mjs';
import { compareEvents, hazardIntent } from '../src/events.mjs';
import { event } from './helpers.mjs';
const def = { seed: 'hazard-tests', manifestDigest: '0'.repeat(64) };
const id = { ownerId: 'r', kind: 'plague' };
function reference(entry, h, next) {
  let H = entry.H_q32, E = entry.E_q32, episode = entry.episode, saturated = false;
  const years = [];
  for (let year = 0; year < 10; year++) {
    H += h / 10n;
    while (H >= E) {
      if (years.length === 4) { H = 0n; saturated = true; break; }
      H -= E; years.push(year); episode++; E = next(def, id, episode);
    }
    if (saturated) break;
  }
  return { years, H, E, episode, saturated };
}
test('cumulative crossings equal independent yearly accumulation, including 2nd/3rd and cap', () => {
  const fixtures = [
    { first: 2n, rest: 3n, H: 0n, count: 3, years: [1, 4, 7] },
    { first: 3n, rest: 3n, H: 2n, count: 4, years: [0, 3, 6, 9] },
    { first: 1n, rest: 1n, H: 0n, count: 4, years: [0, 1, 2, 3] },
    { first: 20n, rest: 3n, H: 0n, count: 0, years: [] },
  ];
  for (const f of fixtures) {
    const entry = { ...createHazard(def, id), E_q32: f.first * ONE, H_q32: f.H * ONE };
    const next = () => f.rest * ONE, h = 10n * ONE;
    const out = advanceHazard(def, entry, h, true, next), ref = reference(entry, h, next);
    assert.deepEqual(out.firings.map(e => e.yearOffset), f.years);
    assert.equal(out.firings.length, f.count);
    assert.deepEqual(out.firings.map(e => e.yearOffset), ref.years);
    assert.equal(out.entry.H_q32, ref.H); assert.equal(out.entry.E_q32, ref.E); assert.equal(out.entry.episode, ref.episode);
    assert.equal(out.firings.at(-1)?.saturated === true, ref.saturated);
    assert.ok(out.entry.H_q32 >= 0n && out.entry.H_q32 < out.entry.E_q32);
    for (const [i, e] of out.firings.entries()) {
      assert.ok(e.yearOffset >= 0 && e.yearOffset <= 9);
      assert.ok(e.evidence.distance > 0n && e.evidence.distance <= h);
      assert.equal(e.evidence.H_start, entry.H_q32);
      assert.equal(e.evidence.episode, BigInt(i));
    }
    if (ref.saturated) { assert.equal(out.firings[3].saturated, true); assert.equal(out.entry.H_q32, 0n); }
  }
});
test('zero hazard and ineligibility pause exactly; resumption preserves episode', () => {
  const entry = { ...createHazard(def, id), H_q32: 1n, E_q32: 10n };
  for (const [h, eligible] of [[0n, true], [100n, false]]) {
    const out = advanceHazard(def, entry, h, eligible, () => { throw new Error('must not draw'); });
    assert.deepEqual(out.entry, entry); assert.deepEqual(out.firings, []);
  }
  assert.equal(advanceHazard(def, entry, 1n).entry.H_q32, 2n);
});
test('structured identities distinguish domains, optional presence, tiers and edges; causes break ties', () => {
  const a = { ...id, domain: 'food' }, b = { ...id, domain: 'energy' };
  assert.notEqual(threshold(def, a, 0n), threshold(def, b, 0n));
  assert.notEqual(hazardKey(id), hazardKey({ ...id, domain: '' }));
  assert.notEqual(hazardKey({ ...a, targetTier: 1 }), hazardKey({ ...a, targetTier: 2 }));
  assert.notEqual(hazardKey({ ...a, edgeId: 'a>b' }), hazardKey({ ...a, edgeId: 'b>a' }));
  assert.equal(threshold({ ...def, tick: 99 }, a, 0n), threshold(def, a, 0n));
  const ea = event({ intentKey: hazardIntent(hazardKey(a), 0n) });
  const eb = event({ intentKey: hazardIntent(hazardKey(b), 0n) });
  assert.notEqual(compareEvents(ea, eb), 0);
  assert.equal(compareEvents(ea, eb), -compareEvents(eb, ea));
});
