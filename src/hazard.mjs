import { encodeFields, expQ32 } from './rng.mjs';
import { sha256Hex } from './digest.mjs';
import { ceilDiv } from './fixed.mjs';
const keys = new Map();
export function hazardKey(id) {
  if (!id || typeof id.ownerId !== 'string' || typeof id.kind !== 'string') throw new TypeError('Invalid hazard identity');
  // Presence bits distinguish an omitted component from an empty string or zero.
  const fields = [id.ownerId, id.kind];
  for (const name of ['domain', 'targetTier', 'edgeId']) {
    const present = id[name] !== undefined;
    fields.push(present ? 1 : 0);
    if (present) {
      if (name !== 'targetTier' && typeof id[name] !== 'string') throw new TypeError('String hazard component required');
      if (name === 'targetTier' && (!Number.isSafeInteger(id[name]) || id[name] < 0)) throw new TypeError('Invalid target tier');
      fields.push(id[name]);
    }
  }
  const cacheKey=JSON.stringify(fields);
  let key=keys.get(cacheKey);
  if(key===undefined){key=encodeFields(fields).toString('hex');if(keys.size<16384)keys.set(cacheKey,key);}
  return key;
}
const compactKeys=new Map();
export function compactHazardKey(id) {
  const raw=hazardKey(id);let key=compactKeys.get(raw);
  if(key===undefined){key=sha256Hex(raw);if(compactKeys.size<16384)compactKeys.set(raw,key);}
  return key;
}
export function threshold(def, hazardId, episode) {
  return expQ32({ worldSeed: def.seed, manifestDigest: def.manifestDigest, level: 'P',
    entityId: hazardKey(hazardId), purpose: `haz.${hazardId.kind}`,
    episodeOrBucket: episode, ordinal: 0 });
}
export function createHazard(def, hazardId) {
  return { hazardId: { ...hazardId }, key: def.compactHazards?compactHazardKey(hazardId):hazardKey(hazardId), episode: 0n, H_q32: 0n,
    E_q32: threshold(def, hazardId, 0n) };
}
export function advanceHazard(def, entry, h, eligible = true, thresholdFn = threshold) {
  if (typeof h !== 'bigint' || h < 0n || typeof entry.episode !== 'bigint' || entry.episode < 0n ||
      typeof entry.H_q32 !== 'bigint' || typeof entry.E_q32 !== 'bigint' ||
      entry.H_q32 < 0n || entry.H_q32 >= entry.E_q32 || entry.key !== (def.compactHazards?compactHazardKey(entry.hazardId):hazardKey(entry.hazardId))) throw new RangeError('Invalid hazard ledger');
  if (!eligible || h === 0n) return { entry: { ...entry }, firings: [] };
  const H_start = entry.H_q32;
  let episode = entry.episode, E_cur = entry.E_q32;
  let distance = E_cur - H_start;
  const firings = [];
  while (distance <= h && firings.length < 4) {
    const yearOffset = Number(ceilDiv(10n * distance, h) - 1n);
    firings.push({ yearOffset, evidence: { H_start, distance, h, episode } });
    episode++;
    E_cur = thresholdFn(def, entry.hazardId, episode);
    if (typeof E_cur !== 'bigint' || E_cur <= 0n) throw new RangeError('Positive threshold required');
    distance += E_cur;
  }
  let H_end;
  if (firings.length === 4 && distance <= h) {
    firings[3].saturated = true;
    H_end = 0n;
  } else H_end = E_cur - (distance - h);
  return { entry: { ...entry, episode, E_q32: E_cur, H_q32: H_end }, firings };
}
