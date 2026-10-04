import { isDeepStrictEqual } from 'node:util';
import { compare } from './canonical.mjs';
import { deepFreeze } from './manifest.mjs';
export const LEVELS = deepFreeze([
  { id: 'D', owns: ['arrivals', 'contact', 'cross-body messages', 'lineage outcomes', 'signals', 'voyages'], causal: true },
  { id: 'P', owns: ['body macro events', 'chains', 'culture', 'hazards', 'outbound departures', 'polities', 'region state'], causal: true },
  { id: 'C', owns: ['budget-neutral local annotations', 'event anchors', 'spatial allocations'], causal: false },
  { id: 'H', owns: ['event-owned persons', 'household detail'], causal: false, deferred: true },
  { id: 'N', owns: ['chronicles', 'names', 'prose motives'], causal: false, orthogonal: true },
].sort((a, b) => compare(a.id, b.id)));
const error = reason => ({ status: 'REFINEMENT_CONTRACT_ERROR', reason });
export function checkProjection(def, parentContract, address, refineFn, aggregateFn, fields = Object.keys(parentContract).sort()) {
  try {
    const parent = structuredClone(parentContract);
    const before = structuredClone(parent);
    const child = refineFn(deepFreeze(structuredClone(def)), parent, deepFreeze(structuredClone(address)));
    if (!isDeepStrictEqual(parent, before)) return error('parent-mutated');
    const projected = aggregateFn(child);
    for (const field of [...fields].sort()) {
      if (!Object.hasOwn(projected, field) || !Object.hasOwn(parentContract, field) ||
          !isDeepStrictEqual(projected[field], parentContract[field])) return error(`field:${field}`);
    }
    return { status: 'ok', value: child };
  } catch {
    return error('invalid-refinement');
  }
}
// A registered recipe supplies only pure functions and a static definition.
export function refine(def, parentContract, address) {
  return checkProjection(def.static ?? {}, parentContract, address, def.refine, def.aggregate, def.fields);
}
