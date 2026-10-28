/** Civ-owned, parsed-data scenario decisions. This module does no IO, verifies
 * no original source bytes and never writes population or simulation state. */
import {canonicalBytes, canonicalString, compare, freezeCanonical} from './canonical.mjs';
import {sha256Hex} from './digest.mjs';

export const SPECIES_COMPOSITION_ADOPTION_VERSION = 'civ-species-composition-adoption-1';
export const SPECIES_COMPOSITION_LEDGER_VERSION = 'civ-species-composition-adoption-ledger-1';
const PROPOSAL_VERSION = 'species-civilization-composition-proposal-1';
const SINGLE = 'civ-lab-annual-body-observations-2';
const BUNDLE = 'civ-lab-annual-body-observation-bundle-1';
const YEAR_NS = 31557600000000000n;
const fail = message => { throw new TypeError(`Species composition adoption: ${message}`); };
const same = (a, b) => canonicalString(a) === canonicalString(b);
const hash = value => sha256Hex(canonicalBytes(value));
const pattern = (value, expression, label) => {
  if (typeof value !== 'string' || !expression.test(value)) fail(`invalid ${label}`);
  return value;
};
const digest = (value, label) => pattern(value, /^[a-f0-9]{64}(?![\s\S])/, label);
const id = (value, label) => pattern(value, /^[A-Za-z][A-Za-z0-9._:-]{0,255}(?![\s\S])/, label);
const labId = (value, label) => pattern(value, /^[A-Za-z0-9_./:-]{1,128}(?![\s\S])/, label);
const ns = (value, label) => pattern(value, /^(0|[1-9][0-9]{0,127})(?![\s\S])/, label);
const count = (value, label) => BigInt(pattern(value, /^(0|[1-9][0-9]{0,4095})(?![\s\S])/, label));
function text(value, label, max = 4096) {
  if (typeof value !== 'string' || !value.trim() || !value.isWellFormed() || value.length > max) fail(`invalid ${label}`);
  return value;
}
function integer(value, min, max, label) {
  if (!Number.isSafeInteger(value) || Object.is(value, -0) || value < min || value > max) fail(`invalid ${label}`);
  return value;
}
const year = (value, label) => integer(value, 0, 2000000, label);
function record(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail(`missing/extra fields in ${label}`);
  return value;
}
function list(value, max, label, min = 0) {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail(`invalid ${label} array`);
  return value;
}
// Validate and copy before accessing caller data. No getters, symbols, cycles,
// BigInt, sparse arrays, non-finite numbers or prototype-bearing instances.
function json(value) {
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
    if (!current || typeof current !== 'object' || ancestors.has(current)) fail('plain acyclic JSON data required');
    const array = Array.isArray(current), keys = Reflect.ownKeys(current);
    if (array ? Object.getPrototypeOf(current) !== Array.prototype || current.length > 50000 || keys.length !== current.length + 1
      : ![Object.prototype, null].includes(Object.getPrototypeOf(current))) fail('plain records and dense arrays required');
    const result = array ? [] : Object.create(null);
    ancestors.add(current);
    for (const key of keys) {
      if (array && key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (typeof key !== 'string' || !key.isWellFormed() || !descriptor || !('value' in descriptor) || !descriptor.enumerable ||
          array && !/^(0|[1-9][0-9]*)(?![\s\S])/.test(key)) fail('own enumerable JSON data required');
      result[key] = visit(descriptor.value, depth + 1);
    }
    ancestors.delete(current);
    return result;
  }
  return visit(value, 0);
}
function provenance(value) {
  record(value, ['domainId', 'seed', 'modelVersion', 'inputBundleDigest', 'manifestDigest', 'recipeDigest', 'resultDigest', 'eventsDigest', 'validation'], 'Civ provenance');
  labId(value.domainId, 'domain ID'); text(value.seed, 'scenario seed', 1024); text(value.modelVersion, 'model version', 256);
  for (const key of ['inputBundleDigest', 'manifestDigest', 'recipeDigest', 'resultDigest', 'eventsDigest']) digest(value[key], key);
  if (value.validation !== 'source-consistency-result-roots-and-event-digest; inspection-payloads-not-replayed') fail('unsupported Civ provenance validation declaration');
}
function binding(value) {
  record(value, ['universeSeed', 'bodyAddress', 'domainId', 'labBody', 'originNs', 'fromYear', 'untilYear', 'labSystem', 'sourceFixture', 'sourceBody'], 'declared Atlas binding');
  text(value.universeSeed, 'universe seed', 1024); text(value.bodyAddress, 'declared Atlas body address', 1024);
  for (const key of ['domainId', 'labBody', 'labSystem', 'sourceBody']) labId(value[key], key);
  ns(value.originNs, 'origin ns'); year(value.fromYear, 'binding start'); year(value.untilYear, 'binding end');
  if (value.fromYear >= value.untilYear || value.fromYear % 10 || value.untilYear % 10) fail('binding interval must be finite and decade aligned');
  pattern(value.sourceFixture, /^[A-Za-z0-9_-][A-Za-z0-9_./-]*\.json(?![\s\S])/, 'declared fixture path');
  if (value.sourceFixture.split('/').some(part => !part || part === '.' || part === '..')) fail('unsafe declared fixture path');
}
function policy(value) {
  record(value, ['id', 'version', 'rationale'], 'decision policy');
  id(value.id, 'decision policy ID'); text(value.version, 'decision policy version', 128); text(value.rationale, 'decision policy rationale');
}
function proposal(value) {
  record(value, ['version', 'id', 'revision', 'simulationAdmission', 'closure', 'speciesBundle', 'atlas', 'civilization', 'temporal', 'population', 'policy'], 'Species proposal');
  if (value.version !== PROPOSAL_VERSION || value.simulationAdmission !== 'not-integrated' || value.closure !== 'listed-json-documents-only') fail('unsupported Species composition version/admission/closure');
  id(value.id, 'proposal ID'); integer(value.revision, 1, Number.MAX_SAFE_INTEGER, 'proposal revision');
  record(value.speciesBundle, ['sha256'], 'Species bundle pin'); digest(value.speciesBundle.sha256, 'Species bundle digest');
  record(value.atlas, ['envelopeSha256', 'binding'], 'Atlas pin'); digest(value.atlas.envelopeSha256, 'Atlas envelope digest'); binding(value.atlas.binding);
  const civ = record(value.civilization, ['observationsSha256', 'sourceFormat', 'body', 'provenance', 'lineageId', 'arcId'], 'Civ proposal pin');
  digest(civ.observationsSha256, 'Civ source digest');
  if (![SINGLE, BUNDLE].includes(civ.sourceFormat)) fail('unsupported Civ document format');
  for (const key of ['body', 'lineageId', 'arcId']) labId(civ[key], key);
  provenance(civ.provenance);
  if (!civ.lineageId.startsWith('lin:') || civ.body !== value.atlas.binding.labBody || civ.provenance.domainId !== value.atlas.binding.domainId) fail('proposal body/lineage/domain declarations disagree');
  const instant = record(value.temporal, ['axis', 'effectiveNs', 'sampleYear', 'sourceTick', 'clockPolicy', 'coverage'], 'proposal instant');
  if (instant.axis !== 'big-bang-nanoseconds' || instant.clockPolicy !== 'civ-year-31557600000000000-ns-1' || instant.coverage !== 'single-supplied-observation') fail('only one exact supplied observation is supported');
  ns(instant.effectiveNs, 'effective ns'); year(instant.sampleYear, 'sample year');
  pattern(instant.sourceTick, /^(?:-1|0|[1-9][0-9]{0,5})(?![\s\S])/, 'source tick');
  if (BigInt(instant.sourceTick) > 200000n || instant.sampleYear < value.atlas.binding.fromYear || instant.sampleYear > value.atlas.binding.untilYear ||
      BigInt(instant.effectiveNs) !== BigInt(value.atlas.binding.originNs) + BigInt(instant.sampleYear) * YEAR_NS) fail('proposal instant disagrees with its declared clock/binding');
  const population = record(value.population, ['budget', 'budgetBasis', 'assignments', 'unassigned'], 'proposal partition');
  if (population.budgetBasis !== 'supplied-civilization-arc-total') fail('unsupported population budget basis');
  let total = count(population.unassigned, 'explicit residual'), previous = null;
  for (const assignment of list(population.assignments, 1024, 'assignments')) {
    record(assignment, ['species', 'count', 'rationale'], 'assignment'); record(assignment.species, ['id', 'revision'], 'exact species revision');
    id(assignment.species.id, 'species ID'); integer(assignment.species.revision, 1, Number.MAX_SAFE_INTEGER, 'species revision'); text(assignment.rationale, 'assignment rationale');
    if (previous !== null && previous >= assignment.species.id) fail('assignment species IDs must be unique and sorted'); previous = assignment.species.id;
    total += count(assignment.count, 'assignment count');
  }
  if (total !== count(population.budget, 'budget')) fail('assignments plus explicit residual must equal the exact budget');
  const authored = record(value.policy, ['id', 'version', 'rationale', 'assignmentBasis', 'revisionBehavior', 'continuity', 'individualCounts'], 'proposal policy');
  id(authored.id, 'proposal policy ID'); text(authored.version, 'proposal policy version', 128); text(authored.rationale, 'proposal policy rationale');
  if (authored.assignmentBasis !== 'authored' || authored.revisionBehavior !== 'exact-references-no-automatic-retargeting' || authored.continuity !== 'not-claimed' || authored.individualCounts !== 'not-used') fail('proposal must retain exact authored assignments and no continuity/individual-count inference');
  return value;
}
function sortedIds(value, label) {
  list(value, 20000, label);
  value.forEach((entry, index) => { text(entry, label, 1024); if (index && value[index - 1] >= entry) fail(`${label} must be unique and sorted`); });
}
function arc(value, body) {
  record(value, ['id', 'lineageId', 'population', 'era', 'eventIds'], 'observed arc');
  labId(value.id, 'observed arc ID'); labId(value.lineageId, 'observed lineage ID');
  if (!value.lineageId.startsWith('lin:')) fail('observed lineage must have lin: identity');
  labId(value.lineageId.slice(4), 'lineage origin body');
  const prefix = `arc:${body}:${value.lineageId}:`;
  if (!value.id.startsWith(prefix) || !/^(0|[1-9][0-9]*)(?![\s\S])/.test(value.id.slice(prefix.length))) fail('arc ID is not for the exact observed body/lineage');
  const population = count(value.population, 'observed arc population');
  if (value.era !== null) integer(value.era, 0, 7, 'arc era');
  if ((population === 0n) !== (value.era === null)) fail('observed arc population/era disagree');
  sortedIds(value.eventIds, 'arc event IDs');
  return population;
}
function interval(value) {
  record(value, ['fromYear', 'compiledUntilYear', 'configuredUntilYear'], 'Civ interval');
  for (const key of Object.keys(value)) { year(value[key], key); if (value[key] % 10) fail('Civ interval requires decade boundaries'); }
  if (value.fromYear > value.compiledUntilYear || value.compiledUntilYear > value.configuredUntilYear || value.fromYear >= value.configuredUntilYear) fail('invalid Civ interval');
}
function annualOutcome(value) {
  record(value, ['status', 'reason'], 'annual outcome');
  if (value.status !== 'not-modelled') fail('retain not-modelled annual outcome'); text(value.reason, 'annual outcome reason');
}
const SCOPES = {
  observationScope: 'stepped-civilisation-arcs-in-supplied-inspections',
  eventScope: 'domain-wide-compiled-events-through-last-requested-year',
  arcEventScope: 'compiled event IDs associated with each arc by supplied inspections in that observation source decade, filtered through the observation year',
  civilisationEventScope: 'compiled event IDs associated with observed civilisation arcs for this body in supplied inspections, filtered through the observation year; null when the source decade is not inspected'
};
// Structural/identity checks on supplied parsed data, not model replay or a
// proof of the source's inspection payloads, event semantics or history.
function observation(source, p) {
  const multi = source?.schemaVersion === BUNDLE;
  record(source, ['schemaVersion', 'scope', 'provenance', 'interval', ...Object.keys(SCOPES), 'events', ...(multi ? ['bodyObservations'] : ['body', 'observations'])], 'Civ source');
  if (source.schemaVersion !== p.civilization.sourceFormat || source.scope !== 'authored-scenario') fail('Civ source version/scope mismatch');
  provenance(source.provenance); interval(source.interval);
  if (!same(source.provenance, p.civilization.provenance) || source.interval.fromYear !== p.atlas.binding.fromYear || source.interval.configuredUntilYear !== p.atlas.binding.untilYear) fail('complete Civ provenance/configured interval mismatch');
  for (const [key, expected] of Object.entries(SCOPES)) if (source[key] !== expected) fail(`unsupported Civ ${key}`);
  const events = new Map(); let previousEventYear = -1;
  for (const event of list(source.events, 20000, 'events')) {
    if (!event || typeof event !== 'object' || Array.isArray(event)) fail('invalid event declaration');
    text(event.id, 'event ID', 1024); year(event.dateYear, 'event year');
    if (events.has(event.id) || event.dateYear < source.interval.fromYear || event.dateYear >= source.interval.compiledUntilYear || event.dateYear < previousEventYear || event.modelVersion !== source.provenance.modelVersion) fail('duplicate/out-of-interval/unordered event declaration');
    events.set(event.id, event); previousEventYear = event.dateYear;
  }
  const members = multi ? list(source.bodyObservations, 256, 'body members', 2) : [{body: source.body, observations: source.observations}];
  let previousBody = null, sharedYears = null, selected = null;
  for (const member of members) {
    record(member, ['body', 'observations'], 'body member'); labId(member.body, 'body member ID');
    if (previousBody !== null && previousBody >= member.body) fail('body members must be unique and sorted'); previousBody = member.body;
    let previousYear = -1, eventPrefix = 0;
    const tickStates = new Map();
    for (const row of list(member.observations, 10000, 'annual observations', 1)) {
      record(row, ['year', 'sourceTick', 'annualOutcome', 'civilisationEventIds', 'eventIds', 'status', 'population', 'era', 'arcs'], 'annual observation');
      year(row.year, 'observed year');
      if (row.year <= previousYear || row.year < source.interval.fromYear || row.year > source.interval.compiledUntilYear) fail('duplicate/unordered/out-of-interval annual observation'); previousYear = row.year;
      const tick = row.year === source.interval.compiledUntilYear ? BigInt(row.year) / 10n - 1n : BigInt(row.year) / 10n;
      if (row.sourceTick !== String(tick)) fail('observation source tick mismatch'); annualOutcome(row.annualOutcome);
      list(row.eventIds, 20000, 'row event IDs');
      while (eventPrefix < source.events.length && source.events[eventPrefix].dateYear <= row.year) eventPrefix++;
      if (row.eventIds.length !== eventPrefix || row.eventIds.some((entry, index) => entry !== source.events[index].id)) fail('row event prefix mismatch');
      let total = 0n, highest = null, previousArc = null; const arcEvents = new Set();
      for (const entry of list(row.arcs, 4096, 'observed arcs')) {
        total += arc(entry, member.body);
        if (previousArc !== null && previousArc >= entry.id) fail('duplicate/unordered observed arc'); previousArc = entry.id;
        if (entry.era !== null && (highest === null || entry.era > highest)) highest = entry.era;
        for (const eventId of entry.eventIds) {
          const event = events.get(eventId);
          if (!event || event.dateYear > row.year || String(BigInt(event.dateYear) / 10n) !== row.sourceTick) fail('arc event is outside source decade/year');
          arcEvents.add(eventId);
        }
      }
      if (row.status === 'not-inspected') {
        if (row.population !== null || row.era !== null || row.arcs.length || row.civilisationEventIds !== null) fail('not-inspected row must retain unknown totals and no arcs');
      } else {
        if (!['observed', 'no-active-arc-observed'].includes(row.status) || (row.status === 'observed') !== (row.arcs.length > 0) || count(row.population, 'body population') !== total || row.era !== highest ||
            !same(row.civilisationEventIds, [...arcEvents].sort(compare))) fail('row status/population/era/event declarations disagree');
      }
      const tickState = canonicalString([row.status, row.arcs.map(entry => entry.id)]);
      if (tickStates.has(row.sourceTick) && tickStates.get(row.sourceTick) !== tickState) fail('source-decade arc identities/status disagree'); tickStates.set(row.sourceTick, tickState);
      if (member.body === p.civilization.body && row.year === p.temporal.sampleYear) {
        if (row.status !== 'observed') fail('composition requires an exact observed row');
        const selectedArc = row.arcs.find(entry => entry.id === p.civilization.arcId && entry.lineageId === p.civilization.lineageId);
        if (!selectedArc || selectedArc.population !== p.population.budget || row.sourceTick !== p.temporal.sourceTick) fail('exact observed arc/budget/source tick mismatch');
        selected = {sourceFormat: source.schemaVersion, observationsSha256: p.civilization.observationsSha256, body: member.body,
          provenance: source.provenance, interval: source.interval, sampleYear: row.year, sourceTick: row.sourceTick,
          status: row.status, annualOutcome: row.annualOutcome, arc: selectedArc};
      }
    }
    const years = canonicalString(member.observations.map(row => row.year));
    if (sharedYears !== null && sharedYears !== years) fail('bundled bodies must share sample years'); sharedYears = years;
  }
  if (!selected) fail('exact selected observation/body/arc is absent');
  return selected;
}
function observationKey(value) {
  // File digest deliberately excluded: re-exporting the same scenario run's
  // observation into another JSON document cannot create a second choice.
  return hash({provenance: value.provenance, body: value.body, sampleYear: value.sampleYear,
    sourceTick: value.sourceTick, lineageId: value.arc.lineageId, arcId: value.arc.id});
}
const VERIFICATION = Object.freeze({sourceBytesVerified: false, speciesDefinitionsVerified: false,
  speciesApplicabilityVerified: false, atlasBindingVerified: false, simulationReplayed: false,
  eventSemanticsVerified: false, biologicalTruthVerified: false});
