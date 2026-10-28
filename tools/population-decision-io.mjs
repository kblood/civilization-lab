/** Bounded local-file IO for the opt-in population decision authoring CLI. */
import {constants} from 'node:fs';
import {mkdir, open, realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isAbsolute, join, resolve} from 'node:path';
import {TextDecoder} from 'node:util';
import {canonicalString} from '../src/canonical.mjs';
import {parseMembershipJson,membershipCanonicalString,validMembershipNumber,allowsMembershipNumber} from '../src/membership-json.mjs';

export const MIB = 1024 * 1024;
export const MAX_INPUT_BYTES = 192 * MIB;
const MAX_NODES = 1000000;
const MAX_TEXT = 32 * MIB;
const MAX_TOKEN = 65536;
const MAX_ARRAY = 250000;
const fail = message => { throw new TypeError(message); };

export function originalPin(bytes) {
  return {sha256: createHash('sha256').update(bytes).digest('hex'), byteLength: bytes.length};
}

/** Resolve invocation paths against cwd and source paths against the request's
 * directory. Reject Windows aliases even when invoked on another platform. */
export function localPath(value, base, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4096 || !value.isWellFormed() || value.includes('\0')) fail(`${label}: invalid local path`);
  if (/^[\\/]{2}/.test(value) || /^\\[?.]\\/.test(value)) fail(`${label}: UNC and device paths are not supported`);
  const drive = /^[A-Za-z]:[\\/]/.test(value);
  if (/^[A-Za-z]:/.test(value) && !drive) fail(`${label}: drive-relative paths are not supported`);
  if (!drive && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) fail(`${label}: URLs are not supported`);
  const rest = drive ? value.slice(2) : value;
  if (/[:<>"|?*\u0000-\u001f]/.test(rest)) fail(`${label}: alternate streams or invalid path characters`);
  for (const part of rest.split(/[\\/]/)) {
    if (part === '' || part === '.' || part === '..') continue;
    if (/[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(part)) fail(`${label}: reserved local path component`);
  }
  if (drive && !isAbsolute(value)) fail(`${label}: this platform does not support that absolute drive path`);
  return resolve(base, value);
}

/** Parse the original text before generic JSON materialization can hide
 * duplicate decoded keys or normalize a noncanonical numeric token. */
export function parseBoundedJson(text, label = 'JSON') {
  if (!text.length || text.charCodeAt(0) === 0xfeff) fail(`${label}: empty JSON or BOM is not supported`);
  let at = 0, nodes = 0, units = 0;
  const invalid = message => fail(`${label}: ${message} at UTF-16 offset ${at}`);
  function whitespace() {
    while (at < text.length && (text[at] === ' ' || text[at] === '\n' || text[at] === '\r' || text[at] === '\t')) at++;
  }
  function string() {
    const start = at++;
    while (at < text.length) {
      if (at - start > 6 * MAX_TOKEN + 2) invalid('string/key exceeds token bound');
      const char = text[at++];
      if (char === '"') {
        let value;
        try { value = JSON.parse(text.slice(start, at)); } catch { invalid('invalid string'); }
        units += value.length;
        if (!value.isWellFormed() || value.length > MAX_TOKEN || units > MAX_TEXT) invalid('malformed or oversized string/key text');
        return value;
      }
      if (char.charCodeAt(0) < 32) invalid('unescaped control character');
      if (char === '\\') {
        const escape = text[at++];
        if (escape === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(at, at + 4))) invalid('invalid Unicode escape');
          at += 4;
        } else if (!['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(escape)) invalid('invalid string escape');
      }
    }
    invalid('unterminated string');
  }
  function value(depth) {
    if (++nodes > MAX_NODES || depth > 64) invalid('JSON exceeds node/depth budget');
    whitespace();
    const char = text[at];
    if (char === '"') return string();
    if (char === '{') {
      at++; whitespace();
      const result = Object.create(null), keys = new Set();
      if (text[at] === '}') { at++; return result; }
      for (;;) {
        if (text[at] !== '"') invalid('expected object key');
        const key = string();
        if (keys.has(key)) invalid('duplicate decoded object key');
        keys.add(key); whitespace();
        if (text[at++] !== ':') invalid('expected colon');
        result[key] = value(depth + 1); whitespace();
        if (text[at] === '}') { at++; return result; }
        if (text[at++] !== ',') invalid('expected object comma');
        whitespace();
      }
    }
    if (char === '[') {
      at++; whitespace();
      const result = [];
      if (text[at] === ']') { at++; return result; }
      for (;;) {
        if (result.length === MAX_ARRAY) invalid('array exceeds entry bound');
        result.push(value(depth + 1)); whitespace();
        if (text[at] === ']') { at++; return result; }
        if (text[at++] !== ',') invalid('expected array comma');
      }
    }
    for (const [literal, parsed] of [['true', true], ['false', false], ['null', null]]) {
      if (text.startsWith(literal, at)) { at += literal.length; return parsed; }
    }
    const start = at;
    while (at < text.length && !/[\s,}\]]/.test(text[at])) {
      if (at - start >= 17) invalid('unsafe numeric token');
      at++;
    }
    const token = text.slice(start, at), parsed = Number(token);
    if (!/^-?(?:0|[1-9][0-9]*)$/.test(token) || !Number.isSafeInteger(parsed) || Object.is(parsed, -0)) invalid('only canonical safe integer numeric tokens are supported');
    return parsed;
  }
  const result = value(0); whitespace();
  if (at !== text.length) invalid('trailing JSON content');
  return result;
}

