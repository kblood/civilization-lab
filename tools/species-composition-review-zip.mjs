/** Civ-owned reader for Species' exact five-entry composition review ZIP.
 * Receipt syntax is checked, but its claims never authorize adoption. */
import {TextDecoder} from 'node:util';
import {parseMembershipJson} from '../src/membership-json.mjs';

export const SPECIES_COMPOSITION_REVIEW_ZIP_LIMIT = 55 * 1024 * 1024;
export const SPECIES_COMPOSITION_REVIEW_PATHS = Object.freeze({
  proposal: 'composition-proposal.json',
  receipt: 'composition-review.json',
  atlasEnvelope: 'sources/atlas-envelope.json',
  compositionSource: 'sources/civilization-observations.json',
  speciesBundle: 'sources/species-bundle.json',
});
const LIMITS = Object.freeze({
  [SPECIES_COMPOSITION_REVIEW_PATHS.proposal]: 1024 * 1024,
  [SPECIES_COMPOSITION_REVIEW_PATHS.receipt]: 32 * 1024 * 1024,
  [SPECIES_COMPOSITION_REVIEW_PATHS.atlasEnvelope]: 1024 * 1024,
  [SPECIES_COMPOSITION_REVIEW_PATHS.compositionSource]: 16 * 1024 * 1024,
  [SPECIES_COMPOSITION_REVIEW_PATHS.speciesBundle]: 4 * 1024 * 1024,
});
const EXPECTED = Object.keys(LIMITS).sort();
// Preserve a leading UTF-8 BOM as U+FEFF so the strict JSON readers reject it
// exactly as they do for the same original bytes outside the ZIP packet.
const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
const fail = message => { throw new TypeError(`Species composition ZIP: ${message}`); };
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function bounds(offset, length, limit, label) {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > limit) {
    fail(`${label} extends beyond its ZIP section`);
  }
}
function validateUntrustedReceiptJson(source) {
  let at = 0, nodes = 0;
  const failJson = message => fail(`composition-review.json is invalid JSON at character ${at}: ${message}`);
  const skip = () => { while (at < source.length && /[ \t\r\n]/.test(source[at])) at++; };
  function string() {
    const start = at;
    if (source[at++] !== '"') failJson('expected string');
    while (at < source.length) {
      const code = source.charCodeAt(at++);
      if (code === 34) return JSON.parse(source.slice(start, at));
      if (code < 32) failJson('control character in string');
      if (code === 92) {
        if (at >= source.length) failJson('unfinished escape');
        const escaped = source[at++];
        if (escaped === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(source.slice(at, at + 4))) failJson('invalid Unicode escape');
          at += 4;
        } else if (!'"\\/bfnrt'.includes(escaped)) failJson('invalid escape');
      }
    }
    failJson('unfinished string');
  }
  function value(depth) {
    if (++nodes > 500_000 || depth > 64) failJson('node or depth limit exceeded');
    skip();
    const char = source[at];
    if (char === '"') return string();
    if (char === '{') {
      at++; skip(); const keys = new Set();
      if (source[at] === '}') { at++; return; }
      for (;;) {
        skip(); if (source[at] !== '"') failJson('object key must be a string');
        const key = string(); if (keys.has(key)) failJson(`duplicate object key ${JSON.stringify(key)}`); keys.add(key);
        skip(); if (source[at++] !== ':') failJson('expected colon');
        value(depth + 1); skip();
        const delimiter = source[at++]; if (delimiter === '}') return; if (delimiter !== ',') failJson('expected comma or closing brace');
      }
    }
    if (char === '[') {
      at++; skip();
      if (source[at] === ']') { at++; return; }
      for (;;) {
        value(depth + 1); skip();
        const delimiter = source[at++]; if (delimiter === ']') return; if (delimiter !== ',') failJson('expected comma or closing bracket');
      }
    }
    for (const word of ['true', 'false', 'null']) if (source.startsWith(word, at)) { at += word.length; return; }
    const number = source.slice(at).match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (number) { at += number[0].length; if (!Number.isFinite(Number(number[0]))) failJson('number is not finite'); return; }
    failJson('expected a JSON value');
  }
  if (!source.length || source.length > 32 * 1024 * 1024) failJson('empty or oversized receipt');
  value(0); skip(); if (at !== source.length) failJson('trailing content');
  try { return JSON.parse(source); } catch { failJson('JSON materialization failed'); }
}
function parseArchive(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 22 || bytes.length > SPECIES_COMPOSITION_REVIEW_ZIP_LIMIT) fail('archive is empty, oversized, or not bytes');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), u16 = at => view.getUint16(at, true), u32 = at => view.getUint32(at, true);
  const end = bytes.length - 22;
  if (u32(end) !== 0x06054b50 || u16(end + 4) !== 0 || u16(end + 6) !== 0 ||
      u16(end + 8) !== 5 || u16(end + 10) !== 5 || u16(end + 20) !== 0) fail('requires one five-entry, single-disk end record without a comment');
  const centralSize = u32(end + 12), centralAt = u32(end + 16);
  if (centralSize === 0xffffffff || centralAt === 0xffffffff || centralAt + centralSize !== end) fail('ZIP64 or trailing central-directory data is unsupported');
  bounds(centralAt, centralSize, end, 'central directory');
  let central = centralAt, local = 0;
  const entries = new Map();
  for (let index = 0; index < EXPECTED.length; index++) {
    bounds(central, 46, end, 'central header');
    if (u32(central) !== 0x02014b50) fail(`central header ${index + 1} has an invalid signature`);
    const madeBy = u16(central + 4), needed = u16(central + 6), flags = u16(central + 8), method = u16(central + 10);
    const checksum = u32(central + 16), compressed = u32(central + 20), uncompressed = u32(central + 24);
    const nameLength = u16(central + 28), extraLength = u16(central + 30), commentLength = u16(central + 32);
    const disk = u16(central + 34), internal = u16(central + 36), external = u32(central + 38), localAt = u32(central + 42);
    if (madeBy !== 20 || needed !== 20 || flags !== 0 || method !== 0 || u16(central + 12) !== 0 || u16(central + 14) !== 0 ||
        extraLength !== 0 || commentLength !== 0 || disk !== 0 || internal !== 0 || external !== 0) fail(`entry ${index + 1} uses unsupported ZIP metadata`);
    if (compressed === 0xffffffff || uncompressed === 0xffffffff || localAt === 0xffffffff || compressed !== uncompressed) fail('ZIP64 or non-stored entries are unsupported');
    bounds(central + 46, nameLength, end, 'central entry name');
    const nameBytes = bytes.subarray(central + 46, central + 46 + nameLength);
    if (nameBytes.some(byte => byte > 0x7f)) fail('entry names must be ASCII');
    const name = decoder.decode(nameBytes);
    if (name !== EXPECTED[index]) fail('entry names or lexical ordering differ from the five-entry Species composition format');
    if (uncompressed > LIMITS[name]) fail(`${name} exceeds its ${LIMITS[name]} byte bound`);
    if (localAt !== local) fail(`local entry ${name} is reordered, overlapping, or preceded by extra data`);
    bounds(local, 30, centralAt, 'local header');
    if (u32(local) !== 0x04034b50 || u16(local + 4) !== needed || u16(local + 6) !== flags || u16(local + 8) !== method ||
        u16(local + 10) !== 0 || u16(local + 12) !== 0 || u32(local + 14) !== checksum || u32(local + 18) !== compressed ||
        u32(local + 22) !== uncompressed || u16(local + 26) !== nameLength || u16(local + 28) !== 0) fail(`local and central headers disagree for ${name}`);
    bounds(local + 30, nameLength + compressed, centralAt, `entry ${name}`);
    for (let offset = 0; offset < nameLength; offset++) if (bytes[local + 30 + offset] !== nameBytes[offset]) fail(`local path differs for ${name}`);
    const contents = bytes.slice(local + 30 + nameLength, local + 30 + nameLength + compressed);
    if (crc32(contents) !== checksum) fail(`CRC32 mismatch for ${name}`);
    entries.set(name, contents);
    local += 30 + nameLength + compressed;
    central += 46 + nameLength;
  }
  if (central !== end || local !== centralAt) fail('central directory and local data span are inconsistent');
  return entries;
}