const EFFECTS = Object.freeze({simulationStateChanged: false, populationStateChanged: false,
  continuityEstablished: false, historicalMembershipEstablished: false});
const POPULATION_MEANING = Object.freeze({budget: 'supplied-arc-total',
  assignments: 'authored-scenario-partition', unassigned: 'not-attributed-by-this-proposal'});
function decision(value) {
  record(value, ['id', 'author', 'policy', 'rationale', 'choice', 'replaces'], 'human-authored decision');
  id(value.id, 'decision ID'); text(value.author, 'human author declaration', 256); policy(value.policy); text(value.rationale, 'decision rationale');
  if (!['choose', 'replace'].includes(value.choice)) fail('explicit choose/replace action required');
  if (value.choice === 'choose') { if (value.replaces !== null) fail('initial choice cannot replace another decision'); }
  else { record(value.replaces, ['id', 'recordSha256'], 'replacement target'); id(value.replaces.id, 'replaced decision ID'); digest(value.replaces.recordSha256, 'replaced record digest'); }
}
function pin(value) {
  record(value, ['sha256', 'byteLength'], 'original proposal byte pin declaration'); digest(value.sha256, 'original proposal digest');
  integer(value.byteLength, 1, 16 * 1024 * 1024, 'original proposal byte length');
}
function stored(value) {
  record(value, ['version', 'scope', 'admission', 'observationKey', 'proposalPin', 'proposal', 'observation', 'decision', 'populationMeaning', 'verification', 'effects', 'recordSha256'], 'adoption record');
  if (value.version !== SPECIES_COMPOSITION_ADOPTION_VERSION || value.scope !== 'authored-scenario' || value.admission !== 'accepted-scenario-annotation-only') fail('unsupported adoption record');
  pin(value.proposalPin); proposal(value.proposal); decision(value.decision);
  if (!same(value.verification, VERIFICATION) || !same(value.effects, EFFECTS) || !same(value.populationMeaning, POPULATION_MEANING)) fail('adoption must retain population meaning and cannot assert verification or simulation effects');
  const observed = record(value.observation, ['sourceFormat', 'observationsSha256', 'body', 'provenance', 'interval', 'sampleYear', 'sourceTick', 'status', 'annualOutcome', 'arc'], 'stored exact observation');
  provenance(observed.provenance); interval(observed.interval); annualOutcome(observed.annualOutcome); arc(observed.arc, observed.body);
  const p = value.proposal, civ = p.civilization;
  if (observed.sourceFormat !== civ.sourceFormat || observed.observationsSha256 !== civ.observationsSha256 || observed.body !== civ.body || !same(observed.provenance, civ.provenance) ||
      observed.sampleYear !== p.temporal.sampleYear || observed.sourceTick !== p.temporal.sourceTick || observed.status !== 'observed' || observed.arc.id !== civ.arcId ||
      observed.arc.lineageId !== civ.lineageId || observed.arc.population !== p.population.budget || observed.interval.fromYear !== p.atlas.binding.fromYear || observed.interval.configuredUntilYear !== p.atlas.binding.untilYear ||
      observed.sampleYear > observed.interval.compiledUntilYear) fail('stored observation disagrees with exact proposal target');
  const tick = observed.sampleYear === observed.interval.compiledUntilYear ? BigInt(observed.sampleYear) / 10n - 1n : BigInt(observed.sampleYear) / 10n;
  if (observed.sourceTick !== String(tick)) fail('stored observation source tick mismatch');
  if (value.observationKey !== observationKey(observed)) fail('observation conflict key mismatch');
  digest(value.recordSha256, 'adoption record digest');
  const {recordSha256, ...body} = value;
  if (recordSha256 !== hash(body)) fail('adoption record parsed-data digest mismatch');
}
function replay(ledger) {
  record(ledger, ['version', 'records'], 'adoption ledger');
  if (ledger.version !== SPECIES_COMPOSITION_LEDGER_VERSION) fail('unsupported adoption ledger version');
  const active = new Map(), ids = new Set();
  for (const entry of list(ledger.records, 10000, 'adoption records')) {
    stored(entry);
    if (ids.has(entry.decision.id)) fail('decision ID already exists in supplied ledger'); ids.add(entry.decision.id);
    const current = active.get(entry.observationKey), choice = entry.decision;
    if (choice.choice === 'choose') { if (current) fail('observation already has a choice; explicit replacement is required'); }
    else if (!current || choice.replaces.id !== current.decision.id || choice.replaces.recordSha256 !== current.recordSha256) fail('replacement must pin the active decision for this exact observation');
    active.set(entry.observationKey, entry);
  }
  return [...active.values()].sort((a, b) => compare(a.observationKey, b.observationKey));
}
/** Review supplied ledger only. The caller owns durable storage and must supply
 * the complete ledger; this cannot discover decisions omitted by a caller. */
