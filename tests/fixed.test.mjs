import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logPos, mulDiv, ceilDiv, ONE, mulQ32, divQ32, positiveQ32 } from '../src/fixed.mjs';
import { floorDiv } from '../src/time.mjs';
test('ported logPos is within one Q32 ulp over fixed binary/mantissa grid', () => {
  for (const exponent of [-100, -53, -32, -10, -1, 0, 1, 10, 32, 53, 100]) {
    for (let m = 16; m <= 32; m++) {
      const x = m / 16 * 2 ** exponent;
      assert.ok(Math.abs(logPos(x) - Math.log(x)) <= 2 ** -32, `x=${x}`);
    }
  }
});
test('floor, ceil and Q32 rounding directions', () => {
  assert.equal(ONE, 4294967296n);
  assert.equal(floorDiv(-1, 10), -1);
  assert.equal(floorDiv(-1n, 10n), -1n);
  for (const [a, b, floor, ceil] of [[-11, 10, -2, -1], [11, -10, -2, -1], [-11, -10, 1, 2], [10, 10, 1, 1]]) {
    assert.equal(floorDiv(a, b), floor); assert.equal(ceilDiv(a, b), ceil);
    assert.equal(floorDiv(BigInt(a), BigInt(b)), BigInt(floor)); assert.equal(ceilDiv(BigInt(a), BigInt(b)), BigInt(ceil));
  }
  assert.equal(mulDiv(-5n, 3n, 2n), -8n);
  assert.equal(mulDiv(5n, 3n, 2n), 7n);
  assert.equal(mulQ32(ONE / 2n, ONE / 2n), ONE / 4n);
  assert.equal(divQ32(ONE, 2n * ONE), ONE / 2n);
  assert.equal(positiveQ32(0), 1n);
  assert.equal(positiveQ32(1.5), ONE + ONE / 2n);
  assert.throws(() => positiveQ32(Infinity));
  assert.throws(() => floorDiv(1, 0));
  assert.throws(() => floorDiv(1n, 2));
});