/** Parse the fixed Species format without extracting files or trusting its receipt. */
export function readSpeciesCompositionReviewZip(bytes) {
  const entries = parseArchive(bytes), members = Object.create(null);
  for (const [role, path] of Object.entries(SPECIES_COMPOSITION_REVIEW_PATHS)) {
    const memberBytes = entries.get(path);
    if (!memberBytes || memberBytes.length === 0) fail(`${path} is empty or missing`);
    if (role === 'receipt') {
      // Match Species' bounded unique-key JSON syntax, but do not use the
      // owner-specific review claims as an adoption or admission signal.
      let receiptText;
      try { receiptText = decoder.decode(memberBytes); } catch { fail(`${path} is not valid UTF-8`); }
      const receipt = validateUntrustedReceiptJson(receiptText);
      if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt) || receipt.version !== 'species-civilization-composition-packet-review-1') {
        fail(`${path} does not identify the documented Species receipt format`);
      }
      members[role] = {bytes: memberBytes};
      continue;
    }
    let text, parsed;
    try { text = decoder.decode(memberBytes); } catch { fail(`${path} is not valid UTF-8`); }
    try { parsed = parseMembershipJson(text, path, role === 'speciesBundle' ? 'species-bundle-source' : 'strict'); }
    catch (error) { fail(`${path} is not bounded unique-key JSON: ${error.message}`); }
    members[role] = {bytes: memberBytes, parsed};
  }
  return {members, entryCount: entries.size};
}
