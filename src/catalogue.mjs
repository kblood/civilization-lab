import rows from './catalogue-data.json' with { type: 'json' };
import { deepFreeze } from './manifest.mjs';
export const CATALOGUE = deepFreeze(rows);
export const IMPLEMENTED = Object.freeze(CATALOGUE.filter(k => k.milestone === 'M2a'));
export const kindOf = kind => CATALOGUE.find(k => k.kind === kind);
export function validateCatalogue(kinds, table) {
  const ranks = [];
  for (const k of kinds) {
    const row = table.kinds.find(r => r.kind === k.kind);
    if (!row || ranks.includes(k.kindRank) || k.kindRank !== row.kindRank) throw new TypeError('Invalid catalogue identity');
    ranks.push(k.kindRank);
    for (const mode of ['reads', 'writes']) for (const path of k[mode]) {
      const shared = table[mode === 'reads' ? 'frameworkReads' : 'frameworkWrites'];
      if (!table.fields.some(f => f.path === path) || ![...row[mode], ...shared].includes(path)) throw new TypeError(`Undeclared ${mode}: ${k.kind} ${path}`);
    }
  }
  return true;
}
