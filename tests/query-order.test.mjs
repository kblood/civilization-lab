import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createToy, WRONG_sequentialRoot } from '../src/toy.mjs';
test('forward, reverse checkpoints, fixed shuffle, cold replay and refinement-first agree', () => {
  const toy = createToy('civ-toy-1', { ticks: 1920 });
  const root = toy.resultDigest([0, 1, 2]);
  assert.deepEqual(toy.checkpoints.map(c => c.tick), [0, 640, 1280, 1920]);
  for (const cp of toy.checkpoints) {
    assert.deepEqual(Object.keys(cp).sort(), ['state', 'tick']);
    assert.deepEqual(Object.keys(cp.state).sort(), ['capacity', 'hazards', 'pop']);
    assert.ok(cp.state.hazards.every((h, i, all) => !i || all[i - 1].key < h.key));
  }
  // A new instance seeking the last chapter builds causal checkpoints while
  // replaying; earlier queries then resume from the corresponding checkpoint.
  const reverse = createToy('civ-toy-1', { ticks: 1920 });
  assert.equal(reverse.resultDigest([2, 1, 0]), root);
  assert.equal(createToy('civ-toy-1', { ticks: 1920 }).resultDigest([1, 0, 2]), root);
  assert.equal(createToy('civ-toy-1', { ticks: 1920 }).resultDigest([2, 0, 1], { cold: true }), root);
  const refined = createToy('civ-toy-1', { ticks: 1920 });
  for (const tick of [1281, 3, 640]) assert.equal(refined.annual(tick).status, 'ok');
  assert.equal(refined.resultDigest([1, 2, 0]), root);
  toy.clearCache(); assert.equal(toy.resultDigest([2, 1, 0]), root);
  assert.throws(() => toy.resultDigest([0, 0, 1]));
});
test('negative control: shared sequential stream changes roots with query order', () => {
  assert.notEqual(WRONG_sequentialRoot('civ-toy-1', [0, 1]), WRONG_sequentialRoot('civ-toy-1', [1, 0]));
});