export function reviewSpeciesCompositionAdoptionLedger(value) {
  const ledger = json(value), active = replay(ledger);
  return freezeCanonical({status: 'parsed-scenario-decisions-valid', sourceBytesVerified: false,
    continuityEstablished: false, simulationStateChanged: false, ledger, active});
}
/** Inspect one exact proposal target/current conflict without manufacturing a
 * decision or appending a record. Original byte pins remain declarations here. */
export function inspectSpeciesCompositionAdoption(value) {
  const input = json(value);
  record(input, ['proposal', 'civilization', 'proposalPin', 'ledger'], 'composition inspection input');
  const active = replay(input.ledger);
  proposal(input.proposal); pin(input.proposalPin);
  const observed = observation(input.civilization, input.proposal), key = observationKey(observed);
  return freezeCanonical({status: 'parsed-composition-target-inspected', observationKey: key,
    proposalPin: input.proposalPin, proposal: input.proposal, observation: observed,
    currentChoice: active.find(entry => entry.observationKey === key) ?? null,
    populationMeaning: {...POPULATION_MEANING}, verification: {...VERIFICATION}, effects: {...EFFECTS},
    sourceBytesVerified: false, simulationStateChanged: false, continuityEstablished: false});
}
/** Explicit opt-in acceptance of one authored scenario annotation. Source hash
 * and byte length are declarations; only a separate original-byte hashing tool
 * can bind those declarations to actual files. No full source replay occurs. */
export function adoptSpeciesComposition(value) {
  const input = json(value);
  record(input, ['proposal', 'civilization', 'proposalPin', 'decision', 'ledger'], 'adoption input');
  replay(input.ledger); proposal(input.proposal); pin(input.proposalPin); decision(input.decision);
  const observed = observation(input.civilization, input.proposal);
  const body = {version: SPECIES_COMPOSITION_ADOPTION_VERSION, scope: 'authored-scenario', admission: 'accepted-scenario-annotation-only',
    observationKey: observationKey(observed), proposalPin: input.proposalPin, proposal: input.proposal,
    observation: observed, decision: input.decision, populationMeaning: {...POPULATION_MEANING},
    verification: {...VERIFICATION}, effects: {...EFFECTS}};
  const entry = {...body, recordSha256: hash(body)};
  const ledger = {version: SPECIES_COMPOSITION_LEDGER_VERSION, records: [...input.ledger.records, entry]};
  const active = replay(ledger);
  return freezeCanonical({status: 'accepted-scenario-annotation-only', record: entry, ledger, active,
    sourceBytesVerified: false, simulationStateChanged: false, continuityEstablished: false});
}
