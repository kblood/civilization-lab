import { canonicalBytes } from './canonical.mjs';
import { sha256Hex } from './digest.mjs';
export function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value).sort()) deepFreeze(value[key]);
    Object.freeze(value);
  }
  return value;
}
export const TOY_INPUT = deepFreeze({ arcId: 'arc:toy:lin:toy:0', regionId: 'region:r00',
  initialPop: 10000n, capacity: 100000n, g: 100000,
  hazards: [{ kind: 'boom', h_q32: 429496730n, minPermille: 20, spanPermille: 81 },
    { kind: 'plague', h_q32: 214748365n, minPermille: 100, spanPermille: 201 }] });
export function createManifest() {
  return deepFreeze({ manifestVersion: 'civ-manifest-1', modelVersion: 'civ-toy-1', rngVersion: 'civ-rng-1',
    samplerVersion: 'civ-samplers-1', arithmeticVersion: 'civ-fixed-1', catalogueVersion: 'civ-toy-catalogue-1',
    partitionVersion: 'civ-toy-region-1', tickYears: 10, chapterTicks: 640, envEpochYears: 1000,
    scenarioPriors: { horizonYears: 19200, ...TOY_INPUT }, inputBundleDigest: sha256Hex(canonicalBytes(TOY_INPUT)), atlasVersions: {} });
}
export const manifestDigest = manifest => sha256Hex(canonicalBytes(manifest));
