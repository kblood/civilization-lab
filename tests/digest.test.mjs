import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canonicalBytes, canonicalString } from '../src/canonical.mjs';
import { sha256Hex, merkleRoot } from '../src/digest.mjs';
import { createToy, digestChapters } from '../src/toy.mjs';
import { createManifest, manifestDigest } from '../src/manifest.mjs';
test('canonical sorted bytes, decimal BigInts and strict input domain', () => {
  assert.equal(canonicalString({ z: 2n, a: { y: -3n, x: 1 } }), '{"a":{"x":1,"y":"-3"},"z":"2"}');
  assert.equal(sha256Hex(canonicalBytes({ b: 2, a: 1 })), sha256Hex(canonicalBytes({ a: 1, b: 2 })));
  assert.equal(canonicalString(100000000000000000000n), '"100000000000000000000"');
  assert.equal(canonicalString(-0), '0');
  assert.equal(canonicalString({ '\ue000': 1, '😀': 2 }), '{"😀":2,"":1}');
  for (const bad of [1.5, NaN, Infinity, undefined, () => 1, new Map(), new Set(), { x: undefined }, [undefined], Array(1), '\ud800', Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => canonicalBytes(bad));
  const cyclic = {}; cyclic.self = cyclic; assert.throws(() => canonicalBytes(cyclic));
  assert.throws(() => canonicalBytes({ get x() { return 1; } }));
});
test('independent Merkle roots: empty, one, two, three and five leaves', () => {
  const v = JSON.parse(readFileSync(new URL('./vectors/merkle.json', import.meta.url)));
  assert.deepEqual(v.cases.map(x => x.leavesUtf8.length), [0, 1, 2, 3, 5]);
  for (const x of v.cases) assert.equal(merkleRoot(x.leavesUtf8.map(s => Buffer.from(s))), x.root);
  assert.notEqual(merkleRoot([Buffer.from('a')]), sha256Hex(Buffer.from('a')));
});
test('effects affect result; observations and key insertion order do not; manifest is pinned', () => {
  const toy = createToy('civ-toy-1', { ticks: 100 }), c = toy.chapter(0), root = toy.resultDigest();
  assert.ok(c.events.length > 0);
  const changed = structuredClone(c); changed.events[0].effects[0].amount = '999999';
  assert.notEqual(digestChapters([changed]), root);
  toy.materialisation.note = 'viewed'; toy.materialisation.chapters.push(999);
  assert.equal(toy.annual(0).status, 'ok');
  assert.equal(toy.resultDigest(), root);
  const m = createManifest();
  assert.equal(m.manifestVersion, 'civ-manifest-1'); assert.equal(m.tickYears, 10);
  assert.equal(m.chapterTicks, 640); assert.equal(m.envEpochYears, 1000); assert.deepEqual(m.atlasVersions, {});
  assert.match(manifestDigest(m), /^[0-9a-f]{64}$/);
  assert.equal(manifestDigest(m), manifestDigest(Object.fromEntries(Object.entries(m).reverse())));
  assert.notEqual(manifestDigest(m), manifestDigest({ ...m, arithmeticVersion: 'changed' }));
  assert.ok(Object.isFrozen(m.scenarioPriors));
});
