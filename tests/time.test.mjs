import { test } from 'node:test';
import assert from 'node:assert/strict';
import { YEAR_NS, CIV_MAX_YEAR, floorDiv, ceilDiv, yearFromNs, bucket, bucketInterval, interval, intersection, contains } from '../src/time.mjs';
test('Atlas year constant, negative nanoseconds and explicit outside-model-range', () => {
  assert.equal(YEAR_NS, 31557600000000000n);
  assert.equal(yearFromNs(-1n), -1);
  assert.equal(yearFromNs(-YEAR_NS), -1);
  assert.equal(yearFromNs(-YEAR_NS - 1n), -2);
  assert.equal(yearFromNs(BigInt(CIV_MAX_YEAR) * YEAR_NS), CIV_MAX_YEAR);
  for (const ns of [(BigInt(CIV_MAX_YEAR) + 1n) * YEAR_NS, -BigInt(CIV_MAX_YEAR) * YEAR_NS - 1n]) assert.deepEqual(yearFromNs(ns), { status: 'outside-model-range' });
});
test('division remains exact at safe-integer limits and only valid nesting edges', () => {
  for (const y of [-CIV_MAX_YEAR, -CIV_MAX_YEAR + 1, -6401, -1, 0, 6399, 6400, CIV_MAX_YEAR - 1, CIV_MAX_YEAR]) {
    for (const w of [1, 10, 100, 1000, 6400]) {
      const a = BigInt(y), b = BigInt(w);
      const expected = a / b - (a < 0n && a % b ? 1n : 0n);
      assert.equal(floorDiv(y, w), Number(expected));
      assert.equal(ceilDiv(y, w), Number(expected + (a % b ? 1n : 0n)));
      assert.equal(bucket(y, w), Number(expected));
      assert.ok(contains(bucketInterval(y, w), BigInt(y)));
    }
    for (const [small, large] of [[1, 10], [10, 100], [100, 6400], [10, 1000]]) assert.equal(floorDiv(bucket(y, small), large / small), bucket(y, large));
  }
  // Negative near-limit division must round toward minus infinity.
  assert.equal(floorDiv(-9007199254740991, 2), -4503599627370496);
  assert.equal(bucket(-1, 'chapter'), -1);
});
test('millennia cross chapter boundaries; half-open membership and intersection', () => {
  assert.deepEqual(intersection(bucketInterval(6300, 'millennium'), bucketInterval(6300, 'chapter')), interval(6000n, 6400n));
  assert.deepEqual(intersection(bucketInterval(6400, 'millennium'), bucketInterval(6400, 'chapter')), interval(6400n, 7000n));
  assert.equal(intersection(interval(0, 10), interval(10, 20)), null);
  assert.equal(contains(interval(-10, 0), -10), true);
  assert.equal(contains(interval(-10, 0), 0), false);
  assert.equal(contains(interval(1, 1), 1), false);
  assert.throws(() => interval(2, 1));
});
