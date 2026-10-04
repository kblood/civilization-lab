import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createToy } from '../src/toy.mjs';
export const GOLDEN = 'c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc';
test('toy golden, same seed twice, different seed, and fresh Node child process', () => {
  const root = createToy().resultDigest();
  assert.equal(root, GOLDEN);
  assert.equal(createToy().resultDigest(), root);
  assert.notEqual(createToy('civ-toy-2').resultDigest(), root);
  const child = spawnSync(process.execPath, ['src/cli.mjs', '--digest'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8', timeout: 1500,
  });
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stderr, '');
  assert.equal(child.stdout.trim(), root);
  assert.match(child.stdout, /^[0-9a-f]{64}\r?\n$/);
});
