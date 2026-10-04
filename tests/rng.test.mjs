import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as rng from '../src/rng.mjs';
const v = JSON.parse(readFileSync(new URL('./vectors/civ-rng-1.json', import.meta.url)));
const addr = v.keys[0].addr;
test('independent mix64, counter, FNV, encoding, key and u53 vectors', () => {
  for (const x of v.mix64) assert.equal(rng.mix64(BigInt(x.in)), BigInt(x.out));
  for (const x of v.counter) assert.equal(rng.draw(BigInt(x.key), x.n), BigInt(x.out));
  for (const x of v.fnv1a64Plain) assert.equal(rng.fnv1a64(Buffer.from(x.utf8)), BigInt(x.fnv1a64));
  for (const x of v.keys) {
    const bytes = rng.keyBytes(x.addr, x.attempt);
    assert.equal(bytes.toString('hex'), x.keyBytesHex);
    assert.equal(rng.fnv1a64(bytes), BigInt(x.fnv1a64));
    assert.equal(rng.key64(x.addr, x.attempt), BigInt(x.key64));
    for (const [j, n] of [0, 1, 2, 1000].entries()) assert.equal(rng.draw(BigInt(x.key64), n), BigInt(x.draws[j]));
    assert.equal(rng.u53(x.addr), BigInt(x.u53_i0));
  }
});
test('encoding is typed, unambiguous and rejects invalid input', () => {
  assert.equal(rng.encodeFields(['a', 'bc']).toString('hex'), v.aliasEncoding.a_bc);
  assert.equal(rng.encodeFields(['ab', 'c']).toString('hex'), v.aliasEncoding.ab_c);
  assert.notDeepEqual(rng.encodeFields(['a', 'bc']), rng.encodeFields(['ab', 'c']));
  assert.equal(rng.encodeFields([new Uint8Array([255]), -12n]).toString('hex'), '4200000001ff49000000032d3132');
  for (const bad of ['\ud800', '\udfff', -0, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, null]) assert.throws(() => rng.encodeFields([bad]));
  assert.notDeepEqual(rng.encodeFields(['1']), rng.encodeFields([1]));
  assert.deepEqual(rng.encodeFields([1]), rng.encodeFields([1n]));
  assert.throws(() => rng.key64({ ...addr, purpose: 'not.registered' }));
  assert.ok(Object.isFrozen(rng.PURPOSES));
  assert.deepEqual(rng.PURPOSES, [...rng.PURPOSES].sort());
});
test('addressed draws and all rejection vectors, boundaries and exhaustion', () => {
  const k = rng.key64(addr), direct = rng.draw(k, 1000);
  for (let n = 0; n < 1000; n++) rng.draw(k, n);
  assert.equal(rng.draw(k, 1000), direct);
  for (const x of [...v.below, v.belowForcedRejection]) {
    assert.deepEqual(rng.belowWithAttempt(x.addr, BigInt(x.n), x.i), { value: BigInt(x.value), acceptedAttempt: x.acceptedAttempt });
  }
  const x = v.belowForcedRejection;
  assert.equal(rng.draw(rng.key64(x.addr, 0), 0), BigInt(x.attempt0Draw));
  assert.ok(BigInt(x.attempt0Draw) >= BigInt(x.limit));
  assert.equal(rng.below(addr, 1n), 0n);
  assert.ok(rng.below(addr, 1n << 32n) < (1n << 32n));
  for (const n of [0n, -1n, (1n << 64n) + 1n, 1]) assert.throws(() => rng.below(addr, n));
  let attempts = 0;
  assert.throws(() => rng.below(addr, (1n << 63n) + 1n, 0, () => { attempts++; return (1n << 64n) - 1n; }), { code: 'RNG_EXHAUSTED' });
  assert.equal(attempts, 128);
});
test('exponential vectors, strict positivity and exact endpoint goldens', () => {
  for (const x of v.expQ32) {
    const actual = x.addr ? rng.expQ32(x.addr, x.i) : rng.expQ32FromU52(BigInt(x.u52));
    const difference = actual - BigInt(x.expQ32Ref);
    assert.ok(difference >= -1n && difference <= 1n);
    assert.ok(actual >= 1n);
  }
  assert.equal(rng.expQ32FromU52(0n), 157783357006n);
  assert.equal(rng.expQ32FromU52((1n << 52n) - 1n), 1n);
});
test('chance, sorted weighted selection and uniform year tie order', () => {
  assert.equal(rng.chance(addr, 0), false);
  assert.equal(rng.chance(addr, 1000000), true);
  assert.throws(() => rng.chance(addr, 1000001));
  const items = [{ id: 'z', weight: 3n }, { id: 'a', weight: 7n }, { id: 'b', weight: 0n }];
  assert.deepEqual(rng.weightedPick(addr, items), rng.weightedPick(addr, [...items].reverse()));
  const roll = rng.below(addr, 10n);
  assert.equal(rng.weightedPick(addr, items).id, roll < 7n ? 'a' : 'z');
  assert.throws(() => rng.weightedPick(addr, [{ id: 'a', weight: 0n }]));
  assert.throws(() => rng.weightedPick(addr, [items[0], items[0]]));
  const years = rng.sortedUniformYears(addr, 10, -2, 1);
  assert.equal(years.length, 10);
  assert.ok(years.every((x, i) => x.year >= -2 && x.year < 1 && (!i || years[i - 1].year < x.year || (years[i - 1].year === x.year && years[i - 1].index < x.index))));
});
