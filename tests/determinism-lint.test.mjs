// Guard rail: source files must not use wall-clock time or unseeded randomness.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const FORBIDDEN = [/\bDate\.now\s*\(/, /\bnew\s+Date\s*\(/, /\bMath\.random\s*\(/, /\bperformance\.now\s*\(/, /\bcrypto\.getRandomValues\s*\(/, /\brandomUUID\s*\(/];

function listSources(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listSources(p));
    else if (/\.(mjs|js|ts)$/.test(name)) out.push(p);
  }
  return out;
}

test('src/ has no clock or unseeded randomness', () => {
  const offenders = [];
  for (const file of listSources(root)) {
    const text = readFileSync(file, 'utf8');
    for (const re of FORBIDDEN) if (re.test(text)) offenders.push(`${file}: ${re}`);
  }
  assert.deepEqual(offenders, []);
});