/** Each resolved input pathname is opened/read once. fstat and bounded reads
 * reject nonregular files, growth, truncation and over-budget inputs. */
export function createInputReader() {
  const cache = new Map();
  let totalBytes = 0;
  return async function readInput(path, maxBytes, role, numericMode = 'strict') {
    const actualPath = await realpath(path);
    if (cache.has(actualPath)) {
      const saved = cache.get(actualPath);
      if (saved.bytes.length > maxBytes) fail(`${role}: exceeds ${maxBytes} byte bound`);
      totalBytes += saved.bytes.length;
      if (totalBytes > MAX_INPUT_BYTES) fail('Request and source roles exceed 192 MiB aggregate original bytes');
      return {...saved, parsed: numericMode === saved.numericMode ? saved.parsed : parseMembershipJson(saved.text, role, numericMode)};
    }
    const handle = await open(actualPath, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0));
    let bytes;
    try {
      const before = await handle.stat({bigint: true});
      if (!before.isFile()) fail(`${role}: a regular file is required`);
      if (before.size < 1n || before.size > BigInt(maxBytes)) fail(`${role}: empty or oversized file (limit ${maxBytes} bytes)`);
      if (totalBytes + Number(before.size) > MAX_INPUT_BYTES) fail('Request and source roles exceed 192 MiB aggregate original bytes');
      // One extra byte observes growth without ever reading an unbounded file.
      const buffer = Buffer.alloc(Number(before.size) + 1);
      let length = 0;
      while (length < buffer.length) {
        const next = await handle.read(buffer, length, buffer.length - length, null);
        if (next.bytesRead === 0) break;
        length += next.bytesRead;
      }
      const after = await handle.stat({bigint: true});
      if (length !== Number(before.size) || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs) fail(`${role}: file changed during read`);
      bytes = buffer.subarray(0, length);
    } finally { await handle.close(); }
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) fail(`${role}: UTF-8 BOM is not supported`);
    let text;
    try { text = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes); }
    catch { fail(`${role}: malformed UTF-8`); }
    const parsed = numericMode === 'strict' ? parseBoundedJson(text, role) : parseMembershipJson(text, role, numericMode);
    const result = {bytes, parsed, pin: originalPin(bytes), realPath: actualPath, text, numericMode};
    totalBytes += bytes.length; cache.set(actualPath, result);
    return result;
  };
}

/** Bound composed artifacts before encoding, including the combined Atlas
 * transport rather than just each independently bounded input ledger. */
export function encodeJson(value, label, maxBytes = 32 * MIB, numericMode = 'strict') {
  let nodes = 0, units = 0, byteLength = 0;
  const ancestors = new Set();
  function token(text) {
    units += text.length;
    if (!text.isWellFormed() || text.length > MAX_TOKEN || units > MAX_TEXT) fail(`${label}: text exceeds bounds`);
    byteLength += Buffer.byteLength(JSON.stringify(text));
  }
  function visit(current, depth, path = []) {
    if (++nodes > MAX_NODES || depth > 64) fail(`${label}: node/depth budget exceeded`);
    if (typeof current === 'string') token(current);
    else if (current === null || typeof current === 'boolean') byteLength += String(current).length;
    else if (typeof current === 'number' && (allowsMembershipNumber(path,numericMode) ? validMembershipNumber(current) : Number.isSafeInteger(current) && !Object.is(current,-0))) byteLength += JSON.stringify(current).length;
    else if (current && typeof current === 'object' && !ancestors.has(current)) {
      ancestors.add(current);
      const array = Array.isArray(current), keys = Object.keys(current);
      if (array && (current.length > MAX_ARRAY || keys.length !== current.length)) fail(`${label}: invalid array`);
      if (!array && ![null, Object.prototype].includes(Object.getPrototypeOf(current))) fail(`${label}: plain JSON required`);
      byteLength += 2 + Math.max(0, keys.length - 1);
      for (const key of keys) {
        if (!array) { token(key); byteLength++; }
        visit(current[key], depth + 1, [...path, array ? Number(key) : key]);
      }
      ancestors.delete(current);
    } else fail(`${label}: plain bounded JSON required`);
    if (byteLength > maxBytes) fail(`${label}: exceeds ${maxBytes} encoded bytes`);
  }
  visit(value, 0);
  const encoded = Buffer.from(numericMode === 'strict' ? canonicalString(value) : membershipCanonicalString(value), 'utf8');
  if (encoded.length !== byteLength) fail(`${label}: encoded byte count mismatch`);
  return encoded;
}

/** mkdir is exclusive and nonrecursive. Keep partial new directories on any
 * write failure; ordinary exports write summary last. A starter caller may
 * publish its separate completion marker after every file here is closed. */
export async function writeNewDirectory(outputDirectory, artifacts) {
  await mkdir(outputDirectory);
  for (const [name, bytes] of artifacts) {
    if (!['request.json', 'ledger.json', 'atlas-cohort-review.json', 'individual-membership-review.json', 'summary.json',
      'species-composition-ledger.json', 'composition-source.json', 'annual-body.json', 'refinement.json',
      'species-composition-proposal.json', 'input-species-composition-ledger.json', 'species-bundle.json', 'atlas-envelope.json', 'starter-manifest.pending.json',
      'annual-settlement-species-review.json', 'annual-individual-membership-review.json'].includes(name)) fail('Unexpected output child name');
    const handle = await open(join(outputDirectory, name), 'wx');
    try { await handle.writeFile(bytes); await handle.sync(); }
    finally { await handle.close(); }
  }
}
