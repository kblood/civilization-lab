// Guard rail: source files must not use wall-clock time or unseeded randomness.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const FORBIDDEN = [/\bDate\.now\s*\(/, /\bnew\s+Date\s*\(/, /\bMath\.random\s*\(/, /\bperformance\.now\s*\(/, /\bcrypto\.getRandomValues\s*\(/, /\brandomUUID\s*\(/, /\bprocess\.hrtime\b/];
const LOCALE = /\blocaleCompare\b/;
const TRANSCENDENTAL = /\bMath\s*\.\s*(?:exp|expm1|log|log1p|log2|log10|pow|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|cbrt|hypot)\s*\(/;

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
    const rules = [...FORBIDDEN, LOCALE, ...(basename(file) === 'fixed.mjs' ? [] : [TRANSCENDENTAL])];
    for (const re of rules) if (re.test(text)) offenders.push(`${file}: ${re}`);
  }
  assert.deepEqual(offenders, []);
});

test('lint negative self-checks detect every forbidden family', () => {
  const samples = ['Date.now()', 'new Date()', 'Math.random()', 'performance.now()', 'crypto.getRandomValues(a)', 'randomUUID()', 'process.hrtime.bigint()'];
  for (let i = 0; i < FORBIDDEN.length; i++) assert.ok(FORBIDDEN[i].test(samples[i]));
  for (const name of ['exp', 'log', 'pow', 'sin', 'cos', 'atan2', 'hypot', 'log1p']) assert.ok(TRANSCENDENTAL.test(`Math.${name}(x)`));
  assert.ok(LOCALE.test('a.localeCompare(b)'));
  assert.equal(TRANSCENDENTAL.test('Math.floor(x)'), false);
});

test('runtime imports stay local; refiners and P have no narrative or Atlas imports', () => {
  for (const file of listSources(root)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) {
      const path = match[1];
      assert.ok(path.startsWith('./') || path.startsWith('node:'), `${file}: ${path}`);
      assert.equal(/atlas|narrative/.test(path), false, `${file}: ${path}`);
    }
  }
});
