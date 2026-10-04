import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createToy, aggregate, refineAnnual, WRONG_refineWritesParent, bevertonHolt } from '../src/toy.mjs';
import { checkProjection, refine, LEVELS } from '../src/levels.mjs';
import { floorDiv } from '../src/time.mjs';
test('every tick of 1000 years projects exactly; annual samples stay nonnegative; debits use remaining stock', () => {
  const toy = createToy('civ-toy-1', { ticks: 100 }), c = toy.chapter(0);
  assert.equal(c.ledgers.length, 100);
  assert.ok(c.events.some(e => e.kind === 'PLAGUE'));
  assert.ok(c.events.some(e => e.kind === 'BOOM'));
  for (let tick = 0; tick < 100; tick++) {
    const ledger = c.ledgers[tick], result = toy.annual(tick);
    assert.equal(result.status, 'ok');
    assert.deepEqual(aggregate(result.value), ledger);
    let remaining = c.starts[tick].pop + ledger.naturalDelta[0].pop;
    for (const e of c.events.filter(e => e.tick === String(tick))) {
      const expected = floorDiv(remaining * BigInt(e.params.permille), 1000n) * (e.kind === 'BOOM' ? 1n : -1n);
      assert.equal(BigInt(e.effects[0].amount), expected);
      remaining += expected; assert.ok(remaining >= 0n);
    }
    assert.equal(remaining, ledger.endState.pop);
    for (let j = 0; j < 11; j++) {
      const s = result.value.samples[j];
      assert.ok(s.pop >= 0n);
      assert.equal(s.pop, j === 10 ? ledger.endState.pop : c.starts[tick].pop + floorDiv(BigInt(j) * ledger.naturalDelta[0].pop, 10n));
    }
    if (tick < 99) assert.equal(result.value.samples[10].pop, c.starts[tick + 1].pop);
  }
});
test('write-back and independent annual changes fail; caller parent is never adjusted', () => {
  const toy = createToy('civ-toy-1', { ticks: 100 }), c = toy.chapter(0), ledger = structuredClone(c.ledgers[0]);
  const def = { start: c.starts[0], events: c.events.filter(e => e.tick === '0') }, before = structuredClone(ledger);
  const bad = checkProjection(def, ledger, { tick: 0 }, WRONG_refineWritesParent, aggregate);
  assert.deepEqual(bad, { status: 'REFINEMENT_CONTRACT_ERROR', reason: 'parent-mutated' });
  assert.deepEqual(ledger, before);
  const independentRoll = (d, p, a) => { const child = refineAnnual(d, p, a); child.samples[3].pop++; return child; };
  assert.equal(checkProjection(def, ledger, { tick: 0 }, independentRoll, aggregate).status, 'REFINEMENT_CONTRACT_ERROR');
  assert.equal(refine({ static: def, refine: refineAnnual, aggregate }, ledger, { tick: 0 }).status, 'ok');
  assert.equal(checkProjection({}, { n: 1n }, {}, () => ({ n: '1' }), x => x).status, 'REFINEMENT_CONTRACT_ERROR');
  assert.equal(checkProjection({}, { n: 1n }, {}, () => ({}), x => x).status, 'REFINEMENT_CONTRACT_ERROR');
  assert.deepEqual(LEVELS.map(l => l.id), ['C', 'D', 'H', 'N', 'P']);
  assert.equal(LEVELS.find(l => l.id === 'C').causal, false);
  assert.equal(LEVELS.find(l => l.id === 'P').causal, true);
});
test('Beverton-Holt zero cases, overshoot decline and integer floor', () => {
  assert.equal(bevertonHolt(0n, 0n, 0), 0n);
  assert.equal(bevertonHolt(0n, 100n, 100000), 0n);
  assert.equal(bevertonHolt(100n, 0n, 0), 0n);
  assert.equal(bevertonHolt(100n, 200n, 0), 100n);
  assert.equal(bevertonHolt(100n, 200n, 100000), 104n);
  const declining = bevertonHolt(200n, 100n, 100000);
  assert.ok(declining >= 100n && declining < 200n);
});
