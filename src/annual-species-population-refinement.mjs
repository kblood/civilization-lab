/** Opt-in parsed-data refinement of supplied Civ totals. No IO or model edits. */
import {canonicalBytes, canonicalString, compare, freezeCanonical} from './canonical.mjs';
import {sha256Hex} from './digest.mjs';
import {adoptSpeciesComposition, reviewSpeciesCompositionAdoptionLedger, SPECIES_COMPOSITION_LEDGER_VERSION} from './species-composition-adoption.mjs';

export const ANNUAL_SPECIES_POPULATION_REFINEMENT_VERSION = 'civ-annual-species-population-refinement-1';
export const ANNUAL_SPECIES_POPULATION_POLICY = 'fixed-anchor-largest-remainder-contiguous-forward-1';
const YEAR_NS = 31557600000000000n;
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
const fail = message => { throw new TypeError(`Annual species population refinement: ${message}`); };
const hash = value => sha256Hex(canonicalBytes(value));
const same = (a, b) => canonicalString(a) === canonicalString(b);
function closed(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length ||
      keys.some(key => !Object.hasOwn(value, key))) fail(`missing/extra fields in ${label}`);
}
// Copy only bounded plain JSON data before reading caller fields. BigInt is
// internal arithmetic only; source counts remain canonical decimal strings.
function snapshot(value) {
  let nodes = 0, units = 0;
  const ancestors = new Set();
  function visit(current, depth) {
    if (++nodes > 1000000 || depth > 64) fail('JSON exceeds node/depth budget');
    if (typeof current === 'string') {
      units += current.length;
      if (!current.isWellFormed() || current.length > 65536 || units > 32 * 1024 * 1024) fail('invalid/oversized JSON text');
      return current;
    }
    if (current === null || typeof current === 'boolean') return current;
    if (typeof current === 'number' && Number.isSafeInteger(current) && !Object.is(current, -0)) return current;
    if (!current || typeof current !== 'object' || ancestors.has(current)) fail('plain acyclic JSON required');
    const array = Array.isArray(current), keys = Reflect.ownKeys(current);
    if (array ? Object.getPrototypeOf(current) !== Array.prototype || current.length > 50000 || keys.length !== current.length + 1
      : ![Object.prototype, null].includes(Object.getPrototypeOf(current))) fail('plain records/dense arrays required');
    const result = array ? [] : Object.create(null);
    ancestors.add(current);
    for (const key of keys) {
      if (array && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (typeof key !== 'string' || !key.isWellFormed() || !descriptor || !('value' in descriptor) || !descriptor.enumerable ||
          array && !/^(0|[1-9][0-9]*)(?![\s\S])/.test(key)) fail('own enumerable JSON data required');
      units += key.length;
      if (key.length > 65536 || units > 32 * 1024 * 1024) fail('oversized JSON keys');
      result[key] = visit(descriptor.value, depth + 1);
    }
    ancestors.delete(current);
    return result;
  }
  return visit(value, 0);
}
function sourcePin(value, max, label) {
  closed(value, ['sha256', 'byteLength'], label);
  if (typeof value.sha256 !== 'string' || !/^[a-f0-9]{64}(?![\s\S])/.test(value.sha256) ||
      !Number.isSafeInteger(value.byteLength) || value.byteLength < 1 || value.byteLength > max) fail(`invalid ${label}`);
}
function rebuild(parent, source, pin) {
  // Reuse the adoption API's complete annual source checks, with no durable
  // append. A replacement choice can be checked against a private initial
  // choice; the retained original decision/digest never changes.
  const proposal = {...parent.proposal, civilization: {...parent.proposal.civilization,
    observationsSha256: pin.sha256, sourceFormat: source.schemaVersion}};
  return adoptSpeciesComposition({proposal, civilization: source, proposalPin: parent.proposalPin,
    decision: {...parent.decision, choice: 'choose', replaces: null},
    ledger: {version: SPECIES_COMPOSITION_LEDGER_VERSION, records: []}}).record;
}
function apportion(total, weights, denominator) {
  const ranked = weights.map((weight, index) => {
    const product = total * weight.count;
    return {index, count: product / denominator, remainder: product % denominator, key: weight.key};
  });
  let remaining = total - ranked.reduce((sum, row) => sum + row.count, 0n);
  ranked.sort((a, b) => a.remainder === b.remainder ? compare(a.key, b.key) : a.remainder > b.remainder ? -1 : 1);
  for (const row of ranked) if (remaining > 0n) { row.count++; remaining--; }
  if (remaining !== 0n) fail('apportionment remainder is not conserved');
  ranked.sort((a, b) => a.index - b.index);
  return ranked.map(row => row.count.toString());
}
// Count the exact static JSON size without allocating a combined serialization.
// Input strings are already individually bounded by snapshot/adoption checks.
function encodedSize(value) {
  let bytes = 0;
  function add(amount) {
    bytes += amount;
    if (bytes > MAX_OUTPUT_BYTES) fail('conservative output preflight exceeds 32 MiB');
  }
  function visit(current) {
    if (current === null || typeof current !== 'object') {
      add(Buffer.byteLength(JSON.stringify(current), 'utf8'));
      return;
    }
    const array = Array.isArray(current), keys = Object.keys(current);
    add(2 + Math.max(0, keys.length - 1));
    for (const key of keys) {
      if (!array) add(Buffer.byteLength(JSON.stringify(key), 'utf8') + 1);
      visit(current[key]);
    }
  }
  visit(value);
  return bytes;
}
function planRows(supplied, parent, competingYears) {
  const plan = [], orderedCompetingYears = [...competingYears].sort(compare);
  let previousYear = parent.observation.sampleYear - 1, interrupted = false, nextCompeting = 0;
  for (const source of supplied) {
    const gap = source.year > previousYear + 1 ? {fromYear: previousYear + 1, untilYear: source.year - 1} : null;
    if (gap) interrupted = true;
    const arc = source.arcs.find(entry => entry.id === parent.observation.arc.id && entry.lineageId === parent.observation.arc.lineageId);
    let conflict = false;
    while (nextCompeting < orderedCompetingYears.length && orderedCompetingYears[nextCompeting] <= source.year) {
      if (orderedCompetingYears[nextCompeting] > previousYear) conflict = true;
      nextCompeting++;
    }
    const reason = interrupted ? 'anchor-segment-already-interrupted' : conflict ? 'another-active-composition-anchor' :
      source.status === 'not-inspected' ? 'source-row-not-inspected' : !arc ? 'exact-arc-not-supplied' : null;
    if (reason !== null) interrupted = true;
    plan.push({source, arc, reason, gap,
      effectiveNs: (BigInt(parent.proposal.atlas.binding.originNs) + BigInt(source.year) * YEAR_NS).toString()});
    previousYear = source.year;
  }
  return plan;
}
function preflightOutput(body, plan, weights) {
  // Every assigned/unassigned count is <= the row's actual total, so its
  // decimal digit length cannot exceed that total's digit length. Only actual
  // planned derived rows reserve category counts; unknown rows and actual gaps
  // have exact sizes. The same bounded plan drives final output construction.
  let upper = encodedSize({...body, refinementSha256: '0'.repeat(64)});
  const add = amount => {
    upper += amount;
    if (upper > MAX_OUTPUT_BYTES) fail('conservative output preflight exceeds 32 MiB');
  };
  const species = weights.slice(0, -1);
  const assignmentTemplates = species.reduce((total, weight) => total + encodedSize({species: weight.species, count: ''}), 0);
  add(Math.max(0, plan.length - 1)); // rows array commas
  let gapCount = 0;
  for (const entry of plan) {
    const {source: row, arc, reason, effectiveNs, gap} = entry;
    const common = {year: row.year, effectiveNs, sourceTick: row.sourceTick};
    if (reason !== null) add(encodedSize({...common, status: 'unknown', reason,
      observedArcPopulation: arc?.population ?? null, population: null}));
    else add(encodedSize({...common, status: 'derived', reason: null, observedArcPopulation: arc.population,
      population: {budget: arc.population, assignments: [], unassigned: arc.population}}) +
      assignmentTemplates + species.length * arc.population.length + Math.max(0, species.length - 1));
    if (gap) {
      add(encodedSize({...gap, status: 'unknown', reason: 'years-not-supplied'}));
      gapCount++;
    }
  }
  add(Math.max(0, gapCount - 1)); // gaps array commas
}

/** Original byte pins are declarations here. The separate export CLI computes
 * them from actual bounded files. No species definition/biology is loaded. */
export function refineAnnualSpeciesPopulation(value) {
  const input = snapshot(value);
  closed(input, ['speciesCompositionLedger', 'compositionRecordSha256', 'compositionSource', 'annualBody', 'sourcePins', 'policy'], 'input');
  if (input.policy !== ANNUAL_SPECIES_POPULATION_POLICY) fail('explicit supported policy required');
  closed(input.sourcePins, ['speciesCompositionLedger', 'compositionSource', 'annualBody'], 'source pins');
  for (const role of ['speciesCompositionLedger', 'compositionSource', 'annualBody'])
    sourcePin(input.sourcePins[role], (role === 'speciesCompositionLedger' ? 32 : 16) * 1024 * 1024, `${role} original pin`);
  const reviewed = reviewSpeciesCompositionAdoptionLedger(input.speciesCompositionLedger);
  const parent = reviewed.active.find(row => row.recordSha256 === input.compositionRecordSha256);
  if (!parent) fail('explicit composition record must be active in the complete supplied ledger');
  if (input.sourcePins.compositionSource.sha256 !== parent.proposal.civilization.observationsSha256) fail('original composition source pin disagrees with selected proposal');
  const restored = rebuild(parent, input.compositionSource, input.sourcePins.compositionSource);
  if (!same(restored.observation, parent.observation) || !same(restored.proposal, parent.proposal)) fail('composition source does not reconstruct the selected parent');
  const annualAnchor = rebuild(parent, input.annualBody, input.sourcePins.annualBody);
  if (!same(annualAnchor.observation.arc, parent.observation.arc) || !same(annualAnchor.observation.interval, parent.observation.interval)) fail('annual source anchor or interval differs from the adopted source');
  const denominator = BigInt(parent.proposal.population.budget);
  if (denominator === 0n) fail('fixed anchor weights require a positive anchor budget');
  const weights = parent.proposal.population.assignments.map(row => ({species: row.species, count: BigInt(row.count), key: `species:${canonicalString(row.species)}`}));
  weights.push({species: null, count: BigInt(parent.proposal.population.unassigned), key: 'unassigned'});
  const source = input.annualBody;
  const member = source.schemaVersion === 'civ-lab-annual-body-observation-bundle-1'
    ? source.bodyObservations.find(row => row.body === parent.observation.body) : source;
  const originalMember = input.compositionSource.schemaVersion === 'civ-lab-annual-body-observation-bundle-1'
    ? input.compositionSource.bodyObservations.find(row => row.body === parent.observation.body) : input.compositionSource;
  const originalRows = new Map(originalMember.observations.map(row => [row.year, row]));
  for (const row of member.observations) {
    const original = originalRows.get(row.year);
    if (original && original.status !== 'not-inspected' && row.status !== 'not-inspected' && !same(original, row))
      fail('overlapping known body observations contradict the original composition source');
  }
  const supplied = member.observations.filter(row => row.year >= parent.observation.sampleYear);
  const competingYears = new Set(reviewed.active.filter(row => row.recordSha256 !== parent.recordSha256 &&
    row.observation.body === parent.observation.body && row.observation.arc.id === parent.observation.arc.id &&
    same(row.observation.provenance, parent.observation.provenance) && same(row.proposal.atlas.binding, parent.proposal.atlas.binding) &&
    row.observation.sampleYear > parent.observation.sampleYear).map(row => row.observation.sampleYear));
  const plan = planRows(supplied, parent, competingYears);
  if (plan.filter(entry => entry.reason === null).length * weights.length > 100000) fail('derived partition exceeds 100000 sample/category entries');
  const rows = [], gaps = [];
  const body = {version: ANNUAL_SPECIES_POPULATION_REFINEMENT_VERSION, scope: 'authored-scenario-refinement',
    policy: {id: input.policy, weights: 'exact-adopted-anchor-counts-including-unassigned',
      tieBreak: 'ascending-canonical-species-identity-before-unassigned', temporal: 'contiguous-supplied-years-forward-from-anchor'},
    parents: {compositionRecordSha256: parent.recordSha256, compositionDecisionId: parent.decision.id, observationKey: parent.observationKey},
    originalSources: input.sourcePins,
    canonicalSources: Object.fromEntries(['speciesCompositionLedger', 'compositionSource', 'annualBody'].map(role => [role, {sha256: hash(input[role])}])),
    speciesSource: {bundleSha256: parent.proposal.speciesBundle.sha256, definitions: 'not-loaded', applicability: 'unknown'},
    target: {body: parent.observation.body, arcId: parent.observation.arc.id, lineageId: parent.observation.arc.lineageId,
      atlasBinding: parent.proposal.atlas.binding, provenance: parent.observation.provenance},
    anchor: {year: parent.observation.sampleYear, effectiveNs: parent.proposal.temporal.effectiveNs, population: parent.proposal.population},
    coverage: {fromYear: parent.observation.sampleYear, untilYear: supplied[supplied.length - 1].year,
      meaning: 'listed-samples-and-explicit-gaps-only', outside: 'unknown'}, rows, gaps,
    verification: {sourceBytesVerified: false, speciesDefinitionsVerified: false, speciesApplicabilityVerified: false,
      atlasBindingVerified: false, simulationReplayed: false, biologicalTruthVerified: false},
    effects: {simulationStateChanged: false, populationStateChanged: false, continuityEstablished: false, birthsDeathsMigrationInferred: false,
      inheritanceInferred: false, scientificCausationEstablished: false, settlementResidentsCreated: false}};
  preflightOutput(body, plan, weights);
  for (const entry of plan) {
    const {source: row, arc, reason, effectiveNs, gap} = entry;
    if (gap) gaps.push({...gap, status: 'unknown', reason: 'years-not-supplied'});
    if (reason !== null) rows.push({year: row.year, effectiveNs, sourceTick: row.sourceTick, status: 'unknown', reason,
      observedArcPopulation: arc?.population ?? null, population: null});
    else {
      const counts = apportion(BigInt(arc.population), weights, denominator);
      rows.push({year: row.year, effectiveNs, sourceTick: row.sourceTick, status: 'derived', reason: null,
        observedArcPopulation: arc.population, population: {
          budget: arc.population, assignments: weights.slice(0, -1).map((weight, index) => ({species: weight.species, count: counts[index]})),
          unassigned: counts[counts.length - 1]}});
    }
  }
  return freezeCanonical({...body, refinementSha256: hash(body)});
}
